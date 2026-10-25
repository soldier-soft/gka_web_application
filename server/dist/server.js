#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const defaultCredentials_1 = require("./modules/auth/defaultCredentials");
// Prevent process crashes on unhandled errors in production
process.on('uncaughtException', (err) => {
    console.error('[GKA Server] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[GKA Server] Unhandled Rejection at:', promise, 'reason:', reason);
});
const app = (0, app_1.createApp)();
exports.app = app;
const port = env_1.ENV.PORT;
let serverInstance = null;
exports.server = serverInstance;
const startServer = async () => {
    try {
        const handleListening = () => {
            console.log(`====================================================`);
            console.log(`  GKA CONSTRUCTION ERP PRODUCTION SERVER`);
            console.log(`  Domain: ${env_1.ENV.CLIENT_URL}`);
            console.log(`  Listening Target: ${port}`);
            console.log(`  Environment: ${env_1.ENV.NODE_ENV}`);
            console.log(`  REST API: ${env_1.ENV.CLIENT_URL}/api/v1`);
            console.log(`  Health Check: ${env_1.ENV.CLIENT_URL}/api/health`);
            console.log(`====================================================`);
        };
        // Listen on assigned port (or socket path if Phusion Passenger / pipe)
        if (typeof port === 'number') {
            exports.server = serverInstance = app.listen(port, '0.0.0.0', handleListening);
        }
        else {
            exports.server = serverInstance = app.listen(port, handleListening);
        }
        serverInstance.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.warn(`[GKA Server Notice] Port/Pipe ${port} is already active. Existing process is handling traffic.`);
            }
            else {
                console.error('[Server Error] Server listener error:', err.message);
            }
        });
        // Secondary dev port only in development
        if (env_1.ENV.NODE_ENV === 'development' && port !== 3000) {
            try {
                const secondary = app.listen(3000, () => {
                    console.log(`  Development Secondary Port: 3000`);
                });
                secondary.on('error', () => {
                    // Safe to ignore if in use
                });
            }
            catch (secErr) {
                // Safe to ignore
            }
        }
        // Connect to database in non-blocking manner and initialize default accounts
        (0, db_1.connectDB)()
            .then(() => {
            (0, defaultCredentials_1.ensureDefaultUsers)().catch((e) => console.warn('[Auth Provisioning] Notice:', e.message));
        })
            .catch((dbErr) => {
            console.warn('[Database Error] Database initialization warning:', dbErr.message);
        });
    }
    catch (error) {
        console.error('[Server Error] Fatal startup error:', error.message || error);
    }
};
startServer();
exports.default = app;
