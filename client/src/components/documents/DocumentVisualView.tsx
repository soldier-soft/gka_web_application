import React, { useState } from 'react';
import {
  Building2,
  FileDown,
  Printer,
  Share2,
  CheckCircle2,
  Phone,
  Mail,
  Globe,
  FileText,
  User,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { formatINR, toRupees } from '@shared/types';
import { GKA_COMPANY, formatClientPortalUsername } from '@shared/constants';
import { getFileUrl } from '../../services/api';
import { ShareDocumentModal, ShareDocumentData } from '../common/ShareDocumentModal';

interface DocumentVisualViewProps {
  type: 'quotation' | 'invoice';
  data: any;
  onDownloadPdf?: () => void;
  onDownloadDocx?: () => void;
}

export function numberToWordsIndian(num: number): string {
  if (num === 0) return 'Zero';
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function under1000(n: number): string {
    const res: string[] = [];
    if (n >= 100) {
      res.push(ones[Math.floor(n / 100)], 'Hundred');
      n %= 100;
    }
    if (n >= 20) {
      res.push(tens[Math.floor(n / 10)]);
      n %= 10;
    }
    if (n > 0) res.push(ones[n]);
    return res.join(' ');
  }

  const parts: string[] = [];
  const units: [string, number][] = [
    ['Crore', 10000000],
    ['Lakh', 100000],
    ['Thousand', 1000],
    ['', 1],
  ];

  for (const [unit, divisor] of units) {
    const chunk = Math.floor(num / divisor);
    num %= divisor;
    if (chunk > 0) {
      if (unit === '') {
        parts.push(under1000(chunk));
      } else {
        parts.push(`${numberToWordsIndian(chunk)} ${unit}`);
      }
    }
  }
  return parts.join(' ').trim();
}

export const DocumentVisualView: React.FC<DocumentVisualViewProps> = ({
  type,
  data,
  onDownloadPdf,
  onDownloadDocx,
}) => {
  const [showShareModal, setShowShareModal] = useState(false);

  const isQuotation = type === 'quotation';
  const docNumber = isQuotation ? data.quotationNumber : data.invoiceNumber;
  const docDate = isQuotation ? data.createdAt || data.date : data.issueDate;

  const clientPortalUsername =
    data.clientPortalUsername ||
    (data.clientEmail?.endsWith('@gkaconstruction.com') ? data.clientEmail : null) ||
    formatClientPortalUsername(data.clientName || data.clientCompany || data.clientContactPerson || 'client');
  const clientPortalPassword = data.clientPortalPassword || data.defaultPassword || 'GKAclient2026!';

  const subtotalPaise = data.subtotalPaise || 0;
  const taxPaise = isQuotation
    ? (data.cgstPaise || 0) + (data.sgstPaise || 0) + (data.igstPaise || 0)
    : (data.cgstPaise || 0) + (data.sgstPaise || 0);
  const totalPaise = data.totalAmountPaise || subtotalPaise + taxPaise;
  const totalRupees = toRupees(totalPaise);

  const amountWords = `Rupees ${numberToWordsIndian(Math.floor(totalRupees))} Only.`;

  const clientContact = data.clientContactPerson || 'THE CHIEF ENGINEER';
  const clientCompany = data.clientCompany || data.clientName || 'VIVANTHA HOTEL';
  const clientAddress = data.clientAddress || data.billingAddress || data.siteLocation || 'SHOLINGANALUR, CHENNAI.';
  const senderName = data.senderName || 'HARI A';
  const senderCompany = data.senderCompany || 'GKA CONSTRUCTION';
  const subject =
    data.subject ||
    (isQuotation
      ? `Quotation for Construction Works – Cooling Tower Base & Related Structures.`
      : `Tax Invoice for Construction Works – ${data.projectTitle || 'Civil Works'}`);

  const items = data.items || [];

  return (
    <div className="bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden font-sans max-w-4xl mx-auto my-4 print:m-0 print:border-none print:shadow-none">
      {/* Top Action Bar (hidden in print) */}
      <div className="bg-slate-900 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {data.isNegotiated ? '🤝 Negotiated ' : 'Official '}
            {isQuotation ? 'Quotation Preview' : 'Tax Invoice Preview'}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-brand-gold-400">
            {docNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onDownloadPdf ? (
            <button
              onClick={onDownloadPdf}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-gold-500 hover:bg-brand-gold-400 text-brand-navy-950 transition-all flex items-center gap-1.5 shadow"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          ) : (
            <a
              href={getFileUrl(`/api/v1/${isQuotation ? 'quotations' : 'finance/invoices'}/${data._id}/pdf`)}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-gold-500 hover:bg-brand-gold-400 text-brand-navy-950 transition-all flex items-center gap-1.5 shadow"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
          )}

          {onDownloadDocx ? (
            <button
              onClick={onDownloadDocx}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-1.5 shadow"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download DOCX</span>
            </button>
          ) : (
            <a
              href={getFileUrl(`/api/v1/${isQuotation ? 'quotations' : 'finance/invoices'}/${data._id}/docx`)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-1.5 shadow"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download DOCX</span>
            </a>
          )}

          {/* Share Button (WhatsApp & Email) */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1.5 shadow"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share (Mail & WhatsApp)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Main Document Body (Exact replica of Reference Image) */}
      <div className="p-8 sm:p-10 relative bg-white selection:bg-brand-gold-100">
        {/* Geometric Decorative Angled Shapes in Top Right */}
        <div className="absolute top-0 right-0 w-44 h-24 overflow-hidden pointer-events-none select-none">
          <div
            className="absolute -top-10 -right-10 w-40 h-40 bg-[#0F254B]"
            style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
          />
          <div
            className="absolute -top-4 -right-4 w-32 h-32 bg-[#D6A21D]"
            style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
          />
        </div>

        {/* 1. HEADER: Logo, Tagline & Pillars (Left) + Registered Office & GSTIN (Right) */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-5">
          <div className="space-y-1.5 max-w-md">
            <img
              src="/gka_header_full.png"
              alt="GKA Construction Logo & 4 Service Pillars"
              className="h-20 w-auto object-contain"
            />
          </div>

          {/* Right Header: Office & Contact */}
          <div className="text-right text-[10px] space-y-1 text-slate-600 md:max-w-xs">
            <div>
              <strong className="text-[#0F254B] block text-[11px]">Registered Office:</strong>
              <span>No. 965, Pillaiyar Kovil St, Theppanandhal, Kelur,</span>
              <br />
              <span>Tiruvannamalai District, Tamil Nadu – 606907</span>
            </div>
            <div className="pt-1 font-mono text-[10px] space-y-0.5">
              <div className="text-slate-800">
                <strong>GSTIN:</strong> 33CDYPA3555M2ZZ &bull; <strong>PAN:</strong> CDYPA3555M
              </div>
              <div>
                <strong>Mobile:</strong> 8838030917 &bull; <strong>Email:</strong> gkaconstruction51@gmail.com
              </div>
              <div>
                <strong>Website:</strong> www.gkaconstruction.com
              </div>
            </div>
          </div>
        </div>

        {/* 2. DOCUMENT TITLE RIBBON (QUOTATION / TAX INVOICE) */}
        <div className="my-6 relative flex justify-center items-center">
          <div className="relative inline-flex items-center">
            {/* Left Gold Angle */}
            <div
              className="w-8 h-10 bg-[#D6A21D]"
              style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%, 0 100%)' }}
            />
            {/* Center Navy Banner */}
            <div className="bg-[#0F254B] text-white px-14 py-2 text-center shadow-lg font-heading font-black tracking-widest text-lg sm:text-xl">
              {isQuotation
                ? (data.isNegotiated ? 'NEGOTIATED QUOTATION' : 'QUOTATION')
                : (data.isNegotiated ? 'NEGOTIATED TAX INVOICE' : 'TAX INVOICE')}
            </div>
            {/* Right Gold Angle */}
            <div
              className="w-8 h-10 bg-[#D6A21D]"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 100%)' }}
            />
          </div>
        </div>

        {/* 3. METADATA ROW: Quotation/Invoice No (Left) & Date (Right) */}
        <div className="flex justify-between items-end mb-4 px-1">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {isQuotation ? 'QUOTATION NO.' : 'INVOICE NO.'}
            </span>
            <span className="text-base font-extrabold font-mono text-[#0F254B]">
              {docNumber}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              DATE
            </span>
            <span className="text-sm font-extrabold text-[#0F254B]">
              {new Date(docDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* 4. TO & FROM BOX (Two Columns with Light Blue Border) */}
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-xl border border-[#B8D5E5] bg-[#F8FAFC] divide-y md:divide-y-0 md:divide-x divide-[#B8D5E5] mb-4 overflow-hidden">
          {/* TO Column */}
          <div className="p-3.5 space-y-0.5 text-xs">
            <span className="text-[11px] font-bold text-[#D6A21D] flex items-center gap-1 mb-1">
              <User className="w-3.5 h-3.5" />
              <span>TO:</span>
            </span>
            <p className="font-extrabold text-sm text-[#0F254B] leading-tight">
              {clientContact}
            </p>
            {clientCompany && (
              <p className="font-bold text-slate-800 text-[11px]">{clientCompany}</p>
            )}
            <p className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-line">
              {clientAddress}
            </p>
          </div>

          {/* FROM Column */}
          <div className="p-3.5 space-y-0.5 text-xs">
            <span className="text-[11px] font-bold text-[#D6A21D] flex items-center gap-1 mb-1">
              <User className="w-3.5 h-3.5" />
              <span>FROM:</span>
            </span>
            <p className="font-extrabold text-sm text-[#0F254B] leading-tight">
              {senderName}
            </p>
            <p className="font-bold text-slate-800 text-[11px]">{senderCompany}</p>
          </div>
        </div>

        {/* 5. SUBJECT LINE */}
        <div className="mb-5 flex items-start gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <FileText className="w-4 h-4 text-[#0F254B] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#D6A21D] uppercase tracking-wider mr-1.5">
              SUBJECT:
            </span>
            <strong className="text-[#0F254B] font-bold">{subject}</strong>
          </div>
        </div>

        {/* 6. ITEMS TABLE (Deep Navy Header, Clean Border Rows) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F254B] text-white font-bold text-[10px] tracking-wider uppercase">
              <tr>
                <th className="py-2.5 px-3 text-center w-14">SL. NO.</th>
                <th className="py-2.5 px-4">DESCRIPTION</th>
                <th className="py-2.5 px-3 text-center w-16">QTY</th>
                <th className="py-2.5 px-3 text-center w-16">UNIT</th>
                <th className="py-2.5 px-4 text-right w-24">RATE (₹)</th>
                <th className="py-2.5 px-4 text-right w-28">AMOUNT (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {items.map((it: any, idx: number) => {
                const qty = Number(it.quantity || it.qty || 1);
                const rateRupees = toRupees(it.unitRatePaise || it.unitPricePaise || it.rate * 100 || 0);
                const amountRupees = toRupees(it.amountPaise || it.totalPaise || it.amount * 100 || (qty * rateRupees * 100));

                return (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-white'}>
                    <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                      {idx + 1}.
                    </td>
                    <td className="py-2.5 px-4 font-bold text-[#0F254B]">
                      {it.description}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                      {qty}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-600 uppercase text-[11px]">
                      {it.unit || 'CFT'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-700">
                      {rateRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {amountRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 7. TOTALS BLOCK (Right Aligned) */}
        <div className="flex justify-end mb-4">
          <div className="w-full sm:w-80 space-y-1.5 text-xs">
            <div className="flex justify-between py-1 px-3 text-slate-600 font-bold">
              <span>{data.isNegotiated ? (isQuotation ? 'GROSS ESTIMATE' : 'GROSS BILL AMOUNT') : 'TOTAL AMOUNT'}</span>
              <span className="font-mono text-slate-900 font-extrabold">
                ₹ {toRupees(subtotalPaise).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {data.isNegotiated && (data.negotiatedDiscountPaise || data.discountPaise || 0) > 0 && (
              <>
                <div className="flex justify-between py-1 px-3 text-emerald-800 font-bold bg-emerald-50 rounded border border-emerald-200">
                  <span>LESS: NEGOTIATED DISCOUNT</span>
                  <span className="font-mono text-emerald-900 font-extrabold">
                    - ₹ {toRupees(data.negotiatedDiscountPaise || data.discountPaise).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between py-1 px-3 text-slate-700 font-bold bg-slate-50 rounded border border-slate-200">
                  <span>TAXABLE VALUE</span>
                  <span className="font-mono text-slate-900 font-extrabold">
                    ₹ {toRupees(Math.max(0, subtotalPaise - (data.negotiatedDiscountPaise || data.discountPaise || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between py-1 px-3 text-slate-600 font-bold">
              <span>TAXES / GST ({data.taxRatePercent || 18}%)</span>
              <span className="font-mono text-slate-900 font-extrabold">
                ₹ {toRupees(taxPaise).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Grand Total Ribbon */}
            <div className="relative flex items-center shadow-sm">
              <div
                className="w-4 h-9 bg-[#D6A21D] shrink-0"
                style={{ clipPath: 'polygon(0 0, 100% 0, 60% 100%, 0 100%)' }}
              />
              <div className="flex-1 bg-[#0F254B] text-white py-2 px-4 flex justify-between items-center rounded-r">
                <span className="font-heading font-black tracking-wider text-xs">
                  GRAND TOTAL
                </span>
                <span className="font-mono font-black text-sm tracking-wide">
                  ₹ {totalRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 8. AMOUNT IN WORDS BANNER */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] p-2.5 rounded-xl mb-4 text-xs flex items-center gap-2">
          <span className="font-bold text-[#D6A21D] flex items-center gap-1 uppercase tracking-wider shrink-0 text-[11px]">
            <span>📋</span> AMOUNT IN WORDS:
          </span>
          <strong className="text-[#0F254B] font-bold leading-tight">
            {amountWords}
          </strong>
        </div>

        {/* 8.5 CLIENT PORTAL WORKSPACE ACCESS CREDENTIALS */}
        <div className="bg-[#EFF6FF] border border-[#93C5FD] rounded-xl overflow-hidden mb-6 text-xs">
          <div className="bg-[#1E40AF] text-white px-3.5 py-1.5 font-heading font-bold text-[11px] tracking-wider uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#93C5FD]" />
            <span>CLIENT PORTAL WORKSPACE ACCESS CREDENTIALS</span>
          </div>
          <div className="p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px] items-center">
            <div>
              <span className="text-[#1E40AF] font-bold block text-[10px]">PORTAL LINK:</span>
              <a
                href="https://www.gkaconstruction.com/login"
                target="_blank"
                rel="noreferrer"
                className="text-[#0F254B] font-bold underline hover:text-[#D6A21D]"
              >
                gkaconstruction.com/login
              </a>
            </div>
            <div>
              <span className="text-[#1E40AF] font-bold block text-[10px]">LOGIN USERNAME:</span>
              <span className="text-[#0F254B] font-bold">{clientPortalUsername}</span>
            </div>
            <div>
              <span className="text-[#1E40AF] font-bold block text-[10px]">ACCESS PASSWORD:</span>
              <span className="bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] px-2.5 py-0.5 rounded font-bold inline-block">
                {clientPortalPassword}
              </span>
            </div>
          </div>
        </div>

        {/* 8.8 DEDICATED OFFICIAL BILL NOTES & AGREED SETTLEMENT AGREEMENT */}
        {(data.notes || (data.isNegotiated && data.negotiatedNotes)) && (
          <div className="bg-gradient-to-r from-amber-50/90 to-orange-50/50 border border-amber-200/90 rounded-xl p-3.5 mb-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-amber-200/70">
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              <span className="font-heading font-bold text-[11px] uppercase tracking-wider text-amber-950">
                Official Bill Notes & Agreed Settlement Agreement
              </span>
            </div>
            <div className="space-y-1.5 text-[11px] leading-relaxed">
              {data.notes && (
                <div className="text-slate-800">
                  <strong className="text-slate-900 font-semibold">Bill Notes / Instructions:</strong> {data.notes}
                </div>
              )}
              {data.isNegotiated && data.negotiatedNotes && (
                <div className="text-amber-950 font-medium">
                  <strong className="text-amber-900 font-bold">🤝 Special Commercial Settlement:</strong> {data.negotiatedNotes}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. BOTTOM DUAL SECTION: Bank Details (Left) & Terms & Conditions (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Left: Bank Details Card */}
          <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] overflow-hidden text-xs flex flex-col justify-between shadow-xs">
            <div>
              <div className="bg-[#0F254B] text-white px-3.5 py-2 font-heading font-bold text-[11px] tracking-wider uppercase flex items-center gap-1.5">
                <span>🏦</span> BANK DETAILS
              </div>
              <div className="p-3.5 space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">BENEFICIARY NAME:</span>
                  <strong className="text-slate-900">{GKA_COMPANY.bankDetails.beneficiary}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">ACCOUNT NUMBER:</span>
                  <strong className="text-slate-900 font-bold text-[11px] tracking-wider">
                    {GKA_COMPANY.bankDetails.accountNumber}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">BANK NAME:</span>
                  <strong className="text-slate-900">{GKA_COMPANY.bankDetails.bankName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">IFSC CODE:</span>
                  <strong className="text-slate-900">{GKA_COMPANY.bankDetails.ifscCode}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">MICR CODE:</span>
                  <strong className="text-slate-900">{GKA_COMPANY.bankDetails.micr}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">MOBILE NUMBER:</span>
                  <strong className="text-slate-900">{GKA_COMPANY.bankDetails.contactMobile}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">ALTERNATE NUMBER:</span>
                  <strong className="text-slate-900">8940455917</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">MAIL ID:</span>
                  <strong className="text-slate-900 uppercase">{GKA_COMPANY.email}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">WEBSITE:</span>
                  <strong className="text-slate-900 uppercase">{GKA_COMPANY.website}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Terms & Conditions Card */}
          <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] overflow-hidden text-xs flex flex-col justify-between shadow-xs">
            <div>
              <div className="bg-[#0F254B] text-white px-3.5 py-2 font-heading font-bold text-[11px] tracking-wider uppercase flex items-center gap-1.5">
                <span>📋</span> TERMS & CONDITIONS
              </div>
              <div className="p-3.5 space-y-2">
                <ul className="text-[10px] text-slate-600 space-y-1.5 leading-relaxed list-disc list-inside">
                  {Array.isArray(data.termsAndConditions) && data.termsAndConditions.length > 0 ? (
                    data.termsAndConditions.map((term: string, idx: number) => (
                      <li key={idx} className="text-slate-700">
                        {term.replace(/^[•\-\*]\s*/, '')}
                      </li>
                    ))
                  ) : isQuotation ? (
                    <>
                      <li>This quotation is valid for 15 days from the date of issue.</li>
                      <li>Payment terms will be mutually agreed as per milestone schedule.</li>
                      <li>GST applicable as per statutory government norms.</li>
                      <li>Work will be executed as per agreed specifications and site conditions.</li>
                    </>
                  ) : (
                    <>
                      <li>Payment is due within 14 calendar days from the date of invoice issuance.</li>
                      <li>Please quote this Invoice Number when executing bank transfers.</li>
                      <li>Statutory GST (18%) charged as per GSTIN compliance rules.</li>
                      <li>Late payment charges @ 18% per annum apply on balances overdue past the due date.</li>
                      <li>All billing disputes and claims subject to Chennai legal jurisdiction only.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 9.5 DEDICATED OFFICIAL AUTHORIZATION & SEAL BLOCK */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-left sm:text-left">
            <p className="text-[10px] font-bold text-[#0F254B] tracking-wider uppercase">
              For GKA CONSTRUCTION
            </p>
            <div className="py-1">
              <img
                src="/signature.png"
                alt="Authorized Signatory Signature"
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-[11px] font-bold text-[#0F254B]">Hari A</p>
            <p className="text-[9px] text-slate-500 font-medium">Proprietor / Authorized Signatory</p>
          </div>

          <div className="text-center sm:text-right flex items-center gap-3">
            <div className="text-[9px] text-slate-400 font-medium hidden sm:block max-w-[200px] leading-tight">
              Certified authentic tax billing instrument with statutory company seal affixed.
            </div>
            <div className="flex flex-col items-center select-none">
              <img
                src="/seal.png"
                alt="GKA Construction Company Seal"
                className="w-20 h-20 object-contain drop-shadow-sm"
              />
              <span className="text-[8px] font-bold text-slate-400 mt-0.5 tracking-wider uppercase">
                (Company Seal)
              </span>
            </div>
          </div>
        </div>

        {/* 10. BOTTOM FOOTER BANNER */}
        <div className="bg-[#0F254B] text-white p-3 rounded-lg flex flex-col sm:flex-row justify-between items-center text-[10px] gap-2">
          <div className="flex items-center gap-4 text-slate-300 font-medium">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#D6A21D]" /> {GKA_COMPANY.phoneDisplay}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-[#D6A21D]" /> {GKA_COMPANY.email}
            </span>
            <span className="flex items-center gap-1 hidden md:flex">
              <Globe className="w-3 h-3 text-[#D6A21D]" /> {GKA_COMPANY.website}
            </span>
          </div>

          <div className="font-heading font-black text-[#D6A21D] tracking-wider uppercase text-[10px]">
            QUALITY CONSTRUCTION FOR A BETTER TOMORROW
          </div>
        </div>
      </div>

      {/* Share Document Modal (WhatsApp & Email) */}
      <ShareDocumentModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        data={{
          documentType: type,
          title: subject,
          number: docNumber,
          clientName: clientCompany,
          clientContactPerson: clientContact,
          clientEmail: data.clientEmail || '',
          clientPhone: data.clientPhone || '',
          projectTitle: data.projectTitle || subject,
          siteLocation: clientAddress,
          amount: totalRupees,
          dueDate: data.dueDate ? new Date(data.dueDate).toLocaleDateString('en-IN') : undefined,
          pdfUrl: `/api/v1/${isQuotation ? 'quotations' : 'finance/invoices'}/${data._id}/pdf`,
          docxUrl: `/api/v1/${isQuotation ? 'quotations' : 'finance/invoices'}/${data._id}/docx`,
          username: clientPortalUsername,
          password: clientPortalPassword,
        }}
      />
    </div>
  );
};
