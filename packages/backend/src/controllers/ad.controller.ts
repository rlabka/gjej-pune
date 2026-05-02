import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  AD_PACKAGES,
  createAdCheckoutSession,
  getActiveAds,
  adminListAds,
  adminActivateAd,
  adminRejectAd,
  adminDeleteAd,
  adminUploadLogo,
} from '../services/ad.service';
import type { AdPlan } from '../services/ad.service';

// ─── Public: Get Packages ───────────────────────────────

export async function getPackages(_req: Request, res: Response) {
  res.json({ ok: true, packages: AD_PACKAGES });
}

// ─── Public: Create Checkout ────────────────────────────

export async function createCheckout(req: Request, res: Response) {
  try {
    const { companyName, companyEmail, companyWebsite, plan, locale } = req.body;

    if (!companyName || !companyEmail || !plan) {
      return res.status(400).json({ ok: false, error: 'companyName, companyEmail and plan are required' });
    }

    if (!AD_PACKAGES[plan as AdPlan]) {
      return res.status(400).json({ ok: false, error: 'Invalid plan. Use "3_months" or "6_months"' });
    }

    // Handle logo upload if present
    let logoPath: string | undefined;
    if ((req as any).file) {
      logoPath = `/uploads/ads/${(req as any).file.filename}`;
    }

    const url = await createAdCheckoutSession({
      companyName,
      companyEmail,
      companyWebsite,
      plan: plan as AdPlan,
      logoPath,
      locale,
    });

    res.json({ ok: true, url });
  } catch (err) {
    console.error('[Ad] createCheckout error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

// ─── Public: Get Active Ads ─────────────────────────────

export async function getActiveAdsHandler(_req: Request, res: Response) {
  try {
    const ads = await getActiveAds();
    res.json({ ok: true, ads });
  } catch (err) {
    console.error('[Ad] getActiveAds error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

// ─── Admin: List ────────────────────────────────────────

export async function adminListHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const status = req.query.status as string | undefined;
    const ads = await adminListAds(status);
    res.json({ ok: true, ads });
  } catch (err) {
    console.error('[Ad] adminList error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

// ─── Admin: Activate ────────────────────────────────────

export async function adminActivateHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const ad = await adminActivateAd(req.params.id);
    res.json({ ok: true, ad });
  } catch (err: any) {
    console.error('[Ad] adminActivate error:', err);
    res.status(400).json({ ok: false, error: err.message });
  }
}

// ─── Admin: Reject ──────────────────────────────────────

export async function adminRejectHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const ad = await adminRejectAd(req.params.id, req.body.reason);
    res.json({ ok: true, ad });
  } catch (err: any) {
    console.error('[Ad] adminReject error:', err);
    res.status(400).json({ ok: false, error: err.message });
  }
}

// ─── Admin: Delete ──────────────────────────────────────

export async function adminDeleteHandler(req: AuthenticatedRequest, res: Response) {
  try {
    await adminDeleteAd(req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    console.error('[Ad] adminDelete error:', err);
    res.status(400).json({ ok: false, error: err.message });
  }
}

// ─── Admin: Upload Logo ─────────────────────────────────

export async function adminUploadLogoHandler(req: AuthenticatedRequest, res: Response) {
  try {
    if (!(req as any).file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded' });
    }
    const logoPath = `/uploads/ads/${(req as any).file.filename}`;
    const ad = await adminUploadLogo(req.params.id, logoPath);
    res.json({ ok: true, ad });
  } catch (err: any) {
    console.error('[Ad] adminUploadLogo error:', err);
    res.status(400).json({ ok: false, error: err.message });
  }
}
