/* =========================================================
   HALAMAN KETENTUAN & PRIVASI — daftar isi (pohon) ikut menandai
   judul yang sedang dibaca. Berdiri sendiri (tidak dibundel bersama
   main.js): halaman ini sengaja ringan tanpa animasi.
   .is-active = judul yang sedang dibaca, .is-open = bagian induknya,
   .is-expanded = panel daftar isi di HP sedang terbuka.
   ========================================================= */
(() => {
  'use strict';
  const toc = document.querySelector('.toc');
  if (!toc) return;
  const links = [...toc.querySelectorAll('a[href^="#"]')];
  const items = links
    .map((a) => ({ a, el: document.getElementById(a.getAttribute('href').slice(1)) }))
    .filter((x) => x.el)
    // urut sesuai posisi di halaman, bukan urutan di daftar isi
    .sort((x, y) => (x.el.compareDocumentPosition(y.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  if (!items.length) return;
  // induk di daftar isi. Item tunggal (Kontak) tidak punya anak → pakai
  // bagian utama sebelumnya sebagai induknya.
  const topLink = (a) => {
    let li = a.closest('.toc > ol > li');
    while (li.classList.contains('toc__solo') && li.previousElementSibling) li = li.previousElementSibling;
    return li.querySelector(':scope > a');
  };

  // daftar isi bisa lebih tinggi dari layar: gulir daftarnya (bukan halaman)
  // agar item aktif tetap terlihat
  const keepVisible = () => {
    const a = toc.querySelector('a.is-active');
    if (!a || toc.scrollHeight <= toc.clientHeight) return;
    const r = a.getBoundingClientRect(), t = toc.getBoundingClientRect();
    if (r.top < t.top || r.bottom > t.bottom) toc.scrollTop += r.top - t.top - t.height / 2;
  };

  // HP: daftar isi tampil sebagai garis-garis kecil — ketukan pertama membuka
  // panel pohon (bukan langsung melompat), memilih judul menutupnya lagi.
  const mobile = matchMedia('(max-width: 959px)');
  const setExpanded = (on) => {
    toc.classList.toggle('is-expanded', on);
    if (on) keepVisible();
  };
  toc.addEventListener('click', (e) => {
    if (!mobile.matches) return;
    if (!toc.classList.contains('is-expanded')) { e.preventDefault(); setExpanded(true); return; }
    if (e.target.closest('a')) setExpanded(false);
  });
  // keyboard (Tab) langsung membuka panel agar judul terbaca
  toc.addEventListener('focusin', () => { if (mobile.matches) setExpanded(true); });
  document.addEventListener('click', (e) => { if (!toc.contains(e.target)) setExpanded(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setExpanded(false); });
  mobile.addEventListener('change', () => setExpanded(false));

  // Aktif = judul terakhir yang sudah melewati 35% tinggi layar.
  // Sebelum judul pertama tercapai (intro di atas), judul pertama yang aktif.
  // Judul di dekat dasar halaman tidak pernah bisa naik sampai garis itu
  // (halaman habis) — titik aktifnya dibagi rata di sisa jarak gulir terakhir,
  // jadi tetap menyala berurutan dan yang terakhir tepat saat mentok bawah.
  const marks = () => {
    const line = innerHeight * 0.35;
    const max = document.documentElement.scrollHeight - innerHeight;
    const at = items.map((it) => it.el.getBoundingClientRect().top + scrollY - line);
    const k = at.findIndex((y) => y > max - 4);
    if (k > -1) {
      const from = k > 0 ? Math.min(at[k - 1], max) : 0, n = items.length - k;
      for (let i = k; i < items.length; i++) at[i] = from + ((max - from) * (i - k + 1)) / n;
    }
    return at;
  };
  // Judul yang diklik langsung aktif (walau posisinya tak sampai garis atau
  // judul sesudahnya ikut terlihat) sampai pengunjung menggulir sendiri.
  let forced = null, forcedY = null;
  toc.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    const it = a && items.find((x) => x.a === a);
    // defaultPrevented = ketukan pertama di HP yang hanya membuka panel
    if (!it || e.defaultPrevented) return;
    forced = it; forcedY = null;
    requestAnimationFrame(() => requestAnimationFrame(onScroll)); // setelah lompatan ke #id
  });

  let ticking = false, current = null;
  const update = () => {
    ticking = false;
    let cur = items[0];
    if (forced && (forcedY === null || Math.abs(scrollY - forcedY) < 4)) {
      if (forcedY === null) forcedY = scrollY;
      cur = forced;
    } else {
      forced = null;
      const at = marks();
      items.forEach((it, i) => { if (scrollY >= at[i] - 1) cur = it; });
    }
    if (cur === current) return;
    current = cur;
    const open = topLink(cur.a);
    links.forEach((a) => {
      const on = a === cur.a;
      a.classList.toggle('is-active', on);
      a.classList.toggle('is-open', a === open && !on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
    keepVisible();
  };

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
})();
