import mongoose, { Schema, Document } from 'mongoose';

export type ClientFeedbackCategory =
  | 'general_feedback'
  | 'site_query'
  | 'additional_requirement'
  | 'variation_request'
  | 'site_visit_request'
  | 'estimate_request';

export type ClientFeedbackStatus =
  | 'submitted'
  | 'under_review'
  | 'variation_drafted'
  | 'approved'
  | 'rejected'
  | 'resolved';

export interface IClientFeedbackDocument extends Document {
  ticketNumber: string;
  projectId: mongoose.Types.ObjectId;
  projectTitle: string;
  clientId: mongoose.Types.ObjectId;
  clientUserId?: mongoose.Types.ObjectId;
  clientName: string;
  category: ClientFeedbackCategory;
  subject: string;
  message: string;
  attachments: {
    url: string;
    name: string;
    fileType?: string;
  }[];
  status: ClientFeedbackStatus;
  assignedStaffId?: mongoose.Types.ObjectId;
  adminResponse?: string;
  respondedAt?: Date;
  respondedBy?: mongoose.Types.ObjectId;
  variationApproved?: boolean;
  changeOrderPaise?: number; // Integer paise for approved variation value
  createdAt: Date;
  updatedAt: Date;
}

const ClientFeedbackSchema = new Schema<IClientFeedbackDocument>(
  {
    ticketNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    projectTitle: { type: String, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    clientUserId: { type: Schema.Types.ObjectId, ref: 'User' },
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
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'User' },
    adminResponse: { type: String },
    respondedAt: { type: Date },
    respondedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    variationApproved: { type: Boolean, default: false },
    changeOrderPaise: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ClientFeedback = mongoose.model<IClientFeedbackDocument>(
  'ClientFeedback',
  ClientFeedbackSchema
);
