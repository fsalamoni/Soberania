// Lista territórios por mapa (para autorar terreno e jazidas): node tools/list-terr.js [mapa]
const m = JSON.parse(require('fs').readFileSync(__dirname + '/../maps/maps.json', 'utf8'));
for (const [k, v] of Object.entries(m)) if (!process.argv[2] || process.argv[2] === k)
  console.log(k, v.terr.length, '\n  ' + v.regions.map((r, ri) => r + ': ' + v.terr.filter(t => t.r === ri).map(t => t.n).join(', ')).join('\n  '));
