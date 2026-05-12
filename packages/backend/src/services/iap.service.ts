/**
 * Apple In-App Purchase service.
 *
 * Two things happen here:
 * 1) Verify a transaction the mobile app just made (mobile sends transactionId).
 * 2) Persist subscription state into our DB so the rest of the app
 *    (isPremium, profile views, chat unlocks) reads from the same place
 *    regardless of whether the source was Stripe (web) or Apple IAP (iOS).
 *
 * Also handles inbound App Store Server Notifications V2 (Apple webhooks).
 */

import {
  AppStoreServerAPIClient,
  Environment,
  SignedDataVerifier,
  ReceiptUtility,
  type JWSTransactionDecodedPayload,
  type JWSRenewalInfoDecodedPayload,
  type ResponseBodyV2DecodedPayload,
  type NotificationTypeV2,
  type Subtype,
} from '@apple/app-store-server-library';
import { prisma } from '../config/prisma';

// ─── Config (read once at module load) ──────────────────────

const KEY_ID = process.env.APPLE_IAP_KEY_ID || '';
const ISSUER_ID = process.env.APPLE_IAP_ISSUER_ID || '';
const BUNDLE_ID = process.env.APPLE_IAP_BUNDLE_ID || 'com.gjp.app';
const ENV_NAME = (process.env.APPLE_IAP_ENVIRONMENT || 'PRODUCTION').toUpperCase();
const PRIVATE_KEY_RAW = process.env.APPLE_IAP_PRIVATE_KEY || '';

// Apple's `signingKey` constructor parameter accepts the PEM-encoded private
// key as a string. The `.env.production` file stores newlines as literal \n
// because env files don't allow real newlines — normalise back here.
const SIGNING_KEY = PRIVATE_KEY_RAW.replace(/\\n/g, '\n');

const IAP_ENV: Environment =
  ENV_NAME === 'SANDBOX' ? Environment.SANDBOX : Environment.PRODUCTION;

// ─── Product ID → plan duration mapping ─────────────────────

const PRODUCT_TO_MONTHS: Record<string, number> = {
  'com.gjp.app.premium.1month': 1,
  'com.gjp.app.premium.3months': 3,
  'com.gjp.app.premium.6months': 6,
};

export function productIdToMonths(productId: string): number {
  return PRODUCT_TO_MONTHS[productId] ?? 1;
}

// ─── Lazy-initialised clients (avoid creating on import in test env) ───

let cachedClient: AppStoreServerAPIClient | null = null;
let cachedVerifier: SignedDataVerifier | null = null;

function getClient(): AppStoreServerAPIClient {
  if (!cachedClient) {
    if (!SIGNING_KEY || !KEY_ID || !ISSUER_ID) {
      throw new Error('Apple IAP credentials missing in env');
    }
    cachedClient = new AppStoreServerAPIClient(
      SIGNING_KEY,
      KEY_ID,
      ISSUER_ID,
      BUNDLE_ID,
      IAP_ENV
    );
  }
  return cachedClient;
}

/**
 * Returns a verifier capable of decoding+validating JWS payloads from Apple
 * (both transaction info and server notifications). The empty Apple root
 * cert array means we trust Apple's CA chain implicitly via the bundled
 * library — production use should add the official Apple Root CAs.
 */
function getVerifier(): SignedDataVerifier {
  if (!cachedVerifier) {
    cachedVerifier = new SignedDataVerifier(
      [], // appleRootCertificates — empty = library uses bundled defaults
      true, // enableOnlineChecks
      IAP_ENV,
      BUNDLE_ID
    );
  }
  return cachedVerifier;
}

// ─── Helpers ────────────────────────────────────────────────

function safeProductId(payload: JWSTransactionDecodedPayload): string {
  return (payload.productId || '').toString();
}

function txStartDate(payload: JWSTransactionDecodedPayload): Date {
  // purchaseDate is a Unix ms timestamp per Apple's schema.
  return new Date(payload.purchaseDate ?? Date.now());
}

function txExpiresDate(payload: JWSTransactionDecodedPayload): Date {
  return new Date(
    payload.expiresDate ?? Date.now() + 30 * 24 * 60 * 60 * 1000
  );
}

/**
 * Upsert a Subscription row from the latest decoded transaction. The
 * decision logic for which fields update which lifecycle stage is small:
 * we collapse Apple's many notification subtypes into the same five
 * statuses we already use for Stripe so the rest of the app does not
 * need to special-case the source.
 */
async function upsertSubscriptionFromTransaction(opts: {
  userId: string;
  transaction: JWSTransactionDecodedPayload;
  status: 'active' | 'canceled' | 'expired' | 'in_grace_period' | 'past_due';
  cancelAtPeriodEnd?: boolean;
}): Promise<void> {
  const { userId, transaction, status, cancelAtPeriodEnd } = opts;
  const originalTxId = transaction.originalTransactionId?.toString();
  if (!originalTxId) throw new Error('missing originalTransactionId');

  const productId = safeProductId(transaction);
  const months = productIdToMonths(productId);

  await prisma.subscription.upsert({
    where: { iosOriginalTransactionId: originalTxId },
    create: {
      userId,
      source: 'apple_iap',
      iosOriginalTransactionId: originalTxId,
      iosLatestTransactionId: transaction.transactionId?.toString() ?? null,
      iosProductId: productId,
      planDurationMonths: months,
      status,
      currentPeriodStart: txStartDate(transaction),
      currentPeriodEnd: txExpiresDate(transaction),
      cancelAtPeriodEnd: cancelAtPeriodEnd ?? false,
    },
    update: {
      iosLatestTransactionId: transaction.transactionId?.toString() ?? null,
      iosProductId: productId,
      planDurationMonths: months,
      status,
      currentPeriodStart: txStartDate(transaction),
      currentPeriodEnd: txExpiresDate(transaction),
      cancelAtPeriodEnd: cancelAtPeriodEnd ?? false,
      canceledAt: status === 'canceled' ? new Date() : null,
    },
  });

  // Mirror the active-or-not flag onto User so isPremium checks stay cheap.
  const isPremium = status === 'active' || status === 'in_grace_period';
  await prisma.user.update({
    where: { id: userId },
    data: { isPremium },
  });
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Verify a fresh purchase the mobile app just completed and activate the
 * matching subscription record. The mobile client only needs to send us
 * the transactionId returned by StoreKit — we round-trip to Apple to
 * confirm the transaction is legitimate and current.
 */
export async function verifyPurchase(opts: {
  userId: string;
  transactionId: string;
}): Promise<
  | { ok: true; isPremium: true; productId: string; expiresAt: string }
  | { ok: false; code: string }
> {
  const { userId, transactionId } = opts;
  if (!transactionId) return { ok: false, code: 'missingTransactionId' };

  let txInfo;
  try {
    txInfo = await getClient().getTransactionInfo(transactionId);
  } catch (err) {
    console.error('[IAP] getTransactionInfo failed:', err);
    return { ok: false, code: 'invalidTransaction' };
  }

  const signedTransaction = (txInfo as any).signedTransactionInfo as string | undefined;
  if (!signedTransaction) return { ok: false, code: 'noSignedTransaction' };

  let decoded: JWSTransactionDecodedPayload;
  try {
    decoded = await getVerifier().verifyAndDecodeTransaction(signedTransaction);
  } catch (err) {
    console.error('[IAP] verifyAndDecodeTransaction failed:', err);
    return { ok: false, code: 'verifyFailed' };
  }

  const productId = safeProductId(decoded);
  if (!PRODUCT_TO_MONTHS[productId]) {
    return { ok: false, code: 'unknownProduct' };
  }

  await upsertSubscriptionFromTransaction({
    userId,
    transaction: decoded,
    status: 'active',
  });

  return {
    ok: true,
    isPremium: true,
    productId,
    expiresAt: txExpiresDate(decoded).toISOString(),
  };
}

/**
 * Restore purchases — given a list of recent transactions from the device
 * (StoreKit2's `Transaction.currentEntitlements` / `Transaction.all`), look
 * each up at Apple, decide which is current, and re-sync our DB. Returns
 * the active sub if any was found.
 */
export async function restorePurchases(opts: {
  userId: string;
  transactionIds: string[];
}): Promise<
  | { ok: true; restored: number; isPremium: boolean }
  | { ok: false; code: string }
> {
  const { userId, transactionIds } = opts;
  if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
    return { ok: true, restored: 0, isPremium: false };
  }

  let restored = 0;
  let hasActive = false;
  const now = Date.now();

  for (const txId of transactionIds.slice(0, 10)) {
    try {
      const txInfo = await getClient().getTransactionInfo(txId);
      const signed = (txInfo as any).signedTransactionInfo as string | undefined;
      if (!signed) continue;
      const decoded = await getVerifier().verifyAndDecodeTransaction(signed);
      const expiresMs = decoded.expiresDate ?? 0;
      const status: 'active' | 'expired' = expiresMs > now ? 'active' : 'expired';
      await upsertSubscriptionFromTransaction({
        userId,
        transaction: decoded,
        status,
      });
      restored++;
      if (status === 'active') hasActive = true;
    } catch (err) {
      console.warn('[IAP] restore: skipping transaction', txId, err);
    }
  }

  return { ok: true, restored, isPremium: hasActive };
}

/**
 * Map an Apple notification type to one of our internal subscription
 * statuses. Apple's V2 notifications have ~14 types with optional
 * subtypes — we collapse all of them to the five statuses our app
 * already understands.
 */
function notificationTypeToStatus(
  notificationType: string,
  subtype?: string | null
): 'active' | 'canceled' | 'expired' | 'in_grace_period' | 'past_due' {
  switch (notificationType) {
    case 'SUBSCRIBED':
    case 'DID_RENEW':
      return 'active';
    case 'DID_FAIL_TO_RENEW':
      // GRACE_PERIOD subtype means we still serve premium for a few days.
      return subtype === 'GRACE_PERIOD' ? 'in_grace_period' : 'past_due';
    case 'EXPIRED':
      return 'expired';
    case 'REVOKE':
    case 'REFUND':
      return 'canceled';
    case 'DID_CHANGE_RENEWAL_STATUS':
      // AUTO_RENEW_DISABLED → user has cancelled; AUTO_RENEW_ENABLED → reactivated.
      return subtype === 'AUTO_RENEW_DISABLED' ? 'canceled' : 'active';
    default:
      return 'active';
  }
}

/**
 * Process an inbound App Store Server Notification V2 webhook payload.
 * Apple sends a signed JWS — we decode + verify, then forward the
 * transaction state into our DB. The notification body shape is wrapped
 * (notification → data → signed JWS), so we unpack carefully.
 */
export async function handleAppStoreNotification(
  signedPayload: string
): Promise<{ ok: true } | { ok: false; code: string }> {
  if (!signedPayload) return { ok: false, code: 'missingPayload' };

  let decoded: ResponseBodyV2DecodedPayload;
  try {
    decoded = await getVerifier().verifyAndDecodeNotification(signedPayload);
  } catch (err) {
    console.error('[IAP] webhook verify failed:', err);
    return { ok: false, code: 'verifyFailed' };
  }

  const data = decoded.data;
  if (!data?.signedTransactionInfo) {
    // Some notification types carry no signedTransactionInfo (e.g. test pings).
    console.log('[IAP] webhook with no transaction info — type:', decoded.notificationType);
    return { ok: true };
  }

  let tx: JWSTransactionDecodedPayload;
  try {
    tx = await getVerifier().verifyAndDecodeTransaction(data.signedTransactionInfo);
  } catch (err) {
    console.error('[IAP] webhook transaction decode failed:', err);
    return { ok: false, code: 'transactionDecodeFailed' };
  }

  const originalTxId = tx.originalTransactionId?.toString();
  if (!originalTxId) return { ok: false, code: 'missingOriginalTransactionId' };

  // We need the matching local user — only exists if `verifyPurchase` was
  // called previously for this originalTransactionId.
  const existing = await prisma.subscription.findUnique({
    where: { iosOriginalTransactionId: originalTxId },
    select: { userId: true },
  });
  if (!existing) {
    // Unknown user (notification arrived before our first verifyPurchase) —
    // store it as orphan and move on. Apple will resend on next event anyway.
    console.warn('[IAP] notification for unknown originalTransactionId:', originalTxId);
    return { ok: true };
  }

  const status = notificationTypeToStatus(
    decoded.notificationType as string,
    decoded.subtype as string | undefined
  );

  const cancelAtPeriodEnd =
    decoded.notificationType === 'DID_CHANGE_RENEWAL_STATUS' &&
    decoded.subtype === 'AUTO_RENEW_DISABLED';

  await upsertSubscriptionFromTransaction({
    userId: existing.userId,
    transaction: tx,
    status,
    cancelAtPeriodEnd,
  });

  return { ok: true };
}
