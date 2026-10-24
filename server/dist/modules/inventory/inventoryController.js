"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStockSummary = exports.createInventoryTransaction = exports.getInventoryTransactions = exports.createPurchaseOrder = exports.getPurchaseOrders = exports.createSupplier = exports.getSuppliers = void 0;
const Supplier_1 = require("../../models/Supplier");
const PurchaseOrder_1 = require("../../models/PurchaseOrder");
const InventoryTransaction_1 = require("../../models/InventoryTransaction");
const getSuppliers = async (req, res, next) => {
    try {
        const suppliers = await Supplier_1.Supplier.find().sort({ name: 1 });
        res.json({ success: true, count: suppliers.length, suppliers });
    }
    catch (error) {
        next(error);
    }
};
exports.getSuppliers = getSuppliers;
const createSupplier = async (req, res, next) => {
    try {
        const supplier = await Supplier_1.Supplier.create(req.body);
        res.status(201).json({ success: true, supplier });
    }
    catch (error) {
        next(error);
    }
};
exports.createSupplier = createSupplier;
const getPurchaseOrders = async (req, res, next) => {
    try {
        const { projectId } = req.query;
        const filter = {};
        if (projectId)
            filter.projectId = projectId;
        const purchaseOrders = await PurchaseOrder_1.PurchaseOrder.find(filter)
            .populate('projectId', 'title projectId')
            .populate('supplierId', 'name phone email category')
            .sort({ createdAt: -1 });
        res.json({ success: true, count: purchaseOrders.length, purchaseOrders });
    }
    catch (error) {
        next(error);
    }
};
exports.getPurchaseOrders = getPurchaseOrders;
const createPurchaseOrder = async (req, res, next) => {
    try {
        const { projectId, projectTitle, supplierId, supplierName, items, deliveryAddress, expectedDeliveryDate, notes } = req.body;
        let subtotalPaise = 0;
        const calculatedItems = (items || []).map((item) => {
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
        const count = await PurchaseOrder_1.PurchaseOrder.countDocuments();
        const currentYear = new Date().getFullYear();
        const poNumber = `GKA-PO-${currentYear}-${String(count + 1).padStart(3, '0')}`;
        const po = await PurchaseOrder_1.PurchaseOrder.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.createPurchaseOrder = createPurchaseOrder;
const getInventoryTransactions = async (req, res, next) => {
    try {
        const { projectId, materialName } = req.query;
        const filter = {};
        if (projectId)
            filter.projectId = projectId;
        if (materialName)
            filter.materialName = materialName;
        const transactions = await InventoryTransaction_1.InventoryTransaction.find(filter)
            .populate('projectId', 'title projectId')
            .populate('recordedBy', 'name')
            .sort({ date: -1 });
        res.json({ success: true, count: transactions.length, transactions });
    }
    catch (error) {
        next(error);
    }
};
exports.getInventoryTransactions = getInventoryTransactions;
const createInventoryTransaction = async (req, res, next) => {
    try {
        const { projectId, materialName, category, transactionType, quantity, unit, unitCostPaise, referencePoId, notes, date, } = req.body;
        const qty = Number(quantity);
        const unitCost = Number(unitCostPaise) || 0;
        const totalValuePaise = Math.round(qty * unitCost);
        const transaction = await InventoryTransaction_1.InventoryTransaction.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.createInventoryTransaction = createInventoryTransaction;
/**
 * Live Stock Balances computed dynamically from transaction records!
 */
const getStockSummary = async (req, res, next) => {
    try {
        const aggregation = await InventoryTransaction_1.InventoryTransaction.aggregate([
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
    }
    catch (error) {
        next(error);
    }
};
exports.getStockSummary = getStockSummary;
