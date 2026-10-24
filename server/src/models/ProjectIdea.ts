import mongoose, { Schema, Document } from 'mongoose';
import { IProjectIdea, IProjectImage } from '../shared/types';

export interface IProjectIdeaDocument extends Document, Omit<IProjectIdea, '_id' | 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}

const ProjectImageSchema = new Schema<IProjectImage>(
  {
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
  },
  { _id: false }
);

const ProjectIdeaSchema = new Schema<IProjectIdeaDocument>(
  {
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
  },
  { timestamps: true }
);

export const ProjectIdea = mongoose.model<IProjectIdeaDocument>('ProjectIdea', ProjectIdeaSchema);
