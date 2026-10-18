import { Request, Response, NextFunction } from 'express';
import { Supplier } from '../../models/Supplier';
import { PurchaseOrder } from '../../models/PurchaseOrder';
import { InventoryTransaction } from '../../models/InventoryTransaction';
import { toPaise } from '../../shared/types';

export const getSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json({ success: true, count: suppliers.length, suppliers });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, supplier });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;

    const purchaseOrders = await PurchaseOrder.find(filter)
      .populate('projectId', 'title projectId')
      .populate('supplierId', 'name phone email category')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: purchaseOrders.length, purchaseOrders });
  } catch (error) {
    next(error);
  }
};

export const createPurchaseOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, projectTitle, supplierId, supplierName, items, deliveryAddress, expectedDeliveryDate, notes } = req.body;

    let subtotalPaise = 0;
    const calculatedItems = (items || []).map((item: any) => {
      const qty = Number(item.quantityOrdered) || 0;
      const rate = Number(item.unitRatePaise) || 0;
      const total = Math.round(qty * rate);
      subtotalPaise += total;

      return {
        itemDescription: item.itemDescription,
        unit: item.unit,
        quantityOrdered: qty,
        quantityReceived: 0,
        unitRatePaise: rate,
        totalPaise: total,
      };
    });

    const taxPaise = Math.round(subtotalPaise * 0.18); // 18% GST standard on materials
    const grandTotalPaise = subtotalPaise + taxPaise;

    const count = await PurchaseOrder.countDocuments();
    const currentYear = new Date().getFullYear();
    const poNumber = `GKA-PO-${currentYear}-${String(count + 1).padStart(3, '0')}`;

    const po = await PurchaseOrder.create({
      poNumber,
      projectId,
      projectTitle,
      supplierId,
      supplierName,
      items: calculatedItems,
      subtotalPaise,
      taxPaise,
      grandTotalPaise,
      status: 'issued',
      deliveryAddress,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      notes,
      approvedBy: req.user?.id,
    });

    res.status(201).json({ success: true, purchaseOrder: po });
  } catch (error) {
    next(error);
  }
};

export const getInventoryTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, materialName } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (materialName) filter.materialName = materialName;

    const transactions = await InventoryTransaction.find(filter)
      .populate('projectId', 'title projectId')
      .populate('recordedBy', 'name')
      .sort({ date: -1 });

    res.json({ success: true, count: transactions.length, transactions });
  } catch (error) {
    next(error);
  }
};

export const createInventoryTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      projectId,
      materialName,
      category,
      transactionType,
      quantity,
      unit,
      unitCostPaise,
      referencePoId,
      notes,
      date,
    } = req.body;

    const qty = Number(quantity);
    const unitCost = Number(unitCostPaise) || 0;
    const totalValuePaise = Math.round(qty * unitCost);

    const transaction = await InventoryTransaction.create({
      projectId,
      materialName: materialName.trim(),
      category: category || 'General',
      transactionType,
      quantity: qty,
      unit,
      unitCostPaise: unitCost,
      totalValuePaise,
      referencePoId,
      notes,
      recordedBy: req.user?.id,
      date: date ? new Date(date) : new Date(),
    });

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
};

/**
 * Live Stock Balances computed dynamically from transaction records!
 */
export const getStockSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const aggregation = await InventoryTransaction.aggregate([
      {
        $group: {
          _id: {
            materialName: '$materialName',
            unit: '$unit',
            category: '$category',
          },
          totalReceived: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'purchase_receipt'] }, '$quantity', 0],
            },
          },
          totalIssued: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'site_issue'] }, '$quantity', 0],
            },
          },
          totalReturned: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'site_return'] }, '$quantity', 0],
            },
          },
          totalWasted: {
            $sum: {
              $cond: [{ $eq: ['$transactionType', 'wastage'] }, '$quantity', 0],
            },
          },
          lastUnitCostPaise: { $last: '$unitCostPaise' },
        },
      },
      {
        $project: {
          materialName: '$_id.materialName',
          unit: '$_id.unit',
          category: '$_id.category',
          totalReceived: 1,
          totalIssued: 1,
          totalReturned: 1,
          totalWasted: 1,
          currentStock: {
            $subtract: [
              { $add: ['$totalReceived', '$totalReturned'] },
              { $add: ['$totalIssued', '$totalWasted'] },
            ],
          },
          lastUnitCostPaise: 1,
        },
      },
      { $sort: { materialName: 1 } },
    ]);

    res.json({ success: true, count: aggregation.length, stock: aggregation });
  } catch (error) {
    next(error);
  }
};
