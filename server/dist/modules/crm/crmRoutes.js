"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crmController_1 = require("./crmController");
const auth_1 = require("../../middleware/auth");
const roleCheck_1 = require("../../middleware/roleCheck");
const router = (0, express_1.Router)();
// Public route for enquiry submission from website & cost estimator
router.post('/enquiries', crmController_1.createEnquiry);
// Protected routes for staff
router.get('/leads', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), crmController_1.getLeads);
router.patch('/leads/:id/status', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), crmController_1.updateLeadStatus);
router.post('/leads/:id/convert', auth_1.authenticate, (0, roleCheck_1.requireRoles)('super_admin', 'project_manager'), crmController_1.convertLeadToProject);
exports.default = router;
