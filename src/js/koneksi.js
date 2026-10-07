import { $ } from './core.js';

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
