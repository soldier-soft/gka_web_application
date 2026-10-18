import { Router } from 'express';
import { getSiteReports, createSiteReport, togglePublishReport } from './siteOpsController';
import { authenticate } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roleCheck';

const router = Router();

router.use(authenticate);

router.get('/reports', getSiteReports);
router.post('/reports', requireRoles('super_admin', 'project_manager', 'site_supervisor'), createSiteReport);
router.patch('/reports/:id/publish', requireRoles('super_admin', 'project_manager'), togglePublishReport);

export default router;
