/* =========================================================
   MUSLIM BERDEDIKASI 9 — interaksi & animasi
   ========================================================= */
(() => {
  'use strict';

  const D = window.MB9;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // tautan yang dibagikan tidak perlu menampilkan "index.html" — cukup domain/path
  const stripIndex = (p) => p.replace(/\/index\.html$/, '/');

  // Lengkapi days dari iso: short "Rabu", date "23 Des", year "2026", full "Rabu, 23 Desember 2026"
  const HARI = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const fillDay = (d) => {
    const [y, m, dd] = d.iso.split('-').map(Number);
    const short = HARI[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()];
    return { ...d, short, year: y, date: `${dd} ${BULAN[m - 1].slice(0, 3)}`, full: `${short}, ${dd} ${BULAN[m - 1]} ${y}` };
  };
  D.days = D.days.map(fillDay);

  // Tanggal, hari, jam & lokasi di HTML ([data-mb9="…"]) diisi dari data —
  // teks bawaan di HTML hanya cadangan (tanpa JS / untuk mesin pencari).
  // Selalu tanggal ASLI (data-prod.js): data-dev.js menyimpannya di prodDays
  // sebelum mengubah hari ke-1 menjadi hari ini.
  const evDays = (D.prodDays || D.days).map(fillDay);
  if (evDays.length) {
    const parts = (iso) => { const [y, m, d] = iso.split('-').map(Number); return { y, m, d }; };
    const a = parts(evDays[0].iso), b = parts(evDays[evDays.length - 1].iso);
    const sameMonth = a.m === b.m && a.y === b.y;
    const mon = (p) => BULAN[p.m - 1];
    const range = (sep, fmt) => (sameMonth ? `${a.d}${sep}${b.d}` : `${a.d} ${fmt(mon(a))}${sep}${b.d} ${fmt(mon(b))}`);
    const hrs = (sep) => (D.hours ? `${D.hours.open.replace(':', '.')}${sep}${D.hours.close.replace(':', '.')} WIB` : '');
    const venue = (D.event && D.event.venue) || '';
    const short3 = (t) => t.slice(0, 3);
    const val = {
      range: range(' – ', short3),
      monthYear: `${(sameMonth ? mon(b) : `${short3(mon(a))} – ${short3(mon(b))}`).toUpperCase()}<br>${b.y}`,
      daySpan: `${evDays[0].short} – ${evDays[evDays.length - 1].short}`,
      hours: hrs(' – '),
      hoursTight: hrs('–'),
      venue,
      dates: `${range('–', (t) => t)}${sameMonth ? ` ${mon(b)}` : ''} ${b.y}`,
      menuDates: `${range(' — ', short3)}${sameMonth ? ` ${short3(mon(b))}` : ''} ${b.y}`.toUpperCase(),
    };
    $$('[data-mb9]').forEach((el) => {
      const v = val[el.dataset.mb9];
      if (!v) return;
      if (el.dataset.mb9 === 'monthYear') el.innerHTML = v; else el.textContent = v;
    });
    $$('[data-mb9-aria="menuAria"]').forEach((el) => {
      el.setAttribute('aria-label', `Lihat jadwal acara — ${range(' sampai ', (t) => t)}${sameMonth ? ` ${mon(b)}` : ''} ${b.y}, ${venue}`);
    });
  }

  // Deep link (#denah dll): lompatan bawaan browser terjadi saat HTML selesai
  // di-parse — sebelum konten dari data-prod.js dirender dan sebelum ScrollTrigger
  // memasang pin-spacer layanan/asatidz yang menambah ribuan piksel. Posisinya
  // jadi basi dan pengunjung mendarat jauh di atas target. Maka: hash ditahan,
  // halaman dimulai dari atas (preloader + intro hero tetap jalan), lalu
  // setelah layout final digulir ke target lewat jalur yang sama dengan klik
  // anchor. Hash dilepas dari URL sementara agar browser tidak melompat lagi
  // sendiri saat event load; dipasang kembali setelah tiba.
  const bootHash = (() => {
    const h = location.hash;
    if (!/^#[A-Za-z][\w-]*$/.test(h) || h === '#home' || !document.getElementById(h.slice(1))) return null;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    history.replaceState(null, '', location.pathname + location.search);
    scrollTo(0, 0);
    return h;
  })();
  // Link tenant yang dibagikan: ?tenant=rasa-coffee atau ?tenda=38. Diproses
  // sama seperti deep link: mulai dari atas, lalu setelah intro meluncur ke
  // tendanya (di tengah layar) dan langsung dipilih. Lihat focusBooth().
  const bootBooth = (() => {
    const q = new URLSearchParams(location.search);
    const v = (q.get('tenant') || q.get('tenda') || '').trim();
    if (!v) return null;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    scrollTo(0, 0);
    return v;
  })();
  // Apakah pengunjung MENGGULIR SENDIRI selama preloader/intro? Dicatat dari
  // input nyata, bukan dari scrollY: saat reload, browser memulihkan posisi
  // scroll terakhir setelah skrip ini jalan — kalau dibaca dari scrollY,
  // pemulihan itu dikira guliran pengunjung dan lompatan ke tujuan batal.
  let userScrolled = false;
  if (bootHash || bootBooth) {
    const mark = () => { userScrolled = true; };
    addEventListener('wheel', mark, { passive: true, once: true });
    addEventListener('touchmove', mark, { passive: true, once: true });
    addEventListener('keydown', (e) => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) mark(); });
  }

  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    // HP: abaikan resize kecil akibat address bar muncul/hilang agar ScrollTrigger tidak refresh terus
    ScrollTrigger.config({ ignoreMobileResize: true });
    root.classList.add('gsap-ready');
  }

  /* ---------------------------------------------------------
     RENDER KONTEN DARI data-prod.js
     --------------------------------------------------------- */
  const ICONS = {
    medis: '<svg viewBox="0 0 24 24"><path d="M3 12h4l2-5 4 10 2-5h6"/><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10"/></svg>',
    sosial: '<svg viewBox="0 0 24 24"><circle cx="8" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14 14.5c.9-.3 1.9-.5 3-.5 2.8 0 5 2.2 5 5"/></svg>',
    bazar: '<svg viewBox="0 0 24 24"><path d="M3 9 5 4h14l2 5M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9ZM5 13v7h14v-7M10 20v-4h4v4"/></svg>',
  };

  // Layanan cards
  const track = $('#layananTrack');
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
  const lazyWatch = (root) => $$('img.lazy-img', root).forEach((img) => { lazyIO.observe(img); revealIO.observe(img); });

  // Blur-up: lepas placeholder begitu foto aslinya siap
  $$('.lqip').forEach((box) => {
    const img = $('img', box);
    if (!img) return;
    const done = () => box.classList.add('is-loaded');
    if (img.complete && img.naturalWidth) return done();
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });

  /* ---------------------------------------------------------
     SIMPAN KE KALENDER — .ics dibuat di browser (tanpa server) +
     tautan Google Calendar. Jam ditulis dalam UTC (WIB = UTC+7) supaya
     tidak bergantung blok VTIMEZONE yang dukungannya tidak seragam.
     --------------------------------------------------------- */
  // Dropdown kalender berlaku di semua ukuran layar. <details> tidak menutup
  // sendiri saat klik di luar atau Escape — keduanya ditambahkan manual.
  const calBox = $('#calBox');
  if (calBox) {
    addEventListener('click', (e) => {
      if (calBox.open && !calBox.contains(e.target)) calBox.open = false;
    });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') calBox.open = false; });
  }

  const icsBtn = $('#icsBtn');
  if (icsBtn && D.event && D.days.length) {
    const EV = D.event;
    const pad2 = (n) => String(n).padStart(2, '0');
    // '2026-12-23' + '08:00' (WIB) -> '20261223T010000Z'
    const utcStamp = (iso, hhmm) => {
      const d = new Date(`${iso}T${hhmm}:00+07:00`);
      return d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate())
        + 'T' + pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + '00Z';
    };
    const esc_ics = (t) => String(t).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
    const pageUrl = location.origin + stripIndex(location.pathname);

    const buildIcs = () => {
      const stamp = utcStamp(new Date().toISOString().slice(0, 10), '00:00');
      const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Muslim Berdedikasi 9//ID', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
      D.days.forEach((d, i) => {
        lines.push('BEGIN:VEVENT',
          `UID:mb9-${d.key}-${d.iso}@muslimberdedikasi`,
          `DTSTAMP:${stamp}`,
          `DTSTART:${utcStamp(d.iso, D.hours.open)}`,
          `DTEND:${utcStamp(d.iso, D.hours.close)}`,
          `SUMMARY:${esc_ics(`${EV.title} — Hari ke-${i + 1}`)}`,
          `LOCATION:${esc_ics(EV.venue)}`,
          `DESCRIPTION:${esc_ics(EV.desc)}`,
          `URL:${pageUrl}?hari=${d.key}`,
          'END:VEVENT');
      });
      lines.push('END:VCALENDAR');
      return lines.join('\r\n'); // RFC 5545 mewajibkan CRLF
    };

    icsBtn.addEventListener('click', () => {
      const blob = new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'muslim-berdedikasi-9.ics';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });

    // Google Calendar hanya menerima satu acara: dibuat sebagai acara seharian
    // penuh yang membentang 23–27 Des. Tanggal akhirnya eksklusif → +1 hari.
    const gcal = $('#gcalBtn');
    if (gcal) {
      const ymd = (iso) => iso.replace(/-/g, '');
      // hitung di UTC murni — memakai offset +07:00 lalu toISOString() menggeser
      // tanggalnya mundur sehari karena konversi balik ke UTC
      const last = new Date(`${D.days[D.days.length - 1].iso}T00:00:00Z`);
      last.setUTCDate(last.getUTCDate() + 1);
      const p = new URLSearchParams({
        action: 'TEMPLATE',
        text: EV.title,
        dates: `${ymd(D.days[0].iso)}/${ymd(last.toISOString().slice(0, 10))}`,
        location: EV.venue,
        details: `${EV.desc}\n${D.hours.open.replace(':', '.')} – ${D.hours.close.replace(':', '.')} WIB\n${pageUrl}`,
      });
      gcal.href = `https://calendar.google.com/calendar/render?${p}`;
    }
  }

  /* Bagikan tautan — memakai sheet berbagi bawaan HP bila tersedia,
     selain itu menyalin ke clipboard. URL-nya ikut ?hari= yang aktif,
     jadi penerima langsung mendarat di jadwal hari yang sama. */
  /* ---------------------------------------------------------
     MENU BAGIKAN — dropdown berisi QR (logo di tengah) di atas, lalu
     WhatsApp / Telegram / Facebook / X, salin tautan, unduh QR, dan menu
     share bawaan. Dipakai tombol Bagikan di Jadwal & Bagikan lokasi di Denah.
     --------------------------------------------------------- */
  // Ikon brand dari simple-icons (CC0), ditanam agar tetap tampil offline
  const BRAND_ICONS = {
    wa: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
    tg: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
    fb: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
    x: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  };
  const enc = encodeURIComponent;
  const NETS = [
    // WhatsApp selalu dibuka dengan salam
    ['wa', 'WhatsApp', (url, t) => `https://wa.me/?text=${enc(`Assalamu'alaikum,\n\n${t}\n${url}`)}`],
    ['tg', 'Telegram', (url, t) => `https://t.me/share/url?url=${enc(url)}&text=${enc(t)}`],
    ['fb', 'Facebook', (url) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`],
    ['x', 'X (Twitter)', (url, t) => `https://x.com/intent/tweet?text=${enc(t)}&url=${enc(url)}`],
  ];
  const MB9_LOGO = { src: 'assets/img/logo/icon-512.png' };
  const fetchImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  // QR + logo digambar di SATU canvas → yang tampil di layar dan file unduhan
  // identik. Koreksi galat H (±30% data boleh tertutup); logo dibatasi 22%
  // lebar QR agar tetap terbaca kamera.
  const drawQR = async (canvas, px, url, logo) => {
    if (!window.qrcode) return false;
    const qr = window.qrcode(0, 'H');
    qr.addData(url);
    qr.make();
    const n = qr.getModuleCount(), quiet = 2, cell = px / (n + quiet * 2);
    canvas.width = canvas.height = px;
    const c = canvas.getContext('2d');
    c.fillStyle = '#fff'; c.fillRect(0, 0, px, px);
    c.fillStyle = '#2b2b2b';
    for (let r = 0; r < n; r++) {
      for (let k = 0; k < n; k++) {
        if (qr.isDark(r, k)) c.fillRect(Math.floor((k + quiet) * cell), Math.floor((r + quiet) * cell), Math.ceil(cell), Math.ceil(cell));
      }
    }
    const img = logo && logo.src && await fetchImg(logo.src);
    if (img) {
      const box = px * .22, x = (px - box) / 2, pad = box * .1;
      c.fillStyle = logo.dark ? '#2b2b2b' : '#fff';
      c.fillRect(x, x, box, box);
      c.strokeStyle = '#2b2b2b'; c.lineWidth = Math.max(2, px * .006);
      c.strokeRect(x, x, box, box);
      const s = Math.min((box - pad * 2) / img.width, (box - pad * 2) / img.height);
      c.drawImage(img, (px - img.width * s) / 2, (px - img.height * s) / 2, img.width * s, img.height * s);
    }
    return true;
  };
  /* Poster A4 (khusus Bagikan link utama): digambar di canvas 300 dpi
     (2480×3508) lalu dibungkus jadi PDF A4 satu halaman tanpa pustaka
     tambahan. Shape & teks mengikuti gaya situs; grain di seluruh poster,
     area QR dibiarkan bersih supaya tetap mudah dipindai. */
  const A4 = { w: 2480, h: 3508 };
  const drawPoster = async (url) => {
    try { await Promise.all(['700 100px "Roboto Mono"', '400 100px "Roboto Mono"', '400 100px "Public Sans"', '700 100px "Public Sans"'].map((f) => document.fonts.load(f))); } catch (_) { /* pakai fallback */ }
    const cv = document.createElement('canvas');
    cv.width = A4.w; cv.height = A4.h;
    const c = cv.getContext('2d');
    const INK = '#2b2b2b', LIME = '#c5fa01', BLUE = '#2150f5', WHITE = '#ffffff', M = 170;
    const mono = (sz, w = 700) => `${w} ${sz}px "Roboto Mono", "Noto Sans Mono", monospace`;
    const sans = (sz, w = 400) => `${w} ${sz}px "Public Sans", system-ui, sans-serif`;
    const spaced = (t, x, y, ls) => { // letter-spacing manual (ctx.letterSpacing belum merata)
      for (const ch of t) { c.fillText(ch, x, y); x += c.measureText(ch).width + ls; }
      return x;
    };
    const textW = (t, ls) => [...t].reduce((a, ch) => a + c.measureText(ch).width + ls, -ls);
    const notch = (x, y, w, h, k) => { // sudut kanan-atas & kiri-bawah terpotong, seperti kartu situs
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + w - k, y); c.lineTo(x + w, y + k); c.lineTo(x + w, y + h);
      c.lineTo(x + k, y + h); c.lineTo(x, y + h - k); c.closePath();
    };
    const day = D.days || [], first = day[0] && new Date(`${day[0].iso}T00:00:00+07:00`), last = day[day.length - 1] && new Date(`${day[day.length - 1].iso}T00:00:00+07:00`);
    const BULAN = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
    const HARI = ['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', "JUM'AT", 'SABTU'];
    const wib = (d) => new Date(d.getTime() + 7 * 3600e3); // komponen tanggal WIB lewat getUTC*
    const dRange = first ? `${wib(first).getUTCDate()} – ${wib(last).getUTCDate()}` : '';
    const dMonth = first ? `${BULAN[wib(last).getUTCMonth()]} ${wib(last).getUTCFullYear()}` : '';
    const dDays = first ? `${HARI[wib(first).getUTCDay()]} – ${HARI[wib(last).getUTCDay()]}` : '';
    const hrs = D.hours ? `${D.hours.open.replace(':', '.')} – ${D.hours.close.replace(':', '.')} WIB` : '';
    const venue = ((D.event && D.event.venue) || '').toUpperCase();

    // latar
    c.fillStyle = '#f1f1ee'; c.fillRect(0, 0, A4.w, A4.h);
    // grid garis tipis biru diagonal (seperti latar hero)
    c.save(); c.strokeStyle = 'rgba(33, 80, 245, .16)'; c.lineWidth = 3;
    // landai (belah ketupat melebar) seperti latar hero
    for (let i = -A4.w; i < A4.h + A4.w; i += 260) {
      c.beginPath(); c.moveTo(0, i); c.lineTo(A4.w, i + A4.w * .58); c.stroke();
      c.beginPath(); c.moveTo(0, i); c.lineTo(A4.w, i - A4.w * .58); c.stroke();
    }
    c.restore();

    // HEADER gelap
    const HH = 1340;
    c.fillStyle = INK; c.beginPath(); c.moveTo(0, 0); c.lineTo(A4.w, 0); c.lineTo(A4.w, HH - 120); c.lineTo(A4.w - 120, HH); c.lineTo(0, HH); c.closePath(); c.fill();
    // kicker
    c.font = mono(46); c.textBaseline = 'middle';
    const k1 = 'MUSLIM BERDEDIKASI 9', k2 = 'GENERASI BERDEDIKASI DI MASA DEPAN';
    const k1w = textW(k1, 6) + 60, k2w = textW(k2, 6) + 60;
    c.fillStyle = LIME; c.fillRect(M, 170, k1w, 92);
    c.fillStyle = INK; spaced(k1, M + 30, 216, 6);
    c.strokeStyle = '#8a8a8a'; c.lineWidth = 4; c.strokeRect(M + k1w, 172, k2w, 88);
    c.fillStyle = '#d6d6d6'; spaced(k2, M + k1w + 30, 216, 6);
    // judul: blok seperti hero (putih / lime / putih)
    const lines = [['FESTIVAL ISLAM', null, WHITE], ['& KELUARGA', LIME, INK], ['TERBESAR DI MEDAN', null, WHITE]];
    c.font = mono(150);
    let ty = 360;
    lines.forEach(([t, bg, fg]) => {
      const w = textW(t, 2) + 70;
      if (bg) { c.fillStyle = bg; c.fillRect(M, ty, w, 222); }
      else { c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 4; c.strokeRect(M, ty, w, 222); }
      c.fillStyle = fg; spaced(t, M + 35, ty + 116, 2);
      ty += 244;
    });
    // deskripsi singkat
    c.font = sans(54); c.fillStyle = '#cfcfcf'; c.textBaseline = 'alphabetic';
    c.fillText('Islamic Family Festival — kajian ilmiah, layanan sosial gratis,', M, 1150);
    c.fillText('lomba, bazar & foodcourt untuk seluruh keluarga.', M, 1226);

    // logo MB9 + kotak biru bertumpuk (kanan atas)
    const mark = await fetchImg('assets/img/logo/mb9-mark.webp');
    if (mark) {
      const mw = 560, mh = mark.height * (mw / mark.width);
      c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 60; c.shadowOffsetY = 40;
      c.drawImage(mark, A4.w - mw - 90, 520, mw, mh); c.restore();
    }
    // kotak chat biru bertumpuk — bentuk persis SVG hero (viewBox 170×145),
    // menempel di sudut kanan atas logo dekat tepi kanan
    const u = .95, ox = A4.w - 60 - 167 * u, oy = 455;
    c.save(); c.translate(ox, oy); c.scale(u, u);
    c.fillStyle = '#afc3f8'; c.fillRect(62, 0, 105, 90);
    c.fillStyle = '#628af6'; c.fillRect(31, 18, 105, 90);
    c.fillStyle = BLUE; c.beginPath(); c.moveTo(0, 38); c.lineTo(105, 38); c.lineTo(105, 128); c.lineTo(28, 128); c.lineTo(0, 145); c.closePath(); c.fill();
    c.restore();

    // TANGGAL
    let y = 1680;
    c.font = mono(300); c.fillStyle = BLUE; c.textBaseline = 'alphabetic';
    const dEnd = spaced(dRange, M - 10, y, 0);
    c.font = mono(88); spaced(dMonth.split(' ')[0], dEnd + 40, y - 172, 4); spaced(dMonth.split(' ')[1] || '', dEnd + 40, y - 70, 4);
    y += 60;
    c.fillStyle = INK; c.fillRect(M, y, 10, 285);
    c.font = mono(62); [dDays, hrs, venue].forEach((t, i) => { spaced(t, M + 60, y + 68 + i * 95, 3); });

    // panah (seperti dekorasi hero): hitam ke kanan, lime ke kiri
    const arrow = (x, y, len, dir, col) => {
      c.save(); c.strokeStyle = col; c.lineWidth = 64; c.lineCap = 'butt'; c.lineJoin = 'miter';
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + dir * len, y); c.stroke();
      c.beginPath(); c.moveTo(x + dir * (len - 110), y - 110); c.lineTo(x + dir * len, y); c.lineTo(x + dir * (len - 110), y + 110); c.stroke(); c.restore();
    };

    // QR dalam kartu bernotch
    const qs = 860, qx = M, qy = 2110;
    c.save(); c.fillStyle = INK; notch(qx + 28, qy + 28, qs + 120, qs + 120, 90); c.fill(); c.restore();
    c.fillStyle = WHITE; notch(qx, qy, qs + 120, qs + 120, 90); c.fill();
    c.strokeStyle = INK; c.lineWidth = 10; notch(qx, qy, qs + 120, qs + 120, 90); c.stroke();
    const qc = document.createElement('canvas');
    const okQR = await drawQR(qc, qs, url, MB9_LOGO);
    if (okQR) c.drawImage(qc, qx + 60, qy + 60, qs, qs);
    const qrBox = [qx, qy, qs + 150, qs + 150];

    // kolom kanan: ajakan & isi tautan
    const rx = qx + qs + 260;
    arrow(rx + 520, qy + 110, 520, -1, INK);  // menunjuk ke QR
    arrow(rx + 60, qy + 290, 460, 1, LIME);
    c.font = mono(70); c.fillStyle = INK; c.textBaseline = 'alphabetic';
    spaced('PINDAI', rx, qy + 430, 6); spaced('UNTUK', rx, qy + 520, 6); spaced('INFO:', rx, qy + 610, 6);
    const nT = (D.tenants || []).length;
    const items = ['Jadwal 5 hari', 'Denah tenda', nT ? `${nT} tenant bazar` : 'Tenant bazar', 'Layanan gratis'];
    c.font = sans(52, 700);
    items.forEach((t, i) => {
      const iy = qy + 690 + i * 82;
      c.fillStyle = LIME; c.fillRect(rx, iy - 38, 34, 34);
      c.strokeStyle = INK; c.lineWidth = 4; c.strokeRect(rx, iy - 38, 34, 34);
      c.fillStyle = INK; c.fillText(t, rx + 60, iy);
    });

    // pita miring berisi kegiatan (seperti marquee situs)
    c.save(); c.translate(0, 3215); c.rotate(-.015);
    c.fillStyle = INK; c.fillRect(-60, -58, A4.w + 120, 116);
    c.textBaseline = 'middle';
    // isi pita: 3 kegiatan pertama dari marquee situs (satu sumber, tidak
    // mengarang sendiri) + "DAN MASIH BANYAK LAGI" — satu baris, di tengah;
    // huruf dikecilkan otomatis bila tidak muat
    const acts = $$('.marquee--dark .marquee__track span').map((e) => e.textContent.trim().toUpperCase()).filter(Boolean).slice(0, 3);
    const tape = [...(acts.length ? acts : ['KAJIAN ISLAM ILMIAH', 'BAZAR & FOODCOURT']), 'DAN MASIH BANYAK LAGI'];
    let fs = 42, gap, total;
    do {
      c.font = mono(fs); gap = fs * 2.6;
      total = tape.reduce((a, t) => a + textW(t, 4), 0) + gap * (tape.length - 1);
    } while (total > A4.w - 2 * M && --fs > 28);
    let px = (A4.w - total) / 2;
    tape.forEach((t, i) => {
      const last = i === tape.length - 1;
      c.fillStyle = last ? WHITE : LIME;
      px = spaced(t, px, 2, 4) + 4;
      if (!last) { c.fillStyle = WHITE; c.textAlign = 'center'; c.fillText('✦', px + gap / 2 - 4, 0); c.textAlign = 'left'; px += gap - 4; }
    });
    c.restore();

    // kaki: tautan & hotline
    c.textBaseline = 'alphabetic'; c.font = mono(50); c.fillStyle = INK;
    const host = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    spaced(host.toUpperCase(), M, 3340, 3); // ± 14 mm dari tepi bawah (aman untuk printer)
    if (D.hotline) {
      const ht = `WA ${D.hotline.label}`;
      c.fillStyle = BLUE; spaced(ht, A4.w - M - textW(ht, 3), 3340, 3);
    }

    // NOISE: tile grain 256px, dilapis 'overlay'; area QR dikembalikan bersih
    const tile = document.createElement('canvas'); tile.width = tile.height = 256;
    const tc = tile.getContext('2d'), nd = tc.createImageData(256, 256);
    for (let i = 0; i < nd.data.length; i += 4) { const v = Math.random() * 255; nd.data[i] = nd.data[i + 1] = nd.data[i + 2] = v; nd.data[i + 3] = 255; }
    tc.putImageData(nd, 0, 0);
    const keep = c.getImageData(...qrBox);
    c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = .22; c.fillStyle = c.createPattern(tile, 'repeat'); c.fillRect(0, 0, A4.w, A4.h); c.restore();
    c.putImageData(keep, qrBox[0], qrBox[1]);
    return cv;
  };
  // Kartu QR persegi 1200px (Jadwal & tenant): logo-teks kecil seperti navbar
  // (MUSLIM/BERDEDIKASI + ikon) di atas tengah, judul, QR 900px, tautan.
  // Ukuran huruf dikecilkan sampai muat; tetap terlalu panjang → dipotong "…".
  const qrCard = async (qrc, title, url) => {
    try { await document.fonts.load('700 40px "Roboto Mono"'); } catch (_) { /* fallback */ }
    const N = 1200, cv = document.createElement('canvas');
    cv.width = cv.height = N;
    const c = cv.getContext('2d');
    const MONO = '"Roboto Mono", "Noto Sans Mono", monospace';
    c.fillStyle = '#fff'; c.fillRect(0, 0, N, N);
    c.drawImage(qrc, (N - qrc.width) / 2, 130);
    const fit = (t, max, size, min, weight, y, col) => {
      let fs = size;
      do { c.font = `${weight} ${fs}px ${MONO}`; } while (c.measureText(t).width > max && --fs > min);
      while (c.measureText(t).width > max && t.length > 4) t = `${t.slice(0, -2)}…`;
      c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, N / 2, y);
    };
    // judul tanpa akhiran nama acara (logo-teks penyelenggara ada di kaki
    // kartu, bukan di sini — lihat bawah). "Nama — Detail" (tenant — tenda,
    // atau Jadwal Acara — hari & tanggal): bagian sebelum tanda hubung jadi
    // judul besar, SISANYA (termasuk hari, bukan cuma tanggal) jadi satu
    // baris kecil abu-abu di bawahnya. Tanpa tanda hubung → satu baris saja.
    // Ruang di atas kini penuh milik judul (dulu berebut dengan logo-teks di
    // sini juga — sumpek saat judulnya 2 baris), jadi baris pertama bisa
    // diturunkan sedikit agar seimbang di tengah celah sebelum QR.
    const cut = title.lastIndexOf(' · ');
    const full = cut > 0 ? title.slice(0, cut) : title;
    const dash = full.indexOf(' — ');
    const main = dash > 0 ? full.slice(0, dash) : full;
    const detail = dash > 0 ? full.slice(dash + 3) : '';
    fit(main, N - 120, detail ? 52 : 44, 26, 700, detail ? 78 : 92, '#2b2b2b');
    if (detail) fit(detail, N - 120, 26, 16, 700, 124, '#777');
    // tautan panjang (mis. tenant dgn query panjang) dipecah 2 baris alih-alih
    // dipotong "…" — makanya kaki kartu (bar gelap) dibikin lebih tipis & diberi
    // jarak ekstra dari baris tautan supaya 2 baris pun tidak nempel ke bar.
    const maxW = N - 120, clean = url.replace(/^https?:\/\//, '');
    c.textAlign = 'center'; c.fillStyle = '#2150f5';
    let ufs = 30;
    c.font = `400 ${ufs}px ${MONO}`;
    while (c.measureText(clean).width > maxW && --ufs > 20);
    if (c.measureText(clean).width <= maxW) {
      c.textBaseline = 'middle'; c.fillText(clean, N / 2, 1040);
    } else {
      const mid = Math.floor(clean.length / 2);
      const delims = '/?&=#';
      let cutAt = -1;
      for (let d = 0; d < mid; d++) {
        if (delims.includes(clean[mid + d])) { cutAt = mid + d + 1; break; }
        if (delims.includes(clean[mid - d])) { cutAt = mid - d + 1; break; }
      }
      if (cutAt < 0) cutAt = mid;
      const l1 = clean.slice(0, cutAt), l2 = clean.slice(cutAt);
      let ufs2 = 24;
      do { c.font = `400 ${ufs2}px ${MONO}`; } while ((c.measureText(l1).width > maxW || c.measureText(l2).width > maxW) && --ufs2 > 14);
      c.textBaseline = 'middle';
      c.fillText(l1, N / 2, 1026); c.fillText(l2, N / 2, 1026 + ufs2 * 1.15);
    }
    // kaki kartu: bilah gelap full-width nempel ke tepi bawah — logo rapat
    // kiri, tanggal acara rapat kanan. Dipepetkan (padding atas-bawah kecil &
    // seimbang) supaya bilahnya ramping, tidak banyak ruang kosong di atas isi.
    const barH = 72, barY = N - barH;
    c.fillStyle = '#202124'; c.fillRect(0, barY, N, barH);
    const fs = 18, lh = fs * .98, mark = await fetchImg('assets/img/logo/mb9-mark-sm.webp?v=2');
    c.font = `700 ${fs}px ${MONO}`;
    const tw = Math.max(c.measureText('MUSLIM').width, c.measureText('BERDEDIKASI').width);
    const mh = lh * 2 + 5, mw = mark ? mark.width * (mh / mark.height) : 0;
    const lx = 36, ly = N - 16 - mh;
    c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'top';
    c.fillText('MUSLIM', lx, ly + 1); c.fillText('BERDEDIKASI', lx, ly + 1 + lh);
    if (mark) c.drawImage(mark, lx + tw + 9, ly - 2, mw, mh);
    // tanggal acara (rentang hari pertama–terakhir, bulan, tahun) — diambil
    // dari D.days, bukan hardcode, biar ikut berubah kalau tanggal diubah.
    const iso = (s) => { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; };
    const d0 = iso(D.days[0].iso), dN = iso(D.days[D.days.length - 1].iso);
    // satu baris lurus, sejajar vertikal dgn logo-teks di kiri: rentang
    // tanggal tebal, bulan & tahun lebih tipis — beda bobot bukan beda baris.
    const dateCY = ly + mh / 2, dfs = 20;
    const p1 = `${d0.d} – ${dN.d} `, p2 = `${BULAN[dN.m - 1].toUpperCase()} ${dN.y}`;
    c.font = `700 ${dfs}px ${MONO}`; const p1w = c.measureText(p1).width;
    c.font = `400 ${dfs}px ${MONO}`; const p2w = c.measureText(p2).width;
    const dx = N - 36 - (p1w + p2w);
    c.textAlign = 'left'; c.textBaseline = 'middle';
    c.font = `700 ${dfs}px ${MONO}`; c.fillStyle = '#fff'; c.fillText(p1, dx, dateCY);
    c.font = `400 ${dfs}px ${MONO}`; c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText(p2, dx + p1w, dateCY);
    return cv;
  };
  // PDF A4 satu halaman berisi satu gambar JPEG (DCTDecode) — cukup untuk cetak
  const jpegToPdf = (jpg, wpx, hpx) => {
    const W = 595.28, H = 841.89, enc = new TextEncoder();
    const parts = [], offs = [];
    let len = 0;
    const push = (b) => { const u = typeof b === 'string' ? enc.encode(b) : b; parts.push(u); len += u.length; };
    const obj = (n, body, stream) => {
      offs[n] = len;
      push(`${n} 0 obj\n${body}\n`);
      if (stream) { push('stream\n'); push(stream); push('\nendstream\n'); }
      push('endobj\n');
    };
    const content = enc.encode(`q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`);
    push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
    obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
    obj(4, `<< /Type /XObject /Subtype /Image /Width ${wpx} /Height ${hpx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>`, jpg);
    obj(5, `<< /Length ${content.length} >>`, content);
    const xref = len;
    push(`xref\n0 6\n0000000000 65535 f \n${[1, 2, 3, 4, 5].map((n) => `${String(offs[n]).padStart(10, '0')} 00000 n \n`).join('')}`);
    push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(parts, { type: 'application/pdf' });
  };
  const OPT_ICON = {
    copy: '<path d="M9 9h11v11H9zM5 15H4V4h11v1"/>',
    qr: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
    more: '<path d="M5 12h.01M12 12h.01M19 12h.01"/>',
  };
  // modal: true → kartu yang sama, tapi di TENGAH layar dengan latar gelap,
  // halaman dikunci & ada tombol tutup (dipakai logo footer).
  const shareMenu = (btn, getData, { modal = false } = {}) => {
    const pop = document.createElement('div');
    pop.className = `share-pop${modal ? ' share-pop--modal' : ''}`;
    let shade = null;
    if (modal) {
      pop.setAttribute('aria-modal', 'true');
      shade = document.createElement('div');
      shade.className = 'share-shade';
      shade.hidden = true;
      document.body.appendChild(shade);
    }
    pop.hidden = true;
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Bagikan');
    pop.setAttribute('data-lenis-prevent', ''); // isinya bisa digulir di layar pendek
    // Ditempel ke <body> (position: fixed), BUKAN di sebelah tombol: di dalam
    // section ia bisa terpotong section berikutnya / kalah stacking context
    // (hero, countdown, marquee). Posisinya dihitung dari tombol di place().
    document.body.appendChild(pop);
    const host = btn.closest('.share') || btn.parentElement;
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    let data = null;
    // Umpan balik ditulis di DALAM tombolnya sendiri lalu dikembalikan —
    // bukan baris pesan di bawah, yang menambah tinggi dropdown & membuatnya
    // meloncat setiap kali muncul/hilang.
    const say = (b, m) => {
      const lab = $('span', b);
      if (!b.dataset.label) b.dataset.label = lab.textContent;
      lab.textContent = m;
      b.classList.add('is-done');
      clearTimeout(b._t);
      b._t = setTimeout(() => { lab.textContent = b.dataset.label; b.classList.remove('is-done'); }, 1800);
    };
    // Posisi (koordinat layar, ikut tombol saat digulir/diputar):
    // - Denah desktop: di KANAN panel samping, sejajar bawah tombol.
    // - Denah HP: selebar panel. Hero: rata kanan tombol. Lainnya: rata kiri.
    // - HP: buka ke ATAS tombol bila ruangnya cukup (sisakan ±96px untuk nav
    //   yang fixed agar QR tidak tertutup); kalau tidak, ke bawah. Hanya
    //   bergantung pada posisi TOMBOL, jadi tidak berkedip di titik batas.
    // Mendatar selalu dijepit 8px dari tepi layar.
    const place = () => {
      const mobile = matchMedia('(max-width: 860px)').matches;
      const b = btn.getBoundingClientRect(), hr = host.getBoundingClientRect();
      const side = host.classList.contains('share--side');
      const body = pop.querySelector('.share-pop__body');
      if (body) body.style.maxHeight = '';
      pop.style.width = '';
      if (modal) {
        const lim = innerHeight - 32;
        if (body && pop.offsetHeight > lim) body.style.maxHeight = `${Math.max(160, lim - (pop.offsetHeight - body.offsetHeight))}px`;
        pop.style.left = `${Math.round((innerWidth - pop.offsetWidth) / 2)}px`;
        pop.style.top = `${Math.round((innerHeight - pop.offsetHeight) / 2)}px`;
        return;
      }
      // Denah: ke kanan panel hanya kalau ruang di kanan tombol cukup (layout
      // 2 kolom); kalau tidak (1 kolom, termasuk tablet/landscape) selebar panel
      const sideRight = side && b.right + 14 + pop.offsetWidth <= innerWidth - 8;
      if (side && !sideRight) pop.style.width = `${Math.min(hr.width, innerWidth - 16)}px`;
      const w = pop.offsetWidth, h = pop.offsetHeight;
      // batas atas: di bawah nav kalau nav sedang tampil, selain itu tepi layar
      const navEl = document.getElementById('nav');
      const roof = Math.max(0, navEl ? navEl.getBoundingClientRect().bottom : 0) + 8;
      const floor = innerHeight - 8;
      let left, top;
      if (sideRight) { left = b.right + 14; top = b.bottom - h; }
      else {
        left = side ? hr.left : b.left;
        const down = b.bottom + 8, up = b.top - 8 - h;
        const fitsDown = down + h <= floor, fitsUp = up >= roof;
        // HP lebih suka ke atas (jempol di bawah), desktop ke bawah; kalau sisi
        // pilihan tidak muat → sisi lain; kalau dua-duanya tidak → yang lebih lega
        if (mobile ? fitsUp : !fitsDown && fitsUp) top = up;
        else if (fitsDown) top = down;
        else {
          // dua-duanya tidak muat (layar pendek / landscape): pakai sisi yang
          // lebih lega dan isinya dipendekkan + digulir — tombol tidak tertutup
          const roomUp = b.top - 8 - roof, roomDown = floor - b.bottom - 8;
          const room = Math.max(roomUp, roomDown);
          if (body) body.style.maxHeight = `${Math.max(160, room - (h - body.offsetHeight))}px`;
          top = roomUp > roomDown ? b.top - 8 - pop.offsetHeight : down;
        }
      }
      // lebih tinggi dari layar (mis. panel Denah di landscape lebar): isi dipendekkan
      if (body && pop.offsetHeight > floor - roof) {
        body.style.maxHeight = `${Math.max(160, floor - roof - (pop.offsetHeight - body.offsetHeight))}px`;
        if (sideRight) top = b.bottom - pop.offsetHeight;
      }
      // tetap di dalam layar
      top = Math.min(Math.max(top, roof), Math.max(roof, floor - pop.offsetHeight));
      pop.dataset.right = sideRight ? '1' : '';
      pop.style.left = `${Math.round(Math.min(Math.max(left, 8), innerWidth - w - 8))}px`;
      pop.style.top = `${Math.round(top)}px`;
    };
    // Ikut tombol saat digulir hanya sebentar: begitu halaman sudah bergeser
    // lebih dari setengah layar (maks. 360px) sejak dibuka, atau tombolnya
    // keluar layar, dropdown ditutup — tidak menempel terus sepanjang halaman.
    let placeRaf = 0, startY = 0;
    const onMove = () => {
      if (pop.hidden || placeRaf) return;
      placeRaf = requestAnimationFrame(() => {
        placeRaf = 0;
        const b = btn.getBoundingClientRect();
        if (!modal && (Math.abs(scrollY - startY) > Math.min(innerHeight / 2, 360) || b.bottom < 0 || b.top > innerHeight)) { close(); return; }
        place();
      });
    };
    addEventListener('scroll', onMove, { passive: true });
    addEventListener('resize', onMove, { passive: true });
    const close = () => {
      if (pop.hidden) return;
      pop.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (modal) { shade.hidden = true; if (lenis) lenis.start(); }
    };
    const open = () => {
      data = getData();
      if (!data) return;
      const opt = (act, icon, label, wide) => `<button type="button" class="share-pop__opt${wide ? ' share-pop__opt--wide' : ''}" data-act="${act}"><svg class="is-line" viewBox="0 0 24 24" aria-hidden="true">${OPT_ICON[icon]}</svg><span aria-live="polite">${label}</span></button>`;
      pop.innerHTML = `${modal ? '<button type="button" class="share-pop__x" data-act="close" aria-label="Tutup">✕</button>' : ''}<div class="share-pop__body">
        <canvas class="share-pop__qr" role="img" aria-label="Kode QR: ${esc(data.title)}"></canvas>
        <p class="share-pop__cap mono">Pindai untuk membuka</p>
        <div class="share-pop__grid">
          ${NETS.map(([k, label, href]) => `<a class="share-pop__opt" href="${esc(href(data.url, data.title))}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${BRAND_ICONS[k]}"/></svg>${label}</a>`).join('')}
          ${opt('copy', 'copy', 'Salin tautan')}${data.poster ? `<div class="share-pop__dl">${opt('dl', 'qr', 'Unduh…').replace('<button ', '<button aria-haspopup="true" aria-expanded="false" ')}<div class="share-pop__sub" role="menu" hidden><button type="button" role="menuitem" data-act="qr"><span aria-live="polite">QR code saja</span><small>PNG</small></button><button type="button" role="menuitem" data-act="poster"><span aria-live="polite">Poster A4</span><small>PDF</small></button></div></div>` : opt('qr', 'qr', 'Unduh QR')}
          ${opt('native', 'more', 'Bagikan lainnya…', true)}
        </div></div>`;
      const cv = $('.share-pop__qr', pop);
      drawQR(cv, Math.round(168 * Math.min(3, devicePixelRatio || 1)), data.url, data.logo)
        .then((ok) => { if (!ok) { cv.hidden = true; $('.share-pop__cap', pop).hidden = true; } });
      pop.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      startY = scrollY;
      if (modal) { shade.hidden = false; if (lenis) lenis.stop(); }
      place();
      if (modal) return;
      // Layar pendek (HP landscape): atas & bawah tombol sama-sama sempit →
      // gulir halaman agar tombol naik ke dekat atas, lalu dropdown turun
      // dengan ruang penuh. place() ikut berjalan lewat listener scroll.
      const body = pop.querySelector('.share-pop__body');
      if (body && body.style.maxHeight && !pop.dataset.right) {
        const navEl = document.getElementById('nav');
        const roof = Math.max(0, navEl ? navEl.getBoundingClientRect().bottom : 0) + 8;
        const dy = btn.getBoundingClientRect().top - roof;
        // titik awal batas tutup = posisi SESUDAH gulir otomatis ini
        if (dy > 8) { startY = scrollY + dy; if (lenis) lenis.scrollTo(startY, { duration: 0.5 }); else scrollBy({ top: dy, behavior: 'smooth' }); }
      }
    };
    btn.addEventListener('click', (e) => {
      if (!pop.hidden) { close(); return; }
      open();
      // dibuka lewat keyboard (detail 0): fokus pindah ke opsi pertama, karena
      // dropdown kini di ujung <body> dan tidak lagi berikutnya dalam urutan Tab
      if (!e.detail) $('.share-pop__opt', pop)?.focus();
    });
    pop.addEventListener('click', async (e) => {
      // klik di luar tombol Unduh → tooltip pilihannya ditutup
      const openSub = $('.share-pop__sub:not([hidden])', pop);
      if (openSub && !e.target.closest('.share-pop__dl')) { openSub.hidden = true; $('[data-act="dl"]', pop).setAttribute('aria-expanded', 'false'); }
      if (e.target.closest('a')) { setTimeout(close, 150); return; } // jejaring dibuka di tab baru
      const b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.dataset.act === 'close') { close(); btn.focus(); return; }
      // tombol Unduh (link utama): buka/tutup tooltip pilihan QR saja / Poster A4
      const sub = $('.share-pop__sub', pop);
      if (b.dataset.act === 'dl') {
        sub.hidden = !sub.hidden;
        b.setAttribute('aria-expanded', String(!sub.hidden));
        if (!sub.hidden && !e.detail) $('button', sub).focus();
        return;
      }
      if (b.dataset.act === 'copy') {
        try { await navigator.clipboard.writeText(data.url); say(b, 'Tersalin ✓'); } catch (_) { say(b, 'Gagal menyalin'); }
      } else if (b.dataset.act === 'qr') {
        // file unduhan persegi beresolusi tinggi (1200px) — layak cetak untuk
        // booth: judul di atas, QR di tengah, tautan di bawah
        const qrc = document.createElement('canvas');
        if (!(await drawQR(qrc, 900, data.url, data.logo))) { say(b, 'QR belum siap'); return; }
        const big = await qrCard(qrc, data.title, data.url);
        big.toBlob((blob) => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${data.file}-qr.png`;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 4000);
          say(b, 'Terunduh ✓');
        }, 'image/png');
      } else if (b.dataset.act === 'poster') {
        say(b, 'Menyiapkan…');
        const cv = await drawPoster(data.url);
        cv.toBlob(async (blob) => {
          const jpg = new Uint8Array(await blob.arrayBuffer());
          const a = document.createElement('a');
          a.href = URL.createObjectURL(jpegToPdf(jpg, cv.width, cv.height));
          a.download = `${data.file}-poster-a4.pdf`;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 4000);
          say(b, 'Terunduh ✓');
        }, 'image/jpeg', 0.9);
      } else if (b.dataset.act === 'native') {
        // fungsi tombol Bagikan sebelumnya: lembar share bawaan perangkat,
        // atau salin tautan di browser yang tidak mendukungnya
        try {
          if (navigator.share) { await navigator.share({ title: data.title, text: data.title, url: data.url }); close(); return; }
          await navigator.clipboard.writeText(data.url);
          say(b, 'Tersalin ✓');
        } catch (err) {
          if (!err || err.name !== 'AbortError') say(b, 'Gagal membagikan'); // AbortError = lembar ditutup
        }
      }
    });
    // e.isTrusted: abaikan klik buatan program — link unduhan QR sementara
    // ditempel ke <body> lalu di-.click(), dan tanpa ini dianggap klik di luar
    document.addEventListener('click', (e) => { if (e.isTrusted && !pop.hidden && !pop.contains(e.target) && !btn.contains(e.target)) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { close(); btn.focus(); } });
    return { close };
  };

  // Jadwal: tautan dibangun bersih — tanpa ?tenant=/?tenda= sisa memilih tenda
  // di denah (kalau ikut, penerima malah dilempar ke denah, bukan ke jadwal).
  // Dipanggil saat tombol diklik — "tabs" & D.days sudah terisi oleh saat itu
  // meski definisinya ada di bawah sini (urutan deklarasi di file, bukan urutan jalan).
  const shareBtn = $('#shareBtn');
  if (shareBtn) {
    shareMenu(shareBtn, () => {
      const url = new URL(location.href);
      url.pathname = stripIndex(url.pathname);
      url.searchParams.delete('tenant');
      url.searchParams.delete('tenda');
      url.hash = 'jadwal';
      const ev = (D.event && D.event.title) || 'Muslim Berdedikasi 9';
      // Hari tertentu HANYA disebut kalau ?hari= sudah ada di URL — artinya
      // memang dipilih (klik tab) atau dibuka lewat deep-link. Belum disentuh
      // sama sekali (params kosong, masih tab bawaan) → judul generik "Jadwal
      // N Hari" (N ikut D.days, sama istilahnya dengan poster A4) & tautan
      // tetap bersih, tidak dipaksa menyertakan hari.
      const hariParam = new URLSearchParams(location.search).get('hari');
      const idx = D.days.findIndex((d) => d.key === hariParam);
      const day = D.days[idx];
      // "Hari ke-N" ikut baris judul besar (di kartu QR) — tanda hubung cuma
      // sebelum nama+tanggal hari, jadi tanpa koma nyambung ke "Hari ke-N" lagi.
      const where = day ? ` Hari ke-${idx + 1} — ${day.full}` : '';
      const title = day ? `Jadwal Acara${where}` : `Jadwal Acara Selama ${D.days.length} Hari`;
      const file = day ? `mb9-jadwal-hari-ke-${idx + 1}` : 'mb9-jadwal';
      return { url: url.href, title: `${title} · ${ev}`, logo: MB9_LOGO, file };
    });
  }

  // Bagikan acara (hero & footer): tautan root yang bersih — tanpa ?hari, ?tenant, #.
  // Petunjuk "BAGIKAN" di kotak biru logo hero: disembunyikan selamanya
  // setelah pengunjung pernah mengklik logo (hero atau footer).
  const KEY_SHARE_SEEN = 'mb9-share-seen';
  try { if (localStorage.getItem(KEY_SHARE_SEEN)) root.classList.add('share-seen'); } catch (_) { /* private mode */ }
  let hintTimer = 0;
  const markShareSeen = () => {
    root.classList.add('share-seen');
    root.classList.remove('hint-pop', 'hint-out');
    clearTimeout(hintTimer);
    try { localStorage.setItem(KEY_SHARE_SEEN, '1'); } catch (_) { /* private mode */ }
  };
  // HP: balon "BAGIKAN" zoom keluar dari tengah logo selama 6 detik, lalu masuk lagi;
  // diulang tiap 30 detik — hanya saat logo hero terlihat & tab aktif —
  // sampai logo diklik. Pertama kali setelah animasi intro selesai.
  (() => {
    const vis = $('#heroShare');
    if (!vis || root.classList.contains('share-seen')) return;
    const small = matchMedia('(max-width: 860px)');
    let inView = false;
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(vis);
    const cycle = (wait) => {
      hintTimer = setTimeout(() => {
        if (root.classList.contains('share-seen')) return;
        if (small.matches && inView && !document.hidden) {
          root.classList.add('hint-pop');
          hintTimer = setTimeout(() => {
            // balon mengecil kembali ke tengah logo (.hint-out)
            root.classList.remove('hint-pop');
            root.classList.add('hint-out');
            setTimeout(() => root.classList.remove('hint-out'), 400);
            cycle(30000);
          }, 6000);
        } else cycle(2000); // belum terlihat: cek lagi sebentar lagi
      }, wait);
    };
    cycle(reduced ? 1500 : 3200);
  })();
  // Logo MB9 di hero, footer & menu mobile: membuka kartu yang sama sebagai modal di tengah layar
  ['#heroShare', '#footShare', '#menuShare'].map((id) => $(id)).filter(Boolean).forEach((btn) => {
    btn.addEventListener('click', markShareSeen);
    shareMenu(btn, () => ({
      // tanpa "/" penutup: tampil & tersalin sebagai domain.id, bukan domain.id/
      url: (location.origin + stripIndex(location.pathname)).replace(/\/$/, ''),
      title: (D.event && D.event.title) || 'Muslim Berdedikasi 9',
      logo: MB9_LOGO,
      file: 'mb9',
      poster: true, // "Unduh QR" → poster A4 (PDF)
    }), { modal: true });
  });

  /* ---------------------------------------------------------
     AJAKAN PASANG APLIKASI — muncul beberapa detik setelah load,
     hanya kalau belum terpasang dan belum di-snooze. "Nanti" menunda
     1 hari; dengan kotak centang dicentang, tidak muncul lagi.
     --------------------------------------------------------- */
  const a2hs = $('#a2hs');
  if (a2hs) {
    // Dua kunci terpisah: menutup/memasang ajakan TIDAK boleh ikut membungkam
    // info "sudah terpasang" — kalau satu kunci, appinstalled menyimpan 'never'
    // dan infonya tidak pernah muncul lagi.
    const KEY_ASK = 'mb9-a2hs';        // ajakan pasang
    const KEY_HINT = 'mb9-a2hs-open';  // info aplikasi sudah terpasang
    let activeKey = KEY_ASK;           // kunci yang dipakai tombol "Nanti" saat ini
    const DELAY = 7000;          // beri ruang untuk preloader + intro
    const SNOOZE = 24 * 60 * 60 * 1000;
    const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* mode privat */ } };
    const muted = (k) => {
      try {
        const v = localStorage.getItem(k);
        return v === 'never' || (!!v && Date.now() < Number(v));
      } catch (e) { return false; }
    };
    const installed = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    const hide = () => {
      a2hs.classList.remove('is-in');
      setTimeout(() => { a2hs.hidden = true; }, 500);
    };
    // ?a2hsdebug — abaikan snooze & tampilkan hasil deteksi apa adanya,
    // untuk memastikan di perangkat sungguhan (API-nya Chromium-only)
    const debugMode = new URLSearchParams(location.search).has('a2hsdebug');
    const show = (key) => {
      activeKey = key;
      if ((!debugMode && (installed || muted(key))) || !a2hs.hidden) return;
      a2hs.hidden = false;
      void a2hs.offsetWidth; // paksa reflow agar state awal terpakai → transisi benar-benar jalan
      a2hs.classList.add('is-in');
    };

    let deferred = null;
    // Chrome/Android: tawaran pasang asli. Event ini bisa datang sebelum DELAY habis.
    addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferred = e;
      setTimeout(() => show(KEY_ASK), DELAY);
    });

    // Vendor browser: alur pemasangan berbeda-beda. Chrome/Edge Android
    // menampilkan progres di bilah notifikasi; Samsung Internet punya alurnya
    // sendiri; Firefox Android & semua browser iOS tidak punya event pasang.
    const ua = navigator.userAgent;
    const vendor = /SamsungBrowser/i.test(ua) ? 'samsung'
      : /EdgA/i.test(ua) ? 'edge'
      : /OPR\/|Opera/i.test(ua) ? 'opera'
      : /Firefox|FxiOS/i.test(ua) ? 'firefox'
      : /iphone|ipad|ipod/i.test(ua) ? 'ios'
      : /Android/i.test(ua) && /Chrome\//i.test(ua) ? 'chrome'
      : 'other';
    const WATCH = {
      chrome: 'Pantau progresnya di bilah notifikasi — tarik turun dari atas layar.',
      edge: 'Pantau progresnya di bilah notifikasi — tarik turun dari atas layar.',
      samsung: 'Samsung Internet sedang menambahkan ikonnya. Statusnya bisa muncul di bilah notifikasi di atas layar.',
    };

    // Status pemasangan (khusus mobile): di atas layar, caret menunjuk bilah
    // notifikasi. Halaman TIDAK bisa membaca progres asli dari sistem, jadi
    // yang ditampilkan status nyata dari event: pengguna menyetujui dialog
    // (sedang memasang) → appinstalled (selesai). "Terpasang" hanya sekali.
    const KEY_TOAST = 'mb9-install-toast';
    const toast = $('#itoast');
    const coarse = matchMedia('(pointer: coarse)');
    let toastT = 0, waitT = 0;
    const toastHide = () => {
      if (!toast) return;
      clearTimeout(toastT);
      toast.classList.remove('is-in');
      setTimeout(() => { if (!toast.classList.contains('is-in')) toast.hidden = true; }, 500);
    };
    const toastShow = (state, title, text, autoHide) => {
      if (!toast || !coarse.matches) return;
      toast.classList.remove('is-done', 'is-wait');
      if (state !== 'busy') toast.classList.add(`is-${state}`);
      $('#itoastTitle').textContent = title;
      $('#itoastText').textContent = text;
      if (toast.hidden) { toast.hidden = false; void toast.offsetWidth; } // reflow agar transisi masuk jalan
      toast.classList.add('is-in');
      clearTimeout(toastT);
      if (autoHide) toastT = setTimeout(toastHide, autoHide);
    };
    const toastDone = () => {
      clearTimeout(waitT);
      if (muted(KEY_TOAST)) { toastHide(); return; }
      store(KEY_TOAST, 'never');
      toastShow('done', 'Aplikasi terpasang', 'Buka MB9 dari ikon di layar utama — tampil penuh layar dan tetap jalan saat sinyal lemah.', 7000);
    };
    if (toast) $('#itoastClose').addEventListener('click', toastHide);
    // Dibuka pertama kali sebagai aplikasi. Satu-satunya sinyal di iOS (tidak
    // ada event pasang); di Android biasanya sudah tertangani appinstalled
    // karena penyimpanannya berbagi dengan Chrome, jadi tidak muncul dua kali.
    if (installed && !muted(KEY_TOAST)) setTimeout(toastDone, DELAY);

    // iOS Safari tidak punya beforeinstallprompt — hanya bisa diarahkan manual
    const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const webkit = iOS && !/crios|fxios|edgios/i.test(navigator.userAgent);
    if (webkit && !installed) {
      $('#a2hsText').textContent = 'Ketuk tombol Bagikan di Safari, lalu pilih “Tambah ke Layar Utama”.';
      $('#a2hsInstall').hidden = true;
      $('span', $('#a2hsLater')).textContent = 'Mengerti';
      setTimeout(() => show(KEY_ASK), DELAY);
    }

    // Sudah terpasang tapi dibuka lewat tab browser biasa. getInstalledRelatedApps()
    // bisa melaporkan PWA ini sendiri karena manifest mencantumkan
    // related_applications platform "webapp". Hanya Chromium; browser lain
    // mengembalikan undefined dan blok ini dilewati begitu saja.
    if (debugMode) {
      const dm = matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser';
      const api = navigator.getInstalledRelatedApps ? 'ADA' : 'TIDAK ADA';
      Promise.resolve(navigator.getInstalledRelatedApps ? navigator.getInstalledRelatedApps() : [])
        .catch((e) => `galat: ${e.message}`)
        .then((apps) => {
          $('#a2hsTitle').textContent = 'Diagnostik pemasangan';
          $('#a2hsText').textContent =
            `vendor: ${vendor} · API: ${api} · hasil: ${Array.isArray(apps) ? apps.length + ' app' : apps}`
            + ` · mode: ${dm} · ${location.protocol}`
            + ` · origin: ${location.origin}`
            + ` · manifest: ${(document.querySelector('link[rel=manifest]') || {}).href || '-'}`
            + ` · snooze: ${localStorage.getItem(KEY_ASK) || '-'} / ${localStorage.getItem(KEY_HINT) || '-'}`;
          $('#a2hsInstall').hidden = true;
          $('span', $('#a2hsLater')).textContent = 'Tutup';
          setTimeout(() => show(KEY_HINT), 1200);
        });
    }

    if (!installed && !webkit && navigator.getInstalledRelatedApps) {
      navigator.getInstalledRelatedApps().then((apps) => {
        if (!apps.length) return;
        $('#a2hsTitle').textContent = 'Aplikasi sudah terpasang';
        $('#a2hsText').textContent = 'Buka MB9 dari ikon di layar utama — tampil penuh layar dan tetap bisa dibuka saat sinyal lemah.';
        $('#a2hsInstall').hidden = true;
        $('span', $('#a2hsLater')).textContent = 'Mengerti';
        setTimeout(() => show(KEY_HINT), DELAY);
      }).catch(() => {});
    }

    $('#a2hsInstall').addEventListener('click', async () => {
      if (!deferred) return hide();
      hide();
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = null;
      if (outcome === 'dismissed') store(KEY_ASK, String(Date.now() + SNOOZE));
      if (outcome === 'accepted' && !muted(KEY_TOAST)) {
        toastShow('busy', 'Sedang memasang…', WATCH[vendor] || 'Statusnya bisa muncul di bilah notifikasi di atas layar.');
        // appinstalled tak kunjung datang → jangan biarkan bar berputar selamanya
        waitT = setTimeout(() => toastShow('wait', 'Belum ada konfirmasi',
          'Pemasangan mungkin masih berjalan — cek bilah notifikasi di atas layar.', 8000), 45000);
      }
    });
    $('#a2hsLater').addEventListener('click', () => {
      store(activeKey, $('#a2hsNever').checked ? 'never' : String(Date.now() + SNOOZE));
      hide();
    });
    // hanya membungkam ajakannya; info "sudah terpasang" tetap boleh muncul nanti
    // juga menangkap pemasangan lewat menu browser (tanpa tombol Pasang kita)
    addEventListener('appinstalled', () => { store(KEY_ASK, 'never'); hide(); toastDone(); });
  }

  /* ---------------------------------------------------------
     STATUS SAMBUNGAN (offline/online)
     --------------------------------------------------------- */
  (() => {
    const ntoast = $('#ntoast');
    if (!ntoast) return;
    const ntext = $('#ntoastText');
    const dot = $('#navStatus');
    const OFFLINE_MSG = 'Mode offline — memakai salinan tersimpan di perangkat';
    let hideT = 0;
    const hide = () => {
      clearTimeout(hideT);
      ntoast.classList.remove('is-in');
      setTimeout(() => { if (!ntoast.classList.contains('is-in')) ntoast.hidden = true; }, 500);
    };
    const show = (on, text, autoHide) => {
      clearTimeout(hideT);
      ntoast.classList.toggle('is-on', on);
      ntext.textContent = text;
      if (ntoast.hidden) { ntoast.hidden = false; void ntoast.offsetWidth; } // reflow agar transisi masuk jalan
      ntoast.classList.add('is-in');
      if (autoHide) hideT = setTimeout(hide, autoHide);
    };
    // was-offline: notif "tersambung lagi" hanya muncul setelah benar2 sempat
    // putus di sesi ini — bukan setiap kali halaman dimuat dalam kondisi online
    let wasOffline = !navigator.onLine;
    // Tombol ✕: pita disembunyikan, tersisa titik kecil di navbar (kanan logo)
    // selama masih offline — tidak mengganggu, tapi statusnya tetap terlihat.
    // Klik titiknya membuka lagi pita penuh.
    $('#ntoastClose')?.addEventListener('click', () => { hide(); if (wasOffline && dot) dot.disabled = false; });
    dot?.addEventListener('click', () => { dot.disabled = true; show(false, OFFLINE_MSG); });
    if (wasOffline) show(false, OFFLINE_MSG);
    addEventListener('offline', () => { wasOffline = true; show(false, OFFLINE_MSG); });
    addEventListener('online', () => {
      if (!wasOffline) return;
      wasOffline = false;
      if (dot) dot.disabled = true;
      show(true, 'Tersambung kembali ✓', 3500);
    });
  })();

  // Jadwal tabs
  const TAGS = { kajian: 'Kajian', layanan: 'Layanan', lomba: 'Lomba', talkshow: 'Talkshow' };
  const tabs = $('#dayTabs');
  const panel = $('#jadwalPanel');
  // Status hari menurut jam WIB. Indikatornya hanya jam tutup: sejak masuk
  // tanggalnya (00:00) hari itu "Hari ini", lewat jam tutup langsung "Selesai".
  // `let`: diperbarui otomatis bila halaman dibiarkan terbuka (lihat rollDay).
  const OPEN = (D.hours && D.hours.open) || '08:00';
  const CLOSE = (D.hours && D.hours.close) || '21:00';
  let todayWIB, dayClosed, todayIdx;
  const readClock = () => {
    const now = new Date();
    const hhmm = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
    todayWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
    dayClosed = hhmm >= CLOSE;
    todayIdx = dayClosed ? -1 : D.days.findIndex((d) => d.iso === todayWIB);
  };
  readClock();
  // Hari acara yang berstatus "hari ini" pada waktu t (ms): sejak 00:00 WIB
  // tanggalnya s/d jam tutup — dipakai countdown & penanda menu.
  // Fungsi murni (tidak mengubah state tab), aman dipanggil tiap detik.
  const openDayAt = (t) => {
    const at = (d, hhmm) => new Date(`${d.iso}T${hhmm}:00+07:00`).getTime();
    return D.days.find((d) => t >= at(d, '00:00') && t < at(d, CLOSE)) || null;
  };
  const nextOpenAt = (t) => {
    const d = D.days.find((x) => new Date(`${x.iso}T${OPEN}:00+07:00`).getTime() > t);
    return d ? new Date(`${d.iso}T${OPEN}:00+07:00`).getTime() : 0;
  };
  const isPast = (d) => d.iso < todayWIB || (d.iso === todayWIB && dayClosed);
  // Tab otomatis: hari ini selama jam acara, selain itu hari berikutnya yang belum lewat
  const autoIdx = () => {
    if (todayIdx >= 0) return todayIdx;
    const next = D.days.findIndex((d) => !isPast(d));
    return next >= 0 ? next : 0;
  };
  // Deep link: ?hari=d3 membuka tab hari itu — panitia bisa membagikan tautan
  // langsung ke jadwal satu hari. Kalau tidak ada, jatuh ke hari ini / berikutnya.
  const linkedIdx = D.days.findIndex((d) => d.key === new URLSearchParams(location.search).get('hari'));
  const defaultIdx = linkedIdx >= 0 ? linkedIdx : autoIdx();
  // Hari yang sudah lewat tidak disimpan di URL: tautan lama tetap membuka tabnya,
  // tapi ?hari dibuang dari address bar supaya tidak ikut tersimpan/dibagikan.
  const isPastDay = (key) => { const d = D.days.find((x) => x.key === key); return !!d && isPast(d); };
  if (linkedIdx >= 0 && isPastDay(D.days[linkedIdx].key)) {
    const u = new URL(location); u.searchParams.delete('hari'); history.replaceState(null, '', u);
  }
  const tabsHTML = (sel) => D.days.map((d, i) => `
    <button class="day${i === todayIdx ? ' is-today' : ''}${isPast(d) ? ' is-past' : ''}" role="tab" id="tab-${d.key}" aria-selected="${i === sel}" aria-controls="jadwalPanel" data-day="${d.key}" tabindex="${i === sel ? 0 : -1}" aria-label="Hari ke-${i + 1}, ${esc(d.full || d.short)} ${esc(d.date)} ${d.year}">
      <small>Hari ke-${i + 1}</small><b>${esc(d.short)}</b><span>${esc(d.date)} ${d.year}</span><i class="day__edge" aria-hidden="true">${i === todayIdx ? 'Hari ini' : `Hari ke-${i + 1}`}</i>
      ${i === todayIdx ? '<em class="day__badge day__badge--today mono">Hari ini</em>' : isPast(d) ? '<em class="day__badge day__badge--past mono">Selesai</em>' : ''}
    </button>`).join('');
  tabs.innerHTML = tabsHTML(defaultIdx);

  // Tampilan "Per Waktu": jadwal yang sama dikelompokkan di bawah heading
  // Pagi/Siang/Sore/Malam (berdasar jam mulai) — murni pengelompokan visual,
  // bukan data baru. Toggle & pilihannya tersimpan di localStorage.
  const PERIODE = [
    { key: 'pagi', label: 'Pagi', to: 12 * 60 },
    { key: 'siang', label: 'Siang', to: 15 * 60 },
    { key: 'sore', label: 'Sore', to: 18 * 60 },
    { key: 'malam', label: 'Malam', to: 24 * 60 },
  ];
  const toMin = (hhmm) => { const [h, m] = hhmm.split('.').map(Number); return h * 60 + m; };
  const periodeOf = (time) => { const s = toMin(time.split(' - ')[0]); return PERIODE.find((p) => s < p.to) || PERIODE[PERIODE.length - 1]; };
  const JICONS = {
    toko: 'M3 9 5 4h14l2 5M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9ZM5 13v7h14v-7M10 20v-4h4v4',
    medis: 'M2 21h20M4 21V5h16v16M8 9h2M14 9h2M8 13h2M14 13h2M10 21v-4h4v4',
    piala: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 21h8',
    mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3M8 21h8',
    tetes: 'M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z',
    nadi: 'M3 12h4l2-4 4 8 2-4h6',
    hati: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
    gunting: 'M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM8.2 7.8L20 19M8.2 16.2L20 5',
    obrolan: 'M4 5h11v8H8l-4 3zM15 9h5v8l-3-2h-6v-2',
    muslimah: 'M4.5 21C5 18 5 15 5 10a7 7 0 0 1 14 0c0 5 0 8 .5 11-5 1-10 1-15 0zM12 7a3.5 4.5 0 1 1 0 9 3.5 4.5 0 0 1 0-9zM8.7 10.2c2.1-.8 4.5-.8 6.6 0',
    titik: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
    masjid: 'M3 21h18M5 21v-8h14v8M12 3c-3.2 2-5 4.2-5 7h10c0-2.8-1.8-5-5-7zM12 3V1M10 21v-3a2 2 0 0 1 4 0v3',
    jam: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7v5l3 2',
    grup: 'M12 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6.5 20v-1a5.5 5.5 0 0 1 11 0v1M5 8.5a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4zM1.5 19v-.5A3.5 3.5 0 0 1 5 15M19 8.5a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4zM22.5 19v-.5A3.5 3.5 0 0 0 19 15',
  };
  // Ikon dipilih dari kata kunci judul; r.icon di data-prod.js bisa menimpanya.
  const ICON_RULES = [
    [/bazar|foodcourt/, 'toko'], [/khitan/, 'grup'], [/lomba|musabaqah|grand final/, 'piala'],
    [/donor/, 'tetes'], [/periksa|kesehatan/, 'nadi'], [/bekam/, 'hati'], [/cut|cukur/, 'gunting'],
    [/konsultasi/, 'obrolan'], [/muslimah/, 'muslimah'], [/talkshow|kajian/, 'mic'],
  ];
  const TAG_ICON = { lomba: 'piala', kajian: 'mic', talkshow: 'mic' };
  const iconKey = (r) => {
    const t = r.title.toLowerCase();
    const hit = ICON_RULES.find(([re]) => re.test(t));
    return (r.icon && JICONS[r.icon] && r.icon) || (hit && hit[1]) || TAG_ICON[r.tag] || 'titik';
  };
  const iconOf = (r) => `<svg class="jico" viewBox="0 0 24 24" aria-hidden="true"><path d="${JICONS[iconKey(r)]}"/></svg>`;
  const pinkCls = (r) => (r.ladies ? ' is-pink' : '');
  // Keterangan acara: nama pengisi diambil dari D.asatidz lewat r.ustadz (id atau
  // daftar id), lalu disambung note bila ada. Id tak dikenal diabaikan.
  const ustadzById = Object.fromEntries((D.asatidz || []).filter((u) => u.id).map((u) => [u.id, u.name]));
  // id pengisi di elemen jadwal → badge asatidz bisa menemukan acaranya
  const ustAttr = (r) => (r.ustadz ? ` data-ustadz="${esc([].concat(r.ustadz).join(' '))}"` : '');
  const noteOf = (r) => [[].concat(r.ustadz || []).map((id) => ustadzById[id]).filter(Boolean).join(' & '), r.note]
    .filter(Boolean).join(' · ');
  // Tampilan Tabel dinonaktifkan sementara → selalu Durasi & tombol Tabel/Durasi
  // disembunyikan. Ubah ke true untuk mengaktifkan lagi (kode Tabel tetap utuh).
  const TABEL_ON = false;
  let jView = TABEL_ON ? 'tabel' : 'durasi';
  // pilihan Kartu/Daftar per blok di tampilan Durasi (kunci: 'panggung', 'pagi', …)
  let secModes = {};
  try { secModes = JSON.parse(localStorage.getItem('mb9-jsec') || '{}') || {}; } catch (e) { /* storage diblokir */ }
  // bawaan Daftar; Kartu hanya bila pengunjung memilihnya
  const secMode = (key) => (secModes[key] === 'card' ? 'card' : 'list');
  try { if (TABEL_ON && localStorage.getItem('mb9-jview') === 'durasi') jView = 'durasi'; } catch (e) { /* storage diblokir */ }
  let currentKey = null;
  const fmtMin = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`;
  // "Sedang berlangsung": hanya untuk acara di rangkaian bertitik (Tabel,
  // tanpa group) pada hari acara menurut WIB; diperiksa ulang tiap menit.
  const wibNow = () => {
    const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const o = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { iso: `${o.year}-${o.month}-${o.day}`, min: Number(o.hour) * 60 + Number(o.minute) };
  };
  // Status otomatis dari jam (hanya di hari acara menurut WIB, cek tiap menit):
  // • acara panggung (rangkaian, tanpa group / data-seq): "Live" saat berjalan,
  //   "Selanjutnya" di acara panggung terdekat yang belum mulai
  // • layanan di stan (punya group): "Buka 10.00" → "Buka" → "Segera tutup"
  //   (≤30 menit sebelum tutup) → "Tutup"
  const SOON = 30;
  const markLive = () => {
    const day = D.days.find((d) => d.key === currentKey);
    const now = wibNow();
    const on = !!day && day.iso === now.iso;
    const span = (el) => (el.dataset.t || '').split(' - ').map(toMin);
    const isSeq = (el) => el.hasAttribute('data-seq');
    // label-label status dibuat ulang tiap pemeriksaan
    $$('.jlive, .jnext, .jopen', panel).forEach((x) => x.remove());
    $$('.is-live', panel).forEach((x) => x.classList.remove('is-live'));
    const units = [...$$('.jrow', panel), ...$$('.jcard__item', panel)];
    units.forEach((el) => el.classList.toggle('is-done', on && now.min >= span(el)[1]));
    $$('.jdur .jcard', panel).forEach((card) => card.classList.toggle('is-done', $$('.jcard__item', card).every((it) => it.classList.contains('is-done'))));
    if (!on) return;
    // tempat label: baris → di sel jam; item kartu Durasi → pojok kanan atas kartu
    const put = (el, html) => {
      const card = el.classList.contains('jcard__item') ? el.closest('.jcard') : null;
      if (card) { if (!card.querySelector('.jlive, .jnext, .jopen')) card.insertAdjacentHTML('beforeend', html); }
      else el.querySelector(':scope > time').insertAdjacentHTML('beforeend', html);
    };
    // panggung
    const seq = units.filter(isSeq);
    seq.forEach((el) => {
      const [a, b] = span(el);
      if (now.min >= a && now.min < b) {
        el.classList.add('is-live');
        el.closest('.jcard')?.classList.add('is-live');
        put(el, '<span class="jlive mono">Berlangsung</span>');
      } else if (now.min >= b) {
        put(el, '<span class="jopen mono is-closed">Selesai</span>'); // gaya sama dengan "Tutup"
      }
    });
    const upcoming = seq.filter((el) => span(el)[0] > now.min).sort((x, y) => span(x)[0] - span(y)[0]);
    // ≤30 menit lagi → "Segera dimulai" (semua yang masuk rentang itu);
    // selain itu acara terdekat → "Selanjutnya"
    const starting = upcoming.filter((el) => span(el)[0] - now.min <= SOON);
    if (starting.length) starting.forEach((el) => put(el, '<span class="jnext mono is-starting">Segera dimulai</span>'));
    else if (upcoming.length) {
      const first = span(upcoming[0])[0];
      upcoming.filter((el) => span(el)[0] === first).forEach((el) => put(el, '<span class="jnext mono">Selanjutnya</span>'));
    }
    // layanan di stan
    // kartu jeda (Durasi): selama jedanya berjalan → label "Istirahat"
    units.filter((el) => el.hasAttribute('data-gap')).forEach((el) => {
      const [a, b] = span(el);
      if (now.min >= a && now.min < b) put(el, '<span class="jopen mono is-break">Istirahat</span>');
    });
    units.filter((el) => !isSeq(el) && !el.hasAttribute('data-gap')).forEach((el) => {
      const [a, b] = span(el);
      const st = now.min < a ? (a - now.min <= SOON ? ['is-starting', 'Segera buka'] : ['is-wait', `Buka ${fmtMin(a)}`])
        : now.min >= b ? ['is-closed', 'Tutup']
          : b - now.min <= SOON ? ['is-soon', 'Segera tutup'] : ['is-open', 'Buka'];
      put(el, `<span class="jopen mono ${st[0]}">${st[1]}</span>`);
    });
  };
  let panelH = 0;
  // quiet: render ulang tanpa animasi masuk (mis. ganti Kartu/Daftar satu blok)
  const renderDay = (key, quiet) => {
    currentKey = key;
    const day = D.days.find((d) => d.key === key);
    const rows = (D.jadwal && D.jadwal[key]) || [];
    const past = isPast(day);
    panel.setAttribute('aria-labelledby', `tab-${key}`);
    panel.classList.toggle('is-past', past);
    const banner = past ? `<div class="jadwal__past mono"><span>Selesai</span> Rangkaian acara ${esc(day.full)} telah berakhir.</div>` : '';
    const rowHtml = (r) => `
        <div class="jrow${pinkCls(r)}${jView === 'tabel' && r.group ? ' is-grp' : ''}" data-t="${esc(r.time)}"${r.group ? '' : ' data-seq'}${ustAttr(r)}>
          <time>${esc(r.time)}</time>
          <div><h3>${iconOf(r)}<span>${esc(r.title)}</span></h3>${noteOf(r) ? `<p>${esc(noteOf(r))}</p>` : ''}</div>
          ${r.tag ? `<span class="tag">${esc(TAGS[r.tag] || r.tag)}</span>` : '<span></span>'}
        </div>`;
    // kolom diurut kiri→kanan menurut jam selesai (lalu jam mulai) — yang
    // paling cepat kelar di kiri, yang paling lama di kanan.
    const byEnd = (a, b) => {
      const [as, ae] = a.time.split(' - ').map(toMin);
      const [bs, be] = b.time.split(' - ').map(toMin);
      return ae - be || as - bs;
    };
    // Tampilan "Durasi": jam mulai bersama ditulis sekali di kepala grup, tiap
    // kartu cukup jam selesainya + bar sepanjang durasinya relatif ke rentang grup.
    // Jeda di rangkaian panggung: keterangan dari waktu sholat (D.sholat) yang jatuh
    // di dalam rentang jeda — Dzuhur & jeda ≥1 jam → "Ishoma".
    const SHOLAT = Object.entries(D.sholat || {});
    const gapInfo = (a, b) => {
      const hit = SHOLAT.filter(([, t]) => { const m = toMin(t); return m >= a && m < b; });
      const cap = (k) => k[0].toUpperCase() + k.slice(1);
      const ishoma = b - a >= 60 && hit.some(([k]) => k === 'dzuhur');
      return {
        title: ishoma ? 'Ishoma' : hit.length ? 'Istirahat Sholat' : 'Jeda',
        note: [ishoma ? 'Istirahat, sholat & makan' : '', ...hit.map(([k, t]) => `${cap(k)} ± ${t}`)].filter(Boolean).join(' · '),
        icon: hit.length ? 'masjid' : 'jam',
      };
    };
    const durHtml = (g, gaps) => {
      const rs = [...g.rows].sort(byEnd);
      const rg = rs.map((r) => r.time.split(' - ').map(toMin));
      const gs = Math.min(...rg.map((x) => x[0])), ge = Math.max(...rg.map((x) => x[1]));
      const same = rg.every((x) => x[0] === gs);
      const head = same ? `Mulai <b>${fmtMin(gs)}</b>` : `<b>${fmtMin(gs)}</b> – <b>${fmtMin(ge)}</b>`;
      // acara dengan jam (selesai) yang sama → satu kartu, isinya berderet
      let cards = [];
      rs.forEach((r, i) => {
        const label = same ? `s/d ${fmtMin(rg[i][1])}` : esc(r.time);
        const last = cards[cards.length - 1];
        if (last && last.label === label) last.items.push(r); else cards.push({ label, items: [r] });
      });
      // rangkaian panggung: sela kosong antar-kartu → kartu jeda (garis putus-putus)
      if (gaps) {
        const sp = (c) => c.items.map((r) => r.time.split(' - ').map(toMin));
        cards = cards.flatMap((c, i) => {
          if (!i) return [c];
          const pe = Math.max(...sp(cards[i - 1]).map((x) => x[1])), ns = Math.min(...sp(c).map((x) => x[0]));
          return ns > pe ? [{ gap: [pe, ns], label: `${fmtMin(pe)} - ${fmtMin(ns)}` }, c] : [c];
        });
      }
      const gapCard = (c) => {
        const info = gapInfo(...c.gap);
        return `
        <div class="jcard jcard--gap">
          <span class="jcard__edge" aria-hidden="true" data-t="${c.label}"></span>
          <div class="jstop"><i aria-hidden="true"></i><time>${c.label}</time></div>
          <div class="jcard__item" data-t="${c.label}" data-gap>
            <h3><svg class="jico" viewBox="0 0 24 24" aria-hidden="true"><path d="${JICONS[info.icon]}"/></svg><span>${info.title}</span></h3>
            ${info.note ? `<p>${esc(info.note)}</p>` : ''}
          </div>
        </div>`;
      };
      // Kartu berjajar 1 baris (geser horizontal, urut jam selesai). Di atas
      // tiap kartu ada garis waktu bersambung dengan titik di jam selesainya.
      return `<div class="jdur"><div class="jdur__head"><span>${head}</span><span class="jdur__nav" hidden><button type="button" data-dir="-1" aria-label="Geser ke kiri"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button><button type="button" data-dir="1" aria-label="Geser ke kanan"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></span></div><div class="jrail${cards.length > 2 ? ' jrail--many' : ''}${same ? '' : ' jrail--range'}"><div class="jrail__track">${cards.map((c) => (c.gap ? gapCard(c) : `
        <div class="jcard${c.items.every((r) => r.ladies) ? ' is-pink' : ''}">
          <span class="jcard__edge" aria-hidden="true" data-t="${c.label}"></span>
          <div class="jstop"><i aria-hidden="true"></i><time>${c.label}</time></div>${c.items.map((r) => `
          <div class="jcard__item${pinkCls(r)}" data-t="${esc(r.time)}"${r.group ? '' : ' data-seq'}${ustAttr(r)}>
            <h3>${iconOf(r)}<span>${esc(r.title)}</span></h3>
            ${noteOf(r) ? `<p>${esc(noteOf(r))}</p>` : ''}
            ${r.tag ? `<span class="tag">${esc(TAGS[r.tag] || r.tag)}</span>` : ''}
          </div>`).join('')}
        </div>`)).join('')}</div></div></div>`;
    };
    // Durasi: acara panggung berurutan (tanpa group) dikumpulkan jadi satu baris
    // kartu horizontal di atas (judul dari tag-nya, mis. "Kajian & Talkshow") — lepas dari Pagi/Siang/Sore/
    // Malam agar tetap terasa bersambung; layanan/stan (punya group) tetap per
    // periode di bawahnya.
    const chainRows = jView === 'durasi' ? rows.filter((r) => !r.group) : [];
    // judul dari tag yang ada di rangkaian (urutan TAGS): mis. "Kajian & Talkshow"
    const chainTags = Object.keys(TAGS).filter((k) => chainRows.some((r) => r.tag === k)).map((k) => TAGS[k]);
    const chainTitle = chainTags.length ? chainTags.join(', ').replace(/, ([^,]*)$/, ' & $1') : 'Acara Panggung';
    // Durasi: tiap bar hitam punya pilihan tampilan Kartu / Daftar (per blok,
    // disimpan di localStorage). Daftar = baris biasa seperti Tabel, urut jam mulai.
    const secHead = (key, label) => {
      const mode = secMode(key);
      const btn = (m, title, d) => `<button type="button" data-sec="${key}" data-mode="${m}" aria-pressed="${mode === m}" aria-label="Tampilkan sebagai ${title}" title="${title}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg></button>`;
      return `<div class="jperiode" data-sec-head="${key}"><span>${label}</span><span class="jperiode__view" role="group" aria-label="Tampilan ${esc(label.replace(/<[^>]+>/g, ''))}">${btn('list', 'Daftar', 'M4 6h16M4 12h16M4 18h16')}${btn('card', 'Kartu', 'M3 5h8v14H3zM13 5h8v14h-8z')}</span></div>`;
    };
    // gaps: rangkaian panggung → sela kosong jadi baris jeda/istirahat (seperti kartu jeda)
    const asList = (list, gaps) => {
      const sp = (r) => r.time.split(' - ').map(toMin);
      const rs = [...list].sort((a, b) => sp(a)[0] - sp(b)[0] || sp(a)[1] - sp(b)[1]);
      let end = -1;
      return rs.map((r) => {
        const [a, b] = sp(r);
        let gap = '';
        if (gaps && end >= 0 && a > end) {
          const info = gapInfo(end, a);
          const t = `${fmtMin(end)} - ${fmtMin(a)}`;
          gap = `
        <div class="jrow jrow--gap" data-t="${t}" data-gap>
          <time>${t}</time>
          <div><h3><svg class="jico" viewBox="0 0 24 24" aria-hidden="true"><path d="${JICONS[info.icon]}"/></svg><span>${info.title}</span></h3>${info.note ? `<p>${esc(info.note)}</p>` : ''}</div>
          <span></span>
        </div>`;
        }
        end = Math.max(end, b);
        return gap + rowHtml(r);
      }).join('');
    };
    const chain = chainRows.length
      ? `${secHead('panggung', esc(chainTitle))}${secMode('panggung') === 'list' || chainRows.length < 2 ? `<div class="jchain">${asList(chainRows, true)}</div>` : durHtml({ rows: chainRows }, true)}`
      : '';
    let lastP = null;
    const sections = [];
    (jView === 'durasi' ? rows.filter((r) => r.group) : rows).forEach((r) => {
      const p = periodeOf(r.time);
      if (p !== lastP) sections.push({ p, rows: [] });
      sections[sections.length - 1].rows.push(r);
      lastP = p;
    });
    const byStart = (a, b) => {
      const [as, ae] = a.time.split(' - ').map(toMin);
      const [bs, be] = b.time.split(' - ').map(toMin);
      return as - bs || ae - be;
    };
    // Judul periode menjangkau acara terlama di dalamnya: mulai Pagi tapi ada yang
    // sampai 21.00 → "Pagi s/d Malam". Jam selesai tepat di batas (mis. 12.00)
    // masih dihitung periode sebelumnya.
    const perLabel = (sec) => {
      const end = Math.max(...sec.rows.map((r) => toMin(r.time.split(' - ')[1]))) - 1;
      const to = PERIODE.find((p) => end < p.to) || PERIODE[PERIODE.length - 1];
      return to === sec.p ? sec.p.label : `${sec.p.label} <small>s/d</small> ${to.label}`;
    };
    // Tabel (& Daftar di Durasi): urut sesuai susunan di data-prod.js (atau `order`
    // bila diisi: kecil duluan, default 0); sort() stabil → yang setara tetap urutan data
    const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
    const body = sections.map((sec) => {
      if (jView === 'durasi') {
        const starts = new Map();
        sec.rows.forEach((r) => {
          const s = toMin(r.time.split(' - ')[0]);
          if (!starts.has(s)) starts.set(s, []);
          starts.get(s).push(r);
        });
        // Daftar: urutan sama dengan Tabel (susunan data / field order)
        const html = secMode(sec.p.key) === 'list' ? [...sec.rows].sort(byOrder).map(rowHtml).join('') : [...starts.entries()].sort((a, b) => a[0] - b[0])
          .map(([, list]) => (list.length > 1 ? durHtml({ rows: list }) : rowHtml(list[0]))).join('');
        return `${secHead(sec.p.key, perLabel(sec))}${html}`;
      }
      return `<div class="jperiode"><span>${perLabel(sec)}</span></div>${[...sec.rows].sort(byOrder).map(rowHtml).join('')}`;
    }).join('');
    // Durasi: dua blok berbingkai sendiri (tanpa jarak) — Kajian & Talkshow di atas,
    // layanan/stan per periode di bawah dengan judul blok "Layanan Gratis & Kegiatan". Blok baru (mis. tenant) tinggal ditambah sebagai .jblock.
    const grpTitle = 'Layanan Gratis & Kegiatan';
    const content = jView === 'durasi'
      ? [chain && `<div class="jblock">${chain}</div>`, body && `<div class="jblock"><div class="jblock__title">${esc(grpTitle)}</div>${body}</div>`].filter(Boolean).join('')
      : chain + body;
    panel.classList.toggle('has-blocks', rows.length > 0 && content.includes('class="jblock"'));
    panel.innerHTML = banner + (rows.length
      ? content
      : past
        ? `<div class="soon">
          <div class="soon__icon" aria-hidden="true"><svg viewBox="0 0 56 56"><path d="M16 29l8 8 16-18"/></svg></div>
          <div>
            <h3>Acara Telah Selesai</h3>
            <p>Jazakumullahu khairan kepada seluruh pengunjung ${esc(day.full)}.</p>
          </div>
        </div>`
        : `<div class="soon">
          <div class="soon__icon" aria-hidden="true"><svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="22"/><path class="hand" d="M28 28V13"/><path d="M28 28l9 6"/></svg></div>
          <div>
            <h3>InsyaAllah Menyusul</h3>
            <p>Rincian jadwal ${esc(day.full)} sedang disusun oleh panitia. Pantau terus halaman ini.</p>
            <div class="soon__fixed"><b>${D.hours.open.replace(':', '.')} – ${D.hours.close.replace(':', '.')}</b> Open Gate Bazar &amp; Foodcourt</div>
          </div>
        </div>`);
    // Durasi, mode Daftar Kajian & Talkshow: garis waktu bertitik seperti Tabel;
    // baris istirahat → garis putus-putus dengan titik kosong
    const chainEls = $$('.jchain > .jrow', panel);
    chainEls.forEach((el, i) => {
      el.classList.add('is-seq');
      el.classList.toggle('is-seq-first', i === 0);
      el.classList.toggle('is-seq-last', i === chainEls.length - 1);
    });
    // Tabel: acara tanpa group = rangkaian berurutan (satu selesai, lanjut
    // berikutnya) → disambung garis waktu bertitik di depan jamnya
    if (jView === 'tabel') {
      const all = $$('.jrow', panel);
      const seq = all.filter((el) => !el.classList.contains('is-grp'));
      seq.forEach((el, i) => {
        el.classList.add('is-seq');
        el.classList.toggle('is-seq-first', i === 0);
        el.classList.toggle('is-seq-last', i === seq.length - 1);
      });
      // baris paralel yang terselip di tengah rangkaian: garis lewat, tanpa titik
      if (seq.length > 1) {
        const a = all.indexOf(seq[0]), z = all.indexOf(seq[seq.length - 1]);
        all.forEach((el, i) => el.classList.toggle('is-thru', i > a && i < z && !el.classList.contains('is-seq')));
      }
    }
    markLive();
    // Durasi dibuka langsung di kartu yang masih aktif (yang sudah tutup ada di strip kiri).
    $$('.jrail', panel).forEach((rail) => { rail._active = rail.dataset.start = firstActive(rail); });
    syncRails();
    // tinggi jadwal berubah (ganti hari/tampilan) → posisi pin section di
    // bawahnya (Layanan dll.) harus diukur ulang, kalau tidak jadi tumpang tindih
    if (hasGsap && panel.offsetHeight !== panelH) {
      panelH = panel.offsetHeight;
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
    if (hasGsap && !reduced && !quiet) {
      gsap.fromTo(panel.children, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .04, ease: 'power3.out', clearProps: 'transform,opacity' });
    }
  };
  // Grup Durasi ala tab hari: kartu yang muat tampil normal, sisanya diciutkan
  // jadi strip tegak berisi jam selesainya (bukan scroll). Panah/klik strip
  // menggeser "jendela" kartu yang terbuka.
  const syncRail = (rail) => {
    const nav = rail.parentElement.querySelector('.jdur__nav');
    const cards = $$('.jcard', rail);
    const n = cards.length;
    const cs = getComputedStyle(rail);
    const cardMin = parseFloat(cs.getPropertyValue('--card-min')) || 260;
    const sliver = parseFloat(cs.getPropertyValue('--sliver')) || 38;
    const w = rail.clientWidth;
    let m = n;
    // kartu tersembunyi tiap sisi dirangkum jadi SATU strip (maks. 2 strip)
    while (m > 1 && m * cardMin + Math.min(n - m, 2) * sliver > w) m--;
    const start = Math.min(Math.max(Number(rail.dataset.start) || 0, 0), n - m);
    rail.dataset.start = start;
    const end = start + m;
    // Tinggi baris dikunci setinggi kartu TERTINGGI di grup (diukur dalam
    // keadaan terbuka selebar kartu normal) — kalau tidak, tinggi melompat
    // tiap kali jendela bergeser ke kartu yang isinya lebih banyak.
    const track = rail.firstElementChild;
    const hadNoAnim = rail.classList.contains('no-flex-anim');
    rail.classList.add('no-flex-anim');
    const ow = (w - Math.min(n - m, 2) * sliver) / m;
    track.style.minHeight = '';
    // border-box: lebar ukur = lebar tampil sebenarnya (termasuk padding)
    cards.forEach((c) => { c.classList.remove('is-piled', 'is-gone'); c.style.flex = `0 0 ${ow}px`; c.style.boxSizing = 'border-box'; });
    track.style.flexWrap = 'wrap'; track.style.alignItems = 'flex-start';
    const tallest = Math.max(...cards.map((c) => c.getBoundingClientRect().height));
    track.style.flexWrap = ''; track.style.alignItems = '';
    cards.forEach((c) => { c.style.flex = ''; c.style.boxSizing = ''; });
    track.style.minHeight = `${tallest}px`;
    cards.forEach((c, i) => {
      const piled = i < start || i >= end;
      // yang jadi strip hanya tetangga terdekat jendela; sisanya disembunyikan
      const edge = i === start - 1 || i === end;
      c.classList.toggle('is-piled', piled && edge);
      c.classList.toggle('is-gone', piled && !edge);
      c.tabIndex = piled && edge ? 0 : -1;
      c.setAttribute('aria-expanded', String(!piled));
      const lbl = c.querySelector('.jcard__edge');
      const more = i === end ? n - end - 1 : i === start - 1 ? start - 1 : 0;
      lbl.innerHTML = `<i></i><b>${lbl.dataset.t}</b>${more > 0 ? `<em>+${more}</em>` : ''}`;
      c.classList.toggle('has-more', more > 0);
      c.classList.toggle('has-more2', more > 1);
      c.classList.toggle('is-left', i === start - 1);
      // lapis garis tumpukan ikut status kartunya, diurut dari strip ke arah luar:
      // [0] = strip itu sendiri, [1] = lapis dalam, [2..] = lapis luar
      const pile = i === end ? cards.slice(end) : i === start - 1 ? cards.slice(0, start).reverse() : [];
      const done = (list) => list.length > 0 && list.every((x) => x.classList.contains('is-done'));
      c.classList.toggle('near-done', done(pile.slice(1, 2)));
      c.classList.toggle('far-done', done(pile.slice(2)));
    });
    void rail.offsetWidth;
    if (!hadNoAnim) rail.classList.remove('no-flex-anim');
    if (!nav) return;
    nav.hidden = m >= n;
    const [prev, next] = nav.querySelectorAll('button');
    prev.disabled = start <= 0;
    next.disabled = start + m >= n;
    rail._m = m;
  };
  // geser jendela + animasi arah: ke kanan → isi kartu yang baru terbuka
  // masuk dari kanan ke kiri (dan sebaliknya), supaya terasa seperti digeser
  const moveRail = (rail, start) => {
    const dir = Math.sign(start - (Number(rail.dataset.start) || 0));
    const cards = $$('.jcard', rail);
    const isOpen = (c) => !c.classList.contains('is-piled') && !c.classList.contains('is-gone');
    const wasOpen = cards.map(isOpen);
    const before = cards.map((c) => c.getBoundingClientRect().left);
    rail.dataset.start = start;
    // lebar dipasang instan (tanpa transisi flex) lalu digeser lewat transform
    // (FLIP) — kartu yang tetap terbuka meluncur dari posisi lamanya
    if (!dir || reduced) { syncRail(rail); return; }
    rail.classList.add('no-flex-anim');
    syncRail(rail);
    void rail.offsetWidth;
    rail.classList.remove('no-flex-anim');
    const ease = 'cubic-bezier(.22, .9, .24, 1)';
    cards.forEach((c, i) => {
      if (!isOpen(c)) return;
      if (wasOpen[i]) {
        const dx = before[i] - c.getBoundingClientRect().left;
        if (dx) c.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], { duration: 420, easing: ease });
        return;
      }
      [...c.children].filter((el) => !el.classList.contains('jcard__edge')).forEach((el) => el.animate(
        [{ transform: `translateX(${dir * 48}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 420, delay: 60, easing: ease, fill: 'backwards' },
      ));
    });
  };
  const syncRails = () => $$('.jrail', panel).forEach(syncRail);
  // indeks kartu pertama yang belum selesai (semua selesai → kartu terakhir/paling kanan)
  const firstActive = (rail) => {
    const cards = $$('.jcard', rail);
    const i = cards.findIndex((c) => !c.classList.contains('is-done'));
    return i < 0 ? cards.length - 1 : i;
  };
  // Perbarui status; baris Durasi digeser ke kartu aktif HANYA bila ada kartu
  // yang baru tutup — geseran manual pengunjung tidak diganggu tiap menit.
  const refreshLive = () => {
    markLive();
    $$('.jrail', panel).forEach((rail) => {
      const to = firstActive(rail);
      if (to !== rail._active) { rail._active = to; moveRail(rail, to); } else syncRail(rail);
    });
  };
  // Timer per menit (pas di pergantian menit) untuk Tabel & Durasi, hanya selama
  // halaman dilihat: tab ditinggal → berhenti; kembali, sinyal tersambung lagi,
  // atau halaman dipulihkan dari cache (Back / buka ulang app) → langsung
  // diperbarui & jalan lagi.
  let liveTimer = 0;
  const stopLive = () => { clearTimeout(liveTimer); clearInterval(liveTimer); };
  const startLive = () => {
    stopLive();
    liveTimer = setTimeout(() => { refreshLive(); liveTimer = setInterval(refreshLive, 60000); }, 60000 - (Date.now() % 60000));
  };
  const resumeLive = () => { if (document.hidden) return; refreshLive(); startLive(); };
  document.addEventListener('visibilitychange', () => (document.hidden ? stopLive() : resumeLive()));
  window.addEventListener('online', resumeLive);
  window.addEventListener('pageshow', (e) => { if (e.persisted) resumeLive(); });
  if (!document.hidden) startLive();
  // Swipe kartu Durasi di layar sentuh: geser horizontal ≥40px (dan jelas lebih
  // horizontal daripada vertikal) → satu kartu ke kiri/kanan. Selama jari menggeser,
  // kartu terbuka di sisi itu MELEBAR mengikuti jari (margin negatif; kartu flex
  // mengisi ruangnya) — strip tertutup diam, garis waktu di kartu ikut memanjang
  // sehingga tidak putus. Di ujung terasa berat (karet). Saat dilepas: pindah kartu
  // atau memantul kembali. Gulir vertikal tetap normal (.jrail touch-action: pan-y).
  // Klik sesudah swipe diabaikan agar strip yang tersentuh tidak ikut terbuka.
  let swipe = null, swipedAt = 0;
  const railMax = (rail) => $$('.jcard', rail).length - (rail._m || 1);
  const EASE_BACK = 'margin .3s cubic-bezier(.22, .9, .24, 1)';
  const setStretch = (sw, off, anim) => {
    const first = sw.cards[0], last = sw.cards[sw.cards.length - 1];
    [first, last].forEach((c) => { c.style.transition = anim ? EASE_BACK : 'none'; });
    // geser ke kiri → tepi kiri kartu pertama melebar ke kiri; ke kanan → tepi kanan kartu terakhir
    first.style.marginLeft = off < 0 ? `${off}px` : '';
    last.style.marginRight = off > 0 ? `${-off}px` : '';
    if (anim) [first, last].forEach((c) => c.addEventListener('transitionend', () => { c.style.transition = ''; }, { once: true }));
  };
  panel.addEventListener('pointerdown', (e) => {
    const rail = e.pointerType !== 'mouse' && e.target.closest('.jrail');
    const cards = rail ? $$('.jcard', rail).filter((c) => !c.classList.contains('is-piled') && !c.classList.contains('is-gone')) : [];
    swipe = cards.length ? { rail, cards, x: e.clientX, y: e.clientY, lock: null, off: 0 } : null;
  });
  panel.addEventListener('pointermove', (e) => {
    if (!swipe || reduced) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    // arah dikunci setelah gerakan pertama yang jelas
    if (!swipe.lock && Math.max(Math.abs(dx), Math.abs(dy)) > 8) swipe.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (swipe.lock !== 'x') return;
    const cur = Number(swipe.rail.dataset.start) || 0;
    const edge = (dx > 0 && cur <= 0) || (dx < 0 && cur >= railMax(swipe.rail));
    const lim = swipe.rail.clientWidth * 0.4;
    swipe.off = Math.max(-lim, Math.min(lim, edge ? dx * 0.25 : dx * 0.6));
    setStretch(swipe, swipe.off, false);
  });
  panel.addEventListener('pointercancel', () => { if (swipe && swipe.off) setStretch(swipe, 0, true); swipe = null; });
  panel.addEventListener('pointerup', (e) => {
    if (!swipe) return;
    const sw = swipe;
    swipe = null;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    const cur = Number(sw.rail.dataset.start) || 0;
    const to = Math.abs(dx) >= 40 && Math.abs(dx) >= Math.abs(dy) * 1.5
      ? Math.min(Math.max(cur + (dx < 0 ? 1 : -1), 0), railMax(sw.rail)) : cur;
    if (Math.abs(dx) >= 40) swipedAt = Date.now();
    // pindah dulu (FLIP mengukur dari bentuk melebar saat ini), lalu lebar kembali
    // normal bersamaan; kartu yang kini jadi strip langsung dirapikan tanpa transisi
    if (to !== cur) moveRail(sw.rail, to);
    if (!sw.off) return;
    setStretch(sw, 0, true);
    sw.cards.forEach((c) => { if (c.classList.contains('is-piled') || c.classList.contains('is-gone')) c.style.transition = 'none'; });
  });
  // tombol Kartu/Daftar di bar hitam: render ulang, bar yang diklik tetap di posisi layarnya
  panel.addEventListener('click', (e) => {
    const t = e.target.closest('.jperiode__view button');
    if (!t || t.getAttribute('aria-pressed') === 'true') return;
    const key = t.dataset.sec;
    const y0 = t.closest('.jperiode').getBoundingClientRect().top;
    secModes[key] = t.dataset.mode;
    try { localStorage.setItem('mb9-jsec', JSON.stringify(secModes)); } catch (err) { /* abaikan */ }
    renderDay(currentKey, true);
    const head = $(`[data-sec-head="${key}"]`, panel);
    if (head) {
      // hanya isi bagian ini yang muncul halus (sampai bar berikutnya)
      const part = [];
      for (let n = head.nextElementSibling; n && !n.matches('.jperiode, .jblock__title'); n = n.nextElementSibling) part.push(n);
      if (hasGsap && !reduced && part.length) gsap.fromTo(part, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .4, stagger: .03, ease: 'power3.out', clearProps: 'transform,opacity' });
      const dy = head.getBoundingClientRect().top - y0;
      if (Math.abs(dy) >= 1) { if (lenis) lenis.scrollTo(scrollY + dy, { immediate: true, force: true }); else scrollTo({ top: scrollY + dy, behavior: 'instant' }); }
      $(`.jperiode__view button[data-mode="${secModes[key]}"]`, head)?.focus({ preventScroll: true });
    }
  });
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('.jdur__nav button');
    if (b) {
      const rail = b.closest('.jdur').querySelector('.jrail');
      moveRail(rail, Number(rail.dataset.start) + Number(b.dataset.dir));
      return;
    }
    if (Date.now() - swipedAt < 400) return; // klik bawaan dari akhir swipe
    // klik strip → buka kartu itu (jendela bergeser seperlunya)
    const c = e.target.closest('.jcard.is-piled');
    if (!c) return;
    const rail = c.closest('.jrail');
    const i = $$('.jcard', rail).indexOf(c);
    const start = Number(rail.dataset.start);
    moveRail(rail, i < start ? i : i - rail._m + 1);
  });
  panel.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.jcard.is-piled')) { e.preventDefault(); e.target.click(); }
  });
  window.addEventListener('resize', syncRails);
  // Glitch foto Tema: lapisan memakai sumber yang benar-benar dimuat (avif/webp)
  const temaImg = $('.tema__media img');
  if (temaImg) {
    const box = temaImg.closest('.img-reveal');
    const g = document.createElement('div');
    g.className = 'glitch'; g.setAttribute('aria-hidden', 'true'); g.innerHTML = '<i></i><i></i>';
    const setSrc = () => g.style.setProperty('--src', `url("${temaImg.currentSrc || temaImg.src}")`);
    if (temaImg.complete) setSrc(); else temaImg.addEventListener('load', setSrc, { once: true });
    box.appendChild(g);
    // jeda acak antar semburan: 3,8–5 dtk (disorot kursor: 1,6–2,4 dtk)
    if (!reduced) {
      const media = temaImg.closest('.tema__media');
      const burst = () => {
        g.classList.remove('is-on'); void g.offsetWidth; g.classList.add('is-on');
        const hover = media.matches(':hover');
        setTimeout(burst, hover ? 1600 + Math.random() * 800 : 3800 + Math.random() * 1200);
      };
      setTimeout(burst, 3800 + Math.random() * 1200);
    }
  }
  const viewBox = $('#jadwalView');
  if (viewBox && !TABEL_ON) viewBox.hidden = true;
  if (viewBox && TABEL_ON) {
    const syncView = () => $$('button', viewBox).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === jView)));
    syncView();
    viewBox.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-view]');
      if (!b || b.dataset.view === jView) return;
      jView = b.dataset.view;
      try { localStorage.setItem('mb9-jview', jView); } catch (err) { /* abaikan */ }
      syncView();
      if (currentKey) renderDay(currentKey);
    });
  }

  // Tumpuk dua sisi: kartu yang muat tampil normal dalam satu jendela yang selalu
  // memuat hari aktif; sisanya jadi strip tipis bertumpuk di kiri dan/atau kanan.
  // Ukurannya diambil dari CSS var, jadi tiap breakpoint punya kepadatan sendiri.
  const daysNav = $('#daysNav');
  const activeIdx = (list) => list.findIndex((b) => b.getAttribute('aria-selected') === 'true');
  let winStart = 0; // indeks kartu normal pertama — digeser seperlunya saja
  const layoutDays = () => {
    const list = $$('.day', tabs);
    const n = list.length;
    const a = activeIdx(list);
    $$('button', daysNav).forEach((b) => { const j = a + Number(b.dataset.dir); b.disabled = j < 0 || j >= n; });

    const cs = getComputedStyle(tabs);
    const px = (prop, fallback) => parseFloat(cs.getPropertyValue(prop)) || fallback;
    const dayMin = px('--day-min', 168);
    const sliver = px('--sliver', 38);
    const lap = px('--lap', 8);
    const tailW = (p) => (p > 0 ? sliver + (p - 1) * (sliver - lap) : 0);
    const w = tabs.clientWidth - px('padding-left', 0) - px('padding-right', 0);

    // + lap: cadangan bila tumpukan terbagi ke dua sisi
    const fits = (k) => k * dayMin - 2 * (k - 1) + (k < n ? tailW(n - k) + lap : 0) <= w;
    let m = n; // jumlah kartu yang tampil normal
    while (m > 1 && !fits(m)) m--;
    // geser jendela seperlunya saja agar kartu aktif tetap di dalamnya
    winStart = Math.min(Math.max(winStart, a - m + 1, 0), a, n - m);
    const start = winStart;
    const end = start + m; // eksklusif
    const stack = m < n;
    tabs.classList.toggle('is-stacked', stack);
    daysNav.classList.toggle('is-on', stack); // panah hanya saat ada kartu bertumpuk

    // lebar kartu normal dihitung eksplisit (bukan flex-grow) agar bisa dianimasikan:
    // sisa lebar setelah tumpukan, dikembalikan dulu tiap sambungan yang saling menimpa
    const pL = start, pR = n - end;
    const deepSeams = (pL > 1 ? pL - 1 : 0) + (pR > 1 ? pR - 1 : 0); // sambungan antar strip
    const thinSeams = n - 1 - deepSeams;                              // sambungan biasa (-2px)
    const normalW = (w + 2 * thinSeams + lap * deepSeams - (pL + pR) * sliver) / m;
    list.forEach((b, i) => {
      const piled = stack && (i < start || i >= end);
      b.classList.toggle('is-piled', piled);
      b.style.flexBasis = `${piled ? sliver : normalW}px`;
      b.style.zIndex = !stack ? '' : i < start ? i + 1 : i >= end ? n - i : n + 1;
    });
  };

  let chosenDay = null; // hari yang DIPILIH pengunjung (bukan bawaan saat load)
  const selectDay = (btn, focus) => {
    chosenDay = btn.dataset.day;
    $$('.day', tabs).forEach((b) => { b.setAttribute('aria-selected', b === btn); b.tabIndex = b === btn ? 0 : -1; });
    if (focus) btn.focus({ preventScroll: true });
    // replaceState, bukan pushState: ganti tab tidak perlu menumpuk riwayat back
    // URL = ?hari=…#jadwal saja (parameter lain tidak relevan untuk jadwal)
    const url = new URL(location);
    url.pathname = stripIndex(url.pathname);
    [...url.searchParams.keys()].forEach((k) => { if (k !== 'hari') url.searchParams.delete(k); });
    if (isPastDay(btn.dataset.day)) url.searchParams.delete('hari');
    else url.searchParams.set('hari', btn.dataset.day);
    url.hash = 'jadwal';
    history.replaceState(null, '', url);
    layoutDays();
    renderDay(btn.dataset.day);
  };
  daysNav.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    const list = $$('.day', tabs);
    selectDay(list[activeIdx(list) + Number(b.dataset.dir)]);
  });
  tabs.addEventListener('click', (e) => { const b = e.target.closest('.day'); if (b) selectDay(b); });
  tabs.addEventListener('keydown', (e) => {
    const list = $$('.day', tabs);
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); selectDay(list[(i + 1) % list.length], true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); selectDay(list[(i - 1 + list.length) % list.length], true); }
  });
  renderDay(D.days[defaultIdx].key);
  layoutDays();
  // transisi dinyalakan setelah frame pertama agar layout awal tidak ikut dianimasikan
  requestAnimationFrame(() => tabs.classList.add('is-ready'));
  addEventListener('load', layoutDays);

  // Halaman dibiarkan terbuka (mis. layar info di lokasi): saat pergantian tanggal
  // dan jam tutup (21:00) WIB terlewati, badge "Hari ini"/"Selesai" diperbarui
  // dan tab pindah ke hari ini / hari berikutnya. Pilihan pengunjung ke hari LAIN
  // yang belum lewat tidak diganggu. Dicek tiap menit + saat tab kembali aktif
  // (timer di latar bisa tertunda).
  const clockKey = () => `${todayWIB}|${todayIdx}|${dayClosed}`;
  const rollDay = () => {
    const before = clockKey();
    const prevAuto = D.days[autoIdx()].key;
    readClock();
    if (clockKey() === before) return;
    let sel = activeIdx($$('.day', tabs));
    const keep = chosenDay && chosenDay !== prevAuto && !isPastDay(chosenDay);
    if (!keep) { sel = autoIdx(); chosenDay = null; }
    // Pengunjung sedang melihat #jadwal → tetap di sana: tinggi panel bisa berubah
    // drastis (mis. 14 acara → "menyusul") dan ScrollTrigger.refresh ikut menggeser.
    const sec = $('#jadwal');
    const r0 = sec.getBoundingClientRect();
    const inView = r0.top < innerHeight && r0.bottom > 0;
    tabs.innerHTML = tabsHTML(sel);
    layoutDays();
    renderDay(D.days[sel].key);
    if (!inView) return;
    // dua frame: tunggu ScrollTrigger.refresh yang dijadwalkan renderDay
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const r1 = sec.getBoundingClientRect();
      // posisi section di layar dipertahankan; kalau section kini terlalu pendek
      // sehingga sudah lewat dari layar, kembali ke awal section
      const dy = r1.bottom - (r1.top - r0.top) < innerHeight * 0.3 ? r1.top : r1.top - r0.top;
      if (Math.abs(dy) < 1) return;
      if (lenis) lenis.scrollTo(scrollY + dy, { immediate: true, force: true });
      else scrollTo({ top: scrollY + dy, behavior: 'instant' });
    }));
  };
  // Selaras pergantian menit (detik :00) → "Selesai" muncul tepat 21:00:00
  const everyMinute = (fn) => setTimeout(() => { fn(); setInterval(fn, 60000); }, 60000 - (Date.now() % 60000));
  everyMinute(rollDay);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) rollDay(); });
  addEventListener('resize', layoutDays);

  // Asatidz
  const agrid = $('#asatidzGrid');
  const SIL = '<svg class="sil" viewBox="0 0 100 120" fill="currentColor" aria-hidden="true"><circle cx="50" cy="34" r="22"/><path d="M8 120c0-26 19-44 42-44s42 18 42 44Z"/></svg>';
  // Selalu minimal 6 kartu: asatidz yang sudah ada tampil duluan, sisanya
  // kartu "InsyaAllah menyusul" sampai daftarnya lengkap.
  const ASATIDZ_MIN = 6;
  const asatidz = D.asatidz || [];
  const soonN = Math.max(0, ASATIDZ_MIN - asatidz.length);
  agrid.innerHTML = asatidz.map((u) => `
      <article class="ustadz"${u.id ? ` data-id="${esc(u.id)}"` : ''}>
        ${u.photo ? `<img class="lazy-img" data-src="${esc(u.photo)}" alt="${esc(u.name)}" decoding="async">` : SIL}
        <div class="ustadz__body"><h3>${esc(u.name)}</h3>${u.role ? `<small>${esc(u.role)}</small>` : ''}</div>
      </article>`).join('') + Array.from({ length: soonN }, (_, k) => {
    const i = asatidz.length + k;
    return `
      <article class="ustadz ustadz--soon" aria-label="Pemateri ${i + 1}, InsyaAllah menyusul">
        ${SIL}<span class="q" aria-hidden="true">?</span>
        <div class="ustadz__body"><h3>Pemateri ${String(i + 1).padStart(2, '0')}</h3><small>InsyaAllah menyusul</small></div>
      </article>`;
  }).join('');
  if (asatidz.length) lazyWatch(agrid);
  if (soonN) agrid.insertAdjacentHTML('afterend', '<p class="asatidz__note">Daftar asatidz InsyaAllah segera diumumkan</p>');
  // Badge di foto kartu asatidz yang punya jadwal HARI INI (sejak 00:00 WIB s/d
  // jam tutup, lihat openDayAt): "Hari ini · 16.00" sebelum mulai → "Berlangsung"
  // (+ garis tepi) saat kajiannya jalan → "Selesai" setelahnya. Cek tiap menit.
  const markAsatidzLive = () => {
    const now = wibNow();
    const day = openDayAt(Date.now());
    const st = new Map(); // id → { live, next (menit mulai terdekat), ladies }
    ((day && D.jadwal && D.jadwal[day.key]) || []).forEach((r) => {
      const [a, b] = r.time.split(' - ').map(toMin);
      [].concat(r.ustadz || []).forEach((id) => {
        // t = jam sesi yang dituju badge: yang berjalan › terdekat › terakhir selesai
        const o = st.get(id) || { live: false, next: null, ladies: false, t: '', tNext: '', tDone: '' };
        if (now.min >= a && now.min < b) { o.live = true; o.ladies = !!r.ladies; o.t = r.time; }
        else if (now.min < a) { if (o.next === null || a < o.next) { o.next = a; o.tNext = r.time; } }
        else o.tDone = r.time;
        st.set(id, o);
      });
    });
    $$('.ustadz[data-id]', agrid).forEach((card) => {
      const o = st.get(card.dataset.id);
      const live = !!o && o.live;
      card.classList.toggle('is-live', live);
      card.classList.toggle('is-pink', live && o.ladies);
      // badge = tautan ke jadwal hari ini (tab dipilih di handler klik agrid)
      const t = !o ? '' : live ? o.t : o.next !== null ? o.tNext : o.tDone;
      const badge = (cls, text) => `<a href="#jadwal" class="ustadz__badge ${cls} mono" data-day="${day.key}" data-t="${esc(t)}" aria-label="${text} — buka jadwal hari ini">${text}<span class="ustadz__go" aria-hidden="true">→</span></a>`;
      const html = !o ? ''
        : live ? badge('jlive', 'Berlangsung')
          : o.next !== null ? badge('ustadz__badge--today', `Hari ini · ${fmtMin(o.next)}`)
            : badge('ustadz__badge--done', 'Selesai');
      const old = card.querySelector(':scope > .ustadz__badge');
      if (old && old.outerHTML === html) return;
      if (old) old.remove();
      if (html) card.insertAdjacentHTML('beforeend', html);
    });
  };
  // klik badge → pilih tab hari itu dulu (gulir ke #jadwal oleh handler anchor
  // umum), lalu acara ustadz itu berkedip di tampilan yang sedang terbuka:
  // Tabel → barisnya; Durasi → kartunya (baris kartu digeser ke sana dulu).
  let flashTimer = 0;
  agrid.addEventListener('click', (e) => {
    const a = e.target.closest('.ustadz__badge[data-day]');
    const btn = a && $(`#tab-${a.dataset.day}`);
    if (!btn) return;
    selectDay(btn);
    const id = a.closest('.ustadz').dataset.id;
    const el = $$('[data-ustadz]', panel).find((x) => x.dataset.ustadz.split(' ').includes(id) && x.dataset.t === a.dataset.t);
    if (!el) return; // acara tak ditemukan → cukup gulir ke #jadwal (handler anchor umum)
    // gulir sendiri langsung ke acaranya (bukan ke awal section) agar kedipnya terlihat
    e.preventDefault();
    e.stopPropagation();
    const card = el.closest('.jcard');
    const rail = el.closest('.jrail');
    if (rail && card) {
      const i = $$('.jcard', rail).indexOf(card);
      if (card.classList.contains('is-piled') || card.classList.contains('is-gone')) moveRail(rail, i);
    }
    const target = card || el;
    // posisi diukur setelah ScrollTrigger.refresh (dijadwalkan renderDay) → 2 frame;
    // acaranya ditaruh di tengah layar
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const r = target.getBoundingClientRect();
      const y = Math.max(0, scrollY + r.top - (innerHeight - r.height) / 2);
      if (lenis) lenis.scrollTo(y, { duration: 1 });
      else scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    }));
    // mulai setelah gulirnya kurang lebih selesai; 4× nyala-padam
    clearTimeout(flashTimer); clearInterval(flashTimer);
    $$('.is-flash, .is-flashing', panel).forEach((x) => x.classList.remove('is-flash', 'is-flashing'));
    let n = 0;
    flashTimer = setTimeout(() => {
      target.classList.add('is-flashing');
      flashTimer = setInterval(() => {
        target.classList.toggle('is-flash', n % 2 === 0);
        if (++n >= 8) { clearInterval(flashTimer); target.classList.remove('is-flashing'); }
      }, 450);
    }, 1100);
  });
  if (agrid.querySelector('.ustadz[data-id]')) { markAsatidzLive(); everyMinute(markAsatidzLive); }

  // Tenant marquee + grid
  const tenants = D.tenants.map(([name, file, tone]) => ({ name, tone, src: `assets/img/tenant/${file}` }));
  $('#tenantCount').dataset.count = tenants.length;
  const marquee = $('#tenantMarquee');
  const rows = [[], [], []];
  tenants.forEach((t, i) => rows[i % 3].push(t));
  // Tiap tenant (slider & daftar) adalah link ke denah: klik → gulir ke denah
  // lalu tendanya dipilih otomatis (handler di blok DENAH, setelah selectBooth).
  // Label "Tenda 34–36" diambil dari D.placements.
  const pad2 = (n) => String(n).padStart(2, '0');
  const boothsOf = {};
  (D.placements || []).forEach(([name, from, to = from]) => {
    (boothsOf[name] = boothsOf[name] || []).push(from === to ? pad2(from) : `${pad2(from)}–${pad2(to)}`);
  });
  // salinan kedua di tiap baris hanya untuk loop marquee: disembunyikan dari
  // pembaca layar & urutan Tab supaya tiap tenant tidak terbaca dua kali
  const tile = (t, dup) => `<a href="#denah" class="logo-tile${t.tone === 'dark' ? ' is-dark' : ''}" data-tenant-link="${esc(t.name)}" data-cursor="Lokasi"`
    + (dup ? ' tabindex="-1" aria-hidden="true">' : ` aria-label="${esc(t.name)} — lihat lokasi di denah">`)
    + `<img class="lazy-img" data-src="${esc(t.src)}" alt="" decoding="async"></a>`;
  marquee.innerHTML = rows.map((r, i) => {
    const tiles = r.map((t) => tile(t, false)).join('') + r.map((t) => tile(t, true)).join('');
    return `<div class="logo-row${i % 2 ? ' rev' : ''}" style="--dur:${70 + i * 12}s">${tiles}</div>`;
  }).join('');
  lazyWatch(marquee);

  const grid = $('#tenantGrid');
  grid.innerHTML = tenants.map((t) => `
    <li data-name="${esc(t.name.toLowerCase())}"><a href="#denah" data-tenant-link="${esc(t.name)}" data-cursor="Lokasi" aria-label="${esc(t.name)} — lihat lokasi di denah"><div class="ph${t.tone === 'dark' ? ' is-dark' : ''}"><img class="lazy-img" data-src="${esc(t.src)}" alt="" decoding="async"></div><span>${esc(t.name)}${boothsOf[t.name] ? `<small>Tenda ${boothsOf[t.name].join(', ')}</small>` : ''}</span></a></li>`).join('');
  lazyWatch(grid);
  const toggle = $('#tenantToggle');
  const all = $('#tenantAll');
  toggle.addEventListener('click', () => {
    const open = all.hidden;
    all.hidden = !open;
    toggle.setAttribute('aria-expanded', open);
    toggle.querySelector('span').textContent = open ? 'Sembunyikan' : 'Lihat Semua Brand';
    if (open) {
      if (hasGsap && !reduced) gsap.fromTo($$('li', grid), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .012, ease: 'power3.out', clearProps: 'transform,opacity' });
      // Fokus otomatis hanya di perangkat ber-keyboard fisik (tidak memunculkan keyboard di HP)
      if (finePointer) $('#tenantSearch').focus({ preventScroll: true });
    }
    if (hasGsap) ScrollTrigger.refresh();
    // Anchor: buka → ke daftar brand, tutup → kembali ke awal section
    const target = open ? all : $('#tenant');
    const offset = -(nav.offsetHeight + 28);
    requestAnimationFrame(() => {
      lockNav(1400);
      if (lenis) lenis.scrollTo(target, { offset, duration: 1, onComplete: () => lockNav(250) });
      else scrollTo({ top: target.getBoundingClientRect().top + scrollY + offset, behavior: reduced ? 'auto' : 'smooth' });
    });
  });
  $('#tenantSearch').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    let shown = 0;
    $$('li', grid).forEach((li) => { const hit = !q || li.dataset.name.includes(q); li.classList.toggle('is-hidden', !hit); shown += hit; });
    $('#tenantEmpty').hidden = shown > 0;
  });

  // Partners
  $('#partners').innerHTML = D.partners.map((g, gi) => `
    <div class="pgroup${gi === 0 ? ' pgroup--main' : ''}">
      <h3>${esc(g.group)}</h3>
      <div class="plist">${g.logos.map(([n, s, tone]) => {
        // logo dengan tautan di D.links menjadi link ke situsnya
        const url = D.links && D.links[n];
        const cls = `plogo${tone === 'dark' ? ' plogo--dark' : ''}`;
        const img = `<img class="lazy-img" data-src="${esc(s)}" alt="${esc(n)}" decoding="async">`;
        return url
          ? `
        <a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener" title="${esc(n)} — buka situs" data-cursor="Buka">${img}</a>`
          : `
        <div class="${cls}" title="${esc(n)}">${img}</div>`;
      }).join('')}
      </div>
    </div>`).join('');
  lazyWatch($('#partners'));

  // Hotline
  if (D.hotline) { $('#hotline').href = D.hotline.wa; $('#locWa').href = D.hotline.wa; $('#hotlineLabel').textContent = D.hotline.label; }

  /* ---------------------------------------------------------
     MARQUEE TEKS — isi diulang hingga ≥ lebar layar, lalu digandakan
     sekali agar animasi -50% selalu mulus (infinite tanpa loncat)
     --------------------------------------------------------- */
  const buildMarquee = (track) => {
    if (!track.dataset.src) track.dataset.src = track.innerHTML;
    track.innerHTML = `<div class="marquee__group">${track.dataset.src}</div>`;
    const group = track.firstElementChild;
    const unit = group.innerHTML;
    let guard = 0;
    while (group.scrollWidth < innerWidth + 100 && guard++ < 10) group.insertAdjacentHTML('beforeend', unit);
    const clone = group.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
    // kecepatan konstan (px/detik); di HP sedikit lebih cepat terasa
    const speed = innerWidth < 600 ? 62 : 70;
    track.style.setProperty('--dur', `${(group.scrollWidth / speed).toFixed(1)}s`);
  };
  const marqueeTracks = $$('.marquee__track');
  marqueeTracks.forEach(buildMarquee);
  let mqW = innerWidth, mqT;
  addEventListener('resize', () => {
    clearTimeout(mqT);
    mqT = setTimeout(() => { if (Math.abs(innerWidth - mqW) > 40) { mqW = innerWidth; marqueeTracks.forEach(buildMarquee); } }, 250);
  });

  /* ---------------------------------------------------------
     DENAH INTERAKTIF (SVG, koordinat mengikuti layout tenant)
     --------------------------------------------------------- */
  const CATS = {
    subsidi: { label: 'Tenda Subsidi', fill: '#c616c6', text: '#fff' }, // #c616c6: kontras teks putih 4,85 (min. 4,5)
    nonfood: { label: 'Tenda Non-Food', fill: '#2150f5', text: '#fff' },
    vip: { label: 'Tenda VIP', fill: '#efd48f', text: '#2b2b2b' },
    food: { label: 'Tenda Food', fill: '#c5fa01', text: '#2b2b2b' },
    rasyaad: { label: 'Tenda Rasyaad TV', fill: '#3f7a1f', text: '#fff' },
    sekolah: { label: 'Tenda Sekolah', fill: '#f06414', text: '#fff' },
  };
  const booths = [];
  const add = (n, cat, x, y, w = 42, h = 42) => booths.push({ n, cat, x, y, w, h });
  for (let i = 0; i < 7; i++) add(i + 1, 'subsidi', 172 + i * 42, 305, 40);
  for (let i = 0; i < 7; i++) add(i + 8, 'subsidi', 530 + i * 43, 305);
  for (let i = 0; i < 5; i++) add(19 - i, 'nonfood', 248 + i * 44.5, 486);
  for (let i = 0; i < 6; i++) add(59 - i, 'nonfood', 527 + i * 44.2, 486);
  for (let i = 0; i < 11; i++) add(20 + i, 'food', 207, 527 + i * 43.3, 41, 42);
  add(31, 'rasyaad', 207, 527 + 11 * 43.3, 41, 42);
  add(32, 'rasyaad', 207, 1047, 41, 42);
  add(33, 'sekolah', 250, 1047, 42, 42);
  for (let i = 0; i < 3; i++) add(34 + i, 'food', 293 + i * 44, 1047);
  for (let i = 0; i < 5; i++) add(37 + i, 'food', 570 + i * 44.5, 1047);
  for (let i = 0; i < 12; i++) add(53 - i, 'food', 792, 527 + i * 43.3, 41, 42);
  for (let i = 0; i < 9; i++) {
    add(60 + i, 'nonfood', 358, 580 + i * 45, 44, 43);
    add(69 + i, 'vip', 403, 580 + i * 45, 44, 43);
    add(78 + i, 'vip', 600, 580 + i * 45, 44, 43);
    add(87 + i, 'nonfood', 645, 580 + i * 45, 44, 43);
  }

  // Tenda → tenant dari D.placements. Nama yang tidak cocok dengan daftar
  // tenants (salah ketik saat diedit) diberi peringatan di console.
  const tenantAt = {};
  const owners = [...D.tenants, ...(D.boothOwners || [])];
  const tenantNames = new Set(owners.map((t) => t[0]));
  const tenantLogo = Object.fromEntries(owners.map(([name, file, tone]) => [name, { src: `assets/img/tenant/${file}`, dark: tone === 'dark' }]));
  (D.placements || []).forEach(([name, from, to = from]) => {
    if (!tenantNames.has(name)) console.warn(`[denah] tenant "${name}" tidak ada di daftar tenants`);
    for (let n = from; n <= to; n++) tenantAt[n] = name;
  });

  const svg = $('#denahSvg');
  const pad = (n) => String(n).padStart(2, '0');
  svg.innerHTML = `
    <rect x="88" y="168" width="874" height="948" fill="#2b2b2b"/>
    <rect x="150" y="280" width="705" height="820" fill="#3a3a3a"/>
    <rect x="248" y="527" width="544" height="520" fill="#4a4a4a"/>
    <rect x="482" y="262" width="30" height="225" fill="#6a6a6a"/>
    <rect x="455" y="580" width="67" height="405" fill="#e2e2e2"/>
    <rect x="526" y="580" width="68" height="405" fill="#cfcfcf"/>
    <text class="label" transform="translate(496 782) rotate(90)" text-anchor="middle" font-size="15">TENDA MAKAN PENGUNJUNG</text>
    <text class="label" transform="translate(552 782) rotate(-90)" text-anchor="middle" font-size="15">TENDA MAKAN PENGUNJUNG</text>
    <rect x="430" y="1040" width="135" height="46" fill="#fff"/>
    <text class="label" x="497" y="1070" text-anchor="middle">PANGGUNG</text>
    <rect x="468" y="456" width="58" height="26" fill="#c5fa01"/>
    <text class="label" x="497" y="475" text-anchor="middle" font-size="15">GATE</text>
    <path d="M450 198h90v40l-45 28-45-28Z" fill="#c5fa01" stroke="#2b2b2b" stroke-width="2"/>
    <text class="label" x="495" y="228" text-anchor="middle">MASUK</text>
    <g id="boothLayer">${booths.map((b) => `
      <g class="booth" data-n="${b.n}" data-cat="${b.cat}"${tenantAt[b.n] ? ` data-tenant="${esc(tenantAt[b.n])}"` : ''} tabindex="0" role="button" aria-label="Tenda ${pad(b.n)}, ${CATS[b.cat].label}${tenantAt[b.n] ? `, ${esc(tenantAt[b.n])}` : ''}">
        <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${CATS[b.cat].fill}"/>
        <text x="${b.x + b.w / 2}" y="${b.y + b.h / 2 + 6}" text-anchor="middle" fill="${CATS[b.cat].text}">${pad(b.n)}</text>
      </g>`).join('')}
    </g>`;

  /* Angka statistik (Tema) diambil dari data, bukan ditulis manual */
  (() => {
    const setStat = (key, val, sfx) => {
      const el = $(`[data-stat="${key}"]`); if (!el || !Number.isFinite(val)) return;
      el.dataset.count = String(val);
      if (sfx !== undefined) el.dataset.suffix = sfx;
    };
    const toMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); };
    setStat('days', D.days.length);
    setStat('booths', booths.length);
    if (D.hours && D.hours.open && D.hours.close) {
      const jam = Math.round((toMin(D.hours.close) - toMin(D.hours.open)) / 60);
      setStat('hours', jam, ' jam');
    }
  })();

  const legend = $('#legend');
  legend.innerHTML = Object.entries(CATS).map(([k, c]) => `
    <button class="chip" data-cat="${k}" aria-pressed="false" style="--c:${c.fill};--t:${c.text}"><i></i><span class="chip__label">${c.label}</span><em>${booths.filter((b) => b.cat === k).length}</em></button>`).join('');
  let activeCat = null;
  legend.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip'); if (!chip) return;
    activeCat = activeCat === chip.dataset.cat ? null : chip.dataset.cat;
    // klik pointer yang mematikan filter: lepas fokus agar label melayang ikut hilang
    if (!activeCat && e.detail) chip.blur();
    $$('.chip', legend).forEach((c) => c.setAttribute('aria-pressed', c.dataset.cat === activeCat));
    legend.classList.toggle('has-active', !!activeCat);
    svg.classList.toggle('is-filtered', !!activeCat);
    $$('.booth', svg).forEach((g) => g.classList.toggle('is-dim', !!activeCat && g.dataset.cat !== activeCat));
    if (hasGsap && !reduced && activeCat) {
      gsap.fromTo($$(`.booth[data-cat="${activeCat}"]`, svg), { scale: .6 }, { scale: 1, duration: .5, stagger: .01, ease: 'back.out(3)', clearProps: 'transform' });
    }
  });

  const tip = $('#boothTip');
  const stage = $('.denah__stage');
  // Tooltip dipindah keluar dari stage (yang memotong isinya lewat clip-path
  // notch) ke .denah__wrap — kartunya boleh melewati tepi denah.
  const tipBox = $('.denah__wrap');
  tipBox.appendChild(tip);
  const boothShare = $('#boothShare');
  const boothShareLabel = $('span', boothShare);
  let shareText = 'Bagikan lokasi';
  // Isi tooltip dibangun ulang hanya saat tendanya berganti — kalau tiap
  // pointermove, <img> logo ikut dibuat ulang terus dan berkedip.
  let tipFor = null;
  // Tautan situs (D.links) — hanya bisa diklik saat tooltip menempel di tenda
  // terpilih (.is-live); saat mengikuti kursor ia tetap tembus klik.
  const linkOf = (g) => {
    const url = D.links && D.links[g.dataset.tenant];
    if (!url) return '';
    const host = new URL(url).hostname.replace(/^www\./, '');
    return `<a class="booth-tip__link" href="${esc(url)}" target="_blank" rel="noopener" data-cursor="Buka">${esc(host)} <span aria-hidden="true">↗</span></a>`;
  };
  const fillTip = (g) => {
    if (tipFor === g) return;
    tipFor = g;
    const meta = `Tenda ${pad(g.dataset.n)} · ${CATS[g.dataset.cat].label.replace('Tenda ', '')}`;
    const logo = g.dataset.tenant && tenantLogo[g.dataset.tenant];
    tip.classList.toggle('has-logo', !!logo);
    tip.innerHTML = logo
      ? `<span class="booth-tip__logo${logo.dark ? ' is-dark' : ''}"><img src="${esc(logo.src)}" alt="" decoding="async"></span>`
        + `<span class="booth-tip__txt"><small>${esc(meta)}</small><b>${esc(g.dataset.tenant)}</b>${linkOf(g)}</span>`
      : esc(meta);
  };
  // Koordinat layar (clientX/Y). Kartu di atas titik `top`; kalau ruang di
  // atasnya (sampai tepi layar) tidak cukup, dibalik ke bawah titik `bottom`.
  // Mendatar dijepit ke stage — di mobile ke lebar layar, karena stage di sana
  // hampir selebar layar dan kartu berlogo bisa lebih lebar dari tendanya.
  const placeTip = (x, top, bottom = top) => {
    const wr = tipBox.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    const half = tip.offsetWidth / 2 + 8;
    const mobile = innerWidth <= 860;
    const lo = (mobile ? 0 : sr.left) + half, hi = (mobile ? innerWidth : sr.right) - half;
    // batas atas: tepi layar, atau bawah nav kalau nav sedang tampil
    const navEl = document.getElementById('nav');
    const roof = Math.max(0, navEl ? navEl.getBoundingClientRect().bottom : 0) + 8;
    const below = top - tip.offsetHeight * 1.3 < roof;
    tip.classList.toggle('is-below', below);
    tip.style.left = `${Math.min(Math.max(x, lo), Math.max(lo, hi)) - wr.left}px`;
    tip.style.top = `${(below ? bottom : top) - wr.top}px`;
    tip.classList.add('is-on');
    tip.classList.remove('is-live');
  };
  // Tooltip yang menempel di tenda terpilih: cek ulang atas/bawah saat digulir.
  let tipRaf = 0;
  addEventListener('scroll', () => {
    if (tipRaf || !picked || tipFor !== picked || !tip.classList.contains('is-on')) return;
    tipRaf = requestAnimationFrame(() => { tipRaf = 0; if (picked && tipFor === picked) tipAtBooth(picked); });
  }, { passive: true });
  const hideTip = () => { tip.classList.remove('is-on'); tipFor = null; };
  // Kotak tenda di layar, dihitung dari koordinat ASLI di data booths lewat
  // viewBox — BUKAN getBoundingClientRect milik <g>-nya. Animasi pop-in
  // (gsap.from scale 0) memasang transform awalnya sejak load dan baru jalan
  // saat denah terlihat; selama itu ukuran elemennya meleset hingga ~1000px,
  // sehingga lompatan dari link tenant saat load pertama kebablasan.
  const boothRect = (g) => {
    const b = booths.find((x) => x.n === Number(g.dataset.n));
    const sr = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    const k = Math.min(sr.width / vb.width, sr.height / vb.height); // preserveAspectRatio: meet
    const ox = sr.left + (sr.width - vb.width * k) / 2, oy = sr.top + (sr.height - vb.height * k) / 2;
    return { left: ox + (b.x - vb.x) * k, top: oy + (b.y - vb.y) * k, width: b.w * k, height: b.h * k };
  };
  // tooltip menempel di atas sebuah tenda (bukan mengikuti kursor)
  const tipAtBooth = (g) => {
    fillTip(g);
    const br = boothRect(g);
    placeTip(br.left + br.width / 2, br.top + 4, br.top + br.height - 4);
    tip.classList.toggle('is-live', g.classList.contains('is-sel') && !!$('a', tip));
  };

  /* Tooltip perkenalan denah — tampil sekali, disimpan sampai acara berakhir */
  (() => {
    const coach = $('#denahCoach');
    if (!coach) return;
    const KEY = 'mb9:denahCoach';
    const lastDay = D.days[D.days.length - 1];
    const eventEnd = new Date(`${lastDay.iso}T${(D.hours && D.hours.close) || '21:00'}:00+07:00`).getTime();
    const read = () => { try { return +localStorage.getItem(KEY) || 0; } catch { return 0; } };
    const seen = () => { try { localStorage.setItem(KEY, String(eventEnd)); } catch { /* private mode */ } };
    if (read() > Date.now()) return;              // sudah pernah ditutup & acara belum berakhir
    if (Date.now() > eventEnd) return;            // acara sudah lewat

    let shown = false;
    const close = () => {
      if (!shown) return;
      shown = false; coach.hidden = true; seen();
      removeEventListener('keydown', onKey);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const io = new IntersectionObserver((entries, obs) => {
      if (!entries.some((en) => en.isIntersecting)) return;
      obs.disconnect();
      setTimeout(() => {
        if (read() > Date.now()) return;
        coach.hidden = false; shown = true;
        addEventListener('keydown', onKey);
      }, 700);
    }, { threshold: .35 });
    io.observe($('.denah__stage'));
    // hanya tombol "Mengerti" yang menutup — klik di denah atau di badan tooltip
    // tidak lagi menutupnya, agar petunjuknya tidak hilang tanpa sengaja
    $('#denahCoachOk').addEventListener('click', close);
  })();
  // Sorot grup tenant. Tenda satu tenant bisa berderet ATAU berjauhan (mis.
  // satu di VIP, satu di Food), jadi dua lapis:
  //  1) spotlight — tenda lain dipudarkan (svg.has-pick), tenda tenant ini
  //     tetap penuh warna + garis putih; berlaku di mana pun letaknya;
  //  2) bingkai putus-putus per KELOMPOK yang benar-benar bersebelahan —
  //     bukan satu kotak raksasa yang membentang di antara tenda berjauhan.
  const groupLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  groupLayer.setAttribute('class', 'booth-groups');
  svg.appendChild(groupLayer);
  // Sorotan grup untuk satu tenda: dipakai saat dipilih (klik/ketuk) DAN saat
  // di-hover mouse. g = null → tidak ada sorotan.
  let picked = null;
  const paintGroup = (g) => {
    $$('.booth.is-mate', svg).forEach((x) => x.classList.remove('is-mate'));
    groupLayer.innerHTML = '';
    const name = g && g.dataset.tenant;
    svg.classList.toggle('has-pick', !!name);
    if (!name) return;
    // tenda yang sedang dipilih tidak diberi is-mate: aturan is-mate datang
    // belakangan di CSS dan akan mengecilkan skala 1.18 miliknya
    $$('.booth', svg).forEach((x) => {
      if (x !== g && !x.classList.contains('is-sel') && x.dataset.tenant === name) x.classList.add('is-mate');
    });
    showGroup(name);
  };
  const clearSel = () => {
    $$('.booth.is-sel', svg).forEach((x) => x.classList.remove('is-sel'));
    picked = null;
    paintGroup(null);
  };
  // dua tenda dianggap menempel bila celahnya <= 6 unit dan sisinya bertumpuk
  const touching = (a, b) => {
    const gapX = Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w);
    const gapY = Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h);
    return (gapX <= 6 && gapY < 0) || (gapY <= 6 && gapX < 0);
  };
  const showGroup = (name) => {
    const mine = booths.filter((b) => tenantAt[b.n] === name);
    const clusters = [];
    mine.forEach((b) => {
      const hit = clusters.filter((c) => c.some((m) => touching(m, b)));
      const merged = hit.flat().concat(b);
      hit.forEach((c) => clusters.splice(clusters.indexOf(c), 1));
      clusters.push(merged);
    });
    const P = 6;
    groupLayer.innerHTML = clusters.filter((c) => c.length > 1).map((c) => {
      const x1 = Math.min(...c.map((b) => b.x)) - P, y1 = Math.min(...c.map((b) => b.y)) - P;
      const x2 = Math.max(...c.map((b) => b.x + b.w)) + P, y2 = Math.max(...c.map((b) => b.y + b.h)) + P;
      return `<rect class="booth-group" x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}"/>`;
    }).join('');
    svg.appendChild(groupLayer); // tetap paling atas setelah tenda dipindah ke depan
  };
  const selectBooth = (g) => {
    clearSel();
    g.classList.add('is-sel');
    // Tooltip juga untuk ketukan & keyboard — sebelumnya hanya mengikuti
    // gerakan mouse, jadi di HP tidak pernah muncul sama sekali
    tipAtBooth(g);
    // tenant dengan beberapa tenda: tenda lainnya ikut disorot
    picked = g;
    paintGroup(g);
    setBoothUrl(g);
    denahShare.close(); // isi menu (QR, judul) milik tenda sebelumnya
    shareText = `Bagikan lokasi · ${g.dataset.tenant || `Tenda ${pad(g.dataset.n)}`}`;
    boothShareLabel.textContent = shareText;
    boothShare.hidden = false;
    g.parentNode.appendChild(g); // bawa ke depan
  };
  // SVG tidak punya z-index: booth yang di-hover dipindah ke akhir layer agar tampil di atas tetangganya
  const toFront = (g) => { if (g && g !== g.parentNode.lastElementChild) g.parentNode.appendChild(g); };
  // Hover mouse: pratinjau sorotan grup tenant, sama seperti saat diklik.
  // Keluar dari tenda → kembali ke sorotan tenda yang terakhir dipilih.
  svg.addEventListener('pointerover', (e) => {
    const g = e.target.closest('.booth');
    toFront(g);
    if (g && e.pointerType !== 'touch') paintGroup(g);
  });
  svg.addEventListener('pointerout', (e) => {
    const g = e.target.closest('.booth');
    if (!g || g.contains(e.relatedTarget)) return;
    toFront($('.booth.is-sel', svg));
    if (e.pointerType !== 'touch') paintGroup(picked);
  });
  // ketuk area kosong denah: lepas pilihan, bingkai grup, dan tooltip
  svg.addEventListener('click', (e) => { const g = e.target.closest('.booth'); if (g) selectBooth(g); else if (picked) { clearSel(); hideTip(); setBoothUrl(null); denahShare.close(); boothShare.hidden = true; } });
  svg.addEventListener('keydown', (e) => {
    const g = e.target.closest('.booth');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectBooth(g); }
  });
  // Mengikuti kursor hanya untuk mouse/pen. Sentuhan ditangani selectBooth;
  // jari yang terangkat memicu pointerleave dan akan langsung menutupnya.
  svg.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const g = e.target.closest('.booth');
    // Di area kosong: kalau ada tenda terpilih, tooltip kembali ke tenda itu
    // (seperti sorotan grupnya) — bukan ditutup. Penting setelah lompatan dari
    // daftar tenant: usai menggulir, browser mengirim gerak mouse sintetis dan
    // tooltip tenda yang baru dipilih langsung hilang.
    if (!g) { if (picked) tipAtBooth(picked); else hideTip(); return; }
    // tenda terpilih: tooltip diam di atasnya supaya tautannya bisa dijangkau
    if (g === picked) { tipAtBooth(g); return; }
    fillTip(g);
    placeTip(e.clientX, e.clientY, e.clientY + 28);
  });
  svg.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'touch') return;
    if (picked) tipAtBooth(picked); else hideTip();
  });

  /* Gambar asli → lightbox di halaman (bukan tab baru): zoom lewat roda /
     cubit / tombol / ketuk 2×, geser lewat seret. Klik dengan Ctrl/⌘/Shift
     atau klik tengah tetap membuka tab baru seperti link biasa. */
  (() => {
    const link = $('#denahImgLink'), dlg = $('#zoomDlg');
    if (!link || !dlg || !dlg.showModal) return;
    const st = $('#zoomStage'), img = $('#zoomImg'), pct = $('#zoomPct');
    let k = 1, fit = 1, x = 0, y = 0;
    const MAX = 4;
    const apply = () => {
      img.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
      pct.textContent = `${Math.round(k / fit * 100)}%`;
    };
    // jaga gambar tidak terseret keluar: kalau lebih kecil dari layar → di tengah
    const clamp = () => {
      const W = st.clientWidth, H = st.clientHeight, w = img.naturalWidth * k, h = img.naturalHeight * k;
      x = w <= W ? (W - w) / 2 : Math.min(0, Math.max(W - w, x));
      y = h <= H ? (H - h) / 2 : Math.min(0, Math.max(H - h, y));
    };
    const zoomAt = (nk, cx, cy) => {
      nk = Math.min(Math.max(nk, fit), fit * MAX);
      x = cx - (cx - x) * (nk / k); y = cy - (cy - y) * (nk / k); k = nk;
      clamp(); apply();
    };
    const reset = () => {
      fit = Math.min(st.clientWidth / img.naturalWidth, st.clientHeight / img.naturalHeight);
      k = fit; clamp(); apply();
    };
    const open = () => {
      if (!img.src) img.src = link.querySelector('img').currentSrc || link.href;
      dlg.showModal();
      root.classList.add('zoom-open');
      if (lenis) lenis.stop();
      img.complete && img.naturalWidth ? reset() : img.addEventListener('load', reset, { once: true });
    };
    link.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault(); open();
    });
    dlg.addEventListener('close', () => { root.classList.remove('zoom-open'); if (lenis) lenis.start(); });
    addEventListener('resize', () => { if (dlg.open) reset(); });
    const center = () => [st.clientWidth / 2, st.clientHeight / 2];
    $$('[data-zoom]', dlg).forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.zoom;
      if (a === 'close') dlg.close();
      else if (a === 'fit') reset();
      else zoomAt(k * (a === 'in' ? 1.5 : 1 / 1.5), ...center());
    }));
    st.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = st.getBoundingClientRect();
      zoomAt(k * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025)), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    // seret (1 jari / mouse) & cubit (2 jari) lewat Pointer Events
    const pts = new Map();
    let last = null, lastTap = 0;
    const mid = () => { const [a, b] = [...pts.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) }; };
    st.addEventListener('pointerdown', (e) => {
      st.setPointerCapture(e.pointerId);
      const r = st.getBoundingClientRect();
      pts.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
      last = pts.size === 2 ? mid() : null;
      st.classList.add('is-drag');
      // ketuk/klik 2× → perbesar 2.5× di titik itu, atau kembali pas layar
      if (pts.size === 1) {
        const now = Date.now(), p = pts.get(e.pointerId);
        if (now - lastTap < 300) { k > fit * 1.05 ? reset() : zoomAt(fit * 2.5, p.x, p.y); lastTap = 0; } else lastTap = now;
      }
    });
    st.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      const r = st.getBoundingClientRect(), prev = pts.get(e.pointerId);
      const cur = { x: e.clientX - r.left, y: e.clientY - r.top };
      pts.set(e.pointerId, cur);
      if (pts.size === 1) { x += cur.x - prev.x; y += cur.y - prev.y; clamp(); apply(); }
      else if (pts.size === 2) {
        const m = mid();
        if (last) { x += m.x - last.x; y += m.y - last.y; zoomAt(k * (m.d / last.d), m.x, m.y); }
        last = m;
      }
    });
    const up = (e) => { pts.delete(e.pointerId); last = pts.size === 2 ? mid() : null; if (!pts.size) st.classList.remove('is-drag'); };
    st.addEventListener('pointerup', up);
    st.addEventListener('pointercancel', up);
    // klik di luar gambar (latar) menutup — tapi bukan akhir dari seretan
    let moved = false;
    st.addEventListener('pointerdown', () => { moved = false; });
    st.addEventListener('pointermove', (e) => { if (pts.has(e.pointerId)) moved = true; });
    st.addEventListener('click', (e) => { if (!moved && e.target === st) dlg.close(); });
  })();

  $$('.seg button').forEach((b) => b.addEventListener('click', () => {
    $$('.seg button').forEach((x) => x.setAttribute('aria-selected', x === b));
    $$('.denah__view').forEach((v) => v.classList.toggle('is-active', v.dataset.pane === b.dataset.view));
    const isImg = b.dataset.view === 'img';
    $('.denah__side').classList.toggle('is-img', isImg);
    $$('.chip', legend).forEach((c) => { c.disabled = isImg; });
    if (isImg) hideTip(); // tooltip kini di luar pane peta → tidak ikut tersembunyi
    else if (picked) tipAtBooth(picked);
    boothShare.hidden = isImg || !picked; // jangan melayang di atas gambar asli
    if (boothShare.hidden) denahShare.close();
    if (hasGsap) ScrollTrigger.refresh();
  }));

  // Slug nama tenant untuk URL: "Adiani Syar'i" → "adiani-syar-i"
  const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const firstBoothOf = (name) => $$('.booth', svg)
    .filter((x) => x.dataset.tenant === name)
    .sort((x, y) => x.dataset.n - y.dataset.n)[0];
  // ?tenda=38 (nomor) atau ?tenant=rasa-coffee (slug / nama)
  const findBooth = (q) => {
    if (/^\d{1,3}$/.test(q)) return $(`.booth[data-n="${Number(q)}"]`, svg);
    const s = slug(q);
    const name = [...tenantNames].find((n) => slug(n) === s);
    return name ? firstBoothOf(name) : null;
  };
  // Gulir sampai tenda di TENGAH layar lalu pilih — bukan ke judul #denah,
  // karena tenda di bagian bawah denah (mis. 38) akan berada di luar layar.
  const focusBooth = (g) => {
    const mapBtn = $('.seg button[data-view="map"]');
    if (mapBtn && mapBtn.getAttribute('aria-selected') !== 'true') mapBtn.click();
    lockNav();
    // Posisi dihitung sebagai ANGKA: Lenis.scrollTo hanya menerima elemen
    // HTML — tenda adalah <g> SVG, jadi kalau dioper langsung perintahnya
    // diabaikan diam-diam (tidak menggulir, onComplete tak pernah terpanggil).
    const br = boothRect(g);
    const y = scrollY + br.top + br.height / 2 - innerHeight / 2;
    if (lenis) lenis.scrollTo(y, { duration: 1.1, onComplete: () => { lockNav(250); selectBooth(g); } });
    else {
      g.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      setTimeout(() => selectBooth(g), reduced ? 50 : 650);
    }
  };
  // URL ikut menunjuk tenda yang dipilih → address bar bisa langsung disalin
  // & dibagikan. replaceState: memilih tenda tidak menumpuk riwayat Back.
  const setBoothUrl = (g) => {
    const url = new URL(location.href);
    url.pathname = stripIndex(url.pathname);
    url.searchParams.delete('tenant'); url.searchParams.delete('tenda');
    if (g) url.searchParams.set(g.dataset.tenant ? 'tenant' : 'tenda', g.dataset.tenant ? slug(g.dataset.tenant) : g.dataset.n);
    url.hash = 'denah';
    history.replaceState(null, '', url);
  };

  // Bagikan lokasi tenda terpilih — menu yang sama dengan Jadwal; QR memakai
  // logo tenant (atau logo MB9 untuk tenda tanpa tenant). URL ?tenant=…#denah
  // sudah ditulis setBoothUrl; ?hari= sisa jadwal dibuang agar rapi.
  const denahShare = shareMenu(boothShare, () => {
    if (!picked) return null;
    const url = new URL(location.href);
    url.pathname = stripIndex(url.pathname);
    url.searchParams.delete('hari');
    const who = picked.dataset.tenant;
    // tenant dengan beberapa tenda (berderet atau berjauhan): semua nomornya
    // ikut ditulis di judul share — bukan cuma tenda yang diklik
    const where = `Tenda ${who && boothsOf[who] ? boothsOf[who].join(', ') : pad(picked.dataset.n)}`;
    const ev = (D.event && D.event.title) || 'Muslim Berdedikasi 9';
    return {
      url: url.href,
      title: who ? `${who} — ${where} · ${ev}` : `${where} · ${ev}`,
      logo: (who && tenantLogo[who]) || MB9_LOGO,
      file: `mb9-${who ? slug(who) : `tenda-${pad(picked.dataset.n)}`}`,
    };
  });

  // Klik tenant di slider/daftar. Didaftarkan sebelum handler anchor global,
  // jadi stopImmediatePropagation mencegah guliran ganda ke awal section.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-tenant-link]');
    if (!a) return;
    const first = firstBoothOf(a.dataset.tenantLink);
    if (!first) return; // tanpa tenda: biarkan handler anchor ke #denah
    e.preventDefault();
    e.stopImmediatePropagation();
    focusBooth(first);
  });

  /* ---------------------------------------------------------
     COUNTDOWN
     --------------------------------------------------------- */
  const cd = $('#countdown');
  // Diturunkan dari days + hours (WIB, UTC+7)
  const start = new Date(`${D.days[0].iso}T${D.hours.open}:00+07:00`).getTime();
  const end = new Date(`${D.days[D.days.length - 1].iso}T${D.hours.close}:00+07:00`).getTime();
  const units = { d: $('[data-cd="d"]', cd), h: $('[data-cd="h"]', cd), m: $('[data-cd="m"]', cd), s: $('[data-cd="s"]', cd) };
  // Digit "swipe up": hanya digit yang berubah yang bergulir ke atas
  const roll = (el, str) => {
    if (el.dataset.v === str) return;
    const first = !el.dataset.v || el.dataset.v.length !== str.length;
    el.dataset.v = str;
    if (first) {
      el.innerHTML = [...str].map((c) => `<span class="cd-d"><i>${c}</i></span>`).join('');
      return;
    }
    [...str].forEach((c, i) => {
      const slot = el.children[i];
      const cur = slot.lastElementChild;
      if (cur.textContent === c) return;
      const nx = document.createElement('i');
      nx.className = 'in';
      nx.textContent = c;
      slot.appendChild(nx);
      void nx.offsetWidth; // paksa reflow agar transisi berjalan
      cur.classList.add('out');
      nx.classList.remove('in');
      setTimeout(() => cur.remove(), 650);
    });
  };
  const label = $('.countdown__label', cd);
  const todayLink = $('.countdown__today', cd);
  const menuFlag = $('#menuToday');
  const navFlag = $('#navToday');
  // Link jadwal: sebelum acara cukup menggulir ke #jadwal (handler anchor);
  // selama acara pilih dulu tab hari ini, baru digulir
  todayLink.addEventListener('click', () => {
    if (!todayLink.dataset.day) return;
    const btn = $(`#tab-${todayLink.dataset.day}`);
    if (btn) selectDay(btn);
  });
  const tick = () => {
    const now = Date.now();
    // Setelah acara selesai: sembunyikan angka, tampilkan ucapan terima kasih
    if (now >= end) {
      cd.classList.add('is-live');
      todayLink.hidden = true;
      if (menuFlag) menuFlag.hidden = true;
      if (navFlag) navFlag.hidden = true;
      label.textContent = 'Jazakumullahu khairan atas kehadiran Anda';
      return false;
    }
    // Sebelum mulai → hitung ke start. Selama rangkaian hitung ke akhir acara;
    // lewat jam tutup (sampai tengah malam) hitung ke jam buka hari berikutnya.
    const running = now >= start;
    // "hari ini" = sudah masuk tanggalnya & belum lewat jam tutup (WIB)
    const today = openDayAt(now);
    const reopen = running && !today ? nextOpenAt(now) : 0;
    // hari pertama sebelum jam buka sudah "hari ini" → bukan lagi "Menuju hari H"
    const text = !running ? (today ? 'Dibuka dalam' : 'Menuju hari H') : reopen ? 'Dibuka kembali dalam' : 'Acara berakhir dalam';
    if (label.textContent !== text) label.textContent = text;
    // Hari acara (belum lewat jam tutup): link ke jadwal hari ini. Selain itu: "Lihat jadwal".
    if (today) {
      if (todayLink.dataset.day !== today.key) {
        todayLink.dataset.day = today.key;
        // tanggal di <span> → disembunyikan di layar sempit agar tetap satu baris dengan label
        todayLink.innerHTML = `Jadwal hari ini<span class="countdown__date"> · ${esc(today.short)}, ${esc(today.date)}</span> →`;
      }
    } else if (todayLink.dataset.day !== '') {
      todayLink.dataset.day = '';
      todayLink.textContent = 'Lihat jadwal →';
    }
    todayLink.hidden = false;
    // penanda di menu mobile; ikut tick agar berganti sendiri lewat tengah malam
    if (menuFlag) menuFlag.hidden = !today;
    if (navFlag) navFlag.hidden = !today;
    let t = Math.floor(((!running ? start : reopen || end) - now) / 1000);
    const v = { d: Math.floor(t / 86400), h: Math.floor((t %= 86400) / 3600), m: Math.floor((t %= 3600) / 60), s: t % 60 };
    Object.keys(v).forEach((k) => {
      const txt = k === 'd' ? String(v[k]) : pad(v[k]);
      roll(units[k], txt);
    });
    return true;
  };
  if (tick()) { const iv = setInterval(() => { if (!tick()) clearInterval(iv); }, 1000); }

  /* ---------------------------------------------------------
     NAV · MENU · PROGRESS
     --------------------------------------------------------- */
  const nav = $('#nav');
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

  const bar = $('.scroll-progress span');
  let lastY = 0;
  // Saat scroll otomatis (klik menu/anchor), navbar dikunci tetap tampil
  let navLocked = false, navLockT;
  const lockNav = (ms = 1600) => {
    navLocked = true;
    nav.classList.remove('is-hidden');
    clearTimeout(navLockT);
    navLockT = setTimeout(() => { navLocked = false; lastY = scrollY; }, ms);
  };
  const onScroll = (y) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (!root.classList.contains('menu-open') && !navLocked) nav.classList.toggle('is-hidden', y > lastY && y > 300);
    lastY = y;
  };

  const links = $$('.nav__links a');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => spy.observe(s));

  /* ---------------------------------------------------------
     SMOOTH SCROLL (Lenis)
     --------------------------------------------------------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
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
  const goToHash = (id) => {
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
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    if (goToHash(a.getAttribute('href'))) e.preventDefault();
  });

  /* ---------------------------------------------------------
     CURSOR & MAGNETIC
     --------------------------------------------------------- */
  if (finePointer && !reduced) {
    const cur = $('.cursor');
    const label = $('.cursor__label');
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; cur.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    const loop = () => {
      cx += (tx - cx) * .22; cy += (ty - cy) * .22;
      cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const hov = e.target.closest('a, button, .booth, .logo-tile, .plogo, .tenant__grid li');
      cur.classList.toggle('has-label', !!lab);
      cur.classList.toggle('is-hover', !!hov && !lab);
      cur.classList.toggle('is-on-dark', !!e.target.closest('.footer, .layanan, .denah__stage, .marquee--dark'));
      label.textContent = lab ? lab.dataset.cursor : '';
    });

    document.addEventListener('pointermove', (e) => {
      const m = e.target.closest('.magnetic');
      $$('.magnetic.is-mag').forEach((el) => { if (el !== m) { el.classList.remove('is-mag'); el.style.transform = ''; } });
      if (!m) return;
      const r = m.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * .3;
      const y = (e.clientY - r.top - r.height / 2) * .4;
      m.classList.add('is-mag');
      m.style.transition = 'transform .25s cubic-bezier(.2,.8,.2,1), color .35s';
      m.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  /* ---------------------------------------------------------
     TEXT EFFECTS
     --------------------------------------------------------- */
  const GLYPHS = '`¡™£¢∞§¶•ªº–≠åß∂ƒ©˙∆˚¬…æ≈ç√∫˜µ≤≥÷/?░▒▓<>/';
  // Blok arsir adalah ciri khas efeknya. Diambil acak dari GLYPHS saja,
  // peluangnya tipis (3 dari 40), jadi slot-nya dijatah terpisah.
  const BLOCKS = '░▒▓';
  const BLOCK_SLOTS = 3;      // dari 10 slot per huruf
  const SCRAMBLE_MS = 1600;   // lama efek per elemen
  const SCRAMBLE_STEP = 55;   // jeda antar pergantian karakter acak
  const SCRAMBLE_PCT = 0.35;  // bagian EKOR tiap KATA yang ikut glitch
  // Lebar glyph pengganti tidak sama dengan huruf aslinya. Kalau teks ditulis
  // apa adanya, tiap pergantian karakter mengubah lebar kata → baris bisa
  // pindah → tinggi elemen berubah → seluruh halaman meloncat. Di desktop
  // nyaris tak terasa karena judulnya longgar; di HP judul sudah mepet
  // sehingga tiap tick bisa menambah/mengurangi satu baris.
  //
  // Solusinya bukan mengganti glyph-nya (blok ░▒▓ itu ciri khas efeknya),
  // tapi mengunci geometrinya: tiap huruf dapat kotak inline-block selebar
  // huruf ASLINYA, dan tiap kata dibungkus inline-block nowrap. Glyph apa pun
  // yang masuk, lebar kata tidak berubah, jadi titik pemenggalan baris persis
  // sama dari awal sampai akhir animasi.
  const measurer = document.createElement('canvas').getContext('2d');
  const charBoxes = (el, text) => {
    const cs = getComputedStyle(el);
    measurer.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const frag = document.createDocumentFragment();
    const cells = new Array(text.length).fill(null);
    let i = 0;
    while (i < text.length) {
      if (text[i] === ' ') { frag.appendChild(document.createTextNode(' ')); i++; continue; }
      const word = document.createElement('span');
      word.style.cssText = 'display:inline-block;white-space:nowrap';
      while (i < text.length && text[i] !== ' ') {
        const cell = document.createElement('span');
        cell.style.cssText = `display:inline-block;width:${measurer.measureText(text[i]).width}px;text-align:center`;
        cell.textContent = text[i];
        word.appendChild(cell);
        cells[i] = cell;
        i++;
      }
      frag.appendChild(word);
    }
    return { frag, cells };
  };
  const scramble = (el) => {
    const original = el.dataset.text || (el.dataset.text = el.textContent);
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', original);
    const len = original.length;
    // Tiap huruf punya kantong 10 glyph sendiri (--char-0..9 di CodePen
    // aslinya) yang diputar berulang.
    const pools = [];
    for (let i = 0; i < len; i++) {
      const pool = [];
      for (let g = 0; g < 10; g++) pool.push(GLYPHS[(Math.random() * GLYPHS.length) | 0]);
      // jatah blok ditaruh di slot acak yang belum terpakai, bukan ditimpa
      // berurutan, supaya posisinya tidak selalu di awal putaran
      const free = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let b = 0; b < BLOCK_SLOTS; b++) {
        const slot = free.splice((Math.random() * free.length) | 0, 1)[0];
        pool[slot] = BLOCKS[(Math.random() * BLOCKS.length) | 0];
      }
      pools.push(pool);
    }
    // Porsi ekor dihitung PER KATA, bukan per kalimat: kalau per kalimat,
    // kata-kata di depan tidak pernah ikut glitch sama sekali. Tiap kata
    // berhenti berurutan kiri-ke-kanan di dalam dirinya sendiri.
    const settle = new Array(len).fill(0);
    for (let w = 0; w < len;) {
      if (original[w] === ' ') { w++; continue; }
      let end = w;
      while (end < len && original[end] !== ' ') end++;
      const from = w + Math.floor((end - w) * (1 - SCRAMBLE_PCT));
      const tail = Math.max(1, end - from);
      for (let i = from; i < end; i++) {
        // sedikit jitter agar hurufnya tidak berhenti dalam irama mesin
        settle[i] = SCRAMBLE_MS * Math.min(1, ((i - from + 1) / tail) + (Math.random() - 0.5) * 0.12);
      }
      w = end;
    }
    const { frag, cells } = charBoxes(el, original);
    el.textContent = '';
    el.appendChild(frag);
    // Berbasis waktu, bukan hitungan frame: versi lama memakai satu frame per
    // langkah sehingga di layar 120Hz efeknya jalan dua kali lebih cepat.
    let start = 0;
    let last = -1;
    const run = (now) => {
      if (!start) start = now;
      const ms = now - start;
      // glyph diganti tiap SCRAMBLE_STEP ms saja; kalau tiap frame, hasilnya
      // terbaca sebagai getaran rata, bukan glitch
      const tick = ms / SCRAMBLE_STEP | 0;
      if (tick !== last) {
        last = tick;
        for (let i = 0; i < len; i++) {
          const cell = cells[i];
          if (!cell) continue;
          const ch = ms >= settle[i] ? original[i] : pools[i][tick % 10];
          if (cell.textContent !== ch) cell.textContent = ch;
        }
      }
      // kembalikan ke teks polos supaya markup-nya bersih lagi setelah selesai
      if (ms < SCRAMBLE_MS) requestAnimationFrame(run); else el.textContent = original;
    };
    requestAnimationFrame(run);
  };

  // split words
  $$('.split-words').forEach((el) => {
    el.setAttribute('aria-label', el.textContent);
    const hl = (el.dataset.hl || '').toLowerCase().split(/\s+/).filter(Boolean); // kata yang diberi stabilo
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w" aria-hidden="true"><span${hl.includes(w.toLowerCase()) ? ' class="w-hl"' : ''}>${esc(w)}</span></span>`).join(' ');
  });
  // (setelah split-words, karena itu menulis ulang isi judul Tema)
  // Glitch teks untuk judul yang tidak memakai scramble (Tema, Layanan,
  // Lokasi): 2 salinan isi judul (biru & lime) ditumpuk persis di atasnya —
  // salinan HTML, bukan attr(data-text), supaya baris & blok sorotnya sama.
  $$('#tentang .title, #layanan .title, .loc-card__title').forEach((h, k) => {
    const copy = h.cloneNode(true);
    copy.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
    const g = document.createElement('span');
    g.className = 'tglitch'; g.setAttribute('aria-hidden', 'true');
    g.innerHTML = `<span>${copy.innerHTML}</span><span>${copy.innerHTML}</span>`;
    g.style.setProperty('--d', `${(k * 1.3) % 4}s`);
    h.classList.add('has-tglitch');
    h.appendChild(g);
  });

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
  let seenThisSession = false;
  try { seenThisSession = sessionStorage.getItem('mb9-pre') === '1'; sessionStorage.setItem('mb9-pre', '1'); } catch (_) { /* abaikan */ }
  const finishPreloader = () => new Promise((resolve) => {
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

  const intro = () => {
    root.classList.add('is-loaded');
    if (!hasGsap || reduced) { $$('.reveal-up').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; }); return; }
    introTl.play();
    // Judul hero ikut di-scramble, jeda antar barisnya disamakan dengan
    // stagger .12 milik introTl agar glitch-nya jatuh bersama slide tiap baris.
    // Tidak memakai [data-scramble]: pemicunya ScrollTrigger 'top 90%' yang di
    // hero langsung terpenuhi saat muat, jadi akan jalan sebelum loader selesai.
    $$('.hero__title .blk').forEach((el, i) => setTimeout(() => scramble(el), 120 * i));
  };

  const scrollAnims = () => {
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
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.timeline({
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

      // asatidz: satu baris, geser horizontal saat overflow (mirip layanan)
      const agridTrack = $('#asatidzGrid');
      if (agridTrack) {
        const adist = () => Math.max(0, agridTrack.scrollWidth - innerWidth);
        gsap.timeline({
          scrollTrigger: {
            trigger: '.asatidz__pin', start: 'top top',
            end: () => `+=${adist() ? adist() * 1.45 + innerHeight * .25 : 1}`,
            pin: true, pinType: 'fixed', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
          },
        })
          .to(agridTrack, { x: () => -adist(), ease: 'none', duration: 1 })
          .to({}, { duration: .42 }); // jeda di kartu terakhir sebelum lanjut scroll
      }

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

    // asatidz cards
    gsap.from('.ustadz', { y: 60, rotateX: -20, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out', transformPerspective: 800, scrollTrigger: { trigger: '.asatidz__grid', start: 'top 85%', once: true } });

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

  /* ---------------------------------------------------------
     HEMAT CPU — jeda animasi infinite (marquee, blink, float)
     pada section yang sedang di luar layar.
     --------------------------------------------------------- */
  (() => {
    const blocks = [...$$('main > section'), ...$$('main > .marquee'), $('.footer')].filter(Boolean);
    if (!blocks.length || !('IntersectionObserver' in window)) return;
    blocks.forEach((el) => el.classList.add('anim-off'));
    const animIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => en.target.classList.toggle('anim-off', !en.isIntersecting));
    }, { rootMargin: '150px 0px' });
    blocks.forEach((el) => animIO.observe(el));
  })();

  // Mulai
  const boot = () => finishPreloader().then(intro).then(() => {
    if (!bootHash && !bootBooth) return;
    // Beri waktu judul hero muncul dulu, lalu ukur ulang (load bisa belum
    // terjadi kalau boot dipicu timeout 2,5 dtk) sebelum meluncur ke target.
    setTimeout(() => {
      // pengunjung sudah menggulir sendiri selama preloader → jangan ditarik
      // paksa, cukup kembalikan hash ke URL
      if (userScrolled) { if (bootHash) history.replaceState(null, '', bootHash); return; }
      if (hasGsap) ScrollTrigger.refresh();
      requestAnimationFrame(() => {
        // link tenant didahulukan; nama/nomor tak dikenal → cukup ke #denah
        const g = bootBooth && findBooth(bootBooth);
        const id = bootBooth ? '#denah' : bootHash;
        if (g) focusBooth(g);
        else goToHash(id);
        // Koreksi: boot bisa jalan sebelum semua aset termuat (jaringan
        // lambat) → gambar & pin-spacer di atas tujuan yang menyusul memanjangkan
        // halaman dan tujuan terdorong ke bawah layar. Setelah 'load' (dan sekali
        // lagi sesudahnya untuk gambar lazy) posisi diukur ulang; meleset >40px →
        // digulir lagi. Tidak dilakukan bila pengunjung sudah menggulir sendiri.
        const realign = () => {
          if (userScrolled) return;
          if (hasGsap) ScrollTrigger.refresh();
          requestAnimationFrame(() => {
            if (userScrolled) return;
            if (g) {
              const br = boothRect(g);
              const off = br.top + br.height / 2 - innerHeight / 2;
              if (Math.abs(off) > 40) { if (lenis) lenis.scrollTo(scrollY + off, { duration: .6 }); else scrollTo({ top: scrollY + off, behavior: reduced ? 'auto' : 'smooth' }); }
              return;
            }
            const t = document.getElementById(id.slice(1));
            if (t && Math.abs(t.getBoundingClientRect().top - (lenis ? 20 : 0)) > 40) goToHash(id);
          });
        };
        const later = () => { setTimeout(realign, 300); setTimeout(realign, 2000); setTimeout(realign, 4500); };
        if (document.readyState === 'complete') { setTimeout(realign, 1600); setTimeout(realign, 4500); }
        else addEventListener('load', later, { once: true });
      });
    }, reduced ? 0 : 500);
  });
  // Tidak menunggu event 'load' (semua aset: logo tenant, CDN, dll.) — cukup
  // foto hero + font siap, maksimal 1,5 dtk. Dulu 'load' / 2,5 dtk.
  if (document.readyState === 'complete' || seenThisSession) boot();
  else {
    let booted = false;
    const go = () => { if (!booted) { booted = true; boot(); } };
    const heroImg = $('.hero__photo');
    const heroReady = !heroImg || heroImg.complete ? Promise.resolve()
      : new Promise((r) => { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); });
    Promise.all([heroReady, document.fonts ? document.fonts.ready : null]).then(go);
    addEventListener('load', go);
    setTimeout(go, 1500); // jaringan lambat: jangan menunggu lebih lama dari ini
  }
  scrollAnims();

  /* -------------------------------------------------------
     Grain dinamis — sesekali "kehilangan sinyal" sebentar.
     Jeda acaknya 25–55 detik, dihitung setelah burst sebelumnya selesai.
     Dilewati saat tab tidak aktif: timer tetap jalan di latar, tanpa
     penjagaan ini antrean burst akan menumpuk lalu meletup sekaligus begitu
     tab dibuka lagi.
     ------------------------------------------------------- */
  // Sementara dimatikan: turbulence cukup sekali di intro (tv-in di CSS).
  // Ubah ke true untuk menyalakan lagi burst berkala.
  const NOISE_BURST = false;
  const noise = $('.noise');
  if (NOISE_BURST && noise && !reduced) {
    // --burst sudah punya nilai bawaan di CSS; dibaca agar panjang timer
    // dan panjang animasi tidak bisa lepas sinkron
    const LEN = parseFloat(getComputedStyle(noise).getPropertyValue('--burst')) || 760;
    const GAP = 25000;    // jeda terpendek antar burst
    const SPREAD = 30000; // tambahan acak di atas GAP
    // Jeda dihitung SETELAH burst selesai, bukan dari awalnya: burst sendiri
    // panjang (11 detik), kalau diukur dari awal maka jeda bersihnya tinggal
    // sisa pengurangan dan grain nyaris tidak pernah tampil normal.
    const queue = () => setTimeout(() => {
      if (document.hidden) { queue(); return; }
      noise.classList.add('is-burst');
      setTimeout(() => { noise.classList.remove('is-burst'); queue(); }, LEN);
    }, GAP + Math.random() * SPREAD);
    queue();
  }
})();

/* ---------------------------------------------------------
   SERVICE WORKER — offline di lokasi acara (sinyal sering mati).
   Didaftarkan setelah load agar tidak berebut bandwidth saat render awal.
   --------------------------------------------------------- */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  // Kirim daftar aset halaman ke worker agar tersimpan untuk offline (lihat
  // handler 'message' di sw.js). data-src ikut dikumpulkan: logo lazy yang
  // belum pernah di-scroll belum punya src. Font Google sengaja tidak ikut —
  // responsnya bervariasi per browser (Vary), sudah ditangani cache runtime.
  addEventListener('load', () => {
    const urls = new Set();
    const add = (v) => { if (v && !v.startsWith('data:')) { try { urls.add(new URL(v, location.href).href); } catch (_) {} } };
    const all = (s) => document.querySelectorAll(s); // di luar IIFE: helper $$ tidak terjangkau
    all('img').forEach((i) => { add(i.getAttribute('src')); add(i.dataset.src); });
    all('img[srcset], source[srcset]').forEach((s) => s.srcset.split(',').forEach((x) => add(x.trim().split(/\s+/)[0])));
    all('script[src]').forEach((s) => add(s.getAttribute('src')));
    const send = () => navigator.serviceWorker.ready.then((reg) => reg.active && reg.active.postMessage({ type: 'precache', urls: [...urls] }));
    // jangan berebut bandwidth dengan intro: tunggu browser senggang
    'requestIdleCallback' in window ? requestIdleCallback(send, { timeout: 8000 }) : setTimeout(send, 4000);
  });
}
