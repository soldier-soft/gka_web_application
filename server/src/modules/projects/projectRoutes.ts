import { Router, Request, Response, NextFunction } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  updateMilestone,
  getDashboardStats,
  downloadProjectWelcomePDF,
} from './projectController';
import { getPublicProjects, getPublicProjectBySlug } from '../portfolio/portfolioController';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roleCheck';

const router = Router();

// Handle GET / - if authorized with Bearer token, return ERP projects; otherwise return public portfolio projects
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization && req.query.mode !== 'portfolio') {
    authenticate(req, res, () => getProjects(req, res, next));
  } else {
    getPublicProjects(req, res, next);
  }
});

// Dashboard stats for staff
router.get('/stats/dashboard', authenticate, requireRoles('super_admin', 'project_manager', 'accounts'), getDashboardStats);

// Welcome PDF for project workspace & client invitation (supports direct browser download and query token)
router.get('/:id/welcome-pdf', optionalAuthenticate, downloadProjectWelcomePDF);

// Handle GET /:id - if authorized and valid ObjectId, return ERP project; otherwise return public portfolio project by slug
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);

  if (req.headers.authorization && isMongoId && req.query.mode !== 'portfolio') {
    authenticate(req, res, () => getProjectById(req, res, next));
  } else {
    getPublicProjectBySlug(req, res, next);
  }
});

// Staff creation & modification routes
router.post('/', authenticate, requireRoles('super_admin', 'project_manager'), createProject);
router.patch('/:id', authenticate, requireRoles('super_admin', 'project_manager'), updateProject);
router.put('/:id', authenticate, requireRoles('super_admin', 'project_manager'), updateProject);
router.patch('/milestones/:id', authenticate, requireRoles('super_admin', 'project_manager', 'site_supervisor'), updateMilestone);

export default router;

