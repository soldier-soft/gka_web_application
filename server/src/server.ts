import { createApp } from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';

const startServer = async () => {
  try {
    await connectDB();
    const app = createApp();

    app.listen(ENV.PORT, () => {
      console.log(`====================================================`);
      console.log(`  GKA CONSTRUCTION ERP SERVER RUNNING`);
      console.log(`  Port: ${ENV.PORT}`);
      console.log(`  Environment: ${ENV.NODE_ENV}`);
      console.log(`  REST API: http://localhost:${ENV.PORT}/api/v1`);
      console.log(`  Health Check: http://localhost:${ENV.PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
