import { $, $$, D, esc } from './core.js';

/* ---------------------------------------------------------
   RENDER KONTEN DARI data-prod.js
   --------------------------------------------------------- */
const ICONS = {
  medis: '<svg viewBox="0 0 24 24"><path d="M3 12h4l2-5 4 10 2-5h6"/><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10"/></svg>',
  sosial: '<svg viewBox="0 0 24 24"><circle cx="8" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14 14.5c.9-.3 1.9-.5 3-.5 2.8 0 5 2.2 5 5"/></svg>',
  bazar: '<svg viewBox="0 0 24 24"><path d="M3 9 5 4h14l2 5M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9ZM5 13v7h14v-7M10 20v-4h4v4"/></svg>',
};

// Layanan cards
export const track = $('#layananTrack');
track.innerHTML = D.layanan.map((l, i) => `
    <article class="lcard">
      <span class="lcard__num mono">0${i + 1} / 0${D.layanan.length}</span>
      ${l.free === false ? '' : '<span class="lcard__free">GRATIS</span>'}
      <div class="lcard__icon">${ICONS[l.icon] || ''}</div>
      <h3>${esc(l.title)}</h3>
      ${l.items ? `<ul>${l.items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>` : `<p>${l.text}</p>`}
    </article>`).join('') + `
    <article class="lcard lcard--cta">
      <span class="lcard__num mono">AYO DATANG</span>
      <h3>Bawa seluruh keluarga Anda.</h3>
      <p style="margin-bottom:24px">Semua layanan di atas dapat dinikmati <b>tanpa biaya</b> selama 5 hari acara.</p>
      <a href="#lokasi" class="btn btn--dark magnetic" data-cursor="Lokasi"><span>Temukan Lokasi</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
    </article>`;

// Lazy sendiri, bukan loading="lazy" bawaan: ambang 1000px jauh lebih longgar
// sehingga logo sudah selesai diunduh sebelum petaknya sampai di layar.
const loadImg = (img) => {
  if (!img.dataset.src) return;
  const ok = () => img.classList.add('is-loaded');
  img.addEventListener('load', ok, { once: true });
  img.addEventListener('error', ok, { once: true });
  img.src = img.dataset.src;
  img.removeAttribute('data-src');
};
// Unduh jauh sebelum terlihat supaya tidak ada petak kosong saat scroll cepat
const lazyIO = new IntersectionObserver((entries, io) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    loadImg(en.target);
    io.unobserve(en.target);
  });
}, { rootMargin: '1000px 0px' });
// Animasi masuknya terpisah: baru jalan saat petaknya benar-benar kelihatan,
// kalau digabung dengan unduhan, fade-nya habis di luar layar
const revealIO = new IntersectionObserver((entries, io) => {
  let i = 0;
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.style.transitionDelay = `${Math.min(i++ * 45, 270)}ms`; // beruntun, tidak serempak
    // lepas lagi setelah selesai, agar jeda ini tidak ikut terbawa ke transisi hover
    en.target.addEventListener('transitionend', (ev) => { ev.target.style.transitionDelay = ''; }, { once: true });
    en.target.classList.add('is-seen');
    io.unobserve(en.target);
  });
}, { rootMargin: '0px 0px -6% 0px' });
export const lazyWatch = (root) => $$('img.lazy-img', root).forEach((img) => { lazyIO.observe(img); revealIO.observe(img); });

// Blur-up: lepas placeholder begitu foto aslinya siap
$$('.lqip').forEach((box) => {
  const img = $('img', box);
  if (!img) return;
  const done = () => box.classList.add('is-loaded');
  if (img.complete && img.naturalWidth) return done();
  img.addEventListener('load', done, { once: true });
  img.addEventListener('error', done, { once: true });
});
