import { Router } from 'express';
import {
  getPublicProjects,
  getPublicProjectBySlug,
  adminCreateProject,
  adminUpdateProject,
  adminDeleteProject,
  getProjectIdeas,
  getProjectIdeaBySlug,
  adminCreateProjectIdea,
  adminUpdateProjectIdea,
  adminDeleteProjectIdea,
  createPublicEnquiry,
  getEnquiries,
  updateEnquiryStatus,
} from './portfolioController';
import { authenticate } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roleCheck';

const router = Router();

// ==========================================
// Public Portfolio & Project Ideas Routes
// ==========================================

router.get('/projects', getPublicProjects);
router.get('/projects/:slug', getPublicProjectBySlug);

router.get('/project-ideas', getProjectIdeas);
router.get('/project-ideas/:slug', getProjectIdeaBySlug);

router.post('/enquiries', createPublicEnquiry);

// ==========================================
// Protected Administrative Management Routes
// ==========================================

router.post('/admin/projects', authenticate, requireRoles('super_admin', 'project_manager'), adminCreateProject);
router.patch('/admin/projects/:id', authenticate, requireRoles('super_admin', 'project_manager'), adminUpdateProject);
router.delete('/admin/projects/:id', authenticate, requireRoles('super_admin', 'project_manager'), adminDeleteProject);

router.post('/admin/project-ideas', authenticate, requireRoles('super_admin', 'project_manager'), adminCreateProjectIdea);
router.patch('/admin/project-ideas/:id', authenticate, requireRoles('super_admin', 'project_manager'), adminUpdateProjectIdea);
router.delete('/admin/project-ideas/:id', authenticate, requireRoles('super_admin', 'project_manager'), adminDeleteProjectIdea);

router.get('/admin/enquiries', authenticate, requireRoles('super_admin', 'project_manager'), getEnquiries);
router.patch('/admin/enquiries/:id/status', authenticate, requireRoles('super_admin', 'project_manager'), updateEnquiryStatus);

export default router;
