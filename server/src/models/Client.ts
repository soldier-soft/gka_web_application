import mongoose, { Schema, Document } from 'mongoose';

export interface IClientDocument extends Document {
  userId?: mongoose.Types.ObjectId; // User account for portal access
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    gstin?: string;
    pan?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClientDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, trim: true, index: true },
    companyName: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    alternatePhone: { type: String, trim: true },
    billingAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: 'Tamil Nadu' },
      pincode: { type: String, default: '' },
      gstin: { type: String, trim: true },
      pan: { type: String, trim: true },
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Client = mongoose.model<IClientDocument>('Client', ClientSchema);
