#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
// Prevent process crashes on unhandled errors in production
process.on('uncaughtException', (err) => {
    console.error('[GKA Server] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[GKA Server] Unhandled Rejection at:', promise, 'reason:', reason);
});
const startServer = async () => {
    try {
        const app = (0, app_1.createApp)();
        const port = env_1.ENV.PORT;
        // Listen on assigned port across all network interfaces
        const server = app.listen(port, () => {
            console.log(`====================================================`);
            console.log(`  GKA CONSTRUCTION ERP PRODUCTION SERVER`);
            console.log(`  Domain: ${env_1.ENV.CLIENT_URL}`);
            console.log(`  Port: ${port}`);
            console.log(`  Environment: ${env_1.ENV.NODE_ENV}`);
            console.log(`  REST API: ${env_1.ENV.CLIENT_URL}/api/v1`);
            console.log(`  Health Check: ${env_1.ENV.CLIENT_URL}/api/health`);
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
