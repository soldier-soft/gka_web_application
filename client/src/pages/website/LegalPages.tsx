import React from 'react';
import { GKA_COMPANY } from '@shared/constants';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-subtle space-y-6 text-slate-700 text-sm leading-relaxed">
        <h1 className="text-3xl font-heading font-extrabold text-brand-navy-950">Privacy Policy</h1>
        <p className="text-xs text-slate-400">Last updated: October 2026</p>

        <h3 className="text-base font-bold text-brand-navy-900">1. Information We Collect</h3>
        <p>
          GKA Construction collects personal contact details, site locations, project specifications and architectural documents solely to facilitate construction estimation, project management, client portal updates, and statutory billing.
        </p>

        <h3 className="text-base font-bold text-brand-navy-900">2. Client Data & Document Confidentiality</h3>
        <p>
          All project drawings, structural calculations, measurement sheets, site photographs, and commercial invoices stored within our digital operating system are kept confidential and accessible only to authorized project staff and the respective client through their authenticated portal credentials.
        </p>

        <h3 className="text-base font-bold text-brand-navy-900">3. Contact for Inquiries</h3>
        <p>
          For privacy inquiries, please contact: <br />
          <strong>GKA Construction</strong> <br />
          Registered Office: {GKA_COMPANY.registeredOffice.full} <br />
          Email: {GKA_COMPANY.email} | Phone: +91 {GKA_COMPANY.phoneDisplay}
        </p>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-subtle space-y-6 text-slate-700 text-sm leading-relaxed">
        <h1 className="text-3xl font-heading font-extrabold text-brand-navy-950">Terms and Conditions</h1>
        <p className="text-xs text-slate-400">Last updated: October 2026</p>

        <h3 className="text-base font-bold text-brand-navy-900">1. Commercial Quotations & Estimates</h3>
        <p>
          Online estimates generated through our interactive calculator are indicative guidelines based on standard site conditions. Binding commercial quotations are issued following physical site measurements and signed work orders.
        </p>

        <h3 className="text-base font-bold text-brand-navy-900">2. Payment Milestones</h3>
        <p>
          All construction contracts adhere strictly to milestone-based progressive billing (e.g. Planning, Foundation, Superstructure, MEP & Plastering, Architectural Finishes, Handover) as itemized in the formal contract agreement.
        </p>

        <h3 className="text-base font-bold text-brand-navy-900">3. Governing Jurisdiction</h3>
        <p>
          Contracts and digital portal transactions are governed by the laws of Tamil Nadu, India.
        </p>
      </div>
    </div>
  );
};
