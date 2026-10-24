"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.ENV = {
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gka_construction_erp',
    JWT_SECRET: process.env.JWT_SECRET || 'gka-super-secure-production-jwt-secret-key-2026',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
    UPLOAD_DIR: process.env.UPLOAD_DIR || path_1.default.resolve(__dirname, '../../uploads'),
};
