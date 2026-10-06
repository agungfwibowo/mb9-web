/* =========================================================
   DATA UJI (DEV) — hanya aktif saat dibuka di komputer sendiri
   (localhost / 127.0.0.1 / IP jaringan lokal). Di situs produksi
   file ini langsung keluar tanpa mengubah apa pun.
   Dimuat SETELAH data-prod.js dan menimpa sebagian isinya.
   ========================================================= */
(() => {
  const h = location.hostname;
  const local = h === 'localhost' || h === '::1' || h.endsWith('.local')
    || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h);
  if (!local || !window.MB9) return;
  const D = window.MB9;

  // Tanggal asli tetap dipakai untuk teks hero/lokasi (lihat evDays di main.js)
  D.prodDays = D.days.map((d) => ({ ...d }));
  // Hari ke-1 selalu = hari ini (WIB) agar status Hari ini / Selesai / Tutup bisa diuji
  D.days[0].iso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  // D.hours.open = '22:00'; // jam buka harian (WIB)
  // D.hours.close = '22:30'; // jam tutup harian (WIB)

  // Contoh tampilan — mengikuti pola susunan acara Hari ke-1 Muslim
  // Berdedikasi 8 (edisi tahun lalu) sebagai referensi, BUKAN jadwal resmi MB9.
  D.jadwal.d1 = [
    { time: '08.00 - 21.00', title: 'Open Gate Bazar & Foodcourt', note: 'Berlangsung sepanjang hari', tag: 'layanan', group: 'g1' },
    { time: '08.00 - 17.00', title: 'Khitanan Massal', note: 'Gratis', tag: 'layanan', group: 'g1' },
    { time: '08.00 - 09.30', title: "Babak Grand Final Musabaqah Hifzhul Qur'an", note: 'Kategori Ikhwan', tag: 'lomba', group: 'g1' },
    { time: '08.00 - 10.00', title: 'Talkshow: Pelatihan Tour Leader Umroh', note: 'Gratis', tag: 'talkshow' },
    { time: '10.00 - 11.30', title: 'Kajian Ilmiah', ustadz: 'ali-nur', tag: 'kajian' },
    { time: '10.00 - 15.00', title: 'Donor Darah', note: 'Gratis', tag: 'layanan', group: 'g2' },
    { time: '10.00 - 16.00', title: 'Pemeriksaan Kesehatan Umum & Dermatologis', note: 'Ikhwan & Akhwat, Gratis', tag: 'layanan', group: 'g2' },
    { time: '10.00 - 17.00', title: 'Bekam', note: 'Ikhwan, Gratis', tag: 'layanan', group: 'g2' },
    { time: '10.00 - 17.00', title: '7/8 Cut', note: 'Ikhwan, Gratis', tag: 'layanan', group: 'g2' },
    { time: '14.00 - 17.30', title: "Konsultasi Syar'i", note: 'Gratis', tag: 'layanan', group: 'g2' },
    { time: '14.00 - 15.30', title: 'Kajian Muslimah', ustadz: 'ummu-hany', tag: 'kajian', ladies: true },
    { time: '16.00 - 18.00', title: 'Kajian Ilmiah', ustadz: 'abu-saif', tag: 'kajian' },
    { time: '19.00 - 20.00', title: 'Kajian Ilmiah', ustadz: 'abu-aliyah', tag: 'kajian' },
    { time: '20.00 - 21.00', title: 'Talkshow: Umroh Mandiri atau Pakai Travel?', note: 'Gratis', tag: 'talkshow' },  ];

  // Sementara: pengisi kajian contoh jadwal di atas (edisi lalu), tanpa foto.
  // `id` dirujuk jadwal lewat `ustadz:` → nama tampil sebagai keterangan acara.
  D.asatidz = [
    { id: 'ali-nur', name: 'Ustadz Ali Nur Medan', role: 'Kajian Ilmiah' },
    { id: 'ummu-hany', name: 'Ustadzah Ummu Hany', role: 'Kajian Muslimah' },
    { id: 'abu-saif', name: 'Ustadz Abu Saif Wahyudi', role: 'Kajian Ilmiah' },
    { id: 'abu-aliyah', name: "Ustadz Abu 'Aliyah Joko Sanubari", role: 'Kajian Ilmiah' },
  ];
})();
