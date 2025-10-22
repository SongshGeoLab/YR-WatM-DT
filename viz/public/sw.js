/**
 * Service Worker for offline caching and performance optimization
 */

const CACHE_NAME = 'watm-dt-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

const API_CACHE_PATTERNS = [
  /\/api\/variables/,
  /\/api\/params/,
  /\/api\/time/,
  /\/api\/series/,
  /\/api\/resolve_scenario/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with cache-first strategy
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('📦 Serving API from cache:', url.pathname);

                // Return cached response and update cache in background
                fetch(request)
                  .then((networkResponse) => {
                    if (networkResponse.ok) {
                      cache.put(request, networkResponse.clone());
                    }
                  })
                  .catch(() => {
                    // Network failed, keep using cached response
                  });

                return cachedResponse;
              }

              // No cache, fetch from network
              console.log('🌐 Fetching API from network:', url.pathname);
              return fetch(request)
                .then((networkResponse) => {
                  if (networkResponse.ok) {
                    cache.put(request, networkResponse.clone());
                  }
                  return networkResponse;
                });
            });
        })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (request.method === 'GET' &&
      (url.pathname.startsWith('/static/') ||
       url.pathname.endsWith('.js') ||
       url.pathname.endsWith('.css') ||
       url.pathname.endsWith('.png') ||
       url.pathname.endsWith('.jpg') ||
       url.pathname.endsWith('.svg'))) {

    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('📦 Serving static asset from cache:', url.pathname);
            return cachedResponse;
          }

          console.log('🌐 Fetching static asset from network:', url.pathname);
          return fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return networkResponse;
            });
        })
    );
    return;
  }

  // Handle HTML pages with network-first strategy
  if (request.method === 'GET' &&
      (url.pathname === '/' ||
       url.pathname.startsWith('/page') ||
       !url.pathname.includes('.'))) {

    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('📦 Serving page from cache:', url.pathname);
                return cachedResponse;
              }

              // No cache, return offline page
              return caches.match('/')
                .then((offlineResponse) => {
                  return offlineResponse || new Response('Offline', { status: 503 });
                });
            });
        })
    );
    return;
  }
});

// Message event - handle cache management commands
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME)
        .then(() => {
          console.log('🗑️ Cache cleared');
          event.ports[0].postMessage({ success: true });
        })
        .catch((error) => {
          console.error('❌ Failed to clear cache:', error);
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;

    case 'GET_CACHE_STATS':
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.keys();
        })
        .then((keys) => {
          event.ports[0].postMessage({
            success: true,
            stats: {
              cacheName: CACHE_NAME,
              keyCount: keys.length,
              keys: keys.map(key => key.url)
            }
          });
        })
        .catch((error) => {
          event.ports[0].postMessage({ success: false, error: error.message });
        });
      break;

    case 'PREFETCH_DATA':
      // Prefetch common API endpoints
      const prefetchUrls = [
        '/api/variables',
        '/api/params',
        '/api/time'
      ];

      Promise.all(
        prefetchUrls.map(url =>
          fetch(url)
            .then(response => {
              if (response.ok) {
                return caches.open(CACHE_NAME)
                  .then(cache => cache.put(url, response.clone()));
              }
            })
            .catch(() => {
              // Ignore prefetch errors
            })
        )
      ).then(() => {
        console.log('🚀 Prefetch completed');
        event.ports[0].postMessage({ success: true });
      });
      break;
  }
});

console.log('🎯 Service Worker loaded');
