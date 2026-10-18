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
} from 'lucide-react';
import { api } from '../../services/api';
import { formatINR, toPaise, toRupees } from '@shared/types';
import { STANDARD_RATE_LIBRARY } from '@shared/constants';

export const QuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // New Quotation form state
  const [clientName, setClientName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [items, setItems] = useState<any[]>([
    {
      description: 'RCC M20/M25 design mix concrete for columns, beams and slab',
      category: 'structural',
      unit: 'cu.ft',
      quantity: 1200,
      unitRateRupees: 380,
    },
    {
      description: 'Brickwork in cement mortar 1:6 using first-class burnt red bricks',
      category: 'masonry',
      unit: 'sq.ft',
      quantity: 1500,
      unitRateRupees: 110,
    },
    {
      description: 'Internal wall cement plastering 12mm thick in CM 1:4 mix',
      category: 'finishing',
      unit: 'sq.ft',
      quantity: 2800,
      unitRateRupees: 38,
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
          unit: preset.unit,
          quantity: 100,
          unitRateRupees: preset.unitRateRupees,
        },
      ]);
    } else {
      setItems([
        ...items,
        {
          description: 'New Construction Work Item',
          category: 'civil',
          unit: 'sq.ft',
          quantity: 100,
          unitRateRupees: 50,
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
    return items.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitRateRupees) || 0), 0);
  };

  const subtotal = calculateSubtotal();
  const taxAmount = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + taxAmount;

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find or create lead/client first
      const enquiry = await api.createEnquiry({
        name: clientName,
        phone: '9840100000',
        siteLocation,
        projectCategory: 'residential',
        source: 'direct',
      });

      const convertedItems = items.map((it, idx) => ({
        id: `item-${idx + 1}`,
        description: it.description,
        category: it.category,
        unit: it.unit,
        quantity: Number(it.quantity) || 0,
        unitRatePaise: toPaise(Number(it.unitRateRupees) || 0),
      }));

      const res = await api.createQuotation({
        clientId: enquiry.leadId,
        clientName,
        projectTitle,
        siteLocation,
        items: convertedItems,
        taxRatePercent: 18,
      });

      if (res.success) {
        setShowModal(false);
        fetchQuotations();
      }
    } catch (err: any) {
      alert(err.message || 'Error generating quotation');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-brand-navy-950">
            Estimates & Quotations Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Itemized BOQ preparation, standard rate libraries, revision tracking, and branded PDF generation.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg text-xs font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 transition-colors shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-brand-gold-400" />
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
                  <th className="py-3.5 px-4">Client & Project</th>
                  <th className="py-3.5 px-4">Items Count</th>
                  <th className="py-3.5 px-4">Grand Total (Inc. 18% GST)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">PDF & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-navy-950">
                      {q.quotationNumber}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        Rev #{q.revisionNumber} • {new Date(q.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 block">{q.projectTitle}</strong>
                      <span className="text-slate-500 text-[11px]">Client: {q.clientName}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-semibold">
                      {q.items?.length || 0} measurement items
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-sm text-brand-navy-950">
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
                          ✓ Converted to Budget
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <a
                        href={`/api/v1/quotations/${q._id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5 text-brand-navy-900" />
                        <span>Print PDF</span>
                      </a>

                      {q.status !== 'approved' && (
                        <button
                          type="button"
                          disabled={approvingId === q._id}
                          onClick={() => handleApproveQuotation(q._id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{approvingId === q._id ? 'Approving...' : 'Approve & Lock Budget'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Quotation Builder Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-brand-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-heading font-bold text-brand-navy-950">
                  New Estimation & Quotation Sheet
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add line items, pick from the authentic rate library, and calculate taxes automatically.
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-6">
              {/* Meta details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. S. Ramanathan"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="e.g. 2BHK Villa Construction"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Site Location *</label>
                  <input
                    type="text"
                    required
                    value={siteLocation}
                    onChange={(e) => setSiteLocation(e.target.value)}
                    placeholder="e.g. Kelambakkam, Chennai"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Rate Library Quick Presets */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase">
                  + Add from Standard Rate Library:
                </span>
                <div className="flex flex-wrap gap-2">
                  {STANDARD_RATE_LIBRARY.slice(0, 6).map((rate, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAddItem(rate)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-slate-700 transition-colors"
                    >
                      + {rate.description.slice(0, 24)}... (₹{rate.unitRateRupees}/{rate.unit})
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Measurement Line Items</h4>
                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="text-xs font-semibold text-brand-navy-900 hover:text-brand-gold-600 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          placeholder="Description of work"
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          placeholder="Qty"
                          className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs bg-white text-right"
                        />
                      </div>
                      <div className="col-span-1">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          className="w-full px-1 py-1.5 rounded border border-slate-300 text-xs bg-white"
                        >
                          <option value="sq.ft">sq.ft</option>
                          <option value="cu.ft">cu.ft</option>
                          <option value="bags">bags</option>
                          <option value="tons">tons</option>
                          <option value="nos">nos</option>
                          <option value="rft">rft</option>
                          <option value="lumpsum">lump</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.unitRateRupees}
                          onChange={(e) => handleItemChange(idx, 'unitRateRupees', e.target.value)}
                          placeholder="Rate (₹)"
                          className="w-full px-2 py-1.5 rounded border border-slate-300 text-xs bg-white text-right"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculation Summary Footer */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <strong className="font-mono text-sm">₹ {subtotal.toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (18% - 9% CGST + 9% SGST):</span>
                  <strong className="font-mono text-sm">₹ {taxAmount.toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between text-base font-bold text-brand-navy-950 pt-2 border-t border-slate-200">
                  <span>Grand Total Quotation Amount:</span>
                  <strong className="font-mono text-lg text-brand-gold-600">₹ {grandTotal.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg text-xs font-bold bg-brand-navy-900 text-white hover:bg-brand-navy-800 shadow-md"
                >
                  Save & Generate Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
