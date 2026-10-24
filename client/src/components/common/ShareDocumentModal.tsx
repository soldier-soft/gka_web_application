import React, { useState } from 'react';
import {
  X,
  Share2,
  Mail,
  MessageCircle,
  Copy,
  Check,
  FileDown,
  ExternalLink,
  ShieldCheck,
  Phone,
  Send,
} from 'lucide-react';
import { GKA_COMPANY } from '@shared/constants';

export interface ShareDocumentData {
  documentType: 'welcome' | 'quotation' | 'invoice';
  title?: string;
  number?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientContactPerson?: string;
  projectTitle?: string;
  siteLocation?: string;
  amount?: number;
  dueDate?: string;
  pdfUrl?: string;
  docxUrl?: string;
  username?: string;
  password?: string;
}

interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareDocumentData | null;
}

export const ShareDocumentModal: React.FC<ShareDocumentModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!isOpen || !data) return null;

  const docType = data.documentType;
  const username = data.username || data.clientEmail || 'client@gingerhotel.com';
  const password = data.password || 'GKAclient2026!';
  const portalUrl = 'https://www.gkaconstruction.com/login';
  const docNumber = data.number || 'DOC-001';
  const clientName = data.clientContactPerson || data.clientName || 'Valued Client';
  const projectTitle = data.projectTitle || 'Construction & Allied Works';
  const siteLocation = data.siteLocation || 'Chennai, Tamil Nadu';
  const formattedAmount = (data.amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });

  const origin = window.location.origin;
  const fullPdfUrl = data.pdfUrl?.startsWith('http') ? data.pdfUrl : `${origin}${data.pdfUrl || ''}`;
  const fullDocxUrl = data.docxUrl?.startsWith('http') ? data.docxUrl : `${origin}${data.docxUrl || ''}`;

  // Default Subject & Body Templates
  let defaultSubject = '';
  let defaultBody = '';

  if (docType === 'welcome') {
    defaultSubject = `GKA Construction — Project Workspace Onboarding & Portal Access for ${projectTitle}`;
    defaultBody = `*FROM: GKA CONSTRUCTION*
*PROJECT WORKSPACE ONBOARDING & CLIENT CREDENTIAL PACKET*

Dear ${clientName},

Welcome to GKA Construction! Your dedicated project workspace and digital tracking portal have been successfully provisioned.

Project ID: ${docNumber}
Project: ${projectTitle}
Site Location: ${siteLocation}

🔗 *Client Portal Link:* ${portalUrl}
👤 *Your Portal Username / Email:* ${username}
🔑 *Your Portal Password:* ${password}

Through your 24/7 digital portal, you can:
• Track live milestone progress and completion certificates
• View daily verified geotagged site photographs & supervisor logs
• Access formal BOQ quotations and project scope
• View progressive tax invoices, receipts, and payment records

📎 *Attachment:* GKA_Project_Welcome_${docNumber}.pdf
Direct Download: ${fullPdfUrl}

For assistance or technical inquiries, contact our project desk:
📞 Helpline: +91 ${GKA_COMPANY.phoneDisplay}
✉️ Email: ${GKA_COMPANY.email}
🌐 Website: ${GKA_COMPANY.website}

GKA Construction — Building Trust. Delivering Quality.`;
  } else if (docType === 'quotation') {
    defaultSubject = `GKA Construction — Commercial Quotation & Itemized BOQ [${docNumber}] for ${projectTitle}`;
    defaultBody = `*FROM: GKA CONSTRUCTION*
*COMMERCIAL QUOTATION & ITEMIZED ESTIMATION*

Dear ${clientName},

Greetings from GKA Construction. We are pleased to share our official detailed quotation and line-item BOQ for your construction works:

📄 *Quotation No:* ${docNumber}
🏗️ *Project Scope:* ${projectTitle}
📍 *Site Location:* ${siteLocation}
💰 *Total Amount:* Rs. ${formattedAmount} (Incl. Taxes)

🔗 *Client Portal Link:* ${portalUrl}
👤 *Your Portal Username / Email:* ${username}
🔑 *Your Portal Password:* ${password}

You can log in to your portal to review milestone specifications, approve stages, and track execution schedules.

📎 *Attached Files:*
• Formal PDF Quotation: ${fullPdfUrl}
• Editable DOCX Document: ${fullDocxUrl}

Office Address: Rajan Nagar, Kelambakkam – Vandalur Junction, Chennai & Tiruvannamalai
📞 Helpline: +91 ${GKA_COMPANY.phoneDisplay}
✉️ Email: ${GKA_COMPANY.email}
🌐 Website: ${GKA_COMPANY.website}

GKA Construction — Building Trust. Delivering Quality.`;
  } else {
    // Invoice / Bill
    defaultSubject = `GKA Construction — Tax Invoice & Progressive RA Bill [${docNumber}] for ${projectTitle}`;
    defaultBody = `*FROM: GKA CONSTRUCTION*
*TAX INVOICE & PROGRESSIVE RA BILL*

Dear ${clientName},

Greetings from GKA Construction. Please find attached the official progressive tax invoice for construction works executed:

📄 *Invoice No:* ${docNumber}
🏗️ *Project:* ${projectTitle}
💵 *Total Invoice Value:* Rs. ${formattedAmount}
📅 *Payment Due Date:* ${data.dueDate || 'Within 14 calendar days'}

🏦 *Official Bank Transfer Details:*
Beneficiary: ${GKA_COMPANY.bankDetails.beneficiary}
Account No: ${GKA_COMPANY.bankDetails.accountNumber}
Bank: ${GKA_COMPANY.bankDetails.bankName.toUpperCase()} (${GKA_COMPANY.bankDetails.branch})
IFSC Code: ${GKA_COMPANY.bankDetails.ifscCode}

🔗 *Client Portal Link:* ${portalUrl}
👤 *Your Portal Username / Email:* ${username}
🔑 *Your Portal Password:* ${password}

Please log in to your portal to inspect verified site photographs and milestone completion certificates for this billing period.

📎 *Attached Files:*
• Tax Invoice PDF: ${fullPdfUrl}
• Editable DOCX: ${fullDocxUrl}

📞 Accounts Helpline: +91 ${GKA_COMPANY.phoneDisplay}
✉️ Email: ${GKA_COMPANY.email}
🌐 Website: ${GKA_COMPANY.website}

GKA Construction — Building Trust. Delivering Quality.`;
  }

  const [recipientEmail, setRecipientEmail] = useState(data.clientEmail || '');
  const [recipientPhone, setRecipientPhone] = useState(data.clientPhone || '');
  const [subjectText, setSubjectText] = useState(defaultSubject);
  const [messageBody, setMessageBody] = useState(defaultBody);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    let cleanPhone = recipientPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageBody)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(messageBody)}`;
    window.open(waUrl, '_blank');
  };

  const handleShareEmail = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
      subjectText
    )}&body=${encodeURIComponent(messageBody)}`;
    window.open(mailtoUrl, '_blank');
  };

  const typeLabels = {
    welcome: {
      title: 'Share Project Welcome & Credentials',
      badge: 'Onboarding Packet',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    quotation: {
      title: 'Share Commercial Quotation & BOQ',
      badge: 'Quotation Document',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    invoice: {
      title: 'Share Tax Invoice & Bill',
      badge: 'Progressive RA Bill',
      badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    },
  };

  const currentMeta = typeLabels[docType];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#0F254B] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#D6A21D]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-white">{currentMeta.title}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentMeta.badgeBg}`}
                >
                  {currentMeta.badge}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Ref: <span className="font-mono text-brand-gold-300 font-bold">{docNumber}</span> &bull;{' '}
                {projectTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Quick Credential Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Embedded Client Credentials Notice</span>
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              This message automatically embeds the client portal link{' '}
              <strong className="underline">{portalUrl}</strong> along with login username{' '}
              <strong className="font-mono bg-white px-1.5 py-0.2 rounded border border-amber-300">
                {username}
              </strong>{' '}
              and access password{' '}
              <strong className="font-mono bg-white px-1.5 py-0.2 rounded border border-amber-300">
                {password}
              </strong>
              .
            </p>
          </div>

          {/* Quick Recipient Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Recipient WhatsApp / Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. 9840012345 or +919840012345"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Recipient Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  placeholder="client@gingerhotel.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Email Subject Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Subject</label>
            <input
              type="text"
              value={subjectText}
              onChange={(e) => setSubjectText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-gold-500 focus:outline-none font-medium"
            />
          </div>

          {/* Formatted Message Template Box */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Message Content & Template Preview
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-semibold text-brand-navy-900 hover:text-brand-gold-600 inline-flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={9}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300 text-xs font-mono bg-slate-50 text-slate-800 leading-relaxed focus:bg-white focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
            />
          </div>

          {/* Attachment Links Preview */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs flex-wrap">
            <span className="font-semibold text-slate-600">Attached Documents:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {data.pdfUrl && (
                <a
                  href={fullPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold inline-flex items-center gap-1 shadow-sm"
                >
                  <FileDown className="w-3 h-3 text-[#D6A21D]" />
                  <span>PDF Document</span>
                </a>
              )}
              {data.docxUrl && (
                <a
                  href={fullDocxUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold inline-flex items-center gap-1 shadow-sm"
                >
                  <FileDown className="w-3 h-3 text-blue-600" />
                  <span>DOCX Template</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Text Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copy Message</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* WhatsApp Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
              <span>Send WhatsApp</span>
            </button>

            {/* Email Button */}
            <button
              type="button"
              onClick={handleShareEmail}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#0F254B] hover:bg-[#1A3A73] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4 text-[#D6A21D]" />
              <span>Send Mail</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
