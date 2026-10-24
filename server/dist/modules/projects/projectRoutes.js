"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projectController_1 = require("./projectController");
const portfolioController_1 = require("../portfolio/portfolioController");
const auth_1 = require("../../middleware/auth");
const roleCheck_1 = require("../../middleware/roleCheck");
const router = (0, express_1.Router)();
// Handle GET / - if authorized with Bearer token, return ERP projects; otherwise return public portfolio projects
router.get('/', (req, res, next) => {
    if (req.headers.authorization && req.query.mode !== 'portfolio') {
        (0, auth_1.authenticate)(req, res, () => (0, projectController_1.getProjects)(req, res, next));
    }
    else {
        (0, portfolioController_1.getPublicProjects)(req, res, next);
    }
});
// Dashboard stats for staff
router.get('/stats/dashboard', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager', 'accounts'), projectController_1.getDashboardStats);
// Welcome PDF for project workspace & client invitation (supports direct browser download and query token)
router.get('/:id/welcome-pdf', auth_1.optionalAuthenticate, projectController_1.downloadProjectWelcomePDF);
// Handle GET /:id - if authorized and valid ObjectId, return ERP project; otherwise return public portfolio project by slug
router.get('/:id', (req, res, next) => {
    const { id } = req.params;
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);
    if (req.headers.authorization && isMongoId && req.query.mode !== 'portfolio') {
        (0, auth_1.authenticate)(req, res, () => (0, projectController_1.getProjectById)(req, res, next));
    }
    else {
        (0, portfolioController_1.getPublicProjectBySlug)(req, res, next);
    }
});
// Staff creation & modification routes
router.post('/', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), projectController_1.createProject);
router.patch('/:id', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), projectController_1.updateProject);
router.patch('/milestones/:id', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager', 'site_supervisor'), projectController_1.updateMilestone);
exports.default = router;
