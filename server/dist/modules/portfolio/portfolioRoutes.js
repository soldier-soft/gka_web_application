"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const portfolioController_1 = require("./portfolioController");
const auth_1 = require("../../middleware/auth");
const roleCheck_1 = require("../../middleware/roleCheck");
const router = (0, express_1.Router)();
// ==========================================
// Public Portfolio & Project Ideas Routes
// ==========================================
router.get('/projects', portfolioController_1.getPublicProjects);
router.get('/projects/:slug', portfolioController_1.getPublicProjectBySlug);
router.get('/project-ideas', portfolioController_1.getProjectIdeas);
router.get('/project-ideas/:slug', portfolioController_1.getProjectIdeaBySlug);
router.post('/enquiries', portfolioController_1.createPublicEnquiry);
// ==========================================
// Protected Administrative Management Routes
// ==========================================
router.post('/admin/projects', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), portfolioController_1.adminCreateProject);
router.patch('/admin/projects/:id', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), portfolioController_1.adminUpdateProject);
router.delete('/admin/projects/:id', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), portfolioController_1.adminDeleteProject);
router.post('/admin/project-ideas', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), portfolioController_1.adminCreateProjectIdea);
router.patch('/admin/project-ideas/:id', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), portfolioController_1.adminUpdateProjectIdea);
router.delete('/admin/project-ideas/:id', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), portfolioController_1.adminDeleteProjectIdea);
router.get('/admin/enquiries', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), portfolioController_1.getEnquiries);
router.patch('/admin/enquiries/:id/status', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), portfolioController_1.updateEnquiryStatus);
exports.default = router;
