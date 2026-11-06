import nodemailer from 'nodemailer';
import dns from 'dns';
import net from 'net';
import { GKA_COMPANY, toRupees } from '../shared/constants';

// Set DNS to prioritize IPv4 and disable Node 20 Happy Eyeballs autoSelectFamily
// to eliminate IPv6 network timeout delays on Windows
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignore in older node versions
}
try {
  if ((net as any).setDefaultAutoSelectFamily) {
    (net as any).setDefaultAutoSelectFamily(false);
  }
} catch {
  // Ignore
}

export interface EmailResult {
  sent: boolean;
  messageId?: string;
  error?: string;
}

export const COMPANY_NOTIFICATION_EMAILS = [
  'gkaconstruction51@gmail.com',
  'elangovanit5012@gmail.com',
];

export const getCompanyRecipientEmails = (): string[] => {
  const envEmails = process.env.COMPANY_EMAILS || process.env.NOTIFICATION_EMAIL;
  if (envEmails) {
    const list = envEmails.split(',').map((e) => e.trim()).filter(Boolean);
    if (list.length > 0) {
      return Array.from(new Set([...list, ...COMPANY_NOTIFICATION_EMAILS]));
    }
  }
  return [...COMPANY_NOTIFICATION_EMAILS];
};

let cachedTransporter: any = null;

export const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const user = process.env.SMTP_USER || 'elangovanit5012@gmail.com';
  const pass = (process.env.SMTP_PASS || 'btjglnyfhbekvnhh').replace(/\s+/g, '');
  const secure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465;

  if (!user || !pass) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    family: 4,
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  } as any);

  return cachedTransporter;
};

export const formatTimestampIST = (date: Date = new Date()): string => {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date) + ' IST';
  } catch {
    return date.toLocaleString('en-IN') + ' IST';
  }
};

export const streamToBuffer = (stream: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (c: any) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err: any) => reject(err));
  });
};

// ==============================================================================
// 1. Client Website Submissions (Site Visit, Contact Request, Cost Estimator)
// ==============================================================================

export interface EnquiryNotificationPayload {
  referenceNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  source?: string;
  serviceType?: string;
  projectCategory?: string;
  projectLocation: string;
  city?: string;
  builtUpAreaSqFt?: number;
  estimatedBudgetRupees?: number;
  preferredSiteVisitDate?: Date | string;
  preferredContactMethod?: string;
  preferredContactTime?: string;
  requirements?: string;
  message?: string;
  relatedProjectTitle?: string;
  relatedIdeaTitle?: string;
  submittedAt?: Date | string;
}

export const sendCompanyAndClientEnquiryNotification = async (
  payload: EnquiryNotificationPayload
): Promise<EmailResult> => {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn('[EmailService] SMTP credentials not configured. Skipping email notification.');
    return {
      sent: false,
      error: 'SMTP credentials not configured in server environment.',
    };
  }

  const submittedDate = payload.submittedAt ? new Date(payload.submittedAt) : new Date();
  const timestampIST = formatTimestampIST(submittedDate);
  const fromAddress = process.env.SMTP_FROM || `"GKA Construction" <gkaconstruction51@gmail.com>`;
  const replyTo = process.env.SMTP_REPLY_TO || 'gkaconstruction51@gmail.com';
  const companyRecipients = getCompanyRecipientEmails();

  const sourceLabel =
    payload.source === 'site_visit_booking'
      ? 'Site Visit Booking'
      : payload.source === 'cost_estimator'
        ? 'Cost Estimator Inquiry'
        : payload.source === 'portfolio_inquiry'
          ? 'Portfolio Concept Inquiry'
          : 'Website Contact Request';

  const categoryLabel =
    payload.projectCategory || payload.serviceType || 'Residential Construction';

  const cleanPhone = payload.phone.replace(/\D/g, '');
  const whatsAppPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const whatsappUrl = `https://wa.me/${whatsAppPhone}?text=${encodeURIComponent(
    `Hello ${payload.customerName}, this is GKA Construction regarding your site visit request #${payload.referenceNumber} in ${payload.projectLocation}.`
  )}`;

  const notesText = payload.requirements || payload.message || 'No additional scope details provided.';

  let visitDateFormatted = 'Not specified';
  if (payload.preferredSiteVisitDate) {
    try {
      visitDateFormatted = new Date(payload.preferredSiteVisitDate).toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      visitDateFormatted = String(payload.preferredSiteVisitDate);
    }
  }

  try {
    // -------------------------------------------------------------
    // A. Company Team Alert Email (Sent to BOTH company emails)
    // -------------------------------------------------------------
    const companySubject = `[GKA Alert] New ${sourceLabel} #${payload.referenceNumber} — ${payload.customerName} (${payload.projectLocation})`;

    const companyHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f8fafc; padding: 24px 16px; color: #1e293b;">
        <!-- Header -->
        <div style="background-color: #0F1E36; border-radius: 12px 12px 0 0; padding: 24px; border-bottom: 4px solid #C59A27;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">GKA CONSTRUCTION</h1>
                <p style="margin: 4px 0 0 0; color: #C59A27; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">New Client Lead Notification</p>
              </td>
              <td align="right" valign="middle">
                <span style="display: inline-block; background-color: rgba(197, 154, 39, 0.2); border: 1px solid #C59A27; color: #ffffff; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                  ${sourceLabel}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Body Container -->
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 28px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Timestamp Alert Banner -->
          <div style="background-color: #fefce8; border-left: 4px solid #ca8a04; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #854d0e; font-weight: 600;">
              ⏰ <strong>Submission Timestamp:</strong> ${timestampIST}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #a16207;">
              Reference Number: <strong style="font-family: monospace;">${payload.referenceNumber}</strong>
            </p>
          </div>

          <!-- Customer Details Card -->
          <div style="background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0; padding: 18px 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #0F1E36; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
              👤 Client Contact Information
            </h3>
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; line-height: 1.5;">
              <tr>
                <td width="35%" style="color: #64748b; font-weight: 600;">Full Name:</td>
                <td width="65%" style="color: #0F1E36; font-weight: 700; font-size: 15px;">${payload.customerName}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-weight: 600;">Mobile Phone:</td>
                <td>
                  <a href="tel:${cleanPhone}" style="color: #0F1E36; font-weight: 700; text-decoration: none;">+91 ${payload.phone}</a>
                  &nbsp;•&nbsp;
                  <a href="${whatsappUrl}" target="_blank" style="color: #16a34a; font-weight: 700; text-decoration: none;">💬 WhatsApp Direct</a>
                </td>
              </tr>
              <tr>
                <td style="color: #64748b; font-weight: 600;">Email Address:</td>
                <td>
                  ${payload.email ? `<a href="mailto:${payload.email}" style="color: #0F1E36; font-weight: 600;">${payload.email}</a>` : '<span style="color: #94a3b8; font-style: italic;">Not provided</span>'}
                </td>
              </tr>
              <tr>
                <td style="color: #64748b; font-weight: 600;">Contact Preference:</td>
                <td style="color: #334155; text-transform: uppercase; font-weight: 600;">
                  ${payload.preferredContactMethod || 'PHONE CALL'} ${payload.preferredContactTime ? `(${payload.preferredContactTime})` : ''}
                </td>
              </tr>
            </table>
          </div>

          <!-- Project & Site Location Details -->
          <div style="background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0; padding: 18px 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #0F1E36; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
              📍 Site & Project Specifications
            </h3>
            <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px; line-height: 1.5;">
              <tr>
                <td width="35%" style="color: #64748b; font-weight: 600;">Site Location:</td>
                <td width="65%" style="color: #0F1E36; font-weight: 700;">${payload.projectLocation} ${payload.city ? `(${payload.city})` : ''}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-weight: 600;">Project Category:</td>
                <td style="color: #0F1E36; font-weight: 600; text-transform: capitalize;">${categoryLabel.replace(/_/g, ' ')}</td>
              </tr>
              <tr>
                <td style="color: #64748b; font-weight: 600;">Preferred Visit Date:</td>
                <td style="color: #ca8a04; font-weight: 700;">${visitDateFormatted}</td>
              </tr>
              ${payload.builtUpAreaSqFt ? `
              <tr>
                <td style="color: #64748b; font-weight: 600;">Approx. Built-Up Area:</td>
                <td style="color: #334155; font-weight: 700;">${payload.builtUpAreaSqFt.toLocaleString('en-IN')} sq.ft</td>
              </tr>` : ''}
              ${payload.estimatedBudgetRupees ? `
              <tr>
                <td style="color: #64748b; font-weight: 600;">Estimated Budget:</td>
                <td style="color: #16a34a; font-weight: 800; font-size: 15px;">₹ ${payload.estimatedBudgetRupees.toLocaleString('en-IN')}</td>
              </tr>` : ''}
              ${payload.relatedProjectTitle ? `
              <tr>
                <td style="color: #64748b; font-weight: 600;">Related Project:</td>
                <td style="color: #0F1E36; font-weight: 600;">${payload.relatedProjectTitle}</td>
              </tr>` : ''}
              ${payload.relatedIdeaTitle ? `
              <tr>
                <td style="color: #64748b; font-weight: 600;">Related Concept:</td>
                <td style="color: #0F1E36; font-weight: 600;">${payload.relatedIdeaTitle}</td>
              </tr>` : ''}
            </table>
          </div>

          <!-- Scope / Message Card -->
          <div style="background-color: #ffffff; border-left: 4px solid #0F1E36; border: 1px solid #e2e8f0; border-left-width: 4px; border-left-color: #0F1E36; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b;">
              Client Requirements / Message:
            </p>
            <p style="margin: 0; font-size: 13px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">
              ${notesText}
            </p>
          </div>

          <!-- CRM Action Button -->
          <div style="text-align: center; margin: 24px 0 12px 0;">
            <a href="https://www.gkaconstruction.com/admin/crm" target="_blank" style="display: inline-block; background-color: #0F1E36; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 700; border-left: 4px solid #C59A27; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              🚀 Open ERP CRM Workspace & Convert Lead
            </a>
          </div>

          <!-- Footer -->
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
          <div style="font-size: 11px; color: #64748b; text-align: center; line-height: 1.5;">
            <p style="margin: 0;">This is an automated alert delivered to GKA Management: <strong>${companyRecipients.join(', ')}</strong></p>
            <p style="margin: 4px 0 0 0;">GKA Construction ERP Notification & Alert System • <a href="https://${GKA_COMPANY.website}" style="color: #0F1E36;">${GKA_COMPANY.website}</a></p>
          </div>
        </div>
      </div>
    `;

    let companySent = false;
    try {
      await transporter.sendMail({
        from: fromAddress,
        replyTo,
        to: companyRecipients,
        subject: companySubject,
        html: companyHtml,
      });
      companySent = true;
      console.log(`[EmailService] Internal alert sent to ${companyRecipients.join(', ')} for #${payload.referenceNumber}`);
    } catch (companyErr: any) {
      console.error('[EmailService] Failed to send company alert:', companyErr);
    }

    // -------------------------------------------------------------
    // B. Immediate Client Auto-Acknowledgement Email
    // -------------------------------------------------------------
    let clientSent = false;
    if (payload.email && payload.email.includes('@')) {
      const clientSubject = `We will contact you soon — GKA Construction [Ref: #${payload.referenceNumber}]`;

      const clientHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #f8fafc; padding: 24px 16px; color: #1e293b;">
          <!-- Header -->
          <div style="background-color: #0F1E36; border-radius: 12px 12px 0 0; padding: 24px; border-bottom: 4px solid #C59A27;">
            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">GKA CONSTRUCTION</h1>
            <p style="margin: 4px 0 0 0; color: #C59A27; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Building Trust. Delivering Quality.</p>
          </div>

          <!-- Content Body -->
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 28px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <p style="margin-top: 0; font-size: 15px; line-height: 1.6;">
              Dear <strong>${payload.customerName}</strong>,
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Thank you for contacting <strong>GKA Construction</strong> regarding your construction / site visit inquiry for <strong>${payload.projectLocation}</strong>.
            </p>

            <!-- 8 Hours Guarantee Alert Box -->
            <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-left: 4px solid #16a34a; border-radius: 8px; padding: 16px 18px; margin: 20px 0;">
              <h3 style="margin: 0 0 6px 0; font-size: 15px; color: #15803d; font-weight: 800; text-transform: uppercase;">
                ⚡ We will contact you soon!
              </h3>
              <p style="margin: 0; font-size: 14px; color: #166534; line-height: 1.6;">
                We have safely received your request logged at <strong>${timestampIST}</strong>. <strong>Our site engineering & estimation team will review your requirements and reach out to you within 8 hours.</strong>
              </p>
            </div>

            <!-- Summary Table -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
                Summary of Submitted Details:
              </h4>
              <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 13px; line-height: 1.5;">
                <tr>
                  <td width="40%" style="color: #64748b; font-weight: 600;">Reference Number:</td>
                  <td width="60%" style="color: #0F1E36; font-weight: 700; font-family: monospace;">${payload.referenceNumber}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Site Location:</td>
                  <td style="color: #0F1E36; font-weight: 600;">${payload.projectLocation}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Service Category:</td>
                  <td style="color: #334155; text-transform: capitalize;">${categoryLabel.replace(/_/g, ' ')}</td>
                </tr>
                ${payload.preferredSiteVisitDate ? `
                <tr>
                  <td style="color: #64748b; font-weight: 600;">Requested Visit Date:</td>
                  <td style="color: #ca8a04; font-weight: 700;">${visitDateFormatted}</td>
                </tr>` : ''}
              </table>
            </div>

            <!-- Urgent Direct Contact Assistance -->
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px 18px; margin: 20px 0;">
              <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #0F1E36;">
                Need Immediate Site Assistance?
              </p>
              <p style="margin: 0; font-size: 13px; color: #334155;">
                Direct Engineer Helpline: <a href="tel:${GKA_COMPANY.phoneDisplay}" style="color: #0F1E36; font-weight: bold; text-decoration: none;">+91 ${GKA_COMPANY.phoneDisplay}</a>
              </p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155;">
                WhatsApp Chat: <a href="https://wa.me/918838030917" style="color: #16a34a; font-weight: bold; text-decoration: none;">+91 88380 30917</a>
              </p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155;">
                Email Support: <a href="mailto:${GKA_COMPANY.email}" style="color: #0F1E36;">${GKA_COMPANY.email}</a>
              </p>
            </div>

            <!-- Office Addresses -->
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
            <div style="font-size: 11px; color: #64748b; line-height: 1.6;">
              <p style="margin: 0;"><strong>Chennai Branch:</strong> ${GKA_COMPANY.chennaiBranch.full}</p>
              <p style="margin: 2px 0 0 0;"><strong>Registered Office:</strong> ${GKA_COMPANY.registeredOffice.full}</p>
              <p style="margin: 4px 0 0 0;">Website: <a href="https://${GKA_COMPANY.website}" style="color: #0F1E36;">${GKA_COMPANY.website}</a></p>
            </div>
          </div>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: fromAddress,
          replyTo,
          to: payload.email,
          subject: clientSubject,
          html: clientHtml,
        });
        clientSent = true;
        console.log(`[EmailService] Client auto-acknowledgement sent to ${payload.email} for #${payload.referenceNumber}`);
      } catch (clientErr: any) {
        console.error('[EmailService] Failed to send client auto-acknowledgement:', clientErr);
      }
    }

    return { sent: companySent || clientSent };
  } catch (error: any) {
    console.error('[EmailService] Failed to send enquiry notification:', error);
    return {
      sent: false,
      error: error.message || 'Unknown email transmission error',
    };
  }
};

// Backward compatibility alias
export const sendEnquiryNotification = async (enquiry: any): Promise<EmailResult> => {
  return sendCompanyAndClientEnquiryNotification({
    referenceNumber: enquiry.referenceNumber,
    customerName: enquiry.customerName,
    phone: enquiry.phone,
    email: enquiry.email,
    preferredContactMethod: enquiry.preferredContactMethod,
    serviceType: enquiry.serviceType,
    projectCategory: enquiry.projectType,
    projectLocation: enquiry.projectLocation,
    builtUpAreaSqFt: enquiry.builtUpAreaSqFt,
    requirements: enquiry.requirements,
    preferredContactTime: enquiry.preferredContactTime,
    relatedProjectTitle: enquiry.relatedProjectTitle,
    relatedIdeaTitle: enquiry.relatedIdeaTitle,
  });
};

// ==============================================================================
// 2. Official Quotation Creation & Update Alert & Document Backup Email
// ==============================================================================

export const sendQuotationAlertEmail = async (
  quotation: any,
  pdfBuffer?: Buffer,
  isUpdate: boolean = false,
  updateNote?: string
): Promise<EmailResult> => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[EmailService] SMTP credentials not configured. Skipping quotation alert.');
    return { sent: false, error: 'SMTP credentials not configured' };
  }

  const timestampDate = isUpdate && quotation.updatedAt
    ? new Date(quotation.updatedAt)
    : quotation.createdAt
      ? new Date(quotation.createdAt)
      : new Date();
  const timestampIST = formatTimestampIST(timestampDate);
  const fromAddress = process.env.SMTP_FROM || `"GKA Construction" <gkaconstruction51@gmail.com>`;
  const replyTo = process.env.SMTP_REPLY_TO || 'gkaconstruction51@gmail.com';
  const companyRecipients = getCompanyRecipientEmails();
  const totalRupees = toRupees(quotation.totalAmountPaise || 0);

  const statusLabel = (quotation.status || (isUpdate ? 'updated' : 'draft')).toUpperCase();
  const subject = isUpdate
    ? `[Backup Alert] Quotation Updated: ${quotation.quotationNumber} — ${quotation.clientName} (v${quotation.revisionNumber || 1}) [Status: ${statusLabel}] (₹${totalRupees.toLocaleString('en-IN')})`
    : `[Backup Alert] New Quotation Created: ${quotation.quotationNumber} — ${quotation.clientName} (₹${totalRupees.toLocaleString('en-IN')})`;

  const badgeTitle = isUpdate ? 'Quotation Update & Document Backup Alert' : 'Quotation Creation & Backup Alert';
  const timeLabel = isUpdate ? 'Updated Timestamp' : 'Created Timestamp';

  const itemsHtml = (quotation.items || [])
    .slice(0, 15)
    .map(
      (item: any, idx: number) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px 8px; font-size: 12px; color: #64748b;">${idx + 1}</td>
        <td style="padding: 6px 8px; font-size: 12px; color: #0F1E36; font-weight: 600;">${item.description || 'Item'}</td>
        <td style="padding: 6px 8px; font-size: 12px; color: #334155; text-align: center;">${item.quantity || 1} ${item.unit || ''}</td>
        <td style="padding: 6px 8px; font-size: 12px; color: #334155; text-align: right;">₹${(toRupees(item.unitRatePaise || 0)).toLocaleString('en-IN')}</td>
        <td style="padding: 6px 8px; font-size: 12px; color: #0F1E36; font-weight: bold; text-align: right;">₹${(toRupees(item.amountPaise || 0)).toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 680px; margin: 0 auto; background-color: #f8fafc; padding: 24px 16px; color: #1e293b;">
      <div style="background-color: #0F1E36; border-radius: 12px 12px 0 0; padding: 24px; border-bottom: 4px solid #C59A27;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800;">GKA CONSTRUCTION</h1>
        <p style="margin: 4px 0 0 0; color: #C59A27; font-size: 12px; font-weight: 600; text-transform: uppercase;">${badgeTitle}</p>
      </div>

      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 28px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #fefce8; border-left: 4px solid #ca8a04; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 13px; color: #854d0e; font-weight: 600;">
            📅 <strong>${timeLabel}:</strong> ${timestampIST}
          </p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #a16207;">
            Quotation Reference: <strong style="font-family: monospace;">${quotation.quotationNumber}</strong> • Version: <strong>v${quotation.revisionNumber || 1}</strong> • Status: <strong style="text-transform: uppercase;">${statusLabel}</strong>
          </p>
          ${updateNote ? `
          <p style="margin: 6px 0 0 0; font-size: 12px; color: #1e3a8a; background: #e0f2fe; padding: 6px 10px; border-radius: 4px;">
            📝 <strong>Update Note:</strong> ${updateNote}
          </p>` : ''}
        </div>

        <div style="background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0; padding: 18px 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; color: #0F1E36; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
            Quotation Summary
          </h3>
          <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px;">
            <tr>
              <td width="35%" style="color: #64748b; font-weight: 600;">Client Name:</td>
              <td width="65%" style="color: #0F1E36; font-weight: 700; font-size: 14px;">${quotation.clientName}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Project Scope:</td>
              <td style="color: #0F1E36; font-weight: 600;">${quotation.projectTitle || 'Construction Works'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Site Location:</td>
              <td style="color: #334155;">${quotation.siteLocation || 'Chennai / Tiruvannamalai'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Subtotal:</td>
              <td style="color: #334155;">₹ ${(toRupees(quotation.subtotalPaise || 0)).toLocaleString('en-IN')}</td>
            </tr>
            ${quotation.discountPaise ? `
            <tr>
              <td style="color: #64748b; font-weight: 600;">Discount:</td>
              <td style="color: #dc2626;">- ₹ ${(toRupees(quotation.discountPaise)).toLocaleString('en-IN')}</td>
            </tr>` : ''}
            <tr>
              <td style="color: #64748b; font-weight: 600;">GST (18%):</td>
              <td style="color: #334155;">₹ ${(toRupees((quotation.cgstPaise || 0) + (quotation.sgstPaise || 0))).toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-top: 2px solid #cbd5e1;">
              <td style="color: #0F1E36; font-weight: bold; font-size: 14px;">Total Amount:</td>
              <td style="color: #0F1E36; font-weight: 800; font-size: 16px;">₹ ${totalRupees.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <!-- Line Items Table -->
        <h4 style="margin: 18px 0 8px 0; font-size: 12px; text-transform: uppercase; color: #64748b;">BOQ Item Breakdown:</h4>
        <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; margin-bottom: 20px;">
          <thead style="background-color: #f1f5f9; font-size: 11px; text-transform: uppercase; color: #475569;">
            <tr>
              <th style="padding: 8px; text-align: left;">#</th>
              <th style="padding: 8px; text-align: left;">Description</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Unit Rate</th>
              <th style="padding: 8px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        ${pdfBuffer ? `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin: 18px 0; text-align: center;">
          <p style="margin: 0; font-size: 13px; color: #166534; font-weight: bold;">
            📎 The complete official Quotation PDF [${quotation.quotationNumber}.pdf] is attached to this backup email.
          </p>
        </div>` : ''}

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
        <div style="font-size: 11px; color: #64748b; text-align: center;">
          <p style="margin: 0;">Automated company backup sent to: <strong>${companyRecipients.join(', ')}</strong></p>
        </div>
      </div>
    </div>
  `;

  try {
    const attachments: any[] = [];
    if (pdfBuffer) {
      attachments.push({
        filename: `${quotation.quotationNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
    }

    await transporter.sendMail({
      from: fromAddress,
      replyTo,
      to: companyRecipients,
      subject,
      html: emailHtml,
      attachments,
    });

    console.log(`[EmailService] Quotation ${isUpdate ? 'update' : 'creation'} backup email dispatched for ${quotation.quotationNumber}`);
    return { sent: true };
  } catch (error: any) {
    console.error('[EmailService] Quotation backup email error:', error);
    return { sent: false, error: error.message };
  }
};

// ==============================================================================
// 3. Official Bill / Tax Invoice Creation & Update Alert & Backup Email
// ==============================================================================

export const sendInvoiceAlertEmail = async (
  invoice: any,
  pdfBuffer?: Buffer,
  isUpdate: boolean = false,
  updateNote?: string
): Promise<EmailResult> => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[EmailService] SMTP credentials not configured. Skipping invoice alert.');
    return { sent: false, error: 'SMTP credentials not configured' };
  }

  const timestampDate = isUpdate && invoice.updatedAt
    ? new Date(invoice.updatedAt)
    : invoice.createdAt
      ? new Date(invoice.createdAt)
      : new Date();
  const timestampIST = formatTimestampIST(timestampDate);
  const fromAddress = process.env.SMTP_FROM || `"GKA Construction" <gkaconstruction51@gmail.com>`;
  const replyTo = process.env.SMTP_REPLY_TO || 'gkaconstruction51@gmail.com';
  const companyRecipients = getCompanyRecipientEmails();
  const totalRupees = toRupees(invoice.totalAmountPaise || 0);
  const paidRupees = toRupees(invoice.paidAmountPaise || 0);
  const dueRupees = toRupees(invoice.dueAmountPaise !== undefined ? invoice.dueAmountPaise : Math.max(0, (invoice.totalAmountPaise || 0) - (invoice.paidAmountPaise || 0)));

  const statusLabel = (invoice.status || (isUpdate ? 'updated' : 'issued')).toUpperCase();
  const subject = isUpdate
    ? `[Backup Alert] Bill/Invoice Updated: ${invoice.invoiceNumber} — ${invoice.clientName} [Status: ${statusLabel}] (₹${totalRupees.toLocaleString('en-IN')})`
    : `[Backup Alert] New Bill/Invoice Issued: ${invoice.invoiceNumber} — ${invoice.clientName} (₹${totalRupees.toLocaleString('en-IN')})`;

  const badgeTitle = isUpdate ? 'Tax Invoice / Bill Update Alert' : 'Tax Invoice / Bill Issuance Alert';
  const timeLabel = isUpdate ? 'Updated Timestamp' : 'Issued Timestamp';

  let dueDateFormatted = '14 calendar days';
  if (invoice.dueDate) {
    try {
      dueDateFormatted = new Date(invoice.dueDate).toLocaleDateString('en-IN');
    } catch {
      dueDateFormatted = String(invoice.dueDate);
    }
  }

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 680px; margin: 0 auto; background-color: #f8fafc; padding: 24px 16px; color: #1e293b;">
      <div style="background-color: #0F1E36; border-radius: 12px 12px 0 0; padding: 24px; border-bottom: 4px solid #C59A27;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800;">GKA CONSTRUCTION</h1>
        <p style="margin: 4px 0 0 0; color: #C59A27; font-size: 12px; font-weight: 600; text-transform: uppercase;">${badgeTitle}</p>
      </div>

      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 28px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #fefce8; border-left: 4px solid #ca8a04; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 13px; color: #854d0e; font-weight: 600;">
            📅 <strong>${timeLabel}:</strong> ${timestampIST}
          </p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #a16207;">
            Invoice Number: <strong style="font-family: monospace;">${invoice.invoiceNumber}</strong> • Status: <strong style="text-transform: uppercase;">${statusLabel}</strong>
          </p>
          ${updateNote ? `
          <p style="margin: 6px 0 0 0; font-size: 12px; color: #1e3a8a; background: #e0f2fe; padding: 6px 10px; border-radius: 4px;">
            📝 <strong>Update Note:</strong> ${updateNote}
          </p>` : ''}
        </div>

        <div style="background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0; padding: 18px 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; color: #0F1E36; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
            Bill & Financial Summary
          </h3>
          <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px;">
            <tr>
              <td width="35%" style="color: #64748b; font-weight: 600;">Client Name:</td>
              <td width="65%" style="color: #0F1E36; font-weight: 700; font-size: 14px;">${invoice.clientName} ${invoice.clientCompany ? `(${invoice.clientCompany})` : ''}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Project Scope:</td>
              <td style="color: #0F1E36; font-weight: 600;">${invoice.projectTitle || 'Construction Works'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Billing Address:</td>
              <td style="color: #334155;">${invoice.billingAddress || 'Tamil Nadu'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Subtotal (Taxable):</td>
              <td style="color: #334155;">₹ ${(toRupees(invoice.subtotalPaise || 0)).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">GST (18%):</td>
              <td style="color: #334155;">₹ ${(toRupees((invoice.cgstPaise || 0) + (invoice.sgstPaise || 0))).toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-top: 2px solid #cbd5e1;">
              <td style="color: #0F1E36; font-weight: bold; font-size: 14px;">Total Invoiced:</td>
              <td style="color: #0F1E36; font-weight: 800; font-size: 16px;">₹ ${totalRupees.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="color: #16a34a; font-weight: 600;">Total Paid:</td>
              <td style="color: #16a34a; font-weight: 700;">₹ ${paidRupees.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="color: #dc2626; font-weight: 600;">Outstanding Due:</td>
              <td style="color: #dc2626; font-weight: 800;">₹ ${dueRupees.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Payment Due Date:</td>
              <td style="color: #334155; font-weight: 600;">${dueDateFormatted}</td>
            </tr>
          </table>
        </div>

        ${pdfBuffer ? `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin: 18px 0; text-align: center;">
          <p style="margin: 0; font-size: 13px; color: #166534; font-weight: bold;">
            📎 The complete official Tax Invoice PDF [${invoice.invoiceNumber}.pdf] is attached to this backup email.
          </p>
        </div>` : ''}

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
        <div style="font-size: 11px; color: #64748b; text-align: center;">
          <p style="margin: 0;">Automated company bill backup sent to: <strong>${companyRecipients.join(', ')}</strong></p>
        </div>
      </div>
    </div>
  `;

  try {
    const attachments: any[] = [];
    if (pdfBuffer) {
      attachments.push({
        filename: `${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
    }

    await transporter.sendMail({
      from: fromAddress,
      replyTo,
      to: companyRecipients,
      subject,
      html: emailHtml,
      attachments,
    });

    console.log(`[EmailService] Invoice ${isUpdate ? 'update' : 'creation'} backup email dispatched for ${invoice.invoiceNumber}`);
    return { sent: true };
  } catch (error: any) {
    console.error('[EmailService] Invoice backup email error:', error);
    return { sent: false, error: error.message };
  }
};

// ==============================================================================
// 4. Project Initialization & Update Alert Email
// ==============================================================================

export const sendProjectAlertEmail = async (
  project: any,
  clientDoc?: any,
  isUpdate: boolean = false,
  updateNote?: string
): Promise<EmailResult> => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[EmailService] SMTP credentials not configured. Skipping project alert.');
    return { sent: false, error: 'SMTP credentials not configured' };
  }

  const timestampDate = isUpdate && project.updatedAt
    ? new Date(project.updatedAt)
    : project.createdAt
      ? new Date(project.createdAt)
      : new Date();
  const timestampIST = formatTimestampIST(timestampDate);
  const fromAddress = process.env.SMTP_FROM || `"GKA Construction" <gkaconstruction51@gmail.com>`;
  const replyTo = process.env.SMTP_REPLY_TO || 'gkaconstruction51@gmail.com';
  const companyRecipients = getCompanyRecipientEmails();
  const contractRupees = toRupees(project.contractValuePaise || 0);
  const invoicedRupees = toRupees(project.invoicedAmountPaise || 0);
  const collectedRupees = toRupees(project.collectedAmountPaise || 0);

  const statusLabel = (project.status || (isUpdate ? 'updated' : 'planning')).toUpperCase();
  const subject = isUpdate
    ? `[Project Alert] Project Updated: ${project.projectId} — ${project.title} [Progress: ${project.progressPercent || 0}%, Status: ${statusLabel}]`
    : `[Project Alert] New Project Workspace Initialized: ${project.projectId} — ${project.title}`;

  const badgeTitle = isUpdate ? 'Project Progress & Information Update Alert' : 'New Project Initialization Alert';
  const timeLabel = isUpdate ? 'Updated Timestamp' : 'Initialized Timestamp';

  let startDateFormatted = 'Immediate';
  let targetEndDateFormatted = '6 Months';
  try {
    if (project.startDate) startDateFormatted = new Date(project.startDate).toLocaleDateString('en-IN');
    if (project.targetEndDate) targetEndDateFormatted = new Date(project.targetEndDate).toLocaleDateString('en-IN');
  } catch {
    // Keep defaults
  }

  const clientName = clientDoc?.name || (project.clientId?.name) || 'Valued Client';
  const clientPhone = clientDoc?.phone || (project.clientId?.phone) || 'Not provided';
  const clientEmail = clientDoc?.email || (project.clientId?.email) || '';

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f8fafc; padding: 24px 16px; color: #1e293b;">
      <div style="background-color: #0F1E36; border-radius: 12px 12px 0 0; padding: 24px; border-bottom: 4px solid #C59A27;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800;">GKA CONSTRUCTION</h1>
        <p style="margin: 4px 0 0 0; color: #C59A27; font-size: 12px; font-weight: 600; text-transform: uppercase;">${badgeTitle}</p>
      </div>

      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 28px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #fefce8; border-left: 4px solid #ca8a04; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 13px; color: #854d0e; font-weight: 600;">
            📅 <strong>${timeLabel}:</strong> ${timestampIST}
          </p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #a16207;">
            Project Identifier: <strong style="font-family: monospace;">${project.projectId}</strong> • Status: <strong style="text-transform: uppercase;">${statusLabel}</strong> • Overall Progress: <strong>${project.progressPercent || 0}%</strong>
          </p>
          ${updateNote ? `
          <p style="margin: 6px 0 0 0; font-size: 12px; color: #1e3a8a; background: #e0f2fe; padding: 6px 10px; border-radius: 4px;">
            📝 <strong>Update Note:</strong> ${updateNote}
          </p>` : ''}
        </div>

        <div style="background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0; padding: 18px 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; color: #0F1E36; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
            Project Parameters & Progress
          </h3>
          <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px;">
            <tr>
              <td width="35%" style="color: #64748b; font-weight: 600;">Project Title:</td>
              <td width="65%" style="color: #0F1E36; font-weight: 700; font-size: 15px;">${project.title}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Category:</td>
              <td style="color: #334155; text-transform: capitalize; font-weight: 600;">${project.category || 'Residential'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Current Progress:</td>
              <td style="color: #0F1E36; font-weight: 700;">
                <span style="display: inline-block; background-color: #0F1E36; color: #C59A27; padding: 3px 10px; border-radius: 12px; font-size: 12px;">
                  ${project.progressPercent || 0}% Completed
                </span>
              </td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Client:</td>
              <td style="color: #0F1E36; font-weight: 600;">${clientName} (${clientPhone})</td>
            </tr>
            ${clientEmail ? `
            <tr>
              <td style="color: #64748b; font-weight: 600;">Client Portal ID:</td>
              <td style="color: #334155; font-family: monospace;">${clientEmail}</td>
            </tr>` : ''}
            <tr>
              <td style="color: #64748b; font-weight: 600;">Site Location:</td>
              <td style="color: #334155;">${project.siteAddress?.street || 'Site Address'}, ${project.siteAddress?.city || 'Chennai'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Contract Value:</td>
              <td style="color: #0F1E36; font-weight: 800; font-size: 15px;">₹ ${contractRupees.toLocaleString('en-IN')}</td>
            </tr>
            ${isUpdate ? `
            <tr>
              <td style="color: #64748b; font-weight: 600;">Invoiced to Date:</td>
              <td style="color: #334155; font-weight: 700;">₹ ${invoicedRupees.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Collected to Date:</td>
              <td style="color: #16a34a; font-weight: 700;">₹ ${collectedRupees.toLocaleString('en-IN')}</td>
            </tr>` : ''}
            <tr>
              <td style="color: #64748b; font-weight: 600;">Execution Window:</td>
              <td style="color: #334155;">${startDateFormatted} to ${targetEndDateFormatted}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 24px 0 12px 0;">
          <a href="https://www.gkaconstruction.com/admin/projects" target="_blank" style="display: inline-block; background-color: #0F1E36; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 700; border-left: 4px solid #C59A27;">
            🏗️ Open Project Workspace
          </a>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
        <div style="font-size: 11px; color: #64748b; text-align: center;">
          <p style="margin: 0;">Automated company alert delivered to: <strong>${companyRecipients.join(', ')}</strong></p>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: fromAddress,
      replyTo,
      to: companyRecipients,
      subject,
      html: emailHtml,
    });

    console.log(`[EmailService] Project ${isUpdate ? 'update' : 'creation'} alert dispatched for ${project.projectId}`);
    return { sent: true };
  } catch (error: any) {
    console.error('[EmailService] Project alert email error:', error);
    return { sent: false, error: error.message };
  }
};

// ==============================================================================
// 5. Official Document Upload & Update Alert Email
// ==============================================================================

export const sendDocumentUploadAlertEmail = async (
  document: any,
  fileAttachment?: { filename: string; content?: Buffer; path?: string },
  isUpdate: boolean = false,
  updateNote?: string
): Promise<EmailResult> => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[EmailService] SMTP credentials not configured. Skipping document alert.');
    return { sent: false, error: 'SMTP credentials not configured' };
  }

  const timestampDate = isUpdate && document.updatedAt
    ? new Date(document.updatedAt)
    : document.createdAt
      ? new Date(document.createdAt)
      : new Date();
  const timestampIST = formatTimestampIST(timestampDate);
  const fromAddress = process.env.SMTP_FROM || `"GKA Construction" <gkaconstruction51@gmail.com>`;
  const replyTo = process.env.SMTP_REPLY_TO || 'gkaconstruction51@gmail.com';
  const companyRecipients = getCompanyRecipientEmails();

  const subject = isUpdate
    ? `[Backup Alert] Official Document Updated: ${document.title} (v${document.version || 1}.0)`
    : `[Backup Alert] Official Document Uploaded: ${document.title} (${document.category || 'Project Document'})`;

  const badgeTitle = isUpdate ? 'Official Document Repository Update Backup' : 'Official Document Repository Backup';
  const timeLabel = isUpdate ? 'Updated Timestamp' : 'Uploaded Timestamp';

  const emailHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f8fafc; padding: 24px 16px; color: #1e293b;">
      <div style="background-color: #0F1E36; border-radius: 12px 12px 0 0; padding: 24px; border-bottom: 4px solid #C59A27;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800;">GKA CONSTRUCTION</h1>
        <p style="margin: 4px 0 0 0; color: #C59A27; font-size: 12px; font-weight: 600; text-transform: uppercase;">${badgeTitle}</p>
      </div>

      <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 28px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #fefce8; border-left: 4px solid #ca8a04; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 13px; color: #854d0e; font-weight: 600;">
            📅 <strong>${timeLabel}:</strong> ${timestampIST}
          </p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #a16207;">
            Category: <strong style="text-transform: uppercase;">${document.category || 'General'}</strong> • Version: <strong>v${document.version || 1}.0</strong>
          </p>
          ${updateNote ? `
          <p style="margin: 6px 0 0 0; font-size: 12px; color: #1e3a8a; background: #e0f2fe; padding: 6px 10px; border-radius: 4px;">
            📝 <strong>Update Note:</strong> ${updateNote}
          </p>` : ''}
        </div>

        <div style="background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0; padding: 18px 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; color: #0F1E36; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
            Document Details
          </h3>
          <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px;">
            <tr>
              <td width="35%" style="color: #64748b; font-weight: 600;">Document Title:</td>
              <td width="65%" style="color: #0F1E36; font-weight: 700; font-size: 14px;">${document.title}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">File Name:</td>
              <td style="color: #334155; font-family: monospace;">${document.fileName || 'document.pdf'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: 600;">Client Visibility:</td>
              <td style="color: ${document.visibleToClient ? '#16a34a' : '#64748b'}; font-weight: bold;">
                ${document.visibleToClient ? 'Visible in Client Portal' : 'Internal Staff Only'}
              </td>
            </tr>
            ${document.fileUrl ? `
            <tr>
              <td style="color: #64748b; font-weight: 600;">Access Link:</td>
              <td><a href="https://www.gkaconstruction.com${document.fileUrl}" style="color: #0F1E36; font-weight: 600;">View Document Online</a></td>
            </tr>` : ''}
          </table>
        </div>

        ${fileAttachment ? `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 16px; margin: 18px 0; text-align: center;">
          <p style="margin: 0; font-size: 13px; color: #166534; font-weight: bold;">
            📎 File [${fileAttachment.filename}] is attached to this email backup.
          </p>
        </div>` : ''}

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
        <div style="font-size: 11px; color: #64748b; text-align: center;">
          <p style="margin: 0;">Automated company document backup delivered to: <strong>${companyRecipients.join(', ')}</strong></p>
        </div>
      </div>
    </div>
  `;

  try {
    const attachments: any[] = [];
    if (fileAttachment) {
      attachments.push(fileAttachment);
    }

    await transporter.sendMail({
      from: fromAddress,
      replyTo,
      to: companyRecipients,
      subject,
      html: emailHtml,
      attachments,
    });

    console.log(`[EmailService] Document ${isUpdate ? 'update' : 'upload'} backup email dispatched for ${document.title}`);
    return { sent: true };
  } catch (error: any) {
    console.error('[EmailService] Document backup email error:', error);
    return { sent: false, error: error.message };
  }
};

// ==============================================================================
// 6. Direct Client Document Share (Preserved for Frontend Share Modal)
// ==============================================================================

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
  fileAttachment?: {
    filename: string;
    content?: Buffer;
    path?: string;
    contentType?: string;
  };
}

const escapeHtmlText = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const sendDocumentNotificationEmail = async (
  payload: DocumentEmailPayload
): Promise<EmailResult> => {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn('[EmailService] SMTP credentials not configured. Skipping document email dispatch.');
    return {
      sent: false,
      error: 'SMTP credentials not configured in server environment.',
    };
  }

  try {
    const fromAddress = process.env.SMTP_FROM || `"GKA Construction" <gkaconstruction51@gmail.com>`;
    const replyTo = process.env.SMTP_REPLY_TO || 'gkaconstruction51@gmail.com';
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

    const attachmentFilename =
      payload.fileAttachment?.filename ||
      (payload.documentType === 'welcome'
        ? `GKA_Project_Welcome_${payload.documentNumber}.pdf`
        : `${payload.documentNumber}.pdf`);

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f8fafc; padding: 24px 16px; color: #1e293b;">
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

        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 28px 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <p style="margin-top: 0; font-size: 15px; line-height: 1.6;">
            Dear <strong>${clientName}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Greetings from GKA Construction. Please find the verified details of your <strong>${docTypeLabel}</strong> below. The official document file has been attached directly to this message.
          </p>

          ${
            payload.customMessage
              ? `
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #C59A27; border-radius: 8px; padding: 16px 18px; margin: 18px 0; font-family: 'Consolas', 'Courier New', monospace; font-size: 12px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; word-break: break-word;">${escapeHtmlText(
                  payload.customMessage
                )}</div>
          `
              : ''
          }

          <!-- Official Document File Attachment Callout -->
          <div style="background-color: #f0fdf4; border: 1.5px solid #86efac; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="36" valign="top" style="font-size: 24px; line-height: 1;">📎</td>
                <td valign="top" style="padding-left: 10px;">
                  <div style="font-size: 14px; font-weight: 700; color: #166534;">Official Document File Attached Directly</div>
                  <div style="font-size: 12px; color: #15803d; margin-top: 4px; line-height: 1.5;">
                    The certified PDF file <strong>${attachmentFilename}</strong> is attached directly to this email. You can open, download, or print it right from your inbox.
                  </div>
                  ${
                    payload.pdfUrl
                      ? `
                  <div style="margin-top: 10px;">
                    <a href="${payload.pdfUrl}" target="_blank" style="display: inline-block; background-color: #0F1E36; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 700;">
                      📥 View / Archive Copy Online
                    </a>
                  </div>
                  `
                      : ''
                  }
                </td>
              </tr>
            </table>
          </div>

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
                <td style="font-weight: 600;">Branch:</td>
                <td>${GKA_COMPANY.bankDetails.branch}</td>
              </tr>
            </table>
          </div>` : ''}

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
          <div style="font-size: 12px; color: #64748b; line-height: 1.6;">
            <p style="margin: 0;"><strong>Need Assistance?</strong></p>
            <p style="margin: 4px 0 0 0;">
              Helpline: <strong>+91 ${GKA_COMPANY.phoneDisplay}</strong> • Email: <a href="mailto:${GKA_COMPANY.email}" style="color: #0F1E36;">${GKA_COMPANY.email}</a>
            </p>
            <p style="margin: 4px 0 0 0;">
              Address: Rajan Nagar, Kelambakkam – Vandalur Junction, Chennai & Tiruvannamalai, Tamil Nadu
            </p>
          </div>
        </div>
      </div>
    `;

    const attachments: any[] = [];
    if (payload.fileAttachment) {
      if (payload.fileAttachment.content) {
        attachments.push({
          filename: payload.fileAttachment.filename,
          content: payload.fileAttachment.content,
          contentType: payload.fileAttachment.contentType || 'application/pdf',
        });
      } else if (payload.fileAttachment.path) {
        attachments.push({
          filename: payload.fileAttachment.filename,
          path: payload.fileAttachment.path,
          contentType: payload.fileAttachment.contentType || 'application/pdf',
        });
      }
    }

    const companyRecipients = getCompanyRecipientEmails().filter(
      (email) => email.toLowerCase() !== payload.recipientEmail.toLowerCase()
    );

    await transporter.sendMail({
      from: fromAddress,
      replyTo,
      to: payload.recipientEmail,
      cc: companyRecipients.length > 0 ? companyRecipients : undefined,
      subject,
      html: emailHtml,
      text: payload.customMessage || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    console.log(
      `[EmailService] Document share email dispatched to ${payload.recipientEmail} with ${attachments.length} attachment(s) (cc: ${companyRecipients.join(', ')})`
    );
    return { sent: true };
  } catch (error: any) {
    console.error('[EmailService] Failed to send document email:', error);
    return {
      sent: false,
      error: error.message || 'Unknown email dispatch error',
    };
  }
};
