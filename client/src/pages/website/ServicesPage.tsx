import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Building2,
  Hammer,
  Layers,
  PenTool,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Factory,
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const serviceCategories = [
    {
      id: 'home',
      title: 'Complete Home Construction',
      tagline: 'Independent Homes • Villas • Multi-Floor Residences',
      desc: 'End-to-end residential construction starting from architectural drawings and soil investigation to foundation, structural frame casting, masonry, civil finishing, and final keys handover across Chennai and Tiruvannamalai.',
      items: [
        'Custom independent homes & duplex villas',
        'Multi-floor residential apartments & extensions',
        'Structural RCC framed construction (M20 / M25 design mix)',
        'Wienerberger clay brick & solid block masonry',
        'Waterproofing for footings, wet areas and terrace slabs',
        'Digital client progress portal with daily site images',
      ],
      icon: Home,
    },
    {
      id: 'industrial',
      title: 'Industrial RCC Foundations & Cooling Tower Bases',
      tagline: 'Heavy Machine Beds • Cooling Tower Basins • PEB Pedestals • Sumps',
      desc: 'Heavy-duty industrial civil engineering, machine foundation pedestals, cooling tower base RCC structures, transformer plinths, and pre-engineered building (PEB) foundation works across Tamil Nadu.',
      items: [
        'Cooling tower base RCC foundation casting & water retention basins',
        'Vibration-isolated dynamic heavy machinery base foundations',
        'High-grade M30 / M35 / M40 design mix concrete with cube strength certification',
        'Pre-engineered building (PEB) shed pedestals, tie beams & plinth walls',
        'Sub-millimeter anchor bolt embedment with optical laser leveling',
        'Heavy-duty industrial IPS flooring, trench drains & underground sumps',
      ],
      icon: Factory,
    },
    {
      id: 'commercial',
      title: 'Commercial Construction',
      tagline: 'Offices • Showrooms • Hospitality • Warehouses',
      desc: 'Robust commercial and institutional structures designed for heavy footfall, industrial loads, strict municipal fire/safety norms and tight completion schedules.',
      items: [
        'Commercial multi-storey office buildings',
        'Retail shops, showrooms and boutique storefronts',
        'Hotels & hospitality building renovation & civil works',
        'Pre-engineered building (PEB) foundation & civil pedestals',
        'Industrial utility buildings & concrete flooring',
        'Institutional facilities, training centers & community halls',
      ],
      icon: Building2,
    },
    {
      id: 'renovation',
      title: 'Renovation & Remodeling',
      tagline: 'Residential • Commercial • Structural Rectification',
      desc: 'Upgrade existing properties without losing control of the budget or timeline. We assess structural integrity first, then execute planned transformations.',
      items: [
        'Complete residential & commercial building renovation',
        'Kitchen transformations & modular civil base works',
        'Modern bathroom renovations & plumbing line replacement',
        'Concrete water tank polymer plastering & waterproofing',
        'Floor additions, terrace roofing & balcony modifications',
        'Epoxy crack stitching & structural restoration',
      ],
      icon: Hammer,
    },
    {
      id: 'civil',
      title: 'Civil & Structural Works',
      tagline: 'RCC • Masonry • Plastering • Flooring',
      desc: 'Precision civil execution adhering to Indian Standard (IS) codes for reinforcement spacing, concrete vibration, shuttering alignment, and curing periods.',
      items: [
        'RCC column footings, plinth beams, columns and slabs',
        'First-class country burnt red brick & block masonry',
        'Internal smooth plastering and external sand-face finish',
        'Vitrified tile laying, granite stone flooring & paving',
        'Heavy-duty compound walls, retaining walls & sumps',
        'Underground sumps & overhead water tank construction',
      ],
      icon: Layers,
    },
    {
      id: 'design',
      title: 'Design, Planning & Estimation',
      tagline: '2D Layouts • 3D Elevations • Detailed BOQ',
      desc: 'Good construction starts with a clear plan. We translate client requirements into practical, permit-ready construction scopes with transparent costings.',
      items: [
        '2D architectural floor plans & spatial utilization',
        'Contemporary 3D elevation concepts & renderings',
        'Structural design coordination & soil testing support',
        'Itemized Quantity Estimation (BOQ) with unit rates',
        'Material specification guidance & brand selection support',
        'Gantt chart execution scheduling & milestone planning',
      ],
      icon: PenTool,
    },
    {
      id: 'turnkey',
      title: 'Turnkey & Allied Works',
      tagline: 'Electrical • Plumbing • False Ceiling • Painting',
      desc: 'Single-source responsibility combining civil, MEP, and aesthetic finishing works into an integrated project scope with zero coordination friction.',
      items: [
        'Complete concealed electrical wiring & distribution systems',
        'CPVC / UPVC water supply, drainage & sanitary ware installation',
        'False ceiling with concealed LED profiles & ambient lighting',
        'Wall putty, primer and premium emulsion painting systems',
        'Teak wood main entrance doors & UPVC window systems',
        'Comprehensive post-handover support & maintenance',
      ],
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-600 bg-brand-gold-50 px-3 py-1 rounded-full border border-brand-gold-200">
            Civil Engineering &amp; Contracting Capabilities
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-brand-navy-950 mt-3">
            Building Construction &amp; Industrial Civil Services in Tamil Nadu
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-4 leading-relaxed">
            Delivering turnkey residential house construction, industrial equipment RCC foundation bases, cooling tower civil works, commercial building fit-outs, and structural renovation across Chennai, Tiruvannamalai, Kelur, Polur, Arani &amp; Vellore.
          </p>
        </div>

        {/* Services List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {serviceCategories.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.id}
                className="bg-white rounded-2xl border border-slate-200 p-8 shadow-subtle hover:shadow-premium transition-all space-y-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-navy-900 text-brand-gold-400 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-heading font-bold text-brand-navy-950">{srv.title}</h3>
                      <p className="text-xs font-semibold text-brand-gold-600">{srv.tagline}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{srv.desc}</p>

                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Scope Highlights:</h4>
                    <ul className="grid grid-cols-1 gap-2 text-xs text-slate-600">
                      {srv.items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to="/cost-estimator"
                    className="text-xs font-bold text-brand-navy-900 hover:text-brand-gold-600 inline-flex items-center gap-1.5"
                  >
                    <span>Estimate this service</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    to="/contact"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                  >
                    Request Site Visit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
