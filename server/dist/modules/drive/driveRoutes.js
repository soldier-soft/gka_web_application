"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const googleDriveService_1 = require("../../services/googleDriveService");
const constants_1 = require("../../shared/constants");
const Quotation_1 = require("../../models/Quotation");
const Invoice_1 = require("../../models/Invoice");
const Project_1 = require("../../models/Project");
const pdfService_1 = require("../../services/pdfService");
const Client_1 = require("../../models/Client");
const User_1 = require("../../models/User");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
/**
 * GET /api/v1/drive/config
 * Returns target Google Drive folder information
 */
router.get('/config', (req, res) => {
    res.json({
        success: true,
        config: constants_1.GOOGLE_DRIVE_CONFIG,
        message: 'Google Drive folder configured for automatic synchronization.',
    });
});
/**
 * POST /api/v1/drive/sync/:type/:id
 * Manually trigger Google Drive sync for a quotation, invoice, or project
 */
router.post('/sync/:type/:id', async (req, res, next) => {
    try {
        const { type, id } = req.params;
        if (type === 'quotation') {
            const quotation = await Quotation_1.Quotation.findById(id);
            if (!quotation) {
                res.status(404).json({ success: false, message: 'Quotation not found' });
                return;
            }
            // Check if linked to project
            const isLinkedToProject = Boolean(quotation.projectId);
            quotation.isLinkedToProject = isLinkedToProject;
            if (isLinkedToProject && quotation.projectId) {
                const project = await Project_1.Project.findById(quotation.projectId);
                const clientId = project?.clientId || quotation.clientId;
                if (clientId) {
                    const client = await Client_1.Client.findById(clientId);
                    if (client) {
                        quotation.clientName = client.name;
                        const clientUser = await User_1.User.findOne({
                            $or: [{ clientId: client._id }, { _id: client.userId }, { email: client.email.toLowerCase() }],
                        });
                        if (clientUser) {
                            quotation.clientPortalUsername = clientUser.email;
                            quotation.clientPortalPassword = clientUser.defaultPassword || 'GKAclient2026!';
                        }
                    }
                }
            }
            const docStream = pdfService_1.PDFService.generateQuotationPDF(quotation);
            const chunks = [];
            docStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            docStream.on('end', async () => {
                const pdfBuffer = Buffer.concat(chunks);
                const result = await googleDriveService_1.GoogleDriveService.syncQuotationPdf(quotation.quotationNumber, pdfBuffer, quotation.projectId, quotation.clientName);
                res.json({ success: true, result });
            });
            return;
        }
        if (type === 'invoice') {
            const invoice = await Invoice_1.Invoice.findById(id);
            if (!invoice) {
                res.status(404).json({ success: false, message: 'Invoice not found' });
                return;
            }
            const isLinkedToProject = Boolean(invoice.projectId);
            invoice.isLinkedToProject = isLinkedToProject;
            if (isLinkedToProject && invoice.projectId) {
                const project = await Project_1.Project.findById(invoice.projectId);
                const clientId = project?.clientId || invoice.clientId;
                if (clientId) {
                    const client = await Client_1.Client.findById(clientId);
                    if (client) {
                        invoice.clientName = client.name;
                        const clientUser = await User_1.User.findOne({
                            $or: [{ clientId: client._id }, { _id: client.userId }, { email: client.email.toLowerCase() }],
                        });
                        if (clientUser) {
                            invoice.clientPortalUsername = clientUser.email;
                            invoice.clientPortalPassword = clientUser.defaultPassword || 'GKAclient2026!';
                        }
                    }
                }
            }
            const docStream = pdfService_1.PDFService.generateInvoicePDF(invoice);
            const chunks = [];
            docStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            docStream.on('end', async () => {
                const pdfBuffer = Buffer.concat(chunks);
                const result = await googleDriveService_1.GoogleDriveService.syncInvoicePdf(invoice.invoiceNumber, pdfBuffer, invoice.projectId, invoice.clientName);
                res.json({ success: true, result });
            });
            return;
        }
        if (type === 'project') {
            const project = await Project_1.Project.findById(id).populate('clientId');
            if (!project) {
                res.status(404).json({ success: false, message: 'Project not found' });
                return;
            }
            const result = await googleDriveService_1.GoogleDriveService.syncProjectDetails(project);
            res.json({ success: true, result });
            return;
        }
        res.status(400).json({ success: false, message: 'Invalid sync type. Must be quotation, invoice, or project' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
