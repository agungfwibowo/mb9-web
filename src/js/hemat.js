import { $, $$, bootBooth, bootHash, hasGsap, lenis, reduced, userScrolled } from './core.js';
import { boothRect, findBooth, focusBooth } from './denah.js';
import { goToHash } from './lenis.js';
import { finishPreloader, intro, scrollAnims, seenThisSession } from './intro.js';

/* ---------------------------------------------------------
   HEMAT CPU — jeda animasi infinite (marquee, blink, float)
   pada section yang sedang di luar layar.
   --------------------------------------------------------- */
(() => {
  const blocks = [...$$('main > section'), ...$$('main > .marquee'), $('.footer')].filter(Boolean);
  if (!blocks.length || !('IntersectionObserver' in window)) return;
  blocks.forEach((el) => el.classList.add('anim-off'));
  const animIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => en.target.classList.toggle('anim-off', !en.isIntersecting));
  }, { rootMargin: '150px 0px' });
  blocks.forEach((el) => animIO.observe(el));
})();

// Mulai
const boot = () => finishPreloader().then(intro).then(() => {
  if (!bootHash && !bootBooth) return;
  // Beri waktu judul hero muncul dulu, lalu ukur ulang (load bisa belum
  // terjadi kalau boot dipicu timeout 2,5 dtk) sebelum meluncur ke target.
  setTimeout(() => {
    // pengunjung sudah menggulir sendiri selama preloader → jangan ditarik
    // paksa, cukup kembalikan hash ke URL
    if (userScrolled) { if (bootHash) history.replaceState(null, '', bootHash); return; }
    if (hasGsap) ScrollTrigger.refresh();
    requestAnimationFrame(() => {
      // link tenant didahulukan; nama/nomor tak dikenal → cukup ke #denah
      const g = bootBooth && findBooth(bootBooth);
      const id = bootBooth ? '#denah' : bootHash;
      if (g) focusBooth(g);
      else goToHash(id);
      // Koreksi: boot bisa jalan sebelum semua aset termuat (jaringan
      // lambat) → gambar & pin-spacer di atas tujuan yang menyusul memanjangkan
      // halaman dan tujuan terdorong ke bawah layar. Setelah 'load' (dan sekali
      // lagi sesudahnya untuk gambar lazy) posisi diukur ulang; meleset >40px →
      // digulir lagi. Tidak dilakukan bila pengunjung sudah menggulir sendiri.
      const realign = () => {
        if (userScrolled) return;
        if (hasGsap) ScrollTrigger.refresh();
        requestAnimationFrame(() => {
          if (userScrolled) return;
          if (g) {
            const br = boothRect(g);
            const off = br.top + br.height / 2 - innerHeight / 2;
            if (Math.abs(off) > 40) { if (lenis) lenis.scrollTo(scrollY + off, { duration: .6 }); else scrollTo({ top: scrollY + off, behavior: reduced ? 'auto' : 'smooth' }); }
            return;
          }
          const t = document.getElementById(id.slice(1));
          if (t && Math.abs(t.getBoundingClientRect().top - (lenis ? 20 : 0)) > 40) goToHash(id);
        });
      };
      const later = () => { setTimeout(realign, 300); setTimeout(realign, 2000); setTimeout(realign, 4500); };
      if (document.readyState === 'complete') { setTimeout(realign, 1600); setTimeout(realign, 4500); }
      else addEventListener('load', later, { once: true });
    });
  }, reduced ? 0 : 500);
});
// Tidak menunggu event 'load' (semua aset: logo tenant, CDN, dll.) — cukup
// foto hero + font siap, maksimal 1,5 dtk. Dulu 'load' / 2,5 dtk.
if (document.readyState === 'complete' || seenThisSession) boot();
else {
  let booted = false;
  const go = () => { if (!booted) { booted = true; boot(); } };
  const heroImg = $('.hero__photo');
  const heroReady = !heroImg || heroImg.complete ? Promise.resolve()
    : new Promise((r) => { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); });
  Promise.all([heroReady, document.fonts ? document.fonts.ready : null]).then(go);
  addEventListener('load', go);
  setTimeout(go, 1500); // jaringan lambat: jangan menunggu lebih lama dari ini
}
scrollAnims();
