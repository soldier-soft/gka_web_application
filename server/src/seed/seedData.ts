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
import { connectDB } from '../config/db';
import { GKA_COMPANY, STANDARD_MILESTONES } from '../shared/constants';
import { toPaise } from '../shared/types';

export const runSeed = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database. Clearing existing records...');

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
    ]);

    console.log('[Seed] Database cleaned. Creating users...');

    // 1. Users
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('GKAadmin2026!', salt);
    const pmPasswordHash = await bcrypt.hash('GKApm2026!', salt);
    const supervisorPasswordHash = await bcrypt.hash('GKAsuper2026!', salt);
    const accountsPasswordHash = await bcrypt.hash('GKAaccounts2026!', salt);
    const clientPasswordHash = await bcrypt.hash('GKAclient2026!', salt);

    const admin = await User.create({
      name: 'G. K. Annamalai (Managing Director)',
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
      email: 'client@gingerhotel.com',
      phone: '98840 55677',
      passwordHash: clientPasswordHash,
      role: 'client',
      isActive: true,
    });

    console.log('[Seed] Users created. Creating clients...');

    // 2. Clients
    const gingerClient = await Client.create({
      userId: clientUser._id,
      name: 'Roots Corporation Limited (Ginger Hotel)',
      companyName: 'Roots Corporation Ltd / Ginger Hotel',
      email: 'client@gingerhotel.com',
      phone: '98840 55677',
      billingAddress: {
        street: 'Ginger Hotel, Rajiv Gandhi Salai (OMR), Navalur',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600130',
        gstin: '33AABCR1234F1ZX',
        pan: 'AABCR1234F',
      },
      notes: 'Commercial hospitality client. Priority renovation & maintenance partner.',
    });

    const residentialClient = await Client.create({
      name: 'Dr. V. Rajesh & Mrs. Shalini',
      companyName: 'Individual Residence',
      email: 'rajesh.kelambakkam@gmail.com',
      phone: '98410 77889',
      billingAddress: {
        street: 'Plot No. 42, Green Avenue, Rajan Nagar',
        city: 'Kelambakkam, Chennai',
        state: 'Tamil Nadu',
        pincode: '603103',
      },
    });

    console.log('[Seed] Creating projects & milestones...');

    // 3. Projects
    // Project 1: Ginger Hotel Navalur (Civil renovation & water tank plastering)
    const project1 = await Project.create({
      projectId: 'GKA-2026-001',
      title: 'Ginger Hotel — Civil & Water Tank Renovation Works',
      category: 'renovation',
      clientId: gingerClient._id,
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
      progressPercent: 72,
      contractValuePaise: toPaise(1850000), // ₹18,50,000
      approvedVariationsPaise: toPaise(120000), // ₹1,20,000
      totalBudgetPaise: toPaise(1450000), // ₹14,50,000
      actualCostPaise: toPaise(1080000), // ₹10,80,000
      committedCostPaise: toPaise(150000), // ₹1,50,000
      invoicedAmountPaise: toPaise(1400000), // ₹14,00,000
      collectedAmountPaise: toPaise(1200000), // ₹12,00,000
      assignedManagerId: pm._id,
      assignedSupervisorId: supervisor._id,
    });

    // Project 2: Kelambakkam 3BHK Contemporary Villa
    const project2 = await Project.create({
      projectId: 'GKA-2026-002',
      title: 'Dr. Rajesh Residence — 2,400 Sq.Ft Duplex Villa',
      category: 'residential',
      clientId: residentialClient._id,
      siteAddress: {
        street: 'Plot 42, Green Avenue, Rajan Nagar',
        city: 'Kelambakkam',
        state: 'Tamil Nadu',
        pincode: '603103',
        landmark: 'Opposite Chettinad Health City',
      },
      scopeOfWork: [
        'Turnkey architectural design & 2D planning approvals',
        'RCC frame structure with column footings and Grade M25 concrete',
        'Wienerberger clay brick masonry and double coat plastering',
        'Full interior electrical, concealed plumbing and Kajaria flooring',
      ],
      startDate: new Date('2026-02-01'),
      targetEndDate: new Date('2026-09-30'),
      status: 'active',
      progressPercent: 42,
      contractValuePaise: toPaise(5400000), // ₹54,00,000
      approvedVariationsPaise: 0,
      totalBudgetPaise: toPaise(4300000), // ₹43,00,000
      actualCostPaise: toPaise(1820000), // ₹18,20,000
      committedCostPaise: toPaise(400000),
      invoicedAmountPaise: toPaise(2400000),
      collectedAmountPaise: toPaise(2200000),
      assignedManagerId: pm._id,
      assignedSupervisorId: supervisor._id,
    });

    // Milestones for Project 1
    const p1Milestones = [
      {
        projectId: project1._id,
        code: '01',
        title: 'Site Assessment & Scaffolding',
        description: 'Comprehensive structural leakage survey and heavy duty scaffolding setup.',
        plannedStartDate: new Date('2026-01-10'),
        plannedEndDate: new Date('2026-01-25'),
        actualStartDate: new Date('2026-01-10'),
        actualEndDate: new Date('2026-01-24'),
        weightagePercent: 15,
        progressPercent: 100,
        status: 'completed',
        orderIndex: 1,
      },
      {
        projectId: project1._id,
        code: '02',
        title: 'Chipping, Surface Prep & Crack Injection',
        description: 'High pressure hydro-wash and polyurethane crack injection grouting.',
        plannedStartDate: new Date('2026-01-26'),
        plannedEndDate: new Date('2026-02-20'),
        actualStartDate: new Date('2026-01-26'),
        actualEndDate: new Date('2026-02-18'),
        weightagePercent: 25,
        progressPercent: 100,
        status: 'completed',
        orderIndex: 2,
      },
      {
        projectId: project1._id,
        code: '03',
        title: 'Water Tank Waterproofing & Polymer Plastering',
        description: 'Fosroc 2-component polymer coat and CM 1:3 water repellent plastering.',
        plannedStartDate: new Date('2026-02-21'),
        plannedEndDate: new Date('2026-03-25'),
        actualStartDate: new Date('2026-02-21'),
        weightagePercent: 35,
        progressPercent: 90,
        status: 'in_progress',
        orderIndex: 3,
      },
      {
        projectId: project1._id,
        code: '04',
        title: 'Tile Laying & Corridor Civil Works',
        description: 'Heavy duty matte floor tiling in kitchen/laundry areas with epoxy grouting.',
        plannedStartDate: new Date('2026-03-26'),
        plannedEndDate: new Date('2026-04-10'),
        weightagePercent: 20,
        progressPercent: 30,
        status: 'in_progress',
        orderIndex: 4,
      },
      {
        projectId: project1._id,
        code: '05',
        title: 'Curing, Leak Testing & Handover',
        description: 'Hydrostatic pressure test for 72 hours, final cleaning and sign-off.',
        plannedStartDate: new Date('2026-04-11'),
        plannedEndDate: new Date('2026-04-15'),
        weightagePercent: 5,
        progressPercent: 0,
        status: 'pending',
        orderIndex: 5,
      },
    ];
    await Milestone.insertMany(p1Milestones);

    // Milestones for Project 2
    const p2Milestones = STANDARD_MILESTONES.map((m, idx) => {
      const pStart = new Date('2026-02-01');
      pStart.setDate(pStart.getDate() + idx * 40);
      const pEnd = new Date(pStart);
      pEnd.setDate(pEnd.getDate() + 40);

      let prog = 0;
      let status: 'completed' | 'in_progress' | 'pending' = 'pending';
      if (idx === 0) {
        prog = 100;
        status = 'completed';
      } else if (idx === 1) {
        prog = 100;
        status = 'completed';
      } else if (idx === 2) {
        prog = 65;
        status = 'in_progress';
      }

      return {
        projectId: project2._id,
        code: m.code,
        title: m.title,
        description: m.description,
        plannedStartDate: pStart,
        plannedEndDate: pEnd,
        weightagePercent: m.weightagePercent,
        progressPercent: prog,
        status,
        orderIndex: m.orderIndex,
      };
    });
    await Milestone.insertMany(p2Milestones);

    console.log('[Seed] Creating Leads & CRM records...');

    // 4. Leads
    await Lead.create([
      {
        name: 'K. Balaji (Tech Mahindra)',
        phone: '98402 33441',
        email: 'balaji.km@gmail.com',
        projectCategory: 'residential',
        siteLocation: 'Medavakkam, Chennai',
        city: 'Chennai',
        approxAreaSqFt: 1800,
        estimatedBudgetRupees: 4200000,
        message: 'Looking for complete turnkey villa construction on 30x40 south facing plot.',
        source: 'cost_estimator',
        status: 'site_visit_scheduled',
        preferredSiteVisitDate: new Date('2026-10-25'),
      },
      {
        name: 'Suresh Menon (Menon Logistics)',
        phone: '98841 99002',
        email: 'suresh@menonlogistics.in',
        projectCategory: 'commercial',
        siteLocation: 'Kelambakkam – Vandalur Road',
        city: 'Chennai',
        approxAreaSqFt: 4500,
        estimatedBudgetRupees: 9500000,
        message: 'Warehouse extension and structural PEB foundation works.',
        source: 'website_contact',
        status: 'contacted',
      },
    ]);

    console.log('[Seed] Creating Suppliers & Inventory...');

    // 5. Suppliers
    const supplier1 = await Supplier.create({
      name: 'Ultratech Cement & JSW Steel Agency',
      contactPerson: 'V. Ramanathan',
      phone: '98400 11223',
      email: 'ramanathan.cements@gmail.com',
      address: 'Kelambakkam Main Road, Chennai - 603103',
      category: 'cement_steel',
      gstin: '33AABCT9988H1ZA',
      paymentTermsDays: 30,
      outstandingBalancePaise: toPaise(185000),
    });

    const supplier2 = await Supplier.create({
      name: 'Rajan Blue Metal Aggregates & M-Sand',
      contactPerson: 'S. Selvam',
      phone: '98410 44556',
      email: 'rajan.quarry@gmail.com',
      address: 'Vandalur Quarry Road, Chennai',
      category: 'aggregates_sand',
      gstin: '33BBXPT4433K1ZQ',
      paymentTermsDays: 15,
      outstandingBalancePaise: toPaise(92000),
    });

    // Purchase Order
    await PurchaseOrder.create({
      poNumber: 'GKA-PO-2026-001',
      projectId: project1._id,
      projectTitle: project1.title,
      supplierId: supplier1._id,
      supplierName: supplier1.name,
      items: [
        {
          itemDescription: 'Ultratech 53-Grade OPC Cement (50kg bags)',
          unit: 'bags',
          quantityOrdered: 200,
          quantityReceived: 200,
          unitRatePaise: toPaise(410),
          totalPaise: toPaise(82000),
        },
        {
          itemDescription: 'Fosroc Brushbond 2-Component Waterproofing Polymer (Kit)',
          unit: 'nos',
          quantityOrdered: 25,
          quantityReceived: 25,
          unitRatePaise: toPaise(2800),
          totalPaise: toPaise(70000),
        },
      ],
      subtotalPaise: toPaise(152000),
      taxPaise: toPaise(27360),
      grandTotalPaise: toPaise(179360),
      status: 'received',
      deliveryAddress: project1.siteAddress.street,
      notes: 'Delivered directly to Ginger Hotel Navalur site.',
    });

    // Inventory Transactions (Live ledger)
    await InventoryTransaction.create([
      {
        projectId: project1._id,
        materialName: 'Ultratech 53-Grade OPC Cement',
        category: 'cement_steel',
        transactionType: 'purchase_receipt',
        quantity: 200,
        unit: 'bags',
        unitCostPaise: toPaise(410),
        totalValuePaise: toPaise(82000),
        recordedBy: supervisor._id,
        date: new Date('2026-02-15'),
      },
      {
        projectId: project1._id,
        materialName: 'Ultratech 53-Grade OPC Cement',
        category: 'cement_steel',
        transactionType: 'site_issue',
        quantity: 140,
        unit: 'bags',
        unitCostPaise: toPaise(410),
        totalValuePaise: toPaise(57400),
        notes: 'Issued for underground water tank 1st and 2nd coat plastering',
        recordedBy: supervisor._id,
        date: new Date('2026-02-22'),
      },
      {
        projectId: project1._id,
        materialName: 'Fosroc Brushbond Polymer',
        category: 'cement_steel',
        transactionType: 'purchase_receipt',
        quantity: 25,
        unit: 'nos',
        unitCostPaise: toPaise(2800),
        totalValuePaise: toPaise(70000),
        recordedBy: supervisor._id,
        date: new Date('2026-02-16'),
      },
      {
        projectId: project1._id,
        materialName: 'Fosroc Brushbond Polymer',
        category: 'cement_steel',
        transactionType: 'site_issue',
        quantity: 18,
        unit: 'nos',
        unitCostPaise: toPaise(2800),
        totalValuePaise: toPaise(50400),
        notes: 'Applied on inner tank face with mesh reinforcement',
        recordedBy: supervisor._id,
        date: new Date('2026-02-24'),
      },
    ]);

    console.log('[Seed] Creating Quotations, Invoices & Payments...');

    // 6. Quotation
    await Quotation.create({
      quotationNumber: 'GKA-QUO-2026-001',
      projectId: project1._id,
      clientId: gingerClient._id,
      clientName: gingerClient.name,
      clientAddress: gingerClient.billingAddress.street,
      projectTitle: project1.title,
      siteLocation: project1.siteAddress.street,
      items: [
        {
          id: 'item-1',
          category: 'structural',
          description: 'High-pressure water jet cleaning & loose concrete chipping in water tanks',
          unit: 'sq.ft',
          quantity: 3200,
          unitRatePaise: toPaise(18),
          amountPaise: toPaise(57600),
        },
        {
          id: 'item-2',
          category: 'finishing',
          description: 'Polymer modified water repellent cement plastering (15mm thick CM 1:3 with SBR)',
          unit: 'sq.ft',
          quantity: 3200,
          unitRatePaise: toPaise(85),
          amountPaise: toPaise(272000),
        },
        {
          id: 'item-3',
          category: 'finishing',
          description: 'Anti-skid vitreous vitrified ceramic floor tile laying with epoxy chemical grouting',
          unit: 'sq.ft',
          quantity: 2400,
          unitRatePaise: toPaise(120),
          amountPaise: toPaise(288000),
        },
        {
          id: 'item-4',
          category: 'civil',
          description: 'Brickwork rectification & crack stitching with carbon fiber laminates',
          unit: 'rft',
          quantity: 450,
          unitRatePaise: toPaise(350),
          amountPaise: toPaise(157500),
        },
      ],
      subtotalPaise: toPaise(775100),
      discountPaise: 0,
      cgstPaise: toPaise(69759),
      sgstPaise: toPaise(69759),
      igstPaise: 0,
      taxRatePercent: 18,
      totalAmountPaise: toPaise(914618),
      termsAndConditions: [
        '50% advance upon site mobilization and scaffolding installation.',
        '40% progressive payment upon completion of plastering and tile laying.',
        '10% upon 72-hour leak test verification and final handover.',
        'Materials used strictly as per specified brands (Ultratech, Fosroc, Kajaria).',
      ],
      revisionNumber: 1,
      status: 'approved',
      validUntil: new Date('2026-06-30'),
      approvedAt: new Date('2026-01-08'),
      approvedBy: admin._id,
      convertedToBudget: true,
    });

    // 7. Invoices & Payments
    const inv1 = await Invoice.create({
      invoiceNumber: 'GKA-INV-2026-001',
      projectId: project1._id,
      projectTitle: project1.title,
      clientId: gingerClient._id,
      clientName: gingerClient.name,
      billingAddress: gingerClient.billingAddress.street,
      items: [
        {
          description: 'Mobilization Advance & Milestone 01 (Scaffolding & Chipping completion)',
          quantity: 1,
          unit: 'lumpsum',
          unitPricePaise: toPaise(600000),
          totalPaise: toPaise(600000),
        },
      ],
      subtotalPaise: toPaise(600000),
      cgstPaise: toPaise(54000),
      sgstPaise: toPaise(54000),
      igstPaise: 0,
      totalAmountPaise: toPaise(708000),
      paidAmountPaise: toPaise(708000),
      dueAmountPaise: 0,
      issueDate: new Date('2026-01-28'),
      dueDate: new Date('2026-02-15'),
      status: 'paid',
    });

    const inv2 = await Invoice.create({
      invoiceNumber: 'GKA-INV-2026-002',
      projectId: project1._id,
      projectTitle: project1.title,
      clientId: gingerClient._id,
      clientName: gingerClient.name,
      billingAddress: gingerClient.billingAddress.street,
      items: [
        {
          description: 'Progressive Billing for Milestone 02 & 03 (Water tank plastering 80% completion)',
          quantity: 1,
          unit: 'lumpsum',
          unitPricePaise: toPaise(586440),
          totalPaise: toPaise(586440),
        },
      ],
      subtotalPaise: toPaise(586440),
      cgstPaise: toPaise(52780),
      sgstPaise: toPaise(52780),
      igstPaise: 0,
      totalAmountPaise: toPaise(692000),
      paidAmountPaise: toPaise(492000),
      dueAmountPaise: toPaise(200000),
      issueDate: new Date('2026-03-10'),
      dueDate: new Date('2026-03-25'),
      status: 'partially_paid',
    });

    // Payments
    await Payment.create({
      paymentNumber: 'GKA-REC-2026-001',
      projectId: project1._id,
      clientId: gingerClient._id,
      clientName: gingerClient.name,
      invoiceId: inv1._id,
      amountPaise: toPaise(708000),
      paymentDate: new Date('2026-02-05'),
      paymentMode: 'bank_transfer',
      transactionReference: 'HDFCR52026020588912',
      recordedBy: accounts._id,
      notes: 'NEFT credit from Roots Corporation Limited.',
    });

    await Payment.create({
      paymentNumber: 'GKA-REC-2026-002',
      projectId: project1._id,
      clientId: gingerClient._id,
      clientName: gingerClient.name,
      invoiceId: inv2._id,
      amountPaise: toPaise(492000),
      paymentDate: new Date('2026-03-18'),
      paymentMode: 'bank_transfer',
      transactionReference: 'HDFCR52026031844390',
      recordedBy: accounts._id,
      notes: 'Part-payment on RA Bill 02.',
    });

    // 8. Site Reports (Mobile Site Diary)
    await SiteReport.create([
      {
        projectId: project1._id,
        reportDate: new Date('2026-03-20'),
        weatherCondition: 'sunny',
        workCompletedSummary: 'Completed 2nd coat of Fosroc Brushbond polymer waterproofing inside overhead tank #2. Commenced scratch coat plastering on side walls. Masonry repair of external perimeter wall completed.',
        milestoneId: p1Milestones[2].projectId,
        milestoneTitle: 'Water Tank Waterproofing & Polymer Plastering',
        labourCount: {
          masons: 4,
          helpers: 6,
          carpenters: 0,
          plumbers: 2,
          electricians: 1,
          painters: 0,
          supervisors: 1,
          totalCount: 14,
        },
        materialsConsumedSummary: '28 bags Ultratech cement, 6 buckets Fosroc Brushbond, 1 roll alkali-resistant fiberglass mesh.',
        issuesOrDelays: 'None. Site progress adhering precisely to scheduled Gantt chart.',
        safetyObservations: 'Safety harnesses and helmets worn by all workers on scaffolding. First-aid kit inspected.',
        isPublishedToClient: true,
        publishedAt: new Date('2026-03-20T18:30:00Z'),
        supervisorId: supervisor._id,
        photos: [
          {
            url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80',
            caption: 'Polymer waterproof coating applied inside Tank #2 with fiberglass mesh',
            category: 'plastering',
          },
          {
            url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
            caption: 'Site inspection and thickness measurement by GKA Site Engineer',
            category: 'inspection',
          },
        ],
      },
      {
        projectId: project1._id,
        reportDate: new Date('2026-03-24'),
        weatherCondition: 'sunny',
        workCompletedSummary: 'Finished internal plastering with water repellent additive. Began surface curing with continuous mist sprayers. Completed corridor tile layout dry run with facility manager.',
        milestoneId: p1Milestones[2].projectId,
        milestoneTitle: 'Water Tank Waterproofing & Polymer Plastering',
        labourCount: {
          masons: 3,
          helpers: 5,
          carpenters: 0,
          plumbers: 1,
          electricians: 0,
          painters: 0,
          supervisors: 1,
          totalCount: 10,
        },
        materialsConsumedSummary: '15 bags cement, 1 bundle PVC curing pipes.',
        isPublishedToClient: true,
        publishedAt: new Date('2026-03-24T18:00:00Z'),
        supervisorId: supervisor._id,
        photos: [
          {
            url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&auto=format&fit=crop&q=80',
            caption: 'Smooth finish cement plastering on interior tank wall',
            category: 'plastering',
          },
        ],
      },
    ]);

    // 9. Expenses
    await Expense.create([
      {
        projectId: project1._id,
        category: 'materials',
        description: 'Payment for 200 bags Ultratech cement and waterproofing chemical',
        amountPaise: toPaise(179360),
        paidTo: 'Ultratech Cement & JSW Steel Agency',
        date: new Date('2026-02-18'),
        paymentMethod: 'bank_transfer',
        referenceNumber: 'TXN-998812',
        isApproved: true,
        approvedBy: admin._id,
        recordedBy: accounts._id,
      },
      {
        projectId: project1._id,
        category: 'labour',
        description: 'Weekly skilled mason and helper wages for tank chipping and plastering',
        amountPaise: toPaise(84000),
        paidTo: 'K. Murugan (Supervisor Imprest Account)',
        date: new Date('2026-02-23'),
        paymentMethod: 'upi',
        referenceNumber: 'UPI-774411',
        isApproved: true,
        recordedBy: accounts._id,
      },
      {
        projectId: project1._id,
        category: 'machinery',
        description: 'Heavy duty scaffolding rental and transportation for 30 days',
        amountPaise: toPaise(42000),
        paidTo: 'Rajan Scaffolding Works',
        date: new Date('2026-01-15'),
        paymentMethod: 'bank_transfer',
        referenceNumber: 'TXN-112233',
        isApproved: true,
        recordedBy: accounts._id,
      },
    ]);

    // 10. Documents
    await ProjectDocument.create([
      {
        projectId: project1._id,
        title: 'Approved Work Scope & Tender Specifications',
        fileName: 'Ginger_Hotel_Navalur_GKA_Scope_2026.pdf',
        fileSize: 2450000,
        fileType: 'application/pdf',
        category: 'contracts',
        fileUrl: '/uploads/Ginger_Hotel_Navalur_GKA_Scope_2026.pdf',
        uploadedBy: pm._id,
        visibleToClient: true,
        version: 1,
      },
      {
        projectId: project1._id,
        title: 'Civil & Plastering Technical Method Statement',
        fileName: 'Method_Statement_Waterproofing_Plastering.pdf',
        fileSize: 1820000,
        fileType: 'application/pdf',
        category: 'drawings',
        fileUrl: '/uploads/Method_Statement_Waterproofing_Plastering.pdf',
        uploadedBy: pm._id,
        visibleToClient: true,
        version: 1,
      },
    ]);

    console.log('[Seed] Database seeding completed successfully!');
    console.log('===========================================================');
    console.log('  TEST CREDENTIALS:');
    console.log('  Admin (Owner):       owner@gkaconstruction.com      / GKAadmin2026!');
    console.log('  Project Manager:     pm@gkaconstruction.com         / GKApm2026!');
    console.log('  Site Supervisor:     supervisor@gkaconstruction.com / GKAsuper2026!');
    console.log('  Accounts:            accounts@gkaconstruction.com   / GKAaccounts2026!');
    console.log('  Client (Ginger):     client@gingerhotel.com         / GKAclient2026!');
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
