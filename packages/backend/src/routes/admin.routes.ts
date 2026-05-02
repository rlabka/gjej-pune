import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import {
  adminListHandler,
  adminActivateHandler,
  adminRejectHandler,
  adminDeleteHandler,
  adminUploadLogoHandler,
} from '../controllers/ad.controller';
import {
  listAdmins,
  createAdmin,
  deleteAdmin,
  updateAdminProfile,
  changeAdminPassword,
  getEmailSettings,
  updateEmailSettings,
  testEmail,
  listAllUsers,
  updateUser,
  deleteUser,
  resetUserPassword,
  listAllJobs,
  updateJob,
  deleteJob,
  listAllAds,
  updateAd,
  deleteAd,
  listPlans,
  createPlan,
  updatePlan,
  deletePlan,
  listPremiumUsers,
  adminCancelSubscriptionHandler,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createCategoryTitle,
  updateCategoryTitle,
  deleteCategoryTitle,
  seedCategories,
  listSeoPages,
  upsertSeoPage,
  deleteSeoPage,
  seedSeoPages,
  uploadUserImage,
} from '../controllers/admin.controller';

const router = Router();

// Multer for user profile images
const usersUploadsDir = path.resolve(__dirname, '../../uploads/users');
if (!fs.existsSync(usersUploadsDir)) fs.mkdirSync(usersUploadsDir, { recursive: true });

const userImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, usersUploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`),
});
const userImageUpload = multer({
  storage: userImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// All routes require admin role
router.use(requireAuth, requireRole('admin'));

// Admin user management
router.get('/users', listAdmins);
router.post('/users', createAdmin);
router.delete('/users/:id', deleteAdmin);

// Own profile
router.put('/profile', updateAdminProfile);
router.put('/password', changeAdminPassword);

// Email settings
router.get('/email-settings', getEmailSettings);
router.put('/email-settings', updateEmailSettings);
router.post('/email-settings/test', testEmail);

// All users management
router.get('/all-users', listAllUsers);
router.patch('/all-users/:id', updateUser);
router.post('/all-users/:id/reset-password', resetUserPassword);
router.post('/all-users/:id/upload-image', userImageUpload.single('image'), uploadUserImage);
router.delete('/all-users/:id', deleteUser);

// All jobs management
router.get('/all-jobs', listAllJobs);
router.patch('/all-jobs/:id', updateJob);
router.delete('/all-jobs/:id', deleteJob);

// All ads management (job seeker ads)
router.get('/all-ads', listAllAds);
router.patch('/all-ads/:id', updateAd);
router.delete('/all-ads/:id', deleteAd);

// Plan management
router.get('/plans', listPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);

// Premium users
router.get('/premium-users', listPremiumUsers);
router.post('/subscriptions/:id/cancel', adminCancelSubscriptionHandler);

// Category management
router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.post('/categories/seed', seedCategories);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.post('/categories/:id/titles', createCategoryTitle);
router.put('/categories/:catId/titles/:titleId', updateCategoryTitle);
router.delete('/categories/:catId/titles/:titleId', deleteCategoryTitle);

// SEO per page
router.get('/seo-pages', listSeoPages);
router.put('/seo-pages', upsertSeoPage);
router.post('/seo-pages/seed', seedSeoPages);
router.delete('/seo-pages/:id', deleteSeoPage);

// Ad placements (logo ads)
const adsDir = path.resolve(__dirname, '../../uploads/ads');
if (!fs.existsSync(adsDir)) fs.mkdirSync(adsDir, { recursive: true });
const adLogoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, adsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`),
});
const adLogoUpload = multer({ storage: adLogoStorage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/ad-placements', adminListHandler);
router.post('/ad-placements/:id/activate', adminActivateHandler);
router.post('/ad-placements/:id/reject', adminRejectHandler);
router.delete('/ad-placements/:id', adminDeleteHandler);
router.post('/ad-placements/:id/logo', adLogoUpload.single('logo'), adminUploadLogoHandler);

export default router;
