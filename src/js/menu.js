import { $, $$, lenis, root } from './core.js';

/* ---------------------------------------------------------
   MENU · SCROLL SPY (navbar & progress: navbar.js)
   --------------------------------------------------------- */
const burger = $('#burger');
const mmenu = $('#mobileMenu');
const setMenu = (open) => {
  root.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  mmenu.setAttribute('aria-hidden', !open);
  // modal Bagikan (dibuka dari logo di menu) tetap mengunci gulir halaman
  if (lenis) open ? lenis.stop() : !document.querySelector('.share-pop--modal:not([hidden])') && lenis.start();
};
burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
$$('a', mmenu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
// logo di menu: menu ditutup, modal Bagikan-nya (dipasang lebih awal) tetap terbuka
$('#menuShare')?.addEventListener('click', () => setMenu(false));
addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
// Layar melebar melewati breakpoint: tombol burger ikut hilang (display:none di
// atas 860px), jadi menu yang tertinggal terbuka tidak bisa ditutup lagi —
// sekalian melepas kunci scroll Lenis yang dipasang saat membuka.
matchMedia('(min-width: 861px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });


const links = $$('.nav__links a');
const spy = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach((s) => spy.observe(s));
