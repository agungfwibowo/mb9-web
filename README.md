# Muslim Berdedikasi 9 — Situs Informasi Acara

Situs statis (tanpa backend, tanpa form) untuk **Muslim Berdedikasi 9**, Festival Islam & Keluarga
di Komplek Lapangan Asrama Haji Medan, 23–27 Desember 2026.

Produksi: <https://www.muslimberdedikasi.com/>

## Struktur

```
index.html              Halaman utama (satu halaman, semua section)
privasi/index.html      Kebijakan Privasi → diakses di /privasi/
assets/css/style.css    Seluruh gaya halaman utama
assets/js/data.js       Data konten (jadwal, tenant, sponsor, dll.)
assets/js/main.js       Interaksi, animasi, menu bagikan, registrasi service worker
assets/fonts/           Font self-hosted (Public Sans, Roboto Mono, subset Noto Sans Mono)
assets/img/             Gambar & logo (org/, sponsor/, tenant/, logo/)
sw.js                   Service worker — cache offline untuk dipakai di lokasi acara
manifest.webmanifest    Manifest PWA (bisa dipasang ke layar utama)
_headers                Security header (Netlify / Cloudflare Pages)
.well-known/security.txt  Kontak pelaporan celah keamanan (RFC 9116)
robots.txt, sitemap.xml SEO
bahan/                  Materi mentah dari panitia — di-.gitignore, tidak ikut deploy
```

Library pihak ketiga dimuat dari CDN: GSAP + ScrollTrigger, qrcode-generator (cdnjs), Lenis (jsDelivr).

## Menjalankan secara lokal

Tidak ada proses build. Cukup jalankan server statis dari root proyek, misalnya:

```bash
python3 -m http.server 5501
# atau ekstensi Live Server di VS Code (port 5501)
```

Buka <http://localhost:5501/>. Service worker hanya aktif di `localhost` atau HTTPS.

## Merilis perubahan

1. Naikkan `VERSION` di [sw.js](sw.js) (mis. `mb9-1.1.311` → `mb9-1.1.312`).
2. Samakan semua `?v=` di [index.html](index.html) dengan angka versi tersebut
   (`style.css`, `data.js`, `main.js`). Cache lama otomatis dibuang saat worker baru aktif.
3. Perbarui `<lastmod>` di [sitemap.xml](sitemap.xml) bila konten berubah.

Menambah halaman baru: buat sebagai `nama/index.html` (agar URL-nya `/nama/` tanpa `.html`),
pakai path aset `../assets/...`, lalu tambahkan `'./nama/'` ke daftar `CORE` di `sw.js` dan ke sitemap.

## Checklist sebelum tayang

- [ ] Hapus `<meta name="robots" content="noindex, nofollow">` di `index.html` **dan** `privasi/index.html`.
- [ ] Pastikan domain memakai HTTPS.
- [ ] Pasang security header (lihat bawah), lalu buka situs dan cek Console browser: tidak boleh ada
      error `Content Security Policy`. Uji juga peta, menu Bagikan/QR, dan mode offline.
- [ ] Cek header di <https://securityheaders.com>.

## Privasi

Situs ini murni informasi: tidak ada form, akun, analytics, maupun pixel iklan. `localStorage`/
`sessionStorage` hanya untuk preferensi tampilan dan disimpan di perangkat pengunjung.
Detailnya ada di [privasi/index.html](privasi/index.html).

**Bila nanti menambah** analytics (Google Analytics, Meta Pixel), embed pihak ketiga baru, atau
pengumpulan data apa pun, perbarui halaman privasi dan tanggal berlakunya. Untuk analytics atau
pixel juga dibutuhkan banner persetujuan (UU PDP No. 27/2022). Jangan lupa menambahkan domain
barunya ke CSP.

## Keamanan

### Security header

[_headers](_headers) langsung terbaca di **Netlify** dan **Cloudflare Pages**. Untuk hosting lain,
salin header yang sama:

- **Apache (`.htaccess`)**: `Header always set Content-Security-Policy "…"` untuk tiap header
  (butuh `mod_headers`).
- **Nginx**: `add_header Content-Security-Policy "…" always;` di blok `server`.
- **Vercel**: properti `headers` di `vercel.json`.
- **GitHub Pages**: tidak bisa mengatur header. Taruh di depan Cloudflare, atau pakai
  `<meta http-equiv="Content-Security-Policy">` (tanpa `frame-ancestors`, yang tidak berlaku via meta).

### CSP dan script inline

CSP mengizinkan satu `<script>` inline di `<head>` `index.html` lewat hash `sha256-…`.
**Setiap kali isi script itu diubah**, hitung ulang hash-nya dan ganti nilainya di `_headers`:

```bash
python3 -c "import re,hashlib,base64;s=open('index.html').read();[print('sha256-'+base64.b64encode(hashlib.sha256(m.encode()).digest()).decode()) for m in re.findall(r'<script>(.*?)</script>',s,re.S)]"
```

Bila menambah library CDN atau embed dari domain baru, tambahkan domainnya ke direktif yang sesuai
(`script-src`, `connect-src`, `frame-src`, `img-src`).

### security.txt

Field `Expires` di [.well-known/security.txt](.well-known/security.txt) wajib diperpanjang sebelum
tanggalnya lewat (maksimal 1 tahun ke depan). Saat ini berlaku sampai **6 Oktober 2027**.
