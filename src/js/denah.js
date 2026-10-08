import { $, $$, D, esc, hasGsap, lenis, reduced, root, stripIndex } from './core.js';
import { lockNav } from './navbar.js';
import { MB9_LOGO, shareMenu } from './bagikan.js';
import { JICONS, dayLabel, fmtMin, iconKey, openDayAt, tendaName, toMin, wibNow } from './jadwal.js';
import { focusSession } from './asatidz.js';
import { boothsOf } from './tenant.js';

/* ---------------------------------------------------------
   DENAH INTERAKTIF (SVG, koordinat mengikuti layout tenant)
   --------------------------------------------------------- */
const CATS = {
  subsidi: { label: 'Tenda Subsidi', fill: '#c616c6', text: '#fff' }, // #c616c6: kontras teks putih 4,85 (min. 4,5)
  nonfood: { label: 'Tenda Non-Food', fill: '#2150f5', text: '#fff' },
  vip: { label: 'Tenda VIP', fill: '#efd48f', text: '#2b2b2b' },
  food: { label: 'Tenda Food', fill: '#c5fa01', text: '#2b2b2b' },
  rasyaad: { label: 'Tenda Rasyaad TV', fill: '#3f7a1f', text: '#fff' },
  sekolah: { label: 'Tenda Sekolah', fill: '#f06414', text: '#fff' },
};
const booths = [];
const add = (n, cat, x, y, w = 42, h = 42) => booths.push({ n, cat, x, y, w, h });
for (let i = 0; i < 7; i++) add(i + 1, 'subsidi', 172 + i * 42, 305, 40);
for (let i = 0; i < 7; i++) add(i + 8, 'subsidi', 530 + i * 43, 305);
for (let i = 0; i < 5; i++) add(19 - i, 'nonfood', 248 + i * 44.5, 486);
for (let i = 0; i < 6; i++) add(59 - i, 'nonfood', 527 + i * 44.2, 486);
for (let i = 0; i < 11; i++) add(20 + i, 'food', 207, 527 + i * 43.3, 41, 42);
add(31, 'rasyaad', 207, 527 + 11 * 43.3, 41, 42);
add(32, 'rasyaad', 207, 1047, 41, 42);
add(33, 'sekolah', 250, 1047, 42, 42);
for (let i = 0; i < 3; i++) add(34 + i, 'food', 293 + i * 44, 1047);
for (let i = 0; i < 5; i++) add(37 + i, 'food', 570 + i * 44.5, 1047);
for (let i = 0; i < 12; i++) add(53 - i, 'food', 792, 527 + i * 43.3, 41, 42);
for (let i = 0; i < 9; i++) {
  add(60 + i, 'nonfood', 358, 580 + i * 45, 44, 43);
  add(69 + i, 'vip', 403, 580 + i * 45, 44, 43);
  add(78 + i, 'vip', 600, 580 + i * 45, 44, 43);
  add(87 + i, 'nonfood', 645, 580 + i * 45, 44, 43);
}

// Tenda → tenant dari D.placements. Nama yang tidak cocok dengan daftar
// tenants (salah ketik saat diedit) diberi peringatan di console.
const tenantAt = {};
const owners = [...D.tenants, ...(D.boothOwners || [])];
const tenantNames = new Set(owners.map((t) => t[0]));
// pemilik tanpa file logo (mis. layanan Donor Darah) → tooltip memakai ikon layanan
const tenantLogo = Object.fromEntries(owners.filter(([, file]) => file).map(([name, file, tone]) => [name, { src: `assets/img/tenant/${file}`, dark: tone === 'dark' }]));
(D.placements || []).forEach(([name, from, to = from]) => {
  if (!tenantNames.has(name)) console.warn(`[denah] tenant "${name}" tidak ada di daftar tenants`);
  for (let n = from; n <= to; n++) tenantAt[n] = name;
});

const svg = $('#denahSvg');
export const pad = (n) => String(n).padStart(2, '0');
svg.innerHTML = `
    <rect x="88" y="168" width="874" height="948" fill="#2b2b2b"/>
    <rect x="150" y="280" width="705" height="820" fill="#3a3a3a"/>
    <rect x="248" y="527" width="544" height="520" fill="#4a4a4a"/>
    <rect x="482" y="262" width="30" height="225" fill="#6a6a6a"/>
    <rect x="455" y="580" width="67" height="405" fill="#e2e2e2"/>
    <rect x="526" y="580" width="68" height="405" fill="#cfcfcf"/>
    <text class="label" transform="translate(496 782) rotate(90)" text-anchor="middle" font-size="15">TENDA MAKAN PENGUNJUNG</text>
    <text class="label" transform="translate(552 782) rotate(-90)" text-anchor="middle" font-size="15">TENDA MAKAN PENGUNJUNG</text>
    <rect x="430" y="1040" width="135" height="46" fill="#fff"/>
    <text class="label" x="497" y="1070" text-anchor="middle">PANGGUNG</text>
    <rect x="468" y="456" width="58" height="26" fill="#c5fa01"/>
    <text class="label" x="497" y="475" text-anchor="middle" font-size="15">GATE</text>
    <path d="M450 198h90v40l-45 28-45-28Z" fill="#c5fa01" stroke="#2b2b2b" stroke-width="2"/>
    <text class="label" x="495" y="228" text-anchor="middle">MASUK</text>
    <g id="boothLayer">${booths.map((b) => `
      <g class="booth" data-n="${b.n}" data-cat="${b.cat}"${tenantAt[b.n] ? ` data-tenant="${esc(tenantAt[b.n])}"` : ''} tabindex="0" role="button" aria-label="Tenda ${pad(b.n)}, ${CATS[b.cat].label}${tenantAt[b.n] ? `, ${esc(tenantAt[b.n])}` : ''}">
        <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${CATS[b.cat].fill}"/>
        <text x="${b.x + b.w / 2}" y="${b.y + b.h / 2 + 6}" text-anchor="middle" fill="${CATS[b.cat].text}">${pad(b.n)}</text>
      </g>`).join('')}
    </g>`;

/* Angka statistik (Tema) diambil dari data, bukan ditulis manual */
(() => {
  const setStat = (key, val, sfx) => {
    const el = $(`[data-stat="${key}"]`); if (!el || !Number.isFinite(val)) return;
    el.dataset.count = String(val);
    if (sfx !== undefined) el.dataset.suffix = sfx;
  };
  const toMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); };
  setStat('days', D.days.length);
  setStat('booths', booths.length);
  if (D.hours && D.hours.open && D.hours.close) {
    const jam = Math.round((toMin(D.hours.close) - toMin(D.hours.open)) / 60);
    setStat('hours', jam, ' jam');
  }
})();

const legend = $('#legend');
legend.innerHTML = Object.entries(CATS).map(([k, c]) => `
    <button class="chip" data-cat="${k}" aria-pressed="false" style="--c:${c.fill};--t:${c.text}"><i></i><span class="chip__label">${c.label}</span><em>${booths.filter((b) => b.cat === k).length}</em></button>`).join('');
let activeCat = null;
legend.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip'); if (!chip) return;
  activeCat = activeCat === chip.dataset.cat ? null : chip.dataset.cat;
  // klik pointer yang mematikan filter: lepas fokus agar label melayang ikut hilang
  if (!activeCat && e.detail) chip.blur();
  $$('.chip', legend).forEach((c) => c.setAttribute('aria-pressed', c.dataset.cat === activeCat));
  legend.classList.toggle('has-active', !!activeCat);
  svg.classList.toggle('is-filtered', !!activeCat);
  $$('.booth', svg).forEach((g) => g.classList.toggle('is-dim', !!activeCat && g.dataset.cat !== activeCat));
  if (hasGsap && !reduced && activeCat) {
    gsap.fromTo($$(`.booth[data-cat="${activeCat}"]`, svg), { scale: .6 }, { scale: 1, duration: .5, stagger: .01, ease: 'back.out(3)', clearProps: 'transform' });
  }
});

const tip = $('#boothTip');
const stage = $('.denah__stage');
// Tooltip dipindah keluar dari stage (yang memotong isinya lewat clip-path
// notch) ke .denah__wrap — kartunya boleh melewati tepi denah.
const tipBox = $('.denah__wrap');
tipBox.appendChild(tip);
const boothShare = $('#boothShare');
const boothShareLabel = $('span', boothShare);
let shareText = 'Bagikan lokasi';
// Isi tooltip dibangun ulang hanya saat tendanya berganti — kalau tiap
// pointermove, <img> logo ikut dibuat ulang terus dan berkedip.
let tipFor = null;
// Tautan situs (D.links) — hanya bisa diklik saat tooltip menempel di tenda
// terpilih (.is-live); saat mengikuti kursor ia tetap tembus klik.
const linkOf = (g) => {
  const url = D.links && D.links[g.dataset.tenant];
  if (!url) return '';
  const host = new URL(url).hostname.replace(/^www\./, '');
  return `<a class="booth-tip__link" href="${esc(url)}" target="_blank" rel="noopener" data-cursor="Buka">${esc(host)} <span aria-hidden="true">↗</span></a>`;
};
// Jam buka–tutup tenda yang punya jadwal (judul / r.tenda sama dengan nama
// pemilik tenda) di hari terdekat: hari ini selama masih ada sesi yang belum
// selesai (status Buka / Tutup / Buka jam …), kalau tidak hari acara
// berikutnya yang memuatnya (label Besok / "Sab, 26 Des"). Tak ada lagi → kosong.
const sessOn = (d, who) => ((d && D.jadwal && D.jadwal[d.key]) || []).filter((r) => tendaName(r) === who);
const hoursOf = (who) => {
  const now = wibNow();
  const today = openDayAt(Date.now());
  let day = today;
  let rs = sessOn(today, who);
  if (!rs.some((r) => toMin(r.time.split(' - ')[1]) > now.min)) {
    const next = D.days.find((d) => d.iso > now.iso && sessOn(d, who).length);
    if (next) { day = next; rs = sessOn(next, who); }
  }
  if (!rs.length) return '';
  const i = D.days.indexOf(day);
  return rs.map((r) => {
    const [a, b] = r.time.split(' - ').map(toMin);
    const [st, cls] = day !== today ? [dayLabel(day, now.iso), 'is-wait']
      : now.min < a ? [`Buka ${fmtMin(a)}`, 'is-wait'] : now.min >= b ? ['Tutup', 'is-closed'] : ['Buka', 'is-open'];
    const when = day === today ? 'Hari ini' : `Hari ke-${i + 1}`;
    // tautan ke sesinya di jadwal: dibuka & dikedipkan lewat focusSession (handler di tip)
    return `<span class="booth-tip__hrs mono"><a href="#jadwal" data-day="${day.key}" data-t="${esc(r.time)}" data-title="${esc(r.title)}">${when} ${fmtMin(a)}–${fmtMin(b)}</a> <em class="${cls}">${st}</em></span>`;
  }).join('');
};
// klik jam di tooltip → buka acaranya di jadwal (tab harinya, gulir, kedip)
tip.addEventListener('click', (e) => {
  const a = e.target.closest('.booth-tip__hrs a[data-day]');
  if (!a) return;
  const hit = focusSession(a.dataset.day, (pn) => $$('.jrow[data-t], .jcard__item[data-t]', pn)
    .find((x) => x.dataset.t === a.dataset.t && $('h3 span', x)?.textContent === a.dataset.title));
  if (hit) { e.preventDefault(); e.stopPropagation(); }
});
const fillTip = (g) => {
  if (tipFor === g) return;
  tipFor = g;
  const meta = `Tenda ${pad(g.dataset.n)} · ${CATS[g.dataset.cat].label.replace('Tenda ', '')}`;
  const who = g.dataset.tenant;
  const logo = who && tenantLogo[who];
  tip.classList.toggle('has-logo', !!who);
  const mark = logo
    ? `<span class="booth-tip__logo${logo.dark ? ' is-dark' : ''}"><img src="${esc(logo.src)}" alt="" decoding="async"></span>`
    : `<span class="booth-tip__logo is-icon"><svg class="jico" viewBox="0 0 24 24" aria-hidden="true"><path d="${JICONS[iconKey({ title: who || '' })]}"/></svg></span>`;
  tip.innerHTML = who
    ? `${mark}<span class="booth-tip__txt"><small>${esc(meta)}</small><b>${esc(who)}</b>${hoursOf(who)}${linkOf(g)}</span>`
    : esc(meta);
};
// Koordinat layar (clientX/Y). Kartu di atas titik `top`; kalau ruang di
// atasnya (sampai tepi layar) tidak cukup, dibalik ke bawah titik `bottom`.
// Mendatar dijepit ke stage — di mobile ke lebar layar, karena stage di sana
// hampir selebar layar dan kartu berlogo bisa lebih lebar dari tendanya.
const placeTip = (x, top, bottom = top) => {
  const wr = tipBox.getBoundingClientRect(), sr = stage.getBoundingClientRect();
  const half = tip.offsetWidth / 2 + 8;
  const mobile = innerWidth <= 860;
  const lo = (mobile ? 0 : sr.left) + half, hi = (mobile ? innerWidth : sr.right) - half;
  // batas atas: tepi layar, atau bawah nav kalau nav sedang tampil
  const navEl = document.getElementById('nav');
  const roof = Math.max(0, navEl ? navEl.getBoundingClientRect().bottom : 0) + 8;
  const below = top - tip.offsetHeight * 1.3 < roof;
  tip.classList.toggle('is-below', below);
  tip.style.left = `${Math.min(Math.max(x, lo), Math.max(lo, hi)) - wr.left}px`;
  tip.style.top = `${(below ? bottom : top) - wr.top}px`;
  tip.classList.add('is-on');
  tip.classList.remove('is-live');
};
// Tooltip yang menempel di tenda terpilih: cek ulang atas/bawah saat digulir.
let tipRaf = 0;
addEventListener('scroll', () => {
  if (tipRaf || !picked || tipFor !== picked || !tip.classList.contains('is-on')) return;
  tipRaf = requestAnimationFrame(() => { tipRaf = 0; if (picked && tipFor === picked) tipAtBooth(picked); });
}, { passive: true });
const hideTip = () => { tip.classList.remove('is-on'); tipFor = null; };
// Kotak tenda di layar, dihitung dari koordinat ASLI di data booths lewat
// viewBox — BUKAN getBoundingClientRect milik <g>-nya. Animasi pop-in
// (gsap.from scale 0) memasang transform awalnya sejak load dan baru jalan
// saat denah terlihat; selama itu ukuran elemennya meleset hingga ~1000px,
// sehingga lompatan dari link tenant saat load pertama kebablasan.
export const boothRect = (g) => {
  const b = booths.find((x) => x.n === Number(g.dataset.n));
  const sr = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
  const k = Math.min(sr.width / vb.width, sr.height / vb.height); // preserveAspectRatio: meet
  const ox = sr.left + (sr.width - vb.width * k) / 2, oy = sr.top + (sr.height - vb.height * k) / 2;
  return { left: ox + (b.x - vb.x) * k, top: oy + (b.y - vb.y) * k, width: b.w * k, height: b.h * k };
};
// tooltip menempel di atas sebuah tenda (bukan mengikuti kursor)
const tipAtBooth = (g) => {
  fillTip(g);
  const br = boothRect(g);
  placeTip(br.left + br.width / 2, br.top + 4, br.top + br.height - 4);
  tip.classList.toggle('is-live', g.classList.contains('is-sel') && !!$('a', tip));
};

/* Tooltip perkenalan denah — tampil sekali, disimpan sampai acara berakhir */
(() => {
  const coach = $('#denahCoach');
  if (!coach) return;
  const KEY = 'mb9:denahCoach';
  const lastDay = D.days[D.days.length - 1];
  const eventEnd = new Date(`${lastDay.iso}T${(D.hours && D.hours.close) || '21:00'}:00+07:00`).getTime();
  const read = () => { try { return +localStorage.getItem(KEY) || 0; } catch { return 0; } };
  const seen = () => { try { localStorage.setItem(KEY, String(eventEnd)); } catch { /* private mode */ } };
  if (read() > Date.now()) return;              // sudah pernah ditutup & acara belum berakhir
  if (Date.now() > eventEnd) return;            // acara sudah lewat

  let shown = false;
  const close = () => {
    if (!shown) return;
    shown = false; coach.hidden = true; seen();
    removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const io = new IntersectionObserver((entries, obs) => {
    if (!entries.some((en) => en.isIntersecting)) return;
    obs.disconnect();
    setTimeout(() => {
      if (read() > Date.now()) return;
      coach.hidden = false; shown = true;
      addEventListener('keydown', onKey);
    }, 700);
  }, { threshold: .35 });
  io.observe($('.denah__stage'));
  // hanya tombol "Mengerti" yang menutup — klik di denah atau di badan tooltip
  // tidak lagi menutupnya, agar petunjuknya tidak hilang tanpa sengaja
  $('#denahCoachOk').addEventListener('click', close);
})();
// Sorot grup tenant. Tenda satu tenant bisa berderet ATAU berjauhan (mis.
// satu di VIP, satu di Food), jadi dua lapis:
//  1) spotlight — tenda lain dipudarkan (svg.has-pick), tenda tenant ini
//     tetap penuh warna + garis putih; berlaku di mana pun letaknya;
//  2) bingkai putus-putus per KELOMPOK yang benar-benar bersebelahan —
//     bukan satu kotak raksasa yang membentang di antara tenda berjauhan.
const groupLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
groupLayer.setAttribute('class', 'booth-groups');
svg.appendChild(groupLayer);
// Sorotan grup untuk satu tenda: dipakai saat dipilih (klik/ketuk) DAN saat
// di-hover mouse. g = null → tidak ada sorotan.
export let picked = null;
const paintGroup = (g) => {
  $$('.booth.is-mate', svg).forEach((x) => x.classList.remove('is-mate'));
  groupLayer.innerHTML = '';
  const name = g && g.dataset.tenant;
  svg.classList.toggle('has-pick', !!name);
  if (!name) return;
  // tenda yang sedang dipilih tidak diberi is-mate: aturan is-mate datang
  // belakangan di CSS dan akan mengecilkan skala 1.18 miliknya
  $$('.booth', svg).forEach((x) => {
    if (x !== g && !x.classList.contains('is-sel') && x.dataset.tenant === name) x.classList.add('is-mate');
  });
  showGroup(name);
};
const clearSel = () => {
  $$('.booth.is-sel', svg).forEach((x) => x.classList.remove('is-sel'));
  picked = null;
  paintGroup(null);
};
// dua tenda dianggap menempel bila celahnya <= 6 unit dan sisinya bertumpuk
const touching = (a, b) => {
  const gapX = Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w);
  const gapY = Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h);
  return (gapX <= 6 && gapY < 0) || (gapY <= 6 && gapX < 0);
};
const showGroup = (name) => {
  const mine = booths.filter((b) => tenantAt[b.n] === name);
  const clusters = [];
  mine.forEach((b) => {
    const hit = clusters.filter((c) => c.some((m) => touching(m, b)));
    const merged = hit.flat().concat(b);
    hit.forEach((c) => clusters.splice(clusters.indexOf(c), 1));
    clusters.push(merged);
  });
  const P = 6;
  groupLayer.innerHTML = clusters.filter((c) => c.length > 1).map((c) => {
    const x1 = Math.min(...c.map((b) => b.x)) - P, y1 = Math.min(...c.map((b) => b.y)) - P;
    const x2 = Math.max(...c.map((b) => b.x + b.w)) + P, y2 = Math.max(...c.map((b) => b.y + b.h)) + P;
    return `<rect class="booth-group" x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}"/>`;
  }).join('');
  svg.appendChild(groupLayer); // tetap paling atas setelah tenda dipindah ke depan
};
const selectBooth = (g) => {
  clearSel();
  g.classList.add('is-sel');
  // Tooltip juga untuk ketukan & keyboard — sebelumnya hanya mengikuti
  // gerakan mouse, jadi di HP tidak pernah muncul sama sekali
  tipAtBooth(g);
  // tenant dengan beberapa tenda: tenda lainnya ikut disorot
  picked = g;
  paintGroup(g);
  setBoothUrl(g);
  denahShare.close(); // isi menu (QR, judul) milik tenda sebelumnya
  shareText = `Bagikan lokasi · ${g.dataset.tenant || `Tenda ${pad(g.dataset.n)}`}`;
  boothShareLabel.textContent = shareText;
  boothShare.hidden = false;
  g.parentNode.appendChild(g); // bawa ke depan
};
// SVG tidak punya z-index: booth yang di-hover dipindah ke akhir layer agar tampil di atas tetangganya
const toFront = (g) => { if (g && g !== g.parentNode.lastElementChild) g.parentNode.appendChild(g); };
// Hover mouse: pratinjau sorotan grup tenant, sama seperti saat diklik.
// Keluar dari tenda → kembali ke sorotan tenda yang terakhir dipilih.
svg.addEventListener('pointerover', (e) => {
  const g = e.target.closest('.booth');
  toFront(g);
  if (g && e.pointerType !== 'touch') paintGroup(g);
});
svg.addEventListener('pointerout', (e) => {
  const g = e.target.closest('.booth');
  if (!g || g.contains(e.relatedTarget)) return;
  toFront($('.booth.is-sel', svg));
  if (e.pointerType !== 'touch') paintGroup(picked);
});
// ketuk area kosong denah: lepas pilihan, bingkai grup, dan tooltip
svg.addEventListener('click', (e) => { const g = e.target.closest('.booth'); if (g) selectBooth(g); else if (picked) { clearSel(); hideTip(); setBoothUrl(null); denahShare.close(); boothShare.hidden = true; } });
svg.addEventListener('keydown', (e) => {
  const g = e.target.closest('.booth');
  if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectBooth(g); }
});
// Mengikuti kursor hanya untuk mouse/pen. Sentuhan ditangani selectBooth;
// jari yang terangkat memicu pointerleave dan akan langsung menutupnya.
svg.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  const g = e.target.closest('.booth');
  // Di area kosong: kalau ada tenda terpilih, tooltip kembali ke tenda itu
  // (seperti sorotan grupnya) — bukan ditutup. Penting setelah lompatan dari
  // daftar tenant: usai menggulir, browser mengirim gerak mouse sintetis dan
  // tooltip tenda yang baru dipilih langsung hilang.
  if (!g) { if (picked) tipAtBooth(picked); else hideTip(); return; }
  // tenda terpilih: tooltip diam di atasnya supaya tautannya bisa dijangkau
  if (g === picked) { tipAtBooth(g); return; }
  fillTip(g);
  placeTip(e.clientX, e.clientY, e.clientY + 28);
});
svg.addEventListener('pointerleave', (e) => {
  if (e.pointerType === 'touch') return;
  if (picked) tipAtBooth(picked); else hideTip();
});

/* Gambar asli → lightbox di halaman (bukan tab baru): zoom lewat roda /
   cubit / tombol / ketuk 2×, geser lewat seret. Klik dengan Ctrl/⌘/Shift
   atau klik tengah tetap membuka tab baru seperti link biasa. */
(() => {
  const link = $('#denahImgLink'), dlg = $('#zoomDlg');
  if (!link || !dlg || !dlg.showModal) return;
  const st = $('#zoomStage'), img = $('#zoomImg'), pct = $('#zoomPct');
  let k = 1, fit = 1, x = 0, y = 0;
  const MAX = 4;
  const apply = () => {
    img.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
    pct.textContent = `${Math.round(k / fit * 100)}%`;
  };
  // jaga gambar tidak terseret keluar: kalau lebih kecil dari layar → di tengah
  const clamp = () => {
    const W = st.clientWidth, H = st.clientHeight, w = img.naturalWidth * k, h = img.naturalHeight * k;
    x = w <= W ? (W - w) / 2 : Math.min(0, Math.max(W - w, x));
    y = h <= H ? (H - h) / 2 : Math.min(0, Math.max(H - h, y));
  };
  const zoomAt = (nk, cx, cy) => {
    nk = Math.min(Math.max(nk, fit), fit * MAX);
    x = cx - (cx - x) * (nk / k); y = cy - (cy - y) * (nk / k); k = nk;
    clamp(); apply();
  };
  const reset = () => {
    fit = Math.min(st.clientWidth / img.naturalWidth, st.clientHeight / img.naturalHeight);
    k = fit; clamp(); apply();
  };
  const open = () => {
    if (!img.src) img.src = link.querySelector('img').currentSrc || link.href;
    dlg.showModal();
    root.classList.add('zoom-open');
    if (lenis) lenis.stop();
    img.complete && img.naturalWidth ? reset() : img.addEventListener('load', reset, { once: true });
  };
  link.addEventListener('click', (e) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault(); open();
  });
  dlg.addEventListener('close', () => { root.classList.remove('zoom-open'); if (lenis) lenis.start(); });
  addEventListener('resize', () => { if (dlg.open) reset(); });
  const center = () => [st.clientWidth / 2, st.clientHeight / 2];
  $$('[data-zoom]', dlg).forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.zoom;
    if (a === 'close') dlg.close();
    else if (a === 'fit') reset();
    else zoomAt(k * (a === 'in' ? 1.5 : 1 / 1.5), ...center());
  }));
  st.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = st.getBoundingClientRect();
    zoomAt(k * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025)), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
  // seret (1 jari / mouse) & cubit (2 jari) lewat Pointer Events
  const pts = new Map();
  let last = null, lastTap = 0;
  const mid = () => { const [a, b] = [...pts.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) }; };
  st.addEventListener('pointerdown', (e) => {
    st.setPointerCapture(e.pointerId);
    const r = st.getBoundingClientRect();
    pts.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top });
    last = pts.size === 2 ? mid() : null;
    st.classList.add('is-drag');
    // ketuk/klik 2× → perbesar 2.5× di titik itu, atau kembali pas layar
    if (pts.size === 1) {
      const now = Date.now(), p = pts.get(e.pointerId);
      if (now - lastTap < 300) { k > fit * 1.05 ? reset() : zoomAt(fit * 2.5, p.x, p.y); lastTap = 0; } else lastTap = now;
    }
  });
  st.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    const r = st.getBoundingClientRect(), prev = pts.get(e.pointerId);
    const cur = { x: e.clientX - r.left, y: e.clientY - r.top };
    pts.set(e.pointerId, cur);
    if (pts.size === 1) { x += cur.x - prev.x; y += cur.y - prev.y; clamp(); apply(); }
    else if (pts.size === 2) {
      const m = mid();
      if (last) { x += m.x - last.x; y += m.y - last.y; zoomAt(k * (m.d / last.d), m.x, m.y); }
      last = m;
    }
  });
  const up = (e) => { pts.delete(e.pointerId); last = pts.size === 2 ? mid() : null; if (!pts.size) st.classList.remove('is-drag'); };
  st.addEventListener('pointerup', up);
  st.addEventListener('pointercancel', up);
  // klik di luar gambar (latar) menutup — tapi bukan akhir dari seretan
  let moved = false;
  st.addEventListener('pointerdown', () => { moved = false; });
  st.addEventListener('pointermove', (e) => { if (pts.has(e.pointerId)) moved = true; });
  st.addEventListener('click', (e) => { if (!moved && e.target === st) dlg.close(); });
})();

$$('.seg button').forEach((b) => b.addEventListener('click', () => {
  $$('.seg button').forEach((x) => x.setAttribute('aria-selected', x === b));
  $$('.denah__view').forEach((v) => v.classList.toggle('is-active', v.dataset.pane === b.dataset.view));
  const isImg = b.dataset.view === 'img';
  $('.denah__side').classList.toggle('is-img', isImg);
  $$('.chip', legend).forEach((c) => { c.disabled = isImg; });
  if (isImg) hideTip(); // tooltip kini di luar pane peta → tidak ikut tersembunyi
  else if (picked) tipAtBooth(picked);
  boothShare.hidden = isImg || !picked; // jangan melayang di atas gambar asli
  if (boothShare.hidden) denahShare.close();
  if (hasGsap) ScrollTrigger.refresh();
}));

// Slug nama tenant untuk URL: "Adiani Syar'i" → "adiani-syar-i"
export const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const firstBoothOf = (name) => $$('.booth', svg)
  .filter((x) => x.dataset.tenant === name)
  .sort((x, y) => x.dataset.n - y.dataset.n)[0];
// ?tenda=38 (nomor) atau ?tenant=rasa-coffee (slug / nama)
export const findBooth = (q) => {
  if (/^\d{1,3}$/.test(q)) return $(`.booth[data-n="${Number(q)}"]`, svg);
  const s = slug(q);
  const name = [...tenantNames].find((n) => slug(n) === s);
  return name ? firstBoothOf(name) : null;
};
// Gulir sampai tenda di TENGAH layar lalu pilih — bukan ke judul #denah,
// karena tenda di bagian bawah denah (mis. 38) akan berada di luar layar.
export const focusBooth = (g) => {
  const mapBtn = $('.seg button[data-view="map"]');
  if (mapBtn && mapBtn.getAttribute('aria-selected') !== 'true') mapBtn.click();
  lockNav();
  // Posisi dihitung sebagai ANGKA: Lenis.scrollTo hanya menerima elemen
  // HTML — tenda adalah <g> SVG, jadi kalau dioper langsung perintahnya
  // diabaikan diam-diam (tidak menggulir, onComplete tak pernah terpanggil).
  const br = boothRect(g);
  const y = scrollY + br.top + br.height / 2 - innerHeight / 2;
  if (lenis) lenis.scrollTo(y, { duration: 1.1, onComplete: () => { lockNav(250); selectBooth(g); } });
  else {
    g.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => selectBooth(g), reduced ? 50 : 650);
  }
};
// URL ikut menunjuk tenda yang dipilih → address bar bisa langsung disalin
// & dibagikan. replaceState: memilih tenda tidak menumpuk riwayat Back.
const setBoothUrl = (g) => {
  const url = new URL(location.href);
  url.pathname = stripIndex(url.pathname);
  url.searchParams.delete('tenant'); url.searchParams.delete('tenda');
  if (g) url.searchParams.set(g.dataset.tenant ? 'tenant' : 'tenda', g.dataset.tenant ? slug(g.dataset.tenant) : g.dataset.n);
  url.hash = 'denah';
  history.replaceState(null, '', url);
};

// Bagikan lokasi tenda terpilih — menu yang sama dengan Jadwal; QR memakai
// logo tenant (atau logo MB9 untuk tenda tanpa tenant). URL ?tenant=…#denah
// sudah ditulis setBoothUrl; ?hari= sisa jadwal dibuang agar rapi.
const denahShare = shareMenu(boothShare, () => {
  if (!picked) return null;
  const url = new URL(location.href);
  url.pathname = stripIndex(url.pathname);
  url.searchParams.delete('hari');
  const who = picked.dataset.tenant;
  // tenant dengan beberapa tenda (berderet atau berjauhan): semua nomornya
  // ikut ditulis di judul share — bukan cuma tenda yang diklik
  const where = `Tenda ${who && boothsOf[who] ? boothsOf[who].join(', ') : pad(picked.dataset.n)}`;
  const ev = (D.event && D.event.title) || 'Muslim Berdedikasi 9';
  return {
    url: url.href,
    title: who ? `${who} — ${where} · ${ev}` : `${where} · ${ev}`,
    logo: (who && tenantLogo[who]) || MB9_LOGO,
    file: `mb9-${who ? slug(who) : `tenda-${pad(picked.dataset.n)}`}`,
  };
});

// Klik tenant di slider/daftar. Didaftarkan sebelum handler anchor global,
// jadi stopImmediatePropagation mencegah guliran ganda ke awal section.
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-tenant-link]');
  if (!a) return;
  const first = firstBoothOf(a.dataset.tenantLink);
  if (!first) return; // tanpa tenda: biarkan handler anchor ke #denah
  e.preventDefault();
  e.stopImmediatePropagation();
  focusBooth(first);
});
