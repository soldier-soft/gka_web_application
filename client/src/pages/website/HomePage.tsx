import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  HardHat,
  Building2,
  Home,
  Hammer,
  PenTool,
  CheckCircle2,
  ArrowRight,
  Phone,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { GKA_COMPANY } from '@shared/constants';
import { api } from '../../services/api';

export const HomePage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    projectCategory: 'residential',
    siteLocation: '',
    approxAreaSqFt: '',
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
        source: 'website_contact',
      });
      if (res.success) {
        setSubmitSuccess(true);
        setFormData({
          name: '',
          phone: '',
          projectCategory: 'residential',
          siteLocation: '',
          approxAreaSqFt: '',
          message: '',
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit enquiry. Please call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative gradient-navy text-white overflow-hidden py-20 lg:py-28 border-b border-brand-navy-800">
        {/* Subtle geometric background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C59A27_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-brand-gold-400/30 text-brand-gold-300 text-xs font-semibold backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-brand-gold-400" />
                <span>15+ Years Practical Field Experience • Chennai & Tiruvannamalai</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] font-heading">
                Building Trust. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold-300 via-brand-gold-400 to-amber-200">
                  Delivering Quality.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                Complete building construction, renovation, design, interiors, civil & allied works under one accountable roof. From foundation to final keys handover, we make construction predictable and transparent.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/cost-estimator"
                  className="px-6 py-3.5 rounded-lg text-sm font-bold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 shadow-premium hover:shadow-glow-gold transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Instant Cost Estimator</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/contact"
                  className="px-6 py-3.5 rounded-lg text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-brand-gold-400" />
                  <span>Book Free Site Visit</span>
                </Link>

                <a
                  href={`tel:${GKA_COMPANY.phoneDisplay}`}
                  className="px-5 py-3.5 rounded-lg text-sm font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-2"
                >
                  <Phone className="w-4 h-4 text-brand-gold-400" />
                  <span>+91 {GKA_COMPANY.phoneDisplay}</span>
                </a>
              </div>

              {/* Micro proof bar */}
              <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-4 text-left">
                <div>
                  <p className="text-2xl font-bold font-heading text-white">15+</p>
                  <p className="text-xs text-slate-400">Years Field Experience</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-heading text-brand-gold-400">100%</p>
                  <p className="text-xs text-slate-400">Digital Progress Updates</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-heading text-white">1</p>
                  <p className="text-xs text-slate-400">Accountable Contractor</p>
                </div>
              </div>
            </div>

            {/* Right: Instant Site Visit & Quote Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-900 border border-slate-100 relative">
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-navy-900 text-brand-gold-400 px-3 py-1 rounded-full text-[11px] font-bold border border-brand-navy-700 shadow-md">
                  DIRECT SITE ENGINEERING
                </div>

                <h3 className="text-xl font-heading font-bold text-brand-navy-900 mb-1">
                  Request a Free Site Assessment
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  Speak directly with an experienced site engineer. No obligation.
                </p>

                {submitSuccess ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-xl text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h4 className="font-bold text-base">Enquiry Received!</h4>
                    <p className="text-xs text-emerald-700">
                      Our site engineering team has received your details and will call you on{' '}
                      <strong>{formData.phone || 'your number'}</strong> to coordinate the visit.
                    </p>
                    <button
                      onClick={() => setSubmitSuccess(false)}
                      className="mt-3 text-xs font-semibold text-emerald-700 underline"
                    >
                      Submit another enquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {errorMessage && (
                      <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                        {errorMessage}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="e.g. 98401 23456"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Project Type</label>
                        <select
                          value={formData.projectCategory}
                          onChange={(e) => setFormData({ ...formData, projectCategory: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none bg-white"
                        >
                          <option value="residential">Home Construction</option>
                          <option value="commercial">Commercial Building</option>
                          <option value="renovation">Renovation & Remodeling</option>
                          <option value="civil_structural">Civil & Structural Work</option>
                          <option value="interiors">Interiors & Allied Works</option>
                          <option value="turnkey">Turnkey Package</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Site Location *</label>
                        <input
                          type="text"
                          required
                          value={formData.siteLocation}
                          onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                          placeholder="e.g. Kelambakkam, Chennai"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Approx Area (Sq.Ft)</label>
                        <input
                          type="number"
                          value={formData.approxAreaSqFt}
                          onChange={(e) => setFormData({ ...formData, approxAreaSqFt: e.target.value })}
                          placeholder="e.g. 1800"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-lg bg-brand-navy-900 hover:bg-brand-navy-800 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span>Connecting with Site Engineer...</span>
                      ) : (
                        <>
                          <span>Submit Site Visit Request</span>
                          <ArrowRight className="w-4 h-4 text-brand-gold-400" />
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-slate-400 text-center">
                      Your details are kept confidential. Direct consultation with GKA Construction.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Construction Capabilities */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-600 bg-brand-gold-50 px-3 py-1 rounded-full border border-brand-gold-200">
              End-To-End Contracting
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-navy-950 mt-3">
              Comprehensive Construction Services
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              From foundation and structural framing to interior finishes and turnkey handover — executed with professional supervision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-subtle hover:shadow-premium transition-all group">
              <div className="w-12 h-12 rounded-lg bg-brand-navy-50 text-brand-navy-900 flex items-center justify-center mb-6 group-hover:bg-brand-navy-900 group-hover:text-brand-gold-400 transition-colors">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-navy-950 mb-2">
                Complete Home Construction
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Independent homes, custom villas, multi-floor residential buildings and floor additions built to approved structural engineering standards.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Soil test to key handover</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> M25 design mix concrete</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Transparent itemized BOQ</li>
              </ul>
              <Link to="/services" className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 inline-flex items-center gap-1">
                Learn more <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-subtle hover:shadow-premium transition-all group">
              <div className="w-12 h-12 rounded-lg bg-brand-navy-50 text-brand-navy-900 flex items-center justify-center mb-6 group-hover:bg-brand-navy-900 group-hover:text-brand-gold-400 transition-colors">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-navy-950 mb-2">
                Commercial & Institutional
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Commercial office spaces, retail showrooms, hospitality properties, institutional buildings, and utility warehouses built for high durability.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Heavy-duty structural RCC</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Commercial MEP & safety</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Strict timeline delivery</li>
              </ul>
              <Link to="/services" className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 inline-flex items-center gap-1">
                Learn more <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-subtle hover:shadow-premium transition-all group">
              <div className="w-12 h-12 rounded-lg bg-brand-navy-50 text-brand-navy-900 flex items-center justify-center mb-6 group-hover:bg-brand-navy-900 group-hover:text-brand-gold-400 transition-colors">
                <Hammer className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-navy-950 mb-2">
                Renovation & Remodeling
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Transform existing residential or commercial properties without losing scope control. Structural repairs, floor additions, and modern upgrades.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Structural assessment</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Bathroom & kitchen remodeling</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Water tank rehabilitation</li>
              </ul>
              <Link to="/services" className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 inline-flex items-center gap-1">
                Learn more <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-subtle hover:shadow-premium transition-all group">
              <div className="w-12 h-12 rounded-lg bg-brand-navy-50 text-brand-navy-900 flex items-center justify-center mb-6 group-hover:bg-brand-navy-900 group-hover:text-brand-gold-400 transition-colors">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-navy-950 mb-2">
                Civil & Structural Works
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                RCC footings, columns, beams, slabs, brick/block masonry, sand-face double coat plastering, and compound walls.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Certified TMT steel & OPC cement</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Accurate structural levels</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Water-cured plaster finish</li>
              </ul>
              <Link to="/services" className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 inline-flex items-center gap-1">
                Learn more <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 5 */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-subtle hover:shadow-premium transition-all group">
              <div className="w-12 h-12 rounded-lg bg-brand-navy-50 text-brand-navy-900 flex items-center justify-center mb-6 group-hover:bg-brand-navy-900 group-hover:text-brand-gold-400 transition-colors">
                <PenTool className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-navy-950 mb-2">
                Design, Planning & Estimation
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                2D floor plans, 3D elevations, structural analysis coordination, and itemized bill of quantities with market-tested rates.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Vaastu compliant layouts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Comprehensive line-item BOQ</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Transparent material brands</li>
              </ul>
              <Link to="/cost-estimator" className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 inline-flex items-center gap-1">
                Try Cost Estimator <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 6 */}
            <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-subtle hover:shadow-premium transition-all group">
              <div className="w-12 h-12 rounded-lg bg-brand-navy-50 text-brand-navy-900 flex items-center justify-center mb-6 group-hover:bg-brand-navy-900 group-hover:text-brand-gold-400 transition-colors">
                <HardHat className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-brand-navy-950 mb-2">
                Turnkey Project Delivery
              </h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Single-source accountability combining civil construction, electrical, plumbing, vitrified tile flooring, painting, and digital client tracking.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600 mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Zero coordination headaches</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Digital progress portal access</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500" /> Fixed milestone billing</li>
              </ul>
              <Link to="/services" className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 inline-flex items-center gap-1">
                Learn more <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Real Representative Client Experience */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-brand-navy-900 rounded-3xl overflow-hidden shadow-2xl text-white">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold-500/20 text-brand-gold-400 text-xs font-bold border border-brand-gold-400/30">
                  REPRESENTATIVE CLIENT EXPERIENCE
                </div>

                <h3 className="text-2xl sm:text-3xl font-heading font-extrabold text-white leading-tight">
                  Roots Corporation Limited <br />
                  <span className="text-brand-gold-400">Ginger Hotel — Navalur, Chennai</span>
                </h3>

                <p className="text-slate-300 text-sm leading-relaxed">
                  GKA Construction successfully executed specialized civil and renovation-related works for Ginger Hotel, Navalur, including high-grade polymer waterproofing and cement plastering of large capacity water tanks, service corridor structural rehabilitation, and heavy-duty floor tile works.
                </p>

                <div className="grid grid-cols-2 gap-6 pt-2 border-t border-white/10 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-400 block mb-1">Contract Scope:</span>
                    <strong className="text-white">Water Tank Plastering, Waterproofing & Tiling</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Location:</span>
                    <strong className="text-white">Rajiv Gandhi Salai (OMR), Navalur</strong>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-4">
                  <Link
                    to="/projects"
                    className="px-5 py-3 rounded-lg text-xs font-bold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 transition-all inline-flex items-center gap-2"
                  >
                    <span>View Project Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to="/login"
                    className="px-5 py-3 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 transition-all"
                  >
                    Client Portal Demonstration
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 h-80 lg:h-full min-h-[360px] relative bg-brand-navy-950">
                <img
                  src="https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80"
                  alt="Construction execution site"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-950 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-brand-navy-900/90 backdrop-blur-md border border-white/10 text-xs">
                  <p className="font-bold text-white">Commercial Hospitality Work</p>
                  <p className="text-slate-300 text-[11px]">Strict adherence to hygiene, safety and industrial specifications.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The 9-Stage Execution Process */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-600 bg-brand-gold-50 px-3 py-1 rounded-full border border-brand-gold-200">
              Structured Methodology
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-navy-950 mt-3">
              Our 9-Step Project Execution Flow
            </h2>
            <p className="text-slate-600 text-sm mt-3">
              Every GKA project follows an organized, disciplined sequence so you never have to wonder what is happening at your site.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '01', title: 'Requirement', desc: 'Understand objectives, scope, priorities, budget and timeline.' },
              { num: '02', title: 'Site Assessment', desc: 'Review site conditions, soil levels, structural access and utilities.' },
              { num: '03', title: 'Scope & Estimate', desc: 'Prepare measurements, detailed BOQ items and material specifications.' },
              { num: '04', title: 'Quotation', desc: 'Present formal commercial quotation with transparent payment terms.' },
              { num: '05', title: 'Planning', desc: 'Organize skilled manpower, procurement schedules and milestone dates.' },
              { num: '06', title: 'Execution', desc: 'Carry out civil, structural and finishing work with active on-site supervision.' },
              { num: '07', title: 'Monitoring', desc: 'Track daily progress, material consumption, and publish client photos.' },
              { num: '08', title: 'Finishing', desc: 'Execute architectural finishes, deep cleaning and joint snag list inspections.' },
              { num: '09', title: 'Handover', desc: 'Provide complete documentation, warranty records and hand over the keys.' },
            ].map((step) => (
              <div key={step.num} className="bg-white p-6 rounded-xl border border-slate-200 shadow-subtle hover:border-brand-gold-400 transition-all">
                <span className="text-2xl font-extrabold font-heading text-brand-gold-500 mb-2 block">{step.num}</span>
                <h4 className="text-base font-bold text-brand-navy-950 mb-1">{step.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Client Transparency Portal Highlight */}
      <section className="py-20 gradient-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-400 bg-white/10 px-3 py-1 rounded-full border border-brand-gold-400/30">
                Digital Operating System
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white leading-tight">
                Live Client Progress Portal. <br />
                <span className="text-brand-gold-400">Total Transparency, Zero Guesswork.</span>
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                As a GKA client, you receive a secure portal login. No more chasing supervisors for updates on WhatsApp. Check site photos, milestone percentages, approved drawings, and billing status from any phone or computer.
              </p>

              <div className="space-y-3 pt-2 text-xs text-slate-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-brand-teal-400 shrink-0" />
                  <span>Approved daily and weekly site photographs grouped by stage</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-brand-teal-400 shrink-0" />
                  <span>Real-time milestone progress tracking and upcoming deadlines</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-brand-teal-400 shrink-0" />
                  <span>Official GST invoices, receipts and downloadable handover certificates</span>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  to="/login"
                  className="px-6 py-3.5 rounded-lg text-sm font-bold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 shadow-md transition-all inline-flex items-center gap-2"
                >
                  <span>Experience The Client Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-brand-navy-950 p-6 sm:p-8 rounded-2xl border border-brand-navy-700 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-white">Client Portal Preview: GKA-2026-001</span>
                  </div>
                  <span className="text-[11px] text-brand-gold-400 bg-brand-gold-500/10 px-2.5 py-1 rounded-full border border-brand-gold-400/20 font-semibold">
                    Live Progress: 72%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Overall Project Completion</span>
                    <span className="font-bold text-white">72%</span>
                  </div>
                  <div className="w-full h-3 bg-brand-navy-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-teal-500 to-brand-gold-500 rounded-full" style={{ width: '72%' }} />
                  </div>
                </div>

                <div className="bg-brand-navy-900/90 p-4 rounded-xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <strong className="text-white">Active Stage: Water Tank Plastering</strong>
                    <span className="text-emerald-400 font-semibold text-[11px]">On Schedule</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Latest site report published today: "Applied 2nd coat of Fosroc Brushbond polymer waterproofing inside overhead tank #2."
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <img
                      src="https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=400&auto=format&fit=crop&q=80"
                      alt="Site report photo"
                      className="rounded-lg h-24 w-full object-cover border border-white/10"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80"
                      alt="Site report photo"
                      className="rounded-lg h-24 w-full object-cover border border-white/10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Ready to Build Banner */}
      <section className="py-16 bg-brand-gold-500 text-brand-navy-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight">
            Ready To Start Your Construction or Renovation Project?
          </h2>
          <p className="text-base text-brand-navy-900 font-medium max-w-2xl mx-auto">
            Get an instant estimate online or speak directly with our engineering team for an on-site consultation.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/cost-estimator"
              className="px-6 py-3.5 rounded-lg text-sm font-bold bg-brand-navy-900 hover:bg-brand-navy-800 text-white shadow-lg transition-all"
            >
              Calculate Estimated Cost
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3.5 rounded-lg text-sm font-bold bg-white hover:bg-slate-100 text-brand-navy-950 border border-brand-navy-900/20 shadow-sm transition-all"
            >
              Book Site Assessment
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
