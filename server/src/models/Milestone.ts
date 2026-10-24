import mongoose, { Schema, Document } from 'mongoose';

export interface IMilestoneDocument extends Document {
  projectId: mongoose.Types.ObjectId;
  code: string;
  title: string;
  description: string;
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  weightagePercent: number;
  progressPercent: number;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  isPublishedToClient: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestoneDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    code: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    plannedStartDate: { type: Date, required: true },
    plannedEndDate: { type: Date, required: true },
    actualStartDate: { type: Date },
    actualEndDate: { type: Date },
    weightagePercent: { type: Number, default: 0 },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'delayed'],
      default: 'pending',
    },
    isPublishedToClient: { type: Boolean, default: true, index: true },
    orderIndex: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const Milestone = mongoose.model<IMilestoneDocument>('Milestone', MilestoneSchema);
