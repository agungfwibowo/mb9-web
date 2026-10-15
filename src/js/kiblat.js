import { $, reduced } from './core.js';

/* ---------------------------------------------------------
   KOMPAS KIBLAT (peta lokasi)
   Peta selalu menghadap utara, jadi tanpa sensor kompasnya statis: utara ke
   atas, garis lime = kiblat 292,8° dari lokasi acara. Di layar sentuh ada
   tombol "Arah kiblat": baru setelah diketuk izin sensor diminta (iOS wajib
   dari ketukan; tidak pernah saat halaman dimuat) dan dial berputar mengikuti
   arah hadap HP — garis lime lurus ke atas = menghadap kiblat. Data sensor
   hanya dipakai di perangkat, tidak dikirim ke mana pun.
   --------------------------------------------------------- */
const QIBLA = 292.8; // derajat dari utara, lingkaran besar ke Ka'bah (lihat index.html)
const box = $('#kiblat');
const btn = box && $('.peta__kbtn', box);
const msg = box && $('.peta__kmsg', box);
const svg = box && $('.peta__dial svg', box);
const acc = box && $('.peta__kacc', box);
const k8 = box && $('.peta__k8', box);
if (btn && 'DeviceOrientationEvent' in window && matchMedia('(pointer: coarse)').matches) {
  btn.hidden = false;
  const iosAsk = typeof DeviceOrientationEvent.requestPermission === 'function';
  // Android: 'deviceorientationabsolute' (alpha relatif utara); iOS: webkitCompassHeading
  const evName = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
  let on = false, heading = null, rot = 0, raf = 0, waitT = 0;
  const say = (t) => { msg.textContent = t; };
  // Cek kalibrasi. iPhone: webkitCompassAccuracy (± derajat; −1 = belum
  // terkalibrasi). Android tak memberi angka akurasi → perkiraan dari
  // kegoyahan: sampel tiap ±100 ms selama 1 dtk; total gerak bolak-balik jauh
  // melebihi perpindahan bersihnya = arah melompat-lompat. Status baru berganti
  // setelah bertahan 1,5 dtk agar tidak berkedip (mis. saat HP sedang diputar).
  // Gangguan yang stabil (dekat logam) tidak terdeteksi — karena itu ajakannya
  // juga menyebut "jauhkan dari logam".
  let bad = false, flipAt = 0, samples = [], accText = '';
  const angDiff = (a, b) => ((a - b) % 360 + 540) % 360 - 180;
  const checkAcc = (e, h, now) => {
    let badNow, text;
    if (typeof e.webkitCompassAccuracy === 'number') {
      const a = e.webkitCompassAccuracy;
      badNow = !(a >= 0) || a > 15;
      text = a >= 0 ? `Akurasi ±${Math.round(a)}°` : 'Belum terkalibrasi';
    } else {
      if (!samples.length || now - samples[samples.length - 1].t >= 100) samples.push({ t: now, h });
      while (samples.length && now - samples[0].t > 1000) samples.shift();
      if (samples.length < 6) return;
      let path = 0;
      for (let i = 1; i < samples.length; i++) path += Math.abs(angDiff(samples[i].h, samples[i - 1].h));
      const net = Math.abs(angDiff(samples[samples.length - 1].h, samples[0].h));
      badNow = path - net > 30;
    }
    if (badNow !== bad) {
      if (!flipAt) flipAt = now;
      else if (now - flipAt >= 1500) { bad = badNow; flipAt = 0; }
    } else flipAt = 0;
    if (text === undefined) text = bad ? 'Akurasi meragukan' : 'Akurasi baik'; // Android: dari status setelah histeresis
    if (text !== accText) { accText = text; acc.lastElementChild.textContent = text; }
    acc.hidden = false;
    box.classList.toggle('is-uncal', bad);
    k8.hidden = !bad;
  };
  const screenAngle = () => (screen.orientation ? screen.orientation.angle : window.orientation) || 0;
  const onOrient = (e) => {
    let h = null;
    if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading; // iOS: searah jarum jam dari utara
    else if (e.absolute !== false && typeof e.alpha === 'number') h = 360 - e.alpha; // alpha: berlawanan arah jarum jam
    if (h === null) return;
    heading = (h + screenAngle() + 360) % 360; // HP landscape: "depan" = sisi atas layar
    checkAcc(e, heading, performance.now());
    if (!raf) raf = requestAnimationFrame(paint);
  };
  // Dial diputar -heading (utara di dial = utara sebenarnya). Diperhalus dan
  // lewat jalur terpendek, agar 359° → 0° tidak berputar balik satu lingkaran.
  const paint = () => {
    raf = 0;
    if (!on || heading === null) return;
    const target = -heading;
    const d = ((target - rot) % 360 + 540) % 360 - 180;
    rot += reduced ? d : d * 0.25;
    svg.style.setProperty('--rot', `${rot.toFixed(1)}deg`);
    // selisih arah hadap HP dengan kiblat (-180..180)
    const off = ((QIBLA - heading) % 360 + 540) % 360 - 180;
    const aligned = Math.abs(off) <= 5;
    // kompas meragukan → kotak tidak menyala lime (jangan meyakinkan arah yang belum pasti)
    box.classList.toggle('is-aligned', aligned && !bad);
    say(aligned ? (bad ? 'Menghadap kiblat (belum akurat)' : 'Menghadap kiblat') : `Putar ${off < 0 ? 'ke kiri' : 'ke kanan'} ${Math.round(Math.abs(off))}°`);
    if (Math.abs(d) > 0.2) raf = requestAnimationFrame(paint);
  };
  const stop = () => {
    on = false; heading = null; rot = 0;
    removeEventListener(evName, onOrient);
    clearTimeout(waitT); cancelAnimationFrame(raf); raf = 0;
    box.classList.remove('is-live', 'is-aligned', 'is-uncal');
    bad = false; flipAt = 0; samples = []; accText = '';
    acc.hidden = true; k8.hidden = true;
    svg.style.removeProperty('--rot');
    btn.setAttribute('aria-pressed', 'false');
    btn.textContent = 'Arah kiblat';
  };
  const start = async () => {
    if (iosAsk) {
      let r = 'denied';
      try { r = await DeviceOrientationEvent.requestPermission(); } catch { /* ditolak / bukan dari ketukan */ }
      if (r !== 'granted') { say('Izin sensor ditolak'); return; }
    }
    on = true;
    addEventListener(evName, onOrient);
    box.classList.add('is-live');
    btn.setAttribute('aria-pressed', 'true');
    btn.textContent = 'Matikan';
    say('Pegang HP mendatar…');
    // tidak ada data arah dalam 3 dtk → perangkat tanpa sensor kompas
    waitT = setTimeout(() => { if (on && heading === null) { stop(); say('Sensor kompas tidak tersedia'); } }, 3000);
  };
  btn.addEventListener('click', () => (on ? (stop(), say('')) : start()));
  // keluar dari peta jauh-jauh → sensor dimatikan (hemat baterai)
  new IntersectionObserver(([en]) => { if (!en.isIntersecting && on) { stop(); say(''); } }).observe(box);
}
