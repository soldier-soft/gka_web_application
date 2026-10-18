import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentEntity extends Document {
  projectId?: mongoose.Types.ObjectId;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  category: 'drawings' | 'contracts' | 'quotations' | 'invoices' | 'permits' | 'handover' | 'site_photos';
  fileUrl: string;
  uploadedBy: mongoose.Types.ObjectId;
  visibleToClient: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocumentEntity>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    title: { type: String, required: true, trim: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    fileType: { type: String, default: 'application/pdf' },
    category: {
      type: String,
      enum: ['drawings', 'contracts', 'quotations', 'invoices', 'permits', 'handover', 'site_photos'],
      default: 'drawings',
      index: true,
    },
    fileUrl: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    visibleToClient: { type: Boolean, default: false, index: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export const ProjectDocument = mongoose.model<IDocumentEntity>('ProjectDocument', DocumentSchema);
