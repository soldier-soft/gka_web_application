import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { api, downloadFile, getFileUrl } from '../../services/api';
import { formatINR, toPaise, toRupees } from '@shared/types';
import { STANDARD_RATE_LIBRARY } from '@shared/constants';
import { DocumentVisualView } from '../../components/documents/DocumentVisualView';
import { ShareDocumentModal } from '../../components/common/ShareDocumentModal';

export const QuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareQuotation, setShareQuotation] = useState<any>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Quotation form state (clean live application default)
  const [quotationNumber, setQuotationNumber] = useState('GKA-QUO-2026-001');
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [subject, setSubject] = useState('');
  const [senderName, setSenderName] = useState('Arivazhagan');
  const [senderCompany, setSenderCompany] = useState('GKA CONSTRUCTION');
  const [items, setItems] = useState<any[]>([
    {
      description: 'Civil Construction & Finishing Works',
      category: 'civil',
      unit: 'sq.ft',
      quantity: 0,
      unitRateRupees: 0,
    },
  ]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await api.getQuotations();
      if (res.success) {
        setQuotations(res.quotations);
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

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
  const taxAmount = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + taxAmount;

  // Auto download helper
  const triggerAutoDownloads = async (quotationId: string, quoNum: string) => {
    try {
      await downloadFile(`/quotations/${quotationId}/pdf`, `GKA_Quotation_${quoNum}.pdf`, true);
      setTimeout(async () => {
        try {
          await downloadFile(`/quotations/${quotationId}/docx`, `GKA_Quotation_${quoNum}.docx`, false);
        } catch (docxErr) {
          console.error('Auto-download DOCX error:', docxErr);
        }
      }, 600);
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
        clientId: enquiry.leadId,
        clientName,
        clientContactPerson: clientName,
        clientCompany,
        clientAddress: siteLocation,
        projectTitle,
        siteLocation,
        subject,
        senderName,
        senderCompany,
        items: convertedItems,
        taxRatePercent: 18,
      });

      if (res.success && res.quotation) {
        setShowModal(false);
        fetchQuotations();
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

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0F254B] text-white hover:bg-[#1E3A8A] transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-[#D6A21D]" />
          <span>New Quotation</span>
        </button>
      </div>

      {/* Quotations List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading quotations...</div>
        ) : quotations.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No quotations generated yet.</div>
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
                      {q.quotationNumber}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Rev #{q.revisionNumber} • {new Date(q.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 block">{q.projectTitle}</strong>
                      <span className="text-slate-500 text-[11px] block">
                        {q.clientCompany || q.clientName}
                      </span>
                      {q.subject && (
                        <span className="text-[10px] text-slate-400 italic line-clamp-1">
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

              {/* Total Calculation Display */}
              <div className="p-3 bg-slate-100 rounded-xl space-y-1 text-right font-mono text-xs">
                <div className="text-slate-600">
                  Subtotal: <strong className="text-slate-900">₹ {subtotal.toLocaleString('en-IN')}</strong>
                </div>
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
                  {isSubmitting ? 'Generating...' : 'Generate & Auto-Download PDF & DOCX'}
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
            username: shareQuotation.clientEmail || 'client@gingerhotel.com',
            password: 'GKAclient2026!',
          }}
        />
      )}
    </div>
  );
};
