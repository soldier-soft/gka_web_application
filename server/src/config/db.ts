import mongoose from 'mongoose';
import { ENV } from './env';

export const connectDB = async (): Promise<void> => {
  mongoose.set('strictQuery', true);

  const connectOptions: mongoose.ConnectOptions = {
    autoIndex: true,
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 4000,
    dbName: 'gka_construction_erp',
  };

  // 1. Attempt primary MongoDB connection (e.g. MongoDB Atlas)
  try {
    console.log('[MongoDB] Connecting to primary database...');
    await mongoose.connect(ENV.MONGODB_URI, connectOptions);
    console.log(`[MongoDB] Connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
    return;
  } catch (error: any) {
    console.warn(`[MongoDB] Primary connection failed: ${error.message}`);
    console.warn('[MongoDB] (Note: Ensure 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access for cloud access)');
  }

  // 2. Fallback to Local MongoDB (running on 127.0.0.1:27017)
  const fallbackUris = [
    'mongodb://127.0.0.1:27017/gka_construction_erp',
    'mongodb://localhost:27017/gka_construction_erp',
  ];

  for (const uri of fallbackUris) {
    try {
      console.log(`[MongoDB] Connecting to fallback local database (${uri})...`);
      await mongoose.connect(uri, { ...connectOptions, serverSelectionTimeoutMS: 3000 });
      console.log(`[MongoDB] Connected successfully to fallback local database: ${uri}`);
      return;
    } catch (fallbackErr: any) {
      console.warn(`[MongoDB] Fallback connection to ${uri} failed: ${fallbackErr.message}`);
    }
  }

  console.error('[MongoDB] Warning: Could not connect to Atlas or local MongoDB. Server will remain running.');
};
