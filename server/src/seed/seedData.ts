import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { Lead } from '../models/Lead';
import { Project } from '../models/Project';
import { Milestone } from '../models/Milestone';
import { Quotation } from '../models/Quotation';
import { SiteReport } from '../models/SiteReport';
import { Supplier } from '../models/Supplier';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { InventoryTransaction } from '../models/InventoryTransaction';
import { Expense } from '../models/Expense';
import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { ProjectDocument } from '../models/Document';
import { PortfolioProject } from '../models/PortfolioProject';
import { ProjectIdea } from '../models/ProjectIdea';
import { Enquiry } from '../models/Enquiry';
import { TaxReconciliation } from '../models/TaxReconciliation';
import { verifiedProjectsData, generateProjectIdeas } from './portfolioSeedData';
import { connectDB } from '../config/db';
import { GKA_COMPANY } from '../shared/constants';
import { toPaise } from '../shared/types';

export const runSeed = async () => {
  try {
    await connectDB();
    if (!mongoose.connection.readyState || mongoose.connection.readyState !== 1) {
      throw new Error('Database is not connected. Aborting seed operation.');
    }
    console.log(`[Seed] Connected to active database host: ${mongoose.connection.host} (DB: ${mongoose.connection.name})`);
    console.log('[Seed] Clearing existing records for clean live setup...');

    await Promise.all([
      User.deleteMany({}),
      Client.deleteMany({}),
      Lead.deleteMany({}),
      Project.deleteMany({}),
      Milestone.deleteMany({}),
      Quotation.deleteMany({}),
      SiteReport.deleteMany({}),
      Supplier.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      InventoryTransaction.deleteMany({}),
      Expense.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      ProjectDocument.deleteMany({}),
      PortfolioProject.deleteMany({}),
      ProjectIdea.deleteMany({}),
      Enquiry.deleteMany({}),
      TaxReconciliation.deleteMany({}),
    ]);

    console.log('[Seed] Database cleaned. Initializing users...');

    // 1. Staff and Client Users
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('GKAadmin2026!', salt);
    const pmPasswordHash = await bcrypt.hash('GKApm2026!', salt);
    const supervisorPasswordHash = await bcrypt.hash('GKAsuper2026!', salt);
    const accountsPasswordHash = await bcrypt.hash('GKAaccounts2026!', salt);
    const clientPasswordHash = await bcrypt.hash('GKAclient2026!', salt);

    // Admin set to Arivazhagan (Managing Director)
    const admin = await User.create({
      name: 'Arivazhagan (Managing Director)',
      email: 'owner@gkaconstruction.com',
      phone: GKA_COMPANY.phoneDisplay,
      passwordHash: adminPasswordHash,
      role: 'super_admin',
      isActive: true,
    });

    const pm = await User.create({
      name: 'R. Senthil Kumar (Senior Project Manager)',
      email: 'pm@gkaconstruction.com',
      phone: '98401 23456',
      passwordHash: pmPasswordHash,
      role: 'project_manager',
      isActive: true,
    });

    const supervisor = await User.create({
      name: 'K. Murugan (Site Engineer & Supervisor)',
      email: 'supervisor@gkaconstruction.com',
      phone: '97890 12345',
      passwordHash: supervisorPasswordHash,
      role: 'site_supervisor',
      isActive: true,
    });

    const accounts = await User.create({
      name: 'P. Deepa (Billing & Accounts Lead)',
      email: 'accounts@gkaconstruction.com',
      phone: '94440 98765',
      passwordHash: accountsPasswordHash,
      role: 'accounts',
      isActive: true,
    });

    const clientUser = await User.create({
      name: 'Roots Corporation Limited (Ginger Hotel)',
      email: 'gingerhotel@gkaconstruction.com',
      phone: '98840 55677',
      passwordHash: clientPasswordHash,
      role: 'client',
      isActive: true,
    });

    console.log('[Seed] Users created. Creating single starter client...');

    // 2. Single Sample Client (Clean Starter)
    const sampleClient = await Client.create({
      userId: clientUser._id,
      name: 'Roots Corporation Limited (Ginger Hotel)',
      companyName: 'Roots Corporation Ltd / Ginger Hotel',
      email: 'gingerhotel@gkaconstruction.com',
      phone: '98840 55677',
      billingAddress: {
        street: 'Ginger Hotel, Rajiv Gandhi Salai (OMR), Navalur',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600130',
        gstin: '33AABCR1234F1ZX',
        pan: 'AABCR1234F',
      },
      notes: 'Sample verified client account for live application.',
    });

    console.log('[Seed] Creating single sample project workspace with 0 baseline values...');

    // 3. Single Sample Project (All financial values set to 0)
    const sampleProject = await Project.create({
      projectId: 'GKA-2026-001',
      title: 'Ginger Hotel — Civil & Water Tank Renovation Works',
      category: 'renovation',
      clientId: sampleClient._id,
      siteAddress: {
        street: 'Rajiv Gandhi Salai, Navalur Junction',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600130',
        landmark: 'Near Navalur Toll Plaza',
      },
      scopeOfWork: [
        'Complete high-grade polymer waterproofing and cement plastering of overhead and underground water tanks',
        'Anti-skid vitreous tile replacement in service areas and laundry corridors',
        'Structural brickwork rectification and epoxy grouting',
      ],
      startDate: new Date('2026-01-10'),
      targetEndDate: new Date('2026-04-15'),
      status: 'active',
      progressPercent: 0,
      contractValuePaise: 0,
      approvedVariationsPaise: 0,
      totalBudgetPaise: 0,
      actualCostPaise: 0,
      committedCostPaise: 0,
      invoicedAmountPaise: 0,
      collectedAmountPaise: 0,
      assignedManagerId: pm._id,
      assignedSupervisorId: supervisor._id,
    });

    // Single sample milestone with 0 progress
    await Milestone.create({
      projectId: sampleProject._id,
      code: '01',
      title: 'Site Assessment, Scaffolding & Initial Planning',
      description: 'Comprehensive structural survey, site mobilization and work scheduling.',
      plannedStartDate: new Date('2026-01-10'),
      plannedEndDate: new Date('2026-02-15'),
      weightagePercent: 100,
      progressPercent: 0,
      status: 'pending',
      orderIndex: 1,
    });

    console.log('[Seed] Creating single starter quotation with 0 values...');

    // 4. Single Sample Quotation (All financial values set to 0)
    await Quotation.create({
      quotationNumber: 'GKA-QUO-2026-001',
      projectId: sampleProject._id,
      clientId: sampleClient._id,
      clientName: sampleClient.name,
      clientAddress: sampleClient.billingAddress.street,
      projectTitle: sampleProject.title,
      siteLocation: sampleProject.siteAddress.street,
      items: [
        {
          id: 'item-1',
          category: 'structural',
          description: 'High-pressure water jet cleaning & loose concrete chipping in water tanks',
          unit: 'sq.ft',
          quantity: 0,
          unitRatePaise: 0,
          amountPaise: 0,
        },
      ],
      subtotalPaise: 0,
      discountPaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      taxRatePercent: 18,
      totalAmountPaise: 0,
      termsAndConditions: [
        '50% advance upon site mobilization and scaffolding installation.',
        '40% progressive payment upon completion of plastering and tile laying.',
        '10% upon 72-hour leak test verification and final handover.',
        'Materials used strictly as per specified brands.',
      ],
      revisionNumber: 1,
      status: 'draft',
      validUntil: new Date('2026-12-31'),
      convertedToBudget: false,
    });

    console.log('[Seed] Creating single starter invoice (bill) with 0 values...');

    // 5. Single Sample Bill / Invoice (All financial values set to 0)
    await Invoice.create({
      invoiceNumber: 'GKA-INV-2026-001',
      projectId: sampleProject._id,
      projectTitle: sampleProject.title,
      clientId: sampleClient._id,
      clientName: sampleClient.name,
      billingAddress: sampleClient.billingAddress.street,
      items: [
        {
          description: 'Mobilization Advance & Milestone 01 Works',
          quantity: 0,
          unit: 'lumpsum',
          unitPricePaise: 0,
          totalPaise: 0,
        },
      ],
      subtotalPaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      totalAmountPaise: 0,
      paidAmountPaise: 0,
      dueAmountPaise: 0,
      issueDate: new Date('2026-01-28'),
      dueDate: new Date('2026-02-15'),
      status: 'draft',
      notes: 'Initial starter bill template for live application.',
    });

    // 6. Single Starter Supplier with 0 balance
    const supplier1 = await Supplier.create({
      name: 'Ultratech Cement & JSW Steel Agency',
      contactPerson: 'V. Ramanathan',
      phone: '98400 11223',
      email: 'ramanathan.cements@gmail.com',
      address: 'Kelambakkam Main Road, Chennai - 603103',
      category: 'cement_steel',
      gstin: '33AABCT9988H1ZA',
      paymentTermsDays: 30,
      outstandingBalancePaise: 0,
    });

    // 7. Single Sample Enquiry / CRM Lead with 0 budget
    await Lead.create({
      name: 'K. Balaji (Tech Mahindra)',
      phone: '98402 33441',
      email: 'balaji.km@gmail.com',
      projectCategory: 'residential',
      siteLocation: 'Medavakkam, Chennai',
      city: 'Chennai',
      approxAreaSqFt: 0,
      estimatedBudgetRupees: 0,
      message: 'Turnkey residential construction enquiry template.',
      source: 'cost_estimator',
      status: 'new',
    });

    // 8. Starter Document
    await ProjectDocument.create({
      projectId: sampleProject._id,
      title: 'Approved Work Scope & Tender Specifications',
      fileName: 'Ginger_Hotel_Navalur_GKA_Scope_2026.pdf',
      fileSize: 2450000,
      fileType: 'application/pdf',
      category: 'contracts',
      fileUrl: '/uploads/Ginger_Hotel_Navalur_GKA_Scope_2026.pdf',
      uploadedBy: pm._id,
      visibleToClient: true,
      version: 1,
    });

    // 9. Verified Public Portfolio Projects
    console.log('[Seed] Seeding verified public portfolio projects...');
    await PortfolioProject.insertMany(verifiedProjectsData);

    // 10. 50+ Construction Project Ideas by Square-Foot Category
    console.log('[Seed] Seeding 50+ house construction project ideas...');
    const projectIdeas = generateProjectIdeas();
    await ProjectIdea.insertMany(projectIdeas);

    // 11. Initial Website Enquiry
    await Enquiry.create({
      referenceNumber: 'GKA-ENQ-2026-1001',
      customerName: 'K. Balaji',
      phone: '9840233441',
      email: 'balaji.km@gmail.com',
      preferredContactMethod: 'call',
      serviceType: 'residential',
      projectLocation: 'Medavakkam, Chennai',
      builtUpAreaSqFt: 1800,
      projectType: 'new_construction',
      requirements: 'Interested in the 1,800 Sq. Ft. Modern Duplex Concept for my 30x40 south facing plot. Would like a site visit next Saturday.',
      preferredContactTime: 'Evening after 5 PM',
      consent: true,
      relatedIdeaId: 'IDEA-1604',
      relatedIdeaTitle: '1,800 Sq. Ft. Modern Duplex Concept',
      status: 'site_visit_scheduled',
      notes: 'Initial telephone discussion completed. Site engineer assigned for Saturday visit.',
      emailNotificationSent: false,
      emailNotificationError: 'SMTP not configured in local development seed',
    });

    console.log(`[Seed] Seeded ${verifiedProjectsData.length} portfolio projects, ${projectIdeas.length} project ideas, and initial enquiry.`);
    console.log('[Seed] Clean live setup completed successfully!');
    console.log('===========================================================');
    console.log('  TEST / PRODUCTION CREDENTIALS:');
    console.log('  Admin (Owner):       owner@gkaconstruction.com      / GKAadmin2026!');
    console.log('                       (Arivazhagan - Managing Director)');
    console.log('  Project Manager:     pm@gkaconstruction.com         / GKApm2026!');
    console.log('  Site Supervisor:     supervisor@gkaconstruction.com / GKAsuper2026!');
    console.log('  Accounts:            accounts@gkaconstruction.com   / GKAaccounts2026!');
    console.log('  Client (Ginger):     gingerhotel@gkaconstruction.com         / GKAclient2026!');
    console.log('===========================================================');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runSeed();
}
