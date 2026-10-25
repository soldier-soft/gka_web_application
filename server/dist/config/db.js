"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const connectDB = async () => {
    mongoose_1.default.set('strictQuery', true);
    const connectOptions = {
        autoIndex: true,
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        dbName: 'gka_construction_erp',
    };
    // 1. Attempt primary MongoDB connection (e.g. MongoDB Atlas)
    try {
        const maskedUri = env_1.ENV.MONGODB_URI.replace(/:[^:]*@/, ':***@');
        console.log(`[MongoDB] Connecting to primary database: ${maskedUri}...`);
        await mongoose_1.default.connect(env_1.ENV.MONGODB_URI, connectOptions);
        console.log(`[MongoDB] Connected successfully to ${mongoose_1.default.connection.host}/${mongoose_1.default.connection.name}`);
        return;
    }
    catch (error) {
        console.warn(`[MongoDB] Primary connection failed: ${error.message}`);
        console.warn('[MongoDB] (Note: Ensure 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access for cloud access)');
    }
    // 2. Fallback to Local MongoDB (running on 127.0.0.1:27017)
    const fallbackUris = [
        'mongodb://127.0.0.1:27017/gka_construction_erp',
        'mongodb://localhost:27017/gka_construction_erp',
    ];
    for (const uri of fallbackUris) {
        try {
            console.log(`[MongoDB] Connecting to fallback local database (${uri})...`);
            await mongoose_1.default.connect(uri, { ...connectOptions, serverSelectionTimeoutMS: 3000 });
            console.log(`[MongoDB] Connected successfully to fallback local database: ${uri}`);
            return;
        }
        catch (fallbackErr) {
            console.warn(`[MongoDB] Fallback connection to ${uri} failed: ${fallbackErr.message}`);
        }
    }
    console.error('[MongoDB] Warning: Could not connect to Atlas or local MongoDB. Server will remain running.');
};
exports.connectDB = connectDB;
