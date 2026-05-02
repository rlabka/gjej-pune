import Stripe from 'stripe';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

// ─── Stripe Client (reuse pattern from stripe.service) ──

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured');
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' as any });
  }
  return _stripe;
}

// ─── Ad Packages ────────────────────────────────────────

export const AD_PACKAGES = {
  '3_months': { durationMonths: 3, amountCents: 18000, monthlyPrice: 60, label: '3 Monate' },
  '6_months': { durationMonths: 6, amountCents: 30000, monthlyPrice: 50, label: '6 Monate' },
} as const;

export type AdPlan = keyof typeof AD_PACKAGES;

// ─── Create Checkout Session ────────────────────────────

interface CreateAdCheckoutInput {
  companyName: string;
  companyEmail: string;
  companyWebsite?: string;
  plan: AdPlan;
  logoPath?: string;
  locale?: string;
  userId?: string;
}

export async function createAdCheckoutSession(input: CreateAdCheckoutInput): Promise<string> {
  const pkg = AD_PACKAGES[input.plan];
  if (!pkg) throw new Error('Invalid plan');

  // Create DB record
  const ad = await prisma.adPlacement.create({
    data: {
      companyName: input.companyName,
      companyEmail: input.companyEmail,
      companyWebsite: input.companyWebsite || null,
      logoUrl: input.logoPath || null,
      plan: input.plan,
      durationMonths: pkg.durationMonths,
      amountCents: pkg.amountCents,
      userId: input.userId || null,
      status: 'pending_payment',
    },
  });

  const locale = input.locale || 'de';

  // Create Stripe Checkout Session (one-time payment)
  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: input.companyEmail,
    line_items: [{
      price_data: {
        currency: 'chf',
        product_data: {
          name: `Logo Placement – ${pkg.label} (${pkg.monthlyPrice} CHF/Mt.)`,
          description: `Logo auf gjej-pune.com Startseite für ${pkg.durationMonths} Monate`,
        },
        unit_amount: pkg.amountCents,
      },
      quantity: 1,
    }],
    metadata: {
      type: 'ad_placement',
      adPlacementId: ad.id,
    },
    success_url: `${env.FRONTEND_URL}/${locale}/advertise?success=true`,
    cancel_url: `${env.FRONTEND_URL}/${locale}/advertise?canceled=true`,
  });

  // Store session ID
  await prisma.adPlacement.update({
    where: { id: ad.id },
    data: { stripeSessionId: session.id },
  });

  return session.url!;
}

// ─── Handle Payment Completed (from webhook) ───────────

export async function handleAdPaymentCompleted(session: Stripe.Checkout.Session) {
  const adId = session.metadata?.adPlacementId;
  if (!adId) return;

  const ad = await prisma.adPlacement.findUnique({ where: { id: adId } });
  if (!ad || ad.status !== 'pending_payment') return;

  await prisma.adPlacement.update({
    where: { id: adId },
    data: {
      status: 'paid',
      paidAt: new Date(),
    },
  });

  console.log(`[Ad] Payment received for ad placement ${adId} (${ad.companyName})`);
}

// ─── Get Active Ads (public, with lazy expiration) ──────

export async function getActiveAds() {
  // Lazy expire
  await prisma.adPlacement.updateMany({
    where: { status: 'active', expiresAt: { lte: new Date() } },
    data: { status: 'expired' },
  });

  return prisma.adPlacement.findMany({
    where: { status: 'active', expiresAt: { gt: new Date() } },
    select: {
      id: true,
      companyName: true,
      companyWebsite: true,
      logoUrl: true,
    },
    orderBy: { activatedAt: 'asc' },
  });
}

// ─── Admin: List All ────────────────────────────────────

export async function adminListAds(statusFilter?: string) {
  const where = statusFilter ? { status: statusFilter } : {};
  return prisma.adPlacement.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

// ─── Admin: Activate ────────────────────────────────────

export async function adminActivateAd(id: string) {
  const ad = await prisma.adPlacement.findUnique({ where: { id } });
  if (!ad) throw new Error('Not found');
  if (ad.status !== 'paid') throw new Error('Can only activate paid ads');

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + ad.durationMonths);

  return prisma.adPlacement.update({
    where: { id },
    data: {
      status: 'active',
      activatedAt: now,
      expiresAt,
    },
  });
}

// ─── Admin: Reject ──────────────────────────────────────

export async function adminRejectAd(id: string, reason?: string) {
  const ad = await prisma.adPlacement.findUnique({ where: { id } });
  if (!ad) throw new Error('Not found');

  return prisma.adPlacement.update({
    where: { id },
    data: {
      status: 'rejected',
      rejectedReason: reason || null,
    },
  });
}

// ─── Admin: Delete ──────────────────────────────────────

export async function adminDeleteAd(id: string) {
  const ad = await prisma.adPlacement.findUnique({ where: { id } });
  if (!ad) throw new Error('Not found');

  // Delete logo file if exists
  if (ad.logoUrl) {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, '../../uploads', ad.logoUrl.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  return prisma.adPlacement.delete({ where: { id } });
}

// ─── Admin: Upload Logo ─────────────────────────────────

export async function adminUploadLogo(id: string, logoPath: string) {
  const ad = await prisma.adPlacement.findUnique({ where: { id } });
  if (!ad) throw new Error('Not found');

  // Delete old logo if exists
  if (ad.logoUrl) {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.resolve(__dirname, '../../uploads', ad.logoUrl.replace('/uploads/', ''));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  return prisma.adPlacement.update({
    where: { id },
    data: { logoUrl: logoPath },
  });
}
