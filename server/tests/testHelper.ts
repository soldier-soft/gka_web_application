import mongoose from 'mongoose';
import { ENV } from '../src/config/env';

export async function connectTestDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500,
      dbName: 'gka_construction_erp',
    });
  } catch (err) {
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/gka_construction_erp');
    } catch (localErr) {
      console.warn('Could not connect to test database:', localErr);
    }
  }
}

export async function disconnectTestDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
