import { $ } from './core.js';

/* ---------------------------------------------------------
   AJAKAN PASANG APLIKASI — muncul beberapa detik setelah load,
   hanya kalau belum terpasang dan belum di-snooze. "Nanti" menunda
   1 hari; dengan kotak centang dicentang, tidak muncul lagi.
   --------------------------------------------------------- */
const a2hs = $('#a2hs');
if (a2hs) {
  // Dua kunci terpisah: menutup/memasang ajakan TIDAK boleh ikut membungkam
  // info "sudah terpasang" — kalau satu kunci, appinstalled menyimpan 'never'
  // dan infonya tidak pernah muncul lagi.
  const KEY_ASK = 'mb9-a2hs';        // ajakan pasang
  const KEY_HINT = 'mb9-a2hs-open';  // info aplikasi sudah terpasang
  let activeKey = KEY_ASK;           // kunci yang dipakai tombol "Nanti" saat ini
  const DELAY = 7000;          // beri ruang untuk preloader + intro
  const SNOOZE = 24 * 60 * 60 * 1000;
  const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* mode privat */ } };
  const muted = (k) => {
    try {
      const v = localStorage.getItem(k);
      return v === 'never' || (!!v && Date.now() < Number(v));
    } catch (e) { return false; }
  };
  const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const hide = () => {
    a2hs.classList.remove('is-in');
    setTimeout(() => { a2hs.hidden = true; }, 500);
  };
  // ?a2hsdebug — abaikan snooze & tampilkan hasil deteksi apa adanya,
  // untuk memastikan di perangkat sungguhan (API-nya Chromium-only)
  const debugMode = new URLSearchParams(location.search).has('a2hsdebug');
  const show = (key) => {
    activeKey = key;
    if ((!debugMode && (installed || muted(key))) || !a2hs.hidden) return;
    a2hs.hidden = false;
    void a2hs.offsetWidth; // paksa reflow agar state awal terpakai → transisi benar-benar jalan
    a2hs.classList.add('is-in');
  };

  let deferred = null;
  // Chrome/Android: tawaran pasang asli. Event ini bisa datang sebelum DELAY habis.
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    setTimeout(() => show(KEY_ASK), DELAY);
  });

  // Vendor browser: alur pemasangan berbeda-beda. Chrome/Edge Android
  // menampilkan progres di bilah notifikasi; Samsung Internet punya alurnya
  // sendiri; Firefox Android & semua browser iOS tidak punya event pasang.
  const ua = navigator.userAgent;
  const vendor = /SamsungBrowser/i.test(ua) ? 'samsung'
    : /EdgA/i.test(ua) ? 'edge'
    : /OPR\/|Opera/i.test(ua) ? 'opera'
    : /Firefox|FxiOS/i.test(ua) ? 'firefox'
    : /iphone|ipad|ipod/i.test(ua) ? 'ios'
    : /Android/i.test(ua) && /Chrome\//i.test(ua) ? 'chrome'
    : 'other';
  const WATCH = {
    chrome: 'Pantau progresnya di bilah notifikasi — tarik turun dari atas layar.',
    edge: 'Pantau progresnya di bilah notifikasi — tarik turun dari atas layar.',
    samsung: 'Samsung Internet sedang menambahkan ikonnya. Statusnya bisa muncul di bilah notifikasi di atas layar.',
  };

  // Status pemasangan (khusus mobile): di atas layar, caret menunjuk bilah
  // notifikasi. Halaman TIDAK bisa membaca progres asli dari sistem, jadi
  // yang ditampilkan status nyata dari event: pengguna menyetujui dialog
  // (sedang memasang) → appinstalled (selesai). "Terpasang" hanya sekali.
  const KEY_TOAST = 'mb9-install-toast';
  const toast = $('#itoast');
  const coarse = matchMedia('(pointer: coarse)');
  let toastT = 0, waitT = 0;
  const toastHide = () => {
    if (!toast) return;
    clearTimeout(toastT);
    toast.classList.remove('is-in');
    setTimeout(() => { if (!toast.classList.contains('is-in')) toast.hidden = true; }, 500);
  };
  const toastShow = (state, title, text, autoHide) => {
    if (!toast || !coarse.matches) return;
    toast.classList.remove('is-done', 'is-wait');
    if (state !== 'busy') toast.classList.add(`is-${state}`);
    $('#itoastTitle').textContent = title;
    $('#itoastText').textContent = text;
    if (toast.hidden) { toast.hidden = false; void toast.offsetWidth; } // reflow agar transisi masuk jalan
    toast.classList.add('is-in');
    clearTimeout(toastT);
    if (autoHide) toastT = setTimeout(toastHide, autoHide);
  };
  const toastDone = () => {
    clearTimeout(waitT);
    if (muted(KEY_TOAST)) { toastHide(); return; }
    store(KEY_TOAST, 'never');
    toastShow('done', 'Aplikasi terpasang', 'Buka MB9 dari ikon di layar utama — tampil penuh layar dan tetap jalan saat sinyal lemah.', 7000);
  };
  if (toast) $('#itoastClose').addEventListener('click', toastHide);
  // Dibuka pertama kali sebagai aplikasi. Satu-satunya sinyal di iOS (tidak
  // ada event pasang); di Android biasanya sudah tertangani appinstalled
  // karena penyimpanannya berbagi dengan Chrome, jadi tidak muncul dua kali.
  if (installed && !muted(KEY_TOAST)) setTimeout(toastDone, DELAY);

  // iOS Safari tidak punya beforeinstallprompt — hanya bisa diarahkan manual
  const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const webkit = iOS && !/crios|fxios|edgios/i.test(navigator.userAgent);
  if (webkit && !installed) {
    $('#a2hsText').textContent = 'Ketuk tombol Bagikan di Safari, lalu pilih “Tambah ke Layar Utama”.';
    $('#a2hsInstall').hidden = true;
    $('span', $('#a2hsLater')).textContent = 'Mengerti';
    setTimeout(() => show(KEY_ASK), DELAY);
  }

  // Sudah terpasang tapi dibuka lewat tab browser biasa. getInstalledRelatedApps()
  // bisa melaporkan PWA ini sendiri karena manifest mencantumkan
  // related_applications platform "webapp". Hanya Chromium; browser lain
  // mengembalikan undefined dan blok ini dilewati begitu saja.
  if (debugMode) {
    const dm = matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser';
    const api = navigator.getInstalledRelatedApps ? 'ADA' : 'TIDAK ADA';
    Promise.resolve(navigator.getInstalledRelatedApps ? navigator.getInstalledRelatedApps() : [])
      .catch((e) => `galat: ${e.message}`)
      .then((apps) => {
        $('#a2hsTitle').textContent = 'Diagnostik pemasangan';
        $('#a2hsText').textContent =
          `vendor: ${vendor} · API: ${api} · hasil: ${Array.isArray(apps) ? apps.length + ' app' : apps}`
          + ` · mode: ${dm} · ${location.protocol}`
          + ` · origin: ${location.origin}`
          + ` · manifest: ${(document.querySelector('link[rel=manifest]') || {}).href || '-'}`
          + ` · snooze: ${localStorage.getItem(KEY_ASK) || '-'} / ${localStorage.getItem(KEY_HINT) || '-'}`;
        $('#a2hsInstall').hidden = true;
        $('span', $('#a2hsLater')).textContent = 'Tutup';
        setTimeout(() => show(KEY_HINT), 1200);
      });
  }

  if (!installed && !webkit && navigator.getInstalledRelatedApps) {
    navigator.getInstalledRelatedApps().then((apps) => {
      if (!apps.length) return;
      $('#a2hsTitle').textContent = 'Aplikasi sudah terpasang';
      $('#a2hsText').textContent = 'Buka MB9 dari ikon di layar utama — tampil penuh layar dan tetap bisa dibuka saat sinyal lemah.';
      $('#a2hsInstall').hidden = true;
      $('span', $('#a2hsLater')).textContent = 'Mengerti';
      setTimeout(() => show(KEY_HINT), DELAY);
    }).catch(() => {});
  }

  $('#a2hsInstall').addEventListener('click', async () => {
    if (!deferred) return hide();
    hide();
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    if (outcome === 'dismissed') store(KEY_ASK, String(Date.now() + SNOOZE));
    if (outcome === 'accepted' && !muted(KEY_TOAST)) {
      toastShow('busy', 'Sedang memasang…', WATCH[vendor] || 'Statusnya bisa muncul di bilah notifikasi di atas layar.');
      // appinstalled tak kunjung datang → jangan biarkan bar berputar selamanya
      waitT = setTimeout(() => toastShow('wait', 'Belum ada konfirmasi',
        'Pemasangan mungkin masih berjalan — cek bilah notifikasi di atas layar.', 8000), 45000);
    }
  });
  $('#a2hsLater').addEventListener('click', () => {
    store(activeKey, $('#a2hsNever').checked ? 'never' : String(Date.now() + SNOOZE));
    hide();
  });
  // hanya membungkam ajakannya; info "sudah terpasang" tetap boleh muncul nanti
  // juga menangkap pemasangan lewat menu browser (tanpa tombol Pasang kita)
  addEventListener('appinstalled', () => { store(KEY_ASK, 'never'); hide(); toastDone(); });
}
