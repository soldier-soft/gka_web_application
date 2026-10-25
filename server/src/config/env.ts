import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Safely discover and load .env from multiple potential deployment locations
const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

// Fallback to default dotenv if not already loaded
dotenv.config();

// Safely resolve PORT (supporting numbers, Hostinger Passenger sockets, and named pipes)
const rawPort = process.env.PORT;
let parsedPort: number | string = 5000;

if (rawPort !== undefined && rawPort !== '') {
  const numericPort = parseInt(rawPort, 10);
  if (!isNaN(numericPort) && numericPort > 0) {
    parsedPort = numericPort;
  } else {
    // If rawPort is a named pipe or unix socket path (common in Phusion Passenger on Hostinger / CloudLinux)
    parsedPort = rawPort;
  }
}

export const ENV = {
  PORT: parsedPort,
  NODE_ENV: process.env.NODE_ENV || 'production',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gka_construction_erp',
  JWT_SECRET: process.env.JWT_SECRET || 'gka-super-secure-production-jwt-secret-key-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'https://www.gkaconstruction.com',
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads'),
};

