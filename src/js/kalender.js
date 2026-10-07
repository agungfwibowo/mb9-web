import { $, D, stripIndex } from './core.js';

/* ---------------------------------------------------------
   SIMPAN KE KALENDER — .ics dibuat di browser (tanpa server) +
   tautan Google Calendar. Jam ditulis dalam UTC (WIB = UTC+7) supaya
   tidak bergantung blok VTIMEZONE yang dukungannya tidak seragam.
   --------------------------------------------------------- */
// Dropdown kalender berlaku di semua ukuran layar. <details> tidak menutup
// sendiri saat klik di luar atau Escape — keduanya ditambahkan manual.
const calBox = $('#calBox');
if (calBox) {
  addEventListener('click', (e) => {
    if (calBox.open && !calBox.contains(e.target)) calBox.open = false;
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') calBox.open = false; });
}

const icsBtn = $('#icsBtn');
if (icsBtn && D.event && D.days.length) {
  const EV = D.event;
  const pad2 = (n) => String(n).padStart(2, '0');
  // '2026-12-23' + '08:00' (WIB) -> '20261223T010000Z'
  const utcStamp = (iso, hhmm) => {
    const d = new Date(`${iso}T${hhmm}:00+07:00`);
    return d.getUTCFullYear() + pad2(d.getUTCMonth() + 1) + pad2(d.getUTCDate())
      + 'T' + pad2(d.getUTCHours()) + pad2(d.getUTCMinutes()) + '00Z';
  };
  const esc_ics = (t) => String(t).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const pageUrl = location.origin + stripIndex(location.pathname);

  const buildIcs = () => {
    const stamp = utcStamp(new Date().toISOString().slice(0, 10), '00:00');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Muslim Berdedikasi 9//ID', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    D.days.forEach((d, i) => {
      lines.push('BEGIN:VEVENT',
        `UID:mb9-${d.key}-${d.iso}@muslimberdedikasi`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${utcStamp(d.iso, D.hours.open)}`,
        `DTEND:${utcStamp(d.iso, D.hours.close)}`,
        `SUMMARY:${esc_ics(`${EV.title} — Hari ke-${i + 1}`)}`,
        `LOCATION:${esc_ics(EV.venue)}`,
        `DESCRIPTION:${esc_ics(EV.desc)}`,
        `URL:${pageUrl}?hari=${d.key}`,
        'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n'); // RFC 5545 mewajibkan CRLF
  };

  icsBtn.addEventListener('click', () => {
    const blob = new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'muslim-berdedikasi-9.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  // Google Calendar hanya menerima satu acara: dibuat sebagai acara seharian
  // penuh yang membentang 23–27 Des. Tanggal akhirnya eksklusif → +1 hari.
  const gcal = $('#gcalBtn');
  if (gcal) {
    const ymd = (iso) => iso.replace(/-/g, '');
    // hitung di UTC murni — memakai offset +07:00 lalu toISOString() menggeser
    // tanggalnya mundur sehari karena konversi balik ke UTC
    const last = new Date(`${D.days[D.days.length - 1].iso}T00:00:00Z`);
    last.setUTCDate(last.getUTCDate() + 1);
    const p = new URLSearchParams({
      action: 'TEMPLATE',
      text: EV.title,
      dates: `${ymd(D.days[0].iso)}/${ymd(last.toISOString().slice(0, 10))}`,
      location: EV.venue,
      details: `${EV.desc}\n${D.hours.open.replace(':', '.')} – ${D.hours.close.replace(':', '.')} WIB\n${pageUrl}`,
    });
    gcal.href = `https://calendar.google.com/calendar/render?${p}`;
  }
}

/* Bagikan tautan — memakai sheet berbagi bawaan HP bila tersedia,
   selain itu menyalin ke clipboard. URL-nya ikut ?hari= yang aktif,
   jadi penerima langsung mendarat di jadwal hari yang sama. */
