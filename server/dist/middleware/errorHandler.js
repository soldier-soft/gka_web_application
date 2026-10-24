"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    console.error('[Error Logger]:', err);
    // Handle Zod Schema Validation Errors
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }
    // Handle MongoDB Duplicate Key (E11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        res.status(409).json({
            success: false,
            message: `A record with this ${field} already exists.`,
        });
        return;
    }
    // Handle Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        res.status(400).json({
            success: false,
            message: `Invalid ID format for ${err.path}`,
        });
        return;
    }
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
};
exports.errorHandler = errorHandler;
