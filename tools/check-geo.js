// Confere se src/geo.js cobre todos os territórios de maps/maps.json: node tools/check-geo.js
const fs = require('fs');
const m = JSON.parse(fs.readFileSync(__dirname + '/../maps/maps.json', 'utf8'));
const GEO = new Function(fs.readFileSync(__dirname + '/../src/geo.js', 'utf8') + '; return {GEO, TERR, DEP};')();
let bad = 0;
for (const [k, v] of Object.entries(m)) {
  const g = GEO.GEO[k] || {};
  for (const t of v.terr) {
    const s = g[t.n];
    if (!s) { console.log('falta', k, t.n); bad++; continue; }
    const [tt, ds] = s.split(' ');
    if (!GEO.TERR[tt[0]]) { console.log('terreno?', k, t.n, tt); bad++; }
    for (const d of (ds || '').split(',').filter(Boolean)) if (!GEO.DEP[d]) { console.log('jazida?', k, t.n, d); bad++; }
  }
  for (const n of Object.keys(g)) if (!v.terr.some(t => t.n === n)) { console.log('sobra', k, n); bad++; }
}
console.log(bad ? bad + ' problemas' : 'geo ok');
