const CACHE_NAME = 'blog-cache-v1';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const now = Date.now();

      if (cached) {
        const date = new Date(cached.headers.get('date') || Date.now());
        if ((now - date.getTime()) < CACHE_DURATION) {
          return cached;
        } else {
          cache.delete(event.request);
        }
      }

      return fetch(event.request).then((response) => {
        const responseClone = response.clone();
        cache.put(event.request, responseClone);
        return response;
      }).catch(() => cached || Response.error());
    })
  );
});
