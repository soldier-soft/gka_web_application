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
exports.Invoice = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const constants_1 = require("../shared/constants");
const InvoiceItemSchema = new mongoose_1.Schema({
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    unitPricePaise: { type: Number, required: true, min: 0 },
    totalPaise: { type: Number, required: true, min: 0 },
}, { _id: false });
const InvoiceSchema = new mongoose_1.Schema({
    invoiceNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    projectId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    projectTitle: { type: String, required: true },
    clientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
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
        accountName: { type: String, default: constants_1.GKA_COMPANY.bankDetails.accountName },
        accountNumber: { type: String, default: constants_1.GKA_COMPANY.bankDetails.accountNumber },
        bankName: { type: String, default: constants_1.GKA_COMPANY.bankDetails.bankName },
        ifscCode: { type: String, default: constants_1.GKA_COMPANY.bankDetails.ifscCode },
        branch: { type: String, default: constants_1.GKA_COMPANY.bankDetails.branch },
        upiId: { type: String, default: constants_1.GKA_COMPANY.bankDetails.upiId },
    },
}, { timestamps: true });
exports.Invoice = mongoose_1.default.model('Invoice', InvoiceSchema);
