import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Building2,
  Lightbulb,
  MessageSquare,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Star,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  Info,
  X,
  Save,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  PORTFOLIO_PROJECT_FILTERS,
  SQUARE_FOOTAGE_RANGES,
  BEDROOM_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  ARCHITECTURAL_STYLE_OPTIONS,
  CONCEPT_TYPE_OPTIONS,
} from '@shared/constants';
import { IPortfolioProject, IProjectIdea, IEnquiryRecord } from '@shared/types';

export const PortfolioAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'ideas' | 'enquiries'>('projects');

  // Data states
  const [projects, setProjects] = useState<IPortfolioProject[]>([]);
  const [ideas, setIdeas] = useState<IProjectIdea[]>([]);
  const [enquiries, setEnquiries] = useState<IEnquiryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAreaCategory, setSelectedAreaCategory] = useState('all');
  const [selectedEnquiryStatus, setSelectedEnquiryStatus] = useState('all');

  // Edit Modals State
  const [editingProject, setEditingProject] = useState<Partial<IPortfolioProject> | null>(null);
  const [editingIdea, setEditingIdea] = useState<Partial<IProjectIdea> | null>(null);
  const [editingEnquiry, setEditingEnquiry] = useState<IEnquiryRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load data based on active tab
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'projects') {
        const res = await api.getPublicProjects();
        if (res.success) setProjects(res.projects);
      } else if (activeTab === 'ideas') {
        const res = await api.getProjectIdeas({ limit: '100' });
        if (res.success) setIdeas(res.ideas);
      } else if (activeTab === 'enquiries') {
        const res = await api.getEnquiries({ limit: '100' });
        if (res.success) setEnquiries(res.enquiries);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Toggle Project Publish State
  const handleToggleProjectPublish = async (p: IPortfolioProject) => {
    try {
      const updated = await api.adminUpdateProject(p._id, { isPublished: !p.isPublished });
      if (updated.success) {
        setProjects((prev) =>
          prev.map((item) => (item._id === p._id ? { ...item, isPublished: !p.isPublished } : item))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update publish status');
    }
  };

  // Toggle Project Featured State
  const handleToggleProjectFeatured = async (p: IPortfolioProject) => {
    try {
      const updated = await api.adminUpdateProject(p._id, { isFeatured: !p.isFeatured });
      if (updated.success) {
        setProjects((prev) =>
          prev.map((item) => (item._id === p._id ? { ...item, isFeatured: !p.isFeatured } : item))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update featured status');
    }
  };

  // Save Project (Create / Edit)
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setIsSaving(true);
    try {
      if (editingProject._id) {
        await api.adminUpdateProject(editingProject._id, editingProject);
      } else {
        await api.adminCreateProject(editingProject);
      }
      setEditingProject(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error saving project');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Idea (Create / Edit)
  const handleSaveIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdea) return;
    setIsSaving(true);
    try {
      if (editingIdea._id) {
        await api.adminUpdateProjectIdea(editingIdea._id, editingIdea);
      } else {
        await api.adminCreateProjectIdea(editingIdea);
      }
      setEditingIdea(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error saving project idea');
    } finally {
      setIsSaving(false);
    }
  };

  // Update Enquiry Status
  const handleUpdateEnquiryStatus = async (id: string, newStatus: string) => {
    try {
      const res = await api.updateEnquiryStatus(id, { status: newStatus });
      if (res.success) {
        setEnquiries((prev) =>
          prev.map((enq) => (enq._id === id ? { ...enq, status: newStatus as any } : enq))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  // Filtered views
  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIdeas = ideas.filter((i) => {
    const matchArea = selectedAreaCategory === 'all' || i.areaCategory === selectedAreaCategory;
    const matchSearch =
      !searchTerm.trim() ||
      i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.ideaId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchArea && matchSearch;
  });

  const filteredEnquiries = enquiries.filter((e) => {
    const matchStatus = selectedEnquiryStatus === 'all' || e.status === selectedEnquiryStatus;
    const matchSearch =
      !searchTerm.trim() ||
      e.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.phone.includes(searchTerm);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#D6A21D] bg-brand-gold-50 px-3 py-1 rounded-full border border-brand-gold-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Website Portfolio & Enquiry Management</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-[#10203A] mt-2">
            Portfolio, 50+ Ideas & Enquiries
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage public portfolio entries, configure square-footage idea catalogues, and review prospective client enquiries.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('projects');
              setSearchTerm('');
            }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'projects' ? 'bg-[#10203A] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#D6A21D]" />
            <span>Portfolio Projects ({projects.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ideas');
              setSearchTerm('');
            }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'ideas' ? 'bg-[#10203A] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#D6A21D]" />
            <span>50+ Ideas ({ideas.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('enquiries');
              setSearchTerm('');
            }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'enquiries' ? 'bg-[#10203A] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#D6A21D]" />
            <span>Enquiries ({enquiries.length})</span>
          </button>
        </div>
      </div>

      {/* Action and Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#D6A21D] focus:outline-none"
            />
          </div>

          {activeTab === 'ideas' && (
            <select
              value={selectedAreaCategory}
              onChange={(e) => setSelectedAreaCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#D6A21D] bg-white font-medium"
            >
              {SQUARE_FOOTAGE_RANGES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          )}

          {activeTab === 'enquiries' && (
            <select
              value={selectedEnquiryStatus}
              onChange={(e) => setSelectedEnquiryStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#D6A21D] bg-white font-medium capitalize"
            >
              <option value="all">All Enquiries</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="site_visit_scheduled">Site Visit Scheduled</option>
              <option value="quotation_in_progress">Quotation in Progress</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
            </select>
          )}
        </div>

        <div>
          {activeTab === 'projects' && (
            <button
              onClick={() =>
                setEditingProject({
                  title: '',
                  category: 'residential',
                  categoryLabel: 'Residential Construction',
                  location: 'Chennai, Tamil Nadu',
                  description: '',
                  workScope: [''],
                  projectType: 'actual_work',
                  status: 'Completed',
                  images: [
                    {
                      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000',
                      alt: 'Project showcase reference',
                      caption: 'Front elevation view',
                      order: 1,
                      isCover: true,
                      imageType: 'actual_project',
                    },
                  ],
                  isVerified: true,
                  isPublished: true,
                  isFeatured: false,
                })
              }
              className="px-4 py-2 rounded-lg bg-[#10203A] text-white hover:bg-brand-navy-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#D6A21D]" />
              <span>Add Portfolio Project</span>
            </button>
          )}

          {activeTab === 'ideas' && (
            <button
              onClick={() =>
                setEditingIdea({
                  title: '',
                  builtUpAreaSqFt: 1200,
                  areaCategory: '1000_1200',
                  areaCategoryLabel: '1,000–1,200 sq. ft.',
                  bedroomCount: '3_bhk',
                  propertyType: 'single_floor',
                  architecturalStyle: 'contemporary',
                  conceptType: 'standard_family',
                  description: '',
                  features: ['Functional living and dining layout', 'Cross-ventilated bedroom arrangement'],
                  tags: ['3 BHK', 'Contemporary', 'Family Living'],
                  images: [
                    {
                      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000',
                      alt: 'Idea reference design',
                      caption: 'Exterior elevation concept',
                      order: 1,
                      isCover: true,
                      imageType: 'illustrative_reference',
                    },
                  ],
                  contentType: 'Concept Reference',
                  isPublished: true,
                  isFeatured: false,
                })
              }
              className="px-4 py-2 rounded-lg bg-[#10203A] text-white hover:bg-brand-navy-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#D6A21D]" />
              <span>Add Construction Idea</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Portfolio Projects Table */}
      {activeTab === 'projects' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-4">Cover</th>
                  <th className="p-4">Project Title & Category</th>
                  <th className="p-4">Verified Location</th>
                  <th className="p-4">Client / Scope</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Featured</th>
                  <th className="p-4 text-center">Published</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((p) => {
                  const cover = p.images?.find((img) => img.isCover) || p.images?.[0];
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <img
                          src={cover?.url}
                          alt={p.title}
                          className="w-16 h-12 rounded-lg object-cover border border-slate-200"
                        />
                      </td>
                      <td className="p-4">
                        <strong className="block text-slate-900 font-bold text-sm">{p.title}</strong>
                        <span className="text-[11px] text-[#D6A21D] font-semibold">{p.categoryLabel}</span>
                      </td>
                      <td className="p-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{p.location}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">
                        {p.client && <span className="font-semibold text-slate-800">{p.client}</span>}
                        <span className="block text-[11px] text-slate-500">
                          {p.workScope?.length || 0} scope items recorded
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleProjectFeatured(p)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            p.isFeatured
                              ? 'bg-amber-100 text-amber-700 border-amber-300'
                              : 'bg-slate-100 text-slate-400 border-slate-200'
                          }`}
                          title="Toggle featured status"
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleProjectPublish(p)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            p.isPublished
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                              : 'bg-rose-100 text-rose-700 border-rose-300'
                          }`}
                          title="Toggle publish status"
                        >
                          {p.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setEditingProject(p)}
                          className="p-1.5 text-slate-600 hover:text-[#10203A] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Project"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <a
                          href={`/projects/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-600 hover:text-[#D6A21D] hover:bg-slate-100 rounded-lg inline-block transition-colors"
                          title="View on Live Website"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: 50+ Project Ideas Table */}
      {activeTab === 'ideas' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-4">ID</th>
                  <th className="p-4">Cover</th>
                  <th className="p-4">Title & Description</th>
                  <th className="p-4">Built-Up Area</th>
                  <th className="p-4">Config & Type</th>
                  <th className="p-4 text-center">Content Type</th>
                  <th className="p-4 text-center">Published</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIdeas.map((i) => {
                  const cover = i.images?.[0];
                  return (
                    <tr key={i._id || i.ideaId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-600">{i.ideaId}</td>
                      <td className="p-4">
                        <img
                          src={cover?.url}
                          alt={i.title}
                          className="w-16 h-12 rounded-lg object-cover border border-slate-200"
                        />
                      </td>
                      <td className="p-4 max-w-sm">
                        <strong className="block text-slate-900 font-bold">{i.title}</strong>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{i.description}</p>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-[#10203A]">{i.builtUpAreaSqFt} sq.ft</span>
                        <span className="block text-[11px] text-slate-400">{i.areaCategoryLabel}</span>
                      </td>
                      <td className="p-4 text-slate-700 capitalize">
                        <span className="font-semibold">{i.bedroomCount.replace('_', ' ')}</span>
                        <span className="block text-[11px] text-slate-400">{i.propertyType.replace('_', ' ')}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {i.contentType}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            i.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {i.isPublished ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setEditingIdea(i)}
                          className="p-1.5 text-slate-600 hover:text-[#10203A] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Idea"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <a
                          href={`/projects?idea=${i.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-600 hover:text-[#D6A21D] hover:bg-slate-100 rounded-lg inline-block transition-colors"
                          title="Preview on Website"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Website Enquiries Review Table */}
      {activeTab === 'enquiries' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-4">Ref Number</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Project Location</th>
                  <th className="p-4">Service & Requirements</th>
                  <th className="p-4">Associated Concept</th>
                  <th className="p-4 text-center">Workflow Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnquiries.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-800">{e.referenceNumber}</td>
                    <td className="p-4">
                      <strong className="block text-slate-900 font-bold">{e.customerName}</strong>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <Phone className="w-3 h-3 text-[#D6A21D]" />
                        <span>{e.phone}</span>
                      </div>
                      {e.email && <span className="block text-[11px] text-slate-400">{e.email}</span>}
                    </td>
                    <td className="p-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#D6A21D] shrink-0" />
                        <span>{e.projectLocation}</span>
                      </div>
                      {e.builtUpAreaSqFt && (
                        <span className="block text-[11px] text-slate-500 mt-0.5">
                          {e.builtUpAreaSqFt} sq. ft.
                        </span>
                      )}
                    </td>
                    <td className="p-4 max-w-xs">
                      <span className="text-[11px] font-bold text-[#D6A21D] uppercase block">
                        {e.serviceType}
                      </span>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{e.requirements}</p>
                    </td>
                    <td className="p-4 text-slate-600">
                      {e.relatedIdeaTitle || e.relatedProjectTitle ? (
                        <span className="font-semibold text-slate-800 text-[11px] block">
                          {e.relatedIdeaTitle || e.relatedProjectTitle}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">General Site Enquiry</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <select
                        value={e.status}
                        onChange={(ev) => handleUpdateEnquiryStatus(e._id, ev.target.value)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-300 bg-white capitalize"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="site_visit_scheduled">Site Visit Scheduled</option>
                        <option value="quotation_in_progress">Quotation in Progress</option>
                        <option value="converted">Converted</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <a
                        href={`tel:${e.phone}`}
                        className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 inline-block transition-colors"
                        title="Call Customer"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <a
                        href={`https://wa.me/91${e.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 inline-block transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-heading font-extrabold text-[#10203A]">
                {editingProject._id ? 'Edit Portfolio Project' : 'Create New Portfolio Project'}
              </h3>
              <button onClick={() => setEditingProject(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={editingProject.title || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={editingProject.category || 'residential'}
                    onChange={(e) => {
                      const selected = PORTFOLIO_PROJECT_FILTERS.find((f) => f.id === e.target.value);
                      setEditingProject({
                        ...editingProject,
                        category: e.target.value as any,
                        categoryLabel: selected?.label || 'Residential Construction',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {PORTFOLIO_PROJECT_FILTERS.filter((f) => f.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={editingProject.location || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Work Scope Items (one per line)</label>
                <textarea
                  rows={3}
                  value={editingProject.workScope?.join('\n') || ''}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      workScope: e.target.value.split('\n').filter((l) => l.trim()),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <input
                    type="text"
                    value={editingProject.status || 'Completed'}
                    onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Approx Area (Sq.Ft)</label>
                  <input
                    type="number"
                    value={editingProject.approxAreaSqFt || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, approxAreaSqFt: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Client (Verified only)</label>
                  <input
                    type="text"
                    value={editingProject.client || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, client: e.target.value })}
                    placeholder="e.g. Roots Corporation Ltd"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProject.isPublished !== false}
                    onChange={(e) => setEditingProject({ ...editingProject, isPublished: e.target.checked })}
                    className="rounded text-[#D6A21D]"
                  />
                  <span className="font-semibold text-slate-700">Published to Live Website</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProject.isFeatured === true}
                    onChange={(e) => setEditingProject({ ...editingProject, isFeatured: e.target.checked })}
                    className="rounded text-[#D6A21D]"
                  />
                  <span className="font-semibold text-slate-700">Featured in Portfolio</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-[#10203A] text-white font-bold hover:bg-brand-navy-900"
                >
                  {isSaving ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Idea Modal */}
      {editingIdea && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-heading font-extrabold text-[#10203A]">
                {editingIdea._id ? 'Edit Construction Idea' : 'Add New Construction Idea'}
              </h3>
              <button onClick={() => setEditingIdea(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIdea} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={editingIdea.title || ''}
                    onChange={(e) => setEditingIdea({ ...editingIdea, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Built-Up Area (Sq.Ft) *</label>
                  <input
                    type="number"
                    required
                    value={editingIdea.builtUpAreaSqFt || ''}
                    onChange={(e) => setEditingIdea({ ...editingIdea, builtUpAreaSqFt: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Area Category Range *</label>
                  <select
                    value={editingIdea.areaCategory || '1000_1200'}
                    onChange={(e) => {
                      const range = SQUARE_FOOTAGE_RANGES.find((r) => r.id === e.target.value);
                      setEditingIdea({
                        ...editingIdea,
                        areaCategory: e.target.value as any,
                        areaCategoryLabel: range?.label || '1,000–1,200 sq. ft.',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {SQUARE_FOOTAGE_RANGES.filter((r) => r.id !== 'all').map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bedrooms</label>
                  <select
                    value={editingIdea.bedroomCount || '3_bhk'}
                    onChange={(e) => setEditingIdea({ ...editingIdea, bedroomCount: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {BEDROOM_OPTIONS.filter((b) => b.id !== 'all').map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={editingIdea.description || ''}
                  onChange={(e) => setEditingIdea({ ...editingIdea, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Key Features (one per line)</label>
                <textarea
                  rows={3}
                  value={editingIdea.features?.join('\n') || ''}
                  onChange={(e) =>
                    setEditingIdea({
                      ...editingIdea,
                      features: e.target.value.split('\n').filter((l) => l.trim()),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingIdea(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-[#10203A] text-white font-bold hover:bg-brand-navy-900"
                >
                  {isSaving ? 'Saving...' : 'Save Idea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
