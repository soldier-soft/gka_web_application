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
exports.ClientFeedback = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ClientFeedbackSchema = new mongoose_1.Schema({
    ticketNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    projectId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    projectTitle: { type: String, required: true },
    clientId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    clientUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    clientName: { type: String, required: true },
    category: {
        type: String,
        enum: [
            'general_feedback',
            'site_query',
            'additional_requirement',
            'variation_request',
            'site_visit_request',
            'estimate_request',
        ],
        default: 'general_feedback',
        index: true,
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    attachments: [
        {
            url: { type: String, required: true },
            name: { type: String, required: true },
            fileType: { type: String },
        },
    ],
    status: {
        type: String,
        enum: ['submitted', 'under_review', 'variation_drafted', 'approved', 'rejected', 'resolved'],
        default: 'submitted',
        index: true,
    },
    assignedStaffId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    adminResponse: { type: String },
    respondedAt: { type: Date },
    respondedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    variationApproved: { type: Boolean, default: false },
    changeOrderPaise: { type: Number, default: 0 },
}, { timestamps: true });
exports.ClientFeedback = mongoose_1.default.model('ClientFeedback', ClientFeedbackSchema);
