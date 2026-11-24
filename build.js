// Junta shell + mapas + dados + jogo em index.html (arquivo único).
const fs = require('fs'), r = f => fs.readFileSync(__dirname + '/' + f, 'utf8');
const out = r('src/shell.html').replace('__MAPS__', () => r('maps/maps.json')).replace('__DATA__', () => r('src/rules.js') + r('src/geo.js') + r('src/data.js') + r('src/data2.js')).replace('__GAME__', () => r('src/game.js'));
fs.writeFileSync(__dirname + '/index.html', out);
console.log('index.html', (out.length / 1024).toFixed(0) + 'KB');
