import { $ } from './core.js';

/* ---------------------------------------------------------
   KEMBALI KE ATAS — tombol mengambang, hanya muncul saat footer
   terlihat (pengunjung sudah sampai akhir halaman).
   Klik ditangani handler anchor umum (lenis.js → gulir halus ke #home).
   --------------------------------------------------------- */
const toTop = $('#toTop');
const footer = $('footer');
if (toTop && footer) {
  new IntersectionObserver(([en]) => {
    toTop.classList.toggle('is-in', en.isIntersecting);
    // tersembunyi = tidak bisa difokus Tab
    toTop.tabIndex = en.isIntersecting ? 0 : -1;
  }).observe(footer);
}
