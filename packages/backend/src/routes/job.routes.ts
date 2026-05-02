import { Router } from 'express';
import { create, list, categories, myJobs, getOne, update, remove, recommended, analytics, matchingCandidates } from '../controllers/job.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const createJobRules = [
  { field: 'category', required: true, type: 'string' as const, minLength: 2, maxLength: 100 },
  { field: 'contactName', required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
  { field: 'contactSurname', required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
  { field: 'contactPhone', required: true, type: 'phone' as const },
  { field: 'contactEmail', type: 'email' as const },
  { field: 'companyName', type: 'string' as const, maxLength: 200 },
  { field: 'salary', required: true, type: 'number' as const, min: 5, max: 1000000 },
  { field: 'salaryType', required: true, oneOf: ['Hour', 'Month', 'Year', 'Provision'] },
  { field: 'currency', type: 'string' as const, maxLength: 5 },
  { field: 'locationState', required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
  { field: 'locationCity', required: true, type: 'string' as const, minLength: 1, maxLength: 100 },
  { field: 'when', oneOf: ['Urgent', 'Negotiation'] },
  { field: 'description', type: 'string' as const, maxLength: 5000 },
];

const updateJobRules = [
  { field: 'category', type: 'string' as const, minLength: 2, maxLength: 100 },
  { field: 'contactName', type: 'string' as const, minLength: 1, maxLength: 100 },
  { field: 'contactSurname', type: 'string' as const, minLength: 1, maxLength: 100 },
  { field: 'contactPhone', type: 'phone' as const },
  { field: 'contactEmail', type: 'email' as const },
  { field: 'salary', type: 'number' as const, min: 5, max: 1000000 },
  { field: 'salaryType', oneOf: ['Hour', 'Month', 'Year', 'Provision'] },
  { field: 'currency', type: 'string' as const, maxLength: 5 },
  { field: 'locationState', type: 'string' as const, maxLength: 100 },
  { field: 'locationCity', type: 'string' as const, maxLength: 100 },
  { field: 'when', oneOf: ['Urgent', 'Negotiation'] },
  { field: 'status', oneOf: ['Active', 'Paused', 'Closed'] },
  { field: 'description', type: 'string' as const, maxLength: 5000 },
];

const router = Router();

router.get('/', list);                                          // GET  /api/jobs          (public, paginated)
router.get('/categories', categories);                           // GET  /api/jobs/categories (public)
router.get('/mine', requireAuth, myJobs);                       // GET  /api/jobs/mine     (auth)
router.get('/recommended', requireAuth, recommended);           // GET  /api/jobs/recommended (auth)
router.get('/analytics', requireAuth, analytics);              // GET  /api/jobs/analytics  (auth)
router.get('/:id/matching-candidates', matchingCandidates);        // GET  /api/jobs/:id/matching-candidates (public)
router.get('/:id', optionalAuth as any, getOne);                  // GET  /api/jobs/:id      (public, optional auth for profile view tracking)
router.post('/', requireAuth, validate(createJobRules), create); // POST /api/jobs          (auth, validated)
router.put('/:id', requireAuth, validate(updateJobRules), update); // PUT /api/jobs/:id    (auth, validated)
router.delete('/:id', requireAuth, remove);                     // DEL  /api/jobs/:id      (auth)

export default router;
