import PDFDocument from 'pdfkit';
import { GKA_COMPANY, toRupees } from '../shared/constants';
import { IQuotationDocument } from '../models/Quotation';
import { IInvoiceDocument } from '../models/Invoice';
import { IPurchaseOrderDocument } from '../models/PurchaseOrder';

export class PDFService {
  /**
   * Generate Branded Quotation PDF stream
   */
  static generateQuotationPDF(quotation: IQuotationDocument): InstanceType<typeof PDFDocument> {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Header Branding
    doc.fillColor('#0F1E36').fontSize(22).font('Helvetica-Bold').text(GKA_COMPANY.name, 40, 40);
    doc.fillColor('#C59A27').fontSize(10).font('Helvetica-Bold').text(GKA_COMPANY.tagline, 40, 68);
    
    doc.fillColor('#475569').fontSize(8).font('Helvetica')
      .text(`Chennai Branch: ${GKA_COMPANY.chennaiBranch.full}`, 40, 84)
      .text(`Reg. Office: ${GKA_COMPANY.registeredOffice.full}`, 40, 96)
      .text(`GSTIN: ${GKA_COMPANY.gstin} | PAN: ${GKA_COMPANY.pan} | Phone: ${GKA_COMPANY.phoneDisplay} | Email: ${GKA_COMPANY.email}`, 40, 108);

    doc.moveTo(40, 124).lineTo(555, 124).strokeColor('#CBD5E1').lineWidth(1).stroke();

    // Document Title Banner
    doc.rect(40, 134, 515, 26).fill('#0F1E36');
    doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text('ESTIMATE & COMMERCIAL QUOTATION', 48, 142);

    // Meta Details Box
    doc.rect(40, 168, 515, 60).strokeColor('#E2E8F0').lineWidth(1).stroke();
    doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold');
    doc.text(`Quotation No: ${quotation.quotationNumber}`, 50, 176);
    doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString('en-IN')}`, 50, 190);
    doc.text(`Valid Until: ${new Date(quotation.validUntil).toLocaleDateString('en-IN')}`, 50, 204);

    doc.text(`Client: ${quotation.clientName}`, 300, 176);
    doc.font('Helvetica').fillColor('#475569');
    doc.text(`Project: ${quotation.projectTitle}`, 300, 190);
    doc.text(`Site: ${quotation.siteLocation}`, 300, 204);

    // Items Table Header
    let y = 240;
    doc.rect(40, y, 515, 20).fill('#F1F5F9');
    doc.fillColor('#0F1E36').fontSize(8).font('Helvetica-Bold');
    doc.text('#', 48, y + 6, { width: 20 });
    doc.text('Item Description & Scope', 72, y + 6, { width: 250 });
    doc.text('Qty', 330, y + 6, { width: 40, align: 'right' });
    doc.text('Unit', 375, y + 6, { width: 40 });
    doc.text('Rate (₹)', 420, y + 6, { width: 55, align: 'right' });
    doc.text('Amount (₹)', 485, y + 6, { width: 60, align: 'right' });

    y += 24;
    doc.font('Helvetica').fontSize(8).fillColor('#334155');

    quotation.items.forEach((item, index) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.text(`${index + 1}`, 48, y, { width: 20 });
      doc.text(item.description, 72, y, { width: 250 });
      doc.text(`${item.quantity}`, 330, y, { width: 40, align: 'right' });
      doc.text(item.unit, 375, y, { width: 40 });
      doc.text(`${toRupees(item.unitRatePaise).toLocaleString('en-IN')}`, 420, y, { width: 55, align: 'right' });
      doc.text(`${toRupees(item.amountPaise).toLocaleString('en-IN')}`, 485, y, { width: 60, align: 'right' });

      y += 20;
    });

    doc.moveTo(40, y).lineTo(555, y).strokeColor('#E2E8F0').lineWidth(1).stroke();
    y += 10;

    // Totals Block
    const subtotalRupees = toRupees(quotation.subtotalPaise);
    const taxRupees = toRupees(quotation.cgstPaise + quotation.sgstPaise + quotation.igstPaise);
    const totalRupees = toRupees(quotation.totalAmountPaise);

    doc.font('Helvetica').fontSize(9).fillColor('#475569');
    doc.text('Subtotal:', 380, y, { width: 80, align: 'right' });
    doc.text(`₹ ${subtotalRupees.toLocaleString('en-IN')}`, 470, y, { width: 75, align: 'right' });
    y += 16;

    if (taxRupees > 0) {
      doc.text(`GST (${quotation.taxRatePercent}%):`, 380, y, { width: 80, align: 'right' });
      doc.text(`₹ ${taxRupees.toLocaleString('en-IN')}`, 470, y, { width: 75, align: 'right' });
      y += 16;
    }

    doc.rect(360, y - 2, 195, 22).fill('#0F1E36');
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#FFFFFF');
    doc.text('Grand Total:', 370, y + 4, { width: 90, align: 'right' });
    doc.text(`₹ ${totalRupees.toLocaleString('en-IN')}`, 470, y + 4, { width: 75, align: 'right' });

    y += 35;
    // Terms & Conditions
    if (quotation.termsAndConditions && quotation.termsAndConditions.length > 0) {
      doc.fillColor('#0F1E36').fontSize(9).font('Helvetica-Bold').text('Terms & Conditions:', 40, y);
      y += 14;
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica');
      quotation.termsAndConditions.forEach((term, idx) => {
        doc.text(`${idx + 1}. ${term}`, 45, y, { width: 320 });
        y += 12;
      });
    }

    // Signatures
    const sigY = Math.max(y + 20, 720);
    doc.fillColor('#1E293B').fontSize(8).font('Helvetica-Bold');
    doc.text('Client Acceptance Signature', 60, sigY);
    doc.text('For GKA CONSTRUCTION', 400, sigY, { width: 140, align: 'center' });
    doc.font('Helvetica').fontSize(7).fillColor('#64748B');
    doc.text('Authorized Signatory', 400, sigY + 30, { width: 140, align: 'center' });

    doc.end();
    return doc;
  }

  /**
   * Generate Branded Tax Invoice PDF stream
   */
  static generateInvoicePDF(invoice: IInvoiceDocument): InstanceType<typeof PDFDocument> {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    // Header Branding
    doc.fillColor('#0F1E36').fontSize(22).font('Helvetica-Bold').text(GKA_COMPANY.name, 40, 40);
    doc.fillColor('#C59A27').fontSize(10).font('Helvetica-Bold').text(GKA_COMPANY.tagline, 40, 68);
    
    doc.fillColor('#475569').fontSize(8).font('Helvetica')
      .text(`Chennai Branch: ${GKA_COMPANY.chennaiBranch.full}`, 40, 84)
      .text(`Reg. Office: ${GKA_COMPANY.registeredOffice.full}`, 40, 96)
      .text(`GSTIN: ${GKA_COMPANY.gstin} | PAN: ${GKA_COMPANY.pan} | Phone: ${GKA_COMPANY.phoneDisplay}`, 40, 108);

    doc.moveTo(40, 124).lineTo(555, 124).strokeColor('#CBD5E1').lineWidth(1).stroke();

    // Banner
    doc.rect(40, 134, 515, 26).fill('#0F1E36');
    doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text('TAX INVOICE', 48, 142);

    // Meta details
    doc.rect(40, 168, 515, 60).strokeColor('#E2E8F0').lineWidth(1).stroke();
    doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold');
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 50, 176);
    doc.text(`Date of Issue: ${new Date(invoice.issueDate).toLocaleDateString('en-IN')}`, 50, 190);
    doc.text(`Payment Due: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, 50, 204);

    doc.text(`Billed To: ${invoice.clientName}`, 300, 176);
    doc.font('Helvetica').fillColor('#475569');
    doc.text(`Address: ${invoice.billingAddress || 'Tamil Nadu, India'}`, 300, 190, { width: 240 });
    doc.text(`Project: ${invoice.projectTitle}`, 300, 204);

    // Items table
    let y = 240;
    doc.rect(40, y, 515, 20).fill('#F1F5F9');
    doc.fillColor('#0F1E36').fontSize(8).font('Helvetica-Bold');
    doc.text('#', 48, y + 6, { width: 20 });
    doc.text('Description of Work / Stage', 72, y + 6, { width: 250 });
    doc.text('Qty', 330, y + 6, { width: 40, align: 'right' });
    doc.text('Unit', 375, y + 6, { width: 40 });
    doc.text('Rate (₹)', 420, y + 6, { width: 55, align: 'right' });
    doc.text('Amount (₹)', 485, y + 6, { width: 60, align: 'right' });

    y += 24;
    doc.font('Helvetica').fontSize(8).fillColor('#334155');

    invoice.items.forEach((item, index) => {
      doc.text(`${index + 1}`, 48, y, { width: 20 });
      doc.text(item.description, 72, y, { width: 250 });
      doc.text(`${item.quantity}`, 330, y, { width: 40, align: 'right' });
      doc.text(item.unit, 375, y, { width: 40 });
      doc.text(`${toRupees(item.unitPricePaise).toLocaleString('en-IN')}`, 420, y, { width: 55, align: 'right' });
      doc.text(`${toRupees(item.totalPaise).toLocaleString('en-IN')}`, 485, y, { width: 60, align: 'right' });
      y += 20;
    });

    doc.moveTo(40, y).lineTo(555, y).strokeColor('#E2E8F0').lineWidth(1).stroke();
    y += 10;

    // Totals
    const subtotalRupees = toRupees(invoice.subtotalPaise);
    const cgstRupees = toRupees(invoice.cgstPaise);
    const sgstRupees = toRupees(invoice.sgstPaise);
    const totalRupees = toRupees(invoice.totalAmountPaise);
    const paidRupees = toRupees(invoice.paidAmountPaise);
    const balanceRupees = toRupees(invoice.dueAmountPaise);

    doc.font('Helvetica').fontSize(9).fillColor('#475569');
    doc.text('Subtotal:', 380, y, { width: 80, align: 'right' });
    doc.text(`₹ ${subtotalRupees.toLocaleString('en-IN')}`, 470, y, { width: 75, align: 'right' });
    y += 14;

    if (cgstRupees > 0 || sgstRupees > 0) {
      doc.text('CGST (9%):', 380, y, { width: 80, align: 'right' });
      doc.text(`₹ ${cgstRupees.toLocaleString('en-IN')}`, 470, y, { width: 75, align: 'right' });
      y += 14;
      doc.text('SGST (9%):', 380, y, { width: 80, align: 'right' });
      doc.text(`₹ ${sgstRupees.toLocaleString('en-IN')}`, 470, y, { width: 75, align: 'right' });
      y += 14;
    }

    doc.rect(360, y - 2, 195, 20).fill('#0F1E36');
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
    doc.text('Total Invoice Value:', 370, y + 4, { width: 90, align: 'right' });
    doc.text(`₹ ${totalRupees.toLocaleString('en-IN')}`, 470, y + 4, { width: 75, align: 'right' });
    y += 24;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#16A34A');
    doc.text('Paid to Date:', 380, y, { width: 80, align: 'right' });
    doc.text(`₹ ${paidRupees.toLocaleString('en-IN')}`, 470, y, { width: 75, align: 'right' });
    y += 16;

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#DC2626');
    doc.text('Balance Due:', 380, y, { width: 80, align: 'right' });
    doc.text(`₹ ${balanceRupees.toLocaleString('en-IN')}`, 470, y, { width: 75, align: 'right' });

    // Bank Details Block
    y += 30;
    doc.rect(40, y, 280, 85).fill('#F8FAFC').stroke('#CBD5E1').lineWidth(1).stroke();
    doc.fillColor('#0F1E36').fontSize(9).font('Helvetica-Bold').text('Bank Account Details for NEFT / RTGS / IMPS:', 50, y + 8);
    doc.font('Helvetica').fontSize(8).fillColor('#334155');
    doc.text(`Bank Name: ${invoice.bankDetails.bankName}`, 50, y + 24);
    doc.text(`Account Name: ${invoice.bankDetails.accountName}`, 50, y + 36);
    doc.text(`Account No: ${invoice.bankDetails.accountNumber}`, 50, y + 48);
    doc.text(`IFSC Code: ${invoice.bankDetails.ifscCode} | Branch: ${invoice.bankDetails.branch}`, 50, y + 60);
    doc.text(`UPI ID: ${invoice.bankDetails.upiId}`, 50, y + 72);

    // Signatures
    const sigY = 720;
    doc.fillColor('#1E293B').fontSize(8).font('Helvetica-Bold');
    doc.text('For GKA CONSTRUCTION', 400, sigY, { width: 140, align: 'center' });
    doc.font('Helvetica').fontSize(7).fillColor('#64748B');
    doc.text('Authorized Signatory', 400, sigY + 30, { width: 140, align: 'center' });

    doc.end();
    return doc;
  }
}
