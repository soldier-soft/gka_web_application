import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { IQuotationDocument } from '../models/Quotation';
import { IInvoiceDocument } from '../models/Invoice';
import { toRupees } from '../shared/constants';

export class DOCXService {
  private static scriptPath = path.resolve(__dirname, '../scripts/gka_document_generator.py');

  /**
   * Generate Quotation DOCX using the python generator script
   */
  static async generateQuotationDocx(quotation: IQuotationDocument): Promise<string> {
    const tempDir = os.tmpdir();
    const tempJsonPath = path.join(tempDir, `gka_quo_${quotation._id}_${Date.now()}.json`);
    const tempDocxPath = path.join(tempDir, `GKA_Quotation_${quotation.quotationNumber}.docx`);

    const clientContact = quotation.clientContactPerson || 'THE CHIEF ENGINEER';
    const clientCompany = quotation.clientCompany || quotation.clientName || 'VIVANTHA HOTEL';
    const clientAddr = quotation.clientAddress || quotation.siteLocation || 'SHOLINGANALUR, CHENNAI.';

    const payload = {
      quotation_number: quotation.quotationNumber,
      date: new Date(quotation.createdAt || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      subject: quotation.subject || `Quotation for Construction Works - ${quotation.projectTitle}`,
      client: {
        contact: clientContact,
        company: clientCompany,
        address_line1: clientAddr.split(',')[0] || clientAddr,
        address_line2: clientAddr.split(',').slice(1).join(',').trim() || '',
      },
      sender: {
        name: quotation.senderName || 'HARI A',
        company: quotation.senderCompany || 'GKA CONSTRUCTION',
      },
      items: quotation.items.map((it: any) => ({
        description: it.description,
        qty: it.quantity,
        unit: (it.unit || 'CFT').toUpperCase(),
        rate: toRupees(it.unitRatePaise),
        amount: toRupees(it.amountPaise),
      })),
      gst_percent: quotation.taxRatePercent || 18,
      is_negotiated: Boolean(quotation.isNegotiated),
      negotiated_discount: toRupees(quotation.negotiatedDiscountPaise || quotation.discountPaise || 0),
      negotiated_notes: quotation.negotiatedNotes || '',
      notes: quotation.notes || '',
      terms_and_conditions: quotation.termsAndConditions || [],
    };

    fs.writeFileSync(tempJsonPath, JSON.stringify(payload, null, 2), 'utf-8');

    return new Promise((resolve, reject) => {
      execFile(
        'python',
        [DOCXService.scriptPath, '--data', tempJsonPath, '--type', 'quotation', '--output', tempDocxPath],
        (error, stdout, stderr) => {
          // Clean up temp JSON
          try {
            if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath);
          } catch (_) {}

          if (error) {
            console.error('Python DOCX Error:', stderr || error.message);
            reject(new Error(`Failed to generate DOCX quotation: ${stderr || error.message}`));
          } else {
            resolve(tempDocxPath);
          }
        }
      );
    });
  }

  /**
   * Generate Invoice / Bill DOCX using the python generator script
   */
  static async generateInvoiceDocx(invoice: IInvoiceDocument): Promise<string> {
    const tempDir = os.tmpdir();
    const tempJsonPath = path.join(tempDir, `gka_inv_${invoice._id}_${Date.now()}.json`);
    const tempDocxPath = path.join(tempDir, `GKA_Invoice_${invoice.invoiceNumber}.docx`);

    const clientContact = invoice.clientContactPerson || 'THE CHIEF ENGINEER';
    const clientCompany = invoice.clientCompany || invoice.clientName || 'VIVANTHA HOTEL';
    const clientAddr = invoice.billingAddress || 'SHOLINGANALUR, CHENNAI.';

    const payload = {
      invoice_number: invoice.invoiceNumber,
      date: new Date(invoice.issueDate || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      subject: invoice.subject || `Tax Invoice for Construction Works - ${invoice.projectTitle}`,
      client: {
        contact: clientContact,
        company: clientCompany,
        address_line1: clientAddr.split(',')[0] || clientAddr,
        address_line2: clientAddr.split(',').slice(1).join(',').trim() || '',
      },
      sender: {
        name: invoice.senderName || 'HARI A',
        company: invoice.senderCompany || 'GKA CONSTRUCTION',
      },
      items: invoice.items.map((it: any) => ({
        description: it.description,
        qty: it.quantity,
        unit: (it.unit || 'CFT').toUpperCase(),
        rate: toRupees(it.unitPricePaise),
        amount: toRupees(it.totalPaise),
      })),
      gst_percent: 18,
      is_negotiated: Boolean(invoice.isNegotiated),
      negotiated_discount: toRupees(invoice.negotiatedDiscountPaise || invoice.discountPaise || 0),
      negotiated_notes: invoice.negotiatedNotes || '',
      notes: invoice.notes || '',
      terms_and_conditions: invoice.termsAndConditions || [],
    };

    fs.writeFileSync(tempJsonPath, JSON.stringify(payload, null, 2), 'utf-8');

    return new Promise((resolve, reject) => {
      execFile(
        'python',
        [DOCXService.scriptPath, '--data', tempJsonPath, '--type', 'invoice', '--output', tempDocxPath],
        (error, stdout, stderr) => {
          // Clean up temp JSON
          try {
            if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath);
          } catch (_) {}

          if (error) {
            console.error('Python DOCX Error:', stderr || error.message);
            reject(new Error(`Failed to generate DOCX invoice: ${stderr || error.message}`));
          } else {
            resolve(tempDocxPath);
          }
        }
      );
    });
  }
}
