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
exports.Lead = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const LeadSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    projectCategory: {
        type: String,
        enum: ['residential', 'commercial', 'renovation', 'civil_structural', 'interiors', 'turnkey'],
        default: 'residential',
    },
    siteLocation: { type: String, required: true, trim: true },
    city: { type: String, default: 'Chennai' },
    approxAreaSqFt: { type: Number },
    estimatedBudgetRupees: { type: Number },
    message: { type: String },
    source: {
        type: String,
        enum: ['website_contact', 'cost_estimator', 'site_visit_booking', 'referral', 'direct'],
        default: 'website_contact',
        index: true,
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'site_visit_scheduled', 'estimate_sent', 'won', 'lost'],
        default: 'new',
        index: true,
    },
    notes: { type: String },
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    convertedToProjectId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project' },
    convertedToClientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Client' },
    preferredSiteVisitDate: { type: Date },
}, { timestamps: true });
exports.Lead = mongoose_1.default.model('Lead', LeadSchema);
