// Refaz os territórios do mapa "japao" com divisas reais: províncias atuais do Japão (Natural Earth admin-1, 1:10m,
// domínio público) agrupadas nas províncias do período Sengoku. Onde a divisa antiga corta uma província atual
// (Owari/Mikawa em Aichi, Tōtōmi/Suruga em Shizuoka), o corte segue a linha histórica aproximada, com sinuosidade.
// Mantém nomes, ordem, terra de fundo (bg) e travessias por mar; recalcula desenho, rótulos e vizinhanças.
// Uso: node japao-real.mjs <ne_10m_admin_1 JPN.geojson> <countries-50m.json do world-atlas 2.0.2> <maps.json>
// Dependências: d3-geo 3, topojson-client 3, polygon-clipping 0.15.
import * as d3 from 'd3-geo';
import * as topo from 'topojson-client';
import pc from 'polygon-clipping';
import fs from 'fs';

const [, , JPN, W50, MAPS] = process.argv;
const W = 1000, H = 620;
const pref = JSON.parse(fs.readFileSync(JPN, 'utf8')).features;
const world50 = JSON.parse(fs.readFileSync(W50, 'utf8'));
const M = JSON.parse(fs.readFileSync(MAPS, 'utf8'));
const m = M.japao;

// ---- mesma projeção do maps-build.mjs (o fundo continua alinhado) ----
const B = (a, b, c, d) => [a, b, c, d];
function clipHalf(ring, f) { const out = []; for (let i = 0; i < ring.length; i++) { const A = ring[i], Bp = ring[(i + 1) % ring.length], da = f(A), db = f(Bp); if (da <= 0) out.push(A); if ((da <= 0) !== (db <= 0)) { const t = da / (da - db); out.push([A[0] + (Bp[0] - A[0]) * t, A[1] + (Bp[1] - A[1]) * t]); } } return out; }
function densify(ring) { const o = []; for (let i = 0; i < ring.length - 1; i++) { const A = ring[i], Bp = ring[i + 1], n = Math.max(1, Math.ceil(Math.max(Math.abs(Bp[0] - A[0]), Math.abs(Bp[1] - A[1])))); for (let k = 0; k < n; k++) o.push([A[0] + (Bp[0] - A[0]) * k / n, A[1] + (Bp[1] - A[1]) * k / n]); } o.push(ring[ring.length - 1]); return o; }
function clipBox(ring, [x0, x1, y0, y1]) { let r = ring.slice(0, -1).map(p => p.slice()); r = clipHalf(r, p => x0 - p[0]); r = clipHalf(r, p => p[0] - x1); r = clipHalf(r, p => y0 - p[1]); r = clipHalf(r, p => p[1] - y1); return r.length < 3 ? null : densify([...r, r[0]]); }
const wind = polys => polys.map(p => d3.geoArea({ type: 'Polygon', coordinates: p }) > 2 * Math.PI ? p.map(r => r.slice().reverse()) : p);
const jp = topo.merge(world50, world50.objects.countries.geometries.filter(g => g.properties.name === 'Japan'));
const jpBox = []; for (const poly of jp.coordinates) { const e = clipBox(poly[0], B(129, 146, 30.9, 45.6)); if (e) jpBox.push([e]); }
const proj = d3.geoConicConformal().rotate([-137, 0]).parallels([33, 40]).angle(-42)
  .fitExtent([[10, 10], [W - 10, H - 10]], { type: 'MultiPolygon', coordinates: wind(jpBox) }).clipExtent([[0, 0], [W, H]]);
const path = d3.geoPath(proj);

// ---- províncias atuais → territórios do Sengoku ----
const G = {
  'Satsuma': ['Kagoshima'], 'Hyuga': ['Miyazaki'], 'Higo': ['Kumamoto'], 'Hizen': ['Saga', 'Nagasaki'], 'Chikuzen': ['Fukuoka'], 'Bungo': ['Ōita'],
  'Tosa': ['Kōchi'], 'Iyo e Sanuki': ['Ehime', 'Kagawa', 'Tokushima'],
  'Nagato e Suo': ['Yamaguchi'], 'Aki': ['Hiroshima'], 'Izumo e Iwami': ['Shimane'], 'Bizen e Mimasaka': ['Okayama', 'Tottori'], 'Harima': ['Hyōgo'],
  'Yamashiro e Ōmi': ['Kyōto', 'Shiga'], 'Settsu e Kii': ['Ōsaka', 'Nara', 'Wakayama'],
  'Owari e Ise': ['Mie', 'Aichi<'], 'Mino': ['Gifu'], 'Mikawa e Tōtōmi': ['Aichi>', 'Shizuoka<'], 'Suruga': ['Shizuoka>'],
  'Kai': ['Yamanashi'], 'Shinano': ['Nagano'], 'Echizen': ['Fukui'], 'Kaga e Etchu': ['Ishikawa', 'Toyama'], 'Echigo': ['Niigata'],
  'Sagami e Musashi': ['Kanagawa', 'Tokyo', 'Saitama'], 'Kazusa e Awa': ['Chiba'], 'Hitachi e Shimotsuke': ['Ibaraki', 'Tochigi', 'Gunma'],
  'Aizu e Dewa': ['Yamagata', 'Fukushima'], 'Mutsu Sul': ['Miyagi', 'Iwate'], 'Oshu Norte': ['Akita', 'Aomori'], 'Ezo': ['Hokkaidō'],
};
// divisas históricas aproximadas que cortam províncias atuais (lon, lat, de norte para sul); "<" = lado oeste, ">" = lado leste
const CUT = {
  Aichi: [[137.16, 35.45], [137.09, 35.22], [137.03, 35.04], [136.99, 34.86], [136.97, 34.6]], // Owari | Mikawa (rio Sakai, baía de Mikawa)
  Shizuoka: [[138.2, 35.5], [138.16, 35.2], [138.14, 34.95], [138.2, 34.6]], // Tōtōmi | Suruga (rio Ōi)
};
// sinuosidade: deslocamento do ponto médio, determinístico
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function wiggle(line, depth = 5, amp = .035) {
  let L = line;
  for (let d = 0; d < depth; d++) {
    const o = [L[0]];
    for (let i = 1; i < L.length; i++) { const [ax, ay] = L[i - 1], [bx, by] = L[i], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy), k = (rnd() - .5) * amp * Math.pow(.6, d) * 2; o.push([(ax + bx) / 2 - dy / len * k * len * 4, (ay + by) / 2 + dx / len * k * len * 4], L[i]); }
    L = o;
  }
  return L;
}
const westOf = line => { const l = wiggle(line); return [[...l, [l[l.length - 1][0] - 5, l[l.length - 1][1] - 3], [l[0][0] - 5, l[0][1] + 3], l[0]]]; };
const geoOf = n => { const f = pref.find(p => p.properties.name === n); if (!f) throw new Error('província não encontrada: ' + n); return f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates; };
// descarta ilhas distantes (Ogasawara, Izu do sul) que sairiam do enquadramento
const near = poly => poly[0].every(([x, y]) => y > 33.0 || x < 136.5);
function piece(spec) {
  const side = spec.slice(-1), name = '<>'.includes(side) ? spec.slice(0, -1) : spec, g = geoOf(name).filter(near);
  if (!'<>'.includes(side)) return g;
  const w = westOf(CUT[name]);
  return side === '<' ? pc.intersection(g, w) : pc.difference(g, w);
}
const thin = r => { const o = [r[0]]; for (const p of r) { const q = o[o.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) > .9) o.push(p); } return o; };
function ringsOf(geo) { const rings = []; let cur = null; path.context({ moveTo(x, y) { cur = [[x, y]]; rings.push(cur); }, lineTo(x, y) { cur.push([x, y]); }, closePath() { }, arc() { } })(geo); return rings.filter(r => r.length > 2); }
const area = r => { let a = 0; for (let i = 0; i < r.length; i++) { const [x0, y0] = r[i], [x1, y1] = r[(i + 1) % r.length]; a += x0 * y1 - x1 * y0; } return a / 2; };
function inside(rings, x, y) { let c = false; for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
function segDist(px, py, [ax, ay], [bx, by]) { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy; let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - ax - t * dx, py - ay - t * dy); }
function label(rings) {
  const big = rings.slice().sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)))[0];
  let [x0, y0, x1, y1] = [1e9, 1e9, -1e9, -1e9]; big.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
  let best = null, bd = -1; const N = 30;
  for (let i = 1; i < N; i++) for (let j = 1; j < N; j++) { const x = x0 + (x1 - x0) * i / N, y = y0 + (y1 - y0) * j / N; if (!inside([big], x, y)) continue; let d = 1e9; for (const r of rings) for (let k = 0; k < r.length; k++) d = Math.min(d, segDist(x, y, r[k], r[(k + 1) % r.length])); if (d > bd) { bd = d; best = [x, y]; } }
  return best || big[0];
}
const dstr = rings => rings.filter(r => Math.abs(area(r)) > 0.6).map(r => 'M' + r.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z').join('');
function adjacency(all, tol) {
  const grid = new Map(), key = (x, y) => Math.round(x / tol) + ',' + Math.round(y / tol);
  all.forEach((rings, i) => rings.forEach(r => r.forEach(([x, y]) => { const k = key(x, y); if (!grid.has(k)) grid.set(k, new Set()); grid.get(k).add(i); })));
  const adj = new Set();
  for (const [k, s] of grid) { const [gx, gy] = k.split(',').map(Number), nb = new Set(s); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const o = grid.get((gx + dx) + ',' + (gy + dy)); if (o) o.forEach(v => nb.add(v)); } for (const a of s) for (const b of nb) if (a !== b) adj.add(Math.min(a, b) + '-' + Math.max(a, b)); }
  return [...adj].map(s => s.split('-').map(Number));
}

const all = m.terr.map(t => {
  const parts = G[t.n]; if (!parts) throw new Error('sem grupo: ' + t.n);
  const u = pc.union(...parts.map(piece));
  return ringsOf({ type: 'MultiPolygon', coordinates: wind(u) }).map(thin);
});
m.terr.forEach((t, i) => { t.d = dstr(all[i]); const [x, y] = label(all[i]); t.x = +x.toFixed(1); t.y = +y.toFixed(1); });
const adj = adjacency(all, 1.5);
for (const [a, b] of m.sea) if (!adj.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) adj.push([a, b]);
m.adj = adj;
m.credit = 'Fronteiras: Natural Earth (domínio público), províncias atuais agrupadas nas províncias do período Sengoku.';
fs.writeFileSync(MAPS, JSON.stringify(M) + '\n');
console.log('japao:', m.terr.length, 'territórios,', adj.length, 'vizinhanças');
