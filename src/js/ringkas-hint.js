import { $, root } from './core.js';

/* ---------------------------------------------------------
   PETUNJUK TAMPILAN SEDERHANA — sekali saja di iPad & HP (≤1080px,
   tempat tombol Aa tampil): gelembung di bawah navbar yang menunjuk
   tombol Aa. Muncul setelah preloader selesai, hilang sendiri, saat
   digulir, atau ditutup. Sudah pernah tampil / pernah membuka /ringkas/
   → tidak muncul lagi.
   --------------------------------------------------------- */
(() => {
  const hint = $('#navHint');
  if (!hint || !matchMedia('(max-width: 1080px)').matches) return;
  const KEY = 'mb9-ringkas-hint';
  try { if (localStorage.getItem(KEY)) return; } catch (e) { return; } // storage diblokir → tidak bisa diingat, jangan muncul tiap kunjungan
  const DELAY = 1500;     // setelah preloader selesai (is-loaded)
  const SHOW_MS = 9000;   // lama tampil
  let hideT = 0;
  const hide = () => {
    clearTimeout(hideT);
    removeEventListener('scroll', onScroll);
    hint.classList.remove('is-in');
    setTimeout(() => { hint.hidden = true; }, 400);
  };
  const onScroll = () => { if (scrollY > 80) hide(); };
  const show = () => {
    // menu terbuka / sudah menggulir jauh → lewati, coba lagi kunjungan berikutnya
    if (root.classList.contains('menu-open') || scrollY > 80) return;
    try { localStorage.setItem(KEY, '1'); } catch (e) { /* mode privat */ }
    hint.hidden = false;
    void hint.offsetWidth; // reflow agar transisi masuk jalan
    hint.classList.add('is-in');
    addEventListener('scroll', onScroll, { passive: true });
    hideT = setTimeout(hide, SHOW_MS);
  };
  $('#navHintClose').addEventListener('click', hide);
  $('#burger')?.addEventListener('click', hide);
  const start = () => setTimeout(show, DELAY);
  if (root.classList.contains('is-loaded')) start();
  else {
    const mo = new MutationObserver(() => {
      if (!root.classList.contains('is-loaded')) return;
      mo.disconnect();
      start();
    });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
  }
})();
