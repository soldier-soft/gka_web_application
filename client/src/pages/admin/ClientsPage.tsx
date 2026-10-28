import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Key,
  Copy,
  Check,
  Edit2,
  Trash2,
  Briefcase,
  IndianRupee,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatINR } from '@shared/types';
import { formatClientPortalUsername } from '@shared/constants';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasProjectsFilter, setHasProjectsFilter] = useState('all');

  // Create Client Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [portalUsername, setPortalUsername] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Chennai');
  const [state, setState] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Client Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAlternatePhone, setEditAlternatePhone] = useState('');
  const [editPortalUsername, setEditPortalUsername] = useState('');
  const [editPortalPassword, setEditPortalPassword] = useState('');
  const [editStreet, setEditStreet] = useState('');
  const [editCity, setEditCity] = useState('Chennai');
  const [editState, setEditState] = useState('Tamil Nadu');
  const [editPincode, setEditPincode] = useState('');
  const [editGstin, setEditGstin] = useState('');
  const [editPan, setEditPan] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSelectedProjectIds, setEditSelectedProjectIds] = useState<string[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);

  // Quick Project Creation for Client
  const [showQuickProjectModal, setShowQuickProjectModal] = useState(false);
  const [quickClient, setQuickClient] = useState<any>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('residential');
  const [quickBudgetRupees, setQuickBudgetRupees] = useState<number>(0);
  const [quickStreet, setQuickStreet] = useState('');
  const [quickCity, setQuickCity] = useState('Chennai');

  // Copy status feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientsRes, projectsRes] = await Promise.all([
        api.getClients(),
        api.getProjects(),
      ]);

      if (clientsRes.success) setClients(clientsRes.clients);
      if (projectsRes.success) setProjects(projectsRes.projects);
    } catch (err) {
      console.error('Error fetching clients data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update suggested username when client name changes
  useEffect(() => {
    if (name.trim() && !portalUsername) {
      setPortalUsername(formatClientPortalUsername(name));
    }
    if (phone.trim() && !portalPassword) {
      const cleanDigits = phone.replace(/\D/g, '').slice(-4) || '2026';
      setPortalPassword(`GKA@${cleanDigits}`);
    }
  }, [name, phone]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Please provide client name and phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createClient({
        name: name.trim(),
        companyName: companyName.trim() || undefined,
        phone: phone.trim(),
        alternatePhone: alternatePhone.trim() || undefined,
        email: portalUsername.trim() || formatClientPortalUsername(name),
        portalPassword: portalPassword.trim() || undefined,
        billingAddress: {
          street: street.trim(),
          city: city.trim() || 'Chennai',
          state: state.trim() || 'Tamil Nadu',
          pincode: pincode.trim(),
          gstin: gstin.trim() || undefined,
          pan: pan.trim() || undefined,
        },
        notes: notes.trim() || undefined,
        assignedProjectIds: selectedProjectIds,
      });

      if (res.success) {
        setShowCreateModal(false);
        resetCreateForm();
        fetchData();
        alert(`Client Profile created successfully! Portal login: ${res.portalCredentials.username}`);
      }
    } catch (err: any) {
      alert(err.message || 'Error creating client profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setName('');
    setCompanyName('');
    setPhone('');
    setAlternatePhone('');
    setPortalUsername('');
    setPortalPassword('');
    setStreet('');
    setCity('Chennai');
    setState('Tamil Nadu');
    setPincode('');
    setGstin('');
    setPan('');
    setNotes('');
    setSelectedProjectIds([]);
  };

  const handleOpenEdit = (client: any) => {
    setEditingClient(client);
    setEditName(client.name || '');
    setEditCompanyName(client.companyName || '');
    setEditPhone(client.phone || '');
    setEditAlternatePhone(client.alternatePhone || '');
    setEditPortalUsername(client.portalUsername || client.email || '');
    setEditPortalPassword(client.portalPassword || '');
    setEditStreet(client.billingAddress?.street || '');
    setEditCity(client.billingAddress?.city || 'Chennai');
    setEditState(client.billingAddress?.state || 'Tamil Nadu');
    setEditPincode(client.billingAddress?.pincode || '');
    setEditGstin(client.billingAddress?.gstin || '');
    setEditPan(client.billingAddress?.pan || '');
    setEditNotes(client.notes || '');
    setEditSelectedProjectIds((client.projects || []).map((p: any) => p._id));
    setEditIsActive(client.userIsActive !== false);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    setIsSubmitting(true);
    try {
      const res = await api.updateClient(editingClient._id, {
        name: editName.trim(),
        companyName: editCompanyName.trim(),
        phone: editPhone.trim(),
        alternatePhone: editAlternatePhone.trim(),
        email: editPortalUsername.trim(),
        portalPassword: editPortalPassword.trim() || undefined,
        billingAddress: {
          street: editStreet.trim(),
          city: editCity.trim(),
          state: editState.trim(),
          pincode: editPincode.trim(),
          gstin: editGstin.trim(),
          pan: editPan.trim(),
        },
        notes: editNotes.trim(),
        assignedProjectIds: editSelectedProjectIds,
        userIsActive: editIsActive,
      });

      if (res.success) {
        setShowEditModal(false);
        fetchData();
        alert('Client profile and credentials updated successfully!');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating client profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (client: any) => {
    if (client.projects && client.projects.length > 0) {
      alert(
        `Cannot delete this client profile. There are ${client.projects.length} project(s) actively linked. Reassign them first.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete profile for "${client.name}"?`)) {
      return;
    }

    try {
      const res = await api.deleteClient(client._id);
      if (res.success) {
        fetchData();
        alert('Client profile removed.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting client profile');
    }
  };

  const handleOpenQuickProject = (client: any) => {
    setQuickClient(client);
    setQuickTitle(`${client.name} — Construction Works`);
    setQuickCategory('residential');
    setQuickBudgetRupees(0);
    setQuickStreet(client.billingAddress?.street || 'Kelambakkam, Chennai');
    setQuickCity(client.billingAddress?.city || 'Chennai');
    setShowQuickProjectModal(true);
  };

  const handleCreateQuickProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClient) return;

    setIsSubmitting(true);
    try {
      const res = await api.createProject({
        title: quickTitle,
        category: quickCategory,
        clientId: quickClient._id,
        siteAddress: {
          street: quickStreet,
          city: quickCity,
          state: 'Tamil Nadu',
          pincode: quickClient.billingAddress?.pincode || '',
        },
        contractValuePaise: (Number(quickBudgetRupees) || 0) * 100,
        totalBudgetPaise: (Number(quickBudgetRupees) || 0) * 100,
        scopeOfWork: [`Construction execution for ${quickClient.name}`],
      });

      if (res.success) {
        setShowQuickProjectModal(false);
        fetchData();
        alert(`New Project Workspace ${res.project.projectId} linked to ${quickClient.name}!`);
      }
    } catch (err: any) {
      alert(err.message || 'Error creating project for client');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.portalUsername && c.portalUsername.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.projects && c.projects.some((p: any) => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.projectId.toLowerCase().includes(searchTerm.toLowerCase())));

    if (hasProjectsFilter === 'has_projects') {
      return matchesSearch && c.projects && c.projects.length > 0;
    }
    if (hasProjectsFilter === 'no_projects') {
      return matchesSearch && (!c.projects || c.projects.length === 0);
    }
    return matchesSearch;
  });

  // Aggregate statistics
  const totalClientsCount = clients.length;
  const activeProjectsCount = clients.reduce((acc, c) => acc + (c.projects ? c.projects.length : 0), 0);
  const totalInvoicedPaise = clients.reduce((acc, c) => acc + (c.totalInvoicedPaise || 0), 0);
  const totalBalanceDuePaise = clients.reduce((acc, c) => acc + (c.totalBalanceDuePaise || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-extrabold text-[#0F254B]">
              Client Profiles & Portal Logins
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D6A21D]/20 text-[#8B6508] border border-[#D6A21D]/40">
              @gkaconstruction.com Domain Accounts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized directory of client records, linked project workspaces, and separate login credentials for client portal access.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0F254B] text-white hover:bg-[#1E3A8A] transition-all shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-[#D6A21D]" />
          <span>New Client Profile</span>
        </button>
      </div>

      {/* 2. KPI Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Client Profiles
          </span>
          <div className="text-2xl font-extrabold text-[#0F254B] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D6A21D]" />
            <span>{totalClientsCount}</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Managed Client Profiles</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Linked Projects
          </span>
          <div className="text-2xl font-extrabold text-blue-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span>{activeProjectsCount}</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Active Project Workspaces</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Invoiced
          </span>
          <div className="text-2xl font-extrabold font-mono text-emerald-800 flex items-center gap-1.5">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <span>{formatINR(totalInvoicedPaise)}</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Across All Linked Projects</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Outstanding Receivables
          </span>
          <div className="text-2xl font-extrabold font-mono text-rose-700 flex items-center gap-1.5">
            <IndianRupee className="w-4 h-4 text-rose-500" />
            <span>{formatINR(totalBalanceDuePaise)}</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Pending Client Payments</span>
        </div>
      </div>

      {/* 3. Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by client name, company, phone, username or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0F254B]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={hasProjectsFilter}
            onChange={(e) => setHasProjectsFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">All Clients ({clients.length})</option>
            <option value="has_projects">With Linked Projects</option>
            <option value="no_projects">Without Projects Yet</option>
          </select>
        </div>
      </div>

      {/* 4. Client Profiles Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading client profiles & portal credentials...
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          No client profiles found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const isPassVisible = Boolean(visiblePasswords[client._id]);
            return (
              <div
                key={client._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-subtle hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Client Header Banner */}
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-heading font-extrabold text-sm text-[#0F254B] flex items-center gap-1.5">
                        <span>{client.name}</span>
                      </h3>
                      {client.companyName && (
                        <span className="text-[11px] font-semibold text-slate-500 block mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{client.companyName}</span>
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        client.userIsActive !== false
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {client.userIsActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-2 font-mono">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{client.phone}</span>
                    </span>
                    {client.billingAddress?.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{client.billingAddress.city}</span>
                      </span>
                    )}
                  </div>

                  {client.billingAddress?.street && (
                    <p className="text-[11px] text-slate-500 mt-1 flex items-start gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">
                        {client.billingAddress.street}
                        {client.billingAddress.city ? `, ${client.billingAddress.city}` : ''}
                      </span>
                    </p>
                  )}

                  {client.billingAddress?.gstin ? (
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 font-mono text-[10px] font-bold flex items-center gap-1">
                        <span className="text-slate-500 font-normal">GSTIN:</span>
                        <span>{client.billingAddress.gstin}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1.5 text-[10px] text-slate-400 italic">
                      No GSTIN registered
                    </div>
                  )}
                </div>

                {/* Body: Portal Credentials Box */}
                <div className="p-4 space-y-3 text-xs flex-1">
                  <div className="p-3 bg-[#EFF6FF] rounded-xl border border-[#BFDBFE] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E40AF] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Client Portal Login Credentials</span>
                      </span>
                      <span className="text-[9px] font-mono text-[#1E40AF]">/login</span>
                    </div>

                    {/* Username */}
                    <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-blue-200">
                      <div className="overflow-hidden mr-2">
                        <span className="text-[9px] text-slate-400 block font-semibold">PORTAL USERNAME</span>
                        <strong className="text-[#0F254B] font-mono text-[11px] truncate block select-all">
                          {client.portalUsername}
                        </strong>
                      </div>
                      <button
                        onClick={() => handleCopy(client.portalUsername, `user_${client._id}`)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded"
                        title="Copy Username"
                      >
                        {copiedKey === `user_${client._id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Password */}
                    <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-blue-200">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-semibold">PORTAL PASSWORD</span>
                        <strong className="text-[#0F254B] font-mono text-[11px] block select-all">
                          {isPassVisible ? client.portalPassword : '••••••••••••'}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => togglePasswordVisibility(client._id)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                          title={isPassVisible ? 'Hide Password' : 'Show Password'}
                        >
                          {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopy(client.portalPassword, `pass_${client._id}`)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Copy Password"
                        >
                          {copiedKey === `pass_${client._id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Linked Project Workspaces */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Linked Projects ({client.projects ? client.projects.length : 0})
                      </span>
                      <button
                        onClick={() => handleOpenQuickProject(client)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Project</span>
                      </button>
                    </div>

                    {client.projects && client.projects.length > 0 ? (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {client.projects.map((proj: any) => (
                          <Link
                            key={proj._id}
                            to={`/admin/projects/${proj._id}`}
                            className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-colors flex items-center justify-between text-[11px] block"
                          >
                            <div className="truncate mr-2">
                              <span className="font-mono font-bold text-[#0F254B] block text-[10px]">
                                {proj.projectId}
                              </span>
                              <span className="text-slate-700 truncate block text-[11px]">{proj.title}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase px-1.5 py-0.5 bg-white rounded border border-slate-200 shrink-0">
                              {proj.status}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg border border-dashed border-slate-200 text-center text-[10px] text-slate-400">
                        No projects linked yet. Click "Add Project" to launch workspace.
                      </div>
                    )}
                  </div>

                  {/* Financial Quick Tally */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-right font-mono text-[11px]">
                    <div className="text-left border-r border-slate-200 pr-2">
                      <span className="text-[9px] text-slate-400 block font-sans uppercase">Total Invoiced</span>
                      <strong className="text-slate-900 font-bold">{formatINR(client.totalInvoicedPaise || 0)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-sans uppercase">Balance Due</span>
                      <strong className="text-rose-600 font-bold">{formatINR(client.totalBalanceDuePaise || 0)}</strong>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => handleOpenEdit(client)}
                    className="px-3 py-1.5 rounded-lg font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Profile & Login</span>
                  </button>

                  <button
                    onClick={() => handleDeleteClient(client)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    title="Delete Profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Create Client Profile Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#0F254B]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-heading font-bold text-[#0F254B] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#D6A21D]" />
                <span>Create New Client Profile</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. S. Hariharan"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company / Entity Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Roots Corporation Ltd"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9884055677"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alternate Phone</label>
                  <input
                    type="text"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Portal Login Credentials Section */}
              <div className="p-3.5 bg-[#EFF6FF] rounded-xl border border-[#93C5FD] space-y-3">
                <div className="flex items-center gap-1.5 text-[#1E40AF] font-heading font-bold text-[11px] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#1E40AF]" />
                  <span>Client Portal Login Credentials (@gkaconstruction.com)</span>
                </div>
                <p className="text-[10px] text-slate-600">
                  The client will log in at <strong>gkaconstruction.com/login</strong> using this username and password to track project milestones, view site photos, and download bills.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                      Portal Login Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={portalUsername}
                      onChange={(e) => setPortalUsername(e.target.value)}
                      placeholder="e.g. hariharan@gkaconstruction.com"
                      className="w-full px-3 py-1.5 rounded-lg border border-blue-300 font-mono font-bold text-[#0F254B] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                      Portal Access Password *
                    </label>
                    <input
                      type="text"
                      required
                      value={portalPassword}
                      onChange={(e) => setPortalPassword(e.target.value)}
                      placeholder="e.g. GKA@5677"
                      className="w-full px-3 py-1.5 rounded-lg border border-blue-300 font-mono font-bold text-amber-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Billing / Site Address */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Site / Billing Address</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Plot No. 12, Kelambakkam, Chennai"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 mb-2"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Pincode"
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                      Client GSTIN
                    </label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="e.g. 33AAAAA0000A1Z5"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono uppercase font-bold text-[#0F254B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                      Client PAN Number
                    </label>
                    <input
                      type="text"
                      value={pan}
                      onChange={(e) => setPan(e.target.value)}
                      placeholder="e.g. AAAAA0000A"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Link Existing Projects */}
              {projects.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Link Existing Projects to this Client Profile
                  </label>
                  <div className="max-h-28 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                    {projects.map((p) => (
                      <label key={p._id} className="flex items-center gap-2 cursor-pointer text-[11px] p-1 hover:bg-white rounded">
                        <input
                          type="checkbox"
                          checked={selectedProjectIds.includes(p._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjectIds([...selectedProjectIds, p._id]);
                            } else {
                              setSelectedProjectIds(selectedProjectIds.filter((id) => id !== p._id));
                            }
                          }}
                          className="w-3.5 h-3.5 text-[#0F254B] rounded border-slate-300"
                        />
                        <span className="font-mono font-bold text-[#0F254B]">{p.projectId}</span>
                        <span className="text-slate-700 truncate">{p.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Client preferences, payment terms, or project notes..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-[11px]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg font-bold bg-[#0F254B] text-white hover:bg-[#1E3A8A] shadow"
                >
                  {isSubmitting ? 'Creating Profile...' : 'Save Client Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Client Profile Modal */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 z-50 bg-[#0F254B]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-heading font-bold text-[#0F254B] flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#D6A21D]" />
                <span>Edit Client Profile & Login Credentials</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company / Entity Name</label>
                  <input
                    type="text"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Alternate Phone</label>
                  <input
                    type="text"
                    value={editAlternatePhone}
                    onChange={(e) => setEditAlternatePhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Portal Login Credentials Section */}
              <div className="p-3.5 bg-[#EFF6FF] rounded-xl border border-[#93C5FD] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#1E40AF] font-heading font-bold text-[11px] uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-[#1E40AF]" />
                    <span>Client Portal Login Credentials (@gkaconstruction.com)</span>
                  </div>
                  <label className="flex items-center gap-1 cursor-pointer select-none text-[10px] text-slate-600 font-bold">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="w-3.5 h-3.5 text-[#0F254B] rounded"
                    />
                    <span>Account Active</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                      Portal Login Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={editPortalUsername}
                      onChange={(e) => setEditPortalUsername(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-blue-300 font-mono font-bold text-[#0F254B] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                      Portal Access Password
                    </label>
                    <input
                      type="text"
                      value={editPortalPassword}
                      onChange={(e) => setEditPortalPassword(e.target.value)}
                      placeholder="Leave unchanged or enter new"
                      className="w-full px-3 py-1.5 rounded-lg border border-blue-300 font-mono font-bold text-amber-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Billing / Site Address */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Site / Billing Address</label>
                <input
                  type="text"
                  value={editStreet}
                  onChange={(e) => setEditStreet(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 mb-2"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                  <input
                    type="text"
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                      Client GSTIN
                    </label>
                    <input
                      type="text"
                      value={editGstin}
                      onChange={(e) => setEditGstin(e.target.value)}
                      placeholder="e.g. 33AAAAA0000A1Z5"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono uppercase font-bold text-[#0F254B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                      Client PAN Number
                    </label>
                    <input
                      type="text"
                      value={editPan}
                      onChange={(e) => setEditPan(e.target.value)}
                      placeholder="e.g. AAAAA0000A"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Link Existing Projects */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Linked Projects for this Client
                </label>
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                  {projects.map((p) => (
                    <label key={p._id} className="flex items-center gap-2 cursor-pointer text-[11px] p-1 hover:bg-white rounded">
                      <input
                        type="checkbox"
                        checked={editSelectedProjectIds.includes(p._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditSelectedProjectIds([...editSelectedProjectIds, p._id]);
                          } else {
                            setEditSelectedProjectIds(editSelectedProjectIds.filter((id) => id !== p._id));
                          }
                        }}
                        className="w-3.5 h-3.5 text-[#0F254B] rounded border-slate-300"
                      />
                      <span className="font-mono font-bold text-[#0F254B]">{p.projectId}</span>
                      <span className="text-slate-700 truncate">{p.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-[11px]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg font-bold bg-[#0F254B] text-white hover:bg-[#1E3A8A] shadow"
                >
                  {isSubmitting ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Quick Create Project for Client Modal */}
      {showQuickProjectModal && quickClient && (
        <div className="fixed inset-0 z-50 bg-[#0F254B]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-heading font-bold text-[#0F254B] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#D6A21D]" />
                <span>Launch Project for {quickClient.name}</span>
              </h3>
              <button onClick={() => setShowQuickProjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              This will create a new construction project workspace linked directly to client profile <strong>{quickClient.name}</strong>. The client will automatically see this workspace when logging in.
            </p>

            <form onSubmit={handleCreateQuickProject} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="renovation">Renovation</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={quickBudgetRupees === 0 ? '' : quickBudgetRupees}
                    onChange={(e) => setQuickBudgetRupees(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="e.g. 1500000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Site Street Address</label>
                <input
                  type="text"
                  value={quickStreet}
                  onChange={(e) => setQuickStreet(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickProjectModal(false)}
                  className="px-4 py-2 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg font-bold bg-[#0F254B] text-white hover:bg-[#1E3A8A] shadow"
                >
                  {isSubmitting ? 'Creating...' : 'Create & Link Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
