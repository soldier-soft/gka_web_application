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
exports.Payment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PaymentSchema = new mongoose_1.Schema({
    paymentNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    projectId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    clientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    clientName: { type: String, required: true },
    invoiceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Invoice', index: true },
    amountPaise: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, required: true, index: true },
    paymentMode: {
        type: String,
        enum: ['bank_transfer', 'upi', 'cheque', 'cash'],
        default: 'bank_transfer',
    },
    transactionReference: { type: String, required: true },
    recordedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    verificationStatus: {
        type: String,
        enum: ['verification_pending', 'verified', 'rejected', 'reconciled', 'reversed'],
        default: 'verified',
        index: true,
    },
    verifiedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    reconciliationDate: { type: Date },
    reversalReference: { type: String },
    proofFileUrl: { type: String },
    notes: { type: String },
    receiptUrl: { type: String },
}, { timestamps: true });
exports.Payment = mongoose_1.default.model('Payment', PaymentSchema);
