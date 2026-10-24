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
} from 'lucide-react';
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
} from 'recharts';
import { api } from '../../services/api';
import { formatINR, toRupees } from '@shared/types';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.getDashboardStats();
        if (res.success) {
          setStats(res.stats);
          setRecentReports(res.recentSiteReports || []);
          setRecentExpenses(res.recentExpenses || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

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
        </div>
      </div>

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
    </div>
  );
};
