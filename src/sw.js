import {precacheAndRoute, cleanupOutdatedCaches} from 'workbox-precaching';
import {NavigationRoute, registerRoute} from 'workbox-routing';
import {CacheFirst} from 'workbox-strategies';
import {CacheableResponsePlugin} from 'workbox-cacheable-response';
import {ExpirationPlugin} from 'workbox-expiration';

// ---------------------------------------------------------------------------
// Precaching — the InjectManifest plugin populates __WB_MANIFEST with
// content-hashed filenames from the webpack build.  When a new build is
// deployed the manifest changes, workbox detects the difference, and
// fetches only the updated assets.
// ---------------------------------------------------------------------------
precacheAndRoute(self.__WB_MANIFEST || []);

// Remove old caches left behind by previous service worker versions
cleanupOutdatedCaches();

// ---------------------------------------------------------------------------
// SPA navigation — serve index.html for all navigation requests
// ---------------------------------------------------------------------------
import {createHandlerBoundToURL} from 'workbox-precaching';
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler);
registerRoute(navigationRoute);

// ---------------------------------------------------------------------------
// Runtime caching — images and fonts only.
//
// JS and CSS are NOT runtime-cached here because they are already covered
// by the precache manifest (with content hashes).  The old
// StaleWhileRevalidate rule for .js/.css was the main reason users saw
// stale versions after a deploy — it served the cached copy first and
// only fetched the new one in the background.
// ---------------------------------------------------------------------------
registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif)$/,
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

registerRoute(
  new RegExp('https://fonts.(?:googleapis|gstatic).com/(.*)'),
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ---------------------------------------------------------------------------
// Lifecycle — activate the new service worker immediately so users get
// the update on their next page load, without needing Ctrl+Shift+R.
// ---------------------------------------------------------------------------

// Skip the waiting phase so the new SW takes over as soon as it's installed
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Claim all open tabs so the new SW controls them immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Also honour explicit skipWaiting messages from the app (belt and braces)
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
