import { Router } from 'express';
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from './documentController';
import { authenticate } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roleCheck';

const router = Router();

// List documents (authenticated staff or client-filtered)
router.get('/', authenticate, getDocuments);
router.get('/:id', authenticate, getDocumentById);

// Staff creation
router.post('/', authenticate, requireRoles('super_admin', 'project_manager'), createDocument);

// Editing & Deletion (Owner / Super Admin)
router.put('/:id', authenticate, requireRoles('super_admin', 'project_manager'), updateDocument);
router.patch('/:id', authenticate, requireRoles('super_admin', 'project_manager'), updateDocument);
router.delete('/:id', authenticate, requireRoles('super_admin'), deleteDocument);

export default router;
