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
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { GKA_COMPANY } from '@shared/constants';
import { api } from '../../services/api';

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
  docxUrl?: string; // Kept optional for backward compatibility, not sent in links
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
  const username = data.username || data.clientEmail || 'gingerhotel@gkaconstruction.com';
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

  // Default Subject & Structured Body Templates (Only PDF link, DOCX removed)
  let defaultSubject = '';
  let defaultBody = '';

  if (docType === 'welcome') {
    defaultSubject = `GKA Construction — Project Workspace Onboarding & Portal Access for ${projectTitle}`;
    defaultBody = `===============================================
   GKA CONSTRUCTION — CLIENT ONBOARDING PACKET
===============================================

Dear ${clientName},

Welcome to GKA Construction! Your dedicated project workspace and digital tracking portal have been successfully provisioned.

-----------------------------------------------
📋 PROJECT WORKSPACE DETAILS
-----------------------------------------------
• Project ID     : ${docNumber}
• Project Scope  : ${projectTitle}
• Site Location  : ${siteLocation}

-----------------------------------------------
📄 OFFICIAL ONBOARDING DOCUMENT (PDF ONLY)
-----------------------------------------------
Direct Download PDF:
${fullPdfUrl}

-----------------------------------------------
🔐 24/7 CLIENT TRACKING PORTAL ACCESS
-----------------------------------------------
Track live site progress, supervisor logs, and verified milestones:
• Portal Link    : ${portalUrl}
• Username/Email : ${username}
• Access Password: ${password}

Portal Features:
• Real-time milestone tracking & completion certificates
• Daily geotagged site photographs & supervisor logs
• Formal BOQ scope, bills, and tax receipts

-----------------------------------------------
📞 ENGINEERING & CLIENT DESK SUPPORT
-----------------------------------------------
• Helpline       : +91 ${GKA_COMPANY.phoneDisplay}
• Official Email : ${GKA_COMPANY.email}
• Website        : https://${GKA_COMPANY.website}
• Office Address : Rajan Nagar, Kelambakkam – Vandalur Junction, Chennai & Tiruvannamalai

GKA Construction — Building Trust. Delivering Quality.`;
  } else if (docType === 'quotation') {
    defaultSubject = `GKA Construction — Commercial Quotation & Itemized BOQ [${docNumber}] for ${projectTitle}`;
    defaultBody = `===============================================
   GKA CONSTRUCTION — OFFICIAL COMMERCIAL QUOTATION
===============================================

Dear ${clientName},

Greetings from GKA Construction. We are pleased to share our official detailed quotation and line-item BOQ estimation for your project:

-----------------------------------------------
📋 ESTIMATION & SCOPE SUMMARY
-----------------------------------------------
• Quotation No   : ${docNumber}
• Project Scope  : ${projectTitle}
• Site Location  : ${siteLocation}
• Total Amount   : Rs. ${formattedAmount} (Incl. Taxes)

-----------------------------------------------
📄 OFFICIAL PDF QUOTATION (DIRECT DOWNLOAD)
-----------------------------------------------
Click the verified link below to inspect / download your official PDF:
${fullPdfUrl}

(Note: All BOQ rates are calculated with 100% precision and include statutory compliance)

-----------------------------------------------
🔐 24/7 CLIENT TRACKING PORTAL ACCESS
-----------------------------------------------
Review milestone breakdowns, specifications, and approve stages online:
• Portal Link    : ${portalUrl}
• Username/Email : ${username}
• Access Password: ${password}

-----------------------------------------------
📞 ENGINEERING & ESTIMATION DESK
-----------------------------------------------
• Helpline       : +91 ${GKA_COMPANY.phoneDisplay}
• Official Email : ${GKA_COMPANY.email}
• Website        : https://${GKA_COMPANY.website}
• Registered Office: Rajan Nagar, Kelambakkam – Vandalur Junction, Chennai & Tiruvannamalai

GKA Construction — Building Trust. Delivering Quality.`;
  } else {
    // Invoice / Bill
    defaultSubject = `GKA Construction — Tax Invoice & Progressive RA Bill [${docNumber}] for ${projectTitle}`;
    defaultBody = `===============================================
   GKA CONSTRUCTION — TAX INVOICE & RA BILL
===============================================

Dear ${clientName},

Greetings from GKA Construction. Please find attached the official progressive tax invoice for works executed:

-----------------------------------------------
📋 INVOICE BILLING SUMMARY
-----------------------------------------------
• Invoice No     : ${docNumber}
• Project Scope  : ${projectTitle}
• Total Bill Amt : Rs. ${formattedAmount}
• Due Date       : ${data.dueDate || 'Within 14 calendar days'}

-----------------------------------------------
📄 OFFICIAL TAX INVOICE (PDF DOWNLOAD)
-----------------------------------------------
Click to view or download the certified PDF Tax Invoice:
${fullPdfUrl}

-----------------------------------------------
🏦 OFFICIAL SETTLEMENT BANK DETAILS
-----------------------------------------------
• Beneficiary    : ${GKA_COMPANY.bankDetails.beneficiary}
• Account Number : ${GKA_COMPANY.bankDetails.accountNumber}
• Bank Name      : ${GKA_COMPANY.bankDetails.bankName.toUpperCase()}
• IFSC Code      : ${GKA_COMPANY.bankDetails.ifscCode}
• MICR Code      : ${GKA_COMPANY.bankDetails.micr}
• Mobile Number  : ${GKA_COMPANY.bankDetails.contactMobile}
• Alternate No.  : ${GKA_COMPANY.bankDetails.alternateMobile || '8940455917'}
• Official Mail  : ${(GKA_COMPANY.bankDetails.email || GKA_COMPANY.email).toUpperCase()}
• Official Site  : ${(GKA_COMPANY.bankDetails.website || GKA_COMPANY.website).toUpperCase()}

-----------------------------------------------
🔐 24/7 CLIENT TRACKING PORTAL ACCESS
-----------------------------------------------
Inspect verified geotagged photographs & stage certificates for this bill:
• Portal Link    : ${portalUrl}
• Username/Email : ${username}
• Access Password: ${password}

-----------------------------------------------
📞 ACCOUNTS & PROJECT DESK SUPPORT
-----------------------------------------------
• Accounts Desk  : +91 ${GKA_COMPANY.phoneDisplay}
• Official Email : ${GKA_COMPANY.email}
• Website        : https://${GKA_COMPANY.website}

GKA Construction — Building Trust. Delivering Quality.`;
  }

  const [recipientEmail, setRecipientEmail] = useState(data.clientEmail || '');
  const [recipientPhone, setRecipientPhone] = useState(data.clientPhone || '');
  const [subjectText, setSubjectText] = useState(defaultSubject);
  const [messageBody, setMessageBody] = useState(defaultBody);
  const [copied, setCopied] = useState(false);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [mailStatus, setMailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handleShareEmailClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
      subjectText
    )}&body=${encodeURIComponent(messageBody)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleSendDirectEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      alert('Please enter a valid recipient email address.');
      return;
    }

    setIsSendingMail(true);
    setMailStatus(null);

    try {
      const res = await api.sendDocumentEmail({
        recipientEmail,
        recipientName: clientName,
        documentType: docType,
        documentNumber: docNumber,
        projectTitle,
        siteLocation,
        amount: data.amount,
        dueDate: data.dueDate,
        pdfUrl: fullPdfUrl,
        portalUsername: username,
        portalPassword: password,
        customSubject: subjectText,
        customMessage: messageBody,
      });

      if (res.success) {
        setMailStatus({
          type: 'success',
          message: `Official PDF dispatched successfully to ${recipientEmail} via GKA Mail Service.`,
        });
      } else {
        setMailStatus({
          type: 'error',
          message: res.message || 'Failed to dispatch email.',
        });
      }
    } catch (err: any) {
      // If server SMTP is not configured, fall back smoothly to client mailto
      console.warn('Direct SMTP failed, offering client mailto fallback:', err);
      setMailStatus({
        type: 'error',
        message: err.message || 'SMTP not configured on server. Use "Open Mail Client" below.',
      });
    } finally {
      setIsSendingMail(false);
    }
  };

  const typeLabels = {
    welcome: {
      title: 'Share Project Welcome & Credentials',
      badge: 'Onboarding Packet',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    quotation: {
      title: 'Share Commercial Quotation & BOQ',
      badge: 'PDF Quotation',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    invoice: {
      title: 'Share Tax Invoice & Bill',
      badge: 'Progressive RA Bill (PDF)',
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
              <span>Embedded Client Credentials & PDF Link Notice</span>
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              This message automatically embeds the official PDF link and client portal access{' '}
              <strong className="underline">{portalUrl}</strong> (User:{' '}
              <strong className="font-mono bg-white px-1.5 py-0.2 rounded border border-amber-300">
                {username}
              </strong>
              ). Only the official PDF link will be sent.
            </p>
          </div>

          {/* Mail Status Alert (if sent via SMTP) */}
          {mailStatus && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                mailStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {mailStatus.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="flex-1 font-medium">{mailStatus.message}</span>
              <button
                type="button"
                onClick={() => setMailStatus(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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
                Recipient Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  placeholder="client@gkaconstruction.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-gold-500 focus:outline-none font-medium"
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
                Structured Message Preview (PDF Link Included &bull; Document Removed)
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
                    <span>Copy Structured Text</span>
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

          {/* Attachment Link Preview: ONLY PDF */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs flex-wrap">
            <span className="font-semibold text-slate-600">Certified Attachment:</span>
            <div className="flex items-center gap-2">
              <a
                href={fullPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#0F254B] text-white hover:bg-brand-navy-800 font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
              >
                <FileDown className="w-3.5 h-3.5 text-[#D6A21D]" />
                <span>Official PDF Document Link</span>
                <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
              </a>
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
                <span>Text Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copy Message</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {/* WhatsApp Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
              title="Share structured template with PDF link on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            {/* Direct Send via Mail Service (SMTP) Button */}
            <button
              type="button"
              onClick={handleSendDirectEmail}
              disabled={isSendingMail}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#0F254B] hover:bg-[#1A3A73] disabled:opacity-60 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 border border-[#C59A27]/40"
              title="Dispatch verified PDF email via GKA Mail Service"
            >
              {isSendingMail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D6A21D]" />
                  <span>Sending Mail...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#D6A21D]" />
                  <span>Dispatch Mail</span>
                </>
              )}
            </button>

            {/* Email Client (Mailto) Fallback Button */}
            <button
              type="button"
              onClick={handleShareEmailClient}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
              title="Open default email application"
            >
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>Mail App</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
