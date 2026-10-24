import mongoose, { Schema, Document } from 'mongoose';

export interface ITaxAuditLog {
  fieldChanged: string;
  oldValue: number | string;
  newValue: number | string;
  reason: string;
  changedBy: mongoose.Types.ObjectId;
  changedByName: string;
  changedAt: Date;
}

export interface ITaxReconciliationDocument extends Document {
  period: string; // e.g. "2026-10" or "October 2026"
  financialYear: string; // e.g. "FY 2026-27"
  
  // Outward Supplies (Sales)
  totalTaxableSalesPaise: number;
  outputCgstPaise: number;
  outputSgstPaise: number;
  outputIgstPaise: number;
  totalOutputTaxPaise: number;

  // Inward Supplies (Purchases & ITC)
  totalTaxablePurchasesPaise: number;
  totalPurchaseGstPaise: number;
  eligibleItcPaise: number; // Editable by accounts/admin
  ineligibleItcPaise: number;
  pendingVerificationItcPaise: number;

  // Adjustments & Net Calculation
  taxAdjustmentsPaise: number; // + or - adjustment in paise
  netTaxPayablePaise: number; // Output Tax - Eligible ITC + Adjustments

  // Payment Tracking (Distinct from Payable calculation)
  paymentStatus: 'pending' | 'partially_paid' | 'paid';
  actualPaidAmountPaise: number;
  taxPaymentReference?: string;
  taxPaymentDate?: Date;
  bankChallanBsrcode?: string;

  // Return Filing Status (Distinct from Payment)
  returnStatus: 'not_filed' | 'filed' | 'amendment_required';
  returnFilingDate?: Date;
  returnAckNumber?: string; // ARN e.g. AA3310260012345

  // Reconciliation State
  reconciliationStatus: 'draft_needs_review' | 'reconciled' | 'closed';
  reconciledBy?: mongoose.Types.ObjectId;
  reconciledAt?: Date;
  notes?: string;

  // Audit trail of manual overrides
  auditTrail: ITaxAuditLog[];

  createdAt: Date;
  updatedAt: Date;
}

const TaxAuditLogSchema = new Schema(
  {
    fieldChanged: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed, required: true },
    newValue: { type: Schema.Types.Mixed, required: true },
    reason: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedByName: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TaxReconciliationSchema = new Schema<ITaxReconciliationDocument>(
  {
    period: { type: String, required: true, unique: true, index: true },
    financialYear: { type: String, required: true, index: true },

    totalTaxableSalesPaise: { type: Number, default: 0 },
    outputCgstPaise: { type: Number, default: 0 },
    outputSgstPaise: { type: Number, default: 0 },
    outputIgstPaise: { type: Number, default: 0 },
    totalOutputTaxPaise: { type: Number, default: 0 },

    totalTaxablePurchasesPaise: { type: Number, default: 0 },
    totalPurchaseGstPaise: { type: Number, default: 0 },
    eligibleItcPaise: { type: Number, default: 0 },
    ineligibleItcPaise: { type: Number, default: 0 },
    pendingVerificationItcPaise: { type: Number, default: 0 },

    taxAdjustmentsPaise: { type: Number, default: 0 },
    netTaxPayablePaise: { type: Number, default: 0 },

    paymentStatus: {
      type: String,
      enum: ['pending', 'partially_paid', 'paid'],
      default: 'pending',
      index: true,
    },
    actualPaidAmountPaise: { type: Number, default: 0 },
    taxPaymentReference: { type: String },
    taxPaymentDate: { type: Date },
    bankChallanBsrcode: { type: String },

    returnStatus: {
      type: String,
      enum: ['not_filed', 'filed', 'amendment_required'],
      default: 'not_filed',
      index: true,
    },
    returnFilingDate: { type: Date },
    returnAckNumber: { type: String },

    reconciliationStatus: {
      type: String,
      enum: ['draft_needs_review', 'reconciled', 'closed'],
      default: 'draft_needs_review',
      index: true,
    },
    reconciledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reconciledAt: { type: Date },
    notes: { type: String },

    auditTrail: [TaxAuditLogSchema],
  },
  { timestamps: true }
);

export const TaxReconciliation = mongoose.model<ITaxReconciliationDocument>(
  'TaxReconciliation',
  TaxReconciliationSchema
);
