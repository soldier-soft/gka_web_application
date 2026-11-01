import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { GoogleDriveService } from '../../services/googleDriveService';
import { GOOGLE_DRIVE_CONFIG } from '../../shared/constants';
import { Quotation } from '../../models/Quotation';
import { Invoice } from '../../models/Invoice';
import { Project } from '../../models/Project';
import { PDFService } from '../../services/pdfService';
import { Client } from '../../models/Client';
import { User } from '../../models/User';
import { formatClientPortalUsername } from '../../shared/constants';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/drive/config
 * Returns target Google Drive folder information
 */
router.get('/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    config: GOOGLE_DRIVE_CONFIG,
    message: 'Google Drive folder configured for automatic synchronization.',
  });
});

/**
 * POST /api/v1/drive/sync/:type/:id
 * Manually trigger Google Drive sync for a quotation, invoice, or project
 */
router.post('/sync/:type/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, id } = req.params;

    if (type === 'quotation') {
      const quotation = await Quotation.findById(id);
      if (!quotation) {
        res.status(404).json({ success: false, message: 'Quotation not found' });
        return;
      }

      // Check if linked to project
      const isLinkedToProject = Boolean(quotation.projectId);
      (quotation as any).isLinkedToProject = isLinkedToProject;

      if (isLinkedToProject && quotation.projectId) {
        const project = await Project.findById(quotation.projectId);
        const clientId = project?.clientId || quotation.clientId;
        if (clientId) {
          const client = await Client.findById(clientId);
          if (client) {
            quotation.clientName = client.name;
            const clientUser = await User.findOne({
              $or: [{ clientId: client._id }, { _id: client.userId }, { email: client.email.toLowerCase() }],
            });
            if (clientUser) {
              (quotation as any).clientPortalUsername = clientUser.email;
              (quotation as any).clientPortalPassword = clientUser.defaultPassword || 'GKAclient2026!';
            }
          }
        }
      }

      const docStream = PDFService.generateQuotationPDF(quotation);
      const chunks: Buffer[] = [];
      docStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      docStream.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks);
        const result = await GoogleDriveService.syncQuotationPdf(
          quotation.quotationNumber,
          pdfBuffer,
          quotation.projectId,
          quotation.clientName
        );
        res.json({ success: true, result });
      });
      return;
    }

    if (type === 'invoice') {
      const invoice = await Invoice.findById(id);
      if (!invoice) {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }

      const isLinkedToProject = Boolean(invoice.projectId);
      (invoice as any).isLinkedToProject = isLinkedToProject;

      if (isLinkedToProject && invoice.projectId) {
        const project = await Project.findById(invoice.projectId);
        const clientId = project?.clientId || invoice.clientId;
        if (clientId) {
          const client = await Client.findById(clientId);
          if (client) {
            invoice.clientName = client.name;
            const clientUser = await User.findOne({
              $or: [{ clientId: client._id }, { _id: client.userId }, { email: client.email.toLowerCase() }],
            });
            if (clientUser) {
              (invoice as any).clientPortalUsername = clientUser.email;
              (invoice as any).clientPortalPassword = clientUser.defaultPassword || 'GKAclient2026!';
            }
          }
        }
      }

      const docStream = PDFService.generateInvoicePDF(invoice);
      const chunks: Buffer[] = [];
      docStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      docStream.on('end', async () => {
        const pdfBuffer = Buffer.concat(chunks);
        const result = await GoogleDriveService.syncInvoicePdf(
          invoice.invoiceNumber,
          pdfBuffer,
          invoice.projectId,
          invoice.clientName
        );
        res.json({ success: true, result });
      });
      return;
    }

    if (type === 'project') {
      const project = await Project.findById(id).populate('clientId');
      if (!project) {
        res.status(404).json({ success: false, message: 'Project not found' });
        return;
      }

      const result = await GoogleDriveService.syncProjectDetails(project);
      res.json({ success: true, result });
      return;
    }

    res.status(400).json({ success: false, message: 'Invalid sync type. Must be quotation, invoice, or project' });
  } catch (error) {
    next(error);
  }
});

export default router;
