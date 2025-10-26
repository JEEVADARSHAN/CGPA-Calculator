// Service Worker

// Cache your app shell (optional, like index.html, CSS, JS)
const CACHE_NAME = "cit-gpa-cache-v1";
const APP_SHELL = [
    '/index.html',
    '/Assets/logo.png',
    '/Assets/warning.png',
    '/CSS/styles.css',
    '/CSS/theme.css',
    '/JS/main.js',
    '/JS/popup.js'
];


// Install
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

// Fetch
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
            .catch(() => {
                // Optional: you could serve a static offline.html here
            })
    );
});
