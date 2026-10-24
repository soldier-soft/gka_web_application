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
exports.TaxReconciliation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TaxAuditLogSchema = new mongoose_1.Schema({
    fieldChanged: { type: String, required: true },
    oldValue: { type: mongoose_1.Schema.Types.Mixed, required: true },
    newValue: { type: mongoose_1.Schema.Types.Mixed, required: true },
    reason: { type: String, required: true },
    changedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    changedByName: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
}, { _id: false });
const TaxReconciliationSchema = new mongoose_1.Schema({
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
    reconciledBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    reconciledAt: { type: Date },
    notes: { type: String },
    auditTrail: [TaxAuditLogSchema],
}, { timestamps: true });
exports.TaxReconciliation = mongoose_1.default.model('TaxReconciliation', TaxReconciliationSchema);
