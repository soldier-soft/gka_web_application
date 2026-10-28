import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { Quotation } from '../../models/Quotation';
import { Project } from '../../models/Project';
import { Invoice } from '../../models/Invoice';
import { Client } from '../../models/Client';
import { User } from '../../models/User';
import { STANDARD_RATE_LIBRARY } from '../../shared/constants';
import { PDFService } from '../../services/pdfService';
import { DOCXService } from '../../services/docxService';
import { toPaise } from '../../shared/types';

export const getRateLibrary = async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, rates: STANDARD_RATE_LIBRARY });
};

export const getQuotations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, clientId, status } = req.query;
    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (clientId) filter.clientId = clientId;
    if (status) filter.status = status;

    // For clients, restrict to their client ID
    if (req.user?.role === 'client' && req.user.clientId) {
      filter.clientId = req.user.clientId;
      filter.status = { $in: ['sent', 'approved', 'revised'] }; // Drafts hidden from client
    }

    const quotations = await Quotation.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: quotations.length, quotations });
  } catch (error) {
    next(error);
  }
};

export const getQuotationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    if (req.user?.role === 'client' && req.user.clientId && quotation.clientId.toString() !== req.user.clientId) {
      res.status(403).json({ success: false, message: 'Forbidden. Access not permitted.' });
      return;
    }

    res.json({ success: true, quotation });
  } catch (error) {
    next(error);
  }
};

export const createQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      projectId,
      leadId,
      clientId,
      clientName,
      clientAddress,
      projectTitle,
      siteLocation,
      items,
      discountPaise,
      isNegotiated,
      negotiatedDiscountPaise,
      negotiatedNotes,
      taxRatePercent,
      termsAndConditions,
      validDays,
    } = req.body;

    // Calculate subtotal from items with integer paise accuracy
    let subtotalPaise = 0;
    const calculatedItems = (items || []).map((item: any, idx: number) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.unitRatePaise) || 0;
      const amountPaise = Math.round(qty * rate);
      subtotalPaise += amountPaise;

      return {
        id: item.id || `item-${idx + 1}`,
        category: item.category || 'civil',
        description: item.description,
        unit: item.unit || 'sq.ft',
        quantity: qty,
        unitRatePaise: rate,
        amountPaise,
        materialCostPaise: item.materialCostPaise || 0,
        labourCostPaise: item.labourCostPaise || 0,
        equipmentCostPaise: item.equipmentCostPaise || 0,
        notes: item.notes,
      };
    });

    const isNeg = Boolean(isNegotiated);
    const disc = isNeg ? (Number(negotiatedDiscountPaise) || Number(discountPaise) || 0) : (Number(discountPaise) || 0);
    const taxableAmountPaise = Math.max(0, subtotalPaise - disc);
    const taxRate = Number(taxRatePercent) || 18;
    const totalTaxPaise = Math.round((taxableAmountPaise * taxRate) / 100);
    const cgstPaise = Math.round(totalTaxPaise / 2);
    const sgstPaise = totalTaxPaise - cgstPaise;
    const totalAmountPaise = taxableAmountPaise + totalTaxPaise;

    const count = await Quotation.countDocuments();
    const currentYear = new Date().getFullYear();
    const quotationNumber = `GKA-QUO-${currentYear}-${String(count + 1).padStart(3, '0')}`;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (Number(validDays) || 30));

    const quotation = await Quotation.create({
      quotationNumber,
      projectId,
      leadId,
      clientId,
      clientName,
      clientAddress: clientAddress || '',
      projectTitle,
      siteLocation,
      items: calculatedItems,
      subtotalPaise,
      discountPaise: disc,
      isNegotiated: isNeg,
      negotiatedDiscountPaise: isNeg ? disc : 0,
      negotiatedNotes: isNeg ? (negotiatedNotes || '') : '',
      cgstPaise,
      sgstPaise,
      igstPaise: 0,
      taxRatePercent: taxRate,
      totalAmountPaise,
      termsAndConditions: termsAndConditions || [
        '50% advance upon agreement signing and site mobilization.',
        '40% progressive billing upon milestone completion (Foundation, Structure, Plastering).',
        '10% upon final testing, inspection and keys handover.',
        'Rates valid for 30 calendar days from the date of quotation.',
      ],
      revisionNumber: 1,
      status: 'draft',
      validUntil,
    });

    res.status(201).json({ success: true, quotation });
  } catch (error) {
    next(error);
  }
};

export const approveQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    quotation.status = 'approved';
    quotation.approvedAt = new Date();
    quotation.approvedBy = req.user?.id as any;
    await quotation.save();

    // If quotation is linked to a project, update project contract value & budget!
    if (quotation.projectId) {
      await Project.findByIdAndUpdate(quotation.projectId, {
        contractValuePaise: quotation.totalAmountPaise,
        totalBudgetPaise: quotation.subtotalPaise, // baseline execution budget
      });
      quotation.convertedToBudget = true;
      await quotation.save();
    }

    res.json({
      success: true,
      message: 'Quotation approved successfully and project budget initialized.',
      quotation,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadQuotationPDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    let clientPortalUsername = 'client@gingerhotel.com';
    let clientPortalPassword = 'GKAclient2026!';
    if (quotation.clientId) {
      const client = await Client.findById(quotation.clientId);
      if (client?.email) {
        clientPortalUsername = client.email.toLowerCase();
        const clientUser = await User.findOne({ email: client.email.toLowerCase() });
        if (clientUser?.defaultPassword) {
          clientPortalPassword = clientUser.defaultPassword;
        }
      }
    }
    (quotation as any).clientPortalUsername = clientPortalUsername;
    (quotation as any).clientPortalPassword = clientPortalPassword;

    const docStream = PDFService.generateQuotationPDF(quotation);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${quotation.quotationNumber}.pdf"`);
    docStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export const downloadQuotationDOCX = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    const docxPath = await DOCXService.generateQuotationDocx(quotation);
    res.download(docxPath, `GKA_Quotation_${quotation.quotationNumber}.docx`, (err) => {
      try {
        if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
      } catch (_) {}
    });
  } catch (error) {
    next(error);
  }
};

export const convertToInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { partialItemIndices, dueDate } = req.body;
    const quotation = await Quotation.findById(id);

    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    if (quotation.status !== 'approved') {
      res.status(400).json({ success: false, message: 'Only approved quotations can be converted to an invoice.' });
      return;
    }

    if (!quotation.projectId) {
      res.status(400).json({ success: false, message: 'Quotation must be linked to an active project before converting to invoice.' });
      return;
    }

    const project = await Project.findById(quotation.projectId);
    if (!project) {
      res.status(404).json({ success: false, message: 'Linked project not found.' });
      return;
    }

    const itemsToConvert =
      partialItemIndices && Array.isArray(partialItemIndices) && partialItemIndices.length > 0
        ? quotation.items.filter((_, idx) => partialItemIndices.includes(idx))
        : quotation.items;

    let subtotalPaise = 0;
    const invoiceItems = itemsToConvert.map((item) => {
      subtotalPaise += item.amountPaise;
      return {
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPricePaise: item.unitRatePaise,
        totalPaise: item.amountPaise,
      };
    });

    const taxRate = quotation.taxRatePercent || 18;
    const taxPaise = Math.round((subtotalPaise * taxRate) / 100);
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
      clientId: quotation.clientId || project.clientId,
      clientName: quotation.clientName,
      billingAddress: quotation.clientAddress || project.siteAddress.street,
      items: invoiceItems,
      subtotalPaise,
      cgstPaise,
      sgstPaise,
      igstPaise: 0,
      totalAmountPaise,
      paidAmountPaise: 0,
      dueAmountPaise: totalAmountPaise,
      issueDate: new Date(),
      dueDate: new Date(dueDate || Date.now() + 14 * 86400000),
      status: 'issued',
      notes: `Converted from Approved Quotation ${quotation.quotationNumber}.`,
    });

    // Update project invoiced amount
    project.invoicedAmountPaise += totalAmountPaise;
    await project.save();

    res.status(201).json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} successfully converted to Tax Invoice ${invoice.invoiceNumber}.`,
      invoice,
    });
  } catch (error) {
    next(error);
  }
};
