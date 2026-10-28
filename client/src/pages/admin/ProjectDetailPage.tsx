import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  Camera,
  Layers,
  ArrowLeft,
  Eye,
  Sliders,
  AlertCircle,
  FileText,
  FileDown,
  Receipt,
  Package,
  MessageSquare,
  History,
  TrendingUp,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
  Plus,
  Send,
  Building2,
  Users,
  Copy,
  Key,
  Share2,
  Edit,
} from 'lucide-react';
import { api, downloadFile, getFileUrl } from '../../services/api';
import { formatINR, toRupees } from '@shared/types';
import { GKA_COMPANY } from '@shared/constants';
import { ShareDocumentModal, ShareDocumentData } from '../../components/common/ShareDocumentModal';
import { EditProjectModal } from '../../components/projects/EditProjectModal';

type WorkspaceTab =
  | 'overview'
  | 'milestones'
  | 'site_reports'
  | 'photos_documents'
  | 'quotations'
  | 'invoices_receipts'
  | 'inventory'
  | 'costs'
  | 'client_feedback'
  | 'preview_portal'
  | 'audit_history';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [siteReports, setSiteReports] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [clientFeedbacks, setClientFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalData, setShareModalData] = useState<ShareDocumentData | null>(null);

  // Edit Project Modal State
  const [showEditModal, setShowEditModal] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');

  // Action states
  const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null);
  const [convertingQuoId, setConvertingQuoId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const fetchProjectDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getProjectById(id);
      if (res.success) {
        setProject(res.project);
        setMilestones(res.milestones || []);
        setSiteReports(res.recentSiteReports || []);
        setInvoices((res as any).invoices || []);
        setPayments((res as any).payments || []);
        setQuotations((res as any).quotations || []);
        setExpenses((res as any).expenses || []);
        setClientFeedbacks((res as any).clientFeedbacks || []);
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const showNotification = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  const handleUpdateMilestoneProgress = async (milestoneId: string, progress: number, status?: string) => {
    try {
      setUpdatingMilestoneId(milestoneId);
      const res = await api.updateMilestone(milestoneId, {
        progressPercent: progress,
        ...(status && { status }),
      });
      if (res.success) {
        showNotification('Milestone progress updated and project completion recalculated.');
        fetchProjectDetails();
      }
    } catch (error) {
      console.error('Failed to update milestone:', error);
    } finally {
      setUpdatingMilestoneId(null);
    }
  };

  const handleTogglePublish = async (reportId: string) => {
    try {
      const res = await api.togglePublishReport(reportId);
      if (res.success) {
        setSiteReports((prev) =>
          prev.map((r) => (r._id === reportId ? { ...r, isPublishedToClient: res.report.isPublishedToClient } : r))
        );
        showNotification(
          res.report.isPublishedToClient
            ? 'Site Report published to Client Portal.'
            : 'Site Report moved to draft / internal state.'
        );
      }
    } catch (error) {
      console.error('Failed to toggle report publish:', error);
    }
  };

  const handleConvertQuotation = async (quotationId: string) => {
    if (!confirm('Are you sure you want to convert this approved quotation into a formal Tax Invoice?')) return;
    try {
      setConvertingQuoId(quotationId);
      const res = await api.convertQuotationToInvoice(quotationId);
      if (res.success) {
        showNotification(res.message);
        fetchProjectDetails();
        setActiveTab('invoices_receipts');
      }
    } catch (err: any) {
      alert(err.message || 'Error converting quotation to invoice');
    } finally {
      setConvertingQuoId(null);
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    try {
      const res = await api.verifyPayment(paymentId);
      if (res.success) {
        showNotification('Payment verified. Client collections and invoice balance updated.');
        fetchProjectDetails();
      }
    } catch (err: any) {
      alert(err.message || 'Error verifying payment');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading project workspace...</div>;
  }

  if (!project) {
    return (
      <div className="p-12 text-center text-xs text-rose-500">
        Project not found.{' '}
        <Link to="/admin/projects" className="underline ml-2">
          Back to projects
        </Link>
      </div>
    );
  }

  const receivablesPaise = Math.max(0, (project.invoicedAmountPaise || 0) - (project.collectedAmountPaise || 0));
  const estimatedProfitPaise = Math.max(0, (project.contractValuePaise || 0) - (project.totalBudgetPaise || 0));
  const recognizedMarginPaise = (project.invoicedAmountPaise || 0) - (project.actualCostPaise || 0);

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'milestones', label: 'Schedule & Milestones', icon: Layers },
    { id: 'site_reports', label: 'Daily Site Reports', icon: FileText },
    { id: 'photos_documents', label: 'Photos & Documents', icon: Camera },
    { id: 'quotations', label: 'Quotations', icon: Briefcase },
    { id: 'invoices_receipts', label: 'Invoices & Receipts', icon: Receipt },
    { id: 'inventory', label: 'Materials & Inventory', icon: Package },
    { id: 'costs', label: 'Project Costs', icon: IndianRupee },
    { id: 'client_feedback', label: 'Client Feedback', icon: MessageSquare },
    { id: 'preview_portal', label: 'Client Portal Preview', icon: Eye },
    { id: 'audit_history', label: 'Audit History', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#10203A] text-white px-5 py-3 rounded-xl shadow-2xl border border-[#D6A21D] flex items-center gap-3 text-xs">
          <CheckCircle2 className="w-4 h-4 text-[#D6A21D]" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Top Header & Navigation */}
      <div>
        <Link
          to="/admin/projects"
          className="text-xs font-semibold text-slate-500 hover:text-brand-navy-900 inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Projects</span>
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-brand-gold-600 bg-brand-gold-50 px-2.5 py-0.5 rounded border border-brand-gold-200">
                {project.projectId}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full capitalize bg-emerald-100 text-emerald-800">
                {project.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-brand-navy-950 mt-1">
              {project.title}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: <strong>{project.clientId?.name}</strong> • Site: {project.siteAddress?.street},{' '}
              {project.siteAddress?.city}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Download Welcome PDF */}
            <button
              onClick={() => downloadFile(`/projects/${project._id}/welcome-pdf`, `GKA_Project_Welcome_${project.projectId}.pdf`)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-[#D6A21D]" />
              <span>Download Welcome PDF</span>
            </button>

            {/* Share Welcome Packet (WhatsApp & Mail) */}
            <button
              onClick={() => {
                setShareModalData({
                  documentType: 'welcome',
                  number: project.projectId,
                  projectTitle: project.title,
                  clientName: project.clientId?.name,
                  clientContactPerson: project.clientId?.contactPerson,
                  clientEmail: project.clientId?.email || '',
                  clientPhone: project.clientId?.phone || '',
                  siteLocation: `${project.siteAddress?.street || ''}, ${project.siteAddress?.city || ''}`,
                  amount: toRupees(project.contractValuePaise || 0),
                  pdfUrl: `/api/v1/projects/${project._id}/welcome-pdf`,
                  username: project.clientId?.email || 'client@gingerhotel.com',
                  password: 'GKAclient2026!',
                });
                setShowShareModal(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Welcome Packet</span>
            </button>

            {/* Edit Project Parameters */}
            <button
              onClick={() => setShowEditModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0F254B] hover:bg-[#1A3A73] text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              title="Edit project details, status, dates, and budget"
            >
              <Edit className="w-4 h-4 text-[#D6A21D]" />
              <span>Edit Project</span>
            </button>

            {/* Quick Portal Preview switch */}
            <button
              onClick={() => setActiveTab('preview_portal')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4 text-[#D6A21D]" />
              <span>Preview Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* 11 Workspace Navigation Tabs Bar */}
      <div className="border-b border-slate-200 bg-white rounded-xl p-1 shadow-sm overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as WorkspaceTab)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-[#10203A] text-white shadow-sm ring-1 ring-[#D6A21D]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#D6A21D]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.id === 'client_feedback' && clientFeedbacks.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                    {clientFeedbacks.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          TAB 1: OVERVIEW
      ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Financial Health Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-subtle">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Approved Contract</span>
              <strong className="text-sm font-bold text-slate-900 font-mono block mt-0.5">
                {formatINR(project.contractValuePaise || 0)}
              </strong>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-subtle">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Execution Budget</span>
              <strong className="text-sm font-bold text-slate-900 font-mono block mt-0.5">
                {formatINR(project.totalBudgetPaise || 0)}
              </strong>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-subtle">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Actual Costs (Recognized)</span>
              <strong className="text-sm font-bold text-rose-600 font-mono block mt-0.5">
                {formatINR(project.actualCostPaise || 0)}
              </strong>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-subtle">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Invoiced to Client</span>
              <strong className="text-sm font-bold text-slate-900 font-mono block mt-0.5">
                {formatINR(project.invoicedAmountPaise || 0)}
              </strong>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-subtle">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Verified Collections</span>
              <strong className="text-sm font-bold text-emerald-700 font-mono block mt-0.5">
                {formatINR(project.collectedAmountPaise || 0)}
              </strong>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-subtle">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Receivables Balance</span>
              <strong className="text-sm font-bold text-amber-600 font-mono block mt-0.5">
                {formatINR(receivablesPaise)}
              </strong>
            </div>
          </div>

          {/* Project Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
              <h3 className="font-heading font-bold text-base text-brand-navy-950 border-b border-slate-100 pb-3">
                Project Scope & Engineering Milestones
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {project.notes || 'No project description notes provided.'}
              </p>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Scope Highlights:</h4>
                <div className="flex flex-wrap gap-2">
                  {project.scopeOfWork?.map((s: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 rounded-md text-xs bg-slate-100 text-slate-700 border">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Start Date</span>
                  <strong className="text-slate-800">{new Date(project.startDate).toLocaleDateString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Target Handover</span>
                  <strong className="text-slate-800">{new Date(project.targetEndDate).toLocaleDateString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Category</span>
                  <strong className="capitalize text-slate-800">{project.category}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Calculated Completion</span>
                  <strong className="text-[#D6A21D] font-mono">{project.progressPercent}%</strong>
                </div>
              </div>
            </div>

            {/* Client & Bank Summary */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-subtle space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-heading font-bold text-base text-brand-navy-950">
                  Client Portal Account & Credentials
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Workspace
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Primary Client Contact</span>
                  <strong className="text-slate-900 block">{project.clientId?.name}</strong>
                  <span className="text-slate-600">{project.clientId?.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Portal Login Username</span>
                  <span className="text-slate-800 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded block w-fit mt-0.5">
                    {project.clientId?.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Default Password for Client</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-amber-800 font-mono font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded">
                      {project.clientId?.phone ? `GKA@${project.clientId.phone.replace(/\D/g, '').slice(-4) || '2026'}` : 'GKAclient2026!'}
                    </span>
                    <button
                      onClick={() => {
                        const pwd = project.clientId?.phone ? `GKA@${project.clientId.phone.replace(/\D/g, '').slice(-4) || '2026'}` : 'GKAclient2026!';
                        navigator.clipboard.writeText(pwd);
                        setActionSuccessMessage('Default password copied to clipboard!');
                        setTimeout(() => setActionSuccessMessage(null), 2500);
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Attached Project Commercials</span>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => setActiveTab('quotations')}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Briefcase className="w-3 h-3 text-[#D6A21D]" />
                      <span>{quotations.length} Quotation{quotations.length === 1 ? '' : 's'}</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('invoices_receipts')}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Receipt className="w-3 h-3 text-[#D6A21D]" />
                      <span>{invoices.length} Bill{invoices.length === 1 ? '' : 's'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs space-y-1">
                <span className="font-bold text-amber-900 block">Federal Bank Payment Info:</span>
                <p className="text-[11px] text-amber-800">
                  Beneficiary: <strong>{GKA_COMPANY.bankDetails.beneficiary}</strong>
                  <br />
                  Bank: <strong>{GKA_COMPANY.bankDetails.bankName}</strong>
                  <br />
                  Account: <strong>{GKA_COMPANY.bankDetails.accountNumber}</strong>
                  <br />
                  IFSC: <strong>{GKA_COMPANY.bankDetails.ifscCode}</strong>
                </p>
              </div>

              <button
                onClick={() => downloadFile(`/projects/${project._id}/welcome-pdf`, `GKA_Project_Welcome_${project.projectId}.pdf`)}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#10203A] text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-[#D6A21D]" />
                <span>Generate Client Invitation PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: SCHEDULE & MILESTONES
      ======================================================== */}
      {activeTab === 'milestones' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading font-bold text-base text-brand-navy-950">
                Schedule & Weighted Milestones Tracker
              </h3>
              <p className="text-xs text-slate-500">
                Adjust progress sliders to recalculate verified completion ({project.progressPercent}%). Only published
                milestones are visible to client.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-brand-navy-900 text-white rounded-lg">
              Overall: {project.progressPercent}%
            </span>
          </div>

          <div className="space-y-4">
            {milestones.map((m) => (
              <div
                key={m._id}
                className={`p-4 rounded-xl border transition-all ${
                  m.status === 'completed'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : m.status === 'in_progress'
                    ? 'border-brand-navy-200 bg-slate-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-navy-900 text-brand-gold-400 font-bold text-xs flex items-center justify-center">
                      {m.code}
                    </span>
                    <h4 className="font-bold text-sm text-brand-navy-950">{m.title}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold">({m.weightagePercent}% weightage)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold capitalize ${
                        m.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {m.status?.replace('_', ' ')}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.isPublishedToClient ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {m.isPublishedToClient ? '✓ Published to Client' : 'Draft / Internal'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-3">{m.description}</p>

                {/* Progress Control */}
                <div className="flex items-center gap-4 pt-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={m.progressPercent}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleUpdateMilestoneProgress(m._id, val, val === 100 ? 'completed' : val > 0 ? 'in_progress' : 'pending');
                    }}
                    disabled={updatingMilestoneId === m._id}
                    className="flex-1 accent-brand-gold-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold w-12 text-right">{m.progressPercent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: DAILY SITE REPORTS
      ======================================================== */}
      {activeTab === 'site_reports' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading font-bold text-base text-brand-navy-950">Daily Site Reports</h3>
              <p className="text-xs text-slate-500">
                Draft reports are internal only. Toggle publish to push verified site progress and photos to client portal.
              </p>
            </div>
            <Link
              to="/admin/site-ops"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#10203A] text-white hover:bg-slate-800 transition-colors"
            >
              + Create Site Report
            </Link>
          </div>

          {siteReports.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No daily site reports filed yet.</p>
          ) : (
            <div className="space-y-4">
              {siteReports.map((report) => (
                <div key={report._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-slate-900 block text-sm">
                        Report Date: {new Date(report.reportDate).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Weather: {report.weatherCondition} • Workers: {report.workersCount || 0}
                      </span>
                    </div>

                    <button
                      onClick={() => handleTogglePublish(report._id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        report.isPublishedToClient
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {report.isPublishedToClient ? '✓ Published to Client' : 'Publish to Client'}
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-100">
                    {report.workCompletedSummary}
                  </p>

                  {report.photos && report.photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {report.photos.map((ph: any, i: number) => (
                        <div key={i} className="rounded-lg overflow-hidden border">
                          <img src={ph.url} alt={ph.caption} className="h-28 w-full object-cover" />
                          <span className="p-1 text-[10px] text-slate-600 block truncate">{ph.caption}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 4: PHOTOS & DOCUMENTS
      ======================================================== */}
      {activeTab === 'photos_documents' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-6">
          <h3 className="font-heading font-bold text-base text-brand-navy-950 border-b border-slate-100 pb-3">
            Approved Site Gallery & Technical Drawings
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {siteReports.flatMap((r) => r.photos || []).map((ph: any, idx: number) => (
              <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img src={ph.url} alt={ph.caption} className="h-44 w-full object-cover" />
                <div className="p-2 text-xs text-slate-700">{ph.caption || 'Verified Site Photo'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: QUOTATIONS
      ======================================================== */}
      {activeTab === 'quotations' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading font-bold text-base text-brand-navy-950">Commercial Quotations</h3>
              <p className="text-xs text-slate-500">
                Convert approved quotations into invoices with line items and tax treatment preserved.
              </p>
            </div>
            <Link
              to="/admin/quotations"
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#10203A] text-white hover:bg-slate-800 transition-colors"
            >
              + New Quotation
            </Link>
          </div>

          {quotations.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No quotations recorded for this project yet.</p>
          ) : (
            <div className="space-y-3">
              {quotations.map((q) => (
                <div key={q._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-brand-navy-950">{q.quotationNumber}</strong>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                        q.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {q.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Items: {q.items?.length || 0} • Valid Until: {new Date(q.validUntil).toLocaleDateString('en-IN')}
                    </span>
                    <span className="block font-mono font-bold text-slate-900 mt-1">
                      {formatINR(q.totalAmountPaise)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadFile(`/quotations/${q._id}/pdf`, `GKA_Quotation_${q.quotationNumber}.pdf`)}
                      className="px-3 py-1.5 rounded-lg border bg-white text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5 text-[#D6A21D]" />
                      <span>PDF</span>
                    </button>

                    <button
                      onClick={() => downloadFile(`/quotations/${q._id}/docx`, `GKA_Quotation_${q.quotationNumber}.docx`)}
                      className="px-3 py-1.5 rounded-lg border bg-white text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>DOCX</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShareModalData({
                          documentType: 'quotation',
                          number: q.quotationNumber,
                          projectTitle: q.projectTitle || project.title,
                          clientName: q.clientCompany || q.clientName || project.clientId?.name,
                          clientContactPerson: q.clientContactPerson,
                          clientEmail: project.clientId?.email || '',
                          clientPhone: project.clientId?.phone || '',
                          siteLocation: q.siteLocation || `${project.siteAddress?.street || ''}, ${project.siteAddress?.city || ''}`,
                          amount: toRupees(q.totalAmountPaise || 0),
                          pdfUrl: `/api/v1/quotations/${q._id}/pdf`,
                          docxUrl: `/api/v1/quotations/${q._id}/docx`,
                          username: project.clientId?.email || 'client@gingerhotel.com',
                          password: 'GKAclient2026!',
                        });
                        setShowShareModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg border bg-white text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex items-center gap-1 font-semibold cursor-pointer"
                      title="Share via WhatsApp & Mail"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Share</span>
                    </button>

                    {q.status === 'approved' && (
                      <button
                        onClick={() => handleConvertQuotation(q._id)}
                        disabled={convertingQuoId === q._id}
                        className="px-3 py-1.5 rounded-lg bg-[#10203A] hover:bg-[#D6A21D] hover:text-[#07172C] text-white font-bold transition-all shadow-sm flex items-center gap-1"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Convert to Invoice</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 6: INVOICES & RECEIPTS
      ======================================================== */}
      {activeTab === 'invoices_receipts' && (
        <div className="space-y-6">
          {/* Invoices List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
            <h3 className="font-heading font-bold text-base text-brand-navy-950 border-b border-slate-100 pb-3">
              Tax Invoices Issued
            </h3>

            {invoices.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No invoices issued for this project.</p>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div key={inv._id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-sm font-bold text-brand-navy-950 block">{inv.invoiceNumber}</strong>
                      <span className="text-[11px] text-slate-500">
                        Issued: {new Date(inv.issueDate).toLocaleDateString('en-IN')} • Due: {new Date(inv.dueDate).toLocaleDateString('en-IN')}
                      </span>
                      <div className="flex items-center gap-3 mt-1 font-mono">
                        <span>Total: <strong>{formatINR(inv.totalAmountPaise)}</strong></span>
                        <span className="text-emerald-700">Paid: <strong>{formatINR(inv.paidAmountPaise)}</strong></span>
                        <span className="text-rose-600">Due: <strong>{formatINR(inv.dueAmountPaise)}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold capitalize ${
                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.status?.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => downloadFile(`/finance/invoices/${inv._id}/pdf`, `GKA_Invoice_${inv.invoiceNumber}.pdf`)}
                        className="px-3 py-1.5 rounded-lg border bg-white text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5 text-[#D6A21D]" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => downloadFile(`/finance/invoices/${inv._id}/docx`, `GKA_Invoice_${inv.invoiceNumber}.docx`)}
                        className="px-3 py-1.5 rounded-lg border bg-white text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>DOCX</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShareModalData({
                            documentType: 'invoice',
                            number: inv.invoiceNumber,
                            projectTitle: inv.projectTitle || project.title,
                            clientName: inv.clientCompany || inv.clientName || project.clientId?.name,
                            clientContactPerson: inv.clientContactPerson,
                            clientEmail: project.clientId?.email || '',
                            clientPhone: project.clientId?.phone || '',
                            siteLocation: inv.billingAddress || `${project.siteAddress?.street || ''}, ${project.siteAddress?.city || ''}`,
                            amount: toRupees(inv.totalAmountPaise || 0),
                            dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : undefined,
                            pdfUrl: `/api/v1/finance/invoices/${inv._id}/pdf`,
                            docxUrl: `/api/v1/finance/invoices/${inv._id}/docx`,
                            username: project.clientId?.email || 'client@gingerhotel.com',
                            password: 'GKAclient2026!',
                          });
                          setShowShareModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg border bg-white text-emerald-700 hover:bg-emerald-50 transition-colors inline-flex items-center gap-1 font-semibold cursor-pointer"
                        title="Share via WhatsApp & Mail"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Receipts Ledger */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
            <h3 className="font-heading font-bold text-base text-brand-navy-950 border-b border-slate-100 pb-3">
              Payment Receipts Ledger & Bank Verification
            </h3>

            {payments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No payment receipts recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div key={p._id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-slate-900">{p.paymentNumber}</strong>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.verificationStatus === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.verificationStatus === 'reconciled'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.verificationStatus === 'verification_pending' ? 'Verification Pending' : p.verificationStatus}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Date: {new Date(p.paymentDate).toLocaleDateString('en-IN')} • Mode: {p.paymentMode} • Ref: {p.transactionReference}
                      </span>
                      <strong className="block text-emerald-700 font-mono mt-0.5">{formatINR(p.amountPaise)}</strong>
                      {p.notes && <p className="text-[11px] text-slate-500 mt-0.5 italic">{p.notes}</p>}
                    </div>

                    {p.verificationStatus === 'verification_pending' && (
                      <button
                        onClick={() => handleVerifyPayment(p._id)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirm & Verify Receipt</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 7: MATERIALS & INVENTORY
      ======================================================== */}
      {activeTab === 'inventory' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
          <h3 className="font-heading font-bold text-base text-brand-navy-950 border-b border-slate-100 pb-3">
            Project Material Allocations & Stock Movement
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                <tr>
                  <th className="p-3">Material</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Budgeted Qty</th>
                  <th className="p-3">Issued to Site</th>
                  <th className="p-3">Consumed</th>
                  <th className="p-3">Stock Balance</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-bold text-slate-800">UltraTech Cement (PPC/OPC)</td>
                  <td className="p-3">Bags</td>
                  <td className="p-3">1,200</td>
                  <td className="p-3">850</td>
                  <td className="p-3">810</td>
                  <td className="p-3 font-bold text-slate-800">40</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Adequate</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-800">Fe550D TMT Reinforcement Steel</td>
                  <td className="p-3">Tons</td>
                  <td className="p-3">14.5</td>
                  <td className="p-3">11.0</td>
                  <td className="p-3">10.8</td>
                  <td className="p-3 font-bold text-slate-800">0.2</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Reorder Due</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-800">Washed River Sand (Plastering)</td>
                  <td className="p-3">Units</td>
                  <td className="p-3">18</td>
                  <td className="p-3">14</td>
                  <td className="p-3">12</td>
                  <td className="p-3 font-bold text-slate-800">2</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Adequate</span></td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-800">20mm Blue Metal Coarse Aggregate</td>
                  <td className="p-3">Units</td>
                  <td className="p-3">22</td>
                  <td className="p-3">18</td>
                  <td className="p-3">18</td>
                  <td className="p-3 font-bold text-slate-800">0</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">Fully Consumed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 8: PROJECT COSTS (Internal Only)
      ======================================================== */}
      {activeTab === 'costs' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading font-bold text-base text-brand-navy-950">
                Recognized Project Expenses & Cost Allocation
              </h3>
              <p className="text-xs text-rose-600 font-semibold">
                * Strictly Confidential: Internal costs and supplier prices are never exposed to clients.
              </p>
            </div>
            <strong className="text-sm font-mono text-slate-900">
              Total Actual Cost: {formatINR(project.actualCostPaise || 0)}
            </strong>
          </div>

          {expenses.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No internal expenses allocated to this project.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Paid To</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <tr key={exp._id}>
                      <td className="p-3 text-slate-500">{new Date(exp.expenseDate || exp.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 capitalize font-semibold">{exp.category}</td>
                      <td className="p-3 text-slate-700">{exp.description}</td>
                      <td className="p-3 text-slate-600">{exp.paidTo}</td>
                      <td className="p-3 uppercase text-slate-500">{exp.paymentMethod}</td>
                      <td className="p-3 text-right font-mono font-bold text-rose-600">{formatINR(exp.amountPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 9: CLIENT FEEDBACK & VARIATIONS
      ======================================================== */}
      {activeTab === 'client_feedback' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading font-bold text-base text-brand-navy-950">
                Client Queries, Feedback & Change-Order Requests
              </h3>
              <p className="text-xs text-slate-500">
                Two-way communication log. Additional requirements are routed through owner-approved variations.
              </p>
            </div>
          </div>

          {clientFeedbacks.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No client feedback tickets submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {clientFeedbacks.map((fb) => (
                <div key={fb._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#10203A] bg-slate-200 px-2 py-0.5 rounded">
                        {fb.ticketNumber}
                      </span>
                      <strong className="text-slate-900 text-sm">{fb.subject}</strong>
                      <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {fb.category?.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(fb.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </span>
                  </div>

                  <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-100">
                    {fb.message}
                  </p>

                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-slate-500">Status: <strong className="capitalize">{fb.status}</strong></span>
                    {fb.changeOrderPaise > 0 && (
                      <span className="text-emerald-700 font-bold">
                        Approved Variation Value: {formatINR(fb.changeOrderPaise)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 10: CLIENT PORTAL PREVIEW (Exact Client View)
      ======================================================== */}
      {activeTab === 'preview_portal' && (
        <div className="space-y-6">
          {/* Owner Preview Banner */}
          <div className="bg-amber-500 text-[#07172C] p-4 rounded-2xl shadow-md border-2 border-amber-600 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2.5">
              <Eye className="w-5 h-5 text-[#07172C]" />
              <div>
                <strong className="block text-sm font-heading font-extrabold">
                  OWNER PREVIEW MODE — Previewing as Client: {project.clientId?.name}
                </strong>
                <span className="text-xs font-medium">
                  This view accurately displays the exact live publication state for {project.projectId}. Internal costs and private trade notes are hidden.
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('overview')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#10203A] text-white hover:bg-slate-900 transition-colors shrink-0"
            >
              Exit Preview
            </button>
          </div>

          {/* Exact Client Portal Render */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-subtle space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-brand-gold-600 bg-brand-gold-50 px-2.5 py-0.5 rounded border border-brand-gold-200">
                  {project.projectId}
                </span>
                <h2 className="text-2xl font-heading font-extrabold text-brand-navy-950 mt-1">
                  {project.title}
                </h2>
                <span className="text-xs text-slate-500">{project.siteAddress?.street}, {project.siteAddress?.city}</span>
              </div>
              <div className="bg-[#10203A] text-white p-4 rounded-xl text-center shrink-0 min-w-[130px]">
                <span className="text-[10px] text-[#D6A21D] font-bold uppercase tracking-wider block">Total Progress</span>
                <span className="text-3xl font-extrabold font-heading text-white">{project.progressPercent}%</span>
              </div>
            </div>

            {/* Milestones Flow in Client View */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Published Milestone Stages:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {milestones.filter((m) => m.isPublishedToClient).map((m) => (
                  <div key={m._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-slate-900">{m.code}. {m.title}</strong>
                      <span className="text-[10px] font-bold text-emerald-700">{m.progressPercent}%</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{m.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoices in Client View */}
            <div className="space-y-3 pt-3 border-t">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Published Invoices & Balances:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {invoices.filter((inv) => inv.status !== 'draft').map((inv) => (
                  <div key={inv._id} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center text-xs">
                    <div>
                      <strong className="block text-slate-900">{inv.invoiceNumber}</strong>
                      <span className="text-[11px] text-slate-500">Amount Due: {formatINR(inv.dueAmountPaise)}</span>
                    </div>
                    <span className="capitalize px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {inv.status?.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 11: AUDIT HISTORY
      ======================================================== */}
      {activeTab === 'audit_history' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4 text-xs">
          <h3 className="font-heading font-bold text-base text-brand-navy-950 border-b border-slate-100 pb-3">
            Project Event & Publication Audit Trail
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center">
              <div>
                <strong className="text-slate-900 block">Project Workspace Initialized</strong>
                <span className="text-slate-500">Unique Project ID {project.projectId} assigned. Client portal account automated.</span>
              </div>
              <span className="text-slate-400 text-[11px]">{new Date(project.createdAt).toLocaleDateString('en-IN')}</span>
            </div>

            {milestones.map((m) => (
              <div key={m._id} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center">
                <div>
                  <strong className="text-slate-900 block">Milestone Stage {m.code}: {m.title}</strong>
                  <span className="text-slate-500">Current Progress: {m.progressPercent}% • Weightage: {m.weightagePercent}%</span>
                </div>
                <span className="text-slate-400 text-[11px]">{new Date(m.updatedAt || m.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share Document Modal (WhatsApp & Mail) */}
      <ShareDocumentModal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareModalData(null);
        }}
        data={shareModalData}
      />

      {/* Edit Project Workspace Modal */}
      {showEditModal && project && (
        <EditProjectModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          project={project}
          onProjectUpdated={(updated) => {
            setProject(updated);
            showNotification(`Project "${updated.title}" workspace updated successfully.`);
            fetchProjectDetails();
          }}
        />
      )}
    </div>
  );
};
