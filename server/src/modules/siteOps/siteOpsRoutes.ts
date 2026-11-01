import { Router } from 'express';
import multer from 'multer';
import { getSiteReports, createSiteReport, togglePublishReport, uploadSitePhoto } from './siteOpsController';
import { authenticate } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roleCheck';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max photo size
});

router.use(authenticate);

router.get('/reports', getSiteReports);
router.post('/reports', requireRoles('super_admin', 'project_manager', 'site_supervisor'), createSiteReport);
router.patch('/reports/:id/publish', requireRoles('super_admin', 'project_manager'), togglePublishReport);

// Direct upload photo endpoint for Site Diary with automatic Google Drive project folder sync
router.post(
  '/upload-photo',
  requireRoles('super_admin', 'project_manager', 'site_supervisor'),
  upload.single('photo'),
  uploadSitePhoto
);

export default router;
