// Service Worker for Apple Wallet (.pkpass) direct delivery
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

const passStore = new Map();

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'STORE_PASS') {
        passStore.set(event.data.filename, event.data.bytes);
        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true });
        }
    }
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.pathname.includes('/wallet-pass/')) {
        const parts = url.pathname.split('/wallet-pass/');
        const filename = decodeURIComponent(parts[1] || 'pass.pkpass');
        const passBytes = passStore.get(filename);

        if (passBytes) {
            event.respondWith(
                new Response(passBytes, {
                    status: 200,
                    statusText: 'OK',
                    headers: {
                        'Content-Type': 'application/vnd.apple.pkpass',
                        'Content-Disposition': `attachment; filename="${filename}"`,
                        'Cache-Control': 'no-store, no-cache, must-revalidate'
                    }
                })
            );
        }
    }
});

