/**
 * Progressive Web App (PWA) Service Worker Registration & Lifecycle Manager
 * Handles registration, update detection, controller migration, and skip-waiting.
 */

export interface PwaRegistrationCallbacks {
  onUpdateAvailable?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

let activeRegistration: ServiceWorkerRegistration | null = null;
let isRefreshing = false;

export const registerServiceWorker = (callbacks: PwaRegistrationCallbacks = {}): void => {
  // Only register service worker in browser environments supporting it
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Prevent reload loops when new service worker takes control
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (isRefreshing) return;
    isRefreshing = true;
    console.log('[PWA] New service worker took control. Reloading page...');
    window.location.reload();
  });

  window.addEventListener('load', async () => {
    try {
      // Register root service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      activeRegistration = registration;
      console.log('[PWA] Service Worker registered with scope:', registration.scope);

      // Check if there is already an updated worker waiting to activate
      if (registration.waiting) {
        console.log('[PWA] Update already waiting to activate.');
        callbacks.onUpdateAvailable?.(registration);
      }

      // Listen for when an update is found
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Existing controller exists -> this is a new update
              console.log('[PWA] New content is available; please update.');
              callbacks.onUpdateAvailable?.(registration);
            } else {
              // First-time install -> content is cached for offline use
              console.log('[PWA] Content is cached for offline use.');
              callbacks.onSuccess?.(registration);
            }
          }
        });
      });

      // Periodically check for service worker updates (every 30 minutes)
      setInterval(() => {
        registration.update().catch((err) => {
          console.warn('[PWA] Periodic update check failed:', err);
        });
      }, 30 * 60 * 1000);
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
      callbacks.onError?.(error as Error);
    }
  });
};

/**
 * Triggers the waiting service worker to activate and reload the page
 */
export const activateWaitingServiceWorker = (registration?: ServiceWorkerRegistration | null): void => {
  const targetReg = registration || activeRegistration;
  if (!targetReg || !targetReg.waiting) {
    console.warn('[PWA] No waiting service worker found to activate.');
    window.location.reload();
    return;
  }

  // Post SKIP_WAITING message to waiting worker
  targetReg.waiting.postMessage({ type: 'SKIP_WAITING' });
};
