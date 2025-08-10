const CACHE_NAME = 'healthshift-v1.0.0';
const OFFLINE_URL = '/offline.html';

const STATIC_CACHE_URLS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline - API not available' }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'application/json',
            }),
          }
        );
      })
    );
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/') || caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // Handle other requests (assets, etc.)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Background sync for clock-in/out when offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'clock-sync') {
    event.waitUntil(syncClockData());
  }
});

async function syncClockData() {
  // Implement background sync logic for clock-in/out data
  // This would sync any pending clock actions when back online
  const pendingActions = await getStoredClockActions();
  
  for (const action of pendingActions) {
    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
      });
      
      // Remove from pending actions after successful sync
      await removeStoredClockAction(action.id);
    } catch (error) {
      console.error('Failed to sync clock action:', error);
    }
  }
}

async function getStoredClockActions() {
  // Get pending clock actions from IndexedDB
  return [];
}

async function removeStoredClockAction(id) {
  // Remove synced action from IndexedDB
}

// Push notifications for location-based reminders
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: data.tag,
    data: data.data,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'clock-in') {
    event.waitUntil(
      clients.openWindow('/dashboard?action=clock-in')
    );
  } else if (event.action === 'clock-out') {
    event.waitUntil(
      clients.openWindow('/dashboard?action=clock-out')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});