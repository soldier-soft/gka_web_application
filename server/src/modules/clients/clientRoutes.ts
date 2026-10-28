import { Router } from 'express';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from './clientController';
import { authenticate } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roleCheck';

const router = Router();

router.use(authenticate);

// Staff lookup routes
router.get('/', requireRoles('super_admin', 'project_manager', 'accounts'), getClients);
router.get('/:id', requireRoles('super_admin', 'project_manager', 'accounts'), getClientById);

// Staff creation & modification routes
router.post('/', requireRoles('super_admin', 'project_manager'), createClient);
router.put('/:id', requireRoles('super_admin', 'project_manager'), updateClient);
router.delete('/:id', requireRoles('super_admin'), deleteClient);

export default router;
