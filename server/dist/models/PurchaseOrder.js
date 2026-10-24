"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrder = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PurchaseOrderItemSchema = new mongoose_1.Schema({
    itemDescription: { type: String, required: true },
    unit: { type: String, required: true },
    quantityOrdered: { type: Number, required: true, min: 0 },
    quantityReceived: { type: Number, default: 0, min: 0 },
    unitRatePaise: { type: Number, required: true, min: 0 },
    totalPaise: { type: Number, required: true, min: 0 },
}, { _id: false });
const PurchaseOrderSchema = new mongoose_1.Schema({
    poNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    projectId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    projectTitle: { type: String, required: true },
    supplierId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    supplierName: { type: String, required: true },
    items: [PurchaseOrderItemSchema],
    subtotalPaise: { type: Number, required: true, default: 0 },
    taxPaise: { type: Number, default: 0 },
    grandTotalPaise: { type: Number, required: true, default: 0 },
    status: {
        type: String,
        enum: ['draft', 'issued', 'partially_received', 'received', 'cancelled'],
        default: 'draft',
        index: true,
    },
    expectedDeliveryDate: { type: Date },
    deliveryAddress: { type: String, required: true },
    notes: { type: String },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
exports.PurchaseOrder = mongoose_1.default.model('PurchaseOrder', PurchaseOrderSchema);
