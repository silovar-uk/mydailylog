const CACHE_NAME = 'mydailylog-v34';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './desktop-input.css',
  './ui-cleanup.js',
  './runtime-log-title.js',
  './mobile-composer-flow.js',
  './draft-sidepanel.css',
  './memo-collapsed-hint.css',
  './draft-sidepanel.js',
  './inline-log-edit.css',
  './inline-log-edit.js',
  './memo-shortcuts.js',
  './log-card-ux.css',
  './log-card-ux.js',
  './day-copy.css',
  './day-copy.js',
  './day-tidy.css',
  './day-tidy.js',
  './ui-language-meter.css',
  './ui-language-meter.js',
  './day-title-format.js',
  './memo-terminology.js',
  './settings-storage-help.css',
  './settings-storage-help.js',
  './review-removal.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((key) => key.startsWith('mydailylog-') && key !== CACHE_NAME)
    .map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
        return response;
      })
      .catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)
    .then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    })));
});