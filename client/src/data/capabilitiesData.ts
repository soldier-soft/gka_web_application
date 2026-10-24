import { Home, Layers, Hammer, HardHat } from 'lucide-react';
import { IPortfolioProject } from '@shared/types';

export interface ICapabilityProject {
  id: string;
  title: string;
  category: string;
  badge: string;
  location: string;
  description: string;
  draftCopyNotice: string;
  officialReferenceUrl: string;
  officialReferenceLabel: string;
  suggestedSlideshow: string;
  coverImage: string;
  workScopeItems: string[];
  modalProjectData: IPortfolioProject;
}

export const CAPABILITY_PROJECTS: ICapabilityProject[] = [
  {
    id: 'cap-ginger-vadapalani',
    title: 'Ginger Hotel – Vadapalani, Chennai',
    category: 'Hospitality & Commercial Civil Works',
    badge: 'Project Types & Construction Capabilities',
    location: 'Vadapalani, Chennai, Tamil Nadu',
    description:
      'Showcase this as a client project only if GKA performed work at this specific property. If verified, document the actual maintenance, finishing, refurbishment or civil-work scope rather than implying complete hotel construction without evidence.',
    draftCopyNotice:
      'Demonstrated under our Hospitality Civil Works Capability framework. Work relationship subject to property-specific records.',
    officialReferenceUrl: 'https://www.gingerhotels.com/?utm_source=chatgpt.com',
    officialReferenceLabel: 'Official Reference: Ginger Hotels',
    suggestedSlideshow: 'Approved project photos, work-in-progress images, tile finishes and completed areas.',
    coverImage: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=1200&auto=format&fit=crop&q=80',
    workScopeItems: [
      'Commercial hospitality maintenance and surface refurbishment',
      'Chemical-resistant tile joint repair and epoxy re-grouting',
      'Water storage facility inspections and waterproofing recoating',
      'Controlled night-shift execution to avoid guest disturbance',
    ],
    modalProjectData: {
      _id: 'cap-ginger-vadapalani-modal',
      title: 'Ginger Hotel – Vadapalani (Hospitality & Commercial Civil Capabilities)',
      slug: 'ginger-hotel-vadapalani-capability',
      category: 'renovation',
      categoryLabel: 'Hospitality & Commercial Civil Works',
      location: 'Vadapalani, Chennai, Tamil Nadu',
      description:
        'Technical capabilities in hospitality maintenance, finishing, refurbishment and specialized civil works adhering to commercial hospitality specifications.',
      workScope: [
        'Commercial hospitality maintenance and surface refurbishment',
        'Chemical-resistant tile joint repair and epoxy re-grouting',
        'Water storage facility inspections and waterproofing recoating',
        'Controlled night-shift execution to avoid guest disturbance',
      ],
      projectType: 'concept_reference',
      status: 'Design Reference',
      approxAreaSqFt: 4200,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=1200&auto=format&fit=crop&q=80',
          alt: 'Hospitality civil maintenance and tile work reference',
          caption: 'Specialized floor refurbishment and waterproofing in commercial hospitality setting',
          order: 1,
          isCover: true,
          imageType: 'illustrative_reference',
        },
      ],
      isVerified: false,
      isFeatured: false,
      isPublished: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
  {
    id: 'cap-taj-chennai',
    title: 'Taj Hotels – Chennai',
    category: 'Premium Hospitality',
    badge: 'Project Types & Construction Capabilities',
    location: 'Chennai, Tamil Nadu',
    description:
      'GKA Construction undertakes verified scopes of work in premium hospitality environments with an emphasis on workmanship, site coordination and finishing quality. Heritage restoration, structural engineering or direct brand claims are published only where substantiated by contract records.',
    draftCopyNotice:
      'Draft copy, for use only after project verification: GKA Construction undertook [verified scope of work] at [specific property], Chennai, with an emphasis on workmanship, site coordination and finishing quality.',
    officialReferenceUrl: 'https://www.ihcltata.com/?utm_source=chatgpt.com',
    officialReferenceLabel: 'Official Brand Reference: The Indian Hotels Company Limited',
    suggestedSlideshow: 'Actual authorized project images, detail shots of the work performed and approved finished areas.',
    coverImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop&q=80',
    workScopeItems: [
      'High-spec architectural civil finishing & marble/tile alignment',
      'Double-coat sand face plastering with laser plumb check',
      'Structural masonry repairs in service & operational corridors',
      'Rigorous site coordination adhering to 5-star brand guidelines',
    ],
    modalProjectData: {
      _id: 'cap-taj-chennai-modal',
      title: 'Premium Hospitality Civil Finishing & Site Coordination',
      slug: 'taj-hotels-chennai-capability',
      category: 'renovation',
      categoryLabel: 'Premium Hospitality',
      location: 'Chennai, Tamil Nadu',
      description:
        'Capabilities in high-specification civil finishing, site coordination, and structural repair adhering to 5-star hospitality standards.',
      workScope: [
        'High-spec architectural civil finishing & marble/tile alignment',
        'Double-coat sand face plastering with laser plumb check',
        'Structural masonry repairs in service & operational corridors',
        'Rigorous site coordination adhering to 5-star brand guidelines',
      ],
      projectType: 'concept_reference',
      status: 'Design Reference',
      approxAreaSqFt: 5000,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop&q=80',
          alt: 'Premium hospitality civil finishing reference',
          caption: 'High-specification surface finishing and architectural coordination',
          order: 1,
          isCover: true,
          imageType: 'illustrative_reference',
        },
      ],
      isVerified: false,
      isFeatured: false,
      isPublished: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
  {
    id: 'cap-novotel-chennai',
    title: 'Novotel – Chennai',
    category: 'Commercial & Hospitality Facilities',
    badge: 'Project Types & Construction Capabilities',
    location: 'Chennai, Tamil Nadu',
    description:
      'Our capability in commercial and hospitality facilities involves actual civil, repair, renovation or finishing scopes, delivered with strict attention to site requirements, environmental safety and quality checks.',
    draftCopyNotice:
      'Draft copy, for use only after project verification: Our work at [verified Novotel property] involved [actual civil, repair, renovation or finishing scope], delivered with attention to site requirements and quality checks.',
    officialReferenceUrl: 'https://all.accor.com/?utm_source=chatgpt.com',
    officialReferenceLabel: 'Official Hotel Reference: Accor Official Website',
    suggestedSlideshow: 'Approved project photographs, the specific work area and completed finishes.',
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80',
    workScopeItems: [
      'Commercial wet-area waterproofing and tile joint sealing',
      'Structural crack bridging using elastomeric coatings',
      'Service corridor wall plastering and high-durability floor screed',
      'Comprehensive inspection checklists before client sign-off',
    ],
    modalProjectData: {
      _id: 'cap-novotel-chennai-modal',
      title: 'Commercial & Hospitality Facilities Civil Capabilities',
      slug: 'novotel-chennai-capability',
      category: 'commercial',
      categoryLabel: 'Commercial & Hospitality Facilities',
      location: 'Chennai, Tamil Nadu',
      description:
        'Civil, repair, renovation and finishing capability delivered with attention to commercial facility requirements and quality checks.',
      workScope: [
        'Commercial wet-area waterproofing and tile joint sealing',
        'Structural crack bridging using elastomeric coatings',
        'Service corridor wall plastering and high-durability floor screed',
        'Comprehensive inspection checklists before client sign-off',
      ],
      projectType: 'concept_reference',
      status: 'Design Reference',
      approxAreaSqFt: 3800,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80',
          alt: 'Commercial hospitality civil renovation reference',
          caption: 'Specialized civil finishing and floor screed in commercial hospitality facility',
          order: 1,
          isCover: true,
          imageType: 'illustrative_reference',
        },
      ],
      isVerified: false,
      isFeatured: false,
      isPublished: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
  {
    id: 'cap-vivanta-chennai',
    title: 'Vivanta – Chennai',
    category: 'Hospitality Interiors & Civil Finishes',
    badge: 'Project Types & Construction Capabilities',
    location: 'Chennai, Tamil Nadu',
    description:
      'GKA Construction provides verified scopes of work in hospitality environments, with a dedicated focus on workmanship, site coordination, and the required interior and architectural finishing standards.',
    draftCopyNotice:
      'Draft copy, for use only after project verification: GKA Construction provided [verified scope] at [specific Vivanta property], with a focus on workmanship, coordination and the required finishing standards.',
    officialReferenceUrl: 'https://www.ihcltata.com/?utm_source=chatgpt.com',
    officialReferenceLabel: 'Official Brand Reference: IHCL Official Website',
    suggestedSlideshow: 'Approved project photos, material details and before-and-after images where available.',
    coverImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&auto=format&fit=crop&q=80',
    workScopeItems: [
      'Large-format interior tile installation with zero lip-page',
      'Acoustic partition block masonry and structural drylining',
      'Epoxy-grouted wet areas and commercial shower civil works',
      'Smooth putty preparation ready for premium wall coverings',
    ],
    modalProjectData: {
      _id: 'cap-vivanta-chennai-modal',
      title: 'Hospitality Interiors & Civil Finishes Capability',
      slug: 'vivanta-chennai-capability',
      category: 'renovation',
      categoryLabel: 'Hospitality Interiors & Civil Finishes',
      location: 'Chennai, Tamil Nadu',
      description:
        'Capability in high-precision tile installation, interior civil work, and layout adjustments meeting upscale hospitality specifications.',
      workScope: [
        'Large-format interior tile installation with zero lip-page',
        'Acoustic partition block masonry and structural drylining',
        'Epoxy-grouted wet areas and commercial shower civil works',
        'Smooth putty preparation ready for premium wall coverings',
      ],
      projectType: 'concept_reference',
      status: 'Design Reference',
      approxAreaSqFt: 3500,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&auto=format&fit=crop&q=80',
          alt: 'Hospitality interior and civil finishes reference',
          caption: 'High-end interior civil finishes with precision tile alignment',
          order: 1,
          isCover: true,
          imageType: 'illustrative_reference',
        },
      ],
      isVerified: false,
      isFeatured: false,
      isPublished: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
  {
    id: 'cap-ibis-chennai',
    title: 'ibis – Chennai',
    category: 'Hospitality Maintenance & Civil Works',
    badge: 'Project Types & Construction Capabilities',
    location: 'Chennai, Tamil Nadu',
    description:
      "Our verified work in commercial hospitality maintenance demonstrates GKA Construction's approach to organized execution, proactive site coordination, and disciplined construction finishing.",
    draftCopyNotice:
      'Draft copy, for use only after project verification: Our [verified work category] at [specific ibis property] demonstrates GKA Construction’s approach to organized execution, site coordination and construction finishing.',
    officialReferenceUrl: 'https://all.accor.com/?utm_source=chatgpt.com',
    officialReferenceLabel: 'Official Hotel Reference: Accor Official Website',
    suggestedSlideshow: 'Approved site photographs, the actual completed work and detailed finishing shots.',
    coverImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&auto=format&fit=crop&q=80',
    workScopeItems: [
      'Rapid turnaround civil maintenance and facility touch-ups',
      'Structural crack sealing and exterior waterproofing recoats',
      'High-durability anti-skid floor tile restoration',
      'Waste containment and daily site safety housekeeping',
    ],
    modalProjectData: {
      _id: 'cap-ibis-chennai-modal',
      title: 'Hospitality Maintenance & Civil Execution Capabilities',
      slug: 'ibis-chennai-capability',
      category: 'renovation',
      categoryLabel: 'Hospitality Maintenance & Civil Works',
      location: 'Chennai, Tamil Nadu',
      description:
        'Organized execution, site coordination, and construction finishing for commercial hospitality environments.',
      workScope: [
        'Rapid turnaround civil maintenance and facility touch-ups',
        'Structural crack sealing and exterior waterproofing recoats',
        'High-durability anti-skid floor tile restoration',
        'Waste containment and daily site safety housekeeping',
      ],
      projectType: 'concept_reference',
      status: 'Design Reference',
      approxAreaSqFt: 3200,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&auto=format&fit=crop&q=80',
          alt: 'Hospitality maintenance and civil work reference',
          caption: 'Organized civil execution adhering to commercial hospitality specifications',
          order: 1,
          isCover: true,
          imageType: 'illustrative_reference',
        },
      ],
      isVerified: false,
      isFeatured: false,
      isPublished: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
  {
    id: 'cap-gem-grove-omr',
    title: 'Gem Grove Apartments – OMR, Chennai',
    category: 'Residential Apartments',
    badge: 'Project Types & Construction Capabilities',
    location: 'Old Mahabalipuram Road (OMR), Chennai, Tamil Nadu',
    description:
      'GKA Construction undertakes verified civil work scopes at residential apartment facilities, focusing on quality workmanship, site coordination, and the specific structural and civil requirements of multi-unit complexes.',
    draftCopyNotice:
      'Draft copy, for use only after project verification: GKA Construction completed [verified work scope] at [confirmed apartment project], focusing on quality workmanship, site coordination and the requirements of the residential facility.',
    officialReferenceUrl: 'https://maps.google.com/?q=Gem+Grove+Apartments+OMR+Chennai',
    officialReferenceLabel: 'Location Reference: OMR Chennai Corridor',
    suggestedSlideshow: 'Authorized building photographs, actual work areas, finishing details and progress photographs.',
    coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
    workScopeItems: [
      'Multi-unit common area floor tiling & plastering repairs',
      'Underground drainage and compound civil restorations',
      'Overhead water tank waterproofing and polymer coating',
      'Plinth protection and external perimeter crack repairs',
    ],
    modalProjectData: {
      _id: 'cap-gem-grove-modal',
      title: 'Residential Apartments & Facility Civil Works',
      slug: 'gem-grove-apartments-capability',
      category: 'residential',
      categoryLabel: 'Residential Apartments',
      location: 'OMR, Chennai, Tamil Nadu',
      description:
        'Civil works, tiling, plastering, and waterproofing solutions for residential apartment facilities and gated communities.',
      workScope: [
        'Multi-unit common area floor tiling & plastering repairs',
        'Underground drainage and compound civil restorations',
        'Overhead water tank waterproofing and polymer coating',
        'Plinth protection and external perimeter crack repairs',
      ],
      projectType: 'concept_reference',
      status: 'Design Reference',
      approxAreaSqFt: 6000,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
          alt: 'Residential apartment complex civil work reference',
          caption: 'Apartment community civil maintenance and common area finishing',
          order: 1,
          isCover: true,
          imageType: 'illustrative_reference',
        },
      ],
      isVerified: false,
      isFeatured: false,
      isPublished: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
];

export interface ICorePillar {
  id: string;
  title: string;
  description: string;
  seoPhrases: string[];
  features: string[];
  icon: any;
}

export const CORE_CAPABILITY_PILLARS: ICorePillar[] = [
  {
    id: 'pillar-residential',
    title: 'Residential Building Construction',
    description:
      'From individual homes to villas, GKA Construction provides building services based on the client’s requirements, agreed specifications, budget and site conditions.',
    seoPhrases: [
      'house construction contractor in Chennai',
      'residential construction company in Chennai',
      'villa construction in Tamil Nadu',
    ],
    features: [
      'Substructure to key handover turnkey delivery',
      'M25 design mix RCC framing with Fe550D TMT',
      'Vaastu-compliant architectural space planning',
      'Transparent milestone billing with zero hidden costs',
    ],
    icon: Home,
  },
  {
    id: 'pillar-tiling',
    title: 'Tiling, Plastering & Finishing',
    description:
      'Our civil-work capabilities include tile installation, plastering and related finishing activities. Showcase real close-up photographs to demonstrate workmanship and completed results.',
    seoPhrases: [
      'tiling contractor in Chennai',
      'plastering contractor',
      'civil finishing works Chennai',
    ],
    features: [
      'Large-format vitrified floor and wall tiling',
      'Non-shrink adhesive and 100% full bedding',
      'Chemical epoxy grouting for zero stain absorption',
      'Double-coat sand face exterior plastering',
    ],
    icon: Layers,
  },
  {
    id: 'pillar-renovation',
    title: 'Commercial Renovation & Maintenance',
    description:
      'Present renovation, repair and maintenance services for commercial and hospitality environments. State the exact scope of each project and use before-and-after photographs wherever possible.',
    seoPhrases: [
      'commercial renovation contractor Chennai',
      'hotel maintenance civil works',
      'building repair services Chennai',
    ],
    features: [
      'Specialized polymer waterproofing for water tanks',
      'Commercial wet area and service corridor restoration',
      'Structural crack injection grouting and rebar treatment',
      'Organized execution adhering to operational facility hours',
    ],
    icon: Hammer,
  },
  {
    id: 'pillar-supervision',
    title: 'Site Supervision & Construction Coordination',
    description:
      'Highlight practical site coordination, progress monitoring, material planning, quality checks and communication with clients as applicable to the work undertaken.',
    seoPhrases: [
      'construction project management Chennai',
      'civil works contractor',
      'construction site supervision',
    ],
    features: [
      'Daily on-site engineering supervision & slump testing',
      'Digital client portal with real-time photographic updates',
      'Procurement scheduling & batch-tested materials',
      'Disciplined safety protocols and joint snag inspections',
    ],
    icon: HardHat,
  },
];
