import mongoose, { Schema, Document } from 'mongoose';
import { IEnquiryRecord } from '../shared/types';

export interface IEnquiryDocument extends Document, Omit<IEnquiryRecord, '_id' | 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}

const EnquirySchema = new Schema<IEnquiryDocument>(
  {
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
  },
  { timestamps: true }
);

export const Enquiry = mongoose.model<IEnquiryDocument>('Enquiry', EnquirySchema);
