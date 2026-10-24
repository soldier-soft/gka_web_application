import { Router } from 'express';
import {
  getMyProjects,
  getClientProjectDetails,
  submitPaymentNotification,
  submitFeedback,
  getClientFeedback,
} from './clientPortalController';
import { authenticate } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roleCheck';

const router = Router();

router.use(authenticate);
router.use(requireRoles('client', 'super_admin'));

router.get('/my-projects', getMyProjects);
router.get('/projects/:id', getClientProjectDetails);
router.post('/payments/submit-notification', submitPaymentNotification);
router.post('/feedback', submitFeedback);
router.get('/feedback', getClientFeedback);

export default router;
