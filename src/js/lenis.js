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
// Snap di hero (+ Asatidz, lihat sectionTo): hero jadi satu "layar" yang menempel. Selagi posisi masih
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
// posisi awal guliran jari (layar sentuh; null = roda/trackpad), lihat `exit`
let fromY = null;
// Section lain yang muat satu layar (kini hanya Asatidz): bila sudah masuk
// ≥25% layar menurut arah gulir, halaman meluncur sampai atas section = atas
// layar (section tampil utuh). Kurang dari itu, atau sudah melewatinya, gulir bebas.
// both: section juga punya tepi bawah seperti hero — dari dalam section, dorongan
// ≥25% ke bawah meluncur ke bawahnya (section berikutnya rata atas layar).
// exit: section yang lebih tinggi dari layar (Tentang, Layanan — termasuk jarak pin-nya, Denah) — hanya ekornya: antara
// "bawah section = bawah layar" (a) dan "bawah section = atas layar" (b),
// dorongan ≥25% layar ke suatu arah meluncur ke tepi itu, kurang → kembali.
// enter: section lebih tinggi dari layar (Penyelenggara) — hanya sisi atasnya,
// sama seperti sisi atas `both`: dari peta, dorongan ≥25% layar meluncur sampai
// atas section = atas layar. mobile: aturan hanya berlaku di HP (≤860px) —
// ekor Penyelenggara → footer.
const isMobile = matchMedia('(max-width: 860px)');
const snapEls = [['#tentang', false, true], ['#layanan', false, true], ['#asatidz', true], ['#denah', false, true], ['#sponsor', false, false, true], ['#sponsor', false, true, false, true]]
  .map(([s, both, exit, enter, mobile]) => ({ el: $(s), both, exit, enter, mobile })).filter((x) => x.el);
const sectionTo = (y) => {
  const vh = innerHeight;
  for (const { el, both, exit, enter, mobile } of snapEls) {
    if (mobile && !isMobile.matches) continue;
    const h = el.offsetHeight;
    if (enter) {
      const t = el.getBoundingClientRect().top + scrollY, a = t - vh;
      if (y > a + 2 && y < t - 2) return snapDir > 0 ? (y - a > vh * 0.25 ? t : a) : (y - a < vh * 0.75 ? a : t);
      continue;
    }
    if (exit) {
      const b = el.getBoundingClientRect().bottom + scrollY, a = b - vh;
      // naik dari section di bawahnya (mis. dari peta Lokasi/Tenant) dan
      // berhenti saat ekor section ini terlihat → jangan ditarik masuk;
      // ekor hanya dilabuhkan bila gulirannya dimulai dari dalam zona
      if (snapDir < 0 && fromY != null && fromY >= b - 2) continue;
      if (y > a + 2 && y < b - 2) return snapDir > 0 ? (y - a > vh * 0.25 ? b : a) : (y - a < vh * 0.75 ? a : b);
      continue;
    }
    if (h > vh + 2) continue; // lebih tinggi dari layar → snap akan melompati isinya
    const t = el.getBoundingClientRect().top + scrollY; // posisi gulir nyata (y bisa = tujuan luncuran Lenis)
    if (Math.abs(y - t) <= 2 || (both && Math.abs(y - t - h) <= 2)) continue;
    // both, sisi atas: antara "akhir section sebelumnya = bawah layar" (t - vh) dan
    // "section ini = atas layar" (t) — dorongan ≥25% layar pindah tepi, kurang → kembali
    if (both && y > t - vh + 2 && y < t - 2) {
      const a = t - vh;
      return snapDir > 0 ? (y - a > vh * 0.25 ? t : a) : (y - a < vh * 0.75 ? a : t);
    }
    if (both && y > t && y < t + h) return snapDir > 0 ? (y - t > h * 0.25 ? t + h : t) : (y - t < h * 0.75 ? t : t + h);
    // turun: atas section sudah naik ke 75% atas layar; naik: section terbuka ≥25% dari atasnya
    if (snapDir > 0 && y < t && t - y < vh * 0.75) return t;
    if (snapDir < 0 && y > t && y - t < h * 0.75) return t;
  }
  return null;
};
const snapHero = (y) => {
  if (snapping || navLocked || root.classList.contains('menu-open') || root.classList.contains('snap-boot') || (lenis && lenis.isStopped)) return;
  const end = heroEl ? heroEl.offsetHeight : 0;
  let to = null, dur = 1.2;
  if (heroEl && heroFits() && y > 2 && y < end - 2) {
    // butuh dorongan cukup (≥25% hero) ke arah itu; kurang dari itu kembali ke tepi asal
    to = snapDir > 0 ? (y > end * 0.25 ? end : 0) : (y < end * 0.75 ? 0 : end);
  } else if ((to = sectionTo(y)) !== null) dur = 0.9;
  if (to === null) return;
  snapping = true;
  const done = () => { snapping = false; };
  if (lenis) lenis.scrollTo(to, { duration: dur, easing: easeSine, lock: true, force: true, onComplete: done });
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
  // armed: snap hanya untuk guliran yang diawali jari. Event scroll tanpa
  // sentuhan (scroll anchoring saat gambar/konten termuat, address bar HP
  // menyusut, ScrollTrigger.refresh) dulu ikut memicu snap → halaman yang
  // didiamkan di ekor Denah tiba-tiba meluncur ke Tenant.
  // Sentuhan saja belum cukup: ketukan, geser peta Leaflet, atau sentuhan saat
  // kembali dari aplikasi lain juga memicu touchstart/touchend tanpa halaman
  // bergeser — dulu tetap memanggil snap dengan arah sisa guliran sebelumnya,
  // sehingga dari ekor Denah halaman melompat ke Tenant. Kini halaman harus
  // benar-benar bergeser ≥12px sejak jari menyentuh, dan arah snap diambil
  // dari total geseran itu (bukan delta event scroll terakhir).
  let touching = false, armed = false, startY = scrollY, lastY = scrollY, idleT = 0;
  const later = () => {
    clearTimeout(idleT);
    idleT = setTimeout(() => {
      if (touching || !armed) return;
      armed = false;
      const moved = scrollY - startY;
      if (Math.abs(moved) < 12) return;
      snapDir = Math.sign(moved);
      fromY = startY;
      snapHero(scrollY);
      fromY = null;
    }, 140);
  };
  addEventListener('touchstart', () => {
    touching = true; armed = true; startY = scrollY;
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
