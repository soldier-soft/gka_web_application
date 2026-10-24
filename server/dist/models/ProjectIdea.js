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
exports.ProjectIdea = void 0;
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
const ProjectIdeaSchema = new mongoose_1.Schema({
    ideaId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    title: { type: String, required: true, trim: true, index: true },
    builtUpAreaSqFt: { type: Number, required: true, index: true },
    areaCategory: {
        type: String,
        enum: [
            'under_600',
            '600_800',
            '800_1000',
            '1000_1200',
            '1200_1500',
            '1500_2000',
            '2000_2500',
            'above_2500',
        ],
        required: true,
        index: true,
    },
    areaCategoryLabel: { type: String, required: true },
    bedroomCount: {
        type: String,
        enum: ['all', '1_bhk', '2_bhk', '3_bhk', '4_bhk_plus', 'not_applicable'],
        default: 'not_applicable',
        index: true,
    },
    propertyType: {
        type: String,
        enum: ['all', 'single_floor', 'duplex', 'villa', 'compact_home', 'commercial', 'renovation'],
        required: true,
        index: true,
    },
    architecturalStyle: {
        type: String,
        enum: ['all', 'contemporary', 'traditional', 'modern', 'minimalist', 'elevation_design', 'interior_reference'],
        required: true,
        index: true,
    },
    conceptType: {
        type: String,
        enum: ['all', 'compact_budget', 'premium_finish', 'standard_family'],
        default: 'standard_family',
        index: true,
    },
    description: { type: String, required: true },
    features: [{ type: String }],
    images: [ProjectImageSchema],
    tags: [{ type: String, trim: true, index: true }],
    contentType: {
        type: String,
        enum: ['Concept Reference', 'Actual Project'],
        default: 'Concept Reference',
    },
    isPublished: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    seoTitle: { type: String },
    seoDescription: { type: String },
}, { timestamps: true });
exports.ProjectIdea = mongoose_1.default.model('ProjectIdea', ProjectIdeaSchema);
