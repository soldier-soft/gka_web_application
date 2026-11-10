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
const Lead_1 = require("../../models/Lead");
const pdfService_1 = require("../../services/pdfService");
const emailService_1 = require("../../services/emailService");
const constants_1 = require("../../shared/constants");
const getProjects = async (req, res, next) => {
    try {
        const { status, category } = req.query;
        const filter = {};
        if (status && typeof status === 'string')
            filter.status = status;
        if (category && typeof category === 'string')
            filter.category = category;
        // If role is client, only allow projects belonging to their client account or assigned projects
        if (req.user?.role === 'client') {
            const orConditions = [];
            if (req.user.clientId)
                orConditions.push({ clientId: req.user.clientId });
            if (req.user.assignedProjects && req.user.assignedProjects.length > 0) {
                orConditions.push({ _id: { $in: req.user.assignedProjects } });
            }
            if (orConditions.length > 0) {
                filter.$or = orConditions;
            }
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
            isDeleted: { $ne: true },
            ...(isClientRole ? { status: { $ne: 'draft' } } : {}),
        }).sort({ issueDate: -1 });
        const payments = await Payment_1.Payment.find({
            projectId: project._id,
            ...(isClientRole ? { verificationStatus: { $in: ['verified', 'reconciled'] } } : {}),
        }).sort({ paymentDate: -1 });
        const quotations = await Quotation_1.Quotation.find({
            projectId: project._id,
            isDeleted: { $ne: true },
            ...(isClientRole ? { status: { $in: ['sent', 'approved'] } } : {}),
        }).sort({ createdAt: -1 });
        const clientFeedbacks = await ClientFeedback_1.ClientFeedback.find({ projectId: project._id }).sort({ createdAt: -1 });
        // Internal costs (only for internal staff, NEVER exposed to client)
        const expenses = isClientRole
            ? []
            : await Expense_1.Expense.find({ projectId: project._id }).sort({ expenseDate: -1 });
        // Resolve accurate client portal credentials for dashboards
        let portalCredentials = {
            username: project.clientId?.email || 'client@gkaconstruction.com',
            password: 'GKAclient2026!',
        };
        if (project.clientId) {
            const clientObj = project.clientId;
            const clientUser = await User_1.User.findOne({
                $or: [
                    { clientId: clientObj._id },
                    { _id: clientObj.userId },
                    { email: clientObj.email?.toLowerCase() },
                ],
            });
            if (clientUser) {
                portalCredentials = {
                    username: clientUser.email,
                    password: clientUser.defaultPassword || 'GKAclient2026!',
                };
            }
            else {
                portalCredentials.password = 'GKAclient2026!';
            }
        }
        res.json({
            success: true,
            project,
            portalCredentials,
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
                const rawTempPassword = clientDoc.defaultPassword || 'GKAclient2026!';
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
        // Dispatch Company Project Creation Alert Email
        (0, emailService_1.sendProjectAlertEmail)(project, clientDoc).catch((err) => {
            console.error('[Project] Failed to dispatch project alert email:', err);
        });
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
        const quotations = await Quotation_1.Quotation.find({ projectId: project._id, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
        const invoices = await Invoice_1.Invoice.find({ projectId: project._id, isDeleted: { $ne: true } }).sort({ issueDate: -1 });
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
        // Background alert email dispatch for project update
        (0, emailService_1.sendProjectAlertEmail)(project, project.clientId, true, 'Project information / parameters updated').catch((err) => {
            console.error('[Project] Failed to dispatch project update alert email:', err);
        });
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
        const updatedProject = await Project_1.Project.findByIdAndUpdate(milestone.projectId, { progressPercent: Math.round(totalProgress) }, { new: true }).populate('clientId');
        if (updatedProject) {
            (0, emailService_1.sendProjectAlertEmail)(updatedProject, updatedProject.clientId, true, `Milestone "${milestone.title}" updated (${milestone.progressPercent}%). Total project progress: ${Math.round(totalProgress)}%`).catch((err) => {
                console.error('[Project] Failed to dispatch milestone update alert email:', err);
            });
        }
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
            { $match: { status: { $ne: 'cancelled' }, isDeleted: { $ne: true } } },
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
            { $match: { status: { $ne: 'rejected' }, isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: null,
                    totalQuotationValuePaise: { $sum: '$totalAmountPaise' },
                    count: { $sum: 1 },
                },
            },
        ]);
        // Live GST liability (18% output GST strictly calculated)
        const allExpenses = await Expense_1.Expense.find();
        const purchases = allExpenses.reduce((acc, e) => acc + (e.amountPaise || 0), 0);
        const eligibleItc = Math.round(purchases * 0.18 * 0.85);
        const latestTaxRecord = await TaxReconciliation_1.TaxReconciliation.findOne().sort({ period: -1 });
        let netGstPayablePaise = 0;
        let gstFilingStatus = 'not_filed';
        if (latestTaxRecord && latestTaxRecord.returnStatus === 'filed') {
            netGstPayablePaise = latestTaxRecord.netTaxPayablePaise || 0;
            gstFilingStatus = 'filed';
        }
        else {
            const outputTax = invoiceAggregation[0]?.totalOutputTaxPaise || 0;
            netGstPayablePaise = Math.max(0, outputTax - eligibleItc);
            gstFilingStatus = latestTaxRecord?.returnStatus || 'not_filed';
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
        // Monthly Quotation vs Bills (Invoices) aggregation (rolling 6 months)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth();
        const monthlyTrendMap = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date(curYear, curMonth - i, 1);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            monthlyTrendMap[key] = {
                month: key,
                quotationsPaise: 0,
                invoicesPaise: 0,
                collectedPaise: 0,
            };
        }
        const allQuotations = await Quotation_1.Quotation.find({ isDeleted: { $ne: true } }).lean();
        for (const q of allQuotations) {
            const qDate = new Date(q.createdAt || q.updatedAt || Date.now());
            const key = `${monthNames[qDate.getMonth()]} ${qDate.getFullYear()}`;
            if (monthlyTrendMap[key]) {
                monthlyTrendMap[key].quotationsPaise += (q.totalAmountPaise || 0);
            }
        }
        const allInvoices = await Invoice_1.Invoice.find({ isDeleted: { $ne: true }, status: { $ne: 'cancelled' } }).lean();
        for (const inv of allInvoices) {
            const invDate = new Date(inv.issueDate || inv.createdAt || Date.now());
            const key = `${monthNames[invDate.getMonth()]} ${invDate.getFullYear()}`;
            if (monthlyTrendMap[key]) {
                monthlyTrendMap[key].invoicesPaise += (inv.totalAmountPaise || 0);
                monthlyTrendMap[key].collectedPaise += (inv.paidAmountPaise || 0);
            }
        }
        const monthlyTrends = Object.values(monthlyTrendMap).map((m) => ({
            month: m.month,
            quotations: Math.round(m.quotationsPaise / 100),
            invoices: Math.round(m.invoicesPaise / 100),
            collected: Math.round(m.collectedPaise / 100),
        }));
        // Hotels & Commercial Enterprise Profit and Loss Breakdown
        const hotelMap = {};
        for (const q of allQuotations) {
            const entity = (q.clientCompany || q.clientName || 'General Client').trim();
            const key = entity.toUpperCase();
            const isHospitality = /hotel|vivanta|taj|leela|itc|resort|hospitality|motel|inn/i.test(entity);
            if (!hotelMap[key]) {
                hotelMap[key] = {
                    name: entity,
                    isHotel: isHospitality,
                    category: isHospitality ? 'Hotel / Hospitality' : 'Commercial & Civil',
                    location: q.siteLocation || 'Chennai, Tamil Nadu',
                    scope: q.subject || q.projectTitle || 'Civil Works & Maintenance',
                    quotedPaise: 0,
                    invoicedPaise: 0,
                    collectedPaise: 0,
                    costPaise: 0,
                    status: q.status === 'approved' ? 'Approved Project' : 'Quotation Issued',
                };
            }
            hotelMap[key].quotedPaise += (q.totalAmountPaise || 0);
        }
        for (const inv of allInvoices) {
            const clientName = (inv.clientName || inv.clientId?.name || 'General Client').trim();
            const key = clientName.toUpperCase();
            if (!hotelMap[key]) {
                const isHospitality = /hotel|vivanta|taj|leela|itc|resort|hospitality|motel|inn/i.test(clientName);
                hotelMap[key] = {
                    name: clientName,
                    isHotel: isHospitality,
                    category: isHospitality ? 'Hotel / Hospitality' : 'Commercial & Civil',
                    location: 'Chennai, Tamil Nadu',
                    scope: 'Civil & Engineering Works',
                    quotedPaise: inv.totalAmountPaise || 0,
                    invoicedPaise: 0,
                    collectedPaise: 0,
                    costPaise: 0,
                    status: 'Invoiced',
                };
            }
            hotelMap[key].invoicedPaise += (inv.totalAmountPaise || 0);
            hotelMap[key].collectedPaise += (inv.paidAmountPaise || 0);
            hotelMap[key].costPaise += Math.round((inv.totalAmountPaise || 0) * 0.70);
        }
        const hotelBreakdown = Object.values(hotelMap).map((h) => {
            const revenuePaise = h.invoicedPaise > 0 ? h.invoicedPaise : h.quotedPaise;
            const costPaise = h.costPaise > 0 ? h.costPaise : Math.round(revenuePaise * 0.68);
            const profitPaise = Math.max(0, revenuePaise - costPaise);
            const margin = revenuePaise > 0 ? Number(((profitPaise / revenuePaise) * 100).toFixed(1)) : 0;
            return {
                ...h,
                quoted: Math.round(h.quotedPaise / 100),
                invoiced: Math.round(h.invoicedPaise / 100),
                collected: Math.round(h.collectedPaise / 100),
                cost: Math.round(costPaise / 100),
                profit: Math.round(profitPaise / 100),
                marginPercent: margin,
            };
        });
        // Recent activity & Leads with exact timestamps
        const [recentSiteReports, recentExpenses, recentLeads] = await Promise.all([
            SiteReport_1.SiteReport.find()
                .populate('projectId', 'title projectId')
                .populate('supervisorId', 'name')
                .sort({ createdAt: -1 })
                .limit(5),
            Expense_1.Expense.find()
                .populate('projectId', 'title projectId')
                .sort({ createdAt: -1 })
                .limit(5),
            Lead_1.Lead.find()
                .sort({ createdAt: -1 })
                .limit(6),
        ]);
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
                monthlyTrends,
                hotelBreakdown,
            },
            recentSiteReports,
            recentExpenses,
            recentLeads,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
