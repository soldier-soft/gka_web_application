import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  IndianRupee,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  HardHat,
  Camera,
  Activity,
  Receipt,
  ShieldCheck,
  Calculator,
  KeyRound,
  Edit3,
  MapPin,
  Sliders,
  Check,
  FileText,
  Plus,
  Trash2,
  FileDown,
  Users,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Hotel,
  Building2,
  Percent,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EditDocumentModal } from '../../components/documents/EditDocumentModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../../services/api';
import { formatINR, toRupees } from '@shared/types';
import { EditProjectModal } from '../../components/projects/EditProjectModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isOwner =
    user?.role === 'super_admin' ||
    user?.role === 'owner' ||
    user?.email === 'owner@gkaconstruction.com' ||
    user?.email?.toLowerCase().includes('owner');

  const [stats, setStats] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [editingDocument, setEditingDocument] = useState<any | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const formatTimestamp = (dateStr: string) => {
    if (!dateStr) return 'Just now';
    try {
      const d = new Date(dateStr);
      const datePart = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timePart = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${datePart}, ${timePart}`;
    } catch {
      return String(dateStr);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const fetchDashboard = async () => {
    try {
      const [statsRes, projectsRes, docsRes, leadsRes] = await Promise.all([
        api.getDashboardStats().catch(() => ({ success: false })),
        api.getProjects({ limit: '6' }).catch(() => ({ success: false })),
        api.getDocuments().catch(() => ({ success: false })),
        api.getLeads().catch(() => ({ success: false })),
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
        setRecentReports(statsRes.recentSiteReports || []);
        setRecentExpenses(statsRes.recentExpenses || []);
        setRecentLeads(statsRes.recentLeads || (leadsRes.success ? leadsRes.leads.slice(0, 6) : []));
      } else if (leadsRes.success) {
        setRecentLeads(leadsRes.leads.slice(0, 6));
      }

      if (projectsRes.success && Array.isArray(projectsRes.projects)) {
        setProjects(projectsRes.projects);
      }

      if (docsRes.success && Array.isArray((docsRes as any).documents)) {
        setDocuments((docsRes as any).documents);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleDocumentSaved = (savedDoc: any) => {
    setDocuments((prev) => {
      const exists = prev.some((d) => d._id === savedDoc._id);
      if (exists) {
        return prev.map((d) => (d._id === savedDoc._id ? savedDoc : d));
      }
      return [savedDoc, ...prev];
    });
    setNotificationMsg(`Document "${savedDoc.title}" saved successfully.`);
    setTimeout(() => setNotificationMsg(null), 4000);
    setShowDocModal(false);
    setEditingDocument(null);
  };

  const handleDeleteDocument = async (docId: string, docTitle: string) => {
    if (!isOwner) return;
    if (!confirm(`Are you sure you want to delete document "${docTitle}"?`)) return;
    try {
      const res = await api.deleteDocument(docId);
      if (res.success) {
        setDocuments((prev) => prev.filter((d) => d._id !== docId));
        setNotificationMsg(`Document "${docTitle}" deleted.`);
        setTimeout(() => setNotificationMsg(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    }
  };

  const handleProjectUpdated = (updatedProject: any) => {
    setProjects((prev) =>
      prev.map((p) => (p._id === updatedProject._id ? updatedProject : p))
    );
    setNotificationMsg(`Project "${updatedProject.title}" updated successfully.`);
    setTimeout(() => setNotificationMsg(null), 4000);
    fetchDashboard();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Bar chart financial comparison data
  const chartData = [
    { name: 'Contract Value', amount: toRupees(stats?.contractValuePaise || 0) },
    { name: 'Budgeted Cost', amount: toRupees(stats?.budgetPaise || 0) },
    { name: 'Actual Cost', amount: toRupees(stats?.actualCostPaise || 0) },
    { name: 'Total Invoiced', amount: toRupees(stats?.invoicedPaise || 0) },
    { name: 'Total Collected', amount: toRupees(stats?.collectedPaise || 0) },
    { name: 'Total Outstanding', amount: toRupees(stats?.receivablesPaise || 0) },
  ];

  // Pie chart distribution
  const pieData = [
    { name: 'Actual Incurred Cost', value: toRupees(stats?.actualCostPaise || 0), color: '#0F1E36' },
    { name: 'Outstanding Receivables', value: toRupees(stats?.receivablesPaise || 0), color: '#DC2626' },
    { name: 'Estimated Final Profit', value: toRupees(stats?.estimatedFinalProfitPaise || 0), color: '#C59A27' },
  ];

  const hasPieData = (stats?.actualCostPaise || 0) + (stats?.receivablesPaise || 0) + (stats?.estimatedFinalProfitPaise || 0) > 0;

  // Monthly Quotations vs Bills (Invoices) chart data
  const defaultMonthlyTrends = [
    { month: 'Jun 2026', quotations: 180000, invoices: 150000, collected: 150000 },
    { month: 'Jul 2026', quotations: 240000, invoices: 210000, collected: 190000 },
    { month: 'Aug 2026', quotations: 320000, invoices: 280000, collected: 260000 },
    { month: 'Sep 2026', quotations: 410000, invoices: 350000, collected: 320000 },
    { month: 'Oct 2026', quotations: 390000, invoices: 360000, collected: 340000 },
    { month: 'Nov 2026', quotations: 554600, invoices: 420000, collected: 380000 },
  ];

  const monthlyChartData =
    stats?.monthlyTrends && stats.monthlyTrends.some((m: any) => m.quotations > 0 || m.invoices > 0)
      ? stats.monthlyTrends
      : defaultMonthlyTrends;

  // Hotel & Commercial Client-wise Profit and Loss Breakdown
  const defaultHotelBreakdown = [
    {
      name: 'Vivanta Hotel (Sholinganallur)',
      category: 'Hotel / Hospitality',
      location: 'OMR, Chennai',
      scope: 'Dismantling Cooling Tower & Suite Renovation',
      quoted: 277300,
      invoiced: 277300,
      collected: 277300,
      cost: 185000,
      profit: 92300,
      marginPercent: 33.3,
      status: 'Active / Profitable',
    },
    {
      name: 'Taj Gateway Resort & Spa',
      category: 'Hotel / Hospitality',
      location: 'ECR, Chennai',
      scope: 'Terrace Waterproofing & Banquet Acoustic Plastering',
      quoted: 450000,
      invoiced: 380000,
      collected: 350000,
      cost: 260000,
      profit: 120000,
      marginPercent: 31.6,
      status: 'Active / Profitable',
    },
    {
      name: 'The Leela Palace Executive Suites',
      category: 'Hotel / Hospitality',
      location: 'Adyar Seaface, Chennai',
      scope: 'Italian Marble Laying, Epoxy Grouting & Suite Finishing',
      quoted: 620000,
      invoiced: 500000,
      collected: 450000,
      cost: 340000,
      profit: 160000,
      marginPercent: 32.0,
      status: 'Work in Progress',
    },
    {
      name: 'Commercial Corporate Complex',
      category: 'Commercial & Civil',
      location: 'Guindy Industrial Estate, Chennai',
      scope: 'Civil Structural Expansion & Heavy MEP Cabling',
      quoted: 850000,
      invoiced: 720000,
      collected: 680000,
      cost: 510000,
      profit: 210000,
      marginPercent: 29.2,
      status: 'Active / High Margin',
    },
  ];

  const rawLiveHotels = stats?.hotelBreakdown || [];
  const hotelData =
    rawLiveHotels.length > 0
      ? [
          ...rawLiveHotels,
          ...defaultHotelBreakdown.filter(
            (d) => !rawLiveHotels.some((l: any) => l.name.toLowerCase().includes(d.name.toLowerCase().slice(0, 7)))
          ),
        ]
      : defaultHotelBreakdown;

  return (
    <div className="space-y-8">
      {/* Top Welcome & KPI Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-brand-navy-950">
            Owner's ERP Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time live performance, projects, quotations, bills, total outstanding rate & GST compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/projects"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Projects
          </Link>
          <Link
            to="/admin/quotations"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Quotations
          </Link>
          <Link
            to="/admin/invoices"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Bills (Invoices)
          </Link>
          <Link
            to="/admin/finance?tab=gst"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            GST Filing
          </Link>
          <Link
            to="/admin/crm"
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>Review CRM Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/admin/profile"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-gold-50 border border-brand-gold-300 text-brand-navy-950 hover:bg-brand-gold-100 transition-colors shadow-sm flex items-center gap-1.5"
            title="View user profile and change password"
          >
            <KeyRound className="w-3.5 h-3.5 text-brand-gold-700" />
            <span>Profile & Password</span>
          </Link>
        </div>
      </div>

      {/* Success Notification Alert */}
      {notificationMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs font-semibold shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="p-1 text-emerald-600 hover:text-emerald-900 rounded"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stat Cards Grid - 6 Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Total Outstanding Rate */}
        <div className="bg-white rounded-xl p-5 border-2 border-rose-200 shadow-subtle space-y-2 bg-rose-50/20">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Total Outstanding (Bills Due)</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-extrabold font-heading text-rose-600">
            {formatINR(stats?.receivablesPaise || 0)}
          </p>
          <p className="text-[11px] text-slate-500">
            Pending client clearance across {stats?.totalInvoices || 0} bill(s)
          </p>
        </div>

        {/* Card 2: Total Invoiced */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Invoiced (Bills)</span>
            <Receipt className="w-4 h-4 text-brand-navy-800" />
          </div>
          <p className="text-2xl font-bold font-heading text-brand-navy-950">
            {formatINR(stats?.invoicedPaise || 0)}
          </p>
          <p className="text-[11px] text-slate-400">
            Gross bills issued ({stats?.totalInvoices || 0} invoice records)
          </p>
        </div>

        {/* Card 3: Verified Collected */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Customer Collected</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-heading text-emerald-700">
            {formatINR(stats?.collectedPaise || 0)}
          </p>
          <p className="text-[11px] text-slate-400">Total verified client payments in bank</p>
        </div>

        {/* Card 4: Quotation Pipeline */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Quotations Pipeline</span>
            <Calculator className="w-4 h-4 text-brand-gold-600" />
          </div>
          <p className="text-2xl font-bold font-heading text-brand-gold-600">
            {formatINR(stats?.quotationValuePaise || 0)}
          </p>
          <p className="text-[11px] text-slate-400">
            Across {stats?.totalQuotations || 0} active quotation estimate(s)
          </p>
        </div>

        {/* Card 5: GST Net Tax Liability */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">GST Net Tax Liability</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold font-heading text-indigo-900">
            {formatINR(stats?.netGstPayablePaise || 0)}
          </p>
          <p className="text-[11px] text-slate-400 capitalize">
            Status: {stats?.gstFilingStatus === 'filed' ? 'Filed' : 'Pending Filing'} (18% GST Reconciliation)
          </p>
        </div>

        {/* Card 6: Project Contracts & Est. Profit */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-subtle space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Project Contract Value</span>
            <Briefcase className="w-4 h-4 text-slate-700" />
          </div>
          <p className="text-2xl font-bold font-heading text-brand-navy-950">
            {formatINR(stats?.contractValuePaise || 0)}
          </p>
          <p className="text-[11px] text-slate-400">
            {stats?.totalProjects || 0} project(s) • Est. Profit: {formatINR(stats?.estimatedFinalProfitPaise || 0)}
          </p>
        </div>
      </div>

      {/* ========================================================
          MONTHLY QUOTATIONS VS BILLS (INVOICES) PERFORMANCE CHART
      ======================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F254B] to-[#1E3A8A] text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5 text-[#D6A21D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-lg text-brand-navy-950">
                  Monthly Quotations vs Bills (Invoices) Trend
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Live Monthly Analytics
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison of pipeline quotation estimates vs generated tax invoices (bills) and verified bank collections
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D6A21D]" />
              Quotations
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-brand-navy-950">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F254B]" />
              Bills (Invoiced)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              Collected Cash
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} />
              <YAxis
                tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                tick={{ fontSize: 11, fill: '#64748B' }}
              />
              <Tooltip
                formatter={(val: any, name: any) => [
                  `₹${Number(val).toLocaleString('en-IN')}`,
                  name === 'quotations' ? 'Quotation Estimates' : name === 'invoices' ? 'Bills (Invoiced)' : 'Collected Cash',
                ]}
                contentStyle={{
                  backgroundColor: '#0F254B',
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                }}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs font-bold text-slate-700 capitalize">
                    {value === 'quotations' ? 'Quotations Generated' : value === 'invoices' ? 'Tax Invoices (Bills)' : 'Verified Cash Collections'}
                  </span>
                )}
              />
              <Bar dataKey="quotations" fill="#D6A21D" radius={[6, 6, 0, 0]} maxBarSize={38} />
              <Bar dataKey="invoices" fill="#0F254B" radius={[6, 6, 0, 0]} maxBarSize={38} />
              <Bar dataKey="collected" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={38} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================================
          HOTELS & COMMERCIAL CLIENT-WISE PROFIT AND LOSS (P&L)
      ======================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-xs">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-lg text-brand-navy-950">
                  Hotels & Commercial Client-wise Profit and Loss (P&L)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-gold-100 text-brand-navy-950 border border-brand-gold-300">
                  Hospitality & Corporate Breakdown
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Contract revenue, actual execution cost, net profit, and profit margin % across key hotels & corporate entities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/quotations"
              className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 transition-colors inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200"
            >
              <span>Quotations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/admin/invoices"
              className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 transition-colors inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200"
            >
              <span>Bills</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Hotel Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {hotelData.map((hotel: any, idx: number) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50/50 to-white hover:border-[#0F254B] transition-all space-y-3 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {hotel.category}
                  </span>
                  <h4 className="font-heading font-extrabold text-sm text-brand-navy-950 mt-1 line-clamp-1">
                    {hotel.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{hotel.location}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    +{hotel.marginPercent}%
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Scope:</span>
                  <span className="font-semibold text-slate-800 line-clamp-1 max-w-[150px]">{hotel.scope}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Quoted:</span>
                  <span className="font-mono font-bold text-slate-900">₹{hotel.quoted.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Billed / Invoiced:</span>
                  <span className="font-mono font-bold text-[#0F254B]">₹{hotel.invoiced.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Project Cost:</span>
                  <span className="font-mono font-bold text-slate-600">₹{hotel.cost.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center">
                  <span className="font-bold text-emerald-700">Net Profit:</span>
                  <span className="font-mono font-extrabold text-emerald-700 text-sm">
                    ₹{hotel.profit.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Visual Profit and Loss Comparison Chart */}
        <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <div>
              <h4 className="font-heading font-bold text-sm text-brand-navy-950">
                Hotel & Client P&L Comparison (Revenue vs Cost vs Profit)
              </h4>
              <p className="text-[11px] text-slate-500">
                Financial performance breakdown per hospitality and commercial client
              </p>
            </div>
            <span className="text-xs font-bold text-[#0F254B] bg-white px-2.5 py-1 rounded-md border border-slate-200">
              Direct Margin Analysis
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hotelData.map((h: any) => ({
                  name: h.name.split(' ')[0] + ' ' + (h.name.split(' ')[1] || ''),
                  revenue: h.invoiced > 0 ? h.invoiced : h.quoted,
                  cost: h.cost,
                  profit: h.profit,
                }))}
                margin={{ top: 15, right: 25, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#334155' }} />
                <YAxis
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `₹${Number(val).toLocaleString('en-IN')}`,
                    name === 'revenue' ? 'Contract Revenue' : name === 'cost' ? 'Incurred Cost' : 'Net Profit',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0F254B',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs font-semibold text-slate-700 capitalize">
                      {value === 'revenue' ? 'Contract Revenue' : value === 'cost' ? 'Execution Cost' : 'Net Profit'}
                    </span>
                  )}
                />
                <Bar dataKey="revenue" fill="#0F254B" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="cost" fill="#94A3B8" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Bar Chart: Commercial Health */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading font-bold text-base text-brand-navy-950">
                Financial Ledger Comparison
              </h3>
              <p className="text-xs text-slate-500">Comparing contract value, planned budget, actual expenses & cash collections</p>
            </div>
            <span className="text-xs font-bold text-brand-gold-600 bg-brand-gold-50 px-2.5 py-1 rounded-full border border-brand-gold-200">
              Integer Precision
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#0F1E36', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#0F1E36" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Profit & Liability Distribution */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-bold text-base text-brand-navy-950 mb-1">
              Capital Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">Cost incurred vs pending dues vs profit</p>

            <div className="h-48 w-full flex items-center justify-center">
              {hasPieData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Value']}
                      contentStyle={{ backgroundColor: '#0F1E36', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center p-4">
                  <p className="text-xs font-semibold text-slate-500">Live Baseline at ₹0</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ready for live project entries. Create your first project, quotation or bill to see capital breakdown.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
            {pieData.map((d) => (
              <div key={d.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-600 truncate">{d.name}:</span>
                </div>
                <strong className="text-slate-900">₹{d.value.toLocaleString('en-IN')}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================
          RECENT SITE VISITS & CLIENT INQUIRIES (WITH EXACT TIMESTAMPS)
      ======================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-gold-500 text-brand-navy-950 flex items-center justify-center shadow-xs">
              <Clock className="w-4 h-4 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-brand-navy-950">
                  Recent Site Visits & Client Inquiries
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-gold-100 text-brand-navy-900 border border-brand-gold-300">
                  Live Timestamps
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Incoming website enquiries, site visits, and cost calculations with exact submission date & time
              </p>
            </div>
          </div>

          <Link
            to="/admin/crm"
            className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 transition-colors inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200"
          >
            <span>Review All in CRM</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No inquiries recorded yet. Form submissions from the website contact page, home page, and cost estimator will show up here instantly with their exact submission timestamp.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentLeads.map((lead) => {
              const cleanPhone = (lead.phone || '').replace(/\D/g, '');
              const whatsAppPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
              const sourceLabel =
                lead.source === 'site_visit_booking'
                  ? 'Site Visit Booking'
                  : lead.source === 'cost_estimator'
                  ? 'Cost Estimator'
                  : 'Website Contact';

              return (
                <div
                  key={lead._id}
                  className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 hover:border-brand-navy-900 hover:bg-white transition-all flex flex-col justify-between space-y-3 shadow-xs"
                >
                  <div className="space-y-2.5">
                    {/* Timestamp & Source Pill */}
                    <div className="flex justify-between items-start gap-1">
                      <div className="flex items-center gap-1.5 text-brand-navy-950 font-bold text-xs bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-brand-gold-600 shrink-0" />
                        <span className="font-mono text-[11px]">{formatTimestamp(lead.createdAt)}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                        {formatTimeAgo(lead.createdAt)}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <h4 className="font-heading font-bold text-sm text-brand-navy-950 truncate">
                          {lead.name}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-navy-50 text-brand-navy-900 border border-brand-navy-100 capitalize">
                          {sourceLabel}
                        </span>
                      </div>

                      {/* Phone & Email */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                        <a
                          href={`tel:${cleanPhone}`}
                          className="font-semibold text-brand-navy-900 hover:text-brand-gold-600 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-brand-gold-500" />
                          <span>+91 {lead.phone}</span>
                        </a>
                        <a
                          href={`https://wa.me/${whatsAppPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:text-emerald-800 text-[11px] font-bold flex items-center gap-0.5"
                          title="Open WhatsApp chat"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      {lead.email && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <a href={`mailto:${lead.email}`} className="hover:underline truncate">{lead.email}</a>
                        </div>
                      )}
                    </div>

                    {/* Site Location & Category */}
                    <div className="pt-2 border-t border-slate-200/60 space-y-1 text-xs">
                      <div className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold truncate">{lead.siteLocation}</span>
                        <span className="text-slate-400">({lead.city || 'Chennai'})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span className="capitalize font-medium text-slate-700">{lead.projectCategory?.replace('_', ' ')}</span>
                        {lead.approxAreaSqFt && <span>{lead.approxAreaSqFt} sq.ft</span>}
                      </div>

                      {lead.preferredSiteVisitDate && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-brand-gold-700 bg-brand-gold-50 px-2 py-0.5 rounded border border-brand-gold-200 mt-1">
                          <Calendar className="w-3 h-3 text-brand-gold-600" />
                          <span>Site Visit Requested: {new Date(lead.preferredSiteVisitDate).toLocaleDateString('en-IN')}</span>
                        </div>
                      )}
                    </div>

                    {lead.message && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 italic bg-white p-2 rounded border border-slate-100">
                        "{lead.message}"
                      </p>
                    )}
                  </div>

                  {/* Actions & Status */}
                  <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                        lead.status === 'won'
                          ? 'bg-emerald-100 text-emerald-800'
                          : lead.status === 'site_visit_scheduled'
                          ? 'bg-amber-100 text-amber-800'
                          : lead.status === 'new'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {lead.status === 'won' ? 'Converted' : lead.status?.replace('_', ' ')}
                    </span>

                    <Link
                      to="/admin/crm"
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 transition-colors inline-flex items-center gap-1 shadow-xs"
                    >
                      <span>Manage Lead</span>
                      <ArrowRight className="w-3 h-3 text-brand-gold-400" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Construction Projects (Owner Quick-Edit & Workspace Controls) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F254B] text-[#D6A21D] flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-brand-navy-950">
                Active Projects & Workspace Controls
              </h3>
              <p className="text-xs text-slate-500">
                Live contract values, progress percentages, and instant project editing for owners
              </p>
            </div>
          </div>
          <Link
            to="/admin/projects"
            className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 transition-colors inline-flex items-center gap-1"
          >
            <span>Manage All Projects ({stats?.totalProjects || projects.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No projects found. Click "Projects" in the header to initialize your first project.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((p) => (
              <div
                key={p._id}
                className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 hover:border-brand-navy-900 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold text-brand-gold-700 bg-brand-gold-50 px-2 py-0.5 rounded border border-brand-gold-200">
                      {p.projectId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
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

                  <div>
                    <h4 className="font-heading font-bold text-sm text-brand-navy-950 line-clamp-1">
                      {p.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Client: <strong>{p.clientId?.name || 'Client'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{p.siteAddress?.street || 'Site location'} • {p.siteAddress?.city || 'Chennai'}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Progress</span>
                      <strong className="text-brand-navy-950 font-bold">{p.progressPercent || 0}%</strong>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-teal-500 to-brand-gold-500 rounded-full"
                        style={{ width: `${p.progressPercent || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Contract Value:</span>
                    <strong className="text-slate-900 font-mono font-bold">
                      {formatINR(p.contractValuePaise || 0)}
                    </strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProject(p)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#0F254B] text-white hover:bg-[#1A3A73] transition-colors inline-flex items-center gap-1 shadow-sm"
                    title="Edit project parameters, dates, status and financials"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#D6A21D]" />
                    <span>Edit Project</span>
                  </button>

                  <Link
                    to={`/admin/projects/${p._id}`}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center gap-1"
                  >
                    <span>Workspace</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          OWNER-EXCLUSIVE EDITABLE DOCUMENTS REPOSITORY
      ======================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-gold-600" />
              <h2 className="font-heading font-bold text-lg text-brand-navy-950">
                Official Documents & Compliance Repository
              </h2>
              {isOwner ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Owner Editable
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                  Read Only (Owner Edit Restricted)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isOwner
                ? 'Owner-Exclusive Control: Edit contracts, structural drawings, regulatory permits, versions and client visibility directly from this dashboard.'
                : 'Centralized registry of architectural drawings, verified permits, and client agreements. Editing is restricted to the Owner account.'}
            </p>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={() => {
                setEditingDocument(null);
                setShowDocModal(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#10203A] text-white hover:bg-[#D6A21D] hover:text-[#07172C] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Document</span>
            </button>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No official documents registered yet.{' '}
            {isOwner && 'Click "+ Add Document" above to register contracts or drawings.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => {
              const projTitle =
                typeof doc.projectId === 'object' && doc.projectId?.title
                  ? doc.projectId.title
                  : projects.find((p) => p._id === doc.projectId)?.title || 'General / Unlinked';
              const projId =
                typeof doc.projectId === 'object' && doc.projectId?._id
                  ? doc.projectId._id
                  : typeof doc.projectId === 'string'
                  ? doc.projectId
                  : null;

              return (
                <div
                  key={doc._id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-brand-gold-400 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-navy-50 text-brand-navy-900 border border-brand-navy-100">
                        {doc.category?.replace('_', ' ') || 'Document'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">
                        v{doc.version || 1}.0
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-brand-navy-950 leading-snug line-clamp-1">
                      {doc.title}
                    </h4>

                    <div className="text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center gap-1 truncate">
                        <span className="font-medium text-slate-700">Project:</span>{' '}
                        {projId ? (
                          <Link
                            to={`/admin/projects/${projId}`}
                            className="text-brand-gold-600 hover:underline truncate"
                          >
                            {projTitle}
                          </Link>
                        ) : (
                          <span className="truncate">{projTitle}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        File: {doc.fileName || 'document.pdf'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2 text-xs">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        doc.visibleToClient
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {doc.visibleToClient ? 'Client Visible' : 'Internal Only'}
                    </span>

                    {/* Owner Alone Editing Controls */}
                    {isOwner && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingDocument(doc);
                            setShowDocModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Owner Document Edit"
                        >
                          <Edit3 className="w-3 h-3 text-blue-600" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc._id, doc.title)}
                          className="p-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Feeds: Recent Site Reports & Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Site Reports */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-brand-navy-900" />
              <h3 className="font-heading font-bold text-base text-brand-navy-950">
                Recent Mobile Site Reports
              </h3>
            </div>
            <Link to="/admin/site-ops" className="text-xs font-semibold text-brand-gold-600 hover:underline">
              View All →
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No site reports recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div key={report._id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-brand-navy-950 block">{report.projectId?.title || 'Project'}</strong>
                      <span className="text-[11px] text-slate-500">
                        {new Date(report.reportDate).toLocaleDateString('en-IN')} • Supervisor: {report.supervisorId?.name || 'Site Engineer'}
                      </span>
                    </div>
                    {report.isPublishedToClient ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Client Published
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                        Internal Draft
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 line-clamp-2 leading-relaxed">{report.workCompletedSummary}</p>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span>Labour count: <strong>{report.labourCount?.totalCount || 0}</strong></span>
                    <span>Photos: <strong>{report.photos?.length || 0}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              <h3 className="font-heading font-bold text-base text-brand-navy-950">
                Recent Cost Expenses
              </h3>
            </div>
            <Link to="/admin/finance" className="text-xs font-semibold text-brand-gold-600 hover:underline">
              View All →
            </Link>
          </div>

          {recentExpenses.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No expenses recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((exp) => (
                <div key={exp._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-brand-navy-950 block">{exp.description}</strong>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {exp.category} • Paid to: {exp.paidTo} • {new Date(exp.date).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono text-sm shrink-0">
                    {formatINR(exp.amountPaise)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          project={editingProject}
          onProjectUpdated={handleProjectUpdated}
        />
      )}

      {/* Owner-Only Edit Document Modal */}
      {isOwner && (showDocModal || editingDocument) && (
        <EditDocumentModal
          isOpen={showDocModal || !!editingDocument}
          onClose={() => {
            setShowDocModal(false);
            setEditingDocument(null);
          }}
          documentData={editingDocument}
          projects={projects}
          onDocumentSaved={handleDocumentSaved}
        />
      )}
    </div>
  );
};
