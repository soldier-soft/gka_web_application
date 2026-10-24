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
exports.Enquiry = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const EnquirySchema = new mongoose_1.Schema({
    referenceNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
    },
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    preferredContactMethod: {
        type: String,
        enum: ['call', 'whatsapp', 'email'],
        default: 'call',
    },
    serviceType: { type: String, default: 'residential' },
    projectLocation: { type: String, required: true, trim: true },
    builtUpAreaSqFt: { type: Number },
    projectType: {
        type: String,
        enum: ['new_construction', 'renovation', 'expansion', 'other'],
        default: 'new_construction',
    },
    requirements: { type: String, required: true, trim: true },
    preferredContactTime: { type: String },
    consent: { type: Boolean, required: true, default: true },
    relatedProjectId: { type: String },
    relatedProjectTitle: { type: String },
    relatedIdeaId: { type: String },
    relatedIdeaTitle: { type: String },
    status: {
        type: String,
        enum: ['new', 'contacted', 'site_visit_scheduled', 'quotation_in_progress', 'converted', 'closed'],
        default: 'new',
        index: true,
    },
    notes: { type: String },
    emailNotificationSent: { type: Boolean, default: false },
    emailNotificationError: { type: String },
}, { timestamps: true });
exports.Enquiry = mongoose_1.default.model('Enquiry', EnquirySchema);
