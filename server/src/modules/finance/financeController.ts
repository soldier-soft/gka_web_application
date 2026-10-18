import { Request, Response, NextFunction } from 'express';
import { Invoice } from '../../models/Invoice';
import { Expense } from '../../models/Expense';
import { Payment } from '../../models/Payment';
import { Project } from '../../models/Project';
import { PDFService } from '../../services/pdfService';
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

    const docStream = PDFService.generateInvoicePDF(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);
    docStream.pipe(res);
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
    } = req.body;

    const count = await Payment.countDocuments();
    const currentYear = new Date().getFullYear();
    const paymentNumber = `GKA-REC-${currentYear}-${String(count + 1).padStart(3, '0')}`;

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
      notes,
    });

    // Update invoice balance if linked to invoice
    if (invoiceId) {
      const invoice = await Invoice.findById(invoiceId);
      if (invoice) {
        invoice.paidAmountPaise += Number(amountPaise);
        invoice.dueAmountPaise = Math.max(0, invoice.totalAmountPaise - invoice.paidAmountPaise);
        if (invoice.dueAmountPaise === 0) {
          invoice.status = 'paid';
        } else {
          invoice.status = 'partially_paid';
        }
        await invoice.save();
      }
    }

    // Update Project collected amount!
    await Project.findByIdAndUpdate(projectId, {
      $inc: { collectedAmountPaise: Number(amountPaise) },
    });

    res.status(201).json({ success: true, payment });
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
