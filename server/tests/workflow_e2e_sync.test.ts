import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { Request, Response } from 'express';
import { connectTestDB, disconnectTestDB } from './testHelper';
import { Client } from '../src/models/Client';
import { Quotation } from '../src/models/Quotation';
import { Project } from '../src/models/Project';
import { Invoice } from '../src/models/Invoice';
import { Payment } from '../src/models/Payment';
import { TaxReconciliation } from '../src/models/TaxReconciliation';
import { Milestone } from '../src/models/Milestone';
import { User } from '../src/models/User';
import { toPaise } from '../src/shared/types';

vi.mock('../src/services/emailService', () => ({
  sendQuotationAlertEmail: vi.fn().mockResolvedValue(true),
  sendInvoiceAlertEmail: vi.fn().mockResolvedValue(true),
  streamToBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-pdf')),
}));

vi.mock('../src/services/googleDriveService', () => ({
  GoogleDriveService: {
    syncQuotationPdf: vi.fn().mockResolvedValue(true),
    syncInvoicePdf: vi.fn().mockResolvedValue(true),
  },
}));

import {
  createQuotation,
  approveQuotation,
  convertToInvoice,
} from '../src/modules/quotations/quotationController';
import {
  moveInvoiceToGst,
  getTaxReconciliations,
  recordTaxFiling,
  recordPayment,
} from '../src/modules/finance/financeController';
import { getDashboardStats } from '../src/modules/projects/projectController';

const createMockRes = () => {
  const res: Partial<Response> & { statusCode: number; body: any } = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this as Response;
    },
    json(payload: any) {
      this.body = payload;
      return this as Response;
    },
  };
  return res;
};

describe('End-to-End Quotation -> Project -> Invoice -> Month-Wise GST -> Payment Counter -> Dashboard Sync', () => {
  let adminUser: any;
  let existingClient: any;
  const createdIds = {
    clients: [] as string[],
    quotations: [] as string[],
    projects: [] as string[],
    invoices: [] as string[],
    payments: [] as string[],
    taxPeriods: [] as string[],
    users: [] as string[],
  };

  beforeAll(async () => {
    await connectTestDB();
    adminUser = await User.findOne({ role: 'super_admin' });
    existingClient = await Client.findOne();
    if (!existingClient) {
      existingClient = await Client.create({
        name: 'Vivanta Test Hospitality',
        companyName: 'Vivanta By Taj Hotel',
        email: `vivanta_test_${Date.now()}@gkaconstruction.com`,
        phone: '9876543210',
        billingAddress: {
          street: 'Sholinganallur, OMR',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600119',
          gstin: '33AAACV1234A1Z5',
        },
      });
      createdIds.clients.push(String(existingClient._id));
    }
  });

  afterAll(async () => {
    await Invoice.deleteMany({ _id: { $in: createdIds.invoices } });
    await Payment.deleteMany({ _id: { $in: createdIds.payments } });
    await Milestone.deleteMany({ projectId: { $in: createdIds.projects } });
    await Quotation.deleteMany({ _id: { $in: createdIds.quotations } });
    await Project.deleteMany({ _id: { $in: createdIds.projects } });
    await TaxReconciliation.deleteMany({ period: { $in: createdIds.taxPeriods } });
    await Client.deleteMany({ _id: { $in: createdIds.clients } });
    await User.deleteMany({ _id: { $in: createdIds.users } });
    await disconnectTestDB();
  });

  it('creates quotation with existing clientId for a different/new project without Path clientId required error, converts to project, converts to invoice, moves to month GST, files ARN & syncs payments + dashboard', async () => {
    const authUser = {
      id: String(adminUser?._id || '507f1f77bcf86cd799439011'),
      name: adminUser?.name || 'Owner Admin',
      role: 'super_admin',
    };

    // 1. Create Quotation using existing clientId with NO pre-selected projectId (standalone/new project)
    const qReq = {
      user: authUser,
      body: {
        clientId: String(existingClient._id),
        clientName: existingClient.name,
        clientCompany: existingClient.companyName || existingClient.name,
        projectTitle: 'Cooling Tower Acoustic Canopy Upgrade',
        siteLocation: 'Vivanta OMR, Sholinganallur, Chennai',
        subject: 'Quotation for New Acoustic Enclosure & Sump Works',
        items: [
          {
            description: 'Structural steel framing & acoustic louvers',
            category: 'civil',
            unit: 'job',
            quantity: 1,
            unitRatePaise: toPaise(100000),
          },
        ],
        taxRatePercent: 18,
      },
    } as unknown as Request;
    const qRes = createMockRes();
    const nextFn = (err?: any) => {
      if (err) throw err;
    };

    await createQuotation(qReq, qRes as Response, nextFn);
    expect(qRes.statusCode).toBe(201);
    expect(qRes.body.success).toBe(true);
    const createdQuo = qRes.body.quotation;
    expect(String(createdQuo.clientId)).toBe(String(existingClient._id));
    expect(createdQuo.projectId).toBeUndefined();
    createdIds.quotations.push(String(createdQuo._id));

    // Also test creating quotation even WITHOUT clientId or projectId (auto-resolves client!)
    const autoClientReq = {
      user: authUser,
      body: {
        clientName: 'Walk-In Unregistered Hospitality Client',
        clientCompany: 'ITC Grand Chola Annex',
        projectTitle: 'Terrace Waterproofing Treatment',
        siteLocation: 'Guindy, Chennai',
        items: [
          {
            description: 'PU Coating Waterproofing',
            category: 'civil',
            unit: 'sq.ft',
            quantity: 500,
            unitRatePaise: toPaise(100),
          },
        ],
      },
    } as unknown as Request;
    const autoClientRes = createMockRes();
    await createQuotation(autoClientReq, autoClientRes as Response, nextFn);
    expect(autoClientRes.statusCode).toBe(201);
    expect(autoClientRes.body.quotation.clientId).toBeTruthy();
    createdIds.quotations.push(String(autoClientRes.body.quotation._id));
    if (autoClientRes.body.quotation.clientId) {
      createdIds.clients.push(String(autoClientRes.body.quotation.clientId));
    }

    // 2. Convert Quotation -> Project (approveQuotation)
    const approveReq = {
      user: authUser,
      params: { id: String(createdQuo._id) },
      body: {},
    } as unknown as Request;
    const approveRes = createMockRes();
    await approveQuotation(approveReq, approveRes as Response, nextFn);
    expect(approveRes.statusCode).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.quotation.status).toBe('approved');
    expect(approveRes.body.quotation.projectId).toBeTruthy();
    const linkedProjectId = String(approveRes.body.quotation.projectId);
    createdIds.projects.push(linkedProjectId);

    // 3. Convert Project-Linked Quotation -> Tax Invoice (convertToInvoice)
    const convertReq = {
      user: authUser,
      params: { id: String(createdQuo._id) },
      body: {},
    } as unknown as Request;
    const convertRes = createMockRes();
    await convertToInvoice(convertReq, convertRes as Response, nextFn);
    expect(convertRes.statusCode).toBe(201);
    expect(convertRes.body.success).toBe(true);
    const createdInvoice = convertRes.body.invoice;
    expect(createdInvoice.totalAmountPaise).toBe(toPaise(118000));
    expect(String(createdInvoice.projectId)).toBe(linkedProjectId);
    createdIds.invoices.push(String(createdInvoice._id));

    // 4. Move Invoice to Month-Wise GST Period & Verify Filing Syncs Invoices + Dashboard
    const testGstMonth = '2026-12';
    createdIds.taxPeriods.push(testGstMonth);
    const moveGstReq = {
      user: authUser,
      body: { invoiceId: String(createdInvoice._id), period: testGstMonth },
    } as unknown as Request;
    const moveGstRes = createMockRes();
    await moveInvoiceToGst(moveGstReq, moveGstRes as Response, nextFn);
    expect(moveGstRes.statusCode).toBe(200);
    expect(moveGstRes.body.invoice.gstTaxPeriod).toBe(testGstMonth);
    expect(moveGstRes.body.record.period).toBe(testGstMonth);

    // Check getTaxReconciliations returns invoicesByPeriod categorized by month
    const listGstReq = { user: authUser } as unknown as Request;
    const listGstRes = createMockRes();
    await getTaxReconciliations(listGstReq, listGstRes as Response, nextFn);
    expect(listGstRes.statusCode).toBe(200);
    expect(Array.isArray(listGstRes.body.invoicesByPeriod[testGstMonth])).toBe(true);
    expect(
      listGstRes.body.invoicesByPeriod[testGstMonth].some(
        (inv: any) => String(inv._id) === String(createdInvoice._id)
      )
    ).toBe(true);

    // File GST with ARN -> should simultaneously update Invoice & TaxReconciliation & Dashboard
    const testArn = `ARN-E2E-${Date.now()}`;
    const fileGstReq = {
      user: authUser,
      params: { id: String(moveGstRes.body.record._id) },
      body: { returnAckNumber: testArn },
    } as unknown as Request;
    const fileGstRes = createMockRes();
    await recordTaxFiling(fileGstReq, fileGstRes as Response, nextFn);
    expect(fileGstRes.statusCode).toBe(200);
    expect(fileGstRes.body.record.returnStatus).toBe('filed');

    const refreshedInvoiceAfterGst = await Invoice.findById(createdInvoice._id);
    expect(refreshedInvoiceAfterGst?.gstFiled).toBe(true);
    expect(refreshedInvoiceAfterGst?.gstFilingArn).toBe(testArn.toUpperCase());

    // 5. Record Payment on Payment Collection Counter WITHOUT specifying invoiceId (FIFO project reconciliation!)
    const partialPaymentPaise = toPaise(50000);
    const payReq = {
      user: authUser,
      body: {
        projectId: linkedProjectId,
        amountPaise: partialPaymentPaise,
        paymentMode: 'upi',
        verificationStatus: 'verified',
      },
    } as unknown as Request;
    const payRes = createMockRes();
    await recordPayment(payReq, payRes as Response, nextFn);
    expect(payRes.statusCode).toBe(201);
    expect(payRes.body.success).toBe(true);
    createdIds.payments.push(String(payRes.body.payment._id));

    const refreshedInvoiceAfterPay = await Invoice.findById(createdInvoice._id);
    expect(refreshedInvoiceAfterPay?.paidAmountPaise).toBe(toPaise(50000));
    expect(refreshedInvoiceAfterPay?.dueAmountPaise).toBe(toPaise(68000));
    expect(refreshedInvoiceAfterPay?.status).toBe('partially_paid');

    const refreshedProject = await Project.findById(linkedProjectId);
    expect(refreshedProject?.invoicedAmountPaise).toBe(toPaise(118000));
    expect(refreshedProject?.collectedAmountPaise).toBe(toPaise(50000));

    // 6. Verify Owner Dashboard Stats include live GST compliance & updated collections/dues
    const dashReq = { user: authUser } as unknown as Request;
    const dashRes = createMockRes();
    await getDashboardStats(dashReq, dashRes as Response, nextFn);
    expect(dashRes.statusCode).toBe(200);
    expect(dashRes.body.stats.collectedPaise).toBeGreaterThanOrEqual(toPaise(50000));
    expect(dashRes.body.stats.gstFiledInvoicesCount).toBeGreaterThanOrEqual(1);
    expect(dashRes.body.stats.latestGstArn).toBeTruthy();
  });
});

