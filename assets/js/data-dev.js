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

  // Tanggal asli tetap dipakai untuk teks hero/lokasi (lihat evDays di main.js)
  D.prodDays = D.days.map((d) => ({ ...d }));
  // Hari ke-1 selalu = hari ini (WIB) agar status Hari ini / Selesai / Tutup bisa diuji
  D.days[0].iso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
  // D.hours.open = '22:00'; // jam buka harian (WIB)
  D.hours.close = '23:30'; // jam tutup harian (WIB)

  // Contoh tampilan — mengikuti pola susunan acara Hari ke-1–5 Muslim
  // Berdedikasi 8 (edisi tahun lalu) sebagai referensi, BUKAN jadwal resmi MB9.
  D.jadwal.d1 = [
    { time: '08.00 - 21.00', title: 'Open Gate Bazar & Foodcourt', note: 'Berlangsung sepanjang hari', tag: 'layanan', group: 'g1' },
    { time: '08.00 - 17.00', title: 'Khitanan Massal', note: 'Gratis', tag: 'layanan', group: 'g1' },
    { time: '08.00 - 09.30', title: "Babak Grand Final Musabaqah Hifzhul Qur'an", note: 'Kategori Ikhwan', tag: 'lomba', group: 'g1' },
    { time: '08.00 - 10.00', title: 'Talkshow: Pelatihan Tour Leader Umroh', note: 'Gratis', tag: 'talkshow' },
    { time: '05.00 - 23.30', title: 'Kajian Ilmiah', ustadz: 'ali-nur', tag: 'kajian' },
    { time: '10.00 - 15.00', title: 'Donor Darah', note: 'Gratis', tag: 'layanan', group: 'g2' },
    { time: '10.00 - 16.00', title: 'Pemeriksaan Kesehatan Umum & Dermatologis', note: 'Ikhwan & Akhwat, Gratis', tag: 'layanan', group: 'g2' },
    { time: '10.00 - 17.00', title: 'Bekam', note: 'Ikhwan, Gratis', tag: 'layanan', group: 'g2' },
    { time: '10.00 - 17.00', title: '7/8 Cut', note: 'Ikhwan, Gratis', tag: 'layanan', group: 'g2' },
    { time: '14.00 - 17.30', title: "Konsultasi Syar'i", note: 'Gratis', tag: 'layanan', group: 'g2' },
    { time: '14.00 - 15.30', title: 'Kajian Muslimah', ustadz: 'ummu-hany', tag: 'kajian', akhwat: true },
    { time: '23.00 - 23.25', title: 'Kajian Ilmiah', ustadz: 'abu-saif', tag: 'kajian' },
    { time: '23.00 - 23.15', title: 'Kajian Ilmiah', ustadz: 'abu-aliyah', tag: 'kajian' },
    { time: '20.00 - 21.00', title: 'Talkshow: Umroh Mandiri atau Pakai Travel?', note: 'Gratis', tag: 'talkshow' },  ];
  D.jadwal.d2 = [
    { time: '08.00 - 21.00', title: 'Open Gate Bazar & Foodcourt', note: 'Berlangsung sepanjang hari', tag: 'layanan', group: 'g1' },
    { time: '08.00 - 09.30', title: "Babak Grand Final Musabaqah Hifzhul Qur'an", note: 'Kategori Ikhwan', tag: 'lomba', group: 'g1' },
    { time: '08.00 - 10.00', title: 'Macrame by DiArt Project', note: 'Gratis' },
    { time: '10.00 - 12.00', title: 'Kajian Muslimah', ustadz: 'ummu-hany', tag: 'kajian', akhwat: true },
    { time: '10.00 - 15.30', title: 'Perlombaan Adzan', note: 'Tingkat TK & SD', tag: 'lomba', group: 'g2' },
    { time: '10.00 - 16.00', title: 'Pemeriksaan Kesehatan Umum & Dermatologis', note: 'Ikhwan & Akhwat, Gratis', tag: 'layanan', group: 'g2' },
    { time: '10.00 - 17.00', title: 'Bekam', note: 'Ikhwan, Gratis', tag: 'layanan', group: 'g2' },
    { time: '10.00 - 17.00', title: '7/8 Cut', note: 'Ikhwan, Gratis', tag: 'layanan', group: 'g2' },
    { time: '13.30 - 15.30', title: 'Kajian Ilmiah', ustadz: 'gigih', tag: 'kajian' },
    { time: '14.00 - 17.30', title: "Konsultasi Syar'i", note: 'Gratis', tag: 'layanan', group: 'g2' },
    { time: '16.00 - 17.30', title: 'Pembukaan Acara', note: 'Walikota Medan Bapak Rico Waas' },
    { time: '19.00 - 20.00', title: 'Kajian Ilmiah', ustadz: 'gigih', tag: 'kajian' },
    { time: '20.00 - 21.00', title: 'Talkshow: RS. Mitra Medika Premiere', note: 'Gratis', tag: 'talkshow' },
  ];
  D.jadwal.d3 = [
    { time: '08.00 - 21.00', title: 'Open Gate Bazar & Foodcourt', note: 'Berlangsung sepanjang hari', tag: 'layanan', group: 'g1' },
    { time: '08.00 - 09.30', title: "Babak Grand Final Musabaqah Hifzhul Qur'an", note: 'Kategori Akhwat', tag: 'lomba', group: 'g1' },
    { time: '08.00 - 10.00', title: 'Lomba Memasak (Cooking Championship)', tag: 'lomba' },
    { time: '10.00 - 12.00', title: 'Kajian Muslimah', ustadz: 'ummu-hany', tag: 'kajian', akhwat: true },
    { time: '10.00 - 16.00', title: 'Pemeriksaan Kesehatan Umum & Gizi', note: 'Ikhwan & Akhwat, Gratis', tag: 'layanan', group: 'g2' },
    { time: '10.00 - 17.00', title: 'Bekam', note: 'Ikhwan, Gratis', tag: 'layanan', group: 'g2' },
    { time: '10.00 - 17.00', title: '7/8 Cut', note: 'Ikhwan, Gratis', tag: 'layanan', group: 'g2' },
    { time: '13.30 - 17.30', title: 'Nikah Gratis', tag: 'layanan', group: 'g2' },
    { time: '13.30 - 15.00', title: 'Kajian Muslimah', ustadz: 'gigih', tag: 'kajian', akhwat: true },
    { time: '14.00 - 17.00', title: "Konsultasi Syar'i", note: 'Gratis', tag: 'layanan', group: 'g2' },
    { time: '16.00 - 17.30', title: 'Kajian Ilmiah', ustadz: 'abu-qotadah', tag: 'kajian' },
    { time: '19.00 - 21.00', title: 'Kajian Ilmiah', ustadz: 'abu-qotadah', tag: 'kajian' },
  ];
  // D.jadwal.d4 = [
  //   { time: '08.00 - 21.00', title: 'Open Gate Bazar & Foodcourt', note: 'Berlangsung sepanjang hari', tag: 'layanan', group: 'g1' },
  //   { time: '08.00 - 09.30', title: "Babak Grand Final Musabaqah Hifzhul Qur'an", note: 'Kategori Akhwat', tag: 'lomba', group: 'g1' },
  //   { time: '08.00 - 10.00', title: 'Sensory Cupping by Koffie Kart', note: 'Gratis' },
  //   { time: '08.30 - 16.00', title: 'Perlombaan Pidato Bahasa Arab & Bahasa Inggris', note: 'Tingkat SMA', tag: 'lomba', group: 'g1' },
  //   { time: '10.00 - 12.00', title: 'Kajian Ilmiah', ustadz: 'ummu-hany', tag: 'kajian' },
  //   { time: '10.00 - 16.00', title: 'Pemeriksaan Kesehatan Umum & Gizi', note: 'Ikhwan & Akhwat, Gratis', tag: 'layanan', group: 'g2' },
  //   { time: '10.00 - 17.00', title: 'Bekam', note: 'Ikhwan, Gratis', tag: 'layanan', group: 'g2' },
  //   { time: '10.00 - 17.00', title: '7/8 Cut', note: 'Ikhwan, Gratis', tag: 'layanan', group: 'g2' },
  //   { time: '13.30 - 15.00', title: 'Kajian Muslimah', ustadz: 'abu-qotadah', tag: 'kajian', akhwat: true },
  //   { time: '16.00 - 18.00', title: 'Talkshow: LAZ DAI', note: 'Gratis', tag: 'talkshow' },
  //   { time: '19.00 - 21.00', title: 'Kajian Ilmiah', ustadz: 'abu-qotadah', tag: 'kajian' },
  // ];
  // D.jadwal.d5 = [
  //   { time: '08.00 - 21.00', title: 'Open Gate Bazar & Foodcourt', note: 'Berlangsung sepanjang hari', tag: 'layanan', group: 'g1' },
  //   { time: '08.00 - 10.00', title: 'Workshop KPMI Korwil Medan', note: 'Gratis' },
  //   { time: '08.00 - 10.00', title: 'Perlombaan Mewarnai', note: 'Tingkat TK & SD', tag: 'lomba', group: 'g1' },
  //   { time: '10.00 - 16.00', title: 'Pemeriksaan Kesehatan Umum & Gigi', note: 'Ikhwan & Akhwat, Gratis', tag: 'layanan', group: 'g2' },
  //   { time: '10.00 - 15.30', title: "Konsultasi Syar'i", note: 'Gratis', tag: 'layanan', group: 'g2' },
  //   { time: '10.00 - 17.00', title: 'Bekam', note: 'Gratis', tag: 'layanan', group: 'g2' },
  //   { time: '10.00 - 17.00', title: '7/8 Cut', note: 'Gratis', tag: 'layanan', group: 'g2' },
  //   { time: '14.00 - 15.30', title: 'Kajian Ilmiah', ustadz: 'ali-nur', tag: 'kajian' },
  //   { time: '16.00 - 16.30', title: "Pengumuman Pemenang & Pembagian Hadiah Musabaqah Hifzhul Qur'an", note: 'Serta Lucky Draw Umroh Gratis', tag: 'lomba' },
  //   { time: '16.30 - 18.00', title: 'Penutupan Acara' },
  // ];

  // Layanan di tenda (uji): tenda contoh dikosongkan dari tenant lalu diisi
  // layanan. Nama sama dengan judul jadwal → baris jadwal mendapat tautan
  // "Tenda xx" & tooltip tenda di denah menampilkan jam buka hari ini.
  const SERVICE_AT = {
    // tenda sekolah (33) sengaja tidak dipakai
    1: 'Bekam', 2: '7/8 Cut', 3: "Konsultasi Syar'i",
    4: 'Pemeriksaan Kesehatan Umum & Dermatologis', 5: 'Donor Darah',
  };
  D.boothOwners = [...(D.boothOwners || []), ...Object.values(SERVICE_AT).map((n) => [n, ''])];
  const taken = (from, to) => Object.keys(SERVICE_AT).some((n) => n >= from && n <= to);
  const displaced = (D.placements || []).filter(([, from, to = from]) => taken(from, to)).map(([name]) => name);
  D.placements = (D.placements || [])
    .filter(([, from, to = from]) => !taken(from, to))
    .concat(Object.entries(SERVICE_AT).map(([n, name]) => [name, Number(n)]));
  // Tenant yang tendanya terpakai layanan tetap dapat tenda: tenda terakhir dari
  // tenant yang menyewa ≥3 tenda berderet (urut daftar) diberikan ke mereka —
  // tidak ada tenant yang kehilangan semua tendanya.
  const owners = new Set((D.boothOwners || []).map(([n]) => n));
  const placed = new Set(D.placements.map(([n]) => n));
  displaced.filter((name) => !placed.has(name)).forEach((name) => {
    const donor = D.placements.find(([n, from, to = from]) => !owners.has(n) && to - from >= 2);
    if (!donor) return;
    D.placements.push([name, donor[2]]);
    donor[2] -= 1;
  });

  // Sementara: pengisi kajian contoh jadwal di atas (edisi lalu), tanpa foto.
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
