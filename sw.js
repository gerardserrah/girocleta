// Girocleta Service Worker for PWA, Offline Support & Push Notifications
const CACHE_NAME = 'girocleta-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './leaflet-rotate.js',
  './stations.json',
  './girocleta-logo.svg',
  './girocleta_logo.png',
  './manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('Cache addAll warning:', err));
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network first for live API, cache fallback for assets)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Always fetch live data from network without caching
  if (url.hostname.includes('citybik.es') || url.pathname.includes('stations.json')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./stations.json'))
    );
    return;
  }

  // Stale-while-revalidate for local UI assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networked = fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const cacheCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
        }
        return response;
      }).catch(() => cached);
      return cached || networked;
    })
  );
});

// Notification Click Event: Focus existing window or open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const stationId = event.notification.data ? event.notification.data.stationId : null;
  const targetUrl = './index.html' + (stationId ? `?station=${stationId}` : '');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes('girocleta') && 'focus' in client) {
          if (stationId) {
            client.postMessage({ type: 'SELECT_STATION', stationId: stationId });
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
