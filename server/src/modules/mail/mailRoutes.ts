import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import {
  sendDocumentNotificationEmail,
  DocumentEmailPayload,
  streamToBuffer,
} from '../../services/emailService';
import { authenticate } from '../../middleware/auth';
import { PDFService } from '../../services/pdfService';
import { Quotation } from '../../models/Quotation';
import { Invoice } from '../../models/Invoice';
import { Project } from '../../models/Project';
import { Client } from '../../models/Client';
import { User } from '../../models/User';
import { formatClientPortalUsername } from '../../shared/constants';

const router = Router();

// POST /api/v1/mail/send-document
router.post('/send-document', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      recipientEmail,
      recipientName,
      documentType,
      documentNumber,
      projectTitle,
      siteLocation,
      amount,
      dueDate,
      pdfUrl,
      portalUsername,
      portalPassword,
      customSubject,
      customMessage,
    } = req.body;

    if (!recipientEmail || !pdfUrl || !documentNumber || !projectTitle) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: recipientEmail, pdfUrl, documentNumber, projectTitle are required.',
      });
      return;
    }

    // Generate or locate official document file attachment
    let fileAttachment:
      | { filename: string; content?: Buffer; path?: string; contentType?: string }
      | undefined;

    if (documentType === 'quotation') {
      let quotation: any = null;
      const matchId = pdfUrl ? pdfUrl.match(/\/quotations\/([a-f0-9]{24})/i) : null;
      if (matchId) {
        quotation = await Quotation.findById(matchId[1]);
      }
      if (!quotation && documentNumber) {
        quotation = await Quotation.findOne({ quotationNumber: documentNumber });
      }

      if (quotation) {
        const isLinkedToProject = Boolean(quotation.projectId);
        (quotation as any).isLinkedToProject = isLinkedToProject;

        let clientPortalUsername = formatClientPortalUsername(quotation.clientName);
        let clientPortalPassword = 'GKAclient2026!';

        if (isLinkedToProject) {
          let resolvedClientId = quotation.clientId;
          if (!resolvedClientId && quotation.projectId) {
            const proj = await Project.findById(quotation.projectId);
            if (proj?.clientId) resolvedClientId = proj.clientId;
          }

          if (resolvedClientId) {
            const client = await Client.findById(resolvedClientId);
            if (client) {
              const clientUser = await User.findOne({
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
              } else if (client.email) {
                clientPortalUsername = client.email.endsWith('@gkaconstruction.com')
                  ? client.email.toLowerCase()
                  : formatClientPortalUsername(client.name);
              }
            }
          }
        }

        (quotation as any).clientPortalUsername = clientPortalUsername;
        (quotation as any).clientPortalPassword = clientPortalPassword;

        try {
          const docStream = PDFService.generateQuotationPDF(quotation);
          const pdfBuffer = await streamToBuffer(docStream);
          fileAttachment = {
            filename: `${quotation.quotationNumber || documentNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          };
        } catch (pdfErr) {
          console.error('[MailRoutes] Failed to generate quotation PDF buffer:', pdfErr);
        }
      }
    } else if (documentType === 'invoice') {
      let invoice: any = null;
      const matchId = pdfUrl ? pdfUrl.match(/\/invoices\/([a-f0-9]{24})/i) : null;
      if (matchId) {
        invoice = await Invoice.findById(matchId[1]);
      }
      if (!invoice && documentNumber) {
        invoice = await Invoice.findOne({ invoiceNumber: documentNumber });
      }

      if (invoice) {
        const isLinkedToProject = Boolean(invoice.projectId);
        (invoice as any).isLinkedToProject = isLinkedToProject;

        let clientPortalUsername = formatClientPortalUsername(invoice.clientName);
        let clientPortalPassword = 'GKAclient2026!';

        if (isLinkedToProject) {
          let resolvedClientId = invoice.clientId;
          if (!resolvedClientId && invoice.projectId) {
            const proj = await Project.findById(invoice.projectId);
            if (proj?.clientId) resolvedClientId = proj.clientId;
          }

          if (resolvedClientId) {
            const client = await Client.findById(resolvedClientId);
            if (client) {
              const clientUser = await User.findOne({
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
              } else if (client.email) {
                clientPortalUsername = client.email.endsWith('@gkaconstruction.com')
                  ? client.email.toLowerCase()
                  : formatClientPortalUsername(client.name);
              }
            }
          }
        }

        (invoice as any).clientPortalUsername = clientPortalUsername;
        (invoice as any).clientPortalPassword = clientPortalPassword;

        try {
          const docStream = PDFService.generateInvoicePDF(invoice);
          const pdfBuffer = await streamToBuffer(docStream);
          fileAttachment = {
            filename: `${invoice.invoiceNumber || documentNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          };
        } catch (pdfErr) {
          console.error('[MailRoutes] Failed to generate invoice PDF buffer:', pdfErr);
        }
      }
    } else if (documentType === 'welcome') {
      let project: any = null;
      const matchId = pdfUrl ? pdfUrl.match(/\/projects\/([a-f0-9]{24})/i) : null;
      if (matchId) {
        project = await Project.findById(matchId[1]);
      }
      if (!project && documentNumber) {
        project = await Project.findOne({ projectId: documentNumber });
      }

      if (project) {
        const client = await Client.findById(project.clientId);
        let user = client ? await User.findOne({ email: client.email.toLowerCase() }) : null;
        let defaultPassword = user?.defaultPassword || 'GKAclient2026!';
        const quotations = await Quotation.find({
          projectId: project._id,
          isDeleted: { $ne: true },
        }).sort({ createdAt: -1 });
        const invoices = await Invoice.find({
          projectId: project._id,
          isDeleted: { $ne: true },
        }).sort({ issueDate: -1 });
        const portalUrl = 'https://www.gkaconstruction.com/login';

        try {
          const pdfStream = PDFService.generateProjectWelcomePDF(
            project,
            client || { name: project.title, email: recipientEmail },
            {
              portalUrl,
              username: user?.email || portalUsername || recipientEmail,
              temporaryPassword: defaultPassword,
              defaultPassword,
            },
            quotations,
            invoices
          );
          const pdfBuffer = await streamToBuffer(pdfStream);
          fileAttachment = {
            filename: `GKA_Project_Welcome_${project.projectId || documentNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          };
        } catch (pdfErr) {
          console.error('[MailRoutes] Failed to generate project welcome PDF buffer:', pdfErr);
        }
      }
    }

    if (!fileAttachment && pdfUrl) {
      const matchUpload = pdfUrl.match(/\/uploads\/(.+)$/i);
      if (matchUpload) {
        const cleanPath = matchUpload[1];
        const candidatePaths = [
          path.resolve(process.cwd(), 'server', 'uploads', cleanPath),
          path.resolve(process.cwd(), 'uploads', cleanPath),
          path.resolve(__dirname, '../../uploads', cleanPath),
        ];
        for (const cp of candidatePaths) {
          if (fs.existsSync(cp)) {
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

    const payload: DocumentEmailPayload = {
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

    const result = await sendDocumentNotificationEmail(payload);

    if (result.sent) {
      res.json({
        success: true,
        message: `Official document and text template dispatched successfully to ${recipientEmail} with file attachment!`,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to dispatch email via mail service.',
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
