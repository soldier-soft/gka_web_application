import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplierDocument extends Document {
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  category: 'cement_steel' | 'aggregates_sand' | 'bricks_blocks' | 'tiles_sanitary' | 'electrical' | 'paint' | 'timber_hardware' | 'equipment_rental';
  gstin?: string;
  paymentTermsDays: number;
  outstandingBalancePaise: number;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplierDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, required: true },
    category: {
      type: String,
      enum: ['cement_steel', 'aggregates_sand', 'bricks_blocks', 'tiles_sanitary', 'electrical', 'paint', 'timber_hardware', 'equipment_rental'],
      default: 'cement_steel',
      index: true,
    },
    gstin: { type: String, trim: true },
    paymentTermsDays: { type: Number, default: 30 },
    outstandingBalancePaise: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Supplier = mongoose.model<ISupplierDocument>('Supplier', SupplierSchema);
