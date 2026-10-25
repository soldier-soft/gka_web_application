#!/usr/bin/env node
import { createApp } from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';
import { ensureDefaultUsers } from './modules/auth/defaultCredentials';

// Prevent process crashes on unhandled errors in production
process.on('uncaughtException', (err: any) => {
  console.error('[GKA Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason: any, promise: any) => {
  console.error('[GKA Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = createApp();
const port = ENV.PORT;
let serverInstance: any = null;

const startServer = async () => {
  try {
    const handleListening = () => {
      console.log(`====================================================`);
      console.log(`  GKA CONSTRUCTION ERP PRODUCTION SERVER`);
      console.log(`  Domain: ${ENV.CLIENT_URL}`);
      console.log(`  Listening Target: ${port}`);
      console.log(`  Environment: ${ENV.NODE_ENV}`);
      console.log(`  REST API: ${ENV.CLIENT_URL}/api/v1`);
      console.log(`  Health Check: ${ENV.CLIENT_URL}/api/health`);
      console.log(`====================================================`);
    };

    // Listen on assigned port (or socket path if Phusion Passenger / pipe)
    if (typeof port === 'number') {
      serverInstance = app.listen(port, '0.0.0.0', handleListening);
    } else {
      serverInstance = app.listen(port, handleListening);
    }

    serverInstance.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[GKA Server Notice] Port/Pipe ${port} is already active. Existing process is handling traffic.`);
      } else {
        console.error('[Server Error] Server listener error:', err.message);
      }
    });

    // Secondary dev port only in development
    if (ENV.NODE_ENV === 'development' && port !== 3000) {
      try {
        const secondary = app.listen(3000, () => {
          console.log(`  Development Secondary Port: 3000`);
        });
        secondary.on('error', () => {
          // Safe to ignore if in use
        });
      } catch (secErr) {
        // Safe to ignore
      }
    }

    // Connect to database in non-blocking manner and initialize default accounts
    connectDB()
      .then(() => {
        ensureDefaultUsers().catch((e) => console.warn('[Auth Provisioning] Notice:', e.message));
      })
      .catch((dbErr: any) => {
        console.warn('[Database Error] Database initialization warning:', dbErr.message);
      });
  } catch (error: any) {
    console.error('[Server Error] Fatal startup error:', error.message || error);
  }
};

startServer();

export { app, serverInstance as server };
export default app;


