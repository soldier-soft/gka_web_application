import nodemailer from 'nodemailer';
import { GKA_COMPANY } from '../shared/constants';

interface EmailResult {
  sent: boolean;
  error?: string;
}

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

export const sendEnquiryNotification = async (enquiry: {
  referenceNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  preferredContactMethod: string;
  serviceType: string;
  projectLocation: string;
  builtUpAreaSqFt?: number;
  projectType: string;
  requirements: string;
  preferredContactTime?: string;
  relatedProjectTitle?: string;
  relatedIdeaTitle?: string;
}): Promise<EmailResult> => {
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
    const toAddress = process.env.NOTIFICATION_EMAIL || GKA_COMPANY.email;

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
          <p>GKA Construction ERP Notification System • <a href="https://${GKA_COMPANY.website}" style="color: #0F1E36;">${GKA_COMPANY.website}</a></p>
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
              <p style="margin: 0; font-size: 13px; color: #334155;">Call us directly: <strong>+91 ${GKA_COMPANY.phoneDisplay}</strong></p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155;">Email: <a href="mailto:${GKA_COMPANY.email}" style="color: #0F1E36;">${GKA_COMPANY.email}</a></p>
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
  } catch (error: any) {
    console.error('[EmailService] Failed to send email:', error);
    return {
      sent: false,
      error: error.message || 'Unknown email transmission error',
    };
  }
};

export interface DocumentEmailPayload {
  recipientEmail: string;
  recipientName?: string;
  documentType: 'welcome' | 'quotation' | 'invoice';
  documentNumber: string;
  projectTitle: string;
  siteLocation?: string;
  amount?: number;
  dueDate?: string;
  pdfUrl: string;
  portalUsername?: string;
  portalPassword?: string;
  customSubject?: string;
  customMessage?: string;
}

export const sendDocumentNotificationEmail = async (
  payload: DocumentEmailPayload
): Promise<EmailResult> => {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn('[EmailService] SMTP credentials not configured. Skipping document email dispatch.');
    return {
      sent: false,
      error: 'SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not configured in server environment.',
    };
  }

  try {
    const fromAddress = process.env.SMTP_FROM || `"GKA Construction Dispatch" <${process.env.SMTP_USER}>`;
    const clientName = payload.recipientName || 'Valued Client';
    const formattedAmount = (payload.amount || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
    const portalUrl = 'https://www.gkaconstruction.com/login';

    let subject = payload.customSubject;
    let badgeTitle = 'Official Document Dispatch';
    let docTypeLabel = 'Project Document';

    if (payload.documentType === 'quotation') {
      badgeTitle = 'Commercial Quotation & Itemized BOQ';
      docTypeLabel = 'Quotation';
      if (!subject) {
        subject = `GKA Construction — Official Commercial Quotation [${payload.documentNumber}] for ${payload.projectTitle}`;
      }
    } else if (payload.documentType === 'invoice') {
      badgeTitle = 'Tax Invoice & Progressive RA Bill';
      docTypeLabel = 'Tax Invoice';
      if (!subject) {
        subject = `GKA Construction — Tax Invoice [${payload.documentNumber}] for ${payload.projectTitle}`;
      }
    } else {
      badgeTitle = 'Project Workspace Onboarding & Portal Access';
      docTypeLabel = 'Onboarding Packet';
      if (!subject) {
        subject = `GKA Construction — Project Workspace Onboarding for ${payload.projectTitle}`;
      }
    }

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f8fafc; padding: 24px 16px; color: #1e293b;">
        <!-- Header -->
        <div style="background-color: #0F1E36; border-radius: 12px 12px 0 0; padding: 28px 24px; text-align: left; border-bottom: 3px solid #C59A27;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">GKA CONSTRUCTION</h1>
                <p style="margin: 4px 0 0 0; color: #C59A27; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Building Trust. Delivering Quality.</p>
              </td>
              <td align="right" valign="middle">
                <span style="display: inline-block; background-color: rgba(197, 154, 39, 0.2); border: 1px solid #C59A27; color: #ffffff; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                  ${badgeTitle}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Body Container -->
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 28px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <p style="margin-top: 0; font-size: 15px; line-height: 1.6;">
            Dear <strong>${clientName}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Greetings from GKA Construction. Please find the verified details of your <strong>${docTypeLabel}</strong> below.
          </p>

          <!-- Structured Summary Card -->
          <div style="background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0; padding: 18px 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #0F1E36; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
              Document Summary
            </h3>
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; line-height: 1.5;">
              <tr>
                <td width="35%" style="color: #64748b; font-weight: 600;">Reference Number:</td>
                <td width="65%" style="color: #0F1E36; font-weight: 700; font-family: monospace;">${payload.documentNumber}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-weight: 600;">Project Scope:</td>
                <td style="color: #0F1E36; font-weight: 600;">${payload.projectTitle}</td>
              </tr>
              ${payload.siteLocation ? `
              <tr>
                <td style="color: #64748b; font-weight: 600;">Site Location:</td>
                <td style="color: #334155;">${payload.siteLocation}</td>
              </tr>` : ''}
              ${payload.amount ? `
              <tr>
                <td style="color: #64748b; font-weight: 600;">Total Amount:</td>
                <td style="color: #0F1E36; font-weight: 800; font-size: 15px;">Rs. ${formattedAmount}</td>
              </tr>` : ''}
              ${payload.dueDate ? `
              <tr>
                <td style="color: #64748b; font-weight: 600;">Payment Due Date:</td>
                <td style="color: #dc2626; font-weight: 600;">${payload.dueDate}</td>
              </tr>` : ''}
            </table>
          </div>

          <!-- Direct PDF Download Section (Only PDF Link) -->
          <div style="text-align: center; margin: 28px 0; padding: 20px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px;">
            <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: #475569;">
              Access your official digitally signed document in PDF format:
            </p>
            <a href="${payload.pdfUrl}" target="_blank" style="display: inline-block; background-color: #0F1E36; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 700; border-left: 4px solid #C59A27; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              📥 View / Download Official PDF
            </a>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #94a3b8;">
              Direct Link: <a href="${payload.pdfUrl}" style="color: #0F1E36; word-break: break-all;">${payload.pdfUrl}</a>
            </p>
          </div>

          <!-- Client Portal Credentials Section -->
          ${payload.portalUsername ? `
          <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
            <h4 style="margin: 0 0 8px 0; color: #854d0e; font-size: 13px; text-transform: uppercase;">
              🔐 24/7 Digital Tracking Portal Access
            </h4>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #713f12;">
              Log in to track live milestone progress, daily site photographs, and project accounts:
            </p>
            <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 12px; color: #1e293b;">
              <tr>
                <td width="30%" style="font-weight: 600;">Portal Link:</td>
                <td><a href="${portalUrl}" style="color: #0F1E36; font-weight: bold;">${portalUrl}</a></td>
              </tr>
              <tr>
                <td style="font-weight: 600;">Username / Email:</td>
                <td style="font-family: monospace; font-weight: bold;">${payload.portalUsername}</td>
              </tr>
              ${payload.portalPassword ? `
              <tr>
                <td style="font-weight: 600;">Access Password:</td>
                <td style="font-family: monospace; font-weight: bold;">${payload.portalPassword}</td>
              </tr>` : ''}
            </table>
          </div>` : ''}

          <!-- Bank Details for Invoices -->
          ${payload.documentType === 'invoice' ? `
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
            <h4 style="margin: 0 0 8px 0; color: #166534; font-size: 13px; text-transform: uppercase;">
              🏦 Official Bank Transfer Details
            </h4>
            <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 12px; color: #1e293b;">
              <tr>
                <td width="35%" style="font-weight: 600;">Beneficiary Name:</td>
                <td style="font-weight: 700;">${GKA_COMPANY.bankDetails.beneficiary}</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">Account Number:</td>
                <td style="font-family: monospace; font-weight: 700;">${GKA_COMPANY.bankDetails.accountNumber}</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">Bank Name:</td>
                <td>${GKA_COMPANY.bankDetails.bankName.toUpperCase()}</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">IFSC Code:</td>
                <td style="font-family: monospace; font-weight: 700;">${GKA_COMPANY.bankDetails.ifscCode}</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">Mobile Number:</td>
                <td>${GKA_COMPANY.bankDetails.contactMobile}</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">Alternate Number:</td>
                <td>${GKA_COMPANY.bankDetails.alternateMobile || '8940455917'}</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">MICR Code:</td>
                <td style="font-family: monospace;">${GKA_COMPANY.bankDetails.micr}</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">Mail ID:</td>
                <td>${(GKA_COMPANY.bankDetails.email || GKA_COMPANY.email).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="font-weight: 600;">Website:</td>
                <td>${(GKA_COMPANY.bankDetails.website || GKA_COMPANY.website).toUpperCase()}</td>
              </tr>
            </table>
          </div>` : ''}

          <!-- Contact & Support Footer -->
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
          <div style="font-size: 12px; color: #64748b; line-height: 1.6;">
            <p style="margin: 0;"><strong>Need Assistance?</strong></p>
            <p style="margin: 4px 0 0 0;">
              Helpline: <strong>+91 ${GKA_COMPANY.phoneDisplay}</strong> • Email: <a href="mailto:${GKA_COMPANY.email}" style="color: #0F1E36;">${GKA_COMPANY.email}</a>
            </p>
            <p style="margin: 4px 0 0 0;">
              Address: Rajan Nagar, Kelambakkam – Vandalur Junction, Chennai & Tiruvannamalai, Tamil Nadu
            </p>
            <p style="margin: 4px 0 0 0;">
              Website: <a href="https://${GKA_COMPANY.website}" style="color: #0F1E36;">${GKA_COMPANY.website}</a>
            </p>
          </div>
        </div>

        <div style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
          <p style="margin: 0;">GKA Construction ERP Notification & Document Dispatch System</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: fromAddress,
      to: payload.recipientEmail,
      subject,
      html: emailHtml,
    });

    return { sent: true };
  } catch (error: any) {
    console.error('[EmailService] Failed to send document email:', error);
    return {
      sent: false,
      error: error.message || 'Unknown email dispatch error',
    };
  }
};
