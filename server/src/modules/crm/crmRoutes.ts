import { Router } from 'express';
import { createEnquiry, getLeads, updateLeadStatus, convertLeadToProject } from './crmController';
import { authenticate } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roleCheck';

const router = Router();

// Public route for enquiry submission from website & cost estimator
router.post('/enquiries', createEnquiry);

// Protected routes for staff
router.get('/leads', authenticate, requireRoles('super_admin', 'project_manager'), getLeads);
router.patch('/leads/:id/status', authenticate, requireRoles('super_admin', 'project_manager'), updateLeadStatus);
router.post('/leads/:id/convert', authenticate, requireRoles('super_admin', 'project_manager'), convertLeadToProject);

export default router;
