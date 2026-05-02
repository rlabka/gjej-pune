/**
 * Stripe API client – calls the Express backend Stripe endpoints.
 */

import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Types ──────────────────────────────────────────────

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

export interface InvoiceItem {
  id: string;
  date: string;
  amountCents: number;
  currency: string;
  status: string;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

export interface PlanItem {
  id: string;
  label: string;
  intervalType: 'day' | 'week' | 'month';
  intervalCount: number;
  amountCents: number;
  oldPriceCents: number | null;
  currency: string;
  isBestOffer: boolean;
}

// ─── Helpers ────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error('[Stripe] Non-JSON response:', res.status, text.slice(0, 300));
    return null;
  }
}

// ─── Fetch Plans ─────────────────────────────────────────

export async function fetchPlans(role: string): Promise<PlanItem[]> {
  try {
    const r = role === 'employer' ? 'employer' : 'job_seeker';
    const res = await fetch(`${API_URL}/api/stripe/plans?role=${r}`);
    const data = await safeJson(res);
    if (!data || !res.ok) return [];
    return data.plans || [];
  } catch {
    return [];
  }
}

// ─── Create Checkout Session & Redirect ─────────────────

export async function createCheckoutSession(
  planId: string,
  locale: string = 'de'
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/api/stripe/checkout`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ planId, locale }),
    });

    const data = await safeJson(res);
    if (!data) return { ok: false, error: 'serverError' };
    if (!res.ok) return { ok: false, error: data.error || 'checkout_failed' };

    if (data.url) {
      window.location.href = data.url;
      return { ok: true };
    }

    return { ok: false, error: 'no_url' };
  } catch (err) {
    console.error('[Stripe] Checkout error:', err);
    return { ok: false, error: 'networkError' };
  }
}

// ─── Get Subscription Details ───────────────────────────

export async function getSubscriptionDetails(): Promise<SubscriptionDetails | null> {
  try {
    const res = await fetch(`${API_URL}/api/stripe/subscription`, {
      headers: authHeaders(),
    });

    const data = await safeJson(res);
    if (!data || !res.ok) return null;

    return data.subscription || null;
  } catch {
    return null;
  }
}

// ─── Get Invoices ───────────────────────────────────────

export async function getInvoices(): Promise<InvoiceItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/stripe/invoices`, {
      headers: authHeaders(),
    });

    const data = await safeJson(res);
    if (!data || !res.ok) return [];

    return data.invoices || [];
  } catch {
    return [];
  }
}

// ─── Cancel Subscription ────────────────────────────────

export async function cancelSubscription(): Promise<{ ok: true; endDate: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/api/stripe/cancel`, {
      method: 'POST',
      headers: authHeaders(),
    });

    const data = await safeJson(res);
    if (!data) return { ok: false, error: 'serverError' };
    if (!res.ok) return { ok: false, error: data.error || 'cancel_failed' };

    return { ok: true, endDate: data.endDate };
  } catch {
    return { ok: false, error: 'networkError' };
  }
}

// ─── Reactivate Subscription ────────────────────────────

export async function reactivateSubscription(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/api/stripe/reactivate`, {
      method: 'POST',
      headers: authHeaders(),
    });

    const data = await safeJson(res);
    if (!data) return { ok: false, error: 'serverError' };
    if (!res.ok) return { ok: false, error: data.error || 'reactivate_failed' };

    return { ok: true };
  } catch {
    return { ok: false, error: 'networkError' };
  }
}

// ─── Open Billing Portal ────────────────────────────────

export async function openBillingPortal(
  locale: string = 'de'
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/api/stripe/portal`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ locale }),
    });

    const data = await safeJson(res);
    if (!data) return { ok: false, error: 'serverError' };
    if (!res.ok) return { ok: false, error: data.error || 'portal_failed' };

    if (data.url) {
      window.location.href = data.url;
      return { ok: true };
    }

    return { ok: false, error: 'no_url' };
  } catch {
    return { ok: false, error: 'networkError' };
  }
}

// ─── Format Price ───────────────────────────────────────

export function formatPrice(amountCents: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}
