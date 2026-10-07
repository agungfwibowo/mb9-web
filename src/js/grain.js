import { $, reduced } from './core.js';

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
