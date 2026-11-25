// Refaz os territórios de um mapa com divisas reais: cada território vira a soma de divisões administrativas
// de primeiro nível (Natural Earth admin-1 1:10m, domínio público). Uma divisão entra no território se o seu
// centro cai no país e, quando há, numa das caixas lon/lat da definição (as mesmas do maps-build.mjs).
// Mantém nomes, ordem, regiões e travessias por mar; recalcula desenho, rótulos, vizinhanças e terra de fundo.
// Uso: node real.mjs <mapa> <ne_10m_admin_1_states_provinces.geojson> <maps.json>
import * as d3 from 'd3-geo';
import pc from 'polygon-clipping';
import fs from 'fs';
import { MED, NOR, AME } from './defs-real.mjs';

const [, , ID, ADM1, MAPS] = process.argv;
const B = (a, b, c, d) => [a, b, c, d];
// ---- definições (cópia das de maps-build.mjs: nome, região, partes) ----
const EU1805 = [
  ['França', 'Oeste', { c: ['France'], b: [B(-6, 10, 41, 52)] }],
  ['Países Baixos', 'Oeste', { c: ['Netherlands', 'Belgium', 'Luxembourg'] }],
  ['Espanha', 'Ibéria', 'Spain'], ['Portugal', 'Ibéria', 'Portugal'],
  ['Grã-Bretanha', 'Ilhas', 'United Kingdom'], ['Irlanda', 'Ilhas', 'Ireland'],
  ['Suíça', 'Europa Central', 'Switzerland'],
  ['Renânia', 'Europa Central', { c: ['Germany'], b: [B(5, 10, 47, 55)] }],
  ['Baviera e Saxônia', 'Europa Central', { c: ['Germany'], b: [B(10, 16, 47, 51)] }],
  ['Prússia', 'Europa Central', { c: ['Germany'], b: [B(10, 16, 51, 56)] }],
  ['Áustria', 'Europa Central', { c: ['Austria', 'Slovenia'] }], ['Boêmia', 'Europa Central', 'Czechia'], ['Hungria', 'Europa Central', { c: ['Hungary', 'Slovakia'] }],
  ['Itália do Norte', 'Itália', { c: ['Italy'], b: [B(6, 19, 43.6, 48)] }], ['Nápoles', 'Itália', { c: ['Italy'], b: [B(6, 19, 35, 43.6)] }],
  ['Polônia', 'Leste', 'Poland'], ['Prússia Oriental', 'Leste', { c: ['Lithuania'] }, { c: ['Russia'], b: [B(19, 23, 54, 56)] }],
  ['Bálticos', 'Leste', { c: ['Estonia', 'Latvia'] }], ['Bielorrússia', 'Leste', 'Belarus'], ['Ucrânia', 'Leste', { c: ['Ukraine', 'Moldova'] }],
  ['São Petersburgo', 'Leste', { c: ['Russia'], b: [B(27, 48, 57, 70)] }], ['Moscou', 'Leste', { c: ['Russia'], b: [B(27, 48, 51.5, 57)] }], ['Rússia Meridional', 'Leste', { c: ['Russia'], b: [B(33, 48, 40, 51.5)] }],
  ['Dinamarca', 'Norte', 'Denmark'], ['Noruega', 'Norte', 'Norway'], ['Suécia', 'Norte', 'Sweden'], ['Finlândia', 'Norte', 'Finland'],
  ['Croácia', 'Bálcãs', 'Croatia'], ['Bósnia e Sérvia', 'Bálcãs', { c: ['Bosnia and Herz.', 'Serbia', 'Montenegro', 'Kosovo'] }], ['Grécia e Albânia', 'Bálcãs', { c: ['Greece', 'Albania', 'Macedonia'] }],
  ['Bulgária', 'Bálcãs', 'Bulgaria'], ['Valáquia', 'Bálcãs', 'Romania'], ['Constantinopla', 'Bálcãs', { c: ['Turkey'], b: [B(25, 33, 35, 43)] }], ['Anatólia', 'Bálcãs', { c: ['Turkey'], b: [B(33, 45, 35, 43)] }],
  ['Marrocos', 'Norte da África', 'Morocco'], ['Argel e Túnis', 'Norte da África', { c: ['Algeria', 'Tunisia'] }],
];
const EU1914 = [
  ['França Norte', 'Frente Ocidental', { c: ['France'], b: [B(-6, 10, 46.5, 52)] }], ['França Sul', 'Frente Ocidental', { c: ['France'], b: [B(-6, 10, 41, 46.5)] }],
  ['Bélgica', 'Frente Ocidental', { c: ['Belgium', 'Luxembourg'] }], ['Holanda', 'Frente Ocidental', 'Netherlands'],
  ['Reino Unido', 'Ilhas', 'United Kingdom'], ['Irlanda', 'Ilhas', 'Ireland'],
  ['Renânia', 'Alemanha', { c: ['Germany'], b: [B(5, 10.5, 47, 55)] }], ['Berlim', 'Alemanha', { c: ['Germany'], b: [B(10.5, 16, 51, 56)] }], ['Saxônia e Baviera', 'Alemanha', { c: ['Germany'], b: [B(10.5, 16, 47, 51)] }],
  ['Prússia Oriental', 'Alemanha', { c: ['Russia'], b: [B(19, 23, 54, 56)] }, { c: ['Poland'], b: [B(14, 24, 53.3, 55)] }],
  ['Polônia', 'Frente Oriental', { c: ['Poland'], b: [B(14, 25, 49, 53.3)] }], ['Bálticos', 'Frente Oriental', { c: ['Lithuania', 'Latvia', 'Estonia'] }], ['Bielorrússia', 'Frente Oriental', 'Belarus'],
  ['Escandinávia', 'Neutros do Norte', { c: ['Norway', 'Sweden', 'Denmark'] }], ['Finlândia', 'Rússia', 'Finland'],
  ['Suíça', 'Ibéria e Alpes', 'Switzerland'], ['Espanha', 'Ibéria e Alpes', 'Spain'], ['Portugal', 'Ibéria e Alpes', 'Portugal'],
  ['Áustria', 'Áustria-Hungria', { c: ['Austria', 'Slovenia'] }], ['Boêmia', 'Áustria-Hungria', 'Czechia'], ['Hungria', 'Áustria-Hungria', { c: ['Hungary', 'Slovakia'] }],
  ['Galícia', 'Áustria-Hungria', { c: ['Ukraine'], b: [B(22, 26.5, 47, 52)] }], ['Croácia e Bósnia', 'Áustria-Hungria', { c: ['Croatia', 'Bosnia and Herz.'] }],
  ['Sérvia', 'Bálcãs', { c: ['Serbia', 'Montenegro', 'Kosovo', 'Macedonia'] }], ['Albânia', 'Bálcãs', 'Albania'], ['Grécia', 'Bálcãs', 'Greece'], ['Bulgária', 'Bálcãs', 'Bulgaria'], ['Romênia', 'Bálcãs', { c: ['Romania', 'Moldova'] }],
  ['Itália Norte', 'Itália', { c: ['Italy'], b: [B(6, 19, 43.6, 48)] }], ['Itália Sul', 'Itália', { c: ['Italy'], b: [B(6, 19, 35, 43.6)] }],
  ['Ucrânia', 'Rússia', { c: ['Ukraine'], b: [B(26.5, 41, 44, 53)] }], ['Petrogrado', 'Rússia', { c: ['Russia'], b: [B(27, 52, 57, 70)] }], ['Moscou', 'Rússia', { c: ['Russia'], b: [B(27, 52, 51.5, 57)] }],
  ['Rússia Meridional', 'Rússia', { c: ['Russia'], b: [B(36, 52, 40, 51.5)] }], ['Cáucaso', 'Rússia', { c: ['Georgia', 'Armenia', 'Azerbaijan'] }],
  ['Constantinopla', 'Império Otomano', { c: ['Turkey'], b: [B(25, 32, 35, 43)] }], ['Anatólia', 'Império Otomano', { c: ['Turkey'], b: [B(32, 45, 35, 43)] }],
  ['Síria', 'Império Otomano', { c: ['Syria', 'Lebanon'] }], ['Palestina', 'Império Otomano', { c: ['Israel', 'Palestine', 'Jordan'] }], ['Mesopotâmia', 'Império Otomano', { c: ['Iraq', 'Kuwait'] }],
  ['Arábia', 'Império Otomano', 'Saudi Arabia'], ['Pérsia', 'Império Otomano', 'Iran'],
  ['Egito', 'Norte da África', 'Egypt'], ['Líbia', 'Norte da África', 'Libya'], ['Argélia e Tunísia', 'Norte da África', { c: ['Algeria', 'Tunisia'] }], ['Marrocos', 'Norte da África', 'Morocco'],
];
// quadro lon/lat de cada mapa (o mesmo do euProj em maps-build.mjs), definições e passo da grade de simplificação
const CFG = { europa1805: { f: [-11, 43, 33, 63], defs: EU1805, g: .8, e: .5 }, europa1914: { f: [-11, 52, 22, 63], defs: EU1914, g: .8, e: .5 },
  mediterraneo: { f: [-10, 58, 25, 55], defs: MED, g: .8, e: .5 }, nordico: { f: [-25, 45, 45, 70], defs: NOR, g: .8, e: .5 },
  americas: { f: [-118, -34.5, -44, 33], defs: AME, g: .8, e: .5, merc: 1 } };
const ALIAS = { 'Czechia': 'Czech Republic', 'Bosnia and Herz.': 'Bosnia and Herzegovina', 'Serbia': 'Republic of Serbia', 'N. Cyprus': 'Northern Cyprus', 'Faeroe Is.': 'Faroe Islands', 'Dominican Rep.': 'Dominican Republic', 'Bahamas': 'The Bahamas' };

const C = CFG[ID]; if (!C) throw new Error('mapa sem configuração: ' + ID);
const M = JSON.parse(fs.readFileSync(MAPS, 'utf8')), m = M[ID], W = m.w, H = m.h;
const [lon0, lon1, lat0, lat1] = C.f;
function densify(ring) { const o = []; for (let i = 0; i < ring.length - 1; i++) { const A = ring[i], Bp = ring[i + 1], n = Math.max(1, Math.ceil(Math.max(Math.abs(Bp[0] - A[0]), Math.abs(Bp[1] - A[1])))); for (let k = 0; k < n; k++) o.push([A[0] + (Bp[0] - A[0]) * k / n, A[1] + (Bp[1] - A[1]) * k / n]); } o.push(ring[ring.length - 1]); return o; }
const proj = (C.merc ? d3.geoMercator() : d3.geoConicConformal().rotate([-(lon0 + lon1) / 2, 0]).parallels([40, 60]))
  .fitExtent([[4, 4], [W - 4, H - 4]], { type: 'Polygon', coordinates: [densify([[lon0, lat0], [lon0, lat1], [lon1, lat1], [lon1, lat0], [lon0, lat0]])] }).clipExtent([[0, 0], [W, H]]);
const path = d3.geoPath(proj);

// ---- divisões administrativas ----
const A1 = JSON.parse(fs.readFileSync(ADM1, 'utf8')).features;
const inBox = ([x, y], [a, b, c, d]) => x >= a && x <= b && y >= c && y <= d;
const polys = f => f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
const own = new Map(), hit = new Set(); // feature -> território; países que acharam divisões
C.defs.forEach(([n, , ...parts], ti) => {
  const i = m.terr.findIndex(t => t.n === n); if (i < 0) throw new Error('território não está no mapa: ' + n);
  for (const p of parts.map(p => typeof p === 'string' ? { c: [p] } : p)) {
    const cs = p.c.map(c => ALIAS[c] || c);
    for (const f of A1) {
      if (own.has(f) || !cs.includes(f.properties.admin)) continue;
      const ctr = [f.properties.longitude, f.properties.latitude];
      const q = proj(ctr); if (!q || q[0] < 0 || q[0] > W || q[1] < 0 || q[1] > H) continue; // centro dentro do desenho do mapa
      if (p.b && !p.b.some(b => inBox(ctr, b))) continue;
      own.set(f, i); hit.add(f.properties.admin);
    }
  }
});
// divisões de um país do mapa que nenhuma caixa pegou (ex.: Rondônia entre duas caixas) vão para o território
// desse país cuja caixa está mais perto do centro delas
{
  const boxD = ([x, y], [a, b, c, d]) => Math.hypot(Math.max(a - x, 0, x - b), Math.max(c - y, 0, y - d));
  const opts = []; C.defs.forEach(([n, , ...parts]) => { const i = m.terr.findIndex(t => t.n === n); parts.map(p => typeof p === 'string' ? { c: [p] } : p).forEach(p => p.c.forEach(c => opts.push({ c: ALIAS[c] || c, i, b: p.b }))); });
  for (const f of A1) {
    if (own.has(f)) continue;
    const ctr = [f.properties.longitude, f.properties.latitude], q = proj(ctr); if (!q || q[0] < 0 || q[0] > W || q[1] < 0 || q[1] > H) continue;
    let best = null, bd = 1.5; // até 1,5° da caixa
    for (const o of opts) if (o.c === f.properties.admin) { const d = o.b ? Math.min(...o.b.map(b => boxD(ctr, b))) : 0; if (d < bd) { bd = d; best = o.i; } }
    if (best != null) own.set(f, best);
  }
}
C.defs.forEach(([n, , ...parts]) => parts.forEach(p => (typeof p === 'string' ? [p] : p.c).forEach(c => { if (!hit.has(ALIAS[c] || c)) console.log('aviso: sem divisões para', c, 'em', n); })));
// grade: vizinhos que dividem a divisa caem nos mesmos pontos (sem frestas)
const thin = r => { const o = []; for (const p of r) { const s = [Math.round(p[0] / C.g) * C.g, Math.round(p[1] / C.g) * C.g], q = o[o.length - 1]; if (!q || q[0] !== s[0] || q[1] !== s[1]) o.push(s); } return o; };
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
const dstr = rings => rings.filter(r => r.length > 2 && Math.abs(area(r)) > 0.5).map(r => 'M' + r.map(p => +p[0].toFixed(1) + ' ' + +p[1].toFixed(1)).join(' ') + 'Z').join('');
function adjacency(all, tol) {
  const grid = new Map(), key = (x, y) => Math.round(x / tol) + ',' + Math.round(y / tol);
  all.forEach((rings, i) => rings.forEach(r => r.forEach(([x, y]) => { const k = key(x, y); if (!grid.has(k)) grid.set(k, new Set()); grid.get(k).add(i); })));
  const adj = new Set();
  for (const [k, s] of grid) { const [gx, gy] = k.split(',').map(Number), nb = new Set(s); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const o = grid.get((gx + dx) + ',' + (gy + dy)); if (o) o.forEach(v => nb.add(v)); } for (const a of s) for (const b of nb) if (a !== b) adj.add(Math.min(a, b) + '-' + Math.max(a, b)); }
  return [...adj].map(s => s.split('-').map(Number));
}
// projeta, simplifica e junta (a união é feita já no plano, com a grade, então divisas internas somem)
// cada anel projetado vira um polígono (buracos de divisões são raros e são preenchidos pela vizinha)
const wind = p => d3.geoArea({ type: 'Polygon', coordinates: p }) > 2 * Math.PI ? p.map(r => r.slice().reverse()) : p;
const flat = f => ringsOf({ type: 'MultiPolygon', coordinates: polys(f).map(wind) }).map(thin).filter(r => r.length > 2).map(r => [r]);
const unite = fs => { let acc = []; for (let k = 0; k < fs.length; k += 40) acc = pc.union(acc, ...fs.slice(k, k + 40).flatMap(flat).map(p => [p])); return acc; };
const fixRing = r => r.slice(0, -1);
const all = m.terr.map((t, i) => {
  const fs_ = [...own].filter(([, j]) => j === i).map(([f]) => f);
  if (!fs_.length) throw new Error('território vazio: ' + t.n);
  return unite(fs_).flatMap(p => p.map(fixRing));
});
// simplificação que respeita a topologia: um vértice é fixo onde muda o conjunto de territórios que o usam
// (pontas de divisa); entre dois fixos, Douglas-Peucker. Os dois lados de uma divisa simplificam igual.
const rdp = (P, e) => { if (P.length < 3) return P; let md = 0, mi = 0; const [ax, ay] = P[0], [bx, by] = P[P.length - 1], L = Math.hypot(bx - ax, by - ay); for (let i = 1; i < P.length - 1; i++) { const d = L ? Math.abs((bx - ax) * (ay - P[i][1]) - (ax - P[i][0]) * (by - ay)) / L : Math.hypot(P[i][0] - ax, P[i][1] - ay); if (d > md) { md = d; mi = i; } } return md > e ? [...rdp(P.slice(0, mi + 1), e).slice(0, -1), ...rdp(P.slice(mi), e)] : [P[0], P[P.length - 1]]; };
function topoSimplify(sets, e) {
  const use = new Map(), k = p => p[0] + ',' + p[1];
  sets.forEach((rings, i) => rings.forEach(r => r.forEach(p => { const s = use.get(k(p)) || new Set(); s.add(i); use.set(k(p), s); })));
  const sig = p => [...use.get(k(p))].sort().join();
  return sets.map(rings => rings.map(r => {
    const n = r.length, fix = new Set();
    for (let j = 0; j < n; j++) if (sig(r[j]) !== sig(r[(j + n - 1) % n])) { fix.add(j); fix.add((j + n - 1) % n); }
    if (fix.size < 2) { let far = 0, fd = -1; r.forEach((p, j) => { const d = Math.hypot(p[0] - r[0][0], p[1] - r[0][1]); if (d > fd) { fd = d; far = j; } }); fix.add(0); fix.add(far); }
    const F = [...fix].sort((a, b) => a - b), out = [];
    F.forEach((a, t) => { const b = F[(t + 1) % F.length], seg = []; for (let j = a; ; j = (j + 1) % n) { seg.push(r[j]); if (j === b) break; } out.push(...rdp(seg, e).slice(0, -1)); });
    return out;
  }).filter(r => r.length > 2));
}
all.splice(0, all.length, ...topoSimplify(all, C.e || .3));
m.terr.forEach((t, i) => { t.d = dstr(all[i]); const [x, y] = label(all[i]); t.x = +x.toFixed(1); t.y = +y.toFixed(1); });
const adj = adjacency(all, 1.5);
for (const [a, b] of m.sea) if (!adj.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) adj.push([a, b]);
m.adj = adj;
// terra de fundo: divisões fora do jogo perto do quadro, unidas por país
const near = f => { const ctr = [f.properties.longitude, f.properties.latitude], q = inBox(ctr, [lon0 - 40, lon1 + 40, lat0 - 25, lat1 + 20]) && proj(ctr); return q && q[0] > -W * .3 && q[0] < W * 1.3 && q[1] > -H * .3 && q[1] < H * 1.3; };
const rest = A1.filter(f => !own.has(f) && near(f)), byC = {};
rest.forEach(f => (byC[f.properties.admin] = byC[f.properties.admin] || []).push(f));
m.bg = topoSimplify(Object.values(byC).map(fs_ => unite(fs_).flatMap(p => p.map(fixRing))), (C.e || .3) * 2).map(dstr).join('');
m.credit = 'Fronteiras: Natural Earth admin-1 1:10m (domínio público), divisões atuais agrupadas nos territórios do cenário.';
fs.writeFileSync(MAPS, JSON.stringify(M) + '\n');
console.log(ID + ':', m.terr.length, 'territórios,', adj.length, 'vizinhanças,', (JSON.stringify(m).length / 1024).toFixed(0) + 'KB');
