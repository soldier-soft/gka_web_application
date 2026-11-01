import React, { useState } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { usePwa } from '../../context/PwaContext';

export const PwaOfflineIndicator: React.FC = () => {
  const { isOffline, wasOffline, checkConnection } = usePwa();
  const [isChecking, setIsChecking] = useState(false);

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      await checkConnection();
    } finally {
      setIsChecking(false);
    }
  };

  if (!isOffline && !wasOffline) return null;

  // 1. Connection Restored Toast
  if (wasOffline && !isOffline) {
    return (
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-bounce">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-lg border border-emerald-400">
          <Wifi className="w-4 h-4" />
          <span>Connection restored! Live database sync active.</span>
        </div>
      </div>
    );
  }

  // 2. Offline Status Banner
  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-brand-navy-950 px-4 py-2 text-xs font-medium shadow-md transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 flex-shrink-0 animate-pulse text-brand-navy-900" />
          <span>
            <strong>Offline Mode:</strong> You are viewing cached app data. Live database modifications require reconnecting.
          </span>
        </div>
        <button
          onClick={handleRetry}
          disabled={isChecking}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-brand-navy-950 text-white hover:bg-brand-navy-900 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Checking...' : 'Retry Connection'}</span>
        </button>
      </div>
    </div>
  );
};
