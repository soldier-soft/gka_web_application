import mongoose, { Schema, Document } from 'mongoose';
import { LeadStatus, ProjectCategory } from '../shared/types';

export interface ILeadDocument extends Document {
  name: string;
  phone: string;
  email?: string;
  projectCategory: ProjectCategory;
  siteLocation: string;
  city?: string;
  approxAreaSqFt?: number;
  estimatedBudgetRupees?: number;
  message?: string;
  source: 'website_contact' | 'cost_estimator' | 'site_visit_booking' | 'referral' | 'direct';
  status: LeadStatus;
  notes?: string;
  assignedTo?: mongoose.Types.ObjectId;
  convertedToProjectId?: mongoose.Types.ObjectId;
  convertedToClientId?: mongoose.Types.ObjectId;
  preferredSiteVisitDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILeadDocument>(
  {
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
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    convertedToProjectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    convertedToClientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    preferredSiteVisitDate: { type: Date },
  },
  { timestamps: true }
);

export const Lead = mongoose.model<ILeadDocument>('Lead', LeadSchema);
