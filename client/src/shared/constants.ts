// GKA Construction Authentic Company Constants & Defaults

export const GKA_COMPANY = {
  name: 'GKA CONSTRUCTION',
  legalName: 'GKA Construction',
  tagline: 'BUILDING TRUST. DELIVERING QUALITY.',
  subTagline: 'Complete building construction, renovation, design, interiors, civil & allied works — under one roof.',
  gstin: '33CDYPA3555M2ZZ',
  pan: 'CDYPA3555M',
  phone: '+91 88380 30917',
  phoneDisplay: '88380 30917',
  email: 'gkaconstruction51@gmail.com',
  website: 'www.gkaconstruction.com',
  domain: 'gkaconstruction.com',
  experienceYears: 15,
  registeredOffice: {
    addressLine: 'No. 965, Pillayar Kovil Street',
    area: 'Theppanandhal, Kelur',
    district: 'Tiruvannamalai District',
    state: 'Tamil Nadu',
    pincode: '606907',
    full: 'No. 965, Pillayar Kovil Street, Theppanandhal, Kelur, Tiruvannamalai District – 606907, Tamil Nadu'
  },
  chennaiBranch: {
    addressLine: 'Rajan Nagar',
    landmark: 'Kelambakkam – Vandalur Junction',
    city: 'Chennai',
    state: 'Tamil Nadu',
    full: 'Rajan Nagar, Kelambakkam – Vandalur Junction, Chennai, Tamil Nadu'
  },
  bankDetails: {
    accountName: 'GKA CONSTRUCTION',
    accountNumber: '50200088912345',
    bankName: 'HDFC Bank',
    branch: 'Kelambakkam Branch, Chennai',
    ifscCode: 'HDFC0001824',
    upiId: 'gkaconstruction@hdfcbank'
  },
  representativeClients: [
    {
      clientName: 'Roots Corporation Limited (Ginger Hotel)',
      location: 'Navalur, Chennai',
      scope: 'Civil / renovation-related works including water tank plastering and tile-related works.'
    }
  ]
};

export const STANDARD_MILESTONES = [
  {
    code: '01',
    title: 'Planning & Approvals',
    description: 'Requirements, 2D architectural layout, structural drawings, soil testing, permits and estimation.',
    weightagePercent: 10,
    orderIndex: 1
  },
  {
    code: '02',
    title: 'Substructure & Foundation',
    description: 'Site clearance, excavation, anti-termite treatment, PCC, column footings, plinth beam and backfilling.',
    weightagePercent: 20,
    orderIndex: 2
  },
  {
    code: '03',
    title: 'Superstructure & Masonry',
    description: 'RCC columns, lintels, roof beams, slab casting, brick/solid block masonry walls and staircase.',
    weightagePercent: 25,
    orderIndex: 3
  },
  {
    code: '04',
    title: 'MEP & Civil Finishing',
    description: 'Concealed electrical conduit & plumbing lines, internal & external sand-face cement plastering.',
    weightagePercent: 20,
    orderIndex: 4
  },
  {
    code: '05',
    title: 'Interiors & Architectural Finishing',
    description: 'Vitrified tile / granite flooring, wall putty, primer & emulsion painting, doors, windows & bathroom fittings.',
    weightagePercent: 15,
    orderIndex: 5
  },
  {
    code: '06',
    title: 'Quality Audit, Snagging & Handover',
    description: 'Final plumbing/electrical testing, deep cleaning, client joint walkthrough, snag list rectification and keys handover.',
    weightagePercent: 10,
    orderIndex: 6
  }
];

export const STANDARD_RATE_LIBRARY = [
  {
    category: 'civil',
    description: 'Earthwork excavation in foundation trenches including shoring and disposal',
    unit: 'cu.ft',
    unitRateRupees: 18,
    breakdown: { material: 0, labour: 15, equipment: 3 }
  },
  {
    category: 'structural',
    description: 'PCC 1:4:8 base concrete in foundation using 40mm broken blue metal stone',
    unit: 'cu.ft',
    unitRateRupees: 145,
    breakdown: { material: 105, labour: 30, equipment: 10 }
  },
  {
    category: 'structural',
    description: 'RCC M20/M25 design mix concrete for columns, beams and roof slab including shuttering',
    unit: 'cu.ft',
    unitRateRupees: 380,
    breakdown: { material: 260, labour: 95, equipment: 25 }
  },
  {
    category: 'masonry',
    description: 'Brickwork in cement mortar 1:6 using first-class country burnt red bricks (9" thick)',
    unit: 'sq.ft',
    unitRateRupees: 110,
    breakdown: { material: 75, labour: 32, equipment: 3 }
  },
  {
    category: 'masonry',
    description: 'Solid concrete block masonry (6" thick) in CM 1:5 mix',
    unit: 'sq.ft',
    unitRateRupees: 85,
    breakdown: { material: 55, labour: 27, equipment: 3 }
  },
  {
    category: 'finishing',
    description: 'Internal wall cement plastering 12mm thick in CM 1:4 mix with smooth float finish',
    unit: 'sq.ft',
    unitRateRupees: 38,
    breakdown: { material: 18, labour: 18, equipment: 2 }
  },
  {
    category: 'finishing',
    description: 'External double coat weather-shield sand face plastering 20mm thick in CM 1:4 mix',
    unit: 'sq.ft',
    unitRateRupees: 48,
    breakdown: { material: 24, labour: 21, equipment: 3 }
  },
  {
    category: 'finishing',
    description: 'Vitrified floor tiles laying (4x2 ft or 2x2 ft) on cement bed including grouting',
    unit: 'sq.ft',
    unitRateRupees: 75,
    breakdown: { material: 42, labour: 30, equipment: 3 }
  },
  {
    category: 'finishing',
    description: 'Interior wall painting 2 coats Birla putty, 1 coat primer & 2 coats premium acrylic emulsion',
    unit: 'sq.ft',
    unitRateRupees: 32,
    breakdown: { material: 18, labour: 13, equipment: 1 }
  },
  {
    category: 'mep',
    description: 'Complete concealed electrical point wiring (Finolex / Havells FR cables with modular boxes)',
    unit: 'nos',
    unitRateRupees: 950,
    breakdown: { material: 550, labour: 380, equipment: 20 }
  },
  {
    category: 'mep',
    description: 'Complete plumbing toilet package including CPVC concealed lines, drainage and sanitary ware fixing',
    unit: 'nos',
    unitRateRupees: 14500,
    breakdown: { material: 9500, labour: 4500, equipment: 500 }
  }
];

// Featured Projects Category Filters
export const PORTFOLIO_PROJECT_FILTERS = [
  { id: 'all', label: 'All Projects' },
  { id: 'residential', label: 'Residential Homes' },
  { id: 'villas', label: 'Villas' },
  { id: 'commercial', label: 'Commercial & Hospitality' },
  { id: 'renovation', label: 'Renovation & Civil Works' },
  { id: 'civil_finishing', label: 'Tiling & Finishing' },
  { id: 'maintenance', label: 'Building Maintenance' }
];

// Configurable Square-Footage Ranges for 50+ House Construction Ideas
export const SQUARE_FOOTAGE_RANGES = [
  { id: 'all', label: 'All Sizes', minSqFt: 0, maxSqFt: 100000 },
  { id: 'under_600', label: 'Under 600 sq. ft.', minSqFt: 0, maxSqFt: 600 },
  { id: '600_800', label: '600–800 sq. ft.', minSqFt: 600, maxSqFt: 800 },
  { id: '800_1000', label: '800–1,000 sq. ft.', minSqFt: 800, maxSqFt: 1000 },
  { id: '1000_1200', label: '1,000–1,200 sq. ft.', minSqFt: 1000, maxSqFt: 1200 },
  { id: '1200_1500', label: '1,200–1,500 sq. ft.', minSqFt: 1200, maxSqFt: 1500 },
  { id: '1500_2000', label: '1,500–2,000 sq. ft.', minSqFt: 1500, maxSqFt: 2000 },
  { id: '2000_2500', label: '2,000–2,500 sq. ft.', minSqFt: 2000, maxSqFt: 2500 },
  { id: 'above_2500', label: 'Above 2,500 sq. ft.', minSqFt: 2500, maxSqFt: 100000 }
];

// Additional Filters for Exploration
export const BEDROOM_OPTIONS = [
  { id: 'all', label: 'All Bedrooms' },
  { id: '1_bhk', label: '1 BHK' },
  { id: '2_bhk', label: '2 BHK' },
  { id: '3_bhk', label: '3 BHK' },
  { id: '4_bhk_plus', label: '4 BHK & Above' },
  { id: 'not_applicable', label: 'Layout Reference' }
];

export const PROPERTY_TYPE_OPTIONS = [
  { id: 'all', label: 'All Property Types' },
  { id: 'single_floor', label: 'Single-Floor House' },
  { id: 'duplex', label: 'Duplex House' },
  { id: 'villa', label: 'Independent Villa' },
  { id: 'compact_home', label: 'Compact Urban Home' },
  { id: 'commercial', label: 'Commercial Space' },
  { id: 'renovation', label: 'Renovation Scope' }
];

export const ARCHITECTURAL_STYLE_OPTIONS = [
  { id: 'all', label: 'All Styles' },
  { id: 'contemporary', label: 'Contemporary Design' },
  { id: 'traditional', label: 'Traditional Tamil Nadu' },
  { id: 'modern', label: 'Modern Front Elevation' },
  { id: 'minimalist', label: 'Minimalist & Efficient' },
  { id: 'elevation_design', label: 'Exterior Elevation' },
  { id: 'interior_reference', label: 'Interior & Finishing' }
];

export const CONCEPT_TYPE_OPTIONS = [
  { id: 'all', label: 'All Concepts' },
  { id: 'compact_budget', label: 'Compact-Budget Concept' },
  { id: 'premium_finish', label: 'Premium-Finish Concept' },
  { id: 'standard_family', label: 'Standard Family Living' }
];

// Official Disclaimer for Pricing & Plans
export const ESTIMATION_DISCLAIMER_TEXT =
  'Every project depends on plot dimensions, soil and site conditions, design requirements, material selection, structural specifications and finishing preferences. The ideas shown are references only. For a project-specific recommendation, detailed specifications and an estimate, please request a site visit or contact our team by phone or email.';

