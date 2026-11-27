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
  const clickT = async n => p.evaluate(n => { const G = window.__sob.G, i = G.ix[n]; const el = document.querySelector(`g.b[data-i="${i}"] .bc`); const r = el.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, n).then(([x, y]) => p.mouse.click(x, y)).then(() => p.evaluate(() => { window.__sob.G.tab = "imp"; window.__sob.render(); }));
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
  await p.click('#ptabs [data-k=obr]');
  const bldVia = k => p.evaluate(k => { const G = window.__sob.G; G.osub = 'con'; bcat = sCat(k); render(); document.querySelector(`#works [data-a=bldAt][data-k=${k}][data-i="${G.ix['Rio Grande do Sul']}"]`).click(); }, k);
  await bldVia('mer');
  ok(await p.evaluate(() => { const F = window.__sob.G.F.fa; return F.bldOn && F.pa === 99; }), 'abrir obras não gasta ação (v24: sem limite)');
  await p.screenshot({ path: shot('construir') });
  await bldVia('ofi');
  await p.evaluate(() => { window.__sob.G.tab = 'imp'; render(); });
  ok(await p.evaluate(() => { const G = window.__sob.G, q = G.q[G.ix['Rio Grande do Sul']]; return q.length === 2 && q[0].k === 'mer' && G.F.fa.pa === 99; }), 'duas obras na fila sem gastar mais ações');
  ok(await p.evaluate(() => { const G = window.__sob.G, i = G.ix['Rio Grande do Sul']; return window.__sob.act('fa', 'rush', i, 0) !== ''; }), 'não apressa no turno em que a obra começou');
  // parte 3: zonas pedem terreno ou jazida e cabem no nível do território
  ok(await p.evaluate(() => { const G = window.__sob.G, S = window.__sob, i = G.ix['Rio Grande do Sul']; const a = S.act('fa', 'bld', 'flo', i) !== '', b = S.act('fa', 'bld', 'pec', i) === ''; S.act('fa', 'unq', i, 2); return a && b && G.q[i].length === 2; }), 'zona florestal recusada na pradaria, pecuária aceita');
  ok(await p.evaluate(() => { const G = window.__sob.G, S = window.__sob, i = G.own.findIndex((o, j) => o === 'fa' && G.lv[j] === 1 && j !== G.F.fa.capI && !G.q[j].length); if (i < 0) return 'skip'; const z = Object.keys(S.STRUCT).filter(k => S.STRUCT[k].z && S.act('fa', 'bld', k, i) === ''); return z.length === 1; }), 'aldeia aceita só uma zona');
  // parte 4: cadeia (banco exige mercado pronto) e catálogo
  ok(await p.evaluate(() => { const G = window.__sob.G, S = window.__sob, i = G.ix['Rio Grande do Sul']; G.F.fa.tech.push('com'); const r = S.act('fa', 'bld', 'ban', i) !== ''; G.F.fa.tech.pop(); return r; }), 'banco recusado sem mercado pronto');
  await p.evaluate(() => catalogModal());
  ok(await p.evaluate(() => document.querySelectorAll('#modal .tech').length > 40), 'catálogo lista as construções');
  await p.screenshot({ path: shot('catalogo') });
  await p.click('#modal [data-m="0"]');
  // parte 5: estrada nos dois lados liga a rede e aparece no mapa; remanejamento anda 2 pela estrada
  ok(await p.evaluate(() => { const G = window.__sob.G, a = G.ix['Rio Grande do Sul'], b = G.ix['Santa Catarina']; if (G.own[b] !== 'fa') return 'skip'; G.bld[a].push('est'); G.bld[b].push('est'); window.__sob.render(); const n = document.querySelectorAll('#roads line').length; G.bld[a].pop(); G.bld[b].pop(); window.__sob.render(); return n === 1; }), 'estrada entre dois territórios aparece no mapa');
  // parte 6: painel de comércio abre e lista rotas
  await p.click('#cmd [data-g=eco]'); await p.click('.cmdm [data-a=routes]');
  ok(await p.evaluate(() => /Comércio/.test(document.querySelector('#modal').textContent)), 'painel de comércio abre');
  await p.click('#modal [data-m="0"]');
  await p.click('[data-a=lens][data-l=net]');
  await p.screenshot({ path: shot('lente-rede') });
  await p.click('[data-a=lens][data-l=ter]');
  ok(await p.evaluate(() => { const G = window.__sob.G, i = G.ix['Rio Grande do Sul']; return document.querySelector(`#map path[data-i="${i}"]`)?.getAttribute('fill') === '#93a24a' || document.querySelectorAll('#map [fill="#93a24a"]').length > 0; }), 'lente de terreno recolore o mapa');
  await p.screenshot({ path: shot('lente-terreno') });
  await p.click('[data-a=lens][data-l=own]');
  await p.evaluate(() => { window.__sob.G.rsub = 'det'; window.__sob.render(); }); // v50: jazidas e saúde ficam na sub-aba Detalhes
  ok(await p.evaluate(() => /Jazidas/.test(document.querySelector('#info').textContent)), 'painel mostra jazidas do território');
  ok(await p.evaluate(() => /Saúde/.test(document.querySelector('#info').textContent) && /Felicidade/.test(document.querySelector('#me').textContent)), 'painel mostra saúde, estabilidade local e felicidade');
  await p.click('#ptabs [data-k=obr]');
  await p.screenshot({ path: shot('obras-imperio') });
  ok(await p.evaluate(() => { const G = window.__sob.G, vis = s => { const e = document.querySelector(s); return !!e && e.offsetParent !== null; }; G.osub = 'fil'; render(); const a = vis('#works') && !vis('#phase') && document.querySelectorAll('#works .rbox').length === owned(G.player).length; G.osub = 'cad'; render(); const b = document.querySelectorAll('#works ul.chain li').length > 20; G.osub = 'con'; render(); const c = document.querySelectorAll('#works .fic').length > 0 && !document.querySelector('#phase [data-k=obras]'); G.osub = 'fil'; G.tab = 'imp'; render(); return a && b && c; }), 'aba Obras: filas, construir e cadeias, fora das ações do império');
  await p.click('#cmd [data-a=techs]');
  await p.click('[data-a=tech][data-k=adm]');
  await p.screenshot({ path: shot('tecnologias') });
  ok(await p.evaluate(() => { const a = civScenario({ seed: 5, size: 'p', type: 'pan' }), b = civScenario({ seed: 5, size: 'p', type: 'pan' }); return a.f.length === 4 && a._m.terr.length === 40 && JSON.stringify(a._m) === JSON.stringify(b._m); }), 'modo Civilização: mesma semente, mesmo mundo');
  ok(await p.evaluate(() => /Era da Informação/.test(document.querySelector('#modal').textContent) && !!window.__sob.STRUCT.cpa), 'árvore chega à Era da Informação');
  ok(await p.evaluate(() => /Idade Média/.test(document.querySelector('#modal').textContent) && /libera:/.test(document.querySelector('#modal').textContent) && window.__sob.G.F.fa.tech.includes('agri')), 'árvore por era mostra o que cada tecnologia libera');
  ok(await p.evaluate(() => { techModal(); const n = document.querySelectorAll('#modal .tech').length, gh = document.querySelectorAll('#modal .ghost').length, r = n < TECH.length && /ainda ocultas/.test(document.querySelector('#modal').textContent) && [...document.querySelectorAll('#modal .ghost')].every(e => !/Pesquisar/.test(e.textContent)); return r && gh >= 0; }), 'árvore mostra só o que está perto e esconde o resto');
  ok(await p.evaluate(() => { const F = window.__sob.G.F.fa; return F.res === 'adm' && !F.tech.includes('adm') && F.pa === 99; }), 'pesquisa escolhida sem gastar ação');
  await p.click('#modal [data-m="0"]');
  await p.click('#cmd [data-g=gov]'); await p.click('.cmdm [data-a=figm]');
  ok(await p.evaluate(() => /Grandes figuras/.test(document.querySelector('#modal').textContent) && /Governadores/.test(document.querySelector('#modal').textContent)), 'painel de personagens');
  await p.click('#modal [data-m="0"]');
  ok(await p.evaluate(() => /Guia/.test(document.querySelector('.guide')?.textContent || '')), 'guia da primeira partida aparece');
  ok(await p.evaluate(() => [...document.querySelectorAll('.b .lvn')].some(e => e.textContent) && document.querySelectorAll('.sealinks > g').length === window.__sob.G.m.sea.length), 'marcador mostra o porte e cada travessia tem seu desenho');
  ok(await p.evaluate(() => { const G = window.__sob.G, i = G.F[G.player].capI; G.sel = i; G.rsub = 'det'; render(); const L = [], y = yieldOf(i, L); return !!document.querySelector('.ledger summary') && ['food', 'prod', 'gold', 'sci'].every(r => L.filter(x => x[0] === r).reduce((s, x) => s + x[1], 0) === y[r]); }), 'painel da região mostra cada ganho com a causa');
  await p.evaluate(() => document.querySelector('[data-a=empire]').click());
  ok(await p.evaluate(() => /Soma das regiões/.test(document.querySelector('#modal').textContent)), 'resumo do império soma as regiões');
  ok(await p.evaluate(() => { const G = window.__sob.G, i = G.F[G.player].capI, p0 = porte(i), f0 = G.food[i]; G.food[i] = 999; const h = housing(i), ok0 = growOk(i); G.sub = G.sub || Array(G.N).fill(0); const s0 = G.sub[i], l0 = G.lv[i]; grow(G.player); const p1 = porte(i); G.lv[i] = l0; G.sub[i] = s0; G.food[i] = f0; return PORTE.length === 9 && h >= 3 && (ok0 ? p1 === p0 + 1 : p1 === p0); }), 'porte cresce um passo só com moradia e empregos');
  ok(await p.evaluate(() => { document.querySelector('[data-a=lens][data-l=rel]').click(); const ok1 = /url\(#tr-|^#0000$/.test(document.querySelector('path.t[data-i="' + window.__sob.G.F[window.__sob.G.player].capI + '"]').getAttribute('fill')) && document.querySelectorAll('#rib path.rb').length === window.__sob.G.N; document.querySelector('[data-a=lens][data-l=own]').click(); return ok1; }), 'visão de relevo desenha o terreno e a faixa dos impérios');
  ok(await p.evaluate(() => { const c = l => document.querySelector(`[data-a=lens][data-l=${l}]`).click(); c('ter'); const t = !$('#lgd').hidden && $('#lgd').querySelectorAll('i').length > 0; c('own'); return t && $('#lgd').hidden; }), 'legenda aparece nas lentes e some no mapa de donos');
  ok(await p.evaluate(() => { const f = G.player, s = settled(f).filter(i => G.lv[i]), pr = s.flatMap(a => s.filter(b => b !== a && supWay(f, a, b)).map(b => [a, b]))[0]; if (!pr) return true; const [a, b] = pr, n0 = G.routes.length, g0 = Fa(f).gold; Fa(f).gold += 10; const e = openSup(f, a, b, 'prod'), r = G.routes[G.routes.length - 1]; r.s = G.round; const v = supAmt(r), ok1 = !e && v > 0 && supNet(b, 'prod') === v && supNet(a, 'prod') === -v && regionNet(b).L.some(x => /Abastecimento de/.test(x[2])); G.occ[b] = 1; const ok2 = supAmt(r) === 0; G.occ[b] = 0; G.routes.length = n0; Fa(f).gold = g0; return ok1 && ok2; }), 'abastecimento leva produção entre regiões e é cortado pela ocupação');
  ok(await p.evaluate(() => { const f = G.player, F = Fa(f), sv = F.fx; F.fx = []; const i = F.capI, r0 = reinfOf(f).r, g0 = growNeed(i); F.fx = [['RF', 2], ['CP', 'gold', 2], ['CR', 50]]; const L = []; yieldOf(i, L); const ok1 = reinfOf(f).r === r0 + 2 && L.some(x => x[0] === 'gold' && x[1] === 2 && /⚜/.test(x[2])) && growNeed(i) < g0 && /reforço/.test(ldText(F.fx)); F.fx = sv; return ok1; }), 'poderes do líder entram em reforços, rendimento e crescimento');
  await p.click('#modal [data-m="0"]');
  ok(await p.evaluate(() => { const G = window.__sob.G, i = G.A.findIndex((a, k) => a.some(j => !G.seaK.has(k * 1e4 + j))), j = G.A[i].find(j => !G.seaK.has(i * 1e4 + j)); return /^M[^C]+C/.test(roadD(i, j)) && Object.keys(RELIEF.japao.r).length > 40; }), 'estradas com traçado curvo (e contornando serras no Japão)');
  ok(await p.evaluate(() => { const G = window.__sob.G, c = G.F[G.player].capI; return !!document.querySelector(`g.b[data-i="${c}"] .sv .city`) && Object.keys(STRUCT).every(k => STRUCT[k].road || SV[svOf(k)]); }), 'construções desenhadas em volta da capital, todas com desenho');
  await p.evaluate(() => document.querySelector('[data-a=vicm]').click()); // sem rolar a página
  ok(await p.evaluate(() => /Ciência/.test(document.querySelector('#modal').textContent) && /Fé/.test(document.querySelector('#modal').textContent)), 'painel de vitórias com o progresso');
  await p.click('#modal [data-m="0"]');
  await p.click('#cmd [data-g=gov]'); await p.click('.cmdm [data-a=govm]');
  await p.screenshot({ path: shot('governo') });
  ok(await p.evaluate(() => /Cívicas/.test(document.querySelector('#modal').textContent) && /atual/.test(document.querySelector('#modal').textContent) && !!window.__sob.G.F.fa.gov), 'painel de governo, cívicas e fé');
  await p.click('#modal [data-m="0"]');
  await p.click('#cmd [data-g=dip]'); await p.click('.cmdm [data-a=dipl]');
  await p.screenshot({ path: shot('diplomacia') });
  ok(await p.evaluate(() => /relação/.test(document.querySelector('#modal').textContent) && document.querySelectorAll('#modal [data-a=dprop]').length > 0), 'painel diplomático lista facções, relação e propostas');
  await p.click('#modal [data-m="0"]');
  await p.click('#cmd [data-g=mil]'); await p.click('.cmdm [data-k=camp]');
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
  await p.click('#cmd [data-g=mil]'); await p.click('.cmdm [data-k=camp]');
  const planes = await p.evaluate(() => window.__sob.G.F.uk.planes);
  console.log('aviões UK', planes);
  if (planes) {
    await p.click('#cmd [data-g=mil]'); await p.click('.cmdm [data-a=air]');
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
  // líderes na criação: cartões, escolha e salvamento
  await p.evaluate(() => document.querySelector('[data-a=menu]').click());
  await p.click('#modal [data-m="0"]').catch(() => { });
  await p.click('[data-a=tab][data-t="Todos"]');
  await p.click('[data-a=sc][data-s=nap]'); await p.click('[data-a=fp][data-f=fr]');
  ok(await p.evaluate(() => document.querySelectorAll('#lds .ldc').length === 3), 'cartões dos líderes na criação');
  await p.click('[data-a=ldp][data-k="2"]'); await p.click('[data-a=start]'); await p.click('#modal [data-m="0"]').catch(() => { });
  ok(await p.evaluate(() => { const G = window.__sob.G, F = G.F.fr; return F.L === 'Lazare Carnot' && F.ab === 'recrutador' && G.F.gb.L === 'William Pitt, o Jovem' && /Lazare Carnot/.test(snapshot()) && /⚜/.test(document.querySelector('#me').textContent); }), 'líder escolhido vale na partida e vai para o salvamento');
  // v42: barra de ação fixa, atalhos e painéis recolhíveis
  ok(await p.evaluate(() => { const b = document.querySelector('#actbar'), r = b.getBoundingClientRect(); return !!b.querySelector('button.pri') && r.bottom <= innerHeight + 1 && r.top < innerHeight; }), 'barra de ação visível sem rolar');
  await p.keyboard.press('?');
  ok(await p.evaluate(() => /Atalhos de teclado/.test(document.querySelector('#modal').textContent)), 'tecla ? abre os atalhos');
  await p.keyboard.press('Escape');
  ok(await p.evaluate(() => document.querySelector('#modal').hidden), 'Esc fecha a janela');
  await p.keyboard.press('3');
  ok(await p.evaluate(() => window.__sob.G.lens === 'ter'), 'tecla 3 troca a lente');
  await p.keyboard.press('1');
  ok(await p.evaluate(() => { const h = document.querySelector('#tech>h4.fh4'); h.click(); const a = h.parentElement.classList.contains('fold'); h.click(); return a !== h.parentElement.classList.contains('fold'); }), 'painel de tecnologia recolhe e abre');
  ok(await p.evaluate(() => lc('#1c2a8a') !== '#1c2a8a' && /^rgb/.test(lc('#1c2a8a'))), 'cor de facção escura é clareada para contraste');
  // v43: desgaste da blitz e guerra defensiva
  ok(await p.evaluate(() => { const G = window.__sob.G, f = G.player, F = G.F[f], c0 = F.cq; F.cq = 2; const a = blitzCost(f); F.cq = 3; const b = blitzCost(f); F.cq = 5; const c = blitzCost(f); F.cq = c0; return a === 0 && b === ECON.blitzS && c === 3 * ECON.blitzS; }), 'desgaste da blitz começa na 4ª conquista e cresce');
  // v44: quadro do império e cartão do território; v45: última resistência
  ok(await p.evaluate(() => { window.__sob.render(); return document.querySelectorAll('#me .kpis .kp').length === 6; }), 'quadro do império mostra 6 indicadores');
  ok(await p.evaluate(() => { const G = window.__sob.G; G.sel = G.F[G.player].capI; window.__sob.render(); return !!document.querySelector('#info .kpis .kp') && /Comida/.test(document.querySelector('#info').textContent); }), 'cartão do território mostra rendimentos');
  ok(await p.evaluate(() => { const G = window.__sob.G, f = G.order.find(o => G.F[o].alive && G.F[o].capI != null && owned(o).length > 2); return !f || lastStand(G.F[f].capI) === 0; }), 'última resistência só vale para quem tem até 2 territórios');
  // v46: agitação saturada; v47: objetivo anunciado e alvo; v48: painel de facções
  ok(await p.evaluate(() => { const G = window.__sob.G, o = G.order.find(x => x !== G.player), O = G.F[o], s0 = O.stab; O.stab = 80; O.agR = 0; agitHit(o, 15); const a = O.stab; agitHit(o, 15); const b = O.stab; O.stab = s0; return a === 65 && b === 60; }), 'segunda agitação na mesma rodada vale 1/3');
  ok(await p.evaluate(() => { const G = window.__sob.G, o = G.order.find(x => x !== G.player), h0 = G.F[o].hold; G.F[o].hold = 1; window.__sob.render(); const t = threatOf(o) && /segurando o objetivo/.test(document.querySelector('#facs').textContent); G.F[o].hold = h0; window.__sob.render(); return t; }), 'quem segura o objetivo aparece como ameaça no painel de facções');
  ok(await p.evaluate(() => document.querySelectorAll('#facs .pbar').length > 0 && !!document.querySelector('#facs .op')), 'painel de facções tem barra de poder e opinião');
  // v49: abas Império e Região, fronteiras com ações e motivo da recusa de influência
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player; onTerr(G.F[me].capI); const reg = document.querySelector('#side').classList.contains('t-reg') && document.querySelectorAll('#info .nbl li').length === G.A[G.sel].filter(j => G.own[j] !== 'off').length; document.querySelector('#ptabs [data-k=imp]').click(); return reg && document.querySelector('#side').classList.contains('t-imp'); }), 'clicar no mapa abre a aba Região com todas as fronteiras; a aba Império volta');
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player, far = [...Array(G.N).keys()].find(j => G.own[j] === 'neu' && !G.A[j].some(i => G.own[i] === me)); return far == null || /fronteira/.test(inflWhy(me, far)); }), 'influência recusada diz que falta fronteira');
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player, F = G.F[me], nb = owned(me).flatMap(i => G.A[i]).find(j => (G.own[j] === 'neu' || G.own[j] === 'reb') && !capOwner(j) && !csOf(j)); if (nb == null) return true; const p0 = F.pre; F.pre = 99; const ok = canInfl(me, nb); F.pre = 0; const w = inflWhy(me, nb); F.pre = p0; return ok && /Prestígio/.test(w); }), 'influência vale para qualquer neutro na fronteira e avisa quando falta prestígio');
  // v50: sub-abas, fichas, motivo dos dados, supremacia naval, relevo e eliminação sem território
  ok(await p.evaluate(() => { const G = window.__sob.G, vis = s => { const e = document.querySelector(s); return !!e && e.offsetParent !== null; }; G.tab = 'imp'; G.isub = 'facs'; render(); const a = vis('#facs') && !vis('#phase') && !vis('#cron'); G.isub = 'cron'; render(); const b = vis('#cron') && !vis('#facs'); G.isub = 'acoes'; render(); return a && b && vis('#phase') && document.querySelectorAll('.stabs [data-g=isub]').length === 4; }), 'Império separado em Ações, Objetivo, Facções e Crônica');
  ok(await p.evaluate(() => { const G = window.__sob.G, i = G.F[G.player].capI; G.sel = i; G.tab = 'reg'; G.rsub = 'obr'; render(); const a = /Fila de obras/.test(document.querySelector('#info .rs').textContent) && /Construções/.test(document.querySelector('#info .rs').textContent); G.rsub = 'fro'; render(); const b = !!document.querySelector('#info .rs .nbl'); G.tab = 'imp'; render(); return a && b && document.querySelectorAll('#info .stabs [data-g=rsub]').length === 3; }), 'Região separada em Fronteiras, Obras e Detalhes');
  ok(await p.evaluate(() => { const ks = Object.keys(STRUCT); return ks.every(k => SCAT[sCat(k)]) && /Construir|⚒/.test(sFicha(ks[0], G.F[G.player].capI)) && new Set(ks.map(sCat)).size >= 6; }), 'toda construção tem finalidade e ficha');
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player, i = G.F[me].capI, j = G.A[i][0], t0 = G.tr[i]; G.tr[i] = 2; const w = diceWhy(i, j), d = diceFor(i, j)[0]; G.tr[i] = t0; return d === 1 && w.some(x => /guarnição/.test(x)); }), 'dados reduzidos vêm com o motivo');
  ok(await p.evaluate(() => { const G = window.__sob.G, s = G.m.sea && G.m.sea[0]; if (!s) return true; const [i, j] = s, t0 = G.tr[i]; G.tr[i] = 9; const cap = landCap(i, j), d = diceFor(i, j)[0]; G.tr[i] = t0; return (cap ? d <= 2 : true) && typeof seaSup(i, j) === 'number' && !isNaN(seaSup(i, j)); }), 'desembarque respeita a supremacia naval');
  ok(await p.evaluate(() => { const G = window.__sob.G, i = G.F[G.player].capI; G.lv[i] = 4; const a = svHtml(i); G.lv[i] = 1; const b = svHtml(i); return /class="city"/.test(a) && /svr/.test(a) && a.length > b.length * 1.5 && !!document.querySelector('#sv-farm') && zMax() >= 10; }), 'cidade desenhada em volume cresce com o porte; melhorias na paisagem (UI-27)');
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player, f = G.order.find(x => x !== me && G.F[x].alive && G.F[x].entered && owned(x).length); if (!f) return true; const T = owned(f), o0 = T.map(i => G.own[i]); T.forEach(i => G.own[i] = 'reb'); checkWin(); const dead = !G.F[f].alive; T.forEach((i, n) => G.own[i] = o0[n]); G.F[f].alive = true; return dead; }), 'facção sem território é eliminada');
  // v52: conselheiro, chance nas fronteiras e diplomacia por escrito
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player, F = G.F[me], r0 = F.res; F.res = null; G.tab = 'imp'; G.isub = 'acoes'; render(); const L = advice(), a = L.some(x => x.k === 'techs') && document.querySelectorAll('.advr li').length === L.length && !!document.querySelector('#actbar [data-a=advgo]'); F.res = r0; render(); return a; }), 'conselheiro lista as pendências do turno com atalho');
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player, i = owned(me).find(i => G.A[i].some(j => hostile(me, j))); if (i == null) return true; const j = G.A[i].find(j => hostile(me, j)), t0 = G.tr[i]; G.tr[i] = 6; const a = odds(i, j), b = odds(i, j); G.sel = i; G.tab = 'reg'; G.rsub = 'fro'; render(); const c = !!document.querySelector('#info .pct'); G.tr[i] = t0; G.tab = 'imp'; render(); return a === b && a >= 0 && a <= 1 && typeof riskOf(i)[0] === 'number' && c; }), 'fronteiras mostram a chance de vitória e o risco');
  ok(await p.evaluate(() => { diploModal(); const m = document.querySelector('#modal'), a = m.querySelectorAll('ul.dn li').length > 0; m.hidden = true; return a; }), 'diplomacia explica cada proposta e o motivo da recusa');
  // v51: governo em abas com motivo do bloqueio, governadores nomeados em Personagens, criação em passos
  ok(await p.evaluate(() => { gsub = 'gov'; govModal(); const m = document.querySelector('#modal'), a = m.querySelectorAll('.stabs [data-a=gtab]').length === 4 && /Exige a cívica/.test(m.textContent); m.querySelector('[data-a=gtab][data-k=pol]').click(); const b = /Vagas/.test(m.textContent); m.querySelector('[data-a=gtab][data-k=civ]').click(); const c = /Libera:/.test(m.textContent); gsub = 'gov'; m.hidden = true; return a && b && c; }), 'governo, políticas, cívicas e crenças em abas');
  ok(await p.evaluate(() => { const G = window.__sob.G; fsub = 'gvr'; figModal(); const m = document.querySelector('#modal'), n = m.querySelectorAll('[data-a=gvr]').length; fsub = 'lid'; m.hidden = true; return n === 3 * owned(G.player).length; }), 'governadores nomeados na tela de personagens');
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player; repMark(); const i = owned(me).find(i => i !== G.F[me].capI) ?? G.A[G.F[me].capI][0], o = G.own[i], riv = G.order.find(f => f !== me && G.F[f].alive); G.own[i] = o === me ? riv : me; log(riv, 'Teste conquista X de ' + fname(me) + '.'); repBuild(); const R = G.rep, okR = R.lost.length + R.won.length === 1 && R.vs.length === 1 && G.chg.includes(i); G.own[i] = o; G.rep = null; G.chg = null; return okR && openR() >= 4 && openR() <= 8; }), 'relatório da rodada aponta território que mudou de mãos e ação contra o jogador (UI-29); abertura protegida (D-18)');
  ok(await p.evaluate(() => { const G = window.__sob.G; const v0 = { ...vb }; Object.assign(vb, { x: 0, y: 0, w: G.m.w, h: G.m.h }); setVB(); const far =[...document.querySelectorAll('.b .sv')].filter(e => !e.hasAttribute('hidden')).length, box = !!document.querySelector('.b .pl rect'), ald = [...document.querySelectorAll('.b .pl:not(.big) .lvn')].some(e => getComputedStyle(e).display !== 'none'); Object.assign(vb, v0); setVB(); return !box && !ald && far < G.N; }), 'mapa inteiro limpo: sem caixas nas placas, sem "Aldeia" repetido e sem cidades miúdas (UI-30)');
  ok(await p.evaluate(() => { const G = window.__sob.G, s0 = [G.tab, G.sel, vb.w]; tutStart(); if (!tut) return false; let bad = 0; for (let i = 0; i < TUT.length; i++) { const h = document.querySelector('.tuth'), c = document.querySelector('.tutc').getBoundingClientRect(); if (c.left < 0 || c.top < 0 || c.right > innerWidth || c.bottom > innerHeight || document.activeElement.dataset.a !== 'tutn') bad++; if (h.classList.contains('none') && TUT[i][0] && !/\.rep$/.test(TUT[i][0])) bad++; if (i < TUT.length - 1) tutGo(1); } document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return !bad && TUT.length >= 30 && !tut && document.querySelector('#tut').hidden && G.tab === s0[0] && G.sel === s0[1] && vb.w === s0[2]; }), 'tutorial guiado: todo passo tem alvo, cartão na tela e foco; Esc devolve a partida (UI-31)');
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player, o0 = G.own.slice(), r0 = G.round, h0 = G.heg, n0 = G.log.length; G.round = openR() + 1; const riv = G.order.filter(f => f !== me && G.F[f].alive && G.F[f].entered); let k = 0; for (let i = 0; i < G.N && k < Math.ceil(G.N * .6); i++) if (G.own[i] !== me) { G.own[i] = me; k++; } const h = hegCheck(), msg = G.log.length > n0, opn = /domina o mapa/.test(reportHtml()), j = owned(me)[0], b = riv.length ? hegB(riv[0], j) : 4; G.own = o0; G.round = r0; G.heg = h0; G.log.splice(0, G.log.length - n0); return h === me && msg && opn && b === 4 && hegemon() !== me; }), 'coalizão: quem domina o mapa vira alvo comum e o jogador é avisado (IA-20)');
  ok(await p.evaluate(() => { const q = s => document.querySelector(s), G = window.__sob.G; cmdOpen = null; renderCmd(); const n = document.querySelectorAll('#cmd .cb').length, noNav = !q('#me .nav'); q('#cmd [data-g=mil]').click(); const items = [...document.querySelectorAll('.cmdm .cmi')], desc = items.every(e => e.querySelector('.cd').textContent.length > 10), why = items.filter(e => e.getAttribute('aria-disabled') && e.dataset.k !== 'camp').every(e => e.querySelector('.cw')); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return n === 8 && noNav && items.length >= 3 && desc && why && !q('.cmdm'); }), 'barra de comandos: 7 temas, cada item com descrição e motivo quando indisponível; Esc fecha (UI-35)');
  ok(await p.evaluate(() => { const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)], names = () => qa('#cmr .cmi b').map(e => e.textContent).join('|'); cmdOpen = null; renderCmd(advice()); const st = qa('#cmd .cb .cs').every(e => e.textContent.length > 2); cmdAdv = [{ ic: '📜', t: 'teste', k: 'pol', lab: 'Ver' }]; renderCmd(); const dot = !!q('#cmd [data-g=gov] .cdot'); q('#cmd [data-g=gov]').click(); const pend = qa('.cmdm .cmp [data-a=adv]').length === 1; q('#cmd [data-g=bus]').click(); const inp = q('#cmq'), type = v => { inp.value = v; inp.dispatchEvent(new Event('input', { bubbles: true })); }; type('ouro'); const a = /Impostos/.test(names()); type('PAZ'); const b = /Relações/.test(names()); type('construção'); const c = /Obras/.test(names()); type('xyzq'); const d = !names() && /Nada encontrado/.test(q('#cmr').textContent); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); const closed = !q('.cmdm'); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true })); const hk = q('.cmdm') && cmdOpen === 'mil' && document.activeElement.classList.contains('cmi'); cmdOpen = null; renderCmd(advice()); return st && dot && pend && a && b && c && d && closed && hk; }), 'barra de comandos: estado em cada tema, pendência dentro do menu, busca por palavras e tecla M (UI-36)');
  // celular
  await p.setViewportSize({ width: 390, height: 844 });
  await p.evaluate(() => window.__sob.startScenario('sengoku', 'oda', 1));
  await p.click('#modal [data-m="0"]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => { tutStart(); if (!tut) return false; document.querySelector('.tuth').style.transition = 'none'; /* sem a animação do foco, a medida vale no mesmo instante */ let bad = 0; for (let i = 0; i < TUT.length; i++) { const h = document.querySelector('.tuth').getBoundingClientRect(), c = document.querySelector('.tutc').getBoundingClientRect(), none = document.querySelector('.tuth').classList.contains('none'); if (c.left < 0 || c.top < 0 || c.right > innerWidth || c.bottom > innerHeight) bad++; if (!none && h.height < 300 && !(c.top >= h.bottom || c.bottom <= h.top || c.right <= h.left || c.left >= h.right)) bad++; if (i < TUT.length - 1) tutGo(1); } tutEnd(); document.querySelector('.tuth').style.transition = ''; return !bad && !tut; }), 'tutorial no celular: o cartão cabe na tela e não cobre o que explica (UI-31)');
  ok(await p.evaluate(() => { const st = e => getComputedStyle(document.querySelector(e)); techModal(); const m = document.querySelector('#modal'), kn = m.querySelector('details.known'), a = !!kn && !kn.open && [...m.querySelectorAll('.tech:not(.own)')].some(e => !e.closest('details')); m.hidden = true; return a && st('#mapw').position === 'sticky' && st('#ptabs').position === 'sticky' && st('#top [data-a=keys]').display === 'none'; }), 'celular: mapa e abas presos no alto; tecnologias conhecidas recolhidas (UI-32, UI-33)');
  await p.screenshot({ path: shot('phone-sengoku') });
  console.log(errs.length ? errs.join('\n') : 'sem erros');
  await b.close();
})();
