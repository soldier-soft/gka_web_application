import mongoose, { Schema, Document } from 'mongoose';
import { ProjectCategory, ProjectStatus } from '../shared/types';

export interface IProjectDocument extends Document {
  projectId: string; // Unique human-readable ID: e.g. GKA-2026-001
  title: string;
  category: ProjectCategory;
  clientId: mongoose.Types.ObjectId;
  siteAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  scopeOfWork: string[];
  startDate: Date;
  targetEndDate: Date;
  actualEndDate?: Date;
  status: ProjectStatus;
  progressPercent: number;

  // Financial fields stored in integer paise
  contractValuePaise: number;
  approvedVariationsPaise: number;
  totalBudgetPaise: number;
  actualCostPaise: number;
  committedCostPaise: number;
  invoicedAmountPaise: number;
  collectedAmountPaise: number;

  assignedManagerId?: mongoose.Types.ObjectId;
  assignedSupervisorId?: mongoose.Types.ObjectId;
  assignedTeam: mongoose.Types.ObjectId[];

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProjectDocument>(
  {
    projectId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      enum: ['residential', 'commercial', 'renovation', 'civil_structural', 'interiors', 'turnkey'],
      default: 'residential',
      index: true,
    },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
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

    assignedManagerId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedSupervisorId: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedTeam: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    notes: { type: String },
  },
  { timestamps: true }
);

export const Project = mongoose.model<IProjectDocument>('Project', ProjectSchema);
