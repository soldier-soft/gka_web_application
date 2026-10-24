import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentDocument extends Document {
  paymentNumber: string;
  projectId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  clientName: string;
  invoiceId?: mongoose.Types.ObjectId;
  amountPaise: number;
  paymentDate: Date;
  paymentMode: 'bank_transfer' | 'upi' | 'cheque' | 'cash';
  transactionReference: string;
  recordedBy?: mongoose.Types.ObjectId;
  verificationStatus: 'verification_pending' | 'verified' | 'rejected' | 'reconciled' | 'reversed';
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  reconciliationDate?: Date;
  reversalReference?: string;
  proofFileUrl?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    paymentNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    clientName: { type: String, required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', index: true },
    amountPaise: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, required: true, index: true },
    paymentMode: {
      type: String,
      enum: ['bank_transfer', 'upi', 'cheque', 'cash'],
      default: 'bank_transfer',
    },
    transactionReference: { type: String, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verificationStatus: {
      type: String,
      enum: ['verification_pending', 'verified', 'rejected', 'reconciled', 'reversed'],
      default: 'verified',
      index: true,
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    reconciliationDate: { type: Date },
    reversalReference: { type: String },
    proofFileUrl: { type: String },
    notes: { type: String },
    receiptUrl: { type: String },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPaymentDocument>('Payment', PaymentSchema);
