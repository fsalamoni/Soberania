// Teste v3: joga todos os cenários em modo automático e exercita a interface nova.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const shot = n => path.join(__dirname, 'shots', n + '.png');
const ok = (c, m) => { if (!c) { console.log('FALHOU:', m); process.exitCode = 1; } };
(async () => {
  fs.mkdirSync(path.join(__dirname, 'shots'), { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 860 } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message + '\n' + e.stack));
  p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_|net::/.test(m.text())) errs.push('console: ' + m.text()); });
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  await p.route('http://soberania.test/', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + html + '</body></html>' }));
  await p.goto('http://soberania.test/');
  await p.screenshot({ path: shot('setup') });
  const REP = +(process.env.REP || 1);
  const res = await p.evaluate(async ([REP, ONLY, LEN]) => {
    const S = window.__sob, out = [];
    for (const sc of S.SCEN.filter(s => !ONLY || s.id === ONLY)) for (const f of sc.f.filter(f => !f.late)) for (let k = 0; k < REP; k++) {
      try {
        S.startScenario(sc.id, f.id, 1, true, LEN);
        const G = S.G; G.auto = true; G.fast = true;
        await S.loop();
        const cnt = re => G.log.filter(l => re.test(l[1])).length;
        const leg = G.order.map(x => window.__sob.G.F[x]).map(F => F.tech.length).reduce((a, b) => Math.max(a, b), 0);
        out.push([sc.id, f.id, G.round, G.why, G.winner, G.order.reduce((s, x) => s + G.F[x].nB, 0), G.order.reduce((s, x) => s + G.F[x].tech.length, 0), cnt(/ por influência/), cnt(/declara campanha/), cnt(/ usa /), cnt(/bombardeia/), leg]);
      } catch (e) { out.push([sc.id, f.id, 'ERRO ' + e.message + ' ' + e.stack.split('\n')[1]]); }
    }
    return out;
  }, [REP, process.env.ONLY || '', process.env.LEN || 'c']);
  const by = {};
  for (const r of res) (by[r[0]] = by[r[0]] || []).push(r);
  for (const [k, v] of Object.entries(by)) {
    const err = v.filter(r => typeof r[2] === 'string');
    if (err.length) { console.log(k, err[0][2]); process.exitCode = 1; continue; }
    const rounds = v.map(r => r[2]), why = {}, win = {};
    v.forEach(r => { why[r[3]] = (why[r[3]] || 0) + 1; win[r[4]] = (win[r[4]] || 0) + 1; });
    const avg = c => (v.reduce((s, r) => s + r[c], 0) / v.length).toFixed(1);
    console.log(k.padEnd(8), 'rodadas', Math.min(...rounds) + '-' + Math.max(...rounds), 'méd', avg(2), JSON.stringify(why), 'venc', JSON.stringify(win), '| por jogo: obras', avg(5), 'tec', avg(6), 'influ', avg(7), 'campanhas', avg(8), 'cartas', avg(9), 'ar', avg(10), 'maxTec', avg(11));
  }
  // interface: Regências, jogador = Farrapos
  const clickT = async n => p.evaluate(n => { const G = window.__sob.G, i = G.ix[n]; const el = document.querySelector(`g.b[data-i="${i}"]`); const r = el.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, n).then(([x, y]) => p.mouse.click(x, y));
  await p.evaluate(() => window.__sob.startScenario('reg', 'fa', 1));
  await p.screenshot({ path: shot('intro') });
  await p.click('#modal [data-m="0"]');
  await p.waitForFunction(() => window.__sob.G.turnF === 'fa', null, { timeout: 30000 });
  await p.screenshot({ path: shot('reforcos') });
  await p.evaluate(() => { const G = window.__sob.G; G.sel = G.ix['Rio Grande do Sul']; G.tr[G.sel] += 10; });
  await p.click('[data-a=all]');
  await p.click('[data-a=toAtk]');
  // governo (v5): abre as obras (1 ação), põe mercado e oficina na fila, escolhe pesquisa (sem ação) e declara campanha
  await p.evaluate(() => { window.__sob.G.F.fa.gold = 60; window.__sob.G.F.fa.sci = 5; window.__sob.render(); });
  await p.click('[data-a=act][data-k=obras]');
  ok(await p.evaluate(() => { const F = window.__sob.G.F.fa; return F.bldOn && F.pa === 2; }), 'abrir obras gasta 1 ação');
  await p.click('[data-a=bld][data-k=mer]');
  await p.screenshot({ path: shot('construir') });
  await clickT('Rio Grande do Sul');
  await p.click('[data-a=bld][data-k=ofi]');
  await clickT('Rio Grande do Sul');
  ok(await p.evaluate(() => { const G = window.__sob.G, q = G.q[G.ix['Rio Grande do Sul']]; return q.length === 2 && q[0].k === 'mer' && G.F.fa.pa === 2; }), 'duas obras na fila sem gastar mais ações');
  ok(await p.evaluate(() => { const G = window.__sob.G, i = G.ix['Rio Grande do Sul']; return window.__sob.act('fa', 'rush', i, 0) !== ''; }), 'não apressa no turno em que a obra começou');
  // parte 3: zonas pedem terreno ou jazida e cabem no nível do território
  ok(await p.evaluate(() => { const G = window.__sob.G, S = window.__sob, i = G.ix['Rio Grande do Sul']; const a = S.act('fa', 'bld', 'flo', i) !== '', b = S.act('fa', 'bld', 'pec', i) === ''; S.act('fa', 'unq', i, 2); return a && b && G.q[i].length === 2; }), 'zona florestal recusada na pradaria, pecuária aceita');
  ok(await p.evaluate(() => { const G = window.__sob.G, S = window.__sob, i = G.own.findIndex((o, j) => o === 'fa' && G.lv[j] === 1 && j !== G.F.fa.capI && !G.q[j].length); if (i < 0) return 'skip'; const z = Object.keys(S.STRUCT).filter(k => S.STRUCT[k].z && S.act('fa', 'bld', k, i) === ''); return z.length === 1; }), 'aldeia aceita só uma zona');
  // parte 4: cadeia (banco exige mercado pronto) e catálogo
  ok(await p.evaluate(() => { const G = window.__sob.G, S = window.__sob, i = G.ix['Rio Grande do Sul']; G.F.fa.tech.push('com'); const r = S.act('fa', 'bld', 'ban', i) !== ''; G.F.fa.tech.pop(); return r; }), 'banco recusado sem mercado pronto');
  await p.click('[data-a=catalog]');
  ok(await p.evaluate(() => document.querySelectorAll('#modal .tech').length > 40), 'catálogo lista as construções');
  await p.screenshot({ path: shot('catalogo') });
  await p.click('#modal [data-m="0"]');
  // parte 5: estrada nos dois lados liga a rede e aparece no mapa; remanejamento anda 2 pela estrada
  ok(await p.evaluate(() => { const G = window.__sob.G, a = G.ix['Rio Grande do Sul'], b = G.ix['Santa Catarina']; if (G.own[b] !== 'fa') return 'skip'; G.bld[a].push('est'); G.bld[b].push('est'); window.__sob.render(); const n = document.querySelectorAll('#roads line').length; G.bld[a].pop(); G.bld[b].pop(); window.__sob.render(); return n === 1; }), 'estrada entre dois territórios aparece no mapa');
  // parte 6: painel de comércio abre e lista rotas
  await p.click('[data-a=routes]');
  ok(await p.evaluate(() => /Comércio/.test(document.querySelector('#modal').textContent)), 'painel de comércio abre');
  await p.click('#modal [data-m="0"]');
  await p.click('[data-a=lens][data-l=net]');
  await p.screenshot({ path: shot('lente-rede') });
  await p.click('[data-a=lens][data-l=ter]');
  ok(await p.evaluate(() => { const G = window.__sob.G, i = G.ix['Rio Grande do Sul']; return document.querySelector(`#map path[data-i="${i}"]`)?.getAttribute('fill') === '#93a24a' || document.querySelectorAll('#map [fill="#93a24a"]').length > 0; }), 'lente de terreno recolore o mapa');
  await p.screenshot({ path: shot('lente-terreno') });
  await p.click('[data-a=lens][data-l=own]');
  ok(await p.evaluate(() => /Jazidas/.test(document.querySelector('#info').textContent)), 'painel mostra jazidas do território');
  ok(await p.evaluate(() => /Saúde/.test(document.querySelector('#info').textContent) && /Felicidade/.test(document.querySelector('#me').textContent)), 'painel mostra saúde, estabilidade local e felicidade');
  await p.click('[data-a=works]');
  await p.screenshot({ path: shot('obras-imperio') });
  await p.click('#modal [data-m="0"]');
  await p.click('[data-a=techs]');
  await p.click('[data-a=tech][data-k=adm]');
  await p.screenshot({ path: shot('tecnologias') });
  ok(await p.evaluate(() => /Idade Média/.test(document.querySelector('#modal').textContent) && /libera:/.test(document.querySelector('#modal').textContent) && window.__sob.G.F.fa.tech.includes('agri')), 'árvore por era mostra o que cada tecnologia libera');
  ok(await p.evaluate(() => { const F = window.__sob.G.F.fa; return F.res === 'adm' && !F.tech.includes('adm') && F.pa === 2; }), 'pesquisa escolhida sem gastar ação');
  await p.click('#modal [data-m="0"]');
  await p.click('[data-a=figm]');
  ok(await p.evaluate(() => /Grandes figuras/.test(document.querySelector('#modal').textContent) && /Governadores/.test(document.querySelector('#modal').textContent)), 'painel de personagens');
  await p.click('#modal [data-m="0"]');
  await p.click('[data-a=govm]');
  await p.screenshot({ path: shot('governo') });
  ok(await p.evaluate(() => /Cívicas/.test(document.querySelector('#modal').textContent) && /atual/.test(document.querySelector('#modal').textContent) && !!window.__sob.G.F.fa.gov), 'painel de governo, cívicas e fé');
  await p.click('#modal [data-m="0"]');
  await p.click('[data-a=dipl]');
  await p.screenshot({ path: shot('diplomacia') });
  ok(await p.evaluate(() => /relação/.test(document.querySelector('#modal').textContent) && document.querySelectorAll('#modal [data-a=dprop]').length > 0), 'painel diplomático lista facções, relação e propostas');
  await p.click('#modal [data-m="0"]');
  await p.click('[data-a=act][data-k=camp]');
  await p.screenshot({ path: shot('acoes') });
  await clickT('Rio Grande do Sul'); await clickT('Santa Catarina');
  await p.screenshot({ path: shot('batalha') });
  await p.click('[data-a=blitz]'); await p.waitForTimeout(1500);
  await p.screenshot({ path: shot('pos-batalha') });
  if (await p.$('[data-a=occupy]')) {
    const max = await p.$eval('#mvR', e => +e.max);
    ok(max <= 3, 'transferência limitada aos dados, max=' + max);
    await p.click('[data-a=occupy]');
  } else await p.click('[data-a=bclose]');
  // remanejamento: divide tropas de RS entre dois vizinhos e confere que não andam de novo
  await p.click('[data-a=toMov]');
  const st = await p.evaluate(() => { const G = window.__sob.G, i = G.ix['Rio Grande do Sul']; return { mv: G.mv[i], tr: G.tr[i], nb: G.A[i].filter(j => G.own[j] === 'fa').map(j => G.m.terr[j].n) }; });
  console.log('remanejo RS', JSON.stringify(st));
  ok(st.mv === st.tr - 1, 'snapshot de remanejamento');
  if (st.nb.length && st.mv >= 2) {
    await clickT('Rio Grande do Sul'); await clickT(st.nb[0]);
    await p.$eval('#mvR', e => { e.value = 1; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await p.click('[data-a=move]');
    const before = await p.evaluate(n => { const G = window.__sob.G; return G.mv[G.ix[n]]; }, st.nb[0]);
    const after = await p.evaluate(n => { const G = window.__sob.G; return { rs: G.mv[G.ix['Rio Grande do Sul']], dst: G.mv[G.ix[n]] }; }, st.nb[0]);
    ok(after.rs === st.mv - 1 && after.dst === 0 && before === 0, 'move parcial; quem chegou não anda de novo ' + JSON.stringify(after));
    await p.screenshot({ path: shot('remanejo') });
  }
  await p.click('[data-a=end]');
  await p.waitForTimeout(300);
  await p.evaluate(() => { window.__sob.G.fast = true; });
  await p.waitForFunction(() => window.__sob.G.turnF === 'fa' || window.__sob.G.over, null, { timeout: 30000 });
  console.log('turno 2 ok, rodada', await p.evaluate(() => window.__sob.G.round));
  const t2 = await p.evaluate(() => { const G = window.__sob.G, i = G.ix['Rio Grande do Sul'], F = G.F.fa; return { own: G.own[i], q: G.q[i].map(x => x.k + ':' + x.p), bld: G.bld[i], sci: F.sci, res: F.res, tech: F.tech }; });
  console.log('turno 2', JSON.stringify(t2));
  if (t2.own === 'fa') ok(t2.q.length + t2.bld.length >= 2 && (t2.bld.length || +t2.q[0].split(':')[1] > 0), 'obras avançaram com a produção');
  ok(t2.tech.includes('adm') || t2.res === 'adm', 'pesquisa continua ou concluiu');
  // apressar no turno seguinte
  const rushed = await p.evaluate(() => { const G = window.__sob.G, S = window.__sob, i = G.ix['Rio Grande do Sul']; if (G.own[i] !== 'fa' || !G.q[i].length) return 'skip'; G.F.fa.gold = 99; G.F.fa.pa = 3; G.phase = 'atk'; S.act('fa', 'obras'); const n = G.bld[i].length; return S.act('fa', 'rush', i, 0) === '' && G.bld[i].length === n + 1; });
  ok(rushed === 'skip' || rushed === true, 'apressar com ouro conclui a obra');
  // salvar em espaço manual
  await p.click('[data-a=save]'); await p.click('[data-a=slot][data-n="1"]');
  ok(await p.evaluate(() => !!localStorage.getItem('soberania-v5-1')), 'salvo no espaço 1');
  await p.click('#modal [data-m="0"]');
  ok(await p.evaluate(() => !!localStorage.getItem('soberania-v5')), 'jogo salvo');
  const rd = await p.evaluate(() => window.__sob.G.round);
  await p.evaluate(() => window.__sob.resume()); await p.waitForTimeout(300);
  ok(await p.evaluate(rd => window.__sob.G.turnF === 'fa' && window.__sob.G.round === rd, rd), 'continuar partida');
  // cartas de benefício: +4 tropas em Reforços sem gastar ação
  await p.evaluate(() => { const G = window.__sob.G, F = G.F.fa; F.cards = [{ k: 0 }, { k: 4 }]; G.phase = 'ref'; window.__sob.render(); });
  await p.click('[data-a=zfit]');
  await p.screenshot({ path: shot('cartas') });
  const r0 = await p.evaluate(() => window.__sob.G.F.fa.reinf);
  await p.click('[data-a=card][data-h="0"]');
  const r1 = await p.evaluate(() => window.__sob.G.F.fa.reinf);
  ok(r1 === r0 + 4, `carta de reforço rende 4 (${r0} -> ${r1})`);
  // mundo, aviação
  await p.evaluate(() => window.__sob.startScenario('ww2', 'uk', 1));
  await p.click('#modal [data-m="0"]');
  await p.waitForFunction(() => window.__sob.G.turnF === 'uk', null, { timeout: 30000 });
  await p.evaluate(() => { const G = window.__sob.G, F = G.F.uk; G.tr[F.capI] += F.reinf; F.reinf = 0; window.__sob.render(); });
  await p.click('[data-a=all]').catch(() => { });
  await p.click('[data-a=toAtk]');
  await p.click('[data-a=act][data-k=camp]');
  const planes = await p.evaluate(() => window.__sob.G.F.uk.planes);
  console.log('aviões UK', planes);
  if (planes) {
    await p.click('[data-a=air]');
    await p.screenshot({ path: shot('ar-alvos') });
    const t = await p.evaluate(() => { const G = window.__sob.G; for (let j = 0; j < G.N; j++) if (G.own[j] === 'de' && G.tr[j] >= 2) return G.m.terr[j].n; });
    if (t) { await clickT(t); await p.waitForTimeout(200); await p.screenshot({ path: shot('ar-ataque') }); }
  }
  await p.mouse.move(560, 300); for (let k = 0; k < 6; k++) await p.mouse.wheel(0, -200);
  await p.waitForTimeout(200);
  await p.screenshot({ path: shot('mundo-zoom') });
  // mongóis com América fora do mundo conhecido; mapas novos
  for (const [id, f] of [['mongol', 'mo'], ['sengoku', 'oda'], ['viking', 'no'], ['precol', 'in'], ['queda', 'oc']]) {
    await p.evaluate(([id, f]) => window.__sob.startScenario(id, f, 1), [id, f]);
    await p.waitForTimeout(150); await p.screenshot({ path: shot('intro-' + id) });
    await p.click('#modal [data-m="0"]'); await p.waitForTimeout(250);
    await p.screenshot({ path: shot('mapa-' + id) });
  }
  // tela inicial com abas
  await p.evaluate(() => document.querySelector('[data-a=menu]').click());
  await p.click('#modal [data-m="0"]').catch(() => { });
  await p.click('[data-a=tab][data-t="Antiguidade"]');
  await p.screenshot({ path: shot('setup-antiguidade'), fullPage: true });
  // celular
  await p.setViewportSize({ width: 390, height: 844 });
  await p.evaluate(() => window.__sob.startScenario('sengoku', 'oda', 1));
  await p.click('#modal [data-m="0"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: shot('phone-sengoku') });
  console.log(errs.length ? errs.join('\n') : 'sem erros');
  await b.close();
})();
