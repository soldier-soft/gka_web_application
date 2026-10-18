import { Router } from 'express';
import {
  getSuppliers,
  createSupplier,
  getPurchaseOrders,
  createPurchaseOrder,
  getInventoryTransactions,
  createInventoryTransaction,
  getStockSummary,
} from './inventoryController';
import { authenticate } from '../../middleware/auth';
import { requireRoles } from '../../middleware/roleCheck';

const router = Router();

router.use(authenticate);

router.get('/suppliers', getSuppliers);
router.post('/suppliers', requireRoles('super_admin', 'project_manager', 'accounts'), createSupplier);

router.get('/purchase-orders', getPurchaseOrders);
router.post('/purchase-orders', requireRoles('super_admin', 'project_manager', 'accounts'), createPurchaseOrder);

router.get('/transactions', getInventoryTransactions);
router.post('/transactions', requireRoles('super_admin', 'project_manager', 'site_supervisor'), createInventoryTransaction);

router.get('/stock-summary', getStockSummary);

export default router;
