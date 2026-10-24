"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const startServer = async () => {
    try {
        const app = (0, app_1.createApp)();
        const port = env_1.ENV.PORT;
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`====================================================`);
            console.log(`  GKA CONSTRUCTION ERP SERVER RUNNING`);
            console.log(`  Port: ${port}`);
            console.log(`  Environment: ${env_1.ENV.NODE_ENV}`);
            console.log(`  REST API: http://localhost:${port}/api/v1`);
            console.log(`  Health Check: http://localhost:${port}/api/health`);
            console.log(`====================================================`);
        });
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`[Server Error] Port ${port} is already in use by another process.`);
            }
            else {
                console.error('[Server Error] Server listener error:', err.message);
            }
            process.exit(1);
        });
        // Connect to database in non-blocking manner so HTTP server starts instantly
        (0, db_1.connectDB)().catch((dbErr) => {
            console.error('[Database Error] Database initialization warning:', dbErr.message);
        });
    }
    catch (error) {
        console.error('[Server Error] Fatal startup error:', error.message || error);
        process.exit(1);
    }
};
startServer();
