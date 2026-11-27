// Gera os rios de um mapa a partir da elevação real (AWS Terrain Tiles, formato terrarium, dados abertos):
//   maps/relevo/<id>-v.json  { índice do território: [[traçado SVG, largura], ...] }
// A água corre de verdade: o terreno é "enchido" a partir do mar (priority-flood), cada ponto escoa para o vizinho
// mais baixo e a vazão se acumula rio abaixo. Em cada território sai o rio principal (o de maior vazão com bom
// trecho dentro dele), os maiores afluentes e, se houver, um segundo rio. Por isso o traçado segue os vales do
// mesmo relevo que o jogo desenha, engrossa rumo à foz e continua no território vizinho.
// Uso: node rios.js <id> <pasta para guardar os ladrilhos> [world-atlas countries-50m.json]
// Precisa de playwright (Chromium), curl e de d3-array, d3-geo e topojson-client em NODE_MODULES ou node_modules ao lado.
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const [, , ID, TILES, W50] = process.argv;
const NM = process.env.NODE_MODULES || path.join(__dirname, 'node_modules');
const MAPS = JSON.parse(fs.readFileSync(path.join(__dirname, 'maps.json'), 'utf8')), m = MAPS[ID];
const { PROJ } = require('./proj.js')(m);
const S = 1.6; // pixels por unidade do mapa, igual ao relevo
// só os territórios que o jogo marca com rio (o 'r' de GEO em src/geo.js) entram no arquivo
const GEO = (() => { const s = fs.readFileSync(path.join(__dirname, '../src/geo.js'), 'utf8'), a = s.indexOf('const GEO = {'), e = s.indexOf('\n};', a); return new Function(s.slice(a, e + 3) + ' return GEO;')(); })()[ID] || {};
const WANT = m.terr.map(t => (GEO[t.n] || 'p').split(' ')[0].includes('r'));
(async () => {
  if (!PROJ[ID]) throw new Error('sem projeção para ' + ID);
  fs.mkdirSync(TILES, { recursive: true });
  const b = await chromium.launch(), p = await b.newPage();
  await p.route('http://rios.local/**', r => { const f = path.join(TILES, path.basename(new URL(r.request().url()).pathname)); return f.endsWith('.png') && fs.existsSync(f) ? r.fulfill({ contentType: 'image/png', body: fs.readFileSync(f) }) : r.fulfill({ contentType: 'text/html', body: '<!doctype html>' }); });
  await p.goto('http://rios.local/');
  for (const f of ['d3-array/dist/d3-array.min.js', 'd3-geo/dist/d3-geo.min.js', 'topojson-client/dist/topojson-client.min.js']) await p.addScriptTag({ path: path.join(NM, f) });
  if (W50) await p.evaluate(s => { window.WORLD50 = JSON.parse(s); }, fs.readFileSync(W50, 'utf8'));
  // 1) quadro em lon/lat e tamanho do pixel, para escolher o zoom dos ladrilhos
  const box = await p.evaluate(({ m, projSrc, S }) => {
    const proj = eval(projSrc); let a = 180, b2 = -180, c = 85, d = -85;
    for (let y = 0; y <= m.h; y += 5) for (let x = 0; x <= m.w; x += 5) { const g = proj.invert([x, y]); if (!g || !isFinite(g[0]) || !isFinite(g[1])) continue; a = Math.min(a, g[0]); b2 = Math.max(b2, g[0]); c = Math.min(c, g[1]); d = Math.max(d, g[1]); }
    const c0 = proj.invert([m.w / 2, m.h / 2]), c1 = proj.invert([m.w / 2 + 1 / S, m.h / 2]);
    return { lon0: Math.max(-180, a), lon1: Math.min(180, b2), lat0: Math.max(-85, c), lat1: Math.min(85, d), pm: d3.geoDistance(c0, c1) * 6371000, latc: c0[1] };
  }, { m, projSrc: PROJ[ID], S });
  const tx = (lon, z) => Math.min(2 ** z - 1, Math.max(0, Math.floor((lon + 180) / 360 * 2 ** z))), ty = (lat, z) => { const l = lat * Math.PI / 180; return Math.min(2 ** z - 1, Math.max(0, Math.floor((1 - Math.log(Math.tan(l) + 1 / Math.cos(l)) / Math.PI) / 2 * 2 ** z))); };
  let z = Math.max(2, Math.min(9, Math.round(Math.log2(156543 * Math.cos(box.latc * Math.PI / 180) / box.pm)))), rng;
  for (; ; z--) { rng = [tx(box.lon0, z), tx(box.lon1, z), ty(box.lat1, z), ty(box.lat0, z)]; if ((rng[1] - rng[0] + 1) * (rng[3] - rng[2] + 1) <= 360 || z <= 2) break; }
  const tiles = []; for (let x = rng[0]; x <= rng[1]; x++) for (let y = rng[2]; y <= rng[3]; y++) tiles.push({ x, y, f: `${z}-${x}-${y}.png` });
  const miss = tiles.filter(t => !fs.existsSync(path.join(TILES, t.f)));
  if (miss.length) { const cfg = path.join(TILES, 'curl.cfg'); fs.writeFileSync(cfg, miss.map(t => `url = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${t.x}/${t.y}.png"\noutput = "${path.join(TILES, t.f)}"`).join('\n')); execFileSync('curl', ['-s', '-f', '--retry', '4', '--parallel', '--parallel-max', '8', '-K', cfg], { stdio: 'inherit' }); }
  console.log(ID, 'pixel', box.pm.toFixed(0) + ' m', 'zoom', z, 'ladrilhos', tiles.length, 'baixados', miss.length);
  // 2) hidrologia
  const out = await p.evaluate(async ({ m, tiles, z, projSrc, S, want }) => {
    const proj = eval(projSrc), PW = Math.round(m.w * S), PH = Math.round(m.h * S), NP = PW * PH;
    const tx0 = Math.min(...tiles.map(t => t.x)), ty0 = Math.min(...tiles.map(t => t.y)), TW = (Math.max(...tiles.map(t => t.x)) - tx0 + 1) * 256, TH = (Math.max(...tiles.map(t => t.y)) - ty0 + 1) * 256;
    // mosaico de elevação, em faixas para não estourar o tamanho do canvas
    const E = new Float32Array(TW * TH), rows = [...new Set(tiles.map(t => t.y))];
    for (const y of rows) { const c = new OffscreenCanvas(TW, 256), cx = c.getContext('2d', { willReadFrequently: true }); await Promise.all(tiles.filter(t => t.y === y).map(async t => { const im = await createImageBitmap(await (await fetch('/' + t.f)).blob()); cx.drawImage(im, (t.x - tx0) * 256, 0); })); const raw = cx.getImageData(0, 0, TW, 256).data, o = (y - ty0) * 256 * TW; for (let i = 0; i < TW * 256; i++) E[o + i] = raw[i * 4] * 256 + raw[i * 4 + 1] + raw[i * 4 + 2] / 256 - 32768; }
    const NN = 2 ** z * 256;
    const elev = (lon, lat) => { const px = (lon + 180) / 360 * NN - tx0 * 256, l = lat * Math.PI / 180, py = (1 - Math.log(Math.tan(l) + 1 / Math.cos(l)) / Math.PI) / 2 * NN - ty0 * 256; const x0 = Math.floor(px), y0 = Math.floor(py); if (x0 < 0 || y0 < 0 || x0 >= TW - 1 || y0 >= TH - 1) return 0; const fx = px - x0, fy = py - y0, k = y0 * TW + x0; return E[k] * (1 - fx) * (1 - fy) + E[k + 1] * fx * (1 - fy) + E[k + TW] * (1 - fx) * fy + E[k + TW + 1] * fx * fy; };
    // máscara de terra e território de cada pixel: o mesmo desenho do jogo
    const lc = new OffscreenCanvas(PW, PH), lx = lc.getContext('2d'); lx.scale(S, S); lx.fillStyle = '#fff';
    [m.bg, ...m.terr.map(t => t.d)].filter(Boolean).forEach(d => lx.fill(new Path2D(d)));
    const la = lx.getImageData(0, 0, PW, PH).data, land = new Uint8Array(NP); for (let k = 0; k < NP; k++) land[k] = la[k * 4 + 3] >= 128 ? 1 : 0;
    const ic = new OffscreenCanvas(PW, PH), ix = ic.getContext('2d'); ix.scale(S, S);
    m.terr.forEach((t, i) => { ix.fillStyle = `rgb(${(i + 1) & 255},${(i + 1) >> 8},0)`; ix.fill(new Path2D(t.d)); });
    const idd = ix.getImageData(0, 0, PW, PH).data, ID = new Int16Array(NP).fill(-1);
    for (let k = 0; k < NP; k++) { const a = idd[k * 4 + 3]; if (a === 255) ID[k] = idd[k * 4] + idd[k * 4 + 1] * 256 - 1; else if (a) ID[k] = -2; } // -2 = beira
    const H = new Float32Array(NP);
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const k = y * PW + x; if (!land[k]) continue; const g = proj.invert([(x + .5) / S, (y + .5) / S]); H[k] = g ? Math.max(0, elev(g[0], g[1])) : 0; }
    // Planícies e lagos são planos no dado: sem ajuda o rio sairia reto. Um ruído suave de poucos metros (some nas serras,
    // onde o declive é de centenas de metros) faz o curso serpentear na várzea, como um rio de planície.
    const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
    const vn = (x, y) => { const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return (hash(x0, y0) * (1 - u) + hash(x0 + 1, y0) * u) * (1 - v) + (hash(x0, y0 + 1) * (1 - u) + hash(x0 + 1, y0 + 1) * u) * v; };
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const k = y * PW + x; if (land[k]) H[k] += 5 * vn(x / 11, y / 11) + 2.5 * vn(x / 4.3 + 40, y / 4.3 + 17) + hash(x, y); }
    const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1], DW = [1, 1, 1, 1, 1.414, 1.414, 1.414, 1.414];
    // enchimento a partir do mar (priority-flood com um declive mínimo): toda terra passa a ter saída para o mar
    const hk = new Float32Array(NP), hi = new Int32Array(NP); let hn = 0;
    const push = (v, k) => { let i = hn++; while (i) { const q = (i - 1) >> 1; if (hk[q] <= v) break; hk[i] = hk[q]; hi[i] = hi[q]; i = q; } hk[i] = v; hi[i] = k; };
    const pop = () => { const top = hi[0], v = hk[--hn], k = hi[hn]; let i = 0; for (; ;) { let c = 2 * i + 1; if (c >= hn) break; if (c + 1 < hn && hk[c + 1] < hk[c]) c++; if (hk[c] >= v) break; hk[i] = hk[c]; hi[i] = hi[c]; i = c; } hk[i] = v; hi[i] = k; return top; };
    const F = new Float32Array(NP), seen = new Uint8Array(NP), order = new Int32Array(NP); let no = 0;
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const k = y * PW + x; if (!land[k]) continue; let edge = x === 0 || y === 0 || x === PW - 1 || y === PH - 1; for (let d = 0; d < 8 && !edge; d++) if (!land[k + DX[d] + DY[d] * PW]) edge = true; if (edge) { F[k] = H[k]; seen[k] = 2; push(H[k], k); } }
    while (hn) { const k = pop(), x = k % PW, y = (k / PW) | 0; order[no++] = k; for (let d = 0; d < 8; d++) { const nx = x + DX[d], ny = y + DY[d]; if (nx < 0 || ny < 0 || nx >= PW || ny >= PH) continue; const n = ny * PW + nx; if (!land[n] || seen[n]) continue; seen[n] = 1; F[n] = Math.max(H[n], F[k] + (.004 + .03 * hash(nx + 7, ny + 3)) * DW[d]); push(F[n], n); } }
    // direção de escoamento (maior declive na superfície enchida) e vazão acumulada
    const dir = new Int32Array(NP).fill(-1), acc = new Float32Array(NP);
    for (let j = 0; j < no; j++) { const k = order[j]; acc[k] = 1; if (seen[k] === 2) continue; const x = k % PW, y = (k / PW) | 0; let best = -1, bs = 0; for (let d = 0; d < 8; d++) { const nx = x + DX[d], ny = y + DY[d]; if (nx < 0 || ny < 0 || nx >= PW || ny >= PH) continue; const n = ny * PW + nx; if (!land[n]) continue; const s = (F[k] - F[n]) / DW[d]; if (s > bs) { bs = s; best = n; } } dir[k] = best; }
    for (let j = no - 1; j >= 0; j--) { const k = order[j]; if (dir[k] >= 0) acc[dir[k]] += acc[k]; }
    // rios de cada território
    const T0 = 30; // nascente: onde a bacia passa de 30 pixels
    const near = (k, i) => { if (ID[k] === i) return true; const x = k % PW, y = (k / PW) | 0; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < PW && ny < PH && ID[ny * PW + nx] === i) return true; } return false; };
    const donors = k => { const x = k % PW, y = (k / PW) | 0, o = []; for (let d = 0; d < 8; d++) { const nx = x + DX[d], ny = y + DY[d]; if (nx < 0 || ny < 0 || nx >= PW || ny >= PH) continue; const n = ny * PW + nx; if (dir[n] === k) o.push(n); } return o.sort((a, c) => acc[c] - acc[a]); };
    const up = (k, i, used) => { const P = [k]; for (; ;) { const c = donors(P[P.length - 1]).find(n => acc[n] >= T0 && near(n, i) && !(used && used.has(n))); if (c == null) break; P.push(c); } return P; }; // da foz para a nascente
    const inside = (P, i) => P.filter(k => ID[k] === i).length;
    const xy = k => [(k % PW + .5) / S, (((k / PW) | 0) + .5) / S];
    const rdp = (P, e) => { if (P.length < 3) return P; let md = 0, mi = 0; const [ax, ay] = P[0], [bx, by] = P[P.length - 1], L = Math.hypot(bx - ax, by - ay) || 1; for (let i = 1; i < P.length - 1; i++) { const d = Math.abs((bx - ax) * (ay - P[i][1]) - (ax - P[i][0]) * (by - ay)) / L; if (d > md) { md = d; mi = i; } } return md > e ? [...rdp(P.slice(0, mi + 1), e).slice(0, -1), ...rdp(P.slice(mi), e)] : [P[0], P[P.length - 1]]; };
    const f1 = v => +v.toFixed(1);
    const curve = (P, a, b2) => { let d = `M${f1(P[a][0])} ${f1(P[a][1])}`; for (let i = a; i < b2; i++) { const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2; d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`; } return d; };
    const wd = a => Math.max(.4, Math.min(1.7, .4 + .3 * Math.log10(a / T0)));
    // pixels (foz -> nascente) viram até 3 trechos nascente -> foz, cada um mais largo que o anterior
    const emit = (px, mouth, trib) => {
      let pts = px.map(xy), av = px.map(k => acc[k]); if (mouth) { pts.unshift(mouth); av.unshift(av[0]); }
      pts.reverse(); av.reverse();
      for (let pass = 0; pass < 2; pass++) pts = pts.map((q, j) => j === 0 || j === pts.length - 1 ? q : [(pts[j - 1][0] + 2 * q[0] + pts[j + 1][0]) / 4, (pts[j - 1][1] + 2 * q[1] + pts[j + 1][1]) / 4]);
      const tag = pts.map((q, j) => [q[0], q[1], av[j]]), R = rdp(tag, .22); if (R.length < 2) return [];
      const n = R.length - 1, parts = trib || n < 4 ? 1 : n < 9 ? 2 : 3, o = [];
      for (let s = 0; s < parts; s++) { const a = Math.floor(n * s / parts), e = Math.floor(n * (s + 1) / parts); if (e > a) o.push([curve(R, a, e), +(wd(R[e][2]) * (trib ? .8 : 1)).toFixed(2)]); }
      return o;
    };
    const rivers = {}, stat = [];
    const cells = m.terr.map(() => []); for (let k = 0; k < NP; k++) if (ID[k] >= 0 && land[k]) cells[ID[k]].push(k);
    m.terr.forEach((t, i) => {
      const C = cells[i]; if (!want[i] || C.length < 40) return;
      // saídas: pixels do território cuja água vai para fora dele (mar ou vizinho)
      const leaves = k => { let n = dir[k]; for (let s = 0; s < 5 && n >= 0 && ID[n] === -2; s++) n = dir[n]; return n < 0 || ID[n] !== i; };
      const exits = C.filter(k => acc[k] >= T0 && leaves(k)).sort((a, c) => acc[c] - acc[a]).slice(0, 10);
      const cand = exits.map(k => { const P = up(k, i), L = inside(P, i); return { k, P, L, sc: L * Math.log(acc[k] + 1) }; }).filter(c => c.L >= 10).sort((a, c) => c.sc - a.sc);
      if (!cand.length) return;
      const out = [], used = new Set();
      const add = (c, trib) => {
        // foz: segue rio abaixo pela beira até o mar (no máximo 8 passos) e avança meio pixel mar adentro
        let px = c.P.slice(), mouth = null;
        if (!trib) { let k = px[0], n = dir[k], s = 0; while (n >= 0 && ID[n] === -2 && s++ < 8) { px.unshift(n); k = n; n = dir[n]; } if (n < 0) { const x = k % PW, y = (k / PW) | 0; let sx = 0, sy = 0; for (let d = 0; d < 8; d++) { const nx = x + DX[d], ny = y + DY[d]; if (nx < 0 || ny < 0 || nx >= PW || ny >= PH || !land[ny * PW + nx]) { sx += DX[d]; sy += DY[d]; } } const l = Math.hypot(sx, sy) || 1, q = xy(k); mouth = [q[0] + sx / l * .9, q[1] + sy / l * .9]; } }
        px.forEach(k => used.add(k)); out.push(...emit(px, mouth, trib));
      };
      add(cand[0]);
      const main = cand[0], a0 = acc[main.k];
      // afluentes do rio principal: os 3 maiores que têm bom trecho dentro do território
      const tr = []; main.P.forEach((k, j) => { const nxt = main.P[j + 1]; donors(k).forEach(n => { if (n !== nxt && acc[n] >= Math.max(T0 * 2.5, a0 * .06) && near(n, i)) { const P = [k, ...up(n, i, used)]; if (inside(P, i) >= 14) tr.push({ P, a: acc[n] }); } }); });
      tr.sort((a, c) => c.a - a.a).slice(0, 3).forEach(c => add(c, true));
      // segundo rio, de outra bacia, se for de porte parecido
      const sec = cand.find(c => c !== main && c.sc >= main.sc * .45 && !c.P.some(k => used.has(k))); if (sec) add(sec);
      rivers[i] = out; stat.push(out.length);
    });
    return { rivers, n: Object.keys(rivers).length, paths: stat.reduce((a, c) => a + c, 0) };
  }, { m, tiles, z, projSrc: PROJ[ID], S, want: WANT });
  const D = path.join(__dirname, 'relevo'), js = JSON.stringify(out.rivers); fs.mkdirSync(D, { recursive: true });
  fs.writeFileSync(path.join(D, ID + '-v.json'), js);
  console.log(ID, 'territórios com rio', out.n + '/' + WANT.filter(Boolean).length, 'traçados', out.paths, (js.length / 1024).toFixed(0) + 'KB');
  await b.close();
})();
