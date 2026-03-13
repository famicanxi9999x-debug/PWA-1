import { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } from 'workbox-precaching';
import { setCatchHandler, registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim } from 'workbox-core';
import { getPendingActions, removePendingAction } from '../lib/offlineQueue';

// Cache Names
const CURRENT_CACHES = {
  appShell: 'app-shell-v1',
  api: 'api-cache-v1',
  image: 'image-cache-v1',
};
const ALL_CURRENT_CACHES = Object.values(CURRENT_CACHES);

// Take control of all clients immediately when a new SW activates
self.skipWaiting();
clientsClaim();

// Remove outdated caches from previous versions
cleanupOutdatedCaches();

// Precache all build assets (injected by vite-plugin-pwa)
// Precache all build assets (injected by vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST);

// Provide a custom fallback response for failed navigation requests
setCatchHandler(async ({ request }) => {
    // If this is a navigation request, it means the user is trying to load a new page.
    if (request.mode === 'navigate') {
        const fallback = await matchPrecache('/offline.html');
        return fallback || Response.error();
    }

    // Fallbacks for other request types can be added here
    return Response.error();
});

// 1. APP SHELL (Cache-First)
// Vite precacheAndRoute handles the bundled assets, but we catch any external or runtime loaded scripts/styles here
registerRoute(
    ({ request }) => request.destination === 'script' || request.destination === 'style' || request.destination === 'worker',
    new CacheFirst({
        cacheName: CURRENT_CACHES.appShell,
        plugins: [
            new ExpirationPlugin({
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
            }),
        ],
    })
);

// 2. API CALLS (Stale-While-Revalidate)
registerRoute(
    ({ url }) => url.pathname.startsWith('/api') || url.pathname.includes('supabase.co/rest/v1'),
    new StaleWhileRevalidate({
        cacheName: CURRENT_CACHES.api,
        plugins: [
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
            }),
        ],
    })
);

// 3. NAVIGATION (Network-First with offline fallback handled by setCatchHandler)
registerRoute(
    ({ request }) => request.mode === 'navigate',
    new NetworkFirst({
        networkTimeoutSeconds: 3,
        cacheName: CURRENT_CACHES.appShell,
    })
);

// 4. IMAGES (Cache-First)
registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
        cacheName: CURRENT_CACHES.image,
        plugins: [
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
            }),
        ],
    })
);

// 5. CACHE CLEANUP
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => !ALL_CURRENT_CACHES.includes(k) && !k.includes('workbox-precache')).map((k) => caches.delete(k))
            )
        )
    );
});

// Listen to Push Notifications
self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: data.icon || '/vite.svg',
            badge: '/vite.svg',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '2'
            }
        };
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Listen to Background Sync 
self.addEventListener('sync', function (event) {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncPendingData());
    }
});

async function syncPendingData() {
    try {
        const actions = await getPendingActions();
        if (!actions || actions.length === 0) return;

        console.log(`[SW] Found ${actions.length} pending actions to sync.`);

        for (const action of actions) {
            try {
                const response = await fetch(action.url, {
                    method: action.method,
                    headers: action.headers || {
                        'Content-Type': 'application/json'
                    },
                    body: action.payload
                });

                // If successful or if it's a hard error like 400 (Bad Request) where retrying won't help
                if (response.ok || response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) { 
                    await removePendingAction(action.id);
                    console.log(`[SW] Synced action: ${action.id}`);
                } else {
                    console.error(`[SW] Failed to sync action: ${action.id}, status: ${response.status}`);
                    // Leave it in the queue for the next sync cycle (e.g. 500 server error)
                }
            } catch (err) {
                console.error(`[SW] Network error during sync of action: ${action.id}`, err);
                // Keep in queue
            }
        }

        // Notify all open clients that sync is complete
        const clientsList = await self.clients.matchAll();
        for (const client of clientsList) {
            client.postMessage({ type: 'SYNC_COMPLETE' });
        }
    } catch (err) {
        console.error('[SW] Error during background sync process:', err);
    }
}

// === PUSH NOTIFICATION HANDLERS ===

self.addEventListener('push', (event) => {
    let data = { title: 'Fameo Life OS', body: 'Time to focus and build your habits!' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        },
        actions: [
            {action: 'explore', title: 'Open Fameo', icon: '/icons/icon-192.png'},
            {action: 'close', title: 'Close', icon: '/icons/icon-192.png'},
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Default action opens the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
