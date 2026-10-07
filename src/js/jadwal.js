import { $, $$, D, esc, hasGsap, lenis, reduced, stripIndex } from './core.js';
import { nav } from './navbar.js';

// Jadwal tabs
const TAGS = { kajian: 'Kajian', layanan: 'Layanan', lomba: 'Lomba', talkshow: 'Talkshow' };
const tabs = $('#dayTabs');
export const panel = $('#jadwalPanel');
// Status hari menurut jam WIB. Indikatornya hanya jam tutup: sejak masuk
// tanggalnya (00:00) hari itu "Hari ini", lewat jam tutup langsung "Selesai".
// `let`: diperbarui otomatis bila halaman dibiarkan terbuka (lihat rollDay).
const OPEN = (D.hours && D.hours.open) || '08:00';
const CLOSE = (D.hours && D.hours.close) || '21:00';
let todayWIB, dayClosed, todayIdx;
const readClock = () => {
  const now = new Date();
  const hhmm = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  todayWIB = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
  dayClosed = hhmm >= CLOSE;
  todayIdx = dayClosed ? -1 : D.days.findIndex((d) => d.iso === todayWIB);
};
readClock();
// Hari acara yang berstatus "hari ini" pada waktu t (ms): sejak 00:00 WIB
// tanggalnya s/d jam tutup — dipakai countdown & penanda menu.
// Fungsi murni (tidak mengubah state tab), aman dipanggil tiap detik.
export const openDayAt = (t) => {
  const at = (d, hhmm) => new Date(`${d.iso}T${hhmm}:00+07:00`).getTime();
  return D.days.find((d) => t >= at(d, '00:00') && t < at(d, CLOSE)) || null;
};
export const nextOpenAt = (t) => {
  const d = D.days.find((x) => new Date(`${x.iso}T${OPEN}:00+07:00`).getTime() > t);
  return d ? new Date(`${d.iso}T${OPEN}:00+07:00`).getTime() : 0;
};
const isPast = (d) => d.iso < todayWIB || (d.iso === todayWIB && dayClosed);
// Tab otomatis: hari ini selama jam acara, selain itu hari berikutnya yang belum lewat
const autoIdx = () => {
  if (todayIdx >= 0) return todayIdx;
  const next = D.days.findIndex((d) => !isPast(d));
  return next >= 0 ? next : 0;
};
// Deep link: ?hari=d3 membuka tab hari itu — panitia bisa membagikan tautan
// langsung ke jadwal satu hari. Kalau tidak ada, jatuh ke hari ini / berikutnya.
const linkedIdx = D.days.findIndex((d) => d.key === new URLSearchParams(location.search).get('hari'));
const defaultIdx = linkedIdx >= 0 ? linkedIdx : autoIdx();
// Hari yang sudah lewat tidak disimpan di URL: tautan lama tetap membuka tabnya,
// tapi ?hari dibuang dari address bar supaya tidak ikut tersimpan/dibagikan.
export const isPastDay = (key) => { const d = D.days.find((x) => x.key === key); return !!d && isPast(d); };
if (linkedIdx >= 0 && isPastDay(D.days[linkedIdx].key)) {
  const u = new URL(location); u.searchParams.delete('hari'); history.replaceState(null, '', u);
}
const tabsHTML = (sel) => D.days.map((d, i) => `
    <button class="day${i === todayIdx ? ' is-today' : ''}${isPast(d) ? ' is-past' : ''}" role="tab" id="tab-${d.key}" aria-selected="${i === sel}" aria-controls="jadwalPanel" data-day="${d.key}" tabindex="${i === sel ? 0 : -1}" aria-label="Hari ke-${i + 1}, ${esc(d.full || d.short)} ${esc(d.date)} ${d.year}">
      <small>Hari ke-${i + 1}</small><b>${esc(d.short)}</b><span>${esc(d.date)} ${d.year}</span><i class="day__edge" aria-hidden="true">${i === todayIdx ? 'Hari ini' : `Hari ke-${i + 1}`}</i>
      ${i === todayIdx ? '<em class="day__badge day__badge--today mono">Hari ini</em>' : isPast(d) ? '<em class="day__badge day__badge--past mono">Selesai</em>' : ''}
    </button>`).join('');
tabs.innerHTML = tabsHTML(defaultIdx);

// Tampilan "Per Waktu": jadwal yang sama dikelompokkan di bawah heading
// Pagi/Siang/Sore/Malam (berdasar jam mulai) — murni pengelompokan visual,
// bukan data baru. Toggle & pilihannya tersimpan di localStorage.
const PERIODE = [
  { key: 'pagi', label: 'Pagi', to: 12 * 60 },
  { key: 'siang', label: 'Siang', to: 15 * 60 },
  { key: 'sore', label: 'Sore', to: 18 * 60 },
  { key: 'malam', label: 'Malam', to: 24 * 60 },
];
export const toMin = (hhmm) => { const [h, m] = hhmm.split('.').map(Number); return h * 60 + m; };
const periodeOf = (time) => { const s = toMin(time.split(' - ')[0]); return PERIODE.find((p) => s < p.to) || PERIODE[PERIODE.length - 1]; };
export const JICONS = {
  toko: 'M3 9 5 4h14l2 5M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9ZM5 13v7h14v-7M10 20v-4h4v4',
  medis: 'M2 21h20M4 21V5h16v16M8 9h2M14 9h2M8 13h2M14 13h2M10 21v-4h4v4',
  piala: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 21h8',
  mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3M8 21h8',
  tetes: 'M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z',
  nadi: 'M3 12h4l2-4 4 8 2-4h6',
  hati: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  gunting: 'M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM8.2 7.8L20 19M8.2 16.2L20 5',
  obrolan: 'M4 5h11v8H8l-4 3zM15 9h5v8l-3-2h-6v-2',
  muslimah: 'M4.5 21C5 18 5 15 5 10a7 7 0 0 1 14 0c0 5 0 8 .5 11-5 1-10 1-15 0zM12 7a3.5 4.5 0 1 1 0 9 3.5 4.5 0 0 1 0-9zM8.7 10.2c2.1-.8 4.5-.8 6.6 0',
  cincin: 'M12 21a6 6 0 1 1 0-12 6 6 0 0 1 0 12zM12 9l-2-2.5L12 4l2 2.5z',
  titik: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
  masjid: 'M3 21h18M5 21v-8h14v8M12 3c-3.2 2-5 4.2-5 7h10c0-2.8-1.8-5-5-7zM12 3V1M10 21v-3a2 2 0 0 1 4 0v3',
  jam: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7v5l3 2',
  grup: 'M12 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6.5 20v-1a5.5 5.5 0 0 1 11 0v1M5 8.5a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4zM1.5 19v-.5A3.5 3.5 0 0 1 5 15M19 8.5a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4zM22.5 19v-.5A3.5 3.5 0 0 0 19 15',
};
// Ikon dipilih dari kata kunci judul; r.icon di data-prod.js bisa menimpanya.
const ICON_RULES = [
  [/bazar|foodcourt/, 'toko'], [/khitan/, 'grup'], [/lomba|musabaqah|grand final/, 'piala'],
  [/donor/, 'tetes'], [/periksa|kesehatan/, 'nadi'], [/bekam/, 'hati'], [/cut|cukur/, 'gunting'],
  [/konsultasi/, 'obrolan'], [/nikah/, 'cincin'], [/muslimah/, 'muslimah'], [/talkshow|kajian/, 'mic'],
];
const TAG_ICON = { lomba: 'piala', kajian: 'mic', talkshow: 'mic' };
export const iconKey = (r) => {
  const t = r.title.toLowerCase();
  const hit = ICON_RULES.find(([re]) => re.test(t));
  return (r.icon && JICONS[r.icon] && r.icon) || (hit && hit[1]) || TAG_ICON[r.tag] || 'titik';
};
const iconOf = (r) => `<svg class="jico" viewBox="0 0 24 24" aria-hidden="true"><path d="${JICONS[iconKey(r)]}"/></svg>`;
const pinkCls = (r) => (r.akhwat ? ' is-pink' : '');
// Keterangan acara: nama pengisi diambil dari D.asatidz lewat r.ustadz (id atau
// daftar id), lalu disambung note bila ada. Id tak dikenal diabaikan.
const ustadzById = Object.fromEntries((D.asatidz || []).filter((u) => u.id).map((u) => [u.id, u.name]));
// id pengisi di elemen jadwal → badge asatidz bisa menemukan acaranya
const ustAttr = (r) => (r.ustadz ? ` data-ustadz="${esc([].concat(r.ustadz).join(' '))}"` : '');
// Tenda acara di denah: nama pemilik tenda (D.placements) = r.tenda, atau
// judul acara yang sama persis (mis. "Donor Darah") → label "Tenda 33".
const tendaOf = {};
(D.placements || []).forEach(([name, from, to = from]) => {
  const p2 = (n) => String(n).padStart(2, '0');
  (tendaOf[name] = tendaOf[name] || []).push(from === to ? p2(from) : `${p2(from)}–${p2(to)}`);
});
export const tendaName = (r) => (r.tenda && tendaOf[r.tenda] ? r.tenda : tendaOf[r.title] ? r.title : null);
// versi HTML: nama asatidz jadi tautan ke kartunya di section Asatidz,
// tenda jadi tautan ke denah (tendanya dipilih — handler data-tenant-link)
const noteHtml = (r) => [
  [].concat(r.ustadz || []).filter((id) => ustadzById[id]).map((id) => `<a href="#asatidz" class="jnote-ust" data-ust="${esc(id)}">${esc(ustadzById[id])}</a>`).join(' &amp; '),
  r.note ? esc(r.note) : '',
  tendaName(r) ? `<a href="#denah" class="jnote-ust" data-tenant-link="${esc(tendaName(r))}" data-cursor="Lokasi">Tenda ${tendaOf[tendaName(r)].join(', ')}</a>` : '',
].filter(Boolean).join(' · ');
const noteOf = (r) => [[].concat(r.ustadz || []).map((id) => ustadzById[id]).filter(Boolean).join(' & '), r.note]
  .filter(Boolean).join(' · ');
// Tampilan Tabel dinonaktifkan sementara → selalu Durasi & tombol Tabel/Durasi
// disembunyikan. Ubah ke true untuk mengaktifkan lagi (kode Tabel tetap utuh).
const TABEL_ON = false;
let jView = TABEL_ON ? 'tabel' : 'durasi';
// pilihan Kartu/Daftar per blok di tampilan Durasi (kunci: 'panggung', 'pagi', …)
let secModes = {};
try { secModes = JSON.parse(localStorage.getItem('mb9-jsec') || '{}') || {}; } catch (e) { /* storage diblokir */ }
// bawaan Daftar; Kartu hanya bila pengunjung memilihnya
const secMode = (key) => (secModes[key] === 'card' ? 'card' : 'list');
try { if (TABEL_ON && localStorage.getItem('mb9-jview') === 'durasi') jView = 'durasi'; } catch (e) { /* storage diblokir */ }
let currentKey = null;
export const fmtMin = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}.${String(m % 60).padStart(2, '0')}`;
// "Sedang berlangsung": hanya untuk acara di rangkaian bertitik (Tabel,
// tanpa group) pada hari acara menurut WIB; diperiksa ulang tiap menit.
export const wibNow = () => {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const o = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { iso: `${o.year}-${o.month}-${o.day}`, min: Number(o.hour) * 60 + Number(o.minute) };
};
// Status otomatis dari jam (hanya di hari acara menurut WIB, cek tiap menit):
// • acara panggung (rangkaian, tanpa group / data-seq): "Live" saat berjalan,
//   "Selanjutnya" di acara panggung terdekat yang belum mulai
// • layanan di stan (punya group): "Buka 10.00" → "Buka" → "Segera tutup"
//   (≤30 menit sebelum tutup) → "Tutup"
const SOON = 30;
const markLive = () => {
  const day = D.days.find((d) => d.key === currentKey);
  const now = wibNow();
  const on = !!day && day.iso === now.iso;
  const span = (el) => (el.dataset.t || '').split(' - ').map(toMin);
  const isSeq = (el) => el.hasAttribute('data-seq');
  // label-label status dibuat ulang tiap pemeriksaan
  $$('.jlive, .jnext, .jopen', panel).forEach((x) => x.remove());
  $$('.is-live', panel).forEach((x) => x.classList.remove('is-live'));
  const units = [...$$('.jrow', panel), ...$$('.jcard__item', panel)];
  units.forEach((el) => el.classList.toggle('is-done', on && now.min >= span(el)[1]));
  $$('.jdur .jcard', panel).forEach((card) => card.classList.toggle('is-done', $$('.jcard__item', card).every((it) => it.classList.contains('is-done'))));
  if (!on) return;
  // tempat label: baris → di sel jam; item kartu Durasi → pojok kanan atas kartu
  const put = (el, html) => {
    const card = el.classList.contains('jcard__item') ? el.closest('.jcard') : null;
    if (card) { if (!card.querySelector('.jlive, .jnext, .jopen')) card.insertAdjacentHTML('beforeend', html); }
    else el.querySelector(':scope > time').insertAdjacentHTML('beforeend', html);
  };
  // panggung
  const seq = units.filter(isSeq);
  seq.forEach((el) => {
    const [a, b] = span(el);
    if (now.min >= a && now.min < b) {
      el.classList.add('is-live');
      el.closest('.jcard')?.classList.add('is-live');
      put(el, '<span class="jlive mono">Berlangsung</span>');
    } else if (now.min >= b) {
      put(el, '<span class="jopen mono is-closed">Selesai</span>'); // gaya sama dengan "Tutup"
    }
  });
  const upcoming = seq.filter((el) => span(el)[0] > now.min).sort((x, y) => span(x)[0] - span(y)[0]);
  // ≤30 menit lagi → "Segera dimulai" (semua yang masuk rentang itu);
  // selain itu acara terdekat → "Selanjutnya"
  const starting = upcoming.filter((el) => span(el)[0] - now.min <= SOON);
  if (starting.length) starting.forEach((el) => put(el, '<span class="jnext mono is-starting">Segera dimulai</span>'));
  else if (upcoming.length) {
    const first = span(upcoming[0])[0];
    upcoming.filter((el) => span(el)[0] === first).forEach((el) => put(el, '<span class="jnext mono">Selanjutnya</span>'));
  }
  // layanan di stan
  // kartu jeda (Durasi): selama jedanya berjalan → label "Istirahat"
  units.filter((el) => el.hasAttribute('data-gap')).forEach((el) => {
    const [a, b] = span(el);
    if (now.min >= a && now.min < b) put(el, '<span class="jopen mono is-break">Istirahat</span>');
  });
  units.filter((el) => !isSeq(el) && !el.hasAttribute('data-gap')).forEach((el) => {
    const [a, b] = span(el);
    const st = now.min < a ? (a - now.min <= SOON ? ['is-starting', 'Segera buka'] : ['is-wait', `Buka ${fmtMin(a)}`])
      : now.min >= b ? ['is-closed', 'Tutup']
        : b - now.min <= SOON ? ['is-soon', 'Segera tutup'] : ['is-open', 'Buka'];
    put(el, `<span class="jopen mono ${st[0]}">${st[1]}</span>`);
  });
};
let panelH = 0;
// quiet: render ulang tanpa animasi masuk (mis. ganti Kartu/Daftar satu blok)
const renderDay = (key, quiet) => {
  currentKey = key;
  const day = D.days.find((d) => d.key === key);
  const rows = (D.jadwal && D.jadwal[key]) || [];
  const past = isPast(day);
  panel.setAttribute('aria-labelledby', `tab-${key}`);
  panel.classList.toggle('is-past', past);
  const banner = past ? `<div class="jadwal__past mono"><span>Selesai</span> Rangkaian acara ${esc(day.full)} telah berakhir.</div>` : '';
  const rowHtml = (r) => `
        <div class="jrow${pinkCls(r)}${jView === 'tabel' && r.group ? ' is-grp' : ''}" data-t="${esc(r.time)}"${r.group ? '' : ' data-seq'}${ustAttr(r)}>
          <time>${esc(r.time)}</time>
          <div><h3>${iconOf(r)}<span>${esc(r.title)}</span></h3>${noteHtml(r) ? `<p>${noteHtml(r)}</p>` : ''}</div>
          ${r.tag ? `<span class="tag">${esc(TAGS[r.tag] || r.tag)}</span>` : '<span></span>'}
        </div>`;
  // kolom diurut kiri→kanan menurut jam selesai (lalu jam mulai) — yang
  // paling cepat kelar di kiri, yang paling lama di kanan.
  const byEnd = (a, b) => {
    const [as, ae] = a.time.split(' - ').map(toMin);
    const [bs, be] = b.time.split(' - ').map(toMin);
    return ae - be || as - bs;
  };
  // Tampilan "Durasi": jam mulai bersama ditulis sekali di kepala grup, tiap
  // kartu cukup jam selesainya + bar sepanjang durasinya relatif ke rentang grup.
  // Jeda di rangkaian panggung: keterangan dari waktu sholat (D.sholat) yang jatuh
  // di dalam rentang jeda — Dzuhur & jeda ≥1 jam → "Ishoma".
  const SHOLAT = Object.entries(D.sholat || {});
  const gapInfo = (a, b) => {
    const hit = SHOLAT.filter(([, t]) => { const m = toMin(t); return m >= a && m < b; });
    const cap = (k) => k[0].toUpperCase() + k.slice(1);
    const ishoma = b - a >= 60 && hit.some(([k]) => k === 'dzuhur');
    return {
      title: ishoma ? 'Ishoma' : hit.length ? 'Istirahat Sholat' : 'Jeda',
      note: [ishoma ? 'Istirahat, sholat & makan' : '', ...hit.map(([k, t]) => `${cap(k)} ± ${t}`)].filter(Boolean).join(' · '),
      icon: hit.length ? 'masjid' : 'jam',
    };
  };
  const durHtml = (g, gaps) => {
    const rs = [...g.rows].sort(byEnd);
    const rg = rs.map((r) => r.time.split(' - ').map(toMin));
    const gs = Math.min(...rg.map((x) => x[0])), ge = Math.max(...rg.map((x) => x[1]));
    const same = rg.every((x) => x[0] === gs);
    // kepala = rentang seluruh deretan; diberi kata agar tak terbaca sebagai jam kartu pertama
    const head = same ? `Mulai <b>${fmtMin(gs)}</b>` : `Rentang <b>${fmtMin(gs)}</b> – <b>${fmtMin(ge)}</b>`;
    // acara dengan jam (selesai) yang sama → satu kartu, isinya berderet
    let cards = [];
    rs.forEach((r, i) => {
      const label = same ? `s/d ${fmtMin(rg[i][1])}` : esc(r.time);
      const last = cards[cards.length - 1];
      if (last && last.label === label) last.items.push(r); else cards.push({ label, items: [r] });
    });
    // rangkaian panggung: sela kosong antar-kartu → kartu jeda (garis putus-putus)
    if (gaps) {
      const sp = (c) => c.items.map((r) => r.time.split(' - ').map(toMin));
      cards = cards.flatMap((c, i) => {
        if (!i) return [c];
        const pe = Math.max(...sp(cards[i - 1]).map((x) => x[1])), ns = Math.min(...sp(c).map((x) => x[0]));
        return ns > pe ? [{ gap: [pe, ns], label: `${fmtMin(pe)} - ${fmtMin(ns)}` }, c] : [c];
      });
    }
    const gapCard = (c) => {
      const info = gapInfo(...c.gap);
      return `
        <div class="jcard jcard--gap">
          <span class="jcard__edge" aria-hidden="true" data-t="${c.label}"></span>
          <div class="jstop"><i aria-hidden="true"></i><time>${c.label}</time></div>
          <div class="jcard__item" data-t="${c.label}" data-gap>
            <h3><svg class="jico" viewBox="0 0 24 24" aria-hidden="true"><path d="${JICONS[info.icon]}"/></svg><span>${info.title}</span></h3>
            ${info.note ? `<p>${esc(info.note)}</p>` : ''}
          </div>
        </div>`;
    };
    // Kartu berjajar 1 baris (geser horizontal, urut jam selesai). Di atas
    // tiap kartu ada garis waktu bersambung dengan titik di jam selesainya.
    return `<div class="jdur"><div class="jdur__head"><span>${head}</span><span class="jdur__nav" hidden><button type="button" data-dir="-1" aria-label="Geser ke kiri"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button><button type="button" data-dir="1" aria-label="Geser ke kanan"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></span></div><div class="jrail${cards.length > 2 ? ' jrail--many' : ''}${same ? '' : ' jrail--range'}"><div class="jrail__track">${cards.map((c) => (c.gap ? gapCard(c) : `
        <div class="jcard${c.items.every((r) => r.akhwat) ? ' is-pink' : ''}">
          <span class="jcard__edge" aria-hidden="true" data-t="${c.label}"></span>
          <div class="jstop"><i aria-hidden="true"></i><time>${c.label}</time></div>${c.items.map((r) => `
          <div class="jcard__item${pinkCls(r)}" data-t="${esc(r.time)}"${r.group ? '' : ' data-seq'}${ustAttr(r)}>
            <h3>${iconOf(r)}<span>${esc(r.title)}</span></h3>
            ${noteHtml(r) ? `<p>${noteHtml(r)}</p>` : ''}
            ${r.tag ? `<span class="tag">${esc(TAGS[r.tag] || r.tag)}</span>` : ''}
          </div>`).join('')}
        </div>`)).join('')}</div></div></div>`;
  };
  // Durasi: acara panggung berurutan (tanpa group) dikumpulkan jadi satu baris
  // kartu horizontal di atas (judul dari tag-nya, mis. "Kajian & Talkshow") — lepas dari Pagi/Siang/Sore/
  // Malam agar tetap terasa bersambung; layanan/stan (punya group) tetap per
  // periode di bawahnya.
  const chainRows = jView === 'durasi' ? rows.filter((r) => !r.group) : [];
  // judul dari tag yang ada di rangkaian (urutan TAGS): mis. "Kajian & Talkshow"
  const chainTags = Object.keys(TAGS).filter((k) => chainRows.some((r) => r.tag === k)).map((k) => TAGS[k]);
  const chainTitle = chainTags.length ? chainTags.join(', ').replace(/, ([^,]*)$/, ' & $1') : 'Acara Panggung';
  // Durasi: tiap bar hitam punya pilihan tampilan Kartu / Daftar (per blok,
  // disimpan di localStorage). Daftar = baris biasa seperti Tabel, urut jam mulai.
  const secHead = (key, label) => {
    const mode = secMode(key);
    const btn = (m, title, d) => `<button type="button" data-sec="${key}" data-mode="${m}" aria-pressed="${mode === m}" aria-label="Tampilkan sebagai ${title}" title="${title}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg></button>`;
    return `<div class="jperiode" data-sec-head="${key}"><span>${label}</span><span class="jperiode__view" role="group" aria-label="Tampilan ${esc(label.replace(/<[^>]+>/g, ''))}">${btn('list', 'Daftar', 'M4 6h16M4 12h16M4 18h16')}${btn('card', 'Kartu', 'M3 5h8v14H3zM13 5h8v14h-8z')}</span></div>`;
  };
  // gaps: rangkaian panggung → sela kosong jadi baris jeda/istirahat (seperti kartu jeda)
  const asList = (list, gaps) => {
    const sp = (r) => r.time.split(' - ').map(toMin);
    const rs = [...list].sort((a, b) => sp(a)[0] - sp(b)[0] || sp(a)[1] - sp(b)[1]);
    let end = -1;
    return rs.map((r) => {
      const [a, b] = sp(r);
      let gap = '';
      if (gaps && end >= 0 && a > end) {
        const info = gapInfo(end, a);
        const t = `${fmtMin(end)} - ${fmtMin(a)}`;
        gap = `
        <div class="jrow jrow--gap" data-t="${t}" data-gap>
          <time>${t}</time>
          <div><h3><svg class="jico" viewBox="0 0 24 24" aria-hidden="true"><path d="${JICONS[info.icon]}"/></svg><span>${info.title}</span></h3>${info.note ? `<p>${esc(info.note)}</p>` : ''}</div>
          <span></span>
        </div>`;
      }
      end = Math.max(end, b);
      return gap + rowHtml(r);
    }).join('');
  };
  const chain = chainRows.length
    ? `${secHead('panggung', esc(chainTitle))}${secMode('panggung') === 'list' || chainRows.length < 2 ? `<div class="jchain">${asList(chainRows, true)}</div>` : durHtml({ rows: chainRows }, true)}`
    : '';
  let lastP = null;
  const sections = [];
  (jView === 'durasi' ? rows.filter((r) => r.group) : rows).forEach((r) => {
    const p = periodeOf(r.time);
    if (p !== lastP) sections.push({ p, rows: [] });
    sections[sections.length - 1].rows.push(r);
    lastP = p;
  });
  const byStart = (a, b) => {
    const [as, ae] = a.time.split(' - ').map(toMin);
    const [bs, be] = b.time.split(' - ').map(toMin);
    return as - bs || ae - be;
  };
  // Judul periode menjangkau acara terlama di dalamnya: mulai Pagi tapi ada yang
  // sampai 21.00 → "Pagi s/d Malam". Jam selesai tepat di batas (mis. 12.00)
  // masih dihitung periode sebelumnya.
  const perLabel = (sec) => {
    const end = Math.max(...sec.rows.map((r) => toMin(r.time.split(' - ')[1]))) - 1;
    const to = PERIODE.find((p) => end < p.to) || PERIODE[PERIODE.length - 1];
    return to === sec.p ? sec.p.label : `${sec.p.label} <small>s/d</small> ${to.label}`;
  };
  // Tabel (& Daftar di Durasi): urut sesuai susunan di data-prod.js (atau `order`
  // bila diisi: kecil duluan, default 0); sort() stabil → yang setara tetap urutan data
  const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
  const body = sections.map((sec) => {
    if (jView === 'durasi') {
      const starts = new Map();
      sec.rows.forEach((r) => {
        const s = toMin(r.time.split(' - ')[0]);
        if (!starts.has(s)) starts.set(s, []);
        starts.get(s).push(r);
      });
      // Daftar: urutan sama dengan Tabel (susunan data / field order)
      const html = secMode(sec.p.key) === 'list' ? [...sec.rows].sort(byOrder).map(rowHtml).join('') : [...starts.entries()].sort((a, b) => a[0] - b[0])
        .map(([, list]) => (list.length > 1 ? durHtml({ rows: list }) : rowHtml(list[0]))).join('');
      return `${secHead(sec.p.key, perLabel(sec))}${html}`;
    }
    return `<div class="jperiode"><span>${perLabel(sec)}</span></div>${[...sec.rows].sort(byOrder).map(rowHtml).join('')}`;
  }).join('');
  // Durasi: dua blok berbingkai sendiri (tanpa jarak) — Kajian & Talkshow di atas,
  // layanan/stan per periode di bawah dengan judul blok "Layanan Gratis & Kegiatan". Blok baru (mis. tenant) tinggal ditambah sebagai .jblock.
  const grpTitle = 'Layanan Gratis & Kegiatan';
  const content = jView === 'durasi'
    ? [chain && `<div class="jblock">${chain}</div>`, body && `<div class="jblock"><div class="jblock__title">${esc(grpTitle)}</div>${body}</div>`].filter(Boolean).join('')
    : chain + body;
  panel.classList.toggle('has-blocks', rows.length > 0 && content.includes('class="jblock"'));
  panel.innerHTML = banner + (rows.length
    ? content
    : past
      ? `<div class="soon">
          <div class="soon__icon" aria-hidden="true"><svg viewBox="0 0 56 56"><path d="M16 29l8 8 16-18"/></svg></div>
          <div>
            <h3>Acara Telah Selesai</h3>
            <p>Jazakumullahu khairan kepada seluruh pengunjung ${esc(day.full)}.</p>
          </div>
        </div>`
      : `<div class="soon">
          <div class="soon__icon" aria-hidden="true"><svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="22"/><path class="hand" d="M28 28V13"/><path d="M28 28l9 6"/></svg></div>
          <div>
            <h3>InsyaAllah Menyusul</h3>
            <p>Rincian jadwal ${esc(day.full)} sedang disusun oleh panitia. Pantau terus halaman ini.</p>
            <div class="soon__fixed"><b>${D.hours.open.replace(':', '.')} – ${D.hours.close.replace(':', '.')}</b> Open Gate Bazar &amp; Foodcourt</div>
          </div>
        </div>`);
  // Durasi, mode Daftar Kajian & Talkshow: garis waktu bertitik seperti Tabel;
  // baris istirahat → garis putus-putus dengan titik kosong
  const chainEls = $$('.jchain > .jrow', panel);
  chainEls.forEach((el, i) => {
    el.classList.add('is-seq');
    el.classList.toggle('is-seq-first', i === 0);
    el.classList.toggle('is-seq-last', i === chainEls.length - 1);
  });
  // Tabel: acara tanpa group = rangkaian berurutan (satu selesai, lanjut
  // berikutnya) → disambung garis waktu bertitik di depan jamnya
  if (jView === 'tabel') {
    const all = $$('.jrow', panel);
    const seq = all.filter((el) => !el.classList.contains('is-grp'));
    seq.forEach((el, i) => {
      el.classList.add('is-seq');
      el.classList.toggle('is-seq-first', i === 0);
      el.classList.toggle('is-seq-last', i === seq.length - 1);
    });
    // baris paralel yang terselip di tengah rangkaian: garis lewat, tanpa titik
    if (seq.length > 1) {
      const a = all.indexOf(seq[0]), z = all.indexOf(seq[seq.length - 1]);
      all.forEach((el, i) => el.classList.toggle('is-thru', i > a && i < z && !el.classList.contains('is-seq')));
    }
  }
  markLive();
  // Durasi dibuka langsung di kartu yang masih aktif (yang sudah tutup ada di strip kiri).
  $$('.jrail', panel).forEach((rail) => { rail._active = rail.dataset.start = firstActive(rail); });
  syncRails();
  // tinggi jadwal berubah (ganti hari/tampilan) → posisi pin section di
  // bawahnya (Layanan dll.) harus diukur ulang, kalau tidak jadi tumpang tindih
  if (hasGsap && panel.offsetHeight !== panelH) {
    panelH = panel.offsetHeight;
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }
  if (hasGsap && !reduced && !quiet) {
    gsap.fromTo(panel.children, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .04, ease: 'power3.out', clearProps: 'transform,opacity' });
  }
};
// Grup Durasi ala tab hari: kartu yang muat tampil normal, sisanya diciutkan
// jadi strip tegak berisi jam selesainya (bukan scroll). Panah/klik strip
// menggeser "jendela" kartu yang terbuka.
const syncRail = (rail) => {
  const nav = rail.parentElement.querySelector('.jdur__nav');
  const cards = $$('.jcard', rail);
  const n = cards.length;
  const cs = getComputedStyle(rail);
  const cardMin = parseFloat(cs.getPropertyValue('--card-min')) || 260;
  const sliver = parseFloat(cs.getPropertyValue('--sliver')) || 38;
  const w = rail.clientWidth;
  let m = n;
  // kartu tersembunyi tiap sisi dirangkum jadi SATU strip (maks. 2 strip)
  while (m > 1 && m * cardMin + Math.min(n - m, 2) * sliver > w) m--;
  const start = Math.min(Math.max(Number(rail.dataset.start) || 0, 0), n - m);
  rail.dataset.start = start;
  const end = start + m;
  // Tinggi baris dikunci setinggi kartu TERTINGGI di grup (diukur dalam
  // keadaan terbuka selebar kartu normal) — kalau tidak, tinggi melompat
  // tiap kali jendela bergeser ke kartu yang isinya lebih banyak.
  const track = rail.firstElementChild;
  const hadNoAnim = rail.classList.contains('no-flex-anim');
  rail.classList.add('no-flex-anim');
  const ow = (w - Math.min(n - m, 2) * sliver) / m;
  track.style.minHeight = '';
  // border-box: lebar ukur = lebar tampil sebenarnya (termasuk padding)
  cards.forEach((c) => { c.classList.remove('is-piled', 'is-gone'); c.style.flex = `0 0 ${ow}px`; c.style.boxSizing = 'border-box'; });
  track.style.flexWrap = 'wrap'; track.style.alignItems = 'flex-start';
  const tallest = Math.max(...cards.map((c) => c.getBoundingClientRect().height));
  track.style.flexWrap = ''; track.style.alignItems = '';
  cards.forEach((c) => { c.style.flex = ''; c.style.boxSizing = ''; });
  track.style.minHeight = `${tallest}px`;
  cards.forEach((c, i) => {
    const piled = i < start || i >= end;
    // yang jadi strip hanya tetangga terdekat jendela; sisanya disembunyikan
    const edge = i === start - 1 || i === end;
    c.classList.toggle('is-piled', piled && edge);
    c.classList.toggle('is-gone', piled && !edge);
    c.tabIndex = piled && edge ? 0 : -1;
    c.setAttribute('aria-expanded', String(!piled));
    const lbl = c.querySelector('.jcard__edge');
    const more = i === end ? n - end - 1 : i === start - 1 ? start - 1 : 0;
    lbl.innerHTML = `<i></i><b>${lbl.dataset.t}</b>${more > 0 ? `<em>+${more}</em>` : ''}`;
    c.classList.toggle('has-more', more > 0);
    c.classList.toggle('has-more2', more > 1);
    c.classList.toggle('is-left', i === start - 1);
    // lapis garis tumpukan ikut status kartunya, diurut dari strip ke arah luar:
    // [0] = strip itu sendiri, [1] = lapis dalam, [2..] = lapis luar
    const pile = i === end ? cards.slice(end) : i === start - 1 ? cards.slice(0, start).reverse() : [];
    const done = (list) => list.length > 0 && list.every((x) => x.classList.contains('is-done'));
    c.classList.toggle('near-done', done(pile.slice(1, 2)));
    c.classList.toggle('far-done', done(pile.slice(2)));
  });
  void rail.offsetWidth;
  if (!hadNoAnim) rail.classList.remove('no-flex-anim');
  if (!nav) return;
  nav.hidden = m >= n;
  const [prev, next] = nav.querySelectorAll('button');
  prev.disabled = start <= 0;
  next.disabled = start + m >= n;
  rail._m = m;
};
// geser jendela + animasi arah: ke kanan → isi kartu yang baru terbuka
// masuk dari kanan ke kiri (dan sebaliknya), supaya terasa seperti digeser
export const moveRail = (rail, start) => {
  const dir = Math.sign(start - (Number(rail.dataset.start) || 0));
  const cards = $$('.jcard', rail);
  const isOpen = (c) => !c.classList.contains('is-piled') && !c.classList.contains('is-gone');
  const wasOpen = cards.map(isOpen);
  const before = cards.map((c) => c.getBoundingClientRect().left);
  rail.dataset.start = start;
  // lebar dipasang instan (tanpa transisi flex) lalu digeser lewat transform
  // (FLIP) — kartu yang tetap terbuka meluncur dari posisi lamanya
  if (!dir || reduced) { syncRail(rail); return; }
  rail.classList.add('no-flex-anim');
  syncRail(rail);
  void rail.offsetWidth;
  rail.classList.remove('no-flex-anim');
  const ease = 'cubic-bezier(.22, .9, .24, 1)';
  cards.forEach((c, i) => {
    if (!isOpen(c)) return;
    if (wasOpen[i]) {
      const dx = before[i] - c.getBoundingClientRect().left;
      if (dx) c.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], { duration: 420, easing: ease });
      return;
    }
    [...c.children].filter((el) => !el.classList.contains('jcard__edge')).forEach((el) => el.animate(
      [{ transform: `translateX(${dir * 48}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 420, delay: 60, easing: ease, fill: 'backwards' },
    ));
  });
};
const syncRails = () => $$('.jrail', panel).forEach(syncRail);
// indeks kartu pertama yang belum selesai (semua selesai → kartu terakhir/paling kanan)
const firstActive = (rail) => {
  const cards = $$('.jcard', rail);
  const i = cards.findIndex((c) => !c.classList.contains('is-done'));
  return i < 0 ? cards.length - 1 : i;
};
// Perbarui status; baris Durasi digeser ke kartu aktif HANYA bila ada kartu
// yang baru tutup — geseran manual pengunjung tidak diganggu tiap menit.
const refreshLive = () => {
  markLive();
  $$('.jrail', panel).forEach((rail) => {
    const to = firstActive(rail);
    if (to !== rail._active) { rail._active = to; moveRail(rail, to); } else syncRail(rail);
  });
};
// Timer per menit (pas di pergantian menit) untuk Tabel & Durasi, hanya selama
// halaman dilihat: tab ditinggal → berhenti; kembali, sinyal tersambung lagi,
// atau halaman dipulihkan dari cache (Back / buka ulang app) → langsung
// diperbarui & jalan lagi.
let liveTimer = 0;
const stopLive = () => { clearTimeout(liveTimer); clearInterval(liveTimer); };
const startLive = () => {
  stopLive();
  liveTimer = setTimeout(() => { refreshLive(); liveTimer = setInterval(refreshLive, 60000); }, 60000 - (Date.now() % 60000));
};
const resumeLive = () => { if (document.hidden) return; refreshLive(); startLive(); };
document.addEventListener('visibilitychange', () => (document.hidden ? stopLive() : resumeLive()));
window.addEventListener('online', resumeLive);
window.addEventListener('pageshow', (e) => { if (e.persisted) resumeLive(); });
if (!document.hidden) startLive();
// Swipe kartu Durasi di layar sentuh: geser horizontal ≥40px (dan jelas lebih
// horizontal daripada vertikal) → satu kartu ke kiri/kanan. Selama jari menggeser,
// kartu terbuka di sisi itu MELEBAR mengikuti jari (margin negatif; kartu flex
// mengisi ruangnya) — strip tertutup diam, garis waktu di kartu ikut memanjang
// sehingga tidak putus. Di ujung terasa berat (karet). Saat dilepas: pindah kartu
// atau memantul kembali. Gulir vertikal tetap normal (.jrail touch-action: pan-y).
// Klik sesudah swipe diabaikan agar strip yang tersentuh tidak ikut terbuka.
let swipe = null, swipedAt = 0;
const railMax = (rail) => $$('.jcard', rail).length - (rail._m || 1);
const EASE_BACK = 'margin .3s cubic-bezier(.22, .9, .24, 1)';
const setStretch = (sw, off, anim) => {
  const first = sw.cards[0], last = sw.cards[sw.cards.length - 1];
  [first, last].forEach((c) => { c.style.transition = anim ? EASE_BACK : 'none'; });
  // geser ke kiri → tepi kiri kartu pertama melebar ke kiri; ke kanan → tepi kanan kartu terakhir
  first.style.marginLeft = off < 0 ? `${off}px` : '';
  last.style.marginRight = off > 0 ? `${-off}px` : '';
  if (anim) [first, last].forEach((c) => c.addEventListener('transitionend', () => { c.style.transition = ''; }, { once: true }));
};
panel.addEventListener('pointerdown', (e) => {
  const rail = e.pointerType !== 'mouse' && e.target.closest('.jrail');
  const cards = rail ? $$('.jcard', rail).filter((c) => !c.classList.contains('is-piled') && !c.classList.contains('is-gone')) : [];
  swipe = cards.length ? { rail, cards, x: e.clientX, y: e.clientY, lock: null, off: 0 } : null;
});
panel.addEventListener('pointermove', (e) => {
  if (!swipe || reduced) return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
  // arah dikunci setelah gerakan pertama yang jelas
  if (!swipe.lock && Math.max(Math.abs(dx), Math.abs(dy)) > 8) swipe.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
  if (swipe.lock !== 'x') return;
  const cur = Number(swipe.rail.dataset.start) || 0;
  const edge = (dx > 0 && cur <= 0) || (dx < 0 && cur >= railMax(swipe.rail));
  const lim = swipe.rail.clientWidth * 0.4;
  swipe.off = Math.max(-lim, Math.min(lim, edge ? dx * 0.25 : dx * 0.6));
  setStretch(swipe, swipe.off, false);
});
panel.addEventListener('pointercancel', () => { if (swipe && swipe.off) setStretch(swipe, 0, true); swipe = null; });
panel.addEventListener('pointerup', (e) => {
  if (!swipe) return;
  const sw = swipe;
  swipe = null;
  const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
  const cur = Number(sw.rail.dataset.start) || 0;
  const to = Math.abs(dx) >= 40 && Math.abs(dx) >= Math.abs(dy) * 1.5
    ? Math.min(Math.max(cur + (dx < 0 ? 1 : -1), 0), railMax(sw.rail)) : cur;
  if (Math.abs(dx) >= 40) swipedAt = Date.now();
  // pindah dulu (FLIP mengukur dari bentuk melebar saat ini), lalu lebar kembali
  // normal bersamaan; kartu yang kini jadi strip langsung dirapikan tanpa transisi
  if (to !== cur) moveRail(sw.rail, to);
  if (!sw.off) return;
  setStretch(sw, 0, true);
  sw.cards.forEach((c) => { if (c.classList.contains('is-piled') || c.classList.contains('is-gone')) c.style.transition = 'none'; });
});
// tombol Kartu/Daftar di bar hitam: render ulang, bar yang diklik tetap di posisi layarnya
panel.addEventListener('click', (e) => {
  const t = e.target.closest('.jperiode__view button');
  if (!t || t.getAttribute('aria-pressed') === 'true') return;
  const key = t.dataset.sec;
  const y0 = t.closest('.jperiode').getBoundingClientRect().top;
  secModes[key] = t.dataset.mode;
  try { localStorage.setItem('mb9-jsec', JSON.stringify(secModes)); } catch (err) { /* abaikan */ }
  renderDay(currentKey, true);
  const head = $(`[data-sec-head="${key}"]`, panel);
  if (head) {
    // hanya isi bagian ini yang muncul halus (sampai bar berikutnya)
    const part = [];
    for (let n = head.nextElementSibling; n && !n.matches('.jperiode, .jblock__title'); n = n.nextElementSibling) part.push(n);
    if (hasGsap && !reduced && part.length) gsap.fromTo(part, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .4, stagger: .03, ease: 'power3.out', clearProps: 'transform,opacity' });
    const dy = head.getBoundingClientRect().top - y0;
    if (Math.abs(dy) >= 1) { if (lenis) lenis.scrollTo(scrollY + dy, { immediate: true, force: true }); else scrollTo({ top: scrollY + dy, behavior: 'instant' }); }
    $(`.jperiode__view button[data-mode="${secModes[key]}"]`, head)?.focus({ preventScroll: true });
  }
});
panel.addEventListener('click', (e) => {
  const b = e.target.closest('.jdur__nav button');
  if (b) {
    const rail = b.closest('.jdur').querySelector('.jrail');
    moveRail(rail, Number(rail.dataset.start) + Number(b.dataset.dir));
    return;
  }
  if (Date.now() - swipedAt < 400) return; // klik bawaan dari akhir swipe
  // klik strip → buka kartu itu (jendela bergeser seperlunya)
  const c = e.target.closest('.jcard.is-piled');
  if (!c) return;
  const rail = c.closest('.jrail');
  const i = $$('.jcard', rail).indexOf(c);
  const start = Number(rail.dataset.start);
  moveRail(rail, i < start ? i : i - rail._m + 1);
});
panel.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.jcard.is-piled')) { e.preventDefault(); e.target.click(); }
});
window.addEventListener('resize', syncRails);
// Glitch foto Tema: lapisan memakai sumber yang benar-benar dimuat (avif/webp)
const temaImg = $('.tema__media img');
if (temaImg) {
  const box = temaImg.closest('.img-reveal');
  const g = document.createElement('div');
  g.className = 'glitch'; g.setAttribute('aria-hidden', 'true'); g.innerHTML = '<i></i><i></i>';
  const setSrc = () => g.style.setProperty('--src', `url("${temaImg.currentSrc || temaImg.src}")`);
  if (temaImg.complete) setSrc(); else temaImg.addEventListener('load', setSrc, { once: true });
  box.appendChild(g);
  // jeda acak antar semburan: 3,8–5 dtk (disorot kursor: 1,6–2,4 dtk)
  if (!reduced) {
    const media = temaImg.closest('.tema__media');
    const burst = () => {
      g.classList.remove('is-on'); void g.offsetWidth; g.classList.add('is-on');
      const hover = media.matches(':hover');
      setTimeout(burst, hover ? 1600 + Math.random() * 800 : 3800 + Math.random() * 1200);
    };
    setTimeout(burst, 3800 + Math.random() * 1200);
  }
}
const viewBox = $('#jadwalView');
if (viewBox && !TABEL_ON) viewBox.hidden = true;
if (viewBox && TABEL_ON) {
  const syncView = () => $$('button', viewBox).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === jView)));
  syncView();
  viewBox.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-view]');
    if (!b || b.dataset.view === jView) return;
    jView = b.dataset.view;
    try { localStorage.setItem('mb9-jview', jView); } catch (err) { /* abaikan */ }
    syncView();
    if (currentKey) renderDay(currentKey);
  });
}

// Tumpuk dua sisi: kartu yang muat tampil normal dalam satu jendela yang selalu
// memuat hari aktif; sisanya jadi strip tipis bertumpuk di kiri dan/atau kanan.
// Ukurannya diambil dari CSS var, jadi tiap breakpoint punya kepadatan sendiri.
const daysNav = $('#daysNav');
const activeIdx = (list) => list.findIndex((b) => b.getAttribute('aria-selected') === 'true');
let winStart = 0; // indeks kartu normal pertama — digeser seperlunya saja
const layoutDays = () => {
  const list = $$('.day', tabs);
  const n = list.length;
  const a = activeIdx(list);
  $$('button', daysNav).forEach((b) => { const j = a + Number(b.dataset.dir); b.disabled = j < 0 || j >= n; });

  const cs = getComputedStyle(tabs);
  const px = (prop, fallback) => parseFloat(cs.getPropertyValue(prop)) || fallback;
  const dayMin = px('--day-min', 168);
  const sliver = px('--sliver', 38);
  const lap = px('--lap', 8);
  const tailW = (p) => (p > 0 ? sliver + (p - 1) * (sliver - lap) : 0);
  const w = tabs.clientWidth - px('padding-left', 0) - px('padding-right', 0);

  // + lap: cadangan bila tumpukan terbagi ke dua sisi
  const fits = (k) => k * dayMin - 2 * (k - 1) + (k < n ? tailW(n - k) + lap : 0) <= w;
  let m = n; // jumlah kartu yang tampil normal
  while (m > 1 && !fits(m)) m--;
  // geser jendela seperlunya saja agar kartu aktif tetap di dalamnya
  winStart = Math.min(Math.max(winStart, a - m + 1, 0), a, n - m);
  const start = winStart;
  const end = start + m; // eksklusif
  const stack = m < n;
  tabs.classList.toggle('is-stacked', stack);
  daysNav.classList.toggle('is-on', stack); // panah hanya saat ada kartu bertumpuk

  // lebar kartu normal dihitung eksplisit (bukan flex-grow) agar bisa dianimasikan:
  // sisa lebar setelah tumpukan, dikembalikan dulu tiap sambungan yang saling menimpa
  const pL = start, pR = n - end;
  const deepSeams = (pL > 1 ? pL - 1 : 0) + (pR > 1 ? pR - 1 : 0); // sambungan antar strip
  const thinSeams = n - 1 - deepSeams;                              // sambungan biasa (-2px)
  const normalW = (w + 2 * thinSeams + lap * deepSeams - (pL + pR) * sliver) / m;
  list.forEach((b, i) => {
    const piled = stack && (i < start || i >= end);
    b.classList.toggle('is-piled', piled);
    b.style.flexBasis = `${piled ? sliver : normalW}px`;
    b.style.zIndex = !stack ? '' : i < start ? i + 1 : i >= end ? n - i : n + 1;
  });
  syncStick();
};

// Tab hari versi ringkas (‹ HARI KE-2 · KAMIS, 24 DES ›), khusus HP/tablet: menempel
// di bawah layar selama tab asli sudah tergulir lewat tapi daftar acara masih terlihat.
// Label & tombol mengikuti tab aktif (dipanggil dari layoutDays).
const stick = $('#dayStick');
const stickLabel = $('.dstick__label', stick);
function syncStick() {
  const list = $$('.day', tabs);
  const a = activeIdx(list);
  const d = D.days[a];
  if (!d) return;
  const badge = a === todayIdx ? '<em>Hari ini</em>' : isPast(d) ? '<em class="is-past">Selesai</em>' : '';
  stickLabel.innerHTML = `<small>Hari ke-${a + 1}</small><span>${esc(d.short)}, ${esc(d.date)}</span>${badge}`;
  $$('button', stick).forEach((b) => {
    const j = a + Number(b.dataset.dir);
    b.disabled = j < 0 || j >= list.length;
    // panah yang menuju hari ini ikut biru (warna badge "Hari ini")
    const toToday = !b.disabled && todayIdx >= 0 && j === todayIdx; // -1 = tak ada hari ini
    b.classList.toggle('is-today', toToday);
    b.setAttribute('aria-label', `${b.dataset.dir < 0 ? 'Hari sebelumnya' : 'Hari berikutnya'}${toToday ? ' (hari ini)' : ''}`);
  });
}
let stickOn = false, stickTick = false;
const stickMQ = matchMedia('(max-width: 860px)'); // khusus HP/tablet (CSS menyembunyikannya di desktop)
const updateStick = () => {
  stickTick = false;
  if (!stickMQ.matches) { if (stickOn) { stickOn = false; stick.classList.remove('is-in'); } return; }
  // tab asli sudah lewat di atas (tertutup navbar bila tampil) dan daftar acara
  // masih mengisi layar sampai ke bar di bawah
  const top = 14 + (nav.classList.contains('is-hidden') ? 0 : nav.offsetHeight);
  const p = panel.getBoundingClientRect();
  const on = tabs.getBoundingClientRect().bottom < top && p.bottom > innerHeight - stick.offsetHeight - 24;
  if (on === stickOn) return;
  stickOn = on;
  stick.classList.toggle('is-in', on);
};
addEventListener('scroll', () => { if (!stickTick) { stickTick = true; requestAnimationFrame(updateStick); } }, { passive: true });
addEventListener('resize', updateStick);
stick.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  if (stickBusy) return;
  const list = $$('.day', tabs);
  const next = list[activeIdx(list) + Number(b.dataset.dir)];
  // naik dulu ke tab hari asli, tepat di bawah navbar yang muncul lagi saat
  // menggulir naik (bar ringkas memudar dengan sendirinya) — setelah tab
  // terlihat, baru tab berpindah ke hari baru agar perpindahannya kelihatan
  const y = tabs.getBoundingClientRect().top + scrollY - (14 + nav.offsetHeight + 16);
  if (y >= scrollY) { selectDay(next); return; }
  stickBusy = true;
  const go = () => setTimeout(() => { stickBusy = false; selectDay(next); }, reduced ? 0 : 150);
  if (lenis) lenis.scrollTo(y, { duration: 0.4, onComplete: go });
  else {
    scrollTo({ top: y, behavior: reduced ? 'instant' : 'smooth' });
    setTimeout(go, reduced ? 0 : 700);
  }
});
let stickBusy = false; // klik beruntun selama naik diabaikan

export let chosenDay = null; // hari yang DIPILIH pengunjung (bukan bawaan saat load)
export const selectDay = (btn, focus) => {
  chosenDay = btn.dataset.day;
  $$('.day', tabs).forEach((b) => { b.setAttribute('aria-selected', b === btn); b.tabIndex = b === btn ? 0 : -1; });
  if (focus) btn.focus({ preventScroll: true });
  // replaceState, bukan pushState: ganti tab tidak perlu menumpuk riwayat back
  // URL = ?hari=…#jadwal saja (parameter lain tidak relevan untuk jadwal)
  const url = new URL(location);
  url.pathname = stripIndex(url.pathname);
  [...url.searchParams.keys()].forEach((k) => { if (k !== 'hari') url.searchParams.delete(k); });
  if (isPastDay(btn.dataset.day)) url.searchParams.delete('hari');
  else url.searchParams.set('hari', btn.dataset.day);
  url.hash = 'jadwal';
  history.replaceState(null, '', url);
  layoutDays();
  renderDay(btn.dataset.day);
};
daysNav.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  const list = $$('.day', tabs);
  selectDay(list[activeIdx(list) + Number(b.dataset.dir)]);
});
tabs.addEventListener('click', (e) => { const b = e.target.closest('.day'); if (b) selectDay(b); });
tabs.addEventListener('keydown', (e) => {
  const list = $$('.day', tabs);
  const i = list.indexOf(document.activeElement);
  if (i < 0) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); selectDay(list[(i + 1) % list.length], true); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); selectDay(list[(i - 1 + list.length) % list.length], true); }
});
renderDay(D.days[defaultIdx].key);
layoutDays();
// transisi dinyalakan setelah frame pertama agar layout awal tidak ikut dianimasikan
requestAnimationFrame(() => tabs.classList.add('is-ready'));
addEventListener('load', layoutDays);

// Halaman dibiarkan terbuka (mis. layar info di lokasi): saat pergantian tanggal
// dan jam tutup (21:00) WIB terlewati, badge "Hari ini"/"Selesai" diperbarui
// dan tab pindah ke hari ini / hari berikutnya. Pilihan pengunjung ke hari LAIN
// yang belum lewat tidak diganggu. Dicek tiap menit + saat tab kembali aktif
// (timer di latar bisa tertunda).
const clockKey = () => `${todayWIB}|${todayIdx}|${dayClosed}`;
const rollDay = () => {
  const before = clockKey();
  const prevAuto = D.days[autoIdx()].key;
  readClock();
  if (clockKey() === before) return;
  let sel = activeIdx($$('.day', tabs));
  const keep = chosenDay && chosenDay !== prevAuto && !isPastDay(chosenDay);
  if (!keep) { sel = autoIdx(); chosenDay = null; }
  // Pengunjung sedang melihat #jadwal → tetap di sana: tinggi panel bisa berubah
  // drastis (mis. 14 acara → "menyusul") dan ScrollTrigger.refresh ikut menggeser.
  const sec = $('#jadwal');
  const r0 = sec.getBoundingClientRect();
  const inView = r0.top < innerHeight && r0.bottom > 0;
  tabs.innerHTML = tabsHTML(sel);
  layoutDays();
  renderDay(D.days[sel].key);
  if (!inView) return;
  // dua frame: tunggu ScrollTrigger.refresh yang dijadwalkan renderDay
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const r1 = sec.getBoundingClientRect();
    // posisi section di layar dipertahankan; kalau section kini terlalu pendek
    // sehingga sudah lewat dari layar, kembali ke awal section
    const dy = r1.bottom - (r1.top - r0.top) < innerHeight * 0.3 ? r1.top : r1.top - r0.top;
    if (Math.abs(dy) < 1) return;
    if (lenis) lenis.scrollTo(scrollY + dy, { immediate: true, force: true });
    else scrollTo({ top: scrollY + dy, behavior: 'instant' });
  }));
};
// Selaras pergantian menit (detik :00) → "Selesai" muncul tepat 21:00:00
export const everyMinute = (fn) => setTimeout(() => { fn(); setInterval(fn, 60000); }, 60000 - (Date.now() % 60000));
everyMinute(rollDay);
document.addEventListener('visibilitychange', () => { if (!document.hidden) rollDay(); });
addEventListener('resize', layoutDays);
