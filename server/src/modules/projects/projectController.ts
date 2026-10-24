import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Project } from '../../models/Project';
import { Milestone } from '../../models/Milestone';
import { Expense } from '../../models/Expense';
import { Invoice } from '../../models/Invoice';
import { Payment } from '../../models/Payment';
import { SiteReport } from '../../models/SiteReport';
import { Client } from '../../models/Client';
import { User } from '../../models/User';
import { Quotation } from '../../models/Quotation';
import { ClientFeedback } from '../../models/ClientFeedback';
import { PDFService } from '../../services/pdfService';
import { STANDARD_MILESTONES } from '../../shared/constants';

export const getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, category } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    // If role is client, only allow projects belonging to their client account
    if (req.user?.role === 'client' && req.user.clientId) {
      filter.clientId = req.user.clientId;
    }

    const projects = await Project.find(filter)
      .populate('clientId', 'name email phone companyName')
      .populate('assignedManagerId', 'name email phone')
      .populate('assignedSupervisorId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: projects.length, projects });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id)
      .populate('clientId')
      .populate('assignedManagerId', 'name email phone')
      .populate('assignedSupervisorId', 'name email phone');

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    // Client security check
    if (req.user?.role === 'client' && req.user.clientId && project.clientId._id.toString() !== req.user.clientId) {
      res.status(403).json({ success: false, message: 'Forbidden. Access not permitted.' });
      return;
    }

    const isClientRole = req.user?.role === 'client';

    const milestones = await Milestone.find({
      projectId: project._id,
      ...(isClientRole ? { isPublishedToClient: true } : {}),
    }).sort({ orderIndex: 1 });

    const siteReports = await SiteReport.find({
      projectId: project._id,
      ...(isClientRole ? { isPublishedToClient: true } : {}),
    }).sort({ reportDate: -1 });

    const invoices = await Invoice.find({
      projectId: project._id,
      ...(isClientRole ? { status: { $ne: 'draft' } } : {}),
    }).sort({ issueDate: -1 });

    const payments = await Payment.find({
      projectId: project._id,
      ...(isClientRole ? { verificationStatus: { $in: ['verified', 'reconciled'] } } : {}),
    }).sort({ paymentDate: -1 });

    const quotations = await Quotation.find({
      projectId: project._id,
      ...(isClientRole ? { status: { $in: ['sent', 'approved'] } } : {}),
    }).sort({ createdAt: -1 });

    const clientFeedbacks = await ClientFeedback.find({ projectId: project._id }).sort({ createdAt: -1 });

    // Internal costs (only for internal staff, NEVER exposed to client)
    const expenses = isClientRole
      ? []
      : await Expense.find({ projectId: project._id }).sort({ expenseDate: -1 });

    res.json({
      success: true,
      project,
      milestones,
      recentSiteReports: siteReports,
      invoices,
      payments,
      quotations,
      clientFeedbacks,
      expenses,
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      title,
      category,
      clientId,
      siteAddress,
      scopeOfWork,
      startDate,
      targetEndDate,
      contractValuePaise,
      totalBudgetPaise,
      assignedManagerId,
      assignedSupervisorId,
      notes,
    } = req.body;

    const currentYear = new Date().getFullYear();
    const count = await Project.countDocuments();
    const projectId = `GKA-${currentYear}-${String(count + 1).padStart(3, '0')}`;

    const project = await Project.create({
      projectId,
      title,
      category: category || 'residential',
      clientId,
      siteAddress,
      scopeOfWork: scopeOfWork || [],
      startDate: new Date(startDate || Date.now()),
      targetEndDate: new Date(targetEndDate || Date.now() + 180 * 86400000),
      status: 'planning',
      contractValuePaise: contractValuePaise || 0,
      totalBudgetPaise: totalBudgetPaise || contractValuePaise || 0,
      assignedManagerId: assignedManagerId || req.user?.id,
      assignedSupervisorId,
      notes,
    });

    // Seed default standard milestones
    const milestoneDocs = STANDARD_MILESTONES.map((m) => ({
      projectId: project._id,
      code: m.code,
      title: m.title,
      description: m.description,
      plannedStartDate: project.startDate,
      plannedEndDate: project.targetEndDate,
      weightagePercent: m.weightagePercent,
      progressPercent: 0,
      status: m.orderIndex === 1 ? 'in_progress' : 'pending',
      isPublishedToClient: true,
      orderIndex: m.orderIndex,
    }));
    await Milestone.insertMany(milestoneDocs);

    // Client Account Automation: Link or securely invite client
    let clientAccess: any = null;
    const clientDoc = await Client.findById(clientId);
    if (clientDoc) {
      const existingUser = await User.findOne({ email: clientDoc.email.toLowerCase() });
      if (!existingUser) {
        const rawTempPassword = `GKA@${Math.floor(100000 + Math.random() * 900000)}`;
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(rawTempPassword, salt);
        const activationToken = crypto.randomBytes(24).toString('hex');

        const newUser = await User.create({
          name: clientDoc.name,
          email: clientDoc.email.toLowerCase(),
          phone: clientDoc.phone,
          passwordHash,
          role: 'client',
          clientId: clientDoc._id,
          assignedProjects: [project._id],
          mustChangePasswordOnLogin: true,
          activationToken,
          activationTokenExpires: new Date(Date.now() + 7 * 86400000),
          isActive: true,
        });

        await Client.findByIdAndUpdate(clientDoc._id, { userId: newUser._id });

        clientAccess = {
          username: clientDoc.email,
          tempPassword: rawTempPassword,
          isNewAccount: true,
          activationToken,
          message: 'Client portal account automatically created. Must change password on first login.',
        };
      } else {
        // Link project to existing client user
        if (!existingUser.assignedProjects.includes(project._id as any)) {
          existingUser.assignedProjects.push(project._id as any);
        }
        if (!existingUser.clientId) {
          existingUser.clientId = clientDoc._id as any;
        }
        await existingUser.save();
        await Client.findByIdAndUpdate(clientDoc._id, { userId: existingUser._id });

        clientAccess = {
          username: existingUser.email,
          isNewAccount: false,
          message: 'Existing client account linked to this new project workspace.',
        };
      }
    }

    res.status(201).json({ success: true, project, clientAccess });
  } catch (error) {
    next(error);
  }
};

export const downloadProjectWelcomePDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    const client = await Client.findById(project.clientId);
    if (!client) {
      res.status(404).json({ success: false, message: 'Client record not found' });
      return;
    }

    // Find or automatically create user account for this client with default password
    let user = await User.findOne({ email: client.email.toLowerCase() });
    let defaultPassword = user?.defaultPassword;

    if (!user) {
      const cleanPhoneDigits = (client.phone || '').replace(/\D/g, '').slice(-4);
      defaultPassword = `GKA@${cleanPhoneDigits || '2026'}`;
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);
      user = await User.create({
        name: client.name,
        email: client.email.toLowerCase(),
        phone: client.phone || '8838030917',
        passwordHash,
        defaultPassword,
        role: 'client',
        clientId: client._id,
        assignedProjects: [project._id],
        mustChangePasswordOnLogin: false,
        isActive: true,
      });
      await Client.findByIdAndUpdate(client._id, { userId: user._id });
    } else if (!defaultPassword) {
      defaultPassword = 'GKAclient2026!';
      user.defaultPassword = defaultPassword;
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(defaultPassword, salt);
      await user.save();
    }

    // Ensure project is linked to client user
    if (!user.assignedProjects.includes(project._id as any)) {
      user.assignedProjects.push(project._id as any);
      await user.save();
    }

    // Retrieve attached quotations and invoices for this project
    const quotations = await Quotation.find({ projectId: project._id }).sort({ createdAt: -1 });
    const invoices = await Invoice.find({ projectId: project._id }).sort({ issueDate: -1 });

    const host = req.get('host') || 'localhost:3000';
    const clientHost = host.replace(':5000', ':3000');
    const protocol = req.protocol || 'http';
    const portalUrl = `${protocol}://${clientHost}/login`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=GKA_Project_Welcome_${project.projectId}.pdf`);

    const pdfStream = PDFService.generateProjectWelcomePDF(
      project,
      client,
      {
        portalUrl,
        username: user.email,
        temporaryPassword: defaultPassword,
        defaultPassword,
      },
      quotations,
      invoices
    );

    pdfStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndUpdate(id, req.body, { new: true });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

export const updateMilestone = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { progressPercent, status, actualStartDate, actualEndDate } = req.body;

    const milestone = await Milestone.findByIdAndUpdate(
      id,
      {
        ...(progressPercent !== undefined && { progressPercent: Number(progressPercent) }),
        ...(status && { status }),
        ...(actualStartDate && { actualStartDate: new Date(actualStartDate) }),
        ...(actualEndDate && { actualEndDate: new Date(actualEndDate) }),
      },
      { new: true }
    );

    if (!milestone) {
      res.status(404).json({ success: false, message: 'Milestone not found' });
      return;
    }

    // Recalculate total project overall progress weighted by milestone weightage
    const allMilestones = await Milestone.find({ projectId: milestone.projectId });
    let totalProgress = 0;
    allMilestones.forEach((m) => {
      totalProgress += (m.progressPercent * m.weightagePercent) / 100;
    });

    await Project.findByIdAndUpdate(milestone.projectId, {
      progressPercent: Math.round(totalProgress),
    });

    res.json({ success: true, milestone });
  } catch (error) {
    next(error);
  }
};

/**
 * Aggregated live ERP dashboard metrics
 */
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: 'active' });
    const planningProjects = await Project.countDocuments({ status: 'planning' });
    const completedProjects = await Project.countDocuments({ status: 'completed' });

    // Financial totals across projects
    const financialAggregation = await Project.aggregate([
      {
        $group: {
          _id: null,
          totalContractValuePaise: { $sum: '$contractValuePaise' },
          totalBudgetPaise: { $sum: '$totalBudgetPaise' },
          totalActualCostPaise: { $sum: '$actualCostPaise' },
          totalInvoicedPaise: { $sum: '$invoicedAmountPaise' },
          totalCollectedPaise: { $sum: '$collectedAmountPaise' },
        },
      },
    ]);

    const stats = financialAggregation[0] || {
      totalContractValuePaise: 0,
      totalBudgetPaise: 0,
      totalActualCostPaise: 0,
      totalInvoicedPaise: 0,
      totalCollectedPaise: 0,
    };

    const receivablesPaise = Math.max(0, stats.totalInvoicedPaise - stats.totalCollectedPaise);
    const estimatedFinalProfitPaise = Math.max(0, stats.totalContractValuePaise - stats.totalBudgetPaise);

    // Recent activity
    const recentSiteReports = await SiteReport.find()
      .populate('projectId', 'title projectId')
      .populate('supervisorId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentExpenses = await Expense.find()
      .populate('projectId', 'title projectId')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalProjects,
        activeProjects,
        planningProjects,
        completedProjects,
        contractValuePaise: stats.totalContractValuePaise,
        budgetPaise: stats.totalBudgetPaise,
        actualCostPaise: stats.totalActualCostPaise,
        invoicedPaise: stats.totalInvoicedPaise,
        collectedPaise: stats.totalCollectedPaise,
        receivablesPaise,
        estimatedFinalProfitPaise,
      },
      recentSiteReports,
      recentExpenses,
    });
  } catch (error) {
    next(error);
  }
};
