import { $, root } from './core.js';

/* ---------------------------------------------------------
   NAVBAR — sembunyi saat gulir ke bawah, bilah progres, dan kunci
   tampil saat scroll otomatis. Hanya definisi (tanpa efek samping),
   dimuat awal karena lockNav dipakai tenant, asatidz, denah, lenis.
   --------------------------------------------------------- */
export const nav = $('#nav');
const bar = $('.scroll-progress span');
let lastY = 0;
// Saat scroll otomatis (klik menu/anchor), navbar dikunci tetap tampil.
// Snap hero (CSS, perangkat sentuh) ikut dimatikan selama itu: Safari
// menarik tiap langkah guliran Lenis kembali ke hero, jadi anchor tak sampai.
export let navLocked = false, navLockT;
export const lockNav = (ms = 1600) => {
  navLocked = true;
  root.classList.add('snap-off');
  nav.classList.remove('is-hidden');
  clearTimeout(navLockT);
  navLockT = setTimeout(() => { navLocked = false; root.classList.remove('snap-off'); lastY = scrollY; }, ms);
};
export const onScroll = (y) => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  if (!root.classList.contains('menu-open') && !navLocked) nav.classList.toggle('is-hidden', y > lastY && y > 300);
  lastY = y;
};
