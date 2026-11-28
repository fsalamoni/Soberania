// Projeção de cada mapa como código que roda no navegador (com d3 e topojson carregados), igual ao maps-build.mjs / japao-real.mjs.
// Usado por relevo.js (sombreado e estradas) e rios.js (rios).
module.exports = m => {
  // projeção de cada mapa, igual ao maps-build.mjs / japao-real.mjs (roda no navegador, com d3 e topojson carregados)
  // euProj do maps-build.mjs / real.mjs para um quadro lon/lat
  const EU = (lon0, lon1, lat0, lat1, base, pad = 4) => `(() => { const W = ${m.w}, H = ${m.h}; const densify = ring => { const o = []; for (let i = 0; i < ring.length - 1; i++) { const A = ring[i], Bp = ring[i + 1], n = Math.max(1, Math.ceil(Math.max(Math.abs(Bp[0] - A[0]), Math.abs(Bp[1] - A[1])))); for (let k = 0; k < n; k++) o.push([A[0] + (Bp[0] - A[0]) * k / n, A[1] + (Bp[1] - A[1]) * k / n]); } o.push(ring[ring.length - 1]); return o; };
    return ${base || `d3.geoConicConformal().rotate([${-(lon0 + lon1) / 2}, 0]).parallels([40, 60])`}.fitExtent([[${pad}, ${pad}], [W - ${pad}, H - ${pad}]], { type: 'Polygon', coordinates: [densify([[${lon0}, ${lat0}], [${lon0}, ${lat1}], [${lon1}, ${lat1}], [${lon1}, ${lat0}], [${lon0}, ${lat0}]])] }); })()`;
  // desertos (lon0, lon1, lat0, lat1): a terra baixa dentro da caixa puxa para areia, com 5° de transição nas bordas
  const SAARA = [-20, 75, 12, 35], AUS = [114, 146, -32, -19];
  const DRY = { europa1805: [SAARA], europa1914: [SAARA], mediterraneo: [SAARA], mundo: [SAARA, AUS] };
  const PROJ = {
    europa1805: EU(-11, 43, 33, 63), europa1914: EU(-11, 52, 22, 63), mediterraneo: EU(-10, 58, 25, 55), nordico: EU(-25, 45, 45, 70),
    americas: EU(-118, -34.5, -44, 33, 'd3.geoMercator()'),
    eua1861: EU(-125, -66.5, 24.5, 49.5, 'd3.geoAlbers().rotate([96, 0]).parallels([29.5, 45.5]).center([0, 0])', 10),
    brasil1835: EU(-74, -34.7, -33.8, 5.3, 'd3.geoMercator()', 10),
    mundo: `(() => { const W = ${m.w}, H = ${m.h}, p = d3.geoNaturalEarth1().rotate([-11, 0]).fitExtent([[0, 0], [W, H * 1.18]], { type: 'Sphere' }); return p.translate([p.translate()[0], p.translate()[1] - H * 0.02]); })()`,
    japao: `(() => { const W = 1000, H = 620, w50 = WORLD50;
      const clipHalf = (ring, f) => { const out = []; for (let i = 0; i < ring.length; i++) { const A = ring[i], Bp = ring[(i + 1) % ring.length], da = f(A), db = f(Bp); if (da <= 0) out.push(A); if ((da <= 0) !== (db <= 0)) { const t = da / (da - db); out.push([A[0] + (Bp[0] - A[0]) * t, A[1] + (Bp[1] - A[1]) * t]); } } return out; };
      const densify = ring => { const o = []; for (let i = 0; i < ring.length - 1; i++) { const A = ring[i], Bp = ring[i + 1], n = Math.max(1, Math.ceil(Math.max(Math.abs(Bp[0] - A[0]), Math.abs(Bp[1] - A[1])))); for (let k = 0; k < n; k++) o.push([A[0] + (Bp[0] - A[0]) * k / n, A[1] + (Bp[1] - A[1]) * k / n]); } o.push(ring[ring.length - 1]); return o; };
      const clipBox = (ring, [x0, x1, y0, y1]) => { let r = ring.slice(0, -1).map(p => p.slice()); r = clipHalf(r, p => x0 - p[0]); r = clipHalf(r, p => p[0] - x1); r = clipHalf(r, p => y0 - p[1]); r = clipHalf(r, p => p[1] - y1); return r.length < 3 ? null : densify([...r, r[0]]); };
      const wind = polys => polys.map(p => d3.geoArea({ type: 'Polygon', coordinates: p }) > 2 * Math.PI ? p.map(r => r.slice().reverse()) : p);
      const jp = topojson.merge(w50, w50.objects.countries.geometries.filter(g => g.properties.name === 'Japan'));
      const box = []; for (const poly of jp.coordinates) { const e = clipBox(poly[0], [129, 146, 30.9, 45.6]); if (e) box.push([e]); }
      return d3.geoConicConformal().rotate([-137, 0]).parallels([33, 40]).angle(-42).fitExtent([[10, 10], [W - 10, H - 10]], { type: 'MultiPolygon', coordinates: wind(box) }); })()`,
  };
  return { PROJ, DRY };
};
