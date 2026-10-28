// Shared Types for GKA Construction ERP

export type UserRole = 'super_admin' | 'project_manager' | 'site_supervisor' | 'accounts' | 'client';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  assignedProjects?: string[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'site_visit_scheduled' | 'estimate_sent' | 'won' | 'lost';
export type ProjectCategory = 'residential' | 'commercial' | 'renovation' | 'civil_structural' | 'interiors' | 'turnkey';

export interface ILead {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  projectCategory: ProjectCategory;
  siteLocation: string;
  city?: string;
  approxAreaSqFt?: number;
  estimatedBudgetRupees?: number;
  message?: string;
  source: 'website_contact' | 'cost_estimator' | 'site_visit_booking' | 'referral' | 'direct';
  status: LeadStatus;
  notes?: string;
  assignedTo?: string; // User ID
  convertedToProjectId?: string;
  convertedToClientId?: string;
  preferredSiteVisitDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IClient {
  _id: string;
  userId?: string; // Linked User login if client portal access granted
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    gstin?: string;
    pan?: string;
  };
  notes?: string;
  totalProjectsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';

export interface IProject {
  _id: string;
  projectId: string; // e.g. GKA-2026-001
  title: string;
  category: ProjectCategory;
  clientId: string;
  clientName?: string;
  siteAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  scopeOfWork: string[];
  startDate: string;
  targetEndDate: string;
  actualEndDate?: string;
  status: ProjectStatus;
  progressPercent: number; // 0 - 100

  // Financial Overview (All stored in integer paise)
  contractValuePaise: number;
  approvedVariationsPaise: number;
  totalBudgetPaise: number;
  actualCostPaise: number;
  committedCostPaise: number;
  invoicedAmountPaise: number;
  collectedAmountPaise: number;

  assignedManagerId?: string;
  assignedSupervisorId?: string;
  assignedTeam?: string[];

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMilestone {
  _id: string;
  projectId: string;
  code: string; // e.g. "01", "02", ...
  title: string; // e.g. "Planning", "Foundation", "Structure", "MEP & Plastering", "Finishing", "Handover"
  description: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  weightagePercent: number;
  progressPercent: number;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  orderIndex: number;
}

export interface IEstimateItem {
  id: string;
  category: 'civil' | 'masonry' | 'structural' | 'finishing' | 'mep' | 'interiors' | 'labour' | 'other';
  description: string;
  unit: 'sq.ft' | 'cu.ft' | 'bags' | 'tons' | 'nos' | 'rft' | 'lumpsum' | 'days';
  quantity: number;
  unitRatePaise: number;
  amountPaise: number;
  // Breakdown
  materialCostPaise?: number;
  labourCostPaise?: number;
  equipmentCostPaise?: number;
  notes?: string;
}

export interface IQuotation {
  _id: string;
  quotationNumber: string; // e.g. GKA-QUO-2026-001
  projectId?: string;
  leadId?: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  projectTitle: string;
  siteLocation: string;
  items: IEstimateItem[];
  subtotalPaise: number;
  discountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  taxRatePercent: number; // e.g. 18
  totalAmountPaise: number;
  termsAndConditions: string[];
  revisionNumber: number;
  status: 'draft' | 'sent' | 'revised' | 'approved' | 'rejected';
  validUntil: string;
  approvedAt?: string;
  approvedBy?: string;
  convertedToBudget: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ISiteReport {
  _id: string;
  projectId: string;
  reportDate: string;
  weatherCondition: 'sunny' | 'cloudy' | 'rainy' | 'windy';
  workCompletedSummary: string;
  milestoneId?: string;
  milestoneTitle?: string;
  labourCount: {
    masons: number;
    helpers: number;
    carpenters: number;
    plumbers: number;
    electricians: number;
    painters: number;
    supervisors: number;
    totalCount: number;
  };
  materialsConsumedSummary?: string;
  issuesOrDelays?: string;
  safetyObservations?: string;
  isPublishedToClient: boolean;
  publishedAt?: string;
  supervisorId: string;
  supervisorName: string;
  photos: {
    url: string;
    caption: string;
    category: 'foundation' | 'structure' | 'plastering' | 'finishing' | 'site_condition' | 'inspection';
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ISupplier {
  _id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  category: 'cement_steel' | 'aggregates_sand' | 'bricks_blocks' | 'tiles_sanitary' | 'electrical' | 'paint' | 'timber_hardware' | 'equipment_rental';
  gstin?: string;
  paymentTermsDays: number;
  outstandingBalancePaise: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPurchaseOrderItem {
  itemDescription: string;
  unit: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitRatePaise: number;
  totalPaise: number;
}

export interface IPurchaseOrder {
  _id: string;
  poNumber: string; // e.g. GKA-PO-2026-001
  projectId: string;
  projectTitle?: string;
  supplierId: string;
  supplierName: string;
  items: IPurchaseOrderItem[];
  subtotalPaise: number;
  taxPaise: number;
  grandTotalPaise: number;
  status: 'draft' | 'issued' | 'partially_received' | 'received' | 'cancelled';
  expectedDeliveryDate?: string;
  deliveryAddress: string;
  notes?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IInventoryTransaction {
  _id: string;
  projectId?: string;
  materialName: string;
  category: string;
  transactionType: 'purchase_receipt' | 'site_issue' | 'site_return' | 'wastage' | 'adjustment';
  quantity: number;
  unit: string;
  unitCostPaise: number;
  totalValuePaise: number;
  referencePoId?: string;
  siteReportId?: string;
  notes?: string;
  recordedBy: string;
  date: string;
  createdAt: string;
}

export interface IExpense {
  _id: string;
  projectId: string;
  category: 'materials' | 'labour' | 'machinery' | 'subcontractor' | 'fuel_transport' | 'permits_fees' | 'site_supplies' | 'office_overhead';
  description: string;
  amountPaise: number;
  paidTo: string;
  date: string;
  paymentMethod: 'bank_transfer' | 'upi' | 'cheque' | 'cash';
  referenceNumber?: string;
  receiptUrl?: string;
  supplierId?: string;
  isApproved: boolean;
  approvedBy?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  unitPricePaise: number;
  totalPaise: number;
}

export interface IInvoice {
  _id: string;
  invoiceNumber: string; // e.g. GKA-INV-2026-001
  projectId: string;
  projectTitle: string;
  clientId: string;
  clientName: string;
  billingAddress: string;
  items: IInvoiceItem[];
  subtotalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalAmountPaise: number;
  paidAmountPaise: number;
  dueAmountPaise: number;
  isNegotiated?: boolean;
  negotiatedDiscountPaise?: number;
  discountPaise?: number;
  negotiatedNotes?: string;
  termsAndConditions?: string[];
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    branch: string;
    upiId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IPayment {
  _id: string;
  paymentNumber: string; // e.g. GKA-REC-2026-001
  projectId: string;
  clientId: string;
  clientName: string;
  invoiceId?: string;
  amountPaise: number;
  paymentDate: string;
  paymentMode: 'bank_transfer' | 'upi' | 'cheque' | 'cash';
  transactionReference: string;
  recordedBy: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface IDocument {
  _id: string;
  projectId?: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  category: 'drawings' | 'contracts' | 'quotations' | 'invoices' | 'permits' | 'handover' | 'site_photos';
  fileUrl: string;
  uploadedBy: string;
  visibleToClient: boolean;
  version: number;
  createdAt: string;
}

export interface INotification {
  _id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'info' | 'milestone' | 'payment' | 'approval' | 'alert';
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface IAuditLog {
  _id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

// Financial Helper Utilities
export const toPaise = (rupees: number): number => Math.round(rupees * 100);
export const toRupees = (paise: number): number => paise / 100;
export const formatINR = (paise: number): string => {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
};

// ==========================================
// Portfolio, Project Ideas & Enquiry Types
// ==========================================

export type PublicProjectCategory =
  | 'all'
  | 'residential'
  | 'villas'
  | 'commercial'
  | 'renovation'
  | 'civil_finishing'
  | 'tiling'
  | 'maintenance';

export interface IProjectImage {
  url: string;
  alt: string;
  caption?: string;
  order: number;
  isCover?: boolean;
  imageType: 'actual_project' | 'illustrative_reference';
  permissionStatus?: 'verified_work' | 'client_approved' | 'licensed_reference';
}

export interface IPortfolioProject {
  _id: string;
  title: string;
  slug: string;
  category: PublicProjectCategory;
  categoryLabel: string;
  location: string;
  description: string;
  workScope: string[];
  projectType: 'actual_work' | 'design_reference' | 'concept_reference';
  status: 'Completed' | 'Active' | 'Design Reference';
  client?: string;
  approxAreaSqFt?: number;
  images: IProjectImage[];
  isVerified: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export type BuiltUpAreaCategory =
  | 'under_600'
  | '600_800'
  | '800_1000'
  | '1000_1200'
  | '1200_1500'
  | '1500_2000'
  | '2000_2500'
  | 'above_2500';

export type BedroomFilter = 'all' | '1_bhk' | '2_bhk' | '3_bhk' | '4_bhk_plus' | 'not_applicable';

export type PropertyTypeFilter =
  | 'all'
  | 'single_floor'
  | 'duplex'
  | 'villa'
  | 'compact_home'
  | 'commercial'
  | 'renovation';

export type ArchitecturalStyleFilter =
  | 'all'
  | 'contemporary'
  | 'traditional'
  | 'modern'
  | 'minimalist'
  | 'elevation_design'
  | 'interior_reference';

export type ConceptTypeFilter =
  | 'all'
  | 'compact_budget'
  | 'premium_finish'
  | 'standard_family';

export interface IProjectIdea {
  _id: string;
  ideaId: string;
  slug: string;
  title: string;
  builtUpAreaSqFt: number;
  areaCategory: BuiltUpAreaCategory;
  areaCategoryLabel: string;
  bedroomCount: BedroomFilter;
  propertyType: PropertyTypeFilter;
  architecturalStyle: ArchitecturalStyleFilter;
  conceptType: ConceptTypeFilter;
  description: string;
  features: string[];
  images: IProjectImage[];
  tags: string[];
  contentType: 'Concept Reference' | 'Actual Project';
  isPublished: boolean;
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IEnquirySubmission {
  customerName: string;
  phone: string;
  email?: string;
  preferredContactMethod: 'call' | 'whatsapp' | 'email';
  serviceType: string;
  projectLocation: string;
  builtUpAreaSqFt?: number;
  projectType: 'new_construction' | 'renovation' | 'expansion' | 'other';
  requirements: string;
  preferredContactTime?: string;
  consent: boolean;
  relatedProjectId?: string;
  relatedProjectTitle?: string;
  relatedIdeaId?: string;
  relatedIdeaTitle?: string;
}

export interface IEnquiryRecord extends IEnquirySubmission {
  _id: string;
  referenceNumber: string;
  status: 'new' | 'contacted' | 'site_visit_scheduled' | 'quotation_in_progress' | 'converted' | 'closed';
  notes?: string;
  emailNotificationSent: boolean;
  emailNotificationError?: string;
  createdAt: string;
  updatedAt: string;
}

