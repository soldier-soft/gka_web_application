import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Calendar, CheckCircle2, ArrowRight, ExternalLink, Instagram, MessageCircle, Download } from 'lucide-react';
import { GKA_COMPANY } from '@shared/constants';
import { api } from '../../services/api';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    siteLocation: '',
    city: 'Chennai',
    projectCategory: 'residential',
    approxAreaSqFt: '',
    preferredSiteVisitDate: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await api.createEnquiry({
        ...formData,
        approxAreaSqFt: formData.approxAreaSqFt ? Number(formData.approxAreaSqFt) : undefined,
        source: 'site_visit_booking',
      });
      if (res.success) {
        setSubmitSuccess(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit booking. Please call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-600 bg-brand-gold-50 px-3 py-1 rounded-full border border-brand-gold-200">
            Get In Touch
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-brand-navy-950 mt-3">
            Contact & Book a Site Assessment
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
            Have a project in mind? Our site engineers are available for physical site visits, measurement verification, and technical consultations across Chennai and Tamil Nadu.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Office Locations & Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-subtle space-y-6">
              <h3 className="text-xl font-heading font-bold text-brand-navy-950 border-b border-slate-100 pb-4">
                Office Information
              </h3>

              <div className="space-y-4 text-xs">
                {/* Chennai Branch */}
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-brand-navy-50/70 border border-brand-navy-100">
                  <div className="w-9 h-9 rounded-lg bg-brand-navy-900 text-brand-gold-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm text-brand-navy-950 block">Chennai Branch Office</strong>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Active</span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">{GKA_COMPANY.chennaiBranch.full}</p>
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      <a
                        href={GKA_COMPANY.chennaiBranch.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-navy-950 text-white hover:bg-brand-navy-900 font-bold text-xs transition-colors shadow-xs"
                      >
                        <MapPin className="w-3.5 h-3.5 text-brand-gold-400" />
                        <span>Open Location on Map</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Registered Office */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-navy-100 text-brand-navy-900 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-sm text-brand-navy-950 block">Registered Office</strong>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{GKA_COMPANY.registeredOffice.full}</p>
                  </div>
                </div>

                {/* Telephone */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-xs text-slate-500 block">Direct Engineering Call:</strong>
                    <a href={`tel:${GKA_COMPANY.phoneDisplay}`} className="text-sm font-bold text-brand-navy-900 hover:text-brand-gold-600">
                      +91 {GKA_COMPANY.phoneDisplay}
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-xs text-slate-500 block">Official Email:</strong>
                    <a href={`mailto:${GKA_COMPANY.email}`} className="text-sm font-semibold text-brand-navy-900 hover:text-brand-gold-600">
                      {GKA_COMPANY.email}
                    </a>
                  </div>
                </div>

                {/* Social & WhatsApp Connect */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2.5">
                  <a
                    href={GKA_COMPANY.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200 transition-colors font-semibold"
                  >
                    <Instagram className="w-4 h-4 text-pink-600" />
                    <span>{GKA_COMPANY.social.instagramHandle}</span>
                  </a>

                  <a
                    href={GKA_COMPANY.social.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors font-semibold"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp Chat</span>
                  </a>
                </div>

                {/* Download Company Profile */}
                <div className="pt-1">
                  <a
                    href={GKA_COMPANY.companyProfilePdfUrl}
                    download="GKA_Construction_Premium_Company_Profile.pdf"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 font-bold transition-all shadow-subtle"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Company Profile (PDF)</span>
                  </a>
                </div>

                {/* Working hours */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500">Monday – Saturday: 8:30 AM – 7:00 PM</span>
                </div>
              </div>

              {/* Statutory details */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>GSTIN:</span>
                  <strong className="font-mono text-slate-900">{GKA_COMPANY.gstin}</strong>
                </div>
                <div className="flex justify-between">
                  <span>PAN:</span>
                  <strong className="font-mono text-slate-900">{GKA_COMPANY.pan}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Site Assessment Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-8 shadow-subtle">
            <h3 className="text-2xl font-heading font-bold text-brand-navy-950 mb-2">
              Book a Site Assessment or Send an Enquiry
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Fill in your plot or building location. Our team will review the requirements and arrange a site visit.
            </p>

            {submitSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-bold text-emerald-900">Site Assessment Requested!</h4>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">
                  Thank you, <strong>{formData.name}</strong>. Our site engineering office has logged your site visit request for{' '}
                  <strong>{formData.siteLocation}</strong>. We will contact you at <strong>{formData.phone}</strong> to confirm the exact time.
                </p>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                >
                  Submit Another Enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                    {errorMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. S. Karthikeyan"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 98401 23456"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. karthik@example.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Project Category</label>
                    <select
                      value={formData.projectCategory}
                      onChange={(e) => setFormData({ ...formData, projectCategory: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-gold-500 focus:outline-none bg-white"
                    >
                      <option value="residential">Complete Home Construction</option>
                      <option value="commercial">Commercial Building</option>
                      <option value="renovation">Renovation & Remodeling</option>
                      <option value="civil_structural">Civil & Structural Works</option>
                      <option value="interiors">Interiors & Allied Services</option>
                      <option value="turnkey">Turnkey Project</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Site Location / Address *</label>
                    <input
                      type="text"
                      required
                      value={formData.siteLocation}
                      onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                      placeholder="e.g. Kelambakkam, Sholinganallur, Tiruvannamalai"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Date</label>
                    <input
                      type="date"
                      value={formData.preferredSiteVisitDate}
                      onChange={(e) => setFormData({ ...formData, preferredSiteVisitDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-gold-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Message or Specific Scope Details</label>
                  <textarea
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your plot size, number of floors, timeline or renovation requirements..."
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-lg bg-brand-navy-900 hover:bg-brand-navy-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Registering Site Request...</span>
                  ) : (
                    <>
                      <span>Confirm Site Assessment Request</span>
                      <ArrowRight className="w-4 h-4 text-brand-gold-400" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
