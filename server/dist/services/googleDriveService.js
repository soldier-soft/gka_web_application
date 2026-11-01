"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleDriveService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("../shared/constants");
const Document_1 = require("../models/Document");
class GoogleDriveService {
    static syncDir = path_1.default.join(process.cwd(), 'uploads', 'google_drive_sync');
    static ensureSyncDir() {
        if (!fs_1.default.existsSync(this.syncDir)) {
            fs_1.default.mkdirSync(this.syncDir, { recursive: true });
        }
    }
    /**
     * Save and sync Quotation PDF to Google Drive archive and project document registry
     */
    static async syncQuotationPdf(quotationNumber, pdfBuffer, projectId, clientName) {
        this.ensureSyncDir();
        const cleanNum = quotationNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `GKA_Quotation_${cleanNum}.pdf`;
        const filePath = path_1.default.join(this.syncDir, fileName);
        fs_1.default.writeFileSync(filePath, pdfBuffer);
        // Register into official Project Documents if projectId is available
        if (projectId) {
            try {
                const existing = await Document_1.ProjectDocument.findOne({ fileName, projectId });
                if (!existing) {
                    await Document_1.ProjectDocument.create({
                        projectId,
                        title: `Quotation ${quotationNumber} — ${clientName || 'Commercial Estimate'}`,
                        fileName,
                        fileSize: pdfBuffer.length,
                        fileType: 'application/pdf',
                        category: 'contracts',
                        fileUrl: `/uploads/google_drive_sync/${fileName}`,
                        visibleToClient: true,
                        version: 1,
                        notes: `Archived and synced to Google Drive [GKA CONSTRUCTION] folder (${constants_1.GOOGLE_DRIVE_CONFIG.folderId})`,
                    });
                }
            }
            catch (docErr) {
                console.warn('[GoogleDriveService] Note registering project document:', docErr);
            }
        }
        // Optional webhook forwarding if configured
        await this.forwardToWebhook(fileName, pdfBuffer, 'quotation');
        return {
            success: true,
            fileName,
            fileUrl: `/uploads/google_drive_sync/${fileName}`,
            folderUrl: constants_1.GOOGLE_DRIVE_CONFIG.folderUrl,
            folderId: constants_1.GOOGLE_DRIVE_CONFIG.folderId,
            message: `Quotation PDF successfully archived and synchronized with Google Drive [GKA CONSTRUCTION] folder.`,
        };
    }
    /**
     * Save and sync Invoice / Bill PDF to Google Drive archive and project document registry
     */
    static async syncInvoicePdf(invoiceNumber, pdfBuffer, projectId, clientName) {
        this.ensureSyncDir();
        const cleanNum = invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `GKA_Invoice_${cleanNum}.pdf`;
        const filePath = path_1.default.join(this.syncDir, fileName);
        fs_1.default.writeFileSync(filePath, pdfBuffer);
        if (projectId) {
            try {
                const existing = await Document_1.ProjectDocument.findOne({ fileName, projectId });
                if (!existing) {
                    await Document_1.ProjectDocument.create({
                        projectId,
                        title: `Tax Invoice / Bill ${invoiceNumber} — ${clientName || 'Commercial Bill'}`,
                        fileName,
                        fileSize: pdfBuffer.length,
                        fileType: 'application/pdf',
                        category: 'commercial',
                        fileUrl: `/uploads/google_drive_sync/${fileName}`,
                        visibleToClient: true,
                        version: 1,
                        notes: `Archived and synced to Google Drive [GKA CONSTRUCTION] folder (${constants_1.GOOGLE_DRIVE_CONFIG.folderId})`,
                    });
                }
            }
            catch (docErr) {
                console.warn('[GoogleDriveService] Note registering project document:', docErr);
            }
        }
        await this.forwardToWebhook(fileName, pdfBuffer, 'invoice');
        return {
            success: true,
            fileName,
            fileUrl: `/uploads/google_drive_sync/${fileName}`,
            folderUrl: constants_1.GOOGLE_DRIVE_CONFIG.folderUrl,
            folderId: constants_1.GOOGLE_DRIVE_CONFIG.folderId,
            message: `Bill / Tax Invoice PDF successfully archived and synchronized with Google Drive [GKA CONSTRUCTION] folder.`,
        };
    }
    /**
     * Save and sync Project Details Summary to Google Drive archive
     */
    static async syncProjectDetails(project, summaryBuffer) {
        this.ensureSyncDir();
        const cleanCode = (project.projectId || 'PROJECT').replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `GKA_Project_Details_${cleanCode}.json`;
        const filePath = path_1.default.join(this.syncDir, fileName);
        const projectPayload = summaryBuffer || Buffer.from(JSON.stringify({
            projectId: project.projectId,
            title: project.title,
            category: project.category,
            clientName: project.clientId?.name || project.clientName,
            siteAddress: project.siteAddress,
            contractValuePaise: project.contractValuePaise,
            totalBudgetPaise: project.totalBudgetPaise,
            progressPercent: project.progressPercent,
            status: project.status,
            startDate: project.startDate,
            targetEndDate: project.targetEndDate,
            scopeOfWork: project.scopeOfWork,
            exportedAt: new Date().toISOString(),
            googleDriveFolder: constants_1.GOOGLE_DRIVE_CONFIG.folderUrl,
        }, null, 2));
        fs_1.default.writeFileSync(filePath, projectPayload);
        await this.forwardToWebhook(fileName, projectPayload, 'project_details');
        return {
            success: true,
            fileName,
            fileUrl: `/uploads/google_drive_sync/${fileName}`,
            folderUrl: constants_1.GOOGLE_DRIVE_CONFIG.folderUrl,
            folderId: constants_1.GOOGLE_DRIVE_CONFIG.folderId,
            message: `Project workspace details successfully synchronized with Google Drive [GKA CONSTRUCTION] folder.`,
        };
    }
    /**
     * Helper to forward to Google Apps Script / webhook if webhook URL configured
     */
    static async forwardToWebhook(fileName, buffer, type) {
        const webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL;
        if (!webhookUrl)
            return;
        try {
            const base64Data = buffer.toString('base64');
            const payload = {
                folderId: constants_1.GOOGLE_DRIVE_CONFIG.folderId,
                fileName,
                fileType: fileName.endsWith('.json') ? 'application/json' : 'application/pdf',
                type,
                data: base64Data,
            };
            // Native fetch in Node 18+
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }
        catch (err) {
            console.warn('[GoogleDriveService] Webhook forwarding attempt note:', err);
        }
    }
}
exports.GoogleDriveService = GoogleDriveService;
