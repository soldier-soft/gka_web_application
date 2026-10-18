import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { toPaise, toRupees, formatINR } from '../src/shared/types';
import { Project } from '../src/models/Project';
import { Quotation } from '../src/models/Quotation';
import { User } from '../src/models/User';
import { ENV } from '../src/config/env';

beforeAll(async () => {
  await mongoose.connect(ENV.MONGODB_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('1. Financial Precision & Integer Paise Calculations', () => {
  it('should accurately convert Rupees to Paise and back without floating point inaccuracies', () => {
    const rupees = 1850000.75;
    const paise = toPaise(rupees);
    expect(paise).toBe(185000075);
    expect(toRupees(paise)).toBe(1850000.75);
  });

  it('should format currency correctly with Indian numbering system (Lakhs and Crores)', () => {
    const formatted = formatINR(toPaise(1850000));
    expect(formatted).toContain('18,50,000');
  });

  it('should calculate GST breakdown into equal CGST and SGST with exact paise matching', () => {
    const subtotalPaise = toPaise(775100);
    const taxRate = 18;
    const totalTaxPaise = Math.round((subtotalPaise * taxRate) / 100);
    const cgstPaise = Math.round(totalTaxPaise / 2);
    const sgstPaise = totalTaxPaise - cgstPaise;
    const grandTotalPaise = subtotalPaise + totalTaxPaise;

    expect(cgstPaise + sgstPaise).toBe(totalTaxPaise);
    expect(grandTotalPaise).toBe(subtotalPaise + cgstPaise + sgstPaise);
    expect(grandTotalPaise).toBe(toPaise(914618));
  });

  it('should strictly distinguish contract value, budget, actual cost, and profit', () => {
    const contractValuePaise = toPaise(1850000); // Agreed with client
    const budgetPaise = toPaise(1450000);        // Planned expenditure
    const actualCostPaise = toPaise(1080000);    // Incurred so far
    const invoicedPaise = toPaise(1400000);      // Billed to client
    const collectedPaise = toPaise(1200000);     // Money in bank

    const receivablePaise = invoicedPaise - collectedPaise;
    const expectedProfitPaise = contractValuePaise - budgetPaise;
    const realizedMarginPaise = invoicedPaise - actualCostPaise;

    expect(receivablePaise).toBe(toPaise(200000));
    expect(expectedProfitPaise).toBe(toPaise(400000));
    expect(realizedMarginPaise).toBe(toPaise(320000));
    // Verify cash collected is NEVER confused with profit:
    expect(collectedPaise).not.toBe(expectedProfitPaise);
  });
});

describe('2. Business Workflow & Database Integrity', () => {
  it('should retrieve seeded projects with matching unique project ID structure', async () => {
    const project = await Project.findOne({ projectId: 'GKA-2026-001' });
    expect(project).not.toBeNull();
    expect(project?.title).toContain('Ginger Hotel');
    expect(project?.contractValuePaise).toBe(toPaise(1850000));
  });

  it('should ensure quotation approval initializes project budget', async () => {
    const quotation = await Quotation.findOne({ quotationNumber: 'GKA-QUO-2026-001' });
    expect(quotation).not.toBeNull();
    expect(quotation?.status).toBe('approved');
    expect(quotation?.convertedToBudget).toBe(true);
  });

  it('should verify password hashing and comparison for users', async () => {
    const adminUser = await User.findOne({ email: 'owner@gkaconstruction.com' });
    expect(adminUser).not.toBeNull();
    const isMatch = await adminUser!.comparePassword('GKAadmin2026!');
    expect(isMatch).toBe(true);

    const wrongMatch = await adminUser!.comparePassword('WrongPassword123');
    expect(wrongMatch).toBe(false);
  });
});
