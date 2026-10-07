import { $, $$, D, esc, lenis, reduced } from './core.js';
import { lockNav } from './navbar.js';
import { lazyWatch, track } from './konten.js';
import { everyMinute, fmtMin, moveRail, openDayAt, panel, selectDay, toMin, wibNow } from './jadwal.js';

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
if (agrid.querySelector('.ustadz[data-id]')) { markAsatidzLive(); everyMinute(markAsatidzLive); }
// Deretan kartu yang di-pin GSAP (Layanan & Asatidz) di HP: kartu digerakkan
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
swipeToScroll(agrid, 'asatidz');
// Nama asatidz di jadwal → gulir ke kartunya (section Asatidz di-pin: posisi
// gulir dihitung agar kartu itu berada di tengah deretan), lalu kartunya berkedip.
const goToUstadz = (id) => {
  const card = $(`.ustadz[data-id="${CSS.escape(id)}"]`, agrid);
  if (!card) return false;
  const flash = () => {
    card.classList.remove('is-flash');
    void card.offsetWidth; // ulang animasi bila diklik lagi
    card.classList.add('is-flash');
    card.addEventListener('animationend', () => card.classList.remove('is-flash'), { once: true });
  };
  const ps = pinSwipe.asatidz;
  let y;
  if (ps && ps.perPx()) {
    // geser track yang dibutuhkan agar tengah kartu = tengah layar
    // posisi kartu di dalam deretan (selisih rect → bebas dari geseran saat ini)
    const inTrack = card.getBoundingClientRect().left - agrid.getBoundingClientRect().left;
    const need = Math.max(0, inTrack + card.offsetWidth / 2 - innerWidth / 2);
    y = ps.start() + need * ps.perPx() + 2;
  } else {
    // tanpa pin (layar pendek / tanpa animasi): deretan digeser native ke kartunya
    agrid.scrollTo?.({ left: card.offsetLeft - (agrid.clientWidth - card.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
    y = $('#asatidz').getBoundingClientRect().top + scrollY - 20;
  }
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
