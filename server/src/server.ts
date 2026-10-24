#!/usr/bin/env node
import { createApp } from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';

// Prevent process crashes on unhandled errors in production
process.on('uncaughtException', (err: any) => {
  console.error('[GKA Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason: any, promise: any) => {
  console.error('[GKA Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

const startServer = async () => {
  try {
    const app = createApp();
    const port = ENV.PORT;

    // Listen on assigned port across all network interfaces
    const server = app.listen(port, () => {
      console.log(`====================================================`);
      console.log(`  GKA CONSTRUCTION ERP PRODUCTION SERVER`);
      console.log(`  Domain: ${ENV.CLIENT_URL}`);
      console.log(`  Port: ${port}`);
      console.log(`  Environment: ${ENV.NODE_ENV}`);
      console.log(`  REST API: ${ENV.CLIENT_URL}/api/v1`);
      console.log(`  Health Check: ${ENV.CLIENT_URL}/api/health`);
      console.log(`====================================================`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[Server Error] Port ${port} is already in use by another process.`);
      } else {
        console.error('[Server Error] Server listener error:', err.message);
      }
      process.exit(1);
    });

    // Connect to database in non-blocking manner so HTTP server starts instantly
    connectDB().catch((dbErr: any) => {
      console.error('[Database Error] Database initialization warning:', dbErr.message);
    });
  } catch (error: any) {
    console.error('[Server Error] Fatal startup error:', error.message || error);
    process.exit(1);
  }
};

startServer();

