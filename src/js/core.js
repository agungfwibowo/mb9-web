/* ---------------------------------------------------------
   CORE — helper DOM, preferensi pengguna, data hari acara, dan state
   yang dipakai lintas modul.
   --------------------------------------------------------- */
export const D = window.MB9;
export const $ = (s, c = document) => c.querySelector(s);
export const $$ = (s, c = document) => [...c.querySelectorAll(s)];
export const root = document.documentElement;
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const hasGsap = !!(window.gsap && window.ScrollTrigger);
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// tautan yang dibagikan tidak perlu menampilkan "index.html" — cukup domain/path
export const stripIndex = (p) => p.replace(/\/index\.html$/, '/');

// Instance Lenis (smooth scroll). Dibuat di lenis.js, tapi dipakai modul yang
// berjalan lebih dulu (bagikan, jadwal, denah, …) — selalu di dalam callback,
// jadi cukup live binding: null sampai setLenis() dipanggil.
export let lenis = null;
export const setLenis = (l) => { lenis = l; };

// Lengkapi days dari iso: short "Rabu", date "23 Des", year "2026", full "Rabu, 23 Desember 2026"
const HARI = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
export const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
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
export const bootHash = (() => {
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
export const bootBooth = (() => {
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
export let userScrolled = false;
if (bootHash || bootBooth) {
  const mark = () => { userScrolled = true; };
  addEventListener('wheel', mark, { passive: true, once: true });
  addEventListener('touchmove', mark, { passive: true, once: true });
  // klik/ketuk apa pun (mis. tautan jadwal di tooltip tenda) = pengunjung mengambil
  // alih → koreksi posisi saat load tidak boleh menarik balik ke tujuan awal
  addEventListener('pointerdown', mark, { passive: true, once: true });
  addEventListener('keydown', (e) => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) mark(); });
}

if (hasGsap) {
  gsap.registerPlugin(ScrollTrigger);
  // HP: abaikan resize kecil akibat address bar muncul/hilang agar ScrollTrigger tidak refresh terus
  ScrollTrigger.config({ ignoreMobileResize: true });
  root.classList.add('gsap-ready');
}
