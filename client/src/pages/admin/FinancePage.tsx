import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
  ShieldCheck,
  Clock,
  XCircle,
  ExternalLink,
  Edit3,
  History,
  Building2,
  Check,
  X,
  FileCheck,
  Send,
  Share2,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatINR, toPaise, toRupees } from '@shared/types';
import { GKA_COMPANY } from '@shared/constants';
import { ShareDocumentModal } from '../../components/common/ShareDocumentModal';

export const FinancePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') as 'invoices' | 'payments' | 'expenses' | 'gst' | null;

  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'expenses' | 'gst'>(
    initialTab === 'gst' ? 'gst' : initialTab === 'payments' ? 'payments' : initialTab === 'expenses' ? 'expenses' : 'invoices'
  );

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareInvoice, setShareInvoice] = useState<any>(null);

  const handleTabChange = (tab: 'invoices' | 'payments' | 'expenses' | 'gst') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [taxRecords, setTaxRecords] = useState<any[]>([]);
  const [selectedTaxRecord, setSelectedTaxRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showItcModal, setShowItcModal] = useState(false);
  const [showTaxPayModal, setShowTaxPayModal] = useState(false);
  const [showTaxFilingModal, setShowTaxFilingModal] = useState(false);

  // New Payment state
  const [payProject, setPayProject] = useState('');
  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payAmountRupees, setPayAmountRupees] = useState<number>(0);
  const [payMode, setPayMode] = useState('bank_transfer');
  const [payTxnRef, setPayTxnRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // New Expense state
  const [expProject, setExpProject] = useState('');
  const [expCategory, setExpCategory] = useState('materials');
  const [expDesc, setExpDesc] = useState('');
  const [expAmountRupees, setExpAmountRupees] = useState<number>(0);
  const [expPaidTo, setExpPaidTo] = useState('');
  const [expMethod, setExpMethod] = useState('upi');

  // ITC Adjustment State
  const [itcRupees, setItcRupees] = useState<number>(0);
  const [itcReason, setItcReason] = useState<string>('');

  // Tax Payment State
  const [taxPayChallan, setTaxPayChallan] = useState<string>('');
  const [taxPayBsr, setTaxPayBsr] = useState<string>('0233302');
  const [taxPayRupees, setTaxPayRupees] = useState<number>(0);

  // Tax Filing State
  const [taxFilingArn, setTaxFilingArn] = useState<string>('');
  const [taxFilingNotes, setTaxFilingNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const [invRes, payRes, expRes, projRes, taxRes] = await Promise.all([
        api.getInvoices(),
        api.getPayments(),
        api.getExpenses(),
        api.getProjects(),
        api.getTaxReconciliations().catch(() => ({ success: false, records: [] })),
      ]);

      if (invRes.success) setInvoices(invRes.invoices);
      if (payRes.success) setPayments(payRes.payments);
      if (expRes.success) setExpenses(expRes.expenses);
      if (taxRes.success && taxRes.records?.length > 0) {
        setTaxRecords(taxRes.records);
        setSelectedTaxRecord(taxRes.records[0]);
        setItcRupees(Math.round((taxRes.records[0].eligibleItcPaise || 0) / 100));
        setTaxPayRupees(Math.round((taxRes.records[0].netTaxPayablePaise || 0) / 100));
      }
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
        verificationStatus: 'verified', // Directly recorded by admin is verified
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

  const handleVerifyPaymentAction = async (id: string) => {
    if (!window.confirm('Confirm credit verification against Federal Bank statement (A/c: 23330200002362)? This will update project revenue and invoice balances.')) {
      return;
    }
    try {
      const res = await api.verifyPayment(id);
      if (res.success) {
        alert('Payment verified successfully. Project revenue ledger updated.');
        fetchFinanceData();
      }
    } catch (err: any) {
      alert(err.message || 'Error verifying payment');
    }
  };

  const handleRejectPaymentAction = async (id: string) => {
    const reason = window.prompt('Enter reason for rejecting payment claim (e.g. UTR not found in Federal Bank statement):');
    if (!reason) return;
    try {
      const res = await api.rejectPayment(id, reason);
      if (res.success) {
        alert('Payment claim marked as rejected.');
        fetchFinanceData();
      }
    } catch (err: any) {
      alert(err.message || 'Error rejecting payment');
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

  const handleUpdateEligibleItc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaxRecord) return;
    if (!itcReason.trim()) {
      alert('A compliance justification reason is required for any manual ITC adjustment.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.updateEligibleItc(selectedTaxRecord._id, {
        eligibleItcPaise: toPaise(itcRupees),
        reason: itcReason,
      });
      if (res.success) {
        setShowItcModal(false);
        setItcReason('');
        fetchFinanceData();
      }
    } catch (err: any) {
      alert(err.message || 'Error adjusting ITC');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordTaxPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaxRecord) return;
    setIsSubmitting(true);
    try {
      const res = await api.recordTaxPayment(selectedTaxRecord._id, {
        taxPaymentReference: taxPayChallan,
        bankChallanBsrcode: taxPayBsr,
        actualPaidAmountPaise: toPaise(taxPayRupees),
      });
      if (res.success) {
        setShowTaxPayModal(false);
        fetchFinanceData();
      }
    } catch (err: any) {
      alert(err.message || 'Error recording tax payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordTaxFilingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaxRecord) return;
    setIsSubmitting(true);
    try {
      const res = await api.recordTaxFiling(selectedTaxRecord._id, {
        returnAckNumber: taxFilingArn,
        notes: taxFilingNotes,
      });
      if (res.success) {
        setShowTaxFilingModal(false);
        fetchFinanceData();
      }
    } catch (err: any) {
      alert(err.message || 'Error recording tax return filing');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Financial aggregates — strict revenue integrity
  const verifiedPayments = payments.filter((p) => p.verificationStatus === 'verified' || !p.verificationStatus);
  const pendingPayments = payments.filter((p) => p.verificationStatus === 'verification_pending');

  const totalInvoicedPaise = invoices.reduce((acc, i) => acc + (i.totalAmountPaise || 0), 0);
  const totalCollectedPaise = verifiedPayments.reduce((acc, p) => acc + (p.amountPaise || 0), 0);
  const totalPendingClaimsPaise = pendingPayments.reduce((acc, p) => acc + (p.amountPaise || 0), 0);
  const totalExpensesPaise = expenses.reduce((acc, e) => acc + (e.amountPaise || 0), 0);
  const totalReceivablesPaise = Math.max(0, totalInvoicedPaise - totalCollectedPaise);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-brand-navy-950 flex items-center gap-2.5">
            <span>Financial Ledger & Tax Settlements</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-gold-100 text-brand-navy-950 border border-brand-gold-300">
              ERP Precision
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Exact integer paise accounting for customer tax invoices, verified bank receipts, cost outlays, and GSTIN: 33AAAAA0000A1Z5 tax compliance.
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
            <span>Record Direct Receipt</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Invoiced</span>
          <p className="text-lg font-bold font-heading text-brand-navy-950 font-mono">
            {formatINR(totalInvoicedPaise)}
          </p>
          <span className="text-[10px] text-slate-400">All issued tax invoices (18% GST)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Verified in Federal Bank</span>
          <p className="text-lg font-bold font-heading text-emerald-700 font-mono">
            {formatINR(totalCollectedPaise)}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Reconciled Collections</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-subtle space-y-1 bg-amber-50/30">
          <span className="text-[11px] font-bold text-amber-700 uppercase flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Verification
          </span>
          <p className="text-lg font-bold font-heading text-amber-800 font-mono">
            {formatINR(totalPendingClaimsPaise)}
          </p>
          <span className="text-[10px] text-amber-700">{pendingPayments.length} client claim(s) awaiting check</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Outstanding Receivables</span>
          <p className="text-lg font-bold font-heading text-rose-600 font-mono">
            {formatINR(totalReceivablesPaise)}
          </p>
          <span className="text-[10px] text-slate-400">Invoiced minus Verified Receipts</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Cost Expenses</span>
          <p className="text-lg font-bold font-heading text-slate-800 font-mono">
            {formatINR(totalExpensesPaise)}
          </p>
          <span className="text-[10px] text-slate-400">Materials, wages, transport & site</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        {[
          { id: 'invoices', label: 'Customer Tax Invoices' },
          { id: 'payments', label: `Client Receipts (${payments.length})` },
          { id: 'expenses', label: 'Project Expenses (Cost Out)' },
          { id: 'gst', label: 'GST & Tax Settlement (ITC)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as any)}
            className={`pb-3 transition-colors relative flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'text-brand-navy-950 border-b-2 border-brand-navy-900'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.id === 'gst' && <ShieldCheck className="w-3.5 h-3.5 text-brand-gold-600" />}
            {tab.id === 'payments' && pendingPayments.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
            )}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Invoices List */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium">
              Tax Invoices are generated sequentially from approved milestone quotations or billing schedules.
            </span>
            <Link
              to="/admin/quotations"
              className="text-brand-navy-900 font-bold hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>Convert Approved Quotation →</span>
            </Link>
          </div>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/invoices?edit=${inv._id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200"
                          title="Edit Bill / Tax Invoice"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Edit Bill</span>
                        </Link>

                        <a
                          href={`/api/v1/finance/invoices/${inv._id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800"
                        >
                          <FileDown className="w-3.5 h-3.5 text-brand-navy-900" />
                          <span>PDF</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setShareInvoice(inv);
                            setShowShareModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                          title="Share via WhatsApp & Mail"
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Share</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments List with Verification Workflow */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Integrity Notice Banner */}
          <div className="p-3.5 bg-brand-navy-900 text-white rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-brand-gold-400 shrink-0" />
              <span>
                <strong>Federal Bank Revenue Verification:</strong> Client payment claims submitted via the portal remain in{' '}
                <span className="text-amber-300 font-bold">Verification Pending</span> until confirmed against Federal Bank statement (A/c: 23330200002362).
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-300">IFSC: FDRL0002333</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Receipt #</th>
                    <th className="py-3.5 px-4">Client & Project</th>
                    <th className="py-3.5 px-4">Payment Mode & UTR</th>
                    <th className="py-3.5 px-4 text-right">Claimed Amount</th>
                    <th className="py-3.5 px-4 text-center">Verification Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => {
                    const isPending = p.verificationStatus === 'verification_pending';
                    const isVerified = p.verificationStatus === 'verified' || !p.verificationStatus;
                    const isRejected = p.verificationStatus === 'rejected';

                    return (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-navy-950">
                          {p.paymentNumber}
                          {p.proofFileUrl && (
                            <a
                              href={p.proofFileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-brand-teal-600 block flex items-center gap-1 hover:underline"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span>View Receipt Proof</span>
                            </a>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <strong className="text-slate-900 block">{p.clientName}</strong>
                          <span className="text-slate-500 text-[11px]">{p.projectId?.title || 'Project'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize font-semibold text-slate-800 block">
                            {p.paymentMode?.replace('_', ' ')}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 font-semibold">{p.transactionReference}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-emerald-700">
                          {formatINR(p.amountPaise)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending Verification
                            </span>
                          )}
                          {isVerified && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Verified & Credited
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Rejected Claim
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleVerifyPaymentAction(p._id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-sm"
                                title="Confirm credit in Federal Bank and update invoice"
                              >
                                <Check className="w-3 h-3" />
                                <span>Verify</span>
                              </button>
                              <button
                                onClick={() => handleRejectPaymentAction(p._id)}
                                className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded text-[11px] font-semibold"
                                title="Reject invalid claim"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">Reconciled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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

      {/* GST & Tax Settlement View (ITC Ledger & Compliance) */}
      {activeTab === 'gst' && (
        <div className="space-y-6">
          {/* Top Compliance Bar */}
          <div className="bg-brand-navy-950 text-white rounded-2xl p-5 border border-brand-navy-800 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[11px] font-bold text-brand-gold-400 tracking-wider uppercase">
                  Government of India — GST Portal Settlement
                </span>
                <h2 className="text-xl font-heading font-extrabold text-white mt-0.5">
                  Tax Period: {selectedTaxRecord?.period || '2026-10'} ({selectedTaxRecord?.financialYear || 'FY 2026-27'})
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  GSTIN: <span className="font-mono font-bold text-brand-gold-300">33AAAAA0000A1Z5</span> | Legal Entity: <span className="font-semibold text-white">GKA CONSTRUCTION</span> | Jurisdiction: Tamil Nadu
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTaxPayModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Record Tax Payment (Challan)</span>
                </button>
                <button
                  onClick={() => setShowTaxFilingModal(true)}
                  className="px-3.5 py-2 bg-brand-navy-800 hover:bg-brand-navy-700 border border-brand-navy-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <FileCheck className="w-3.5 h-3.5 text-brand-gold-400" />
                  <span>Record Return Filing (ARN)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Tax Metric Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Outward Supplies & Output GST */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">1. Outward Supplies (GSTR-1)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Sales Tax
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Total Output Tax Liability:</span>
                <p className="text-xl font-bold font-mono text-brand-navy-950">
                  {formatINR(selectedTaxRecord?.totalOutputTaxPaise || 0)}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1 text-slate-600 font-mono">
                <div className="flex justify-between">
                  <span>Taxable Base:</span>
                  <span>{formatINR(selectedTaxRecord?.totalTaxableSalesPaise || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Output CGST (9%):</span>
                  <span>{formatINR(selectedTaxRecord?.outputCgstPaise || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Output SGST (9%):</span>
                  <span>{formatINR(selectedTaxRecord?.outputSgstPaise || 0)}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Inward Supplies & Purchase Tax */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">2. Inward Purchases (GSTR-2B)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  Raw Materials
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Total Inward Tax Paid:</span>
                <p className="text-xl font-bold font-mono text-slate-800">
                  {formatINR(selectedTaxRecord?.totalPurchaseGstPaise || 0)}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1 text-slate-600 font-mono">
                <div className="flex justify-between">
                  <span>Taxable Purchases:</span>
                  <span>{formatINR(selectedTaxRecord?.totalTaxablePurchasesPaise || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ineligible ITC:</span>
                  <span className="text-rose-600">{formatINR(selectedTaxRecord?.ineligibleItcPaise || 0)}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Eligible ITC (Editable with Audit) */}
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-subtle space-y-3 bg-emerald-50/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">3. Eligible Input Credit (ITC)</span>
                <button
                  onClick={() => setShowItcModal(true)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 shadow-sm"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Adjust ITC</span>
                </button>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Credited to Tax Ledger:</span>
                <p className="text-xl font-bold font-mono text-emerald-700">
                  {formatINR(selectedTaxRecord?.eligibleItcPaise || 0)}
                </p>
              </div>
              <div className="pt-2 border-t border-emerald-100 text-[11px] space-y-1 text-slate-600 font-mono">
                <div className="flex justify-between">
                  <span>Manual Adjustments:</span>
                  <span>{formatINR(selectedTaxRecord?.taxAdjustmentsPaise || 0)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>Audit Trail Logged:</span>
                  <span>{selectedTaxRecord?.auditTrail?.length || 0} event(s)</span>
                </div>
              </div>
            </div>

            {/* Card 4: Net Tax Liability & Settlement Status */}
            <div className="bg-white p-5 rounded-2xl border border-brand-navy-200 shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-brand-navy-900 uppercase">4. Net Tax Settlement</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                    selectedTaxRecord?.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedTaxRecord?.paymentStatus || 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Net Payable = Output Tax - ITC:</span>
                <p className="text-xl font-bold font-mono text-rose-600">
                  {formatINR(selectedTaxRecord?.netTaxPayablePaise || 0)}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1 text-slate-600 font-mono">
                <div className="flex justify-between">
                  <span>Return Status:</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {selectedTaxRecord?.returnStatus?.replace('_', ' ') || 'Not Filed'}
                  </span>
                </div>
                {selectedTaxRecord?.returnAckNumber && (
                  <div className="flex justify-between">
                    <span>ARN Ref:</span>
                    <span className="text-brand-navy-950 font-bold">{selectedTaxRecord.returnAckNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Persistent ITC Audit Trail Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-brand-navy-900" />
                <h3 className="font-heading font-bold text-xs text-brand-navy-950 uppercase tracking-wider">
                  Mandatory GST Audit Trail & ITC Adjustment History
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Maintains statutory immutable records of all tax overrides and reasons.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Adjustment Field</th>
                    <th className="py-3 px-4 font-mono">Previous Value</th>
                    <th className="py-3 px-4 font-mono text-emerald-700">Adjusted Value</th>
                    <th className="py-3 px-4">Changed By</th>
                    <th className="py-3 px-4">Statutory Justification / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedTaxRecord?.auditTrail && selectedTaxRecord.auditTrail.length > 0 ? (
                    selectedTaxRecord.auditTrail.map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(log.changedAt).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-semibold text-brand-navy-950 capitalize">
                          {log.fieldChanged?.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {typeof log.oldValue === 'number' ? formatINR(log.oldValue) : String(log.oldValue)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          {typeof log.newValue === 'number' ? formatINR(log.newValue) : String(log.newValue)}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {log.changedByName || 'Accounts Admin'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 italic">
                          "{log.reason}"
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No manual adjustments recorded for this tax period. Baseline values derived from verified invoices.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Adjust ITC Modal */}
      {showItcModal && (
        <div className="fixed inset-0 z-50 bg-brand-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-heading font-bold text-brand-navy-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Adjust Eligible Input Tax Credit (ITC)</span>
              </h3>
              <button onClick={() => setShowItcModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateEligibleItc} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tax Period</label>
                <input
                  type="text"
                  disabled
                  value={`${selectedTaxRecord?.period} (${selectedTaxRecord?.financialYear})`}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Adjusted Eligible ITC Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={itcRupees}
                  onChange={(e) => setItcRupees(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-right text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Statutory Reason for Adjustment *
                </label>
                <textarea
                  required
                  rows={3}
                  value={itcReason}
                  onChange={(e) => setItcReason(e.target.value)}
                  placeholder="e.g. Reconciliation against GSTR-2B portal data: Ineligible cement freight ITC reversed under Section 17(5)."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  This note will be permanently preserved in the tax audit trail.
                </span>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowItcModal(false)}
                  className="px-4 py-2 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow"
                >
                  {isSubmitting ? 'Saving...' : 'Apply ITC Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Tax Payment (Challan) Modal */}
      {showTaxPayModal && (
        <div className="fixed inset-0 z-50 bg-brand-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-heading font-bold text-brand-navy-950 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-brand-navy-900" />
                <span>Record GST Challan Tax Payment</span>
              </h3>
              <button onClick={() => setShowTaxPayModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordTaxPaymentSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Challan Identification Number (CIN) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 023330226102400012"
                  value={taxPayChallan}
                  onChange={(e) => setTaxPayChallan(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">BSR Code</label>
                  <input
                    type="text"
                    required
                    value={taxPayBsr}
                    onChange={(e) => setTaxPayBsr(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Paid Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={taxPayRupees}
                    onChange={(e) => setTaxPayRupees(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-right"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTaxPayModal(false)}
                  className="px-4 py-2 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow"
                >
                  {isSubmitting ? 'Recording...' : 'Save Tax Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Return Filing Modal */}
      {showTaxFilingModal && (
        <div className="fixed inset-0 z-50 bg-brand-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-heading font-bold text-brand-navy-950 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-brand-gold-600" />
                <span>Record GST Return Filing (GSTR-3B)</span>
              </h3>
              <button onClick={() => setShowTaxFilingModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordTaxFilingSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Filing Acknowledgement Number (ARN) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AA3310260012345"
                  value={taxFilingArn}
                  onChange={(e) => setTaxFilingArn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Filing Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={taxFilingNotes}
                  onChange={(e) => setTaxFilingNotes(e.target.value)}
                  placeholder="e.g. Successfully filed on GST common portal. Challan settled via Federal Bank net banking."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTaxFilingModal(false)}
                  className="px-4 py-2 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 shadow"
                >
                  {isSubmitting ? 'Recording...' : 'Mark Return as Filed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-brand-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h3 className="text-base font-heading font-bold text-brand-navy-950">
              Record Direct Customer Payment Receipt
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
                    <option value="bank_transfer">Federal Bank NEFT / RTGS</option>
                    <option value="upi">UPI / GPay (8838030917)</option>
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

      {/* Share Document Modal (WhatsApp & Mail) */}
      {shareInvoice && (
        <ShareDocumentModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setShareInvoice(null);
          }}
          data={{
            documentType: 'invoice',
            title: shareInvoice.subject,
            number: shareInvoice.invoiceNumber,
            clientName: shareInvoice.clientCompany || shareInvoice.clientName,
            clientContactPerson: shareInvoice.clientContactPerson,
            clientEmail: shareInvoice.clientId?.email || shareInvoice.clientEmail || '',
            clientPhone: shareInvoice.clientId?.phone || shareInvoice.clientPhone || '',
            projectTitle: shareInvoice.projectTitle,
            siteLocation: shareInvoice.billingAddress,
            amount: toRupees(shareInvoice.totalAmountPaise),
            dueDate: shareInvoice.dueDate ? new Date(shareInvoice.dueDate).toLocaleDateString('en-IN') : undefined,
            pdfUrl: `/api/v1/finance/invoices/${shareInvoice._id}/pdf`,
            docxUrl: `/api/v1/finance/invoices/${shareInvoice._id}/docx`,
            username: shareInvoice.clientId?.email || 'client@gingerhotel.com',
            password: 'GKAclient2026!',
          }}
        />
      )}
    </div>
  );
};
