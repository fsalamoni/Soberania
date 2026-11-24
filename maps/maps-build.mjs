// Gera maps.json: territórios projetados (path SVG), ponto de rótulo, regiões e vizinhanças.
// Fontes: Natural Earth via world-atlas (domínio público), us-atlas (domínio público), @svg-maps/brazil (CC-BY-4.0).
import * as d3 from 'd3-geo';
import * as topo from 'topojson-client';
import fs from 'fs';

const W = 1000, H = 620;
const world = JSON.parse(fs.readFileSync('world-atlas-2.0.2/package/countries-110m.json'));
const us = JSON.parse(fs.readFileSync('us-atlas-3.0.1/package/states-albers-10m.json'));
const byName = {}; world.objects.countries.geometries.forEach(g => byName[g.properties.name] = g);
const world50 = JSON.parse(fs.readFileSync('world-atlas-2.0.2/package/countries-50m.json'));
const byName50 = {}; world50.objects.countries.geometries.forEach(g => byName50[g.properties.name] = g);
// descarta vértices a menos de 0,9 unidade do anterior (mapas 50m ficam leves)
const thin = r => { const o = [r[0]]; for (const p of r) { const q = o[o.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) > .9) o.push(p); } return o; };
const usByName = {}; us.objects.states.geometries.forEach(g => usByName[g.properties.name] = g);

const B = (a, b, c, d) => [a, b, c, d];
// ---------- recorte geográfico por caixas lon/lat ----------
function clipHalf(ring, f) { // mantém f(p) <= 0, f linear
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const A = ring[i], Bp = ring[(i + 1) % ring.length], da = f(A), db = f(Bp);
    if (da <= 0) out.push(A);
    if ((da <= 0) !== (db <= 0)) { const t = da / (da - db); out.push([A[0] + (Bp[0] - A[0]) * t, A[1] + (Bp[1] - A[1]) * t]); }
  }
  return out;
}
function clipBox(ring, [x0, x1, y0, y1]) {
  let r = ring.slice(0, -1).map(p => p.slice()); // anel GeoJSON é fechado
  for (let i = 1; i < r.length; i++) { // desfaz o salto no antimeridiano para o recorte plano
    const d = r[i][0] - r[i - 1][0];
    if (d > 180) r[i][0] -= 360; else if (d < -180) r[i][0] += 360;
  }
  r = clipHalf(r, p => x0 - p[0]); r = clipHalf(r, p => p[0] - x1);
  r = clipHalf(r, p => y0 - p[1]); r = clipHalf(r, p => p[1] - y1);
  if (r.length < 3) return null;
  return densify([...r, r[0]]);
}
function densify(ring) { // paralelos viram arcos de grande círculo sem isso
  const o = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const A = ring[i], Bp = ring[i + 1]; const n = Math.ceil(Math.max(Math.abs(Bp[0] - A[0]), Math.abs(Bp[1] - A[1])));
    for (let k = 0; k < Math.max(1, n); k++) o.push([A[0] + (Bp[0] - A[0]) * k / Math.max(1, n), A[1] + (Bp[1] - A[1]) * k / Math.max(1, n)]);
  }
  o.push(ring[ring.length - 1]); return o;
}
function geomFor(part, topology, lookup) { // part: string | {c:[names], b:[boxes]}
  const p = typeof part === 'string' ? { c: [part] } : part;
  const gs = p.c.map(n => { if (!lookup[n]) throw new Error('país não encontrado: ' + n); return lookup[n]; });
  const m = topo.merge(topology, gs);
  if (!p.b) return m.coordinates;
  const polys = [];
  for (const box of p.b) for (const poly of m.coordinates) {
    const ext = clipBox(poly[0], box); if (!ext) continue;
    const holes = poly.slice(1).map(h => clipBox(h, box)).filter(Boolean);
    polys.push([ext, ...holes]);
  }
  return polys;
}
// anel invertido vira o complemento do polígono na esfera: desinverte
const wind = polys => polys.map(p => d3.geoArea({ type: 'Polygon', coordinates: p }) > 2 * Math.PI ? p.map(r => r.slice().reverse()) : p);
// ---------- projeção para anéis planos ----------
function ringsOf(geo, path) {
  const rings = []; let cur = null;
  const ctx = { moveTo(x, y) { cur = [[x, y]]; rings.push(cur); }, lineTo(x, y) { cur.push([x, y]); }, closePath() { }, arc() { } };
  path.context(ctx)(geo); return rings.filter(r => r.length > 2);
}
const area = r => { let a = 0; for (let i = 0; i < r.length; i++) { const [x0, y0] = r[i], [x1, y1] = r[(i + 1) % r.length]; a += x0 * y1 - x1 * y0; } return a / 2; };
function inside(rings, x, y) { let c = false; for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
function segDist(px, py, [ax, ay], [bx, by]) { const dx = bx - ax, dy = by - ay; const l = dx * dx + dy * dy; let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - ax - t * dx, py - ay - t * dy); }
function label(rings) {
  const big = rings.slice().sort((a, b) => Math.abs(area(b)) - Math.abs(area(a)))[0];
  let [x0, y0, x1, y1] = [1e9, 1e9, -1e9, -1e9]; big.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
  let best = null, bd = -1; const N = 24;
  for (let i = 1; i < N; i++) for (let j = 1; j < N; j++) {
    const x = x0 + (x1 - x0) * i / N, y = y0 + (y1 - y0) * j / N; if (!inside([big], x, y)) continue;
    let d = 1e9; for (const r of rings) for (let k = 0; k < r.length; k++) d = Math.min(d, segDist(x, y, r[k], r[(k + 1) % r.length]));
    if (d > bd) { bd = d; best = [x, y]; }
  }
  if (!best) { const m = big.reduce((a, p) => [a[0] + p[0] / big.length, a[1] + p[1] / big.length], [0, 0]); best = m; }
  return best;
}
const dstr = rings => rings.filter(r => Math.abs(area(r)) > 0.6).map(r => 'M' + r.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z').join('');
function adjacency(all, tol = 1.2) {
  const grid = new Map(); const key = (x, y) => Math.round(x / tol) + ',' + Math.round(y / tol);
  all.forEach((rings, i) => rings.forEach(r => r.forEach(([x, y]) => { const k = key(x, y); if (!grid.has(k)) grid.set(k, new Set()); grid.get(k).add(i); })));
  const adj = new Set();
  for (const [k, s] of grid) {
    const [gx, gy] = k.split(',').map(Number);
    const near = new Set(s);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const o = grid.get((gx + dx) + ',' + (gy + dy)); if (o) o.forEach(v => near.add(v)); }
    const arr = [...near]; for (const a of s) for (const b of arr) if (a !== b) adj.add(Math.min(a, b) + '-' + Math.max(a, b));
  }
  return [...adj].map(s => s.split('-').map(Number));
}
function finish(id, defs, allRings, bgD, opts = {}) {
  const names = defs.map(d => d[0]);
  const regions = [...new Set(defs.map(d => d[1]))];
  const adj = adjacency(allRings, opts.tol);
  const idx = n => { const i = names.indexOf(n); if (i < 0) throw new Error(id + ': território desconhecido ' + n); return i; };
  const sea = (opts.sea || []).map(([a, b, w]) => [idx(a), idx(b), w ? 1 : 0]);
  sea.forEach(([a, b]) => { if (!adj.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) adj.push([a, b]); });
  const terr = defs.map((d, i) => { const [x, y] = label(allRings[i]); return { n: d[0], r: regions.indexOf(d[1]), d: dstr(allRings[i]), x: +x.toFixed(1), y: +y.toFixed(1) }; });
  const lonely = terr.map((t, i) => i).filter(i => !adj.some(([a, b]) => a === i || b === i));
  if (lonely.length) console.warn(id, 'sem vizinhos:', lonely.map(i => names[i]));
  return { w: W, h: H, bg: bgD, regions, terr, adj, sea: sea.map(s => s) , credit: opts.credit };
}
function geoMap(id, defs, projection, opts) {
  const path = d3.geoPath(projection);
  const T = opts.hi ? world50 : world, L = opts.hi ? byName50 : byName;
  const all = defs.map(d => ringsOf({ type: 'MultiPolygon', coordinates: wind(d.slice(2).flatMap(p => geomFor(p, T, L))) }, path).map(r => opts.hi ? thin(r) : r));
  const used = new Set(defs.flatMap(d => d.slice(2).flatMap(p => typeof p === 'string' ? [p] : p.b ? [] : p.c)));
  const bgGeo = topo.merge(T, T.objects.countries.geometries.filter(g => g.properties.name !== 'Antarctica' && !used.has(g.properties.name)));
  return finish(id, defs, all, dstr(ringsOf({ type: "MultiPolygon", coordinates: wind(bgGeo.coordinates) }, path).map(r => opts.hi ? thin(r) : r)), { ...opts, credit: 'Fronteiras: Natural Earth (domínio público), aproximadas por fronteiras atuais.' });
}

// ============ MUNDO (1939 e 1962) ============
const WORLD = [
  ['Alasca', 'América do Norte', { c: ['United States of America'], b: [B(-168.5, -129, 50, 75)] }],
  ['Canadá Oeste', 'América do Norte', { c: ['Canada'], b: [B(-142, -100, 40, 85)] }],
  ['Canadá Leste', 'América do Norte', { c: ['Canada'], b: [B(-100, -50, 40, 85)] }],
  ['Groenlândia', 'América do Norte', 'Greenland'],
  ['EUA Oeste', 'América do Norte', { c: ['United States of America'], b: [B(-125, -100, 24, 50)] }],
  ['EUA Leste', 'América do Norte', { c: ['United States of America'], b: [B(-100, -66, 24, 50)] }],
  ['México', 'América do Norte', 'Mexico'],
  ['América Central', 'América do Norte', { c: ['Guatemala', 'Belize', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama'] }],
  ['Cuba', 'América do Norte', 'Cuba'],
  ['Antilhas', 'América do Norte', { c: ['Jamaica', 'Haiti', 'Dominican Rep.', 'Puerto Rico', 'Bahamas', 'Trinidad and Tobago'] }],
  ['Norte Andino', 'América do Sul', { c: ['Colombia', 'Venezuela', 'Ecuador', 'Guyana', 'Suriname'] }],
  ['Peru e Bolívia', 'América do Sul', { c: ['Peru', 'Bolivia'] }],
  ['Brasil Norte', 'América do Sul', { c: ['Brazil'], b: [B(-75, -30, -10, 6)] }],
  ['Brasil Sul', 'América do Sul', { c: ['Brazil'], b: [B(-75, -30, -35, -10)] }],
  ['Prata', 'América do Sul', { c: ['Argentina', 'Uruguay', 'Paraguay', 'Falkland Is.'] }],
  ['Chile', 'América do Sul', 'Chile'],
  ['Ilhas Britânicas', 'Europa Ocidental', { c: ['United Kingdom', 'Ireland'] }],
  ['França', 'Europa Ocidental', { c: ['France'], b: [B(-6, 10, 41, 52)] }],
  ['Ibéria', 'Europa Ocidental', { c: ['Spain', 'Portugal'] }],
  ['Benelux', 'Europa Ocidental', { c: ['Belgium', 'Netherlands', 'Luxembourg'] }],
  ['Alemanha', 'Europa Ocidental', 'Germany'],
  ['Itália', 'Europa Ocidental', 'Italy'],
  ['Escandinávia', 'Europa Ocidental', { c: ['Norway', 'Sweden', 'Denmark', 'Iceland'] }],
  ['Europa Central', 'Europa Ocidental', { c: ['Austria', 'Switzerland', 'Czechia', 'Slovakia', 'Hungary'] }],
  ['Polônia', 'Europa Oriental', 'Poland'],
  ['Finlândia', 'Europa Oriental', 'Finland'],
  ['Bálticos', 'Europa Oriental', { c: ['Estonia', 'Latvia', 'Lithuania'] }, { c: ['Russia'], b: [B(19, 23, 54, 56)] }],
  ['Bálcãs', 'Europa Oriental', { c: ['Slovenia', 'Croatia', 'Bosnia and Herz.', 'Serbia', 'Montenegro', 'Kosovo', 'Macedonia', 'Albania'] }],
  ['Grécia', 'Europa Oriental', 'Greece'],
  ['Romênia e Bulgária', 'Europa Oriental', { c: ['Romania', 'Bulgaria', 'Moldova'] }],
  ['Ucrânia', 'Europa Oriental', { c: ['Ukraine', 'Belarus'] }],
  ['Rússia', 'Europa Oriental', { c: ['Russia'], b: [B(27, 45, 40, 90)] }],
  ['Urais', 'Ásia do Norte', { c: ['Russia'], b: [B(45, 65, 40, 90)] }],
  ['Cáucaso', 'Oriente Médio', { c: ['Georgia', 'Armenia', 'Azerbaijan'] }],
  ['Sibéria', 'Ásia do Norte', { c: ['Russia'], b: [B(65, 105, 40, 90)] }],
  ['Extremo Oriente', 'Ásia do Norte', { c: ['Russia'], b: [B(105, 168.5, 40, 90)] }],
  ['Ásia Central', 'Ásia do Norte', { c: ['Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan'] }],
  ['Mongólia', 'Ásia do Norte', 'Mongolia'],
  ['Turquia', 'Oriente Médio', 'Turkey'],
  ['Levante', 'Oriente Médio', { c: ['Syria', 'Lebanon', 'Israel', 'Palestine', 'Jordan', 'Cyprus', 'N. Cyprus'] }],
  ['Iraque', 'Oriente Médio', { c: ['Iraq', 'Kuwait'] }],
  ['Irã', 'Oriente Médio', 'Iran'],
  ['Arábia', 'Oriente Médio', { c: ['Saudi Arabia', 'Yemen', 'Oman', 'United Arab Emirates', 'Qatar'] }],
  ['Afeganistão', 'Oriente Médio', 'Afghanistan'],
  ['Egito', 'África', 'Egypt'],
  ['Líbia', 'África', 'Libya'],
  ['Magrebe', 'África', { c: ['Morocco', 'Algeria', 'Tunisia', 'W. Sahara'] }],
  ['Sahel', 'África', { c: ['Mauritania', 'Mali', 'Niger', 'Chad', 'Burkina Faso'] }],
  ['África Ocidental', 'África', { c: ['Senegal', 'Gambia', 'Guinea', 'Guinea-Bissau', 'Sierra Leone', 'Liberia', "Côte d'Ivoire", 'Ghana', 'Togo', 'Benin', 'Nigeria'] }],
  ['Sudão', 'África', { c: ['Sudan', 'S. Sudan'] }],
  ['Chifre da África', 'África', { c: ['Ethiopia', 'Eritrea', 'Djibouti', 'Somalia', 'Somaliland'] }],
  ['Congo', 'África', { c: ['Dem. Rep. Congo', 'Congo', 'Gabon', 'Eq. Guinea', 'Central African Rep.', 'Cameroon'] }],
  ['África Oriental', 'África', { c: ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi'] }],
  ['Angola', 'África', 'Angola'],
  ['Moçambique', 'África', { c: ['Mozambique', 'Malawi'] }],
  ['África Austral', 'África', { c: ['South Africa', 'Namibia', 'Botswana', 'Zimbabwe', 'Zambia', 'Lesotho', 'eSwatini'] }],
  ['Madagascar', 'África', 'Madagascar'],
  ['Índia', 'Ásia', { c: ['India', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan'] }],
  ['Paquistão', 'Ásia', 'Pakistan'],
  ['China Norte', 'Ásia', { c: ['China'], b: [B(73, 118, 32, 54), B(118, 135, 32, 40)] }],
  ['Manchúria', 'Ásia', { c: ['China'], b: [B(118, 135, 40, 54)] }],
  ['China Sul', 'Ásia', { c: ['China'], b: [B(73, 135, 15, 32)] }],
  ['Taiwan', 'Ásia', 'Taiwan'],
  ['Coreia do Norte', 'Ásia', 'North Korea'],
  ['Coreia do Sul', 'Ásia', 'South Korea'],
  ['Japão', 'Ásia', 'Japan'],
  ['Indochina', 'Ásia', { c: ['Vietnam', 'Laos', 'Cambodia'] }],
  ['Sião e Birmânia', 'Ásia', { c: ['Thailand', 'Myanmar'] }],
  ['Malásia', 'Oceania', { c: ['Malaysia', 'Brunei'] }],
  ['Filipinas', 'Oceania', 'Philippines'],
  ['Índias Orientais', 'Oceania', { c: ['Indonesia', 'Timor-Leste'] }],
  ['Nova Guiné', 'Oceania', { c: ['Papua New Guinea', 'Solomon Is.'] }],
  ['Austrália Oeste', 'Oceania', { c: ['Australia'], b: [B(110, 135, -45, -10)] }],
  ['Austrália Leste', 'Oceania', { c: ['Australia'], b: [B(135, 155, -45, -10)] }],
  ['Nova Zelândia', 'Oceania', 'New Zealand'],
];
const WORLD_SEA = [['Alasca', 'Extremo Oriente', 1], ['Groenlândia', 'Canadá Leste'], ['Groenlândia', 'Escandinávia'], ['Ilhas Britânicas', 'França'], ['Ilhas Britânicas', 'Benelux'], ['Ilhas Britânicas', 'Escandinávia'],
  ['Ibéria', 'Magrebe'], ['Itália', 'Líbia'], ['Itália', 'Magrebe'], ['EUA Leste', 'Ilhas Britânicas'], ['Brasil Norte', 'África Ocidental'], ['EUA Leste', 'Cuba'], ['Cuba', 'Antilhas'], ['Cuba', 'México'], ['Antilhas', 'Norte Andino'],
  ['Japão', 'Coreia do Sul'], ['Japão', 'Extremo Oriente'], ['Japão', 'Taiwan'], ['Taiwan', 'China Sul'], ['Taiwan', 'Filipinas'], ['Filipinas', 'Malásia'], ['Filipinas', 'Índias Orientais'], ['Malásia', 'Índias Orientais'],
  ['Índias Orientais', 'Austrália Oeste'], ['Nova Guiné', 'Austrália Leste'], ['Austrália Leste', 'Nova Zelândia'], ['Madagascar', 'Moçambique'], ['Arábia', 'Chifre da África'], ['Egito', 'Arábia'], ['Irã', 'Arábia'], ['Grécia', 'Egito'],
  ['EUA Oeste', 'Japão', 1], ['Escandinávia', 'Bálticos'], ['Índia', 'Sião e Birmânia']];
const out = {};
out.mundo = geoMap('mundo', WORLD, d3.geoNaturalEarth1().rotate([-11, 0]).fitExtent([[6, 6], [W - 6, H - 6]], { type: 'Sphere' }).clipExtent([[0, 0], [W, H]]), { sea: WORLD_SEA });
// recorta a Antártida ao centralizar: fitExtent da esfera mostra latitudes até -90; ajusta escala para cortar o polo sul
{
  const proj = d3.geoNaturalEarth1().rotate([-11, 0]).fitExtent([[0, 0], [W, H * 1.18]], { type: 'Sphere' }); proj.translate([proj.translate()[0], proj.translate()[1] - H * 0.02]).clipExtent([[0, 0], [W, H]]);
  out.mundo = geoMap('mundo', WORLD, proj, { sea: WORLD_SEA });
}

// ============ EUROPA 1805 ============
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
const euProj = (lon0, lon1, lat0, lat1) => d3.geoConicConformal().rotate([-(lon0 + lon1) / 2, 0]).parallels([40, 60])
  .fitExtent([[4, 4], [W - 4, H - 4]], { type: 'Polygon', coordinates: [densify([[lon0, lat0], [lon0, lat1], [lon1, lat1], [lon1, lat0], [lon0, lat0]])] }).clipExtent([[0, 0], [W, H]]);
out.europa1805 = geoMap('europa1805', EU1805, euProj(-11, 43, 33, 63), { sea: [['Grã-Bretanha', 'França'], ['Grã-Bretanha', 'Países Baixos'], ['Grã-Bretanha', 'Irlanda'], ['Grã-Bretanha', 'Noruega'], ['Grã-Bretanha', 'Portugal'], ['Grã-Bretanha', 'Dinamarca'], ['Dinamarca', 'Noruega'], ['Dinamarca', 'Suécia'], ['Suécia', 'Bálticos'], ['Espanha', 'Marrocos'], ['Espanha', 'Argel e Túnis'], ['Nápoles', 'Argel e Túnis'], ['Nápoles', 'Grécia e Albânia'], ['França', 'Nápoles'], ['Rússia Meridional', 'Anatólia'], ['Valáquia', 'Constantinopla']] });

// ============ EUROPA 1914 ============
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
out.europa1914 = geoMap('europa1914', EU1914, euProj(-11, 52, 22, 63), { sea: [['Reino Unido', 'França Norte'], ['Reino Unido', 'Bélgica'], ['Reino Unido', 'Holanda'], ['Reino Unido', 'Irlanda'], ['Reino Unido', 'Escandinávia'], ['Itália Sul', 'Líbia'], ['Itália Sul', 'Albânia'], ['França Sul', 'Argélia e Tunísia'], ['Espanha', 'Marrocos'], ['Rússia Meridional', 'Constantinopla'], ['Grécia', 'Egito'], ['Escandinávia', 'Bálticos'], ['Escandinávia', 'Berlim'], ['Arábia', 'Egito'], ['Reino Unido', 'Portugal']] });

// ============ EUA 1861 ============
{
  const D = [
    ['Nova Inglaterra', 'Nordeste', ['Maine', 'New Hampshire', 'Vermont', 'Massachusetts', 'Rhode Island', 'Connecticut']], ['Nova York', 'Nordeste', ['New York']], ['Pensilvânia', 'Nordeste', ['Pennsylvania', 'New Jersey']],
    ['Maryland', 'Estados de Fronteira', ['Maryland', 'Delaware', 'District of Columbia']], ['Virgínia Ocidental', 'Estados de Fronteira', ['West Virginia']], ['Kentucky', 'Estados de Fronteira', ['Kentucky']], ['Missouri', 'Estados de Fronteira', ['Missouri']],
    ['Ohio', 'Meio-Oeste', ['Ohio']], ['Indiana', 'Meio-Oeste', ['Indiana']], ['Illinois', 'Meio-Oeste', ['Illinois']], ['Michigan', 'Meio-Oeste', ['Michigan']], ['Wisconsin', 'Meio-Oeste', ['Wisconsin']], ['Minnesota', 'Meio-Oeste', ['Minnesota']], ['Iowa', 'Meio-Oeste', ['Iowa']],
    ['Virgínia', 'Sul Atlântico', ['Virginia']], ['Carolina do Norte', 'Sul Atlântico', ['North Carolina']], ['Carolina do Sul', 'Sul Atlântico', ['South Carolina']], ['Geórgia', 'Sul Atlântico', ['Georgia']], ['Flórida', 'Sul Atlântico', ['Florida']],
    ['Tennessee', 'Sul Profundo', ['Tennessee']], ['Alabama', 'Sul Profundo', ['Alabama']], ['Mississippi', 'Sul Profundo', ['Mississippi']],
    ['Luisiana', 'Trans-Mississippi', ['Louisiana']], ['Arkansas', 'Trans-Mississippi', ['Arkansas']], ['Texas', 'Trans-Mississippi', ['Texas']],
    ['Kansas', 'Oeste', ['Kansas']], ['Território Indígena', 'Oeste', ['Oklahoma']], ['Nebraska', 'Oeste', ['Nebraska']], ['Dakota', 'Oeste', ['North Dakota', 'South Dakota']], ['Colorado', 'Oeste', ['Colorado']], ['Novo México', 'Oeste', ['New Mexico', 'Arizona']],
    ['Território de Washington', 'Costa do Pacífico', ['Washington', 'Idaho', 'Montana', 'Wyoming']], ['Oregon', 'Costa do Pacífico', ['Oregon']], ['Califórnia', 'Costa do Pacífico', ['California']], ['Nevada e Utah', 'Costa do Pacífico', ['Nevada', 'Utah']],
  ];
  const lower = us.objects.states.geometries.filter(g => !['Alaska', 'Hawaii', 'Puerto Rico', 'American Samoa', 'Guam', 'Commonwealth of the Northern Mariana Islands', 'United States Virgin Islands'].includes(g.properties.name));
  const fc = topo.feature(us, { type: 'GeometryCollection', geometries: lower });
  const proj = d3.geoIdentity().fitExtent([[10, 10], [W - 10, H - 10]], fc);
  const path = d3.geoPath(proj);
  const all = D.map(d => ringsOf(topo.merge(us, d[2].map(n => { if (!usByName[n]) throw new Error(n); return usByName[n]; })), path));
  out.eua1861 = finish('eua1861', D, all, dstr(ringsOf(topo.merge(us, lower), path)), { credit: 'Fronteiras: us-atlas (domínio público), estados atuais como aproximação.', sea: [['Flórida', 'Luisiana'], ['Virgínia', 'Carolina do Sul']] });
}

// ============ BRASIL 1835 ============
{
  const src = fs.readFileSync('br/package/index.js', 'utf8').replace('export default', '');
  const br = JSON.parse(src);
  const rings = {};
  for (const L of br.locations) {
    const toks = L.path.match(/[mMzZlL]|-?[\d.]+(?:e-?\d+)?/g); const rs = []; let cur = null, cx = 0, cy = 0, sx = 0, sy = 0, cmd = null; let i = 0;
    while (i < toks.length) {
      const t = toks[i];
      if (/[mMzZlL]/.test(t)) { cmd = t; i++; if (cmd === 'z' || cmd === 'Z') { cx = sx; cy = sy; cur = null; } continue; }
      const x = +toks[i], y = +toks[i + 1]; i += 2;
      if (cmd === 'm' || cmd === 'M') { if (cmd === 'm') { cx += x; cy += y; } else { cx = x; cy = y; } sx = cx; sy = cy; cur = [[cx, cy]]; rs.push(cur); cmd = cmd === 'm' ? 'l' : 'L'; }
      else { if (cmd === 'l') { cx += x; cy += y; } else { cx = x; cy = y; } cur.push([cx, cy]); }
    }
    rings[L.id] = rs;
  }
  const D = [
    ['Alto Amazonas', 'Norte', ['am', 'rr']], ['Grão-Pará', 'Norte', ['pa', 'ap']], ['Maranhão', 'Norte', ['ma']],
    ['Piauí', 'Nordeste', ['pi']], ['Ceará', 'Nordeste', ['ce']], ['Rio Grande do Norte', 'Nordeste', ['rn']], ['Paraíba', 'Nordeste', ['pb']], ['Pernambuco', 'Nordeste', ['pe']], ['Alagoas', 'Nordeste', ['al']], ['Sergipe', 'Nordeste', ['se']], ['Bahia', 'Nordeste', ['ba']],
    ['Goiás', 'Centro', ['go', 'to', 'df']], ['Mato Grosso', 'Centro', ['mt', 'ms', 'ro']],
    ['Minas Gerais', 'Sudeste', ['mg']], ['Espírito Santo', 'Sudeste', ['es']], ['Corte (Rio de Janeiro)', 'Sudeste', ['rj']], ['São Paulo', 'Sudeste', ['sp']],
    ['Curitiba', 'Sul', ['pr']], ['Santa Catarina', 'Sul', ['sc']], ['Rio Grande do Sul', 'Sul', ['rs']],
  ];
  let [x0, y0, x1, y1] = [1e9, 1e9, -1e9, -1e9]; Object.values(rings).flat(2).forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
  const s = Math.min((W - 20) / (x1 - x0), (H - 20) / (y1 - y0)); const ox = (W - (x1 - x0) * s) / 2, oy = (H - (y1 - y0) * s) / 2;
  const tf = r => r.map(([x, y]) => [ox + (x - x0) * s, oy + (y - y0) * s]);
  const all = D.map(d => d[2].flatMap(id => rings[id].map(tf)));
  out.brasil1835 = finish('brasil1835', D, all, dstr(rings.ac.map(tf)), { tol: 2.5, credit: 'Mapa: @svg-maps/brazil (CC-BY-4.0), estados atuais agrupados em províncias aproximadas.', sea: [['Corte (Rio de Janeiro)', 'Bahia'], ['Corte (Rio de Janeiro)', 'Santa Catarina'], ['Corte (Rio de Janeiro)', 'Grão-Pará'], ['Bahia', 'Pernambuco']] });
}

// ============ FANTASIA (continentes gerados) ============
function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// regions: [{n, names}]; as primeiras (regions.length - ilhas) ficam no continente principal, em sentido horário a partir do norte; cada ilha vira uma região.
function fantasy(id, seed, regions, blobs, N, lakes) {
  const rnd = mulberry(seed);
  const blob = ([cx, cy, rx, ry, ph]) => { const r = []; for (let i = 0; i < 90; i++) { const a = i / 90 * Math.PI * 2; const k = 1 + .09 * Math.sin(3 * a + ph) + .06 * Math.sin(5 * a + ph * 2) + .03 * Math.sin(11 * a + ph); r.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return r; };
  const lands = blobs.map(blob);
  const inPoly = (r, x, y) => inside([r], x, y);
  const landOfPt = (x, y) => lands.findIndex(l => inPoly(l, x, y));
  const sites = []; let md = 70, tries = 0;
  while (sites.length < N + lakes) { tries++; if (tries > 6000) { md -= 4; tries = 0; } const x = rnd() * W, y = rnd() * H; if (landOfPt(x, y) < 0) continue; if (sites.every(s => Math.hypot(s[0] - x, s[1] - y) > md)) sites.push([x, y]); }
  const cellOf = i => { let p = [[0, 0], [W, 0], [W, H], [0, H]]; const s = sites[i]; sites.forEach((o, j) => { if (i === j) return; const mx = (s[0] + o[0]) / 2, my = (s[1] + o[1]) / 2, nx = o[0] - s[0], ny = o[1] - s[1]; p = clipHalf(p, q => (q[0] - mx) * nx + (q[1] - my) * ny); }); return p; };
  const cells = sites.map((_, i) => cellOf(i));
  const [bx, by] = blobs[0];
  const order = sites.map((s, i) => i).filter(i => landOfPt(...sites[i]) === 0).sort((a, b) => Math.hypot(sites[a][0] - bx, sites[a][1] - by) - Math.hypot(sites[b][0] - bx, sites[b][1] - by));
  const lakeIdx = new Set(order.slice(2, 2 + lakes));
  const keep = sites.map((s, i) => i).filter(i => !lakeIdx.has(i));
  const ringsAll = keep.map(i => lands.map(l => { let r = l; const c = cells[i]; for (let k = 0; k < c.length; k++) { const A = c[k], Bq = c[(k + 1) % c.length]; const nx = Bq[1] - A[1], ny = -(Bq[0] - A[0]); const sg = ((sites[i][0] - A[0]) * nx + (sites[i][1] - A[1]) * ny) > 0 ? -1 : 1; r = clipHalf(r, q => sg * ((q[0] - A[0]) * nx + (q[1] - A[1]) * ny)); if (r.length < 3) break; } return r.length >= 3 ? r : null; }).filter(Boolean));
  const pts = keep.map(i => sites[i]); const land = pts.map(p => landOfPt(p[0], p[1]));
  const islands = blobs.length - 1, K = regions.length - islands;
  // setores angulares no continente principal (horário a partir do norte)
  const ang = p => (Math.atan2(p[0] - bx, -(p[1] - by)) + Math.PI * 2) % (Math.PI * 2);
  const mainIdx = pts.map((p, i) => i).filter(i => land[i] === 0).sort((a, b) => ang(pts[a]) - ang(pts[b]));
  const reg = [];
  mainIdx.forEach((i, k) => reg[i] = Math.min(K - 1, Math.floor(k * K / mainIdx.length)));
  pts.forEach((p, i) => { if (land[i] > 0) reg[i] = K + land[i] - 1; });
  const used = regions.map(() => 0);
  const defs = pts.map((p, i) => { const R = regions[reg[i]]; const n = R.names[used[reg[i]]++] || R.n + ' ' + used[reg[i]]; return [n, R.n]; });
  const sea = [];
  for (let a = 0; a < lands.length; a++) for (let b = a + 1; b < lands.length; b++) {
    const pairs = []; pts.forEach((p, i) => pts.forEach((q, j) => { if (land[i] === a && land[j] === b) pairs.push([Math.hypot(p[0] - q[0], p[1] - q[1]), i, j]); }));
    pairs.sort((x, y) => x[0] - y[0]); const u = new Set(); let n = 0; for (const [, i, j] of pairs) { if (n >= 2) break; if (u.has(i) || u.has(j)) continue; u.add(i); u.add(j); sea.push([defs[i][0], defs[j][0]]); n++; }
  }
  return finish(id, defs, ringsAll, '', { tol: 2, sea, credit: 'Mapa original gerado para o jogo.' });
}
out.cinzas = fantasy('cinzas', 1835, [
  { n: 'Norte Gelado', names: ['Fortenorte', 'Gelo-Fundo', 'Torre do Lobo', 'Bruma Alta', 'Vau dos Corvos', 'Pedra-Alva', 'Escarpa Branca'] },
  { n: 'Terras da Coroa', names: ['Trono de Cinzas', 'Porto Régio', 'Colina dos Reis', 'Sete Sinos', 'Ponte Velha', 'Muralha Real', 'Passo do Falcão'] },
  { n: 'Sul Dourado', names: ['Dunas de Âmbar', 'Oásis Partido', 'Salinas Negras', 'Cabo Serpente', 'Vinhedo Real', 'Campos de Ouro', 'Palmeiral'] },
  { n: 'Vale Fértil', names: ['Vale Rubro', 'Lago Prata', 'Bosque Sombrio', 'Matagal', 'Garganta', 'Moinhos', 'Pomar Antigo'] },
  { n: 'Ilhas de Ferro', names: ['Rochedo', 'Ilha Tormenta', 'Recife Sangrento', 'Farol Quebrado', 'Baía das Velas', 'Ilha do Sal', 'Marisma'] },
], [[410, 320, 300, 270, 1.2], [895, 300, 72, 200, 2.5]], 32, 2);
out.runas = fantasy('runas', 777, [
  { n: 'Florestas Élficas', names: ['Sylvaren', 'Folha-Lua', 'Bosque Eterno', 'Clareira Prata', 'Lago dos Espelhos', 'Vale dos Ecos', 'Copa Alta'] },
  { n: 'Montanhas Anãs', names: ['Pedrafunda', 'Martelo Alto', 'Forja Rubra', 'Minas Fundas', 'Passo dos Gigantes', 'Pico do Dragão', 'Salão de Granito'] },
  { n: 'Ermos Orcs', names: ['Garra Rubra', 'Ermo Cinzento', 'Fosso dos Ossos', 'Planície Uivante', 'Charneca', 'Fenda Escura', 'Totem Negro'] },
  { n: 'Reinos Humanos', names: ['Altamar', 'Porto Claro', 'Campos de Trigo', 'Muralha Branca', 'Templo Solar', 'Brejo das Almas', 'Vila Coroada'] },
  { n: 'Ilha Arcana', names: ['Torre Velada', 'Cidadela das Runas', 'Ilha das Névoas', 'Círculo de Pedra', 'Jardim Astral'] },
  { n: 'Ilhas do Poente', names: ['Ilha Âmbar', 'Coroa do Mar', 'Recife Prateado', 'Dunas Sussurrantes', 'Cinzas Antigas'] },
], [[400, 330, 330, 260, 0.4], [880, 170, 90, 120, 3.1], [870, 480, 90, 100, 5.0]], 32, 2);

// ============ MEDITERRÂNEO (Antiguidade e Cruzadas) ============
{
  const I = 'Italy', F = 'France', E = 'Spain', T = 'Turkey', G = 'Greece', D = 'Germany', U = 'United Kingdom';
  const M = [
    ['Lusitânia', 'Hispânia', 'Portugal'], ['Gallaecia', 'Hispânia', { c: [E], b: [B(-10, -4, 39.5, 44.5)] }],
    ['Tarraconense', 'Hispânia', { c: [E, 'Andorra'], b: [B(-4, 5, 39.5, 44.5)] }], ['Bética', 'Hispânia', { c: [E], b: [B(-10, 5, 35, 39.5)] }],
    ['Aquitânia', 'Gália', { c: [F], b: [B(-5, 2.5, 41, 47)] }], ['Lugdunense', 'Gália', { c: [F], b: [B(-5, 2.5, 47, 52)] }],
    ['Narbonense', 'Gália', { c: [F, 'Monaco'], b: [B(2.5, 8.3, 41, 46)] }], ['Bélgica', 'Gália', { c: [F], b: [B(2.5, 8.3, 46, 52)] }, { c: ['Belgium', 'Luxembourg', 'Netherlands'] }],
    ['Britânia', 'Britânia', { c: [U], b: [B(-5.3, 2, 49.8, 55.5)] }], ['Caledônia', 'Britânia', { c: [U], b: [B(-8, 0, 55.5, 61)] }],
    ['Hibérnia', 'Britânia', 'Ireland', { c: [U], b: [B(-8.5, -5.3, 53.9, 55.5)] }],
    ['Germânia Ocidental', 'Germânia', { c: [D], b: [B(5, 10.5, 47, 55.5)] }], ['Germânia Norte', 'Germânia', { c: [D], b: [B(10.5, 15.5, 51, 55.5)] }, 'Denmark'],
    ['Récia e Nórica', 'Germânia', { c: ['Switzerland', 'Austria', 'Slovenia', 'Liechtenstein'] }, { c: [D], b: [B(10.5, 15.5, 47, 49)] }],
    ['Marcomânia', 'Germânia', { c: ['Czechia', 'Slovakia'] }, { c: [D], b: [B(10.5, 15.5, 49, 51)] }], ['Vístula', 'Germânia', { c: ['Poland', 'Lithuania'] }],
    ['Gália Cisalpina', 'Itália', { c: [I, 'San Marino'], b: [B(6, 14, 43.6, 47.5)] }], ['Itália Central', 'Itália', { c: [I, 'Vatican'], b: [B(10.5, 20, 41, 43.6)] }],
    ['Magna Grécia', 'Itália', { c: [I], b: [B(15.65, 19, 37.8, 41), B(13.7, 15.65, 38.4, 41)] }], ['Sicília', 'Itália', { c: [I], b: [B(12, 15.65, 36, 38.4)] }, 'Malta'],
    ['Sardenha e Córsega', 'Itália', { c: [I], b: [B(8, 10, 38.8, 41.3)] }, { c: [F], b: [B(8.4, 9.7, 41.3, 43.1)] }],
    ['Dalmácia', 'Bálcãs', { c: ['Croatia', 'Bosnia and Herz.', 'Montenegro', 'Albania'] }], ['Panônia', 'Bálcãs', 'Hungary'], ['Dácia', 'Bálcãs', { c: ['Romania', 'Moldova'] }],
    ['Mésia', 'Bálcãs', { c: ['Serbia', 'Kosovo', 'Bulgaria', 'Macedonia'] }], ['Trácia', 'Bálcãs', { c: [T], b: [B(25.5, 29.1, 40.6, 42.2)] }, { c: [G], b: [B(24.5, 27, 40.6, 42)] }],
    ['Macedônia', 'Bálcãs', { c: [G], b: [B(19, 24.5, 39.8, 42)] }], ['Acaia', 'Bálcãs', { c: [G], b: [B(19, 29, 34, 39.8), B(24.5, 29, 39.8, 40.6)] }],
    ['Ásia', 'Anatólia', { c: [T], b: [B(25, 32, 35.8, 40.6), B(29.1, 32, 40.6, 42.2)] }], ['Galácia e Capadócia', 'Anatólia', { c: [T], b: [B(32, 38, 36, 42.2)] }],
    ['Armênia', 'Anatólia', { c: [T], b: [B(38, 45, 36, 42.2)] }, 'Armenia'],
    ['Síria', 'Oriente', { c: ['Syria', 'Lebanon', 'Cyprus', 'N. Cyprus'] }], ['Judeia', 'Oriente', { c: ['Israel', 'Palestine', 'Jordan'] }], ['Mesopotâmia', 'Oriente', { c: ['Iraq', 'Kuwait'] }],
    ['Arábia', 'Oriente', { c: ['Saudi Arabia'], b: [B(34, 50, 24, 33)] }], ['Pérsia', 'Oriente', { c: ['Iran'], b: [B(44, 52, 24, 40)] }], ['Pártia', 'Oriente', { c: ['Iran'], b: [B(52, 64, 24, 40)] }, 'Turkmenistan'],
    ['Cítia', 'Estepes', { c: ['Ukraine'], b: [B(28, 41, 44, 48.5)] }], ['Sarmácia', 'Estepes', { c: ['Ukraine'], b: [B(22, 41, 48.5, 54)] }, { c: ['Russia'], b: [B(36, 50, 46, 54)] }, 'Belarus'],
    ['Cáucaso', 'Estepes', { c: ['Georgia', 'Azerbaijan'] }, { c: ['Russia'], b: [B(36, 50, 41, 46)] }],
    ['Mauritânia', 'África', { c: ['Morocco'], b: [B(-10, 0, 27, 36)] }], ['Numídia', 'África', { c: ['Algeria'], b: [B(-9, 7, 32, 37.5)] }], ['África', 'África', 'Tunisia', { c: ['Algeria'], b: [B(7, 10, 32, 37.5)] }],
    ['Tripolitânia', 'África', { c: ['Libya'], b: [B(9, 20, 26, 34)] }], ['Cirenaica', 'África', { c: ['Libya'], b: [B(20, 26, 26, 34)] }], ['Egito', 'África', { c: ['Egypt'], b: [B(24, 37, 22, 32)] }],
  ];
  out.mediterraneo = geoMap('mediterraneo', M, euProj(-10, 58, 25, 55), { hi: 1, sea: [['Hibérnia', 'Britânia'], ['Britânia', 'Lugdunense'], ['Britânia', 'Bélgica'], ['Bética', 'Mauritânia'], ['Tarraconense', 'Sardenha e Córsega'],
    ['Sardenha e Córsega', 'Itália Central'], ['Sardenha e Córsega', 'Narbonense'], ['Sardenha e Córsega', 'África'], ['Sicília', 'África'], ['Sicília', 'Magna Grécia'], ['Sicília', 'Tripolitânia'],
    ['Magna Grécia', 'Acaia'], ['Acaia', 'Ásia'], ['Acaia', 'Cirenaica'], ['Síria', 'Egito'], ['Síria', 'Ásia'], ['Trácia', 'Ásia'], ['Cítia', 'Galácia e Capadócia'], ['Dalmácia', 'Itália Central'], ['Dalmácia', 'Magna Grécia'], ['Bética', 'Numídia'], ['Germânia Norte', 'Britânia']] });
}
// ============ MUNDO NÓRDICO (Era Viking) ============
{
  const U = 'United Kingdom', F = 'France', D = 'Germany', R = 'Russia', N = 'Norway', S = 'Sweden';
  const V = [
    ['Islândia', 'Atlântico Norte', 'Iceland'], ['Órcadas e Shetland', 'Atlântico Norte', { c: [U], b: [B(-4, 0, 58.65, 61)] }, 'Faeroe Is.'],
    ['Vestlandet', 'Escandinávia', { c: [N], b: [B(4, 8.5, 57, 63.5)] }], ['Viken', 'Escandinávia', { c: [N], b: [B(8.5, 13, 57, 63.5)] }], ['Hålogaland', 'Escandinávia', { c: [N], b: [B(4, 32, 63.5, 72)] }],
    ['Götaland', 'Escandinávia', { c: [S], b: [B(10, 20, 55, 58.5)] }], ['Svealand', 'Escandinávia', { c: [S], b: [B(10, 20, 58.5, 61.5)] }], ['Norrland', 'Escandinávia', { c: [S], b: [B(10, 25, 61.5, 70)] }],
    ['Dinamarca', 'Escandinávia', 'Denmark'],
    ['Wessex', 'Britânia', { c: [U], b: [B(-5.8, 0, 49.8, 51.35), B(-3, 0, 51.35, 51.8)] }], ['Gales', 'Britânia', { c: [U], b: [B(-5.5, -3, 51.35, 53.5)] }],
    ['Mércia', 'Britânia', { c: [U], b: [B(-3, 0, 51.8, 53.6)] }], ['Ânglia Oriental', 'Britânia', { c: [U], b: [B(0, 2, 51.3, 53.6)] }],
    ['Nortúmbria', 'Britânia', { c: [U], b: [B(-3.6, 0.2, 53.6, 55.8)] }], ['Escócia', 'Britânia', { c: [U], b: [B(-8, 0, 55.8, 58.65), B(-5.2, -3.6, 54.6, 55.8)] }],
    ['Ulster', 'Irlanda', { c: ['Ireland'], b: [B(-11, -5, 53.5, 56)] }, { c: [U], b: [B(-8.5, -5.3, 53.9, 55.5)] }], ['Dublin e Munster', 'Irlanda', { c: ['Ireland'], b: [B(-11, -5, 51, 53.5)] }],
    ['Frísia', 'Francia', 'Netherlands'], ['Nêustria', 'Francia', { c: [F], b: [B(-5, 3.5, 46.5, 51.2)] }], ['Aquitânia', 'Francia', { c: [F], b: [B(-2, 3.5, 42, 46.5)] }],
    ['Francia Média', 'Francia', { c: [F], b: [B(3.5, 8.3, 42, 51.2)] }, { c: ['Belgium', 'Luxembourg', 'Switzerland'] }],
    ['Saxônia', 'Francia', { c: [D], b: [B(5.5, 11, 51, 55.5)] }], ['Francia Oriental', 'Francia', { c: [D], b: [B(5.5, 15.5, 47, 51)] }, 'Austria', 'Czechia'],
    ['Wendland', 'Leste', { c: [D], b: [B(11, 15.5, 51, 55)] }, { c: ['Poland'], b: [B(14, 24, 53, 55)] }], ['Polânia', 'Leste', { c: ['Poland'], b: [B(14, 24.5, 49, 53)] }],
    ['Curlândia', 'Leste', { c: ['Estonia', 'Latvia', 'Lithuania'] }], ['Finlândia', 'Leste', 'Finland'],
    ['Novgorod', 'Rus', { c: [R], b: [B(28, 45, 56.5, 62)] }], ['Biarmia', 'Rus', { c: [R], b: [B(28, 45, 62, 71)] }], ['Rostov', 'Rus', { c: [R], b: [B(30, 45, 52, 56.5)] }],
    ['Kiev', 'Rus', { c: ['Ukraine'], b: [B(22, 41, 49, 53)] }, 'Belarus'], ['Estepe Cazar', 'Rus', { c: ['Ukraine'], b: [B(22, 41, 44, 49)] }, 'Moldova', { c: [R], b: [B(36, 45, 44, 52)] }],
  ];
  out.nordico = geoMap('nordico', V, euProj(-25, 45, 45, 70), { hi: 1, sea: [['Islândia', 'Órcadas e Shetland'], ['Islândia', 'Vestlandet'], ['Órcadas e Shetland', 'Vestlandet'], ['Órcadas e Shetland', 'Escócia'],
    ['Viken', 'Dinamarca'], ['Dinamarca', 'Götaland'], ['Dinamarca', 'Nortúmbria'], ['Dinamarca', 'Ânglia Oriental'], ['Frísia', 'Ânglia Oriental'], ['Nêustria', 'Wessex'], ['Nêustria', 'Ânglia Oriental'],
    ['Escócia', 'Ulster'], ['Gales', 'Dublin e Munster'], ['Gales', 'Ulster'], ['Svealand', 'Finlândia'], ['Svealand', 'Curlândia'], ['Götaland', 'Wendland'], ['Götaland', 'Curlândia'], ['Vestlandet', 'Escócia'], ['Hålogaland', 'Biarmia']] });
}
// ============ AMÉRICAS ANTES DE COLOMBO ============
{
  const X = 'Mexico', P = 'Peru', BR = 'Brazil', AR = 'Argentina', CL = 'Chile';
  const A = [
    ['Aridoamérica', 'Mesoamérica', { c: [X], b: [B(-118, -96, 22, 33)] }], ['Michoacán', 'Mesoamérica', { c: [X], b: [B(-106, -100.5, 14, 22)] }],
    ['Vale do México', 'Mesoamérica', { c: [X], b: [B(-100.5, -98.2, 18, 22)] }], ['Golfo', 'Mesoamérica', { c: [X], b: [B(-98.2, -94.5, 18, 22)] }], ['Oaxaca', 'Mesoamérica', { c: [X], b: [B(-100.5, -94.5, 14, 18)] }],
    ['Chiapas', 'Mundo Maia', { c: [X], b: [B(-94.5, -86, 14, 17.8), B(-94.5, -91.5, 17.8, 22)] }], ['Yucatán', 'Mundo Maia', { c: [X], b: [B(-91.5, -86, 17.8, 22)] }],
    ['Petén', 'Mundo Maia', { c: ['Guatemala', 'Belize', 'El Salvador'] }], ['Istmo', 'Mundo Maia', { c: ['Honduras', 'Nicaragua', 'Costa Rica', 'Panama'] }],
    ['Cuba', 'Caribe', { c: ['Cuba', 'Jamaica', 'Bahamas'] }], ['Hispaniola', 'Caribe', { c: ['Haiti', 'Dominican Rep.', 'Puerto Rico'] }],
    ['Muiscas', 'Norte Andino', 'Colombia'], ['Caribes', 'Norte Andino', { c: ['Venezuela', 'Trinidad and Tobago'] }], ['Guianas', 'Norte Andino', { c: ['Guyana', 'Suriname'] }, { c: ['France'], b: [B(-55, -51, 2, 6.5)] }],
    ['Quito', 'Norte Andino', 'Ecuador'],
    ['Chimor', 'Andes', { c: [P], b: [B(-82, -76, -9.5, -3)] }], ['Chincha', 'Andes', { c: [P], b: [B(-80, -76, -15.5, -9.5)] }], ['Cuzco', 'Andes', { c: [P], b: [B(-76, -68, -15, -9.5)] }],
    ['Collasuyo', 'Andes', 'Bolivia', { c: [P], b: [B(-76, -68, -19, -15)] }], ['Atacama', 'Andes', { c: [CL], b: [B(-76, -66, -30, -17)] }],
    ['Mapuche', 'Cone Sul', { c: [CL], b: [B(-76, -66, -44, -30)] }], ['Diaguitas', 'Cone Sul', { c: [AR], b: [B(-69, -62, -30, -21)] }],
    ['Pampas', 'Cone Sul', { c: [AR], b: [B(-75, -56, -44, -30)] }, 'Uruguay'], ['Guaranis', 'Cone Sul', 'Paraguay', { c: [AR], b: [B(-62, -53, -30, -21)] }, { c: [BR], b: [B(-58, -46, -34, -24)] }],
    ['Amazônia', 'Terras Baixas', { c: [BR], b: [B(-74, -45, -10, 6)] }, { c: [P], b: [B(-76, -68, -9.5, 0)] }], ['Jês do Cerrado', 'Terras Baixas', { c: [BR], b: [B(-62, -45, -24, -10)] }],
    ['Tupinambás', 'Terras Baixas', { c: [BR], b: [B(-45, -34, -24, 6)] }],
  ];
  const proj = d3.geoMercator().fitExtent([[4, 4], [W - 4, H - 4]], { type: 'Polygon', coordinates: [densify([[-118, -44], [-118, 33], [-34.5, 33], [-34.5, -44], [-118, -44]])] }).clipExtent([[0, 0], [W, H]]);
  out.americas = geoMap('americas', A, proj, { hi: 1, sea: [['Yucatán', 'Cuba'], ['Cuba', 'Hispaniola'], ['Hispaniola', 'Caribes'], ['Golfo', 'Cuba'], ['Istmo', 'Cuba']] });
}
// ============ JAPÃO SENGOKU ============
{
  const J = { c: ['Japan'] }, j = (...b) => ({ ...J, b });
  // arquipélago girado para ficar na horizontal e ocupar a tela
  const jpProj = () => d3.geoConicConformal().rotate([-137, 0]).parallels([33, 40]).angle(-42)
    .fitExtent([[10, 10], [W - 10, H - 10]], { type: 'MultiPolygon', coordinates: wind(geomFor({ c: ['Japan'], b: [B(129, 146, 30.9, 45.6)] }, world50, byName50)) }).clipExtent([[0, 0], [W, H]]);
  const N = [
    ['Satsuma', 'Kyushu', j(B(129, 131.2, 30.9, 32.4))], ['Hyuga', 'Kyushu', j(B(131.2, 132.2, 30.9, 32.9))], ['Higo', 'Kyushu', j(B(130.4, 131.2, 32.4, 33.2))],
    ['Hizen', 'Kyushu', j(B(129, 130.4, 32.4, 33.97))], ['Chikuzen', 'Kyushu', j(B(130.4, 131.2, 33.2, 33.97))], ['Bungo', 'Kyushu', j(B(131.2, 132.2, 32.9, 33.97))],
    ['Tosa', 'Shikoku', j(B(132, 135, 32.5, 33.7))], ['Iyo e Sanuki', 'Shikoku', j(B(132, 135, 33.7, 34.42))],
    ['Nagato e Suo', 'Chugoku', j(B(130.8, 132, 33.97, 35))], ['Aki', 'Chugoku', j(B(132, 133, 34.42, 35))], ['Izumo e Iwami', 'Chugoku', j(B(130.8, 133.6, 35, 35.8))],
    ['Bizen e Mimasaka', 'Chugoku', j(B(133, 134.3, 34.42, 35), B(133.6, 134.3, 35, 35.8))], ['Harima', 'Chugoku', j(B(134.3, 135.1, 34.42, 35.8))],
    ['Yamashiro e Ōmi', 'Kinai', j(B(135.1, 136.3, 34.75, 36))], ['Settsu e Kii', 'Kinai', j(B(135.1, 136.3, 33.4, 34.75))],
    ['Owari e Ise', 'Tokai', j(B(136.3, 137.1, 33.7, 35.3))], ['Mino', 'Tokai', j(B(136.3, 137.4, 35.3, 36))], ['Mikawa e Tōtōmi', 'Tokai', j(B(137.1, 138, 34.5, 35.3))], ['Suruga', 'Tokai', j(B(138, 138.9, 34.5, 35.4))],
    ['Kai', 'Koshin', j(B(138.2, 138.9, 35.4, 36))], ['Shinano', 'Koshin', j(B(137.4, 138.2, 35.4, 36.85), B(138.2, 138.9, 36, 36.85))],
    ['Echizen', 'Hokuriku', j(B(135.8, 136.45, 36, 36.6))], ['Kaga e Etchu', 'Hokuriku', j(B(136.45, 137.4, 36, 37.6))], ['Echigo', 'Hokuriku', j(B(137.6, 139.9, 36.85, 38.6))],
    ['Sagami e Musashi', 'Kanto', j(B(138.9, 139.95, 34.8, 36.3))], ['Kazusa e Awa', 'Kanto', j(B(139.95, 140.9, 34.8, 36.3))], ['Hitachi e Shimotsuke', 'Kanto', j(B(138.9, 139.9, 36.3, 36.85), B(139.9, 141, 36.3, 37.2))],
    ['Aizu e Dewa', 'Tohoku', j(B(139.9, 140.5, 37.2, 38.6), B(138.5, 140.5, 38.6, 39))], ['Mutsu Sul', 'Tohoku', j(B(140.5, 142.2, 37.2, 39))],
    ['Oshu Norte', 'Norte', j(B(138.5, 142.2, 39, 41.6))], ['Ezo', 'Norte', j(B(139, 146, 41.6, 46))],
  ];
  out.japao = geoMap('japao', N, jpProj(), { hi: 1, tol: 3, sea: [['Ezo', 'Oshu Norte'], ['Nagato e Suo', 'Chikuzen'], ['Bungo', 'Iyo e Sanuki'], ['Hyuga', 'Tosa'], ['Iyo e Sanuki', 'Aki'], ['Iyo e Sanuki', 'Bizen e Mimasaka'], ['Iyo e Sanuki', 'Harima'], ['Tosa', 'Settsu e Kii'], ['Iyo e Sanuki', 'Settsu e Kii']] });
}
fs.writeFileSync('maps.json', JSON.stringify(out));
for (const [k, v] of Object.entries(out)) console.log(k, v.terr.length, 'territórios', v.adj.length, 'vizinhanças', Math.round(JSON.stringify(v).length / 1024) + 'KB');
