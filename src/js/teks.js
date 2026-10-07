import { $$, esc } from './core.js';

/* ---------------------------------------------------------
   TEXT EFFECTS
   --------------------------------------------------------- */
const GLYPHS = '`¡™£¢∞§¶•ªº–≠åß∂ƒ©˙∆˚¬…æ≈ç√∫˜µ≤≥÷/?░▒▓<>/';
// Blok arsir adalah ciri khas efeknya. Diambil acak dari GLYPHS saja,
// peluangnya tipis (3 dari 40), jadi slot-nya dijatah terpisah.
const BLOCKS = '░▒▓';
const BLOCK_SLOTS = 3;      // dari 10 slot per huruf
const SCRAMBLE_MS = 1600;   // lama efek per elemen
const SCRAMBLE_STEP = 55;   // jeda antar pergantian karakter acak
const SCRAMBLE_PCT = 0.35;  // bagian EKOR tiap KATA yang ikut glitch
// Lebar glyph pengganti tidak sama dengan huruf aslinya. Kalau teks ditulis
// apa adanya, tiap pergantian karakter mengubah lebar kata → baris bisa
// pindah → tinggi elemen berubah → seluruh halaman meloncat. Di desktop
// nyaris tak terasa karena judulnya longgar; di HP judul sudah mepet
// sehingga tiap tick bisa menambah/mengurangi satu baris.
//
// Solusinya bukan mengganti glyph-nya (blok ░▒▓ itu ciri khas efeknya),
// tapi mengunci geometrinya: tiap huruf dapat kotak inline-block selebar
// huruf ASLINYA, dan tiap kata dibungkus inline-block nowrap. Glyph apa pun
// yang masuk, lebar kata tidak berubah, jadi titik pemenggalan baris persis
// sama dari awal sampai akhir animasi.
const measurer = document.createElement('canvas').getContext('2d');
const charBoxes = (el, text) => {
  const cs = getComputedStyle(el);
  measurer.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const frag = document.createDocumentFragment();
  const cells = new Array(text.length).fill(null);
  let i = 0;
  while (i < text.length) {
    if (text[i] === ' ') { frag.appendChild(document.createTextNode(' ')); i++; continue; }
    const word = document.createElement('span');
    word.style.cssText = 'display:inline-block;white-space:nowrap';
    while (i < text.length && text[i] !== ' ') {
      const cell = document.createElement('span');
      cell.style.cssText = `display:inline-block;width:${measurer.measureText(text[i]).width}px;text-align:center`;
      cell.textContent = text[i];
      word.appendChild(cell);
      cells[i] = cell;
      i++;
    }
    frag.appendChild(word);
  }
  return { frag, cells };
};
export const scramble = (el) => {
  const original = el.dataset.text || (el.dataset.text = el.textContent);
  if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', original);
  const len = original.length;
  // Tiap huruf punya kantong 10 glyph sendiri (--char-0..9 di CodePen
  // aslinya) yang diputar berulang.
  const pools = [];
  for (let i = 0; i < len; i++) {
    const pool = [];
    for (let g = 0; g < 10; g++) pool.push(GLYPHS[(Math.random() * GLYPHS.length) | 0]);
    // jatah blok ditaruh di slot acak yang belum terpakai, bukan ditimpa
    // berurutan, supaya posisinya tidak selalu di awal putaran
    const free = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let b = 0; b < BLOCK_SLOTS; b++) {
      const slot = free.splice((Math.random() * free.length) | 0, 1)[0];
      pool[slot] = BLOCKS[(Math.random() * BLOCKS.length) | 0];
    }
    pools.push(pool);
  }
  // Porsi ekor dihitung PER KATA, bukan per kalimat: kalau per kalimat,
  // kata-kata di depan tidak pernah ikut glitch sama sekali. Tiap kata
  // berhenti berurutan kiri-ke-kanan di dalam dirinya sendiri.
  const settle = new Array(len).fill(0);
  for (let w = 0; w < len;) {
    if (original[w] === ' ') { w++; continue; }
    let end = w;
    while (end < len && original[end] !== ' ') end++;
    const from = w + Math.floor((end - w) * (1 - SCRAMBLE_PCT));
    const tail = Math.max(1, end - from);
    for (let i = from; i < end; i++) {
      // sedikit jitter agar hurufnya tidak berhenti dalam irama mesin
      settle[i] = SCRAMBLE_MS * Math.min(1, ((i - from + 1) / tail) + (Math.random() - 0.5) * 0.12);
    }
    w = end;
  }
  const { frag, cells } = charBoxes(el, original);
  el.textContent = '';
  el.appendChild(frag);
  // Berbasis waktu, bukan hitungan frame: versi lama memakai satu frame per
  // langkah sehingga di layar 120Hz efeknya jalan dua kali lebih cepat.
  let start = 0;
  let last = -1;
  const run = (now) => {
    if (!start) start = now;
    const ms = now - start;
    // glyph diganti tiap SCRAMBLE_STEP ms saja; kalau tiap frame, hasilnya
    // terbaca sebagai getaran rata, bukan glitch
    const tick = ms / SCRAMBLE_STEP | 0;
    if (tick !== last) {
      last = tick;
      for (let i = 0; i < len; i++) {
        const cell = cells[i];
        if (!cell) continue;
        const ch = ms >= settle[i] ? original[i] : pools[i][tick % 10];
        if (cell.textContent !== ch) cell.textContent = ch;
      }
    }
    // kembalikan ke teks polos supaya markup-nya bersih lagi setelah selesai
    if (ms < SCRAMBLE_MS) requestAnimationFrame(run); else el.textContent = original;
  };
  requestAnimationFrame(run);
};

// split words
$$('.split-words').forEach((el) => {
  el.setAttribute('aria-label', el.textContent);
  const hl = (el.dataset.hl || '').toLowerCase().split(/\s+/).filter(Boolean); // kata yang diberi stabilo
  el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w" aria-hidden="true"><span${hl.includes(w.toLowerCase()) ? ' class="w-hl"' : ''}>${esc(w)}</span></span>`).join(' ');
});
// (setelah split-words, karena itu menulis ulang isi judul Tema)
// Glitch teks untuk judul yang tidak memakai scramble (Tema, Layanan,
// Lokasi): 2 salinan isi judul (biru & lime) ditumpuk persis di atasnya —
// salinan HTML, bukan attr(data-text), supaya baris & blok sorotnya sama.
$$('#tentang .title, #layanan .title, .loc-card__title').forEach((h, k) => {
  const copy = h.cloneNode(true);
  copy.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));
  const g = document.createElement('span');
  g.className = 'tglitch'; g.setAttribute('aria-hidden', 'true');
  g.innerHTML = `<span>${copy.innerHTML}</span><span>${copy.innerHTML}</span>`;
  g.style.setProperty('--d', `${(k * 1.3) % 4}s`);
  h.classList.add('has-tglitch');
  h.appendChild(g);
});
