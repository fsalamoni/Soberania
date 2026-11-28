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
  // semente: SEED=n repete exatamente as mesmas partidas simuladas (o jogo guarda Math.random ao carregar, por isso a troca vem antes)
  const SEED = +(process.env.SEED || Math.floor(Math.random() * 1e6));
  await p.addInitScript(() => { let a = 1; window.__rs = s => { a = s >>> 0; }; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; });
  await p.goto('http://soberania.test/');
  await p.screenshot({ path: shot('setup') });
  console.log('semente', SEED, '(use SEED=' + SEED + ' para repetir)');
  const REP = +(process.env.REP || 1);
  const res = await p.evaluate(async ([REP, ONLY, LEN, SEED]) => {
    const S = window.__sob, out = [];
    for (const sc of S.SCEN.filter(s => !ONLY || s.id === ONLY)) for (const f of sc.f.filter(f => !f.late)) for (let k = 0; k < REP; k++) {
      try {
        window.__rs(SEED + [...(sc.id + f.id)].reduce((h, c) => h * 31 + c.charCodeAt(0) | 0, k * 7919));
        S.startScenario(sc.id, f.id, 1, true, LEN);
        const G = S.G; G.auto = true; G.fast = true;
        await S.loop();
        const cnt = re => G.log.filter(l => re.test(l[1])).length;
        const leg = G.order.map(x => window.__sob.G.F[x]).map(F => F.tech.length).reduce((a, b) => Math.max(a, b), 0);
        out.push([sc.id, f.id, G.round, G.why, G.winner, G.order.reduce((s, x) => s + G.F[x].nB, 0), G.order.reduce((s, x) => s + G.F[x].tech.length, 0), cnt(/ por influência/), cnt(/declara campanha/), cnt(/ usa /), cnt(/bombardeia/), leg]);
      } catch (e) { out.push([sc.id, f.id, 'ERRO ' + e.message + ' ' + e.stack.split('\n')[1]]); }
    }
    return out;
  }, [REP, process.env.ONLY || '', process.env.LEN || 'c', SEED]);
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
  await p.evaluate(() => { const G = window.__sob.G; G.sel = G.ix['Rio Grande do Sul']; G.tr[G.sel] += 10; window.__sob.render(); });
  ok(await p.evaluate(() => document.querySelector('#game').classList.contains('noside') && !!document.querySelector('#actbar [data-a=all]')), 'v74: o painel começa fechado e a barra traz o atalho dos reforços');
  await p.click('[data-a=all]');
  await p.evaluate(() => window.__sob.render()); // v62: com os reforços distribuídos a etapa de ataques abre sozinha
  // governo (v5): abre as obras (1 ação), põe mercado e oficina na fila, escolhe pesquisa (sem ação) e declara campanha
  await p.evaluate(() => { window.__sob.G.F.fa.gold = 60; window.__sob.G.F.fa.sci = 5; window.__sob.render(); });
  await p.click('#cmd [data-g=obr]');
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
  ok(await p.evaluate(() => /Saúde/.test(document.querySelector('#info').textContent) && /Felicidade/.test(document.querySelector('#res').textContent)), 'painel mostra saúde, estabilidade local e felicidade');
  await p.click('#cmd [data-g=obr]');
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
  ok(await p.evaluate(() => { const G = window.__sob.G, c = G.F[G.player].capI, t = document.querySelectorAll('path.t')[c], ct = document.querySelector(`g.b[data-i="${c}"] .sv .city`); const r = [document.querySelector('#relc').style.display !== 'none', +t.getAttribute('fill-opacity') < .5, document.querySelector('#rib').style.display !== 'none', !ct.querySelector(':scope > ellipse[fill^="url"]'), ct.querySelectorAll('path').length > 20]; if (r.includes(false)) console.error('v75 ' + r.join()); return !r.includes(false); }), 'v75: cor da facção translúcida sobre o relevo e cidade assentada no terreno, sem prato');
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player, i = owned(me).find(j => coastPt(j)); if (i == null) return 'skip'; const b0 = G.bld[i]; G.bld[i] = [...b0, 'por', 'agr', 'min'].filter((k, n, a) => a.indexOf(k) === n); renderMap(); const c = document.querySelector(`g.b[data-i="${i}"] .cst`), pt = svg.createSVGPoint(); pt.x = +c.dataset.x; pt.y = +c.dataset.y; const sea = !P[i].isPointInFill(pt) && /translate/.test(c.getAttribute('transform') || ''); const t = G.m.terr[i], sc = Math.min(nnD()[i] / 100, Math.max(inR()[i] / 14, nnD()[i] / 210)); const land = [0, 1].map(s => { const [x, y] = svp(i, s); pt.x = t.x + x * sc; pt.y = t.y + y * sc; return P[i].isPointInFill(pt) || Math.hypot(x, y) < 14; }); G.bld[i] = b0; renderMap(); if (!sea || land.includes(false)) console.error('v77 ' + sea + ' ' + land.join()); return sea && !land.includes(false); }), 'v77: porto ancorado no mar junto à costa e obras rurais dentro do território');
  { // v79: cartas de gestão (CT-20 a CT-31), ajuste das duas cartas fortes e compra em paz
    const r = await p.evaluate(() => {
      const G = window.__sob.G, me = G.player, F = G.F[me]; if (G.turnF !== me || G.busy || G.over) return 'skip';
      const bad = [], T = owned(me), t = T[0];
      const snap = JSON.stringify({ q: G.q, bld: G.bld, food: G.food, tr: G.tr, fai: G.fai, mem: G.mem, F: G.F });
      for (const e of Object.keys(CARDS)) if (Array.isArray(CARDS[e]) && e !== 'sym' && CARDS[e].length !== 24) bad.push('lista ' + e);
      const play = (k, a) => { F.cards = [{ k }]; return playCard(me, 0, a); };
      let g = F.gold; if (!play(14) || F.gold < g + 8) bad.push(14);
      g = F.cu || 0; if (!play(16) || F.cu !== g + 10) bad.push(16);
      F.ww = 7; if (!play(20) || F.ww !== 0) bad.push(20);
      g = F.gold; if (!play(23) || F.gold !== g + Math.min(10, T.length)) bad.push(23);
      g = G.food[t]; if (!play(13, t) || G.food[t] !== g + 8) bad.push(13);
      g = G.tr[t]; if (!play(22, t) || G.tr[t] !== g + 3) bad.push(22);
      const r0 = G.round; G.round += 4; mercsLeave(me); G.round = r0; if (G.tr[t] !== g) bad.push('22 saída');
      G.q[t] = []; if (play(12, t) !== false || !cardWhy) bad.push('12 sem fila');
      const kq = Object.keys(STRUCT).find(k => canQueue(me, k, t)); if (kq) { G.q[t].push({ k: kq, p: 0, t: G.round }); if (!play(12, t) || !(built(t, kq) || G.q[t][0].p > 0)) bad.push(12); }
      const te = T.find(i => engK(me, i)); if (te != null) { const b = engK(me, te); if (!play(19, te) || !built(te, b)) bad.push(19); }
      if (F.res) { g = F.sci; const had = F.tech.length; if (!play(15) || !(F.sci > g || F.tech.length > had)) bad.push(15); }
      const o = G.order.find(o => o !== me && G.F[o].alive && owned(o).length);
      if (o) { const j = owned(o)[0]; g = relOf(o, me).v; if (!play(18, j) || !(relOf(o, me).v > g)) bad.push(18); if (play(18, t) !== false) bad.push('18 em si'); }
      const pr = T.flatMap(i => G.A[i].filter(j => hostile(me, j) && real(G.own[j]) && !capOwner(j)).map(j => [i, j]))[0];
      if (pr) { const j = pr[1], X = G.F[G.own[j]]; G.tr[j] = 2; X.stab = 80; if (play(11, j) !== false || G.own[j] === me) bad.push('11 estável'); G.tr[j] = 10; if (!play(4, j) || G.tr[j] !== 7) bad.push(4); }
      for (let n = 0; n < 40; n++) if (drawCard(0).k > 11 || drawCard(1).k < 12) { bad.push('baralhos'); break; }
      F.cards = []; gainCard(me); if (F.cards.length !== 1 || F.cards[0].k < 12) bad.push('compra em paz');
      if (o) { const A = G.F[o], tf = G.turnF; A.cards = [14, 16, 20, 23, 13].map(k => ({ k })); G.turnF = o; aiCards(o, 'ref'); G.turnF = tf; if (A.cards.length) bad.push('IA ficou com ' + A.cards.map(c => c.k)); }
      const s = JSON.parse(snap); for (const k of ['q', 'bld', 'food', 'tr', 'fai', 'mem']) G[k] = s[k]; for (const f in s.F) { const X = G.F[f]; for (const k of ['gold', 'cu', 'ww', 'sci', 'res', 'tech', 'cards', 'mercs', 'stab', 'nB', 'civ']) X[k] = s.F[f][k]; X.tS = null; }
      document.querySelector('#modal').hidden = true; render(); return bad.join('; ') || true;
    });
    ok(r === true || r === 'skip', 'v79: 12 cartas de gestão aplicam o efeito, a IA usa, Traição e Envenenamento ajustadas, carta por cívica' + (r === true || r === 'skip' ? '' : ' [' + r + ']'));
  }
  { // v78: atacar direto pelo mapa com reforços por distribuir
    const r = await p.evaluate(async () => { const G = window.__sob.G, me = G.player, F = G.F[me]; if (G.turnF !== me || G.busy || G.over) return 'skip'; const s0 = { tr: G.tr.slice(), reinf: F.reinf, phase: G.phase, sel: G.sel, camp: F.camp }; F.reinf = 3; G.phase = 'ref'; let pr = null; for (const i of owned(me)) { const j = G.A[i].find(j => hostile(me, j) && !brk(me, G.own[j]) && !atkWhy(me, i, j, true)); if (j != null) { pr = [i, j]; break; } } if (!pr) { F.reinf = s0.reinf; G.phase = s0.phase; return 'skip'; } const [i, j] = pr, hard = !!atkWhy(me, i, j); G.sel = i; render(); onTerr(j); const m = document.querySelector('#modal'), asked = !m.hidden && /reforço/.test(m.innerText); m.querySelector('[data-m="0"]').click(); await new Promise(r => setTimeout(r, 60)); const went = F.reinf === 0 && G.tr[i] === s0.tr[i] + 3 && G.tgt === j; hideBattle(); G.tr = s0.tr; F.reinf = s0.reinf; G.phase = s0.phase; G.sel = s0.sel; F.camp = s0.camp; m.hidden = true; render(); return hard && asked && went || [hard, asked, went].join(); });
    ok(r === true || r === 'skip', 'v78: clicar no território e no vizinho inimigo ataca, com oferta de pôr os reforços que faltam' + (r === true || r === 'skip' ? '' : ' [' + r + ']'));
  }
  await p.evaluate(() => vicModal()); // sem rolar a página
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
  // v62: não é mais preciso declarar campanha
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
  await p.evaluate(() => { cmdOpen = 'mil'; renderCmd(); document.querySelector('.cmdm [data-a=cardsGo]').click(); }); // v74: as cartas abrem pela barra
  await p.click('[data-a=card][data-h="0"]');
  const r1 = await p.evaluate(() => window.__sob.G.F.fa.reinf);
  ok(r1 === r0 + 4, `carta de reforço rende 4 (${r0} -> ${r1})`);
  // mundo, aviação
  await p.evaluate(() => window.__sob.startScenario('ww2', 'uk', 1));
  await p.click('#modal [data-m="0"]');
  await p.waitForFunction(() => window.__sob.G.turnF === 'uk', null, { timeout: 30000 });
  await p.evaluate(() => { const G = window.__sob.G, F = G.F.uk; G.tr[F.capI] += F.reinf; F.reinf = 0; window.__sob.render(); });
  await p.click('[data-a=all]').catch(() => { });
  await p.evaluate(() => window.__sob.render()); // v62: com os reforços distribuídos a etapa de ataques abre sozinha
  // v62: não é mais preciso declarar campanha
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
  ok(await p.evaluate(() => { window.__sob.render(); return document.querySelectorAll('#res .rc').length === 6 && !document.querySelector('#me .kpis'); }), 'os 6 indicadores do império ficam no topo, sem repetição no painel (UI-39)');
  ok(await p.evaluate(() => { const G = window.__sob.G; G.sel = G.F[G.player].capI; window.__sob.render(); return !!document.querySelector('#info .kpis .kp') && /Comida/.test(document.querySelector('#info').textContent); }), 'cartão do território mostra rendimentos');
  ok(await p.evaluate(() => { const G = window.__sob.G, f = G.order.find(o => G.F[o].alive && G.F[o].capI != null && owned(o).length > 2); return !f || lastStand(G.F[f].capI) === 0; }), 'última resistência só vale para quem tem até 2 territórios');
  // v46: agitação saturada; v47: objetivo anunciado e alvo; v48: painel de facções
  ok(await p.evaluate(() => { const G = window.__sob.G, o = G.order.find(x => x !== G.player), O = G.F[o], s0 = O.stab; O.stab = 80; O.agR = 0; agitHit(o, 15); const a = O.stab; agitHit(o, 15); const b = O.stab; O.stab = s0; return a === 65 && b === 60; }), 'segunda agitação na mesma rodada vale 1/3');
  ok(await p.evaluate(() => { const G = window.__sob.G, o = G.order.find(x => x !== G.player), h0 = G.F[o].hold; G.F[o].hold = 1; window.__sob.render(); const t = threatOf(o) && /segurando o objetivo/.test(document.querySelector('#facs').textContent); G.F[o].hold = h0; window.__sob.render(); return t; }), 'quem segura o objetivo aparece como ameaça no painel de facções');
  ok(await p.evaluate(() => document.querySelectorAll('#facs .pbar').length > 0 && !!document.querySelector('#facs .op')), 'painel de facções tem barra de poder e opinião');
  // v49: abas Império e Região, fronteiras com ações e motivo da recusa de influência
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player; const r0 = G.F[me].reinf; G.F[me].reinf = 0; onTerr(G.F[me].capI); G.F[me].reinf = r0; const reg = document.querySelector('#side').classList.contains('t-reg') && document.querySelectorAll('#info .nbl li').length === G.A[G.sel].filter(j => G.own[j] !== 'off').length; const g = document.querySelector('#game'), open = !g.classList.contains('noside'); document.querySelector('#ptabs [data-a=side]').click(); const shut = g.classList.contains('noside'); document.querySelector('#actbar [data-a=tstep]').click(); return reg && open && shut && !g.classList.contains('noside') && document.querySelector('#side').classList.contains('t-imp'); }), 'clicar no mapa abre o painel do território com as fronteiras; o ✕ fecha e a barra reabre no turno (UI-39)');
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player, T = owned(me), q0 = T.map(i => G.q[i]), f0 = G.foc; T.forEach(i => { G.q[i] = []; }); G.foc = {}; const i = T[0]; G.tab = 'obr'; G.osub = 'fil'; sideOpen(); render(); const W = document.querySelector('#works'), r = [!advice().some(x => x.k === 'works'), !document.querySelector('#cmd [data-g=obr] .cdot'), !/💤|A decidir|sem obra nem foco/i.test(W.innerText), !W.querySelector('[data-a=focoIdle]'), W.querySelectorAll(`.fpick [data-a=foco][data-i="${i}"]`).length === 5]; const bt = [...W.querySelectorAll(`.fpick [data-a=foco][data-i="${i}"]:not([disabled])`)].pop(); bt.click(); r.push(G.foc[i] === bt.dataset.k && focoOf(i) === bt.dataset.k); const b0 = G.bld[i]; G.bld[i] = b0.slice(); for (let g = 0; g < 400; g++) { const k = Object.keys(STRUCT).find(k => canQueue(me, k, i)); if (!k) break; G.bld[i].push(k); } G.sel = i; G.tab = 'reg'; G.rsub = 'obr'; render(); const t = document.querySelector('#info').innerText; r.push(!/Não quer construir|ocios|💤/i.test(t) && /está produzindo/.test(t) && !advice().some(x => x.k === 'works')); G.bld[i] = b0; T.forEach((j, n) => { G.q[j] = q0[n]; }); G.foc = f0; G.tab = 'imp'; render(); if (r.includes(false)) console.error('v76 ' + r.join()); return !r.includes(false); }), 'v76: fila vazia não é pendência; região sem obra ou toda construída só produz, com troca de foco na lista de Obras (P-14)');
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
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player, F = G.F[me], q = s => document.querySelector(s); if (G.turnF !== me || G.over) return 'skip'; const r0 = F.reinf, p0 = G.phase, c0 = F.camp; G.phase = 'atk'; F.reinf = 2; render(); const a = G.phase === 'ref' && q('#actbar [data-a=end]').getAttribute('aria-disabled') === 'true' && document.querySelectorAll('#actbar .ts').length === 3; let pr = null, en = null; for (let i = 0; i < G.N; i++) if (G.own[i] === me) for (const j of G.A[i]) { const d = G.own[j]; if (d !== me && d !== 'off' && hostile(me, j)) { pr = pr || [i, j]; if (G.F[d].real && !peace(me, d)) en = en || d; } } const b = !pr || /Distribua os reforços/.test(atkWhy(me, pr[0], pr[1])); F.reinf = 0; F.camp = false; render(); const c = G.phase === 'atk' && !q('#actbar [data-a=end]').getAttribute('aria-disabled') && !q('[data-k=camp]') && (!pr || !/campanha/i.test(atkWhy(me, pr[0], pr[1]))); let d = true; if (en) { G.truce.add(tk(me, en)); d = brk(me, en) === 'trégua'; G.truce.delete(tk(me, en)); } F.reinf = r0; F.camp = c0; G.phase = p0; render(); return (a && b && c && d) || (document.title = 'turno livre ' + [a, b, c, d].join(), false); }), 'turno livre: reforços travam só ataque e fim de turno, ataque sem declarar campanha, trégua vira aviso (D-19, UI-37)');
  { const t = await p.title(); if (/^turno livre/.test(t)) console.log('diagnóstico', t); }
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player, F = G.F[me]; if (G.over) return 'skip'; const i = G.own.findIndex(o => o === me); if (i < 0) return 'skip'; const q0 = G.q[i], f0 = G.food[i], g0 = F.gold, t0 = F.techs, fo = G.foc[i]; G.q[i] = []; delete G.foc[i]; const a = focoOf(i) === 'com'; focoApply(me, i); const b = G.food[i] === f0 + focoGain(i, 'com'); G.food[i] = f0; G.foc[i] = 'our'; const lock = !!focoWhy(me, 'our'), c = lock ? focoOf(i) === 'com' : (focoApply(me, i), F.gold === g0 + focoGain(i, 'our')); F.gold = g0; G.sel = i; G.tab = 'reg'; const h = focoBox(i), d = /Foco da produção/.test(h) && (h.match(/data-a="foco"/g) || []).length === 5 && /aria-pressed="true"/.test(h); G.q[i] = q0; if (fo) G.foc[i] = fo; else delete G.foc[i]; document.title = 'foco ' + [a, b, c, d]; return a && b && c && d; }), 'foco de produção: fila vazia rende o foco, foco bloqueado volta à alimentação e a caixa mostra as 5 opções (P-14)');
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player, F = G.F[me]; if (G.over) return 'skip'; const i = G.own.findIndex(o => o === me); if (i < 0) return 'skip'; const s = [G.q[i], G.riv[i], G.bld[i].slice(), F.tech.slice(), G.lv[i]]; G.q[i] = []; for (const k of ['mnr', 'ele', 'din']) if (!has(me, k)) F.tech.push(k); G.riv[i] = false; const a = canQueue(me, 'pco', i) && !canQueue(me, 'rep', i); G.riv[i] = true; const b = !canQueue(me, 'pco', i) && canQueue(me, 'rep', i); if (!G.bld[i].includes('zen')) G.bld[i].push('zen'); const c = !canQueue(me, 'hid', i) && /Represa/.test(reqText('hid')); G.bld[i].push('rep'); const d = canQueue(me, 'hid', i); const e = ['pco', 'acq', 'rsa', 'rdg', 'rep', 'ete'].every(k => STRUCT[k] && sName(k) && sCat(k)); [G.q[i], G.riv[i]] = s; G.bld[i] = s[2]; F.tech = s[3]; document.title = 'água ' + [a, b, c, d, e]; return a && b && c && d && e; }), 'água: poço só sem rio, represa só com rio e hidrelétrica exige represa (C-130 a C-135)');
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player; if (G.over) return 'skip'; const a = sName('qua') === 'Quartel' && ['dps', 'btc', 'fmu', 'acn', 'hml'].every(k => STRUCT[k] && sCat(k) && sName(k)); const far = owned(me).find(i => supplyDist(me)[i] > 0); let b = true; if (far != null) { G.bld[far].push('dps'); b = supplyDist(me)[far] === 0; G.bld[far].pop(); } let c = true; for (let i = 0; i < G.N && c; i++) for (const j of G.A[i]) if (isSea(i, j) && G.own[i] !== G.own[j] && G.own[j] !== 'off' && G.own[i] !== 'off') { const d0 = defBonus(j, i); G.bld[j].push('btc'); c = defBonus(j, i) === d0 + 1 && defBonus(j, null) === defBonus(j, null); G.bld[j].pop(); break; } document.title = 'militar ' + [a, b, c]; return a && b && c; }), 'obras militares: quartel com um nome só, depósito vira base de suprimento e bateria costeira defende do mar (C-136 a C-140)');
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player; if (G.over) return 'skip'; const nR = G.riv.filter((r, i) => r && G.own[i] !== 'off').length, L0 = G.lens, vis = l => { G.lens = l; window.__sob.render(); return getComputedStyle(document.querySelector('#rivers')).display !== 'none'; }, lens = !vis('own') && vis('rel') && vis('ter') && !vis('zon'); G.lens = L0; window.__sob.render(); const a = lens && (S => G.riv.every((r, i) => !r || G.own[i] === 'off' || S.has(String(i))))(new Set([...document.querySelectorAll('#rivers .rv')].map(e => e.dataset.i))) && nR > 0 && (!(RELIEF[G.sc.map] || {}).v || document.querySelectorAll('#rivers .rv').length > nR); const i = owned(me).find(i => G.riv[i] && i !== Fa(me).capI && !netOf(me).core.has(i)), cap = Fa(me).capI; let b = true; if (i != null) { G.bld[i].push('cfl'); G.bld[cap].push('cfl'); b = netOf(me).core.has(i); G.bld[i].pop(); G.bld[cap].pop(); } const dry = G.riv.findIndex(r => !r), c = STRUCT.cfl && sName('cfl') && (dry < 0 || !canQueue(G.own[dry], 'cfl', dry)); document.title = 'rios ' + [a, b, !!c, nR]; return a && b && !!c; }), 'rios: todo território com rio tem o rio desenhado, só nas lentes Relevo e Terreno, com os rios reais em todos os territórios onde há relevo, e o cais fluvial liga à rede de bens e exige rio (MC-05, C-141)');
  ok(await p.evaluate(() => { const G = window.__sob.G, me = G.player; if (G.over) return 'skip'; const a = ['pnt', 'tun', 'efv', 'pct'].every(k => STRUCT[k] && sName(k) && reqText(k)); const flat = G.ter.findIndex((t, i) => !'mh'.includes(t) && real(G.own[i])), hill = G.ter.findIndex((t, i) => 'mh'.includes(t) && real(G.own[i])); const b = flat < 0 || !canQueue(G.own[flat], 'tun', flat); let c = true; if (hill >= 0) { const f = G.own[hill], c0 = pCost(f, 'mer', hill); G.bld[hill].push('tun'); c = pCost(f, 'mer', hill) <= c0 && pCost(f, 'mer', hill) === pCost(f, 'mer', null); G.bld[hill].pop(); } const far = owned(me).find(i => supplyDist(me)[i] > 0); let d = true; if (far != null) { G.bld[far].push('efv'); d = supplyDist(me)[far] === 0; G.bld[far].pop(); } document.title = 'transporte ' + [a, b, c, d]; return a && b && c && d; }), 'transporte: ponte, túnel, estação e porto de contêineres existem; túnel só em relevo e tira o custo extra; estação é base de suprimento (C-142 a C-145)');
  ok(await p.evaluate(() => { const G = window.__sob.G; if (G.over) return 'skip'; const a = ['tvg', 'rdr', 'aaa', 'mem'].every(k => STRUCT[k] && sName(k) && sCat(k) && reqText(k) != null); const j = G.tr.findIndex((t, i) => real(G.own[i]) && t >= 1), t0 = G.tr[j], d = n => { G.tr[j] = n; const v = bldDef(j); return v; }; const b0 = d(3); G.bld[j].push('tvg'); const b = d(3) === b0 + 1 && d(2) === bldDef(j) && d(2) < d(3); G.bld[j].pop(); G.tr[j] = t0; document.title = 'militar2 ' + [a, b]; return a && b; }), 'obras militares novas: torre de vigia só defende com 3 ou mais tropas (C-146 a C-149)');
  // celular
  await p.setViewportSize({ width: 390, height: 844 });
  await p.evaluate(() => window.__sob.startScenario('sengoku', 'oda', 1));
  await p.click('#modal [data-m="0"]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => { tutStart(); if (!tut) return false; document.querySelector('.tuth').style.transition = 'none'; /* sem a animação do foco, a medida vale no mesmo instante */ let bad = 0; for (let i = 0; i < TUT.length; i++) { const h = document.querySelector('.tuth').getBoundingClientRect(), c = document.querySelector('.tutc').getBoundingClientRect(), none = document.querySelector('.tuth').classList.contains('none'); if (c.left < 0 || c.top < 0 || c.right > innerWidth || c.bottom > innerHeight) bad++; if (!none && h.height < 300 && !(c.top >= h.bottom || c.bottom <= h.top || c.right <= h.left || c.left >= h.right)) bad++; if (i < TUT.length - 1) tutGo(1); } tutEnd(); document.querySelector('.tuth').style.transition = ''; return !bad && !tut; }), 'tutorial no celular: o cartão cabe na tela e não cobre o que explica (UI-31)');
  ok(await p.evaluate(() => { const st = e => getComputedStyle(document.querySelector(e)); techModal(); const m = document.querySelector('#modal'), kn = m.querySelector('details.known'), a = !!kn && !kn.open && [...m.querySelectorAll('.tech:not(.own)')].some(e => !e.closest('details')); m.hidden = true; return a && st('#mapw').position === 'sticky' && st('#ptabs').position === 'sticky' && st('#top [data-a=keys]').display === 'none'; }), 'celular: mapa e abas presos no alto; tecnologias conhecidas recolhidas (UI-32, UI-33)');
  await p.screenshot({ path: shot('phone-sengoku') });
  // tablet (v74, UI-39): em pé e deitado, nada passa da largura da tela e o cabeçalho deitado cabe em uma linha de botões
  for (const [w, h, nm] of [[768, 1024, 'em pé'], [1024, 768, 'deitado']]) {
    await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(200);
    ok(await p.evaluate(([w, land]) => { const g = document.querySelector('#game'), q = s => document.querySelector(s); document.querySelector('#actbar [data-a=tstep]').click(); const open = !g.classList.contains('noside') && document.documentElement.scrollWidth <= w, bs = [...document.querySelectorAll('#top button')].filter(e => e.offsetParent), row = !land || new Set(bs.map(e => Math.round(e.getBoundingClientRect().top))).size === 1, bar = q('#cmd').getBoundingClientRect(), fit = bar.left >= 0 && bar.right <= w + 1 && document.querySelectorAll('#res .rc').length === 6; q('#ptabs [data-a=side]').click(); return open && row && fit && g.classList.contains('noside') && document.documentElement.scrollWidth <= w; }, [w, w > h]), 'tablet ' + nm + ': painel, barra e indicadores cabem na tela (UI-39)');
    await p.screenshot({ path: shot('tablet-' + (w > h ? 'deitado' : 'em-pe')) });
  }
  console.log(errs.length ? errs.join('\n') : 'sem erros');
  await b.close();
})();
