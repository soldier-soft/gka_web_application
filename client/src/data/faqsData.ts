export interface IClientFaq {
  id: string;
  category: 'all' | 'cost' | 'boq' | 'approvals' | 'tracking' | 'warranty';
  categoryLabel: string;
  question: string;
  answer: string;
  highlights: string[];
}

export const CLIENT_FAQS: IClientFaq[] = [
  {
    id: 'faq-cost-per-sqft',
    category: 'cost',
    categoryLabel: 'Pricing & Packages',
    question: 'What is the construction cost per sq ft in Chennai and Tiruvannamalai?',
    answer:
      'At GKA Construction, residential building construction packages range from ₹1,850 per sq ft for Standard Civil Construction to ₹2,200 – ₹2,650 per sq ft for Premium Turnkey Delivery. Our rates include foundation engineering, RCC superstructure, solid masonry, plastering, premium flooring (Kajaria vitrified tiles), teakwood joinery, branded plumbing (Ashirvad/Supreme), fire-retardant wiring (Finolex/Havells), and 3-coat acrylic emulsion painting. Every rupee is accounted for in an itemized BOQ with zero hidden costs.',
    highlights: [
      'Standard Civil: ₹1,850/sq ft',
      'Turnkey Premium: ₹2,200 – ₹2,650/sq ft',
      '100% itemized line-item pricing',
      'Zero surprise extras on site',
    ],
  },
  {
    id: 'faq-boq-price-lock',
    category: 'boq',
    categoryLabel: 'Contracts & Brand Locks',
    question: 'How does GKA Construction guarantee zero hidden costs and no price escalation?',
    answer:
      'We never use vague lump-sum estimates. Before breaking ground, our quantity surveyors provide an exhaustive Bill of Quantities (BOQ) with mathematically calculated quantities of steel tonnage, cement bags, sand units, and plumbing fittings. We lock in Tier-1 primary brands (Tata Tiscon / Jindal Fe 550D TMT, UltraTech / Coromandel 53-grade cement) and bind disbursements strictly to physical milestone completion. Once signed, your contract price is protected against market volatility.',
    highlights: [
      'Tier-1 brand lock contract',
      'Milestone-linked escrow payments',
      'Exhaustive BOQ itemization',
      'Legally binding fixed price agreement',
    ],
  },
  {
    id: 'faq-plan-approvals',
    category: 'approvals',
    categoryLabel: 'Approvals & Permits',
    question: 'Do you assist with CMDA, DTCP, and local Panchayat building plan approvals?',
    answer:
      'Yes. Our in-house architectural and civil engineering team prepares complete 2D approval drawings, structural vetting certificates, setback verification diagrams, and rainwater harvesting plans in compliance with the Tamil Nadu Combined Development and Building Rules (TNCDBR). We manage the entire documentation and liaisoning process for CMDA, DTCP, and Town Panchayat plan sanction approvals.',
    highlights: [
      'Full architectural sanction drawings',
      'TNCDBR compliance verification',
      'Structural stability vetting sign-off',
      'Complete liaisoning support',
    ],
  },
  {
    id: 'faq-nri-progress-tracking',
    category: 'tracking',
    categoryLabel: 'NRI & Digital Tracking',
    question: 'How can NRI clients or out-of-town owners track real-time construction progress?',
    answer:
      'Every client receives exclusive credentials to our proprietary GKA ERP Client Portal. Our site supervisors upload daily geotagged site photographs, material delivery vouchers, concrete cube compressive test reports, and milestone stage sign-offs. You can inspect your project from anywhere in the world on mobile or laptop.',
    highlights: [
      'Daily geotagged photo progress logs',
      'Concrete strength test certificates',
      'Digital milestone payment receipts',
      'Dedicated Chief Site Engineer point-of-contact',
    ],
  },
  {
    id: 'faq-soil-testing-foundation',
    category: 'approvals',
    categoryLabel: 'Structural Engineering',
    question: 'What soil testing and foundation safety protocols are followed before construction begins?',
    answer:
      'We conduct on-site soil core sampling and laboratory Safe Bearing Capacity (SBC) testing in compliance with IS 2720 / IS 1892. Foundation depth, footing dimensions, and column rebar schedules are mathematically calculated based on the tested soil strata, eliminating foundation settlement and structural cracking risks.',
    highlights: [
      'Accredited soil lab SBC verification',
      'IS 456 & IS 1893 seismic compliance',
      'Total Station digital boundary survey',
      'Zero foundation settlement guarantee',
    ],
  },
  {
    id: 'faq-construction-timeline',
    category: 'tracking',
    categoryLabel: 'Timelines & Curing',
    question: 'What is the expected timeline to construct an independent home, and what curing protocol is used?',
    answer:
      'A typical 1,800 to 2,500 sq ft independent duplex home is completed in 5 to 7 months. We strictly enforce a mandatory 28-day continuous bunded water ponding curing period for all RCC slabs and column footings to ensure concrete achieves 100% of its characteristic compressive strength before subsequent loading.',
    highlights: [
      'Turnkey delivery in 5 to 7 months',
      '28-day continuous water ponding curing',
      'Structured milestone deadlines',
      'Penalty-backed on-time delivery clause',
    ],
  },
  {
    id: 'faq-warranty-handover',
    category: 'warranty',
    categoryLabel: 'Warranty & Handover',
    question: 'What warranties and post-handover support does GKA Construction provide?',
    answer:
      'Upon final 150-point quality audit and key handover, we provide a formal 5-Year Structural Stability Warranty certificate, complete As-Built electrical and plumbing conduit drawings, equipment OEM warranties, and lifetime portal ticket access for prompt maintenance assistance.',
    highlights: [
      '5-Year Structural Stability Warranty',
      '150-point snag inspection audit',
      'Complete As-Built MEP schematic dossier',
      'Ceremonial key handover packet',
    ],
  },
];
