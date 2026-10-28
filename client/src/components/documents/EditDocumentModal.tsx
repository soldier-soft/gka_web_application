import React, { useState, useEffect } from 'react';
import { X, FileText, Check, ShieldCheck, Building2, Upload, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData?: any | null; // If provided, edit mode; otherwise, create mode
  projects: any[];
  onDocumentSaved: (savedDoc: any) => void;
}

export const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  isOpen,
  onClose,
  documentData,
  projects,
  onDocumentSaved,
}) => {
  const isEditMode = !!documentData;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('contracts');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [visibleToClient, setVisibleToClient] = useState(false);
  const [version, setVersion] = useState<number>(1);
  const [fileType, setFileType] = useState('application/pdf');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (documentData) {
      setTitle(documentData.title || '');
      setCategory(documentData.category || 'contracts');
      setFileName(documentData.fileName || '');
      setFileUrl(documentData.fileUrl || '');
      setProjectId(
        documentData.projectId?._id ||
        (typeof documentData.projectId === 'string' ? documentData.projectId : '')
      );
      setVisibleToClient(Boolean(documentData.visibleToClient));
      setVersion(Number(documentData.version) || 1);
      setFileType(documentData.fileType || 'application/pdf');
    } else {
      setTitle('');
      setCategory('contracts');
      setFileName('');
      setFileUrl('/uploads/sample_document.pdf');
      setProjectId('');
      setVisibleToClient(false);
      setVersion(1);
      setFileType('application/pdf');
    }
    setErrorMessage('');
  }, [documentData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        title: title.trim(),
        category,
        fileName: fileName.trim() || `${title.replace(/\s+/g, '_')}.pdf`,
        fileUrl: fileUrl.trim() || '/uploads/sample_document.pdf',
        projectId: projectId || undefined,
        visibleToClient,
        version: Number(version) || 1,
        fileType,
      };

      let res;
      if (isEditMode && documentData?._id) {
        res = await api.updateDocument(documentData._id, payload);
      } else {
        res = await api.createDocument(payload);
      }

      if (res.success && res.document) {
        onDocumentSaved(res.document);
        onClose();
      } else {
        setErrorMessage(res.message || 'Failed to save document.');
      }
    } catch (err: any) {
      console.error('Error saving document:', err);
      setErrorMessage(err.message || 'Failed to save document. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#10203A] text-white flex items-center justify-between shrink-0 border-b border-brand-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D6A21D]/20 text-[#D6A21D] flex items-center justify-center border border-[#D6A21D]/30">
              <FileText className="w-4 h-4 text-[#D6A21D]" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-white">
                {isEditMode ? 'Edit Document (Owner Portal)' : 'Add New Document (Owner Portal)'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {isEditMode
                  ? 'Update document metadata, category, client visibility, and project binding'
                  : 'Register a new contract, permit, drawing or warranty in the company repository'}
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

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Document Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Document Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master Construction Agreement & Structural Specs"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold focus:ring-2 focus:ring-[#D6A21D] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-[#D6A21D] focus:outline-hidden"
              >
                <option value="contracts">Contracts & Agreements</option>
                <option value="drawings">Architectural & 2D/3D Drawings</option>
                <option value="permits">DTCP / CMDA Sanction Permits</option>
                <option value="quotations">Commercial Quotations</option>
                <option value="invoices">Tax Invoices & Billing</option>
                <option value="handover">Handover & 5-Year Warranty</option>
                <option value="site_photos">Verified Site Photos & Logs</option>
              </select>
            </div>

            {/* Version */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Version Number
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={version}
                onChange={(e) => setVersion(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-[#D6A21D] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Associated Project */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Linked Project (Optional)
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-[#D6A21D] focus:outline-hidden"
            >
              <option value="">-- Company Level / No Specific Project --</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.projectId} — {p.title} ({p.siteAddress?.city || 'Tamil Nadu'})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Selecting a project displays this document inside the project workspace and client portal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* File Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                File Display Name
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. Agreement_Signed_2026.pdf"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[11px] focus:ring-2 focus:ring-[#D6A21D] focus:outline-hidden"
              />
            </div>

            {/* File URL or Path */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                File URL / Storage Path
              </label>
              <input
                type="text"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="e.g. /uploads/agreement.pdf"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[11px] focus:ring-2 focus:ring-[#D6A21D] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Visible to Client Checkbox */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <strong className="block text-slate-900 font-bold">Client Portal Visibility</strong>
              <span className="text-[11px] text-slate-500">
                Publish this document to the client's secure dashboard for download and inspection.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={visibleToClient}
                onChange={(e) => setVisibleToClient(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#0F254B] hover:bg-[#1A3A73] text-white font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#D6A21D]" />
                  <span>{isEditMode ? 'Update Document' : 'Save Document'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
