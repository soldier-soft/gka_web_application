import { Router } from 'express';
import {
  getRateLibrary,
  getQuotations,
  getQuotationById,
  createQuotation,
  approveQuotation,
  downloadQuotationPDF,
} from './quotationController';
import { authenticate } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roleCheck';

const router = Router();

// Allow public or authenticated rate library lookup
router.get('/rates/library', getRateLibrary);

router.use(authenticate);

router.get('/', getQuotations);
router.get('/:id', getQuotationById);
router.get('/:id/pdf', downloadQuotationPDF);
router.post('/', requireRoles('super_admin', 'project_manager'), createQuotation);
router.post('/:id/approve', requireRoles('super_admin', 'project_manager'), approveQuotation);

export default router;
