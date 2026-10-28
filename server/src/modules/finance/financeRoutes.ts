import { Router } from 'express';
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  toggleInvoiceGst,
  downloadInvoicePDF,
  downloadInvoiceDOCX,
  getExpenses,
  createExpense,
  getPayments,
  recordPayment,
  verifyPayment,
  reconcilePayment,
  rejectPayment,
  getProfitabilityReport,
  getTaxReconciliations,
  updateEligibleItc,
  recordTaxPayment,
  recordTaxFiling,
} from './financeController';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roleCheck';

const router = Router();

// Invoice PDF & DOCX downloads (supports query param token and direct browser viewing)
router.get('/invoices/:id/pdf', optionalAuthenticate, downloadInvoicePDF);
router.get('/invoices/:id/docx', optionalAuthenticate, downloadInvoiceDOCX);

router.use(authenticate);

router.get('/invoices', getInvoices);
router.post('/invoices', requireRoles('super_admin', 'accounts'), createInvoice);
router.put('/invoices/:id', requireRoles('super_admin', 'accounts'), updateInvoice);
router.patch('/invoices/:id', requireRoles('super_admin', 'accounts'), updateInvoice);
router.patch('/invoices/:id/gst-toggle', requireRoles('super_admin', 'accounts'), toggleInvoiceGst);

router.get('/expenses', requireRoles('super_admin', 'project_manager', 'accounts', 'site_supervisor'), getExpenses);
router.post('/expenses', requireRoles('super_admin', 'project_manager', 'accounts', 'site_supervisor'), createExpense);

router.get('/payments', getPayments);
router.post('/payments', requireRoles('super_admin', 'accounts'), recordPayment);
router.patch('/payments/:id/verify', requireRoles('super_admin', 'accounts'), verifyPayment);
router.patch('/payments/:id/reconcile', requireRoles('super_admin', 'accounts'), reconcilePayment);
router.patch('/payments/:id/reject', requireRoles('super_admin', 'accounts'), rejectPayment);

router.get('/profitability/:projectId', requireRoles('super_admin', 'project_manager', 'accounts'), getProfitabilityReport);

// GST & Tax Reconciliation (Owner & Accounts ONLY)
router.get('/gst/periods', requireRoles('super_admin', 'accounts'), getTaxReconciliations);
router.patch('/gst/periods/:id/eligible-itc', requireRoles('super_admin', 'accounts'), updateEligibleItc);
router.post('/gst/periods/:id/payment', requireRoles('super_admin', 'accounts'), recordTaxPayment);
router.post('/gst/periods/:id/filing', requireRoles('super_admin', 'accounts'), recordTaxFiling);

export default router;
