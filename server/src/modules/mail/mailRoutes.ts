import { Router, Request, Response, NextFunction } from 'express';
import { sendDocumentNotificationEmail, DocumentEmailPayload } from '../../services/emailService';
import { authenticate } from '../../middleware/auth';

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
    };

    const result = await sendDocumentNotificationEmail(payload);

    if (result.sent) {
      res.json({
        success: true,
        message: `Email successfully dispatched to ${recipientEmail} with official PDF link.`,
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
