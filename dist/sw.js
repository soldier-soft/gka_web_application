/**
 * GKA Construction Progressive Web App (PWA) Service Worker
 * Version: 1.0.0
 * Architecture: App Shell + Network-First (APIs) + Cache-First (Static Assets)
 */

const VERSION = 'v1.0.0';
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
        // Do not force skipWaiting immediately during install so active sessions aren't disrupted;
        // SkipWaiting will be triggered cleanly when user clicks "Update Now"
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

  // C. Dynamic Backend API Requests -> Network-First (Never replace live data with stale data)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            offline: true,
            message: 'You are currently offline. Live database updates require an active internet connection.',
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // D. HTML Page Navigation (SPA Routes) -> Network-First with App Shell / Offline Fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response.ok) {
            // Clone and update the cached index.html so the app shell stays fresh
            const cloned = response.clone();
            caches.open(SHELL_CACHE).then((cache) => {
              cache.put('/index.html', cloned);
            });
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback: serve cached index.html to allow React SPA routing or offline.html
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;

          const cachedOffline = await caches.match('/offline.html');
          if (cachedOffline) return cachedOffline;

          return new Response('Offline: Please reconnect to the internet.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
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
          // Serve from cache immediately, and revalidate in background if not hashed/immutable
          if (!url.pathname.startsWith('/assets/index-')) {
            fetch(req)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.ok) {
                  caches.open(targetCache).then((cache) => cache.put(req, networkResponse));
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
            return new Response('Asset not available offline', { status: 404 });
          });
      })
    );
    return;
  }

  // F. Default fallback: network with cache fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
