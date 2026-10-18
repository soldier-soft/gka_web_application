import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Shield, Menu, X, ArrowRight, HardHat } from 'lucide-react';
import { GKA_COMPANY } from '@shared/constants';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Projects', path: '/projects' },
    { name: 'Cost Estimator', path: '/cost-estimator' },
    { name: 'Contact & Site Visit', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-brand-navy-900/95 backdrop-blur-md border-b border-brand-navy-700/50 text-white transition-all">
      {/* Top micro-bar */}
      <div className="bg-brand-navy-950 px-4 py-1.5 text-xs border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center text-slate-300">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5 text-brand-gold-400 font-medium">
              <Shield className="w-3.5 h-3.5 text-brand-gold-400" />
              15+ Years Field Experience
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline">Chennai & Tiruvannamalai, Tamil Nadu</span>
          </div>
          <div className="flex items-center space-x-6">
            <a
              href={`tel:${GKA_COMPANY.phoneDisplay}`}
              className="flex items-center gap-1.5 hover:text-brand-gold-400 transition-colors font-semibold"
            >
              <Phone className="w-3.5 h-3.5 text-brand-gold-400" />
              <span>Call: +91 {GKA_COMPANY.phoneDisplay}</span>
            </a>
            <span className="text-slate-400">GSTIN: {GKA_COMPANY.gstin}</span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/logo.png"
              alt="GKA Construction Logo"
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="text-xl font-heading font-extrabold tracking-wider text-white group-hover:text-brand-gold-400 transition-colors">
                GKA <span className="text-brand-gold-400">CONSTRUCTION</span>
              </span>
              <span className="text-[10px] tracking-widest text-slate-300 uppercase font-medium">
                Building Trust. Delivering Quality.
              </span>
            </div>
          </Link>

          {/* Desktop links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'text-brand-gold-400 bg-white/10 font-semibold'
                      : 'text-slate-200 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/cost-estimator"
              className="hidden xl:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-brand-gold-300 border border-brand-gold-400/30 transition-all"
            >
              <HardHat className="w-4 h-4 text-brand-gold-400" />
              Quick Estimate
            </Link>

            {isAuthenticated ? (
              <Link
                to={user?.role === 'client' ? '/client-portal' : '/admin/dashboard'}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 shadow-md hover:shadow-glow-gold transition-all"
              >
                <span>{user?.role === 'client' ? 'Client Portal' : 'ERP Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 shadow-md hover:shadow-glow-gold transition-all"
              >
                <span>ERP & Client Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-white/10 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-brand-navy-950 border-b border-brand-navy-800 px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:text-brand-gold-400 hover:bg-white/5"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-white/10">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-brand-gold-500 text-brand-navy-950"
            >
              <span>ERP & Client Portal Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
