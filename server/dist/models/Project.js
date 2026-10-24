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
exports.Project = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ProjectSchema = new mongoose_1.Schema({
    projectId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, index: true },
    category: {
        type: String,
        enum: ['residential', 'commercial', 'renovation', 'civil_structural', 'interiors', 'turnkey'],
        default: 'residential',
        index: true,
    },
    clientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    siteAddress: {
        street: { type: String, default: '' },
        city: { type: String, default: 'Chennai' },
        state: { type: String, default: 'Tamil Nadu' },
        pincode: { type: String, default: '' },
        landmark: { type: String },
    },
    scopeOfWork: [{ type: String }],
    startDate: { type: Date, required: true },
    targetEndDate: { type: Date, required: true },
    actualEndDate: { type: Date },
    status: {
        type: String,
        enum: ['planning', 'active', 'on_hold', 'completed', 'archived'],
        default: 'planning',
        index: true,
    },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    // Integer paise for financial accuracy
    contractValuePaise: { type: Number, default: 0 },
    approvedVariationsPaise: { type: Number, default: 0 },
    totalBudgetPaise: { type: Number, default: 0 },
    actualCostPaise: { type: Number, default: 0 },
    committedCostPaise: { type: Number, default: 0 },
    invoicedAmountPaise: { type: Number, default: 0 },
    collectedAmountPaise: { type: Number, default: 0 },
    assignedManagerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    assignedSupervisorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    assignedTeam: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    notes: { type: String },
}, { timestamps: true });
exports.Project = mongoose_1.default.model('Project', ProjectSchema);
