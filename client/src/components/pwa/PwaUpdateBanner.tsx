import React, { useState } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { usePwa } from '../../context/PwaContext';

export const PwaUpdateBanner: React.FC = () => {
  const { updateAvailable, applyUpdate } = usePwa();
  const [dismissed, setDismissed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!updateAvailable || dismissed) return null;

  const handleUpdate = () => {
    setIsUpdating(true);
    applyUpdate();
  };

  return (
    <div className="fixed bottom-5 right-5 left-5 sm:left-auto sm:max-w-md z-50 animate-slideUp">
      <div className="bg-brand-navy-900 text-white rounded-xl shadow-2xl border border-brand-gold-500/40 p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-gold-500/20 border border-brand-gold-400/30 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-brand-gold-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-heading">
                Update Available
              </h4>
              <p className="text-xs text-slate-300">
                A new version of GKA Construction is ready.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss update notification"
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10">
          <button
            onClick={() => setDismissed(true)}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
          >
            Later
          </button>
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-navy-950 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Updating...' : 'Update Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
