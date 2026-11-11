import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Quotation } from '../../models/Quotation';
import { Project } from '../../models/Project';
import { Invoice } from '../../models/Invoice';
import { Client } from '../../models/Client';
import { User } from '../../models/User';
import { Milestone } from '../../models/Milestone';
import {
  STANDARD_RATE_LIBRARY,
  DEFAULT_INVOICE_TERMS,
  STANDARD_MILESTONES,
  formatClientPortalUsername,
} from '../../shared/constants';
import { PDFService } from '../../services/pdfService';
import { DOCXService } from '../../services/docxService';
import { GoogleDriveService } from '../../services/googleDriveService';
import { sendQuotationAlertEmail, sendInvoiceAlertEmail, streamToBuffer } from '../../services/emailService';
import { toPaise } from '../../shared/types';

const generateNextUniqueNumber = async (
  Model: any,
  field: string,
  prefix: string
): Promise<string> => {
  const currentYear = new Date().getFullYear();
  let seq = (await Model.countDocuments()) + 1;
  while (true) {
    const candidate = `${prefix}-${currentYear}-${String(seq).padStart(3, '0')}`;
    const existing = await Model.exists({ [field]: candidate });
    if (!existing) return candidate;
    seq += 1;
  }
};

const escapeRegex = (val: string) => val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const resolveOrCreateClientDoc = async (params: {
  clientId?: any;
  projectId?: any;
  clientName?: string;
  clientCompany?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientGstin?: string;
  clientAddress?: string;
  siteLocation?: string;
}) => {
  const safeClientId =
    params.clientId && mongoose.Types.ObjectId.isValid(String(params.clientId))
      ? String(params.clientId)
      : undefined;
  const safeProjectId =
    params.projectId && mongoose.Types.ObjectId.isValid(String(params.projectId))
      ? String(params.projectId)
      : undefined;

  let clientDoc = safeClientId ? await Client.findById(safeClientId) : null;

  if (!clientDoc && safeProjectId) {
    const projDoc = await Project.findById(safeProjectId);
    if (projDoc?.clientId) {
      clientDoc = await Client.findById(projDoc.clientId);
    }
  }

  const fallbackName = (params.clientName?.trim() || params.clientCompany?.trim() || 'Valued Client');
  const normalizedEmail = (
    params.clientEmail?.trim() || formatClientPortalUsername(fallbackName)
  ).toLowerCase();

  if (!clientDoc) {
    const searchOr: any[] = [{ email: normalizedEmail }];
    if (params.clientName?.trim()) {
      searchOr.push({ name: new RegExp(`^${escapeRegex(params.clientName.trim())}$`, 'i') });
    }
    if (params.clientCompany?.trim()) {
      searchOr.push({ companyName: new RegExp(`^${escapeRegex(params.clientCompany.trim())}$`, 'i') });
    }
    clientDoc = await Client.findOne({ $or: searchOr });
  }

  if (!clientDoc) {
    clientDoc = await Client.create({
      name: fallbackName,
      companyName: params.clientCompany?.trim() || fallbackName,
      email: normalizedEmail,
      phone: params.clientPhone?.trim() || '8838030917',
      billingAddress: {
        street: params.clientAddress?.trim() || params.siteLocation?.trim() || 'Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600130',
        gstin: params.clientGstin?.trim() || undefined,
      },
    });
  }

  return clientDoc;
};

const ensureProjectForQuotation = async (quotation: any) => {
  let project = quotation.projectId ? await Project.findById(quotation.projectId) : null;

  if (!project) {
    const clientDoc = await resolveOrCreateClientDoc({
      clientId: quotation.clientId,
      clientName: quotation.clientName,
      clientCompany: quotation.clientCompany,
      clientEmail: quotation.clientEmail,
      clientPhone: quotation.clientPhone,
      clientGstin: (quotation as any).clientGstin,
      clientAddress: quotation.clientAddress,
      siteLocation: quotation.siteLocation,
    });
    quotation.clientId = clientDoc._id as any;

    const projectIdStr = await generateNextUniqueNumber(Project, 'projectId', 'GKA-PRJ');
    const resolvedTitle =
      quotation.subject ||
      quotation.projectTitle ||
      (quotation.items && quotation.items[0]?.description) ||
      'Civil & Building Construction Works';

    project = await Project.create({
      projectId: projectIdStr,
      title: resolvedTitle,
      category: 'residential',
      clientId: clientDoc._id,
      siteAddress: {
        street: quotation.siteLocation || quotation.clientAddress || 'Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600130',
      },
      scopeOfWork: (quotation.items || []).map((it: any) => it.description).filter(Boolean).slice(0, 10),
      startDate: new Date(),
      targetEndDate: quotation.validUntil || new Date(Date.now() + 180 * 86400000),
      status: 'active',
      progressPercent: 0,
      contractValuePaise: quotation.totalAmountPaise,
      totalBudgetPaise: quotation.subtotalPaise,
      invoicedAmountPaise: 0,
      collectedAmountPaise: 0,
    });

    const milestoneDocs = STANDARD_MILESTONES.map((m, idx) => {
      const pStart = new Date(Date.now() + idx * 25 * 86400000);
      const pEnd = new Date(Date.now() + (idx + 1) * 25 * 86400000);
      return {
        projectId: project!._id,
        code: m.code,
        title: m.title,
        description: m.description,
        plannedStartDate: pStart,
        plannedEndDate: pEnd,
        weightagePercent: m.weightagePercent,
        progressPercent: 0,
        status: 'pending' as const,
        isPublishedToClient: true,
        orderIndex: m.orderIndex,
      };
    });
    await Milestone.insertMany(milestoneDocs);

    const portalEmailCandidate = (clientDoc.email || formatClientPortalUsername(clientDoc.name)).toLowerCase();
    let user = await User.findOne({
      $or: [
        { clientId: clientDoc._id },
        { _id: clientDoc.userId },
        { email: portalEmailCandidate },
        { email: formatClientPortalUsername(clientDoc.name).toLowerCase() },
      ],
    });

    if (!user) {
      const portalUsername = clientDoc.email?.includes('@gkaconstruction.com')
        ? clientDoc.email.toLowerCase()
        : formatClientPortalUsername(clientDoc.name);
      const defaultPassword = 'GKAclient2026!';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);

      user = await User.create({
        name: clientDoc.name,
        email: portalUsername,
        phone: clientDoc.phone || '8838030917',
        passwordHash,
        defaultPassword,
        role: 'client',
        clientId: clientDoc._id,
        assignedProjects: [project._id],
        isActive: true,
      });
      await Client.findByIdAndUpdate(clientDoc._id, { userId: user._id, email: portalUsername });
    } else {
      if (!user.assignedProjects.some((pid: any) => String(pid) === String(project!._id))) {
        user.assignedProjects.push(project._id as any);
      }
      if (!user.clientId) user.clientId = clientDoc._id as any;
      if (!user.defaultPassword) user.defaultPassword = 'GKAclient2026!';
      await user.save();
      await Client.findByIdAndUpdate(clientDoc._id, { userId: user._id });
    }

    quotation.projectId = project._id as any;
    quotation.projectTitle = project.title;
    quotation.convertedToBudget = true;
  } else {
    project.contractValuePaise = quotation.totalAmountPaise;
    project.totalBudgetPaise = quotation.subtotalPaise;
    await project.save();
    quotation.convertedToBudget = true;
  }

  return project;
};

export const getRateLibrary = async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, rates: STANDARD_RATE_LIBRARY });
};

export const getQuotations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Automatic cleanup: permanently purge soft-deleted quotations older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await Quotation.deleteMany({ isDeleted: true, deletedAt: { $lte: thirtyDaysAgo } });

    const { projectId, clientId, status, deleted } = req.query;
    const filter: any = {};
    if (projectId && typeof projectId === 'string') filter.projectId = projectId;
    if (clientId && typeof clientId === 'string') filter.clientId = clientId;
    if (status && typeof status === 'string') filter.status = status;

    if (deleted === 'true') {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = { $ne: true };
    }

    // For clients, restrict to their client ID or assigned projects and hide drafts
    if (req.user?.role === 'client') {
      const orConditions: any[] = [];
      if (req.user.clientId) orConditions.push({ clientId: req.user.clientId });
      if (req.user.assignedProjects && req.user.assignedProjects.length > 0) {
        orConditions.push({ projectId: { $in: req.user.assignedProjects } });
      }
      if (orConditions.length > 0) {
        filter.$or = orConditions;
      }
      filter.status = { $in: ['sent', 'approved', 'revised'] }; // Drafts hidden from client
      filter.isDeleted = { $ne: true };
    }

    const quotations = await Quotation.find(filter)
      .populate('projectId', 'projectId title siteAddress')
      .populate('clientId', 'name email phone companyName billingAddress')
      .sort({ updatedAt: -1, createdAt: -1 });
    res.json({ success: true, count: quotations.length, quotations });
  } catch (error) {
    next(error);
  }
};

export const getQuotationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id)
      .populate('projectId', 'projectId title siteAddress')
      .populate('clientId', 'name email phone companyName billingAddress');
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
      quotationNumber: requestedQuotationNumber,
      projectId,
      leadId,
      clientId,
      clientName,
      clientContactPerson,
      clientCompany,
      clientGstin,
      clientAddress,
      clientEmail,
      clientPhone,
      projectTitle,
      siteLocation,
      subject,
      senderName,
      senderCompany,
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

    const cleanRequestedNum = typeof requestedQuotationNumber === 'string'
      ? requestedQuotationNumber.trim().toUpperCase()
      : '';
    const quotationNumber =
      cleanRequestedNum && !(await Quotation.exists({ quotationNumber: cleanRequestedNum }))
        ? cleanRequestedNum
        : await generateNextUniqueNumber(Quotation, 'quotationNumber', 'GKA-QUO');

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (Number(validDays) || 30));

    const safeClientId =
      clientId && mongoose.Types.ObjectId.isValid(String(clientId))
        ? String(clientId)
        : undefined;
    const safeProjectId =
      projectId && mongoose.Types.ObjectId.isValid(String(projectId))
        ? String(projectId)
        : undefined;
    const safeLeadId =
      leadId && mongoose.Types.ObjectId.isValid(String(leadId))
        ? String(leadId)
        : undefined;

    const clientDoc = await resolveOrCreateClientDoc({
      clientId: safeClientId,
      projectId: safeProjectId,
      clientName,
      clientCompany,
      clientEmail,
      clientPhone,
      clientGstin,
      clientAddress,
      siteLocation,
    });

    const finalClientId = clientDoc._id;
    const finalClientName = (clientName?.trim() || clientDoc.name || 'Valued Client').trim();
    const finalClientCompany = (clientCompany?.trim() || clientDoc.companyName || finalClientName).trim();
    const defaultGstin = (clientGstin?.trim() || clientDoc.billingAddress?.gstin || '').trim() || undefined;
    const resolvedAddress = (clientAddress?.trim() || clientDoc.billingAddress?.street || siteLocation?.trim() || '').trim();
    const resolvedLocation = (siteLocation?.trim() || resolvedAddress || 'Chennai').trim();
    const resolvedTitle = (projectTitle?.trim() || subject?.trim() || 'Civil & Construction Works').trim();

    const quotation = await Quotation.create({
      quotationNumber,
      projectId: safeProjectId,
      leadId: safeLeadId,
      clientId: finalClientId,
      clientName: finalClientName,
      clientContactPerson: clientContactPerson || finalClientName,
      clientCompany: finalClientCompany || 'VIVANTHA HOTEL',
      clientGstin: defaultGstin,
      clientAddress: resolvedAddress,
      clientEmail: clientEmail || clientDoc.email,
      clientPhone: clientPhone || clientDoc.phone,
      projectTitle: resolvedTitle,
      siteLocation: resolvedLocation,
      subject: subject || `Quotation for Construction Works - ${resolvedTitle}`,
      senderName: senderName || 'HARI A',
      senderCompany: senderCompany || 'GKA CONSTRUCTION',
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

    // Background PDF Dispatch & Google Drive synchronization
    setTimeout(async () => {
      try {
        const stream = PDFService.generateQuotationPDF(quotation);
        const chunks: Buffer[] = [];
        stream.on('data', (c) => chunks.push(Buffer.from(c)));
        stream.on('end', async () => {
          const pdfBuffer = Buffer.concat(chunks);

          // 1. Send backup alert email with attached PDF to company emails
          await sendQuotationAlertEmail(quotation, pdfBuffer).catch((mailErr) => {
            console.error('[Quotation] Failed to dispatch quotation alert email:', mailErr);
          });

          // 2. Sync to Google Drive
          await GoogleDriveService.syncQuotationPdf(
            quotation.quotationNumber,
            pdfBuffer,
            quotation.projectId,
            quotation.clientName
          );
        });
      } catch (e) {
        console.warn('[DriveSync/Email] Quotation creation dispatch note:', e);
      }
    }, 100);

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

    // Workflow: Quotation -> Convert to Project (with project title of quotation subject or project scope)
    const project = await ensureProjectForQuotation(quotation);

    await quotation.save();

    // Background alert email dispatch with attached PDF
    setTimeout(async () => {
      try {
        const stream = PDFService.generateQuotationPDF(quotation);
        const buffer = await streamToBuffer(stream);
        await sendQuotationAlertEmail(
          quotation,
          buffer,
          true,
          'Quotation approved and active project workspace initialized'
        );
      } catch (mailErr) {
        console.error('[Quotation] Failed to dispatch quotation approval email:', mailErr);
      }
    }, 100);

    res.json({
      success: true,
      message: 'Quotation approved and converted to active Project successfully.',
      quotation,
      project,
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

    const isLinkedToProject = Boolean(quotation.projectId);
    (quotation as any).isLinkedToProject = isLinkedToProject;

    let clientPortalUsername = formatClientPortalUsername(quotation.clientName);
    let clientPortalPassword = 'GKAclient2026!';

    if (isLinkedToProject) {
      let resolvedClientId = quotation.clientId;
      if (!resolvedClientId && quotation.projectId) {
        const proj = await Project.findById(quotation.projectId);
        if (proj?.clientId) resolvedClientId = proj.clientId;
      }

      if (resolvedClientId) {
        const client = await Client.findById(resolvedClientId);
        if (client) {
          const clientUser = await User.findOne({
            $or: [
              { clientId: client._id },
              { _id: client.userId },
              { email: client.email.toLowerCase() },
            ],
          });
          if (clientUser) {
            clientPortalUsername = clientUser.email;
            if (clientUser.defaultPassword) {
              clientPortalPassword = clientUser.defaultPassword;
            }
          } else if (client.email) {
            clientPortalUsername = client.email.endsWith('@gkaconstruction.com')
              ? client.email.toLowerCase()
              : formatClientPortalUsername(client.name);
          }
        }
      }
    }

    (quotation as any).clientPortalUsername = clientPortalUsername;
    (quotation as any).clientPortalPassword = clientPortalPassword;

    const docStream = PDFService.generateQuotationPDF(quotation);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${quotation.quotationNumber}.pdf"`);

    const chunks: Buffer[] = [];
    docStream.on('data', (c) => chunks.push(Buffer.from(c)));
    docStream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      GoogleDriveService.syncQuotationPdf(
        quotation.quotationNumber,
        buffer,
        quotation.projectId,
        quotation.clientName
      ).catch((err) => console.warn('[DriveSync] Auto-sync quotation PDF note:', err));
    });

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

    const isLinkedToProject = Boolean(quotation.projectId);
    (quotation as any).isLinkedToProject = isLinkedToProject;

    let clientPortalUsername = formatClientPortalUsername(quotation.clientName);
    let clientPortalPassword = 'GKAclient2026!';

    if (isLinkedToProject) {
      let resolvedClientId = quotation.clientId;
      if (!resolvedClientId && quotation.projectId) {
        const proj = await Project.findById(quotation.projectId);
        if (proj?.clientId) resolvedClientId = proj.clientId;
      }

      if (resolvedClientId) {
        const client = await Client.findById(resolvedClientId);
        if (client) {
          const clientUser = await User.findOne({
            $or: [
              { clientId: client._id },
              { _id: client.userId },
              { email: client.email.toLowerCase() },
            ],
          });
          if (clientUser) {
            clientPortalUsername = clientUser.email;
            if (clientUser.defaultPassword) {
              clientPortalPassword = clientUser.defaultPassword;
            }
          } else if (client.email) {
            clientPortalUsername = client.email.endsWith('@gkaconstruction.com')
              ? client.email.toLowerCase()
              : formatClientPortalUsername(client.name);
          }
        }
      }
    }

    (quotation as any).clientPortalUsername = clientPortalUsername;
    (quotation as any).clientPortalPassword = clientPortalPassword;

    const docxPath = await DOCXService.generateQuotationDocx(quotation);
    res.download(docxPath, `GKA_Quotation_${quotation.quotationNumber}.docx`, (err) => {
      try {
        if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
      } catch (_) { }
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

    // Auto-create or resolve project if not yet linked
    const wasMissingProject = !quotation.projectId;
    const project = await ensureProjectForQuotation(quotation);
    if (wasMissingProject) {
      await quotation.save();
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

    const isNegotiated = Boolean(quotation.isNegotiated);
    const negotiatedDiscountPaise = isNegotiated
      ? (quotation.negotiatedDiscountPaise || quotation.discountPaise || 0)
      : 0;
    const negotiatedNotes = isNegotiated ? (quotation.negotiatedNotes || '') : '';

    const taxablePaise = Math.max(0, subtotalPaise - negotiatedDiscountPaise);
    const taxRate = quotation.taxRatePercent || 18;
    const taxPaise = Math.round((taxablePaise * taxRate) / 100);
    const cgstPaise = Math.round(taxPaise / 2);
    const sgstPaise = taxPaise - cgstPaise;
    const totalAmountPaise = taxablePaise + taxPaise;

    const invoiceNumber = await generateNextUniqueNumber(Invoice, 'invoiceNumber', 'GKA-INV');

    const invoiceTerms = [...DEFAULT_INVOICE_TERMS];
    if (isNegotiated && negotiatedNotes) {
      invoiceTerms.push(`Agreed Special Terms: ${negotiatedNotes}`);
    }

    let clientGstin = (quotation as any).clientGstin;
    if (!clientGstin && (quotation.clientId || project.clientId)) {
      const clientDoc = await Client.findById(quotation.clientId || project.clientId);
      if (clientDoc) {
        clientGstin = clientDoc.billingAddress?.gstin;
      }
    }

    const nowDate = new Date();
    const currentTaxPeriod = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      projectId: project._id,
      projectTitle: project.title,
      clientId: quotation.clientId || project.clientId,
      clientName: quotation.clientName,
      clientContactPerson: quotation.clientContactPerson,
      clientCompany: quotation.clientCompany,
      clientGstin,
      billingAddress: quotation.clientAddress || project.siteAddress.street,
      subject: `Tax Invoice for Construction Works - ${project.title}`,
      items: invoiceItems,
      subtotalPaise,
      isNegotiated,
      negotiatedDiscountPaise,
      discountPaise: negotiatedDiscountPaise,
      negotiatedNotes,
      termsAndConditions: invoiceTerms,
      cgstPaise,
      sgstPaise,
      igstPaise: 0,
      totalAmountPaise,
      paidAmountPaise: 0,
      dueAmountPaise: totalAmountPaise,
      issueDate: nowDate,
      dueDate: new Date(dueDate || Date.now() + 14 * 86400000),
      gstTaxPeriod: currentTaxPeriod,
      status: 'issued',
      notes: quotation.notes || (isNegotiated && negotiatedNotes ? `Agreed Special Settlement: ${negotiatedNotes}` : `Converted from Approved Quotation ${quotation.quotationNumber}.`),
    });

    // Update project invoiced amount
    project.invoicedAmountPaise += totalAmountPaise;
    await project.save();

    // Background alert email dispatch with PDF attachment
    setTimeout(async () => {
      try {
        const stream = PDFService.generateInvoicePDF(invoice);
        const buffer = await streamToBuffer(stream);
        await sendInvoiceAlertEmail(invoice, buffer, false);
      } catch (mailErr) {
        console.error('[Invoice] Failed to dispatch invoice conversion alert email:', mailErr);
      }
    }, 100);

    res.status(201).json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} successfully converted to Tax Invoice ${invoice.invoiceNumber}.`,
      invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    const {
      quotationNumber,
      clientName,
      clientCompany,
      clientContactPerson,
      clientGstin,
      clientAddress,
      clientEmail,
      clientPhone,
      projectTitle,
      siteLocation,
      subject,
      senderName,
      senderCompany,
      items,
      discountPaise,
      isNegotiated,
      negotiatedDiscountPaise,
      negotiatedNotes,
      taxRatePercent,
      termsAndConditions,
      status,
      validUntil,
    } = req.body;

    if (items && Array.isArray(items)) {
      let subtotalPaise = 0;
      const calculatedItems = items.map((item: any, idx: number) => {
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

      quotation.items = calculatedItems;
      quotation.subtotalPaise = subtotalPaise;
    }

    const isNeg = isNegotiated !== undefined ? Boolean(isNegotiated) : Boolean(quotation.isNegotiated);
    quotation.isNegotiated = isNeg;

    let disc = 0;
    if (isNeg) {
      disc = negotiatedDiscountPaise !== undefined
        ? Number(negotiatedDiscountPaise)
        : (discountPaise !== undefined ? Number(discountPaise) : (quotation.negotiatedDiscountPaise || quotation.discountPaise || 0));
      quotation.negotiatedDiscountPaise = disc;
      quotation.discountPaise = disc;
      if (negotiatedNotes !== undefined) quotation.negotiatedNotes = negotiatedNotes;
    } else {
      disc = discountPaise !== undefined ? Number(discountPaise) : (quotation.discountPaise || 0);
      quotation.discountPaise = disc;
      quotation.negotiatedDiscountPaise = 0;
      quotation.negotiatedNotes = '';
    }

    const taxableAmountPaise = Math.max(0, quotation.subtotalPaise - disc);
    const taxRate = taxRatePercent !== undefined ? Number(taxRatePercent) : (quotation.taxRatePercent || 18);
    quotation.taxRatePercent = taxRate;

    const totalTaxPaise = Math.round((taxableAmountPaise * taxRate) / 100);
    quotation.cgstPaise = Math.round(totalTaxPaise / 2);
    quotation.sgstPaise = totalTaxPaise - quotation.cgstPaise;
    quotation.igstPaise = 0;
    quotation.totalAmountPaise = taxableAmountPaise + totalTaxPaise;

    if (quotationNumber) quotation.quotationNumber = quotationNumber;
    if (clientName) quotation.clientName = clientName;
    if (clientCompany !== undefined) quotation.clientCompany = clientCompany;
    if (clientContactPerson !== undefined) quotation.clientContactPerson = clientContactPerson;
    if (clientGstin !== undefined) quotation.clientGstin = clientGstin;
    if (clientAddress !== undefined) quotation.clientAddress = clientAddress;
    if (clientEmail !== undefined) quotation.clientEmail = clientEmail;
    if (clientPhone !== undefined) quotation.clientPhone = clientPhone;
    if (projectTitle) quotation.projectTitle = projectTitle;
    if (siteLocation !== undefined) quotation.siteLocation = siteLocation;
    if (subject !== undefined) quotation.subject = subject;
    if (senderName !== undefined) quotation.senderName = senderName;
    if (senderCompany !== undefined) quotation.senderCompany = senderCompany;
    if (status !== undefined) quotation.status = status;
    if (validUntil) quotation.validUntil = new Date(validUntil);

    if (req.body.clientId) {
      quotation.clientId = req.body.clientId;
    }

    if (req.body.projectId !== undefined) {
      quotation.projectId = req.body.projectId || undefined;
      if (req.body.projectId) {
        const proj = await Project.findById(req.body.projectId);
        if (proj) {
          if (!projectTitle) quotation.projectTitle = proj.title;
          if (!siteLocation && proj.siteAddress) {
            quotation.siteLocation = `${proj.siteAddress.street || ''}, ${proj.siteAddress.city || ''}`.trim().replace(/^,/, '');
          }
        }
      }
    }

    await quotation.save();

    // Background alert email dispatch with PDF attachment for quotation update
    setTimeout(async () => {
      try {
        const stream = PDFService.generateQuotationPDF(quotation);
        const buffer = await streamToBuffer(stream);
        await sendQuotationAlertEmail(
          quotation,
          buffer,
          true,
          'Quotation parameters or line items updated'
        );
      } catch (mailErr) {
        console.error('[Quotation] Failed to dispatch quotation update alert email:', mailErr);
      }
    }, 100);

    res.json({ success: true, message: 'Quotation updated successfully', quotation });
  } catch (error) {
    next(error);
  }
};

export const deleteQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    quotation.isDeleted = true;
    quotation.deletedAt = new Date();
    await quotation.save();

    res.json({
      success: true,
      message: 'Quotation moved to Recycle Bin. It will be automatically removed after 30 days unless restored.',
      quotation,
    });
  } catch (error) {
    next(error);
  }
};

export const restoreQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);
    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    quotation.isDeleted = false;
    quotation.deletedAt = undefined as any;
    await quotation.save();

    res.json({
      success: true,
      message: 'Quotation restored from Recycle Bin successfully.',
      quotation,
    });
  } catch (error) {
    next(error);
  }
};

export const permanentDeleteQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findByIdAndDelete(id);
    if (!quotation) {
      res.status(404).json({ success: false, message: 'Quotation not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Quotation permanently removed from database.',
    });
  } catch (error) {
    next(error);
  }
};
