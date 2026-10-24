import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  MapPin,
  CheckCircle2,
  Building,
  Layers,
  ArrowRight,
  Sparkles,
  Calendar,
  Share2,
  Info,
  Maximize2,
  ShieldCheck,
} from 'lucide-react';
import { IPortfolioProject, IProjectIdea, IProjectImage } from '@shared/types';
import { ESTIMATION_DISCLAIMER_TEXT } from '@shared/constants';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: IPortfolioProject | null;
  idea?: IProjectIdea | null;
  onOpenEnquiry: (context: {
    relatedProjectId?: string;
    relatedProjectTitle?: string;
    relatedIdeaId?: string;
    relatedIdeaTitle?: string;
    defaultAreaSqFt?: number;
    defaultLocation?: string;
  }) => void;
  onSelectRelatedIdea?: (slug: string) => void;
  relatedIdeas?: any[];
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  isOpen,
  onClose,
  project,
  idea,
  onOpenEnquiry,
  onSelectRelatedIdea,
  relatedIdeas = [],
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({});

  const images: IProjectImage[] = project?.images?.length
    ? project.images
    : idea?.images?.length
    ? idea.images
    : [
        {
          url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=1200&auto=format&fit=crop&q=80',
          alt: 'GKA Construction project showcase',
          caption: 'Representative architectural reference',
          order: 1,
          imageType: 'illustrative_reference',
        },
      ];

  // Reset image index when project/idea changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setIsPlaying(false);
    setImageErrorMap({});
  }, [project, idea]);

  // Autoplay timer
  useEffect(() => {
    let interval: any;
    if (isPlaying && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length]);

  if (!isOpen || (!project && !idea)) return null;

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
  };

  const handleShare = () => {
    const currentUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentImage = images[currentImageIndex] || images[0];

  const title = project?.title || idea?.title || 'Project Details';
  const categoryLabel = project?.categoryLabel || idea?.areaCategoryLabel || 'Construction Showcase';
  const description = project?.description || idea?.description || '';
  const features = idea?.features || project?.workScope || [];
  const areaSqFt = project?.approxAreaSqFt || idea?.builtUpAreaSqFt;
  const isConcept = idea?.contentType === 'Concept Reference' || project?.projectType === 'design_reference';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-brand-navy-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="bg-[#07172C] text-white px-6 py-4 flex items-center justify-between border-b border-brand-navy-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D6A21D] bg-white/10 px-3 py-1 rounded-full border border-brand-gold-400/30">
              {categoryLabel}
            </span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                isConcept
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
              }`}
            >
              {isConcept ? 'Concept Reference' : 'Actual Verified Project'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-xs flex items-center gap-1.5"
              title="Copy project link"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-8 bg-[#F5F8FC]">
          {/* 1. Main Responsive Slideshow Gallery */}
          <div className="space-y-3">
            <div
              className="relative w-full h-72 sm:h-96 md:h-[460px] bg-slate-900 rounded-2xl overflow-hidden shadow-lg select-none group"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {imageErrorMap[currentImageIndex] ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#10203A] text-slate-400 p-6 text-center">
                  <Building className="w-12 h-12 text-[#D6A21D] mb-2 opacity-60" />
                  <p className="text-sm font-semibold text-white">GKA Construction Project Gallery</p>
                  <p className="text-xs text-slate-400 mt-1">Image preview loading or offline placeholder</p>
                </div>
              ) : (
                <img
                  src={currentImage.url}
                  alt={currentImage.alt || title}
                  onError={() => setImageErrorMap((prev) => ({ ...prev, [currentImageIndex]: true }))}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              )}

              {/* Prev / Next Controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    aria-label="Previous slide"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-105 backdrop-blur-sm"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Next slide"
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-105 backdrop-blur-sm"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Top Counter & Play/Pause bar */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {images.length > 1 && (
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all"
                    title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 text-[#D6A21D]" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-sm">
                  {currentImageIndex + 1} / {images.length}
                </span>
              </div>

              {/* Bottom Caption Overlay */}
              {currentImage.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 sm:p-6 text-white">
                  <p className="text-xs sm:text-sm font-medium leading-snug drop-shadow-sm">
                    {currentImage.caption}
                  </p>
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentImageIndex(idx);
                    }}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      currentImageIndex === idx
                        ? 'border-[#D6A21D] scale-105 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Project Title and Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#10203A] leading-tight">
                  {title}
                </h1>
                {project?.location && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mt-2">
                    <MapPin className="w-4 h-4 text-[#D6A21D]" />
                    <span>{project.location}</span>
                  </div>
                )}
              </div>

              {/* Overview */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Project Overview</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
              </div>

              {/* Work Scope / Key Features */}
              {features.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {project ? 'Verified Work Scope & Technical Highlights' : 'Design Features & Spatial Planning'}
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                    {features.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-[#F5F8FC] p-3 rounded-xl border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {idea?.tags && idea.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {idea.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-200/70 text-slate-700 border border-slate-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Pricing Disclosure Notice */}
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="block font-semibold mb-1">Pricing & Specifications Transparency:</strong>
                  <span>{ESTIMATION_DISCLAIMER_TEXT}</span>
                </div>
              </div>
            </div>

            {/* Right Quick Summary Card */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-premium space-y-5 sticky top-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                  Quick Details
                </h3>

                <div className="space-y-3 text-xs">
                  {areaSqFt && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Built-Up Area:</span>
                      <strong className="text-brand-navy-950 font-bold">{areaSqFt} sq. ft.</strong>
                    </div>
                  )}

                  {idea?.bedroomCount && idea.bedroomCount !== 'not_applicable' && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Configuration:</span>
                      <strong className="text-brand-navy-950 font-bold uppercase">
                        {idea.bedroomCount.replace('_', ' ')}
                      </strong>
                    </div>
                  )}

                  {idea?.propertyType && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Property Type:</span>
                      <strong className="text-brand-navy-950 font-bold capitalize">
                        {idea.propertyType.replace('_', ' ')}
                      </strong>
                    </div>
                  )}

                  {project?.client && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Verified Client:</span>
                      <strong className="text-brand-navy-950 font-bold">{project.client}</strong>
                    </div>
                  )}

                  {project?.status && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Project Status:</span>
                      <strong className="text-emerald-700 font-bold">{project.status}</strong>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Service Area:</span>
                    <strong className="text-brand-navy-950 font-bold">Chennai & Tiruvannamalai</strong>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenEnquiry({
                        relatedProjectId: project?._id,
                        relatedProjectTitle: project?.title,
                        relatedIdeaId: idea?.ideaId,
                        relatedIdeaTitle: idea?.title,
                        defaultAreaSqFt: areaSqFt,
                        defaultLocation: project?.location,
                      });
                    }}
                    className="w-full py-3.5 rounded-xl bg-[#D6A21D] hover:bg-amber-500 text-brand-navy-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Request a Site Visit & Estimate</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenEnquiry({
                        relatedProjectId: project?._id,
                        relatedProjectTitle: project?.title,
                        relatedIdeaId: idea?.ideaId,
                        relatedIdeaTitle: idea?.title,
                        defaultAreaSqFt: areaSqFt,
                      });
                    }}
                    className="w-full py-3 rounded-xl bg-[#10203A] hover:bg-[#07172C] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Ask About This Design</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#D6A21D]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Related Project Ideas Carousel */}
          {relatedIdeas && relatedIdeas.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-heading font-extrabold text-[#10203A]">
                  Explore Related Construction Ideas
                </h3>
                <span className="text-xs text-slate-500">Organized by built-up area & style</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedIdeas.map((rel: any) => (
                  <div
                    key={rel._id || rel.slug}
                    onClick={() => onSelectRelatedIdea && onSelectRelatedIdea(rel.slug)}
                    className="bg-white rounded-xl border border-slate-200 p-3 hover:border-[#D6A21D] hover:shadow-premium transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="h-32 rounded-lg bg-slate-100 overflow-hidden relative">
                        <img
                          src={rel.images?.[0]?.url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600'}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded bg-black/70 text-white backdrop-blur-sm">
                          {rel.builtUpAreaSqFt} sq. ft.
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-[#D6A21D] transition-colors">
                        {rel.title}
                      </h4>
                    </div>
                    <span className="text-[11px] font-semibold text-brand-navy-900 inline-flex items-center gap-1 mt-2">
                      View Idea <ArrowRight className="w-3 h-3 text-[#D6A21D]" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
