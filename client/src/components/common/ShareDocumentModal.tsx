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
  Paperclip,
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
📎 ATTACHED OFFICIAL ONBOARDING DOCUMENT (PDF)
-----------------------------------------------
• Attached File  : GKA_Project_Welcome_${docNumber}.pdf
(Attached directly to this email for your permanent records)

• Web Verification Link:
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
📎 ATTACHED OFFICIAL COMMERCIAL QUOTATION (PDF)
-----------------------------------------------
• Attached File  : ${docNumber}.pdf
(Attached directly to this email with itemized BOQ specifications)

• Web Verification Link:
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
📎 ATTACHED OFFICIAL TAX INVOICE (PDF)
-----------------------------------------------
• Attached File  : ${docNumber}.pdf
(Attached directly to this email with statutory compliance & itemized measurements)

• Web Verification Link:
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
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);
  const [mailStatus, setMailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getPdfBlobAndFile = async (): Promise<{ blob: Blob; file: File; filename: string }> => {
    const filename =
      docType === 'welcome'
        ? `GKA_Project_Welcome_${docNumber}.pdf`
        : `${docNumber}.pdf`;

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(fullPdfUrl, { headers });
    if (!response.ok) {
      throw new Error(`Failed to load document file (HTTP ${response.status})`);
    }
    const blob = await response.blob();
    const file = new File([blob], filename, { type: 'application/pdf' });
    return { blob, file, filename };
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadFile = async () => {
    setIsProcessingAction('download');
    try {
      const { blob, filename } = await getPdfBlobAndFile();
      triggerDownload(blob, filename);
      setMailStatus({
        type: 'success',
        message: `Official document "${filename}" downloaded successfully to your device.`,
      });
    } catch (err: any) {
      console.warn('Direct blob download failed, falling back to window.open:', err);
      window.open(fullPdfUrl, '_blank');
    } finally {
      setIsProcessingAction(null);
    }
  };

  const handleShareWhatsApp = async () => {
    setIsProcessingAction('whatsapp');
    setMailStatus(null);

    let cleanPhone = recipientPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageBody)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(messageBody)}`;

    try {
      const { blob, file, filename } = await getPdfBlobAndFile();

      // Check if Web Share API can share the PDF file directly to WhatsApp
      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            title: subjectText,
            text: messageBody,
            files: [file],
          });
          setMailStatus({
            type: 'success',
            message: `Official document (${filename}) and message shared via WhatsApp!`,
          });
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') return; // User closed dialog
          console.warn('Native share with file failed, falling back to auto-download:', shareErr);
        }
      }

      // Fallback for Desktop / WhatsApp Web:
      // Download file to disk so user can attach/drag-and-drop, and open WhatsApp with prefilled message
      triggerDownload(blob, filename);
      window.open(waUrl, '_blank');
      setMailStatus({
        type: 'success',
        message: `📎 ${filename} downloaded! In WhatsApp, click the 📎 attachment icon to attach the downloaded file, or drag and drop it into your chat.`,
      });
    } catch (err: any) {
      console.warn('WhatsApp share fetch failed, opening text link:', err);
      window.open(waUrl, '_blank');
      setMailStatus({
        type: 'error',
        message: 'Could not fetch file for attachment. Opened WhatsApp with text template.',
      });
    } finally {
      setIsProcessingAction(null);
    }
  };

  const handleShareEmailClient = async () => {
    setIsProcessingAction('mailapp');
    setMailStatus(null);

    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
      subjectText
    )}&body=${encodeURIComponent(messageBody)}`;

    try {
      const { blob, file, filename } = await getPdfBlobAndFile();

      // Check if Web Share API can open Mail App with the attached PDF file
      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            title: subjectText,
            text: messageBody,
            files: [file],
          });
          setMailStatus({
            type: 'success',
            message: `Official document (${filename}) opened in Mail app with file attachment!`,
          });
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') return;
          console.warn('Native mail share with file failed, falling back:', shareErr);
        }
      }

      // Desktop fallback: Download the official file and open Mail client
      triggerDownload(blob, filename);
      window.open(mailtoUrl, '_blank');
      setMailStatus({
        type: 'success',
        message: `📎 ${filename} downloaded! Opening your Mail app — please attach the downloaded file to your email message.`,
      });
    } catch (err: any) {
      console.warn('Mail app fetch failed, opening mailto link:', err);
      window.open(mailtoUrl, '_blank');
      setMailStatus({
        type: 'error',
        message: 'Could not fetch file for attachment. Opened Mail app with message.',
      });
    } finally {
      setIsProcessingAction(null);
    }
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
          message: `Official document (${docType === 'welcome' ? `GKA_Project_Welcome_${docNumber}.pdf` : `${docNumber}.pdf`}) and text template dispatched successfully to ${recipientEmail} with direct file attachment!`,
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
              <span>Direct File Attachment &amp; Text Template Notice</span>
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              When dispatched via Mail Service, the official PDF document file (
              <strong>
                {docType === 'welcome' ? `GKA_Project_Welcome_${docNumber}.pdf` : `${docNumber}.pdf`}
              </strong>
              ) is attached directly to the email along with this formatted text template and client portal access{' '}
              <strong className="underline">{portalUrl}</strong> (User:{' '}
              <strong className="font-mono bg-white px-1.5 py-0.2 rounded border border-amber-300">
                {username}
              </strong>
              ).
            </p>
          </div>

          {/* Mail Status Alert (if sent via SMTP) */}
          {mailStatus && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${mailStatus.type === 'success'
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
                Structured Message Preview (Text Template &bull; Document File Attached)
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

          {/* Certified Attachment File Preview */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Official Document File:</span>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                {docType === 'welcome' ? `GKA_Project_Welcome_${docNumber}.pdf` : `${docNumber}.pdf`}
              </span>
              <span className="text-[11px] text-emerald-700 font-medium">(File Attachment Ready)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadFile}
                disabled={Boolean(isProcessingAction)}
                className="px-3 py-1.5 rounded-lg bg-[#0F254B] text-white hover:bg-brand-navy-800 font-bold inline-flex items-center gap-1.5 shadow-sm transition-all text-xs"
                title="Download official PDF file to device"
              >
                {isProcessingAction === 'download' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D6A21D]" />
                ) : (
                  <FileDown className="w-3.5 h-3.5 text-[#D6A21D]" />
                )}
                <span>Download File</span>
              </button>
              <a
                href={fullPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold inline-flex items-center gap-1 shadow-xs transition-all text-xs"
                title="Open PDF preview in new tab"
              >
                <span>Preview</span>
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
            {/* WhatsApp Button with File */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={Boolean(isProcessingAction) || isSendingMail}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
              title="Share document file and formatted text on WhatsApp"
            >
              {isProcessingAction === 'whatsapp' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Preparing WhatsApp...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                  <span>WhatsApp + File</span>
                </>
              )}
            </button>

            {/* Direct Send via Mail Service (SMTP) Button */}
            <button
              type="button"
              onClick={handleSendDirectEmail}
              disabled={Boolean(isProcessingAction) || isSendingMail}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#0F254B] hover:bg-[#1A3A73] disabled:opacity-60 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 border border-[#C59A27]/40"
              title="Dispatch official text template and attached PDF document via GKA Mail Service"
            >
              {isSendingMail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D6A21D]" />
                  <span>Dispatching Mail & File...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#D6A21D]" />
                  <span>Dispatch Mail &amp; File</span>
                </>
              )}
            </button>

            {/* Email Client (Mailto / Web Share) Button */}
            <button
              type="button"
              onClick={handleShareEmailClient}
              disabled={Boolean(isProcessingAction) || isSendingMail}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-700 border border-slate-300 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
              title="Open default email application with document file attached"
            >
              {isProcessingAction === 'mailapp' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                  <span>Preparing Mail...</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>App Mail + File</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
