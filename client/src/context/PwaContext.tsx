import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { registerServiceWorker, activateWaitingServiceWorker } from '../pwa/registerServiceWorker';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  wasOffline: boolean;
  updateAvailable: boolean;
  showInstallModal: boolean;
  setShowInstallModal: (show: boolean) => void;
  installApp: () => Promise<boolean>;
  applyUpdate: () => void;
  checkConnection: () => Promise<boolean>;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [wasOffline, setWasOffline] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorkerRegistration, setWaitingWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // 1. Detect if application is already running in standalone display mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkStandalone = (): boolean => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = (window.navigator as any).standalone === true;
      const isAndroidApp = document.referrer.includes('android-app://');
      return isStandaloneMedia || isIosStandalone || isAndroidApp;
    };

    if (checkStandalone()) {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setIsInstallable(false);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    } else {
      mediaQuery.addListener(handleDisplayModeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleDisplayModeChange);
      } else {
        mediaQuery.removeListener(handleDisplayModeChange);
      }
    };
  }, []);

  // 2. Listen to beforeinstallprompt and appinstalled events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser mini-infobar on mobile
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      console.log('[PWA] beforeinstallprompt event captured and ready.');
    };

    const handleAppInstalled = () => {
      console.log('[PWA] Application successfully installed.');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowInstallModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 3. Online / Offline network listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOffline(false);
      setWasOffline(true);
      // Auto-hide the "Back Online" indicator after 4 seconds
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 4. Register service worker and subscribe to updates
  useEffect(() => {
    registerServiceWorker({
      onUpdateAvailable: (reg) => {
        setWaitingWorkerRegistration(reg);
        setUpdateAvailable(true);
      },
      onSuccess: () => {
        console.log('[PWA] App shell precached for offline usage.');
      },
      onError: (err) => {
        console.warn('[PWA] Service worker registration notice:', err.message);
      },
    });
  }, []);

  // 5. Trigger Native or Guided Install
  const installApp = useCallback(async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        console.log('[PWA] User response to installation prompt:', choice.outcome);
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
          setDeferredPrompt(null);
          return true;
        }
        return false;
      } catch (err) {
        console.error('[PWA] Error prompting installation:', err);
        setShowInstallModal(true);
        return false;
      }
    } else {
      // Fallback: Show guided modal instructions for iOS, Desktop, or unsupported browsers
      setShowInstallModal(true);
      return false;
    }
  }, [deferredPrompt]);

  // 6. Apply Service Worker Update
  const applyUpdate = useCallback(() => {
    if (waitingWorkerRegistration) {
      activateWaitingServiceWorker(waitingWorkerRegistration);
    } else {
      window.location.reload();
    }
  }, [waitingWorkerRegistration]);

  // 7. Manual Connection Check
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/health?t=' + Date.now(), {
        method: 'GET',
        cache: 'no-store',
      });
      if (response.ok) {
        setIsOffline(false);
        setWasOffline(true);
        setTimeout(() => setWasOffline(false), 4000);
        return true;
      }
      setIsOffline(true);
      return false;
    } catch {
      setIsOffline(true);
      return false;
    }
  }, []);

  return (
    <PwaContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isOffline,
        wasOffline,
        updateAvailable,
        showInstallModal,
        setShowInstallModal,
        installApp,
        applyUpdate,
        checkConnection,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
};

export const usePwa = (): PwaContextType => {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return context;
};
