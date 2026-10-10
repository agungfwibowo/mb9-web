import { $, root } from './core.js';

/* ---------------------------------------------------------
   PETUNJUK TAMPILAN SEDERHANA — di iPad & HP (≤1080px, tempat tombol
   Aa tampil): gelembung di bawah navbar yang menunjuk tombol Aa.
   Dua keadaan:
   - Pertama kali: "Huruf terlalu kecil? Coba tampilan sederhana" — sekali
     saja; tidak muncul lagi setelah tampil / pernah membuka /ringkas/.
   - Terakhir memakai /ringkas/ (mb9-view, diisi ringkas.js): tawaran
     "buka lagi" tiap kunjungan. ✕ = lebih suka tampilan lengkap → pilihan
     dihapus. Tidak muncul di sesi yang baru saja kembali dari /ringkas/
     lewat tautan "Tampilan lengkap" (mb9-view-skip).
   Muncul setelah preloader selesai, hilang sendiri, saat digulir, atau
   ditutup.
   --------------------------------------------------------- */
(() => {
  const hint = $('#navHint');
  if (!hint || !matchMedia('(max-width: 1080px)').matches) return;
  const KEY = 'mb9-ringkas-hint';
  const KEY_VIEW = 'mb9-view';
  let again = false;
  try {
    let skip = false;
    try { skip = !!sessionStorage.getItem('mb9-view-skip'); } catch (e) { /* storage diblokir */ }
    again = localStorage.getItem(KEY_VIEW) === 'ringkas' && !skip;
    if (!again && localStorage.getItem(KEY)) return;
  } catch (e) { return; } // storage diblokir → tidak bisa diingat, jangan muncul tiap kunjungan
  if (again) {
    const link = hint.querySelector('a');
    link.textContent = 'Terakhir Anda memakai tampilan sederhana. ';
    link.append(Object.assign(document.createElement('b'), { textContent: 'Buka lagi' }));
  }
  const DELAY = 1500;                    // setelah preloader selesai (is-loaded)
  const SHOW_MS = again ? 12000 : 9000;  // lama tampil
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
    if (!again) try { localStorage.setItem(KEY, '1'); } catch (e) { /* mode privat */ }
    hint.hidden = false;
    void hint.offsetWidth; // reflow agar transisi masuk jalan
    hint.classList.add('is-in');
    addEventListener('scroll', onScroll, { passive: true });
    hideT = setTimeout(hide, SHOW_MS);
  };
  $('#navHintClose').addEventListener('click', () => {
    if (again) try { localStorage.removeItem(KEY_VIEW); } catch (e) { /* mode privat */ }
    hide();
  });
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
