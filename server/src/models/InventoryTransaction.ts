import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryTransactionDocument extends Document {
  projectId?: mongoose.Types.ObjectId;
  materialName: string;
  category: string;
  transactionType: 'purchase_receipt' | 'site_issue' | 'site_return' | 'wastage' | 'adjustment';
  quantity: number;
  unit: string;
  unitCostPaise: number;
  totalValuePaise: number;
  referencePoId?: mongoose.Types.ObjectId;
  siteReportId?: mongoose.Types.ObjectId;
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  date: Date;
  createdAt: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransactionDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    materialName: { type: String, required: true, trim: true, index: true },
    category: { type: String, default: 'General' },
    transactionType: {
      type: String,
      enum: ['purchase_receipt', 'site_issue', 'site_return', 'wastage', 'adjustment'],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    unitCostPaise: { type: Number, default: 0 },
    totalValuePaise: { type: Number, default: 0 },
    referencePoId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    siteReportId: { type: Schema.Types.ObjectId, ref: 'SiteReport' },
    notes: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const InventoryTransaction = mongoose.model<IInventoryTransactionDocument>('InventoryTransaction', InventoryTransactionSchema);
