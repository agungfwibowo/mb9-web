/* =========================================================
   SERVICE WORKER — agar halaman tetap terbuka saat sinyal mati
   di lokasi acara. Naikkan VERSION setiap rilis: cache lama
   otomatis dibuang saat worker baru aktif.
   ========================================================= */
const VERSION = 'mb9-1.1.338';
// Versi aset diambil dari VERSION, jadi cukup satu kali naik versi dan URL
// ?v= di sini selalu sama persis dengan yang ditulis index.html.
const V = VERSION.slice(VERSION.indexOf('-') + 1);
const CORE = [
  './', './index.html', './privasi/', './manifest.webmanifest',
  `assets/css/style.css?v=${V}`, `assets/js/data-prod.js?v=${V}`, `assets/js/data-dev.js?v=${V}`, `assets/js/main.js?v=${V}`,
  'assets/fonts/public-sans-latin.woff2', 'assets/fonts/roboto-mono-latin.woff2', 'assets/fonts/noto-sans-mono-blocks.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      // addAll gagal total kalau satu URL meleset — pakai per-item agar tidak menggagalkan instalasi
      .then((c) => Promise.allSettled(CORE.map((u) => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const putCopy = (req, res) => {
  // clone HARUS diambil sekarang juga: badan response hanya bisa dibaca sekali
  const copy = res.clone();
  caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
};

// Precache lanjutan dari halaman: daftar gambar (termasuk logo lazy yang belum
// pernah terlihat) dan script CDN dikirim main.js setelah halaman dirender.
// Daftar ditulis tangan di sini akan basi tiap kali tenant/sponsor ditambah;
// halaman selalu tahu daftar terbarunya. Tanpa ini, aset yang dimuat sebelum
// worker aktif (kunjungan pertama) tidak pernah tersimpan — pengunjung yang
// memasang aplikasi di rumah bisa mendapati logo kosong saat offline di lokasi.
self.addEventListener('message', (e) => {
  const d = e.data;
  if (!d || d.type !== 'precache' || !Array.isArray(d.urls)) return;
  e.waitUntil(caches.open(VERSION).then((c) => Promise.allSettled(d.urls.map(async (u) => {
    if (await c.match(u)) return;
    const same = new URL(u).origin === self.location.origin;
    const res = await fetch(u, same ? undefined : { mode: 'no-cors' }).catch(() => null);
    if (res && (res.ok || res.type === 'opaque')) await c.put(u, res);
  }))));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Manifest ikut jaringan-dulu: Chrome membacanya untuk menentukan
  // installability & related_applications — versi basi dari cache bikin
  // getInstalledRelatedApps() tidak pernah cocok.
  // Halaman selain beranda (mis. /privasi/) disimpan di kunci sendiri; tanpa
  // ini membuka halaman lain akan menimpa salinan offline index.html.
  // Dihitung relatif ke folder sw.js agar tetap benar bila situs dilayani
  // dari subfolder (mis. username.github.io/mb9-web/).
  const path = new URL(req.url).pathname;
  const base = new URL('./', self.location).pathname;
  if (req.mode === 'navigate' || path.endsWith('.webmanifest')) {
    const page = path === base || path === base + 'index.html' ? './index.html' : path;
    const key = req.mode === 'navigate' ? page : req;
    e.respondWith(
      fetch(req)
        .then((res) => { putCopy(key, res); return res; })
        .catch(() => caches.match(key)),
    );
    return;
  }

  // Aset (css/js/gambar/font): tampilkan dari cache, perbarui diam-diam di latar
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) putCopy(req, res);
          return res;
        })
        .catch(() => hit);
      return hit || net;
    }),
  );
});
