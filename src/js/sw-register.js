/* ---------------------------------------------------------
   SERVICE WORKER — offline di lokasi acara (sinyal sering mati).
   Didaftarkan setelah load agar tidak berebut bandwidth saat render awal.
   --------------------------------------------------------- */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  // Kirim daftar aset halaman ke worker agar tersimpan untuk offline (lihat
  // handler 'message' di sw.js). data-src ikut dikumpulkan: logo lazy yang
  // belum pernah di-scroll belum punya src. Font Google sengaja tidak ikut —
  // responsnya bervariasi per browser (Vary), sudah ditangani cache runtime.
  addEventListener('load', () => {
    const urls = new Set();
    const add = (v) => { if (v && !v.startsWith('data:')) { try { urls.add(new URL(v, location.href).href); } catch (_) {} } };
    const all = (s) => document.querySelectorAll(s); // sengaja tanpa import core: blok ini berdiri sendiri
    all('img').forEach((i) => { add(i.getAttribute('src')); add(i.dataset.src); });
    all('img[srcset], source[srcset]').forEach((s) => s.srcset.split(',').forEach((x) => add(x.trim().split(/\s+/)[0])));
    all('script[src]').forEach((s) => add(s.getAttribute('src')));
    const send = () => navigator.serviceWorker.ready.then((reg) => reg.active && reg.active.postMessage({ type: 'precache', urls: [...urls] }));
    // jangan berebut bandwidth dengan intro: tunggu browser senggang
    'requestIdleCallback' in window ? requestIdleCallback(send, { timeout: 8000 }) : setTimeout(send, 4000);
  });
}
