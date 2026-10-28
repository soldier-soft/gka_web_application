import React, { useState } from 'react';
import {
  Calculator,
  HardHat,
  Sparkles,
  CheckCircle2,
  Building,
  Home,
  Hammer,
  ArrowRight,
  ShieldAlert,
  Info,
  Phone,
} from 'lucide-react';
import { api } from '../../services/api';
import { GKA_COMPANY } from '@shared/constants';

export const CostEstimatorPage: React.FC = () => {
  const [projectCategory, setProjectCategory] = useState<'residential' | 'commercial' | 'renovation' | 'civil_structural' | 'turnkey'>('residential');
  const [areaSqFt, setAreaSqFt] = useState<number>(1800);
  const [floors, setFloors] = useState<number>(2);
  const [packageTier, setPackageTier] = useState<'standard' | 'premium' | 'luxury'>('premium');

  // Contact form state for quotation enquiry
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Rate calculations
  const ratesPerSqFt: Record<string, Record<string, number>> = {
    residential: { standard: 1850, premium: 2250, luxury: 2850 },
    commercial: { standard: 1750, premium: 2150, luxury: 2700 },
    renovation: { standard: 950, premium: 1450, luxury: 1950 },
    civil_structural: { standard: 1250, premium: 1550, luxury: 1900 },
    turnkey: { standard: 2050, premium: 2450, luxury: 3100 },
  };

  const baseRate = ratesPerSqFt[projectCategory][packageTier];
  const floorFactor = floors > 1 ? 1 + (floors - 1) * 0.04 : 1; // minor vertical lift factor
  const effectiveRate = Math.round(baseRate * floorFactor);
  const totalEstimatedCost = areaSqFt * effectiveRate;

  // Breakdown percentages
  const structureCost = Math.round(totalEstimatedCost * 0.52);
  const finishesCost = Math.round(totalEstimatedCost * 0.26);
  const mepCost = Math.round(totalEstimatedCost * 0.14);
  const planningCost = Math.round(totalEstimatedCost * 0.08);

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.createEnquiry({
        name,
        phone,
        projectCategory,
        siteLocation,
        approxAreaSqFt: areaSqFt,
        estimatedBudgetRupees: totalEstimatedCost,
        message: `Estimated online with ${packageTier.toUpperCase()} package for ${areaSqFt} sq.ft (${floors} floors) — approx ₹${totalEstimatedCost.toLocaleString('en-IN')}`,
        source: 'cost_estimator',
      });
      if (res.success) {
        setSubmitSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving estimate. Please call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold-100 text-brand-gold-800 text-xs font-bold border border-brand-gold-300 mb-3">
            <Calculator className="w-3.5 h-3.5" />
            <span>Interactive 2026 Construction Cost Engine</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-brand-navy-950">
            House Construction Cost per Sq Ft Calculator 2026
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
            Get an instant budget forecast for your new home, duplex villa, commercial building, or renovation in Chennai (Kelambakkam, Navalur, OMR) and Tiruvannamalai (Kelur, Polur, Arani, Vellore) based on authentic field specifications from ₹1,850/sq.ft.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Controls */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 sm:p-8 space-y-8">
            {/* Step 1: Project Type */}
            <div>
              <label className="block text-sm font-bold text-brand-navy-950 mb-3">
                1. Select Project Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'residential', label: 'Home / Villa', icon: Home },
                  { id: 'commercial', label: 'Commercial', icon: Building },
                  { id: 'renovation', label: 'Renovation', icon: Hammer },
                  { id: 'civil_structural', label: 'Civil / Structure', icon: HardHat },
                  { id: 'turnkey', label: 'Complete Turnkey', icon: Sparkles },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = projectCategory === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setProjectCategory(item.id as any)}
                      className={`p-3.5 rounded-xl border text-left flex flex-col items-start transition-all ${
                        isSelected
                          ? 'border-brand-navy-900 bg-brand-navy-900 text-white shadow-md'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-brand-gold-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Built-up Area */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-brand-navy-950">
                  2. Approximate Built-up Area (Sq.Ft)
                </label>
                <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-lg border border-slate-300">
                  <input
                    type="number"
                    min={300}
                    max={25000}
                    step={50}
                    value={areaSqFt}
                    onChange={(e) => setAreaSqFt(Number(e.target.value))}
                    className="w-20 text-right font-bold text-sm bg-transparent outline-none text-brand-navy-900"
                  />
                  <span className="text-xs text-slate-500 font-semibold">sq.ft</span>
                </div>
              </div>
              <input
                type="range"
                min={500}
                max={10000}
                step={100}
                value={areaSqFt}
                onChange={(e) => setAreaSqFt(Number(e.target.value))}
                className="w-full accent-brand-gold-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>500 sq.ft</span>
                <span>2,500 sq.ft</span>
                <span>5,000 sq.ft</span>
                <span>10,000+ sq.ft</span>
              </div>
            </div>

            {/* Step 3: Number of Floors */}
            <div>
              <label className="block text-sm font-bold text-brand-navy-950 mb-3">
                3. Number of Floors
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { num: 1, label: 'Ground Floor' },
                  { num: 2, label: 'G + 1 Floor' },
                  { num: 3, label: 'G + 2 Floors' },
                  { num: 4, label: 'G + 3 Floors' },
                ].map((f) => (
                  <button
                    key={f.num}
                    type="button"
                    onClick={() => setFloors(f.num)}
                    className={`py-2.5 px-2 rounded-lg text-xs font-bold border transition-all text-center ${
                      floors === f.num
                        ? 'bg-brand-navy-900 border-brand-navy-900 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Specification Tier */}
            <div>
              <label className="block text-sm font-bold text-brand-navy-950 mb-3">
                4. Quality & Finish Tier
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    tier: 'standard',
                    title: 'Standard',
                    rate: ratesPerSqFt[projectCategory].standard,
                    features: ['Red brick / solid block', 'Vitrified 2x2 floor tiles', 'Tractor emulsion paint', 'Parryware / Cera CP'],
                  },
                  {
                    tier: 'premium',
                    title: 'Premium (Popular)',
                    rate: ratesPerSqFt[projectCategory].premium,
                    features: ['Wienerberger / clay brick', 'Vitrified 4x2 polished tiles', 'Royale luxury emulsion', 'Jaquar / Kohler fittings'],
                  },
                  {
                    tier: 'luxury',
                    title: 'Luxury',
                    rate: ratesPerSqFt[projectCategory].luxury,
                    features: ['Custom structural design', 'Large format glazed tiles', 'Full false ceiling with LEDs', 'Premium Grohe / Toto fixtures'],
                  },
                ].map((item) => {
                  const isSelected = packageTier === item.tier;
                  return (
                    <div
                      key={item.tier}
                      onClick={() => setPackageTier(item.tier as any)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-gold-500 bg-brand-gold-50/50 shadow-md ring-1 ring-brand-gold-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm text-brand-navy-950">{item.title}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-gold-600" />}
                      </div>
                      <p className="text-base font-extrabold text-brand-navy-900 mb-2">
                        ₹{item.rate.toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] text-slate-500 font-normal">/ sq.ft</span>
                      </p>
                      <ul className="space-y-1 text-[11px] text-slate-600">
                        {item.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-brand-gold-500 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Calculated Estimate & Instant Lead Capture */}
          <div className="lg:col-span-5 space-y-6">
            {/* Calculation Result Card */}
            <div className="bg-brand-navy-900 rounded-2xl p-6 sm:p-8 text-white shadow-premium border border-brand-navy-800 space-y-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-xs uppercase tracking-wider text-brand-gold-400 font-bold">Estimated Budget</span>
                <span className="text-xs text-slate-300">{areaSqFt.toLocaleString('en-IN')} Sq.Ft • {packageTier.toUpperCase()}</span>
              </div>

              <div>
                <p className="text-3xl sm:text-4xl font-extrabold font-heading text-white">
                  ₹ {totalEstimatedCost.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Approx. ₹{effectiveRate.toLocaleString('en-IN')} per sq.ft (excluding statutory tax & soil stabilization if any)
                </p>
              </div>

              {/* Stage breakdown */}
              <div className="space-y-3 pt-2 border-t border-white/10 text-xs">
                <p className="font-bold text-slate-200">Stage-Wise Budget Allocation:</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>1. Substructure & RCC Superstructure (52%)</span>
                    <strong>₹ {structureCost.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>2. Architectural Finishes & Tiling (26%)</span>
                    <strong>₹ {finishesCost.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>3. Electrical & Concealed Plumbing (14%)</span>
                    <strong>₹ {mepCost.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>4. Planning, Approvals & Elevation (8%)</span>
                    <strong>₹ {planningCost.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-start gap-2.5 text-[11px] text-slate-300">
                <Info className="w-4 h-4 text-brand-gold-400 shrink-0 mt-0.5" />
                <p>
                  Figures represent realistic Tamil Nadu market rates based on standard soil and site conditions. Final binding quotations include detailed itemized measurement sheets.
                </p>
              </div>
            </div>

            {/* Instant Quotation Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-4">
              <h3 className="font-heading font-bold text-base text-brand-navy-950">
                Receive Detailed Itemized BOQ & Site Assessment
              </h3>
              <p className="text-xs text-slate-500">
                Our site engineers will prepare a formal line-item quotation tailored to your plot dimensions.
              </p>

              {submitSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-sm text-emerald-900">Estimate Details Saved!</h4>
                  <p className="text-xs text-emerald-700">
                    Our lead engineer will review this estimate for <strong>{areaSqFt} sq.ft</strong> at{' '}
                    <strong>{siteLocation || 'your location'}</strong> and contact you on <strong>{phone}</strong>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitLead} className="space-y-3">
                  {errorMsg && (
                    <div className="p-2.5 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Anand Kumar"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 98401 23456"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Site Location / City *</label>
                    <input
                      type="text"
                      required
                      value={siteLocation}
                      onChange={(e) => setSiteLocation(e.target.value)}
                      placeholder="e.g. Kelambakkam / OMR / Tiruvannamalai"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-lg bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <span>Saving Estimate...</span>
                    ) : (
                      <>
                        <span>Get Detailed Quotation & Site Visit</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
