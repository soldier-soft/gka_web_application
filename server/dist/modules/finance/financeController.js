"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordTaxFiling = exports.recordTaxPayment = exports.updateEligibleItc = exports.getTaxReconciliations = exports.getProfitabilityReport = exports.rejectPayment = exports.reconcilePayment = exports.verifyPayment = exports.recordPayment = exports.getPayments = exports.createExpense = exports.getExpenses = exports.permanentDeleteInvoice = exports.restoreInvoice = exports.deleteInvoice = exports.toggleInvoiceGst = exports.updateInvoice = exports.downloadInvoiceDOCX = exports.downloadInvoicePDF = exports.createInvoice = exports.getInvoices = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
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
const getInvoices = async (req, res, next) => {
    try {
        // Automatic cleanup: permanently purge soft-deleted invoices older than 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        await Invoice_1.Invoice.deleteMany({ isDeleted: true, deletedAt: { $lte: thirtyDaysAgo } });
        const { projectId, clientId, status, deleted } = req.query;
        const filter = {};
        if (projectId)
            filter.projectId = projectId;
        if (clientId)
            filter.clientId = clientId;
        if (status)
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
        const count = await Invoice_1.Invoice.countDocuments();
        const currentYear = new Date().getFullYear();
        const invoiceNumber = `GKA-INV-${currentYear}-${String(count + 1).padStart(3, '0')}`;
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
            issueDate: new Date(issueDate || Date.now()),
            dueDate: new Date(dueDate || Date.now() + 14 * 86400000),
            status: 'issued',
            notes,
        });
        // Update Project invoiced amount
        project.invoicedAmountPaise += totalAmountPaise;
        await project.save();
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
        if (gstTaxPeriod !== undefined)
            invoice.gstTaxPeriod = gstTaxPeriod;
        await invoice.save();
        res.json({
            success: true,
            message: `Invoice ${invoice.invoiceNumber} GST status updated to ${isFiled ? 'FILED' : 'UNFILED'}.`,
            invoice,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.toggleInvoiceGst = toggleInvoiceGst;
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
        // Recalculate project invoiced amounts
        if (invoice.projectId) {
            const activeInvoices = await Invoice_1.Invoice.find({ projectId: invoice.projectId, isDeleted: { $ne: true } });
            const totalInvoiced = activeInvoices.reduce((acc, i) => acc + (i.totalAmountPaise || 0), 0);
            await Project_1.Project.findByIdAndUpdate(invoice.projectId, { invoicedAmountPaise: totalInvoiced });
        }
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
        // Recalculate project invoiced amounts
        if (invoice.projectId) {
            const activeInvoices = await Invoice_1.Invoice.find({ projectId: invoice.projectId, isDeleted: { $ne: true } });
            const totalInvoiced = activeInvoices.reduce((acc, i) => acc + (i.totalAmountPaise || 0), 0);
            await Project_1.Project.findByIdAndUpdate(invoice.projectId, { invoicedAmountPaise: totalInvoiced });
        }
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
        // Recalculate project invoiced amounts
        if (invoice.projectId) {
            const activeInvoices = await Invoice_1.Invoice.find({ projectId: invoice.projectId, isDeleted: { $ne: true } });
            const totalInvoiced = activeInvoices.reduce((acc, i) => acc + (i.totalAmountPaise || 0), 0);
            await Project_1.Project.findByIdAndUpdate(invoice.projectId, { invoicedAmountPaise: totalInvoiced });
        }
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
        const { projectId, clientId, clientName, invoiceId, amountPaise, paymentDate, paymentMode, transactionReference, notes, verificationStatus, proofFileUrl, } = req.body;
        const count = await Payment_1.Payment.countDocuments();
        const currentYear = new Date().getFullYear();
        const paymentNumber = `GKA-REC-${currentYear}-${String(count + 1).padStart(3, '0')}`;
        const isVerified = verificationStatus === 'verified' || !verificationStatus;
        const payment = await Payment_1.Payment.create({
            paymentNumber,
            projectId,
            clientId,
            clientName,
            invoiceId,
            amountPaise: Number(amountPaise),
            paymentDate: new Date(paymentDate || Date.now()),
            paymentMode: paymentMode || 'bank_transfer',
            transactionReference,
            recordedBy: req.user?.id,
            verificationStatus: isVerified ? 'verified' : 'verification_pending',
            verifiedBy: isVerified ? req.user?.id : undefined,
            verifiedAt: isVerified ? new Date() : undefined,
            proofFileUrl,
            notes,
        });
        // Only verified payments update actual collected cash and invoice balances!
        if (isVerified) {
            if (invoiceId) {
                const invoice = await Invoice_1.Invoice.findById(invoiceId);
                if (invoice) {
                    invoice.paidAmountPaise += Number(amountPaise);
                    invoice.dueAmountPaise = Math.max(0, invoice.totalAmountPaise - invoice.paidAmountPaise);
                    invoice.status = invoice.dueAmountPaise === 0 ? 'paid' : 'partially_paid';
                    await invoice.save();
                    setTimeout(async () => {
                        try {
                            const stream = pdfService_1.PDFService.generateInvoicePDF(invoice);
                            const buffer = await (0, emailService_1.streamToBuffer)(stream);
                            await (0, emailService_1.sendInvoiceAlertEmail)(invoice, buffer, true, `Payment of ₹${(0, constants_1.toRupees)(Number(amountPaise)).toLocaleString('en-IN')} recorded via ${paymentMode || 'bank_transfer'}`);
                        }
                        catch (mErr) {
                            console.error('[Payment] Alert email error:', mErr);
                        }
                    }, 100);
                }
            }
            await Project_1.Project.findByIdAndUpdate(projectId, {
                $inc: { collectedAmountPaise: Number(amountPaise) },
            });
        }
        res.status(201).json({ success: true, payment });
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
        // Now update invoice balance
        if (payment.invoiceId) {
            const invoice = await Invoice_1.Invoice.findById(payment.invoiceId);
            if (invoice) {
                invoice.paidAmountPaise += payment.amountPaise;
                invoice.dueAmountPaise = Math.max(0, invoice.totalAmountPaise - invoice.paidAmountPaise);
                invoice.status = invoice.dueAmountPaise === 0 ? 'paid' : 'partially_paid';
                await invoice.save();
                setTimeout(async () => {
                    try {
                        const stream = pdfService_1.PDFService.generateInvoicePDF(invoice);
                        const buffer = await (0, emailService_1.streamToBuffer)(stream);
                        await (0, emailService_1.sendInvoiceAlertEmail)(invoice, buffer, true, `Payment of ₹${(0, constants_1.toRupees)(payment.amountPaise).toLocaleString('en-IN')} verified & credited to invoice`);
                    }
                    catch (mErr) {
                        console.error('[Payment] Verify alert email error:', mErr);
                    }
                }, 100);
            }
        }
        // Update Project collected amount
        await Project_1.Project.findByIdAndUpdate(payment.projectId, {
            $inc: { collectedAmountPaise: payment.amountPaise },
        });
        res.json({ success: true, message: 'Payment verified and credited to project collections.', payment });
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
        payment.verificationStatus = 'reconciled';
        payment.reconciliationDate = new Date();
        await payment.save();
        res.json({ success: true, message: 'Payment marked as reconciled against bank statement.', payment });
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
        let records = await TaxReconciliation_1.TaxReconciliation.find().sort({ period: -1 });
        const allInvoices = await Invoice_1.Invoice.find({ isDeleted: { $ne: true }, status: { $ne: 'cancelled' } });
        let totalTaxableSalesPaise = 0;
        let outputCgstPaise = 0;
        let outputSgstPaise = 0;
        let outputIgstPaise = 0;
        allInvoices.forEach((inv) => {
            totalTaxableSalesPaise += inv.subtotalPaise || 0;
            outputCgstPaise += inv.cgstPaise || 0;
            outputSgstPaise += inv.sgstPaise || 0;
            outputIgstPaise += inv.igstPaise || 0;
        });
        const totalOutputTaxPaise = outputCgstPaise + outputSgstPaise + outputIgstPaise;
        const allExpenses = await Expense_1.Expense.find();
        const totalPurchasesPaise = allExpenses.reduce((acc, e) => acc + (e.amountPaise || 0), 0);
        const totalPurchaseGstPaise = Math.round(totalPurchasesPaise * 0.18);
        // If no record exists, auto-seed one from existing invoices and expenses
        if (records.length === 0) {
            const eligibleItcPaise = Math.round(totalPurchaseGstPaise * 0.85); // 85% eligible ITC baseline
            const ineligibleItcPaise = totalPurchaseGstPaise - eligibleItcPaise;
            const netTaxPayablePaise = Math.max(0, totalOutputTaxPaise - eligibleItcPaise);
            const defaultRecord = await TaxReconciliation_1.TaxReconciliation.create({
                period: '2026-10',
                financialYear: 'FY 2026-27',
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
                returnStatus: 'not_filed',
                reconciliationStatus: 'draft_needs_review',
                notes: 'Live reconciliation period calculated from active project tax invoices and material bills.',
                auditTrail: [
                    {
                        fieldChanged: 'initial_calculation',
                        oldValue: 0,
                        newValue: eligibleItcPaise,
                        reason: 'System initialization based on verified commercial procurement invoices',
                        changedBy: req.user?.id || new mongoose_1.default.Types.ObjectId(),
                        changedByName: req.user?.name || 'Accounts Admin',
                        changedAt: new Date(),
                    },
                ],
            });
            records = [defaultRecord];
        }
        else if (records[0].returnStatus !== 'filed') {
            // Keep draft tax record in live sync with newly created invoices / bills
            const currentRec = records[0];
            const hasCustomItc = (currentRec.auditTrail || []).some((a) => a.fieldChanged === 'eligibleItcPaise');
            const eligibleItcPaise = hasCustomItc ? currentRec.eligibleItcPaise : Math.round(totalPurchaseGstPaise * 0.85);
            const ineligibleItcPaise = Math.max(0, totalPurchaseGstPaise - eligibleItcPaise);
            const netTaxPayablePaise = Math.max(0, totalOutputTaxPaise - eligibleItcPaise + (currentRec.taxAdjustmentsPaise || 0));
            currentRec.totalTaxableSalesPaise = totalTaxableSalesPaise;
            currentRec.outputCgstPaise = outputCgstPaise;
            currentRec.outputSgstPaise = outputSgstPaise;
            currentRec.outputIgstPaise = outputIgstPaise;
            currentRec.totalOutputTaxPaise = totalOutputTaxPaise;
            currentRec.totalTaxablePurchasesPaise = totalPurchasesPaise;
            currentRec.totalPurchaseGstPaise = totalPurchaseGstPaise;
            currentRec.eligibleItcPaise = eligibleItcPaise;
            currentRec.ineligibleItcPaise = ineligibleItcPaise;
            currentRec.netTaxPayablePaise = netTaxPayablePaise;
            await currentRec.save();
        }
        res.json({ success: true, count: records.length, records });
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
        record.returnStatus = 'filed';
        record.returnFilingDate = new Date(returnFilingDate || Date.now());
        record.returnAckNumber = returnAckNumber || `ARN-AA331026${Math.floor(100000 + Math.random() * 900000)}`;
        await record.save();
        res.json({
            success: true,
            message: 'GST Return filing acknowledged and recorded.',
            record,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.recordTaxFiling = recordTaxFiling;
