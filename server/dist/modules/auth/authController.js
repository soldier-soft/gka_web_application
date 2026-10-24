"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../../models/User");
const Client_1 = require("../../models/Client");
const env_1 = require("../../config/env");
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required.' });
            return;
        }
        const user = await User_1.User.findOne({ email: email.toLowerCase().trim() });
        if (!user || !user.isActive) {
            res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid credentials.' });
            return;
        }
        // Check if user is linked to a client record
        let clientId;
        if (user.role === 'client') {
            const client = await Client_1.Client.findOne({ userId: user._id });
            if (client) {
                clientId = client._id.toString();
            }
        }
        user.lastLoginAt = new Date();
        await user.save();
        const payload = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            clientId,
        };
        const token = jsonwebtoken_1.default.sign(payload, env_1.ENV.JWT_SECRET, { expiresIn: env_1.ENV.JWT_EXPIRES_IN });
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                clientId,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }
        const user = await User_1.User.findById(req.user.id).select('-passwordHash');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                clientId: req.user.clientId,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
