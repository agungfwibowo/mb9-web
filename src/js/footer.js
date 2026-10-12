import { $ } from './core.js';
import { nav } from './navbar.js';

/* ---------------------------------------------------------
   FOOTER REVEAL — footer sticky di belakang main (footer.css) tidak ikut
   tergulir, jadi bila footer + navbar lebih tinggi dari layar, bagian atas
   footer selamanya tertutup navbar. Saat itu efek dimatikan (.is-flat →
   footer kembali mengalir biasa). Tinggi alur sama, jadi tak perlu refresh
   ScrollTrigger.
   --------------------------------------------------------- */
const footer = $('.footer');
if (footer) {
  const fit = () => {
    // offsetTop/Height tidak terpengaruh transform .is-hidden navbar
    const navH = nav ? nav.offsetTop + nav.offsetHeight : 0;
    footer.classList.toggle('is-flat', footer.offsetHeight + navH > innerHeight);
  };
  // Noise + blur pekat penuh selama footer tersingkap; setelah ambang tercapai dan
  // bertahan 600ms baru glitch lalu jelas (.is-clearing, seperti sinyal baru
  // tertangkap). Hanya sekali per muat halaman. Ambang: 90% tersingkap (efek tirai)
  // atau 25% masuk layar (.is-flat, footer mengalir biasa & lebih tinggi dari layar).
  // Terlihat = jarak #footerEnd ke dasar layar — footer persis di bawahnya, jadi
  // rumusnya sama di kedua mode.
  const end = $('#footerEnd');
  const CLEAR = .9, CLEAR_FLAT = .25, HOLD = 600, FADE = 900; // FADE = durasi foot-glitch + jeda terbesar (footer.css)
  let raf = 0, last = -1, done = false, holdT = 0;
  const noise = () => {
    raf = 0;
    let n = 0, vis = false;
    if (end && !done) {
      const p = (innerHeight - end.getBoundingClientRect().top) / footer.offsetHeight;
      const clear = footer.classList.contains('is-flat') ? CLEAR_FLAT : CLEAR;
      vis = p > 0;
      n = 1;
      // tergulir mundur di bawah ambang sebelum 600ms → hitungan diulang
      if (p >= clear && !holdT) holdT = setTimeout(() => {
        done = true;
        footer.classList.add('is-clearing');
        setTimeout(() => footer.classList.remove('is-clearing'), FADE);
        queue();
      }, HOLD);
      else if (p < clear && holdT) { clearTimeout(holdT); holdT = 0; }
    }
    n = Math.round(n * 100) / 100;
    const key = vis ? n : -2; // di belakang main (belum tersingkap) → animasi tak perlu jalan
    if (key === last) return;
    last = key;
    footer.classList.toggle('is-noise', vis && n > 0);
    footer.style.setProperty('--fn', n);
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(noise); };
  const refit = () => { fit(); queue(); };
  refit();
  addEventListener('resize', refit);
  addEventListener('scroll', queue, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(refit).observe(footer);
}
