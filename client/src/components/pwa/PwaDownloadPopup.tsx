import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Smartphone,
  Sparkles,
  Camera,
  Calculator,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { usePwa } from '../../context/PwaContext';

export const PwaDownloadPopup: React.FC = () => {
  const { isInstalled, isInstallable, installApp, setShowInstallModal } = usePwa();
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed
    if (isInstalled) return;

    // Check if user dismissed the popup in the current session
    const dismissedThisSession = sessionStorage.getItem('gka_download_popup_dismissed');
    const dismissedTimestamp = localStorage.getItem('gka_download_popup_timestamp');
    const now = Date.now();

    // Re-prompt after 24 hours even if previously dismissed in localStorage
    const oneDay = 24 * 60 * 60 * 1000;
    const hasDismissedRecently = dismissedTimestamp && now - parseInt(dismissedTimestamp, 10) < oneDay;

    if (dismissedThisSession || hasDismissedRecently) {
      return;
    }

    // Trigger popup smoothly 2.2 seconds after site opens
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2200);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  if (!isVisible || isInstalled) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('gka_download_popup_dismissed', 'true');
    localStorage.setItem('gka_download_popup_timestamp', Date.now().toString());
  };

  const handleDownload = async () => {
    setIsProcessing(true);
    handleDismiss();

    try {
      if (isInstallable) {
        await installApp();
      } else {
        // Open detailed step-by-step installation guide
        setShowInstallModal(true);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-brand-navy-950/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-brand-gold-400/50 overflow-hidden text-slate-800 transition-all transform animate-slideUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-popup-title"
      >
        {/* Top Decorative Gradient & Glow */}
        <div className="relative bg-gradient-to-br from-brand-navy-950 via-brand-navy-900 to-brand-navy-800 text-white p-5 sm:p-6 pb-6 border-b border-brand-gold-500/30">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            aria-label="Close notification"
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-gold-500/20 border border-brand-gold-400/50 text-brand-gold-300 text-[11px] font-bold tracking-wider uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold-400 animate-pulse" />
            <span>Official Mobile Application</span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="relative w-14 h-14 rounded-2xl bg-white p-2 shadow-lg flex-shrink-0 border-2 border-brand-gold-400/60">
              <img
                src="/icons/icon-192.png"
                alt="GKA Construction"
                className="w-full h-full object-contain"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-brand-navy-900 rounded-full" />
            </div>
            <div>
              <h3 id="pwa-popup-title" className="text-lg sm:text-xl font-bold font-heading text-white leading-tight">
                Download Our Application
              </h3>
              <p className="text-xs text-brand-gold-300 font-medium mt-0.5">
                Keep touch with GKA Construction everywhere!
              </p>
            </div>
          </div>
        </div>

        {/* Benefits list */}
        <div className="p-4 sm:p-5 bg-slate-50 space-y-2.5 text-xs text-slate-700 border-b border-slate-200">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-brand-navy-900 text-brand-gold-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="text-brand-navy-950 font-semibold">1-Tap Fast Launch:</strong>
              <span className="text-slate-600 block">Open directly from your smartphone home screen with zero URL typing.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-brand-navy-900 text-brand-gold-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="text-brand-navy-950 font-semibold">Live Site Diary & Photos:</strong>
              <span className="text-slate-600 block">Watch daily building milestones and progress pictures on your phone.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-brand-navy-900 text-brand-gold-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="text-brand-navy-950 font-semibold">Instant Cost Estimator & Offline Access:</strong>
              <span className="text-slate-600 block">Calculate construction packages even without an active internet connection.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-brand-navy-900 text-brand-gold-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <strong className="text-brand-navy-950 font-semibold">Direct Engineering Support:</strong>
              <span className="text-slate-600 block">Stay connected with our engineers and get quick quotation approvals.</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 bg-white flex flex-col gap-2.5">
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-bold text-sm text-brand-navy-950 bg-gradient-to-r from-brand-gold-400 via-brand-gold-500 to-brand-gold-600 hover:from-brand-gold-500 hover:to-brand-gold-700 shadow-md hover:shadow-glow-gold transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4 animate-bounce" />
            <span>Download & Install App</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleDismiss}
            className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Continue in Browser
          </button>
        </div>
      </div>
    </div>
  );
};
