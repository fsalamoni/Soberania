// Gera o relevo de um mapa a partir de elevação real (AWS Terrain Tiles, formato terrarium, dados abertos):
//   maps/relevo/<id>-s.webp  sombreado em cinza (multiplica sobre as cores dos donos)
//   maps/relevo/<id>-c.webp  relevo colorido por altitude e sombreado (visão Relevo)
// Só a terra do mapa recebe relevo (máscara = territórios + fundo), então costa e divisas casam com o desenho.
// Uso: node relevo.js <id> <pasta de ladrilhos z-x-y.png> <z> <exagero vertical> [world-atlas countries-50m.json]
// Precisa de playwright (Chromium) e de d3-array, d3-geo e topojson-client em node_modules ao lado.
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const [, , ID, TILES, Z, EX, W50] = process.argv;
const NM = path.join(__dirname, 'node_modules');
const MAPS = JSON.parse(fs.readFileSync(path.join(__dirname, 'maps.json'), 'utf8')), m = MAPS[ID];
// projeção de cada mapa, igual ao maps-build.mjs / japao-real.mjs (roda no navegador, com d3 e topojson carregados)
const PROJ = {
  japao: `(() => { const W = 1000, H = 620, w50 = WORLD50;
    const clipHalf = (ring, f) => { const out = []; for (let i = 0; i < ring.length; i++) { const A = ring[i], Bp = ring[(i + 1) % ring.length], da = f(A), db = f(Bp); if (da <= 0) out.push(A); if ((da <= 0) !== (db <= 0)) { const t = da / (da - db); out.push([A[0] + (Bp[0] - A[0]) * t, A[1] + (Bp[1] - A[1]) * t]); } } return out; };
    const densify = ring => { const o = []; for (let i = 0; i < ring.length - 1; i++) { const A = ring[i], Bp = ring[i + 1], n = Math.max(1, Math.ceil(Math.max(Math.abs(Bp[0] - A[0]), Math.abs(Bp[1] - A[1])))); for (let k = 0; k < n; k++) o.push([A[0] + (Bp[0] - A[0]) * k / n, A[1] + (Bp[1] - A[1]) * k / n]); } o.push(ring[ring.length - 1]); return o; };
    const clipBox = (ring, [x0, x1, y0, y1]) => { let r = ring.slice(0, -1).map(p => p.slice()); r = clipHalf(r, p => x0 - p[0]); r = clipHalf(r, p => p[0] - x1); r = clipHalf(r, p => y0 - p[1]); r = clipHalf(r, p => p[1] - y1); return r.length < 3 ? null : densify([...r, r[0]]); };
    const wind = polys => polys.map(p => d3.geoArea({ type: 'Polygon', coordinates: p }) > 2 * Math.PI ? p.map(r => r.slice().reverse()) : p);
    const jp = topojson.merge(w50, w50.objects.countries.geometries.filter(g => g.properties.name === 'Japan'));
    const box = []; for (const poly of jp.coordinates) { const e = clipBox(poly[0], [129, 146, 30.9, 45.6]); if (e) box.push([e]); }
    return d3.geoConicConformal().rotate([-137, 0]).parallels([33, 40]).angle(-42).fitExtent([[10, 10], [W - 10, H - 10]], { type: 'MultiPolygon', coordinates: wind(box) }); })()`,
};
(async () => {
  if (!PROJ[ID]) throw new Error('sem projeção para ' + ID);
  const tiles = fs.readdirSync(TILES).filter(f => f.startsWith(Z + '-')).map(f => { const [, x, y] = f.replace('.png', '').split('-').map(Number); return { x, y, u: 'data:image/png;base64,' + fs.readFileSync(path.join(TILES, f)).toString('base64') }; });
  const b = await chromium.launch(), p = await b.newPage();
  for (const f of ['d3-array/dist/d3-array.min.js', 'd3-geo/dist/d3-geo.min.js', 'topojson-client/dist/topojson-client.min.js']) await p.addScriptTag({ path: path.join(NM, f) });
  if (W50) await p.evaluate(s => { window.WORLD50 = JSON.parse(s); }, fs.readFileSync(W50, 'utf8'));
  const out = await p.evaluate(async ({ m, tiles, z, ex, projSrc }) => {
    const proj = eval(projSrc), S = 1.6, PW = Math.round(m.w * S), PH = Math.round(m.h * S);
    // mosaico de elevação
    const tx0 = Math.min(...tiles.map(t => t.x)), ty0 = Math.min(...tiles.map(t => t.y)), TW = (Math.max(...tiles.map(t => t.x)) - tx0 + 1) * 256, TH = (Math.max(...tiles.map(t => t.y)) - ty0 + 1) * 256;
    const mc = new OffscreenCanvas(TW, TH), mx = mc.getContext('2d');
    await Promise.all(tiles.map(async t => { const im = await createImageBitmap(await (await fetch(t.u)).blob()); mx.drawImage(im, (t.x - tx0) * 256, (t.y - ty0) * 256); }));
    const raw = mx.getImageData(0, 0, TW, TH).data, E = new Float32Array(TW * TH);
    for (let i = 0; i < E.length; i++) E[i] = raw[i * 4] * 256 + raw[i * 4 + 1] + raw[i * 4 + 2] / 256 - 32768;
    const N = 2 ** z * 256;
    const elev = (lon, lat) => { const px = (lon + 180) / 360 * N - tx0 * 256, l = lat * Math.PI / 180, py = (1 - Math.log(Math.tan(l) + 1 / Math.cos(l)) / Math.PI) / 2 * N - ty0 * 256; const x0 = Math.floor(px), y0 = Math.floor(py); if (x0 < 0 || y0 < 0 || x0 >= TW - 1 || y0 >= TH - 1) return 0; const fx = px - x0, fy = py - y0, k = y0 * TW + x0; return E[k] * (1 - fx) * (1 - fy) + E[k + 1] * fx * (1 - fy) + E[k + TW] * (1 - fx) * fy + E[k + TW + 1] * fx * fy; };
    // máscara de terra: o mesmo desenho do jogo
    const lc = new OffscreenCanvas(PW, PH), lx = lc.getContext('2d'); lx.scale(S, S); lx.fillStyle = '#fff';
    [m.bg, ...m.terr.map(t => t.d)].filter(Boolean).forEach(d => lx.fill(new Path2D(d)));
    const land = lx.getImageData(0, 0, PW, PH).data;
    // altura em cada pixel do mapa
    const H = new Float32Array(PW * PH), LL = new Float32Array(PW * PH * 2);
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const k = y * PW + x; const g = proj.invert([(x + .5) / S, (y + .5) / S]); if (!g) continue; LL[2 * k] = g[0]; LL[2 * k + 1] = g[1]; H[k] = Math.max(0, elev(g[0], g[1])); }
    // tamanho do pixel em metros (no centro) para a inclinação
    const c0 = proj.invert([m.w / 2, m.h / 2]), c1 = proj.invert([m.w / 2 + 1 / S, m.h / 2]), pm = d3.geoDistance(c0, c1) * 6371000;
    const az = 315 * Math.PI / 180, alt = 45 * Math.PI / 180, Lx = Math.cos(alt) * Math.sin(az), Ly = -Math.cos(alt) * Math.cos(az), Lz = Math.sin(alt);
    const sh = new ImageData(PW, PH), co = new ImageData(PW, PH);
    const ramp = [[0, [118, 150, 92]], [150, [148, 170, 104]], [400, [190, 184, 120]], [800, [176, 148, 98]], [1400, [150, 118, 86]], [2000, [142, 128, 116]], [2700, [196, 190, 184]], [3300, [246, 244, 240]]];
    const tint = h => { for (let i = 1; i < ramp.length; i++) if (h <= ramp[i][0]) { const [h0, a] = ramp[i - 1], [h1, c] = ramp[i], t = (h - h0) / (h1 - h0); return a.map((v, j) => v + (c[j] - v) * t); } return ramp[ramp.length - 1][1]; };
    for (let y = 1; y < PH - 1; y++) for (let x = 1; x < PW - 1; x++) {
      const k = y * PW + x; if (land[k * 4 + 3] < 128) continue;
      const dzdx = (H[k + 1] - H[k - 1]) / (2 * pm) * ex, dzdy = (H[k + PW] - H[k - PW]) / (2 * pm) * ex;
      const nl = Math.hypot(dzdx, dzdy, 1), s = Math.max(0, (-dzdx * Lx - dzdy * Ly + Lz) / nl), v = s / Lz;
      const g = Math.round(255 * Math.min(1, .22 + .78 * Math.min(1.1, v) / 1.1 + .06));
      sh.data.set([g, g, g, 255], k * 4);
      const c = tint(H[k]), f = Math.max(.42, Math.min(1.18, .25 + .75 * v));
      co.data.set([Math.min(255, c[0] * f), Math.min(255, c[1] * f), Math.min(255, c[2] * f), 255], k * 4);
    }
    const enc = async id => { const c = new OffscreenCanvas(PW, PH); c.getContext('2d').putImageData(id, 0, 0); const bl = await c.convertToBlob({ type: 'image/webp', quality: .82 }); return [...new Uint8Array(await bl.arrayBuffer())]; };
    return { s: await enc(sh), c: await enc(co), pm };
  }, { m, tiles, z: +Z, ex: +EX, projSrc: PROJ[ID] });
  const D = path.join(__dirname, 'relevo'); fs.mkdirSync(D, { recursive: true });
  fs.writeFileSync(path.join(D, ID + '-s.webp'), Buffer.from(out.s)); fs.writeFileSync(path.join(D, ID + '-c.webp'), Buffer.from(out.c));
  console.log(ID, 'pixel', out.pm.toFixed(0) + ' m', 'sombra', (out.s.length / 1024).toFixed(0) + 'KB', 'cor', (out.c.length / 1024).toFixed(0) + 'KB');
  await b.close();
})();
