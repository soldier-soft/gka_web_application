"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminResetPassword = exports.getAllUsers = exports.changePassword = exports.updateProfile = exports.getProfile = exports.getMe = exports.login = void 0;
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
const getProfile = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }
        let user = null;
        let clientData = null;
        try {
            if (!req.user.id.startsWith('official-')) {
                user = await User_1.User.findById(req.user.id)
                    .select('-passwordHash -defaultPassword')
                    .populate('assignedProjects', 'title code status city');
            }
        }
        catch { }
        if (user) {
            if (user.role === 'client' || user.clientId) {
                try {
                    clientData = await Client_1.Client.findOne({ $or: [{ _id: user.clientId }, { userId: user._id }] });
                }
                catch { }
            }
            res.json({
                success: true,
                user: {
                    id: user._id,
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isActive: user.isActive,
                    avatarUrl: user.avatarUrl,
                    assignedProjects: user.assignedProjects,
                    clientId: user.clientId,
                    createdAt: user.createdAt,
                    lastLoginAt: user.lastLoginAt,
                    clientDetails: clientData
                        ? {
                            companyName: clientData.companyName,
                            alternatePhone: clientData.alternatePhone,
                            billingAddress: clientData.billingAddress,
                            gstin: clientData.billingAddress?.gstin,
                            pan: clientData.billingAddress?.pan,
                            notes: clientData.notes,
                        }
                        : undefined,
                },
            });
            return;
        }
        // Fallback for official user accounts
        const official = defaultCredentials_1.OFFICIAL_CREDENTIALS.find((c) => c.email.toLowerCase() === req.user?.email.toLowerCase());
        if (official) {
            res.json({
                success: true,
                user: {
                    id: req.user.id,
                    _id: req.user.id,
                    name: official.name,
                    email: official.email,
                    phone: official.phone,
                    role: official.role,
                    isActive: true,
                    clientId: req.user.clientId,
                    createdAt: new Date('2024-01-01').toISOString(),
                    lastLoginAt: new Date().toISOString(),
                    clientDetails: official.role === 'client'
                        ? {
                            companyName: official.companyName || 'Roots Corporation Ltd / Ginger Hotel',
                            alternatePhone: '044-67200000',
                            billingAddress: {
                                street: 'Ginger Hotel, Rajiv Gandhi Salai (OMR), Navalur',
                                city: 'Chennai',
                                state: 'Tamil Nadu',
                                pincode: '600130',
                                gstin: '33AABCR1234F1ZX',
                                pan: 'AABCR1234F',
                            },
                        }
                        : undefined,
                },
            });
            return;
        }
        res.status(404).json({ success: false, message: 'User not found' });
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }
        const { name, phone, avatarUrl, companyName, alternatePhone, billingAddress } = req.body;
        let user = null;
        try {
            if (!req.user.id.startsWith('official-')) {
                user = await User_1.User.findById(req.user.id);
            }
        }
        catch { }
        if (user) {
            if (name)
                user.name = name.trim();
            if (phone)
                user.phone = phone.trim();
            if (avatarUrl !== undefined)
                user.avatarUrl = avatarUrl;
            await user.save();
            if (user.role === 'client' || user.clientId) {
                try {
                    const client = await Client_1.Client.findOne({ $or: [{ _id: user.clientId }, { userId: user._id }] });
                    if (client) {
                        if (name)
                            client.name = name.trim();
                        if (phone)
                            client.phone = phone.trim();
                        if (companyName)
                            client.companyName = companyName.trim();
                        if (alternatePhone !== undefined)
                            client.alternatePhone = alternatePhone.trim();
                        if (billingAddress) {
                            client.billingAddress = {
                                ...client.billingAddress,
                                ...billingAddress,
                            };
                        }
                        await client.save();
                    }
                }
                catch { }
            }
            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: {
                    id: user._id,
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    avatarUrl: user.avatarUrl,
                },
            });
            return;
        }
        // If official user (fallback in-memory)
        const official = defaultCredentials_1.OFFICIAL_CREDENTIALS.find((c) => c.email.toLowerCase() === req.user?.email.toLowerCase());
        if (official) {
            if (name)
                official.name = name.trim();
            if (phone)
                official.phone = phone.trim();
            if (companyName)
                official.companyName = companyName.trim();
            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: {
                    id: req.user.id,
                    _id: req.user.id,
                    name: official.name,
                    email: official.email,
                    phone: official.phone,
                    role: official.role,
                },
            });
            return;
        }
        res.status(404).json({ success: false, message: 'User not found' });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            res.status(400).json({ success: false, message: 'Current password and new password are required' });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
            return;
        }
        let user = null;
        try {
            if (!req.user.id.startsWith('official-')) {
                user = await User_1.User.findById(req.user.id);
            }
        }
        catch { }
        if (user) {
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                res.status(400).json({ success: false, message: 'Current password does not match' });
                return;
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            user.passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
            user.defaultPassword = undefined;
            await user.save();
            res.json({ success: true, message: 'Password updated successfully' });
            return;
        }
        // Fallback for official account
        const official = defaultCredentials_1.OFFICIAL_CREDENTIALS.find((c) => c.email.toLowerCase() === req.user?.email.toLowerCase());
        if (official) {
            if (official.password !== currentPassword) {
                res.status(400).json({ success: false, message: 'Current password does not match' });
                return;
            }
            official.password = newPassword;
            res.json({ success: true, message: 'Password updated successfully' });
            return;
        }
        res.status(404).json({ success: false, message: 'User not found' });
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
const getAllUsers = async (req, res, next) => {
    try {
        let users = [];
        try {
            users = await User_1.User.find()
                .select('-passwordHash -defaultPassword')
                .populate('assignedProjects', 'title code status')
                .sort({ role: 1, name: 1 })
                .lean();
        }
        catch { }
        if (!users || users.length === 0) {
            // Fallback to official credentials list
            users = defaultCredentials_1.OFFICIAL_CREDENTIALS.map((cred, idx) => ({
                _id: `user-official-${idx}`,
                id: `user-official-${idx}`,
                name: cred.name,
                email: cred.email,
                phone: cred.phone,
                role: cred.role,
                isActive: true,
                createdAt: new Date('2024-01-01').toISOString(),
                lastLoginAt: new Date().toISOString(),
            }));
        }
        res.json({
            success: true,
            users,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllUsers = getAllUsers;
const adminResetPassword = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }
        // Only super_admin or project_manager can reset other users' passwords
        if (req.user.role !== 'super_admin' && req.user.role !== 'project_manager') {
            res.status(403).json({ success: false, message: 'Permission denied. Only admins can reset user passwords.' });
            return;
        }
        const { userId, newPassword } = req.body;
        if (!userId || !newPassword) {
            res.status(400).json({ success: false, message: 'User ID and new password are required' });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
            return;
        }
        let user = null;
        try {
            if (!userId.startsWith('user-official-') && !userId.startsWith('official-')) {
                user = await User_1.User.findById(userId);
            }
        }
        catch { }
        if (user) {
            const salt = await bcryptjs_1.default.genSalt(10);
            user.passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
            user.defaultPassword = newPassword;
            await user.save();
            res.json({
                success: true,
                message: `Password for ${user.name} (${user.email}) updated successfully!`,
            });
            return;
        }
        // Fallback for official account
        const targetOfficial = defaultCredentials_1.OFFICIAL_CREDENTIALS.find((c, idx) => `user-official-${idx}` === userId ||
            `official-${c.role}` === userId ||
            c.email.toLowerCase() === userId.toLowerCase());
        if (targetOfficial) {
            targetOfficial.password = newPassword;
            res.json({
                success: true,
                message: `Password for ${targetOfficial.name} (${targetOfficial.email}) updated successfully!`,
            });
            return;
        }
        res.status(404).json({ success: false, message: 'User account not found' });
    }
    catch (error) {
        next(error);
    }
};
exports.adminResetPassword = adminResetPassword;
