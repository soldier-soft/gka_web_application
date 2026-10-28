import React from 'react';
import { ShieldCheck, Target, Award, Users, MapPin, CheckCircle2 } from 'lucide-react';
import { GKA_COMPANY } from '@shared/constants';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-600 bg-brand-gold-50 px-3 py-1 rounded-full border border-brand-gold-200">
            About GKA Construction
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-brand-navy-950 mt-3">
            Best Building Contractors in Chennai &amp; Tiruvannamalai
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
            A trusted civil construction and turnkey building company serving Chennai (Kelambakkam, Navalur, OMR) and Tiruvannamalai (Kelur, Polur, Arani, Vellore). Backed by 15+ years of practical field engineering experience, transparent itemized BOQ contracts, and 5-year structural stability warranty.
          </p>
        </div>

        {/* Company Overview & Field Experience */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-subtle grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4 text-slate-700 text-sm leading-relaxed">
            <h2 className="text-2xl font-bold font-heading text-brand-navy-950">
              15+ Years of Hands-on Practical Field Experience
            </h2>
            <p>
              GKA Construction is a construction and contracting company focused on delivering practical, quality-conscious solutions for residential, commercial and other building requirements.
            </p>
            <p>
              From complete home construction to renovation, civil works, interiors and finishing, we can coordinate multiple work packages under one project. Our objective is to make construction easier for the client through clear scope definition, organized execution and professional communication.
            </p>
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div>
                <strong className="text-brand-navy-950 block text-xs">GSTIN:</strong>
                <span className="text-xs font-mono text-slate-600">{GKA_COMPANY.gstin}</span>
              </div>
              <div>
                <strong className="text-brand-navy-950 block text-xs">PAN:</strong>
                <span className="text-xs font-mono text-slate-600">{GKA_COMPANY.pan}</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-navy-900 rounded-xl p-8 text-white space-y-6">
            <h3 className="text-lg font-bold font-heading text-brand-gold-400">Our Service Promise</h3>
            <div className="space-y-4 text-xs text-slate-300">
              <div>
                <strong className="text-white text-sm block">1. ONE CONTRACTOR</strong>
                <span>Coordinate major construction, civil, electrical, plumbing and finishing requirements through one accountable team.</span>
              </div>
              <div>
                <strong className="text-white text-sm block">2. CLEAR SCOPE</strong>
                <span>Define work requirements, itemized quantities and deliverables before execution. No hidden surprise charges.</span>
              </div>
              <div>
                <strong className="text-white text-sm block">3. CONTROLLED EXECUTION</strong>
                <span>Monitor site progress, material delivery, workmanship, finishing standards and safety guidelines.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-lg bg-brand-gold-100 text-brand-gold-800 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-heading font-bold text-brand-navy-950">Our Vision</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              To grow as a trusted and professionally managed construction company recognized for quality workmanship, transparent execution and dependable project delivery.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-lg bg-brand-navy-100 text-brand-navy-900 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-heading font-bold text-brand-navy-950">Our Mission</h3>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-teal-500 shrink-0" /> Deliver practical, cost-conscious and quality-focused construction solutions.</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-teal-500 shrink-0" /> Maintain professional standards in planning, execution, documentation and communication.</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-teal-500 shrink-0" /> Build long-term client relationships through dependable service.</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-teal-500 shrink-0" /> Continuously improve project coordination, workmanship and customer experience.</li>
            </ul>
          </div>
        </div>

        {/* Core Values */}
        <div>
          <h2 className="text-2xl font-bold font-heading text-brand-navy-950 text-center mb-8">
            Our Core Values
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            {[
              { title: 'Quality', desc: 'Attention to workmanship, materials and finishing.' },
              { title: 'Integrity', desc: 'Clear communication and responsible business practices.' },
              { title: 'Accountability', desc: 'Ownership of the work entrusted to us.' },
              { title: 'Customer Focus', desc: 'Understand the requirement before recommending work.' },
              { title: 'Efficiency', desc: 'Plan resources to reduce avoidable wastage and delays.' },
              { title: 'Professionalism', desc: 'Organized execution, billing and documentation.' },
            ].map((val) => (
              <div key={val.title} className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
                <h4 className="font-heading font-bold text-sm text-brand-navy-900 mb-1">{val.title}</h4>
                <p className="text-[11px] text-slate-500 leading-snug">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
