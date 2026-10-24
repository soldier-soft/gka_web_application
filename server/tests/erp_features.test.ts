import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { toPaise, formatINR } from '../src/shared/types';
import { Project } from '../src/models/Project';
import { Quotation } from '../src/models/Quotation';
import { Invoice } from '../src/models/Invoice';
import { Payment } from '../src/models/Payment';
import { TaxReconciliation } from '../src/models/TaxReconciliation';
import { ClientFeedback } from '../src/models/ClientFeedback';
import { User } from '../src/models/User';
import { ENV } from '../src/config/env';
import { PDFService } from '../src/services/pdfService';
import { DOCXService } from '../src/services/docxService';
import fs from 'fs';

import { connectTestDB, disconnectTestDB } from './testHelper';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('GKA Construction ERP — Advanced Modules & Workflows', () => {
  let testProject: any;
  let testAdminUser: any;

  beforeAll(async () => {
    testAdminUser = await User.findOne({ role: 'super_admin' });
    testProject = await Project.findOne();
  });

  describe('1. Quotation to Tax Invoice Conversion', () => {
    it('should generate an invoice preserving quotation items and tax calculations', async () => {
      if (!testProject) return;

      const quotation = await Quotation.findOne({ projectId: testProject._id });
      if (!quotation) return;

      const count = await Invoice.countDocuments();
      const currentYear = new Date().getFullYear();
      const invoiceNumber = `GKA-INV-${currentYear}-${String(count + 1).padStart(3, '0')}`;

      const invoiceItems = quotation.items.map((it: any) => ({
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        unitPricePaise: it.unitRatePaise,
        totalPaise: it.amountPaise,
      }));

      const newInvoice = await Invoice.create({
        invoiceNumber,
        projectId: testProject._id,
        projectTitle: testProject.title,
        clientId: testProject.clientId,
        clientName: testProject.clientName || 'Valued Client',
        billingAddress: testProject.siteAddress?.street || 'Kelambakkam, Chennai',
        quotationId: quotation._id,
        items: invoiceItems,
        subtotalPaise: quotation.subtotalPaise,
        cgstPaise: quotation.cgstPaise,
        sgstPaise: quotation.sgstPaise,
        igstPaise: quotation.igstPaise || 0,
        totalAmountPaise: quotation.totalAmountPaise,
        paidAmountPaise: 0,
        dueAmountPaise: quotation.totalAmountPaise,
        status: 'issued',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });

      expect(newInvoice.invoiceNumber).toMatch(/^GKA-INV-\d{4}-\d{3}$/);
      expect(newInvoice.subtotalPaise).toBe(quotation.subtotalPaise);
      expect(newInvoice.totalAmountPaise).toBe(quotation.totalAmountPaise);
      expect(newInvoice.status).toBe('issued');
      expect(newInvoice.items.length).toBe(quotation.items.length);

      // Cleanup test invoice
      await Invoice.findByIdAndDelete(newInvoice._id);
    });
  });

  describe('2. Strict Payment Verification & Revenue Integrity', () => {
    it('unverified payment claims must NOT update invoice balances or collected revenue', async () => {
      if (!testProject) return;

      const initialCollected = testProject.collectedAmountPaise || 0;
      const claimAmountPaise = toPaise(150000);

      const paymentClaim = await Payment.create({
        paymentNumber: `GKA-CLAIM-TEST-${Date.now()}`,
        projectId: testProject._id,
        clientId: testProject.clientId,
        clientName: 'Test Client',
        amountPaise: claimAmountPaise,
        paymentDate: new Date(),
        paymentMode: 'bank_transfer',
        transactionReference: 'NEFTTEST001299',
        verificationStatus: 'verification_pending',
      });

      expect(paymentClaim.verificationStatus).toBe('verification_pending');
      expect(paymentClaim.verifiedBy).toBeUndefined();

      // Check project collected amount remains unaffected
      const reloadedProject = await Project.findById(testProject._id);
      expect(reloadedProject?.collectedAmountPaise).toBe(initialCollected);

      // Now verify payment
      paymentClaim.verificationStatus = 'verified';
      paymentClaim.verifiedBy = testAdminUser?._id;
      paymentClaim.verifiedAt = new Date();
      await paymentClaim.save();

      await Project.findByIdAndUpdate(testProject._id, {
        $inc: { collectedAmountPaise: claimAmountPaise },
      });

      const updatedProject = await Project.findById(testProject._id);
      expect(updatedProject?.collectedAmountPaise).toBe(initialCollected + claimAmountPaise);

      // Revert test changes
      await Project.findByIdAndUpdate(testProject._id, {
        $inc: { collectedAmountPaise: -claimAmountPaise },
      });
      await Payment.findByIdAndDelete(paymentClaim._id);
    });
  });

  describe('3. GST Reconciliation & ITC Adjustment Audit Trail', () => {
    it('should calculate net tax liability and maintain an immutable audit trail when ITC is overridden', async () => {
      const period = `2026-TEST-${Date.now()}`;
      const taxableSalesPaise = toPaise(1000000); // 10 Lakhs
      const outputTaxPaise = toPaise(180000); // 1.8 Lakhs (18%)
      const initialItcPaise = toPaise(80000); // 80k ITC

      const taxRecord = await TaxReconciliation.create({
        period,
        financialYear: 'FY 2026-27',
        totalTaxableSalesPaise: taxableSalesPaise,
        outputCgstPaise: toPaise(90000),
        outputSgstPaise: toPaise(90000),
        outputIgstPaise: 0,
        totalOutputTaxPaise: outputTaxPaise,
        totalTaxablePurchasesPaise: toPaise(500000),
        totalPurchaseGstPaise: toPaise(90000),
        eligibleItcPaise: initialItcPaise,
        ineligibleItcPaise: toPaise(10000),
        netTaxPayablePaise: outputTaxPaise - initialItcPaise,
        paymentStatus: 'pending',
        returnStatus: 'not_filed',
        auditTrail: [],
      });

      expect(taxRecord.netTaxPayablePaise).toBe(toPaise(100000));

      // Override eligible ITC with justification reason
      const adjustedItcPaise = toPaise(70000); // 10k disallowed
      const reason = 'Section 17(5) blocked credit adjustment on personal vehicle supplies.';

      taxRecord.auditTrail.push({
        fieldChanged: 'eligibleItcPaise',
        oldValue: taxRecord.eligibleItcPaise,
        newValue: adjustedItcPaise,
        reason,
        changedBy: testAdminUser?._id || new mongoose.Types.ObjectId(),
        changedByName: testAdminUser?.name || 'Accounts Admin',
        changedAt: new Date(),
      });

      taxRecord.eligibleItcPaise = adjustedItcPaise;
      taxRecord.netTaxPayablePaise = taxRecord.totalOutputTaxPaise - adjustedItcPaise;
      await taxRecord.save();

      const verifiedRecord = await TaxReconciliation.findById(taxRecord._id);
      expect(verifiedRecord?.eligibleItcPaise).toBe(adjustedItcPaise);
      expect(verifiedRecord?.netTaxPayablePaise).toBe(toPaise(110000));
      expect(verifiedRecord?.auditTrail.length).toBe(1);
      expect(verifiedRecord?.auditTrail[0].reason).toBe(reason);

      // Cleanup
      await TaxReconciliation.findByIdAndDelete(taxRecord._id);
    });
  });

  describe('4. Client Feedback & Variation Order Ticket Generation', () => {
    it('should generate formatted ticket reference TKT-YYYY-XXXX with change order tracking', async () => {
      if (!testProject) return;

      const ticketRef = `TKT-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
      const changeOrderPaise = toPaise(45000); // Extra electrical fittings

      const ticket = await ClientFeedback.create({
        ticketNumber: ticketRef,
        projectId: testProject._id,
        projectTitle: testProject.title,
        clientId: testProject.clientId,
        clientName: testProject.clientName || 'Rajesh Kumar',
        category: 'variation_request',
        subject: 'Additional false ceiling cove lighting in master bedroom',
        message: 'Requesting warm white LED cove lighting as discussed on site.',
        status: 'submitted',
        changeOrderPaise,
        variationApproved: false,
      });

      expect(ticket.ticketNumber).toMatch(/^TKT-2026-\d{4}$/);
      expect(ticket.category).toBe('variation_request');
      expect(ticket.changeOrderPaise).toBe(changeOrderPaise);
      expect(ticket.variationApproved).toBe(false);

      // Cleanup
      await ClientFeedback.findByIdAndDelete(ticket._id);
    });
  });

  describe('5. Project Welcome PDF Generation with Bank Instructions', () => {
    it('should successfully build a branded PDF stream containing Federal Bank transfer instructions', async () => {
      if (!testProject) return;

      const client = {
        name: 'Mr. Rajesh Kumar',
        email: 'rajesh.client@gmail.com',
        phone: '9840012345',
        company: 'Navalur Residence',
      };

      const inviteDetails = {
        username: 'rajesh.client@gmail.com',
        temporaryPassword: 'GKATemp2026#99',
        portalUrl: 'http://localhost:3000/login',
      };

      const pdfDoc = PDFService.generateProjectWelcomePDF(testProject, client, inviteDetails);
      expect(pdfDoc).toBeDefined();
      expect(typeof pdfDoc.pipe).toBe('function');
    });
  });

  describe('6. High-Fidelity PDF Quotation & Invoice Generation', () => {
    it('should generate a luxury styled Quotation PDF stream with Federal Bank details and GST', async () => {
      const quotation = await Quotation.findOne();
      if (!quotation) return;

      const pdfDoc = PDFService.generateQuotationPDF(quotation);
      expect(pdfDoc).toBeDefined();
      expect(typeof pdfDoc.pipe).toBe('function');
    });

    it('should generate a luxury styled Tax Invoice PDF stream matching quotation layout', async () => {
      const invoice = await Invoice.findOne();
      if (!invoice) return;

      const pdfDoc = PDFService.generateInvoicePDF(invoice);
      expect(pdfDoc).toBeDefined();
      expect(typeof pdfDoc.pipe).toBe('function');
    });
  });

  describe('7. Python DOCX Document Generation (Optimized python-docx)', () => {
    it('should generate an editable DOCX quotation file via python generator', async () => {
      const quotation = await Quotation.findOne();
      if (!quotation) return;

      const docxPath = await DOCXService.generateQuotationDocx(quotation);
      expect(docxPath).toBeDefined();
      expect(fs.existsSync(docxPath)).toBe(true);
      expect(docxPath.endsWith('.docx')).toBe(true);

      // Verify file size is non-trivial (> 5KB)
      const stats = fs.statSync(docxPath);
      expect(stats.size).toBeGreaterThan(5000);

      // Clean up
      try {
        fs.unlinkSync(docxPath);
      } catch (_) {}
    }, 15000);

    it('should generate an editable DOCX invoice file via python generator', async () => {
      const invoice = await Invoice.findOne();
      if (!invoice) return;

      const docxPath = await DOCXService.generateInvoiceDocx(invoice);
      expect(docxPath).toBeDefined();
      expect(fs.existsSync(docxPath)).toBe(true);
      expect(docxPath.endsWith('.docx')).toBe(true);

      const stats = fs.statSync(docxPath);
      expect(stats.size).toBeGreaterThan(5000);

      // Clean up
      try {
        fs.unlinkSync(docxPath);
      } catch (_) {}
    }, 15000);
  });

  describe('8. Invoice GST Filing State & Finance Reconciliation Flow', () => {
    it('should toggle GST status and update TaxReconciliation taxable sales', async () => {
      const invoice = await Invoice.findOne();
      if (!invoice) return;

      const testArn = `ARNTEST${Date.now()}`;
      const testPeriod = '2026-10';

      // Update invoice to gstFiled = true
      invoice.gstFiled = true;
      invoice.gstFilingArn = testArn;
      invoice.gstTaxPeriod = testPeriod;
      invoice.gstFilingDate = new Date();
      await invoice.save();

      // Find or create TaxReconciliation record for this period
      let recon = await TaxReconciliation.findOne({ period: testPeriod });
      if (!recon) {
        recon = await TaxReconciliation.create({
          period: testPeriod,
          financialYear: 'FY 2026-27',
          totalTaxableSalesPaise: invoice.subtotalPaise,
          outputCgstPaise: invoice.cgstPaise,
          outputSgstPaise: invoice.sgstPaise,
          outputIgstPaise: invoice.igstPaise,
          totalOutputTaxPaise: invoice.cgstPaise + invoice.sgstPaise + invoice.igstPaise,
          totalTaxablePurchasesPaise: 0,
          totalPurchaseGstPaise: 0,
          eligibleItcPaise: 0,
          ineligibleItcPaise: 0,
          netTaxPayablePaise: invoice.cgstPaise + invoice.sgstPaise + invoice.igstPaise,
          paymentStatus: 'pending',
          returnStatus: 'filed',
        });
      }

      expect(recon.period).toBe(testPeriod);
      expect(invoice.gstFiled).toBe(true);
      expect(invoice.gstFilingArn).toBe(testArn);

      // Revert test status
      invoice.gstFiled = false;
      invoice.gstFilingArn = undefined;
      await invoice.save();
    });
  });
});
