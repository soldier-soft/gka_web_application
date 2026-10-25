"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../../models/User");
const Client_1 = require("../../models/Client");
const env_1 = require("../../config/env");
const defaultCredentials_1 = require("./defaultCredentials");
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required.' });
            return;
        }
        const cleanEmail = email.toLowerCase().trim();
        const officialCred = defaultCredentials_1.OFFICIAL_CREDENTIALS.find((c) => c.email.toLowerCase() === cleanEmail);
        let user = null;
        let dbQueryOk = true;
        try {
            user = await User_1.User.findOne({ email: cleanEmail });
        }
        catch (dbErr) {
            console.warn('[Auth DB Warning] Database query error:', dbErr.message);
            dbQueryOk = false;
        }
        // 1. If user record is missing in DB, but matches official credential
        if (!user && officialCred) {
            if (officialCred.password !== password) {
                res.status(401).json({ success: false, message: 'Invalid credentials.' });
                return;
            }
            // Auto-provision user into MongoDB if database is accessible
            if (dbQueryOk) {
                try {
                    const salt = await bcryptjs_1.default.genSalt(10);
                    const passwordHash = await bcryptjs_1.default.hash(officialCred.password, salt);
                    user = await User_1.User.create({
                        name: officialCred.name,
                        email: officialCred.email,
                        phone: officialCred.phone,
                        passwordHash,
                        defaultPassword: officialCred.password,
                        role: officialCred.role,
                        isActive: true,
                    });
                    if (officialCred.role === 'client') {
                        const client = await Client_1.Client.create({
                            userId: user._id,
                            name: officialCred.name,
                            companyName: officialCred.companyName || officialCred.name,
                            email: officialCred.email,
                            phone: officialCred.phone,
                            billingAddress: {
                                street: 'Ginger Hotel, Rajiv Gandhi Salai (OMR), Navalur',
                                city: 'Chennai',
                                state: 'Tamil Nadu',
                                pincode: '600130',
                            },
                        });
                        user.clientId = client._id;
                        await user.save();
                    }
                    console.log(`[Auth Provisioning] Auto-provisioned missing user on login: ${officialCred.email}`);
                }
                catch (provErr) {
                    console.warn('[Auth Provisioning Warning]:', provErr.message);
                }
            }
        }
        // 2. If user exists in MongoDB
        if (user) {
            if (!user.isActive) {
                if (officialCred) {
                    user.isActive = true;
                    await user.save();
                }
                else {
                    res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
                    return;
                }
            }
            let isMatch = await user.comparePassword(password);
            if (!isMatch && officialCred && officialCred.password === password) {
                // Password in DB was out of date with credential file; update it automatically
                const salt = await bcryptjs_1.default.genSalt(10);
                user.passwordHash = await bcryptjs_1.default.hash(officialCred.password, salt);
                await user.save();
                isMatch = true;
            }
            if (!isMatch) {
                res.status(401).json({ success: false, message: 'Invalid credentials.' });
                return;
            }
            // Check if user is linked to a client record
            let clientId = user.clientId?.toString();
            if (!clientId && user.role === 'client') {
                const client = await Client_1.Client.findOne({ userId: user._id });
                if (client) {
                    clientId = client._id.toString();
                }
            }
            try {
                user.lastLoginAt = new Date();
                await user.save();
            }
            catch { }
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
            return;
        }
        // 3. Fallback: If MongoDB is offline or query failed, but official credentials match
        if (officialCred) {
            if (officialCred.password !== password) {
                res.status(401).json({ success: false, message: 'Invalid credentials.' });
                return;
            }
            const payload = {
                id: `official-${officialCred.role}`,
                name: officialCred.name,
                email: officialCred.email,
                role: officialCred.role,
                clientId: officialCred.role === 'client' ? 'client-official-001' : undefined,
            };
            const token = jsonwebtoken_1.default.sign(payload, env_1.ENV.JWT_SECRET, { expiresIn: env_1.ENV.JWT_EXPIRES_IN });
            res.json({
                success: true,
                token,
                user: {
                    id: `official-${officialCred.role}`,
                    name: officialCred.name,
                    email: officialCred.email,
                    phone: officialCred.phone,
                    role: officialCred.role,
                    clientId: officialCred.role === 'client' ? 'client-official-001' : undefined,
                },
            });
            return;
        }
        // Default rejection for invalid user
        res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
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
        let user = null;
        try {
            if (!req.user.id.startsWith('official-')) {
                user = await User_1.User.findById(req.user.id).select('-passwordHash');
            }
        }
        catch { }
        if (!user) {
            const official = defaultCredentials_1.OFFICIAL_CREDENTIALS.find((c) => c.email.toLowerCase() === req.user?.email.toLowerCase());
            if (official) {
                res.json({
                    success: true,
                    user: {
                        id: req.user.id,
                        name: official.name,
                        email: official.email,
                        phone: official.phone,
                        role: official.role,
                        clientId: req.user.clientId,
                    },
                });
                return;
            }
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
