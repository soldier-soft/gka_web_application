import mongoose, { Schema, Document } from 'mongoose';
import { IEstimateItem } from '../shared/types';

export interface IQuotationDocument extends Document {
  quotationNumber: string;
  projectId?: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  clientName: string;
  clientAddress: string;
  projectTitle: string;
  siteLocation: string;
  items: IEstimateItem[];
  subtotalPaise: number;
  discountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  taxRatePercent: number;
  totalAmountPaise: number;
  isNegotiated?: boolean;
  negotiatedDiscountPaise?: number;
  negotiatedNotes?: string;
  subject?: string;
  clientContactPerson?: string;
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  senderName?: string;
  senderCompany?: string;
  termsAndConditions: string[];
  revisionNumber: number;
  status: 'draft' | 'sent' | 'revised' | 'approved' | 'rejected';
  validUntil: Date;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  convertedToBudget: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EstimateItemSchema = new Schema(
  {
    id: { type: String, required: true },
    category: {
      type: String,
      default: 'civil',
    },
    description: { type: String, required: true },
    unit: {
      type: String,
      default: 'sq.ft',
    },
    quantity: { type: Number, required: true, min: 0 },
    unitRatePaise: { type: Number, required: true, min: 0 },
    amountPaise: { type: Number, required: true, min: 0 },
    materialCostPaise: { type: Number, default: 0 },
    labourCostPaise: { type: Number, default: 0 },
    equipmentCostPaise: { type: Number, default: 0 },
    notes: { type: String },
  },
  { _id: false }
);

const QuotationSchema = new Schema<IQuotationDocument>(
  {
    quotationNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    clientName: { type: String, required: true },
    clientContactPerson: { type: String, default: 'THE CHIEF ENGINEER' },
    clientCompany: { type: String, default: 'VIVANTHA HOTEL' },
    clientAddress: { type: String, default: 'SHOLINGANALUR, CHENNAI.' },
    senderName: { type: String, default: 'HARI A' },
    senderCompany: { type: String, default: 'GKA CONSTRUCTION' },
    subject: {
      type: String,
      default: 'Quotation for Construction Works - Cooling Tower Base & Related Structures.',
    },
    projectTitle: { type: String, required: true },
    siteLocation: { type: String, required: true },
    items: [EstimateItemSchema],
    subtotalPaise: { type: Number, required: true, default: 0 },
    discountPaise: { type: Number, default: 0 },
    cgstPaise: { type: Number, default: 0 },
    sgstPaise: { type: Number, default: 0 },
    igstPaise: { type: Number, default: 0 },
    taxRatePercent: { type: Number, default: 18 },
    totalAmountPaise: { type: Number, required: true, default: 0 },
    isNegotiated: { type: Boolean, default: false },
    negotiatedDiscountPaise: { type: Number, default: 0 },
    negotiatedNotes: { type: String, default: '' },
    clientEmail: { type: String },
    clientPhone: { type: String },
    termsAndConditions: [{ type: String }],
    revisionNumber: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'revised', 'approved', 'rejected'],
      default: 'draft',
      index: true,
    },
    validUntil: { type: Date, required: true },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    convertedToBudget: { type: Boolean, default: false },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Quotation = mongoose.model<IQuotationDocument>('Quotation', QuotationSchema);
