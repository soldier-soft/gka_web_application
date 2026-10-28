import { Router } from 'express';
import {
  getRateLibrary,
  getQuotations,
  getQuotationById,
  createQuotation,
  approveQuotation,
  downloadQuotationPDF,
  downloadQuotationDOCX,
  convertToInvoice,
  updateQuotation,
} from './quotationController';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roleCheck';

const router = Router();

// Allow public or authenticated rate library lookup
router.get('/rates/library', getRateLibrary);

// PDF and DOCX downloads (supports query param token and direct quotation link)
router.get('/:id/pdf', optionalAuthenticate, downloadQuotationPDF);
router.get('/:id/docx', optionalAuthenticate, downloadQuotationDOCX);

router.use(authenticate);

router.get('/', getQuotations);
router.get('/:id', getQuotationById);
router.post('/', requireRoles('super_admin', 'project_manager'), createQuotation);
router.put('/:id', requireRoles('super_admin', 'project_manager'), updateQuotation);
router.patch('/:id', requireRoles('super_admin', 'project_manager'), updateQuotation);
router.post('/:id/approve', requireRoles('super_admin', 'project_manager'), approveQuotation);
router.post('/:id/convert-to-invoice', requireRoles('super_admin', 'project_manager', 'accounts'), convertToInvoice);

export default router;
