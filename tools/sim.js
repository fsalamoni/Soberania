// Simulação IA contra IA para equilíbrio: SC=<cenário> LEN=c|m|l REP=n node tools/sim.js
// Mostra rodadas, motivo e vencedor de cada partida; LOG=1 imprime a crônica da partida mais curta.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  p.on('pageerror', e => console.log('pageerror', e.message));
  await p.route('http://soberania.test/', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><body>' + html }));
  await p.goto('http://soberania.test/');
  const out = await p.evaluate(async ([SC, LEN, REP]) => {
    const S = window.__sob, res = [];
    for (const sc of S.SCEN.filter(s => !SC || SC.split(',').includes(s.id))) for (let k = 0; k < REP; k++) {
      const f = sc.f.filter(f => !f.late)[k % sc.f.filter(f => !f.late).length];
      S.startScenario(sc.id, f.id, 1, true, LEN);
      const G = S.G; G.auto = G.fast = true;
      await S.loop();
      const st = G.order.map(x => { const F = G.F[x]; return `${x}:${G.own.filter(o => o === x).length}t/${F.tech.length}k/${F.nB}b/${Math.round(F.stab)}s/${F.gold}g/${F.ww}w/${F.nC || 0}c`; }).join(' ');
      res.push({ sc: sc.id, r: G.round, why: G.why, w: G.winner, st, log: G.log.slice(0, 40).reverse().map(l => l[2] + ' ' + l[1]) });
    }
    return res;
  }, [process.env.SC || '', process.env.LEN || 'c', +(process.env.REP || 3)]);
  for (const g of out) console.log(g.sc, 'rodada', g.r, g.why, g.w, '|', g.st);
  if (process.env.LOG) { const g = out.sort((a, b) => a.r - b.r)[0]; console.log(g.log.join('\n')); }
  await b.close();
})();
