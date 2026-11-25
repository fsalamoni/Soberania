// Junta shell + mapas + dados + jogo em index.html (arquivo único).
const fs = require('fs'), r = f => fs.readFileSync(__dirname + '/' + f, 'utf8');
// relevo real (maps/relevo/<mapa>-s.webp e -c.webp) embutido como data URI
const relief = () => { const D = __dirname + '/maps/relevo', o = {}; if (!fs.existsSync(D)) return o; for (const f of fs.readdirSync(D)) { const [, id, k] = f.match(/^(.+)-([sc])\.webp$/) || []; if (id) (o[id] = o[id] || {})[k] = 'data:image/webp;base64,' + fs.readFileSync(D + '/' + f).toString('base64'); } return o; };
const out = r('src/shell.html').replace('__MAPS__', () => r('maps/maps.json')).replace('__DATA__', () => r('src/rules.js') + r('src/geo.js') + r('src/data.js') + r('src/data2.js')).replace('__GAME__', () => r('src/game.js')).replace('__RELIEF__', () => JSON.stringify(relief()));
fs.writeFileSync(__dirname + '/index.html', out);
console.log('index.html', (out.length / 1024).toFixed(0) + 'KB');
