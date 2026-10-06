/* =========================================================
   DATA KONTEN (PRODUKSI) — edit di sini tanpa menyentuh HTML/JS lain.
   Data contoh/uji untuk pengembangan lokal ada di data-dev.js.
   ========================================================= */
window.MB9 = {
  // Jam buka harian (WIB). Countdown otomatis: mulai = hari pertama jam open, selesai = hari terakhir jam close
  hours: { open: '08:00', close: '21:00' },

  // Dipakai tombol "Simpan ke Kalender" (.ics & Google Calendar)
  event: {
    title: 'Muslim Berdedikasi 9',
    venue: 'Komplek Lapangan Asrama Haji Medan',
    desc: 'Islamic Family Festival — kajian ilmiah, layanan sosial gratis, lomba, bazar & foodcourt.',
  },

  hotline: { label: '0812-5555-7120', wa: 'https://wa.me/6281255557120' },

  // Cukup key + iso (YYYY-MM-DD); nama hari & tanggal dibentuk otomatis di main.js
  days: [
    { key: 'd1', iso: '2026-12-23' },
    { key: 'd2', iso: '2026-12-24' },
    { key: 'd3', iso: '2026-12-25' },
    { key: 'd4', iso: '2026-12-26' },
    { key: 'd5', iso: '2026-12-27' },
  ],

  /* JADWAL — InsyaAllah menyusul.
     Isi per hari dengan format:
     d1: [ { time: '08.00 - 21.00', title: 'Open Gate Bazar & Foodcourt', note: '', tag: 'kajian|layanan|lomba|talkshow' }, ... ]
     ladies (opsional): true → acara khusus muslimah, ditandai warna pink.
     ustadz (opsional): id dari ASATIDZ (atau daftar id: ['a', 'b']) → nama pengisi
       tampil sebagai keterangan; bila note juga diisi, keduanya disambung ' · '.
     Tampilan Tabel mengikuti URUTAN BARIS di sini (per periode Pagi/Siang/…),
     jadi cukup pindah baris untuk mengubah urutan.
     group (opsional): acara yang berjalan bersamaan — di Tabel ditandai garis
     biru di kiri. Dipilih manual (kurasi), bukan dihitung dari jam.
     order (opsional): paksa urutan di Tabel tanpa memindah baris. Angka kecil
     tampil duluan; tanpa order = 0. Tampilan Durasi tetap diurut menurut jam.
     Selama kosong, tab hari menampilkan status "InsyaAllah menyusul". */
  jadwal: {
    d1: [], d2: [], d3: [], d4: [], d5: [],
  },

  /* ASATIDZ — InsyaAllah menyusul.
     Format: { id: 'nama-singkat', name: 'Ustadz ...', role: 'Kajian Ilmiah', photo: 'assets/img/asatidz/nama.webp' }
     id dipakai jadwal (field ustadz) untuk merujuk pengisi acara. */
  asatidz: [],

  layanan: [
    {
      title: 'Layanan Medis & Kesehatan',
      icon: 'medis',
      items: [
        'Pemeriksaan Kesehatan Umum & Gigi',
        'Pemeriksaan Dermatologis (Kulit) & Gizi',
        'Bekam (Khusus Ikhwan)',
        'Donor Darah',
      ],
    },
    {
      title: 'Layanan Sosial',
      icon: 'sosial',
      items: [
        'Khitanan Massal',
        'Nikah Gratis',
        '7/8 Cut',
        'Konsultasi Syar’i Privat (Ikhwan & Akhwat)',
      ],
    },
    {
      title: 'Area Bazar & Kuliner',
      icon: 'bazar',
      free: false, // sembunyikan label GRATIS
      text: 'Nikmati beragam pilihan <b>foodcourt</b> dan <b>produk Islami</b> dari puluhan tenant terpilih di Open Gate Bazar & Foodcourt yang dibuka sepanjang hari (08.00 - 21.00 WIB).',
    },
  ],

  tenants: [
    ['AKA Travel', 'aka-travel.webp'], ['Akhwatgoods.id', 'akhwatgoods-id.webp'], ['Abaya Nafisah', 'abaya-nafisah.webp'],
    ['Abayabaruku', 'abayabaruku.webp', 'dark'], ["Adiani Syar'i", 'adiani-syar-i.webp'], ['Al Hijaab', 'al-hijaab.webp'],
    ['Alkahfi Tour & Travel', 'alkahfi-tour-travel.webp'], ['Annurwear', 'annurwear.webp', 'dark'], ['Arbaqi Honey', 'arbaqi-honey.webp'],
    ['Ayam Jukut Juragan', 'ayam-jukut-juragan.webp'], ['Baraka', 'baraka.webp'], ['Boksa Bakso', 'boksa-bakso.webp'],
    ['Boksa Drink', 'boksa-drink.webp'], ['Burger Kejam', 'burger-kejam.webp'], ['Churros Faama.eat', 'churros-faama-eat.webp'],
    ['Fastab Coffee', 'fastab-coffee.webp'], ['GNG Shop', 'gng-shop.webp'], ['Hiru Koffee', 'hiru-koffee.webp'],
    ['House of Hurriyyah', 'house-of-hurriyyah.webp'], ['Jejak Lapar', 'jejak-lapar.webp'], ['Itam.id', 'itam-id.webp'],
    ['Jajanan Umi Rina', 'jajanan-umi-rina.webp'], ['Juragan Dimsum', 'juragan-dimsum.webp'], ['Justrue', 'justrue.webp'],
    ['Kalila Dailywear', 'kalila-dailywear.webp'], ["Kalila Syar'i", 'kalila-syar-i.webp', 'dark'], ['Khansa Stores', 'khansa-stores.webp'],
    ['Khazanah Store', 'khazanah-store.webp'], ['Kitchyurie', 'kitchyurie.webp'], ['Koaki.idn', 'koaki-idn.webp'],
    ['Kopikuh', 'kopikuh.webp'], ['Kuna Patisserie', 'kuna-patisserie.webp'], ['Lagilah', 'lagilah.webp'],
    ['Little Maryamm', 'little-maryamm.webp'], ['Mabit Tour', 'mabit-tour.webp'], ['Mahabbah Cake & Cookies', 'mahabbah-cake-cookies.webp'],
    ['Mamawiwa', 'mamawiwa.webp', 'dark'], ['Mango Time', 'mango-time.webp'], ['Maya Salon Muslimah', 'maya-salon-muslimah.webp'],
    ['Mecca Luxury', 'mecca-luxury.webp'], ['Muda Burger', 'muda-burger.webp'], ['Mumtaz Store', 'mumtaz-store.webp'],
    ['NIMERA', 'nimera.webp'], ['Nasgor Basmati Rafka', 'nasgor-basmati-rafka.webp'], ['Nasgor Tiarbah', 'nasgor-tiarbah.webp'],
    ['Nasgor Wagyu Khalid', 'nasgor-wagyu-khalid.webp'], ['Omarabic', 'omarabic.webp'], ['Pempek Nabil', 'pempek-nabil.webp'],
    ['Rafka Store', 'rafka-store.webp'], ['Rasa Coffee', 'rasa-coffee.webp'], ['Rihlah Store', 'rihlah-store.webp'],
    ['Risol Mimi', 'risol-mimi.webp'], ['Samase Shahih Gallery', 'samase-shahih-gallery.webp'], ['Segerinajaa', 'segerinajaa.webp'],
    ['Shaffat Parfum Arab Medan', 'shaffat-parfum-arab-medan.webp'], ['Shawarma Al Masri', 'shawarma-al-masri.webp'], ['Shockelat', 'shockelat.webp'],
    ['Sirun Kebab', 'sirun-kebab.webp'], ['SnD Kitchenette', 'snd-kitchenette.webp'], ['Sundae Halalicious', 'sundae-halalicious.webp'],
    ['Teras Mbonk', 'teras-mbonk.webp'], ['UMMECC', 'ummecc.webp'], ['Warung Tiga Sekawan', 'warung-tiga-sekawan.webp'],
    ['Warung Ummu Aisyah', 'warung-ummu-aisyah.webp'], ['Wedrinkeat', 'wedrinkeat.webp'], ['Yossi Soselisa', 'yossi-soselisa.webp'],
    ['Youvieshop', 'youvieshop.webp'], ['Yuriz', 'yuriz.webp'],
  ],
  // Penempatan tenant di denah: [nama tenant, tenda awal, tenda akhir?].
  // SEMENTARA — diacak (food → tenda Food/VIP, lainnya → Non-Food/Subsidi),
  // menunggu konfirmasi panitia. Tenda 31-32 milik Rasyaad TV (lihat
  // boothOwners), tenda 33 (sekolah) sengaja kosong. Nama WAJIB sama persis dengan daftar tenants di atas;
  // deretan hanya boleh di tenda yang benar-benar bersebelahan. Tenant dengan
  // tenda berjauhan: tulis namanya di beberapa baris, mis. ['X', 72, 73], ['X', 45].
  // Pemilik tenda yang bukan tenant (tidak tampil di slider/daftar tenant),
  // tetap dapat tooltip logo, sorot grup & link ?tenant=. [nama, file di img/tenant]
  boothOwners: [['Rasyaad TV', 'rasyaad-tv.webp']],
  // Tautan situs — tampil di tooltip tenda terpilih & menjadikan logo
  // dengan nama yang sama di section penyelenggara (partners) sebagai link.
  links: {
    'Rasyaad TV': 'https://www.rasyaad.tv/',
    'Lajnah Dakwah Medan': 'https://www.facebook.com/lajnahdakwahmedan/',
    'Hanya Pagi': 'https://hanyapagi.com/',
    'SJP Wisata Tour & Travel': 'https://sjpwisata.com/',
    'Uwais Tour': 'https://www.instagram.com/uwais.tour/',
    'SesuaiSunnah.com': 'https://sesuaisunnah.com/',
    'Medan Mengaji': 'https://www.instagram.com/medanmengaji/',
    'Masjid Al Muwahhidin': 'https://masjidmuwahhidin.com/',
    'Solidaritas Ambil Bagian': 'https://www.instagram.com/_sab.official/',
  },
  placements: [
    ['Rasyaad TV', 31, 32],
    ["Shaffat Parfum Arab Medan", 1], ["Little Maryamm", 2], ["Omarabic", 3],
    ["Annurwear", 4], ["Teras Mbonk", 5], ["NIMERA", 6],
    ["Rihlah Store", 7], ["Itam.id", 8], ["GNG Shop", 9],
    ["Khazanah Store", 10], ["Mumtaz Store", 11], ["Yuriz", 12, 13],
    ["Akhwatgoods.id", 14], ["Alkahfi Tour & Travel", 15], ["Rafka Store", 16],
    ["UMMECC", 17], ["Khansa Stores", 18], ["Mamawiwa", 19],
    ["Shawarma Al Masri", 20], ["Boksa Bakso", 21], ["Warung Ummu Aisyah", 22, 23],
    ["Shockelat", 24], ["Burger Kejam", 25, 27], ["Pempek Nabil", 28, 30],
    ["Fastab Coffee", 34, 36], ["Ayam Jukut Juragan", 37], ["Rasa Coffee", 38],
    ["Segerinajaa", 39, 41], ["Sundae Halalicious", 42], ["Hiru Koffee", 43],
    ["Muda Burger", 44], ["SnD Kitchenette", 45], ["Mango Time", 46],
    ["Boksa Drink", 47, 48], ["Kitchyurie", 49], ["Kuna Patisserie", 50],
    ["Kopikuh", 51], ["Wedrinkeat", 52], ["Sirun Kebab", 53],
    ["Abayabaruku", 54], ["Kalila Dailywear", 55], ["Justrue", 56],
    ["Adiani Syar'i", 57], ["AKA Travel", 58], ["Youvieshop", 59],
    ["Mecca Luxury", 60], ["Samase Shahih Gallery", 61], ["Yossi Soselisa", 62, 64],
    ["Maya Salon Muslimah", 65], ["Al Hijaab", 66], ["Kalila Syar'i", 67, 68],
    ["Nasgor Wagyu Khalid", 69, 71], ["Warung Tiga Sekawan", 72, 74],
    // contoh tenda berjauhan (lintas kategori: VIP & Food) — lihat SnD Kitchenette di atas (tenda 45)
    ["SnD Kitchenette", 75], ["Jejak Lapar", 76],
    ["Mahabbah Cake & Cookies", 77], ["Churros Faama.eat", 78], ["Nasgor Basmati Rafka", 79],
    ["Arbaqi Honey", 80, 81], ["Nasgor Tiarbah", 82], ["Jajanan Umi Rina", 83],
    ["Risol Mimi", 84], ["Juragan Dimsum", 85, 86], ["Baraka", 87, 88],
    ["Koaki.idn", 89], ["House of Hurriyyah", 90], ["Lagilah", 91],
    ["Mabit Tour", 92, 94], ["Abaya Nafisah", 95],
  ],

  partners: [
    {
      group: 'Dipersembahkan Oleh',
      logos: [
        ['Lajnah Dakwah Medan', 'assets/img/org/logo-lajnah.webp'],
        ['Rasyaad TV', 'assets/img/org/logo-rasyaad-tv.webp'],
      ],
    },
    {
      group: 'Sponsor',
      logos: [
        ['Hanya Pagi', 'assets/img/sponsor/hanya-pagi.webp'],
        ['SJP Wisata Tour & Travel', 'assets/img/sponsor/indonesia-mengaji.webp'],
        ['Uwais Tour', 'assets/img/sponsor/uwais-tour.webp'],
      ],
    },
    {
      group: 'Didukung Oleh',
      logos: [
        ['SesuaiSunnah.com', 'assets/img/org/logo-sesuaisunnah.webp'],
        ['Medan Mengaji', 'assets/img/org/logo-medangmengaji.webp', 'dark'],
        ['Masjid Al Muwahhidin', 'assets/img/org/logo-masjid-al-muwahhidin.webp'],
        ['Solidaritas Ambil Bagian', 'assets/img/org/logo-sab-putih.webp', 'dark'],
      ],
    },
  ],
};
