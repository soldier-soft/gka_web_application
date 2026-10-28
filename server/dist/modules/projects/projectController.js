"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = exports.updateMilestone = exports.updateProject = exports.downloadProjectWelcomePDF = exports.createProject = exports.getProjectById = exports.getProjects = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const Project_1 = require("../../models/Project");
const Milestone_1 = require("../../models/Milestone");
const Expense_1 = require("../../models/Expense");
const Invoice_1 = require("../../models/Invoice");
const Payment_1 = require("../../models/Payment");
const SiteReport_1 = require("../../models/SiteReport");
const Client_1 = require("../../models/Client");
const User_1 = require("../../models/User");
const Quotation_1 = require("../../models/Quotation");
const TaxReconciliation_1 = require("../../models/TaxReconciliation");
const ClientFeedback_1 = require("../../models/ClientFeedback");
const pdfService_1 = require("../../services/pdfService");
const constants_1 = require("../../shared/constants");
const getProjects = async (req, res, next) => {
    try {
        const { status, category } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (category)
            filter.category = category;
        // If role is client, only allow projects belonging to their client account
        if (req.user?.role === 'client' && req.user.clientId) {
            filter.clientId = req.user.clientId;
        }
        const projects = await Project_1.Project.find(filter)
            .populate('clientId', 'name email phone companyName billingAddress')
            .populate('assignedManagerId', 'name email phone')
            .populate('assignedSupervisorId', 'name email phone')
            .sort({ createdAt: -1 });
        res.json({ success: true, count: projects.length, projects });
    }
    catch (error) {
        next(error);
    }
};
exports.getProjects = getProjects;
const getProjectById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const project = await Project_1.Project.findById(id)
            .populate('clientId')
            .populate('assignedManagerId', 'name email phone')
            .populate('assignedSupervisorId', 'name email phone');
        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }
        // Client security check
        if (req.user?.role === 'client' && req.user.clientId && project.clientId._id.toString() !== req.user.clientId) {
            res.status(403).json({ success: false, message: 'Forbidden. Access not permitted.' });
            return;
        }
        const isClientRole = req.user?.role === 'client';
        const milestones = await Milestone_1.Milestone.find({
            projectId: project._id,
            ...(isClientRole ? { isPublishedToClient: true } : {}),
        }).sort({ orderIndex: 1 });
        const siteReports = await SiteReport_1.SiteReport.find({
            projectId: project._id,
            ...(isClientRole ? { isPublishedToClient: true } : {}),
        }).sort({ reportDate: -1 });
        const invoices = await Invoice_1.Invoice.find({
            projectId: project._id,
            ...(isClientRole ? { status: { $ne: 'draft' } } : {}),
        }).sort({ issueDate: -1 });
        const payments = await Payment_1.Payment.find({
            projectId: project._id,
            ...(isClientRole ? { verificationStatus: { $in: ['verified', 'reconciled'] } } : {}),
        }).sort({ paymentDate: -1 });
        const quotations = await Quotation_1.Quotation.find({
            projectId: project._id,
            ...(isClientRole ? { status: { $in: ['sent', 'approved'] } } : {}),
        }).sort({ createdAt: -1 });
        const clientFeedbacks = await ClientFeedback_1.ClientFeedback.find({ projectId: project._id }).sort({ createdAt: -1 });
        // Internal costs (only for internal staff, NEVER exposed to client)
        const expenses = isClientRole
            ? []
            : await Expense_1.Expense.find({ projectId: project._id }).sort({ expenseDate: -1 });
        res.json({
            success: true,
            project,
            milestones,
            recentSiteReports: siteReports,
            invoices,
            payments,
            quotations,
            clientFeedbacks,
            expenses,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProjectById = getProjectById;
const createProject = async (req, res, next) => {
    try {
        const { title, category, clientId, siteAddress, scopeOfWork, startDate, targetEndDate, contractValuePaise, totalBudgetPaise, assignedManagerId, assignedSupervisorId, notes, } = req.body;
        const currentYear = new Date().getFullYear();
        const count = await Project_1.Project.countDocuments();
        const projectId = `GKA-${currentYear}-${String(count + 1).padStart(3, '0')}`;
        const project = await Project_1.Project.create({
            projectId,
            title,
            category: category || 'residential',
            clientId,
            siteAddress,
            scopeOfWork: scopeOfWork || [],
            startDate: new Date(startDate || Date.now()),
            targetEndDate: new Date(targetEndDate || Date.now() + 180 * 86400000),
            status: 'planning',
            contractValuePaise: contractValuePaise || 0,
            totalBudgetPaise: totalBudgetPaise || contractValuePaise || 0,
            assignedManagerId: assignedManagerId || req.user?.id,
            assignedSupervisorId,
            notes,
        });
        // Seed default standard milestones
        const milestoneDocs = constants_1.STANDARD_MILESTONES.map((m) => ({
            projectId: project._id,
            code: m.code,
            title: m.title,
            description: m.description,
            plannedStartDate: project.startDate,
            plannedEndDate: project.targetEndDate,
            weightagePercent: m.weightagePercent,
            progressPercent: 0,
            status: m.orderIndex === 1 ? 'in_progress' : 'pending',
            isPublishedToClient: true,
            orderIndex: m.orderIndex,
        }));
        await Milestone_1.Milestone.insertMany(milestoneDocs);
        // Client Account Automation: Link or securely invite client
        let clientAccess = null;
        const clientDoc = await Client_1.Client.findById(clientId);
        if (clientDoc) {
            let existingUser = await User_1.User.findOne({
                $or: [
                    { clientId: clientDoc._id },
                    { _id: clientDoc.userId },
                    { email: clientDoc.email.toLowerCase() },
                ],
            });
            if (!existingUser) {
                const portalUsername = clientDoc.email?.endsWith('@gkaconstruction.com')
                    ? clientDoc.email.toLowerCase()
                    : (0, constants_1.formatClientPortalUsername)(clientDoc.name);
                const rawTempPassword = `GKA@${(clientDoc.phone || '').replace(/\D/g, '').slice(-4) || '2026'}`;
                const salt = await bcryptjs_1.default.genSalt(10);
                const passwordHash = await bcryptjs_1.default.hash(rawTempPassword, salt);
                const activationToken = crypto_1.default.randomBytes(24).toString('hex');
                const newUser = await User_1.User.create({
                    name: clientDoc.name,
                    email: portalUsername,
                    phone: clientDoc.phone || '8838030917',
                    passwordHash,
                    defaultPassword: rawTempPassword,
                    role: 'client',
                    clientId: clientDoc._id,
                    assignedProjects: [project._id],
                    mustChangePasswordOnLogin: false,
                    activationToken,
                    activationTokenExpires: new Date(Date.now() + 7 * 86400000),
                    isActive: true,
                });
                await Client_1.Client.findByIdAndUpdate(clientDoc._id, { userId: newUser._id, email: portalUsername });
                clientAccess = {
                    username: portalUsername,
                    password: rawTempPassword,
                    isNewAccount: true,
                    activationToken,
                    message: 'Client portal account automatically created with @gkaconstruction.com domain.',
                };
            }
            else {
                // Link project to existing client user
                if (!existingUser.assignedProjects.includes(project._id)) {
                    existingUser.assignedProjects.push(project._id);
                }
                if (!existingUser.clientId) {
                    existingUser.clientId = clientDoc._id;
                }
                await existingUser.save();
                await Client_1.Client.findByIdAndUpdate(clientDoc._id, { userId: existingUser._id });
                clientAccess = {
                    username: existingUser.email,
                    password: existingUser.defaultPassword || 'GKAclient2026!',
                    isNewAccount: false,
                    message: 'Existing client account linked to this new project workspace.',
                };
            }
        }
        res.status(201).json({ success: true, project, clientAccess });
    }
    catch (error) {
        next(error);
    }
};
exports.createProject = createProject;
const downloadProjectWelcomePDF = async (req, res, next) => {
    try {
        const { id } = req.params;
        const project = await Project_1.Project.findById(id);
        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }
        const client = await Client_1.Client.findById(project.clientId);
        if (!client) {
            res.status(404).json({ success: false, message: 'Client record not found' });
            return;
        }
        // Find or automatically create user account for this client with default password
        let user = await User_1.User.findOne({ email: client.email.toLowerCase() });
        let defaultPassword = user?.defaultPassword;
        if (!user) {
            const cleanPhoneDigits = (client.phone || '').replace(/\D/g, '').slice(-4);
            defaultPassword = `GKA@${cleanPhoneDigits || '2026'}`;
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(defaultPassword, salt);
            user = await User_1.User.create({
                name: client.name,
                email: client.email.toLowerCase(),
                phone: client.phone || '8838030917',
                passwordHash,
                defaultPassword,
                role: 'client',
                clientId: client._id,
                assignedProjects: [project._id],
                mustChangePasswordOnLogin: false,
                isActive: true,
            });
            await Client_1.Client.findByIdAndUpdate(client._id, { userId: user._id });
        }
        else if (!defaultPassword) {
            defaultPassword = 'GKAclient2026!';
            user.defaultPassword = defaultPassword;
            const salt = await bcryptjs_1.default.genSalt(10);
            user.passwordHash = await bcryptjs_1.default.hash(defaultPassword, salt);
            await user.save();
        }
        // Ensure project is linked to client user
        if (!user.assignedProjects.includes(project._id)) {
            user.assignedProjects.push(project._id);
            await user.save();
        }
        // Retrieve attached quotations and invoices for this project
        const quotations = await Quotation_1.Quotation.find({ projectId: project._id }).sort({ createdAt: -1 });
        const invoices = await Invoice_1.Invoice.find({ projectId: project._id }).sort({ issueDate: -1 });
        const host = req.get('host') || 'www.gkaconstruction.com';
        const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
        const portalUrl = isLocal ? 'http://localhost:3000/login' : 'https://www.gkaconstruction.com/login';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=GKA_Project_Welcome_${project.projectId}.pdf`);
        const pdfStream = pdfService_1.PDFService.generateProjectWelcomePDF(project, client, {
            portalUrl,
            username: user.email,
            temporaryPassword: defaultPassword,
            defaultPassword,
        }, quotations, invoices);
        pdfStream.pipe(res);
    }
    catch (error) {
        next(error);
    }
};
exports.downloadProjectWelcomePDF = downloadProjectWelcomePDF;
const updateProject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const project = await Project_1.Project.findByIdAndUpdate(id, req.body, { new: true })
            .populate('clientId')
            .populate('assignedManagerId', 'name email phone')
            .populate('assignedSupervisorId', 'name email phone');
        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }
        res.json({ success: true, project });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProject = updateProject;
const updateMilestone = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { progressPercent, status, actualStartDate, actualEndDate } = req.body;
        const milestone = await Milestone_1.Milestone.findByIdAndUpdate(id, {
            ...(progressPercent !== undefined && { progressPercent: Number(progressPercent) }),
            ...(status && { status }),
            ...(actualStartDate && { actualStartDate: new Date(actualStartDate) }),
            ...(actualEndDate && { actualEndDate: new Date(actualEndDate) }),
        }, { new: true });
        if (!milestone) {
            res.status(404).json({ success: false, message: 'Milestone not found' });
            return;
        }
        // Recalculate total project overall progress weighted by milestone weightage
        const allMilestones = await Milestone_1.Milestone.find({ projectId: milestone.projectId });
        let totalProgress = 0;
        allMilestones.forEach((m) => {
            totalProgress += (m.progressPercent * m.weightagePercent) / 100;
        });
        await Project_1.Project.findByIdAndUpdate(milestone.projectId, {
            progressPercent: Math.round(totalProgress),
        });
        res.json({ success: true, milestone });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMilestone = updateMilestone;
/**
 * Aggregated live ERP dashboard metrics
 */
const getDashboardStats = async (req, res, next) => {
    try {
        const totalProjects = await Project_1.Project.countDocuments();
        const activeProjects = await Project_1.Project.countDocuments({ status: 'active' });
        const planningProjects = await Project_1.Project.countDocuments({ status: 'planning' });
        const completedProjects = await Project_1.Project.countDocuments({ status: 'completed' });
        // Financial totals across projects
        const financialAggregation = await Project_1.Project.aggregate([
            {
                $group: {
                    _id: null,
                    totalContractValuePaise: { $sum: '$contractValuePaise' },
                    totalBudgetPaise: { $sum: '$totalBudgetPaise' },
                    totalActualCostPaise: { $sum: '$actualCostPaise' },
                    totalInvoicedPaise: { $sum: '$invoicedAmountPaise' },
                    totalCollectedPaise: { $sum: '$collectedAmountPaise' },
                },
            },
        ]);
        const projectStats = financialAggregation[0] || {
            totalContractValuePaise: 0,
            totalBudgetPaise: 0,
            totalActualCostPaise: 0,
            totalInvoicedPaise: 0,
            totalCollectedPaise: 0,
        };
        // Live Invoices Aggregation (Bills & Receivables Due)
        const invoiceAggregation = await Invoice_1.Invoice.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            {
                $group: {
                    _id: null,
                    totalInvoicedPaise: { $sum: '$totalAmountPaise' },
                    totalPaidPaise: { $sum: '$paidAmountPaise' },
                    totalDuePaise: { $sum: '$dueAmountPaise' },
                    totalOutputTaxPaise: { $sum: { $add: ['$cgstPaise', '$sgstPaise', '$igstPaise'] } },
                    count: { $sum: 1 },
                },
            },
        ]);
        // Live Payments Aggregation (Verified bank collections)
        const paymentAggregation = await Payment_1.Payment.aggregate([
            { $match: { verificationStatus: { $in: ['verified', undefined, null] } } },
            {
                $group: {
                    _id: null,
                    totalCollectedPaise: { $sum: '$amountPaise' },
                    count: { $sum: 1 },
                },
            },
        ]);
        // Live Quotations Aggregation
        const quotationAggregation = await Quotation_1.Quotation.aggregate([
            { $match: { status: { $ne: 'rejected' } } },
            {
                $group: {
                    _id: null,
                    totalQuotationValuePaise: { $sum: '$totalAmountPaise' },
                    count: { $sum: 1 },
                },
            },
        ]);
        // Live GST liability
        const latestTaxRecord = await TaxReconciliation_1.TaxReconciliation.findOne().sort({ period: -1 });
        let netGstPayablePaise = 0;
        let gstFilingStatus = 'not_filed';
        if (latestTaxRecord) {
            netGstPayablePaise = latestTaxRecord.netTaxPayablePaise || 0;
            gstFilingStatus = latestTaxRecord.returnStatus || 'not_filed';
        }
        else {
            const outputTax = invoiceAggregation[0]?.totalOutputTaxPaise || 0;
            const allExpenses = await Expense_1.Expense.find();
            const purchases = allExpenses.reduce((acc, e) => acc + (e.amountPaise || 0), 0);
            const eligibleItc = Math.round(purchases * 0.18 * 0.85);
            netGstPayablePaise = Math.max(0, outputTax - eligibleItc);
        }
        // Consolidated metrics ensuring absolute synchronization
        const invoicedPaise = invoiceAggregation[0]?.totalInvoicedPaise ?? projectStats.totalInvoicedPaise;
        const collectedPaise = paymentAggregation[0]?.totalCollectedPaise ?? projectStats.totalCollectedPaise;
        const receivablesPaise = invoiceAggregation[0]?.totalDuePaise !== undefined
            ? invoiceAggregation[0].totalDuePaise
            : Math.max(0, invoicedPaise - collectedPaise);
        const estimatedFinalProfitPaise = Math.max(0, projectStats.totalContractValuePaise - projectStats.totalBudgetPaise);
        const quotationValuePaise = quotationAggregation[0]?.totalQuotationValuePaise || 0;
        const totalQuotations = quotationAggregation[0]?.count || 0;
        const totalInvoices = invoiceAggregation[0]?.count || 0;
        // Recent activity
        const recentSiteReports = await SiteReport_1.SiteReport.find()
            .populate('projectId', 'title projectId')
            .populate('supervisorId', 'name')
            .sort({ createdAt: -1 })
            .limit(5);
        const recentExpenses = await Expense_1.Expense.find()
            .populate('projectId', 'title projectId')
            .sort({ createdAt: -1 })
            .limit(5);
        res.json({
            success: true,
            stats: {
                totalProjects,
                activeProjects,
                planningProjects,
                completedProjects,
                contractValuePaise: projectStats.totalContractValuePaise,
                budgetPaise: projectStats.totalBudgetPaise,
                actualCostPaise: projectStats.totalActualCostPaise,
                invoicedPaise,
                collectedPaise,
                receivablesPaise,
                totalOutstandingPaise: receivablesPaise,
                estimatedFinalProfitPaise,
                quotationValuePaise,
                totalQuotations,
                totalInvoices,
                netGstPayablePaise,
                gstFilingStatus,
            },
            recentSiteReports,
            recentExpenses,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
