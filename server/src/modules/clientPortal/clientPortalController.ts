import { Request, Response, NextFunction } from 'express';
import { Project } from '../../models/Project';
import { Milestone } from '../../models/Milestone';
import { SiteReport } from '../../models/SiteReport';
import { Invoice } from '../../models/Invoice';
import { Quotation } from '../../models/Quotation';
import { ProjectDocument } from '../../models/Document';

export const getMyProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientId = req.user?.clientId;
    if (!clientId) {
      res.status(403).json({ success: false, message: 'No client profile associated with this account.' });
      return;
    }

    const projects = await Project.find({ clientId }).select(
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
    const clientId = req.user?.clientId;

    const project = await Project.findOne({ _id: id, clientId }).select(
      'projectId title category siteAddress scopeOfWork startDate targetEndDate status progressPercent'
    );

    if (!project) {
      res.status(404).json({ success: false, message: 'Authorized project not found.' });
      return;
    }

    // Milestones
    const milestones = await Milestone.find({ projectId: project._id }).sort({ orderIndex: 1 });

    // ONLY published site reports
    const publishedReports = await SiteReport.find({
      projectId: project._id,
      isPublishedToClient: true,
    }).sort({ reportDate: -1 });

    // Client Invoices
    const invoices = await Invoice.find({
      projectId: project._id,
      status: { $ne: 'draft' },
    }).sort({ issueDate: -1 });

    // Approved Quotations
    const quotations = await Quotation.find({
      projectId: project._id,
      status: { $in: ['sent', 'approved'] },
    }).sort({ createdAt: -1 });

    // Documents visible to client
    const documents = await ProjectDocument.find({
      projectId: project._id,
      visibleToClient: true,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      project,
      milestones,
      publishedReports,
      invoices,
      quotations,
      documents,
    });
  } catch (error) {
    next(error);
  }
};
