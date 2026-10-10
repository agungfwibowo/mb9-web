/* =========================================================
   HALAMAN TAMPILAN SEDERHANA (/ringkas/) — untuk orang tua & layar
   kecil. Berdiri sendiri (tidak dibundel bersama main.js), tanpa
   animasi. Isi diambil dari window.MB9 (data-prod.js / data-dev.js).
   ========================================================= */
(() => {
  'use strict';
  // Khusus iPad & HP (sama dengan tombol Aa di halaman utama, ≤1080px):
  // dibuka di layar lebar → kembali ke tampilan lengkap.
  if (window.matchMedia('(min-width: 1081px)').matches) { location.replace('../'); return; }
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;

  // ---- Offline: service worker (sama dengan halaman utama) ----
  // Link /ringkas/ yang dibagikan di WA bisa dibuka langsung tanpa pernah
  // mampir ke halaman utama — tanpa pendaftaran di sini, halaman ini tidak
  // tersimpan untuk dibuka saat sinyal mati di lokasi.
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    addEventListener('load', () => navigator.serviceWorker.register('../sw.js').catch(() => {}));
  }

  // ---- Pita status sambungan ----
  const net = $('net'), netText = $('netText');
  const OFFLINE_MSG = 'Tidak ada sinyal — menampilkan info yang tersimpan di HP.';
  let wasOffline = !navigator.onLine, netT = 0;
  const netShow = (on, text, autoHide) => {
    clearTimeout(netT);
    net.classList.toggle('is-on', on);
    netText.textContent = text;
    net.hidden = false;
    if (autoHide) netT = setTimeout(() => { net.hidden = true; }, autoHide);
  };
  $('netClose').addEventListener('click', () => { clearTimeout(netT); net.hidden = true; });
  if (wasOffline) netShow(false, OFFLINE_MSG);
  addEventListener('offline', () => { wasOffline = true; netShow(false, OFFLINE_MSG); });
  addEventListener('online', () => {
    if (!wasOffline) return;
    wasOffline = false;
    netShow(true, 'Sinyal kembali ✓', 3500);
  });

  // ---- Ukuran huruf (A / A+ / A++) — disimpan di perangkat ----
  const KEY_SIZE = 'mb9-ukuran';
  // Sudah pernah membuka tampilan sederhana → petunjuk di halaman utama
  // (ringkas-hint.js) tidak perlu muncul lagi
  try { localStorage.setItem('mb9-ringkas-hint', '1'); } catch (_) { /* private mode */ }
  const sizeBtns = [...document.querySelectorAll('.ukuran button')];
  const setSize = (n, save) => {
    if (!['1', '2', '3'].includes(n)) n = '1';
    if (n === '1') root.removeAttribute('data-ukuran'); else root.dataset.ukuran = n;
    sizeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ukuran === n)));
    if (save) try { localStorage.setItem(KEY_SIZE, n); } catch (_) { /* private mode */ }
  };
  try { setSize(localStorage.getItem(KEY_SIZE) || '1'); } catch (_) { /* storage diblokir */ }
  sizeBtns.forEach((b) => b.addEventListener('click', () => setSize(b.dataset.ukuran, true)));

  const D = window.MB9;
  if (!D || !Array.isArray(D.days) || !D.days.length) return;

  // ---- Tanggal & jam (WIB) ----
  const wibNow = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { iso: `${p.year}-${p.month}-${p.day}`, min: +p.hour * 60 + +p.minute };
  };
  const toDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const fmt = (iso, opt) => new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', ...opt }).format(toDate(iso)).replace('Minggu', 'Ahad');
  const hari = (iso) => fmt(iso, { weekday: 'long' });
  const tglPanjang = (iso) => fmt(iso, { weekday: 'long', day: 'numeric', month: 'long' });
  const jam = (hhmm) => String(hhmm).replace(':', '.');
  const menit = (s) => { const m = /(\d{1,2})[.:](\d{2})/.exec(s || ''); return m ? +m[1] * 60 + +m[2] : null; };
  const selisihHari = (a, b) => Math.round((toDate(b) - toDate(a)) / 864e5);

  const open = D.hours ? jam(D.hours.open) : '08.00';
  const close = D.hours ? jam(D.hours.close) : '21.00';

  // Kartu info selalu memakai tanggal ASLI (data-dev.js menyimpannya di prodDays)
  const ev = D.prodDays || D.days;
  const a = ev[0].iso, b = ev[ev.length - 1].iso;
  const bulanTahun = (iso) => fmt(iso, { month: 'long', year: 'numeric' });
  const rentang = a.slice(0, 7) === b.slice(0, 7)
    ? `${+a.slice(8)} – ${+b.slice(8)} ${bulanTahun(a)}`
    : `${fmt(a, { day: 'numeric', month: 'long' })} – ${fmt(b, { day: 'numeric', month: 'long', year: 'numeric' })}`;
  $('tanggal').innerHTML = '';
  $('tanggal').append(rentang, Object.assign(document.createElement('small'), { textContent: `${hari(a)} – ${hari(b)}` }));
  $('jam').firstChild.nodeValue = `${open} – ${close} WIB`;

  // ---- Kontak ----
  if (D.hotline && D.hotline.wa) $('wa').href = D.hotline.wa;

  // ---- Status hari ini ----
  // Memakai D.days (bukan prodDays) agar status bisa diuji dengan data-dev.js
  const days = D.days;
  const now = wibNow();
  const idxToday = days.findIndex((d) => d.iso === now.iso);
  const first = days[0].iso, last = days[days.length - 1].iso;
  let status = '';
  if (now.iso < first) {
    const n = selisihHari(now.iso, first);
    status = n === 1 ? `InsyaAllah dimulai besok, pukul ${open} WIB.` : `InsyaAllah dimulai ${n} hari lagi.`;
  } else if (now.iso > last) {
    status = 'Acara telah selesai. Jazakumullahu khairan atas kehadirannya.';
  } else if (idxToday >= 0) {
    const o = menit(open), c = menit(close);
    if (now.min < o) status = `Hari ini buka pukul ${open} WIB.`;
    else if (now.min < c) status = `Sedang berlangsung — buka sampai pukul ${close} WIB.`;
    else status = idxToday < days.length - 1 ? `Hari ini sudah tutup. Besok buka lagi pukul ${open} WIB.` : 'Acara telah selesai. Jazakumullahu khairan atas kehadirannya.';
  }
  $('status').textContent = status;

  // ---- Jadwal per hari ----
  const J = D.jadwal || {};
  const ustadzById = Object.fromEntries((D.asatidz || []).map((u) => [u.id, u.name]));
  const adaJadwal = days.some((d) => (J[d.key] || []).length);
  let cur = idxToday >= 0 ? idxToday : 0;

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  const render = () => {
    const d = days[cur];
    $('hariNama').textContent = tglPanjang(d.iso);
    $('hariKe').textContent = d.iso === now.iso ? `Hari ke-${cur + 1} · Hari ini` : `Hari ke-${cur + 1} dari ${days.length}`;
    $('hariPrev').disabled = cur === 0;
    $('hariNext').disabled = cur === days.length - 1;

    // Diurut menurut jam mulai agar mudah dibaca dari atas ke bawah
    const rows = (J[d.key] || []).map((r, i) => ({ r, i, s: menit(r.time) ?? 0 }))
      .sort((x, y) => x.s - y.s || x.i - y.i).map((x) => x.r);
    const list = $('acara');
    list.textContent = '';
    rows.forEach((r) => {
      const li = el('li', r.akhwat ? 'akhwat' : '');
      if (d.iso === now.iso) {
        const [s, e] = String(r.time || '').split('-').map(menit);
        if (s != null && e != null) {
          if (now.min >= s && now.min < e) li.classList.add('now');
          else if (now.min >= e) li.classList.add('lewat');
        }
      }
      const jamEl = el('div', 'acara__jam', `${String(r.time || '').replace(/\s*-\s*/, ' – ')} WIB`);
      if (li.classList.contains('now')) jamEl.append(el('span', 'label', 'Sedang berlangsung'));
      const judul = el('p', 'acara__judul', r.title);
      if (r.akhwat) judul.append(el('span', 'label', 'Khusus Muslimah'));
      li.append(jamEl, judul);
      const ket = [...[].concat(r.ustadz || []).map((id) => ustadzById[id]).filter(Boolean), r.note].filter(Boolean).join(' · ');
      if (ket) li.append(el('p', 'acara__ket', ket));
      list.append(li);
    });
    $('kosong').hidden = rows.length > 0;
    $('kosong').textContent = adaJadwal ? 'Belum ada acara di hari ini.' : 'Jadwal InsyaAllah menyusul.';
  };

  if (adaJadwal) {
    $('hari').hidden = false;
    $('hariPrev').addEventListener('click', () => { if (cur > 0) { cur -= 1; render(); } });
    $('hariNext').addEventListener('click', () => { if (cur < days.length - 1) { cur += 1; render(); } });
    render();
  }

  // ---- Layanan ----
  const L = D.layanan || [];
  if (L.length) {
    const box = $('layanan');
    L.forEach((g) => {
      const card = el('div', 'card layanan');
      const h = el('h3', '', g.title);
      if (g.free !== false) h.append(el('span', 'label', 'GRATIS'));
      card.append(h);
      if (Array.isArray(g.items)) {
        const ul = el('ul');
        g.items.forEach((it) => ul.append(el('li', '', typeof it === 'string' ? it : it.text)));
        card.append(ul);
      }
      // text boleh berisi <b> — tampilkan sebagai teks biasa
      if (g.text) card.append(el('p', '', new DOMParser().parseFromString(g.text, 'text/html').body.textContent));
      box.append(card);
    });
    $('layananSec').hidden = false;
  }
})();
