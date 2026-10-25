"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Safely discover and load .env from multiple potential deployment locations
const envCandidates = [
    path_1.default.resolve(process.cwd(), '.env'),
    path_1.default.resolve(process.cwd(), 'server/.env'),
    path_1.default.resolve(__dirname, '../../.env'),
    path_1.default.resolve(__dirname, '../../../.env'),
];
for (const envPath of envCandidates) {
    if (fs_1.default.existsSync(envPath)) {
        dotenv_1.default.config({ path: envPath });
    }
}
// Fallback to default dotenv if not already loaded
dotenv_1.default.config();
// Safely resolve PORT (supporting numbers, Hostinger Passenger sockets, and named pipes)
const rawPort = process.env.PORT;
let parsedPort = 5000;
if (rawPort !== undefined && rawPort !== '') {
    const numericPort = parseInt(rawPort, 10);
    if (!isNaN(numericPort) && numericPort > 0) {
        parsedPort = numericPort;
    }
    else {
        // If rawPort is a named pipe or unix socket path (common in Phusion Passenger on Hostinger / CloudLinux)
        parsedPort = rawPort;
    }
}
exports.ENV = {
    PORT: parsedPort,
    NODE_ENV: process.env.NODE_ENV || 'production',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gka_construction_erp',
    JWT_SECRET: process.env.JWT_SECRET || 'gka-super-secure-production-jwt-secret-key-2026',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    CLIENT_URL: process.env.CLIENT_URL || 'https://www.gkaconstruction.com',
    UPLOAD_DIR: process.env.UPLOAD_DIR || path_1.default.resolve(process.cwd(), 'uploads'),
};
