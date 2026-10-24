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
exports.PortfolioProject = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ProjectImageSchema = new mongoose_1.Schema({
    url: { type: String, required: true },
    alt: { type: String, required: true },
    caption: { type: String },
    order: { type: Number, default: 0 },
    isCover: { type: Boolean, default: false },
    imageType: {
        type: String,
        enum: ['actual_project', 'illustrative_reference'],
        default: 'illustrative_reference',
    },
    permissionStatus: {
        type: String,
        enum: ['verified_work', 'client_approved', 'licensed_reference'],
        default: 'licensed_reference',
    },
}, { _id: false });
const PortfolioProjectSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    category: {
        type: String,
        enum: ['residential', 'villas', 'commercial', 'renovation', 'civil_finishing', 'tiling', 'maintenance'],
        required: true,
        index: true,
    },
    categoryLabel: { type: String, required: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    workScope: [{ type: String }],
    projectType: {
        type: String,
        enum: ['actual_work', 'design_reference', 'concept_reference'],
        default: 'actual_work',
    },
    status: {
        type: String,
        enum: ['Completed', 'Active', 'Design Reference'],
        default: 'Completed',
    },
    client: { type: String },
    approxAreaSqFt: { type: Number },
    images: [ProjectImageSchema],
    isVerified: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: true, index: true },
    seoTitle: { type: String },
    seoDescription: { type: String },
}, { timestamps: true });
exports.PortfolioProject = mongoose_1.default.model('PortfolioProject', PortfolioProjectSchema);
