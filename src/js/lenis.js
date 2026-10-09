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
// Snap hanya di hero: hero jadi satu "layar" yang menempel. Selagi posisi masih
// di dalam hero, setelah gulir berhenti halaman meluncur ke tepi hero sesuai
// arah bila sudah terdorong ≥25% (turun → tepi bawah hero, naik → atas hero);
// kurang dari itu kembali ke tepi asal. Di luar hero gulir bebas. Luncurannya
// 1,2 dtk easeInOutSine (berangkat & mendarat pelan) — di perangkat sentuh
// juga lewat JS, bukan CSS scroll-snap yang kecepatannya diatur browser (terlalu cepat).
// Hanya bila isi hero muat satu layar — kalau lebih tinggi (layar pendek/landscape)
// snap akan melompati sebagian isinya, jadi dimatikan.
const heroEl = $('#home');
const heroFits = () => !!heroEl && heroEl.offsetHeight <= innerHeight + 2;
const easeSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
let snapping = false, snapDir = 0;
const snapHero = (y) => {
  if (!heroEl || snapping || navLocked || root.classList.contains('menu-open') || root.classList.contains('snap-boot') || (lenis && lenis.isStopped) || !heroFits()) return;
  const end = heroEl.offsetHeight;
  if (y <= 2 || y >= end - 2) return;
  // butuh dorongan cukup (≥25% hero) ke arah itu; kurang dari itu kembali ke tepi asal
  const to = snapDir > 0 ? (y > end * 0.25 ? end : 0) : (y < end * 0.75 ? 0 : end);
  snapping = true;
  const done = () => { snapping = false; };
  if (lenis) lenis.scrollTo(to, { duration: 1.2, easing: easeSine, lock: true, force: true, onComplete: done });
  else { scrollTo({ top: to, behavior: 'smooth' }); setTimeout(done, 900); }
};
if (!reduced && finePointer && lenis) {
  // mouse/trackpad: dihitung dari roda (diam 260ms), bukan dari luncuran Lenis
  // yang masih ±1 dtk, agar snap terasa segera
  let idleT = 0;
  addEventListener('wheel', (e) => {
    if (e.deltaY) snapDir = Math.sign(e.deltaY);
    clearTimeout(idleT);
    idleT = setTimeout(() => snapHero(lenis.targetScroll ?? lenis.scroll), 260); // posisi tujuan luncuran saat ini
  }, { passive: true });
} else if (!reduced && !finePointer) {
  // sentuh: setelah jari diangkat DAN guliran momentum berhenti (140ms tanpa
  // event scroll). Menyentuh lagi saat meluncur → luncuran dibatalkan.
  let touching = false, lastY = scrollY, idleT = 0;
  const later = () => { clearTimeout(idleT); idleT = setTimeout(() => { if (!touching) snapHero(scrollY); }, 140); };
  addEventListener('touchstart', () => {
    touching = true;
    clearTimeout(idleT);
    if (snapping) { snapping = false; if (lenis) lenis.scrollTo(scrollY, { immediate: true, force: true }); }
  }, { passive: true });
  addEventListener('touchend', () => { touching = false; later(); }, { passive: true });
  addEventListener('touchcancel', () => { touching = false; later(); }, { passive: true });
  addEventListener('scroll', () => {
    const y = scrollY;
    if (y !== lastY) snapDir = Math.sign(y - lastY);
    lastY = y;
    if (!touching && !snapping) later();
  }, { passive: true });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  if (goToHash(a.getAttribute('href'))) e.preventDefault();
});
