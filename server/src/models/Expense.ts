import mongoose, { Schema, Document } from 'mongoose';

export interface IExpenseDocument extends Document {
  projectId: mongoose.Types.ObjectId;
  category: 'materials' | 'labour' | 'machinery' | 'subcontractor' | 'fuel_transport' | 'permits_fees' | 'site_supplies' | 'office_overhead';
  description: string;
  amountPaise: number;
  paidTo: string;
  date: Date;
  paymentMethod: 'bank_transfer' | 'upi' | 'cheque' | 'cash';
  referenceNumber?: string;
  receiptUrl?: string;
  supplierId?: mongoose.Types.ObjectId;
  isApproved: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    category: {
      type: String,
      enum: ['materials', 'labour', 'machinery', 'subcontractor', 'fuel_transport', 'permits_fees', 'site_supplies', 'office_overhead'],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    amountPaise: { type: Number, required: true, min: 0 },
    paidTo: { type: String, required: true },
    date: { type: Date, required: true, index: true },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'upi', 'cheque', 'cash'],
      default: 'bank_transfer',
    },
    referenceNumber: { type: String },
    receiptUrl: { type: String },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    isApproved: { type: Boolean, default: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Expense = mongoose.model<IExpenseDocument>('Expense', ExpenseSchema);
