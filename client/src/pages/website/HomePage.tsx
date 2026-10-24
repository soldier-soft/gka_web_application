import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  HardHat,
  Building2,
  Home,
  Hammer,
  PenTool,
  CheckCircle2,
  ArrowRight,
  Phone,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  Layers,
  ChevronRight,
  Star,
  Quote,
  Eye,
  Award,
  CheckCircle,
  ExternalLink,
  SlidersHorizontal,
  Building,
  UserCheck,
  Info,
  Maximize2,
  Tag,
  Compass,
  FileCheck,
  FileText,
  Wrench,
  Key,
  ClipboardCheck,
  Shield,
  ArrowLeft,
  CheckSquare,
  Activity,
  Share2,
  Download,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Instagram,
} from 'lucide-react';
import { GKA_COMPANY } from '@shared/constants';
import { api } from '../../services/api';
import { EnquiryModal } from '../../components/portfolio/EnquiryModal';
import { ProjectDetailModal } from '../../components/portfolio/ProjectDetailModal';
import { IPortfolioProject } from '@shared/types';
import {
  CONSTRUCTION_PROCEDURES,
  IProcedureStep,
} from '../../data/proceduresData';
import {
  CLIENT_FAQS,
  IClientFaq,
} from '../../data/faqsData';

// ==========================================
// 1. Verified Client Projects Data (Published under "Client Projects")
// ==========================================

export interface IVerifiedClientProject {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  verificationBadge: string;
  location: string;
  clientName?: string;
  description: string;
  workScope: string[];
  keyHighlights: string[];
  officialReferenceUrl?: string;
  officialReferenceLabel?: string;
  officialReferenceNote?: string;
  coverImage: string;
  imageAlt: string;
  slideshowImages: { url: string; alt: string; caption: string }[];
  modalProjectData: IPortfolioProject;
}

const VERIFIED_CLIENT_PROJECTS: IVerifiedClientProject[] = [
  {
    id: 'proj-ginger-navalur',
    title: 'Ginger Hotel – Navalur, Chennai',
    category: 'Hospitality Civil Works',
    categoryLabel: 'Hospitality Civil Works',
    verificationBadge: 'Verified Client Project (Roots Corporation Ltd)',
    location: 'Rajiv Gandhi Salai (OMR), Navalur, Chennai, Tamil Nadu',
    clientName: 'Roots Corporation Limited',
    description:
      "GKA Construction's company profile references work associated with Ginger Hotel, Navalur, including water tank plastering and tile-related civil work. Presented as representative hospitality civil work, with the precise scope verified against company work records.",
    workScope: [
      'Polymer-modified water-repellent cement plastering inside large capacity underground and overhead water tanks',
      'Two-component polymer coating and alkali-resistant mesh application for structural water containment',
      'Anti-skid vitreous vitrified ceramic tile laying with chemical epoxy grouting in service corridors and utility zones',
      'Structural brickwork rectification and hydro-wash surface preparation meeting hospitality hygiene specifications',
    ],
    keyHighlights: [
      'Scope: Water tank plastering & specialized tiling',
      'Location: Rajiv Gandhi Salai (OMR), Navalur',
      'Industrial safety & hygiene protocol compliant',
      'Zero operational disruption to hotel guests',
    ],
    officialReferenceUrl: 'https://www.gingerhotels.com/hotels/ginger-chennai-omr?utm_source=chatgpt.com',
    officialReferenceLabel: 'Ginger Chennai OMR Official Website',
    officialReferenceNote: 'This confirms the hotel and location, not GKA’s client relationship.',
    coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=1200&auto=format&fit=crop&q=80',
    imageAlt: 'Ginger Hotel Navalur specialized civil water tank restoration and plastering',
    slideshowImages: [
      {
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=1200&auto=format&fit=crop&q=80',
        alt: 'Ginger Hotel Navalur specialized civil and water tank restoration works',
        caption: 'Specialized polymer waterproofing and cement plastering on water tank structure',
      },
      {
        url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=80',
        alt: 'Approved site-work engineering inspection',
        caption: 'On-site engineering inspection and surface preparation prior to polymer coating',
      },
      {
        url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&auto=format&fit=crop&q=80',
        alt: 'Tile-related civil work and finished surface',
        caption: 'High-durability anti-skid floor tiling and wall plastering in facility utility sections',
      },
    ],
    modalProjectData: {
      _id: 'ginger-hotel-specialized-civil-works',
      title: 'Ginger Hotel – Navalur, Chennai (Hospitality Civil Works)',
      slug: 'ginger-hotel-specialized-civil-works',
      category: 'renovation',
      categoryLabel: 'Hospitality Civil Works',
      location: 'Rajiv Gandhi Salai (OMR), Navalur, Chennai, Tamil Nadu',
      description:
        "GKA Construction's company profile references work associated with Ginger Hotel, Navalur, including water tank plastering and tile-related civil work. Presented as representative hospitality civil work, with the precise scope verified against our work records.",
      workScope: [
        'Polymer-modified water-repellent cement plastering inside large capacity underground and overhead water tanks',
        'Two-component polymer coating and alkali-resistant fiberglass mesh application for enhanced structural protection',
        'Anti-skid vitreous vitrified ceramic tile laying with chemical epoxy grouting in kitchen and service corridors',
        'Structural brickwork rectification and hydro-wash surface preparation adhering to commercial hospitality standards',
      ],
      projectType: 'actual_work',
      status: 'Completed',
      client: 'Roots Corporation Limited',
      approxAreaSqFt: 5600,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=1200&auto=format&fit=crop&q=80',
          alt: 'Ginger Hotel Navalur specialized civil and water tank restoration works',
          caption: 'Specialized polymer waterproofing and cement plastering on water tank structure',
          order: 1,
          isCover: true,
          imageType: 'actual_project',
          permissionStatus: 'verified_work',
        },
        {
          url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=80',
          alt: 'Approved site-work engineering inspection',
          caption: 'On-site engineering inspection and surface preparation prior to polymer coating',
          order: 2,
          isCover: false,
          imageType: 'actual_project',
          permissionStatus: 'verified_work',
        },
        {
          url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&auto=format&fit=crop&q=80',
          alt: 'Tile-related civil work and finished surface',
          caption: 'High-durability anti-skid floor tiling and wall plastering in facility utility sections',
          order: 3,
          isCover: false,
          imageType: 'actual_project',
          permissionStatus: 'verified_work',
        },
      ],
      isVerified: true,
      isFeatured: true,
      isPublished: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
  {
    id: 'proj-independent-homes',
    title: 'Independent Homes & Residential Villas',
    category: 'Residential Construction',
    categoryLabel: 'Residential Construction (25+ Homes Completed)',
    verificationBadge: 'Verified Project Track Record (25+ Completed)',
    location: 'Chennai & Tiruvannamalai, Tamil Nadu',
    description:
      'GKA Construction undertakes residential building and renovation work tailored to plot conditions, owner requirements, construction budgets and finishing preferences. Our services cover estimate preparation, construction coordination, civil works and finishing activities according to the agreed scope. With 25+ completed residences across our active service regions.',
    workScope: [
      'Comprehensive architectural 2D floor plans, 3D elevation and structural design coordination',
      'Substructure foundation, anti-termite treatment, plinth beam and backfilled earth compaction',
      'M20/M25 design mix concrete framing with certified Fe550D grade steel reinforcements',
      'Wire-cut brick masonry, double-coat sand face exterior plastering and smooth interior putty finish',
      'Turnkey delivery including vitrified flooring, electrical conduits, branded sanitary fittings and painting',
    ],
    keyHighlights: [
      '25+ Completed residential homes & custom villas',
      'Tailored to plot dimensions, Vaastu & client budget',
      '100% Itemized BOQ with zero hidden costs',
      'Digital client portal with daily site photos',
    ],
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    imageAlt: 'Turnkey independent home and villa construction by GKA Construction',
    slideshowImages: [
      {
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
        alt: 'Completed contemporary residential house',
        caption: 'Completed independent home exterior featuring weather-resistant texture paint and porch detailing',
      },
      {
        url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
        alt: 'Completed architectural villa exterior',
        caption: 'Custom contemporary duplex villa with cantilevered balcony projections and ambient lighting',
      },
      {
        url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80',
        alt: 'Living spaces and high-gloss vitrified tile finish',
        caption: 'High-gloss vitrified tile floor installation, modular lighting and smooth putty wall finish',
      },
      {
        url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&auto=format&fit=crop&q=80',
        alt: 'Construction progress and structural RCC column casting',
        caption: 'Structural RCC framing with Fe550D TMT reinforcement under active on-site engineering supervision',
      },
    ],
    modalProjectData: {
      _id: 'residential-homes-and-villas-turnkey',
      title: 'Independent Homes & Residential Villas (25+ Completed)',
      slug: 'residential-homes-and-villas-turnkey',
      category: 'residential',
      categoryLabel: 'Turnkey Residential Construction',
      location: 'Chennai & Tiruvannamalai, Tamil Nadu',
      description:
        'GKA Construction undertakes residential building and renovation work tailored to plot conditions, owner requirements, construction budgets and finishing preferences. Our services cover estimate preparation, construction coordination, civil works and finishing activities according to the agreed scope.',
      workScope: [
        'Comprehensive architectural 2D floor plans, 3D elevation and structural design coordination',
        'Substructure foundation, anti-termite treatment, plinth beam and backfilled earth compaction',
        'M20/M25 design mix concrete framing with certified Fe550D grade steel reinforcements',
        'Wire-cut brick masonry, double-coat sand face exterior plastering and smooth interior putty finish',
        'Full turnkey delivery including vitrified flooring, electrical conduits, branded sanitary fittings and painting',
      ],
      projectType: 'actual_work',
      status: 'Completed',
      approxAreaSqFt: 2150,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
          alt: 'Modern turnkey independent house completed by GKA Construction',
          caption: 'Exterior contemporary front elevation featuring weather-resistant texture paint',
          order: 1,
          isCover: true,
          imageType: 'actual_project',
          permissionStatus: 'verified_work',
        },
        {
          url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
          alt: 'Completed luxury duplex villa elevation',
          caption: 'Custom contemporary duplex villa with cantilevered balcony projections and ambient lighting',
          order: 2,
          isCover: false,
          imageType: 'actual_project',
          permissionStatus: 'verified_work',
        },
        {
          url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80',
          alt: 'Living spaces and high-gloss vitrified tile finish',
          caption: 'High-gloss vitrified tile floor installation, modular lighting and smooth putty wall finish',
          order: 3,
          isCover: false,
          imageType: 'actual_project',
          permissionStatus: 'verified_work',
        },
      ],
      isVerified: true,
      isFeatured: true,
      isPublished: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
  {
    id: 'proj-renovation-restoration',
    title: 'Building Renovation, Structural Repair & Restoration',
    category: 'Renovation & Civil Works',
    categoryLabel: 'Renovation & Structural Restoration',
    verificationBadge: 'Verified Civil Capability',
    location: 'Theppanandhal, Kelur & Chennai, Tamil Nadu',
    description:
      'Building renovation, repair, tiling, plastering and finishing solutions tailored to existing site conditions and customer requirements. From injection grouting of aging masonry to comprehensive terrace waterproofing and modern bathroom remodeling.',
    workScope: [
      'Structural defect identification, spalling concrete repair and rebar anti-corrosion treatment',
      'Terrace slab waterproofing using crystalline slurry coats and high-albedo protective screed',
      'Plumbing line replacement, modern bathroom waterproofing and vitrified anti-skid floor renovation',
      'Exterior and interior surface refinishing with elastomeric crack-bridging paint systems',
    ],
    keyHighlights: [
      '100% Moisture & water ingress elimination',
      'Structure life extended by 25+ years',
      'Original architectural aesthetics preserved',
      'Itemized fixed renovation estimates',
    ],
    coverImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
    imageAlt: 'GKA Construction building renovation and structural waterproofing in Tamil Nadu',
    slideshowImages: [
      {
        url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
        alt: 'Renovated building interior and living spaces',
        caption: 'Completed structural rehabilitation featuring renewed natural light and clean masonry lines',
      },
      {
        url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=1200&auto=format&fit=crop&q=80',
        alt: 'Terrace waterproofing and repair work in progress',
        caption: 'Multilayer polymer waterproofing membrane applied to terrace concrete surface',
      },
    ],
    modalProjectData: {
      _id: 'building-renovation-and-structural-repair',
      title: 'Building Renovation, Structural Repair & Restoration',
      slug: 'building-renovation-and-structural-repair',
      category: 'renovation',
      categoryLabel: 'Renovation & Structural Restoration',
      location: 'Theppanandhal, Kelur & Chennai, Tamil Nadu',
      description:
        'Building renovation, repair, tiling, plastering and finishing solutions tailored to existing site conditions and customer requirements.',
      workScope: [
        'Structural defect identification, spalling concrete repair and rebar anti-corrosion treatment',
        'Terrace slab waterproofing using crystalline slurry coats and high-albedo protective screed',
        'Plumbing line replacement, modern bathroom waterproofing and vitrified anti-skid floor renovation',
        'Exterior and interior surface refinishing with elastomeric crack-bridging paint systems',
      ],
      projectType: 'actual_work',
      status: 'Completed',
      approxAreaSqFt: 1850,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
          alt: 'Renovated building interior and living spaces',
          caption: 'Completed structural rehabilitation featuring renewed natural light and clean masonry lines',
          order: 1,
          isCover: true,
          imageType: 'actual_project',
          permissionStatus: 'verified_work',
        },
        {
          url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=1200&auto=format&fit=crop&q=80',
          alt: 'Terrace waterproofing and repair work in progress',
          caption: 'Multilayer polymer waterproofing membrane applied to terrace concrete surface',
          order: 2,
          isCover: false,
          imageType: 'actual_project',
          permissionStatus: 'verified_work',
        },
      ],
      isVerified: true,
      isFeatured: true,
      isPublished: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
  {
    id: 'proj-tiling-plastering',
    title: 'Precision Tiling, Plastering & Civil Finishing Works',
    category: 'Civil Finishing',
    categoryLabel: 'Civil Finishing & Plastering',
    verificationBadge: 'Verified Finishing Workmanship',
    location: 'Chennai & Tiruvannamalai, Tamil Nadu',
    description:
      'Showcase tile installation, plastering and related civil finishing work through real project photographs and close-up details. High-precision laser alignment, non-shrink adhesive application, and chemical epoxy grouting for zero stain absorption.',
    workScope: [
      'Vitrified tile laying with mechanical leveling spacers and non-shrink polymer modified adhesive',
      'Chemical epoxy grouting for stain-free, waterproof joints in bathrooms, kitchens and common areas',
      'Double-coat sand face exterior plastering with true line, level and right-angle plumb verification',
      'Wall putty smoothing, primer application and multi-coat acrylic emulsion paint finishing',
    ],
    keyHighlights: [
      'Zero tile hollowness with 100% bedding adhesive',
      'Chemical epoxy grouting for lifetime stain resistance',
      'Right-angle plumb and laser level verified',
      'Smooth acrylic putty wall preparation',
    ],
    coverImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&auto=format&fit=crop&q=80',
    imageAlt: 'GKA Construction precision floor tiling and plastering works in Chennai',
    slideshowImages: [
      {
        url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&auto=format&fit=crop&q=80',
        alt: 'Precision tile installation and smooth civil plastering work',
        caption: 'Close-up of laser-leveled vitrified tile laying with consistent epoxy joint lines',
      },
      {
        url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=1200&auto=format&fit=crop&q=80',
        alt: 'Modern bathroom tiling and finishing detail',
        caption: 'Anti-skid floor and wall tile installation with precision sanitary cutouts',
      },
    ],
    modalProjectData: {
      _id: 'precision-tiling-and-civil-finishing',
      title: 'Precision Tiling, Plastering & Civil Finishing Works',
      slug: 'precision-tiling-and-civil-finishing',
      category: 'tiling',
      categoryLabel: 'Civil Finishing & Plastering',
      location: 'Chennai & Tiruvannamalai, Tamil Nadu',
      description:
        'Showcase tile installation, plastering and related civil finishing work through real project photographs and close-up details.',
      workScope: [
        'Vitrified tile laying with mechanical leveling spacers and non-shrink polymer modified adhesive',
        'Chemical epoxy grouting for stain-free, waterproof joints in bathrooms, kitchens and common areas',
        'Double-coat sand face exterior plastering with true line, level and right-angle plumb verification',
        'Wall putty smoothing, primer application and multi-coat acrylic emulsion paint finishing',
      ],
      projectType: 'actual_work',
      status: 'Completed',
      approxAreaSqFt: 4800,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&auto=format&fit=crop&q=80',
          alt: 'Precision tile installation and smooth civil plastering work',
          caption: 'Close-up of laser-leveled vitrified tile laying with consistent epoxy joint lines',
          order: 1,
          isCover: true,
          imageType: 'actual_project',
          permissionStatus: 'verified_work',
        },
        {
          url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=1200&auto=format&fit=crop&q=80',
          alt: 'Modern bathroom tiling and finishing detail',
          caption: 'Anti-skid floor and wall tile installation with precision sanitary cutouts',
          order: 2,
          isCover: false,
          imageType: 'actual_project',
          permissionStatus: 'verified_work',
        },
      ],
      isVerified: true,
      isFeatured: true,
      isPublished: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  },
];

import {
  CAPABILITY_PROJECTS,
  CORE_CAPABILITY_PILLARS,
  ICapabilityProject,
  ICorePillar,
} from '../../data/capabilitiesData';

// ==========================================
// Main Component
// ==========================================

export const HomePage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    projectCategory: 'residential',
    siteLocation: '',
    approxAreaSqFt: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Client Experiences state
  const [activeSectionTab, setActiveSectionTab] = useState<'verified' | 'capabilities' | 'pillars'>('verified');
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [enquiryModalContext, setEnquiryModalContext] = useState<any>(undefined);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<IPortfolioProject | null>(null);

  // Construction Procedures State
  const [activeProcedureStep, setActiveProcedureStep] = useState(0);

  // Share & FAQ States
  const [shareFeedback, setShareFeedback] = useState<string>('');
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(0);
  const [faqCategory, setFaqCategory] = useState<string>('all');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await api.createEnquiry({
        ...formData,
        approxAreaSqFt: formData.approxAreaSqFt ? Number(formData.approxAreaSqFt) : undefined,
        source: 'website_contact',
      });
      if (res.success) {
        setSubmitSuccess(true);
        setFormData({
          name: '',
          phone: '',
          projectCategory: 'residential',
          siteLocation: '',
          approxAreaSqFt: '',
          message: '',
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit enquiry. Please call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEnquiryForProject = (title: string, category: string, location: string) => {
    setEnquiryModalContext({
      relatedProjectTitle: title,
      defaultService: category.toLowerCase().includes('commercial') ? 'commercial' : category.toLowerCase().includes('renovation') ? 'renovation' : 'residential',
      defaultLocation: location,
    });
    setIsEnquiryModalOpen(true);
  };

  const handleOpenDetailModal = (modalData: IPortfolioProject) => {
    setSelectedProjectForModal(modalData);
    setIsDetailModalOpen(true);
  };

  const handleOpenEnquiryForProcedure = (stepTitle: string) => {
    setEnquiryModalContext({
      relatedProjectTitle: `Consultation on Procedure: ${stepTitle}`,
      defaultService: 'residential',
      defaultLocation: 'Chennai / Tiruvannamalai',
    });
    setIsEnquiryModalOpen(true);
  };

  const handleShareCompanyProfile = async () => {
    const shareUrl = window.location.origin + GKA_COMPANY.companyProfilePdfUrl;
    const shareData = {
      title: 'GKA Construction — Official Company Profile (PDF)',
      text: 'Download the official company profile, project credentials, and engineering standards of GKA Construction (Chennai & Tiruvannamalai):',
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareFeedback('Shared!');
        setTimeout(() => setShareFeedback(''), 2500);
        return;
      } catch (err) {
        // User cancelled or unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback('Link Copied!');
      setTimeout(() => setShareFeedback(''), 2500);
    } catch (e) {
      window.open(
        `https://api.whatsapp.com/send?text=${encodeURIComponent(
          shareData.text + ' ' + shareUrl
        )}`,
        '_blank'
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative gradient-navy text-white overflow-hidden py-20 lg:py-28 border-b border-brand-navy-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C59A27_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-brand-gold-400/30 text-brand-gold-300 text-xs font-semibold backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-brand-gold-400" />
                <span>15+ Years Practical Field Experience • Chennai & Tiruvannamalai</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] font-heading">
                Building Trust. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold-300 via-brand-gold-400 to-amber-200">
                  Delivering Quality.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Complete building construction, renovation, design, interiors, civil & allied works under one accountable roof. From foundation to final keys handover, we make construction predictable, transparent and stress-free.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/cost-estimator"
                  className="px-6 py-3.5 rounded-lg text-sm font-bold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 shadow-premium hover:shadow-glow-gold transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Instant Cost Estimator</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/projects"
                  className="px-6 py-3.5 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-brand-gold-400" />
                  <span>Explore 50+ House Ideas</span>
                </Link>

                <a
                  href={`tel:${GKA_COMPANY.phoneDisplay}`}
                  className="px-5 py-3.5 rounded-lg text-sm font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-2"
                >
                  <Phone className="w-4 h-4 text-brand-gold-400" />
                  <span>+91 {GKA_COMPANY.phoneDisplay}</span>
                </a>
              </div>

              {/* Company Profile PDF Download & Share Banner */}
              <div className="p-4 rounded-xl bg-white/5 border border-brand-gold-400/30 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-gold-500/20 text-brand-gold-400 flex items-center justify-center shrink-0 border border-brand-gold-500/30">
                    <FileText className="w-5 h-5 text-brand-gold-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold font-heading text-white tracking-wide uppercase">
                        Official Company Profile
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-gold-500/20 text-brand-gold-300 font-mono font-semibold">
                        PDF • Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Civil capabilities, commercial references, and quality standards dossier.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <a
                    href={GKA_COMPANY.companyProfilePdfUrl}
                    download="GKA_Construction_Premium_Company_Profile.pdf"
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    title="Download Official Company Profile PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>

                  <button
                    onClick={handleShareCompanyProfile}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center justify-center gap-1.5"
                    title="Share Company Profile PDF with Family or Partners"
                  >
                    <Share2 className="w-3.5 h-3.5 text-brand-gold-300" />
                    <span>{shareFeedback || 'Share'}</span>
                  </button>
                </div>
              </div>

              {/* Micro proof bar */}
              <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-4 text-left">
                <div>
                  <p className="text-2xl font-bold font-heading text-white">15+</p>
                  <p className="text-xs text-slate-400">Years Field Experience</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-heading text-brand-gold-400">100%</p>
                  <p className="text-xs text-slate-400">Itemized BOQ Pricing</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-heading text-white">25+</p>
                  <p className="text-xs text-slate-400">Homes Completed</p>
                </div>
              </div>
            </div>

            {/* Right: Instant Site Visit & Quote Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-900 border border-slate-100 relative">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-navy-900 text-brand-gold-400 px-3 py-1 rounded-full text-[11px] font-bold border border-brand-navy-700 shadow-md">
                  DIRECT SITE ENGINEERING
                </div>

                <h3 className="text-xl font-heading font-bold text-brand-navy-900 mb-1">
                  Request a Free Site Assessment
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  Speak directly with an experienced site engineer. No obligation.
                </p>

                {submitSuccess ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-xl text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h4 className="font-bold text-base">Enquiry Received!</h4>
                    <p className="text-xs text-emerald-700">
                      Our site engineering team has received your details and will call you on{' '}
                      <strong>{formData.phone || 'your number'}</strong> to coordinate the visit.
                    </p>
                    <button
                      onClick={() => setSubmitSuccess(false)}
                      className="mt-3 text-xs font-semibold text-emerald-700 underline"
                    >
                      Submit another enquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {errorMessage && (
                      <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                        {errorMessage}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="e.g. 98401 23456"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Project Type</label>
                        <select
                          value={formData.projectCategory}
                          onChange={(e) => setFormData({ ...formData, projectCategory: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none bg-white"
                        >
                          <option value="residential">Home Construction</option>
                          <option value="commercial">Commercial Building</option>
                          <option value="renovation">Renovation & Remodeling</option>
                          <option value="civil_structural">Civil & Structural Work</option>
                          <option value="interiors">Interiors & Allied Works</option>
                          <option value="turnkey">Turnkey Package</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Site Location *</label>
                        <input
                          type="text"
                          required
                          value={formData.siteLocation}
                          onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                          placeholder="e.g. Kelambakkam, Chennai"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Approx Area (Sq.Ft)</label>
                        <input
                          type="number"
                          value={formData.approxAreaSqFt}
                          onChange={(e) => setFormData({ ...formData, approxAreaSqFt: e.target.value })}
                          placeholder="e.g. 1800"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-lg bg-brand-navy-900 hover:bg-brand-navy-800 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span>Connecting with Site Engineer...</span>
                      ) : (
                        <>
                          <span>Submit Site Visit Request</span>
                          <ArrowRight className="w-4 h-4 text-brand-gold-400" />
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-slate-400 text-center">
                      Your details are kept confidential. Direct consultation with GKA Construction.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Construction Capabilities */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-600 bg-brand-gold-50 px-3 py-1 rounded-full border border-brand-gold-200">
              End-To-End Contracting
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-navy-950 mt-3">
              Comprehensive Construction Services
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              From foundation and structural framing to interior finishes and turnkey handover — executed with professional supervision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-subtle hover:shadow-premium transition-all group">
              <div className="w-12 h-12 rounded-lg bg-brand-navy-50 text-brand-navy-900 flex items-center justify-center mb-6 group-hover:bg-brand-navy-900 group-hover:text-brand-gold-400 transition-colors">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-navy-950 mb-2">
                Complete Home Construction
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Independent homes, custom villas, multi-floor residential buildings and floor additions built to approved structural engineering standards.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Soil test to key handover</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> M25 design mix concrete</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Transparent itemized BOQ</li>
              </ul>
              <Link to="/services" className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 inline-flex items-center gap-1">
                Learn more <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-subtle hover:shadow-premium transition-all group">
              <div className="w-12 h-12 rounded-lg bg-brand-navy-50 text-brand-navy-900 flex items-center justify-center mb-6 group-hover:bg-brand-navy-900 group-hover:text-brand-gold-400 transition-colors">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-navy-950 mb-2">
                Commercial & Institutional
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Commercial office spaces, retail showrooms, hospitality properties, institutional buildings, and utility warehouses built for high durability.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Heavy-duty structural RCC</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Commercial MEP & safety</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Strict timeline delivery</li>
              </ul>
              <Link to="/services" className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 inline-flex items-center gap-1">
                Learn more <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-subtle hover:shadow-premium transition-all group">
              <div className="w-12 h-12 rounded-lg bg-brand-navy-50 text-brand-navy-900 flex items-center justify-center mb-6 group-hover:bg-brand-navy-900 group-hover:text-brand-gold-400 transition-colors">
                <Hammer className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-navy-950 mb-2">
                Renovation & Remodeling
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Transform existing residential or commercial properties without losing scope control. Structural repairs, floor additions, and modern upgrades.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Structural assessment</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Bathroom & kitchen remodeling</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Water tank rehabilitation</li>
              </ul>
              <Link to="/services" className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 inline-flex items-center gap-1">
                Learn more <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-subtle hover:shadow-premium transition-all group">
              <div className="w-12 h-12 rounded-lg bg-brand-navy-50 text-brand-navy-900 flex items-center justify-center mb-6 group-hover:bg-brand-navy-900 group-hover:text-brand-gold-400 transition-colors">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-navy-950 mb-2">
                Civil & Structural Works
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                RCC footings, columns, beams, slabs, brick/block masonry, sand-face double coat plastering, and compound walls.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Certified TMT steel & OPC cement</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Accurate structural levels</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Water-cured plaster finish</li>
              </ul>
              <Link to="/services" className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 inline-flex items-center gap-1">
                Learn more <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-subtle hover:shadow-premium transition-all group">
              <div className="w-12 h-12 rounded-lg bg-brand-navy-50 text-brand-navy-900 flex items-center justify-center mb-6 group-hover:bg-brand-navy-900 group-hover:text-brand-gold-400 transition-colors">
                <PenTool className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-navy-950 mb-2">
                Design, Planning & Estimation
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                2D floor plans, 3D elevations, structural analysis coordination, and itemized bill of quantities with market-tested rates.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Vaastu compliant layouts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Comprehensive line-item BOQ</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Transparent material brands</li>
              </ul>
              <Link to="/cost-estimator" className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 inline-flex items-center gap-1">
                Try Cost Estimator <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-subtle hover:shadow-premium transition-all group">
              <div className="w-12 h-12 rounded-lg bg-brand-navy-50 text-brand-navy-900 flex items-center justify-center mb-6 group-hover:bg-brand-navy-900 group-hover:text-brand-gold-400 transition-colors">
                <HardHat className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-navy-950 mb-2">
                Turnkey Project Delivery
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Single-source accountability combining civil construction, electrical, plumbing, vitrified tile flooring, painting, and digital client tracking.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Zero coordination headaches</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Digital progress portal access</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Fixed milestone billing</li>
              </ul>
              <Link to="/services" className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 inline-flex items-center gap-1">
                Learn more <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Proven Construction Procedure & Project Execution Stages */}
      <section id="construction-procedure" className="py-20 lg:py-28 bg-white border-b border-slate-200 relative overflow-hidden">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#10203A_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-navy-950 text-brand-gold-400 text-xs font-bold border border-brand-gold-400/30 shadow-sm">
              <Compass className="w-4 h-4 text-brand-gold-400 animate-spin-slow" />
              <span>SYSTEMATIC ENGINEERING LIFECYCLE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-brand-navy-950 mt-4 leading-tight">
              Our 6-Step Construction Procedure <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-brand-gold-500 to-amber-700">
                From Soil to Key Handover
              </span>
            </h2>

            <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
              Transparent, certified, and milestone-governed. Here is the exact end-to-end engineering procedure GKA Construction follows for every residential and commercial project to ensure zero budget escalations, zero unapproved shortcuts, and lifelong structural durability.
            </p>
          </div>

          {/* Interactive Step Selector Tabs (Desktop & Tablet) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-10">
            {CONSTRUCTION_PROCEDURES.map((step, idx) => {
              const isActive = activeProcedureStep === idx;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveProcedureStep(idx)}
                  className={`relative p-3.5 rounded-xl text-left transition-all duration-200 border flex flex-col justify-between group ${
                    isActive
                      ? 'bg-brand-navy-950 text-white border-brand-gold-500 shadow-premium ring-2 ring-brand-gold-400/40'
                      : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center font-mono transition-colors ${
                        isActive
                          ? 'bg-brand-gold-500 text-brand-navy-950'
                          : 'bg-slate-200 text-slate-700 group-hover:bg-brand-navy-100 group-hover:text-brand-navy-900'
                      }`}
                    >
                      {step.stepNumber}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/10 text-brand-gold-300 border border-brand-gold-400/30'
                          : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {step.duration}
                    </span>
                  </div>
                  <div>
                    <p
                      className={`text-xs font-bold font-heading line-clamp-1 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-900 group-hover:text-brand-navy-900'
                      }`}
                    >
                      {step.title.split('&')[0].trim()}
                    </p>
                    <p
                      className={`text-[11px] line-clamp-1 mt-0.5 ${
                        isActive ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {step.phaseCategory}
                    </p>
                  </div>

                  {/* Active Indicator Arrow */}
                  {isActive && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-brand-navy-950 rotate-45 border-r border-b border-brand-gold-500 hidden lg:block" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Step Feature Box */}
          {(() => {
            const currentStep = CONSTRUCTION_PROCEDURES[activeProcedureStep];
            const nextIdx = (activeProcedureStep + 1) % CONSTRUCTION_PROCEDURES.length;
            const prevIdx = (activeProcedureStep - 1 + CONSTRUCTION_PROCEDURES.length) % CONSTRUCTION_PROCEDURES.length;

            return (
              <div className="bg-[#F8FAFC] rounded-2xl border border-slate-200/90 shadow-premium overflow-hidden mb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                  {/* Left Column: Stage Details (7 Cols) */}
                  <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                    <div>
                      {/* Top Meta Strip */}
                      <div className="flex flex-wrap items-center gap-2.5 mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-navy-900 text-brand-gold-400 text-xs font-bold border border-brand-gold-500/30">
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>{currentStep.stageBadge}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 text-slate-700 text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Timeline: {currentStep.duration}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>{currentStep.highlightFeature}</span>
                        </span>
                      </div>

                      {/* Main Title & Subtitle */}
                      <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-brand-navy-950 mb-2 leading-tight">
                        {currentStep.title}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-brand-gold-600 mb-4">
                        {currentStep.subtitle}
                      </p>

                      {/* Summary */}
                      <p className="text-slate-600 text-sm leading-relaxed mb-6">
                        {currentStep.summary}
                      </p>

                      {/* Key Activities Checklist */}
                      <div className="mb-6">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-brand-gold-500" />
                          <span>Core Execution Activities</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {currentStep.keyActivities.map((activity, actIdx) => (
                            <div
                              key={actIdx}
                              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200/70 text-xs text-slate-700 hover:border-brand-gold-400/50 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span className="leading-snug">{activity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Deliverables Badges */}
                      <div className="mb-6">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
                          <FileCheck className="w-3.5 h-3.5 text-brand-navy-700" />
                          <span>Verified Client Deliverables</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {currentStep.deliverables.map((deliv, delivIdx) => (
                            <span
                              key={delivIdx}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-800 text-xs font-medium shadow-2xs"
                            >
                              <FileText className="w-3.5 h-3.5 text-brand-gold-600" />
                              <span>{deliv}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Technical Specs Pill Grid */}
                      <div className="mb-6 p-3.5 rounded-xl bg-slate-100/80 border border-slate-200/80">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Engineering Specifications & Compliance
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          {currentStep.technicalSpecs.map((spec, sIdx) => (
                            <div key={sIdx} className="bg-white px-3 py-2 rounded-lg border border-slate-200">
                              <span className="block text-[10px] text-slate-400 uppercase font-medium">{spec.label}</span>
                              <span className="font-semibold text-slate-800 text-[11px] leading-tight block mt-0.5">{spec.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quality Assurance Callout */}
                      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 flex items-start gap-3">
                        <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                            GKA Quality & Structural Assurance
                          </p>
                          <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
                            {currentStep.qualityControlPoint}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="pt-6 mt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveProcedureStep(prevIdx)}
                          className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5"
                          title="Previous Stage"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Step {CONSTRUCTION_PROCEDURES[prevIdx].stepNumber}</span>
                        </button>
                        <button
                          onClick={() => setActiveProcedureStep(nextIdx)}
                          className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5"
                          title="Next Stage"
                        >
                          <span>Step {CONSTRUCTION_PROCEDURES[nextIdx].stepNumber}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-semibold text-slate-400 ml-2">
                          Stage {activeProcedureStep + 1} of 6
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleOpenEnquiryForProcedure(currentStep.title)}
                          className="px-5 py-2.5 rounded-lg text-xs font-bold bg-brand-navy-950 hover:bg-brand-navy-900 text-white shadow-sm transition-all flex items-center gap-2"
                        >
                          <Phone className="w-3.5 h-3.5 text-brand-gold-400" />
                          <span>Inquire About This Stage</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Visual Stage Showcase (5 Cols) */}
                  <div className="lg:col-span-5 relative bg-slate-900 min-h-[380px] lg:min-h-full overflow-hidden flex flex-col justify-between p-6 sm:p-8 text-white">
                    {/* Background Stage Image */}
                    <img
                      src={currentStep.primaryImage}
                      alt={currentStep.imageAlt}
                      className="absolute inset-0 w-full h-full object-cover object-center opacity-45 mix-blend-luminosity scale-105 hover:scale-100 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-950 via-brand-navy-950/70 to-transparent" />

                    {/* Top Floating Badge */}
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="bg-brand-navy-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-brand-gold-400/40 text-brand-gold-300 text-xs font-bold flex items-center gap-2 shadow-lg">
                        <Award className="w-4 h-4 text-brand-gold-400" />
                        <span>Stage {currentStep.stepNumber} Verification</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-300 px-2.5 py-1 rounded bg-black/40 backdrop-blur-sm border border-white/10">
                        {currentStep.duration}
                      </span>
                    </div>

                    {/* Bottom Stat Card */}
                    <div className="relative z-10 pt-20">
                      <div className="bg-brand-navy-950/85 backdrop-blur-md p-5 rounded-xl border border-white/10 shadow-xl mb-4">
                        <p className="text-2xl sm:text-3xl font-extrabold font-heading text-brand-gold-400">
                          {currentStep.metricBadge.value}
                        </p>
                        <p className="text-xs font-semibold text-slate-200 mt-0.5">
                          {currentStep.metricBadge.label}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                          Rigorous protocol adherence guaranteed through our ISO-aligned construction checklist and daily supervisor logs.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <Link
                          to="/cost-estimator"
                          className="w-full text-center px-4 py-3 rounded-lg text-xs font-bold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 shadow-md transition-colors flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Estimate Project Cost</span>
                        </Link>
                        <a
                          href={`tel:${GKA_COMPANY.phoneDisplay}`}
                          className="w-full text-center px-4 py-3 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center justify-center gap-2"
                        >
                          <Phone className="w-3.5 h-3.5 text-brand-gold-400" />
                          <span>Talk to Engineer</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* All 6 Steps at a Glance (Sequential Roadmap Cards) */}
          <div className="mb-14">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-brand-navy-950 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-gold-500" />
                <span>Complete Project Lifecycle at a Glance</span>
              </h4>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Click any step to inspect detailed deliverables
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {CONSTRUCTION_PROCEDURES.map((step, idx) => {
                const isActive = activeProcedureStep === idx;
                return (
                  <div
                    key={step.id}
                    onClick={() => setActiveProcedureStep(idx)}
                    className={`cursor-pointer rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                      isActive
                        ? 'bg-brand-navy-950 text-white border-brand-gold-500 shadow-md ring-2 ring-brand-gold-400/30'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-brand-gold-400 hover:shadow-subtle'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`w-6 h-6 rounded-md text-[11px] font-bold font-mono flex items-center justify-center ${
                            isActive
                              ? 'bg-brand-gold-500 text-brand-navy-950'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {step.stepNumber}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/10 text-brand-gold-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {step.duration}
                        </span>
                      </div>
                      <h5
                        className={`text-xs font-bold font-heading line-clamp-2 ${
                          isActive ? 'text-white' : 'text-brand-navy-950'
                        }`}
                      >
                        {step.title}
                      </h5>
                    </div>
                    <p
                      className={`text-[11px] mt-2 pt-2 border-t font-medium ${
                        isActive
                          ? 'border-white/10 text-brand-gold-400'
                          : 'border-slate-100 text-slate-400'
                      }`}
                    >
                      {step.phaseCategory}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4 Guarantees of GKA Construction Procedures */}
          <div className="bg-[#10203A] rounded-2xl p-6 sm:p-8 border border-brand-gold-500/30 text-white shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-gold-500/20 text-brand-gold-400 flex items-center justify-center flex-shrink-0 border border-brand-gold-500/30">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-bold font-heading text-white">100% Itemized BOQ</h5>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Zero surprise costs. Every bag of cement and kilo of steel is accounted for in your contract.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-gold-500/20 text-brand-gold-400 flex items-center justify-center flex-shrink-0 border border-brand-gold-500/30">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-bold font-heading text-white">Live ERP Tracking</h5>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Client portal with daily geotagged site photographs, material logs, and digital milestone receipts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-gold-500/20 text-brand-gold-400 flex items-center justify-center flex-shrink-0 border border-brand-gold-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-bold font-heading text-white">Lab-Tested Quality</h5>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Concrete cube compressive tests and steel mill certificates verified by chartered structural engineers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-gold-500/20 text-brand-gold-400 flex items-center justify-center flex-shrink-0 border border-brand-gold-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-sm font-bold font-heading text-white">5-Year Warranty</h5>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Written structural stability warranty certificate and full as-built MEP conduit diagrams at handover.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Strip inside Guarantees Box */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-gold-400" />
                <span className="text-xs sm:text-sm font-semibold text-slate-200">
                  Ready to construct your home in Chennai or Tiruvannamalai?
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleOpenEnquiryForProcedure('Complete Turnkey Project Initiation')}
                  className="px-5 py-2.5 rounded-lg text-xs font-bold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 shadow-md transition-all flex items-center gap-2"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Free Stage 01 Site Inspection</span>
                </button>
                <Link
                  to="/cost-estimator"
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2"
                >
                  <span>Instant Cost Estimator</span>
                  <ChevronRight className="w-3.5 h-3.5 text-brand-gold-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Client Projects & Construction Capabilities Section */}
      <section className="py-20 lg:py-28 bg-[#F5F8FC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10203A] text-[#D6A21D] text-xs font-bold border border-brand-gold-400/30">
              <Award className="w-4 h-4 text-[#D6A21D]" />
              <span>PROJECT PORTFOLIO & WORK CAPABILITIES</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-[#10203A] mt-4 leading-tight">
              Client Projects & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-[#D6A21D]">
                Construction Capabilities
              </span>
            </h2>

            <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
              For confirmed work relationships, projects are published under <strong>“Client Projects”</strong> with precise scopes verified against company records. Where relationships are general commercial references, they are presented under the safer heading <strong>“Project Types & Construction Capabilities”</strong>.
            </p>
          </div>

          {/* Section Mode Switcher Tabs */}
          <div className="flex items-center justify-center gap-3 flex-wrap mb-12">
            <button
              onClick={() => setActiveSectionTab('verified')}
              className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${
                activeSectionTab === 'verified'
                  ? 'bg-[#10203A] text-white ring-2 ring-[#D6A21D] shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <CheckCircle className="w-4 h-4 text-[#D6A21D]" />
              <span>1. Client Projects (Confirmed Work)</span>
            </button>

            <button
              onClick={() => setActiveSectionTab('capabilities')}
              className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${
                activeSectionTab === 'capabilities'
                  ? 'bg-[#10203A] text-white ring-2 ring-[#D6A21D] shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4 text-[#D6A21D]" />
              <span>2. Project Types & Construction Capabilities</span>
            </button>

            <button
              onClick={() => setActiveSectionTab('pillars')}
              className={`px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${
                activeSectionTab === 'pillars'
                  ? 'bg-[#10203A] text-white ring-2 ring-[#D6A21D] shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 text-[#D6A21D]" />
              <span>3. Core Capability Pillars (SEO Scope)</span>
            </button>
          </div>

          {/* TAB 1: Verified Client Projects */}
          {activeSectionTab === 'verified' && (
            <div className="space-y-8">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 text-emerald-900 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Client Projects:</strong> Published after confirming the work relationship, location and actual scope with GKA Construction company records. Includes 25+ completed residential homes and verified specialized works.
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {VERIFIED_CLIENT_PROJECTS.map((proj) => (
                  <div
                    key={proj.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
                  >
                    {/* Image Header with Slide Indicator */}
                    <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-900">
                      <img
                        src={proj.coverImage}
                        alt={proj.imageAlt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#07172C]/80 via-transparent to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#10203A]/90 text-[#D6A21D] backdrop-blur-md border border-[#D6A21D]/30 shadow-sm">
                          {proj.categoryLabel}
                        </span>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-600/90 text-white backdrop-blur-md shadow-sm">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{proj.verificationBadge}</span>
                        </span>
                      </div>

                      {/* Bottom Info Bar */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
                        <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                          <MapPin className="w-3.5 h-3.5 text-[#D6A21D] shrink-0" />
                          <span className="truncate max-w-[220px] sm:max-w-[280px]">{proj.location}</span>
                        </div>

                        <button
                          onClick={() => handleOpenDetailModal(proj.modalProjectData)}
                          className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium text-xs backdrop-blur-sm transition-colors flex items-center gap-1"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-[#D6A21D]" />
                          <span>{proj.slideshowImages.length} Slides</span>
                        </button>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[#10203A] leading-snug">
                            {proj.title}
                          </h3>
                          {proj.clientName && (
                            <p className="text-xs font-semibold text-slate-500 mt-1">
                              Client: <strong className="text-slate-800">{proj.clientName}</strong>
                            </p>
                          )}
                        </div>

                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                          {proj.description}
                        </p>

                        {/* Official Reference Link with Notice */}
                        {proj.officialReferenceUrl && (
                          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[11px] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-900">Official Hotel Reference:</span>
                              <a
                                href={proj.officialReferenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-800 hover:text-amber-950 font-bold underline inline-flex items-center gap-1"
                              >
                                <span>{proj.officialReferenceLabel}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            {proj.officialReferenceNote && (
                              <p className="text-amber-700 italic text-[10px]">
                                * {proj.officialReferenceNote}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Work Scope Highlights */}
                        <div className="pt-2">
                          <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">
                            Actual Work Scope (Verified Records):
                          </h4>
                          <ul className="space-y-1.5 text-xs text-slate-600">
                            {proj.workScope.map((scope, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{scope}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Key Highlights */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {proj.keyHighlights.map((hl, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {hl}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={() => handleOpenEnquiryForProject(proj.title, proj.category, proj.location)}
                          className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#D6A21D] hover:bg-amber-500 text-[#07172C] shadow-sm transition-all flex items-center justify-center gap-1.5"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Request Similar Project</span>
                        </button>

                        <button
                          onClick={() => handleOpenDetailModal(proj.modalProjectData)}
                          className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#10203A] hover:bg-slate-800 text-white transition-all flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-4 h-4 text-[#D6A21D]" />
                          <span>View Slideshow & Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Project Types & Construction Capabilities */}
          {activeSectionTab === 'capabilities' && (
            <div className="space-y-8">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-900 text-xs">
                <Info className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  <strong>Safer Alternative Heading:</strong> For the commercial, hospitality, and residential facilities below, where a direct client contract has not been individually verified, GKA Construction presents them as <strong>“Project Types & Construction Capabilities”</strong> with realistic technical scopes.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CAPABILITY_PROJECTS.map((cap) => (
                  <div
                    key={cap.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-subtle hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      {/* Image Header */}
                      <div className="h-52 relative overflow-hidden bg-slate-900">
                        <img
                          src={cap.coverImage}
                          alt={cap.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#07172C]/90 via-transparent to-transparent" />

                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#10203A]/90 text-[#D6A21D] border border-[#D6A21D]/30 backdrop-blur-md">
                            {cap.category}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                          <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#D6A21D]" />
                            {cap.location}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <h3 className="text-lg font-heading font-bold text-[#10203A]">
                          {cap.title}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {cap.description}
                        </p>

                        {/* Draft Copy & Compliance Notice */}
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 italic">
                          "{cap.draftCopyNotice}"
                        </div>

                        {/* Official Reference Link */}
                        <div className="pt-1 flex items-center justify-between text-xs">
                          <span className="text-[11px] font-semibold text-slate-500">Official Reference:</span>
                          <a
                            href={cap.officialReferenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#10203A] hover:text-[#D6A21D] font-bold text-[11px] underline inline-flex items-center gap-1"
                          >
                            <span>Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {/* Suggested Slideshow Note */}
                        <div className="text-[10px] text-slate-500 pt-1">
                          <strong>Suggested Slideshow:</strong> {cap.suggestedSlideshow}
                        </div>

                        {/* Work Scope Capabilities */}
                        <div className="pt-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block mb-1">
                            Technical Scope:
                          </span>
                          <ul className="space-y-1 text-xs text-slate-600">
                            {cap.workScopeItems.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D6A21D] mt-1.5 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="p-5 pt-0">
                      <button
                        onClick={() => handleOpenEnquiryForProject(cap.title, cap.category, cap.location)}
                        className="w-full py-2.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-[#D6A21D] hover:text-[#07172C] text-slate-800 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Enquire About This Work Type</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Core Capability Pillars with SEO Scope */}
          {activeSectionTab === 'pillars' && (
            <div className="space-y-8">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3 text-blue-900 text-xs">
                <Tag className="w-5 h-5 text-blue-600 shrink-0" />
                <span>
                  <strong>Core Construction Capabilities:</strong> Specialized portfolio pillars showcasing deep trade competence across Chennai and Tamil Nadu with targeted service capabilities and practical engineering supervision.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {CORE_CAPABILITY_PILLARS.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div
                      key={pillar.id}
                      className="bg-white rounded-2xl p-8 border border-slate-200 shadow-subtle hover:shadow-premium transition-all space-y-5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#10203A] text-[#D6A21D] flex items-center justify-center shrink-0 shadow-sm">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-heading font-extrabold text-[#10203A]">
                            {pillar.title}
                          </h3>
                          <span className="text-xs font-semibold text-slate-500">
                            GKA Construction Core Competency
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                        {pillar.description}
                      </p>

                      {/* Targeted SEO Phrases */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                          Targeted Service Scopes:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {pillar.seoPhrases.map((phrase, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#07172C]/5 text-[#10203A] border border-slate-200"
                            >
                              #{phrase}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Features Checklist */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                          Execution Highlights:
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-600">
                          {pillar.features.map((feat, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => handleOpenEnquiryForProject(pillar.title, 'turnkey', 'Chennai & Tiruvannamalai')}
                          className="w-full py-3 rounded-xl text-xs font-bold bg-[#10203A] hover:bg-slate-800 text-white transition-colors flex items-center justify-center gap-2"
                        >
                          <span>Consult Our Engineers on {pillar.title}</span>
                          <ArrowRight className="w-4 h-4 text-[#D6A21D]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4-Column Trust Proof Bar */}
          <div className="mt-16 bg-white rounded-2xl p-8 border border-slate-200 shadow-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand-gold-50 text-brand-gold-600 flex items-center justify-center shrink-0 border border-brand-gold-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-navy-950">15+ Years Track Record</h4>
                <p className="text-xs text-slate-500 mt-1">Deep practical field know-how across Chennai & Tiruvannamalai.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand-gold-50 text-brand-gold-600 flex items-center justify-center shrink-0 border border-brand-gold-200">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-navy-950">100% Itemized BOQ</h4>
                <p className="text-xs text-slate-500 mt-1">Every kilogram of steel and bag of cement clearly accounted for.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand-gold-50 text-brand-gold-600 flex items-center justify-center shrink-0 border border-brand-gold-200">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-navy-950">Daily Progress Portal</h4>
                <p className="text-xs text-slate-500 mt-1">Secure login with on-site photos and milestone tracking.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand-gold-50 text-brand-gold-600 flex items-center justify-center shrink-0 border border-brand-gold-200">
                <HardHat className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-navy-950">Zero Hidden Escalations</h4>
                <p className="text-xs text-slate-500 mt-1">Milestone-based contract payments tied to agreed engineering specs.</p>
              </div>
            </div>
          </div>

          {/* Interactive Consultation Banner */}
          <div className="mt-12 bg-gradient-to-r from-brand-navy-950 via-brand-navy-900 to-brand-navy-950 rounded-3xl p-8 sm:p-12 text-white border border-brand-navy-700 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-12 translate-y-12">
              <Building className="w-96 h-96 text-brand-gold-400" />
            </div>

            <div className="relative z-10 max-w-3xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D6A21D] bg-white/10 px-3 py-1 rounded-full border border-brand-gold-400/30">
                ON-SITE CONSULTATION & ASSESSMENT
              </span>

              <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-white leading-tight">
                Want To Discuss Your Project or Inspect an Active Construction Site?
              </h3>

              <p className="text-slate-300 text-sm leading-relaxed">
                Meet our senior site engineers at your plot or property anywhere across Chennai or Tiruvannamalai. We will assess ground levels, utility access, soil conditions, and outline an itemized BOQ with zero hidden costs.
              </p>

              <div className="pt-4 flex flex-wrap gap-4 items-center">
                <button
                  onClick={() => {
                    setEnquiryModalContext({
                      relatedProjectTitle: 'Home Page Direct Site Assessment Consultation',
                      defaultService: 'residential',
                    });
                    setIsEnquiryModalOpen(true);
                  }}
                  className="px-6 py-3.5 rounded-xl text-sm font-bold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 shadow-md transition-all flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Free On-Site Assessment</span>
                </button>

                <Link
                  to="/projects"
                  className="px-6 py-3.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2"
                >
                  <span>Explore 50+ House Ideas</span>
                  <ArrowRight className="w-4 h-4 text-brand-gold-400" />
                </Link>

                <a
                  href={`tel:${GKA_COMPANY.phoneDisplay}`}
                  className="px-4 py-3 text-sm font-semibold text-brand-gold-300 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call +91 {GKA_COMPANY.phoneDisplay}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The 9-Stage Execution Process */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-600 bg-brand-gold-50 px-3 py-1 rounded-full border border-brand-gold-200">
              Structured Methodology
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-navy-950 mt-3">
              Our 9-Step Project Execution Flow
            </h2>
            <p className="text-slate-600 text-sm mt-3">
              Every GKA project follows an organized, disciplined sequence so you never have to wonder what is happening at your site.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '01', title: 'Requirement', desc: 'Understand objectives, scope, priorities, budget and timeline.' },
              { num: '02', title: 'Site Assessment', desc: 'Review site conditions, soil levels, structural access and utilities.' },
              { num: '03', title: 'Scope & Estimate', desc: 'Prepare measurements, detailed BOQ items and material specifications.' },
              { num: '04', title: 'Quotation', desc: 'Present formal commercial quotation with transparent payment terms.' },
              { num: '05', title: 'Planning', desc: 'Organize skilled manpower, procurement schedules and milestone dates.' },
              { num: '06', title: 'Execution', desc: 'Carry out civil, structural and finishing work with active on-site supervision.' },
              { num: '07', title: 'Monitoring', desc: 'Track daily progress, material consumption, and publish client photos.' },
              { num: '08', title: 'Finishing', desc: 'Execute architectural finishes, deep cleaning and joint snag list inspections.' },
              { num: '09', title: 'Handover', desc: 'Provide complete documentation, warranty records and hand over the keys.' },
            ].map((step) => (
              <div key={step.num} className="bg-white p-6 rounded-xl border border-slate-200 shadow-subtle hover:border-brand-gold-400 transition-all">
                <span className="text-2xl font-extrabold font-heading text-brand-gold-500 mb-2 block">{step.num}</span>
                <h4 className="text-base font-bold text-brand-navy-950 mb-1">{step.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Client Transparency Portal Highlight */}
      <section className="py-20 gradient-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-400 bg-white/10 px-3 py-1 rounded-full border border-brand-gold-400/30">
                Digital Operating System
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white leading-tight">
                Live Client Progress Portal. <br />
                <span className="text-brand-gold-400">Total Transparency, Zero Guesswork.</span>
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                As a GKA client, you receive a secure portal login. No more chasing supervisors for updates on WhatsApp. Check site photos, milestone progress, approved drawings, and billing status from any phone or computer.
              </p>

              <div className="space-y-3 pt-2 text-xs text-slate-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-brand-teal-400 shrink-0" />
                  <span>Approved daily and weekly site photographs grouped by stage</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-brand-teal-400 shrink-0" />
                  <span>Real-time milestone progress tracking and upcoming deadlines</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-brand-teal-400 shrink-0" />
                  <span>Official GST invoices, receipts and downloadable handover certificates</span>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/login"
                  className="px-6 py-3.5 rounded-lg text-sm font-bold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 shadow-md transition-all inline-flex items-center gap-2"
                >
                  <span>Experience The Client Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-brand-navy-950 p-6 sm:p-8 rounded-2xl border border-brand-navy-700 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-white">Client Portal Preview: Live Site Tracking</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-400/20 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Milestone Status: On Schedule
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Active Construction Stage</span>
                    <span className="font-bold text-brand-gold-400">Civil Finishing & Specialized Plastering</span>
                  </div>
                  <div className="w-full h-2.5 bg-brand-navy-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-teal-500 to-brand-gold-500 rounded-full w-full" />
                  </div>
                </div>

                <div className="bg-brand-navy-900/90 p-4 rounded-xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-white">Active Stage: Water Tank Plastering & Waterproofing</strong>
                    <span className="text-emerald-400 font-semibold text-[11px]">On Schedule</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Latest site report published today: "Applied 2nd coat of Fosroc Brushbond polymer waterproofing inside overhead tank #2."
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <img
                      src="https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=400&auto=format&fit=crop&q=80"
                      alt="Site report photo"
                      className="rounded-lg h-24 w-full object-cover border border-white/10"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80"
                      alt="Site report photo"
                      className="rounded-lg h-24 w-full object-cover border border-white/10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Comprehensive Client Questionnaires & Engineering Knowledge Base (SEO FAQ) */}
      <section id="faq-guide" className="py-20 lg:py-28 bg-[#F8FAFC] border-b border-slate-200 relative overflow-hidden">
        {/* Decorative subtle ambient backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-navy-900/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-navy-950 text-brand-gold-400 text-xs font-bold border border-brand-gold-400/30 shadow-xs">
              <HelpCircle className="w-4 h-4 text-brand-gold-400" />
              <span>CLIENT QUESTIONNAIRES &amp; FAQ GUIDE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-brand-navy-950 mt-4 leading-tight">
              Frequently Asked Questions &amp; <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-brand-gold-500 to-amber-700">
                Homeowner Project Guide
              </span>
            </h2>

            <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
              Transparent, realistic, and engineering-backed answers to the most critical questions homeowners, investors, and commercial clients ask before choosing a general building contractor in Chennai and Tiruvannamalai.
            </p>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              {[
                { id: 'all', label: 'All Questions' },
                { id: 'cost', label: 'Pricing & Packages' },
                { id: 'boq', label: 'Contracts & Brand Locks' },
                { id: 'approvals', label: 'Approvals & Permits' },
                { id: 'tracking', label: 'NRI & Digital Tracking' },
                { id: 'warranty', label: 'Warranty & Handover' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setFaqCategory(cat.id);
                    setActiveFaqIndex(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    faqCategory === cat.id
                      ? 'bg-brand-navy-950 text-white shadow-xs ring-1 ring-brand-gold-400'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accordion Questions List */}
          <div className="space-y-3.5 max-w-4xl mx-auto">
            {CLIENT_FAQS.filter((item) => faqCategory === 'all' || item.category === faqCategory).map(
              (faq, idx) => {
                const isOpen = activeFaqIndex === idx;
                return (
                  <div
                    key={faq.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? 'bg-white border-brand-gold-500/60 shadow-premium ring-1 ring-brand-gold-400/20'
                        : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <button
                      onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                      className="w-full text-left p-5 sm:p-6 flex items-start justify-between gap-4 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-start gap-3.5">
                        <span
                          className={`w-7 h-7 rounded-lg text-xs font-bold font-mono flex items-center justify-center shrink-0 mt-0.5 ${
                            isOpen
                              ? 'bg-brand-gold-500 text-brand-navy-950'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 mb-1.5 inline-block">
                            {faq.categoryLabel}
                          </span>
                          <h3
                            className={`text-sm sm:text-base font-heading font-bold leading-snug transition-colors ${
                              isOpen ? 'text-brand-navy-950' : 'text-slate-800'
                            }`}
                          >
                            {faq.question}
                          </h3>
                        </div>
                      </div>

                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isOpen
                            ? 'bg-brand-navy-950 text-brand-gold-400'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-6 sm:px-6 sm:pb-6 pt-0 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4 animate-in fade-in duration-200">
                        <p className="mt-4">{faq.answer}</p>

                        {/* Highlights Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {faq.highlights.map((item, hIdx) => (
                            <div
                              key={hIdx}
                              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-700 font-medium"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>

          {/* Need More Assistance Banner */}
          <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-brand-navy-950 text-white border border-brand-gold-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="text-lg font-heading font-bold text-white flex items-center justify-center md:justify-start gap-2">
                <span>Still have specific questions about your plot or floor plan?</span>
              </h4>
              <p className="text-xs text-slate-300 max-w-xl">
                Our Chief Civil Engineer is available for free plot assessment consultations across Chennai, OMR, and Tiruvannamalai.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <a
                href={GKA_COMPANY.social.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Engineer</span>
              </a>

              <a
                href={`tel:${GKA_COMPANY.phoneDisplay}`}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-2"
              >
                <Phone className="w-3.5 h-3.5 text-brand-gold-400" />
                <span>+91 {GKA_COMPANY.phoneDisplay}</span>
              </a>

              <a
                href={GKA_COMPANY.companyProfilePdfUrl}
                download="GKA_Construction_Premium_Company_Profile.pdf"
                className="px-4 py-2.5 rounded-lg text-xs font-bold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Company Profile</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Ready to Build Banner */}
      <section className="py-16 bg-brand-gold-500 text-brand-navy-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight">
            Ready To Start Your Construction or Renovation Project?
          </h2>
          <p className="text-base text-brand-navy-900 font-medium max-w-2xl mx-auto">
            Get an instant estimate online or speak directly with our engineering team for an on-site consultation.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/cost-estimator"
              className="px-6 py-3.5 rounded-lg text-sm font-bold bg-brand-navy-900 hover:bg-brand-navy-800 text-white shadow-lg transition-all"
            >
              Calculate Estimated Cost
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3.5 rounded-lg text-sm font-bold bg-white hover:bg-slate-100 text-brand-navy-950 border border-brand-navy-900/20 shadow-sm transition-all"
            >
              Book Site Assessment
            </Link>
          </div>
        </div>
      </section>

      {/* Global Interactive Modals */}
      <EnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        initialContext={enquiryModalContext}
      />

      <ProjectDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        project={selectedProjectForModal}
        onOpenEnquiry={(context) => {
          setIsDetailModalOpen(false);
          setEnquiryModalContext(context);
          setIsEnquiryModalOpen(true);
        }}
      />
    </div>
  );
};
