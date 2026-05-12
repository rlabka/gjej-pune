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
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../config/prisma';

// ─── Config (read once at module load) ──────────────────────

const KEY_ID = process.env.APPLE_IAP_KEY_ID || '';
const ISSUER_ID = process.env.APPLE_IAP_ISSUER_ID || '';
const BUNDLE_ID = process.env.APPLE_IAP_BUNDLE_ID || 'com.gjp.app';
const ENV_NAME = (process.env.APPLE_IAP_ENVIRONMENT || 'PRODUCTION').toUpperCase();
const PRIVATE_KEY_RAW = process.env.APPLE_IAP_PRIVATE_KEY || '';
// Numeric App Store ID — visible in App Store Connect URL for the app
// (e.g. https://appstoreconnect.apple.com/apps/6765750376). Required by
// Apple's SignedDataVerifier when running against PRODUCTION.
const APP_APPLE_ID = parseInt(process.env.APPLE_IAP_APP_APPLE_ID || '0', 10);

// Apple's `signingKey` constructor parameter accepts the PEM-encoded private
// key as a string. The `.env.production` file stores newlines as literal \n
// because env files don't allow real newlines — normalise back here.
const SIGNING_KEY = PRIVATE_KEY_RAW.replace(/\\n/g, '\n');

const IAP_ENV: Environment =
  ENV_NAME === 'SANDBOX' ? Environment.SANDBOX : Environment.PRODUCTION;

// Apple Root CA certs bundled with the service. Required by the SDK to
// verify the JWS signature on transaction/notification payloads — without
// these, every verification call throws VerificationException.
const APPLE_ROOT_CERTS: Buffer[] = (() => {
  const dir = path.join(__dirname, 'apple-certs');
  const files = ['AppleRootCA-G3.cer', 'AppleRootCA-G2.cer'];
  return files
    .map((f) => path.join(dir, f))
    .filter((p) => fs.existsSync(p))
    .map((p) => fs.readFileSync(p));
})();

// ─── Product ID → plan duration mapping ─────────────────────

const PRODUCT_TO_MONTHS: Record<string, number> = {
  'com.gjp.app.premium.1month': 1,
  'com.gjp.app.premium.3months': 3,
  'com.gjp.app.premium.6months': 6,
};

// Cents pricing per IAP product (EUR), kept in sync with App Store Connect
// IAP setup. Used so the in-app "active subscription" view can show a
// price for iOS-IAP subs, since stripe.prices.retrieve won't know about
// Apple-side products. Values are the EUR tier prices we set in App
// Store Connect (Apple's fixed pricing tiers don't allow €120/€160
// exactly, so 3- and 6-month plans use the next-closest tier).
const PRODUCT_TO_PRICE_CENTS: Record<string, number> = {
  'com.gjp.app.premium.1month': 5900,    // €59.00
  'com.gjp.app.premium.3months': 11999,  // €119.99 (Apple tier; web Stripe = €120)
  'com.gjp.app.premium.6months': 15999,  // €159.99 (Apple tier; web Stripe = €160)
};

export function productIdToMonths(productId: string): number {
  const months = PRODUCT_TO_MONTHS[productId];
  if (!months) throw new Error(`unknown_product_id:${productId}`);
  return months;
}

export function productIdToPriceCents(productId: string): number {
  return PRODUCT_TO_PRICE_CENTS[productId] ?? 0;
}

export function isKnownProductId(productId: string): boolean {
  return productId in PRODUCT_TO_MONTHS;
}

// ─── Lazy-initialised clients (avoid creating on import in test env) ───
//
// We keep one client + one verifier per environment. TestFlight purchases
// are always Sandbox while live App Store purchases are Production, and a
// single backend has to handle both — so for verifyPurchase we try one
// env first and fall back to the other on 404/401. Webhooks tell us the
// environment in their payload, so they don't need the fallback dance.

const clients: Partial<Record<Environment, AppStoreServerAPIClient>> = {};
const verifiers: Partial<Record<Environment, SignedDataVerifier>> = {};

function getClient(env: Environment = IAP_ENV): AppStoreServerAPIClient {
  let c = clients[env];
  if (!c) {
    if (!SIGNING_KEY || !KEY_ID || !ISSUER_ID) {
      throw new Error('Apple IAP credentials missing in env');
    }
    c = new AppStoreServerAPIClient(SIGNING_KEY, KEY_ID, ISSUER_ID, BUNDLE_ID, env);
    clients[env] = c;
  }
  return c;
}

function getVerifier(env: Environment = IAP_ENV): SignedDataVerifier {
  let v = verifiers[env];
  if (!v) {
    if (APPLE_ROOT_CERTS.length === 0) {
      throw new Error('Apple root certificates not loaded — check src/services/apple-certs/');
    }
    v = new SignedDataVerifier(
      APPLE_ROOT_CERTS,
      true,
      env,
      BUNDLE_ID,
      APP_APPLE_ID || undefined
    );
    verifiers[env] = v;
  }
  return v;
}

/**
 * Calls getTransactionInfo against PRODUCTION first; if Apple says the
 * transaction is unknown / unauthorised there, retry against SANDBOX.
 * This is the pattern Apple recommends for apps that ship to both the
 * App Store (real money, production) and TestFlight (sandbox).
 */
async function getTransactionInfoBothEnvs(transactionId: string): Promise<{
  txInfo: unknown;
  env: Environment;
}> {
  const order: Environment[] =
    IAP_ENV === Environment.PRODUCTION
      ? [Environment.PRODUCTION, Environment.SANDBOX]
      : [Environment.SANDBOX, Environment.PRODUCTION];

  let lastError: unknown;
  for (const env of order) {
    try {
      const txInfo = await getClient(env).getTransactionInfo(transactionId);
      return { txInfo, env };
    } catch (err) {
      const status = (err as any)?.httpStatusCode;
      // 401 = wrong env for this transaction; 404 = transaction not found.
      // Anything else (5xx, network) — keep trying the other env, but
      // remember the error in case both fail.
      lastError = err;
      console.warn(`[IAP] getTransactionInfo ${env} → HTTP ${status}, falling back`);
      if (status !== 401 && status !== 404) {
        // Non-env errors are unlikely to succeed in the other env either,
        // but try once for resilience.
      }
    }
  }
  throw lastError;
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

  let txInfo: unknown;
  let env: Environment;
  try {
    const result = await getTransactionInfoBothEnvs(transactionId);
    txInfo = result.txInfo;
    env = result.env;
  } catch (err) {
    console.error('[IAP] getTransactionInfo failed in both envs:', err);
    return { ok: false, code: 'invalidTransaction' };
  }

  const signedTransaction = (txInfo as any).signedTransactionInfo as string | undefined;
  if (!signedTransaction) return { ok: false, code: 'noSignedTransaction' };

  let decoded: JWSTransactionDecodedPayload;
  try {
    decoded = await getVerifier(env).verifyAndDecodeTransaction(signedTransaction);
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

  // No hard limit on the number of transactions — Apple's StoreKit2 can
  // return many for users who renewed across years. Each lookup is one
  // HTTPS call to Apple, so process sequentially to stay polite.
  for (const txId of transactionIds) {
    try {
      const { txInfo, env } = await getTransactionInfoBothEnvs(txId);
      const signed = (txInfo as any).signedTransactionInfo as string | undefined;
      if (!signed) continue;
      const decoded = await getVerifier(env).verifyAndDecodeTransaction(signed);
      const productId = safeProductId(decoded);
      if (!isKnownProductId(productId)) {
        console.warn('[IAP] restore: skipping unknown product', productId);
        continue;
      }
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

  // Apple sends notifications from both Sandbox and Production webhooks;
  // try Production first, fall back to Sandbox so a single endpoint can
  // serve both. We keep the env that worked and reuse it for the wrapped
  // transaction decode below.
  let decoded: ResponseBodyV2DecodedPayload;
  let notifEnv: Environment;
  try {
    decoded = await getVerifier(Environment.PRODUCTION).verifyAndDecodeNotification(signedPayload);
    notifEnv = Environment.PRODUCTION;
  } catch (errProd) {
    try {
      decoded = await getVerifier(Environment.SANDBOX).verifyAndDecodeNotification(signedPayload);
      notifEnv = Environment.SANDBOX;
    } catch (errSandbox) {
      console.error('[IAP] webhook verify failed in both envs:', { errProd, errSandbox });
      return { ok: false, code: 'verifyFailed' };
    }
  }

  const data = decoded.data;
  if (!data?.signedTransactionInfo) {
    // Some notification types carry no signedTransactionInfo (e.g. test pings).
    console.log('[IAP] webhook with no transaction info — type:', decoded.notificationType);
    return { ok: true };
  }

  let tx: JWSTransactionDecodedPayload;
  try {
    tx = await getVerifier(notifEnv).verifyAndDecodeTransaction(data.signedTransactionInfo);
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
