import { Router } from 'express';
import {
  getInvoices,
  createInvoice,
  downloadInvoicePDF,
  getExpenses,
  createExpense,
  getPayments,
  recordPayment,
  getProfitabilityReport,
} from './financeController';
import { authenticate } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roleCheck';

const router = Router();

router.use(authenticate);

router.get('/invoices', getInvoices);
router.post('/invoices', requireRoles('super_admin', 'accounts'), createInvoice);
router.get('/invoices/:id/pdf', downloadInvoicePDF);

router.get('/expenses', requireRoles('super_admin', 'project_manager', 'accounts', 'site_supervisor'), getExpenses);
router.post('/expenses', requireRoles('super_admin', 'project_manager', 'accounts', 'site_supervisor'), createExpense);

router.get('/payments', getPayments);
router.post('/payments', requireRoles('super_admin', 'accounts'), recordPayment);

router.get('/profitability/:projectId', requireRoles('super_admin', 'project_manager', 'accounts'), getProfitabilityReport);

export default router;
