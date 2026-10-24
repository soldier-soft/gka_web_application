"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEnquiryNotification = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const constants_1 = require("../shared/constants");
const getTransporter = () => {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
        return null;
    }
    return nodemailer_1.default.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });
};
const sendEnquiryNotification = async (enquiry) => {
    const transporter = getTransporter();
    if (!transporter) {
        console.warn('[EmailService] SMTP credentials not configured. Skipping email notification.');
        return {
            sent: false,
            error: 'SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not configured in server environment.',
        };
    }
    try {
        const fromAddress = process.env.SMTP_FROM || `"GKA Construction Portal" <${process.env.SMTP_USER}>`;
        const toAddress = process.env.NOTIFICATION_EMAIL || constants_1.GKA_COMPANY.email;
        const emailSubject = `[New GKA Enquiry #${enquiry.referenceNumber}] from ${enquiry.customerName}`;
        const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="background-color: #0F1E36; color: #ffffff; padding: 16px; border-radius: 6px 6px 0 0;">
          <h2 style="margin: 0; color: #C59A27;">GKA Construction — New Website Enquiry</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px;">Reference Number: <strong>${enquiry.referenceNumber}</strong></p>
        </div>
        <div style="padding: 16px; background-color: #f8fafc;">
          <h3 style="color: #0F1E36; margin-top: 0;">Customer Details</h3>
          <p style="margin: 4px 0;"><strong>Name:</strong> ${enquiry.customerName}</p>
          <p style="margin: 4px 0;"><strong>Phone:</strong> ${enquiry.phone}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> ${enquiry.email || 'Not provided'}</p>
          <p style="margin: 4px 0;"><strong>Preferred Contact Method:</strong> ${enquiry.preferredContactMethod.toUpperCase()}</p>
          <p style="margin: 4px 0;"><strong>Preferred Contact Time:</strong> ${enquiry.preferredContactTime || 'Any time'}</p>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          
          <h3 style="color: #0F1E36; margin-top: 0;">Project Requirements</h3>
          <p style="margin: 4px 0;"><strong>Service Type:</strong> ${enquiry.serviceType}</p>
          <p style="margin: 4px 0;"><strong>Project Type:</strong> ${enquiry.projectType}</p>
          <p style="margin: 4px 0;"><strong>Site Location:</strong> ${enquiry.projectLocation}</p>
          <p style="margin: 4px 0;"><strong>Approx Area:</strong> ${enquiry.builtUpAreaSqFt ? `${enquiry.builtUpAreaSqFt} sq.ft` : 'Not specified'}</p>
          ${enquiry.relatedProjectTitle ? `<p style="margin: 4px 0;"><strong>Inquired About Project:</strong> ${enquiry.relatedProjectTitle}</p>` : ''}
          ${enquiry.relatedIdeaTitle ? `<p style="margin: 4px 0;"><strong>Inquired About Concept:</strong> ${enquiry.relatedIdeaTitle}</p>` : ''}
          
          <div style="background-color: #ffffff; padding: 12px; border-left: 4px solid #C59A27; margin-top: 12px; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Requirements Note:</strong></p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #1e293b; white-space: pre-wrap;">${enquiry.requirements}</p>
          </div>
        </div>
        <div style="font-size: 12px; color: #64748b; padding-top: 16px; text-align: center;">
          <p>GKA Construction ERP Notification System • <a href="https://${constants_1.GKA_COMPANY.website}" style="color: #0F1E36;">${constants_1.GKA_COMPANY.website}</a></p>
        </div>
      </div>
    `;
        // 1. Send to internal team
        await transporter.sendMail({
            from: fromAddress,
            to: toAddress,
            subject: emailSubject,
            html: emailHtml,
        });
        // 2. If customer provided email, send confirmation
        if (enquiry.email) {
            const customerSubject = `Acknowledgement of Your Enquiry #${enquiry.referenceNumber} — GKA Construction`;
            const customerHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="background-color: #0F1E36; color: #ffffff; padding: 16px; border-radius: 6px 6px 0 0;">
            <h2 style="margin: 0; color: #C59A27;">GKA Construction</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px;">Building Trust. Delivering Quality.</p>
          </div>
          <div style="padding: 16px; background-color: #f8fafc;">
            <p style="margin-top: 0;">Dear <strong>${enquiry.customerName}</strong>,</p>
            <p>Thank you for reaching out to GKA Construction. We have received your enquiry regarding <strong>${enquiry.projectLocation}</strong>.</p>
            <p>Your enquiry reference number is: <strong>${enquiry.referenceNumber}</strong>.</p>
            <p>Our site engineering team will review your requirements and connect with you via ${enquiry.preferredContactMethod} at your preferred contact time.</p>
            
            <div style="background-color: #ffffff; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; margin: 16px 0;">
              <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #0F1E36;">Need immediate assistance?</p>
              <p style="margin: 0; font-size: 13px; color: #334155;">Call us directly: <strong>+91 ${constants_1.GKA_COMPANY.phoneDisplay}</strong></p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155;">Email: <a href="mailto:${constants_1.GKA_COMPANY.email}" style="color: #0F1E36;">${constants_1.GKA_COMPANY.email}</a></p>
            </div>
            
            <p style="font-size: 12px; color: #64748b; font-style: italic;">
              Note: Every project depends on plot dimensions, soil and site conditions, material selection, and structural specifications. The concepts shown on our website are design references only.
            </p>
          </div>
          <div style="font-size: 12px; color: #64748b; padding-top: 16px; text-align: center;">
            <p>GKA Construction • Chennai & Tiruvannamalai, Tamil Nadu</p>
          </div>
        </div>
      `;
            await transporter.sendMail({
                from: fromAddress,
                to: enquiry.email,
                subject: customerSubject,
                html: customerHtml,
            });
        }
        return { sent: true };
    }
    catch (error) {
        console.error('[EmailService] Failed to send email:', error);
        return {
            sent: false,
            error: error.message || 'Unknown email transmission error',
        };
    }
};
exports.sendEnquiryNotification = sendEnquiryNotification;
