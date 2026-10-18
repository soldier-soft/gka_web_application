import React, { useEffect, useState } from 'react';
import {
  IndianRupee,
  Plus,
  FileDown,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatINR, toPaise } from '@shared/types';

export const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'expenses'>('invoices');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // New Payment state
  const [payProject, setPayProject] = useState('');
  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payAmountRupees, setPayAmountRupees] = useState<number>(200000);
  const [payMode, setPayMode] = useState('bank_transfer');
  const [payTxnRef, setPayTxnRef] = useState('HDFCR52026101899');
  const [payNotes, setPayNotes] = useState('NEFT transfer towards milestone RA bill');

  // New Expense state
  const [expProject, setExpProject] = useState('');
  const [expCategory, setExpCategory] = useState('materials');
  const [expDesc, setExpDesc] = useState('Purchase of 50 bags cement & fine river sand');
  const [expAmountRupees, setExpAmountRupees] = useState<number>(25000);
  const [expPaidTo, setExpPaidTo] = useState('Ultratech Cement Agency');
  const [expMethod, setExpMethod] = useState('upi');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [invRes, payRes, expRes, projRes] = await Promise.all([
        api.getInvoices(),
        api.getPayments(),
        api.getExpenses(),
        api.getProjects(),
      ]);

      if (invRes.success) setInvoices(invRes.invoices);
      if (payRes.success) setPayments(payRes.payments);
      if (expRes.success) setExpenses(expRes.expenses);
      if (projRes.success) {
        setProjects(projRes.projects);
        if (projRes.projects.length > 0) {
          setPayProject(projRes.projects[0]._id);
          setExpProject(projRes.projects[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const proj = projects.find((p) => p._id === payProject);
      const res = await api.recordPayment({
        projectId: payProject,
        clientId: proj?.clientId?._id || proj?.clientId,
        clientName: proj?.clientId?.name || 'Client',
        invoiceId: payInvoiceId || undefined,
        amountPaise: toPaise(payAmountRupees),
        paymentMode: payMode,
        transactionReference: payTxnRef,
        notes: payNotes,
      });

      if (res.success) {
        setShowPaymentModal(false);
        fetchFinanceData();
      }
    } catch (err: any) {
      alert(err.message || 'Error recording payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.createExpense({
        projectId: expProject,
        category: expCategory,
        description: expDesc,
        amountPaise: toPaise(expAmountRupees),
        paidTo: expPaidTo,
        paymentMethod: expMethod,
      });

      if (res.success) {
        setShowExpenseModal(false);
        fetchFinanceData();
      }
    } catch (err: any) {
      alert(err.message || 'Error recording expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Financial aggregates
  const totalInvoicedPaise = invoices.reduce((acc, i) => acc + (i.totalAmountPaise || 0), 0);
  const totalCollectedPaise = payments.reduce((acc, p) => acc + (p.amountPaise || 0), 0);
  const totalExpensesPaise = expenses.reduce((acc, e) => acc + (e.amountPaise || 0), 0);
  const totalReceivablesPaise = Math.max(0, totalInvoicedPaise - totalCollectedPaise);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-brand-navy-950">
            Financial Ledger & Profitability
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Exact integer paise accounting for customer tax invoices, collections, cost expenses, and realized margins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Record Cost Expense</span>
          </button>

          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Record Client Receipt</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Invoiced to Date</span>
          <p className="text-xl font-bold font-heading text-brand-navy-950 font-mono">
            {formatINR(totalInvoicedPaise)}
          </p>
          <span className="text-[10px] text-slate-400">All issued tax invoices (inc. 18% GST)</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Customer Collections in Bank</span>
          <p className="text-xl font-bold font-heading text-emerald-700 font-mono">
            {formatINR(totalCollectedPaise)}
          </p>
          <span className="text-[10px] text-slate-400">Verified cash / NEFT received</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Outstanding Receivables</span>
          <p className="text-xl font-bold font-heading text-rose-600 font-mono">
            {formatINR(totalReceivablesPaise)}
          </p>
          <span className="text-[10px] text-slate-400">Pending customer milestone clearance</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Recorded Expenses</span>
          <p className="text-xl font-bold font-heading text-slate-800 font-mono">
            {formatINR(totalExpensesPaise)}
          </p>
          <span className="text-[10px] text-slate-400">Materials, labour, machinery & overhead</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        {[
          { id: 'invoices', label: 'Customer Tax Invoices' },
          { id: 'payments', label: 'Client Receipts (Cash In)' },
          { id: 'expenses', label: 'Project Expenses (Cost Out)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 transition-colors relative ${
              activeTab === tab.id
                ? 'text-brand-navy-950 border-b-2 border-brand-navy-900'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Invoices List */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Client & Project</th>
                  <th className="py-3.5 px-4 font-mono">Total (Inc. GST)</th>
                  <th className="py-3.5 px-4 font-mono text-emerald-700">Paid Amount</th>
                  <th className="py-3.5 px-4 font-mono text-rose-600">Balance Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">PDF Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-navy-950">
                      {inv.invoiceNumber}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Issued: {new Date(inv.issueDate).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 block">{inv.projectTitle}</strong>
                      <span className="text-slate-500 text-[11px]">{inv.clientName}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sm">
                      {formatINR(inv.totalAmountPaise)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">
                      {formatINR(inv.paidAmountPaise || 0)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-600">
                      {formatINR(inv.dueAmountPaise || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'partially_paid'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={`/api/v1/finance/invoices/${inv._id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800"
                      >
                        <FileDown className="w-3.5 h-3.5 text-brand-navy-900" />
                        <span>Tax Invoice PDF</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments List */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Client & Project</th>
                  <th className="py-3.5 px-4">Payment Mode & Ref</th>
                  <th className="py-3.5 px-4 text-right">Collected Amount</th>
                  <th className="py-3.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-navy-950">
                      {p.paymentNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 block">{p.clientName}</strong>
                      <span className="text-slate-500 text-[11px]">{p.projectId?.title || 'Project'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize font-semibold text-slate-800 block">
                        {p.paymentMode?.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">{p.transactionReference}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-emerald-700">
                      {formatINR(p.amountPaise)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses List */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Paid To</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-3.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-brand-navy-950">
                      {e.description}
                    </td>
                    <td className="py-3.5 px-4 capitalize font-semibold text-slate-600">
                      {e.category}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {e.paidTo}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {e.projectId?.title || 'General'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-slate-900">
                      {formatINR(e.amountPaise)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(e.date).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-brand-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h3 className="text-base font-heading font-bold text-brand-navy-950">
              Record Customer Collection / Payment Receipt
            </h3>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Site *</label>
                <select
                  value={payProject}
                  onChange={(e) => setPayProject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.projectId} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount Collected (₹) *</label>
                <input
                  type="number"
                  required
                  value={payAmountRupees}
                  onChange={(e) => setPayAmountRupees(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-right text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="bank_transfer">NEFT / RTGS</option>
                    <option value="upi">UPI / GPay</option>
                    <option value="cheque">Bank Cheque</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reference / UTR # *</label>
                  <input
                    type="text"
                    required
                    value={payTxnRef}
                    onChange={(e) => setPayTxnRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow"
                >
                  {isSubmitting ? 'Recording...' : 'Save Collection Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-brand-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h3 className="text-base font-heading font-bold text-brand-navy-950">
              Record Project Cost Expense
            </h3>

            <form onSubmit={handleRecordExpense} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Site *</label>
                <select
                  value={expProject}
                  onChange={(e) => setExpProject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.projectId} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="materials">Materials</option>
                    <option value="labour">Labour & Wages</option>
                    <option value="machinery">Machinery & Scaffolding</option>
                    <option value="subcontractor">Subcontractor</option>
                    <option value="fuel_transport">Fuel & Transport</option>
                    <option value="site_supplies">Site Supplies</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={expAmountRupees}
                    onChange={(e) => setExpAmountRupees(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-right text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Paid To / Vendor *</label>
                <input
                  type="text"
                  required
                  value={expPaidTo}
                  onChange={(e) => setExpPaidTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description of Work / Purchase *</label>
                <input
                  type="text"
                  required
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 shadow"
                >
                  {isSubmitting ? 'Recording...' : 'Update Actual Cost'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
