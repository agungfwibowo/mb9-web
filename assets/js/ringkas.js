/* =========================================================
   HALAMAN TAMPILAN SEDERHANA (/ringkas/) — untuk orang tua & layar
   kecil. Berdiri sendiri (tidak dibundel bersama main.js), tanpa
   animasi. Isi diambil dari window.MB9 (data-prod.js / data-dev.js).
   ========================================================= */
(() => {
  'use strict';
  // Khusus iPad & HP (sama dengan tombol Aa di halaman utama, ≤1080px):
  // dibuka di layar lebar → kembali ke tampilan lengkap. Hanya di domain
  // produksi — di localhost/github.io halaman ini tetap bisa diuji di laptop.
  const PROD = ['muslimberdedikasi.com', 'www.muslimberdedikasi.com'];
  if (PROD.includes(location.hostname) && window.matchMedia('(min-width: 1081px)').matches) { location.replace('../'); return; }
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
  // dan pilihan tampilan diingat: kunjungan berikutnya ke halaman utama
  // menawarkan "buka tampilan sederhana lagi". Kembali ke tampilan lengkap
  // lewat tautan di sini = sengaja → tawaran tidak muncul di sesi ini.
  try {
    localStorage.setItem('mb9-ringkas-hint', '1');
    localStorage.setItem('mb9-view', 'ringkas');
  } catch (_) { /* private mode */ }
  document.querySelectorAll('a[href="../"]').forEach((a) => a.addEventListener('click', () => {
    try { sessionStorage.setItem('mb9-view-skip', '1'); } catch (_) { /* private mode */ }
  }));
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

  // ---- Status hari ini & jadwal per hari ----
  // Memakai D.days (bukan prodDays) agar status bisa diuji dengan data-dev.js.
  // Dihitung ulang tiap menit (dan saat tab kembali dibuka): halaman sering
  // dibiarkan terbuka di HP — lewat jam tutup / tengah malam, status & hari
  // jadwal ikut berganti sendiri, sama seperti tab hari di halaman lengkap.
  const days = D.days;
  const first = days[0].iso, last = days[days.length - 1].iso;
  const oMin = menit(open), cMin = menit(close);
  let now = wibNow();
  const closed = () => now.min >= cMin;
  // Hari otomatis: hari ini selama belum lewat jam tutup, selain itu hari
  // berikutnya yang belum lewat (seperti autoIdx di jadwal.js). Acara sudah
  // selesai semua → tetap di hari terakhir, bukan kembali ke hari pertama.
  const autoIdx = () => {
    const i = days.findIndex((d) => d.iso > now.iso || (d.iso === now.iso && !closed()));
    return i >= 0 ? i : days.length - 1;
  };
  const statusText = () => {
    const idxToday = days.findIndex((d) => d.iso === now.iso);
    if (now.iso < first) {
      const n = selisihHari(now.iso, first);
      return n === 1 ? `InsyaAllah dimulai besok, pukul ${open} WIB.` : `InsyaAllah dimulai ${n} hari lagi.`;
    }
    if (now.iso > last) return 'Acara telah selesai. Jazakumullahu khairan atas kehadirannya.';
    if (idxToday < 0) return '';
    if (now.min < oMin) return `Hari ini buka pukul ${open} WIB.`;
    if (now.min < cMin) return `Sedang berlangsung — buka sampai pukul ${close} WIB.`;
    return idxToday < days.length - 1 ? `Hari ini sudah tutup. Besok buka lagi pukul ${open} WIB.` : 'Acara telah selesai. Jazakumullahu khairan atas kehadirannya.';
  };

  const J = D.jadwal || {};
  const ustadzById = Object.fromEntries((D.asatidz || []).map((u) => [u.id, u.name]));
  const adaJadwal = days.some((d) => (J[d.key] || []).length);
  let cur = autoIdx();
  let chosen = null; // hari yang dipilih sendiri lewat tombol ‹ ›

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

  $('status').textContent = statusText();
  if (adaJadwal) {
    $('hari').hidden = false;
    const go = (i) => { cur = i; chosen = days[cur].key; render(); };
    $('hariPrev').addEventListener('click', () => { if (cur > 0) go(cur - 1); });
    $('hariNext').addEventListener('click', () => { if (cur < days.length - 1) go(cur + 1); });
    render();
  }

  // Tiap menit: status, penanda "Sedang berlangsung"/lewat, dan hari otomatis.
  // Hari pilihan sendiri dipertahankan selama bukan hari otomatis lama dan
  // belum lewat; selain itu ikut pindah ke hari otomatis yang baru.
  const tick = () => {
    const prevAuto = days[autoIdx()].key;
    now = wibNow();
    const auto = autoIdx();
    if (days[auto].key !== prevAuto) {
      const ci = days.findIndex((d) => d.key === chosen);
      const keep = ci >= 0 && chosen !== prevAuto && ci >= auto;
      cur = keep ? ci : auto;
      if (!keep) chosen = null;
    }
    $('status').textContent = statusText();
    if (adaJadwal) render();
  };
  const toNextMinute = () => setTimeout(() => { tick(); toNextMinute(); }, 60000 - (Date.now() % 60000) + 50);
  toNextMinute();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });

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
  // ---- Tenant & penyelenggara: deretan geser horizontal + panah ‹ › ----
  // Path gambar di data relatif ke akar situs → diawali "../".
  const SVG = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const pad2 = (n) => String(n).padStart(2, '0');
  const tendaOf = {};
  (D.placements || []).forEach(([name, from, to = from]) => {
    (tendaOf[name] = tendaOf[name] || []).push(from === to ? pad2(from) : `${pad2(from)}–${pad2(to)}`);
  });
  const links = D.links || {};
  // Latar kotak logo tenant menyesuaikan logonya — sama dengan tampilan lengkap
  // (src/js/tenant.js): tepi berwarna solid → kotak memakai warna itu; tepi
  // transparan → hitam bila bagian putih logo lebih banyak dari bagian
  // hitamnya, selain itu putih. Logo bertanda 'dark' di data tetap hitam.
  const sampleBg = (img) => {
    const N = 40;
    const c = document.createElement('canvas');
    c.width = c.height = N;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, N, N);
    const px = ctx.getImageData(0, 0, N, N).data;
    const at = (x, y) => { const i = (y * N + x) * 4; return [px[i], px[i + 1], px[i + 2], px[i + 3]]; };
    const edge = [];
    for (let i = 0; i < N; i++) edge.push(at(i, 0), at(i, N - 1), at(0, i), at(N - 1, i));
    const solid = edge.filter((p) => p[3] > 220);
    if (solid.length > edge.length * .85) {
      const avg = [0, 1, 2].map((k) => solid.reduce((t, p) => t + p[k], 0) / solid.length);
      const spread = solid.reduce((t, p) => t + Math.abs(p[0] - avg[0]) + Math.abs(p[1] - avg[1]) + Math.abs(p[2] - avg[2]), 0) / solid.length;
      return spread < 40 ? `rgb(${avg.map(Math.round).join(',')})` : '';
    }
    let putih = 0, hitam = 0;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 128) continue;
      const lum = .2126 * px[i] + .7152 * px[i + 1] + .0722 * px[i + 2];
      if (lum > 225) putih++;
      else if (lum < 40) hitam++;
    }
    return putih > hitam ? 'var(--ink)' : '';
  };
  const fitBg = (img) => {
    const box = img.parentElement;
    if (!box || box.classList.contains('is-dark') || !img.naturalWidth) return;
    try { box.style.backgroundColor = sampleBg(img); } catch (_) { /* canvas diblokir */ }
  };
  // box: wadah .geser; judul: elemen h2/h3; items: [{name, src, tone, sub}];
  // autoBg: latar logo menyesuaikan warnanya (hanya tenant, seperti tampilan lengkap)
  const geser = (box, judul, items, label, autoBg) => {
    const kepala = el('div', 'geser__kepala');
    const panah = el('div', 'panah');
    panah.setAttribute('role', 'group');
    panah.setAttribute('aria-label', `Geser ${label}`);
    const prev = el('button'), next = el('button');
    prev.type = next.type = 'button';
    prev.setAttribute('aria-label', `${label} sebelumnya`);
    next.setAttribute('aria-label', `${label} berikutnya`);
    prev.innerHTML = SVG('M15 5l-7 7 7 7');
    next.innerHTML = SVG('M9 5l7 7-7 7');
    panah.append(prev, next);
    kepala.append(judul, panah);
    const ul = el('ul', 'geser__baris');
    items.forEach((t) => {
      const li = el('li');
      const href = links[t.name];
      const a = el(href ? 'a' : 'div', 'logo');
      if (href) Object.assign(a, { href, target: '_blank', rel: 'noopener' });
      const ph = el('div', `logo__img${t.tone === 'dark' ? ' is-dark' : ''}`);
      const img = Object.assign(document.createElement('img'), { alt: '', loading: 'lazy', decoding: 'async' });
      if (autoBg) img.addEventListener('load', () => fitBg(img), { once: true });
      img.src = `../${t.src}`;
      ph.append(img);
      const nama = el('div', 'logo__nama', t.name);
      if (t.sub) nama.append(el('small', '', t.sub));
      a.append(ph, nama);
      li.append(a);
      ul.append(li);
    });
    box.append(kepala, ul);
    // satu ketukan = geser satu halaman (2 kartu di HP, 3 di tablet)
    const step = (dir) => ul.scrollBy({ left: dir * ul.clientWidth, behavior: 'smooth' });
    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    const sync = () => {
      const max = ul.scrollWidth - ul.clientWidth;
      panah.hidden = max <= 1;
      prev.disabled = ul.scrollLeft <= 1;
      next.disabled = ul.scrollLeft >= max - 1;
    };
    ul.addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync);
    requestAnimationFrame(sync);
    return ul;
  };

  const T = D.tenants || [];
  if (T.length) {
    const h = el('h2', '', 'Tenant');
    h.id = 'h-tenant';
    $('tenantSec').hidden = false;
    const baris = geser($('tenant'), h, T.map(([name, file, tone]) => ({
      name, tone, src: `assets/img/tenant/${file}`, sub: tendaOf[name] ? `Tenda ${tendaOf[name].join(', ')}` : '',
    })), 'Tenant', true);
    baris.classList.add('geser__baris--2');
    $('tenant').after(el('p', 'jumlah', `${T.length} brand di Open Gate Bazar & Foodcourt.`));
    // Geser otomatis 1 kartu tiap 2 detik; di ujung kembali ke awal. Berhenti
    // selama disentuh/digeser/difokus (lanjut 5 detik setelahnya), saat deretan
    // tidak terlihat atau tab disembunyikan, dan bila "kurangi gerakan" aktif.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let terlihat = false, jedaSampai = 0;
      const jeda = () => { jedaSampai = Date.now() + 5000; };
      ['pointerdown', 'touchstart', 'wheel', 'focusin'].forEach((t) => baris.addEventListener(t, jeda, { passive: true }));
      $('tenant').querySelectorAll('.panah button').forEach((b) => b.addEventListener('click', jeda));
      new IntersectionObserver(([e]) => { terlihat = e.isIntersecting; }, { threshold: .5 }).observe(baris);
      setInterval(() => {
        if (!terlihat || document.hidden || Date.now() < jedaSampai || baris.contains(document.activeElement)) return;
        const max = baris.scrollWidth - baris.clientWidth;
        if (max <= 1) return;
        const li = baris.firstElementChild;
        const langkah = li.offsetWidth + parseFloat(getComputedStyle(baris).columnGap || 0);
        baris.scrollTo({ left: baris.scrollLeft >= max - 1 ? 0 : baris.scrollLeft + langkah, behavior: 'smooth' });
      }, 2000);
    }
  }

  const P = (D.partners || []).filter((g) => (g.logos || []).length);
  if (P.length) {
    $('mitraSec').hidden = false;
    P.forEach((g) => {
      const box = el('div', 'geser');
      $('mitra').append(box);
      geser(box, el('h3', '', g.group), g.logos.map(([name, src, tone]) => ({ name, src, tone })), g.group);
    });
  }
})();
