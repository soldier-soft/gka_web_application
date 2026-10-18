import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  updateMilestone,
  getDashboardStats,
} from './projectController';
import { authenticate } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roleCheck';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.get('/stats/dashboard', requireRoles('super_admin', 'project_manager', 'accounts'), getDashboardStats);
router.get('/:id', getProjectById);
router.post('/', requireRoles('super_admin', 'project_manager'), createProject);
router.patch('/:id', requireRoles('super_admin', 'project_manager'), updateProject);
router.patch('/milestones/:id', requireRoles('super_admin', 'project_manager', 'site_supervisor'), updateMilestone);

export default router;
