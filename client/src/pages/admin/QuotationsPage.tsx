import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Calculator,
  Plus,
  FileDown,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Sparkles,
  Search,
  Eye,
  FileText,
  RotateCcw,
  X,
  Printer,
  Share2,
  Edit3,
} from 'lucide-react';
import { api, downloadFile, getFileUrl } from '../../services/api';
import { formatINR, toPaise, toRupees } from '@shared/types';
import { STANDARD_RATE_LIBRARY } from '@shared/constants';
import { DocumentVisualView } from '../../components/documents/DocumentVisualView';
import { ShareDocumentModal } from '../../components/common/ShareDocumentModal';

export const QuotationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareQuotation, setShareQuotation] = useState<any>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recycle Bin State
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [recycleQuotations, setRecycleQuotations] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [permanentDeletingId, setPermanentDeletingId] = useState<string | null>(null);

  // New Quotation form state (clean live application default)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [quotationNumber, setQuotationNumber] = useState('GKA-QUO-2026-001');
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientGstin, setClientGstin] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [subject, setSubject] = useState('');
  const [senderName, setSenderName] = useState('Arivazhagan');
  const [senderCompany, setSenderCompany] = useState('GKA CONSTRUCTION');
  const [isNegotiated, setIsNegotiated] = useState(false);
  const [negotiatedDiscountRupees, setNegotiatedDiscountRupees] = useState<number>(0);
  const [negotiatedNotes, setNegotiatedNotes] = useState<string>('');

  // Edit Quotation form state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<any>(null);
  const [editProjectId, setEditProjectId] = useState<string>('');
  const [editQuotationNumber, setEditQuotationNumber] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editClientCompany, setEditClientCompany] = useState('');
  const [editClientGstin, setEditClientGstin] = useState('');
  const [editProjectTitle, setEditProjectTitle] = useState('');
  const [editSiteLocation, setEditSiteLocation] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editSenderName, setEditSenderName] = useState('Arivazhagan');
  const [editSenderCompany, setEditSenderCompany] = useState('GKA CONSTRUCTION');
  const [editStatus, setEditStatus] = useState('draft');
  const [editIsNegotiated, setEditIsNegotiated] = useState(false);
  const [editNegotiatedDiscountRupees, setEditNegotiatedDiscountRupees] = useState<number>(0);
  const [editNegotiatedNotes, setEditNegotiatedNotes] = useState<string>('');
  const [editItems, setEditItems] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([
    {
      description: 'Civil Construction & Finishing Works',
      category: 'civil',
      unit: 'sq.ft',
      quantity: 0,
      unitRateRupees: 0,
    },
  ]);

  const fetchQuotationsAndProjects = async () => {
    try {
      setLoading(true);
      const [quoRes, projRes, recRes] = await Promise.all([
        api.getQuotations(),
        api.getProjects().catch(() => ({ success: false, projects: [] })),
        api.getQuotations({ deleted: 'true' }).catch(() => ({ success: false, quotations: [] })),
      ]);
      if (quoRes.success) {
        setQuotations(quoRes.quotations);
      }
      if (projRes.success && Array.isArray(projRes.projects)) {
        setProjects(projRes.projects);
      }
      if (recRes.success && Array.isArray(recRes.quotations)) {
        setRecycleQuotations(recRes.quotations);
      }
    } catch (error) {
      console.error('Error fetching quotations & projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotationsAndProjects();
  }, []);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && quotations.length > 0) {
      const target = quotations.find((q) => q._id === editId);
      if (target) {
        handleOpenEditQuotation(target);
      }
    }
    const projIdParam = searchParams.get('projectId');
    if (projIdParam && projects.length > 0) {
      setSelectedProjectId(projIdParam);
      const matched = projects.find((p) => p._id === projIdParam);
      if (matched) {
        setProjectTitle(matched.title || '');
        setSiteLocation(
          `${matched.siteAddress?.street || ''}, ${matched.siteAddress?.city || ''}`.trim()
        );
        if (matched.clientName) setClientName(matched.clientName);
        const gst = (matched.clientId as any)?.billingAddress?.gstin || (matched.clientId as any)?.gstin || '';
        if (gst) setClientGstin(gst);
      }
      setShowModal(true);
    }
  }, [searchParams, quotations, projects]);

  const handleAddItem = (preset?: any) => {
    if (preset) {
      setItems([
        ...items,
        {
          description: preset.description,
          category: preset.category,
          unit: preset.unit || 'sq.ft',
          quantity: 0,
          unitRateRupees: preset.unitRateRupees || 0,
        },
      ]);
    } else {
      setItems([
        ...items,
        {
          description: '',
          category: 'civil',
          unit: 'sq.ft',
          quantity: 0,
          unitRateRupees: 0,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculateSubtotal = () => {
    return items.reduce(
      (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitRateRupees) || 0),
      0
    );
  };

  const subtotal = calculateSubtotal();
  const discountRupees = isNegotiated ? Math.max(0, Number(negotiatedDiscountRupees) || 0) : 0;
  const taxableAmount = Math.max(0, subtotal - discountRupees);
  const taxAmount = Math.round(taxableAmount * 0.18);
  const grandTotal = taxableAmount + taxAmount;

  // Auto download helper (downloads official PDF directly)
  const triggerAutoDownloads = async (quotationId: string, quoNum: string) => {
    try {
      await downloadFile(`/quotations/${quotationId}/pdf`, `GKA_Quotation_${quoNum}.pdf`, true);
    } catch (err) {
      console.error('Auto-download PDF error:', err);
    }
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const enquiry = await api.createEnquiry({
        name: clientName,
        phone: '8838030917',
        siteLocation,
        projectCategory: 'commercial',
        source: 'direct',
      });

      const convertedItems = items.map((it, idx) => ({
        id: `item-${idx + 1}`,
        description: it.description,
        category: it.category || 'civil',
        unit: it.unit || 'CFT',
        quantity: Number(it.quantity) || 1,
        unitRatePaise: toPaise(Number(it.unitRateRupees) || 0),
      }));

      const res = await api.createQuotation({
        quotationNumber,
        projectId: selectedProjectId || undefined,
        clientId: enquiry.leadId,
        clientName,
        clientContactPerson: clientName,
        clientCompany,
        clientGstin: clientGstin.trim() || undefined,
        clientAddress: siteLocation,
        projectTitle,
        siteLocation,
        subject,
        senderName,
        senderCompany,
        items: convertedItems,
        taxRatePercent: 18,
        isNegotiated,
        negotiatedDiscountPaise: isNegotiated ? toPaise(Number(negotiatedDiscountRupees) || 0) : 0,
        negotiatedNotes: isNegotiated ? negotiatedNotes : undefined,
      });

      if (res.success && res.quotation) {
        setShowModal(false);
        fetchQuotationsAndProjects();
        triggerAutoDownloads(res.quotation._id, res.quotation.quotationNumber);
      }
    } catch (err: any) {
      alert(err.message || 'Error generating quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveQuotation = async (quotationId: string) => {
    try {
      setApprovingId(quotationId);
      const res = await api.approveQuotation(quotationId);
      if (res.success) {
        fetchQuotations();
      }
    } catch (err: any) {
      alert(err.message || 'Error approving quotation');
    } finally {
      setApprovingId(null);
    }
  };

  const handleConvertToInvoice = async (quotationId: string) => {
    try {
      setConvertingId(quotationId);
      const res = await api.convertQuotationToInvoice(quotationId);
      if (res.success && res.invoice) {
        alert(`Quotation successfully converted to Tax Invoice ${res.invoice.invoiceNumber}.`);
        fetchQuotations();
        // Trigger auto downloads
        window.open(`/api/v1/finance/invoices/${res.invoice._id}/pdf`, '_blank');
      }
    } catch (err: any) {
      alert(err.message || 'Error converting quotation to invoice');
    } finally {
      setConvertingId(null);
    }
  };

  const handleDeleteQuotation = async (quotation: any) => {
    if (
      !window.confirm(
        `Move Quotation "${quotation.quotationNumber}" to Recycle Bin?\n\nIt will be preserved in the Recycle Bin for 30 days before being automatically removed permanently. You can restore it anytime.`
      )
    ) {
      return;
    }
    try {
      setDeletingId(quotation._id);
      const res = await api.deleteQuotation(quotation._id);
      if (res.success) {
        fetchQuotationsAndProjects();
      }
    } catch (err: any) {
      alert(err.message || 'Error moving quotation to recycle bin');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestoreQuotation = async (quotationId: string) => {
    try {
      setRestoringId(quotationId);
      const res = await api.restoreQuotation(quotationId);
      if (res.success) {
        fetchQuotationsAndProjects();
      }
    } catch (err: any) {
      alert(err.message || 'Error restoring quotation');
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDeleteQuotation = async (quotation: any) => {
    if (
      !window.confirm(
        `PERMANENTLY DELETE Quotation "${quotation.quotationNumber}"?\n\n⚠️ WARNING: This will permanently erase this quotation from the database immediately. This action CANNOT be undone!`
      )
    ) {
      return;
    }
    try {
      setPermanentDeletingId(quotation._id);
      const res = await api.permanentDeleteQuotation(quotation._id);
      if (res.success) {
        fetchQuotationsAndProjects();
      }
    } catch (err: any) {
      alert(err.message || 'Error permanently deleting quotation');
    } finally {
      setPermanentDeletingId(null);
    }
  };

  // Open Edit Quotation Modal
  const handleOpenEditQuotation = (q: any) => {
    setEditingQuotation(q);
    setEditProjectId(
      q.projectId?._id || (typeof q.projectId === 'string' ? q.projectId : '')
    );
    setEditQuotationNumber(q.quotationNumber || '');
    setEditClientName(q.clientName || '');
    setEditClientCompany(q.clientCompany || '');
    setEditClientGstin(q.clientGstin || (q.clientId as any)?.billingAddress?.gstin || (q.clientId as any)?.gstin || '');
    setEditProjectTitle(q.projectTitle || '');
    setEditSiteLocation(q.siteLocation || q.clientAddress || '');
    setEditSubject(q.subject || '');
    setEditSenderName(q.senderName || 'Arivazhagan');
    setEditSenderCompany(q.senderCompany || 'GKA CONSTRUCTION');
    setEditStatus(q.status || 'draft');
    setEditIsNegotiated(Boolean(q.isNegotiated));
    setEditNegotiatedDiscountRupees(toRupees(q.negotiatedDiscountPaise || q.discountPaise || 0));
    setEditNegotiatedNotes(q.negotiatedNotes || '');
    setEditItems(
      (q.items || []).map((it: any) => ({
        description: it.description || '',
        category: it.category || 'civil',
        unit: it.unit || 'CFT',
        quantity: it.quantity || 1,
        unitRateRupees: toRupees(it.unitRatePaise || 0),
      }))
    );
    setShowEditModal(true);
  };

  const calculateEditSubtotal = () => {
    return editItems.reduce(
      (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitRateRupees) || 0),
      0
    );
  };

  const handleEditItemChange = (index: number, field: string, value: any) => {
    const updated = [...editItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditItems(updated);
  };

  const handleAddEditItem = (preset?: any) => {
    if (preset) {
      setEditItems([
        ...editItems,
        {
          description: preset.description,
          category: preset.category || 'civil',
          unit: preset.unit || 'sq.ft',
          quantity: 1,
          unitRateRupees: preset.unitRateRupees || 0,
        },
      ]);
    } else {
      setEditItems([
        ...editItems,
        {
          description: '',
          category: 'civil',
          unit: 'sq.ft',
          quantity: 1,
          unitRateRupees: 0,
        },
      ]);
    }
  };

  const handleRemoveEditItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const editSubtotal = calculateEditSubtotal();
  const editDiscountRupees = editIsNegotiated ? Math.max(0, Number(editNegotiatedDiscountRupees) || 0) : 0;
  const editTaxableAmount = Math.max(0, editSubtotal - editDiscountRupees);
  const editTaxAmount = Math.round(editTaxableAmount * 0.18);
  const editGrandTotal = editTaxableAmount + editTaxAmount;

  const handleSaveEditQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuotation) return;
    setIsSubmitting(true);
    try {
      const convertedItems = editItems.map((it, idx) => ({
        id: `item-${idx + 1}`,
        description: it.description,
        category: it.category || 'civil',
        unit: it.unit || 'CFT',
        quantity: Number(it.quantity) || 1,
        unitRatePaise: toPaise(Number(it.unitRateRupees) || 0),
      }));

      const res = await api.updateQuotation(editingQuotation._id, {
        quotationNumber: editQuotationNumber,
        projectId: editProjectId || null,
        clientName: editClientName,
        clientContactPerson: editClientName,
        clientCompany: editClientCompany,
        clientGstin: editClientGstin.trim() || undefined,
        clientAddress: editSiteLocation,
        projectTitle: editProjectTitle,
        siteLocation: editSiteLocation,
        subject: editSubject,
        senderName: editSenderName,
        senderCompany: editSenderCompany,
        status: editStatus,
        items: convertedItems,
        taxRatePercent: 18,
        isNegotiated: editIsNegotiated,
        negotiatedDiscountPaise: editIsNegotiated ? toPaise(Number(editNegotiatedDiscountRupees) || 0) : 0,
        negotiatedNotes: editIsNegotiated ? editNegotiatedNotes : '',
      });

      if (res.success) {
        setShowEditModal(false);
        setEditingQuotation(null);
        fetchQuotationsAndProjects();
      }
    } catch (err: any) {
      alert(err.message || 'Error updating quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-[#0F254B] flex items-center gap-2.5">
            <span>Estimates & Quotations Engine</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D6A21D]/20 text-[#0F254B] border border-[#D6A21D]/40">
              GKA Luxury Template
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            BOQ preparation, exact reference image layout, automated PDF and editable DOCX generation, and one-click invoice conversion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0F254B] text-white hover:bg-[#1E3A8A] transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-[#D6A21D]" />
            <span>New Quotation</span>
          </button>
        </div>
      </div>

      {/* View Tabs: Active Quotations vs Recycle Bin */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRecycleBin(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              !showRecycleBin
                ? 'bg-[#0F254B] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Active Quotations ({quotations.length})</span>
          </button>
          <button
            onClick={() => setShowRecycleBin(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              showRecycleBin
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Recycle Bin ({recycleQuotations.length})</span>
          </button>
        </div>

        {showRecycleBin && (
          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 flex items-center gap-1.5">
            <span>⏱️ 30-Day Auto Permanent Purge Active</span>
          </span>
        )}
      </div>

      {/* Quotations List or Recycle Bin */}
      {!showRecycleBin ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading quotations...</div>
          ) : quotations.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No active quotations generated yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Quotation #</th>
                    <th className="py-3.5 px-4">Client & Subject Scope</th>
                    <th className="py-3.5 px-4">Items Count</th>
                    <th className="py-3.5 px-4 font-mono">Grand Total (Inc. 18% GST)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">PDF, DOCX & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotations.map((q) => (
                    <tr key={q._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0F254B]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{q.quotationNumber}</span>
                          {q.isNegotiated && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              🤝 Negotiated
                            </span>
                          )}
                        </div>
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Rev #{q.revisionNumber} • {new Date(q.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 block">{q.projectTitle}</strong>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-500 text-[11px]">
                            {q.clientCompany || q.clientName}
                          </span>
                          {(q.clientGstin || q.clientId?.billingAddress?.gstin || q.clientId?.gstin) && (
                            <span className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-900 border border-blue-200 font-mono text-[9px] font-bold">
                              GST: {q.clientGstin || q.clientId?.billingAddress?.gstin || q.clientId?.gstin}
                            </span>
                          )}
                        </div>
                        {q.projectId ? (
                          <Link
                            to={`/admin/projects/${q.projectId?._id || q.projectId}?tab=quotations`}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline mt-0.5"
                          >
                            <span>Open Project Workspace</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        ) : (
                          <span className="text-[10px] text-slate-400 block mt-0.5">Standalone / Unlinked</span>
                        )}
                        {q.subject && (
                          <span className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">
                            "{q.subject}"
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-semibold">
                        {q.items?.length || 0} scope items
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-sm text-[#0F254B]">
                        {formatINR(q.totalAmountPaise)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                            q.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {q.status}
                        </span>
                        {q.convertedToBudget && (
                          <span className="block text-[10px] text-emerald-600 font-semibold mt-0.5">
                            ✓ Linked to Project
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live Preview Button */}
                          <button
                            onClick={() => {
                              setSelectedQuotation(q);
                              setShowPreviewModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#0F254B] hover:bg-slate-100"
                            title="Live Preview GKA Format"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Quotation Button */}
                          <button
                            onClick={() => handleOpenEditQuotation(q)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#0F254B] hover:bg-slate-100"
                            title="Edit Quotation Parameters & Line Items"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* PDF Download */}
                          <a
                            href={getFileUrl(`/api/v1/quotations/${q._id}/pdf`)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-[#0F254B] hover:bg-slate-100 font-bold"
                            title="Download Official PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </a>

                          {/* DOCX Download */}
                          <a
                            href={getFileUrl(`/api/v1/quotations/${q._id}/docx`)}
                            className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 font-bold"
                            title="Download Editable DOCX"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>

                          {/* Share via WhatsApp & Mail */}
                          <button
                            type="button"
                            onClick={() => {
                              setShareQuotation(q);
                              setShowShareModal(true);
                            }}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold"
                            title="Share via WhatsApp & Mail"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Approve or Convert */}
                          {q.status !== 'approved' ? (
                            <button
                              onClick={() => handleApproveQuotation(q._id)}
                              disabled={approvingId === q._id}
                              className="px-2.5 py-1 rounded text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            >
                              {approvingId === q._id ? 'Approving...' : 'Approve'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleConvertToInvoice(q._id)}
                              disabled={convertingId === q._id}
                              className="px-2.5 py-1 rounded text-[11px] font-bold bg-[#0F254B] hover:bg-[#1E3A8A] text-white shadow-sm flex items-center gap-1"
                              title="Convert approved quotation to sequential tax invoice"
                            >
                              <ArrowRight className="w-3 h-3 text-[#D6A21D]" />
                              <span>{convertingId === q._id ? 'Converting...' : 'To Invoice'}</span>
                            </button>
                          )}

                          {/* Delete to Recycle Bin */}
                          <button
                            type="button"
                            onClick={() => handleDeleteQuotation(q)}
                            disabled={deletingId === q._id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Move to Recycle Bin (Stored safely for 30 days before auto-purge)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Recycle Bin Notice Banner */}
          <div className="p-4 bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 rounded-xl text-rose-700 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-rose-950 block font-heading text-sm">
                  Quotation Recycle Bin (30-Day Auto Purge Policy)
                </strong>
                <p className="text-rose-800 mt-0.5 leading-relaxed">
                  Quotations moved to the Recycle Bin are safely stored here for <strong>30 days</strong>. If not restored within 30 days, they will be <strong>automatically and permanently erased</strong> by the database scheduler. You can restore them anytime or erase them immediately.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-200 text-rose-900 font-bold font-mono text-[11px] shrink-0 border border-rose-300">
              {recycleQuotations.length} in bin
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading recycle bin...</div>
            ) : recycleQuotations.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Recycle Bin is empty. No deleted quotations.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Quotation #</th>
                      <th className="py-3.5 px-4">Client & Work Scope</th>
                      <th className="py-3.5 px-4 font-mono">Amount</th>
                      <th className="py-3.5 px-4 text-center">Auto-Purge Timeline</th>
                      <th className="py-3.5 px-4 text-right">Recycle Bin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recycleQuotations.map((q) => {
                      const deletedTime = new Date(q.deletedAt || q.updatedAt).getTime();
                      const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - deletedTime) / (1000 * 60 * 60 * 24)));
                      return (
                        <tr key={q._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#0F254B]">
                            <span>{q.quotationNumber}</span>
                            <span className="block text-[10px] text-slate-400 font-normal">
                              Deleted: {new Date(q.deletedAt || q.updatedAt).toLocaleDateString('en-IN')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <strong className="text-slate-900 block">{q.projectTitle}</strong>
                            <span className="text-slate-500 text-[11px] block">{q.clientCompany || q.clientName}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-sm text-[#0F254B]">
                            {formatINR(q.totalAmountPaise)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${
                                daysLeft <= 5
                                  ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                            >
                              ⏳ Purges in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleRestoreQuotation(q._id)}
                                disabled={restoringId === q._id}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
                                title="Restore quotation back to active list"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{restoringId === q._id ? 'Restoring...' : 'Restore'}</span>
                              </button>
                              <button
                                onClick={() => handlePermanentDeleteQuotation(q)}
                                disabled={permanentDeletingId === q._id}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 flex items-center gap-1.5"
                                title="Permanently erase from database immediately"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{permanentDeletingId === q._id ? 'Erasing...' : 'Delete Permanently'}</span>
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
        </div>
      )}

      {/* Live Visual Preview Modal */}
      {showPreviewModal && selectedQuotation && (
        <div className="fixed inset-0 z-50 bg-[#0F254B]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-900 text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <DocumentVisualView
              type="quotation"
              data={selectedQuotation}
              onDownloadPdf={() =>
                downloadFile(
                  `/quotations/${selectedQuotation._id}/pdf`,
                  `GKA_Quotation_${selectedQuotation.quotationNumber}.pdf`,
                  true
                )
              }
              onDownloadDocx={() =>
                downloadFile(
                  `/quotations/${selectedQuotation._id}/docx`,
                  `GKA_Quotation_${selectedQuotation.quotationNumber}.docx`,
                  false
                )
              }
            />
          </div>
        </div>
      )}

      {/* New Quotation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#0F254B]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-heading font-bold text-[#0F254B]">
                Generate Quotation (Reference Image Layout)
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Link to Project Workspace
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setSelectedProjectId(pid);
                    if (pid) {
                      const match = projects.find((p) => p._id === pid);
                      if (match) {
                        setProjectTitle(match.title || '');
                        setSiteLocation(
                          `${match.siteAddress?.street || ''}, ${match.siteAddress?.city || ''}`.trim()
                        );
                        if (match.clientName) setClientName(match.clientName);
                        const gst = (match.clientId as any)?.billingAddress?.gstin || (match.clientId as any)?.gstin || '';
                        setClientGstin(gst);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                >
                  <option value="">-- Unlinked / Standalone Quotation --</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.projectId} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quotation Number *</label>
                  <input
                    type="text"
                    required
                    value={quotationNumber}
                    onChange={(e) => setQuotationNumber(e.target.value)}
                    placeholder="e.g. 0910VIVA"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Work Scope *</label>
                  <input
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. THE CHIEF ENGINEER"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client Hotel / Entity *</label>
                  <input
                    type="text"
                    required
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="e.g. VIVANTHA HOTEL"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Site Location & City *</label>
                  <input
                    type="text"
                    required
                    value={siteLocation}
                    onChange={(e) => setSiteLocation(e.target.value)}
                    placeholder="e.g. SHOLINGANALUR, CHENNAI."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Client GSTIN (Auto-loaded if saved)
                  </label>
                  <input
                    type="text"
                    value={clientGstin}
                    onChange={(e) => setClientGstin(e.target.value)}
                    placeholder="e.g. 33AAAAA0000A1Z5"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase font-bold text-[#0F254B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Line *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              {/* Items Section */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Quotation Line Items & Measurements
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
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
                        {items.length > 1 && (
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

              {/* Negotiated Terms Option */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50/80 to-orange-50/50 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isNegotiated}
                      onChange={(e) => {
                        setIsNegotiated(e.target.checked);
                        if (!e.target.checked) {
                          setNegotiatedDiscountRupees(0);
                          setNegotiatedNotes('');
                        }
                      }}
                      className="w-4 h-4 text-[#0F254B] rounded border-slate-300 focus:ring-[#0F254B]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>🤝 Mark as Negotiated Quotation</span>
                        <span className="text-[10px] font-normal text-slate-500">(Apply negotiated pricing & special discount)</span>
                      </span>
                    </div>
                  </label>
                  {isNegotiated && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                      Negotiated Active
                    </span>
                  )}
                </div>

                {isNegotiated && (
                  <div className="mt-3 pt-3 border-t border-amber-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Agreed Negotiated Discount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={negotiatedDiscountRupees === 0 ? '' : negotiatedDiscountRupees}
                        onChange={(e) => setNegotiatedDiscountRupees(e.target.value === '' ? 0 : Number(e.target.value))}
                        placeholder="e.g. 25000"
                        className="w-full px-2.5 py-1.5 rounded border border-amber-300 bg-white font-mono font-bold text-slate-900 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Negotiated Agreement Notes / Terms
                      </label>
                      <input
                        type="text"
                        value={negotiatedNotes}
                        onChange={(e) => setNegotiatedNotes(e.target.value)}
                        placeholder="e.g. Special executive management discount agreed on 28-Oct-2026"
                        className="w-full px-2.5 py-1.5 rounded border border-amber-300 bg-white font-medium text-slate-900 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Total Calculation Display */}
              <div className="p-3 bg-slate-100 rounded-xl space-y-1 text-right font-mono text-xs">
                <div className="text-slate-600">
                  Subtotal: <strong className="text-slate-900">₹ {subtotal.toLocaleString('en-IN')}</strong>
                </div>
                {isNegotiated && discountRupees > 0 && (
                  <div className="text-amber-800 font-semibold">
                    Less Negotiated Discount: <strong className="text-amber-900">- ₹ {discountRupees.toLocaleString('en-IN')}</strong>
                  </div>
                )}
                {isNegotiated && discountRupees > 0 && (
                  <div className="text-slate-600">
                    Taxable Amount: <strong className="text-slate-900">₹ {taxableAmount.toLocaleString('en-IN')}</strong>
                  </div>
                )}
                <div className="text-slate-600">
                  18% GST: <strong className="text-slate-900">₹ {taxAmount.toLocaleString('en-IN')}</strong>
                </div>
                <div className="text-sm font-bold text-[#0F254B]">
                  Grand Total: <strong>₹ {grandTotal.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg font-bold bg-[#0F254B] text-white hover:bg-[#1E3A8A] shadow"
                >
                  {isSubmitting ? 'Generating...' : 'Generate & Auto-Download PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Quotation Modal */}
      {showEditModal && editingQuotation && (
        <div className="fixed inset-0 z-50 bg-[#0F254B]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-heading font-bold text-[#0F254B] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#D6A21D]" />
                <span>Edit Quotation ({editQuotationNumber})</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditQuotation} className="space-y-4">
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
                        setEditProjectTitle(match.title || '');
                        if (match.siteAddress?.street) {
                          setEditSiteLocation(
                            `${match.siteAddress.street}, ${match.siteAddress.city || ''}`.trim()
                          );
                        }
                      }
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
                >
                  <option value="">-- Unlinked / Standalone Quotation --</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.projectId} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                    Quotation #
                  </label>
                  <input
                    type="text"
                    required
                    value={editQuotationNumber}
                    onChange={(e) => setEditQuotationNumber(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                    Quotation Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold capitalize text-slate-900"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="revised">Revised</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                    Project Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editProjectTitle}
                    onChange={(e) => setEditProjectTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                    Client / Contact Person
                  </label>
                  <input
                    type="text"
                    required
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                    Client Company Name
                  </label>
                  <input
                    type="text"
                    value={editClientCompany}
                    onChange={(e) => setEditClientCompany(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                    Site Location / Address
                  </label>
                  <input
                    type="text"
                    required
                    value={editSiteLocation}
                    onChange={(e) => setEditSiteLocation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                    Client GSTIN
                  </label>
                  <input
                    type="text"
                    value={editClientGstin}
                    onChange={(e) => setEditClientGstin(e.target.value)}
                    placeholder="33AAAAA0000A1Z5"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono uppercase font-bold text-[#0F254B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                  Subject Scope
                </label>
                <input
                  type="text"
                  required
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-medium text-slate-900"
                />
              </div>

              {/* Items Section */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Quotation Line Items & Measurements
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddEditItem()}
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
                          onChange={(e) => handleEditItemChange(idx, 'description', e.target.value)}
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
                          onChange={(e) => handleEditItemChange(idx, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-center font-bold"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                          Unit
                        </label>
                        <select
                          value={item.unit}
                          onChange={(e) => handleEditItemChange(idx, 'unit', e.target.value)}
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
                            onChange={(e) => handleEditItemChange(idx, 'unitRateRupees', e.target.value)}
                            className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white text-right font-mono font-bold"
                          />
                        </div>
                        {editItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditItem(idx)}
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

              {/* Negotiated Terms Option in Edit */}
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
                        <span>🤝 Mark as Negotiated Quotation</span>
                        <span className="text-[10px] font-normal text-slate-500">(Apply negotiated pricing & special discount)</span>
                      </span>
                    </div>
                  </label>
                  {editIsNegotiated && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                      Negotiated Active
                    </span>
                  )}
                </div>

                {editIsNegotiated && (
                  <div className="mt-3 pt-3 border-t border-amber-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Agreed Negotiated Discount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editNegotiatedDiscountRupees === 0 ? '' : editNegotiatedDiscountRupees}
                        onChange={(e) => setEditNegotiatedDiscountRupees(e.target.value === '' ? 0 : Number(e.target.value))}
                        placeholder="e.g. 25000"
                        className="w-full px-2.5 py-1.5 rounded border border-amber-300 bg-white font-mono font-bold text-slate-900 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                        Negotiated Agreement Notes / Terms
                      </label>
                      <input
                        type="text"
                        value={editNegotiatedNotes}
                        onChange={(e) => setEditNegotiatedNotes(e.target.value)}
                        placeholder="e.g. Special executive management discount agreed on 28-Oct-2026"
                        className="w-full px-2.5 py-1.5 rounded border border-amber-300 bg-white font-medium text-slate-900 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Total Calculation Display */}
              <div className="p-3 bg-slate-100 rounded-xl space-y-1 text-right font-mono text-xs">
                <div className="text-slate-600">
                  Subtotal: <strong className="text-slate-900">₹ {editSubtotal.toLocaleString('en-IN')}</strong>
                </div>
                {editIsNegotiated && editDiscountRupees > 0 && (
                  <div className="text-amber-800 font-semibold">
                    Less Negotiated Discount: <strong className="text-amber-900">- ₹ {editDiscountRupees.toLocaleString('en-IN')}</strong>
                  </div>
                )}
                {editIsNegotiated && editDiscountRupees > 0 && (
                  <div className="text-slate-600">
                    Taxable Amount: <strong className="text-slate-900">₹ {editTaxableAmount.toLocaleString('en-IN')}</strong>
                  </div>
                )}
                <div className="text-slate-600">
                  18% GST: <strong className="text-slate-900">₹ {editTaxAmount.toLocaleString('en-IN')}</strong>
                </div>
                <div className="text-sm font-bold text-[#0F254B]">
                  Grand Total: <strong>₹ {editGrandTotal.toLocaleString('en-IN')}</strong>
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
                  {isSubmitting ? 'Saving...' : 'Save Quotation Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Document Modal (WhatsApp & Mail) */}
      {shareQuotation && (
        <ShareDocumentModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setShareQuotation(null);
          }}
          data={{
            documentType: 'quotation',
            title: shareQuotation.subject,
            number: shareQuotation.quotationNumber,
            clientName: shareQuotation.clientCompany || shareQuotation.clientName,
            clientContactPerson: shareQuotation.clientContactPerson,
            clientEmail: shareQuotation.clientEmail || '',
            clientPhone: shareQuotation.clientPhone || '',
            projectTitle: shareQuotation.projectTitle,
            siteLocation: shareQuotation.siteLocation || shareQuotation.clientAddress,
            amount: toRupees(shareQuotation.totalAmountPaise),
            pdfUrl: `/api/v1/quotations/${shareQuotation._id}/pdf`,
            docxUrl: `/api/v1/quotations/${shareQuotation._id}/docx`,
            username: shareQuotation.clientEmail || 'gingerhotel@gkaconstruction.com',
            password: 'GKAclient2026!',
          }}
        />
      )}
    </div>
  );
};
