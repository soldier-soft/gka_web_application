import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Globe, ShieldCheck, HardHat, FileText } from 'lucide-react';
import { GKA_COMPANY } from '@shared/constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-navy-950 text-slate-300 border-t border-brand-navy-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: About GKA */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="GKA Logo" className="h-10 w-auto" />
              <div>
                <span className="text-lg font-heading font-extrabold tracking-wide text-white">
                  GKA <span className="text-brand-gold-400">CONSTRUCTION</span>
                </span>
                <p className="text-[10px] text-brand-gold-400 font-medium">BUILDING TRUST. DELIVERING QUALITY.</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete building construction, renovation, design, interiors, civil & allied works under one accountable roof. Serving Chennai, Tiruvannamalai and surrounding regions across Tamil Nadu.
            </p>
            <div className="pt-2 flex flex-col space-y-1 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">GSTIN: {GKA_COMPANY.gstin}</span>
              <span className="font-semibold text-slate-200">PAN: {GKA_COMPANY.pan}</span>
            </div>
          </div>

          {/* Col 2: Services */}
          <div>
            <h4 className="text-sm font-heading font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-brand-gold-400 pl-2">
              Our Capabilities
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/services" className="hover:text-brand-gold-400 transition-colors">Complete Home Construction</Link></li>
              <li><Link to="/services" className="hover:text-brand-gold-400 transition-colors">Commercial & Office Buildings</Link></li>
              <li><Link to="/services" className="hover:text-brand-gold-400 transition-colors">Building Renovation & Remodeling</Link></li>
              <li><Link to="/services" className="hover:text-brand-gold-400 transition-colors">Civil & Structural Works</Link></li>
              <li><Link to="/services" className="hover:text-brand-gold-400 transition-colors">Water Tank & Waterproofing Works</Link></li>
              <li><Link to="/services" className="hover:text-brand-gold-400 transition-colors">Turnkey Project Delivery</Link></li>
            </ul>
          </div>

          {/* Col 3: Quick Links & Digital Portal */}
          <div>
            <h4 className="text-sm font-heading font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-brand-gold-400 pl-2">
              Platform & Tools
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/cost-estimator" className="hover:text-brand-gold-400 transition-colors">Interactive Cost Estimator</Link></li>
              <li><Link to="/contact" className="hover:text-brand-gold-400 transition-colors">Book a Free Site Assessment</Link></li>
              <li><Link to="/projects" className="hover:text-brand-gold-400 transition-colors">Representative Projects Portfolio</Link></li>
              <li><Link to="/login" className="hover:text-brand-gold-400 font-semibold text-brand-gold-400 transition-colors">ERP & Client Portal Login →</Link></li>
              <li><Link to="/privacy" className="hover:text-brand-gold-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-brand-gold-400 transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Col 4: Official Addresses */}
          <div className="space-y-4 text-xs">
            <h4 className="text-sm font-heading font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-brand-gold-400 pl-2">
              Contact & Locations
            </h4>
            <div className="space-y-3 text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-gold-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Chennai Branch:</span>
                  <span>{GKA_COMPANY.chennaiBranch.full}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-gold-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Registered Office:</span>
                  <span>{GKA_COMPANY.registeredOffice.full}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Phone className="w-4 h-4 text-brand-gold-400 shrink-0" />
                <a href={`tel:${GKA_COMPANY.phoneDisplay}`} className="hover:text-white font-medium">
                  +91 {GKA_COMPANY.phoneDisplay}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-gold-400 shrink-0" />
                <a href={`mailto:${GKA_COMPANY.email}`} className="hover:text-white font-medium">
                  {GKA_COMPANY.email}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Representative Client Badge */}
        <div className="border-t border-brand-navy-800 pt-6 pb-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-teal-400" />
            <span>
              Representative Work: <strong className="text-slate-200">Roots Corporation Limited (Ginger Hotel, Navalur, Chennai)</strong> — Civil & Water Tank Works
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>15+ Years Field Experience</span>
            <span>•</span>
            <span>Transparent Documentation</span>
            <span>•</span>
            <span>Digital Client Tracking</span>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-brand-navy-900 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} GKA Construction. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Digital Construction Operating System (MERN Stack)</p>
        </div>
      </div>
    </footer>
  );
};
