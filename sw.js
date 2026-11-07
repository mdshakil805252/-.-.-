/* ================================================
   মেসার্স এস.এম. ট্রেডার্স - Service Worker
   ভার্সন: v2 (HTML আপডেট করলে এই নম্বর বাড়ান)
   ================================================ */

const CACHE_NAME = 'sm-traders-v2';
const RUNTIME_CACHE = 'sm-traders-runtime-v2';

// অ্যাপের মূল ফাইলগুলো (অফলাইনে চালানোর জন্য)
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// ─────────────────────────────────────────────
// ১. Install — কোর ফাইল ক্যাশ করা
// ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(CORE_ASSETS).catch((err) => {
          console.warn('কিছু কোর ফাইল ক্যাশ হয়নি:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// ─────────────────────────────────────────────
// ২. Activate — পুরানো ক্যাশ মুছে ফেলা
// ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== RUNTIME_CACHE) {
            console.log('পুরানো ক্যাশ মুছে ফেলা হচ্ছে:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ─────────────────────────────────────────────
// ৩. Fetch — রিকোয়েস্ট হ্যান্ডেল
// ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // শুধু GET রিকোয়েস্ট হ্যান্ডেল করব
  if (req.method !== 'GET') return;

  // HTML / নেভিগেশন রিকোয়েস্ট → Network First (নতুন আপডেট পেতে)
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // CDN (fonts, html2pdf) → Cache First
  if (req.url.includes('cdnjs.cloudflare.com') || req.url.includes('fonts.g')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // বাকি সব (CSS/JS/Icon) → Cache First, fallback Network
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        // যদি offline-এ থাকে এবং HTML চায় → index.html দাও
        if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ─────────────────────────────────────────────
// ৪. মেসেজ — App থেকে ক্যাশ ক্লিয়ার/আপডেট
// ─────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});
