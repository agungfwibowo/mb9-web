import { $, $$, BULAN, D, esc, lenis, reduced, root, stripIndex } from './core.js';

/* ---------------------------------------------------------
   MENU BAGIKAN — dropdown berisi QR (logo di tengah) di atas, lalu
   WhatsApp / Telegram / Facebook / X, salin tautan, unduh QR, dan menu
   share bawaan. Dipakai tombol Bagikan di Jadwal & Bagikan lokasi di Denah.
   --------------------------------------------------------- */
// Ikon brand dari simple-icons (CC0), ditanam agar tetap tampil offline
const BRAND_ICONS = {
  wa: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  tg: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
  fb: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
  x: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
};
const enc = encodeURIComponent;
const NETS = [
  // WhatsApp selalu dibuka dengan salam
  ['wa', 'WhatsApp', (url, t) => `https://wa.me/?text=${enc(`Assalamu'alaikum,\n\n${t}\n${url}`)}`],
  ['tg', 'Telegram', (url, t) => `https://t.me/share/url?url=${enc(url)}&text=${enc(t)}`],
  ['fb', 'Facebook', (url) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`],
  ['x', 'X (Twitter)', (url, t) => `https://x.com/intent/tweet?text=${enc(t)}&url=${enc(url)}`],
];
export const MB9_LOGO = { src: 'assets/img/logo/icon-512.png' };
const fetchImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
// QR + logo digambar di SATU canvas → yang tampil di layar dan file unduhan
// identik. Koreksi galat H (±30% data boleh tertutup); logo dibatasi 22%
// lebar QR agar tetap terbaca kamera.
const drawQR = async (canvas, px, url, logo) => {
  if (!window.qrcode) return false;
  const qr = window.qrcode(0, 'H');
  qr.addData(url);
  qr.make();
  const n = qr.getModuleCount(), quiet = 2, cell = px / (n + quiet * 2);
  canvas.width = canvas.height = px;
  const c = canvas.getContext('2d');
  c.fillStyle = '#fff'; c.fillRect(0, 0, px, px);
  c.fillStyle = '#2b2b2b';
  for (let r = 0; r < n; r++) {
    for (let k = 0; k < n; k++) {
      if (qr.isDark(r, k)) c.fillRect(Math.floor((k + quiet) * cell), Math.floor((r + quiet) * cell), Math.ceil(cell), Math.ceil(cell));
    }
  }
  const img = logo && logo.src && await fetchImg(logo.src);
  if (img) {
    const box = px * .22, x = (px - box) / 2, pad = box * .1;
    c.fillStyle = logo.dark ? '#2b2b2b' : '#fff';
    c.fillRect(x, x, box, box);
    c.strokeStyle = '#2b2b2b'; c.lineWidth = Math.max(2, px * .006);
    c.strokeRect(x, x, box, box);
    const s = Math.min((box - pad * 2) / img.width, (box - pad * 2) / img.height);
    c.drawImage(img, (px - img.width * s) / 2, (px - img.height * s) / 2, img.width * s, img.height * s);
  }
  return true;
};
/* Poster A4 (khusus Bagikan link utama): digambar di canvas 300 dpi
   (2480×3508) lalu dibungkus jadi PDF A4 satu halaman tanpa pustaka
   tambahan. Shape & teks mengikuti gaya situs; grain di seluruh poster,
   area QR dibiarkan bersih supaya tetap mudah dipindai. */
const A4 = { w: 2480, h: 3508 };
const drawPoster = async (url) => {
  try { await Promise.all(['700 100px "Roboto Mono"', '400 100px "Roboto Mono"', '400 100px "Public Sans"', '700 100px "Public Sans"'].map((f) => document.fonts.load(f))); } catch (_) { /* pakai fallback */ }
  const cv = document.createElement('canvas');
  cv.width = A4.w; cv.height = A4.h;
  const c = cv.getContext('2d');
  const INK = '#2b2b2b', LIME = '#c5fa01', BLUE = '#2150f5', WHITE = '#ffffff', M = 170;
  const mono = (sz, w = 700) => `${w} ${sz}px "Roboto Mono", "Noto Sans Mono", monospace`;
  const sans = (sz, w = 400) => `${w} ${sz}px "Public Sans", system-ui, sans-serif`;
  const spaced = (t, x, y, ls) => { // letter-spacing manual (ctx.letterSpacing belum merata)
    for (const ch of t) { c.fillText(ch, x, y); x += c.measureText(ch).width + ls; }
    return x;
  };
  const textW = (t, ls) => [...t].reduce((a, ch) => a + c.measureText(ch).width + ls, -ls);
  const notch = (x, y, w, h, k) => { // sudut kanan-atas & kiri-bawah terpotong, seperti kartu situs
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + w - k, y); c.lineTo(x + w, y + k); c.lineTo(x + w, y + h);
    c.lineTo(x + k, y + h); c.lineTo(x, y + h - k); c.closePath();
  };
  const day = D.days || [], first = day[0] && new Date(`${day[0].iso}T00:00:00+07:00`), last = day[day.length - 1] && new Date(`${day[day.length - 1].iso}T00:00:00+07:00`);
  const BULAN = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
  const HARI = ['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', "JUM'AT", 'SABTU'];
  const wib = (d) => new Date(d.getTime() + 7 * 3600e3); // komponen tanggal WIB lewat getUTC*
  const dRange = first ? `${wib(first).getUTCDate()} – ${wib(last).getUTCDate()}` : '';
  const dMonth = first ? `${BULAN[wib(last).getUTCMonth()]} ${wib(last).getUTCFullYear()}` : '';
  const dDays = first ? `${HARI[wib(first).getUTCDay()]} – ${HARI[wib(last).getUTCDay()]}` : '';
  const hrs = D.hours ? `${D.hours.open.replace(':', '.')} – ${D.hours.close.replace(':', '.')} WIB` : '';
  const venue = ((D.event && D.event.venue) || '').toUpperCase();

  // latar
  c.fillStyle = '#f1f1ee'; c.fillRect(0, 0, A4.w, A4.h);
  // grid garis tipis biru diagonal (seperti latar hero)
  c.save(); c.strokeStyle = 'rgba(33, 80, 245, .16)'; c.lineWidth = 3;
  // landai (belah ketupat melebar) seperti latar hero
  for (let i = -A4.w; i < A4.h + A4.w; i += 260) {
    c.beginPath(); c.moveTo(0, i); c.lineTo(A4.w, i + A4.w * .58); c.stroke();
    c.beginPath(); c.moveTo(0, i); c.lineTo(A4.w, i - A4.w * .58); c.stroke();
  }
  c.restore();

  // HEADER gelap
  const HH = 1340;
  c.fillStyle = INK; c.beginPath(); c.moveTo(0, 0); c.lineTo(A4.w, 0); c.lineTo(A4.w, HH - 120); c.lineTo(A4.w - 120, HH); c.lineTo(0, HH); c.closePath(); c.fill();
  // kicker
  c.font = mono(46); c.textBaseline = 'middle';
  const k1 = 'MUSLIM BERDEDIKASI 9', k2 = 'GENERASI BERDEDIKASI DI MASA DEPAN';
  const k1w = textW(k1, 6) + 60, k2w = textW(k2, 6) + 60;
  c.fillStyle = LIME; c.fillRect(M, 170, k1w, 92);
  c.fillStyle = INK; spaced(k1, M + 30, 216, 6);
  c.strokeStyle = '#8a8a8a'; c.lineWidth = 4; c.strokeRect(M + k1w, 172, k2w, 88);
  c.fillStyle = '#d6d6d6'; spaced(k2, M + k1w + 30, 216, 6);
  // judul: blok seperti hero (putih / lime / putih)
  const lines = [['FESTIVAL ISLAM', null, WHITE], ['& KELUARGA', LIME, INK], ['TERBESAR DI MEDAN', null, WHITE]];
  c.font = mono(150);
  let ty = 360;
  lines.forEach(([t, bg, fg]) => {
    const w = textW(t, 2) + 70;
    if (bg) { c.fillStyle = bg; c.fillRect(M, ty, w, 222); }
    else { c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 4; c.strokeRect(M, ty, w, 222); }
    c.fillStyle = fg; spaced(t, M + 35, ty + 116, 2);
    ty += 244;
  });
  // deskripsi singkat
  c.font = sans(54); c.fillStyle = '#cfcfcf'; c.textBaseline = 'alphabetic';
  c.fillText('Islamic Family Festival — kajian ilmiah, layanan sosial gratis,', M, 1150);
  c.fillText('lomba, bazar & foodcourt untuk seluruh keluarga.', M, 1226);

  // logo MB9 + kotak biru bertumpuk (kanan atas)
  const mark = await fetchImg('assets/img/logo/mb9-mark.webp');
  if (mark) {
    const mw = 560, mh = mark.height * (mw / mark.width);
    c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 60; c.shadowOffsetY = 40;
    c.drawImage(mark, A4.w - mw - 90, 520, mw, mh); c.restore();
  }
  // kotak chat biru bertumpuk — bentuk persis SVG hero (viewBox 170×145),
  // menempel di sudut kanan atas logo dekat tepi kanan
  const u = .95, ox = A4.w - 60 - 167 * u, oy = 455;
  c.save(); c.translate(ox, oy); c.scale(u, u);
  c.fillStyle = '#afc3f8'; c.fillRect(62, 0, 105, 90);
  c.fillStyle = '#628af6'; c.fillRect(31, 18, 105, 90);
  c.fillStyle = BLUE; c.beginPath(); c.moveTo(0, 38); c.lineTo(105, 38); c.lineTo(105, 128); c.lineTo(28, 128); c.lineTo(0, 145); c.closePath(); c.fill();
  c.restore();

  // TANGGAL
  let y = 1680;
  c.font = mono(300); c.fillStyle = BLUE; c.textBaseline = 'alphabetic';
  const dEnd = spaced(dRange, M - 10, y, 0);
  c.font = mono(88); spaced(dMonth.split(' ')[0], dEnd + 40, y - 172, 4); spaced(dMonth.split(' ')[1] || '', dEnd + 40, y - 70, 4);
  y += 60;
  c.fillStyle = INK; c.fillRect(M, y, 10, 285);
  c.font = mono(62); [dDays, hrs, venue].forEach((t, i) => { spaced(t, M + 60, y + 68 + i * 95, 3); });

  // panah (seperti dekorasi hero): hitam ke kanan, lime ke kiri
  const arrow = (x, y, len, dir, col) => {
    c.save(); c.strokeStyle = col; c.lineWidth = 64; c.lineCap = 'butt'; c.lineJoin = 'miter';
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + dir * len, y); c.stroke();
    c.beginPath(); c.moveTo(x + dir * (len - 110), y - 110); c.lineTo(x + dir * len, y); c.lineTo(x + dir * (len - 110), y + 110); c.stroke(); c.restore();
  };

  // QR dalam kartu bernotch
  const qs = 860, qx = M, qy = 2110;
  c.save(); c.fillStyle = INK; notch(qx + 28, qy + 28, qs + 120, qs + 120, 90); c.fill(); c.restore();
  c.fillStyle = WHITE; notch(qx, qy, qs + 120, qs + 120, 90); c.fill();
  c.strokeStyle = INK; c.lineWidth = 10; notch(qx, qy, qs + 120, qs + 120, 90); c.stroke();
  const qc = document.createElement('canvas');
  const okQR = await drawQR(qc, qs, url, MB9_LOGO);
  if (okQR) c.drawImage(qc, qx + 60, qy + 60, qs, qs);
  const qrBox = [qx, qy, qs + 150, qs + 150];

  // kolom kanan: ajakan & isi tautan
  const rx = qx + qs + 260;
  arrow(rx + 520, qy + 110, 520, -1, INK);  // menunjuk ke QR
  arrow(rx + 60, qy + 290, 460, 1, LIME);
  c.font = mono(70); c.fillStyle = INK; c.textBaseline = 'alphabetic';
  spaced('PINDAI', rx, qy + 430, 6); spaced('UNTUK', rx, qy + 520, 6); spaced('INFO:', rx, qy + 610, 6);
  const nT = (D.tenants || []).length;
  const items = ['Jadwal 5 hari', 'Denah tenda', nT ? `${nT} tenant bazar` : 'Tenant bazar', 'Layanan gratis'];
  c.font = sans(52, 700);
  items.forEach((t, i) => {
    const iy = qy + 690 + i * 82;
    c.fillStyle = LIME; c.fillRect(rx, iy - 38, 34, 34);
    c.strokeStyle = INK; c.lineWidth = 4; c.strokeRect(rx, iy - 38, 34, 34);
    c.fillStyle = INK; c.fillText(t, rx + 60, iy);
  });

  // pita miring berisi kegiatan (seperti marquee situs)
  c.save(); c.translate(0, 3215); c.rotate(-.015);
  c.fillStyle = INK; c.fillRect(-60, -58, A4.w + 120, 116);
  c.textBaseline = 'middle';
  // isi pita: 3 kegiatan pertama dari marquee situs (satu sumber, tidak
  // mengarang sendiri) + "DAN MASIH BANYAK LAGI" — satu baris, di tengah;
  // huruf dikecilkan otomatis bila tidak muat
  const acts = $$('.marquee--dark .marquee__track span').map((e) => e.textContent.trim().toUpperCase()).filter(Boolean).slice(0, 3);
  const tape = [...(acts.length ? acts : ['KAJIAN ISLAM ILMIAH', 'BAZAR & FOODCOURT']), 'DAN MASIH BANYAK LAGI'];
  let fs = 42, gap, total;
  do {
    c.font = mono(fs); gap = fs * 2.6;
    total = tape.reduce((a, t) => a + textW(t, 4), 0) + gap * (tape.length - 1);
  } while (total > A4.w - 2 * M && --fs > 28);
  let px = (A4.w - total) / 2;
  tape.forEach((t, i) => {
    const last = i === tape.length - 1;
    c.fillStyle = last ? WHITE : LIME;
    px = spaced(t, px, 2, 4) + 4;
    if (!last) { c.fillStyle = WHITE; c.textAlign = 'center'; c.fillText('✦', px + gap / 2 - 4, 0); c.textAlign = 'left'; px += gap - 4; }
  });
  c.restore();

  // kaki: tautan & hotline
  c.textBaseline = 'alphabetic'; c.font = mono(50); c.fillStyle = INK;
  const host = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  spaced(host.toUpperCase(), M, 3340, 3); // ± 14 mm dari tepi bawah (aman untuk printer)
  if (D.hotline) {
    const ht = `WA ${D.hotline.label}`;
    c.fillStyle = BLUE; spaced(ht, A4.w - M - textW(ht, 3), 3340, 3);
  }

  // NOISE: tile grain 256px, dilapis 'overlay'; area QR dikembalikan bersih
  const tile = document.createElement('canvas'); tile.width = tile.height = 256;
  const tc = tile.getContext('2d'), nd = tc.createImageData(256, 256);
  for (let i = 0; i < nd.data.length; i += 4) { const v = Math.random() * 255; nd.data[i] = nd.data[i + 1] = nd.data[i + 2] = v; nd.data[i + 3] = 255; }
  tc.putImageData(nd, 0, 0);
  const keep = c.getImageData(...qrBox);
  c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = .22; c.fillStyle = c.createPattern(tile, 'repeat'); c.fillRect(0, 0, A4.w, A4.h); c.restore();
  c.putImageData(keep, qrBox[0], qrBox[1]);
  return cv;
};
// Kartu QR persegi 1200px (Jadwal & tenant): logo-teks kecil seperti navbar
// (MUSLIM/BERDEDIKASI + ikon) di atas tengah, judul, QR 900px, tautan.
// Ukuran huruf dikecilkan sampai muat; tetap terlalu panjang → dipotong "…".
const qrCard = async (qrc, title, url) => {
  try { await document.fonts.load('700 40px "Roboto Mono"'); } catch (_) { /* fallback */ }
  const N = 1200, cv = document.createElement('canvas');
  cv.width = cv.height = N;
  const c = cv.getContext('2d');
  const MONO = '"Roboto Mono", "Noto Sans Mono", monospace';
  c.fillStyle = '#fff'; c.fillRect(0, 0, N, N);
  c.drawImage(qrc, (N - qrc.width) / 2, 130);
  const fit = (t, max, size, min, weight, y, col) => {
    let fs = size;
    do { c.font = `${weight} ${fs}px ${MONO}`; } while (c.measureText(t).width > max && --fs > min);
    while (c.measureText(t).width > max && t.length > 4) t = `${t.slice(0, -2)}…`;
    c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, N / 2, y);
  };
  // judul tanpa akhiran nama acara (logo-teks penyelenggara ada di kaki
  // kartu, bukan di sini — lihat bawah). "Nama — Detail" (tenant — tenda,
  // atau Jadwal Acara — hari & tanggal): bagian sebelum tanda hubung jadi
  // judul besar, SISANYA (termasuk hari, bukan cuma tanggal) jadi satu
  // baris kecil abu-abu di bawahnya. Tanpa tanda hubung → satu baris saja.
  // Ruang di atas kini penuh milik judul (dulu berebut dengan logo-teks di
  // sini juga — sumpek saat judulnya 2 baris), jadi baris pertama bisa
  // diturunkan sedikit agar seimbang di tengah celah sebelum QR.
  const cut = title.lastIndexOf(' · ');
  const full = cut > 0 ? title.slice(0, cut) : title;
  const dash = full.indexOf(' — ');
  const main = dash > 0 ? full.slice(0, dash) : full;
  const detail = dash > 0 ? full.slice(dash + 3) : '';
  fit(main, N - 120, detail ? 52 : 44, 26, 700, detail ? 78 : 92, '#2b2b2b');
  if (detail) fit(detail, N - 120, 26, 16, 700, 124, '#777');
  // tautan panjang (mis. tenant dgn query panjang) dipecah 2 baris alih-alih
  // dipotong "…" — makanya kaki kartu (bar gelap) dibikin lebih tipis & diberi
  // jarak ekstra dari baris tautan supaya 2 baris pun tidak nempel ke bar.
  const maxW = N - 120, clean = url.replace(/^https?:\/\//, '');
  c.textAlign = 'center'; c.fillStyle = '#2150f5';
  let ufs = 30;
  c.font = `400 ${ufs}px ${MONO}`;
  while (c.measureText(clean).width > maxW && --ufs > 20);
  if (c.measureText(clean).width <= maxW) {
    c.textBaseline = 'middle'; c.fillText(clean, N / 2, 1040);
  } else {
    const mid = Math.floor(clean.length / 2);
    const delims = '/?&=#';
    let cutAt = -1;
    for (let d = 0; d < mid; d++) {
      if (delims.includes(clean[mid + d])) { cutAt = mid + d + 1; break; }
      if (delims.includes(clean[mid - d])) { cutAt = mid - d + 1; break; }
    }
    if (cutAt < 0) cutAt = mid;
    const l1 = clean.slice(0, cutAt), l2 = clean.slice(cutAt);
    let ufs2 = 24;
    do { c.font = `400 ${ufs2}px ${MONO}`; } while ((c.measureText(l1).width > maxW || c.measureText(l2).width > maxW) && --ufs2 > 14);
    c.textBaseline = 'middle';
    c.fillText(l1, N / 2, 1026); c.fillText(l2, N / 2, 1026 + ufs2 * 1.15);
  }
  // kaki kartu: bilah gelap full-width nempel ke tepi bawah — logo rapat
  // kiri, tanggal acara rapat kanan. Dipepetkan (padding atas-bawah kecil &
  // seimbang) supaya bilahnya ramping, tidak banyak ruang kosong di atas isi.
  const barH = 72, barY = N - barH;
  c.fillStyle = '#202124'; c.fillRect(0, barY, N, barH);
  const fs = 18, lh = fs * .98, mark = await fetchImg('assets/img/logo/mb9-mark-sm.webp?v=2');
  c.font = `700 ${fs}px ${MONO}`;
  const tw = Math.max(c.measureText('MUSLIM').width, c.measureText('BERDEDIKASI').width);
  const mh = lh * 2 + 5, mw = mark ? mark.width * (mh / mark.height) : 0;
  const lx = 36, ly = N - 16 - mh;
  c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'top';
  c.fillText('MUSLIM', lx, ly + 1); c.fillText('BERDEDIKASI', lx, ly + 1 + lh);
  if (mark) c.drawImage(mark, lx + tw + 9, ly - 2, mw, mh);
  // tanggal acara (rentang hari pertama–terakhir, bulan, tahun) — diambil
  // dari D.days, bukan hardcode, biar ikut berubah kalau tanggal diubah.
  const iso = (s) => { const [y, m, d] = s.split('-').map(Number); return { y, m, d }; };
  const d0 = iso(D.days[0].iso), dN = iso(D.days[D.days.length - 1].iso);
  // satu baris lurus, sejajar vertikal dgn logo-teks di kiri: rentang
  // tanggal tebal, bulan & tahun lebih tipis — beda bobot bukan beda baris.
  const dateCY = ly + mh / 2, dfs = 20;
  const p1 = `${d0.d} – ${dN.d} `, p2 = `${BULAN[dN.m - 1].toUpperCase()} ${dN.y}`;
  c.font = `700 ${dfs}px ${MONO}`; const p1w = c.measureText(p1).width;
  c.font = `400 ${dfs}px ${MONO}`; const p2w = c.measureText(p2).width;
  const dx = N - 36 - (p1w + p2w);
  c.textAlign = 'left'; c.textBaseline = 'middle';
  c.font = `700 ${dfs}px ${MONO}`; c.fillStyle = '#fff'; c.fillText(p1, dx, dateCY);
  c.font = `400 ${dfs}px ${MONO}`; c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText(p2, dx + p1w, dateCY);
  return cv;
};
// PDF A4 satu halaman berisi satu gambar JPEG (DCTDecode) — cukup untuk cetak
const jpegToPdf = (jpg, wpx, hpx) => {
  const W = 595.28, H = 841.89, enc = new TextEncoder();
  const parts = [], offs = [];
  let len = 0;
  const push = (b) => { const u = typeof b === 'string' ? enc.encode(b) : b; parts.push(u); len += u.length; };
  const obj = (n, body, stream) => {
    offs[n] = len;
    push(`${n} 0 obj\n${body}\n`);
    if (stream) { push('stream\n'); push(stream); push('\nendstream\n'); }
    push('endobj\n');
  };
  const content = enc.encode(`q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`);
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  obj(4, `<< /Type /XObject /Subtype /Image /Width ${wpx} /Height ${hpx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>`, jpg);
  obj(5, `<< /Length ${content.length} >>`, content);
  const xref = len;
  push(`xref\n0 6\n0000000000 65535 f \n${[1, 2, 3, 4, 5].map((n) => `${String(offs[n]).padStart(10, '0')} 00000 n \n`).join('')}`);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts, { type: 'application/pdf' });
};
const OPT_ICON = {
  copy: '<path d="M9 9h11v11H9zM5 15H4V4h11v1"/>',
  qr: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  more: '<path d="M5 12h.01M12 12h.01M19 12h.01"/>',
};
// Simpan file hasil buatan halaman (QR/poster). Di HP: lembar Bagikan bawaan
// dengan file terlampir (Simpan Gambar / Simpan ke File / kirim) — unduhan lewat
// <a download> sering tanpa notifikasi atau gagal di PWA terpasang (terutama
// iOS). Desktop / perangkat tanpa dukungan: unduhan biasa. iOS menolak share bila
// ketukan sudah "kedaluwarsa" (menunggu pembuatan file) → file disimpan di
// tombolnya dan pengunjung diminta mengetuk sekali lagi. Mengembalikan label status.
const saveFile = async (blob, name, btnEl) => {
  const file = new File([blob], name, { type: blob.type });
  const touch = matchMedia('(pointer: coarse)').matches;
  if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'Tersimpan ✓';
    } catch (err) {
      if (err && err.name === 'AbortError') return 'Dibatalkan';
      if (err && err.name === 'NotAllowedError' && btnEl) { btnEl._pending = { blob, name }; return 'Ketuk lagi untuk simpan'; }
      // selain itu → jatuh ke unduhan biasa
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'Terunduh ✓';
};
// modal: true → kartu yang sama, tapi di TENGAH layar dengan latar gelap,
// halaman dikunci & ada tombol tutup (dipakai logo footer). Di HP (≤860px)
// semua menu Bagikan otomatis tampil sebagai modal ini — ditentukan saat dibuka.
export const shareMenu = (btn, getData, { modal: alwaysModal = false } = {}) => {
  const pop = document.createElement('div');
  pop.className = 'share-pop';
  let modal = alwaysModal;
  const shade = document.createElement('div');
  shade.className = 'share-shade';
  shade.hidden = true;
  document.body.appendChild(shade);
  const setModal = () => {
    modal = alwaysModal || matchMedia('(max-width: 860px)').matches;
    pop.classList.toggle('share-pop--modal', modal);
    if (modal) pop.setAttribute('aria-modal', 'true'); else pop.removeAttribute('aria-modal');
  };
  setModal();
  pop.hidden = true;
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', 'Bagikan');
  pop.setAttribute('data-lenis-prevent', ''); // isinya bisa digulir di layar pendek
  // Ditempel ke <body> (position: fixed), BUKAN di sebelah tombol: di dalam
  // section ia bisa terpotong section berikutnya / kalah stacking context
  // (hero, countdown, marquee). Posisinya dihitung dari tombol di place().
  document.body.appendChild(pop);
  const host = btn.closest('.share') || btn.parentElement;
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.setAttribute('aria-expanded', 'false');
  let data = null;
  // Umpan balik ditulis di DALAM tombolnya sendiri lalu dikembalikan —
  // bukan baris pesan di bawah, yang menambah tinggi dropdown & membuatnya
  // meloncat setiap kali muncul/hilang.
  const say = (b, m) => {
    const lab = $('span', b);
    if (!b.dataset.label) b.dataset.label = lab.textContent;
    lab.textContent = m;
    b.classList.add('is-done');
    clearTimeout(b._t);
    // "Ketuk lagi untuk simpan" (file menunggu) bertahan lebih lama, lalu dibatalkan
    b._t = setTimeout(() => { lab.textContent = b.dataset.label; b.classList.remove('is-done'); b._pending = null; }, b._pending ? 8000 : 1800);
  };
  // Posisi (koordinat layar, ikut tombol saat digulir/diputar):
  // - Denah desktop: di KANAN panel samping, sejajar bawah tombol.
  // - Denah HP: selebar panel. Hero: rata kanan tombol. Lainnya: rata kiri.
  // - HP: buka ke ATAS tombol bila ruangnya cukup (sisakan ±96px untuk nav
  //   yang fixed agar QR tidak tertutup); kalau tidak, ke bawah. Hanya
  //   bergantung pada posisi TOMBOL, jadi tidak berkedip di titik batas.
  // Mendatar selalu dijepit 8px dari tepi layar.
  const place = () => {
    const mobile = matchMedia('(max-width: 860px)').matches;
    const b = btn.getBoundingClientRect(), hr = host.getBoundingClientRect();
    const side = host.classList.contains('share--side');
    const body = pop.querySelector('.share-pop__body');
    if (body) body.style.maxHeight = '';
    pop.style.width = '';
    if (modal) {
      const lim = innerHeight - 32;
      if (body && pop.offsetHeight > lim) body.style.maxHeight = `${Math.max(160, lim - (pop.offsetHeight - body.offsetHeight))}px`;
      pop.style.left = `${Math.round((innerWidth - pop.offsetWidth) / 2)}px`;
      pop.style.top = `${Math.round((innerHeight - pop.offsetHeight) / 2)}px`;
      return;
    }
    // Denah: ke kanan panel hanya kalau ruang di kanan tombol cukup (layout
    // 2 kolom); kalau tidak (1 kolom, termasuk tablet/landscape) selebar panel
    const sideRight = side && b.right + 14 + pop.offsetWidth <= innerWidth - 8;
    if (side && !sideRight) pop.style.width = `${Math.min(hr.width, innerWidth - 16)}px`;
    const w = pop.offsetWidth, h = pop.offsetHeight;
    // batas atas: di bawah nav kalau nav sedang tampil, selain itu tepi layar
    const navEl = document.getElementById('nav');
    const roof = Math.max(0, navEl ? navEl.getBoundingClientRect().bottom : 0) + 8;
    const floor = innerHeight - 8;
    let left, top;
    if (sideRight) { left = b.right + 14; top = b.bottom - h; }
    else {
      left = side ? hr.left : b.left;
      const down = b.bottom + 8, up = b.top - 8 - h;
      const fitsDown = down + h <= floor, fitsUp = up >= roof;
      // HP lebih suka ke atas (jempol di bawah), desktop ke bawah; kalau sisi
      // pilihan tidak muat → sisi lain; kalau dua-duanya tidak → yang lebih lega
      if (mobile ? fitsUp : !fitsDown && fitsUp) top = up;
      else if (fitsDown) top = down;
      else {
        // dua-duanya tidak muat (layar pendek / landscape): pakai sisi yang
        // lebih lega dan isinya dipendekkan + digulir — tombol tidak tertutup
        const roomUp = b.top - 8 - roof, roomDown = floor - b.bottom - 8;
        const room = Math.max(roomUp, roomDown);
        if (body) body.style.maxHeight = `${Math.max(160, room - (h - body.offsetHeight))}px`;
        top = roomUp > roomDown ? b.top - 8 - pop.offsetHeight : down;
      }
    }
    // lebih tinggi dari layar (mis. panel Denah di landscape lebar): isi dipendekkan
    if (body && pop.offsetHeight > floor - roof) {
      body.style.maxHeight = `${Math.max(160, floor - roof - (pop.offsetHeight - body.offsetHeight))}px`;
      if (sideRight) top = b.bottom - pop.offsetHeight;
    }
    // tetap di dalam layar
    top = Math.min(Math.max(top, roof), Math.max(roof, floor - pop.offsetHeight));
    pop.dataset.right = sideRight ? '1' : '';
    pop.style.left = `${Math.round(Math.min(Math.max(left, 8), innerWidth - w - 8))}px`;
    pop.style.top = `${Math.round(top)}px`;
  };
  // Ikut tombol saat digulir hanya sebentar: begitu halaman sudah bergeser
  // lebih dari setengah layar (maks. 360px) sejak dibuka, atau tombolnya
  // keluar layar, dropdown ditutup — tidak menempel terus sepanjang halaman.
  let placeRaf = 0, startY = 0;
  const onMove = () => {
    if (pop.hidden || placeRaf) return;
    placeRaf = requestAnimationFrame(() => {
      placeRaf = 0;
      const b = btn.getBoundingClientRect();
      if (!modal && (Math.abs(scrollY - startY) > Math.min(innerHeight / 2, 360) || b.bottom < 0 || b.top > innerHeight)) { close(); return; }
      place();
    });
  };
  addEventListener('scroll', onMove, { passive: true });
  addEventListener('resize', onMove, { passive: true });
  const close = () => {
    if (pop.hidden) return;
    pop.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (modal) { shade.hidden = true; if (lenis) lenis.start(); }
  };
  const open = () => {
    data = getData();
    if (!data) return;
    setModal();
    const opt = (act, icon, label, wide) => `<button type="button" class="share-pop__opt${wide ? ' share-pop__opt--wide' : ''}" data-act="${act}"><svg class="is-line" viewBox="0 0 24 24" aria-hidden="true">${OPT_ICON[icon]}</svg><span aria-live="polite">${label}</span></button>`;
    pop.innerHTML = `${modal ? '<button type="button" class="share-pop__x" data-act="close" aria-label="Tutup">✕</button>' : ''}<div class="share-pop__body">
        <canvas class="share-pop__qr" role="img" aria-label="Kode QR: ${esc(data.title)}"></canvas>
        <p class="share-pop__cap mono">Pindai untuk membuka</p>
        <div class="share-pop__grid">
          ${NETS.map(([k, label, href]) => `<a class="share-pop__opt" href="${esc(href(data.url, data.title))}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${BRAND_ICONS[k]}"/></svg>${label}</a>`).join('')}
          ${opt('copy', 'copy', 'Salin tautan')}${data.poster ? `<div class="share-pop__dl">${opt('dl', 'qr', 'Unduh…').replace('<button ', '<button aria-haspopup="true" aria-expanded="false" ')}<div class="share-pop__sub" role="menu" hidden><button type="button" role="menuitem" data-act="qr"><span aria-live="polite">QR code saja</span><small>PNG</small></button><button type="button" role="menuitem" data-act="poster"><span aria-live="polite">Poster A4</span><small>PDF</small></button></div></div>` : opt('qr', 'qr', 'Unduh QR')}
          ${opt('native', 'more', 'Bagikan lainnya…', true)}
        </div></div>`;
    const cv = $('.share-pop__qr', pop);
    drawQR(cv, Math.round(168 * Math.min(3, devicePixelRatio || 1)), data.url, data.logo)
      .then((ok) => { if (!ok) { cv.hidden = true; $('.share-pop__cap', pop).hidden = true; } });
    pop.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    startY = scrollY;
    if (modal) { shade.hidden = false; if (lenis) lenis.stop(); }
    place();
    if (modal) return;
    // Layar pendek (HP landscape): atas & bawah tombol sama-sama sempit →
    // gulir halaman agar tombol naik ke dekat atas, lalu dropdown turun
    // dengan ruang penuh. place() ikut berjalan lewat listener scroll.
    const body = pop.querySelector('.share-pop__body');
    if (body && body.style.maxHeight && !pop.dataset.right) {
      const navEl = document.getElementById('nav');
      const roof = Math.max(0, navEl ? navEl.getBoundingClientRect().bottom : 0) + 8;
      const dy = btn.getBoundingClientRect().top - roof;
      // titik awal batas tutup = posisi SESUDAH gulir otomatis ini
      if (dy > 8) { startY = scrollY + dy; if (lenis) lenis.scrollTo(startY, { duration: 0.5 }); else scrollBy({ top: dy, behavior: 'smooth' }); }
    }
  };
  btn.addEventListener('click', (e) => {
    if (!pop.hidden) { close(); return; }
    open();
    // dibuka lewat keyboard (detail 0): fokus pindah ke opsi pertama, karena
    // dropdown kini di ujung <body> dan tidak lagi berikutnya dalam urutan Tab
    if (!e.detail) $('.share-pop__opt', pop)?.focus();
  });
  pop.addEventListener('click', async (e) => {
    // klik di luar tombol Unduh → tooltip pilihannya ditutup
    const openSub = $('.share-pop__sub:not([hidden])', pop);
    if (openSub && !e.target.closest('.share-pop__dl')) { openSub.hidden = true; $('[data-act="dl"]', pop).setAttribute('aria-expanded', 'false'); }
    if (e.target.closest('a')) { setTimeout(close, 150); return; } // jejaring dibuka di tab baru
    const b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'close') { close(); btn.focus(); return; }
    // tombol Unduh (link utama): buka/tutup tooltip pilihan QR saja / Poster A4
    const sub = $('.share-pop__sub', pop);
    if (b.dataset.act === 'dl') {
      sub.hidden = !sub.hidden;
      b.setAttribute('aria-expanded', String(!sub.hidden));
      if (!sub.hidden && !e.detail) $('button', sub).focus();
      return;
    }
    if (b.dataset.act === 'copy') {
      try { await navigator.clipboard.writeText(data.url); say(b, 'Tersalin ✓'); } catch (_) { say(b, 'Gagal menyalin'); }
    } else if (b._pending) {
      // file sudah disiapkan tapi lembar share butuh ketukan baru (iOS) → kirim sekarang
      const f = b._pending; b._pending = null;
      say(b, await saveFile(f.blob, f.name, b));
    } else if (b.dataset.act === 'qr') {
      // file unduhan persegi beresolusi tinggi (1200px) — layak cetak untuk
      // booth: judul di atas, QR di tengah, tautan di bawah
      const qrc = document.createElement('canvas');
      if (!(await drawQR(qrc, 900, data.url, data.logo))) { say(b, 'QR belum siap'); return; }
      const big = await qrCard(qrc, data.title, data.url);
      big.toBlob(async (blob) => say(b, await saveFile(blob, `${data.file}-qr.png`, b)), 'image/png');
    } else if (b.dataset.act === 'poster') {
      say(b, 'Menyiapkan…');
      const cv = await drawPoster(data.url);
      cv.toBlob(async (blob) => {
        const jpg = new Uint8Array(await blob.arrayBuffer());
        say(b, await saveFile(jpegToPdf(jpg, cv.width, cv.height), `${data.file}-poster-a4.pdf`, b));
      }, 'image/jpeg', 0.9);
    } else if (b.dataset.act === 'native') {
      // fungsi tombol Bagikan sebelumnya: lembar share bawaan perangkat,
      // atau salin tautan di browser yang tidak mendukungnya
      try {
        if (navigator.share) { await navigator.share({ title: data.title, text: data.title, url: data.url }); close(); return; }
        await navigator.clipboard.writeText(data.url);
        say(b, 'Tersalin ✓');
      } catch (err) {
        if (!err || err.name !== 'AbortError') say(b, 'Gagal membagikan'); // AbortError = lembar ditutup
      }
    }
  });
  // e.isTrusted: abaikan klik buatan program — link unduhan QR sementara
  // ditempel ke <body> lalu di-.click(), dan tanpa ini dianggap klik di luar
  document.addEventListener('click', (e) => { if (e.isTrusted && !pop.hidden && !pop.contains(e.target) && !btn.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { close(); btn.focus(); } });
  return { close };
};

// Jadwal: tautan dibangun bersih — tanpa ?tenant=/?tenda= sisa memilih tenda
// di denah (kalau ikut, penerima malah dilempar ke denah, bukan ke jadwal).
// Dipanggil saat tombol diklik — "tabs" & D.days sudah terisi oleh saat itu
// meski definisinya ada di bawah sini (urutan deklarasi di file, bukan urutan jalan).
const shareBtn = $('#shareBtn');
if (shareBtn) {
  shareMenu(shareBtn, () => {
    const url = new URL(location.href);
    url.pathname = stripIndex(url.pathname);
    url.searchParams.delete('tenant');
    url.searchParams.delete('tenda');
    url.hash = 'jadwal';
    const ev = (D.event && D.event.title) || 'Muslim Berdedikasi 9';
    // Hari tertentu HANYA disebut kalau ?hari= sudah ada di URL — artinya
    // memang dipilih (klik tab) atau dibuka lewat deep-link. Belum disentuh
    // sama sekali (params kosong, masih tab bawaan) → judul generik "Jadwal
    // N Hari" (N ikut D.days, sama istilahnya dengan poster A4) & tautan
    // tetap bersih, tidak dipaksa menyertakan hari.
    const hariParam = new URLSearchParams(location.search).get('hari');
    const idx = D.days.findIndex((d) => d.key === hariParam);
    const day = D.days[idx];
    // "Hari ke-N" ikut baris judul besar (di kartu QR) — tanda hubung cuma
    // sebelum nama+tanggal hari, jadi tanpa koma nyambung ke "Hari ke-N" lagi.
    const where = day ? ` Hari ke-${idx + 1} — ${day.full}` : '';
    const title = day ? `Jadwal Acara${where}` : `Jadwal Acara Selama ${D.days.length} Hari`;
    const file = day ? `mb9-jadwal-hari-ke-${idx + 1}` : 'mb9-jadwal';
    return { url: url.href, title: `${title} · ${ev}`, logo: MB9_LOGO, file };
  });
}

// Bagikan acara (hero & footer): tautan root yang bersih — tanpa ?hari, ?tenant, #.
// Petunjuk "BAGIKAN" di kotak biru logo hero: disembunyikan selamanya
// setelah pengunjung pernah mengklik logo (hero atau footer).
const KEY_SHARE_SEEN = 'mb9-share-seen';
try { if (localStorage.getItem(KEY_SHARE_SEEN)) root.classList.add('share-seen'); } catch (_) { /* private mode */ }
let hintTimer = 0;
const markShareSeen = () => {
  root.classList.add('share-seen');
  root.classList.remove('hint-pop', 'hint-out');
  clearTimeout(hintTimer);
  try { localStorage.setItem(KEY_SHARE_SEEN, '1'); } catch (_) { /* private mode */ }
};
// HP: balon "BAGIKAN" zoom keluar dari tengah logo selama 6 detik, lalu masuk lagi;
// diulang tiap 30 detik — hanya saat logo hero terlihat & tab aktif —
// sampai logo diklik. Pertama kali setelah animasi intro selesai.
(() => {
  const vis = $('#heroShare');
  if (!vis || root.classList.contains('share-seen')) return;
  const small = matchMedia('(max-width: 860px)');
  let inView = false;
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe(vis);
  const cycle = (wait) => {
    hintTimer = setTimeout(() => {
      if (root.classList.contains('share-seen')) return;
      if (small.matches && inView && !document.hidden) {
        root.classList.add('hint-pop');
        hintTimer = setTimeout(() => {
          // balon mengecil kembali ke tengah logo (.hint-out)
          root.classList.remove('hint-pop');
          root.classList.add('hint-out');
          setTimeout(() => root.classList.remove('hint-out'), 400);
          cycle(30000);
        }, 6000);
      } else cycle(2000); // belum terlihat: cek lagi sebentar lagi
    }, wait);
  };
  cycle(reduced ? 1500 : 3200);
})();
// Logo MB9 di hero, footer & menu mobile: membuka kartu yang sama sebagai modal di tengah layar
['#heroShare', '#footShare', '#menuShare'].map((id) => $(id)).filter(Boolean).forEach((btn) => {
  btn.addEventListener('click', markShareSeen);
  shareMenu(btn, () => ({
    // tanpa "/" penutup: tampil & tersalin sebagai domain.id, bukan domain.id/
    url: (location.origin + stripIndex(location.pathname)).replace(/\/$/, ''),
    title: (D.event && D.event.title) || 'Muslim Berdedikasi 9',
    logo: MB9_LOGO,
    file: 'mb9',
    poster: true, // "Unduh QR" → poster A4 (PDF)
  }), { modal: true });
});
