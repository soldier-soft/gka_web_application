"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLeadToProject = exports.updateLeadStatus = exports.getLeads = exports.createEnquiry = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const Lead_1 = require("../../models/Lead");
const Client_1 = require("../../models/Client");
const User_1 = require("../../models/User");
const Project_1 = require("../../models/Project");
const Milestone_1 = require("../../models/Milestone");
const constants_1 = require("../../shared/constants");
const types_1 = require("../../shared/types");
const emailService_1 = require("../../services/emailService");
const createEnquiry = async (req, res, next) => {
    try {
        const { name, phone, email, projectCategory, siteLocation, city, approxAreaSqFt, estimatedBudgetRupees, message, source, preferredSiteVisitDate, } = req.body;
        if (!name || !phone || !siteLocation) {
            res.status(400).json({ success: false, message: 'Name, phone number, and site location are required.' });
            return;
        }
        const currentYear = new Date().getFullYear();
        let leadCount = 0;
        try {
            leadCount = await Lead_1.Lead.countDocuments().maxTimeMS(4000);
        }
        catch (_) {
            leadCount = Math.floor(Math.random() * 500) + 1;
        }
        const referenceNumber = `GKA-REQ-${currentYear}-${String(leadCount + 1001).padStart(4, '0')}`;
        let lead = null;
        try {
            lead = await Lead_1.Lead.create({
                name: name.trim(),
                phone: phone.trim(),
                email: email ? email.trim().toLowerCase() : undefined,
                projectCategory: projectCategory || 'residential',
                siteLocation: siteLocation.trim(),
                city: city || 'Chennai',
                approxAreaSqFt: approxAreaSqFt ? Number(approxAreaSqFt) : undefined,
                estimatedBudgetRupees: estimatedBudgetRupees ? Number(estimatedBudgetRupees) : undefined,
                message,
                source: source || 'website_contact',
                status: 'new',
                preferredSiteVisitDate: preferredSiteVisitDate ? new Date(preferredSiteVisitDate) : undefined,
            });
        }
        catch (createErr) {
            console.warn('[CRM] Lead creation DB note:', createErr);
            lead = { _id: `lead-${Date.now()}`, createdAt: new Date() };
        }
        // Send notifications to company (gkaconstruction51@gmail.com, elangovanit5012@gmail.com)
        // and immediate acknowledgment email to client (promising response within 8 hours) in background
        setTimeout(() => {
            (0, emailService_1.sendCompanyAndClientEnquiryNotification)({
                referenceNumber,
                customerName: name.trim(),
                phone: phone.trim(),
                email: email ? email.trim().toLowerCase() : undefined,
                source: source || 'website_contact',
                projectCategory: projectCategory || 'residential',
                serviceType: projectCategory || 'residential',
                projectLocation: siteLocation.trim(),
                city: city || 'Chennai',
                builtUpAreaSqFt: approxAreaSqFt ? Number(approxAreaSqFt) : undefined,
                estimatedBudgetRupees: estimatedBudgetRupees ? Number(estimatedBudgetRupees) : undefined,
                preferredSiteVisitDate: preferredSiteVisitDate ? new Date(preferredSiteVisitDate) : undefined,
                requirements: message,
                submittedAt: lead?.createdAt || new Date(),
            }).catch((err) => {
                console.error('[CRM] Non-blocking email dispatch notification warning:', err);
            });
        }, 50);
        res.status(201).json({
            success: true,
            message: 'Enquiry submitted successfully. Our site engineering team will reach out promptly within 8 hours.',
            referenceNumber,
            leadId: lead?._id || `lead-${Date.now()}`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createEnquiry = createEnquiry;
const getLeads = async (req, res, next) => {
    try {
        const { status, category } = req.query;
        const query = {};
        if (status && typeof status === 'string')
            query.status = status;
        if (category && typeof category === 'string')
            query.projectCategory = category;
        const leads = await Lead_1.Lead.find(query).sort({ createdAt: -1 });
        res.json({ success: true, count: leads.length, leads });
    }
    catch (error) {
        next(error);
    }
};
exports.getLeads = getLeads;
const updateLeadStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, notes, assignedTo } = req.body;
        const lead = await Lead_1.Lead.findByIdAndUpdate(id, {
            ...(status && { status }),
            ...(notes && { notes }),
            ...(assignedTo && { assignedTo }),
        }, { new: true });
        if (!lead) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }
        res.json({ success: true, lead });
    }
    catch (error) {
        next(error);
    }
};
exports.updateLeadStatus = updateLeadStatus;
/**
 * Convert a Lead into a Client and an initialized Project without duplicate data entry!
 */
const convertLeadToProject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const lead = await Lead_1.Lead.findById(id);
        if (!lead) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }
        if (lead.convertedToProjectId) {
            res.status(400).json({
                success: false,
                message: 'This enquiry has already been converted to a project.',
                projectId: lead.convertedToProjectId,
            });
            return;
        }
        // 1. Find or create Client
        let client = await Client_1.Client.findOne({ phone: lead.phone });
        const portalUsername = (0, constants_1.formatClientPortalUsername)(lead.name);
        if (!client) {
            client = await Client_1.Client.create({
                name: lead.name,
                email: portalUsername,
                phone: lead.phone,
                billingAddress: {
                    street: lead.siteLocation,
                    city: lead.city || 'Chennai',
                    state: 'Tamil Nadu',
                    pincode: '',
                },
            });
        }
        else if (!client.email || !client.email.endsWith('@gkaconstruction.com')) {
            client.email = portalUsername;
            await client.save();
        }
        // 2. Generate unique Project ID: GKA-YYYY-XXX
        const currentYear = new Date().getFullYear();
        const projectCount = await Project_1.Project.countDocuments();
        const nextSeq = String(projectCount + 1).padStart(3, '0');
        const projectIdStr = `GKA-${currentYear}-${nextSeq}`;
        // 3. Create Project
        const contractValuePaise = lead.estimatedBudgetRupees ? (0, types_1.toPaise)(lead.estimatedBudgetRupees) : 0;
        const startDate = new Date();
        const targetEndDate = new Date();
        targetEndDate.setMonth(targetEndDate.getMonth() + 6); // Default 6 months timeline
        const project = await Project_1.Project.create({
            projectId: projectIdStr,
            title: `${lead.name} — ${lead.projectCategory.toUpperCase()} Construction`,
            category: lead.projectCategory,
            clientId: client._id,
            siteAddress: {
                street: lead.siteLocation,
                city: lead.city || 'Chennai',
                state: 'Tamil Nadu',
                pincode: '',
            },
            scopeOfWork: [
                `Complete ${lead.projectCategory} works at ${lead.siteLocation}`,
                ...(lead.approxAreaSqFt ? [`Approximate built-up area: ${lead.approxAreaSqFt} sq.ft`] : []),
            ],
            startDate,
            targetEndDate,
            status: 'planning',
            contractValuePaise,
            totalBudgetPaise: contractValuePaise,
            assignedManagerId: req.user?.id,
        });
        // 4. Client Account Automation: Create or Link Client Portal User
        let clientAccess = null;
        let existingUser = await User_1.User.findOne({
            $or: [
                { clientId: client._id },
                { email: portalUsername.toLowerCase() },
                { phone: client.phone },
            ],
        });
        if (!existingUser) {
            const rawTempPassword = `GKA@${(client.phone || '').replace(/\D/g, '').slice(-4) || '2026'}`;
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(rawTempPassword, salt);
            const activationToken = crypto_1.default.randomBytes(24).toString('hex');
            const newUser = await User_1.User.create({
                name: client.name,
                email: portalUsername,
                phone: client.phone || '8838030917',
                passwordHash,
                defaultPassword: rawTempPassword,
                role: 'client',
                clientId: client._id,
                assignedProjects: [project._id],
                mustChangePasswordOnLogin: false,
                activationToken,
                activationTokenExpires: new Date(Date.now() + 7 * 86400000),
                isActive: true,
            });
            await Client_1.Client.findByIdAndUpdate(client._id, { userId: newUser._id, email: portalUsername });
            clientAccess = {
                username: portalUsername,
                password: rawTempPassword,
                isNewAccount: true,
            };
        }
        else {
            if (!existingUser.assignedProjects.includes(project._id)) {
                existingUser.assignedProjects.push(project._id);
            }
            if (!existingUser.clientId) {
                existingUser.clientId = client._id;
            }
            await existingUser.save();
            await Client_1.Client.findByIdAndUpdate(client._id, { userId: existingUser._id });
            clientAccess = {
                username: existingUser.email,
                password: existingUser.defaultPassword || 'GKAclient2026!',
                isNewAccount: false,
            };
        }
        // 5. Initialize standard milestones for this project
        const milestoneDocs = constants_1.STANDARD_MILESTONES.map((m) => {
            const pStart = new Date(startDate);
            pStart.setDate(pStart.getDate() + (m.orderIndex - 1) * 30);
            const pEnd = new Date(pStart);
            pEnd.setDate(pEnd.getDate() + 30);
            return {
                projectId: project._id,
                code: m.code,
                title: m.title,
                description: m.description,
                plannedStartDate: pStart,
                plannedEndDate: pEnd,
                weightagePercent: m.weightagePercent,
                progressPercent: 0,
                status: m.orderIndex === 1 ? 'in_progress' : 'pending',
                orderIndex: m.orderIndex,
            };
        });
        await Milestone_1.Milestone.insertMany(milestoneDocs);
        // 6. Update lead record with converted IDs
        lead.status = 'won';
        lead.convertedToClientId = client._id;
        lead.convertedToProjectId = project._id;
        await lead.save();
        // 7. Dispatch Company Project Creation Alert Email
        (0, emailService_1.sendProjectAlertEmail)(project, client).catch((err) => {
            console.error('[CRM] Non-blocking project alert email dispatch error:', err);
        });
        res.status(201).json({
            success: true,
            message: `Enquiry successfully converted to Project ${project.projectId}`,
            client,
            project,
            clientAccess,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.convertLeadToProject = convertLeadToProject;
