"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const startServer = async () => {
    try {
        await (0, db_1.connectDB)();
        const app = (0, app_1.createApp)();
        app.listen(env_1.ENV.PORT, '0.0.0.0', () => {
            console.log(`====================================================`);
            console.log(`  GKA CONSTRUCTION ERP SERVER RUNNING`);
            console.log(`  Port: ${env_1.ENV.PORT}`);
            console.log(`  Environment: ${env_1.ENV.NODE_ENV}`);
            console.log(`  REST API: http://localhost:${env_1.ENV.PORT}/api/v1`);
            console.log(`  Health Check: http://localhost:${env_1.ENV.PORT}/api/health`);
            console.log(`====================================================`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
