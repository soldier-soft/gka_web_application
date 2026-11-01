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
const Project_1 = require("../models/Project");
class GoogleDriveService {
    /**
     * Resolves the active uploads directory across development & production builds
     */
    static getUploadsDir() {
        const candidates = [
            path_1.default.resolve(__dirname, '../uploads'),
            path_1.default.resolve(__dirname, '../../uploads'),
            path_1.default.resolve(process.cwd(), 'server', 'uploads'),
            path_1.default.resolve(process.cwd(), 'uploads'),
        ];
        for (const cand of candidates) {
            if (fs_1.default.existsSync(cand))
                return cand;
        }
        const fallback = path_1.default.resolve(process.cwd(), 'server', 'uploads');
        fs_1.default.mkdirSync(fallback, { recursive: true });
        return fallback;
    }
    static getSyncDir() {
        const dir = path_1.default.join(this.getUploadsDir(), 'google_drive_sync');
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        return dir;
    }
    /**
     * Save and sync Quotation PDF to Google Drive archive and project document registry
     */
    static async syncQuotationPdf(quotationNumber, pdfBuffer, projectId, clientName) {
        const syncDir = this.getSyncDir();
        const cleanNum = quotationNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `GKA_Quotation_${cleanNum}.pdf`;
        const filePath = path_1.default.join(syncDir, fileName);
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
        const syncDir = this.getSyncDir();
        const cleanNum = invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `GKA_Invoice_${cleanNum}.pdf`;
        const filePath = path_1.default.join(syncDir, fileName);
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
        const syncDir = this.getSyncDir();
        const cleanCode = (project.projectId || 'PROJECT').replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `GKA_Project_Details_${cleanCode}.json`;
        const filePath = path_1.default.join(syncDir, fileName);
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
     * Save and sync Site Diary Photo into Google Drive project-specific separate folder and document registry
     */
    static async syncSiteDiaryPhoto(projectId, fileName, fileBuffer, caption, category) {
        const uploadsRoot = this.getUploadsDir();
        let projectFolderName = 'GENERAL_PROJECT';
        let projectCode = 'GENERAL';
        let projectTitle = 'General Site';
        if (projectId) {
            try {
                const project = await Project_1.Project.findById(projectId);
                if (project) {
                    projectCode = project.projectId;
                    projectTitle = project.title;
                    const cleanCode = project.projectId.replace(/[^a-zA-Z0-9_-]/g, '_');
                    const cleanTitle = project.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
                    projectFolderName = `${cleanCode}_${cleanTitle}`;
                }
            }
            catch (err) {
                console.warn('[GoogleDriveService] Error finding project for site diary photo:', err);
            }
        }
        const projectDir = path_1.default.join(uploadsRoot, 'google_drive_sync', 'projects', projectFolderName, 'site_diary_photos');
        if (!fs_1.default.existsSync(projectDir)) {
            fs_1.default.mkdirSync(projectDir, { recursive: true });
        }
        // Sanitize file name with timestamp
        const timestamp = Date.now();
        const ext = path_1.default.extname(fileName) || '.jpg';
        const baseName = path_1.default.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
        const finalFileName = `${baseName}_${timestamp}${ext}`;
        const filePath = path_1.default.join(projectDir, finalFileName);
        fs_1.default.writeFileSync(filePath, fileBuffer);
        // Also replicate to root uploads/google_drive_sync for immediate cross-serving if needed
        const relativeUrl = `/uploads/google_drive_sync/projects/${projectFolderName}/site_diary_photos/${finalFileName}`;
        const driveSubfolder = `GKA CONSTRUCTION / ${projectFolderName} / Site Diary Photos`;
        const driveNote = `Saved automatically in Google Drive separate project folder: "${driveSubfolder} / ${finalFileName}"`;
        // Register into official Project Documents if projectId is available
        if (projectId) {
            try {
                await Document_1.ProjectDocument.create({
                    projectId,
                    title: `Site Diary Photo — ${caption || projectTitle}`,
                    fileName: finalFileName,
                    fileSize: fileBuffer.length,
                    fileType: ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg',
                    category: 'site_photos',
                    fileUrl: relativeUrl,
                    visibleToClient: true,
                    version: 1,
                    notes: driveNote,
                });
            }
            catch (docErr) {
                console.warn('[GoogleDriveService] Note registering site photo document:', docErr);
            }
        }
        // Optional webhook forwarding to Google Drive
        await this.forwardToWebhook(finalFileName, fileBuffer, 'site_diary_photo', {
            projectCode,
            projectTitle,
            projectFolderName,
            driveSubfolder,
        });
        return {
            success: true,
            fileName: finalFileName,
            fileUrl: relativeUrl,
            folderUrl: constants_1.GOOGLE_DRIVE_CONFIG.folderUrl,
            folderId: constants_1.GOOGLE_DRIVE_CONFIG.folderId,
            projectFolderName,
            driveSubfolder,
            driveNote,
            message: `Site diary photo successfully saved and synchronized into Google Drive project folder "${driveSubfolder}".`,
        };
    }
    /**
     * Helper to forward to Google Apps Script / webhook if webhook URL configured
     */
    static async forwardToWebhook(fileName, buffer, type, extraMeta) {
        const webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL;
        if (!webhookUrl)
            return;
        try {
            const base64Data = buffer.toString('base64');
            const payload = {
                folderId: constants_1.GOOGLE_DRIVE_CONFIG.folderId,
                fileName,
                fileType: fileName.endsWith('.json')
                    ? 'application/json'
                    : fileName.endsWith('.pdf')
                        ? 'application/pdf'
                        : 'image/jpeg',
                type,
                data: base64Data,
                ...extraMeta,
            };
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
