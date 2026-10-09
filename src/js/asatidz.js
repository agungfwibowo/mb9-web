import { $, $$, D, esc, hasGsap, lenis, reduced, root } from './core.js';
import { lockNav } from './navbar.js';
import { lazyWatch, track } from './konten.js';
import { dayLabel, everyMinute, fmtMin, moveRail, openDayAt, panel, selectDay, toMin, wibNow } from './jadwal.js';

// Asatidz
const agrid = $('#asatidzGrid');
const SIL = '<svg class="sil" viewBox="0 0 100 120" preserveAspectRatio="xMidYMax meet" fill="currentColor" aria-hidden="true"><path d="M50 12c-12 0-21 9-21 22 0 8 2 14 5 19 4 6 10 10 16 10s12-4 16-10c3-5 5-11 5-19 0-13-9-22-21-22Z"/><path d="M8 120c0-28 19-48 42-48s42 20 42 48Z"/></svg>';
// siluet akhwat: khimar panjang lurus (wajah & garis lipatan = lubang, tampak warna latar kartu)
const SIL_AKHWAT = '<svg class="sil" viewBox="0 0 100 120" preserveAspectRatio="xMidYMax meet" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="M50 6C38 6 30 16 29 32 28 46 26 56 22 70 17 88 12 104 10 120h80c-2-16-7-32-12-50-4-14-6-24-7-38C70 16 62 6 50 6ZM50 19c-7 0-12 8-12 18 0 12 6 22 12 22s12-10 12-22c0-10-5-18-12-18ZM53 65c10 7 18 15 20 27l-2 28h-2l2-28c-2-11-9-19-18-26Z"/></svg>';
// Selalu minimal 6 kartu: asatidz yang sudah ada tampil duluan, sisanya
// kartu "InsyaAllah menyusul" sampai daftarnya lengkap.
const ASATIDZ_MIN = 6;
const asatidz = D.asatidz || [];
const soonN = Math.max(0, ASATIDZ_MIN - asatidz.length);
// Pemateri akhwat (ustadzah): kartu berlatar pink. Ditandai `akhwat: true` di
// data; tanpa field itu dikenali dari namanya ("Ustadzah ...").
const isAkhwat = (u) => u.akhwat ?? /^ustadzah\b/i.test(u.name || '');
agrid.innerHTML = asatidz.map((u) => `
      <article class="ustadz${isAkhwat(u) ? ' ustadz--akhwat' : ''}"${u.id ? ` data-id="${esc(u.id)}"` : ''}>
        ${u.photo ? `<img class="lazy-img" data-src="${esc(u.photo)}" alt="${esc(u.name)}" decoding="async">` : isAkhwat(u) ? SIL_AKHWAT : SIL}
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
// Kartu yang terlihat UTUH di deretan → .is-front (di HP/tablet tampil ukuran
// penuh, yang terpotong di tepi mengecil; lihat CSS) — jadi menyesuaikan lebar
// layar: HP ±1 kartu penuh, tablet bisa 2–3. Tidak ada yang utuh → yang paling
// banyak terlihat. Ukuran asli (offsetWidth) dipakai, bukan hasil skala.
// Diukur ulang saat digeser & resize.
let frontRaf = 0;
const markFront = () => {
  frontRaf = 0;
  const r = agrid.getBoundingClientRect();
  const cards = $$('.ustadz', agrid);
  const seen = cards.map((c) => {
    const left = r.left + c.offsetLeft - agrid.scrollLeft, w = c.offsetWidth;
    return Math.max(0, Math.min(left + w, r.right) - Math.max(left, r.left)) / (w || 1);
  });
  const full = seen.map((v) => v >= .97);
  if (!full.some(Boolean)) { const i = seen.indexOf(Math.max(...seen)); if (i >= 0) full[i] = true; }
  cards.forEach((c, i) => c.classList.toggle('is-front', full[i]));
};
const queueFront = () => { if (!frontRaf) frontRaf = requestAnimationFrame(markFront); };
agrid.addEventListener('scroll', queueFront, { passive: true });
addEventListener('resize', queueFront);
markFront();
if (soonN) agrid.insertAdjacentHTML('afterend', '<p class="asatidz__note">Daftar asatidz InsyaAllah segera diumumkan</p>');
// Badge di foto kartu asatidz, dari SELURUH jadwal acara (WIB):
// "Berlangsung" (+ garis tepi) saat kajiannya jalan › sesi terdekat yang belum
// mulai: "Hari ini · 16.00" / "Besok · 16.00" / "Sab, 26 Des · 16.00" ›
// "Selesai" hanya setelah sesi terakhirnya di seluruh rangkaian. Cek tiap menit.
const markAsatidzLive = () => {
  const now = Date.now();
  const today = wibNow().iso;
  const st = new Map(); // id → { live, next, done } — tiap sesi { day, time, start, akhwat }
  D.days.forEach((day) => ((D.jadwal && D.jadwal[day.key]) || []).forEach((r) => {
    const [a, b] = r.time.split(' - ').map(toMin);
    const at = (m) => new Date(`${day.iso}T${fmtMin(m).replace('.', ':')}:00+07:00`).getTime();
    const s = { day, time: r.time, start: at(a), akhwat: !!r.akhwat };
    const end = at(b);
    [].concat(r.ustadz || []).forEach((id) => {
      const o = st.get(id) || { live: null, next: null, done: null };
      if (now >= s.start && now < end) o.live = s;
      else if (now < s.start) { if (!o.next || s.start < o.next.start) o.next = s; }
      else if (!o.done || s.start > o.done.start) o.done = s;
      st.set(id, o);
    });
  }));
  $$('.ustadz[data-id]', agrid).forEach((card) => {
    const o = st.get(card.dataset.id);
    const live = !!o && !!o.live;
    card.classList.toggle('is-live', live);
    card.classList.toggle('is-pink', live && o.live.akhwat);
    // badge = tautan ke sesi yang dituju di jadwal (tab dipilih di handler klik agrid)
    const s = !o ? null : o.live || o.next || o.done;
    const badge = (cls, text) => `<a href="#jadwal" class="ustadz__badge ${cls} mono" data-day="${s.day.key}" data-t="${esc(s.time)}" aria-label="${text} — buka jadwalnya">${text}<span class="ustadz__go" aria-hidden="true">Cek jadwal</span></a>`;
    const jam = s && fmtMin(toMin(s.time.split(' - ')[0]));
    const html = !s ? ''
      : live ? badge('jlive', 'Berlangsung')
        : o.next ? (s.day.iso === today ? badge('ustadz__badge--today', `Hari ini · ${jam}`)
          : badge('ustadz__badge--next', `${dayLabel(s.day, today)} · ${jam}`))
          : badge('ustadz__badge--done', 'Selesai');
    const old = card.querySelector(':scope > .ustadz__badge');
    if (old && old.outerHTML === html) return;
    if (old) old.remove();
    if (html) card.insertAdjacentHTML('beforeend', html);
  });
  sortAsatidz(st, today);
};
// Urutan kartu: Berlangsung › hari ini belum mulai (jam terdekat dulu) › sesi
// hari berikutnya (terdekat dulu) › sudah selesai semua › tanpa jadwal (urutan
// data) › "InsyaAllah menyusul" › akhwat tanpa jadwal (selalu paling kanan).
// DOM-nya yang dipindah (bukan CSS order) agar margin kartu pertama/terakhir &
// urutan Tab tetap benar. Hanya disentuh bila urutannya memang berubah.
const baseOrder = $$('.ustadz', agrid);
const sortAsatidz = (st, today) => {
  const rank = (card) => {
    const o = card.dataset.id && st.get(card.dataset.id);
    if (card.classList.contains('ustadz--soon')) return [5, 0];
    if (!o) return card.classList.contains('ustadz--akhwat') ? [6, 0] : [4, 0];
    return o.live ? [0, 0] : o.next ? [o.next.day.iso === today ? 1 : 2, o.next.start] : [3, 0];
  };
  const sorted = baseOrder.map((card, i) => ({ card, i, r: rank(card) }))
    .sort((x, y) => x.r[0] - y.r[0] || x.r[1] - y.r[1] || x.i - y.i)
    .map((x) => x.card);
  const now = [...agrid.children].filter((c) => c.classList.contains('ustadz'));
  if (sorted.every((c, i) => c === now[i])) return;
  sorted.forEach((c) => agrid.appendChild(c));
  queueFront(); // urutan berubah → kartu depan diukur ulang
  // kartu terdepan terlihat — tapi jangan ganggu yang sedang menggeser deretan
  const r = agrid.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) agrid.scrollLeft = 0;
};
// klik badge → pilih tab hari itu dulu (gulir ke #jadwal oleh handler anchor
// umum), lalu acara ustadz itu berkedip di tampilan yang sedang terbuka:
// Tabel → barisnya; Durasi → kartunya (baris kartu digeser ke sana dulu).
// Buka sebuah acara di jadwal: pilih tab hari itu, cari elemennya (find(panel)),
// buka kartunya di Durasi bila tertutup, gulir hingga di tengah layar, lalu
// berkedip 4×. Dipakai badge asatidz & tooltip tenda di denah. false = tak ketemu.
let flashTimer = 0;
export const focusSession = (dayKey, find) => {
  const btn = $(`#tab-${dayKey}`);
  if (!btn) return false;
  selectDay(btn);
  const el = find(panel);
  if (!el) return false;
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
    lockNav(1400);
    if (lenis) lenis.scrollTo(y, { duration: 1, onComplete: () => lockNav(250) });
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
  return true;
};
agrid.addEventListener('click', (e) => {
  const a = e.target.closest('.ustadz__badge[data-day]');
  if (!a) return;
  const id = a.closest('.ustadz').dataset.id;
  // tak ketemu → biarkan handler anchor umum menggulir ke #jadwal
  if (focusSession(a.dataset.day, (pn) => $$('[data-ustadz]', pn).find((x) => x.dataset.ustadz.split(' ').includes(id) && x.dataset.t === a.dataset.t))) {
    e.preventDefault();
    e.stopPropagation();
  }
});
// Butir di kartu Layanan jadi tautan ke sesi terdekat yang belum selesai:
// hari ini bila masih ada, kalau tidak hari acara berikutnya yang memuatnya.
// Semua sesinya sudah lewat → teks biasa. Dicek tiap menit (ikut ganti hari).
// Label hari ini mengikuti jadwal (markLive): Buka 10.00 › Segera buka › Buka ›
// Segera tutup; hari lain: "Besok" / "Sab, 26 Des" (dayLabel).
const SOON = 30;
const sessOf = (day, kw) => ((D.jadwal && D.jadwal[day.key]) || [])
  .filter((r) => r.title.toLowerCase().includes(kw)).map((r) => r.time.split(' - ').map(toMin));
const targetOf = (kw) => {
  const now = wibNow();
  const today = openDayAt(Date.now());
  if (today) {
    const ss = sessOf(today, kw).filter(([, b]) => b > now.min).sort((p, q) => p[0] - q[0]);
    const s = ss.find(([x]) => now.min >= x) || ss[0];
    if (s) {
      const [a, b] = s;
      const st = now.min < a ? (a - now.min <= SOON ? ['is-starting', 'Segera buka'] : ['is-wait', `Buka ${fmtMin(a)}`])
        : b - now.min <= SOON ? ['is-soon', 'Segera tutup'] : ['is-open', 'Buka'];
      return { day: today, a, st };
    }
  }
  for (const d of D.days) {
    if (d.iso <= now.iso) continue;
    const ss = sessOf(d, kw).sort((p, q) => p[0] - q[0]);
    if (ss.length) return { day: d, a: ss[0][0], st: ['is-wait', dayLabel(d, now.iso)] };
  }
  return null;
};
const syncLayananLinks = () => $$('.lcard__go[data-cari]', track).forEach((a) => {
  const t = targetOf(a.dataset.cari);
  if (t) a.setAttribute('href', '#jadwal'); else a.removeAttribute('href');
  const html = t ? `<span class="jopen mono ${t.st[0]}">${t.st[1]}</span>` : '';
  const old = a.nextElementSibling;
  if ((old ? old.outerHTML : '') === html) return;
  if (old) old.remove();
  if (html) a.insertAdjacentHTML('afterend', html);
});
syncLayananLinks();
everyMinute(syncLayananLinks);
// klik → buka tab hari sasaran, gulir ke sesinya & kedipkan
track.addEventListener('click', (e) => {
  const a = e.target.closest('.lcard__go[href]');
  if (!a) return;
  const kw = a.dataset.cari;
  const t = targetOf(kw);
  if (!t) return;
  const ok = focusSession(t.day.key, (pn) => $$('.jrow[data-t], .jcard__item[data-t]:not([data-gap])', pn)
    .find((x) => toMin(x.dataset.t.split(' - ')[0]) === t.a && ($('h3 span', x)?.textContent || '').toLowerCase().includes(kw)));
  if (ok) { e.preventDefault(); e.stopPropagation(); }
});
if (agrid.querySelector('.ustadz[data-id]')) { markAsatidzLive(); everyMinute(markAsatidzLive); }
// Deretan kartu Layanan yang di-pin GSAP di HP: kartu digerakkan
// gulir halaman (lihat scrollAnims). Geser jari ke kiri/kanan diterjemahkan jadi
// gulir halaman yang setara → kartu ikut bergeser & tetap sinkron dengan gulir
// atas/bawah. pinSwipe[key] diisi blok GSAP selama pin aktif (perPx = px gulir
// halaman per 1px geser kartu).
export const pinSwipe = {};
const swipeToScroll = (el, key) => {
  let sw = null, draggedAt = 0;
  el.addEventListener('pointerdown', (e) => {
    // khusus HP (layar ≤860px, sentuh)
    sw = e.pointerType === 'touch' && pinSwipe[key] && matchMedia('(max-width: 860px)').matches ? { x: e.clientX, y: e.clientY, y0: scrollY, lock: null } : null;
  });
  el.addEventListener('pointermove', (e) => {
    if (!sw || !pinSwipe[key]) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if (!sw.lock && Math.max(Math.abs(dx), Math.abs(dy)) > 8) sw.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (sw.lock !== 'x') return;
    const y = Math.max(0, sw.y0 - dx * pinSwipe[key].perPx());
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo({ top: y, behavior: 'instant' });
  });
  const end = () => { if (sw && sw.lock === 'x') draggedAt = Date.now(); sw = null; };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  // klik bawaan di akhir geseran (mis. badge / tombol kartu) diabaikan
  el.addEventListener('click', (e) => { if (Date.now() - draggedAt < 400) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
};
// Posisi gulir berlabuh terdekat (kartu rata --ast-pad, sama dengan CSS snap).
// dir: 1 = condong ke kanan, -1 = ke kiri, 0 = yang paling dekat.
const snapLeft = (el, dir = 0) => {
  const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
  const max = el.scrollWidth - el.clientWidth;
  const cur = el.scrollLeft;
  const pts = $$('.ustadz', el).map((c) => Math.min(max, Math.max(0, c.offsetLeft - pad)));
  // seretan pendek (< 1/5 kartu) tetap di kartu terdekat
  const near = pts.reduce((a, b) => (Math.abs(b - cur) < Math.abs(a - cur) ? b : a), 0);
  if (!dir) return near;
  const step = (pts[1] ?? pts[0]) - pts[0] || 1;
  if (Math.abs(near - cur) < step / 5) return near;
  const pick = dir > 0 ? pts.filter((x) => x >= cur).sort((a, b) => a - b)[0] : pts.filter((x) => x <= cur).sort((a, b) => b - a)[0];
  return pick ?? near;
};
// Asatidz: deretan digeser biasa (overflow-x, scrollbar disembunyikan). Sentuh &
// trackpad sudah bisa; mouse tidak (roda hanya vertikal) → bisa diseret.
const dragScroll = (el) => {
  let d = null, draggedAt = 0;
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || el.scrollWidth <= el.clientWidth) return;
    d = { x: e.clientX, left: el.scrollLeft, moved: false };
  });
  addEventListener('pointermove', (e) => {
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 5) { d.moved = true; el.classList.add('is-dragging'); }
    if (d.moved) el.scrollLeft = d.left - dx;
  });
  addEventListener('pointerup', (e) => {
    if (!d) return;
    const dx = e.clientX - d.x;
    if (d.moved) draggedAt = Date.now();
    d = null;
    if (!el.classList.contains('is-dragging')) return;
    // snap tidak selalu dipasang ulang browser setelah dimatikan (Safari) →
    // labuhkan sendiri ke kartu terdekat searah seretan, baru snap diaktifkan lagi
    el.scrollTo({ left: snapLeft(el, -Math.sign(dx)), behavior: reduced ? 'auto' : 'smooth' });
    const done = () => { clearTimeout(t); el.removeEventListener('scrollend', done); el.classList.remove('is-dragging'); };
    const t = setTimeout(done, 600);
    el.addEventListener('scrollend', done);
  });
  // klik di akhir seretan (mis. badge kartu) diabaikan
  el.addEventListener('click', (e) => { if (Date.now() - draggedAt < 300) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  el.addEventListener('dragstart', (e) => e.preventDefault()); // gambar tidak ikut terseret
};
dragScroll(agrid);
// Jaring pengaman: gulir jari/trackpad yang berhenti di luar titik labuh (snap
// browser kadang meleset setelah urutan kartu berubah) → labuhkan ke terdekat.
// Safari lama tak punya 'scrollend' → cadangan: 180ms setelah 'scroll' terakhir.
const settle = () => {
  if (agrid.classList.contains('is-dragging')) return;
  const x = snapLeft(agrid);
  if (Math.abs(x - agrid.scrollLeft) > 2) agrid.scrollTo({ left: x, behavior: reduced ? 'auto' : 'smooth' });
};
if ('onscrollend' in window) agrid.addEventListener('scrollend', settle);
else {
  let settleT = 0;
  agrid.addEventListener('scroll', () => { clearTimeout(settleT); settleT = setTimeout(settle, 180); }, { passive: true });
}
// Labuhkan deretan ke kartu ke-i (default: terdekat) TANPA snap browser.
// Snap browser memakai kotak kartu SETELAH transform — selama animasi masuk
// GSAP (scale/rotateX) titik labuhnya bergeser, dan setelah animasi selesai
// Chrome tidak melabuhkan ulang → kartu pertama tertinggal menempel di tepi.
// Posisi dihitung dari offsetLeft (tata letak, kebal transform); snap
// dimatikan sebentar agar tidak ikut menarik, lalu dinyalakan lagi.
// Snap browser baru dinyalakan setelah animasi masuk kartu selesai (lihat bawah).
let entered = !(hasGsap && !reduced);
export const realignAsatidz = (i) => {
  const cards = $$('.ustadz', agrid);
  const snapOn = () => { if (entered) requestAnimationFrame(() => requestAnimationFrame(() => { agrid.style.scrollSnapType = ''; })); };
  if (!cards.length || agrid.scrollWidth <= agrid.clientWidth) { snapOn(); return; }
  agrid.style.scrollSnapType = 'none';
  const pad = parseFloat(getComputedStyle(agrid).scrollPaddingLeft) || 0;
  agrid.scrollLeft = i == null ? snapLeft(agrid)
    : Math.min(agrid.scrollWidth - agrid.clientWidth, Math.max(0, cards[i].offsetLeft - pad));
  snapOn();
};
// Sampai animasi masuk selesai (intro.js → asatidzEntered), snap browser
// dimatikan: kalau tidak, ia berlabuh ke titik yang bergeser oleh transform
// animasi dan kartu pertama tampak menempel di tepi kiri.
if (!entered) agrid.style.scrollSnapType = 'none';
export const asatidzEntered = () => { entered = true; realignAsatidz(); };
// Jarak sisi deretan (--ast-pad) agar kartu yang muat penuh (1/2/3…) berada tepat
// di tengah layar saat berlabuh. Hanya bila deretan meluber; kalau semua muat,
// kartu sudah rata tengah lewat margin auto. Lebar kartu & deretan tidak
// bergantung pada padding, jadi dihitung tanpa melepas --ast-pad: dulu
// dilepas-pasang tiap resize — di iOS resize terjadi terus selama halaman
// digulir (bilah alamat), dan di sela itu Safari melabuhkan ulang deretan ke
// posisi tanpa padding → kartu paling kiri menempel di tepi layar.
const centerSnap = () => {
  const cards = $$('.ustadz', agrid);
  if (!cards.length) return;
  const cs = getComputedStyle(agrid);
  const gap = parseFloat(cs.columnGap) || 0; // jarak antar kartu
  const cw = cards[0].offsetWidth, step = cw + gap;
  const W = agrid.clientWidth;
  // --gutter berisi clamp() → baca nilai jadinya dari padding .container
  const gutter = parseFloat(getComputedStyle($('.asatidz .container') || root).paddingLeft) || 16;
  const overflow = cards.length * step - gap + 2 * gutter > W;
  const k = Math.max(1, Math.floor((W - 32 + gap) / step)); // sisakan ≥16px tiap sisi
  const pad = overflow ? `${Math.round((W - (k * step - gap)) / 2)}px` : '';
  if (agrid.style.getPropertyValue('--ast-pad') === pad) return; // tak berubah → jangan sentuh
  // Padding berubah → Chrome melabuhkan ulang deretan sendiri ke posisi yang
  // salah (kartu pertama menempel di tepi). Maka snap dimatikan sebentar,
  // kartu yang sedang di depan dipasang langsung di posisi labuhnya (tanpa
  // animasi), baru snap dinyalakan lagi — posisinya sudah pas, tak bergeser.
  const oldPad = parseFloat(cs.scrollPaddingLeft) || 0;
  const at = cards.reduce((best, c, i) => (Math.abs(c.offsetLeft - oldPad - agrid.scrollLeft) < Math.abs(cards[best].offsetLeft - oldPad - agrid.scrollLeft) ? i : best), 0);
  if (pad) agrid.style.setProperty('--ast-pad', pad); else agrid.style.removeProperty('--ast-pad');
  realignAsatidz(at);
};
centerSnap();
addEventListener('resize', centerSnap);
addEventListener('load', centerSnap);
// Nama asatidz di jadwal → gulir ke section Asatidz, deretan kartunya digeser
// sampai kartu itu di tengah, lalu kartunya berkedip.
const goToUstadz = (id) => {
  const card = $(`.ustadz[data-id="${CSS.escape(id)}"]`, agrid);
  if (!card) return false;
  const flash = () => {
    card.classList.remove('is-flash');
    void card.offsetWidth; // ulang animasi bila diklik lagi
    card.classList.add('is-flash');
    card.addEventListener('animationend', () => card.classList.remove('is-flash'), { once: true });
  };
  agrid.scrollTo?.({ left: card.offsetLeft - (agrid.clientWidth - card.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
  const y = $('#asatidz').getBoundingClientRect().top + scrollY - 20;
  lockNav(1600);
  if (lenis) lenis.scrollTo(y, { duration: 1.2, onComplete: () => { lockNav(250); flash(); } });
  else { scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' }); setTimeout(flash, reduced ? 0 : 900); }
  return true;
};
panel.addEventListener('click', (e) => {
  const a = e.target.closest('.jnote-ust[data-ust]');
  if (a && goToUstadz(a.dataset.ust)) { e.preventDefault(); e.stopPropagation(); }
});
if (track) swipeToScroll(track, 'layanan');
