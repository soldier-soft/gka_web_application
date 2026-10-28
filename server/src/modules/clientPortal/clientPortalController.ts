import { Request, Response, NextFunction } from 'express';
import { Project } from '../../models/Project';
import { Milestone } from '../../models/Milestone';
import { SiteReport } from '../../models/SiteReport';
import { Invoice } from '../../models/Invoice';
import { Quotation } from '../../models/Quotation';
import { ProjectDocument } from '../../models/Document';
import { Payment } from '../../models/Payment';
import { ClientFeedback } from '../../models/ClientFeedback';
import { GKA_COMPANY } from '../../shared/constants';
import { User } from '../../models/User';

export const getMyProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let clientId = req.user?.clientId;
    let assignedProjects: any[] = [];

    if (req.user?.id) {
      const dbUser = await User.findById(req.user.id);
      if (dbUser) {
        if (!clientId && dbUser.clientId) {
          clientId = dbUser.clientId.toString();
        }
        if (dbUser.assignedProjects && dbUser.assignedProjects.length > 0) {
          assignedProjects = dbUser.assignedProjects;
        }
      }
    }

    const conditions: any[] = [];
    if (clientId) conditions.push({ clientId });
    if (assignedProjects.length > 0) conditions.push({ _id: { $in: assignedProjects } });

    if (conditions.length === 0) {
      res.json({ success: true, count: 0, projects: [] });
      return;
    }

    const projects = await Project.find({ $or: conditions }).select(
      'projectId title category siteAddress startDate targetEndDate status progressPercent'
    );

    res.json({ success: true, count: projects.length, projects });
  } catch (error) {
    next(error);
  }
};

export const getClientProjectDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    let clientId = req.user?.clientId;
    let assignedProjects: any[] = [];

    if (req.user?.id) {
      const dbUser = await User.findById(req.user.id);
      if (dbUser) {
        if (!clientId && dbUser.clientId) clientId = dbUser.clientId.toString();
        if (dbUser.assignedProjects) assignedProjects = dbUser.assignedProjects;
      }
    }

    const isClient = req.user?.role === 'client';
    const authConditions: any[] = [];
    if (isClient) {
      if (clientId) authConditions.push({ clientId });
      if (assignedProjects.length > 0) authConditions.push({ _id: { $in: assignedProjects } });
    }

    const query: any = { _id: id };
    if (isClient && authConditions.length > 0) {
      query.$or = authConditions;
    }

    const project = await Project.findOne(query).select(
      'projectId title category siteAddress scopeOfWork startDate targetEndDate status progressPercent'
    );

    if (!project) {
      res.status(404).json({ success: false, message: 'Authorized project not found.' });
      return;
    }

    // Milestones (Only published to client)
    const milestones = await Milestone.find({
      projectId: project._id,
      isPublishedToClient: true,
    }).sort({ orderIndex: 1 });

    // ONLY published site reports
    const publishedReports = await SiteReport.find({
      projectId: project._id,
      isPublishedToClient: true,
    }).sort({ reportDate: -1 });

    // Client Invoices (Drafts hidden and deleted hidden)
    const invoices = await Invoice.find({
      projectId: project._id,
      isDeleted: { $ne: true },
      status: { $ne: 'draft' },
    }).sort({ issueDate: -1 });

    // Client Payments (including verification pending)
    const payments = await Payment.find({
      projectId: project._id,
    }).sort({ paymentDate: -1 });

    // Approved Quotations (deleted hidden)
    const quotations = await Quotation.find({
      projectId: project._id,
      isDeleted: { $ne: true },
      status: { $in: ['sent', 'approved'] },
    }).sort({ createdAt: -1 });

    // Documents visible to client
    const documents = await ProjectDocument.find({
      projectId: project._id,
      visibleToClient: true,
    }).sort({ createdAt: -1 });

    // Client Feedback & Variation tickets
    const feedbackTickets = await ClientFeedback.find({
      projectId: project._id,
      ...(clientId ? { clientId } : {}),
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      project,
      milestones,
      publishedReports,
      invoices,
      payments,
      quotations,
      documents,
      feedbackTickets,
      bankDetails: GKA_COMPANY.bankDetails,
    });
  } catch (error) {
    next(error);
  }
};

export const submitPaymentNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      projectId,
      invoiceId,
      amountPaise,
      paymentDate,
      paymentMode,
      transactionReference,
      proofFileUrl,
      notes,
    } = req.body;
    const clientId = req.user?.clientId;

    const project = await Project.findOne({
      _id: projectId,
      ...(req.user?.role === 'client' ? { clientId } : {}),
    });

    if (!project) {
      res.status(403).json({ success: false, message: 'Unauthorized project.' });
      return;
    }

    const count = await Payment.countDocuments();
    const currentYear = new Date().getFullYear();
    const paymentNumber = `GKA-REC-${currentYear}-${String(count + 1).padStart(3, '0')}`;

    const payment = await Payment.create({
      paymentNumber,
      projectId: project._id,
      clientId: project.clientId,
      clientName: req.user?.name || 'Client',
      invoiceId,
      amountPaise: Number(amountPaise),
      paymentDate: new Date(paymentDate || Date.now()),
      paymentMode: paymentMode || 'bank_transfer',
      transactionReference,
      verificationStatus: 'verification_pending',
      proofFileUrl,
      notes: notes ? `Client Claim: ${notes}` : 'Client submitted bank transfer notification',
    });

    res.status(201).json({
      success: true,
      message:
        'Payment claim submitted successfully. Status is "Verification Pending" subject to owner bank receipt verification.',
      payment,
    });
  } catch (error) {
    next(error);
  }
};

export const submitFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId, category, subject, message, attachments } = req.body;
    const clientId = req.user?.clientId;

    const project = await Project.findOne({
      _id: projectId,
      ...(req.user?.role === 'client' ? { clientId } : {}),
    });

    if (!project) {
      res.status(403).json({ success: false, message: 'Unauthorized project.' });
      return;
    }

    const count = await ClientFeedback.countDocuments();
    const currentYear = new Date().getFullYear();
    const ticketNumber = `TKT-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    const feedback = await ClientFeedback.create({
      ticketNumber,
      projectId: project._id,
      projectTitle: project.title,
      clientId: project.clientId,
      clientUserId: req.user?.id,
      clientName: req.user?.name || 'Client',
      category: category || 'general_feedback',
      subject,
      message,
      attachments: attachments || [],
      status: 'submitted',
    });

    res.status(201).json({
      success: true,
      message: `Request received with tracking Reference ID: ${ticketNumber}. Our site engineer will review your ticket.`,
      feedback,
    });
  } catch (error) {
    next(error);
  }
};

export const getClientFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectId } = req.query;
    const clientId = req.user?.clientId;
    const filter: any = {};
    if (clientId) filter.clientId = clientId;
    if (projectId) filter.projectId = projectId;

    const tickets = await ClientFeedback.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    next(error);
  }
};
