import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Home,
  Hammer,
  Layers,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  Phone,
  MessageSquare,
  ChevronRight,
  Info,
  Maximize2,
  SlidersHorizontal,
  RotateCcw,
  ExternalLink,
  Tag,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  GKA_COMPANY,
  PORTFOLIO_PROJECT_FILTERS,
  SQUARE_FOOTAGE_RANGES,
  BEDROOM_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  ARCHITECTURAL_STYLE_OPTIONS,
  CONCEPT_TYPE_OPTIONS,
  ESTIMATION_DISCLAIMER_TEXT,
} from '@shared/constants';
import { IPortfolioProject, IProjectIdea } from '@shared/types';
import { ProjectDetailModal } from '../../components/portfolio/ProjectDetailModal';
import { EnquiryModal } from '../../components/portfolio/EnquiryModal';
import {
  CAPABILITY_PROJECTS,
  CORE_CAPABILITY_PILLARS,
} from '../../data/capabilitiesData';

export const ProjectsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Data states
  const [projects, setProjects] = useState<IPortfolioProject[]>([]);
  const [ideas, setIdeas] = useState<IProjectIdea[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingIdeas, setLoadingIdeas] = useState(true);

  // Portfolio Mode Switcher (Client Projects vs Capabilities vs Pillars)
  const [portfolioMode, setPortfolioMode] = useState<'client_projects' | 'capabilities' | 'pillars'>('client_projects');

  // Featured Projects Filter State
  const [activeProjectFilter, setActiveProjectFilter] = useState('all');
  const [projectSearchTerm, setProjectSearchTerm] = useState('');

  // 50+ Ideas Filter State
  const [selectedAreaCategory, setSelectedAreaCategory] = useState('all');
  const [selectedBedroom, setSelectedBedroom] = useState('all');
  const [selectedPropertyType, setSelectedPropertyType] = useState('all');
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [selectedConcept, setSelectedConcept] = useState('all');
  const [ideaSearchTerm, setIdeaSearchTerm] = useState('');
  const [visibleIdeaCount, setVisibleIdeaCount] = useState(12);

  // Modal states
  const [selectedProject, setSelectedProject] = useState<IPortfolioProject | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<IProjectIdea | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [enquiryContext, setEnquiryContext] = useState<any>({});

  // Fetch Public Projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const res = await api.getPublicProjects();
        if (res.success && res.projects) {
          setProjects(res.projects);
        }
      } catch (err) {
        console.error('Failed to load portfolio projects:', err);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // Fetch 50+ Project Ideas
  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        setLoadingIdeas(true);
        const res = await api.getProjectIdeas({ limit: '100' });
        if (res.success && res.ideas) {
          setIdeas(res.ideas);
        }
      } catch (err) {
        console.error('Failed to load project ideas:', err);
      } finally {
        setLoadingIdeas(false);
      }
    };
    fetchIdeas();
  }, []);

  const { slug: routeSlug } = useParams<{ slug?: string }>();

  // Handle URL deep-linking (?project=slug, ?idea=slug, or /projects/:slug)
  useEffect(() => {
    const projectSlug = searchParams.get('project') || routeSlug;
    const ideaSlug = searchParams.get('idea');

    if (projectSlug && projects.length > 0) {
      const match = projects.find((p) => p.slug === projectSlug || p._id === projectSlug);
      if (match) {
        setSelectedProject(match);
        setSelectedIdea(null);
        setIsDetailModalOpen(true);
        return;
      }
      // If not in projects, also check if it matches an idea slug
      const ideaMatch = ideas.find((i) => i.slug === projectSlug || i.ideaId === projectSlug.toUpperCase());
      if (ideaMatch) {
        setSelectedIdea(ideaMatch);
        setSelectedProject(null);
        setIsDetailModalOpen(true);
        return;
      }
    }

    if (ideaSlug && ideas.length > 0) {
      const match = ideas.find((i) => i.slug === ideaSlug || i.ideaId === ideaSlug.toUpperCase());
      if (match) {
        setSelectedIdea(match);
        setSelectedProject(null);
        setIsDetailModalOpen(true);
      }
    }
  }, [searchParams, routeSlug, projects, ideas]);

  // Open Project Detail Modal
  const handleOpenProject = (p: IPortfolioProject) => {
    setSelectedProject(p);
    setSelectedIdea(null);
    setIsDetailModalOpen(true);
    setSearchParams({ project: p.slug });
  };

  // Open Idea Detail Modal
  const handleOpenIdea = (i: IProjectIdea) => {
    setSelectedIdea(i);
    setSelectedProject(null);
    setIsDetailModalOpen(true);
    setSearchParams({ idea: i.slug });
  };

  // Close Detail Modal & clean search params
  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedProject(null);
    setSelectedIdea(null);
    setSearchParams({});
  };

  // Open Enquiry Drawer
  const handleOpenEnquiry = (context: any = {}) => {
    setEnquiryContext(context);
    setIsEnquiryModalOpen(true);
  };

  // Filtered Featured Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesCategory =
        activeProjectFilter === 'all' ||
        p.category === activeProjectFilter ||
        (activeProjectFilter === 'residential' && (p.category === 'residential' || p.category === 'villas'));

      const matchesSearch =
        !projectSearchTerm.trim() ||
        p.title.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
        p.categoryLabel.toLowerCase().includes(projectSearchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [projects, activeProjectFilter, projectSearchTerm]);

  // Filtered 50+ Project Ideas
  const filteredIdeas = useMemo(() => {
    return ideas.filter((item) => {
      // Area filter
      const matchesArea =
        selectedAreaCategory === 'all' || item.areaCategory === selectedAreaCategory;

      // Bedroom filter
      const matchesBedroom =
        selectedBedroom === 'all' || item.bedroomCount === selectedBedroom;

      // Property type filter
      const matchesType =
        selectedPropertyType === 'all' || item.propertyType === selectedPropertyType;

      // Style filter
      const matchesStyle =
        selectedStyle === 'all' || item.architecturalStyle === selectedStyle;

      // Concept filter
      const matchesConcept =
        selectedConcept === 'all' || item.conceptType === selectedConcept;

      // Search keyword
      const matchesSearch =
        !ideaSearchTerm.trim() ||
        item.title.toLowerCase().includes(ideaSearchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(ideaSearchTerm.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(ideaSearchTerm.toLowerCase())) ||
        item.features.some((f) => f.toLowerCase().includes(ideaSearchTerm.toLowerCase()));

      return matchesArea && matchesBedroom && matchesType && matchesStyle && matchesConcept && matchesSearch;
    });
  }, [
    ideas,
    selectedAreaCategory,
    selectedBedroom,
    selectedPropertyType,
    selectedStyle,
    selectedConcept,
    ideaSearchTerm,
  ]);

  const resetIdeaFilters = () => {
    setSelectedAreaCategory('all');
    setSelectedBedroom('all');
    setSelectedPropertyType('all');
    setSelectedStyle('all');
    setSelectedConcept('all');
    setIdeaSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC] text-slate-800">
      {/* Dynamic SEO JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Construction Projects & House Ideas in Chennai | GKA Construction',
          description:
            'Explore residential construction ideas, villas, commercial civil works, renovation and finishing projects from GKA Construction in Chennai and Tiruvannamalai.',
          url: `https://${GKA_COMPANY.website}/projects`,
          provider: {
            '@type': 'ConstructionBusiness',
            name: GKA_COMPANY.name,
            telephone: `+91 ${GKA_COMPANY.phoneDisplay}`,
            email: GKA_COMPANY.email,
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'Chennai',
              addressRegion: 'Tamil Nadu',
              addressCountry: 'IN',
            },
          },
        })}
      </script>

      {/* Breadcrumb Navigation */}
      <div className="bg-[#07172C] text-slate-400 text-xs py-2.5 border-b border-brand-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2">
          <Link to="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#D6A21D] font-semibold">Projects & Ideas</span>
        </div>
      </div>

      {/* 1. Projects-Page Hero Section */}
      <section className="relative bg-gradient-to-b from-[#07172C] via-[#10203A] to-[#0F1E36] text-white py-20 lg:py-24 border-b border-brand-navy-800 overflow-hidden">
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D6A21D_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8">
          <div className="max-w-3xl space-y-4">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#D6A21D] bg-white/10 px-3.5 py-1.5 rounded-full border border-brand-gold-400/30 backdrop-blur-sm">
              OUR WORK & PROJECT IDEAS
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-heading leading-tight text-white">
              Featured Construction Projects & <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D6A21D] via-amber-300 to-amber-100">
                Building Ideas
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Explore GKA Construction's civil works, residential construction, hospitality-related work, renovation and building solutions across Chennai and Tiruvannamalai, Tamil Nadu. Browse project references and explore more than 50 construction ideas organized by built-up area, property type and requirements. Visit the site and speak with our team to discuss suitable designs, specifications and estimates.
            </p>

            {/* Prominent Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <a
                href="#project-ideas"
                className="px-6 py-3.5 rounded-xl text-sm font-bold bg-[#D6A21D] hover:bg-amber-500 text-[#07172C] shadow-lg transition-all flex items-center gap-2 group"
              >
                <span>Explore Project Ideas</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>

              <button
                onClick={() =>
                  handleOpenEnquiry({
                    requirements: 'Requesting a site visit and estimate consultation for my project.',
                  })
                }
                className="px-6 py-3.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2 backdrop-blur-sm"
              >
                <Calendar className="w-4 h-4 text-[#D6A21D]" />
                <span>Request a Site Visit</span>
              </button>
            </div>
          </div>

          {/* Small Informational Highlights */}
          <div className="pt-8 border-t border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-[#D6A21D] shrink-0" />
              <div>
                <strong className="block text-white font-bold">15+ Years</strong>
                <span>Field Experience</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
              <Building2 className="w-5 h-5 text-[#D6A21D] shrink-0" />
              <div>
                <strong className="block text-white font-bold">Residential & Commercial</strong>
                <span>Civil Construction</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
              <Hammer className="w-5 h-5 text-[#D6A21D] shrink-0" />
              <div>
                <strong className="block text-white font-bold">Renovation & Repairs</strong>
                <span>Allied Finishing Works</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
              <MapPin className="w-5 h-5 text-[#D6A21D] shrink-0" />
              <div>
                <strong className="block text-white font-bold">Chennai & Tiruvannamalai</strong>
                <span>Active Service Areas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Projects Section */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#D6A21D]">
              Verified Portfolio & Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-[#10203A] mt-1">
              Client Projects & Construction Capabilities
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl">
              Confirmed client relationships are published under <strong>“Client Projects”</strong>. Where relationships are general commercial references, they are presented under the safer alternative heading <strong>“Project Types & Construction Capabilities”</strong>.
            </p>
          </div>

          {/* Search Bar (Active for Client Projects) */}
          {portfolioMode === 'client_projects' && (
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={projectSearchTerm}
                onChange={(e) => setProjectSearchTerm(e.target.value)}
                placeholder="Search projects or location..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-[#D6A21D] focus:outline-none shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setPortfolioMode('client_projects')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${
              portfolioMode === 'client_projects'
                ? 'bg-[#10203A] text-white ring-2 ring-[#D6A21D] shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-[#D6A21D]" />
            <span>1. Client Projects (Confirmed Work)</span>
          </button>

          <button
            onClick={() => setPortfolioMode('capabilities')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${
              portfolioMode === 'capabilities'
                ? 'bg-[#10203A] text-white ring-2 ring-[#D6A21D] shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#D6A21D]" />
            <span>2. Project Types & Construction Capabilities</span>
          </button>

          <button
            onClick={() => setPortfolioMode('pillars')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${
              portfolioMode === 'pillars'
                ? 'bg-[#10203A] text-white ring-2 ring-[#D6A21D] shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-[#D6A21D]" />
            <span>3. Core Capability Pillars (SEO Scope)</span>
          </button>
        </div>

        {/* VIEW 1: Client Projects (Confirmed Work) */}
        {portfolioMode === 'client_projects' && (
          <div className="space-y-6">
            {/* Functional Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {PORTFOLIO_PROJECT_FILTERS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveProjectFilter(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    activeProjectFilter === tab.id
                      ? 'bg-[#10203A] text-white shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

        {/* Projects Card Grid */}
        {loadingProjects ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
                <div className="h-64 bg-slate-200 rounded-xl" />
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No Projects Found</h3>
            <p className="text-xs text-slate-500">Try adjusting your category filter or search keywords.</p>
            <button
              onClick={() => {
                setActiveProjectFilter('all');
                setProjectSearchTerm('');
              }}
              className="text-xs font-bold text-[#D6A21D] underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredProjects.map((p) => {
              const coverImg = p.images?.find((img) => img.isCover) || p.images?.[0];
              return (
                <div
                  key={p._id || p.slug}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-subtle hover:shadow-premium transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Image Header with Slide Indicator */}
                    <div
                      className="h-64 sm:h-72 relative bg-slate-100 overflow-hidden cursor-pointer"
                      onClick={() => handleOpenProject(p)}
                    >
                      <img
                        src={coverImg?.url}
                        alt={coverImg?.alt || p.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#10203A]/90 text-[#D6A21D] backdrop-blur-md border border-white/10 shadow-sm">
                          {p.categoryLabel}
                        </span>
                      </div>

                      {/* Bottom verified status & gallery button */}
                      <div className="absolute bottom-4 inset-x-4 flex items-center justify-between text-white text-xs">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600/90 text-white backdrop-blur-md shadow-sm flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{p.status}</span>
                        </span>

                        <span className="px-3 py-1 rounded-md text-[11px] font-bold bg-black/60 hover:bg-black/80 backdrop-blur-md transition-colors flex items-center gap-1.5">
                          <Maximize2 className="w-3.5 h-3.5 text-[#D6A21D]" />
                          <span>{p.images?.length || 1} Photos</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 sm:p-8 space-y-4">
                      <div>
                        <h3
                          onClick={() => handleOpenProject(p)}
                          className="text-xl font-heading font-bold text-[#10203A] hover:text-[#D6A21D] transition-colors cursor-pointer"
                        >
                          {p.title}
                        </h3>
                        {p.client && (
                          <p className="text-xs font-semibold text-slate-500 mt-1">
                            Client: <span className="text-slate-800 font-bold">{p.client}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-[#D6A21D] shrink-0" />
                        <span>{p.location}</span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>

                      {/* Work Scope Highlights */}
                      {p.workScope && p.workScope.length > 0 && (
                        <div className="pt-3 border-t border-slate-100">
                          <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2">
                            Actual Work Scope:
                          </h4>
                          <ul className="space-y-1.5 text-xs text-slate-600">
                            {p.workScope.slice(0, 3).map((s, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => handleOpenProject(p)}
                      className="text-xs font-bold text-[#10203A] hover:text-[#D6A21D] inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>View Project Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() =>
                        handleOpenEnquiry({
                          relatedProjectId: p._id,
                          relatedProjectTitle: p.title,
                          defaultService: p.category,
                          defaultLocation: p.location,
                        })
                      }
                      className="text-xs font-semibold px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-[#10203A] hover:text-white hover:border-[#10203A] transition-all shadow-sm"
                    >
                      Request Similar Project
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

    {/* VIEW 2: Project Types & Construction Capabilities */}
    {portfolioMode === 'capabilities' && (
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
              <div className="p-5 pt-0 space-y-2">
                <button
                  onClick={() => handleOpenProject(cap.modalProjectData)}
                  className="w-full py-2.5 rounded-lg text-xs font-bold bg-[#10203A] hover:bg-slate-800 text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-[#D6A21D]" />
                  <span>View Details & Work Specs</span>
                </button>
                <button
                  onClick={() =>
                    handleOpenEnquiry({
                      relatedProjectTitle: cap.title,
                      defaultService: cap.category,
                      defaultLocation: cap.location,
                    })
                  }
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

    {/* VIEW 3: Core Capability Pillars with SEO Scope */}
    {portfolioMode === 'pillars' && (
      <div className="space-y-8">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3 text-blue-900 text-xs">
          <Tag className="w-5 h-5 text-blue-600 shrink-0" />
          <span>
            <strong>Core Construction Capabilities:</strong> Specialized portfolio pillars showcasing deep trade competence across Chennai and Tamil Nadu with targeted service capabilities and practical engineering supervision.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
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
                    {pillar.seoPhrases.map((phrase, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#D6A21D]/10 text-amber-900 border border-[#D6A21D]/30"
                      >
                        #{phrase}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Capability Key Highlights */}
                <div className="pt-2">
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {pillar.features.map((hl: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() =>
                      handleOpenEnquiry({
                        relatedProjectTitle: pillar.title,
                        defaultService: pillar.title,
                      })
                    }
                    className="w-full py-3 rounded-xl text-xs font-bold bg-[#10203A] hover:bg-[#D6A21D] hover:text-[#07172C] text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Consult on {pillar.title}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </section>

      {/* 3. NEW FEATURE: 50+ Construction Project Ideas by Square-Foot Category */}
      <section
        id="project-ideas"
        className="py-20 bg-white border-t border-b border-slate-200 scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D6A21D] bg-brand-gold-50 px-3.5 py-1.5 rounded-full border border-brand-gold-200">
              IDEA DISCOVERY CATALOGUE
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-[#10203A]">
              Explore 50+ House Construction Ideas by Square Footage
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Discover residential layouts, villa concepts, exterior styles and finishing ideas for different built-up areas. Browse reference designs, shortlist your preferences and contact GKA Construction for a site visit and a project-specific estimate.
            </p>
          </div>

          {/* Square-Footage Quick Category Filter Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 px-1">
              <span className="font-bold uppercase tracking-wider text-slate-700">
                Filter by Indicative Built-Up Area:
              </span>
              <span className="text-[11px] text-slate-400">
                (Indicative built-up area categories, not guaranteed plot dimensions)
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {SQUARE_FOOTAGE_RANGES.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setSelectedAreaCategory(range.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    selectedAreaCategory === range.id
                      ? 'bg-[#D6A21D] text-[#07172C] shadow-md font-extrabold'
                      : 'bg-[#F5F8FC] text-slate-700 border border-slate-200 hover:bg-slate-200/70 hover:border-slate-300'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Filter Dropdowns & Search */}
          <div className="bg-[#F5F8FC] p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4 shadow-subtle">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Bedroom Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Bedrooms</label>
                <select
                  value={selectedBedroom}
                  onChange={(e) => setSelectedBedroom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                >
                  {BEDROOM_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Property Type</label>
                <select
                  value={selectedPropertyType}
                  onChange={(e) => setSelectedPropertyType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                >
                  {PROPERTY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Architectural Style */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Design Style</label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                >
                  {ARCHITECTURAL_STYLE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Concept Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Budget / Finish</label>
                <select
                  value={selectedConcept}
                  onChange={(e) => setSelectedConcept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                >
                  {CONCEPT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Keywords */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Keyword Search</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ideaSearchTerm}
                    onChange={(e) => setIdeaSearchTerm(e.target.value)}
                    placeholder="e.g. Duplex, Staircase..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Filter Status Bar */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
              <span className="text-slate-600 font-semibold">
                Showing <strong>{filteredIdeas.length}</strong> project ideas
              </span>

              {(selectedAreaCategory !== 'all' ||
                selectedBedroom !== 'all' ||
                selectedPropertyType !== 'all' ||
                selectedStyle !== 'all' ||
                selectedConcept !== 'all' ||
                ideaSearchTerm) && (
                <button
                  onClick={resetIdeaFilters}
                  className="text-xs font-bold text-brand-navy-900 hover:text-[#D6A21D] flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Project Ideas Cards Grid */}
          {loadingIdeas ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse space-y-4">
                  <div className="h-48 bg-slate-200 rounded-xl" />
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                </div>
              ))}
            </div>
          ) : filteredIdeas.length === 0 ? (
            <div className="bg-[#F5F8FC] p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <Info className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Project Ideas Match This Combination</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Not every theoretical filter combination is physically or structurally practical. Try selecting a broader built-up area or reset your filters.
              </p>
              <button
                onClick={resetIdeaFilters}
                className="mt-2 px-4 py-2 rounded-xl bg-[#10203A] text-white font-bold text-xs shadow-sm hover:bg-brand-navy-900 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIdeas.slice(0, visibleIdeaCount).map((idea) => {
                const coverImg = idea.images?.[0];
                return (
                  <div
                    key={idea.ideaId || idea.slug}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-subtle hover:shadow-premium hover:border-[#D6A21D] transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Frame */}
                      <div
                        className="h-52 relative bg-slate-100 overflow-hidden cursor-pointer"
                        onClick={() => handleOpenIdea(idea)}
                      >
                        <img
                          src={coverImg?.url}
                          alt={coverImg?.alt || idea.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-75" />

                        {/* Top Area Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#10203A]/90 text-[#D6A21D] backdrop-blur-md border border-white/10 shadow-sm">
                            Approx. {idea.builtUpAreaSqFt} sq. ft.
                          </span>
                        </div>

                        {/* Concept Reference Tag */}
                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/90 text-slate-800 backdrop-blur-md shadow-sm">
                            {idea.contentType}
                          </span>
                        </div>

                        {/* Bottom Title Sub-Bar */}
                        <div className="absolute bottom-3 inset-x-3 text-white">
                          <span className="text-[10px] tracking-wider uppercase font-semibold text-amber-300">
                            {idea.areaCategoryLabel}
                          </span>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-5 sm:p-6 space-y-4">
                        <div>
                          <h3
                            onClick={() => handleOpenIdea(idea)}
                            className="text-lg font-heading font-bold text-[#10203A] group-hover:text-[#D6A21D] transition-colors cursor-pointer leading-snug"
                          >
                            {idea.title}
                          </h3>
                          <span className="text-[11px] font-medium text-slate-500 capitalize">
                            {idea.propertyType.replace('_', ' ')} • {idea.architecturalStyle.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {idea.description}
                        </p>

                        {/* Features Bullet List */}
                        {idea.features && idea.features.length > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <ul className="space-y-1.5 text-xs text-slate-600">
                              {idea.features.slice(0, 3).map((f, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span className="line-clamp-1">{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-5 bg-slate-50/80 border-t border-slate-100 space-y-2">
                      <button
                        onClick={() => handleOpenIdea(idea)}
                        className="w-full py-2.5 rounded-xl bg-white border border-slate-300 text-[#10203A] font-bold text-xs hover:border-[#D6A21D] hover:bg-[#F5F8FC] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span>View Design References</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#D6A21D]" />
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() =>
                            handleOpenEnquiry({
                              relatedIdeaId: idea.ideaId,
                              relatedIdeaTitle: idea.title,
                              defaultAreaSqFt: idea.builtUpAreaSqFt,
                            })
                          }
                          className="py-2 rounded-lg bg-[#10203A] text-white hover:bg-[#07172C] text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <Calendar className="w-3 h-3 text-[#D6A21D]" />
                          <span>Request Visit</span>
                        </button>

                        <button
                          onClick={() =>
                            handleOpenEnquiry({
                              relatedIdeaId: idea.ideaId,
                              relatedIdeaTitle: idea.title,
                              defaultAreaSqFt: idea.builtUpAreaSqFt,
                            })
                          }
                          className="py-2 rounded-lg bg-[#D6A21D] text-[#07172C] hover:bg-amber-500 text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <span>Get Estimate</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button if over 12 items */}
          {filteredIdeas.length > visibleIdeaCount && (
            <div className="text-center pt-4">
              <button
                onClick={() => setVisibleIdeaCount((prev) => prev + 12)}
                className="px-6 py-3 rounded-xl bg-[#10203A] text-white hover:bg-[#07172C] text-xs font-bold transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <span>Load More Construction Ideas ({filteredIdeas.length - visibleIdeaCount} remaining)</span>
                <ChevronRight className="w-4 h-4 text-[#D6A21D]" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. Mandatory Customer-Facing Pricing & Feasibility Notice */}
      <section className="py-12 bg-[#F5F8FC] border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-amber-200 shadow-subtle flex flex-col sm:flex-row items-start gap-5">
            <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center shrink-0 border border-amber-200">
              <Info className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-heading font-extrabold text-[#10203A]">
                Site Feasibility & Project-Specific Recommendations
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {ESTIMATION_DISCLAIMER_TEXT}
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold">
                <a
                  href={`tel:${GKA_COMPANY.phoneDisplay}`}
                  className="text-[#10203A] hover:text-[#D6A21D] inline-flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-[#D6A21D]" />
                  <span>Call: +91 {GKA_COMPANY.phoneDisplay}</span>
                </a>
                <a
                  href={`mailto:${GKA_COMPANY.email}`}
                  className="text-[#10203A] hover:text-[#D6A21D] inline-flex items-center gap-1.5"
                >
                  <span>Email: {GKA_COMPANY.email}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Ready to Build Banner with Direct CTAs */}
      <section className="py-16 bg-[#10203A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs font-bold uppercase tracking-widest text-[#D6A21D] bg-white/10 px-3 py-1 rounded-full border border-brand-gold-400/20">
            START YOUR BUILDING JOURNEY
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white">
            Have a Specific Plot Dimension or Architectural Requirement?
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Speak directly with our engineering team. We inspect soil levels, review access requirements, prepare transparent itemized estimates, and coordinate structural execution under one accountable roof.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => handleOpenEnquiry()}
              className="px-6 py-3.5 rounded-xl text-sm font-bold bg-[#D6A21D] hover:bg-amber-500 text-[#07172C] shadow-lg transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Book Site Visit & Free Consultation</span>
            </button>

            <Link
              to="/cost-estimator"
              className="px-6 py-3.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2"
            >
              <span>Instant Cost Estimator Tool</span>
              <ArrowRight className="w-4 h-4 text-[#D6A21D]" />
            </Link>
          </div>
        </div>
      </section>

      {/* Detail Slideshow Modal */}
      <ProjectDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        project={selectedProject}
        idea={selectedIdea}
        onOpenEnquiry={handleOpenEnquiry}
        onSelectRelatedIdea={(slug) => {
          const match = ideas.find((i) => i.slug === slug);
          if (match) {
            handleOpenIdea(match);
          }
        }}
        relatedIdeas={ideas.slice(0, 3)}
      />

      {/* Enquiry & Site Visit Drawer / Modal */}
      <EnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        initialContext={enquiryContext}
      />
    </div>
  );
};
