import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Home, MapPin, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'commercial' | 'residential' | 'renovation'>('all');

  const portfolioProjects = [
    {
      id: 'GKA-2026-001',
      title: 'Ginger Hotel — Specialized Civil & Water Tank Works',
      client: 'Roots Corporation Limited',
      category: 'renovation',
      location: 'Rajiv Gandhi Salai (OMR), Navalur, Chennai',
      status: 'Active (72% Completed)',
      scope: [
        'Polymer-modified water-repellent cement plastering inside large capacity water tanks',
        'Fosroc two-component polymer coating and alkali-resistant fiberglass mesh application',
        'Anti-skid vitreous vitrified ceramic tile laying with chemical epoxy grouting in service areas',
        'Structural brickwork rectification and hydro-wash surface preparation',
      ],
      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80',
      badge: 'Representative Corporate Client',
    },
    {
      id: 'GKA-2026-002',
      title: 'Dr. Rajesh Residence — Contemporary Duplex Villa',
      client: 'Dr. V. Rajesh & Mrs. Shalini',
      category: 'residential',
      location: 'Plot 42, Green Avenue, Rajan Nagar, Kelambakkam, Chennai',
      status: 'Active (42% Completed)',
      scope: [
        'Turnkey architectural design & complete 2,400 sq.ft duplex residential construction',
        'RCC frame structure with column footings and Grade M25 concrete design mix',
        'Wienerberger clay brick masonry walls and double coat external sand-face plastering',
        'Complete interior concealed electrical conduit lines and concealed CPVC plumbing',
      ],
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
      badge: 'Residential Turnkey Villa',
    },
    {
      id: 'GKA-2026-003',
      title: 'Commercial Office Space & Facility Renovation',
      client: 'Commercial Property Client',
      category: 'commercial',
      location: 'Kelambakkam – Vandalur Junction, Chennai',
      status: 'Completed',
      scope: [
        'Heavy-duty floor tiling, partition walls and toughened glass fitting coordination',
        'Energy-efficient false ceiling with LED troffer fixtures and acoustic insulation',
        'Complete internal and external acrylic emulsion painting and facade rejuvenation',
      ],
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
      badge: 'Commercial Handover',
    },
  ];

  const filteredProjects = activeFilter === 'all'
    ? portfolioProjects
    : portfolioProjects.filter((p) => p.category === activeFilter);

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-600 bg-brand-gold-50 px-3 py-1 rounded-full border border-brand-gold-200">
            Field Portfolio
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-brand-navy-950 mt-3">
            Featured Projects & Sites
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
            Real construction sites, commercial hospitality works, and custom homes delivered with strict adherence to quality and safety standards.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center gap-2">
          {[
            { id: 'all', label: 'All Projects' },
            { id: 'residential', label: 'Residential Homes' },
            { id: 'commercial', label: 'Commercial' },
            { id: 'renovation', label: 'Renovation & Civil' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFilter === tab.id
                  ? 'bg-brand-navy-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-subtle hover:shadow-premium transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-64 relative bg-slate-200 overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-brand-navy-900/90 text-brand-gold-400 backdrop-blur-md border border-white/10 shadow-sm">
                      {p.badge}
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/90 text-slate-900 backdrop-blur-md shadow-sm">
                      {p.status}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-brand-gold-600">{p.id}</span>
                    <h3 className="text-xl font-heading font-bold text-brand-navy-950">{p.title}</h3>
                    <p className="text-xs font-semibold text-slate-500">Client: {p.client}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-brand-gold-500 shrink-0" />
                    <span>{p.location}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Scope Highlights:</h4>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {p.scope.map((s, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to="/cost-estimator"
                  className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 inline-flex items-center gap-1.5"
                >
                  <span>Estimate Similar Project</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/login"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  View Client Portal Feed
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
