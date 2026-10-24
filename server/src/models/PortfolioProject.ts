import mongoose, { Schema, Document } from 'mongoose';
import { IPortfolioProject, IProjectImage } from '../shared/types';

export interface IPortfolioProjectDocument extends Document, Omit<IPortfolioProject, '_id' | 'createdAt' | 'updatedAt'> {
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

const PortfolioProjectSchema = new Schema<IPortfolioProjectDocument>(
  {
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
  },
  { timestamps: true }
);

export const PortfolioProject = mongoose.model<IPortfolioProjectDocument>(
  'PortfolioProject',
  PortfolioProjectSchema
);
