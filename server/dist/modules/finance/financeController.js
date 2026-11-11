"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordTaxFiling = exports.recordTaxPayment = exports.updateEligibleItc = exports.getTaxReconciliations = exports.getProfitabilityReport = exports.rejectPayment = exports.reconcilePayment = exports.verifyPayment = exports.recordPayment = exports.getPayments = exports.createExpense = exports.getExpenses = exports.permanentDeleteInvoice = exports.restoreInvoice = exports.deleteInvoice = exports.moveInvoiceToGst = exports.toggleInvoiceGst = exports.updateInvoice = exports.downloadInvoiceDOCX = exports.downloadInvoicePDF = exports.createInvoice = exports.getInvoices = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Invoice_1 = require("../../models/Invoice");
const Expense_1 = require("../../models/Expense");
const Payment_1 = require("../../models/Payment");
const Project_1 = require("../../models/Project");
const TaxReconciliation_1 = require("../../models/TaxReconciliation");
const Client_1 = require("../../models/Client");
const User_1 = require("../../models/User");
const pdfService_1 = require("../../services/pdfService");
const docxService_1 = require("../../services/docxService");
const googleDriveService_1 = require("../../services/googleDriveService");
const emailService_1 = require("../../services/emailService");
const constants_1 = require("../../shared/constants");
const formatTaxPeriod = (dateInput) => {
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}$/.test(dateInput.trim())) {
        return dateInput.trim();
    }
    const d = dateInput ? new Date(dateInput) : new Date();
    const safeDate = Number.isNaN(d.getTime()) ? new Date() : d;
    return `${safeDate.getFullYear()}-${String(safeDate.getMonth() + 1).padStart(2, '0')}`;
};
const getFinancialYearForPeriod = (period) => {
    const [yrStr, moStr] = period.split('-');
    const yr = Number(yrStr) || new Date().getFullYear();
    const mo = Number(moStr) || 4;
    if (mo >= 4) {
        return `FY ${yr}-${String(yr + 1).slice(-2)}`;
    }
    return `FY ${yr - 1}-${String(yr).slice(-2)}`;
};
const generateUniqueFinanceNumber = async (Model, field, prefix) => {
    const currentYear = new Date().getFullYear();
    let seq = (await Model.countDocuments()) + 1;
    while (true) {
        const candidate = `${prefix}-${currentYear}-${String(seq).padStart(3, '0')}`;
        const exists = await Model.exists({ [field]: candidate });
        if (!exists)
            return candidate;
        seq += 1;
    }
};
const savePaymentProofDataUrl = (proofDataUrl, proofFileName) => {
    if (!proofDataUrl || typeof proofDataUrl !== 'string' || !proofDataUrl.startsWith('data:')) {
        return undefined;
    }
    const matches = proofDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches)
        return undefined;
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const safeExtFromMime = mimeType.includes('pdf')
        ? '.pdf'
        : mimeType.includes('png')
            ? '.png'
            : mimeType.includes('webp')
                ? '.webp'
                : '.jpg';
    const requestedExt = proofFileName ? path_1.default.extname(proofFileName).toLowerCase() : '';
    const ext = ['.png', '.jpg', '.jpeg', '.pdf', '.webp'].includes(requestedExt) ? requestedExt : safeExtFromMime;
    const uploadsDir = path_1.default.resolve(process.cwd(), 'uploads', 'payment_proofs');
    if (!fs_1.default.existsSync(uploadsDir)) {
        fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    }
    const fileName = `proof_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}${ext}`;
    const fullPath = path_1.default.join(uploadsDir, fileName);
    fs_1.default.writeFileSync(fullPath, buffer);
    return `/uploads/payment_proofs/${fileName}`;
};
const recalculateProjectFinancials = async (projectId) => {
    if (!projectId)
        return null;
    const activeInvoices = await Invoice_1.Invoice.find({
        projectId,
        isDeleted: { $ne: true },
        status: { $ne: 'cancelled' },
    });
    const totalInvoiced = activeInvoices.reduce((acc, inv) => acc + (inv.totalAmountPaise || 0), 0);
    const totalPaidFromInvoices = activeInvoices.reduce((acc, inv) => acc + (inv.paidAmountPaise || 0), 0);
    const verifiedPayments = await Payment_1.Payment.find({
        projectId,
        verificationStatus: { $in: ['verified', 'reconciled', undefined, null] },
    });
    const totalPaidFromPayments = verifiedPayments.reduce((acc, p) => acc + (p.amountPaise || 0), 0);
    const collectedAmountPaise = Math.max(totalPaidFromPayments, totalPaidFromInvoices);
    return Project_1.Project.findByIdAndUpdate(projectId, {
        invoicedAmountPaise: totalInvoiced,
        collectedAmountPaise,
    }, { new: true });
};
const applyVerifiedPaymentToInvoices = async (projectId, preferredInvoiceId, amountPaise, paymentMode) => {
    const touchedInvoices = [];
    if (!projectId && !preferredInvoiceId)
        return touchedInvoices;
    let remaining = Math.max(0, Number(amountPaise) || 0);
    if (remaining <= 0)
        return touchedInvoices;
    const candidateFilter = {
        isDeleted: { $ne: true },
        status: { $ne: 'cancelled' },
    };
    if (projectId) {
        candidateFilter.projectId = projectId;
    }
    else if (preferredInvoiceId) {
        candidateFilter._id = preferredInvoiceId;
    }
    const allCandidates = await Invoice_1.Invoice.find(candidateFilter).sort({ issueDate: 1, createdAt: 1 });
    const orderedQueue = [...allCandidates];
    if (preferredInvoiceId) {
        const prefIdx = orderedQueue.findIndex((inv) => String(inv._id) === String(preferredInvoiceId));
        if (prefIdx > 0) {
            const [prefDoc] = orderedQueue.splice(prefIdx, 1);
            orderedQueue.unshift(prefDoc);
        }
    }
    for (const invoice of orderedQueue) {
        if (remaining <= 0)
            break;
        const currentDue = Math.max(0, (invoice.totalAmountPaise || 0) - (invoice.paidAmountPaise || 0));
        if (currentDue <= 0)
            continue;
        const alloc = Math.min(remaining, currentDue);
        invoice.paidAmountPaise = (invoice.paidAmountPaise || 0) + alloc;
        invoice.dueAmountPaise = Math.max(0, (invoice.totalAmountPaise || 0) - invoice.paidAmountPaise);
        invoice.status = invoice.dueAmountPaise === 0 ? 'paid' : 'partially_paid';
        await invoice.save();
        touchedInvoices.push(invoice);
        remaining -= alloc;
    }
    if (touchedInvoices.length > 0) {
        const primaryInvoice = touchedInvoices[0];
        setTimeout(async () => {
            try {
                const stream = pdfService_1.PDFService.generateInvoicePDF(primaryInvoice);
                const buffer = await (0, emailService_1.streamToBuffer)(stream);
                await (0, emailService_1.sendInvoiceAlertEmail)(primaryInvoice, buffer, true, `Payment of ₹${(0, constants_1.toRupees)(Number(amountPaise)).toLocaleString('en-IN')} credited via ${paymentMode || 'bank_transfer'}`);
            }
            catch (mErr) {
                console.error('[Payment] Alert email error:', mErr);
            }
        }, 100);
    }
    return touchedInvoices;
};
const syncTaxPeriodLedger = async (period, actingUserId, actingUserName) => {
    const cleanPeriod = formatTaxPeriod(period);
    const periodInvoices = await Invoice_1.Invoice.find({
        isDeleted: { $ne: true },
        status: { $ne: 'cancelled' },
        gstTaxPeriod: cleanPeriod,
    });
    let totalTaxableSalesPaise = 0;
    let outputCgstPaise = 0;
    let outputSgstPaise = 0;
    let outputIgstPaise = 0;
    periodInvoices.forEach((inv) => {
        totalTaxableSalesPaise += inv.subtotalPaise || 0;
        outputCgstPaise += inv.cgstPaise || 0;
        outputSgstPaise += inv.sgstPaise || 0;
        outputIgstPaise += inv.igstPaise || 0;
    });
    const totalOutputTaxPaise = outputCgstPaise + outputSgstPaise + outputIgstPaise;
    const [yr, mo] = cleanPeriod.split('-').map(Number);
    const startOfMonth = new Date(yr, (mo || 1) - 1, 1);
    const startOfNextMonth = new Date(yr, mo || 1, 1);
    const periodExpenses = await Expense_1.Expense.find({
        expenseDate: { $gte: startOfMonth, $lt: startOfNextMonth },
    });
    const totalPurchasesPaise = periodExpenses.reduce((acc, e) => acc + (e.amountPaise || 0), 0);
    const totalPurchaseGstPaise = Math.round(totalPurchasesPaise * 0.18);
    const allInvoicesFiled = periodInvoices.length > 0 && periodInvoices.every((inv) => Boolean(inv.gstFiled));
    const firstFiledWithArn = periodInvoices.find((inv) => inv.gstFiled && inv.gstFilingArn);
    let record = await TaxReconciliation_1.TaxReconciliation.findOne({ period: cleanPeriod });
    if (!record) {
        const eligibleItcPaise = Math.round(totalPurchaseGstPaise * 0.85);
        const ineligibleItcPaise = Math.max(0, totalPurchaseGstPaise - eligibleItcPaise);
        const netTaxPayablePaise = Math.max(0, totalOutputTaxPaise - eligibleItcPaise);
        record = await TaxReconciliation_1.TaxReconciliation.create({
            period: cleanPeriod,
            financialYear: getFinancialYearForPeriod(cleanPeriod),
            totalTaxableSalesPaise,
            outputCgstPaise,
            outputSgstPaise,
            outputIgstPaise,
            totalOutputTaxPaise,
            totalTaxablePurchasesPaise: totalPurchasesPaise,
            totalPurchaseGstPaise,
            eligibleItcPaise,
            ineligibleItcPaise,
            pendingVerificationItcPaise: 0,
            taxAdjustmentsPaise: 0,
            netTaxPayablePaise,
            paymentStatus: 'pending',
            returnStatus: allInvoicesFiled ? 'filed' : 'not_filed',
            returnFilingDate: allInvoicesFiled ? (firstFiledWithArn?.gstFilingDate || new Date()) : undefined,
            returnAckNumber: allInvoicesFiled ? firstFiledWithArn?.gstFilingArn : undefined,
            reconciliationStatus: allInvoicesFiled ? 'reconciled' : 'draft_needs_review',
            notes: `Monthly GST reconciliation for ${cleanPeriod} synced from ${periodInvoices.length} invoice(s).`,
            auditTrail: [
                {
                    fieldChanged: 'initial_calculation',
                    oldValue: 0,
                    newValue: eligibleItcPaise,
                    reason: `System period initialization for ${cleanPeriod}`,
                    changedBy: actingUserId || new mongoose_1.default.Types.ObjectId(),
                    changedByName: actingUserName || 'Accounts Admin',
                    changedAt: new Date(),
                },
            ],
        });
    }
    else {
        const hasCustomItc = (record.auditTrail || []).some((a) => a.fieldChanged === 'eligibleItcPaise');
        const eligibleItcPaise = hasCustomItc
            ? record.eligibleItcPaise
            : Math.round(totalPurchaseGstPaise * 0.85);
        const ineligibleItcPaise = Math.max(0, totalPurchaseGstPaise - eligibleItcPaise);
        const netTaxPayablePaise = Math.max(0, totalOutputTaxPaise - eligibleItcPaise + (record.taxAdjustmentsPaise || 0));
        record.totalTaxableSalesPaise = totalTaxableSalesPaise;
        record.outputCgstPaise = outputCgstPaise;
        record.outputSgstPaise = outputSgstPaise;
        record.outputIgstPaise = outputIgstPaise;
        record.totalOutputTaxPaise = totalOutputTaxPaise;
        record.totalTaxablePurchasesPaise = totalPurchasesPaise;
        record.totalPurchaseGstPaise = totalPurchaseGstPaise;
        record.eligibleItcPaise = eligibleItcPaise;
        record.ineligibleItcPaise = ineligibleItcPaise;
        record.netTaxPayablePaise = netTaxPayablePaise;
        if (allInvoicesFiled && record.returnStatus !== 'filed') {
            record.returnStatus = 'filed';
            record.reconciliationStatus = 'reconciled';
            if (!record.returnFilingDate) {
                record.returnFilingDate = firstFiledWithArn?.gstFilingDate || new Date();
            }
            if (!record.returnAckNumber && firstFiledWithArn?.gstFilingArn) {
                record.returnAckNumber = firstFiledWithArn.gstFilingArn;
            }
        }
        await record.save();
    }
    return record;
};
const getInvoices = async (req, res, next) => {
    try {
        // Automatic cleanup: permanently purge soft-deleted invoices older than 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        await Invoice_1.Invoice.deleteMany({ isDeleted: true, deletedAt: { $lte: thirtyDaysAgo } });
        const { projectId, clientId, status, deleted } = req.query;
        const filter = {};
        if (projectId && typeof projectId === 'string')
            filter.projectId = projectId;
        if (clientId && typeof clientId === 'string')
            filter.clientId = clientId;
        if (status && typeof status === 'string')
            filter.status = status;
        if (deleted === 'true') {
            filter.isDeleted = true;
        }
        else {
            filter.isDeleted = { $ne: true };
        }
        // For clients, restrict to their client ID or assigned projects and hide drafts
        if (req.user?.role === 'client') {
            const orConditions = [];
            if (req.user.clientId)
                orConditions.push({ clientId: req.user.clientId });
            if (req.user.assignedProjects && req.user.assignedProjects.length > 0) {
                orConditions.push({ projectId: { $in: req.user.assignedProjects } });
            }
            if (orConditions.length > 0) {
                filter.$or = orConditions;
            }
            filter.status = { $ne: 'draft' };
            filter.isDeleted = { $ne: true };
        }
        const invoices = await Invoice_1.Invoice.find(filter)
            .populate('projectId', 'title projectId')
            .populate('clientId', 'name phone email')
            .sort({ updatedAt: -1, issueDate: -1 });
        res.json({ success: true, count: invoices.length, invoices });
    }
    catch (error) {
        next(error);
    }
};
exports.getInvoices = getInvoices;
const createInvoice = async (req, res, next) => {
    try {
        const { projectId, clientId, clientName, clientContactPerson, clientCompany, clientGstin, billingAddress, subject, items, issueDate, dueDate, notes, isNegotiated, negotiatedDiscountPaise, negotiatedNotes, termsAndConditions, } = req.body;
        const project = await Project_1.Project.findById(projectId);
        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }
        let subtotalPaise = 0;
        const calculatedItems = (items || []).map((item) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.unitPricePaise) || 0;
            const total = Math.round(qty * price);
            subtotalPaise += total;
            return {
                description: item.description,
                quantity: qty,
                unit: item.unit || 'lumpsum',
                unitPricePaise: price,
                totalPaise: total,
            };
        });
        const isNeg = Boolean(isNegotiated);
        const discPaise = isNeg ? (Number(negotiatedDiscountPaise) || 0) : 0;
        const taxablePaise = Math.max(0, subtotalPaise - discPaise);
        // 18% GST (9% CGST + 9% SGST)
        const taxPaise = Math.round(taxablePaise * 0.18);
        const cgstPaise = Math.round(taxPaise / 2);
        const sgstPaise = taxPaise - cgstPaise;
        const totalAmountPaise = taxablePaise + taxPaise;
        let parsedTerms = [];
        if (Array.isArray(termsAndConditions) && termsAndConditions.length > 0) {
            parsedTerms = termsAndConditions;
        }
        else if (typeof termsAndConditions === 'string' && termsAndConditions.trim()) {
            parsedTerms = termsAndConditions.split('\n').map((s) => s.trim()).filter(Boolean);
        }
        else {
            parsedTerms = [...constants_1.DEFAULT_INVOICE_TERMS];
        }
        if (isNeg && negotiatedNotes && !parsedTerms.some((t) => t.includes(negotiatedNotes))) {
            parsedTerms.push(`Agreed Special Terms: ${negotiatedNotes}`);
        }
        let defaultClientName = clientName;
        let defaultClientGstin = clientGstin;
        if (project.clientId) {
            const clientObj = await Client_1.Client.findById(project.clientId);
            if (clientObj) {
                if (!defaultClientName)
                    defaultClientName = clientObj.name;
                if (!defaultClientGstin)
                    defaultClientGstin = clientObj.billingAddress?.gstin;
            }
        }
        const invoiceNumber = await generateUniqueFinanceNumber(Invoice_1.Invoice, 'invoiceNumber', 'GKA-INV');
        const resolvedIssueDate = new Date(issueDate || Date.now());
        const resolvedTaxPeriod = formatTaxPeriod(resolvedIssueDate);
        const invoice = await Invoice_1.Invoice.create({
            invoiceNumber,
            projectId: project._id,
            projectTitle: project.title,
            clientId: clientId || project.clientId,
            clientName: defaultClientName || 'Valued Client',
            clientContactPerson: clientContactPerson || defaultClientName || 'Chief Engineer',
            clientCompany: clientCompany,
            clientGstin: defaultClientGstin,
            billingAddress: billingAddress || project.siteAddress.street,
            subject: subject || `Tax Invoice for Construction Works - ${project.title}`,
            items: calculatedItems,
            subtotalPaise,
            isNegotiated: isNeg,
            negotiatedDiscountPaise: discPaise,
            discountPaise: discPaise,
            negotiatedNotes: isNeg ? negotiatedNotes : undefined,
            termsAndConditions: parsedTerms,
            cgstPaise,
            sgstPaise,
            igstPaise: 0,
            totalAmountPaise,
            paidAmountPaise: 0,
            dueAmountPaise: totalAmountPaise,
            issueDate: resolvedIssueDate,
            dueDate: new Date(dueDate || Date.now() + 14 * 86400000),
            gstTaxPeriod: resolvedTaxPeriod,
            status: 'issued',
            notes,
        });
        // Update Project invoiced amount & month GST ledger
        await recalculateProjectFinancials(project._id);
        await syncTaxPeriodLedger(resolvedTaxPeriod, req.user?.id, req.user?.name);
        // Background PDF Dispatch & Google Drive synchronization
        setTimeout(async () => {
            try {
                const stream = pdfService_1.PDFService.generateInvoicePDF(invoice);
                const chunks = [];
                stream.on('data', (c) => chunks.push(Buffer.from(c)));
                stream.on('end', async () => {
                    const pdfBuffer = Buffer.concat(chunks);
                    // 1. Send backup alert email with attached PDF to company emails
                    await (0, emailService_1.sendInvoiceAlertEmail)(invoice, pdfBuffer).catch((mailErr) => {
                        console.error('[Invoice] Failed to dispatch invoice alert email:', mailErr);
                    });
                    // 2. Sync to Google Drive
                    await googleDriveService_1.GoogleDriveService.syncInvoicePdf(invoice.invoiceNumber, pdfBuffer, invoice.projectId, invoice.clientName);
                });
            }
            catch (e) {
                console.warn('[DriveSync/Email] Invoice creation dispatch note:', e);
            }
        }, 100);
        res.status(201).json({ success: true, invoice });
    }
    catch (error) {
        next(error);
    }
};
exports.createInvoice = createInvoice;
const downloadInvoicePDF = async (req, res, next) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice_1.Invoice.findById(id);
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found' });
            return;
        }
        if (req.user?.role === 'client' && req.user.clientId && invoice.clientId.toString() !== req.user.clientId) {
            res.status(403).json({ success: false, message: 'Forbidden. Access not permitted.' });
            return;
        }
        const isLinkedToProject = Boolean(invoice.projectId);
        invoice.isLinkedToProject = isLinkedToProject;
        let clientPortalUsername = (0, constants_1.formatClientPortalUsername)(invoice.clientName);
        let clientPortalPassword = 'GKAclient2026!';
        if (isLinkedToProject) {
            let resolvedClientId = invoice.clientId;
            if (!resolvedClientId && invoice.projectId) {
                const proj = await Project_1.Project.findById(invoice.projectId);
                if (proj?.clientId)
                    resolvedClientId = proj.clientId;
            }
            if (resolvedClientId) {
                const client = await Client_1.Client.findById(resolvedClientId);
                if (client) {
                    const clientUser = await User_1.User.findOne({
                        $or: [
                            { clientId: client._id },
                            { _id: client.userId },
                            { email: client.email.toLowerCase() },
                        ],
                    });
                    if (clientUser) {
                        clientPortalUsername = clientUser.email;
                        if (clientUser.defaultPassword) {
                            clientPortalPassword = clientUser.defaultPassword;
                        }
                    }
                    else if (client.email) {
                        clientPortalUsername = client.email.endsWith('@gkaconstruction.com')
                            ? client.email.toLowerCase()
                            : (0, constants_1.formatClientPortalUsername)(client.name);
                    }
                }
            }
        }
        invoice.clientPortalUsername = clientPortalUsername;
        invoice.clientPortalPassword = clientPortalPassword;
        const docStream = pdfService_1.PDFService.generateInvoicePDF(invoice);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
        const chunks = [];
        docStream.on('data', (c) => chunks.push(Buffer.from(c)));
        docStream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            googleDriveService_1.GoogleDriveService.syncInvoicePdf(invoice.invoiceNumber, buffer, invoice.projectId, invoice.clientName).catch((err) => console.warn('[DriveSync] Auto-sync invoice PDF note:', err));
        });
        docStream.pipe(res);
    }
    catch (error) {
        next(error);
    }
};
exports.downloadInvoicePDF = downloadInvoicePDF;
const downloadInvoiceDOCX = async (req, res, next) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice_1.Invoice.findById(id);
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found' });
            return;
        }
        if (req.user?.role === 'client' && req.user.clientId && invoice.clientId.toString() !== req.user.clientId) {
            res.status(403).json({ success: false, message: 'Forbidden. Access not permitted.' });
            return;
        }
        const isLinkedToProject = Boolean(invoice.projectId);
        invoice.isLinkedToProject = isLinkedToProject;
        let clientPortalUsername = (0, constants_1.formatClientPortalUsername)(invoice.clientName);
        let clientPortalPassword = 'GKAclient2026!';
        if (isLinkedToProject) {
            let resolvedClientId = invoice.clientId;
            if (!resolvedClientId && invoice.projectId) {
                const proj = await Project_1.Project.findById(invoice.projectId);
                if (proj?.clientId)
                    resolvedClientId = proj.clientId;
            }
            if (resolvedClientId) {
                const client = await Client_1.Client.findById(resolvedClientId);
                if (client) {
                    const clientUser = await User_1.User.findOne({
                        $or: [
                            { clientId: client._id },
                            { _id: client.userId },
                            { email: client.email.toLowerCase() },
                        ],
                    });
                    if (clientUser) {
                        clientPortalUsername = clientUser.email;
                        if (clientUser.defaultPassword) {
                            clientPortalPassword = clientUser.defaultPassword;
                        }
                    }
                    else if (client.email) {
                        clientPortalUsername = client.email.endsWith('@gkaconstruction.com')
                            ? client.email.toLowerCase()
                            : (0, constants_1.formatClientPortalUsername)(client.name);
                    }
                }
            }
        }
        invoice.clientPortalUsername = clientPortalUsername;
        invoice.clientPortalPassword = clientPortalPassword;
        const docxPath = await docxService_1.DOCXService.generateInvoiceDocx(invoice);
        res.download(docxPath, `GKA_Invoice_${invoice.invoiceNumber}.docx`, (err) => {
            try {
                if (fs_1.default.existsSync(docxPath))
                    fs_1.default.unlinkSync(docxPath);
            }
            catch (_) { }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.downloadInvoiceDOCX = downloadInvoiceDOCX;
const updateInvoice = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { invoiceNumber, clientName, clientGstin, items, billingAddress, dueDate, issueDate, notes, subject, clientContactPerson, clientCompany, status, paidAmountPaise, } = req.body;
        const invoice = await Invoice_1.Invoice.findById(id);
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found' });
            return;
        }
        const oldTotalPaise = invoice.totalAmountPaise;
        if (req.body.isNegotiated !== undefined) {
            invoice.isNegotiated = Boolean(req.body.isNegotiated);
        }
        if (req.body.negotiatedDiscountPaise !== undefined) {
            invoice.negotiatedDiscountPaise = Number(req.body.negotiatedDiscountPaise) || 0;
            invoice.discountPaise = invoice.negotiatedDiscountPaise;
        }
        if (req.body.negotiatedNotes !== undefined) {
            invoice.negotiatedNotes = req.body.negotiatedNotes;
        }
        if (req.body.termsAndConditions !== undefined) {
            if (Array.isArray(req.body.termsAndConditions)) {
                invoice.termsAndConditions = req.body.termsAndConditions;
            }
            else if (typeof req.body.termsAndConditions === 'string') {
                invoice.termsAndConditions = req.body.termsAndConditions
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean);
            }
        }
        if (items && Array.isArray(items)) {
            let subtotalPaise = 0;
            invoice.items = items.map((item) => {
                const qty = Number(item.quantity) || 1;
                const price = Number(item.unitPricePaise) || 0;
                const total = Math.round(qty * price);
                subtotalPaise += total;
                return {
                    description: item.description,
                    quantity: qty,
                    unit: item.unit || 'CFT',
                    unitPricePaise: price,
                    totalPaise: total,
                };
            });
            invoice.subtotalPaise = subtotalPaise;
        }
        // Always recalculate taxes and totals taking negotiation into account
        const isNeg = Boolean(invoice.isNegotiated);
        const discPaise = isNeg ? (invoice.negotiatedDiscountPaise || invoice.discountPaise || 0) : 0;
        const taxablePaise = Math.max(0, invoice.subtotalPaise - discPaise);
        const taxPaise = Math.round(taxablePaise * 0.18);
        invoice.cgstPaise = Math.round(taxPaise / 2);
        invoice.sgstPaise = taxPaise - invoice.cgstPaise;
        invoice.totalAmountPaise = taxablePaise + taxPaise;
        invoice.dueAmountPaise = Math.max(0, invoice.totalAmountPaise - invoice.paidAmountPaise);
        const diffPaise = invoice.totalAmountPaise - oldTotalPaise;
        if (diffPaise !== 0 && invoice.projectId) {
            await Project_1.Project.findByIdAndUpdate(invoice.projectId, {
                $inc: { invoicedAmountPaise: diffPaise },
            });
        }
        if (invoiceNumber)
            invoice.invoiceNumber = invoiceNumber;
        if (clientName)
            invoice.clientName = clientName;
        if (clientGstin !== undefined)
            invoice.clientGstin = clientGstin;
        if (billingAddress !== undefined)
            invoice.billingAddress = billingAddress;
        if (dueDate)
            invoice.dueDate = new Date(dueDate);
        if (issueDate)
            invoice.issueDate = new Date(issueDate);
        if (notes !== undefined)
            invoice.notes = notes;
        if (subject !== undefined)
            invoice.subject = subject;
        if (clientContactPerson !== undefined)
            invoice.clientContactPerson = clientContactPerson;
        if (clientCompany !== undefined)
            invoice.clientCompany = clientCompany;
        if (status !== undefined)
            invoice.status = status;
        if (paidAmountPaise !== undefined) {
            invoice.paidAmountPaise = Number(paidAmountPaise) || 0;
            invoice.dueAmountPaise = Math.max(0, invoice.totalAmountPaise - invoice.paidAmountPaise);
        }
        if (req.body.projectId) {
            invoice.projectId = req.body.projectId;
            const proj = await Project_1.Project.findById(req.body.projectId);
            if (proj) {
                invoice.projectTitle = proj.title;
            }
        }
        await invoice.save();
        await recalculateProjectFinancials(invoice.projectId);
        await syncTaxPeriodLedger(formatTaxPeriod(invoice.gstTaxPeriod || invoice.issueDate), req.user?.id, req.user?.name);
        // Background alert email dispatch with PDF attachment for invoice update
        setTimeout(async () => {
            try {
                const stream = pdfService_1.PDFService.generateInvoicePDF(invoice);
                const buffer = await (0, emailService_1.streamToBuffer)(stream);
                await (0, emailService_1.sendInvoiceAlertEmail)(invoice, buffer, true, 'Tax Invoice parameters or line items updated');
            }
            catch (mailErr) {
                console.error('[Invoice] Failed to dispatch invoice update alert email:', mailErr);
            }
        }, 100);
        res.json({ success: true, message: 'Invoice updated successfully', invoice });
    }
    catch (error) {
        next(error);
    }
};
exports.updateInvoice = updateInvoice;
const toggleInvoiceGst = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { gstFiled, gstFilingArn, gstTaxPeriod } = req.body;
        const invoice = await Invoice_1.Invoice.findById(id);
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found' });
            return;
        }
        const isFiled = gstFiled !== undefined ? Boolean(gstFiled) : !invoice.gstFiled;
        invoice.gstFiled = isFiled;
        invoice.gstFilingDate = isFiled ? new Date() : undefined;
        if (gstFilingArn !== undefined)
            invoice.gstFilingArn = gstFilingArn;
        if (gstTaxPeriod !== undefined) {
            invoice.gstTaxPeriod = formatTaxPeriod(gstTaxPeriod);
        }
        else if (!invoice.gstTaxPeriod) {
            invoice.gstTaxPeriod = formatTaxPeriod(invoice.issueDate);
        }
        await invoice.save();
        // Sync the month's TaxReconciliation record with invoice GST status
        const targetPeriod = formatTaxPeriod(invoice.gstTaxPeriod || invoice.issueDate);
        const updatedRecord = await syncTaxPeriodLedger(targetPeriod, req.user?.id, req.user?.name);
        if (!isFiled && updatedRecord && updatedRecord.returnStatus === 'filed') {
            updatedRecord.returnStatus = 'not_filed';
            updatedRecord.reconciliationStatus = 'draft_needs_review';
            await updatedRecord.save();
        }
        else if (isFiled && gstFilingArn && updatedRecord && !updatedRecord.returnAckNumber) {
            updatedRecord.returnAckNumber = gstFilingArn;
            await updatedRecord.save();
        }
        res.json({
            success: true,
            message: `Invoice ${invoice.invoiceNumber} GST status updated to ${isFiled ? 'FILED' : 'UNFILED'}.`,
            invoice,
            taxRecord: updatedRecord,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.toggleInvoiceGst = toggleInvoiceGst;
const moveInvoiceToGst = async (req, res, next) => {
    try {
        const { invoiceId, period } = req.body;
        if (!invoiceId) {
            res.status(400).json({ success: false, message: 'invoiceId is required' });
            return;
        }
        const invoice = await Invoice_1.Invoice.findOne({ _id: invoiceId, isDeleted: { $ne: true } });
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found' });
            return;
        }
        const targetPeriod = period
            ? formatTaxPeriod(period)
            : formatTaxPeriod(invoice.issueDate || invoice.gstTaxPeriod);
        const previousPeriod = invoice.gstTaxPeriod ? formatTaxPeriod(invoice.gstTaxPeriod) : null;
        invoice.gstTaxPeriod = targetPeriod;
        await invoice.save();
        const record = await syncTaxPeriodLedger(targetPeriod, req.user?.id, req.user?.name);
        if (previousPeriod && previousPeriod !== targetPeriod) {
            await syncTaxPeriodLedger(previousPeriod, req.user?.id, req.user?.name);
        }
        res.json({
            success: true,
            message: `Invoice ${invoice.invoiceNumber} moved to GST period ${targetPeriod}.`,
            invoice,
            record,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.moveInvoiceToGst = moveInvoiceToGst;
const deleteInvoice = async (req, res, next) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice_1.Invoice.findById(id);
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found' });
            return;
        }
        invoice.isDeleted = true;
        invoice.deletedAt = new Date();
        await invoice.save();
        await recalculateProjectFinancials(invoice.projectId);
        await syncTaxPeriodLedger(formatTaxPeriod(invoice.gstTaxPeriod || invoice.issueDate), req.user?.id, req.user?.name);
        res.json({
            success: true,
            message: 'Bill / Tax Invoice moved to Recycle Bin. It will be automatically removed after 30 days unless restored.',
            invoice,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteInvoice = deleteInvoice;
const restoreInvoice = async (req, res, next) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice_1.Invoice.findById(id);
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found' });
            return;
        }
        invoice.isDeleted = false;
        invoice.deletedAt = undefined;
        await invoice.save();
        await recalculateProjectFinancials(invoice.projectId);
        await syncTaxPeriodLedger(formatTaxPeriod(invoice.gstTaxPeriod || invoice.issueDate), req.user?.id, req.user?.name);
        res.json({
            success: true,
            message: 'Bill / Tax Invoice restored from Recycle Bin successfully.',
            invoice,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.restoreInvoice = restoreInvoice;
const permanentDeleteInvoice = async (req, res, next) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice_1.Invoice.findByIdAndDelete(id);
        if (!invoice) {
            res.status(404).json({ success: false, message: 'Invoice not found' });
            return;
        }
        await recalculateProjectFinancials(invoice.projectId);
        res.json({
            success: true,
            message: 'Bill / Tax Invoice permanently removed from database.',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.permanentDeleteInvoice = permanentDeleteInvoice;
const getExpenses = async (req, res, next) => {
    try {
        const { projectId, category } = req.query;
        const filter = {};
        if (projectId)
            filter.projectId = projectId;
        if (category)
            filter.category = category;
        const expenses = await Expense_1.Expense.find(filter)
            .populate('projectId', 'title projectId')
            .populate('recordedBy', 'name')
            .sort({ date: -1 });
        res.json({ success: true, count: expenses.length, expenses });
    }
    catch (error) {
        next(error);
    }
};
exports.getExpenses = getExpenses;
const createExpense = async (req, res, next) => {
    try {
        const { projectId, category, description, amountPaise, paidTo, date, paymentMethod, referenceNumber, receiptUrl, supplierId, } = req.body;
        const expense = await Expense_1.Expense.create({
            projectId,
            category,
            description,
            amountPaise: Number(amountPaise),
            paidTo,
            date: new Date(date || Date.now()),
            paymentMethod: paymentMethod || 'bank_transfer',
            referenceNumber,
            receiptUrl,
            supplierId,
            isApproved: true,
            recordedBy: req.user?.id,
        });
        // Automatically update the Project's actualCostPaise!
        await Project_1.Project.findByIdAndUpdate(projectId, {
            $inc: { actualCostPaise: Number(amountPaise) },
        });
        res.status(201).json({ success: true, expense });
    }
    catch (error) {
        next(error);
    }
};
exports.createExpense = createExpense;
const getPayments = async (req, res, next) => {
    try {
        const { projectId, clientId } = req.query;
        const filter = {};
        if (projectId)
            filter.projectId = projectId;
        if (clientId)
            filter.clientId = clientId;
        if (req.user?.role === 'client' && req.user.clientId) {
            filter.clientId = req.user.clientId;
        }
        const payments = await Payment_1.Payment.find(filter)
            .populate('projectId', 'title projectId')
            .populate('clientId', 'name phone email')
            .sort({ paymentDate: -1 });
        res.json({ success: true, count: payments.length, payments });
    }
    catch (error) {
        next(error);
    }
};
exports.getPayments = getPayments;
const recordPayment = async (req, res, next) => {
    try {
        const { projectId, clientId, clientName, invoiceId, amountPaise, paymentDate, paymentMode, transactionReference, notes, verificationStatus, proofFileUrl, proofDataUrl, proofFileName, } = req.body;
        if (!projectId) {
            res.status(400).json({ success: false, message: 'projectId is required to record payment collection' });
            return;
        }
        const project = await Project_1.Project.findById(projectId).populate('clientId', 'name companyName');
        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }
        const resolvedClientId = clientId || project.clientId?._id || project.clientId;
        const resolvedClientName = clientName ||
            project.clientId?.name ||
            project.clientId?.companyName ||
            project.title ||
            'Valued Client';
        if (!resolvedClientId) {
            res.status(400).json({ success: false, message: 'Linked Client ID could not be resolved for this project' });
            return;
        }
        const paymentNumber = await generateUniqueFinanceNumber(Payment_1.Payment, 'paymentNumber', 'GKA-REC');
        const isVerified = verificationStatus === 'verified' || !verificationStatus;
        const savedProofUrl = savePaymentProofDataUrl(proofDataUrl, proofFileName) || proofFileUrl;
        const resolvedRef = typeof transactionReference === 'string' && transactionReference.trim()
            ? transactionReference.trim()
            : `COUNTER-${paymentNumber}`;
        const payment = await Payment_1.Payment.create({
            paymentNumber,
            projectId,
            clientId: resolvedClientId,
            clientName: resolvedClientName,
            invoiceId: invoiceId || undefined,
            amountPaise: Number(amountPaise),
            paymentDate: new Date(paymentDate || Date.now()),
            paymentMode: paymentMode || 'bank_transfer',
            transactionReference: resolvedRef,
            recordedBy: req.user?.id,
            verificationStatus: isVerified ? 'verified' : 'verification_pending',
            verifiedBy: isVerified ? req.user?.id : undefined,
            verifiedAt: isVerified ? new Date() : undefined,
            proofFileUrl: savedProofUrl,
            notes,
        });
        let touchedInvoices = [];
        let updatedProject = null;
        // Verified payments immediately allocate across project invoices (FIFO) and sync project balances!
        if (isVerified) {
            touchedInvoices = await applyVerifiedPaymentToInvoices(projectId, invoiceId, Number(amountPaise), paymentMode);
            updatedProject = await recalculateProjectFinancials(projectId);
        }
        res.status(201).json({
            success: true,
            message: isVerified
                ? `Payment ${payment.paymentNumber} collected and reconciled across ${touchedInvoices.length || 0} invoice(s).`
                : `Payment ${payment.paymentNumber} uploaded and queued for verification.`,
            payment,
            touchedInvoices,
            project: updatedProject,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.recordPayment = recordPayment;
const verifyPayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payment = await Payment_1.Payment.findById(id);
        if (!payment) {
            res.status(404).json({ success: false, message: 'Payment record not found' });
            return;
        }
        if (payment.verificationStatus === 'verified' || payment.verificationStatus === 'reconciled') {
            res.status(400).json({ success: false, message: 'This payment has already been verified.' });
            return;
        }
        payment.verificationStatus = 'verified';
        payment.verifiedBy = req.user?.id;
        payment.verifiedAt = new Date();
        await payment.save();
        const touchedInvoices = await applyVerifiedPaymentToInvoices(payment.projectId, payment.invoiceId, payment.amountPaise, payment.paymentMode);
        const updatedProject = await recalculateProjectFinancials(payment.projectId);
        res.json({
            success: true,
            message: 'Payment verified and credited simultaneously to project & invoice dues.',
            payment,
            touchedInvoices,
            project: updatedProject,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.verifyPayment = verifyPayment;
const reconcilePayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payment = await Payment_1.Payment.findById(id);
        if (!payment) {
            res.status(404).json({ success: false, message: 'Payment not found' });
            return;
        }
        const wasPending = payment.verificationStatus === 'verification_pending';
        payment.verificationStatus = 'reconciled';
        payment.reconciliationDate = new Date();
        await payment.save();
        if (wasPending) {
            await applyVerifiedPaymentToInvoices(payment.projectId, payment.invoiceId, payment.amountPaise, payment.paymentMode);
        }
        const updatedProject = await recalculateProjectFinancials(payment.projectId);
        res.json({
            success: true,
            message: 'Payment marked as reconciled against bank statement.',
            payment,
            project: updatedProject,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.reconcilePayment = reconcilePayment;
const rejectPayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const payment = await Payment_1.Payment.findById(id);
        if (!payment) {
            res.status(404).json({ success: false, message: 'Payment not found' });
            return;
        }
        payment.verificationStatus = 'rejected';
        if (reason) {
            payment.notes = payment.notes ? `${payment.notes} | Rejection Reason: ${reason}` : `Rejection Reason: ${reason}`;
        }
        await payment.save();
        res.json({ success: true, message: 'Payment rejected.', payment });
    }
    catch (error) {
        next(error);
    }
};
exports.rejectPayment = rejectPayment;
const getProfitabilityReport = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const project = await Project_1.Project.findById(projectId).populate('clientId', 'name email phone');
        if (!project) {
            res.status(404).json({ success: false, message: 'Project not found' });
            return;
        }
        // Breakdown expenses by category
        const categoryExpenses = await Expense_1.Expense.aggregate([
            { $match: { projectId: project._id } },
            {
                $group: {
                    _id: '$category',
                    totalPaise: { $sum: '$amountPaise' },
                    count: { $sum: 1 },
                },
            },
        ]);
        const forecastProfitPaise = project.contractValuePaise - project.totalBudgetPaise;
        const realizedMarginPaise = project.invoicedAmountPaise - project.actualCostPaise;
        const pendingCollectionPaise = project.invoicedAmountPaise - project.collectedAmountPaise;
        res.json({
            success: true,
            project: {
                id: project._id,
                projectId: project.projectId,
                title: project.title,
                client: project.clientId,
                contractValuePaise: project.contractValuePaise,
                totalBudgetPaise: project.totalBudgetPaise,
                actualCostPaise: project.actualCostPaise,
                invoicedAmountPaise: project.invoicedAmountPaise,
                collectedAmountPaise: project.collectedAmountPaise,
                pendingCollectionPaise,
                forecastProfitPaise,
                realizedMarginPaise,
            },
            categoryExpenses,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProfitabilityReport = getProfitabilityReport;
// ==========================================
// GST & Tax Reconciliation Endpoints
// ==========================================
const getTaxReconciliations = async (req, res, next) => {
    try {
        const allInvoices = await Invoice_1.Invoice.find({ isDeleted: { $ne: true }, status: { $ne: 'cancelled' } })
            .populate('projectId', 'title projectId')
            .populate('clientId', 'name companyName billingAddress')
            .sort({ issueDate: -1, createdAt: -1 });
        // Guarantee every active invoice belongs to a valid YYYY-MM month category
        for (const inv of allInvoices) {
            if (!inv.gstTaxPeriod || !/^\d{4}-\d{2}$/.test(inv.gstTaxPeriod)) {
                inv.gstTaxPeriod = formatTaxPeriod(inv.issueDate);
                await inv.save();
            }
        }
        const existingRecords = await TaxReconciliation_1.TaxReconciliation.find();
        const periodSet = new Set();
        allInvoices.forEach((inv) => periodSet.add(formatTaxPeriod(inv.gstTaxPeriod || inv.issueDate)));
        existingRecords.forEach((r) => {
            if (/^\d{4}-\d{2}$/.test(r.period))
                periodSet.add(r.period);
        });
        if (periodSet.size === 0) {
            periodSet.add(formatTaxPeriod(new Date()));
        }
        for (const period of periodSet) {
            await syncTaxPeriodLedger(period, req.user?.id, req.user?.name);
        }
        const records = await TaxReconciliation_1.TaxReconciliation.find({ period: { $in: Array.from(periodSet) } }).sort({ period: -1 });
        const invoicesByPeriod = {};
        for (const p of Array.from(periodSet).sort().reverse()) {
            invoicesByPeriod[p] = [];
        }
        for (const inv of allInvoices) {
            const p = formatTaxPeriod(inv.gstTaxPeriod || inv.issueDate);
            if (!invoicesByPeriod[p])
                invoicesByPeriod[p] = [];
            invoicesByPeriod[p].push(inv);
        }
        res.json({
            success: true,
            count: records.length,
            records,
            invoicesByPeriod,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTaxReconciliations = getTaxReconciliations;
const updateEligibleItc = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { eligibleItcPaise, taxAdjustmentsPaise, reason } = req.body;
        const record = await TaxReconciliation_1.TaxReconciliation.findById(id);
        if (!record) {
            res.status(404).json({ success: false, message: 'Tax reconciliation record not found' });
            return;
        }
        const oldEligibleItc = record.eligibleItcPaise;
        const newEligibleItc = eligibleItcPaise !== undefined ? Number(eligibleItcPaise) : record.eligibleItcPaise;
        const newAdjustments = taxAdjustmentsPaise !== undefined ? Number(taxAdjustmentsPaise) : record.taxAdjustmentsPaise;
        // Recalculate net tax liability: Output Tax - Eligible ITC + Adjustments
        const newNetTaxPayable = Math.max(0, record.totalOutputTaxPaise - newEligibleItc + newAdjustments);
        record.auditTrail.push({
            fieldChanged: 'eligibleItcPaise',
            oldValue: oldEligibleItc,
            newValue: newEligibleItc,
            reason: reason || 'Accounts audit of purchase GST invoices and 2B eligibility confirmation',
            changedBy: req.user?.id,
            changedByName: req.user?.name || 'Accounts Officer',
            changedAt: new Date(),
        });
        record.eligibleItcPaise = newEligibleItc;
        record.ineligibleItcPaise = Math.max(0, record.totalPurchaseGstPaise - newEligibleItc);
        record.taxAdjustmentsPaise = newAdjustments;
        record.netTaxPayablePaise = newNetTaxPayable;
        record.reconciliationStatus = 'reconciled';
        record.reconciledBy = req.user?.id;
        record.reconciledAt = new Date();
        await record.save();
        res.json({
            success: true,
            message: 'Eligible ITC updated and net tax liability recalculated immediately.',
            record,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateEligibleItc = updateEligibleItc;
const recordTaxPayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amountPaise, taxPaymentReference, taxPaymentDate, bankChallanBsrcode } = req.body;
        const record = await TaxReconciliation_1.TaxReconciliation.findById(id);
        if (!record) {
            res.status(404).json({ success: false, message: 'Tax reconciliation record not found' });
            return;
        }
        record.actualPaidAmountPaise = Number(amountPaise) || record.netTaxPayablePaise;
        record.taxPaymentReference = taxPaymentReference || `GST-CPIN-${Date.now().toString().slice(-8)}`;
        record.taxPaymentDate = new Date(taxPaymentDate || Date.now());
        record.bankChallanBsrcode = bankChallanBsrcode || '0233301';
        record.paymentStatus = 'paid';
        await record.save();
        res.json({
            success: true,
            message: 'Tax payment recorded successfully with bank challan reference.',
            record,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.recordTaxPayment = recordTaxPayment;
const recordTaxFiling = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { returnFilingDate, returnAckNumber } = req.body;
        const record = await TaxReconciliation_1.TaxReconciliation.findById(id);
        if (!record) {
            res.status(404).json({ success: false, message: 'Tax reconciliation record not found' });
            return;
        }
        const filingDate = new Date(returnFilingDate || Date.now());
        const ackNumber = (typeof returnAckNumber === 'string' && returnAckNumber.trim()
            ? returnAckNumber.trim()
            : `ARN-AA331026${Math.floor(100000 + Math.random() * 900000)}`).toUpperCase();
        record.returnStatus = 'filed';
        record.reconciliationStatus = 'reconciled';
        record.returnFilingDate = filingDate;
        record.returnAckNumber = ackNumber;
        await record.save();
        // Simultaneously mark ALL active invoices in this period as GST Filed with this ARN!
        const updateRes = await Invoice_1.Invoice.updateMany({
            isDeleted: { $ne: true },
            status: { $ne: 'cancelled' },
            gstTaxPeriod: record.period,
        }, {
            $set: {
                gstFiled: true,
                gstFilingDate: filingDate,
                gstFilingArn: ackNumber,
                gstTaxPeriod: record.period,
            },
        });
        res.json({
            success: true,
            message: `GST Return for ${record.period} filed (${ackNumber}) and synced to ${updateRes.modifiedCount ?? 0} invoice(s).`,
            record,
            updatedInvoicesCount: updateRes.modifiedCount ?? 0,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.recordTaxFiling = recordTaxFiling;
