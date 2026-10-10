/* =========================================================
   MODAL HARI TERAKHIR — dipakai halaman lengkap & /ringkas/. Berdiri
   sendiri (tidak dibundel), gaya disisipkan dari sini.
   - Selama hari terakhir (s/d jam tutup): ajakan "Hari ini hari terakhir".
     Sekali per perangkat.
   - Setelah hari terakhir tutup: ucapan penutup. Sekali per perangkat.
   Halaman lengkap: muncul setelah preloader selesai (.is-loaded).
   Uji: ?akhirdebug=akhir atau ?akhirdebug=selesai (abaikan tanggal & ingatan).
   ========================================================= */
(() => {
  'use strict';
  const D = window.MB9;
  if (!D || !Array.isArray(D.days) || !D.days.length || !window.HTMLDialogElement) return;
  const root = document.documentElement;

  // ---- Fase menurut jam WIB ----
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  const today = `${p.year}-${p.month}-${p.day}`;
  const hhmm = `${p.hour}:${p.minute}`;
  const close = (D.hours && D.hours.close) || '21:00';
  const last = D.days[D.days.length - 1].iso;
  const debug = new URLSearchParams(location.search).get('akhirdebug');
  const phase = debug === 'akhir' || debug === 'selesai' ? debug
    : today === last && hhmm < close ? 'akhir'
    : today > last || (today === last && hhmm >= close) ? 'selesai'
    : null;
  if (!phase) return;

  const KEY = phase === 'akhir' ? 'mb9-akhir' : 'mb9-selesai';
  try { if (!debug && localStorage.getItem(KEY)) return; } catch (_) { return; } // tak bisa diingat → jangan muncul tiap kunjungan

  const title = (D.event && D.event.title) || 'Muslim Berdedikasi 9';
  const jamTutup = close.replace(':', '.');
  const jadwalHash = document.getElementById('jadwal') ? '#jadwal' : '#h-jadwal';
  const C = phase === 'akhir'
    ? {
      kicker: 'Hari terakhir',
      head: `Hari ini hari terakhir ${title}`,
      text: `Buka sampai pukul ${jamTutup} WIB. Jangan lewatkan kajian, layanan gratis, dan bazarnya — sampai jumpa di lokasi, InsyaAllah.`,
      cta: ['Lihat jadwal hari ini', jadwalHash],
    }
    : {
      kicker: 'Acara telah selesai',
      head: 'Jazakumullahu khairan',
      text: `Terima kasih atas kehadiran dan dukungan Anda di ${title}. Semoga Allah menerima amal kita semua. Sampai jumpa di acara berikutnya, InsyaAllah.`,
      cta: null,
    };

  // ---- Gaya (rem → ikut ukuran huruf /ringkas/) ----
  const css = document.createElement('style');
  css.textContent = `
.akhir { max-width: min(26rem, calc(100vw - 2rem)); width: 100%; padding: 0; border: 2px solid #2b2b2b; background: #fff; color: #2b2b2b; font-family: var(--sans, 'Public Sans', system-ui, sans-serif); box-shadow: 8px 8px 0 #2b2b2b; }
.akhir::backdrop { background: rgba(20, 20, 20, .55); }
.akhir__head { display: flex; align-items: center; gap: .6rem; margin: 0; padding: .75rem 1rem; background: #2b2b2b; color: #c5fa01; font: 700 .8rem/1.2 var(--mono, 'Roboto Mono', ui-monospace, monospace); letter-spacing: .08em; text-transform: uppercase; }
.akhir__head::before { content: ''; flex: none; width: .6rem; height: .6rem; background: currentColor; }
.akhir__body { padding: 1.25rem 1.25rem 1.4rem; }
.akhir h2 { margin: 0 0 .6rem; font-size: 1.5rem; line-height: 1.2; font-weight: 800; }
.akhir__body p { margin: 0; font-size: 1rem; line-height: 1.55; color: #444; }
.akhir__actions { display: grid; gap: .6rem; margin-top: 1.25rem; }
.akhir__actions a, .akhir__actions button { display: flex; align-items: center; justify-content: center; min-height: 3rem; padding: .7rem 1rem; border: 2px solid #2b2b2b; font: 700 1rem/1.2 var(--sans, 'Public Sans', system-ui, sans-serif); text-decoration: none; cursor: pointer; }
.akhir__actions a { background: #c5fa01; color: #2b2b2b; }
.akhir__actions button { background: #fff; color: #2b2b2b; }
.akhir__actions a:hover, .akhir__actions button:hover { background: #2b2b2b; color: #c5fa01; }`;
  document.head.append(css);

  // ---- Markup ----
  const dlg = document.createElement('dialog');
  dlg.className = 'akhir';
  dlg.setAttribute('aria-labelledby', 'akhirTitle');
  const head = Object.assign(document.createElement('p'), { className: 'akhir__head', textContent: C.kicker });
  const body = Object.assign(document.createElement('div'), { className: 'akhir__body' });
  const h2 = Object.assign(document.createElement('h2'), { id: 'akhirTitle', textContent: C.head });
  const txt = Object.assign(document.createElement('p'), { textContent: C.text });
  const actions = Object.assign(document.createElement('div'), { className: 'akhir__actions' });
  if (C.cta) actions.append(Object.assign(document.createElement('a'), { href: C.cta[1], textContent: C.cta[0] }));
  actions.append(Object.assign(document.createElement('button'), { type: 'button', textContent: C.cta ? 'Nanti saja' : 'Tutup' }));
  body.append(h2, txt, actions);
  dlg.append(head, body);
  document.body.append(dlg);

  // Tombol apa pun menutup modal; tautan jadwal lanjut ke penangan gulir
  // halaman (lenis.js di halaman lengkap, anchor biasa di /ringkas/).
  actions.addEventListener('click', (e) => { if (e.target.closest('a, button')) dlg.close(); });
  // ketuk di luar kotak (backdrop) = tutup
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  const show = () => {
    if (dlg.open || document.querySelector('dialog[open]')) return; // dialog lain sedang terbuka → kunjungan berikutnya
    try { if (!debug) localStorage.setItem(KEY, '1'); } catch (_) { /* mode privat */ }
    dlg.showModal();
    actions.lastElementChild.focus({ preventScroll: true }); // jangan langsung fokus ke tautan
  };
  const DELAY = 700;
  // Halaman lengkap: tunggu preloader & intro (root.is-loaded, intro.js)
  if (!document.querySelector('.preloader') || root.classList.contains('is-loaded')) setTimeout(show, DELAY);
  else {
    const mo = new MutationObserver(() => {
      if (!root.classList.contains('is-loaded')) return;
      mo.disconnect();
      setTimeout(show, DELAY);
    });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
  }
})();
