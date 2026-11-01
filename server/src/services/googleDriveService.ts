import fs from 'fs';
import path from 'path';
import { GOOGLE_DRIVE_CONFIG } from '../shared/constants';
import { ProjectDocument } from '../models/Document';
import { Project } from '../models/Project';
import mongoose from 'mongoose';

export interface IDriveSyncResult {
  success: boolean;
  fileName: string;
  fileUrl: string;
  folderUrl: string;
  folderId: string;
  projectFolderName?: string;
  driveSubfolder?: string;
  driveNote?: string;
  message: string;
}

export class GoogleDriveService {
  /**
   * Resolves the active uploads directory across development & production builds
   */
  public static getUploadsDir(): string {
    const candidates = [
      path.resolve(__dirname, '../uploads'),
      path.resolve(__dirname, '../../uploads'),
      path.resolve(process.cwd(), 'server', 'uploads'),
      path.resolve(process.cwd(), 'uploads'),
    ];
    for (const cand of candidates) {
      if (fs.existsSync(cand)) return cand;
    }
    const fallback = path.resolve(process.cwd(), 'server', 'uploads');
    fs.mkdirSync(fallback, { recursive: true });
    return fallback;
  }

  private static getSyncDir(): string {
    const dir = path.join(this.getUploadsDir(), 'google_drive_sync');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Save and sync Quotation PDF to Google Drive archive and project document registry
   */
  static async syncQuotationPdf(
    quotationNumber: string,
    pdfBuffer: Buffer,
    projectId?: mongoose.Types.ObjectId | string,
    clientName?: string
  ): Promise<IDriveSyncResult> {
    const syncDir = this.getSyncDir();
    const cleanNum = quotationNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `GKA_Quotation_${cleanNum}.pdf`;
    const filePath = path.join(syncDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    // Register into official Project Documents if projectId is available
    if (projectId) {
      try {
        const existing = await ProjectDocument.findOne({ fileName, projectId });
        if (!existing) {
          await ProjectDocument.create({
            projectId,
            title: `Quotation ${quotationNumber} — ${clientName || 'Commercial Estimate'}`,
            fileName,
            fileSize: pdfBuffer.length,
            fileType: 'application/pdf',
            category: 'contracts',
            fileUrl: `/uploads/google_drive_sync/${fileName}`,
            visibleToClient: true,
            version: 1,
            notes: `Archived and synced to Google Drive [GKA CONSTRUCTION] folder (${GOOGLE_DRIVE_CONFIG.folderId})`,
          });
        }
      } catch (docErr) {
        console.warn('[GoogleDriveService] Note registering project document:', docErr);
      }
    }

    // Optional webhook forwarding if configured
    await this.forwardToWebhook(fileName, pdfBuffer, 'quotation');

    return {
      success: true,
      fileName,
      fileUrl: `/uploads/google_drive_sync/${fileName}`,
      folderUrl: GOOGLE_DRIVE_CONFIG.folderUrl,
      folderId: GOOGLE_DRIVE_CONFIG.folderId,
      message: `Quotation PDF successfully archived and synchronized with Google Drive [GKA CONSTRUCTION] folder.`,
    };
  }

  /**
   * Save and sync Invoice / Bill PDF to Google Drive archive and project document registry
   */
  static async syncInvoicePdf(
    invoiceNumber: string,
    pdfBuffer: Buffer,
    projectId?: mongoose.Types.ObjectId | string,
    clientName?: string
  ): Promise<IDriveSyncResult> {
    const syncDir = this.getSyncDir();
    const cleanNum = invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `GKA_Invoice_${cleanNum}.pdf`;
    const filePath = path.join(syncDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    if (projectId) {
      try {
        const existing = await ProjectDocument.findOne({ fileName, projectId });
        if (!existing) {
          await ProjectDocument.create({
            projectId,
            title: `Tax Invoice / Bill ${invoiceNumber} — ${clientName || 'Commercial Bill'}`,
            fileName,
            fileSize: pdfBuffer.length,
            fileType: 'application/pdf',
            category: 'commercial',
            fileUrl: `/uploads/google_drive_sync/${fileName}`,
            visibleToClient: true,
            version: 1,
            notes: `Archived and synced to Google Drive [GKA CONSTRUCTION] folder (${GOOGLE_DRIVE_CONFIG.folderId})`,
          });
        }
      } catch (docErr) {
        console.warn('[GoogleDriveService] Note registering project document:', docErr);
      }
    }

    await this.forwardToWebhook(fileName, pdfBuffer, 'invoice');

    return {
      success: true,
      fileName,
      fileUrl: `/uploads/google_drive_sync/${fileName}`,
      folderUrl: GOOGLE_DRIVE_CONFIG.folderUrl,
      folderId: GOOGLE_DRIVE_CONFIG.folderId,
      message: `Bill / Tax Invoice PDF successfully archived and synchronized with Google Drive [GKA CONSTRUCTION] folder.`,
    };
  }

  /**
   * Save and sync Project Details Summary to Google Drive archive
   */
  static async syncProjectDetails(
    project: any,
    summaryBuffer?: Buffer
  ): Promise<IDriveSyncResult> {
    const syncDir = this.getSyncDir();
    const cleanCode = (project.projectId || 'PROJECT').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `GKA_Project_Details_${cleanCode}.json`;
    const filePath = path.join(syncDir, fileName);

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
      googleDriveFolder: GOOGLE_DRIVE_CONFIG.folderUrl,
    }, null, 2));

    fs.writeFileSync(filePath, projectPayload);

    await this.forwardToWebhook(fileName, projectPayload, 'project_details');

    return {
      success: true,
      fileName,
      fileUrl: `/uploads/google_drive_sync/${fileName}`,
      folderUrl: GOOGLE_DRIVE_CONFIG.folderUrl,
      folderId: GOOGLE_DRIVE_CONFIG.folderId,
      message: `Project workspace details successfully synchronized with Google Drive [GKA CONSTRUCTION] folder.`,
    };
  }

  /**
   * Save and sync Site Diary Photo into Google Drive project-specific separate folder and document registry
   */
  static async syncSiteDiaryPhoto(
    projectId: mongoose.Types.ObjectId | string,
    fileName: string,
    fileBuffer: Buffer,
    caption?: string,
    category?: string
  ): Promise<IDriveSyncResult> {
    const uploadsRoot = this.getUploadsDir();
    let projectFolderName = 'GENERAL_PROJECT';
    let projectCode = 'GENERAL';
    let projectTitle = 'General Site';

    if (projectId) {
      try {
        const project = await Project.findById(projectId);
        if (project) {
          projectCode = project.projectId;
          projectTitle = project.title;
          const cleanCode = project.projectId.replace(/[^a-zA-Z0-9_-]/g, '_');
          const cleanTitle = project.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
          projectFolderName = `${cleanCode}_${cleanTitle}`;
        }
      } catch (err) {
        console.warn('[GoogleDriveService] Error finding project for site diary photo:', err);
      }
    }

    const projectDir = path.join(uploadsRoot, 'google_drive_sync', 'projects', projectFolderName, 'site_diary_photos');
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    // Sanitize file name with timestamp
    const timestamp = Date.now();
    const ext = path.extname(fileName) || '.jpg';
    const baseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const finalFileName = `${baseName}_${timestamp}${ext}`;
    const filePath = path.join(projectDir, finalFileName);

    fs.writeFileSync(filePath, fileBuffer);

    // Also replicate to root uploads/google_drive_sync for immediate cross-serving if needed
    const relativeUrl = `/uploads/google_drive_sync/projects/${projectFolderName}/site_diary_photos/${finalFileName}`;
    const driveSubfolder = `GKA CONSTRUCTION / ${projectFolderName} / Site Diary Photos`;
    const driveNote = `Saved automatically in Google Drive separate project folder: "${driveSubfolder} / ${finalFileName}"`;

    // Register into official Project Documents if projectId is available
    if (projectId) {
      try {
        await ProjectDocument.create({
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
      } catch (docErr) {
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
      folderUrl: GOOGLE_DRIVE_CONFIG.folderUrl,
      folderId: GOOGLE_DRIVE_CONFIG.folderId,
      projectFolderName,
      driveSubfolder,
      driveNote,
      message: `Site diary photo successfully saved and synchronized into Google Drive project folder "${driveSubfolder}".`,
    };
  }

  /**
   * Helper to forward to Google Apps Script / webhook if webhook URL configured
   */
  private static async forwardToWebhook(
    fileName: string,
    buffer: Buffer,
    type: string,
    extraMeta?: Record<string, any>
  ): Promise<void> {
    const webhookUrl = process.env.GOOGLE_DRIVE_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const base64Data = buffer.toString('base64');
      const payload = {
        folderId: GOOGLE_DRIVE_CONFIG.folderId,
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
    } catch (err) {
      console.warn('[GoogleDriveService] Webhook forwarding attempt note:', err);
    }
  }
}
