import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  X,
  Sparkles,
  Zap,
  Camera,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { usePwa } from '../../context/PwaContext';

export const PwaDownloadPopup: React.FC = () => {
  const { isInstalled, isInstallable, installApp, setShowInstallModal } = usePwa();
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(40);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Do not show if the user is already browsing inside the installed standalone PWA app
    if (isInstalled) return;

    // Trigger non-intrusive side/top popup smoothly 1.5s after opening the site
    const enterTimer = setTimeout(() => {
      setIsVisible(true);
      setSecondsRemaining(40);

      // 40-second countdown ticker
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-close after 40 seconds
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 40000);
    }, 1500);

    return () => {
      clearTimeout(enterTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isInstalled]);

  if (!isVisible || isInstalled) return null;

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setIsVisible(false);
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

  // Calculate percentage of 40s remaining for the smooth progress bar
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / 40) * 100));

  return (
    /* Non-intrusive container: pointer-events-none ensures users can click the website freely behind it */
    <div className="pointer-events-none fixed top-24 right-3 sm:right-6 z-50 w-[360px] sm:w-[390px] max-w-[calc(100vw-24px)] transition-all animate-slideInRight">
      {/* Inner card: pointer-events-auto allows interacting with the popup itself */}
      <div
        className="pointer-events-auto relative bg-brand-navy-950/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border-2 border-brand-gold-400/80 overflow-hidden text-slate-800 transition-all"
        role="dialog"
        aria-modal="false"
        aria-label="Download GKA Construction Application"
      >
        {/* Header Section */}
        <div className="relative bg-gradient-to-r from-brand-navy-950 via-brand-navy-900 to-brand-navy-800 p-4 pb-3 border-b border-brand-gold-500/30">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-xl bg-white p-1.5 shadow-md flex-shrink-0 border-2 border-brand-gold-400/60">
                <img
                  src="/icons/icon-192.png"
                  alt="GKA Construction Logo"
                  className="w-full h-full object-contain"
                />
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border border-brand-navy-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-brand-gold-400 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-brand-gold-400 animate-pulse" />
                  <span>Official Mobile App</span>
                </div>
                <h4 className="text-sm font-bold font-heading text-white leading-tight">
                  GKA Construction App
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Countdown badge showing remaining seconds */}
              <span
                title={`Auto-closing in ${secondsRemaining}s`}
                className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/10 text-brand-gold-300 border border-brand-gold-400/30"
              >
                <Clock className="w-2.5 h-2.5" />
                <span>{secondsRemaining}s</span>
              </span>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                aria-label="Close notification"
                title="Dismiss (Site remains fully functional)"
                className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-4 text-xs space-y-2.5 bg-slate-900/60 text-slate-200">
          <p className="text-[11px] leading-relaxed text-slate-300">
            Keep touch with us! Download our application for <strong>live site photos</strong>, <strong>instant cost estimators</strong>, and direct engineering access right from your phone.
          </p>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300">
            <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5">
              <Zap className="w-3 h-3 text-brand-gold-400 flex-shrink-0" />
              <span>1-Tap Fast Launch</span>
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5">
              <Camera className="w-3 h-3 text-brand-gold-400 flex-shrink-0" />
              <span>Daily Site Diary</span>
            </span>
          </div>

          {/* Primary Action Button */}
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isProcessing}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs text-brand-navy-950 bg-gradient-to-r from-brand-gold-400 via-brand-gold-500 to-brand-gold-600 hover:from-brand-gold-500 hover:to-brand-gold-700 shadow-md hover:shadow-glow-gold transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 animate-bounce" />
              <span>Download & Install App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleDismiss}
              className="px-2.5 py-2.5 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Skip
            </button>
          </div>
        </div>

        {/* 40-Second Progress Bar Timer indicator */}
        <div className="w-full h-1 bg-brand-navy-900 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-gold-500 to-brand-gold-300 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
