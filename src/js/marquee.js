import { $$ } from './core.js';

/* ---------------------------------------------------------
   MARQUEE TEKS — isi diulang hingga ≥ lebar layar, lalu digandakan
   sekali agar animasi -50% selalu mulus (infinite tanpa loncat)
   --------------------------------------------------------- */
const buildMarquee = (track) => {
  if (!track.dataset.src) track.dataset.src = track.innerHTML;
  track.innerHTML = `<div class="marquee__group">${track.dataset.src}</div>`;
  const group = track.firstElementChild;
  const unit = group.innerHTML;
  let guard = 0;
  while (group.scrollWidth < innerWidth + 100 && guard++ < 10) group.insertAdjacentHTML('beforeend', unit);
  const clone = group.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  track.appendChild(clone);
  // kecepatan konstan (px/detik); di HP sedikit lebih cepat terasa
  const speed = innerWidth < 600 ? 62 : 70;
  track.style.setProperty('--dur', `${(group.scrollWidth / speed).toFixed(1)}s`);
};
const marqueeTracks = $$('.marquee__track');
marqueeTracks.forEach(buildMarquee);
let mqW = innerWidth, mqT;
addEventListener('resize', () => {
  clearTimeout(mqT);
  mqT = setTimeout(() => { if (Math.abs(innerWidth - mqW) > 40) { mqW = innerWidth; marqueeTracks.forEach(buildMarquee); } }, 250);
});
