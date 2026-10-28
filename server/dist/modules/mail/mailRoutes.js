"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emailService_1 = require("../../services/emailService");
const auth_1 = require("../../middleware/auth");
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
        };
        const result = await (0, emailService_1.sendDocumentNotificationEmail)(payload);
        if (result.sent) {
            res.json({
                success: true,
                message: `Email successfully dispatched to ${recipientEmail} with official PDF link.`,
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
