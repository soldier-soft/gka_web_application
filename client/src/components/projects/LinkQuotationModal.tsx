import React, { useState, useEffect } from 'react';
import { X, Search, FileText, Check, Link as LinkIcon, AlertCircle, Building2, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { formatINR } from '@shared/types';

interface LinkQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onLinked: () => void;
}

export const LinkQuotationModal: React.FC<LinkQuotationModalProps> = ({
  isOpen,
  onClose,
  project,
  onLinked,
}) => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchQuotations();
      setSelectedQuotationId('');
      setSearchTerm('');
      setErrorMessage('');
    }
  }, [isOpen]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await api.getQuotations();
      if (res.success && Array.isArray(res.quotations)) {
        setQuotations(res.quotations);
      }
    } catch (err: any) {
      console.error('Error fetching quotations for linking:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentProjectId = project?._id;

  const filteredQuotations = quotations.filter((q) => {
    const term = searchTerm.toLowerCase();
    const qNum = (q.quotationNumber || '').toLowerCase();
    const client = (q.clientName || q.clientCompany || '').toLowerCase();
    const title = (q.projectTitle || '').toLowerCase();
    return qNum.includes(term) || client.includes(term) || title.includes(term);
  });

  const handleLink = async () => {
    if (!selectedQuotationId) {
      setErrorMessage('Please select a quotation to link.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const res = await api.updateQuotation(selectedQuotationId, {
        projectId: currentProjectId,
        projectTitle: project.title,
      });

      if (res.success) {
        onLinked();
        onClose();
      } else {
        setErrorMessage(res.message || 'Failed to link quotation.');
      }
    } catch (err: any) {
      console.error('Error linking quotation:', err);
      setErrorMessage(err.message || 'Failed to link quotation. Please try again.');
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
              <LinkIcon className="w-4 h-4 text-[#D6A21D]" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-white">
                Link Quotation to Project: {project?.projectId}
              </h3>
              <p className="text-[11px] text-slate-300">
                Bind an existing commercial quotation to <strong>{project?.title}</strong>
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
              placeholder="Search by quotation #, client name, or project title..."
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
            <div className="py-8 text-center text-slate-400">Loading quotations library...</div>
          ) : filteredQuotations.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              No quotations match your search criteria.
            </div>
          ) : (
            filteredQuotations.map((q) => {
              const isCurrentProject =
                q.projectId === currentProjectId || q.projectId?._id === currentProjectId;
              const isSelected = selectedQuotationId === q._id;

              return (
                <div
                  key={q._id}
                  onClick={() => {
                    if (!isCurrentProject) setSelectedQuotationId(q._id);
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
                      name="selectedQuotation"
                      checked={isSelected || isCurrentProject}
                      disabled={isCurrentProject}
                      onChange={() => setSelectedQuotationId(q._id)}
                      className="mt-1 text-[#D6A21D] focus:ring-[#D6A21D]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-slate-900 font-heading">
                          {q.quotationNumber}
                        </strong>
                        <span
                          className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                            q.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {q.status}
                        </span>
                        {isCurrentProject && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-600 text-white">
                            Already Linked
                          </span>
                        )}
                        {!isCurrentProject && q.projectId && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                            Linked to another project
                          </span>
                        )}
                      </div>
                      <div className="text-slate-600 mt-0.5">
                        Client: <strong>{q.clientCompany || q.clientName || 'N/A'}</strong>
                        {q.projectTitle && (
                          <span className="text-slate-500"> • Title: {q.projectTitle}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Items: {q.items?.length || 0} • Valid Until:{' '}
                        {new Date(q.validUntil).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-sm text-slate-900 block">
                      {formatINR(q.totalAmountPaise)}
                    </span>
                    {q.isNegotiated && (
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        Negotiated
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500">
            {selectedQuotationId ? 'Quotation selected. Click Link to bind to this project.' : 'Select a quotation above to proceed.'}
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
              disabled={!selectedQuotationId || isSubmitting}
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
