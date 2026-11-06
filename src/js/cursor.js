import { $, $$, finePointer, reduced } from './core.js';

/* ---------------------------------------------------------
   CURSOR & MAGNETIC
   --------------------------------------------------------- */
if (finePointer && !reduced) {
  const cur = $('.cursor');
  const label = $('.cursor__label');
  document.documentElement.classList.add('has-cursor');
  // Ikuti pointer langsung (tanpa ekor) — ujung panah = titik klik, jadi harus presisi.
  let tx = 0, ty = 0, raf = 0;
  const paint = () => { raf = 0; cur.style.transform = `translate3d(${tx}px, ${ty}px, 0)`; };
  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY; cur.classList.remove('is-hidden');
    if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });
  document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
  addEventListener('blur', () => cur.classList.add('is-hidden'));
  addEventListener('pointerdown', () => cur.classList.add('is-down'), { passive: true });
  ['pointerup', 'pointercancel', 'blur'].forEach((ev) => addEventListener(ev, () => cur.classList.remove('is-down'), { passive: true }));

  const CLICKABLE = 'a[href], button:not(:disabled), [role="button"], label[for], summary, select, .booth, .logo-tile, .plogo, .tenant__grid li, .day, .jcard.is-piled, .hero__visual, .footer__logo';
  // Kolom teks memakai kursor ketik bawaan → kursor kustom disembunyikan di sana.
  const NATIVE = 'input, textarea, select, [contenteditable]';
  // Area seret → tangan terbuka / mengepal (diutamakan di atas tautan di dalamnya).
  const DRAG = '.asatidz__grid, .zoom__stage';
  document.addEventListener('pointerover', (e) => {
    const t = e.target;
    const lab = t.closest('[data-cursor]');
    const drag = !!t.closest(DRAG);
    cur.classList.toggle('is-native', !!t.closest(NATIVE));
    cur.classList.toggle('is-drag', drag);
    cur.classList.toggle('has-label', !drag && !!lab);
    cur.classList.toggle('is-hover', !drag && !lab && !!t.closest(CLICKABLE));
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
