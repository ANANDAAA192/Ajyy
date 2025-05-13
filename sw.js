const CACHE_NAME = 'blog-cache-v1';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cachedResponse = await cache.match(event.request);
      const now = Date.now();

      // Try to reuse if it's not expired
      if (cachedResponse) {
        const storedTime = await cache.match(event.request.url + '-timestamp');
        if (storedTime) {
          const text = await storedTime.text();
          const saved = parseInt(text);
          if ((now - saved) < CACHE_DURATION) {
            return cachedResponse;
          } else {
            // expired, try to update
            cache.delete(event.request);
            cache.delete(event.request.url + '-timestamp');
          }
        }
      }

      // Try to fetch fresh and cache it
      return fetch(event.request).then(async response => {
        if (response.ok && (event.request.method === 'GET')) {
          cache.put(event.request, response.clone());
          cache.put(event.request.url + '-timestamp', new Response(now.toString()));
        }
        return response;
      }).catch(() => {
        return cachedResponse || Response.error();
      });
    })
  );
});
