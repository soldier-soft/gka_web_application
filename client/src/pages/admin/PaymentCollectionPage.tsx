import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Upload,
  ArrowRight,
  Check,
  XCircle,
  ShieldCheck,
  Receipt,
  Building2,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { api, getFileUrl } from '../../services/api';
import { formatINR, toPaise, toRupees } from '@shared/types';

export const PaymentCollectionPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Collection Counter form state
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(''); // empty = FIFO auto-allocate
  const [amountRupees, setAmountRupees] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'bank_transfer' | 'upi' | 'cheque' | 'cash'>('bank_transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'verification_pending'>('verified');
  const [notes, setNotes] = useState('');
  const [proofDataUrl, setProofDataUrl] = useState<string | undefined>(undefined);
  const [proofFileName, setProofFileName] = useState<string>('');
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  // Filters for receipts history
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'verification_pending' | 'reconciled' | 'rejected'>('all');

  const fetchCounterData = async () => {
    try {
      setLoading(true);
      const [projRes, invRes, payRes] = await Promise.all([
        api.getProjects(),
        api.getInvoices(),
        api.getPayments(),
      ]);
      if (projRes.success) {
        setProjects(projRes.projects || []);
        if (!selectedProjectId && projRes.projects?.length > 0) {
          // Prefer a project with outstanding dues as default
          const withDue = projRes.projects.find(
            (p: any) => Math.max(0, (p.invoicedAmountPaise || 0) - (p.collectedAmountPaise || 0)) > 0
          );
          setSelectedProjectId((withDue || projRes.projects[0])._id);
        }
      }
      if (invRes.success) setInvoices(invRes.invoices || []);
      if (payRes.success) setPayments(payRes.payments || []);
    } catch (err) {
      console.error('Error loading payment collection counter:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounterData();
  }, []);

  // Compute live invoice-backed breakdown per project
  const projectLedgerRows = useMemo(() => {
    return projects.map((p) => {
      const projInvoices = invoices.filter(
        (inv) => String(inv.projectId?._id || inv.projectId) === String(p._id) && inv.status !== 'cancelled'
      );
      const invoicedPaise =
        projInvoices.length > 0
          ? projInvoices.reduce((acc, inv) => acc + (inv.totalAmountPaise || 0), 0)
          : p.invoicedAmountPaise || 0;
      const projVerifiedPayments = payments.filter(
        (pay) =>
          String(pay.projectId?._id || pay.projectId) === String(p._id) &&
          (pay.verificationStatus === 'verified' || pay.verificationStatus === 'reconciled' || !pay.verificationStatus)
      );
      const collectedFromPaymentsPaise = projVerifiedPayments.reduce((acc, pay) => acc + (pay.amountPaise || 0), 0);
      const paidFromInvoicesPaise = projInvoices.reduce((acc, inv) => acc + (inv.paidAmountPaise || 0), 0);
      const collectedPaise = Math.max(collectedFromPaymentsPaise, paidFromInvoicesPaise, p.collectedAmountPaise || 0);
      const invoiceDueSumPaise =
        projInvoices.length > 0
          ? projInvoices.reduce((acc, inv) => acc + Math.max(0, (inv.totalAmountPaise || 0) - (inv.paidAmountPaise || 0)), 0)
          : Math.max(0, invoicedPaise - collectedPaise);
      const outstandingPaise = Math.max(0, Math.min(invoiceDueSumPaise, Math.max(0, invoicedPaise - collectedPaise)) || Math.max(0, invoicedPaise - collectedPaise));
      const unpaidInvoices = projInvoices.filter(
        (inv) => Math.max(0, (inv.totalAmountPaise || 0) - (inv.paidAmountPaise || 0)) > 0
      );

      return {
        ...p,
        invoicedPaise,
        collectedPaise,
        outstandingPaise,
        projInvoices,
        unpaidInvoices,
      };
    });
  }, [projects, invoices, payments]);

  const activeProjectSummary = useMemo(
    () => projectLedgerRows.find((p) => String(p._id) === String(selectedProjectId)),
    [projectLedgerRows, selectedProjectId]
  );

  // Sync suggested payment amount when project or invoice changes
  const handleProjectChange = (pid: string) => {
    setSelectedProjectId(pid);
    setSelectedInvoiceId('');
    const row = projectLedgerRows.find((r) => String(r._id) === String(pid));
    if (row) {
      setAmountRupees(toRupees(row.outstandingPaise));
    }
  };

  const handleInvoiceChoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    if (!invId) {
      if (activeProjectSummary) {
        setAmountRupees(toRupees(activeProjectSummary.outstandingPaise));
      }
      return;
    }
    const inv = invoices.find((i) => i._id === invId);
    if (inv) {
      const due = Math.max(0, (inv.totalAmountPaise || 0) - (inv.paidAmountPaise || 0));
      setAmountRupees(toRupees(due));
    }
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setProofDataUrl(undefined);
      setProofFileName('');
      return;
    }
    setProofFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProofDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || amountRupees <= 0) {
      alert('Please select a project and enter a valid received amount.');
      return;
    }
    setSubmitting(true);
    try {
      const proj = activeProjectSummary;
      const res = await api.recordPayment({
        projectId: selectedProjectId,
        clientId: proj?.clientId?._id || proj?.clientId,
        clientName: proj?.clientId?.name || proj?.clientId?.companyName || proj?.title || 'Client',
        invoiceId: selectedInvoiceId || undefined,
        amountPaise: toPaise(amountRupees),
        paymentDate,
        paymentMode,
        transactionReference: transactionRef.trim() || undefined,
        verificationStatus,
        notes: notes.trim() || undefined,
        proofDataUrl,
        proofFileName: proofFileName || undefined,
      });

      if (res.success) {
        setBannerMsg(
          res.message ||
            `Payment of ${formatINR(toPaise(amountRupees))} recorded cleanly. All project dues and dashboard balances updated.`
        );
        setTransactionRef('');
        setNotes('');
        setProofDataUrl(undefined);
        setProofFileName('');
        setAmountRupees(0);
        await fetchCounterData();
      }
    } catch (err: any) {
      alert(err.message || 'Error recording payment receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPayment = async (id: string) => {
    try {
      const res = await api.verifyPayment(id);
      if (res.success) {
        setBannerMsg(res.message || 'Payment verified and reconciled across invoices.');
        await fetchCounterData();
      }
    } catch (err: any) {
      alert(err.message || 'Error verifying payment');
    }
  };

  const handleReconcilePayment = async (id: string) => {
    try {
      const res = await api.reconcilePayment(id);
      if (res.success) {
        setBannerMsg(res.message || 'Payment marked reconciled against bank statement.');
        await fetchCounterData();
      }
    } catch (err: any) {
      alert(err.message || 'Error reconciling payment');
    }
  };

  const handleRejectPayment = async (id: string) => {
    const reason = window.prompt('Enter rejection reason (e.g. UTR mismatch):');
    if (!reason) return;
    try {
      const res = await api.rejectPayment(id, reason);
      if (res.success) {
        setBannerMsg('Payment marked as rejected.');
        await fetchCounterData();
      }
    } catch (err: any) {
      alert(err.message || 'Error rejecting payment');
    }
  };

  // Global KPI aggregates
  const verifiedOrReconciled = payments.filter(
    (p) => p.verificationStatus === 'verified' || p.verificationStatus === 'reconciled' || !p.verificationStatus
  );
  const pendingVerification = payments.filter((p) => p.verificationStatus === 'verification_pending');

  const totalInvoicedPaise = projectLedgerRows.reduce((acc, r) => acc + r.invoicedPaise, 0);
  const totalCollectedPaise = verifiedOrReconciled.reduce((acc, p) => acc + (p.amountPaise || 0), 0);
  const totalOutstandingPaise = projectLedgerRows.reduce((acc, r) => acc + r.outstandingPaise, 0);
  const pendingVerificationPaise = pendingVerification.reduce((acc, p) => acc + (p.amountPaise || 0), 0);

  const filteredPayments = payments.filter((p) => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'verified' && (p.verificationStatus === 'verified' || !p.verificationStatus)) ||
      p.verificationStatus === statusFilter;
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.paymentNumber?.toLowerCase().includes(q) ||
      p.clientName?.toLowerCase().includes(q) ||
      p.transactionReference?.toLowerCase().includes(q) ||
      p.projectId?.title?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-[#0F254B] flex items-center gap-2.5">
            <span>Payment Collection Counter</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Live Due Sync
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload customer amounts received per project with proof — automatically reduces invoice dues, updates client ledgers & syncs dashboard balances simultaneously.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/admin/invoices"
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm flex items-center gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5 text-[#0F254B]" />
            <span>Invoices & Billing</span>
          </Link>
          <Link
            to="/admin/gst"
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-50 border border-blue-200 text-blue-900 hover:bg-blue-100 shadow-sm flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>Month-Wise GST Portal</span>
          </Link>
          <Link
            to="/admin/dashboard"
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#0F254B] text-white hover:bg-[#1E3A8A] shadow-sm flex items-center gap-1.5"
          >
            <span>Owner Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D6A21D]" />
          </Link>
        </div>
      </div>

      {bannerMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{bannerMsg}</span>
          </div>
          <button onClick={() => setBannerMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-bold px-2">
            ✕
          </button>
        </div>
      )}

      {/* 4 Top Synchronized KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Project Billed</span>
          <p className="text-xl font-bold font-mono text-[#0F254B]">{formatINR(totalInvoicedPaise)}</p>
          <span className="text-[10px] text-slate-400">Across {projects.length} project site(s)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 uppercase">Total Cash Collected</span>
          <p className="text-xl font-bold font-mono text-emerald-700">{formatINR(totalCollectedPaise)}</p>
          <span className="text-[10px] text-emerald-700 font-medium">
            {verifiedOrReconciled.length} verified & reconciled receipt(s)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-rose-200 bg-rose-50/20 shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-rose-700 uppercase">Live Outstanding Dues</span>
          <p className="text-xl font-extrabold font-mono text-rose-600">{formatINR(totalOutstandingPaise)}</p>
          <span className="text-[10px] text-rose-600 font-medium">Automatically decreases on collection</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-amber-800 uppercase">Pending Verification Claims</span>
          <p className="text-xl font-bold font-mono text-amber-700">{formatINR(pendingVerificationPaise)}</p>
          <span className="text-[10px] text-amber-700">
            {pendingVerification.length} awaiting bank check
          </span>
        </div>
      </div>

      {/* Main Split: Collection Counter Upload Form + Project Dues Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Counter Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-heading font-bold text-sm text-[#0F254B] flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#D6A21D]" />
              <span>Upload / Record Payment Received</span>
            </h2>
            {activeProjectSummary && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Due: {formatINR(activeProjectSummary.outstandingPaise)}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmitCollection} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">1. Select Project *</label>
              <select
                required
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900"
              >
                <option value="">-- Choose Project --</option>
                {projectLedgerRows.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.projectId} — {p.title} (Due: {formatINR(p.outstandingPaise)})
                  </option>
                ))}
              </select>
            </div>

            {activeProjectSummary && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Invoiced</span>
                  <strong className="font-mono text-[#0F254B]">{formatINR(activeProjectSummary.invoicedPaise)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Collected</span>
                  <strong className="font-mono text-emerald-700">{formatINR(activeProjectSummary.collectedPaise)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Remaining Due</span>
                  <strong className="font-mono text-rose-600">{formatINR(activeProjectSummary.outstandingPaise)}</strong>
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">2. Invoice Allocation Target</label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceChoiceChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="">
                  Auto-Allocate Across Unpaid Project Invoices (FIFO Oldest First)
                </option>
                {(activeProjectSummary?.unpaidInvoices || []).map((inv: any) => (
                  <option key={inv._id} value={inv._id}>
                    {inv.invoiceNumber} — Due: {formatINR((inv.totalAmountPaise || 0) - (inv.paidAmountPaise || 0))}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">3. Amount Received (₹) *</label>
                {activeProjectSummary && activeProjectSummary.outstandingPaise > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedInvoiceId) {
                        const inv = invoices.find((i) => i._id === selectedInvoiceId);
                        if (inv) {
                          setAmountRupees(toRupees(Math.max(0, (inv.totalAmountPaise || 0) - (inv.paidAmountPaise || 0))));
                          return;
                        }
                      }
                      setAmountRupees(toRupees(activeProjectSummary.outstandingPaise));
                    }}
                    className="text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-0.5"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Fill Full Due</span>
                  </button>
                )}
              </div>
              <input
                type="number"
                required
                min={1}
                step="0.01"
                value={amountRupees || ''}
                onChange={(e) => setAmountRupees(Number(e.target.value))}
                placeholder="Enter received amount in ₹"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 font-mono font-bold text-right text-sm text-[#0F254B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="bank_transfer">NEFT / RTGS / IMPS</option>
                  <option value="upi">UPI / GPay</option>
                  <option value="cheque">Bank Cheque</option>
                  <option value="cash">Cash Counter</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Receipt Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">UTR / Cheque / Ref #</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="Optional (auto-generated if blank)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Posting Status</label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold"
                >
                  <option value="verified">Verify & Update Dues Now</option>
                  <option value="verification_pending">Queue for Verification</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Upload Payment Receipt / Screenshot Proof (Optional)
              </label>
              <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer">
                <span className="text-slate-600 truncate">
                  {proofFileName || 'Choose image or PDF receipt proof...'}
                </span>
                <Upload className="w-4 h-4 text-[#0F254B] shrink-0" />
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleProofFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Counter Remarks</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Received via Federal Bank RTGS — Stage 2 settlement"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <IndianRupee className="w-4 h-4" />
              <span>{submitting ? 'Reconciling Payment...' : 'Record Payment & Sync All Dues'}</span>
            </button>
          </form>
        </div>

        {/* Right: Project-Wise Outstanding Dues Breakdown */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F254B] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#D6A21D]" />
              <span>Project-Wise Invoiced vs Collected & Remaining Dues</span>
            </h2>
            <span className="text-[11px] text-slate-500">Click "Collect Due" to pre-fill counter</span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-xs text-slate-400">Loading project balances...</div>
          ) : projectLedgerRows.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">No active projects found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Project & Client</th>
                    <th className="py-3 px-4 text-right font-mono">Billed</th>
                    <th className="py-3 px-4 text-right font-mono">Collected</th>
                    <th className="py-3 px-4 text-right font-mono">Outstanding Due</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectLedgerRows.map((p) => {
                    const isSelected = String(p._id) === String(selectedProjectId);
                    return (
                      <tr
                        key={p._id}
                        className={`transition-colors ${
                          isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <Link
                            to={`/admin/projects/${p._id}?tab=invoices_receipts`}
                            className="font-bold text-[#0F254B] hover:underline block"
                          >
                            {p.title}
                          </Link>
                          <span className="text-[10px] text-slate-500">
                            {p.projectId} • {p.clientId?.companyName || p.clientId?.name || 'Client'} ({p.projInvoices.length} invoice{p.projInvoices.length === 1 ? '' : 's'})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                          {formatINR(p.invoicedPaise)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                          {formatINR(p.collectedPaise)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {p.outstandingPaise > 0 ? (
                            <span className="text-rose-600">{formatINR(p.outstandingPaise)}</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
                              Cleared ✓
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleProjectChange(p._id)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#0F254B] text-white hover:bg-[#1E3A8A]"
                          >
                            {p.outstandingPaise > 0 ? 'Collect Due' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Payment Receipts & Bank Verification Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F254B] flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <span>Payment Collection History & Bank Verification Ledger ({filteredPayments.length})</span>
          </h2>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search Receipt #, UTR, Project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="reconciled">Reconciled</option>
              <option value="verification_pending">Pending Verification</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            No payment receipts match your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Receipt # & Date</th>
                  <th className="py-3 px-4">Project & Client</th>
                  <th className="py-3 px-4">Mode & Reference</th>
                  <th className="py-3 px-4 text-right font-mono">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Verification Status</th>
                  <th className="py-3 px-4 text-right">Actions & Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  const isVerified = p.verificationStatus === 'verified';
                  const isReconciled = p.verificationStatus === 'reconciled';
                  const isPending = p.verificationStatus === 'verification_pending';
                  const isRejected = p.verificationStatus === 'rejected';

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <strong className="text-[#0F254B] block font-mono">{p.paymentNumber}</strong>
                        <span className="text-[10px] text-slate-400">
                          {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-800 block">{p.projectId?.title || 'Project Site'}</strong>
                        <span className="text-[11px] text-slate-500">
                          {p.clientName} {p.invoiceId?.invoiceNumber ? `• ${p.invoiceId.invoiceNumber}` : '• Project FIFO'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-semibold text-slate-700 block">
                          {p.paymentMode?.replace('_', ' ')}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">UTR: {p.transactionReference}</span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                          isVerified || isReconciled
                            ? 'text-emerald-700'
                            : isPending
                            ? 'text-amber-700'
                            : 'text-rose-600 line-through'
                        }`}
                      >
                        {formatINR(p.amountPaise)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isReconciled ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Reconciled
                          </span>
                        ) : isVerified ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : isPending ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending Check
                          </span>
                        ) : isRejected ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Rejected
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {p.verificationStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {p.proofFileUrl && (
                            <a
                              href={getFileUrl(p.proofFileUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded bg-slate-100 text-[#0F254B] hover:bg-slate-200 text-[10px] font-bold"
                            >
                              View Proof
                            </a>
                          )}
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleVerifyPayment(p._id)}
                                className="px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-bold inline-flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Verify
                              </button>
                              <button
                                onClick={() => handleRejectPayment(p._id)}
                                className="px-2 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 text-[10px] font-bold inline-flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </>
                          )}
                          {isVerified && (
                            <button
                              onClick={() => handleReconcilePayment(p._id)}
                              className="px-2 py-1 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 text-[10px] font-bold"
                            >
                              Mark Reconciled
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

