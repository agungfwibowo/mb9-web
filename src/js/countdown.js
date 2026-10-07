import { $, D, esc } from './core.js';
import { nextOpenAt, openDayAt, selectDay } from './jadwal.js';
import { pad } from './denah.js';

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
