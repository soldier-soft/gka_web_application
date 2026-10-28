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
exports.Quotation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const EstimateItemSchema = new mongoose_1.Schema({
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
}, { _id: false });
const QuotationSchema = new mongoose_1.Schema({
    quotationNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    projectId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project', index: true },
    leadId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Lead', index: true },
    clientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    clientName: { type: String, required: true },
    clientContactPerson: { type: String, default: 'THE CHIEF ENGINEER' },
    clientCompany: { type: String, default: 'VIVANTHA HOTEL' },
    clientAddress: { type: String, default: 'SHOLINGANALUR, CHENNAI.' },
    clientGstin: { type: String },
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
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    convertedToBudget: { type: Boolean, default: false },
    notes: { type: String },
}, { timestamps: true });
exports.Quotation = mongoose_1.default.model('Quotation', QuotationSchema);
