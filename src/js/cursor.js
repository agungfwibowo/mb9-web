import { $, $$, finePointer, reduced } from './core.js';

/* ---------------------------------------------------------
   CURSOR & MAGNETIC
   --------------------------------------------------------- */
if (finePointer && !reduced) {
  const cur = $('.cursor');
  const label = $('.cursor__label');
  let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; cur.classList.remove('is-hidden'); }, { passive: true });
  document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
  const loop = () => {
    cx += (tx - cx) * .22; cy += (ty - cy) * .22;
    cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();
  document.addEventListener('pointerover', (e) => {
    const lab = e.target.closest('[data-cursor]');
    const hov = e.target.closest('a, button, .booth, .logo-tile, .plogo, .tenant__grid li');
    cur.classList.toggle('has-label', !!lab);
    cur.classList.toggle('is-hover', !!hov && !lab);
    cur.classList.toggle('is-on-dark', !!e.target.closest('.footer, .layanan, .denah__stage, .marquee--dark'));
    label.textContent = lab ? lab.dataset.cursor : '';
  });

  document.addEventListener('pointermove', (e) => {
    const m = e.target.closest('.magnetic');
    $$('.magnetic.is-mag').forEach((el) => { if (el !== m) { el.classList.remove('is-mag'); el.style.transform = ''; } });
    if (!m) return;
    const r = m.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * .3;
    const y = (e.clientY - r.top - r.height / 2) * .4;
    m.classList.add('is-mag');
    m.style.transition = 'transform .25s cubic-bezier(.2,.8,.2,1), color .35s';
    m.style.transform = `translate(${x}px, ${y}px)`;
  });
}
