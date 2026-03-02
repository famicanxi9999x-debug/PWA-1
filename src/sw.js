import { precacheAndRoute } from 'workbox-precaching';
precacheAndRoute(self.__WB_MANIFEST);

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
    if (event.tag === 'sync-notes') {
        console.log('Syncing notes in the background...');
        event.waitUntil(syncNotes());
    }
});

async function syncNotes() {
    // Placeholder for actual sync logic reading from IndexedDB
    console.log('Notes background sync complete.');
}
