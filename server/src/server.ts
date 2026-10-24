import { createApp } from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';

const startServer = async () => {
  try {
    const app = createApp();
    const port = ENV.PORT;

    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`  GKA CONSTRUCTION ERP SERVER RUNNING`);
      console.log(`  Port: ${port}`);
      console.log(`  Environment: ${ENV.NODE_ENV}`);
      console.log(`  REST API: http://localhost:${port}/api/v1`);
      console.log(`  Health Check: http://localhost:${port}/api/health`);
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
