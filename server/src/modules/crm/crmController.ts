import { Request, Response, NextFunction } from 'express';
import { Lead } from '../../models/Lead';
import { Client } from '../../models/Client';
import { Project } from '../../models/Project';
import { Milestone } from '../../models/Milestone';
import { STANDARD_MILESTONES } from '../../shared/constants';
import { toPaise } from '../../shared/types';

export const createEnquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      phone,
      email,
      projectCategory,
      siteLocation,
      city,
      approxAreaSqFt,
      estimatedBudgetRupees,
      message,
      source,
      preferredSiteVisitDate,
    } = req.body;

    if (!name || !phone || !siteLocation) {
      res.status(400).json({ success: false, message: 'Name, phone number, and site location are required.' });
      return;
    }

    const lead = await Lead.create({
      name,
      phone,
      email,
      projectCategory: projectCategory || 'residential',
      siteLocation,
      city: city || 'Chennai',
      approxAreaSqFt: approxAreaSqFt ? Number(approxAreaSqFt) : undefined,
      estimatedBudgetRupees: estimatedBudgetRupees ? Number(estimatedBudgetRupees) : undefined,
      message,
      source: source || 'website_contact',
      status: 'new',
      preferredSiteVisitDate: preferredSiteVisitDate ? new Date(preferredSiteVisitDate) : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully. Our site engineering team will reach out promptly.',
      leadId: lead._id,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, category } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (category) query.projectCategory = category;

    const leads = await Lead.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: leads.length, leads });
  } catch (error) {
    next(error);
  }
};

export const updateLeadStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes, assignedTo } = req.body;

    const lead = await Lead.findByIdAndUpdate(
      id,
      {
        ...(status && { status }),
        ...(notes && { notes }),
        ...(assignedTo && { assignedTo }),
      },
      { new: true }
    );

    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    res.json({ success: true, lead });
  } catch (error) {
    next(error);
  }
};

/**
 * Convert a Lead into a Client and an initialized Project without duplicate data entry!
 */
export const convertLeadToProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const lead = await Lead.findById(id);

    if (!lead) {
      res.status(404).json({ success: false, message: 'Lead not found' });
      return;
    }

    if (lead.convertedToProjectId) {
      res.status(400).json({
        success: false,
        message: 'This enquiry has already been converted to a project.',
        projectId: lead.convertedToProjectId,
      });
      return;
    }

    // 1. Find or create Client
    let client = await Client.findOne({ phone: lead.phone });
    if (!client) {
      client = await Client.create({
        name: lead.name,
        email: lead.email || `${lead.phone.replace(/[^0-9]/g, '')}@client.gkaconstruction.com`,
        phone: lead.phone,
        billingAddress: {
          street: lead.siteLocation,
          city: lead.city || 'Chennai',
          state: 'Tamil Nadu',
          pincode: '',
        },
      });
    }

    // 2. Generate unique Project ID: GKA-YYYY-XXX
    const currentYear = new Date().getFullYear();
    const projectCount = await Project.countDocuments();
    const nextSeq = String(projectCount + 1).padStart(3, '0');
    const projectIdStr = `GKA-${currentYear}-${nextSeq}`;

    // 3. Create Project
    const contractValuePaise = lead.estimatedBudgetRupees ? toPaise(lead.estimatedBudgetRupees) : 0;
    const startDate = new Date();
    const targetEndDate = new Date();
    targetEndDate.setMonth(targetEndDate.getMonth() + 6); // Default 6 months timeline

    const project = await Project.create({
      projectId: projectIdStr,
      title: `${lead.name} — ${lead.projectCategory.toUpperCase()} Construction`,
      category: lead.projectCategory,
      clientId: client._id,
      siteAddress: {
        street: lead.siteLocation,
        city: lead.city || 'Chennai',
        state: 'Tamil Nadu',
        pincode: '',
      },
      scopeOfWork: [
        `Complete ${lead.projectCategory} works at ${lead.siteLocation}`,
        ...(lead.approxAreaSqFt ? [`Approximate built-up area: ${lead.approxAreaSqFt} sq.ft`] : []),
      ],
      startDate,
      targetEndDate,
      status: 'planning',
      contractValuePaise,
      totalBudgetPaise: contractValuePaise,
      assignedManagerId: req.user?.id,
    });

    // 4. Initialize standard milestones for this project
    const milestoneDocs = STANDARD_MILESTONES.map((m) => {
      const pStart = new Date(startDate);
      pStart.setDate(pStart.getDate() + (m.orderIndex - 1) * 30);
      const pEnd = new Date(pStart);
      pEnd.setDate(pEnd.getDate() + 30);

      return {
        projectId: project._id,
        code: m.code,
        title: m.title,
        description: m.description,
        plannedStartDate: pStart,
        plannedEndDate: pEnd,
        weightagePercent: m.weightagePercent,
        progressPercent: 0,
        status: m.orderIndex === 1 ? 'in_progress' : 'pending',
        orderIndex: m.orderIndex,
      };
    });

    await Milestone.insertMany(milestoneDocs);

    // 5. Update lead record with converted IDs
    lead.status = 'won';
    lead.convertedToClientId = client._id as any;
    lead.convertedToProjectId = project._id as any;
    await lead.save();

    res.status(201).json({
      success: true,
      message: `Enquiry successfully converted to Project ${project.projectId}`,
      client,
      project,
    });
  } catch (error) {
    next(error);
  }
};
