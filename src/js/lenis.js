import { $, finePointer, hasGsap, lenis, reduced, root, setLenis, stripIndex } from './core.js';
import { lockNav, navLocked, onScroll } from './navbar.js';
import { chosenDay, isPastDay } from './jadwal.js';
import { picked, slug } from './denah.js';

/* ---------------------------------------------------------
   SMOOTH SCROLL (Lenis)
   --------------------------------------------------------- */
if (window.Lenis && !reduced) {
  setLenis(new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) }));
  lenis.on('scroll', (e) => { onScroll(e.scroll); if (hasGsap) ScrollTrigger.update(); });
  if (hasGsap) {
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
} else {
  addEventListener('scroll', () => onScroll(scrollY), { passive: true });
}
// Anchor links — dipakai juga oleh deep link saat load (lihat bootHash)
export const goToHash = (id) => {
  const target = id === '#home' ? document.body : document.getElementById(id.slice(1));
  if (!target) return false;
  lockNav();
  if (lenis) lenis.scrollTo(id === '#home' ? 0 : target, { offset: -20, onComplete: () => lockNav(250) });
  else (id === '#home' ? scrollTo({ top: 0, behavior: 'smooth' }) : target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }));
  // URL hanya membawa parameter yang relevan dengan section tujuan:
  // ?hari → #jadwal, ?tenant/?tenda → #denah; selain itu dibuang
  const KEEP = { '#jadwal': ['hari'], '#denah': ['tenant', 'tenda'] };
  const url = new URL(location.href);
  url.pathname = stripIndex(url.pathname);
  [...url.searchParams.keys()].forEach((k) => { if (!(KEEP[id] || []).includes(k)) url.searchParams.delete(k); });
  // kembali ke section-nya: pilihan yang masih aktif di layar ditulis lagi
  if (id === '#jadwal' && chosenDay && !isPastDay(chosenDay) && !url.searchParams.has('hari')) url.searchParams.set('hari', chosenDay);
  if (id === '#denah' && picked && !url.searchParams.has('tenant') && !url.searchParams.has('tenda')) {
    url.searchParams.set(picked.dataset.tenant ? 'tenant' : 'tenda', picked.dataset.tenant ? slug(picked.dataset.tenant) : picked.dataset.n);
  }
  url.hash = id;
  history.replaceState(null, '', url);
  return true;
};
// Snap hanya di hero: hero jadi satu "layar" yang menempel — berhenti menggulir
// (roda/trackpad diam 260ms) selagi posisi tujuan masih di dalam hero → halaman
// meluncur ke tepi hero sesuai arah bila sudah terdorong ≥25% (turun → tepi bawah
// hero, naik → atas hero); kurang dari itu kembali ke tepi asal. Di luar hero gulir bebas. Dihitung dari roda (bukan dari
// luncuran Lenis yang masih ±1 dtk) agar snap terasa segera. HP memakai CSS
// scroll-snap proximity (lihat .snap-hero di CSS).
// hanya bila isi hero muat satu layar — kalau lebih tinggi (layar pendek/landscape)
// snap akan melompati sebagian isinya, jadi dimatikan
const heroEl = $('#home');
const heroFits = () => !!heroEl && heroEl.offsetHeight <= innerHeight + 2;
if (lenis && finePointer && !reduced) {
  const hero = heroEl;
  let snapping = false, idleT = 0, dir = 0;
  addEventListener('wheel', (e) => {
    if (!hero || snapping || navLocked || root.classList.contains('menu-open') || lenis.isStopped || !heroFits()) return;
    if (e.deltaY) dir = Math.sign(e.deltaY);
    clearTimeout(idleT);
    idleT = setTimeout(() => {
      const end = hero.offsetHeight;
      const y = lenis.targetScroll ?? lenis.scroll; // posisi tujuan luncuran saat ini
      if (snapping || navLocked || y <= 2 || y >= end - 2) return;
      // butuh dorongan cukup (≥25% hero) ke arah itu; kurang dari itu kembali ke tepi asal
      const to = dir > 0 ? (y > end * 0.25 ? end : 0) : (y < end * 0.75 ? 0 : end);
      snapping = true;
      // easeInOutSine: berangkat & mendarat pelan
      lenis.scrollTo(to, { duration: 1.2, easing: (t) => -(Math.cos(Math.PI * t) - 1) / 2, lock: true, force: true, onComplete: () => { snapping = false; } });
    }, 260);
  }, { passive: true });
}
const syncSnap = () => root.classList.toggle('snap-hero', !finePointer && !reduced && heroFits());
syncSnap();
addEventListener('resize', syncSnap, { passive: true });
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  if (goToHash(a.getAttribute('href'))) e.preventDefault();
});
