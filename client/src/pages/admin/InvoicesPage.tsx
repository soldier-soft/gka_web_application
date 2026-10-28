import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  FileDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Edit3,
  ExternalLink,
  ShieldCheck,
  Building2,
  Trash2,
  RotateCcw,
  Receipt,
  ArrowRight,
  Printer,
  X,
  Check,
  Share2,
} from 'lucide-react';
import { api, downloadFile, getFileUrl } from '../../services/api';
import { formatINR, toPaise, toRupees } from '@shared/types';
import { DocumentVisualView } from '../../components/documents/DocumentVisualView';
import { ShareDocumentModal } from '../../components/common/ShareDocumentModal';

export const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [approvedQuotations, setApprovedQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareInvoice, setShareInvoice] = useState<any>(null);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gstFilter, setGstFilter] = useState('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showGstModal, setShowGstModal] = useState(false);

  // Selected item states
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedQuotationId, setSelectedQuotationId] = useState('');

  // GST Toggle State
  const [gstModalArn, setGstModalArn] = useState('AA3310260012345');
  const [gstModalPeriod, setGstModalPeriod] = useState('2026-10');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Invoice form state (clean live application default)
  const [invProject, setInvProject] = useState('');
  const [invClientName, setInvClientName] = useState('');
  const [invContactPerson, setInvContactPerson] = useState('');
  const [invClientCompany, setInvClientCompany] = useState('');
  const [invBillingAddress, setInvBillingAddress] = useState('');
  const [invSubject, setInvSubject] = useState('');
  const [invDueDate, setInvDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [invNotes, setInvNotes] = useState('Payment due within 14 calendar days.');
  const [invItems, setInvItems] = useState<any[]>([
    {
      description: 'Civil Construction & Finishing Work Scope',
      quantity: 0,
      unit: 'sq.ft',
      unitRateRupees: 0,
    },
  ]);

  // Negotiation & terms state for Create Invoice
  const [invIsNegotiated, setInvIsNegotiated] = useState(false);
  const [invNegotiatedDiscountRupees, setInvNegotiatedDiscountRupees] = useState<number>(0);
  const [invNegotiatedNotes, setInvNegotiatedNotes] = useState<string>('');
  const [invTerms, setInvTerms] = useState<string>(
    'Payment is due within 14 calendar days from the date of invoice issuance.\nPlease quote this Invoice Number when executing electronic NEFT / RTGS / IMPS bank transfers.\nStatutory GST (18%) charged as per GSTIN compliance rules.\nLate payment charges @ 18% per annum apply on balances overdue past the due date.\nAll billing disputes and claims subject to Chennai legal jurisdiction only.'
  );

  // Edit Invoice form state
  const [editProjectId, setEditProjectId] = useState('');
  const [editInvoiceNumber, setEditInvoiceNumber] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editBillingAddress, setEditBillingAddress] = useState('');
  const [editIssueDate, setEditIssueDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState('issued');
  const [editPaidAmountRupees, setEditPaidAmountRupees] = useState<number>(0);
  const [editNotes, setEditNotes] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editIsNegotiated, setEditIsNegotiated] = useState(false);
  const [editNegotiatedDiscountRupees, setEditNegotiatedDiscountRupees] = useState<number>(0);
  const [editNegotiatedNotes, setEditNegotiatedNotes] = useState<string>('');
  const [editTerms, setEditTerms] = useState<string>('');
  const [editItems, setEditItems] = useState<any[]>([]);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      const [invRes, projRes, quoRes] = await Promise.all([
        api.getInvoices(),
        api.getProjects(),
        api.getQuotations({ status: 'approved' }).catch(() => ({ success: false, quotations: [] })),
      ]);

      if (invRes.success) setInvoices(invRes.invoices);
      if (projRes.success) {
        setProjects(projRes.projects);
        if (projRes.projects.length > 0 && !invProject) {
          setInvProject(projRes.projects[0]._id);
          setInvClientName(projRes.projects[0].clientName || 'Valued Client');
          setInvBillingAddress(projRes.projects[0].siteAddress?.street || 'Kelambakkam, Chennai');
        }
      }
      if (quoRes.success) {
        setApprovedQuotations(quoRes.quotations);
        if (quoRes.quotations.length > 0) {
          setSelectedQuotationId(quoRes.quotations[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching invoice dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, []);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && invoices.length > 0) {
      const target = invoices.find((i) => i._id === editId);
      if (target) {
        handleOpenEdit(target);
      }
    }
    const projIdParam = searchParams.get('projectId');
    if (projIdParam && projects.length > 0) {
      setInvProject(projIdParam);
      const matched = projects.find((p) => p._id === projIdParam);
      if (matched) {
        setInvClientName(matched.clientName || 'Valued Client');
        setInvBillingAddress(matched.siteAddress?.street || 'Kelambakkam, Chennai');
      }
      setShowCreateModal(true);
    }
  }, [searchParams, invoices, projects]);

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProject =
      projectFilter === 'all' ||
      inv.projectId?._id === projectFilter ||
      inv.projectId === projectFilter;

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

    const matchesGst =
      gstFilter === 'all' ||
      (gstFilter === 'filed' && inv.gstFiled) ||
      (gstFilter === 'unfiled' && !inv.gstFiled);

    return matchesSearch && matchesProject && matchesStatus && matchesGst;
  });

  // Calculate Summary Metrics
  const totalInvoicedPaise = invoices.reduce((acc, i) => acc + (i.totalAmountPaise || 0), 0);
  const totalCollectedPaise = invoices.reduce((acc, i) => acc + (i.paidAmountPaise || 0), 0);
  const totalReceivablesPaise = invoices.reduce((acc, i) => acc + (i.dueAmountPaise || 0), 0);
  const totalGstOutputPaise = invoices.reduce((acc, i) => acc + ((i.cgstPaise || 0) + (i.sgstPaise || 0)), 0);
  const filedCount = invoices.filter((i) => i.gstFiled).length;
  const complianceRate = invoices.length > 0 ? Math.round((filedCount / invoices.length) * 100) : 100;

  // Invoice creation item handlers
  const handleAddItem = () => {
    setInvItems([
      ...invItems,
      {
        description: '',
        quantity: 0,
        unit: 'sq.ft',
        unitRateRupees: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setInvItems(invItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...invItems];
    updated[index] = { ...updated[index], [field]: value };
    setInvItems(updated);
  };

  // Auto-download helper for generated files
  const triggerAutoDownloads = async (invoiceId: string, invoiceNumber: string) => {
    try {
      await downloadFile(`/finance/invoices/${invoiceId}/pdf`, `GKA_Invoice_${invoiceNumber}.pdf`, true);
      setTimeout(async () => {
        try {
          await downloadFile(`/finance/invoices/${invoiceId}/docx`, `GKA_Invoice_${invoiceNumber}.docx`, false);
        } catch (docxErr) {
          console.error('Auto-download DOCX error:', docxErr);
        }
      }, 600);
    } catch (err) {
      console.error('Auto-download PDF error:', err);
    }
  };

  // Live calculation for Create Invoice
  const calculateInvSubtotal = () => {
    return invItems.reduce(
      (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitRateRupees) || 0),
      0
    );
  };
  const invSubtotal = calculateInvSubtotal();
  const invDiscount = invIsNegotiated ? Math.max(0, Number(invNegotiatedDiscountRupees) || 0) : 0;
  const invTaxable = Math.max(0, invSubtotal - invDiscount);
  const invTax = Math.round(invTaxable * 0.18);
  const invTotal = invTaxable + invTax;

  // Submit new invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const convertedItems = invItems.map((it) => ({
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unit: it.unit || 'CFT',
        unitPricePaise: toPaise(Number(it.unitRateRupees) || 0),
      }));

      const res = await api.createInvoice({
        projectId: invProject,
        clientName: invClientName,
        clientContactPerson: invContactPerson,
        clientCompany: invClientCompany,
        billingAddress: invBillingAddress,
        subject: invSubject,
        items: convertedItems,
        dueDate: invDueDate,
        notes: invNotes,
        isNegotiated: invIsNegotiated,
        negotiatedDiscountPaise: invIsNegotiated ? toPaise(Number(invNegotiatedDiscountRupees) || 0) : 0,
        negotiatedNotes: invIsNegotiated ? invNegotiatedNotes : undefined,
        termsAndConditions: invTerms ? invTerms.split('\n').map((s) => s.trim()).filter(Boolean) : undefined,
      });

      if (res.success && res.invoice) {
        setShowCreateModal(false);
        fetchInvoiceData();
        triggerAutoDownloads(res.invoice._id, res.invoice.invoiceNumber);
      }
    } catch (err: any) {
      alert(err.message || 'Error generating tax invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert Quotation to Invoice
  const handleConvertQuotation = async () => {
    if (!selectedQuotationId) return;
    setIsSubmitting(true);
    try {
      const res = await api.convertQuotationToInvoice(selectedQuotationId);
      if (res.success && res.invoice) {
        setShowConvertModal(false);
        fetchInvoiceData();
        triggerAutoDownloads(res.invoice._id, res.invoice.invoiceNumber);
      }
    } catch (err: any) {
      alert(err.message || 'Error converting quotation to invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (inv: any) => {
    setSelectedInvoice(inv);
    setEditProjectId(
      inv.projectId?._id || (typeof inv.projectId === 'string' ? inv.projectId : '')
    );
    setEditInvoiceNumber(inv.invoiceNumber || '');
    setEditClientName(inv.clientName || '');
    setEditBillingAddress(inv.billingAddress || '');
    setEditIssueDate(
      inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : ''
    );
    setEditDueDate(
      inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : ''
    );
    setEditStatus(inv.status || 'issued');
    setEditPaidAmountRupees(toRupees(inv.paidAmountPaise || 0));
    setEditNotes(inv.notes || '');
    setEditSubject(inv.subject || '');
    setEditContactPerson(inv.clientContactPerson || '');
    setEditCompany(inv.clientCompany || '');
    setEditIsNegotiated(Boolean(inv.isNegotiated));
    setEditNegotiatedDiscountRupees(toRupees(inv.negotiatedDiscountPaise || inv.discountPaise || 0));
    setEditNegotiatedNotes(inv.negotiatedNotes || '');
    setEditTerms(
      Array.isArray(inv.termsAndConditions) && inv.termsAndConditions.length > 0
        ? inv.termsAndConditions.join('\n')
        : 'Payment is due within 14 calendar days from the date of invoice issuance.\nPlease quote this Invoice Number when executing electronic NEFT / RTGS / IMPS bank transfers.\nStatutory GST (18%) charged as per GSTIN compliance rules.\nLate payment charges @ 18% per annum apply on balances overdue past the due date.\nAll billing disputes and claims subject to Chennai legal jurisdiction only.'
    );
    setEditItems(
      (inv.items || []).map((it: any) => ({
        description: it.description,
        quantity: it.quantity,
        unit: it.unit || 'CFT',
        unitRateRupees: toRupees(it.unitPricePaise),
      }))
    );
    setShowEditModal(true);
  };

  const calculateEditInvSubtotal = () => {
    return editItems.reduce(
      (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitRateRupees) || 0),
      0
    );
  };

  const editInvSubtotal = calculateEditInvSubtotal();
  const editInvDiscount = editIsNegotiated ? Math.max(0, Number(editNegotiatedDiscountRupees) || 0) : 0;
  const editInvTaxable = Math.max(0, editInvSubtotal - editInvDiscount);
  const editInvTax = Math.round(editInvTaxable * 0.18);
  const editInvTotal = editInvTaxable + editInvTax;

  // Save Edited Invoice
  const handleSaveEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setIsSubmitting(true);
    try {
      const convertedItems = editItems.map((it) => ({
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unit: it.unit || 'CFT',
        unitPricePaise: toPaise(Number(it.unitRateRupees) || 0),
      }));

      const res = await api.updateInvoice(selectedInvoice._id, {
        invoiceNumber: editInvoiceNumber,
        projectId: editProjectId || null,
        clientName: editClientName,
        billingAddress: editBillingAddress,
        issueDate: editIssueDate,
        dueDate: editDueDate,
        status: editStatus,
        notes: editNotes,
        subject: editSubject,
        clientContactPerson: editContactPerson,
        clientCompany: editCompany,
        paidAmountPaise: toPaise(Number(editPaidAmountRupees) || 0),
        items: convertedItems,
        isNegotiated: editIsNegotiated,
        negotiatedDiscountPaise: editIsNegotiated ? toPaise(Number(editNegotiatedDiscountRupees) || 0) : 0,
        negotiatedNotes: editIsNegotiated ? editNegotiatedNotes : '',
        termsAndConditions: editTerms ? editTerms.split('\n').map((s) => s.trim()).filter(Boolean) : undefined,
      });

      if (res.success) {
        setShowEditModal(false);
        fetchInvoiceData();
        triggerAutoDownloads(selectedInvoice._id, editInvoiceNumber);
      }
    } catch (err: any) {
      alert(err.message || 'Error updating invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open GST Toggle Modal
  const handleOpenGstToggle = (inv: any) => {
    setSelectedInvoice(inv);
    setGstModalArn(inv.gstFilingArn || 'AA3310260012345');
    setGstModalPeriod(inv.gstTaxPeriod || '2026-10');
    setShowGstModal(true);
  };

  // Submit GST Toggle
  const handleConfirmGstToggle = async (newStatus: boolean) => {
    if (!selectedInvoice) return;
    setIsSubmitting(true);
    try {
      const res = await api.toggleInvoiceGst(selectedInvoice._id, {
        gstFiled: newStatus,
        gstFilingArn: newStatus ? gstModalArn : undefined,
        gstTaxPeriod: gstModalPeriod,
      });

      if (res.success) {
        setShowGstModal(false);
        fetchInvoiceData();
      }
    } catch (err: any) {
      alert(err.message || 'Error updating GST filing state');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-[#0F254B] flex items-center gap-2.5">
            <span>Invoices & Billing Hub</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D6A21D]/20 text-[#0F254B] border border-[#D6A21D]/40">
              GKA Standard Format
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tax invoices, boq bill schedules, direct project workspace linking, auto-download DOCX/PDF, and GSTIN: 33CDYPA3555M2ZZ return compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {approvedQuotations.length > 0 && (
            <button
              onClick={() => setShowConvertModal(true)}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white text-[#0F254B] border border-[#0F254B]/30 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D6A21D]" />
              <span>Convert Approved Quotation</span>
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0F254B] text-white hover:bg-[#1E3A8A] transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-[#D6A21D]" />
            <span>New Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Invoiced</span>
          <p className="text-lg font-bold font-heading text-[#0F254B] font-mono">
            {formatINR(totalInvoicedPaise)}
          </p>
          <span className="text-[10px] text-slate-400">Total billing issued across all sites</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Verified Collections</span>
          <p className="text-lg font-bold font-heading text-emerald-700 font-mono">
            {formatINR(totalCollectedPaise)}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Reconciled in Federal Bank</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Outstanding Receivables</span>
          <p className="text-lg font-bold font-heading text-rose-600 font-mono">
            {formatINR(totalReceivablesPaise)}
          </p>
          <span className="text-[10px] text-slate-400">Due customer milestone balances</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase">GST 18% Collected</span>
          <p className="text-lg font-bold font-heading text-blue-700 font-mono">
            {formatINR(totalGstOutputPaise)}
          </p>
          <span className="text-[10px] text-slate-400">Output tax liability (CGST+SGST)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle space-y-1 bg-[#F8FAFC]">
          <span className="text-[11px] font-bold text-[#0F254B] uppercase flex items-center justify-between">
            <span>GST Filing Compliance</span>
            <Link
              to="/admin/finance?tab=gst"
              className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5"
            >
              <span>Ledger →</span>
            </Link>
          </span>
          <p className="text-lg font-bold font-heading text-[#0F254B] font-mono">
            {complianceRate}%
          </p>
          <span className="text-[10px] text-slate-500">
            {filedCount} of {invoices.length} invoices reported in GSTR-1
          </span>
        </div>
      </div>

      {/* 3. Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by invoice number, client or project name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0F254B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">All Project Sites</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.projectId} — {p.title}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">All Payment Statuses</option>
            <option value="issued">Issued / Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Fully Paid</option>
            <option value="overdue">Overdue</option>
          </select>

          <select
            value={gstFilter}
            onChange={(e) => setGstFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="all">All GST States</option>
            <option value="filed">✓ GST Filed in Return</option>
            <option value="unfiled">⏳ Unfiled (Pending GSTR-1)</option>
          </select>
        </div>
      </div>

      {/* 4. Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading invoice ledger...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No tax invoices found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Client & Project Workspace</th>
                  <th className="py-3.5 px-4 font-mono">Total (Inc. 18% GST)</th>
                  <th className="py-3.5 px-4 font-mono text-emerald-700">Paid Amount</th>
                  <th className="py-3.5 px-4 font-mono text-rose-600">Balance Due</th>
                  <th className="py-3.5 px-4 text-center">Payment Status</th>
                  <th className="py-3.5 px-4 text-center">GST Compliance</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const projectId = inv.projectId?._id || inv.projectId;
                  const isPaid = inv.status === 'paid';
                  const isPartiallyPaid = inv.status === 'partially_paid';

                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Invoice # & Date */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0F254B]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{inv.invoiceNumber}</span>
                          {inv.isNegotiated && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              🤝 Negotiated
                            </span>
                          )}
                        </div>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Issued: {new Date(inv.issueDate).toLocaleDateString('en-IN')}
                        </span>
                      </td>

                      {/* Client & Project with direct workspace link */}
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 block">{inv.projectTitle}</strong>
                        <span className="text-slate-500 text-[11px] block">{inv.clientName}</span>
                        {projectId && (
                          <Link
                            to={`/admin/projects/${projectId}?tab=invoices_receipts`}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline mt-0.5"
                          >
                            <span>Open Project Workspace</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </td>

                      {/* Amounts */}
                      <td className="py-3.5 px-4 font-mono font-bold text-sm text-[#0F254B]">
                        {formatINR(inv.totalAmountPaise)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700">
                        {formatINR(inv.paidAmountPaise || 0)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-600">
                        {formatINR(inv.dueAmountPaise || 0)}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isPartiallyPaid
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {inv.status?.replace('_', ' ')}
                        </span>
                      </td>

                      {/* GST Return Filing Toggle & Status */}
                      <td className="py-3.5 px-4 text-center">
                        {inv.gstFiled ? (
                          <button
                            onClick={() => handleOpenGstToggle(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors"
                            title="Click to view or edit GST filing ARN"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>GST Filed</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenGstToggle(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
                            title="Click to mark as filed in GSTR-1"
                          >
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending Return</span>
                          </button>
                        )}
                        {inv.gstFilingArn && (
                          <span className="block text-[9px] font-mono text-slate-400 mt-0.5">
                            ARN: {inv.gstFilingArn}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live Preview Modal */}
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowPreviewModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#0F254B] hover:bg-slate-100"
                            title="Live Preview GKA Format"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Invoice */}
                          <button
                            onClick={() => handleOpenEdit(inv)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#0F254B] hover:bg-slate-100"
                            title="Edit Invoice Details & Line Items"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* PDF Download */}
                          <a
                            href={getFileUrl(`/api/v1/finance/invoices/${inv._id}/pdf`)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-[#0F254B] hover:bg-slate-100 font-bold"
                            title="Download Official PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </a>

                          {/* DOCX Download */}
                          <a
                            href={getFileUrl(`/api/v1/finance/invoices/${inv._id}/docx`)}
                            className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 font-bold"
                            title="Download Editable DOCX"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>

                          {/* Share via WhatsApp & Mail */}
                          <button
                            type="button"
                            onClick={() => {
                              setShareInvoice(inv);
                              setShowShareModal(true);
                            }}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold"
                            title="Share via WhatsApp & Mail"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* 5. Live Document Preview Modal */}
      {showPreviewModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-[#0F254B]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-900 text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <DocumentVisualView
              type="invoice"
              data={selectedInvoice}
              onDownloadPdf={() =>
                downloadFile(
                  `/finance/invoices/${selectedInvoice._id}/pdf`,
                  `GKA_Invoice_${selectedInvoice.invoiceNumber}.pdf`,
                  true
                )
              }
              onDownloadDocx={() =>
                downloadFile(
                  `/finance/invoices/${selectedInvoice._id}/docx`,
                  `GKA_Invoice_${selectedInvoice.invoiceNumber}.docx`,
                  false
                )
              }
            />
          </div>
        </div>
      )}

      {/* 6. GST Return Toggle Modal */}
      {showGstModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-[#0F254B]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-heading font-bold text-[#0F254B] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>GST Return Filing Status ({selectedInvoice.invoiceNumber})</span>
              </h3>
              <button onClick={() => setShowGstModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600">
              Update statutory filing state for GSTIN: <strong>33CDYPA3555M2ZZ</strong>. Marking this invoice as filed connects directly with the GST & Finance reconciliation ledger.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tax Accounting Period
                </label>
                <input
                  type="text"
                  value={gstModalPeriod}
                  onChange={(e) => setGstModalPeriod(e.target.value)}
                  placeholder="e.g. 2026-10"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Filing Acknowledgement Number (ARN)
                </label>
                <input
                  type="text"
                  value={gstModalArn}
                  onChange={(e) => setGstModalArn(e.target.value)}
                  placeholder="e.g. AA3310260012345"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                {selectedInvoice.gstFiled ? (
                  <button
                    type="button"
                    onClick={() => handleConfirmGstToggle(false)}
                    disabled={isSubmitting}
                    className="px-3.5 py-2 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold"
                  >
                    Mark as Unfiled
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGstModal(false)}
                    className="px-4 py-2 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmGstToggle(true)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow"
                  >
                    {isSubmitting ? 'Updating...' : 'Save as GST Filed'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. New Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#0F254B]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-heading font-bold text-[#0F254B]">
                Create New Tax Invoice (GKA Construction Format)
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Site *</label>
                <select
                  value={invProject}
                  onChange={(e) => {
                    setInvProject(e.target.value);
                    const p = projects.find((proj) => proj._id === e.target.value);
                    if (p) {
                      setInvClientName(p.clientName || 'Valued Client');
                      setInvBillingAddress(p.siteAddress?.street || 'Kelambakkam, Chennai');
                    }
                  }}
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
                  <label className="block font-semibold text-slate-700 mb-1">Client Contact Person</label>
                  <input
                    type="text"
                    required
                    value={invContactPerson}
                    onChange={(e) => setInvContactPerson(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company / Entity</label>
                  <input
                    type="text"
                    required
                    value={invClientCompany}
                    onChange={(e) => setInvClientCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Site / Billing Address</label>
                <input
                  type="text"
                  required
                  value={invBillingAddress}
                  onChange={(e) => setInvBillingAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Description</label>
                <input
                  type="text"
                  required
                  value={invSubject}
                  onChange={(e) => setInvSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              {/* Items Section */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Bill Items & BOQ Measurements
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {invItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="col-span-6">
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                          Description
                        </label>
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-medium"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                          Qty
                        </label>
                        <input
                          type="number"
                          required
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-center font-bold"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                          Unit
                        </label>
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white uppercase font-bold"
                        >
                          <option value="CFT">CFT</option>
                          <option value="LOT">LOT</option>
                          <option value="SQ.FT">SQ.FT</option>
                          <option value="CU.FT">CU.FT</option>
                          <option value="NOS">NOS</option>
                          <option value="RFT">RFT</option>
                        </select>
                      </div>

                      <div className="col-span-2 flex items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                            Rate (₹)
                          </label>
                          <input
                            type="number"
                            required
                            value={item.unitRateRupees}
                            onChange={(e) => handleItemChange(idx, 'unitRateRupees', e.target.value)}
                            className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-right font-mono font-bold"
                          />
                        </div>
                        {invItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-700 mt-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Negotiated Terms Option in Create Invoice */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50/80 to-orange-50/50 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={invIsNegotiated}
                      onChange={(e) => {
                        setInvIsNegotiated(e.target.checked);
                        if (!e.target.checked) {
                          setInvNegotiatedDiscountRupees(0);
                          setInvNegotiatedNotes('');
                        }
                      }}
                      className="w-4 h-4 text-[#0F254B] rounded border-slate-300 focus:ring-[#0F254B]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>🤝 Negotiated Bill / Agreed Special Settlement</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-200 text-amber-900 font-extrabold uppercase">
                          Discount Option
                        </span>
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        Enable if a special discounted rate or commercial settlement was agreed for this invoice.
                      </span>
                    </div>
                  </label>
                </div>

                {invIsNegotiated && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-amber-200/80">
                    <div>
                      <label className="block text-[10px] text-slate-600 font-semibold mb-1">
                        Negotiated Discount Amount (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={invNegotiatedDiscountRupees === 0 ? '' : invNegotiatedDiscountRupees}
                        onChange={(e) => setInvNegotiatedDiscountRupees(e.target.value === '' ? 0 : Number(e.target.value))}
                        placeholder="e.g. 50000"
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 font-semibold mb-1">
                        Negotiation Notes / Settlement Agreement
                      </label>
                      <input
                        type="text"
                        value={invNegotiatedNotes}
                        onChange={(e) => setInvNegotiatedNotes(e.target.value)}
                        placeholder="e.g. Special client settlement agreed per site meeting"
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white font-medium text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Distinct Bill Terms & Conditions */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bill Terms & Conditions (Distinct from Quotation — will appear on formal Tax Invoice & PDF/DOCX)
                </label>
                <textarea
                  rows={4}
                  value={invTerms}
                  onChange={(e) => setInvTerms(e.target.value)}
                  placeholder="One term per line..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[11px] leading-relaxed"
                />
              </div>

              {/* Live Calculation Display */}
              <div className="p-3 bg-slate-100 rounded-xl space-y-1 text-right font-mono text-xs">
                <div className="text-slate-600">
                  Gross Subtotal: <strong className="text-slate-900">₹ {invSubtotal.toLocaleString('en-IN')}</strong>
                </div>
                {invIsNegotiated && invDiscount > 0 && (
                  <div className="text-emerald-700 font-bold">
                    Less Negotiated Discount: -₹ {invDiscount.toLocaleString('en-IN')}
                  </div>
                )}
                <div className="text-slate-700 font-semibold">
                  Taxable Amount: ₹ {invTaxable.toLocaleString('en-IN')}
                </div>
                <div className="text-slate-600">
                  18% GST (9% CGST + 9% SGST): <strong className="text-slate-900">₹ {invTax.toLocaleString('en-IN')}</strong>
                </div>
                <div className="text-sm font-bold text-[#0F254B] pt-1 border-t border-slate-200">
                  Grand Total: <strong>₹ {invTotal.toLocaleString('en-IN')}</strong>
                </div>
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
                  {isSubmitting ? 'Generating...' : 'Generate & Auto-Download PDF & DOCX'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Convert Approved Quotation Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 bg-[#0F254B]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-heading font-bold text-[#0F254B] flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#D6A21D]" />
                <span>Convert Approved Quotation to Invoice</span>
              </h3>
              <button onClick={() => setShowConvertModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Select an approved quotation to copy its item scope, quantities, rates, and 18% GST calculation into a new sequential Tax Invoice. PDF and DOCX will be automatically generated.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Approved Quotation *</label>
              <select
                value={selectedQuotationId}
                onChange={(e) => setSelectedQuotationId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium"
              >
                {approvedQuotations.map((q) => (
                  <option key={q._id} value={q._id}>
                    {q.quotationNumber} — {q.projectTitle} ({formatINR(q.totalAmountPaise)})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConvertQuotation}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg font-bold bg-[#0F254B] text-white hover:bg-[#1E3A8A] shadow"
              >
                {isSubmitting ? 'Converting...' : 'Convert to Invoice & Auto-Download'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Edit Invoice Modal */}
      {showEditModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-[#0F254B]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-heading font-bold text-[#0F254B] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#D6A21D]" />
                <span>Edit Tax Invoice ({selectedInvoice.invoiceNumber})</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditInvoice} className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                  Link to Project Workspace
                </label>
                <select
                  value={editProjectId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setEditProjectId(pid);
                    if (pid) {
                      const match = projects.find((p) => p._id === pid);
                      if (match) {
                        if (match.siteAddress?.street) {
                          setEditBillingAddress(
                            `${match.siteAddress.street}, ${match.siteAddress.city || ''}`.trim()
                          );
                        }
                      }
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                >
                  <option value="">-- Unlinked / Standalone Invoice --</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.projectId} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">Invoice #</label>
                  <input
                    type="text"
                    required
                    value={editInvoiceNumber}
                    onChange={(e) => setEditInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold capitalize text-slate-900"
                  >
                    <option value="draft">Draft</option>
                    <option value="issued">Issued</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={editIssueDate}
                    onChange={(e) => setEditIssueDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">Client Contact Person</label>
                  <input
                    type="text"
                    value={editContactPerson}
                    onChange={(e) => setEditContactPerson(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">Company / Entity</label>
                  <input
                    type="text"
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">Client Name</label>
                  <input
                    type="text"
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">Site / Billing Address</label>
                  <input
                    type="text"
                    value={editBillingAddress}
                    onChange={(e) => setEditBillingAddress(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">Subject Scope</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Bill Line Items & Measurements
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setEditItems([
                        ...editItems,
                        { description: 'Additional Construction Scope', quantity: 1, unit: 'CFT', unitRateRupees: 1000 },
                      ])
                    }
                    className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="col-span-6">
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                          Description
                        </label>
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...editItems];
                            updated[idx].description = e.target.value;
                            setEditItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-medium"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                          Qty
                        </label>
                        <input
                          type="number"
                          required
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...editItems];
                            updated[idx].quantity = e.target.value;
                            setEditItems(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-center font-bold"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                          Unit
                        </label>
                        <select
                          value={item.unit}
                          onChange={(e) => {
                            const updated = [...editItems];
                            updated[idx].unit = e.target.value;
                            setEditItems(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white uppercase font-bold"
                        >
                          <option value="CFT">CFT</option>
                          <option value="LOT">LOT</option>
                          <option value="SQ.FT">SQ.FT</option>
                          <option value="CU.FT">CU.FT</option>
                          <option value="NOS">NOS</option>
                          <option value="RFT">RFT</option>
                        </select>
                      </div>

                      <div className="col-span-2 flex items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                            Rate (₹)
                          </label>
                          <input
                            type="number"
                            required
                            value={item.unitRateRupees}
                            onChange={(e) => {
                              const updated = [...editItems];
                              updated[idx].unitRateRupees = e.target.value;
                              setEditItems(updated);
                            }}
                            className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-right font-mono font-bold"
                          />
                        </div>
                        {editItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:text-rose-700 mt-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paid Receipts & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                    Direct Paid Receipts / Advance (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editPaidAmountRupees === 0 ? '' : editPaidAmountRupees}
                    onChange={(e) => setEditPaidAmountRupees(e.target.value === '' ? 0 : Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-emerald-800"
                  />
                  <span className="block text-[9px] text-slate-400 mt-0.5">
                    Remaining balance due: ₹ {Math.max(0, editInvTotal - editPaidAmountRupees).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                    Invoice Notes & Payment Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Negotiated Terms Option in Edit Invoice */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50/80 to-orange-50/50 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editIsNegotiated}
                      onChange={(e) => {
                        setEditIsNegotiated(e.target.checked);
                        if (!e.target.checked) {
                          setEditNegotiatedDiscountRupees(0);
                          setEditNegotiatedNotes('');
                        }
                      }}
                      className="w-4 h-4 text-[#0F254B] rounded border-slate-300 focus:ring-[#0F254B]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>🤝 Negotiated Bill / Special Agreed Settlement</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-200 text-amber-900 font-extrabold uppercase">
                          Discount Option
                        </span>
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        Enable if a special discounted rate or commercial settlement was agreed for this bill.
                      </span>
                    </div>
                  </label>
                </div>

                {editIsNegotiated && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-amber-200/80">
                    <div>
                      <label className="block text-[10px] text-slate-600 font-semibold mb-1">
                        Negotiated Discount Amount (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editNegotiatedDiscountRupees === 0 ? '' : editNegotiatedDiscountRupees}
                        onChange={(e) => setEditNegotiatedDiscountRupees(e.target.value === '' ? 0 : Number(e.target.value))}
                        placeholder="e.g. 50000"
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white font-mono font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 font-semibold mb-1">
                        Negotiation Notes / Settlement Agreement
                      </label>
                      <input
                        type="text"
                        value={editNegotiatedNotes}
                        onChange={(e) => setEditNegotiatedNotes(e.target.value)}
                        placeholder="e.g. Special client settlement agreed per site meeting"
                        className="w-full px-3 py-1.5 rounded-lg border border-amber-300 bg-white font-medium text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Distinct Bill Terms & Conditions in Edit */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bill Terms & Conditions (Distinct from Quotation — will appear on formal Tax Invoice & PDF/DOCX)
                </label>
                <textarea
                  rows={4}
                  value={editTerms}
                  onChange={(e) => setEditTerms(e.target.value)}
                  placeholder="One term per line..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[11px] leading-relaxed"
                />
              </div>

              {/* Live Calculation Display */}
              <div className="p-3 bg-slate-100 rounded-xl space-y-1 text-right font-mono text-xs">
                <div className="text-slate-600">
                  Gross Subtotal: <strong className="text-slate-900">₹ {editInvSubtotal.toLocaleString('en-IN')}</strong>
                </div>
                {editIsNegotiated && editInvDiscount > 0 && (
                  <div className="text-emerald-700 font-bold">
                    Less Negotiated Discount: -₹ {editInvDiscount.toLocaleString('en-IN')}
                  </div>
                )}
                <div className="text-slate-700 font-semibold">
                  Taxable Amount: ₹ {editInvTaxable.toLocaleString('en-IN')}
                </div>
                <div className="text-slate-600">
                  18% GST (9% CGST + 9% SGST): <strong className="text-slate-900">₹ {editInvTax.toLocaleString('en-IN')}</strong>
                </div>
                <div className="text-sm font-bold text-[#0F254B] pt-1 border-t border-slate-200">
                  Grand Total (Inc. 18% GST): <strong>₹ {editInvTotal.toLocaleString('en-IN')}</strong>
                </div>
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
                  {isSubmitting ? 'Saving...' : 'Save Bill Changes'}
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
