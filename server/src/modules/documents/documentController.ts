import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { ProjectDocument } from '../../models/Document';
import { Project } from '../../models/Project';
import { sendDocumentUploadAlertEmail } from '../../services/emailService';

export const getDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, category, visibleToClient } = req.query;
    const filter: any = {};

    if (projectId) filter.projectId = projectId;
    if (category) filter.category = category;
    if (visibleToClient !== undefined) filter.visibleToClient = visibleToClient === 'true';

    const documents = await ProjectDocument.find(filter)
      .populate('projectId', 'projectId title siteAddress')
      .populate('uploadedBy', 'name role email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const document = await ProjectDocument.findById(id)
      .populate('projectId', 'projectId title siteAddress')
      .populate('uploadedBy', 'name role email');

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    res.json({ success: true, document });
  } catch (error) {
    next(error);
  }
};

export const createDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      title,
      fileName,
      fileSize,
      fileType,
      category,
      fileUrl,
      projectId,
      visibleToClient,
      version,
    } = req.body;

    const uploadedBy = (req as any).user?._id || (req as any).user?.id;

    const document = await ProjectDocument.create({
      title: title || 'Untitled Document',
      fileName: fileName || `${(title || 'Document').replace(/\s+/g, '_')}.pdf`,
      fileSize: fileSize || 1024000,
      fileType: fileType || 'application/pdf',
      category: category || 'contracts',
      fileUrl: fileUrl || '/uploads/sample_document.pdf',
      projectId: projectId || undefined,
      uploadedBy,
      visibleToClient: Boolean(visibleToClient),
      version: Number(version) || 1,
    });

    const populated = await ProjectDocument.findById(document._id)
      .populate('projectId', 'projectId title')
      .populate('uploadedBy', 'name role');

    // Attempt to locate local file for attachment
    let fileAttachment: { filename: string; path?: string } | undefined;
    if (fileUrl && typeof fileUrl === 'string') {
      const cleanPath = fileUrl.replace(/^\/uploads\//, '');
      const candidatePaths = [
        path.resolve(process.cwd(), 'server', 'uploads', cleanPath),
        path.resolve(process.cwd(), 'uploads', cleanPath),
        path.resolve(__dirname, '../../uploads', cleanPath),
      ];
      for (const cp of candidatePaths) {
        if (fs.existsSync(cp)) {
          fileAttachment = {
            filename: document.fileName || 'document.pdf',
            path: cp,
          };
          break;
        }
      }
    }

    sendDocumentUploadAlertEmail(populated || document, fileAttachment).catch((err) => {
      console.error('[Documents] Failed to dispatch document upload alert email:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Document created successfully',
      document: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const document = await ProjectDocument.findById(id);

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    const {
      title,
      fileName,
      fileSize,
      fileType,
      category,
      fileUrl,
      projectId,
      visibleToClient,
      version,
    } = req.body;

    if (title !== undefined) document.title = title;
    if (fileName !== undefined) document.fileName = fileName;
    if (fileSize !== undefined) document.fileSize = Number(fileSize);
    if (fileType !== undefined) document.fileType = fileType;
    if (category !== undefined) document.category = category;
    if (fileUrl !== undefined) document.fileUrl = fileUrl;
    if (projectId !== undefined) document.projectId = projectId || undefined;
    if (visibleToClient !== undefined) document.visibleToClient = Boolean(visibleToClient);
    if (version !== undefined) document.version = Number(version);

    await document.save();

    const populated = await ProjectDocument.findById(document._id)
      .populate('projectId', 'projectId title')
      .populate('uploadedBy', 'name role');

    // Attempt to locate local file for attachment
    let fileAttachment: { filename: string; path?: string } | undefined;
    if (document.fileUrl && typeof document.fileUrl === 'string') {
      const cleanPath = document.fileUrl.replace(/^\/uploads\//, '');
      const candidatePaths = [
        path.resolve(process.cwd(), 'server', 'uploads', cleanPath),
        path.resolve(process.cwd(), 'uploads', cleanPath),
        path.resolve(__dirname, '../../uploads', cleanPath),
      ];
      for (const cp of candidatePaths) {
        if (fs.existsSync(cp)) {
          fileAttachment = {
            filename: document.fileName || 'document.pdf',
            path: cp,
          };
          break;
        }
      }
    }

    sendDocumentUploadAlertEmail(populated || document, fileAttachment, true, 'Document parameters or file updated').catch((err) => {
      console.error('[Documents] Failed to dispatch document update alert email:', err);
    });

    res.json({
      success: true,
      message: 'Document updated successfully',
      document: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const document = await ProjectDocument.findByIdAndDelete(id);

    if (!document) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};
