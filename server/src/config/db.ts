import mongoose from 'mongoose';
import { ENV } from './env';

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(ENV.MONGODB_URI, {
      autoIndex: true,
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 8000,
      dbName: 'gka_construction_erp',
    });
    console.log(`[MongoDB] Connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error: any) {
    console.error('[MongoDB] Connection error with primary URI:', error.message);
    if (ENV.NODE_ENV !== 'production' && ENV.MONGODB_URI.includes('mongodb+srv://')) {
      console.warn('[MongoDB] Falling back to local MongoDB for development...');
      try {
        await mongoose.connect('mongodb://127.0.0.1:27017/gka_construction_erp');
        console.log('[MongoDB] Connected successfully to local development MongoDB');
        return;
      } catch (fallbackErr) {
        console.error('[MongoDB] Local fallback also failed:', fallbackErr);
      }
    }
    process.exit(1);
  }
};
