import { $, $$, D, esc, lenis, reduced } from './core.js';
import { lockNav } from './navbar.js';
import { lazyWatch, track } from './konten.js';
import { everyMinute, fmtMin, moveRail, openDayAt, panel, selectDay, toMin, wibNow } from './jadwal.js';

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
if (soonN) agrid.insertAdjacentHTML('afterend', '<p class="asatidz__note">Daftar asatidz InsyaAllah segera diumumkan</p>');
// Badge di foto kartu asatidz yang punya jadwal HARI INI (sejak 00:00 WIB s/d
// jam tutup, lihat openDayAt): "Hari ini · 16.00" sebelum mulai → "Berlangsung"
// (+ garis tepi) saat kajiannya jalan → "Selesai" setelahnya. Cek tiap menit.
const markAsatidzLive = () => {
  const now = wibNow();
  const day = openDayAt(Date.now());
  const st = new Map(); // id → { live, next (menit mulai terdekat), akhwat }
  ((day && D.jadwal && D.jadwal[day.key]) || []).forEach((r) => {
    const [a, b] = r.time.split(' - ').map(toMin);
    [].concat(r.ustadz || []).forEach((id) => {
      // t = jam sesi yang dituju badge: yang berjalan › terdekat › terakhir selesai
      const o = st.get(id) || { live: false, next: null, akhwat: false, t: '', tNext: '', tDone: '' };
      if (now.min >= a && now.min < b) { o.live = true; o.akhwat = !!r.akhwat; o.t = r.time; }
      else if (now.min < a) { if (o.next === null || a < o.next) { o.next = a; o.tNext = r.time; } }
      else o.tDone = r.time;
      st.set(id, o);
    });
  });
  $$('.ustadz[data-id]', agrid).forEach((card) => {
    const o = st.get(card.dataset.id);
    const live = !!o && o.live;
    card.classList.toggle('is-live', live);
    card.classList.toggle('is-pink', live && o.akhwat);
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
  sortAsatidz(st);
};
// Urutan kartu: Berlangsung › hari ini belum mulai (jam terdekat dulu) › hari ini
// sudah selesai › tanpa jadwal hari ini (urutan data) › "InsyaAllah menyusul" ›
// akhwat tanpa jadwal hari ini (selalu paling kanan).
// DOM-nya yang dipindah (bukan CSS order) agar margin kartu pertama/terakhir &
// urutan Tab tetap benar. Hanya disentuh bila urutannya memang berubah.
const baseOrder = $$('.ustadz', agrid);
const sortAsatidz = (st) => {
  const rank = (card) => {
    const o = card.dataset.id && st.get(card.dataset.id);
    if (card.classList.contains('ustadz--soon')) return [4, 0];
    if (!o) return card.classList.contains('ustadz--akhwat') ? [5, 0] : [3, 0];
    return o.live ? [0, 0] : o.next !== null ? [1, o.next] : [2, 0];
  };
  const sorted = baseOrder.map((card, i) => ({ card, i, r: rank(card) }))
    .sort((x, y) => x.r[0] - y.r[0] || x.r[1] - y.r[1] || x.i - y.i)
    .map((x) => x.card);
  const now = [...agrid.children].filter((c) => c.classList.contains('ustadz'));
  if (sorted.every((c, i) => c === now[i])) return;
  sorted.forEach((c) => agrid.appendChild(c));
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
// Segera tutup; hari lain: "Hari ke-4".
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
    if (ss.length) return { day: d, a: ss[0][0], st: ['is-wait', `Hari ke-${D.days.indexOf(d) + 1}`] };
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
  addEventListener('pointerup', () => {
    if (!d) return;
    if (d.moved) draggedAt = Date.now();
    d = null;
    el.classList.remove('is-dragging'); // snap aktif lagi → kartu berlabuh
  });
  // klik di akhir seretan (mis. badge kartu) diabaikan
  el.addEventListener('click', (e) => { if (Date.now() - draggedAt < 300) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  el.addEventListener('dragstart', (e) => e.preventDefault()); // gambar tidak ikut terseret
};
dragScroll(agrid);
// Jarak sisi deretan (--ast-pad) agar kartu yang muat penuh (1/2/3…) berada tepat
// di tengah layar saat berlabuh. Hanya bila deretan meluber; kalau semua muat,
// kartu sudah rata tengah lewat margin auto. Saat meluber, lebar kartu sudah
// tetap (HP) atau sudah di batas susutnya (desktop), jadi padding baru tidak
// mengubah ukurannya lagi.
const centerSnap = () => {
  agrid.style.removeProperty('--ast-pad');
  if (agrid.scrollWidth <= agrid.clientWidth) return;
  const cards = $$('.ustadz', agrid);
  const gap = parseFloat(getComputedStyle(agrid).columnGap) || 0; // jarak antar kartu
  const cw = cards[0].offsetWidth, step = cw + gap;
  const W = agrid.clientWidth;
  const k = Math.max(1, Math.floor((W - 32 + gap) / step)); // sisakan ≥16px tiap sisi
  agrid.style.setProperty('--ast-pad', `${Math.round((W - (k * step - gap)) / 2)}px`);
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
