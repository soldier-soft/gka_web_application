import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteReportDocument extends Document {
  projectId: mongoose.Types.ObjectId;
  reportDate: Date;
  weatherCondition: 'sunny' | 'cloudy' | 'rainy' | 'windy';
  workCompletedSummary: string;
  milestoneId?: mongoose.Types.ObjectId;
  milestoneTitle?: string;
  labourCount: {
    masons: number;
    helpers: number;
    carpenters: number;
    plumbers: number;
    electricians: number;
    painters: number;
    supervisors: number;
    totalCount: number;
  };
  materialsConsumedSummary?: string;
  issuesOrDelays?: string;
  safetyObservations?: string;
  isPublishedToClient: boolean;
  publishedAt?: Date;
  supervisorId: mongoose.Types.ObjectId;
  photos: {
    url: string;
    caption: string;
    category: 'foundation' | 'structure' | 'plastering' | 'finishing' | 'site_condition' | 'inspection';
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const SiteReportSchema = new Schema<ISiteReportDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    reportDate: { type: Date, required: true, index: true },
    weatherCondition: {
      type: String,
      enum: ['sunny', 'cloudy', 'rainy', 'windy'],
      default: 'sunny',
    },
    workCompletedSummary: { type: String, required: true },
    milestoneId: { type: Schema.Types.ObjectId, ref: 'Milestone' },
    milestoneTitle: { type: String },
    labourCount: {
      masons: { type: Number, default: 0 },
      helpers: { type: Number, default: 0 },
      carpenters: { type: Number, default: 0 },
      plumbers: { type: Number, default: 0 },
      electricians: { type: Number, default: 0 },
      painters: { type: Number, default: 0 },
      supervisors: { type: Number, default: 1 },
      totalCount: { type: Number, default: 1 },
    },
    materialsConsumedSummary: { type: String },
    issuesOrDelays: { type: String },
    safetyObservations: { type: String },
    isPublishedToClient: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },
    supervisorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    photos: [
      {
        url: { type: String, required: true },
        caption: { type: String, default: '' },
        category: {
          type: String,
          enum: ['foundation', 'structure', 'plastering', 'finishing', 'site_condition', 'inspection'],
          default: 'site_condition',
        },
      },
    ],
  },
  { timestamps: true }
);

export const SiteReport = mongoose.model<ISiteReportDocument>('SiteReport', SiteReportSchema);
