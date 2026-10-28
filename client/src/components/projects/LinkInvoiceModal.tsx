import React, { useState, useEffect } from 'react';
import { X, Search, Receipt, Check, Link as LinkIcon, AlertCircle, Building2 } from 'lucide-react';
import { api } from '../../services/api';
import { formatINR } from '@shared/types';

interface LinkInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onLinked: () => void;
}

export const LinkInvoiceModal: React.FC<LinkInvoiceModalProps> = ({
  isOpen,
  onClose,
  project,
  onLinked,
}) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchInvoices();
      setSelectedInvoiceId('');
      setSearchTerm('');
      setErrorMessage('');
    }
  }, [isOpen]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.getInvoices();
      if (res.success && Array.isArray(res.invoices)) {
        setInvoices(res.invoices);
      }
    } catch (err: any) {
      console.error('Error fetching invoices for linking:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentProjectId = project?._id;

  const filteredInvoices = invoices.filter((inv) => {
    const term = searchTerm.toLowerCase();
    const invNum = (inv.invoiceNumber || '').toLowerCase();
    const client = (inv.clientName || inv.clientCompany || '').toLowerCase();
    const title = (inv.projectTitle || '').toLowerCase();
    return invNum.includes(term) || client.includes(term) || title.includes(term);
  });

  const handleLink = async () => {
    if (!selectedInvoiceId) {
      setErrorMessage('Please select an invoice to link.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const res = await api.updateInvoice(selectedInvoiceId, {
        projectId: currentProjectId,
        projectTitle: project.title,
      });

      if (res.success) {
        onLinked();
        onClose();
      } else {
        setErrorMessage(res.message || 'Failed to link invoice.');
      }
    } catch (err: any) {
      console.error('Error linking invoice:', err);
      setErrorMessage(err.message || 'Failed to link invoice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 bg-[#10203A] text-white flex items-center justify-between shrink-0 border-b border-brand-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D6A21D]/20 text-[#D6A21D] flex items-center justify-center border border-[#D6A21D]/30">
              <Receipt className="w-4 h-4 text-[#D6A21D]" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-white">
                Link Bill / Tax Invoice to Project: {project?.projectId}
              </h3>
              <p className="text-[11px] text-slate-300">
                Bind an existing tax invoice to <strong>{project?.title}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice #, client name, or project title..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#D6A21D] focus:outline-hidden"
            />
          </div>
        </div>

        {/* List Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-slate-400">Loading invoices repository...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              No bills/invoices match your search criteria.
            </div>
          ) : (
            filteredInvoices.map((inv) => {
              const isCurrentProject =
                inv.projectId === currentProjectId || inv.projectId?._id === currentProjectId;
              const isSelected = selectedInvoiceId === inv._id;

              return (
                <div
                  key={inv._id}
                  onClick={() => {
                    if (!isCurrentProject) setSelectedInvoiceId(inv._id);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrentProject
                      ? 'bg-emerald-50/60 border-emerald-200 cursor-default opacity-85'
                      : isSelected
                      ? 'bg-[#10203A]/5 border-[#D6A21D] ring-2 ring-[#D6A21D]/30'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="selectedInvoice"
                      checked={isSelected || isCurrentProject}
                      disabled={isCurrentProject}
                      onChange={() => setSelectedInvoiceId(inv._id)}
                      className="mt-1 text-[#D6A21D] focus:ring-[#D6A21D]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-slate-900 font-heading">
                          {inv.invoiceNumber}
                        </strong>
                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                        {isCurrentProject && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-600 text-white">
                            Already Linked
                          </span>
                        )}
                        {!isCurrentProject && inv.projectId && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                            Linked to another project
                          </span>
                        )}
                      </div>
                      <div className="text-slate-600 mt-0.5">
                        Client: <strong>{inv.clientCompany || inv.clientName || 'N/A'}</strong>
                        {inv.projectTitle && (
                          <span className="text-slate-500"> • Project: {inv.projectTitle}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Issued: {new Date(inv.issueDate).toLocaleDateString('en-IN')} • Due:{' '}
                        {new Date(inv.dueDate).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-sm text-slate-900 block">
                      {formatINR(inv.totalAmountPaise)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Due: {formatINR(inv.dueAmountPaise)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500">
            {selectedInvoiceId ? 'Bill selected. Click Link to bind to this project.' : 'Select a bill above to proceed.'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLink}
              disabled={!selectedInvoiceId || isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#0F254B] hover:bg-[#1A3A73] disabled:opacity-50 text-white font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Linking...</span>
              ) : (
                <>
                  <LinkIcon className="w-3.5 h-3.5 text-[#D6A21D]" />
                  <span>Link to this Project</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
