const CACHE_NAME = "condo-admin-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./db.js",
  "./ai.js",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css",
  "https://unpkg.com/boxicons@2.1.4/fonts/boxicons.woff2",
  "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap"
];

// Install Event
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching essential PWA static assets...");
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Removing old cache versions...");
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache First with Network Fallback
self.addEventListener("fetch", (e) => {
  // Only cache GET requests
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        // Save dynamically fetched requests to cache (optional, keep it simple for now)
        return networkResponse;
      }).catch(() => {
        // Offline backup fallback if needed
      });
    })
  );
});
