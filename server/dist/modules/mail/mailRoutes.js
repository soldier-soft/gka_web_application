"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const emailService_1 = require("../../services/emailService");
const auth_1 = require("../../middleware/auth");
const pdfService_1 = require("../../services/pdfService");
const Quotation_1 = require("../../models/Quotation");
const Invoice_1 = require("../../models/Invoice");
const Project_1 = require("../../models/Project");
const Client_1 = require("../../models/Client");
const User_1 = require("../../models/User");
const constants_1 = require("../../shared/constants");
const router = (0, express_1.Router)();
// POST /api/v1/mail/send-document
router.post('/send-document', auth_1.authenticate, async (req, res, next) => {
    try {
        const { recipientEmail, recipientName, documentType, documentNumber, projectTitle, siteLocation, amount, dueDate, pdfUrl, portalUsername, portalPassword, customSubject, customMessage, } = req.body;
        if (!recipientEmail || !pdfUrl || !documentNumber || !projectTitle) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: recipientEmail, pdfUrl, documentNumber, projectTitle are required.',
            });
            return;
        }
        // Generate or locate official document file attachment
        let fileAttachment;
        if (documentType === 'quotation') {
            let quotation = null;
            const matchId = pdfUrl ? pdfUrl.match(/\/quotations\/([a-f0-9]{24})/i) : null;
            if (matchId) {
                quotation = await Quotation_1.Quotation.findById(matchId[1]);
            }
            if (!quotation && documentNumber) {
                quotation = await Quotation_1.Quotation.findOne({ quotationNumber: documentNumber });
            }
            if (quotation) {
                const isLinkedToProject = Boolean(quotation.projectId);
                quotation.isLinkedToProject = isLinkedToProject;
                let clientPortalUsername = (0, constants_1.formatClientPortalUsername)(quotation.clientName);
                let clientPortalPassword = 'GKAclient2026!';
                if (isLinkedToProject) {
                    let resolvedClientId = quotation.clientId;
                    if (!resolvedClientId && quotation.projectId) {
                        const proj = await Project_1.Project.findById(quotation.projectId);
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
                quotation.clientPortalUsername = clientPortalUsername;
                quotation.clientPortalPassword = clientPortalPassword;
                try {
                    const docStream = pdfService_1.PDFService.generateQuotationPDF(quotation);
                    const pdfBuffer = await (0, emailService_1.streamToBuffer)(docStream);
                    fileAttachment = {
                        filename: `${quotation.quotationNumber || documentNumber}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf',
                    };
                }
                catch (pdfErr) {
                    console.error('[MailRoutes] Failed to generate quotation PDF buffer:', pdfErr);
                }
            }
        }
        else if (documentType === 'invoice') {
            let invoice = null;
            const matchId = pdfUrl ? pdfUrl.match(/\/invoices\/([a-f0-9]{24})/i) : null;
            if (matchId) {
                invoice = await Invoice_1.Invoice.findById(matchId[1]);
            }
            if (!invoice && documentNumber) {
                invoice = await Invoice_1.Invoice.findOne({ invoiceNumber: documentNumber });
            }
            if (invoice) {
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
                try {
                    const docStream = pdfService_1.PDFService.generateInvoicePDF(invoice);
                    const pdfBuffer = await (0, emailService_1.streamToBuffer)(docStream);
                    fileAttachment = {
                        filename: `${invoice.invoiceNumber || documentNumber}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf',
                    };
                }
                catch (pdfErr) {
                    console.error('[MailRoutes] Failed to generate invoice PDF buffer:', pdfErr);
                }
            }
        }
        else if (documentType === 'welcome') {
            let project = null;
            const matchId = pdfUrl ? pdfUrl.match(/\/projects\/([a-f0-9]{24})/i) : null;
            if (matchId) {
                project = await Project_1.Project.findById(matchId[1]);
            }
            if (!project && documentNumber) {
                project = await Project_1.Project.findOne({ projectId: documentNumber });
            }
            if (project) {
                const client = await Client_1.Client.findById(project.clientId);
                let user = client ? await User_1.User.findOne({ email: client.email.toLowerCase() }) : null;
                let defaultPassword = user?.defaultPassword || 'GKAclient2026!';
                const quotations = await Quotation_1.Quotation.find({
                    projectId: project._id,
                    isDeleted: { $ne: true },
                }).sort({ createdAt: -1 });
                const invoices = await Invoice_1.Invoice.find({
                    projectId: project._id,
                    isDeleted: { $ne: true },
                }).sort({ issueDate: -1 });
                const portalUrl = 'https://www.gkaconstruction.com/login';
                try {
                    const pdfStream = pdfService_1.PDFService.generateProjectWelcomePDF(project, client || { name: project.title, email: recipientEmail }, {
                        portalUrl,
                        username: user?.email || portalUsername || recipientEmail,
                        temporaryPassword: defaultPassword,
                        defaultPassword,
                    }, quotations, invoices);
                    const pdfBuffer = await (0, emailService_1.streamToBuffer)(pdfStream);
                    fileAttachment = {
                        filename: `GKA_Project_Welcome_${project.projectId || documentNumber}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf',
                    };
                }
                catch (pdfErr) {
                    console.error('[MailRoutes] Failed to generate project welcome PDF buffer:', pdfErr);
                }
            }
        }
        if (!fileAttachment && pdfUrl) {
            const matchUpload = pdfUrl.match(/\/uploads\/(.+)$/i);
            if (matchUpload) {
                const cleanPath = matchUpload[1];
                const candidatePaths = [
                    path_1.default.resolve(process.cwd(), 'server', 'uploads', cleanPath),
                    path_1.default.resolve(process.cwd(), 'uploads', cleanPath),
                    path_1.default.resolve(__dirname, '../../uploads', cleanPath),
                ];
                for (const cp of candidatePaths) {
                    if (fs_1.default.existsSync(cp)) {
                        fileAttachment = {
                            filename: `${documentNumber || 'document'}.pdf`,
                            path: cp,
                            contentType: 'application/pdf',
                        };
                        break;
                    }
                }
            }
        }
        const payload = {
            recipientEmail,
            recipientName,
            documentType: documentType || 'quotation',
            documentNumber,
            projectTitle,
            siteLocation,
            amount: amount !== undefined ? Number(amount) : undefined,
            dueDate,
            pdfUrl,
            portalUsername,
            portalPassword,
            customSubject,
            customMessage,
            fileAttachment,
        };
        const result = await (0, emailService_1.sendDocumentNotificationEmail)(payload);
        if (result.sent) {
            res.json({
                success: true,
                message: `Official document and text template dispatched successfully to ${recipientEmail} with file attachment!`,
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: result.error || 'Failed to dispatch email via mail service.',
            });
        }
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
