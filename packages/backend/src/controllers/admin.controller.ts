import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import { createStripePriceForPlan, archiveStripePrice, getAllPlans, getPremiumUsers, adminCancelSubscription } from '../services/stripe.service';

/**
 * GET /api/admin/users
 * Admin-only – list all admin users.
 */
export async function listAdmins(req: AuthenticatedRequest, res: Response) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true, email: true, displayName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ ok: true, admins });
  } catch (err) {
    console.error('[Admin] listAdmins error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * POST /api/admin/users
 * Admin-only – create a new admin user.
 * Body: { email, password, displayName? }
 */
export async function createAdmin(req: AuthenticatedRequest, res: Response) {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email und Passwort erforderlich' });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: 'Passwort muss mind. 6 Zeichen lang sein' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ ok: false, error: 'E-Mail existiert bereits' });
    }

    const hash = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: {
        email,
        password: hash,
        displayName: displayName || email.split('@')[0],
        role: 'admin',
      },
      select: { id: true, email: true, displayName: true, createdAt: true },
    });

    res.json({ ok: true, admin });
  } catch (err) {
    console.error('[Admin] createAdmin error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * DELETE /api/admin/users/:id
 * Admin-only – delete an admin user (cannot delete self).
 */
export async function deleteAdmin(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    if (id === req.user?.id) {
      return res.status(400).json({ ok: false, error: 'Eigenen Account kann nicht gelöscht werden' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'admin') {
      return res.status(404).json({ ok: false, error: 'Admin nicht gefunden' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Admin] deleteAdmin error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * PUT /api/admin/profile
 * Admin-only – update own email and/or displayName.
 * Body: { email?, displayName? }
 */
export async function updateAdminProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: 'unauthorized' });

    const { email, displayName } = req.body;
    const data: Record<string, string> = {};
    if (email) data.email = email;
    if (displayName) data.displayName = displayName;

    if (email && email !== req.user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ ok: false, error: 'E-Mail existiert bereits' });
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, email: true, displayName: true },
    });

    res.json({ ok: true, user: updated });
  } catch (err) {
    console.error('[Admin] updateAdminProfile error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * PUT /api/admin/password
 * Admin-only – change own password.
 * Body: { currentPassword, newPassword }
 */
export async function changeAdminPassword(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: 'unauthorized' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ ok: false, error: 'Aktuelles und neues Passwort erforderlich' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ ok: false, error: 'Neues Passwort muss mind. 6 Zeichen lang sein' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ ok: false, error: 'User nicht gefunden' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ ok: false, error: 'Aktuelles Passwort ist falsch' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hash } });

    res.json({ ok: true });
  } catch (err) {
    console.error('[Admin] changeAdminPassword error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

// ─── All Users Management ────────────────────────────────────────

/**
 * GET /api/admin/all-users
 * Admin-only – list all non-admin users with pagination + search.
 */
export async function listAllUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string || '').trim();
    const role = req.query.role as string || '';

    const premium = (req.query.premium as string || '');

    const where: any = { role: { not: 'admin' } };
    if (role && ['job-seeker', 'employer'].includes(role)) {
      where.role = role;
    }
    if (premium === 'true') {
      where.isPremium = true;
    }
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { displayName: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, displayName: true, role: true,
          isPremium: true, phone: true, companyName: true, location: true, image: true,
          bio: true, website: true, locale: true,
          createdAt: true, updatedAt: true,
          _count: { select: { jobs: true, jobSeekerAds: true } },
        },
        orderBy: [{ isPremium: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ ok: true, users, total, totalPages: Math.ceil(total / limit), page });
  } catch (err) {
    console.error('[Admin] listAllUsers error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * PATCH /api/admin/all-users/:id
 * Admin-only – update user fields.
 */
export async function updateUser(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { isPremium, displayName, role, email, phone, companyName, bio, location, website, locale } = req.body;

    const data: any = {};
    if (typeof isPremium === 'boolean') data.isPremium = isPremium;
    if (typeof displayName === 'string') data.displayName = displayName;
    if (typeof role === 'string' && ['job-seeker', 'employer'].includes(role)) data.role = role;
    if (typeof email === 'string') data.email = email;
    if (typeof phone === 'string') data.phone = phone;
    if (typeof companyName === 'string') data.companyName = companyName;
    if (typeof bio === 'string') data.bio = bio;
    if (typeof location === 'string') data.location = location;
    if (typeof website === 'string') data.website = website;
    if (typeof locale === 'string') data.locale = locale;

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, email: true, displayName: true, role: true, isPremium: true,
        phone: true, companyName: true, bio: true, location: true, website: true,
        locale: true, image: true,
      },
    });

    res.json({ ok: true, user });
  } catch (err) {
    console.error('[Admin] updateUser error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * POST /api/admin/all-users/:id/upload-image
 * Admin-only – upload / replace a user's profile image.
 */
export async function uploadUserImage(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    if (!req.file) return res.status(400).json({ ok: false, error: 'noFile' });

    const image = `/uploads/users/${req.file.filename}`;
    await prisma.user.update({ where: { id }, data: { image } });

    res.json({ ok: true, image });
  } catch (err) {
    console.error('[Admin] uploadUserImage error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * POST /api/admin/all-users/:id/reset-password
 * Admin-only – reset a user's password.
 * Body: { newPassword }
 */
export async function resetUserPassword(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ ok: false, error: 'User not found' });

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id }, data: { password: hash } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Admin] resetUserPassword error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * DELETE /api/admin/all-users/:id
 * Admin-only – delete a non-admin user and their data.
 */
export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ ok: false, error: 'not found' });
    if (user.role === 'admin') return res.status(403).json({ ok: false, error: 'cannot delete admin' });

    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Admin] deleteUser error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

// ─── All Jobs Management ─────────────────────────────────────────

/**
 * GET /api/admin/all-jobs
 * Admin-only – list all jobs with pagination + search.
 */
export async function listAllJobs(req: AuthenticatedRequest, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string || '').trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { category: { contains: search } },
        { companyName: { contains: search } },
        { contactName: { contains: search } },
        { locationCity: { contains: search } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, displayName: true, isPremium: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    res.json({ ok: true, jobs, total, totalPages: Math.ceil(total / limit), page });
  } catch (err) {
    console.error('[Admin] listAllJobs error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * PATCH /api/admin/all-jobs/:id
 * Admin-only – edit any job.
 */
export async function updateJob(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const {
      category, contactName, contactSurname, contactPhone, contactEmail,
      companyName, salary, salaryType, currency, locationState, locationCity,
      when, status, description,
    } = req.body;

    const data: any = {};
    if (category !== undefined) data.category = category;
    if (contactName !== undefined) data.contactName = contactName;
    if (contactSurname !== undefined) data.contactSurname = contactSurname;
    if (contactPhone !== undefined) data.contactPhone = contactPhone;
    if (contactEmail !== undefined) data.contactEmail = contactEmail;
    if (companyName !== undefined) data.companyName = companyName;
    if (salary !== undefined) data.salary = salary === null ? null : Number(salary);
    if (salaryType !== undefined) data.salaryType = salaryType;
    if (currency !== undefined) data.currency = currency;
    if (locationState !== undefined) data.locationState = locationState;
    if (locationCity !== undefined) data.locationCity = locationCity;
    if (when !== undefined) data.when = when;
    if (status !== undefined) data.status = status;
    if (description !== undefined) data.description = description;

    const job = await prisma.job.update({ where: { id }, data });
    res.json({ ok: true, job });
  } catch (err) {
    console.error('[Admin] updateJob error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * DELETE /api/admin/all-jobs/:id
 * Admin-only – delete any job.
 */
export async function deleteJob(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    await prisma.job.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Admin] deleteJob error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

// ─── All Ads Management ──────────────────────────────────────────

/**
 * GET /api/admin/all-ads
 * Admin-only – list all job seeker ads with pagination + search.
 */
export async function listAllAds(req: AuthenticatedRequest, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string || '').trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { category: { contains: search } },
        { firstName: { contains: search } },
        { surname: { contains: search } },
        { livingPlace: { contains: search } },
      ];
    }

    const [ads, total] = await Promise.all([
      prisma.jobSeekerAd.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, displayName: true, isPremium: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.jobSeekerAd.count({ where }),
    ]);

    res.json({ ok: true, ads, total, totalPages: Math.ceil(total / limit), page });
  } catch (err) {
    console.error('[Admin] listAllAds error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * PATCH /api/admin/all-ads/:id
 * Admin-only – edit any job seeker ad.
 */
export async function updateAd(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const {
      category, firstName, surname, phone, email, age,
      experience, livingPlace, skills, spokenLanguages, status,
    } = req.body;

    const data: any = {};
    if (category !== undefined) data.category = category;
    if (firstName !== undefined) data.firstName = firstName;
    if (surname !== undefined) data.surname = surname;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined) data.email = email;
    if (age !== undefined) data.age = age === null ? null : Number(age);
    if (experience !== undefined) data.experience = experience;
    if (livingPlace !== undefined) data.livingPlace = livingPlace;
    if (skills !== undefined) data.skills = skills;
    if (spokenLanguages !== undefined) data.spokenLanguages = spokenLanguages;
    if (status !== undefined) data.status = status;

    const ad = await prisma.jobSeekerAd.update({ where: { id }, data });
    res.json({ ok: true, ad });
  } catch (err) {
    console.error('[Admin] updateAd error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * DELETE /api/admin/all-ads/:id
 * Admin-only – delete any job seeker ad.
 */
export async function deleteAd(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params.id as string;
    await prisma.jobSeekerAd.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Admin] deleteAd error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * GET /api/admin/email-settings
 * Admin-only – get SMTP configuration.
 */
export async function getEmailSettings(req: AuthenticatedRequest, res: Response) {
  try {
    let settings = await prisma.emailSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.emailSettings.create({ data: { id: 'default' } });
    }
    // Don't expose the password in plain text
    res.json({
      ok: true,
      settings: {
        ...settings,
        smtpPass: settings.smtpPass ? '••••••••' : '',
      },
    });
  } catch (err) {
    console.error('[Admin] getEmailSettings error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * PUT /api/admin/email-settings
 * Admin-only – update SMTP configuration.
 * Body: { smtpHost, smtpPort, smtpUser, smtpPass, fromName, fromEmail, encryption }
 */
export async function updateEmailSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass, fromName, fromEmail, encryption } = req.body;

    const data: any = {};
    if (smtpHost !== undefined) data.smtpHost = smtpHost;
    if (smtpPort !== undefined) data.smtpPort = parseInt(smtpPort, 10) || 587;
    if (smtpUser !== undefined) data.smtpUser = smtpUser;
    // Only update password if it's not the masked value
    if (smtpPass !== undefined && smtpPass !== '••••••••') data.smtpPass = smtpPass;
    if (fromName !== undefined) data.fromName = fromName;
    if (fromEmail !== undefined) data.fromEmail = fromEmail;
    if (encryption !== undefined) data.encryption = encryption;

    const settings = await prisma.emailSettings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });

    res.json({
      ok: true,
      settings: {
        ...settings,
        smtpPass: settings.smtpPass ? '••••••••' : '',
      },
    });
  } catch (err) {
    console.error('[Admin] updateEmailSettings error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * POST /api/admin/email-settings/test
 * Admin-only – send a test email.
 * Body: { to?: string } – defaults to admin's own email
 */
export async function testEmail(req: AuthenticatedRequest, res: Response) {
  try {
    const settings = await prisma.emailSettings.findUnique({ where: { id: 'default' } });
    if (!settings || !settings.smtpHost || !settings.smtpUser) {
      return res.status(400).json({ ok: false, error: 'SMTP-Einstellungen nicht konfiguriert' });
    }

    const toAddress = req.body.to || req.user?.email;
    if (!toAddress) {
      return res.status(400).json({ ok: false, error: 'Keine Empfänger-Adresse' });
    }

    const { sendTestEmail: sendTest } = await import('../services/email.service');
    const sent = await sendTest(toAddress);

    if (sent) {
      res.json({ ok: true, message: `Test-E-Mail wurde erfolgreich an ${toAddress} gesendet.` });
    } else {
      res.status(500).json({ ok: false, error: 'E-Mail konnte nicht gesendet werden. Prüfen Sie die SMTP-Einstellungen.' });
    }
  } catch (err) {
    console.error('[Admin] testEmail error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

// ─── Plan Management ──────────────────────────────────────

/**
 * GET /api/admin/plans
 */
export async function listPlans(req: AuthenticatedRequest, res: Response) {
  try {
    const plans = await getAllPlans();
    res.json({ ok: true, plans });
  } catch (err) {
    console.error('[Admin] listPlans error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * POST /api/admin/plans
 */
export async function createPlan(req: AuthenticatedRequest, res: Response) {
  try {
    const { label, role, intervalType, intervalCount, amountCents, oldPriceCents, isBestOffer, sortOrder } = req.body;

    if (!label || !role || !intervalType || !intervalCount || amountCents == null) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }
    if (!['job_seeker', 'employer'].includes(role)) {
      return res.status(400).json({ ok: false, error: 'Invalid role' });
    }
    if (!['day', 'week', 'month'].includes(intervalType)) {
      return res.status(400).json({ ok: false, error: 'Invalid intervalType' });
    }

    const plan = await prisma.plan.create({
      data: {
        label,
        role,
        intervalType,
        intervalCount: Number(intervalCount),
        amountCents: Number(amountCents),
        oldPriceCents: oldPriceCents != null ? Number(oldPriceCents) : null,
        currency: 'eur',
        isBestOffer: isBestOffer === true,
        sortOrder: sortOrder != null ? Number(sortOrder) : 0,
      },
    });

    // Create Stripe price
    try {
      await createStripePriceForPlan(plan.id);
    } catch (stripeErr: any) {
      console.error('[Admin] Stripe price creation failed:', stripeErr.message);
    }

    const updated = await prisma.plan.findUnique({ where: { id: plan.id } });
    res.json({ ok: true, plan: updated });
  } catch (err) {
    console.error('[Admin] createPlan error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * PUT /api/admin/plans/:id
 */
export async function updatePlan(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ ok: false, error: 'Plan not found' });

    const { label, intervalType, intervalCount, amountCents, oldPriceCents, isBestOffer, sortOrder, isActive } = req.body;

    const priceChanged = amountCents != null && Number(amountCents) !== existing.amountCents;
    const intervalChanged = (intervalType && intervalType !== existing.intervalType) ||
      (intervalCount != null && Number(intervalCount) !== existing.intervalCount);

    // If price or interval changed, archive old Stripe price and create new one
    if (priceChanged || intervalChanged) {
      if (existing.stripePriceId) {
        await archiveStripePrice(existing.stripePriceId);
      }
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        ...(label != null && { label }),
        ...(intervalType != null && { intervalType }),
        ...(intervalCount != null && { intervalCount: Number(intervalCount) }),
        ...(amountCents != null && { amountCents: Number(amountCents) }),
        ...(oldPriceCents !== undefined && { oldPriceCents: oldPriceCents != null ? Number(oldPriceCents) : null }),
        ...(isBestOffer != null && { isBestOffer }),
        ...(sortOrder != null && { sortOrder: Number(sortOrder) }),
        ...(isActive != null && { isActive }),
        // Clear stripe price if we need a new one
        ...(priceChanged || intervalChanged ? { stripePriceId: null } : {}),
      },
    });

    // Create new Stripe price if needed
    if (priceChanged || intervalChanged) {
      try {
        await createStripePriceForPlan(plan.id);
      } catch (stripeErr: any) {
        console.error('[Admin] Stripe price creation failed:', stripeErr.message);
      }
    }

    const updated = await prisma.plan.findUnique({ where: { id: plan.id } });
    res.json({ ok: true, plan: updated });
  } catch (err) {
    console.error('[Admin] updatePlan error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * DELETE /api/admin/plans/:id – soft-delete (deactivate)
 */
export async function deletePlan(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.plan.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ ok: false, error: 'Plan not found' });

    // Archive Stripe price
    if (existing.stripePriceId) {
      await archiveStripePrice(existing.stripePriceId);
    }

    await prisma.plan.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[Admin] deletePlan error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * GET /api/admin/premium-users
 */
export async function listPremiumUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const subscriptions = await getPremiumUsers();
    res.json({ ok: true, subscriptions });
  } catch (err) {
    console.error('[Admin] listPremiumUsers error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * POST /api/admin/subscriptions/:id/cancel
 * Body: { mode?: 'period_end' | 'immediate' }
 */
export async function adminCancelSubscriptionHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const mode = req.body?.mode === 'immediate' ? 'immediate' : 'period_end';
    const result = await adminCancelSubscription(id, mode);
    res.json({ ok: true, ...result });
  } catch (err: any) {
    console.error('[Admin] cancelSubscription error:', err);
    const msg = err?.message || 'internal';
    const status = msg === 'Subscription not found' ? 404
      : msg === 'Subscription is already canceled' ? 400
      : 500;
    res.status(status).json({ ok: false, error: msg });
  }
}

// ─── Job Category Management ────────────────────────────────────

/**
 * GET /api/admin/categories
 */
export async function listCategories(req: AuthenticatedRequest, res: Response) {
  try {
    const categories = await prisma.jobCategoryGroup.findMany({
      include: { titles: { orderBy: { key: 'asc' } } },
      orderBy: { order: 'asc' },
    });
    res.json({ ok: true, categories });
  } catch (err) {
    console.error('[Admin] listCategories error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * POST /api/admin/categories
 */
export async function createCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { slug, icon, labels, order } = req.body;
    if (!slug || !icon || !labels) {
      return res.status(400).json({ ok: false, error: 'slug, icon and labels required' });
    }
    const category = await prisma.jobCategoryGroup.create({
      data: { slug, icon, labels, order: order ?? 0 },
      include: { titles: true },
    });
    res.json({ ok: true, category });
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ ok: false, error: 'slug already exists' });
    console.error('[Admin] createCategory error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * PUT /api/admin/categories/:id
 */
export async function updateCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { slug, icon, labels, order } = req.body;
    const data: any = {};
    if (typeof slug === 'string') data.slug = slug;
    if (typeof icon === 'string') data.icon = icon;
    if (labels) data.labels = labels;
    if (typeof order === 'number') data.order = order;

    const category = await prisma.jobCategoryGroup.update({
      where: { id },
      data,
      include: { titles: true },
    });
    res.json({ ok: true, category });
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ ok: false, error: 'slug already exists' });
    console.error('[Admin] updateCategory error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * DELETE /api/admin/categories/:id
 */
export async function deleteCategory(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.jobCategoryGroup.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Admin] deleteCategory error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * POST /api/admin/categories/:id/titles
 */
export async function createCategoryTitle(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { key, labels } = req.body;
    if (!key || !labels) return res.status(400).json({ ok: false, error: 'key and labels required' });

    const title = await prisma.jobCategoryTitle.create({
      data: { categoryId: id, key, labels },
    });
    res.json({ ok: true, title });
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ ok: false, error: 'key already exists' });
    console.error('[Admin] createCategoryTitle error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * PUT /api/admin/categories/:catId/titles/:titleId
 */
export async function updateCategoryTitle(req: AuthenticatedRequest, res: Response) {
  try {
    const { titleId } = req.params;
    const { key, labels } = req.body;
    const data: any = {};
    if (typeof key === 'string') data.key = key;
    if (labels) data.labels = labels;

    const title = await prisma.jobCategoryTitle.update({
      where: { id: titleId },
      data,
    });
    res.json({ ok: true, title });
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ ok: false, error: 'key already exists' });
    console.error('[Admin] updateCategoryTitle error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * DELETE /api/admin/categories/:catId/titles/:titleId
 */
export async function deleteCategoryTitle(req: AuthenticatedRequest, res: Response) {
  try {
    const { titleId } = req.params;
    await prisma.jobCategoryTitle.delete({ where: { id: titleId } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Admin] deleteCategoryTitle error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * POST /api/admin/categories/seed
 * Seed categories from the static jobCategories file (one-time import).
 */
export async function seedCategories(req: AuthenticatedRequest, res: Response) {
  try {
    const count = await prisma.jobCategoryGroup.count();
    if (count > 0) return res.status(400).json({ ok: false, error: 'Categories already seeded' });

    const { JOB_CATEGORIES } = await import('@jmp/shared');
    for (let i = 0; i < JOB_CATEGORIES.length; i++) {
      const cat = JOB_CATEGORIES[i];
      await prisma.jobCategoryGroup.create({
        data: {
          slug: cat.slug,
          icon: cat.icon,
          labels: cat.labels,
          order: i,
          titles: {
            create: cat.titles.map((t) => ({ key: t.key, labels: t.labels })),
          },
        },
      });
    }
    res.json({ ok: true, imported: JOB_CATEGORIES.length });
  } catch (err) {
    console.error('[Admin] seedCategories error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

// ─── SEO per Page ───────────────────────────────────────────────

/**
 * GET /api/admin/seo-pages
 */
export async function listSeoPages(req: AuthenticatedRequest, res: Response) {
  try {
    const pages = await prisma.seoPage.findMany({ orderBy: [{ pageKey: 'asc' }, { locale: 'asc' }] });
    res.json({ ok: true, pages });
  } catch (err) {
    console.error('[Admin] listSeoPages error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * PUT /api/admin/seo-pages
 * Upsert SEO entry for a page+locale.
 */
export async function upsertSeoPage(req: AuthenticatedRequest, res: Response) {
  try {
    const { pageKey, locale, title, description } = req.body;
    if (!pageKey || !locale) return res.status(400).json({ ok: false, error: 'pageKey and locale required' });

    const page = await prisma.seoPage.upsert({
      where: { pageKey_locale: { pageKey, locale } },
      create: { pageKey, locale, title: title || null, description: description || null },
      update: { title: title || null, description: description || null },
    });
    res.json({ ok: true, page });
  } catch (err) {
    console.error('[Admin] upsertSeoPage error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * DELETE /api/admin/seo-pages/:id
 */
export async function deleteSeoPage(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.seoPage.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Admin] deleteSeoPage error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * POST /api/admin/seo-pages/seed
 * Seed default SEO entries for all pages and locales.
 */
export async function seedSeoPages(req: AuthenticatedRequest, res: Response) {
  try {
    const count = await prisma.seoPage.count();
    if (count > 0) return res.status(400).json({ ok: false, error: 'SEO pages already seeded' });

    const defaults: Record<string, Record<string, { title: string; description: string }>> = {
      home: {
        de: { title: 'Jobs in Europa – gjej-pune.com', description: 'Finde Jobs und Talente in Albanien, Kosovo und ganz Europa – einfach, schnell und sicher.' },
        en: { title: 'Jobs in Europe – gjej-pune.com', description: 'Find jobs and talent in Albania, Kosovo and across Europe — simple, fast, and trusted.' },
        fr: { title: 'Emplois en Europe – gjej-pune.com', description: "Trouvez des emplois et des talents en Albanie, au Kosovo et dans toute l'Europe — simple, rapide et fiable." },
        it: { title: 'Lavoro in Europa – gjej-pune.com', description: 'Trova lavoro e talenti in Europa — semplice, veloce e affidabile.' },
        sq: { title: 'Punë në Evropë – gjej-pune.com', description: 'Gjej punë dhe talente në Shqipëri, Kosovë dhe në gjithë Evropën — thjesht, shpejt dhe me besim.' },
      },
      jobs: {
        de: { title: 'Stellenangebote – gjej-pune.com', description: 'Durchsuche aktuelle Stellenangebote in Albanien, Kosovo und Europa. Finde deinen nächsten Job.' },
        en: { title: 'Job Listings – gjej-pune.com', description: 'Browse current job listings in Albania, Kosovo and Europe. Find your next opportunity.' },
        fr: { title: 'Offres d\'emploi – gjej-pune.com', description: 'Parcourez les offres d\'emploi actuelles en Albanie, au Kosovo et en Europe.' },
        it: { title: 'Offerte di lavoro – gjej-pune.com', description: 'Sfoglia le offerte di lavoro attuali in Albania, Kosovo e in Europa.' },
        sq: { title: 'Shpalljet e punës – gjej-pune.com', description: 'Shfleto shpalljet aktuale të punës në Shqipëri, Kosovë dhe Evropë.' },
      },
      'job-seekers': {
        de: { title: 'Kandidaten finden – gjej-pune.com', description: 'Entdecke qualifizierte Kandidaten für dein Unternehmen.' },
        en: { title: 'Find Candidates – gjej-pune.com', description: 'Discover qualified candidates for your company.' },
        fr: { title: 'Trouver des candidats – gjej-pune.com', description: 'Découvrez des candidats qualifiés pour votre entreprise.' },
        it: { title: 'Trova candidati – gjej-pune.com', description: 'Scopri candidati qualificati per la tua azienda.' },
        sq: { title: 'Gjej kandidatë – gjej-pune.com', description: 'Zbulo kandidatë të kualifikuar për kompaninë tënde.' },
      },
      about: {
        de: { title: 'Über uns – gjej-pune.com', description: 'Erfahre mehr über gjej-pune.com und unsere Mission, Arbeitssuchende mit Arbeitgebern zu verbinden.' },
        en: { title: 'About Us – gjej-pune.com', description: 'Learn more about gjej-pune.com and our mission to connect job seekers with employers.' },
        fr: { title: 'À propos – gjej-pune.com', description: 'Découvrez gjej-pune.com et notre mission de connecter chercheurs d\'emploi et employeurs.' },
        it: { title: 'Chi siamo – gjej-pune.com', description: 'Scopri di più su gjej-pune.com e la nostra missione di connettere candidati e datori di lavoro.' },
        sq: { title: 'Rreth nesh – gjej-pune.com', description: 'Mëso më shumë rreth gjej-pune.com dhe misionin tonë për të lidhur punëkërkuesit me punëdhënësit.' },
      },
      contact: {
        de: { title: 'Kontakt – gjej-pune.com', description: 'Kontaktiere uns bei Fragen oder Anliegen. Wir sind für dich da.' },
        en: { title: 'Contact – gjej-pune.com', description: 'Get in touch with us for questions or concerns. We are here for you.' },
        fr: { title: 'Contact – gjej-pune.com', description: 'Contactez-nous pour toute question ou demande. Nous sommes là pour vous.' },
        it: { title: 'Contatto – gjej-pune.com', description: 'Contattaci per domande o richieste. Siamo qui per te.' },
        sq: { title: 'Kontakt – gjej-pune.com', description: 'Na kontaktoni për çdo pyetje ose kërkesë. Jemi këtu për ju.' },
      },
      pricing: {
        de: { title: 'Preise – gjej-pune.com', description: 'Unsere Abonnements und Preise für Arbeitgeber.' },
        en: { title: 'Pricing – gjej-pune.com', description: 'Our subscription plans and pricing for employers.' },
        fr: { title: 'Tarifs – gjej-pune.com', description: 'Nos abonnements et tarifs pour les employeurs.' },
        it: { title: 'Prezzi – gjej-pune.com', description: 'I nostri abbonamenti e prezzi per i datori di lavoro.' },
        sq: { title: 'Çmimet – gjej-pune.com', description: 'Planet tona të abonimit dhe çmimet për punëdhënësit.' },
      },
      login: {
        de: { title: 'Anmelden – gjej-pune.com', description: 'Melde dich bei deinem Konto an.' },
        en: { title: 'Log In – gjej-pune.com', description: 'Sign in to your account.' },
        fr: { title: 'Connexion – gjej-pune.com', description: 'Connectez-vous à votre compte.' },
        it: { title: 'Accedi – gjej-pune.com', description: 'Accedi al tuo account.' },
        sq: { title: 'Hyr – gjej-pune.com', description: 'Hyr në llogarinë tënde.' },
      },
      register: {
        de: { title: 'Registrieren – gjej-pune.com', description: 'Erstelle ein kostenloses Konto und starte durch.' },
        en: { title: 'Register – gjej-pune.com', description: 'Create a free account and get started.' },
        fr: { title: 'Inscription – gjej-pune.com', description: 'Créez un compte gratuit et commencez.' },
        it: { title: 'Registrati – gjej-pune.com', description: 'Crea un account gratuito e inizia.' },
        sq: { title: 'Regjistrohu – gjej-pune.com', description: 'Krijo një llogari falas dhe fillo.' },
      },
      privacy: {
        de: { title: 'Datenschutz – gjej-pune.com', description: 'Unsere Datenschutzrichtlinie erklärt, wie wir deine Daten schützen.' },
        en: { title: 'Privacy Policy – gjej-pune.com', description: 'Our privacy policy explains how we protect your data.' },
        fr: { title: 'Politique de confidentialité – gjej-pune.com', description: 'Notre politique de confidentialité explique comment nous protégeons vos données.' },
        it: { title: 'Privacy – gjej-pune.com', description: 'La nostra informativa sulla privacy spiega come proteggiamo i tuoi dati.' },
        sq: { title: 'Privatësia – gjej-pune.com', description: 'Politika jonë e privatësisë shpjegon si i mbrojmë të dhënat tuaja.' },
      },
      imprint: {
        de: { title: 'Impressum – gjej-pune.com', description: 'Rechtliche Informationen und Impressum.' },
        en: { title: 'Imprint – gjej-pune.com', description: 'Legal information and imprint.' },
        fr: { title: 'Mentions légales – gjej-pune.com', description: 'Informations légales et mentions légales.' },
        it: { title: 'Impressum – gjej-pune.com', description: 'Informazioni legali e impressum.' },
        sq: { title: 'Imprint – gjej-pune.com', description: 'Informacione ligjore dhe imprint.' },
      },
      terms: {
        de: { title: 'AGB – gjej-pune.com', description: 'Allgemeine Geschäftsbedingungen von gjej-pune.com.' },
        en: { title: 'Terms of Service – gjej-pune.com', description: 'Terms and conditions of gjej-pune.com.' },
        fr: { title: 'Conditions générales – gjej-pune.com', description: 'Conditions générales de gjej-pune.com.' },
        it: { title: 'Termini di servizio – gjej-pune.com', description: 'Termini e condizioni di gjej-pune.com.' },
        sq: { title: 'Kushtet e shërbimit – gjej-pune.com', description: 'Kushtet dhe rregullat e gjej-pune.com.' },
      },
    };

    const data: { pageKey: string; locale: string; title: string; description: string }[] = [];
    for (const [pageKey, locales] of Object.entries(defaults)) {
      for (const [locale, { title, description }] of Object.entries(locales)) {
        data.push({ pageKey, locale, title, description });
      }
    }

    await prisma.seoPage.createMany({ data });
    res.json({ ok: true, imported: data.length });
  } catch (err) {
    console.error('[Admin] seedSeoPages error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}

/**
 * GET /api/seo?pageKey=home&locale=de  (public endpoint)
 */
export async function getSeoForPage(req: AuthenticatedRequest, res: Response) {
  try {
    const pageKey = req.query.pageKey as string;
    const locale = req.query.locale as string;
    if (!pageKey || !locale) return res.status(400).json({ ok: false, error: 'pageKey and locale required' });

    const page = await prisma.seoPage.findUnique({
      where: { pageKey_locale: { pageKey, locale } },
    });
    res.json({ ok: true, page });
  } catch (err) {
    console.error('[Admin] getSeoForPage error:', err);
    res.status(500).json({ ok: false, error: 'internal' });
  }
}
