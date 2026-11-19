/* =========================================================
   DATA UJI (DEV) — aktif di mana saja KECUALI domain produksi
   (muslimberdedikasi.com / www.muslimberdedikasi.com): localhost,
   agungfwibowo.github.io, dll. Di domain produksi file ini langsung
   keluar tanpa mengubah apa pun.
   Dimuat SETELAH data-prod.js dan menimpa sebagian isinya.
   ========================================================= */
(() => {
  const PROD = ['muslimberdedikasi.com', 'www.muslimberdedikasi.com'];
  if (PROD.includes(location.hostname) || !window.MB9) return;
  const D = window.MB9;

  // Tanggal acara = tanggal asli di data-prod.js (23–27 Des 2026); contoh
  // jadwal sudah dihapus. Untuk menguji status Hari ini / Selesai / Tutup,
  // aktifkan baris di bawah (hari ke-1 = hari ini, WIB):
  // D.prodDays = D.days.map((d) => ({ ...d }));
  // D.days[0].iso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  // D.hours.open = '22:00'; // jam buka harian (WIB)
  // D.hours.close = '22:30'; // jam tutup harian (WIB)

  // Sementara: contoh pengisi kajian (edisi lalu), tanpa foto.
  // `id` dirujuk jadwal lewat `ustadz:` → nama tampil sebagai keterangan acara.
  D.asatidz = [
    { id: 'ali-nur', name: 'Ustadz Ali Nur Medan', role: 'Kajian Ilmiah' },
    { id: 'ummu-hany', name: 'Ustadzah Ummu Hany', role: 'Kajian Muslimah', akhwat: true },
    { id: 'abu-saif', name: 'Ustadz Abu Saif Wahyudi', role: 'Kajian Ilmiah' },
    { id: 'abu-aliyah', name: "Ustadz Abu 'Aliyah Joko Sanubari", role: 'Kajian Ilmiah' },
    { id: 'gigih', name: 'Ustadz Gigih Surya Nugraha, S.H.', role: 'Kajian Ilmiah' },
    { id: 'abu-qotadah', name: 'Ustadz Abu Qotadah Al-Atsary', role: 'Kajian Ilmiah' },
  ];
})();
