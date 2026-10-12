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
  new IntersectionObserver(([en]) => {
    const on = en.isIntersecting || en.boundingClientRect.top < 0;
    toTop.classList.toggle('is-in', on);
    // tersembunyi = tidak bisa difokus Tab
    toTop.tabIndex = on ? 0 : -1;
  }).observe(end);
}
