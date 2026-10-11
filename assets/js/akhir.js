/* =========================================================
   MODAL HARI TERAKHIR — dipakai halaman lengkap & /ringkas/. Berdiri
   sendiri (tidak dibundel), gaya disisipkan dari sini.
   - Selama hari terakhir (s/d jam tutup): ajakan "Hari ini hari terakhir".
   - Setelah hari terakhir tutup: surat ucapan terima kasih.
   Muncul di setiap kunjungan sampai salah satu tombolnya ditekan (baru
   dianggap dibaca, diingat per perangkat). Esc menutup untuk kunjungan itu
   saja. Layar penuh; ketuk area kosong tidak menutup (seluruh layar adalah
   modal, mudah tersentuh tak sengaja).
   Halaman lengkap: muncul setelah preloader selesai (.is-loaded).
   Uji: ?akhirdebug=akhir atau ?akhirdebug=selesai (abaikan tanggal & ingatan).
   ========================================================= */
(() => {
  'use strict';
  // Akar situs dari lokasi skrip ini (assets/js/akhir.js) — path gambar di data
  // relatif ke akar, sedangkan halaman bisa di /ringkas/
  const BASE = new URL('../../', (document.currentScript && document.currentScript.src) || location.href);
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
  // Acara berikutnya: nomor di akhir judul + 1 ("… 9" → "… 10"). Tanpa nomor
  // → cukup "acara berikutnya".
  const nomor = /^(.*?)(\d+)\s*$/.exec(title);
  const next = nomor ? { name: nomor[1].trim(), no: String(+nomor[2] + 1) } : null;
  const jamTutup = close.replace(':', '.');
  const jadwalHash = document.getElementById('jadwal') ? '#jadwal' : '#h-jadwal';
  const C = phase === 'akhir'
    ? {
      kicker: 'Hari terakhir',
      head: `Hari ini hari terakhir ${title}`,
      text: `Buka sampai pukul ${jamTutup} WIB. Jangan lewatkan kajian, layanan gratis, dan bazarnya — sampai jumpa di lokasi, in syaa Allah.`,
      cta: ['Lihat jadwal hari ini', jadwalHash],
    }
    : {
      kicker: 'Acara telah selesai',
      head: 'Jazakumullahu khairan',
      cta: null,
    };

  // Surat terima kasih (fase selesai): tanggal & penyelenggara dari data.
  // Tanggal ASLI (data-dev.js menyimpannya di prodDays).
  const ev = D.prodDays || D.days;
  const tgl = (iso, opt) => new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', ...opt }).format(new Date(`${iso}T00:00:00Z`));
  const a = ev[0].iso, b = ev[ev.length - 1].iso;
  const rentang = a.slice(0, 7) === b.slice(0, 7)
    ? `${+a.slice(8)}–${tgl(b, { day: 'numeric', month: 'long', year: 'numeric' })}`
    : `${tgl(a, { day: 'numeric', month: 'long' })} – ${tgl(b, { day: 'numeric', month: 'long', year: 'numeric' })}`;
  const angka = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh'];
  const lama = `${angka[ev.length] || ev.length} hari`;
  const venue = (D.event && D.event.venue) || 'Komplek Lapangan Asrama Haji Medan';
  const host = ((D.partners || []).find((g) => /dipersembahkan/i.test(g.group)) || { logos: [] }).logos.map((l) => l[0]);
  const SURAT = {
    tempat: `Medan, ${tgl(b, { day: 'numeric', month: 'long', year: 'numeric' })}`,
    salam: 'Assalamu’alaikum warahmatullahi wabarakatuh.',
    kepada: 'Kepada seluruh pengunjung yang semoga senantiasa dirahmati Allah,',
    isi: [
      `Alhamdulillah, dengan pertolongan dan izin Allah, kegiatan ${title} telah selesai diselenggarakan selama ${lama} pada ${rentang} di ${venue}.`,
      'Kami mengucapkan terima kasih kepada seluruh pengunjung, para asatidz, tenant, relawan, sponsor, serta semua pihak yang telah hadir dan berkontribusi dalam kegiatan ini. Jazakumullahu khairan, semoga Allah membalas Anda sekalian dengan kebaikan.',
      'Kami memohon kepada Allah agar ilmu yang diperoleh menjadi ilmu yang bermanfaat, diamalkan di atas Al-Qur’an dan Sunnah sesuai pemahaman Salafush Shalih, serta menjadi sebab bertambahnya kebaikan bagi kita semua. Semoga Allah menerima amal saleh kita.',
      'Kami juga memohon maaf atas segala kekurangan dan kekhilafan selama kegiatan berlangsung.',
      `Semoga Allah memberikan kesempatan kepada kita untuk kembali bertemu dalam ${next ? `${next.name} ${next.no}` : 'kegiatan berikutnya'}, in syaa Allah.`,
    ],
    tutup: 'Wassalamu’alaikum warahmatullahi wabarakatuh.',
    ttd: ['Hormat kami,', `Panitia ${title}`, host.join(' · ')],
  };

  // ---- Gaya (rem → ikut ukuran huruf /ringkas/) ----
  const css = document.createElement('style');
  css.textContent = `
.akhir { position: fixed; inset: 0; width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; background: #ececea; color: #2b2b2b; font-family: var(--sans, 'Public Sans', system-ui, sans-serif); overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; }
.akhir[open] { display: flex; flex-direction: column; }
.akhir::backdrop { background: #ececea; }
.akhir__head { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; gap: .6rem; margin: 0; padding: calc(.5rem + env(safe-area-inset-top, 0px)) .5rem .5rem 1.25rem; background: #2b2b2b; color: #c5fa01; font: 700 .8rem/1.2 var(--mono, 'Roboto Mono', ui-monospace, monospace); letter-spacing: .08em; text-transform: uppercase; }
.akhir__head::before { content: ''; flex: none; width: .6rem; height: .6rem; background: currentColor; }
/* bilah menempel → tombol ke situs selalu terlihat walau surat digulir */
.akhir__head span { flex: 1; min-width: 0; }
.akhir__head button { flex: none; min-height: 2.5rem; padding: .4rem .9rem; border: 2px solid #c5fa01; background: #c5fa01; color: #2b2b2b; font: 700 .85rem/1.2 var(--sans, 'Public Sans', system-ui, sans-serif); letter-spacing: 0; text-transform: none; cursor: pointer; }
.akhir__head button:hover { background: #2b2b2b; color: #c5fa01; }
.akhir__body { flex: 1; display: flex; flex-direction: column; justify-content: center; width: 100%; max-width: 32rem; margin: 0 auto; padding: 2rem 1.25rem calc(2rem + env(safe-area-inset-bottom, 0px)); }
.akhir h2 { margin: 0 0 1rem; font-size: 2rem; line-height: 1.2; font-weight: 800; }
.akhir__body p { margin: 0; font-size: 1rem; line-height: 1.55; color: #444; }
.akhir__actions { display: grid; gap: .6rem; margin-top: 1.25rem; }
.akhir__actions a, .akhir__actions button { display: flex; align-items: center; justify-content: center; min-height: 3rem; padding: .7rem 1rem; border: 2px solid #2b2b2b; font: 700 1rem/1.2 var(--sans, 'Public Sans', system-ui, sans-serif); text-decoration: none; cursor: pointer; }
.akhir__actions a { background: #c5fa01; color: #2b2b2b; }
.akhir__actions button { background: #fff; color: #2b2b2b; }
.akhir__actions a:hover, .akhir__actions button:hover { background: #2b2b2b; color: #c5fa01; }
/* surat terima kasih: lembar kertas putih berbingkai, isi rata kiri */
.akhir__body--surat { justify-content: safe center; }
.akhir__surat { padding: 1.5rem 1.25rem 1.75rem; background: #fff; border: 2px solid #2b2b2b; box-shadow: 6px 6px 0 #2b2b2b; }
.akhir__surat h2 { font-size: 1.6rem; margin-bottom: 1.1rem; padding-bottom: .9rem; border-bottom: 2px solid #2b2b2b; }
.akhir__body .akhir__tempat { margin-bottom: 1.1rem; font: 400 .8rem/1.4 var(--mono, 'Roboto Mono', ui-monospace, monospace); letter-spacing: .04em; color: #6f6b67; text-align: right; }
.akhir__surat p + p { margin-top: .8rem; }
.akhir__body .akhir__salam { color: #2b2b2b; font-weight: 700; }
.akhir__body .akhir__ttd { margin-top: 1.5rem; color: #2b2b2b; }
.akhir__ttd b { display: block; margin-top: .25rem; font-size: 1.05rem; }
.akhir__kop { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem .75rem; margin-bottom: 1rem; }
.akhir__brand { display: flex; align-items: center; gap: .6rem; }
.akhir__kop img { width: 2.25rem; height: auto; }
.akhir__kop span { font: 700 1.1rem/.98 var(--mono, 'Roboto Mono', ui-monospace, monospace); text-transform: uppercase; letter-spacing: -.02em; color: #2b2b2b; }
.akhir__kop .akhir__tempat { margin: 0 0 0 auto; align-self: flex-start; white-space: nowrap; }
.akhir__ttd span { display: block; margin-top: .15rem; font: 400 .8rem/1.4 var(--mono, 'Roboto Mono', ui-monospace, monospace); color: #6f6b67; }
/* "Selanjutnya": kesan bahwa acara berlanjut ke edisi berikutnya */
.akhir__next { margin-top: 1.4rem; padding: 1rem 1.1rem 1.1rem; background: #2b2b2b; color: #fff; }
.akhir__body .akhir__next-label { display: flex; align-items: center; gap: .5rem; margin: 0 0 .5rem; font: 700 .7rem/1.2 var(--mono, 'Roboto Mono', ui-monospace, monospace); letter-spacing: .1em; text-transform: uppercase; color: #c5fa01; }
.akhir__next-label::before { content: ''; flex: none; width: .5rem; height: .5rem; background: currentColor; animation: akhir-blink 1s steps(2) infinite; }
@keyframes akhir-blink { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .akhir__next-label::before { animation: none; } }
.akhir__body .akhir__next-name { display: flex; flex-wrap: wrap; align-items: center; gap: .3rem .6rem; margin: 0; font: 700 1.25rem/1.1 var(--mono, 'Roboto Mono', ui-monospace, monospace); text-transform: uppercase; letter-spacing: -.02em; color: #fff; }
.akhir__next-name b { display: inline-grid; place-items: center; min-width: 2.6rem; padding: .2rem .45rem; background: #c5fa01; color: #2b2b2b; font-size: 1.6rem; }
.akhir__body .akhir__next-sub { margin: .55rem 0 0; font-size: .9rem; color: rgba(255, 255, 255, .75); }`;
  document.head.append(css);

  // ---- Markup ----
  const dlg = document.createElement('dialog');
  dlg.className = 'akhir';
  // Lenis (halaman lengkap) menahan roda mouse di seluruh halaman → modal yang
  // lebih tinggi dari layar tak bisa digulir tanpa atribut ini
  dlg.setAttribute('data-lenis-prevent', '');
  dlg.setAttribute('aria-labelledby', 'akhirTitle');
  const el = (tag, cls, text) => Object.assign(document.createElement(tag), cls ? { className: cls } : {}, text != null ? { textContent: text } : {});
  const head = el('div', 'akhir__head');
  const toSite = Object.assign(el('button', '', 'Lanjut ke situs →'), { type: 'button' });
  // tombol apa pun = sudah dibaca → tidak muncul lagi di kunjungan berikutnya
  const done = () => {
    try { if (!debug) localStorage.setItem(KEY, '1'); } catch (_) { /* mode privat */ }
    dlg.close();
  };
  toSite.addEventListener('click', done);
  head.append(el('span', '', C.kicker), toSite);
  const body = el('div', 'akhir__body');
  const h2 = Object.assign(el('h2', '', C.head), { id: 'akhirTitle' });
  const actions = el('div', 'akhir__actions');
  if (C.cta) actions.append(Object.assign(el('a', '', C.cta[0]), { href: C.cta[1] }));
  actions.append(Object.assign(el('button', '', C.cta ? 'Nanti saja' : 'Tutup'), { type: 'button' }));
  // kop: wordmark lalu logo MB9 (susunan sama dengan navbar halaman lengkap)
  // + tempat/tanggal (tanggal hari terakhir)
  const kop = el('div', 'akhir__kop');
  const brand = el('div', 'akhir__brand');
  brand.append(
    Object.assign(el('span'), { innerHTML: 'Muslim<br>Berdedikasi' }),
    Object.assign(el('img'), { src: new URL('assets/img/logo/mb9-mark-sm.webp?v=2', BASE).href, alt: '', width: 34, height: 42 }),
  );
  kop.append(brand, el('p', 'akhir__tempat', SURAT.tempat));
  // kartu putih (kop → isi → "Selanjutnya") + tombol di bawahnya, kedua fase
  const surat = el('article', 'akhir__surat');
  // blok "Selanjutnya" (kedua fase): nama edisi berikutnya + nomornya
  const nextBox = el('div', 'akhir__next');
  const nextName = el('p', 'akhir__next-name');
  if (next) nextName.append(next.name, el('b', '', next.no)); else nextName.textContent = 'Edisi berikutnya';
  nextBox.append(
    el('p', 'akhir__next-label', 'Selanjutnya'), nextName,
    el('p', 'akhir__next-sub', 'In syaa Allah — nantikan informasinya.'),
  );
  if (phase === 'akhir') surat.append(kop, h2, el('p', '', C.text), nextBox);
  else {
    const ttd = el('p', 'akhir__ttd', SURAT.ttd[0]);
    ttd.append(el('b', '', SURAT.ttd[1]));
    if (SURAT.ttd[2]) ttd.append(el('span', '', SURAT.ttd[2]));
    surat.append(
      kop, h2,
      el('p', 'akhir__salam', SURAT.salam), el('p', '', SURAT.kepada),
      ...SURAT.isi.map((t) => el('p', '', t)),
      el('p', 'akhir__salam', SURAT.tutup), ttd, nextBox,
    );
  }
  body.classList.add('akhir__body--surat');
  body.append(surat, actions);
  dlg.append(head, body);
  document.body.append(dlg);

  // Tombol apa pun menutup modal; tautan jadwal lanjut ke penangan gulir
  // halaman (lenis.js di halaman lengkap, anchor biasa di /ringkas/).
  actions.addEventListener('click', (e) => { if (e.target.closest('a, button')) done(); });

  const show = () => {
    if (dlg.open || document.querySelector('dialog[open]')) return; // dialog lain sedang terbuka → kunjungan berikutnya
    dlg.showModal();
    actions.lastElementChild.focus({ preventScroll: true }); // jangan langsung fokus ke tautan
    // showModal memfokus tombol pertama & menggulir ke sana — surat yang lebih
    // panjang dari layar (mis. /ringkas/ huruf besar) harus mulai dari atas
    dlg.scrollTop = 0;
    dlg.scrollLeft = 0;
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
