// Girocleta Service Worker for PWA, Offline Support & Push Notifications
const CACHE_NAME = 'girocleta-v32';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './configurador.html',
  './style.css',
  './app.js',
  './leaflet-rotate.js',
  './stations.json',
  './favicon.svg',
  './favicon-32x32.png',
  './favicon.ico',
  './girocleta-logo.svg',
  './girocleta-bike.svg',
  './girocleta_logo.png',
  './apple-touch-icon.png',
  './og-image.png',
  './manifest.json'
];

// Install Event: Skip waiting immediately to activate newest code
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('Cache addAll warning:', err));
    })
  );
});

// Activate Event: Claim clients and wipe previous caches immediately
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

// Fetch Event: Network-first for all UI assets so updates are immediate, with offline cache fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Live API for external CityBik data & dynamic tile proxy (never cache stale tiles in SW)
  if (url.hostname.includes('citybik.es') || url.pathname.startsWith('/api/') || url.pathname.startsWith('/tiles/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./stations.json'))
    );
    return;
  }

  // Network-first for local assets
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response && response.status === 200 && response.type === 'basic') {
        const cacheCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

// Push Event: Received from Apple APNs / Google FCM when device is in background/locked
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Girocleta', body: event.data.text() };
    }
  }

  const title = data.title || 'Girocleta';
  const options = {
    body: data.body || 'Informació de bicis disponible',
    icon: 'girocleta_logo.png',
    badge: 'girocleta-logo.svg',
    data: data.data || {},
    tag: data.tag || 'girocleta-server-alert',
    renotify: true,
    vibrate: [200, 100, 200]
  };

  event.waitUntil(self.registration.showNotification(title, options));
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
