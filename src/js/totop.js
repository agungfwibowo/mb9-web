import { $ } from './core.js';

/* ---------------------------------------------------------
   KEMBALI KE ATAS — tombol mengambang, hanya muncul saat footer
   terlihat (pengunjung sudah sampai akhir halaman).
   Klik ditangani handler anchor umum (lenis.js → gulir halus ke #home).
   --------------------------------------------------------- */
const toTop = $('#toTop');
const end = $('#footerEnd');
if (toTop && end) {
  // footer sticky selalu "terlihat" → amati penanda akhir main; di atas layar
  // (footer lebih tinggi dari layar & sudah tergulir habis) tetap dihitung tersingkap
  let footerIn = false, leaving = false, idleT = 0;
  const show = (on) => {
    toTop.classList.toggle('is-in', on);
    // tersembunyi = tidak bisa difokus Tab
    toTop.tabIndex = on ? 0 : -1;
  };
  new IntersectionObserver(([en]) => {
    footerIn = en.isIntersecting || en.boundingClientRect.top < 0;
    if (!footerIn) leaving = false;
    if (!leaving) show(footerIn);
  }).observe(end);
  // Diketuk → langsung sembunyi (tidak menunggu footer tergulir lewat selama
  // luncuran ke atas) dan fokus dilepas. Bila gulirnya terhenti sementara
  // footer masih terlihat (mis. disentuh di tengah jalan), tombol muncul lagi.
  const restoreLater = (ms) => {
    clearTimeout(idleT);
    idleT = setTimeout(() => { if (leaving && footerIn) { leaving = false; show(true); } }, ms);
  };
  toTop.addEventListener('click', () => {
    leaving = true;
    show(false);
    toTop.blur();
    restoreLater(1500); // jaga-jaga bila halaman tidak bergulir sama sekali
  });
  addEventListener('scroll', () => { if (leaving) restoreLater(400); }, { passive: true });
}
