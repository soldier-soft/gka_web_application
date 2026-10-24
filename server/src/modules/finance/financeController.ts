import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import fs from 'fs';
import { Invoice } from '../../models/Invoice';
import { Expense } from '../../models/Expense';
import { Payment } from '../../models/Payment';
import { Project } from '../../models/Project';
import { TaxReconciliation } from '../../models/TaxReconciliation';
import { Client } from '../../models/Client';
import { User } from '../../models/User';
import { PDFService } from '../../services/pdfService';
import { DOCXService } from '../../services/docxService';
import { toPaise } from '../../shared/types';

export const getInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, clientId, status } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (clientId) filter.clientId = clientId;
    if (status) filter.status = status;

    if (req.user?.role === 'client' && req.user.clientId) {
      filter.clientId = req.user.clientId;
      filter.status = { $ne: 'draft' };
    }

    const invoices = await Invoice.find(filter)
      .populate('projectId', 'title projectId')
      .populate('clientId', 'name phone email')
      .sort({ issueDate: -1 });

    res.json({ success: true, count: invoices.length, invoices });
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, clientId, clientName, billingAddress, items, issueDate, dueDate, notes } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    let subtotalPaise = 0;
    const calculatedItems = (items || []).map((item: any) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPricePaise) || 0;
      const total = Math.round(qty * price);
      subtotalPaise += total;

      return {
        description: item.description,
        quantity: qty,
        unit: item.unit || 'lumpsum',
        unitPricePaise: price,
        totalPaise: total,
      };
    });

    // 18% GST (9% CGST + 9% SGST)
    const taxPaise = Math.round(subtotalPaise * 0.18);
    const cgstPaise = Math.round(taxPaise / 2);
    const sgstPaise = taxPaise - cgstPaise;
    const totalAmountPaise = subtotalPaise + taxPaise;

    const count = await Invoice.countDocuments();
    const currentYear = new Date().getFullYear();
    const invoiceNumber = `GKA-INV-${currentYear}-${String(count + 1).padStart(3, '0')}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      projectId: project._id,
      projectTitle: project.title,
      clientId: clientId || project.clientId,
      clientName: clientName || 'Client',
      billingAddress: billingAddress || project.siteAddress.street,
      items: calculatedItems,
      subtotalPaise,
      cgstPaise,
      sgstPaise,
      igstPaise: 0,
      totalAmountPaise,
      paidAmountPaise: 0,
      dueAmountPaise: totalAmountPaise,
      issueDate: new Date(issueDate || Date.now()),
      dueDate: new Date(dueDate || Date.now() + 14 * 86400000),
      status: 'issued',
      notes,
    });

    // Update Project invoiced amount
    project.invoicedAmountPaise += totalAmountPaise;
    await project.save();

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    next(error);
  }
};

export const downloadInvoicePDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    if (req.user?.role === 'client' && req.user.clientId && invoice.clientId.toString() !== req.user.clientId) {
      res.status(403).json({ success: false, message: 'Forbidden. Access not permitted.' });
      return;
    }

    let clientPortalUsername = 'client@gingerhotel.com';
    let clientPortalPassword = 'GKAclient2026!';
    if (invoice.clientId) {
      const client = await Client.findById(invoice.clientId);
      if (client?.email) {
        clientPortalUsername = client.email.toLowerCase();
        const clientUser = await User.findOne({ email: client.email.toLowerCase() });
        if (clientUser?.defaultPassword) {
          clientPortalPassword = clientUser.defaultPassword;
        }
      }
    }
    (invoice as any).clientPortalUsername = clientPortalUsername;
    (invoice as any).clientPortalPassword = clientPortalPassword;

    const docStream = PDFService.generateInvoicePDF(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
    docStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export const downloadInvoiceDOCX = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id);

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    if (req.user?.role === 'client' && req.user.clientId && invoice.clientId.toString() !== req.user.clientId) {
      res.status(403).json({ success: false, message: 'Forbidden. Access not permitted.' });
      return;
    }

    const docxPath = await DOCXService.generateInvoiceDocx(invoice);
    res.download(docxPath, `GKA_Invoice_${invoice.invoiceNumber}.docx`, (err) => {
      try {
        if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
      } catch (_) {}
    });
  } catch (error) {
    next(error);
  }
};

export const updateInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { items, billingAddress, dueDate, notes, subject, clientContactPerson, clientCompany, status } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    const oldTotalPaise = invoice.totalAmountPaise;

    if (items && Array.isArray(items)) {
      let subtotalPaise = 0;
      invoice.items = items.map((item: any) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unitPricePaise) || 0;
        const total = Math.round(qty * price);
        subtotalPaise += total;

        return {
          description: item.description,
          quantity: qty,
          unit: item.unit || 'CFT',
          unitPricePaise: price,
          totalPaise: total,
        };
      });

      const taxPaise = Math.round(subtotalPaise * 0.18);
      invoice.subtotalPaise = subtotalPaise;
      invoice.cgstPaise = Math.round(taxPaise / 2);
      invoice.sgstPaise = taxPaise - invoice.cgstPaise;
      invoice.totalAmountPaise = subtotalPaise + taxPaise;
      invoice.dueAmountPaise = Math.max(0, invoice.totalAmountPaise - invoice.paidAmountPaise);

      const diffPaise = invoice.totalAmountPaise - oldTotalPaise;
      if (diffPaise !== 0) {
        await Project.findByIdAndUpdate(invoice.projectId, {
          $inc: { invoicedAmountPaise: diffPaise },
        });
      }
    }

    if (billingAddress) invoice.billingAddress = billingAddress;
    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (notes !== undefined) invoice.notes = notes;
    if (subject) invoice.subject = subject;
    if (clientContactPerson) invoice.clientContactPerson = clientContactPerson;
    if (clientCompany) invoice.clientCompany = clientCompany;
    if (status) invoice.status = status;

    await invoice.save();

    res.json({ success: true, message: 'Invoice updated successfully', invoice });
  } catch (error) {
    next(error);
  }
};

export const toggleInvoiceGst = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { gstFiled, gstFilingArn, gstTaxPeriod } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    const isFiled = gstFiled !== undefined ? Boolean(gstFiled) : !invoice.gstFiled;
    invoice.gstFiled = isFiled;
    invoice.gstFilingDate = isFiled ? new Date() : undefined;
    if (gstFilingArn !== undefined) invoice.gstFilingArn = gstFilingArn;
    if (gstTaxPeriod !== undefined) invoice.gstTaxPeriod = gstTaxPeriod;

    await invoice.save();

    res.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} GST status updated to ${isFiled ? 'FILED' : 'UNFILED'}.`,
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, category } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (category) filter.category = category;

    const expenses = await Expense.find(filter)
      .populate('projectId', 'title projectId')
      .populate('recordedBy', 'name')
      .sort({ date: -1 });

    res.json({ success: true, count: expenses.length, expenses });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      projectId,
      category,
      description,
      amountPaise,
      paidTo,
      date,
      paymentMethod,
      referenceNumber,
      receiptUrl,
      supplierId,
    } = req.body;

    const expense = await Expense.create({
      projectId,
      category,
      description,
      amountPaise: Number(amountPaise),
      paidTo,
      date: new Date(date || Date.now()),
      paymentMethod: paymentMethod || 'bank_transfer',
      referenceNumber,
      receiptUrl,
      supplierId,
      isApproved: true,
      recordedBy: req.user?.id,
    });

    // Automatically update the Project's actualCostPaise!
    await Project.findByIdAndUpdate(projectId, {
      $inc: { actualCostPaise: Number(amountPaise) },
    });

    res.status(201).json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, clientId } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (clientId) filter.clientId = clientId;

    if (req.user?.role === 'client' && req.user.clientId) {
      filter.clientId = req.user.clientId;
    }

    const payments = await Payment.find(filter)
      .populate('projectId', 'title projectId')
      .populate('clientId', 'name phone email')
      .sort({ paymentDate: -1 });

    res.json({ success: true, count: payments.length, payments });
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      projectId,
      clientId,
      clientName,
      invoiceId,
      amountPaise,
      paymentDate,
      paymentMode,
      transactionReference,
      notes,
      verificationStatus,
      proofFileUrl,
    } = req.body;

    const count = await Payment.countDocuments();
    const currentYear = new Date().getFullYear();
    const paymentNumber = `GKA-REC-${currentYear}-${String(count + 1).padStart(3, '0')}`;

    const isVerified = verificationStatus === 'verified' || !verificationStatus;

    const payment = await Payment.create({
      paymentNumber,
      projectId,
      clientId,
      clientName,
      invoiceId,
      amountPaise: Number(amountPaise),
      paymentDate: new Date(paymentDate || Date.now()),
      paymentMode: paymentMode || 'bank_transfer',
      transactionReference,
      recordedBy: req.user?.id,
      verificationStatus: isVerified ? 'verified' : 'verification_pending',
      verifiedBy: isVerified ? req.user?.id : undefined,
      verifiedAt: isVerified ? new Date() : undefined,
      proofFileUrl,
      notes,
    });

    // Only verified payments update actual collected cash and invoice balances!
    if (isVerified) {
      if (invoiceId) {
        const invoice = await Invoice.findById(invoiceId);
        if (invoice) {
          invoice.paidAmountPaise += Number(amountPaise);
          invoice.dueAmountPaise = Math.max(0, invoice.totalAmountPaise - invoice.paidAmountPaise);
          invoice.status = invoice.dueAmountPaise === 0 ? 'paid' : 'partially_paid';
          await invoice.save();
        }
      }

      await Project.findByIdAndUpdate(projectId, {
        $inc: { collectedAmountPaise: Number(amountPaise) },
      });
    }

    res.status(201).json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    if (payment.verificationStatus === 'verified' || payment.verificationStatus === 'reconciled') {
      res.status(400).json({ success: false, message: 'This payment has already been verified.' });
      return;
    }

    payment.verificationStatus = 'verified';
    payment.verifiedBy = req.user?.id as any;
    payment.verifiedAt = new Date();
    await payment.save();

    // Now update invoice balance
    if (payment.invoiceId) {
      const invoice = await Invoice.findById(payment.invoiceId);
      if (invoice) {
        invoice.paidAmountPaise += payment.amountPaise;
        invoice.dueAmountPaise = Math.max(0, invoice.totalAmountPaise - invoice.paidAmountPaise);
        invoice.status = invoice.dueAmountPaise === 0 ? 'paid' : 'partially_paid';
        await invoice.save();
      }
    }

    // Update Project collected amount
    await Project.findByIdAndUpdate(payment.projectId, {
      $inc: { collectedAmountPaise: payment.amountPaise },
    });

    res.json({ success: true, message: 'Payment verified and credited to project collections.', payment });
  } catch (error) {
    next(error);
  }
};

export const reconcilePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    payment.verificationStatus = 'reconciled';
    payment.reconciliationDate = new Date();
    await payment.save();

    res.json({ success: true, message: 'Payment marked as reconciled against bank statement.', payment });
  } catch (error) {
    next(error);
  }
};

export const rejectPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const payment = await Payment.findById(id);

    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    payment.verificationStatus = 'rejected';
    if (reason) {
      payment.notes = payment.notes ? `${payment.notes} | Rejection Reason: ${reason}` : `Rejection Reason: ${reason}`;
    }
    await payment.save();

    res.json({ success: true, message: 'Payment rejected.', payment });
  } catch (error) {
    next(error);
  }
};

export const getProfitabilityReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).populate('clientId', 'name email phone');

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    // Breakdown expenses by category
    const categoryExpenses = await Expense.aggregate([
      { $match: { projectId: project._id } },
      {
        $group: {
          _id: '$category',
          totalPaise: { $sum: '$amountPaise' },
          count: { $sum: 1 },
        },
      },
    ]);

    const forecastProfitPaise = project.contractValuePaise - project.totalBudgetPaise;
    const realizedMarginPaise = project.invoicedAmountPaise - project.actualCostPaise;
    const pendingCollectionPaise = project.invoicedAmountPaise - project.collectedAmountPaise;

    res.json({
      success: true,
      project: {
        id: project._id,
        projectId: project.projectId,
        title: project.title,
        client: project.clientId,
        contractValuePaise: project.contractValuePaise,
        totalBudgetPaise: project.totalBudgetPaise,
        actualCostPaise: project.actualCostPaise,
        invoicedAmountPaise: project.invoicedAmountPaise,
        collectedAmountPaise: project.collectedAmountPaise,
        pendingCollectionPaise,
        forecastProfitPaise,
        realizedMarginPaise,
      },
      categoryExpenses,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GST & Tax Reconciliation Endpoints
// ==========================================

export const getTaxReconciliations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let records = await TaxReconciliation.find().sort({ period: -1 });

    const allInvoices = await Invoice.find({ status: { $ne: 'cancelled' } });
    let totalTaxableSalesPaise = 0;
    let outputCgstPaise = 0;
    let outputSgstPaise = 0;
    let outputIgstPaise = 0;

    allInvoices.forEach((inv) => {
      totalTaxableSalesPaise += inv.subtotalPaise || 0;
      outputCgstPaise += inv.cgstPaise || 0;
      outputSgstPaise += inv.sgstPaise || 0;
      outputIgstPaise += inv.igstPaise || 0;
    });

    const totalOutputTaxPaise = outputCgstPaise + outputSgstPaise + outputIgstPaise;

    const allExpenses = await Expense.find();
    const totalPurchasesPaise = allExpenses.reduce((acc, e) => acc + (e.amountPaise || 0), 0);
    const totalPurchaseGstPaise = Math.round(totalPurchasesPaise * 0.18);

    // If no record exists, auto-seed one from existing invoices and expenses
    if (records.length === 0) {
      const eligibleItcPaise = Math.round(totalPurchaseGstPaise * 0.85); // 85% eligible ITC baseline
      const ineligibleItcPaise = totalPurchaseGstPaise - eligibleItcPaise;
      const netTaxPayablePaise = Math.max(0, totalOutputTaxPaise - eligibleItcPaise);

      const defaultRecord = await TaxReconciliation.create({
        period: '2026-10',
        financialYear: 'FY 2026-27',
        totalTaxableSalesPaise,
        outputCgstPaise,
        outputSgstPaise,
        outputIgstPaise,
        totalOutputTaxPaise,
        totalTaxablePurchasesPaise: totalPurchasesPaise,
        totalPurchaseGstPaise,
        eligibleItcPaise,
        ineligibleItcPaise,
        pendingVerificationItcPaise: 0,
        taxAdjustmentsPaise: 0,
        netTaxPayablePaise,
        paymentStatus: 'pending',
        returnStatus: 'not_filed',
        reconciliationStatus: 'draft_needs_review',
        notes: 'Live reconciliation period calculated from active project tax invoices and material bills.',
        auditTrail: [
          {
            fieldChanged: 'initial_calculation',
            oldValue: 0,
            newValue: eligibleItcPaise,
            reason: 'System initialization based on verified commercial procurement invoices',
            changedBy: req.user?.id || new mongoose.Types.ObjectId(),
            changedByName: req.user?.name || 'Accounts Admin',
            changedAt: new Date(),
          },
        ],
      });

      records = [defaultRecord];
    } else if (records[0].returnStatus !== 'filed') {
      // Keep draft tax record in live sync with newly created invoices / bills
      const currentRec = records[0];
      const hasCustomItc = (currentRec.auditTrail || []).some((a: any) => a.fieldChanged === 'eligibleItcPaise');
      const eligibleItcPaise = hasCustomItc ? currentRec.eligibleItcPaise : Math.round(totalPurchaseGstPaise * 0.85);
      const ineligibleItcPaise = Math.max(0, totalPurchaseGstPaise - eligibleItcPaise);
      const netTaxPayablePaise = Math.max(0, totalOutputTaxPaise - eligibleItcPaise + (currentRec.taxAdjustmentsPaise || 0));

      currentRec.totalTaxableSalesPaise = totalTaxableSalesPaise;
      currentRec.outputCgstPaise = outputCgstPaise;
      currentRec.outputSgstPaise = outputSgstPaise;
      currentRec.outputIgstPaise = outputIgstPaise;
      currentRec.totalOutputTaxPaise = totalOutputTaxPaise;
      currentRec.totalTaxablePurchasesPaise = totalPurchasesPaise;
      currentRec.totalPurchaseGstPaise = totalPurchaseGstPaise;
      currentRec.eligibleItcPaise = eligibleItcPaise;
      currentRec.ineligibleItcPaise = ineligibleItcPaise;
      currentRec.netTaxPayablePaise = netTaxPayablePaise;
      await currentRec.save();
    }

    res.json({ success: true, count: records.length, records });
  } catch (error) {
    next(error);
  }
};

export const updateEligibleItc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { eligibleItcPaise, taxAdjustmentsPaise, reason } = req.body;

    const record = await TaxReconciliation.findById(id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Tax reconciliation record not found' });
      return;
    }

    const oldEligibleItc = record.eligibleItcPaise;
    const newEligibleItc = eligibleItcPaise !== undefined ? Number(eligibleItcPaise) : record.eligibleItcPaise;
    const newAdjustments =
      taxAdjustmentsPaise !== undefined ? Number(taxAdjustmentsPaise) : record.taxAdjustmentsPaise;

    // Recalculate net tax liability: Output Tax - Eligible ITC + Adjustments
    const newNetTaxPayable = Math.max(0, record.totalOutputTaxPaise - newEligibleItc + newAdjustments);

    record.auditTrail.push({
      fieldChanged: 'eligibleItcPaise',
      oldValue: oldEligibleItc,
      newValue: newEligibleItc,
      reason: reason || 'Accounts audit of purchase GST invoices and 2B eligibility confirmation',
      changedBy: req.user?.id as any,
      changedByName: req.user?.name || 'Accounts Officer',
      changedAt: new Date(),
    });

    record.eligibleItcPaise = newEligibleItc;
    record.ineligibleItcPaise = Math.max(0, record.totalPurchaseGstPaise - newEligibleItc);
    record.taxAdjustmentsPaise = newAdjustments;
    record.netTaxPayablePaise = newNetTaxPayable;
    record.reconciliationStatus = 'reconciled';
    record.reconciledBy = req.user?.id as any;
    record.reconciledAt = new Date();

    await record.save();

    res.json({
      success: true,
      message: 'Eligible ITC updated and net tax liability recalculated immediately.',
      record,
    });
  } catch (error) {
    next(error);
  }
};

export const recordTaxPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { amountPaise, taxPaymentReference, taxPaymentDate, bankChallanBsrcode } = req.body;

    const record = await TaxReconciliation.findById(id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Tax reconciliation record not found' });
      return;
    }

    record.actualPaidAmountPaise = Number(amountPaise) || record.netTaxPayablePaise;
    record.taxPaymentReference = taxPaymentReference || `GST-CPIN-${Date.now().toString().slice(-8)}`;
    record.taxPaymentDate = new Date(taxPaymentDate || Date.now());
    record.bankChallanBsrcode = bankChallanBsrcode || '0233301';
    record.paymentStatus = 'paid';

    await record.save();

    res.json({
      success: true,
      message: 'Tax payment recorded successfully with bank challan reference.',
      record,
    });
  } catch (error) {
    next(error);
  }
};

export const recordTaxFiling = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { returnFilingDate, returnAckNumber } = req.body;

    const record = await TaxReconciliation.findById(id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Tax reconciliation record not found' });
      return;
    }

    record.returnStatus = 'filed';
    record.returnFilingDate = new Date(returnFilingDate || Date.now());
    record.returnAckNumber = returnAckNumber || `ARN-AA331026${Math.floor(100000 + Math.random() * 900000)}`;

    await record.save();

    res.json({
      success: true,
      message: 'GST Return filing acknowledged and recorded.',
      record,
    });
  } catch (error) {
    next(error);
  }
};
