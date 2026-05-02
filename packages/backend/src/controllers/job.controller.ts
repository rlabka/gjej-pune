import { Request, Response } from 'express';
import { createJob, getJobs, getJobsByUser, getJobById, updateJob, deleteJob, getJobCategories, getRecommendedJobs, getEmployerAnalytics, getMatchingCandidates } from '../services/job.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { recordProfileView } from '../services/profileView.service';
import { createNotification } from '../services/notification.service';

export async function create(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const job = await createJob({ ...req.body, userId: req.user.id });

    // Notify: job is now online
    createNotification(
      req.user.id, 'ad_online',
      'ad_online',
      '',
      { adTitle: (job as any).title || (job as any).category || '', targetType: 'job', targetId: (job as any).id }
    ).catch(() => {});

    return res.status(201).json({ ok: true, job });
  } catch (error) {
    console.error('Create job error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function list(req: Request, res: Response) {
  try {
    const { keyword, location, lat, lng, radius, category, when, salaryMin, salaryMax, posted, sort, page, limit } = req.query;
    const result = await getJobs({
      keyword: keyword as string,
      location: location as string,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      radius: radius ? Number(radius) : undefined,
      category: category as string,
      when: when as string,
      salaryMin: salaryMin ? Number(salaryMin) : undefined,
      salaryMax: salaryMax ? Number(salaryMax) : undefined,
      posted: posted as string,
      sort: sort as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    // Strip companyName + contact details from public listing (prevent bypassing platform)
    const sanitized = {
      ...result,
      jobs: result.jobs.map(({ companyName, contactName, contactSurname, contactPhone, contactEmail, ...rest }: any) => rest),
    };
    return res.json({ ok: true, ...sanitized });
  } catch (error) {
    console.error('List jobs error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function categories(_req: Request, res: Response) {
  try {
    const cats = await getJobCategories();
    return res.json({ ok: true, categories: cats });
  } catch (error) {
    console.error('Categories error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function myJobs(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const jobs = await getJobsByUser(req.user.id);
    return res.json({ ok: true, jobs });
  } catch (error) {
    console.error('My jobs error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const viewerId = (req as any).user?.id;
    // First fetch without view tracking to check ownership
    const jobCheck = await getJobById(String(req.params.id));
    if (!jobCheck) return res.status(404).json({ error: 'notFound' });
    const viewerIsOwner = viewerId && jobCheck.userId === viewerId;
    // Only track views for non-owners
    const viewerKey = viewerIsOwner ? undefined : (viewerId || req.ip || 'anonymous');
    const job = (viewerKey ? await getJobById(String(req.params.id), viewerKey) : jobCheck)!;
    // Track profile view if logged in and not owner
    if (viewerId && !viewerIsOwner) {
      recordProfileView(viewerId, job.userId, 'job', job.id).catch(() => {});
    }
    if (viewerIsOwner) {
      return res.json({ ok: true, job });
    }
    const { companyName: _cn, contactName: _cN, contactSurname: _cS, contactPhone: _cP, contactEmail: _cE, ...safeJob } = job as any;
    return res.json({ ok: true, job: safeJob });
  } catch (error) {
    console.error('Get job error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function update(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const job = await updateJob(String(req.params.id), req.user.id, req.body);
    if (!job) return res.status(404).json({ error: 'notFound' });
    return res.json({ ok: true, job });
  } catch (error) {
    console.error('Update job error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function recommended(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const jobs = await getRecommendedJobs(req.user.id);
    const sanitized = jobs.map(({ companyName, contactName, contactSurname, contactPhone, contactEmail, ...rest }: any) => rest);
    return res.json({ ok: true, jobs: sanitized });
  } catch (error) {
    console.error('Recommended jobs error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function matchingCandidates(req: Request<Record<string, string>>, res: Response) {
  try {
    const jobId = req.params.id;
    const candidates = await getMatchingCandidates(jobId);
    // Strip surname + phone for public listing
    const sanitized = candidates.map(({ surname, phone, email, ...rest }: any) => rest);
    return res.json({ ok: true, candidates: sanitized });
  } catch (error) {
    console.error('Matching candidates error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function analytics(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const data = await getEmployerAnalytics(req.user.id);
    return res.json({ ok: true, ...data });
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const ok = await deleteJob(String(req.params.id), req.user.id);
    if (!ok) return res.status(404).json({ error: 'notFound' });
    return res.json({ ok: true });
  } catch (error) {
    console.error('Delete job error:', error);
    return res.status(500).json({ error: 'internalError' });
  }
}
