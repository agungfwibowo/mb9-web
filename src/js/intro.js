import { $, $$, hasGsap, reduced, root } from './core.js';
import { track } from './konten.js';
import { asatidzEntered, pinSwipe } from './asatidz.js';
import { scramble } from './teks.js';

/* ---------------------------------------------------------
   PRELOADER → INTRO → SCROLL ANIMATIONS
   --------------------------------------------------------- */
const pre = $('#preloader');
const count = $('#loadCount');
const heroTargets = ['.hero .kicker', '.hero__meta', '.hero__actions', '#countdown'];
if (hasGsap && !reduced) gsap.set('.hero__scroll', { opacity: 0 });

// Timeline intro dibuat sejak awal (paused) agar state awal .from() langsung diterapkan
// → elemen hero sudah tersembunyi saat panel preloader membuka, tidak berkedip
const introTl = hasGsap && !reduced
  ? gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } })
    .from('.hero__title .blk', { yPercent: 110, duration: 1, stagger: .12 })
    .to(heroTargets, { opacity: 1, y: 0, duration: .9, stagger: .1 }, '-=.7')
    .to('.hero__scroll', { opacity: 1, duration: .8 }, '-=.3')
    .from('.tilt', { scale: .6, rotateY: -40, opacity: 0, duration: 1.4, ease: 'expo.out' }, 0.1)
    .from('.deco--squares', { x: 60, opacity: 0, duration: 1 }, .5)
    .from('.deco--arrows', { x: -60, opacity: 0, duration: 1 }, .6)
    .from('.nav__brand, .nav__links a, .nav__cta', { y: -20, opacity: 0, duration: .6, stagger: .05 }, .3)
  : null;

// Kunjungan ulang dalam sesi yang sama (reload, kembali dari tab lain):
// preloader cukup memudar singkat, tanpa hitungan 0–100 & panel lagi.
// Sesi baru (desktop maupun HP) selalu mendapat preloader penuh.
export let seenThisSession = false;
try { seenThisSession = sessionStorage.getItem('mb9-pre') === '1'; sessionStorage.setItem('mb9-pre', '1'); } catch (_) { /* abaikan */ }
export const finishPreloader = () => new Promise((resolve) => {
  if (!hasGsap || reduced) {
    pre.style.transition = 'opacity .4s';
    pre.style.opacity = '0';
    setTimeout(() => { pre.remove(); resolve(); }, 400);
    return;
  }
  // mode cepat: panel sudah menutup (CSS) → langsung diangkat bergantian
  if (seenThisSession) {
    gsap.to('.preloader__panels i', {
      scaleY: 0, transformOrigin: '50% 0%', duration: .5, stagger: .06, ease: 'power4.inOut',
      onComplete: () => { pre.remove(); resolve(); },
    });
    return;
  }
  const o = { v: 0 };
  const tl = gsap.timeline({ onComplete: () => { pre.remove(); resolve(); } });
  // dipersingkat (dulu 1,3 + .55 + .6 dtk) — hero lebih cepat terlihat di HP
  tl.to(o, { v: 100, duration: .7, ease: 'power2.inOut', onUpdate: () => { count.textContent = Math.round(o.v); } })
    .to('.preloader__panels i', { scaleY: 1, duration: .45, stagger: .06, ease: 'power4.inOut' }, '-=.1')
    .to('.preloader__inner', { opacity: 0, y: -30, duration: .25 }, '<')
    .set(pre, { background: 'transparent' })
    .to('.preloader__panels i', { scaleY: 0, transformOrigin: '50% 0%', duration: .5, stagger: .06, ease: 'power4.inOut' });
});

export const intro = () => {
  root.classList.add('is-loaded');
  if (!hasGsap || reduced) { $$('.reveal-up').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; }); return; }
  introTl.play();
  // Judul hero ikut di-scramble, jeda antar barisnya disamakan dengan
  // stagger .12 milik introTl agar glitch-nya jatuh bersama slide tiap baris.
  // Tidak memakai [data-scramble]: pemicunya ScrollTrigger 'top 90%' yang di
  // hero langsung terpenuhi saat muat, jadi akan jalan sebelum loader selesai.
  $$('.hero__title .blk').forEach((el, i) => setTimeout(() => scramble(el), 120 * i));
};

export const scrollAnims = () => {
  if (!hasGsap || reduced) return;

  // layanan: horizontal pinned scroll (desktop & mobile)
  gsap.from('.lcard', { opacity: 0, y: 80, duration: .9, stagger: .1, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.layanan', start: 'top 70%', once: true } });
  // Pin horizontal hanya masuk akal kalau layarnya cukup tinggi. Di HP
  // landscape (±375px) judul + kartu mustahil muat, dan section yang di-pin
  // TIDAK bisa di-scroll vertikal — jadi kartunya pasti terpotong. Di bawah
  // 521px pin-nya dilepas; kartunya jadi baris yang digeser dengan jari
  // (lihat aturan overflow-x di CSS). matchMedia dipakai agar ikut berubah
  // saat layar diputar, tanpa perlu reload.
  gsap.matchMedia().add('(min-height: 521px)', () => {
    // geser jari (HP) → gulir halaman setara; 1.42 = durasi geser + jeda di timeline
    const perPx = (tl, d) => () => (d() ? ((tl.scrollTrigger.end - tl.scrollTrigger.start) / 1.42) / d() : 0);
    const pinLayanan = () => {
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      // petunjuk scroll HP: tetap tampil sampai kartu terakhir masuk layar,
      // memudar di seperempat jarak satu kartu terakhir sebelum track mentok
      const hint = $('.layanan__scroll');
      const fadeHint = () => {
        const [a, b] = track.children;
        if (!hint || !a) return;
        const step = b ? b.offsetLeft - a.offsetLeft : a.offsetWidth;
        const left = dist() + gsap.getProperty(track, 'x'); // sisa geser (px)
        gsap.set(hint, { autoAlpha: gsap.utils.clamp(0, 1, left / (step * .25)) });
      };
      const ltl = gsap.timeline({
        onUpdate: fadeHint,
        scrollTrigger: {
          trigger: '.layanan__pin', start: 'top top',
          end: () => `+=${dist() ? dist() * 1.45 + innerHeight * .3 : 1}`,
          pin: true, pinType: 'fixed', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
          // kartu CTA "aktif" (= tampilan hover) saat track sudah mentok di ujung kanan
          onUpdate: (self) => { const c = $('.lcard--cta'); if (c) c.classList.toggle('is-active', self.progress > .68); },
          onLeaveBack: () => { const c = $('.lcard--cta'); if (c) c.classList.remove('is-active'); },
        },
      })
        .to(track, { x: () => -dist(), ease: 'none', duration: 1 })
        .to({}, { duration: .42 }); // jeda di kartu terakhir sebelum lanjut scroll
      pinSwipe.layanan = { perPx: perPx(ltl, dist) };
    };
    // Asatidz tidak lagi di-pin: deretan kartunya digeser biasa (lihat asatidz.js)
    pinLayanan();

    return () => { pinSwipe.layanan = null; };

  });

  // pola grid sponsor: parallax halus saat scroll
  gsap.fromTo('.partners__grid', { yPercent: -8 }, {
    yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: '.partners', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  // reveal-up (non-hero)
  ScrollTrigger.batch($$('.reveal-up').filter((el) => !el.closest('.hero')), {
    start: 'top 88%', once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: .9, stagger: .12, ease: 'power3.out' }),
  });

  // split words title
  $$('.split-words').forEach((el) => gsap.from($$('.w > span', el), {
    yPercent: 110, duration: .9, stagger: .06, ease: 'power4.out',
    scrollTrigger: { trigger: el, start: 'top 85%', once: true },
  }));

  // scramble headings
  $$('[data-scramble]').forEach((el) => ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => scramble(el) }));

  // section headers slide
  $$('.sec-head').forEach((h) => gsap.from(h.children, {
    y: 30, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out',
    scrollTrigger: { trigger: h, start: 'top 85%', once: true },
  }));

  // counters
  $$('[data-count]').forEach((el) => {
    const o = { v: 0 };
    const target = +el.dataset.count;
    const sfx = el.dataset.suffix || '';
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: target, duration: 1.6, ease: 'power3.out', onUpdate: () => { el.innerHTML = Math.round(o.v) + (sfx ? `<i class="num-sfx">${sfx}</i>` : ''); } }),
    });
  });

  // hero parallax on scroll
  gsap.fromTo('.hero__scroll', { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: 20, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=180', scrub: true } });
  gsap.to('.hero__photo', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__grid', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  // logo hero: bergerak jelas saat scroll (tilt kursor tetap di #heroTilt)
  gsap.to('.hero__visual', { yPercent: -22, rotation: 10, scale: .85, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6, invalidateOnRefresh: true } });
  // teks hero memudar saat di-scroll (target anaknya langsung: .hero__copy memakai
  // display:contents di layout HP sehingga opacity tidak berpengaruh)
  gsap.fromTo(['.hero .kicker', '.hero__title', '.hero__meta', '.hero__actions'], { autoAlpha: 1 }, { autoAlpha: 0, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '.hero', start: '18% top', end: 'bottom top', scrub: .6, invalidateOnRefresh: true } });
  gsap.fromTo('.hero__inner', { yPercent: 0 }, { yPercent: 14, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });

  // marquee skew by velocity
  ScrollTrigger.create({ onUpdate: (s) => gsap.to($$('.marquee__group'), { skewX: gsap.utils.clamp(-8, 8, s.getVelocity() / -300), duration: .4, ease: 'power3', overwrite: true }) });

  // tema image reveal + parallax
  // Tersingkap dari tepi kiri ke kanan. Pakai inset() persen murni, BUKAN
  // polygon() bernotch: sisi kanan bentuk itu memakai calc(100% - 18px) dan
  // GSAP tidak bisa menginterpolasi calc() di dalam clip-path — hasilnya
  // meloncat, bukan beranimasi. Bentuk notch-nya dikembalikan oleh clearProps
  // di akhir (aslinya memang sudah ada di CSS sebagai var(--notch)).
  const revealTrigger = { trigger: '.tema__media', start: 'top 82%', once: true };
  gsap.fromTo('.img-reveal', { clipPath: 'inset(0% 100% 0% 0%)' }, {
    clipPath: 'inset(0% 0% 0% 0%)', clearProps: 'clipPath',
    duration: 1.1, ease: 'expo.out', scrollTrigger: revealTrigger,
  });
  // fotonya ikut meluncur dari kiri ke tengah, lebih lambat dari singkapnya
  gsap.fromTo('.img-reveal img', { xPercent: -12 }, { xPercent: 0, duration: 1.5, ease: 'expo.out', scrollTrigger: revealTrigger });
  gsap.fromTo('.parallax-img', { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.tema__media', scrub: true } });
  gsap.to('.deco--zigzag', { y: -80, rotate: 8, ease: 'none', scrollTrigger: { trigger: '.tema', scrub: true } });
  // blok lime layanan: geser horizontal saja agar tidak pernah menutupi judul
  gsap.fromTo('.deco--blocks', { x: -40 }, { x: 80, ease: 'none', scrollTrigger: { trigger: '.layanan', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.utils.toArray('.deco--stripes, .deco--sq').forEach((el) => { const c = el.classList, big = c.contains('deco--denah'); const d = c.contains('deco--tema-b') ? 16 : c.contains('deco--sq') ? 70 : big ? 140 : 40; gsap.fromTo(el, { y: d }, { y: -d, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } }); });

  // stats
  gsap.from('.stats li', { y: 40, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.stats', start: 'top 90%', once: true } });

  // jadwal days
  gsap.from('.day', { y: 40, opacity: 0, duration: .7, stagger: .08, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.days', start: 'top 88%', once: true } });

  // asatidz cards — naik + muncul, sama dengan kartu layanan (dulu flip rotateX)
  // clearProps: GSAP membekukan `scale` CSS (kartu depan/tetangga di HP) ke inline
  // transform — dibersihkan setelah selesai agar CSS kembali yang mengatur.
  // onComplete: selama animasi titik snap ikut bergeser → deretan dilabuhkan ulang
  gsap.from('.ustadz', { opacity: 0, y: 80, duration: .9, stagger: .1, ease: 'power3.out', clearProps: 'transform,translate,rotate,scale,opacity', onComplete: asatidzEntered, scrollTrigger: { trigger: '.asatidz__grid', start: 'top 85%', once: true } });

  // denah booths pop-in
  gsap.from('#boothLayer .booth', {
    scale: 0, opacity: 0, duration: .5, ease: 'back.out(2.5)', stagger: { each: .008, from: 'center' }, clearProps: 'transform,opacity',
    scrollTrigger: { trigger: '#denahSvg', start: 'top 75%', once: true },
  });

  // lokasi
  gsap.from('.loc-card', { x: -80, opacity: 0, duration: 1.1, ease: 'power4.out', scrollTrigger: { trigger: '.lokasi', start: 'top 70%', once: true } });

  // partners
  $$('.pgroup').forEach((g) => gsap.fromTo($$('.plogo', g), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .7, stagger: .08, ease: 'power3.out', clearProps: 'transform,opacity,visibility', scrollTrigger: { trigger: g, start: 'top 90%', once: true } }));

  // footer big text
  gsap.from('.footer__grid > *', { y: 40, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.footer__grid', start: 'top 92%', once: true } });

  // images loaded → recalc
  addEventListener('load', () => ScrollTrigger.refresh());
};

// Hero 3D tilt mengikuti kursor
// Gerbangnya BUKAN finePointer yang dibaca sekali saat load: kalau begitu,
// berpindah ke/dari emulasi perangkat sentuh baru berlaku setelah refresh.
// MediaQueryList-nya disimpan dan dicek ulang tiap kejadian.
if (!reduced && hasGsap) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const tiltEl = $('#heroTilt');
  const rx = gsap.quickTo(tiltEl, 'rotationX', { duration: .8, ease: 'power3' });
  const ry = gsap.quickTo(tiltEl, 'rotationY', { duration: .8, ease: 'power3' });
  const gx = gsap.quickTo('.hero__grid', 'x', { duration: 1.2, ease: 'power3' });
  const gy = gsap.quickTo('.hero__grid', 'y', { duration: 1.2, ease: 'power3' });
  // Jejak outline: tiap lapis digeser makin jauh dan makin lambat menyusul,
  // jadi tumpukannya mekar saat kursor bergerak lalu merapat kembali.
  // Urutan DOM terbalik (nth-child(1) = lapis terjauh), jadi bobot geser dan
  // kelambatannya dihitung mundur dari panjang daftar.
  const echoEls = $$('.tilt__echo svg');
  const echo = echoEls.map((el, i) => {
    const depth = echoEls.length - i;          // 3 untuk yang terjauh
    const d = .9 + (depth - 1) * .3;
    // GSAP TIDAK boleh menganimasikan x/y langsung pada svg-nya: GSAP 3.12
    // menyerap properti CSS translate/scale ke transform-nya lalu menulis
    // inline `translate: none; scale: none` — offset tumpukan 24/16/8%
    // hilang dan ketiga lapis menyatu. Maka yang dianimasikan objek angka
    // biasa, hasilnya ditulis ke --ex/--ey yang dipakai transform di CSS.
    const p = { x: 0, y: 0 };
    const paint = () => { el.style.setProperty('--ex', `${p.x}px`); el.style.setProperty('--ey', `${p.y}px`); };
    return {
      x: gsap.quickTo(p, 'x', { duration: d, ease: 'power3', onUpdate: paint }),
      y: gsap.quickTo(p, 'y', { duration: d, ease: 'power3', onUpdate: paint }),
      depth,
      // Mendatar: dibobot per lapis — ini yang membuat tumpukan memekar.
      kx: depth * 48,
      // Menurun dibagi dua bagian, lihat echoTo().
      ky: 10,
      ks: depth * 30,
    };
  });
  // arah dibalik: jejak bergeser berlawanan dengan kursor, jadi logo terasa
  // ditinggalkan di depan sementara lapisannya melayang ke arah sebaliknya
  const clamp1 = (v) => (v < -1 ? -1 : v > 1 ? 1 : v);
  // Vertikal tidak bisa dibobot per lapis begitu saja: tumpukannya tersusun
  // ke BAWAH, jadi arah yang berlawanan akan membuat lapis terjauh mengejar
  // lapis di atasnya sampai saling menimpa. Maka dipecah dua:
  //   ky — geser serempak (semua lapis sama), memberi reaksi arah atas/bawah;
  //   ks — mekar, dibobot per lapis tapi memakai |py| sehingga SELALU
  //        menambah jarak ke bawah, ke arah mana pun kursor bergerak.
  // Hasilnya jarak atas-bawah bisa jauh lebih lebar tanpa pernah mengatup.
  const echoTo = (px, py) => echo.forEach((e) => {
    e.x(px * -e.kx);
    e.y(py * -e.ky + Math.abs(py) * e.ks);
  });
  // Posisi dihitung relatif ke hero & diulang saat scroll (kursor diam, tapi hero bergerak di bawahnya)
  const hero = $('.hero');
  let mx = null, my = null;
  const updateTilt = (withEcho) => {
    if (mx === null) return;
    const r = hero.getBoundingClientRect();
    if (my < r.top || my > r.bottom) { rx(0); ry(0); gx(0); gy(0); echoTo(0, 0); return; }
    const px = mx / innerWidth - .5;
    const py = (my - r.top) / r.height - .5;
    ry(px * 30); rx(py * -22); gx(px * -30); gy(py * -20);
    if (!withEcho) return;
    // Jejak diukur dari PUSAT LOGO, bukan pusat viewport. Logo duduk di
    // sekitar 3/4 lebar layar, jadi dengan acuan viewport posisi "di kiri
    // logo" masih bernilai ~0 dan tumpukannya terlihat mengatup.
    const t = tiltEl.getBoundingClientRect();
    echoTo(clamp1((mx - (t.left + t.width / 2)) / (innerWidth / 2)),
           clamp1((my - (t.top + t.height / 2)) / (r.height / 2)));
  };
  let echoIdle = 0;
  // Kembali ke posisi diam dengan halus (dianimasikan quickTo ke 0).
  const rest = () => {
    mx = my = null;
    clearTimeout(echoIdle);
    rx(0); ry(0); gx(0); gy(0); echoTo(0, 0);
  };
  fine.addEventListener('change', (e) => { if (!e.matches) rest(); });
  // Jejak bereaksi pada GERAKAN kursor, bukan posisinya. Kalau dari posisi,
  // kursor yang diam di bawah logo membuat tumpukan mekar terus — paling
  // terasa setelah scroll turun lalu kembali ke hero: kursor tidak bergerak,
  // tapi jejaknya tertinggal renggang, beda dari saat pertama load.
  // Begitu kursor diam sebentar, jejaknya merapat kembali ke posisi CSS.
  addEventListener('pointermove', (e) => {
    if (!fine.matches) return;
    mx = e.clientX; my = e.clientY; updateTilt(true);
    clearTimeout(echoIdle);
    echoIdle = setTimeout(() => echoTo(0, 0), 260);
  }, { passive: true });
  // saat scroll hanya tilt & grid yang mengikuti; jejak tidak disentuh
  addEventListener('scroll', () => { if (fine.matches) updateTilt(false); }, { passive: true });
  // Kursor keluar jendela / tab disembunyikan / jendela kehilangan fokus →
  // kembali diam. Bukan document 'pointerleave': event itu hanya dikirim ke
  // elemen dan tidak bubble, jadi di document tidak pernah terpicu.
  document.documentElement.addEventListener('mouseleave', rest);
  addEventListener('blur', rest);
  document.addEventListener('visibilitychange', () => { if (document.hidden) rest(); });

  // pola grid sponsor ikut arah kursor
  const pgrid = $('.partners__grid'), pSec = $('.partners');
  if (pgrid && pSec) {
    const px = gsap.quickTo(pgrid, 'x', { duration: 1.2, ease: 'power3' });
    const py = gsap.quickTo(pgrid, 'y', { duration: 1.2, ease: 'power3' });
    pSec.addEventListener('pointermove', (e) => {
      if (!fine.matches) return;
      const r = pSec.getBoundingClientRect();
      px((e.clientX / innerWidth - .5) * -130);
      py(((e.clientY - r.top) / r.height - .5) * -95);
    }, { passive: true });
    pSec.addEventListener('pointerleave', () => { px(0); py(0); });
  }
}

// Tenant count (tanpa GSAP)
if (!hasGsap || reduced) $$('[data-count]').forEach((el) => { const x = el.dataset.suffix || ''; el.innerHTML = el.dataset.count + (x ? `<i class="num-sfx">${x}</i>` : ''); });
