/**
 * Summit Metal Supply and Sales — Lead Collector offline helper
 * Upload this file to GitHub in the SAME folder as the lead page.
 *
 * It only handles the lead page and its logo (the page tells it which
 * files those are). Every other page on the site is left alone.
 *
 * With internet: always loads the newest version from GitHub and
 *                saves a copy on the tablet.
 * No internet:   opens the saved copy.
 */
const CACHE = 'summit-leads-offline';
const FILES = new Set(new URL(self.location).searchParams.getAll('f'));

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !FILES.has(url.pathname)) return;
  e.respondWith(networkFirst(req, url.origin + url.pathname));
});

function withTimeout(promise, ms){
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

async function networkFirst(req, key){
  const cache = await caches.open(CACHE);
  try {
    // Wi-Fi with no real internet can hang, so give up after 4 seconds
    const res = await withTimeout(fetch(req), 4000);
    if (res && res.ok) cache.put(key, res.clone());
    return res;
  } catch (err) {
    const saved = await cache.match(key);
    if (saved) return saved;
    throw err;
  }
}
