export interface IProcedureStep {
  id: string;
  stepNumber: string;
  stageBadge: string;
  title: string;
  subtitle: string;
  duration: string;
  phaseCategory: string;
  summary: string;
  keyActivities: string[];
  deliverables: string[];
  qualityControlPoint: string;
  primaryImage: string;
  imageAlt: string;
  metricBadge: {
    value: string;
    label: string;
  };
  highlightFeature: string;
  technicalSpecs: { label: string; value: string }[];
}

export const CONSTRUCTION_PROCEDURES: IProcedureStep[] = [
  {
    id: 'step-01-feasibility',
    stepNumber: '01',
    stageBadge: 'Stage 01 • Pre-Construction',
    title: 'Site Feasibility & Soil Investigation',
    subtitle: 'Topographic Digital Survey, Soil Bearing Capacity & Vaastu Assessment',
    duration: '2 – 4 Days',
    phaseCategory: 'Pre-Construction',
    summary:
      'Every durable structure begins beneath the surface. Our civil engineers conduct on-site soil core sampling, Safe Bearing Capacity (SBC) laboratory testing, and Total Station boundary surveys to eliminate foundation settlement risk and ensure full municipal compliance.',
    keyActivities: [
      'In-situ soil core drilling and Safe Bearing Capacity (SBC) lab testing',
      'Total Station digital topographic survey for accurate road-level & boundary alignment',
      'Ground water table analysis and monsoon drainage runoff planning',
      'Vaastu orientation layout analysis and local municipal setback verification',
    ],
    deliverables: [
      'Certified Soil Test Report (SBC & Strata Profile)',
      'Total Station Digital Contour & Boundary Map',
      'Site Feasibility & Municipal Setback Scorecard',
    ],
    qualityControlPoint:
      'Foundation depth and footing dimensions are mathematically engineered to match tested soil strata (clay, silt, sandy loam, or weathered rock).',
    primaryImage:
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=1200&auto=format&fit=crop&q=80',
    imageAlt: 'Civil engineers conducting topographical and soil survey on site',
    metricBadge: {
      value: '100% Zero-Settlement',
      label: 'Engineered Foundation Guarantee',
    },
    highlightFeature: 'Accredited Soil Laboratory SBC Verification',
    technicalSpecs: [
      { label: 'Soil Testing Standard', value: 'IS 2720 / IS 1892' },
      { label: 'Survey Equipment', value: 'Leica / Pentax Total Station' },
      { label: 'Setback Compliance', value: 'Tamil Nadu Combined Dev & Building Rules' },
    ],
  },
  {
    id: 'step-02-architectural-planning',
    stepNumber: '02',
    stageBadge: 'Stage 02 • Architecture & Engineering',
    title: 'Architectural 2D Planning & 3D Visualization',
    subtitle: 'Vaastu-Compliant Space Planning, 3D Elevation Modeling & Structural CAD',
    duration: '7 – 10 Days',
    phaseCategory: 'Design & Engineering',
    summary:
      'We bring your dream living space into vivid reality. Our architectural team crafts functional, Vaastu-optimized 2D floor layouts, followed by photo-realistic 3D exterior elevations, structural column schedules, and concealed MEP engineering drawings.',
    keyActivities: [
      'Bespoke 2D floor plans optimized for cross-ventilation and natural daylight ingress',
      'Photorealistic 3D exterior elevation renderings with material texture & lighting visualization',
      'Structural CAD framing drawings specifying column coordinates, beam depths, and rebar schedules',
      'Detailed MEP coordination schematics for concealed electrical, plumbing, and air-conditioning conduits',
    ],
    deliverables: [
      'Complete 2D Architectural Working Drawing Set',
      'High-Resolution 3D Exterior Elevation Renders',
      'Vetted Structural Framing & Rebar Bending Schedules',
      'Panchayat / DTCP / CMDA Municipal Approval Dossier',
    ],
    qualityControlPoint:
      'Clients review and approve every room dimension, ceiling height, and window placement in full 3D visualization before a single rupee is poured into concrete.',
    primaryImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    imageAlt: 'Modern architectural residential villa 3D design and blueprints',
    metricBadge: {
      value: '100% Client Approved',
      label: '3D Elevation Sign-Off',
    },
    highlightFeature: 'Vaastu Shastra & Cross-Ventilation Certified',
    technicalSpecs: [
      { label: 'Structural Standard', value: 'IS 456:2000 & IS 1893 (Earthquake)' },
      { label: 'CAD Software', value: 'Autodesk AutoCAD & Revit 3D' },
      { label: 'Visualization Output', value: '4K Ultra-HD Photorealistic Renders' },
    ],
  },
  {
    id: 'step-03-boq-contract',
    stepNumber: '03',
    stageBadge: 'Stage 03 • Commercial Transparency',
    title: 'Itemized BOQ Contract & Commercial Transparency',
    subtitle: 'Exhaustive Bill of Quantities, Fixed-Price Commitment & Stage Milestones',
    duration: '3 – 5 Days',
    phaseCategory: 'Commercials & Agreement',
    summary:
      'No surprise extras, no hidden escalations. We provide an exhaustive, line-item Bill of Quantities (BOQ) with clearly named tier-1 brands (Tata Tiscon / Jindal steel, UltraTech / Coromandel cement, Kajaria tiles) and a milestone-linked escrow payment schedule.',
    keyActivities: [
      'Exhaustive item-by-item quantification of concrete volume, steel tonnage, brickwork, and joinery',
      'Strict brand lock: Tata Tiscon / Jindal 550D TMT, UltraTech / Coromandel 53-grade cement, Kajaria tiles',
      'Structured milestone disbursement schedule linked strictly to physical stage completion',
      'Comprehensive construction agreement on legal stamp paper protecting client guarantees',
    ],
    deliverables: [
      'Comprehensive Itemized BOQ Document with Material Brand Schedule',
      'Legally Binding Fixed-Price Construction Agreement',
      'Milestone-Linked Escrow Payment Schedule',
    ],
    qualityControlPoint:
      'Zero surprise costs guaranteed. You only pay for verified, physical milestone progress after inspecting site work and engineering sign-offs.',
    primaryImage:
      'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1200&auto=format&fit=crop&q=80',
    imageAlt: 'Detailed construction contract, BOQ calculation, and architectural drawings',
    metricBadge: {
      value: 'Zero Cost Overruns',
      label: 'Fixed Price BOQ Guarantee',
    },
    highlightFeature: 'Tier-1 Brand Commitment Contract',
    technicalSpecs: [
      { label: 'TMT Steel Grade', value: 'Fe 550D Primary Steel (Tata / Jindal)' },
      { label: 'Cement Grade', value: '53 Grade OPC / PPC (UltraTech / Coromandel)' },
      { label: 'Escrow Terms', value: 'Milestone Completion Verification Required' },
    ],
  },
  {
    id: 'step-04-civil-execution',
    stepNumber: '04',
    stageBadge: 'Stage 04 • Structural Engineering',
    title: 'Heavy Civil & Superstructure Execution',
    subtitle: 'Foundation Footings, Plinth Beams, RCC Slab Casting & 28-Day Water Curing',
    duration: '60 – 90 Days',
    phaseCategory: 'Civil Construction',
    summary:
      'Physical construction kicks off with high-precision excavation, anti-termite chemical soil barrier, isolated RCC column footings, plinth beams, and robust masonry. Every slab is cast using calibrated M20/M25 concrete, needle vibrators, and continuous 28-day water pond curing.',
    keyActivities: [
      'Anti-termite chemical soil barrier treatment beneath foundation and plinth backfill',
      'Fabrication and placement of Fe 550D TMT rebar column cages with concrete cover blocks',
      'M20/M25 machine-mixed / RMC concrete pouring using mechanical needle vibrators to eliminate voids',
      'Rigorous 28-day continuous water ponding curing for maximum structural compressive strength',
    ],
    deliverables: [
      'Daily Digital Progress Logs with Geotagged Site Photos on Client Portal',
      '7-Day & 28-Day Concrete Cube Compressive Strength Test Certificates',
      'Rebar Mill Test Certificates (Yield Strength & Elongation)',
    ],
    qualityControlPoint:
      'Pre-pour structural checklist verification: column plumb, shuttering rigidity, rebar clear cover, and laser-guided slab level verification before every concrete pour.',
    primaryImage:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=80',
    imageAlt: 'Heavy civil concrete casting, rebar reinforcement, and structural columns',
    metricBadge: {
      value: '28-Day Curing',
      label: 'Continuous Water Ponding Curing',
    },
    highlightFeature: 'Real-Time ERP Photo Tracking & Daily Logs',
    technicalSpecs: [
      { label: 'Concrete Mix Design', value: 'Design Mix M20 / M25 with Slump Verification' },
      { label: 'Vibration Standard', value: 'High-frequency needle vibrators' },
      { label: 'Curing Protocol', value: '28 days continuous bunded water ponding' },
    ],
  },
  {
    id: 'step-05-finishing-mep',
    stepNumber: '05',
    stageBadge: 'Stage 05 • Architectural Finishing & MEP',
    title: 'MEP Infrastructure, Plastering & Architectural Finishing',
    subtitle: 'Concealed Wiring, Pressure-Tested Plumbing, Laser Tiling & Premium Painting',
    duration: '45 – 60 Days',
    phaseCategory: 'Finishing & Utilities',
    summary:
      'Where raw civil concrete transforms into refined elegance. We execute concealed fire-retardant electrical wiring, hydrostatic pressure-tested plumbing lines, double-coat waterproof plastering, laser-aligned vitrified tiling, and multi-coat acrylic emulsion painting.',
    keyActivities: [
      'Concealed heavy-gauge PVC conduit laying with Finolex/Havells FR copper wiring & modular metal boxes',
      'Ashirvad/Supreme CPVC water supply & SWR drainage piping with hydrostatic pressure leak testing',
      'Double-coat sand-face cement plastering with right-angle corner beading and plumb alignment',
      'Vitrified tile laying using polymer-modified non-shrink adhesive and mechanical leveling spacers',
    ],
    deliverables: [
      'Hydrostatic Plumbing Pressure Test Certificate (Zero Leakage Verification)',
      'Electrical Insulation Resistance (Megger) Test Report',
      'Waterproofing Slurry Membrane Inspection & Warranty Sign-off',
    ],
    qualityControlPoint:
      'Zero tile hollowness guaranteed with 100% adhesive bedding checked via wooden mallet acoustic tapping audit across all living spaces.',
    primaryImage:
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1200&auto=format&fit=crop&q=80',
    imageAlt: 'Master craftsmen installing precision vitrified tiles with laser alignment',
    metricBadge: {
      value: 'Zero Hollow Tiles',
      label: '100% Adhesive Bedding Audit',
    },
    highlightFeature: 'Hydrostatic Pressure Tested Plumbing Lines',
    technicalSpecs: [
      { label: 'Plumbing Grade', value: 'Ashirvad / Supreme CPVC SDR 11' },
      { label: 'Electrical Wiring', value: 'Finolex / Havells FR 1100V Grade' },
      { label: 'Tile Adhesive', value: 'Polymer-modified non-shrink C2TE adhesive' },
    ],
  },
  {
    id: 'step-06-handover',
    stepNumber: '06',
    stageBadge: 'Stage 06 • Commissioning & Handover',
    title: '150-Point Quality Audit, Deep Cleaning & Key Handover',
    subtitle: 'Exhaustive Snag Audit, Deep Sanitization, Structural Warranty & Keys Handover',
    duration: '7 – 10 Days',
    phaseCategory: 'Handover & Warranty',
    summary:
      'The triumphant culmination of your dream home. Our senior quality engineers execute a comprehensive 150-point snag checklist covering plumbing gradient, door latching, electrical circuits, and surface finishes. Following industrial deep-cleaning, we ceremonially hand over the keys.',
    keyActivities: [
      'Comprehensive 150-point engineering snag checklist covering MEP, joinery, and aesthetic finishes',
      'Industrial deep cleaning of all floors, window glass, sanitaryware, and terrace surfaces',
      'Compilation of complete As-Built electrical and plumbing conduit schematics for future maintenance',
      'Ceremonial key handover, warranty card issuance, and client portal transition to maintenance mode',
    ],
    deliverables: [
      'Ceremonial Key Handover Box with Master & Duplicate Sets',
      'Official As-Built Electrical & Plumbing Routing Drawings',
      '5-Year Comprehensive Structural Warranty Certificate',
      'Equipment & Fitting OEM Warranty Dossier & User Manuals',
    ],
    qualityControlPoint:
      'Formal client walkthrough with our Chief Project Engineer; every snag item is resolved and signed off before final milestone closure.',
    primaryImage:
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&auto=format&fit=crop&q=80',
    imageAlt: 'Completed luxury residential home ready for key handover and possession',
    metricBadge: {
      value: '150-Point Check',
      label: 'Zero-Snag Handover Audit',
    },
    highlightFeature: '5-Year Structural Stability Warranty',
    technicalSpecs: [
      { label: 'Audit Scope', value: '150 structural, MEP, and aesthetic checkpoints' },
      { label: 'Warranty Coverage', value: '5-Year structural stability certificate' },
      { label: 'Post-Handover Support', value: 'Digital portal ticket tracking & assistance' },
    ],
  },
];
