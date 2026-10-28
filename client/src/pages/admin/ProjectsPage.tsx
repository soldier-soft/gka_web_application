import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  Edit3,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatINR, toPaise } from '@shared/types';
import { EditProjectModal } from '../../components/projects/EditProjectModal';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  // New Project form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('residential');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newSiteLocation, setNewSiteLocation] = useState('');
  const [newBudgetRupees, setNewBudgetRupees] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.getProjects(params);
      if (res.success) {
        setProjects(res.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // First create or find lead/client
      const enquiryRes = await api.createEnquiry({
        name: newClientName,
        phone: newClientPhone,
        projectCategory: newCategory,
        siteLocation: newSiteLocation,
        estimatedBudgetRupees: newBudgetRupees,
        source: 'direct',
      });

      if (enquiryRes.success && enquiryRes.leadId) {
        // Convert to project
        await api.convertLeadToProject(enquiryRes.leadId);
        setShowCreateModal(false);
        fetchProjects();
      }
    } catch (err: any) {
      alert(err.message || 'Error creating project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-brand-navy-950">
            Project Workspaces
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dedicated project tracking from site planning to structural execution, finishing, and handover.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg text-xs font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-brand-gold-400" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by ID, title or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 outline-none"
          >
            <option value="">All Projects</option>
            <option value="active">Active Execution</option>
            <option value="planning">Planning Phase</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading projects...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400">No projects found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProjects.map((p) => (
            <div
              key={p._id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle hover:border-brand-navy-900 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-brand-gold-600 bg-brand-gold-50 px-2 py-0.5 rounded border border-brand-gold-200">
                      {p.projectId}
                    </span>
                    <h3 className="text-lg font-heading font-bold text-brand-navy-950 mt-1.5">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold">Client: {p.clientId?.name || 'Client'}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                      p.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{p.siteAddress?.street || 'Site location'} • {p.siteAddress?.city || 'Chennai'}</span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Physical Progress</span>
                    <strong className="text-brand-navy-950 font-bold">{p.progressPercent || 0}%</strong>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-teal-500 to-brand-gold-500 rounded-full"
                      style={{ width: `${p.progressPercent || 0}%` }}
                    />
                  </div>
                </div>

                {/* Financial Overview Grid */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-medium">Contract Value</span>
                    <strong className="text-slate-900 font-mono text-xs block truncate">
                      {formatINR(p.contractValuePaise || 0)}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-medium">Actual Cost</span>
                    <strong className="text-slate-900 font-mono text-xs block truncate">
                      {formatINR(p.actualCostPaise || 0)}
                    </strong>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-medium">Collected</span>
                    <strong className="text-emerald-700 font-mono text-xs block truncate">
                      {formatINR(p.collectedAmountPaise || 0)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex justify-between items-center border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  PM: <strong>{p.assignedManagerId?.name?.split(' ')[0] || 'Unassigned'}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProject(p)}
                    className="px-3 py-1.5 rounded-lg font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-brand-navy-950 transition-colors inline-flex items-center gap-1.5"
                    title="Edit project parameters"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#D6A21D]" />
                    <span>Edit</span>
                  </button>

                  <Link
                    to={`/admin/projects/${p._id}`}
                    className="px-3.5 py-1.5 rounded-lg font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-brand-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-heading font-bold text-brand-navy-950">
              Create New Construction Project
            </h3>
            <p className="text-xs text-slate-500">
              Initializes a new workspace, generates a unique project ID (GKA-2026-XXX) and sets up standard milestones.
            </p>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                >
                  <option value="residential">Complete Home Construction</option>
                  <option value="commercial">Commercial Building</option>
                  <option value="renovation">Renovation & Remodeling</option>
                  <option value="civil_structural">Civil & Structural Works</option>
                  <option value="turnkey">Turnkey Package</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Client Full Name *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="e.g. 98401 23456"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Budget (₹)</label>
                  <input
                    type="number"
                    value={newBudgetRupees}
                    onChange={(e) => setNewBudgetRupees(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Site Address / Location *</label>
                <input
                  type="text"
                  required
                  value={newSiteLocation}
                  onChange={(e) => setNewSiteLocation(e.target.value)}
                  placeholder="e.g. Rajan Nagar, Kelambakkam, Chennai"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800"
                >
                  {isSubmitting ? 'Creating Project...' : 'Initialize Project Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          project={editingProject}
          onProjectUpdated={(updated) => {
            setProjects((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
            fetchProjects();
          }}
        />
      )}
    </div>
  );
};
