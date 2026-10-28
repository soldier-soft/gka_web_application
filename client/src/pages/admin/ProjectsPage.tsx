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
  UserCheck,
  KeyRound,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatINR, toPaise } from '@shared/types';
import { formatClientPortalUsername } from '@shared/constants';
import { EditProjectModal } from '../../components/projects/EditProjectModal';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  // New Project form state
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('residential');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newSiteLocation, setNewSiteLocation] = useState('');
  const [newBudgetRupees, setNewBudgetRupees] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success credentials popup
  const [successAccess, setSuccessAccess] = useState<{
    projectTitle: string;
    projectId: string;
    clientName: string;
    username: string;
    password?: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const fetchClients = async () => {
    try {
      const res = await api.getClients();
      if (res.success && res.clients) {
        setClients(res.clients);
        if (res.clients.length > 0 && !selectedClientId) {
          const first = res.clients[0];
          setSelectedClientId(first._id);
          setNewClientName(first.name);
          setNewClientPhone(first.phone);
          setNewSiteLocation(first.billingAddress?.street || first.billingAddress?.city || 'Kelambakkam, Chennai');
        }
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, [statusFilter]);

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c._id === clientId);
    if (client) {
      setNewClientName(client.name);
      setNewClientPhone(client.phone);
      setNewSiteLocation(client.billingAddress?.street || client.billingAddress?.city || 'Kelambakkam, Chennai');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalClientId = selectedClientId;
      let finalUsername = '';
      let finalPassword = '';

      if (clientMode === 'new') {
        const portalUser = formatClientPortalUsername(newClientName);
        const tempPass = `GKA@${newClientPhone.replace(/\D/g, '').slice(-4) || '2026'}`;
        const clientRes = await api.createClient({
          name: newClientName.trim(),
          phone: newClientPhone.trim(),
          email: portalUser,
          portalPassword: tempPass,
          billingAddress: {
            street: newSiteLocation.trim(),
            city: 'Chennai',
            state: 'Tamil Nadu',
            pincode: '',
          },
        });

        if (!clientRes.success) {
          throw new Error(clientRes.message || 'Failed to create client profile');
        }

        finalClientId = clientRes.client._id;
        finalUsername = clientRes.portalCredentials?.username || portalUser;
        finalPassword = clientRes.portalCredentials?.password || tempPass;
      } else {
        const client = clients.find((c) => c._id === selectedClientId);
        if (client) {
          finalUsername = client.email || formatClientPortalUsername(client.name);
          finalPassword = client.portalUser?.defaultPassword || `GKA@${(client.phone || '').replace(/\D/g, '').slice(-4) || '2026'}`;
        }
      }

      const projectTitle = newTitle.trim() || `${newClientName.trim()} — ${newCategory.toUpperCase()} Construction`;
      const res = await api.createProject({
        title: projectTitle,
        category: newCategory,
        clientId: finalClientId,
        siteAddress: {
          street: newSiteLocation.trim() || 'Kelambakkam, Chennai',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '',
        },
        contractValuePaise: toPaise(newBudgetRupees || 0),
        totalBudgetPaise: toPaise(newBudgetRupees || 0),
        scopeOfWork: [`Construction execution for ${newClientName.trim()}`],
      });

      if (res.success) {
        setShowCreateModal(false);
        fetchProjects();
        fetchClients();

        setSuccessAccess({
          projectTitle,
          projectId: res.project.projectId,
          clientName: newClientName,
          username: res.clientAccess?.username || finalUsername,
          password: res.clientAccess?.password || finalPassword,
        });

        // Reset
        setNewTitle('');
        setNewBudgetRupees(0);
      }
    } catch (err: any) {
      alert(err.message || 'Error creating project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
        <div className="fixed inset-0 z-50 bg-brand-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-heading font-bold text-brand-navy-950">
                  Create Construction Project Workspace
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Link to an existing client profile or create a new client with an automated <code className="text-brand-navy-900 font-mono font-semibold">@gkaconstruction.com</code> portal account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Client Profile Mode Selector */}
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setClientMode('existing')}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  clientMode === 'existing'
                    ? 'bg-white text-brand-navy-950 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-brand-gold-500" />
                <span>Existing Client Profile ({clients.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setClientMode('new');
                  setNewClientName('');
                  setNewClientPhone('');
                  setNewSiteLocation('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  clientMode === 'new'
                    ? 'bg-white text-brand-navy-950 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-brand-teal-500" />
                <span>+ New Client Profile</span>
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3.5">
              {clientMode === 'existing' ? (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Select Client Profile *
                  </label>
                  {clients.length > 0 ? (
                    <select
                      value={selectedClientId}
                      onChange={(e) => handleSelectClient(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold-400 font-medium"
                    >
                      {clients.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} {c.companyName ? `(${c.companyName})` : ''} — {c.email}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                      No existing client profiles found. Switch to <strong>+ New Client Profile</strong> to create one.
                    </div>
                  )}

                  {selectedClientId && (
                    <div className="p-3 bg-brand-navy-50/70 border border-brand-navy-100 rounded-xl flex items-start gap-2.5 text-xs text-brand-navy-900">
                      <ShieldCheck className="w-4 h-4 text-brand-navy-800 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Linked Portal Identity:</p>
                        <p className="font-mono text-[11px] text-brand-navy-800">
                          {clients.find((c) => c._id === selectedClientId)?.email || 'Client Portal Account'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          The client can view this new project in their portal automatically using their existing credentials.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-navy-950">
                    <Sparkles className="w-3.5 h-3.5 text-brand-gold-500" />
                    <span>New Client Credentials Setup</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Client Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Kumar"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold-400 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Client Mobile Phone *</label>
                    <input
                      type="tel"
                      required
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="e.g. 98401 23456"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold-400 bg-white"
                    />
                  </div>

                  {newClientName && (
                    <div className="text-[11px] bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Portal Username:</span>
                        <span className="font-mono font-bold text-brand-navy-950">
                          {formatClientPortalUsername(newClientName)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Default Password:</span>
                        <span className="font-mono font-bold text-brand-navy-950">
                          GKA@{newClientPhone.replace(/\D/g, '').slice(-4) || '2026'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title / Scope Name</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={`e.g. ${newClientName || 'Client'} — Luxury Villa Construction`}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Budget / Contract Value (₹)</label>
                  <input
                    type="number"
                    value={newBudgetRupees || ''}
                    onChange={(e) => setNewBudgetRupees(Number(e.target.value))}
                    placeholder="e.g. 5000000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none font-mono"
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
                  placeholder="e.g. Plot 42, Rajan Nagar, Kelambakkam, Chennai"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (clientMode === 'existing' && !selectedClientId)}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmitting ? 'Creating Project...' : 'Initialize Project Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Credentials Modal */}
      {successAccess && (
        <div className="fixed inset-0 z-50 bg-brand-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-heading font-bold text-brand-navy-950">
                Project Workspace Initialized
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Project ID: <span className="font-mono font-bold text-brand-navy-900">{successAccess.projectId}</span>
              </p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                {successAccess.projectTitle}
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-600">Client Portal Login:</span>
                <span className="text-[10px] bg-brand-navy-100 text-brand-navy-800 font-bold px-2 py-0.5 rounded-full">
                  @gkaconstruction.com
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Username:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-brand-navy-950">{successAccess.username}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(successAccess.username, 'user')}
                    className="p-1 rounded text-slate-400 hover:text-brand-navy-900 hover:bg-white"
                  >
                    {copiedKey === 'user' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {successAccess.password && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Password:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-brand-navy-950">{successAccess.password}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(successAccess.password!, 'pass')}
                      className="p-1 rounded text-slate-400 hover:text-brand-navy-900 hover:bg-white"
                    >
                      {copiedKey === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSuccessAccess(null)}
                className="w-full py-2.5 rounded-lg text-xs font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800"
              >
                Done
              </button>
            </div>
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
