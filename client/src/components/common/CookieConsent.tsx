import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, X, Check } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('gka_cookie_consent');
    if (!consent) {
      // Delay display slightly for smooth page entry
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('gka_cookie_consent', 'accepted_all');
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem('gka_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-brand-navy-950/95 backdrop-blur-md text-white border border-brand-gold-500/30 rounded-2xl p-5 shadow-2xl relative">
        <button
          onClick={handleEssentialOnly}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          title="Dismiss banner"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-9 h-9 rounded-xl bg-brand-gold-500/20 text-brand-gold-400 flex items-center justify-center shrink-0 border border-brand-gold-500/30">
            <Cookie className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-heading font-bold text-white flex items-center gap-1.5">
              <span>Cookie &amp; Privacy Preferences</span>
              <ShieldCheck className="w-3.5 h-3.5 text-brand-teal-400" />
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              We use functional cookies to save your cost estimation inputs and ensure seamless access to your client portal.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
          <Link
            to="/privacy"
            className="text-[11px] text-brand-gold-400 hover:text-brand-gold-300 underline font-medium"
          >
            Privacy Policy
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEssentialOnly}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 transition-colors"
            >
              Essential Only
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept All</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
