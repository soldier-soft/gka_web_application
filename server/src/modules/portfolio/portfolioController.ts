import { Request, Response, NextFunction } from 'express';
import { PortfolioProject } from '../../models/PortfolioProject';
import { ProjectIdea } from '../../models/ProjectIdea';
import { Enquiry } from '../../models/Enquiry';
import { Lead } from '../../models/Lead';
import { sendEnquiryNotification } from '../../services/emailService';

// Helper to generate a slug from a title
const slugify = (text: string): string =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

// ==========================================
// Portfolio Projects Controllers
// ==========================================

export const getPublicProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, search, featured, page, limit } = req.query;

    const query: any = { isPublished: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (search && typeof search === 'string') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { location: regex }, { description: regex }, { workScope: regex }];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [total, projects] = await Promise.all([
      PortfolioProject.countDocuments(query),
      PortfolioProject.find(query)
        .sort({ isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.json({
      success: true,
      count: projects.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      projects,
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicProjectBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;

    let project = await PortfolioProject.findOne({ slug, isPublished: true });
    if (!project && slug.match(/^[0-9a-fA-F]{24}$/)) {
      project = await PortfolioProject.findOne({ _id: slug, isPublished: true });
    }

    if (!project) {
      res.status(404).json({ success: false, message: 'Portfolio project not found.' });
      return;
    }

    // Related projects
    const relatedProjects = await PortfolioProject.find({
      _id: { $ne: project._id },
      isPublished: true,
      category: project.category,
    })
      .limit(3)
      .select('title slug category categoryLabel location images status projectType');

    // Related project ideas in matching category
    const relatedIdeas = await ProjectIdea.find({
      isPublished: true,
    })
      .limit(3)
      .select('title slug builtUpAreaSqFt areaCategoryLabel images contentType bedroomCount');

    res.json({
      success: true,
      project,
      relatedProjects,
      relatedIdeas,
    });
  } catch (error) {
    next(error);
  }
};

export const adminCreateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    if (!data.title || !data.category || !data.location || !data.description) {
      res.status(400).json({ success: false, message: 'Title, category, location, and description are required.' });
      return;
    }

    const slug = data.slug ? slugify(data.slug) : slugify(data.title);
    const existing = await PortfolioProject.findOne({ slug });
    const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    const project = await PortfolioProject.create({
      ...data,
      slug: finalSlug,
    });

    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await PortfolioProject.findByIdAndUpdate(id, req.body, { new: true });
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    res.json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

export const adminDeleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await PortfolioProject.findByIdAndDelete(id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Project Ideas Controllers
// ==========================================

export const getProjectIdeas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      areaCategory,
      bedroomCount,
      propertyType,
      architecturalStyle,
      conceptType,
      search,
      page,
      limit,
    } = req.query;

    const query: any = { isPublished: true };

    if (areaCategory && areaCategory !== 'all') {
      query.areaCategory = areaCategory;
    }
    if (bedroomCount && bedroomCount !== 'all') {
      query.bedroomCount = bedroomCount;
    }
    if (propertyType && propertyType !== 'all') {
      query.propertyType = propertyType;
    }
    if (architecturalStyle && architecturalStyle !== 'all') {
      query.architecturalStyle = architecturalStyle;
    }
    if (conceptType && conceptType !== 'all') {
      query.conceptType = conceptType;
    }

    if (search && typeof search === 'string') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { description: regex }, { features: regex }, { tags: regex }];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 100;
    const skip = (pageNum - 1) * limitNum;

    const [total, ideas] = await Promise.all([
      ProjectIdea.countDocuments(query),
      ProjectIdea.find(query)
        .sort({ isFeatured: -1, builtUpAreaSqFt: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    res.json({
      success: true,
      count: ideas.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      ideas,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectIdeaBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;

    let idea = await ProjectIdea.findOne({ slug, isPublished: true });
    if (!idea && slug.match(/^[0-9a-fA-F]{24}$/)) {
      idea = await ProjectIdea.findOne({ _id: slug, isPublished: true });
    }
    if (!idea) {
      idea = await ProjectIdea.findOne({ ideaId: slug.toUpperCase(), isPublished: true });
    }

    if (!idea) {
      res.status(404).json({ success: false, message: 'Project idea not found.' });
      return;
    }

    const relatedIdeas = await ProjectIdea.find({
      _id: { $ne: idea._id },
      isPublished: true,
      $or: [{ areaCategory: idea.areaCategory }, { propertyType: idea.propertyType }],
    })
      .limit(3)
      .select('title slug builtUpAreaSqFt areaCategoryLabel images contentType bedroomCount');

    res.json({
      success: true,
      idea,
      relatedIdeas,
    });
  } catch (error) {
    next(error);
  }
};

export const adminCreateProjectIdea = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    if (!data.title || !data.builtUpAreaSqFt || !data.areaCategory || !data.description) {
      res.status(400).json({ success: false, message: 'Title, built-up area, category, and description are required.' });
      return;
    }

    const slug = data.slug ? slugify(data.slug) : slugify(data.title);
    const existing = await ProjectIdea.findOne({ slug });
    const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    const count = await ProjectIdea.countDocuments();
    const ideaId = data.ideaId || `IDEA-${String(count + 1).padStart(3, '0')}`;

    const idea = await ProjectIdea.create({
      ...data,
      slug: finalSlug,
      ideaId,
    });

    res.status(201).json({ success: true, idea });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateProjectIdea = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const idea = await ProjectIdea.findByIdAndUpdate(id, req.body, { new: true });
    if (!idea) {
      res.status(404).json({ success: false, message: 'Project idea not found' });
      return;
    }
    res.json({ success: true, idea });
  } catch (error) {
    next(error);
  }
};

export const adminDeleteProjectIdea = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const idea = await ProjectIdea.findByIdAndDelete(id);
    if (!idea) {
      res.status(404).json({ success: false, message: 'Project idea not found' });
      return;
    }
    res.json({ success: true, message: 'Project idea deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Enquiries & Site Visit Controllers
// ==========================================

export const createPublicEnquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      customerName,
      phone,
      email,
      preferredContactMethod,
      serviceType,
      projectLocation,
      builtUpAreaSqFt,
      projectType,
      requirements,
      preferredContactTime,
      consent,
      relatedProjectId,
      relatedProjectTitle,
      relatedIdeaId,
      relatedIdeaTitle,
    } = req.body;

    // Server-side validation
    if (!customerName || !customerName.trim()) {
      res.status(400).json({ success: false, message: 'Your name is required.' });
      return;
    }

    if (!phone || !phone.trim()) {
      res.status(400).json({ success: false, message: 'Your phone number is required.' });
      return;
    }

    // Sensible Indian phone number validation (10 digits with optional +91 or 0 prefix)
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit Indian mobile number (e.g., 98401 23456).',
      });
      return;
    }

    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
        return;
      }
    }

    if (!projectLocation || !projectLocation.trim()) {
      res.status(400).json({ success: false, message: 'Project location is required.' });
      return;
    }

    if (!requirements || !requirements.trim()) {
      res.status(400).json({ success: false, message: 'Brief requirements are required.' });
      return;
    }

    // Generate unique reference number: GKA-ENQ-YYYY-XXXX
    const year = new Date().getFullYear();
    const count = await Enquiry.countDocuments();
    const sequence = String(count + 1001).padStart(4, '0');
    const referenceNumber = `GKA-ENQ-${year}-${sequence}`;

    // 1. Create Enquiry record
    const enquiry = await Enquiry.create({
      referenceNumber,
      customerName: customerName.trim(),
      phone: cleanedPhone,
      email: email ? email.trim().toLowerCase() : undefined,
      preferredContactMethod: preferredContactMethod || 'call',
      serviceType: serviceType || 'residential',
      projectLocation: projectLocation.trim(),
      builtUpAreaSqFt: builtUpAreaSqFt ? Number(builtUpAreaSqFt) : undefined,
      projectType: projectType || 'new_construction',
      requirements: requirements.trim(),
      preferredContactTime: preferredContactTime ? preferredContactTime.trim() : undefined,
      consent: consent === true || consent === 'true',
      relatedProjectId,
      relatedProjectTitle,
      relatedIdeaId,
      relatedIdeaTitle,
      status: 'new',
    });

    // 2. Synchronize with CRM Leads so ERP staff see it in CRM workspace
    try {
      await Lead.create({
        name: customerName.trim(),
        phone: cleanedPhone,
        email: email ? email.trim().toLowerCase() : undefined,
        projectCategory:
          serviceType === 'commercial'
            ? 'commercial'
            : serviceType === 'renovation'
            ? 'renovation'
            : serviceType === 'civil_finishing'
            ? 'civil_structural'
            : 'residential',
        siteLocation: projectLocation.trim(),
        city: 'Chennai',
        approxAreaSqFt: builtUpAreaSqFt ? Number(builtUpAreaSqFt) : undefined,
        message: `[Ref: ${referenceNumber}] ${requirements.trim()}${
          relatedProjectTitle ? ` | Inquired about Project: ${relatedProjectTitle}` : ''
        }${relatedIdeaTitle ? ` | Inquired about Concept: ${relatedIdeaTitle}` : ''}`,
        source: 'website_contact',
        status: 'new',
      });
    } catch (crmErr) {
      console.error('[PortfolioController] Lead sync non-blocking warning:', crmErr);
    }

    // 3. Send email notifications (honest status reporting)
    const emailResult = await sendEnquiryNotification({
      referenceNumber,
      customerName: customerName.trim(),
      phone: cleanedPhone,
      email: email ? email.trim().toLowerCase() : undefined,
      preferredContactMethod: preferredContactMethod || 'call',
      serviceType: serviceType || 'residential',
      projectLocation: projectLocation.trim(),
      builtUpAreaSqFt: builtUpAreaSqFt ? Number(builtUpAreaSqFt) : undefined,
      projectType: projectType || 'new_construction',
      requirements: requirements.trim(),
      preferredContactTime: preferredContactTime ? preferredContactTime.trim() : undefined,
      relatedProjectTitle,
      relatedIdeaTitle,
    });

    // Update enquiry record with delivery results
    enquiry.emailNotificationSent = emailResult.sent;
    if (emailResult.error) {
      enquiry.emailNotificationError = emailResult.error;
    }
    await enquiry.save();

    res.status(201).json({
      success: true,
      message: 'Enquiry received successfully! Our team will connect with you promptly.',
      referenceNumber,
      enquiryId: enquiry._id,
      emailNotificationSent: emailResult.sent,
    });
  } catch (error) {
    next(error);
  }
};

export const getEnquiries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, search, page, limit } = req.query;
    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && typeof search === 'string') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ customerName: regex }, { phone: regex }, { referenceNumber: regex }, { projectLocation: regex }];
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [total, enquiries] = await Promise.all([
      Enquiry.countDocuments(query),
      Enquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    ]);

    res.json({
      success: true,
      count: enquiries.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      enquiries,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEnquiryStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
      { new: true }
    );

    if (!enquiry) {
      res.status(404).json({ success: false, message: 'Enquiry not found' });
      return;
    }

    res.json({ success: true, enquiry });
  } catch (error) {
    next(error);
  }
};
