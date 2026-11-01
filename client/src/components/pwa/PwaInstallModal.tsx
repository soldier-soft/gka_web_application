import React, { useState } from 'react';
import {
  Download,
  X,
  Smartphone,
  CheckCircle2,
  Share2,
  PlusSquare,
  Sparkles,
  Zap,
  WifiOff,
  Laptop,
} from 'lucide-react';
import { usePwa } from '../../context/PwaContext';

export const PwaInstallModal: React.FC = () => {
  const { showInstallModal, setShowInstallModal, isInstallable, installApp } = usePwa();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [isInstalling, setIsInstalling] = useState(false);

  if (!showInstallModal) return null;

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await installApp();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Brand Gradient */}
        <div className="relative bg-gradient-to-r from-brand-navy-900 via-brand-navy-800 to-brand-navy-950 text-white p-6 pb-7">
          <button
            onClick={() => setShowInstallModal(false)}
            aria-label="Close dialog"
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white p-2 shadow-lg flex-shrink-0 border border-brand-gold-400/30">
              <img src="/icons/icon-192.png" alt="GKA Construction" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-brand-gold-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Progressive Web App</span>
              </div>
              <h2 className="text-xl font-bold font-heading text-white">Install GKA Construction</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Official ERP & Client Portal Mobile Application
              </p>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            Key Application Features
          </p>
          <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-700">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-brand-gold-600 flex-shrink-0 mt-0.5" />
              <span>Instant Home Screen Launch</span>
            </div>
            <div className="flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-brand-navy-700 flex-shrink-0 mt-0.5" />
              <span>Native Standalone UI</span>
            </div>
            <div className="flex items-start gap-2">
              <WifiOff className="w-4 h-4 text-brand-teal-600 flex-shrink-0 mt-0.5" />
              <span>Offline Shell & Fast Cache</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>Zero-Store Auto Updates</span>
            </div>
          </div>
        </div>

        {/* Main Action or Guided Tabs */}
        <div className="p-6">
          {isInstallable ? (
            <div className="text-center py-2">
              <p className="text-sm text-slate-600 mb-5">
                Your browser supports one-click native installation. Click the button below to add GKA Construction to your device.
              </p>
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-brand-navy-950 bg-gradient-to-r from-brand-gold-400 via-brand-gold-500 to-brand-gold-600 hover:from-brand-gold-500 hover:to-brand-gold-700 shadow-md hover:shadow-glow-gold transition-all disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                <span>{isInstalling ? 'Installing...' : 'Install App on This Device'}</span>
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-600 mb-3 font-medium">
                Select your device platform for quick install instructions:
              </p>

              {/* Tabs */}
              <div className="flex rounded-lg bg-slate-100 p-1 mb-4 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('android')}
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                    activeTab === 'android' ? 'bg-white shadow-xs text-brand-navy-900' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Android
                </button>
                <button
                  onClick={() => setActiveTab('ios')}
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                    activeTab === 'ios' ? 'bg-white shadow-xs text-brand-navy-900' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  iPhone / iPad
                </button>
                <button
                  onClick={() => setActiveTab('desktop')}
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
                    activeTab === 'desktop' ? 'bg-white shadow-xs text-brand-navy-900' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  Windows / PC
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'android' && (
                <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-navy-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      1
                    </span>
                    <span>Open this website in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-navy-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      2
                    </span>
                    <span>Tap the <strong>three dots menu (⋮)</strong> in the top-right corner.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-navy-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      3
                    </span>
                    <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                  </div>
                </div>
              )}

              {activeTab === 'ios' && (
                <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-navy-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      1
                    </span>
                    <span>Open this website in <strong>Safari</strong> on your iPhone or iPad.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-navy-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      2
                    </span>
                    <span className="flex items-center gap-1 flex-wrap">
                      Tap the <strong>Share button</strong> <Share2 className="w-3.5 h-3.5 inline text-sky-600" /> at the bottom bar.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-navy-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      3
                    </span>
                    <span className="flex items-center gap-1 flex-wrap">
                      Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 inline text-slate-700" />.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-navy-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      4
                    </span>
                    <span>Tap <strong>"Add"</strong> in the top right to complete.</span>
                  </div>
                </div>
              )}

              {activeTab === 'desktop' && (
                <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-navy-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      1
                    </span>
                    <span>Open in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-navy-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      2
                    </span>
                    <span>Click the <strong>Install App icon (⊕ or 💻)</strong> on the right side of the address bar.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-navy-900 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      3
                    </span>
                    <span>Click <strong>Install</strong> to launch as a standalone desktop application.</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Version 1.0.0 • Progressive Web App</span>
          <button
            onClick={() => setShowInstallModal(false)}
            className="font-medium text-slate-600 hover:text-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
