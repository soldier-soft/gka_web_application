import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Building,
  Info,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { GKA_COMPANY, ESTIMATION_DISCLAIMER_TEXT } from '@shared/constants';

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: {
    relatedProjectId?: string;
    relatedProjectTitle?: string;
    relatedIdeaId?: string;
    relatedIdeaTitle?: string;
    defaultService?: string;
    defaultAreaSqFt?: number;
    defaultLocation?: string;
  };
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  isOpen,
  onClose,
  initialContext,
}) => {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    preferredContactMethod: 'call' as 'call' | 'whatsapp' | 'email',
    serviceType: 'residential',
    projectLocation: '',
    builtUpAreaSqFt: '',
    projectType: 'new_construction' as 'new_construction' | 'renovation' | 'expansion' | 'other',
    requirements: '',
    preferredContactTime: 'Anytime during working hours',
    consent: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submissionResult, setSubmissionResult] = useState<{
    referenceNumber: string;
    customerName: string;
    phone: string;
  } | null>(null);

  // Sync initial context when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        serviceType: initialContext?.defaultService || 'residential',
        builtUpAreaSqFt: initialContext?.defaultAreaSqFt ? String(initialContext.defaultAreaSqFt) : '',
        projectLocation: initialContext?.defaultLocation || '',
        requirements: initialContext?.relatedIdeaTitle
          ? `I am interested in exploring the "${initialContext.relatedIdeaTitle}" concept for my site. Please provide recommendations and arrange a site visit.`
          : initialContext?.relatedProjectTitle
          ? `I am inquiring about a similar scope to the "${initialContext.relatedProjectTitle}" project. Please advise on specifications and site inspection.`
          : '',
      }));
      setSubmissionResult(null);
      setErrorMessage('');
    }
  }, [isOpen, initialContext]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side phone validation
    const cleanedPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (e.g. 98401 23456).');
      return;
    }

    if (!formData.consent) {
      setErrorMessage('Please confirm consent to be contacted regarding your construction enquiry.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerName: formData.customerName.trim(),
        phone: cleanedPhone,
        email: formData.email ? formData.email.trim() : undefined,
        preferredContactMethod: formData.preferredContactMethod,
        serviceType: formData.serviceType,
        projectLocation: formData.projectLocation.trim(),
        builtUpAreaSqFt: formData.builtUpAreaSqFt ? Number(formData.builtUpAreaSqFt) : undefined,
        projectType: formData.projectType,
        requirements: formData.requirements.trim(),
        preferredContactTime: formData.preferredContactTime,
        consent: formData.consent,
        // Hidden context fields
        relatedProjectId: initialContext?.relatedProjectId,
        relatedProjectTitle: initialContext?.relatedProjectTitle,
        relatedIdeaId: initialContext?.relatedIdeaId,
        relatedIdeaTitle: initialContext?.relatedIdeaTitle,
      };

      const res = await api.submitEnquiry(payload);

      if (res.success) {
        setSubmissionResult({
          referenceNumber: res.referenceNumber,
          customerName: formData.customerName,
          phone: formData.phone,
        });
      } else {
        setErrorMessage(res.message || 'Unable to submit enquiry. Please try again or call us directly.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while submitting enquiry. Please call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello GKA Construction, I submitted an enquiry (${submissionResult?.referenceNumber || 'New Enquiry'}) for site inspection in ${formData.projectLocation || 'Chennai/Tiruvannamalai'}. My name is ${formData.customerName}.`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#07172C] text-white px-6 py-5 flex items-center justify-between border-b border-brand-navy-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold-400 bg-white/10 px-2.5 py-0.5 rounded-full border border-brand-gold-400/20">
              Direct Site Engineering
            </span>
            <h2 className="text-xl font-heading font-extrabold text-white mt-1">
              Request a Site Visit & Project Estimate
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Discuss designs, specifications and practical feasibility across Chennai & Tiruvannamalai.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-[#F5F8FC]">
          {submissionResult ? (
            /* Success View */
            <div className="bg-white p-8 rounded-xl border border-emerald-200 shadow-subtle text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Enquiry Successfully Recorded
                </span>
                <h3 className="text-2xl font-heading font-extrabold text-brand-navy-950 mt-2">
                  Thank You, {submissionResult.customerName}!
                </h3>
                <p className="text-xs text-slate-500">
                  Your enquiry has been securely logged with our site engineering team.
                </p>
              </div>

              {/* Reference ID Card */}
              <div className="bg-brand-navy-50 border border-brand-navy-200 p-4 rounded-xl text-left space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Enquiry Reference Number:</span>
                  <span className="font-mono font-bold text-sm text-brand-navy-900 bg-white px-2.5 py-0.5 rounded border border-brand-navy-200">
                    {submissionResult.referenceNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Contact Number:</span>
                  <span className="font-semibold text-slate-800">{submissionResult.phone}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">Preferred Contact Method:</span>
                  <span className="font-semibold text-brand-gold-600 uppercase">
                    {formData.preferredContactMethod}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                An experienced site engineer will review your site requirements and contact you promptly at your preferred time to arrange a personal site inspection.
              </p>

              {/* Direct Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={`tel:${GKA_COMPANY.phoneDisplay}`}
                  className="px-5 py-3 rounded-lg text-xs font-bold bg-[#10203A] text-white hover:bg-brand-navy-900 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Phone className="w-4 h-4 text-brand-gold-400" />
                  <span>Call Us: +91 {GKA_COMPANY.phoneDisplay}</span>
                </a>

                <a
                  href={`https://wa.me/91${GKA_COMPANY.phoneDisplay}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-lg text-xs font-bold bg-[#25D366] hover:bg-[#20ba59] text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
                >
                  Close and return to portfolio
                </button>
              </div>
            </div>
          ) : (
            /* Enquiry Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Context banner if opened from specific project/idea */}
              {(initialContext?.relatedIdeaTitle || initialContext?.relatedProjectTitle) && (
                <div className="bg-brand-gold-50 border border-brand-gold-200 p-3 rounded-xl flex items-center gap-3 text-xs text-brand-navy-950">
                  <Building className="w-4 h-4 text-brand-gold-600 shrink-0" />
                  <div>
                    <span className="font-bold">Inquiring about: </span>
                    <span>{initialContext?.relatedIdeaTitle || initialContext?.relatedProjectTitle}</span>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Row 1: Name and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">+91</span>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="98401 23456"
                      className="w-full pl-11 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Email and Preferred Contact Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. ramesh@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Preferred Contact Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'call', label: 'Phone Call', icon: Phone },
                      { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                      { id: 'email', label: 'Email', icon: Mail },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, preferredContactMethod: m.id as any })}
                        className={`px-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                          formData.preferredContactMethod === m.id
                            ? 'bg-[#10203A] text-white border-[#10203A] shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <m.icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Service Type & Project Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Service Required</label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none bg-white"
                  >
                    <option value="residential">Residential Home Construction</option>
                    <option value="villas">Independent Villa Construction</option>
                    <option value="commercial">Commercial Building / Civil Works</option>
                    <option value="renovation">Renovation & Structural Repair</option>
                    <option value="civil_finishing">Tiling & Civil Finishing</option>
                    <option value="maintenance">Building Maintenance</option>
                    <option value="turnkey">Complete Turnkey Package</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Scope Type</label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none bg-white"
                  >
                    <option value="new_construction">New Construction</option>
                    <option value="renovation">Renovation / Remodeling</option>
                    <option value="expansion">Floor Addition / Expansion</option>
                    <option value="other">Other Civil & Finishing Work</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Site Location and Approximate Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Site Location / Area <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.projectLocation}
                    onChange={(e) => setFormData({ ...formData, projectLocation: e.target.value })}
                    placeholder="e.g. Kelambakkam, Medavakkam, Tiruvannamalai"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Approximate Built-up Area (Sq.Ft)
                  </label>
                  <input
                    type="number"
                    value={formData.builtUpAreaSqFt}
                    onChange={(e) => setFormData({ ...formData, builtUpAreaSqFt: e.target.value })}
                    placeholder="e.g. 1200, 1800"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Row 5: Brief Requirements */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Brief Requirements / Site Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Tell us about your plot size, road access, preferred floor count, soil conditions or design ideas..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none bg-white"
                />
              </div>

              {/* Preferred Time & Consent */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Preferred Time for Call / Visit</label>
                  <select
                    value={formData.preferredContactTime}
                    onChange={(e) => setFormData({ ...formData, preferredContactTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-[#D6A21D] focus:outline-none bg-white"
                  >
                    <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                    <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM - 4 PM)</option>
                    <option value="Evening (4 PM - 7 PM)">Evening (4 PM - 7 PM)</option>
                    <option value="Weekend Saturday/Sunday">Weekend (Saturday / Sunday)</option>
                    <option value="Anytime during working hours">Anytime during working hours</option>
                  </select>
                </div>

                <label className="flex items-start gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={formData.consent}
                    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                    className="mt-0.5 rounded text-[#D6A21D] focus:ring-[#D6A21D]"
                  />
                  <span className="text-[11px] text-slate-600 leading-snug">
                    I consent to being contacted by GKA Construction regarding this enquiry. We respect your privacy and never share your details with third-party marketing companies.
                  </span>
                </label>
              </div>

              {/* Pricing Disclosure Box */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-950 flex items-start gap-2.5 leading-relaxed">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold mb-0.5">Pricing & Specifications Notice:</strong>
                  <span>{ESTIMATION_DISCLAIMER_TEXT}</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#10203A] hover:bg-[#07172C] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>Submitting Enquiry...</span>
                  ) : (
                    <>
                      <span>Submit Site Visit & Estimate Request</span>
                      <ArrowRight className="w-4 h-4 text-[#D6A21D]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
