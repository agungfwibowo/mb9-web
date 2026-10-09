#!/usr/bin/env python3
"""Peta lokasi (section #lokasi) dari data OpenStreetMap → assets/img/peta-lokasi.svg.

Menggantikan iframe Google Maps: file statis ini ikut di-cache service worker,
jadi peta tetap tampil saat offline. Data © OpenStreetMap contributors (ODbL) —
atribusi wajib tampil di halaman (lihat .peta__osm di index.html).

Pakai:
  python3 tools/peta-lokasi.py ambil   # unduh data OSM → tools/osm/*.json
  python3 tools/peta-lokasi.py         # bangun SVG dari tools/osm/*.json

Koordinat SVG dalam METER, titik (0,0) = pin lokasi acara, y ke bawah.
viewBox = jendela WIN; ukuran tampil diatur CSS (--k px per meter).
"""
import json, math, os, sys, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OSM = os.path.join(ROOT, 'tools', 'osm')
OUT = os.path.join(ROOT, 'assets', 'img', 'peta-lokasi.svg')

PIN = (3.5400828, 98.6739472)          # lapangan Asrama Haji (pin "Petunjuk Arah")
BBOX = '3.5322,98.6560,3.5484,98.6830'  # area unduhan (lat_min,lon_min,lat_max,lon_max)
WIN = (-1500, -500, 2500, 1000)         # x, y, lebar, tinggi (meter) — harus sama dengan CSS
BLD = (-1300, 900, -400, 400)           # bangunan hanya di jendela ini (x0, x1, y0, y1): hemat ukuran file

KX = 111320 * math.cos(math.radians(PIN[0]))
KY = 110574
xy = lambda p: ((p['lon'] - PIN[1]) * KX, (PIN[0] - p['lat']) * KY)

QUERIES = {
    'jalan': f'way["highway"]({BBOX})',
    'area': f'(way["landuse"]({BBOX});way["leisure"]({BBOX});way["amenity"]({BBOX});)',
    'air': f'(way["waterway"]({BBOX});way["natural"="water"]({BBOX});)',
    'bangunan': f'way["building"]({BBOX})',
}
MIRRORS = ['https://overpass.kumi.systems/api/interpreter', 'https://overpass-api.de/api/interpreter',
           'https://overpass.private.coffee/api/interpreter']


def ambil():
    os.makedirs(OSM, exist_ok=True)
    for name, q in QUERIES.items():
        data = urllib.parse.urlencode({'data': f'[out:json][timeout:80];{q};out geom;'})
        for attempt in range(9):
            url = MIRRORS[attempt % len(MIRRORS)] + '?' + data
            req = urllib.request.Request(url, headers={'User-Agent': 'mb9-web-map/1.0 (muslimberdedikasi.com)'})
            try:
                body = urllib.request.urlopen(req, timeout=90).read()
                json.loads(body)
                open(os.path.join(OSM, f'{name}.json'), 'wb').write(body)
                print(name, 'ok', len(body))
                break
            except Exception as e:  # server Overpass sering sibuk (500/504) → coba mirror lain
                print(name, 'gagal', e)
                time.sleep(3)
        else:
            sys.exit(f'{name}: semua percobaan gagal')


def load(name):
    return json.load(open(os.path.join(OSM, f'{name}.json')))['elements']


def simplify(pts, tol=1.2):
    """Douglas-Peucker: buang titik yang nyaris segaris (toleransi meter)."""
    if len(pts) < 3:
        return pts
    # bentuk tertutup (awal = akhir): semua titik "segaris" dengan garis nol →
    # pecah dulu di titik terjauh dari awal, sederhanakan kedua belahnya
    if math.dist(pts[0], pts[-1]) < 1e-6:
        far = max(range(len(pts)), key=lambda k: math.dist(pts[0], pts[k]))
        if far == 0:
            return pts[:1]
        return simplify(pts[:far + 1], tol)[:-1] + simplify(pts[far:], tol)
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    n = math.hypot(dx, dy) or 1e-9
    i, dmax = 0, -1
    for k in range(1, len(pts) - 1):
        d = abs(dy * pts[k][0] - dx * pts[k][1] + x2 * y1 - y2 * x1) / n
        if d > dmax:
            i, dmax = k, d
    if dmax <= tol:
        return [pts[0], pts[-1]]
    return simplify(pts[:i + 1], tol)[:-1] + simplify(pts[i:], tol)


def path(pts, close=False):
    """Path relatif berbilangan bulat (meter) — ringkas."""
    pts = [(round(x), round(y)) for x, y in pts]
    out, (px, py) = [f'M{pts[0][0]} {pts[0][1]}'], pts[0]
    for x, y in pts[1:]:
        if (x, y) == (px, py):
            continue
        out.append(f'l{x - px} {y - py}')
        px, py = x, y
    return ''.join(out) + ('z' if close else '')


def inside(pts, x0, x1, y0, y1):
    return any(x0 <= x <= x1 and y0 <= y <= y1 for x, y in pts)


def build():
    x, y, w, h = WIN
    win = (x - 100, x + w + 100, y - 100, y + h + 100)
    layers = {}

    def add(key, d):
        layers.setdefault(key, []).append(d)

    # area: taman/rumput, pemakaman, sekolah, masjid (blok berwarna lembut)
    for e in load('area'):
        g = e.get('geometry')
        t = e.get('tags', {})
        if not g:
            continue
        pts = [xy(p) for p in g]
        if not inside(pts, *win):
            continue
        if t.get('name') == 'Taman Asrama Haji':
            add('venue', path(simplify(pts), True))
        elif t.get('leisure') in ('park', 'pitch') or t.get('landuse') in ('grass', 'orchard', 'cemetery') or t.get('amenity') == 'grave_yard':
            add('hijau', path(simplify(pts), True))
    for e in load('air'):
        g = e.get('geometry')
        if not g:
            continue
        pts = [xy(p) for p in g]
        if not inside(pts, *win):
            continue
        t = e['tags']
        if t.get('natural') == 'water':
            add('air', path(simplify(pts), True))
        elif t.get('waterway'):
            add('sungai', path(simplify(pts, 2)))
    for e in load('bangunan'):
        g = e.get('geometry')
        if not g:
            continue
        pts = [xy(p) for p in g]
        if all(BLD[0] <= px <= BLD[1] and BLD[2] <= py <= BLD[3] for px, py in pts):
            add('bangunan', path(simplify(pts, .8), True))
    # jalan per kelas → lebar garis (meter)
    CLS = {'trunk': 'utama', 'primary': 'utama', 'trunk_link': 'utama-link', 'primary_link': 'utama-link',
           'secondary': 'besar', 'tertiary': 'besar', 'secondary_link': 'besar',
           'residential': 'kecil', 'unclassified': 'kecil',
           'living_street': 'gang', 'service': 'gang', 'path': 'setapak', 'footway': 'setapak'}
    for e in load('jalan'):
        k = CLS.get(e['tags'].get('highway'))
        if not k:
            continue
        pts = [xy(p) for p in e['geometry']]
        if inside(pts, *win):
            add('j-' + k, path(simplify(pts)))

    W = {'utama': 15, 'utama-link': 8, 'besar': 10, 'kecil': 6.5, 'gang': 4.2}
    roads = ['gang', 'kecil', 'besar']
    css = (
        '.l{fill:#e7e6e2}.b{fill:#d9d8d3}.h{fill:#dbe0cd}.v{fill:#c5fa01;fill-opacity:.5;stroke:#2b2b2b;stroke-width:2}'
        '.w{fill:#afc3f8}.r{fill:none;stroke:#afc3f8;stroke-width:6;stroke-linecap:round}'
        '.c,.f,.u,.p{fill:none;stroke-linecap:round;stroke-linejoin:round}.c{stroke:#c9c8c3}.f{stroke:#fff}'
        '.u{stroke:#2b2b2b}.p{stroke:#a9a7a3;stroke-width:1.4;stroke-dasharray:4 4}'
    )
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {w} {h}" width="{w}" height="{h}">',
           f'<!-- Data © OpenStreetMap contributors (ODbL) — dibangun tools/peta-lokasi.py --><style>{css}</style>',
           f'<rect class="l" x="{x}" y="{y}" width="{w}" height="{h}"/>']
    lay = lambda key, cls, extra='': out.append(f'<path class="{cls}"{extra} d="{"".join(layers[key])}"/>') if key in layers else None
    lay('hijau', 'h')
    lay('air', 'w')
    lay('sungai', 'r')
    lay('bangunan', 'b')
    lay('venue', 'v')
    lay('j-setapak', 'p')
    # casing (tepi abu) di bawah semua isi putih, supaya persimpangan menyatu
    for k in roads:
        lay('j-' + k, 'c', f' stroke-width="{W[k] + 2.4}"')
    for k in roads:
        lay('j-' + k, 'f', f' stroke-width="{W[k]}"')
    lay('j-utama-link', 'u', f' stroke-width="{W["utama-link"]}"')
    lay('j-utama', 'u', f' stroke-width="{W["utama"]}"')
    out.append('</svg>')
    svg = '\n'.join(out)
    open(OUT, 'w').write(svg)
    print(OUT, len(svg), 'byte', {k: len(v) for k, v in layers.items()})


if __name__ == '__main__':
    ambil() if sys.argv[1:] == ['ambil'] else build()
