"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDefaultUsers = exports.OFFICIAL_CREDENTIALS = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../../models/User");
const Client_1 = require("../../models/Client");
exports.OFFICIAL_CREDENTIALS = [
    {
        name: 'Arivazhagan (Managing Director)',
        email: 'owner@gkaconstruction.com',
        password: 'GKAadmin2026!',
        role: 'super_admin',
        phone: '88380 30917',
        portal: '/admin/dashboard',
    },
    {
        name: 'R. Senthil Kumar (Senior Project Manager)',
        email: 'pm@gkaconstruction.com',
        password: 'GKApm2026!',
        role: 'project_manager',
        phone: '98401 23456',
        portal: '/admin/projects',
    },
    {
        name: 'K. Murugan (Site Engineer & Supervisor)',
        email: 'supervisor@gkaconstruction.com',
        password: 'GKAsuper2026!',
        role: 'site_supervisor',
        phone: '97890 12345',
        portal: '/admin/site-ops',
    },
    {
        name: 'P. Deepa (Billing & Accounts Lead)',
        email: 'accounts@gkaconstruction.com',
        password: 'GKAaccounts2026!',
        role: 'accounts',
        phone: '94440 98765',
        portal: '/admin/finance',
    },
    {
        name: 'Roots Corporation Limited (Ginger Hotel)',
        email: 'client@gingerhotel.com',
        password: 'GKAclient2026!',
        role: 'client',
        phone: '98840 55677',
        portal: '/client-portal',
        companyName: 'Roots Corporation Ltd / Ginger Hotel',
    },
];
/**
 * Ensures all 5 standard official system accounts exist in the database with their correct passwords and active status.
 */
const ensureDefaultUsers = async () => {
    try {
        for (const cred of exports.OFFICIAL_CREDENTIALS) {
            const email = cred.email.toLowerCase().trim();
            let user = await User_1.User.findOne({ email });
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(cred.password, salt);
            if (!user) {
                user = await User_1.User.create({
                    name: cred.name,
                    email,
                    phone: cred.phone,
                    passwordHash,
                    defaultPassword: cred.password,
                    role: cred.role,
                    isActive: true,
                });
                console.log(`[Auth Provisioning] Initialized default user: ${cred.email} (${cred.role})`);
            }
            else {
                let needsSave = false;
                if (!user.isActive) {
                    user.isActive = true;
                    needsSave = true;
                }
                if (user.role !== cred.role) {
                    user.role = cred.role;
                    needsSave = true;
                }
                const matches = await user.comparePassword(cred.password);
                if (!matches) {
                    user.passwordHash = passwordHash;
                    needsSave = true;
                }
                if (needsSave) {
                    await user.save();
                    console.log(`[Auth Provisioning] Synced credentials for: ${cred.email}`);
                }
            }
            // If client account, ensure Client profile exists and is linked
            if (cred.role === 'client' && user) {
                let client = await Client_1.Client.findOne({ $or: [{ userId: user._id }, { email }] });
                if (!client) {
                    client = await Client_1.Client.create({
                        userId: user._id,
                        name: cred.name,
                        companyName: cred.companyName || cred.name,
                        email,
                        phone: cred.phone,
                        billingAddress: {
                            street: 'Ginger Hotel, Rajiv Gandhi Salai (OMR), Navalur',
                            city: 'Chennai',
                            state: 'Tamil Nadu',
                            pincode: '600130',
                            gstin: '33AABCR1234F1ZX',
                            pan: 'AABCR1234F',
                        },
                        notes: 'Official verified client portal account.',
                    });
                    console.log('[Auth Provisioning] Initialized verified Client record for Ginger Hotel');
                }
                if (!user.clientId && client) {
                    user.clientId = client._id;
                    await user.save();
                }
            }
        }
    }
    catch (error) {
        console.warn('[Auth Provisioning] Notice during user provisioning:', error.message);
    }
};
exports.ensureDefaultUsers = ensureDefaultUsers;
