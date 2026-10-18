import mongoose, { Schema, Document } from 'mongoose';
import { IPurchaseOrderItem } from '../shared/types';

export interface IPurchaseOrderDocument extends Document {
  poNumber: string;
  projectId: mongoose.Types.ObjectId;
  projectTitle: string;
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  items: IPurchaseOrderItem[];
  subtotalPaise: number;
  taxPaise: number;
  grandTotalPaise: number;
  status: 'draft' | 'issued' | 'partially_received' | 'received' | 'cancelled';
  expectedDeliveryDate?: Date;
  deliveryAddress: string;
  notes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderItemSchema = new Schema(
  {
    itemDescription: { type: String, required: true },
    unit: { type: String, required: true },
    quantityOrdered: { type: Number, required: true, min: 0 },
    quantityReceived: { type: Number, default: 0, min: 0 },
    unitRatePaise: { type: Number, required: true, min: 0 },
    totalPaise: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrderDocument>(
  {
    poNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    projectTitle: { type: String, required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
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
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const PurchaseOrder = mongoose.model<IPurchaseOrderDocument>('PurchaseOrder', PurchaseOrderSchema);
