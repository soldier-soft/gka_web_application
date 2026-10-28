import mongoose, { Schema, Document } from 'mongoose';
import { IInvoiceItem } from '../shared/types';
import { GKA_COMPANY } from '../shared/constants';

export interface IInvoiceDocument extends Document {
  invoiceNumber: string;
  projectId: mongoose.Types.ObjectId;
  projectTitle: string;
  clientId: mongoose.Types.ObjectId;
  clientName: string;
  billingAddress: string;
  items: IInvoiceItem[];
  subtotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalAmountPaise: number;
  paidAmountPaise: number;
  dueAmountPaise: number;
  isNegotiated?: boolean;
  negotiatedDiscountPaise?: number;
  discountPaise?: number;
  negotiatedNotes?: string;
  termsAndConditions?: string[];
  issueDate: Date;
  dueDate: Date;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  gstFiled?: boolean;
  gstFilingDate?: Date;
  gstFilingArn?: string;
  gstTaxPeriod?: string;
  subject?: string;
  clientContactPerson?: string;
  clientCompany?: string;
  senderName?: string;
  senderCompany?: string;
  notes?: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    branch: string;
    upiId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    unitPricePaise: { type: Number, required: true, min: 0 },
    totalPaise: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoiceDocument>(
  {
    invoiceNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    projectTitle: { type: String, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    clientName: { type: String, required: true },
    billingAddress: { type: String, required: true },
    items: [InvoiceItemSchema],
    subtotalPaise: { type: Number, required: true, default: 0 },
    cgstPaise: { type: Number, default: 0 },
    sgstPaise: { type: Number, default: 0 },
    igstPaise: { type: Number, default: 0 },
    totalAmountPaise: { type: Number, required: true, default: 0 },
    paidAmountPaise: { type: Number, default: 0 },
    dueAmountPaise: { type: Number, required: true, default: 0 },
    issueDate: { type: Date, required: true, index: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
      index: true,
    },
    isNegotiated: { type: Boolean, default: false },
    negotiatedDiscountPaise: { type: Number, default: 0 },
    discountPaise: { type: Number, default: 0 },
    negotiatedNotes: { type: String },
    termsAndConditions: [{ type: String }],
    gstFiled: { type: Boolean, default: false, index: true },
    gstFilingDate: { type: Date },
    gstFilingArn: { type: String },
    gstTaxPeriod: { type: String, default: '2026-10' },
    subject: { type: String, default: 'Tax Invoice for Construction Works & Allied Services' },
    clientContactPerson: { type: String },
    clientCompany: { type: String },
    senderName: { type: String, default: 'HARI A' },
    senderCompany: { type: String, default: 'GKA CONSTRUCTION' },
    notes: { type: String },
    bankDetails: {
      accountName: { type: String, default: GKA_COMPANY.bankDetails.accountName },
      accountNumber: { type: String, default: GKA_COMPANY.bankDetails.accountNumber },
      bankName: { type: String, default: GKA_COMPANY.bankDetails.bankName },
      ifscCode: { type: String, default: GKA_COMPANY.bankDetails.ifscCode },
      branch: { type: String, default: GKA_COMPANY.bankDetails.branch },
      upiId: { type: String, default: GKA_COMPANY.bankDetails.upiId },
    },
  },
  { timestamps: true }
);

export const Invoice = mongoose.model<IInvoiceDocument>('Invoice', InvoiceSchema);
