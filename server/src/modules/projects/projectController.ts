import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Project } from '../../models/Project';
import { Milestone } from '../../models/Milestone';
import { Expense } from '../../models/Expense';
import { Invoice } from '../../models/Invoice';
import { Payment } from '../../models/Payment';
import { SiteReport } from '../../models/SiteReport';
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

    const milestones = await Milestone.find({ projectId: project._id }).sort({ orderIndex: 1 });
    const siteReports = await SiteReport.find({
      projectId: project._id,
      ...(req.user?.role === 'client' ? { isPublishedToClient: true } : {}),
    }).sort({ reportDate: -1 }).limit(10);

    res.json({
      success: true,
      project,
      milestones,
      recentSiteReports: siteReports,
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
      orderIndex: m.orderIndex,
    }));
    await Milestone.insertMany(milestoneDocs);

    res.status(201).json({ success: true, project });
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
