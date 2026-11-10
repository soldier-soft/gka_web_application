/**
 * GKA Construction Progressive Web App (PWA) Service Worker
 * Version: 1.0.1
 * Architecture: App Shell + Network-First (APIs & Navigation) + Cache-First (Static Assets)
 */

const VERSION = 'v1.0.1';
const SHELL_CACHE = `gka-shell-${VERSION}`;
const STATIC_CACHE = `gka-static-${VERSION}`;
const IMAGE_CACHE = `gka-images-${VERSION}`;

// Essential application shell resources to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/offline.html',
  '/logo.png',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-16x16.png',
];

// URLs that must NEVER be cached under any circumstances
const SENSITIVE_URL_PATTERNS = [
  '/api/v1/auth',
  '/api/auth',
  '/api/health',
  '/token',
  '/password',
  '/login',
  '/credentials',
];

// 1. Service Worker Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => {
        return Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            fetch(url, { cache: 'no-cache' })
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch((err) => {
                console.warn(`[ServiceWorker] Pre-cache skipped for ${url}:`, err.message);
              })
          )
        );
      })
      .then(() => {
        // Activate worker promptly
        console.log(`[ServiceWorker ${VERSION}] Installed successfully.`);
      })
  );
});

// 2. Service Worker Activation & Cache Cleanup
self.addEventListener('activate', (event) => {
  const currentCaches = [SHELL_CACHE, STATIC_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Only clean up caches that belong to this GKA PWA application
            if (cacheName.startsWith('gka-') && !currentCaches.includes(cacheName)) {
              console.log(`[ServiceWorker] Deleting obsolete cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Immediately take control of all open clients
        return self.clients.claim();
      })
      .then(() => {
        console.log(`[ServiceWorker ${VERSION}] Activated and controlling clients.`);
      })
  );
});

// 3. Service Worker Message Listener (Update Trigger)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[ServiceWorker] Received SKIP_WAITING signal. Activating new worker...');
    self.skipWaiting();
  }
});

// 4. Fetch Strategy Orchestration
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // A. ONLY handle HTTP/HTTPS GET requests
  if (req.method !== 'GET') {
    return;
  }

  // B. Security: Never cache sensitive or auth API requests
  const isSensitive = SENSITIVE_URL_PATTERNS.some((pat) => url.pathname.includes(pat));
  if (isSensitive) {
    return; // Pass through straight to network
  }

  // C. Dynamic Backend API Requests -> Network-First with safe JSON error fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            offline: true,
            message: 'You are currently offline or server request timed out. Please check your internet connection.',
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
          }
        );
      })
    );
    return;
  }

  // D. HTML Page Navigation & SPA Routes -> Network-First with App Shell / Offline Fallback
  const isSpaPageRoute =
    req.mode === 'navigate' ||
    req.destination === 'document' ||
    (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) ||
    (!url.pathname.includes('.') && !url.pathname.startsWith('/assets/') && !url.pathname.startsWith('/icons/'));

  if (isSpaPageRoute) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.ok) {
            // Clone and update cached index.html so the app shell stays fresh
            const cloned = response.clone();
            caches.open(SHELL_CACHE).then((cache) => {
              cache.put('/index.html', cloned);
            });
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback: serve cached index.html to allow React SPA routing or offline.html
          const cachedIndex = (await caches.match('/index.html')) || (await caches.match('/'));
          if (cachedIndex) return cachedIndex;

          const cachedOffline = await caches.match('/offline.html');
          if (cachedOffline) return cachedOffline;

          return new Response(
            '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>GKA Construction - Offline</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;text-align:center;padding:40px 16px;background:#0F1E36;color:#ffffff;"><h1 style="color:#D6A21D;">GKA CONSTRUCTION</h1><p>You appear to be offline or server is temporarily unreachable.</p><button onclick="location.reload()" style="background:#D6A21D;color:#0F1E36;border:none;padding:10px 20px;border-radius:6px;font-weight:bold;cursor:pointer;">Retry</button></body></html>',
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=UTF-8' },
            }
          );
        })
    );
    return;
  }

  // E. Static Assets (Images, Icons, Fonts, Bundled JS/CSS) -> Cache-First with Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    /\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf)$/i.test(url.pathname);

  if (isStaticAsset) {
    const targetCache = /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname) ? IMAGE_CACHE : STATIC_CACHE;

    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache immediately, and revalidate in background if not hashed
          if (!url.pathname.startsWith('/assets/index-')) {
            fetch(req)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.ok) {
                  const toCache = networkResponse.clone();
                  caches.open(targetCache).then((cache) => cache.put(req, toCache));
                }
              })
              .catch(() => {});
          }
          return cachedResponse;
        }

        // Not in cache: fetch from network and store in cache
        return fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              const toCache = networkResponse.clone();
              caches.open(targetCache).then((cache) => cache.put(req, toCache));
            }
            return networkResponse;
          })
          .catch(async () => {
            // For failed image requests while offline, fallback to cached logo
            if (/\.(png|jpg|jpeg|svg|webp)$/i.test(url.pathname)) {
              const fallbackLogo = await caches.match('/logo.png');
              if (fallbackLogo) return fallbackLogo;
            }
            return new Response('Asset not available offline', {
              status: 404,
              headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
            });
          });
      })
    );
    return;
  }

  // F. Default fallback: network with cache fallback - ALWAYS return a valid Response
  event.respondWith(
    fetch(req).catch(async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      // If it was an HTML or SPA route, fallback to index.html
      if (!url.pathname.includes('.') || (req.headers.get('accept') && req.headers.get('accept').includes('text/html'))) {
        const cachedIndex = (await caches.match('/index.html')) || (await caches.match('/'));
        if (cachedIndex) return cachedIndex;
      }

      return new Response('Network request failed or resource unavailable offline.', {
        status: 504,
        statusText: 'Gateway Timeout',
        headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
      });
    })
  );
});
