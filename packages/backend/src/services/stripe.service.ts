import Stripe from 'stripe';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { generateToken } from './auth.service';
import type { AuthRole } from '@jmp/shared';

// ─── Stripe Client (lazy – server starts even without keys) ──

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia' as any,
    });
  }
  return _stripe;
}

/** @internal For unit tests only — inject a stub Stripe client */
export function __setStripeClientForTest(stub: any) {
  _stripe = stub;
}

// ─── DB-driven Plan helpers ─────────────────────────────

/** Get or create a Stripe product for a given role */
async function getOrCreateStripeProduct(role: string): Promise<Stripe.Product> {
  const productName = `gjej-pune Premium (${role === 'employer' ? 'Employer' : 'Job Seeker'})`;
  const products = await getStripe().products.list({ limit: 100 });
  let product = products.data.find(p => p.name === productName && p.active);

  if (!product) {
    product = await getStripe().products.create({
      name: productName,
      description: `Premium subscription for ${role === 'employer' ? 'employers' : 'job seekers'} on gjej-pune.com`,
    });
  }
  return product;
}

/** Create a Stripe Price for a plan and save the ID back to the DB */
export async function createStripePriceForPlan(planId: string): Promise<string> {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error('Plan not found');

  const product = await getOrCreateStripeProduct(plan.role);

  const price = await getStripe().prices.create({
    product: product.id,
    unit_amount: plan.amountCents,
    currency: plan.currency,
    recurring: {
      interval: plan.intervalType as Stripe.Price.Recurring.Interval,
      interval_count: plan.intervalCount,
    },
    metadata: { role: plan.role, planId: plan.id },
  });

  await prisma.plan.update({
    where: { id: planId },
    data: { stripePriceId: price.id, stripeProductId: product.id },
  });

  return price.id;
}

/** Archive a Stripe Price (prices can't be deleted, only deactivated) */
export async function archiveStripePrice(priceId: string): Promise<void> {
  try {
    await getStripe().prices.update(priceId, { active: false });
  } catch (err: any) {
    console.error('[Stripe] Failed to archive price:', err.message);
  }
}

/** Ensure a plan has a valid Stripe Price – create one if missing */
async function ensureStripePriceForPlan(plan: { id: string; stripePriceId: string | null }): Promise<string> {
  if (plan.stripePriceId) return plan.stripePriceId;
  return createStripePriceForPlan(plan.id);
}

// ─── Get or Create Stripe Customer ──────────────────────

export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await getStripe().customers.create({
    email: user.email,
    name: user.displayName || undefined,
    metadata: { userId: user.id, role: user.role },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ─── Create Checkout Session ────────────────────────────

export async function createCheckoutSession(
  userId: string,
  planId: string,
  locale: string
): Promise<{ url: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) throw new Error('Plan not found or inactive');
  if (plan.role !== (user.role === 'employer' ? 'employer' : 'job_seeker')) {
    throw new Error('Plan does not match user role');
  }

  const customerId = await getOrCreateStripeCustomer(userId);
  const priceId = await ensureStripePriceForPlan(plan);

  const dashboardPath = user.role === 'employer' ? 'employer' : 'job-seeker';
  const successUrl = `${env.FRONTEND_URL}/${locale}/dashboard/${dashboardPath}/premium?success=true&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${env.FRONTEND_URL}/${locale}/dashboard/${dashboardPath}/premium?canceled=true`;

  // Map app locale to Stripe-supported locale (sq not supported, use auto)
  const stripeLocaleMap: Record<string, string> = { de: 'de', en: 'en', fr: 'fr', it: 'it' };
  const stripeLocale = stripeLocaleMap[locale] || 'auto';

  const planMonths = plan.intervalType === 'month' ? plan.intervalCount
    : plan.intervalType === 'week' ? Math.ceil(plan.intervalCount / 4)
    : 1;

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    locale: stripeLocale as any,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      planMonths: String(planMonths),
      planId: plan.id,
      role: user.role,
    },
    subscription_data: {
      metadata: {
        userId,
        planMonths: String(planMonths),
        planId: plan.id,
        role: user.role,
      },
    },
  });

  if (!session.url) throw new Error('Failed to create checkout session');
  return { url: session.url };
}

// ─── Get Subscription Details ───────────────────────────

export interface SubscriptionDetails {
  active: boolean;
  status: string;
  planMonths: number;
  amountCents: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  paymentMethod: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  } | null;
}

export async function getSubscriptionDetails(userId: string): Promise<SubscriptionDetails | null> {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: { in: ['active', 'past_due', 'trialing'] } },
    orderBy: { createdAt: 'desc' },
  });

  if (!sub) return null;

  // Get payment method from Stripe — only for stripe-sourced subs.
  let paymentMethod: SubscriptionDetails['paymentMethod'] = null;
  if (sub.stripeSubscriptionId) {
    try {
      const stripeSub = await getStripe().subscriptions.retrieve(sub.stripeSubscriptionId, {
        expand: ['default_payment_method'],
      });
      const pm = stripeSub.default_payment_method;
      if (pm && typeof pm !== 'string' && pm.card) {
        paymentMethod = {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        };
      }
    } catch (err) {
      console.error('[Stripe] Error fetching payment method:', err);
    }
  }

  // Get the price amount. For Stripe-sourced subs we go to Stripe; for
  // iOS IAP subs we look up the price in our local product → price map
  // (Apple manages prices in App Store Connect; we mirror them here so
  // the active-subscription view shows the right amount).
  let amountCents = 0;
  let currency = 'eur';
  if (sub.stripePriceId) {
    try {
      const price = await getStripe().prices.retrieve(sub.stripePriceId);
      amountCents = price.unit_amount || 0;
      currency = price.currency;
    } catch {}
  } else if (sub.source === 'apple_iap' && sub.iosProductId) {
    const { productIdToPriceCents } = await import('./iap.service');
    amountCents = productIdToPriceCents(sub.iosProductId);
    currency = 'eur';
  }

  return {
    active: sub.status === 'active' || sub.status === 'trialing',
    status: sub.status,
    planMonths: sub.planDurationMonths,
    amountCents,
    currency,
    currentPeriodStart: sub.currentPeriodStart.toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    canceledAt: sub.canceledAt?.toISOString() || null,
    paymentMethod,
  };
}

// ─── Get Invoices ───────────────────────────────────────

export interface InvoiceItem {
  id: string;
  date: string;
  amountCents: number;
  currency: string;
  status: string;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

export async function getInvoices(userId: string): Promise<InvoiceItem[]> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) return [];

  const invoices = await getStripe().invoices.list({
    customer: user.stripeCustomerId,
    limit: 24,
  });

  return invoices.data.map(inv => ({
    id: inv.id,
    date: new Date((inv.created || 0) * 1000).toISOString(),
    amountCents: inv.amount_paid || 0,
    currency: inv.currency || 'eur',
    status: inv.status || 'unknown',
    pdfUrl: inv.invoice_pdf || null,
    hostedUrl: inv.hosted_invoice_url || null,
  }));
}

// ─── Cancel Subscription ────────────────────────────────

export async function cancelSubscription(userId: string): Promise<{ success: boolean; endDate: string }> {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: { in: ['active', 'trialing'] } },
    orderBy: { createdAt: 'desc' },
  });

  if (!sub) throw new Error('No active subscription found');
  if (!sub.stripeSubscriptionId) {
    throw new Error('iOS IAP subscription — manage in iPhone Settings → Subscriptions');
  }

  await getStripe().subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true, canceledAt: new Date() },
  });

  return {
    success: true,
    endDate: sub.currentPeriodEnd.toISOString(),
  };
}

// ─── Reactivate Subscription ────────────────────────────

export async function reactivateSubscription(userId: string): Promise<{ success: boolean }> {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: { in: ['active', 'trialing'] }, cancelAtPeriodEnd: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!sub) throw new Error('No canceled subscription found');
  if (!sub.stripeSubscriptionId) {
    throw new Error('iOS IAP subscription — manage in iPhone Settings → Subscriptions');
  }

  await getStripe().subscriptions.update(sub.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: false, canceledAt: null },
  });

  return { success: true };
}

// ─── Create Billing Portal Session ──────────────────────

export async function createBillingPortalSession(userId: string, locale: string): Promise<{ url: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) throw new Error('No Stripe customer found');

  const dashboardPath = user.role === 'employer' ? 'employer' : 'job-seeker';
  const returnUrl = `${env.FRONTEND_URL}/${locale}/dashboard/${dashboardPath}/settings?tab=subscription`;

  const session = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}

// ─── Webhook Handler ────────────────────────────────────

export async function handleWebhookEvent(rawBody: Buffer, signature: string): Promise<void> {
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    throw new Error('Invalid signature');
  }

  console.log(`[Stripe Webhook] Received: ${event.type}`);

  // Wrap each handler in try-catch so individual failures don't break the whole webhook
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.type === 'ad_placement') {
          const { handleAdPaymentCompleted } = await import('./ad.service');
          await handleAdPaymentCompleted(session);
        } else {
          await handleCheckoutCompleted(session);
        }
        break;
      }
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }
  } catch (handlerErr: any) {
    console.error(`[Stripe Webhook] Handler error for ${event.type}:`, handlerErr?.message || handlerErr);
    // Don't re-throw – return 200 to Stripe so it doesn't keep retrying a broken handler
  }
}

// ─── Helper: extract subscription ID (handles both string and expanded object) ──

function extractSubscriptionId(sub: string | Stripe.Subscription | null | undefined): string | null {
  if (!sub) return null;
  if (typeof sub === 'string') return sub;
  if (typeof sub === 'object' && 'id' in sub) return sub.id;
  return null;
}

// ─── Helper: find userId from Stripe customer (fallback) ──

async function findUserIdFromCustomer(customerId: string | null | undefined): Promise<string | null> {
  if (!customerId) return null;
  const cid = typeof customerId === 'string' ? customerId : (customerId as any)?.id;
  if (!cid) return null;
  const user = await prisma.user.findFirst({ where: { stripeCustomerId: cid } });
  return user?.id || null;
}

// ─── Webhook: Checkout Completed ────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('[Stripe Webhook] handleCheckoutCompleted – metadata:', JSON.stringify(session.metadata));
  console.log('[Stripe Webhook] handleCheckoutCompleted – subscription raw type:', typeof session.subscription);
  console.log('[Stripe Webhook] handleCheckoutCompleted – subscription value:', JSON.stringify(session.subscription).substring(0, 200));
  console.log('[Stripe Webhook] handleCheckoutCompleted – customer:', session.customer);

  // 1. Get userId – from session metadata, or fallback to customer lookup
  let userId = session.metadata?.userId;
  if (!userId) {
    console.warn('[Stripe Webhook] No userId in session metadata, trying customer lookup...');
    const custId = typeof session.customer === 'string' ? session.customer : (session.customer as any)?.id;
    userId = await findUserIdFromCustomer(custId) || undefined;
  }
  if (!userId) {
    console.error('[Stripe Webhook] handleCheckoutCompleted – NO userId found (metadata + customer), aborting');
    return;
  }

  // 2. Get subscription ID – handle both string and expanded object
  const subscriptionId = extractSubscriptionId(session.subscription as any);
  if (!subscriptionId) {
    console.error('[Stripe Webhook] handleCheckoutCompleted – NO subscriptionId, aborting');
    return;
  }
  console.log(`[Stripe Webhook] handleCheckoutCompleted – userId=${userId}, subscriptionId=${subscriptionId}`);

  const stripeSub = await getStripe().subscriptions.retrieve(subscriptionId);
  const planMonths = parseInt(session.metadata?.planMonths || stripeSub.metadata?.planMonths || '1', 10);
  const firstItem = stripeSub.items.data[0];
  const priceId = firstItem?.price?.id || '';
  const periodStart = firstItem?.current_period_start || Math.floor(Date.now() / 1000);
  const periodEnd = firstItem?.current_period_end || Math.floor(Date.now() / 1000);

  // Upsert subscription in DB
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscriptionId },
    create: {
      userId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      status: stripeSub.status,
      planDurationMonths: planMonths,
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
    },
    update: {
      status: stripeSub.status,
      stripePriceId: priceId,
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
    },
  });

  // Activate premium
  await prisma.user.update({
    where: { id: userId },
    data: { isPremium: true },
  });

  // Send confirmation email
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const { sendSubscriptionConfirmation } = await import('./email.service');
      const endDate = new Date(periodEnd * 1000);
      await sendSubscriptionConfirmation(
        user.email,
        user.displayName || 'User',
        `Premium ${planMonths} ${planMonths === 1 ? 'Monat' : 'Monate'}`,
        endDate.toLocaleDateString('de-CH'),
        (user as any).locale
      );
    }
  } catch (err) {
    console.error('[Stripe] Failed to send confirmation email:', err);
  }

  // Create notification + push
  try {
    const { createNotification } = await import('./notification.service');
    await createNotification(userId, 'premium_activated', 'premium_activated', '', {});

    // Send celebratory push (locale-aware)
    const owner = await prisma.user.findUnique({
      where: { id: userId },
      select: { locale: true, pushTokens: true },
    });
    if (owner && owner.pushTokens && owner.pushTokens !== '[]') {
      const PUSH = {
        de: { title: 'Premium aktiviert! 🎉', body: 'Dein Premium-Abo ist jetzt aktiv. Genieße alle Vorteile!' },
        en: { title: 'Premium activated! 🎉', body: 'Your Premium subscription is now active. Enjoy all benefits!' },
        fr: { title: 'Premium activé ! 🎉', body: 'Votre abonnement Premium est actif. Profitez de tous les avantages !' },
        it: { title: 'Premium attivato! 🎉', body: 'Il tuo abbonamento Premium è ora attivo. Goditi tutti i vantaggi!' },
        sq: { title: 'Premium i aktivizuar! 🎉', body: 'Abonimi yt Premium është tani aktiv. Shijo të gjitha përfitimet!' },
      } as const;
      const loc = (['de', 'en', 'fr', 'it', 'sq'] as const).includes(owner.locale as any)
        ? (owner.locale as keyof typeof PUSH)
        : 'de';
      const { sendPushToUser } = await import('./push.service');
      await sendPushToUser(userId, PUSH[loc].title, PUSH[loc].body, {
        type: 'premium_activated',
      });
    }
  } catch (err) {
    console.error('[Stripe] premium_activated push failed:', err);
  }

  console.log(`[Stripe] Subscription activated for user ${userId}`);
}

// ─── Webhook: Invoice Paid ──────────────────────────────

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const rawSubId = (invoice as any).subscription || (invoice.parent as any)?.subscription_details?.subscription;
  const subscriptionId = extractSubscriptionId(rawSubId);
  if (!subscriptionId) {
    console.warn('[Stripe Webhook] handleInvoicePaid – no subscriptionId, skipping');
    return;
  }
  console.log(`[Stripe Webhook] handleInvoicePaid – subscriptionId=${subscriptionId}`);

  let sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  // Fallback: if handleCheckoutCompleted failed, create the subscription now
  if (!sub) {
    console.warn('[Stripe Webhook] handleInvoicePaid – no DB subscription, creating from Stripe data...');
    try {
      const stripeSub = await getStripe().subscriptions.retrieve(subscriptionId);
      const userId = stripeSub.metadata?.userId || await findUserIdFromCustomer(stripeSub.customer as string);
      if (userId) {
        const firstItem = stripeSub.items.data[0];
        sub = await prisma.subscription.create({
          data: {
            userId,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: firstItem?.price?.id || '',
            status: stripeSub.status,
            planDurationMonths: parseInt(stripeSub.metadata?.planMonths || '1', 10),
            currentPeriodStart: new Date((firstItem?.current_period_start || Math.floor(Date.now() / 1000)) * 1000),
            currentPeriodEnd: new Date((firstItem?.current_period_end || Math.floor(Date.now() / 1000)) * 1000),
          },
        });
        await prisma.user.update({ where: { id: userId }, data: { isPremium: true } });
        console.log(`[Stripe Webhook] handleInvoicePaid – created subscription + activated premium for ${userId}`);
      }
    } catch (fallbackErr: any) {
      console.error('[Stripe Webhook] handleInvoicePaid fallback error:', fallbackErr?.message);
    }
    if (!sub) return;
  }

  const stripeSub = await getStripe().subscriptions.retrieve(subscriptionId);
  const firstItem = stripeSub.items.data[0];
  const periodStart = firstItem?.current_period_start || Math.floor(Date.now() / 1000);
  const periodEnd = firstItem?.current_period_end || Math.floor(Date.now() / 1000);

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: stripeSub.status,
      currentPeriodStart: new Date(periodStart * 1000),
      currentPeriodEnd: new Date(periodEnd * 1000),
    },
  });

  await prisma.user.update({
    where: { id: sub.userId },
    data: { isPremium: true },
  });

  // Send renewal email (skip first invoice)
  if (invoice.billing_reason === 'subscription_cycle') {
    try {
      const user = await prisma.user.findUnique({ where: { id: sub.userId } });
      if (user) {
        const { sendSubscriptionRenewed } = await import('./email.service');
        const endDate = new Date(periodEnd * 1000);
        await sendSubscriptionRenewed(
          user.email,
          user.displayName || 'User',
          `Premium ${sub.planDurationMonths} ${sub.planDurationMonths === 1 ? 'Monat' : 'Monate'}`,
          endDate.toLocaleDateString('de-CH'),
          (user as any).locale
        );
      }
    } catch {}
  }
}

// ─── Webhook: Payment Failed ────────────────────────────

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string
    || (invoice.parent as any)?.subscription_details?.subscription as string;
  if (!subscriptionId) return;

  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });
  if (!sub) return;

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'past_due' },
  });

  // Send warning email
  try {
    const user = await prisma.user.findUnique({ where: { id: sub.userId } });
    if (user) {
      const { sendPaymentFailed } = await import('./email.service');
      const nextAttempt = invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString('de-CH')
        : 'bald';
      await sendPaymentFailed(user.email, user.displayName || 'User', nextAttempt, (user as any).locale);
    }
  } catch {}
}

// ─── Webhook: Subscription Updated ──────────────────────

async function handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
  console.log(`[Stripe Webhook] handleSubscriptionUpdated – subId=${stripeSub.id}, status=${stripeSub.status}`);

  let sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSub.id },
  });

  // Fallback: if handleCheckoutCompleted failed, create the DB record now
  if (!sub) {
    console.warn('[Stripe Webhook] handleSubscriptionUpdated – no DB subscription, creating from Stripe metadata...');
    const userId = stripeSub.metadata?.userId || await findUserIdFromCustomer(stripeSub.customer as string);
    if (!userId) {
      console.error('[Stripe Webhook] handleSubscriptionUpdated – cannot determine userId, aborting');
      return;
    }
    const firstItem = stripeSub.items.data[0];
    sub = await prisma.subscription.create({
      data: {
        userId,
        stripeSubscriptionId: stripeSub.id,
        stripePriceId: firstItem?.price?.id || '',
        status: stripeSub.status,
        planDurationMonths: parseInt(stripeSub.metadata?.planMonths || '1', 10),
        currentPeriodStart: new Date((firstItem?.current_period_start || Math.floor(Date.now() / 1000)) * 1000),
        currentPeriodEnd: new Date((firstItem?.current_period_end || Math.floor(Date.now() / 1000)) * 1000),
      },
    });
    console.log(`[Stripe Webhook] handleSubscriptionUpdated – created DB subscription for user ${userId}`);
  }

  const updFirstItem = stripeSub.items.data[0];
  const updPeriodStart = updFirstItem?.current_period_start || Math.floor(Date.now() / 1000);
  const updPeriodEnd = updFirstItem?.current_period_end || Math.floor(Date.now() / 1000);

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: stripeSub.status,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      currentPeriodStart: new Date(updPeriodStart * 1000),
      currentPeriodEnd: new Date(updPeriodEnd * 1000),
    },
  });

  // Sync premium status — but don't blindly set false if user has OTHER active subscriptions
  const isThisSubActive = ['active', 'trialing'].includes(stripeSub.status);
  if (isThisSubActive) {
    await prisma.user.update({
      where: { id: sub.userId },
      data: { isPremium: true },
    });
    console.log(`[Stripe Webhook] handleSubscriptionUpdated – user ${sub.userId} isPremium=true (sub ${stripeSub.id} is ${stripeSub.status})`);
  } else {
    // Before setting isPremium=false, check if user has ANY other active subscription
    const otherActiveSub = await prisma.subscription.findFirst({
      where: {
        userId: sub.userId,
        status: { in: ['active', 'trialing'] },
        stripeSubscriptionId: { not: stripeSub.id },
      },
    });
    if (otherActiveSub) {
      console.log(`[Stripe Webhook] handleSubscriptionUpdated – sub ${stripeSub.id} is ${stripeSub.status}, but user ${sub.userId} has another active sub ${otherActiveSub.stripeSubscriptionId}, keeping isPremium=true`);
    } else {
      await prisma.user.update({
        where: { id: sub.userId },
        data: { isPremium: false },
      });
      console.log(`[Stripe Webhook] handleSubscriptionUpdated – user ${sub.userId} isPremium=false (no active subs remaining)`);
    }
  }
}

// ─── Webhook: Subscription Deleted ──────────────────────

async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSub.id },
  });
  if (!sub) return;

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: 'canceled',
      cancelAtPeriodEnd: false,
      canceledAt: new Date(),
    },
  });

  // Only set isPremium=false if user has no OTHER active subscriptions
  const otherActiveSub = await prisma.subscription.findFirst({
    where: {
      userId: sub.userId,
      status: { in: ['active', 'trialing'] },
      stripeSubscriptionId: { not: stripeSub.id },
    },
  });
  if (!otherActiveSub) {
    await prisma.user.update({
      where: { id: sub.userId },
      data: { isPremium: false },
    });
    console.log(`[Stripe Webhook] handleSubscriptionDeleted – user ${sub.userId} isPremium=false (no active subs)`);
  } else {
    console.log(`[Stripe Webhook] handleSubscriptionDeleted – sub deleted but user ${sub.userId} has another active sub, keeping isPremium=true`);
  }

  // Send cancellation email
  try {
    const user = await prisma.user.findUnique({ where: { id: sub.userId } });
    if (user) {
      const { sendSubscriptionCancelled } = await import('./email.service');
      await sendSubscriptionCancelled(
        user.email,
        user.displayName || 'User',
        new Date().toLocaleDateString('de-CH'),
        (user as any).locale
      );
    }
  } catch {}

  // Create notification
  try {
    const { createNotification } = await import('./notification.service');
    await createNotification(sub.userId, 'premium_cancelled', 'premium_cancelled', '', {});
  } catch {}

  console.log(`[Stripe] Subscription ended for user ${sub.userId}`);
}

// ─── Get Plans (public, DB-driven) ───────────────────────

export async function getPlans(role: string) {
  const dbRole = role === 'employer' ? 'employer' : 'job_seeker';
  const plans = await prisma.plan.findMany({
    where: { role: dbRole, isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return plans.map(p => ({
    id: p.id,
    label: p.label,
    intervalType: p.intervalType,
    intervalCount: p.intervalCount,
    amountCents: p.amountCents,
    oldPriceCents: p.oldPriceCents,
    currency: p.currency,
    isBestOffer: p.isBestOffer,
  }));
}

// ─── Admin: Get all plans (active + inactive) ───────────

export async function getAllPlans() {
  return prisma.plan.findMany({ orderBy: [{ role: 'asc' }, { sortOrder: 'asc' }] });
}

// ─── Admin: Cancel a customer's subscription ────────────
//
// mode:
//   - 'period_end': Stripe keeps billing until currentPeriodEnd, then cancels
//     (safe default — customer keeps access for what they paid for)
//   - 'immediate':  Stripe ends the sub right now, isPremium flips off if no
//     other active sub exists (use for refunds / abuse / chargebacks)

export async function adminCancelSubscription(
  subscriptionDbId: string,
  mode: 'period_end' | 'immediate' = 'period_end'
): Promise<{ success: boolean; endDate: string; canceledNow: boolean }> {
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionDbId } });
  if (!sub) throw new Error('Subscription not found');
  if (['canceled', 'incomplete_expired'].includes(sub.status)) {
    throw new Error('Subscription is already canceled');
  }
  if (!sub.stripeSubscriptionId) {
    throw new Error('iOS IAP subscription cannot be canceled from admin — managed by Apple');
  }

  if (mode === 'immediate') {
    await getStripe().subscriptions.cancel(sub.stripeSubscriptionId);
    const now = new Date();
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: 'canceled', canceledAt: now, cancelAtPeriodEnd: false, currentPeriodEnd: now },
    });
    // Re-evaluate premium flag: only drop if user has no other running sub
    const others = await prisma.subscription.count({
      where: { userId: sub.userId, status: { in: ['active', 'trialing'] }, id: { not: sub.id } },
    });
    if (others === 0) {
      await prisma.user.update({ where: { id: sub.userId }, data: { isPremium: false } });
    }
    return { success: true, endDate: now.toISOString(), canceledNow: true };
  }

  // period_end
  await getStripe().subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true, canceledAt: new Date() },
  });
  return { success: true, endDate: sub.currentPeriodEnd.toISOString(), canceledNow: false };
}

// ─── Admin: Get premium users ────────────────────────────

export async function getPremiumUsers() {
  return prisma.subscription.findMany({
    where: { status: { in: ['active', 'trialing'] } },
    include: { user: { select: { id: true, email: true, displayName: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  });
}
