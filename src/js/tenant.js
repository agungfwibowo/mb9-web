import { $, $$, D, esc, finePointer, hasGsap, lenis, reduced } from './core.js';
import { lockNav, nav } from './navbar.js';
import { lazyWatch } from './konten.js';

// Tenant marquee + grid
const tenants = D.tenants.map(([name, file, tone]) => ({ name, tone, src: `assets/img/tenant/${file}` }));
$('#tenantCount').dataset.count = tenants.length;
const marquee = $('#tenantMarquee');
const rows = [[], [], []];
tenants.forEach((t, i) => rows[i % 3].push(t));
// Tiap tenant (slider & daftar) adalah link ke denah: klik → gulir ke denah
// lalu tendanya dipilih otomatis (handler di blok DENAH, setelah selectBooth).
// Label "Tenda 34–36" diambil dari D.placements.
const pad2 = (n) => String(n).padStart(2, '0');
export const boothsOf = {};
(D.placements || []).forEach(([name, from, to = from]) => {
  (boothsOf[name] = boothsOf[name] || []).push(from === to ? pad2(from) : `${pad2(from)}–${pad2(to)}`);
});
// salinan kedua di tiap baris hanya untuk loop marquee: disembunyikan dari
// pembaca layar & urutan Tab supaya tiap tenant tidak terbaca dua kali
const tile = (t, dup) => `<a href="#denah" class="logo-tile${t.tone === 'dark' ? ' is-dark' : ''}" data-tenant-link="${esc(t.name)}" data-cursor="Lokasi"`
  + (dup ? ' tabindex="-1" aria-hidden="true">' : ` aria-label="${esc(t.name)} — lihat lokasi di denah">`)
  + `<img class="lazy-img" data-src="${esc(t.src)}" alt="" decoding="async"></a>`;
marquee.innerHTML = rows.map((r, i) => {
  const tiles = r.map((t) => tile(t, false)).join('') + r.map((t) => tile(t, true)).join('');
  return `<div class="logo-row${i % 2 ? ' rev' : ''}" style="--dur:${70 + i * 12}s">${tiles}</div>`;
}).join('');
lazyWatch(marquee);

const grid = $('#tenantGrid');
grid.innerHTML = tenants.map((t) => `
    <li data-name="${esc(t.name.toLowerCase())}"><a href="#denah" data-tenant-link="${esc(t.name)}" data-cursor="Lokasi" aria-label="${esc(t.name)} — lihat lokasi di denah"><div class="ph${t.tone === 'dark' ? ' is-dark' : ''}"><img class="lazy-img" data-src="${esc(t.src)}" alt="" decoding="async"></div><span>${esc(t.name)}${boothsOf[t.name] ? `<small>Tenda ${boothsOf[t.name].join(', ')}</small>` : ''}</span></a></li>`).join('');
lazyWatch(grid);
const toggle = $('#tenantToggle');
const all = $('#tenantAll');
toggle.addEventListener('click', () => {
  const open = all.hidden;
  all.hidden = !open;
  toggle.setAttribute('aria-expanded', open);
  toggle.querySelector('span').textContent = open ? 'Sembunyikan' : 'Lihat Semua Brand';
  if (open) {
    if (hasGsap && !reduced) gsap.fromTo($$('li', grid), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .012, ease: 'power3.out', clearProps: 'transform,opacity' });
    // Fokus otomatis hanya di perangkat ber-keyboard fisik (tidak memunculkan keyboard di HP)
    if (finePointer) $('#tenantSearch').focus({ preventScroll: true });
  }
  if (hasGsap) ScrollTrigger.refresh();
  // Anchor: buka → ke daftar brand, tutup → kembali ke awal section
  const target = open ? all : $('#tenant');
  const offset = -(nav.offsetHeight + 28);
  requestAnimationFrame(() => {
    lockNav(1400);
    if (lenis) lenis.scrollTo(target, { offset, duration: 1, onComplete: () => lockNav(250) });
    else scrollTo({ top: target.getBoundingClientRect().top + scrollY + offset, behavior: reduced ? 'auto' : 'smooth' });
  });
});
$('#tenantSearch').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  let shown = 0;
  $$('li', grid).forEach((li) => { const hit = !q || li.dataset.name.includes(q); li.classList.toggle('is-hidden', !hit); shown += hit; });
  $('#tenantEmpty').hidden = shown > 0;
});

// Partners
$('#partners').innerHTML = D.partners.map((g, gi) => `
    <div class="pgroup${gi === 0 ? ' pgroup--main' : ''}">
      <h3>${esc(g.group)}</h3>
      <div class="plist">${g.logos.map(([n, s, tone]) => {
      // logo dengan tautan di D.links menjadi link ke situsnya
      const url = D.links && D.links[n];
      const cls = `plogo${tone === 'dark' ? ' plogo--dark' : ''}`;
      const img = `<img class="lazy-img" data-src="${esc(s)}" alt="${esc(n)}" decoding="async">`;
      return url
        ? `
        <a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener" title="${esc(n)} — buka situs" data-cursor="Buka">${img}</a>`
        : `
        <div class="${cls}" title="${esc(n)}">${img}</div>`;
    }).join('')}
      </div>
    </div>`).join('');
lazyWatch($('#partners'));

// Hotline
if (D.hotline) { $('#hotline').href = D.hotline.wa; $('#locWa').href = D.hotline.wa; $('#hotlineLabel').textContent = D.hotline.label; }
