// Soberania v6: motor do jogo (guerra de conquista + governo com ações, terreno, zonas e povoamento), IA e interface.
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rnd = Math.random, d6 = () => 1 + Math.floor(rnd() * 6);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const NEU = { id: 'neu', n: 'Neutros', c: '#4b5361', real: false }, REB = { id: 'reb', n: 'Rebeldes', c: '#7c3a34', real: false }, OFF = { id: 'off', n: 'Fora do mundo conhecido', c: '#1b222b', real: false };
const PHASE = { ref: 'Reforços', atk: 'Ações', mov: 'Remanejamento' };
const SAVE = 'soberania-v5';
let G = null;

// ---------- montagem ----------
function idxOf(m) { const o = {}; m.terr.forEach((t, i) => o[t.n] = i); return o; }
function expand(m, list) {
  const out = [];
  for (const n of list) {
    if (n[0] === '@') { const r = m.regions.indexOf(n.slice(1)); if (r < 0) throw Error('região ' + n); m.terr.forEach((t, i) => { if (t.r === r) out.push(t.n); }); }
    else out.push(n);
  }
  return out;
}
// objetivo do cenário + exigência mínima de expansão (20% do mapa além do território inicial)
function objOf(d, m, relics) {
  const o = { ...d.obj };
  if (o.any) o.any = relics;
  if (!o.txt) o.n = Math.max(o.n || 0, expand(m, d.t).length + Math.ceil(m.terr.length * .2));
  return o;
}
const eraOf = sc => ERA[sc.tech];
const airOf = sc => sc.air || eraOf(sc).air || null;
function newGame(sc, player, diff, len) {
  const m = MAPS[sc.map], ix = idxOf(m), N = m.terr.length;
  const need = n => { if (!(n in ix)) throw Error(sc.id + ': território desconhecido ' + n); return ix[n]; };
  const L = LEN[len] || LEN.c;
  const g = { sc, m, ix, N, player, diff, lenK: LEN[len] ? len : 'c', len: L, rounds: L.r, era: eraOf(sc), air: airOf(sc), own: Array(N).fill('neu'), tr: Array(N).fill(sc.neu || 2), fort: Array(N).fill(0), bld: Array.from({ length: N }, () => []), q: Array.from({ length: N }, () => []), occ: Array(N).fill(0), dis: new Set(), rl: [], mv: [], arr: [], win: Array(N).fill(0), dug: Array(N).fill(0), acted: new Set(), F: { neu: NEU, reb: REB, off: OFF }, order: [], cur: 0, round: 1, phase: 'ref', truce: new Set(), cool: {}, log: [], trades: 0, seaUsed: new Set(), sel: null, tgt: null, over: false, fast: false, auto: false };
  g.A = Array.from({ length: N }, () => []);
  for (const [a, b] of m.adj) { g.A[a].push(b); g.A[b].push(a); }
  g.seaK = new Set(m.sea.map(([a, b]) => a * 1e4 + b).concat(m.sea.map(([a, b]) => b * 1e4 + a)));
  g.regT = m.regions.map((_, r) => m.terr.map((t, i) => t.r === r ? i : -1).filter(i => i >= 0));
  for (const [n, v] of Object.entries(sc.neuT || {})) g.tr[need(n)] = v;
  expand(m, sc.off || []).forEach(n => { const i = need(n); g.own[i] = 'off'; g.tr[i] = 0; });
  g.relics = (sc.relics || []).map(need);
  // parte 3: terreno, rio e jazidas (src/geo.js); jazidas de eras futuras ficam escondidas
  const geo = GEO[sc.map] || {}, elv = ERA_LV[sc.tech] ?? 1;
  g.ter = []; g.riv = []; g.dep = [];
  m.terr.forEach((t, i) => { const [a, b] = (geo[t.n] || 'p').split(' '); g.ter[i] = a[0]; g.riv[i] = a.includes('r'); g.dep[i] = (b || '').split(',').filter(d => d && (DEP[d].era || 0) <= elv); });
  g.lv = Array(N).fill(1); g.food = Array(N).fill(0);
  g.routes = []; g.emb = new Set(); // parte 6
  g.fai = Array(N).fill(null); g.faiths = {}; // parte 10
  g.gvr = {}; g.gfc = {}; g.genA = {}; g.evq = []; // parte 11
  g.pacts = []; g.ally = new Set(); g.mem = {}; g.cb = new Set(); g.truceT = {}; g.offers = []; g.dem = null; g.cs = {}; // parte 9
  for (const d of sc.f) {
    const F = { ...d, real: true, stab: d.st, cards: [], alive: true, entered: !d.late, capI: need(d.cap), passive: !!d.passive, reinf: 0, conq: false, ofs: false, airX: 0, planes: 0, navLeft: 0, nav: d.nav || 1, gold: 3, sci: 0, pre: 2, tech: [], pa: 0, camp: false, recOn: false, tradeOn: false, bldOn: false, res: null, ww: 0, hold: 0, recQ: {}, upk: 0, nB: 0, cq: 0 };
    F.obj = objOf(d, m, g.relics);
    // parte 7: começa sabendo as tecnologias das eras anteriores (sem doutrinas) e as básicas da Antiguidade
    F.tech = TECH.filter(t => !t.doc && (t.e < Math.min(3, elv) || (t.e === 0 && !t.req.length))).map(t => t.k); F.tech0 = F.tech.length;
    F.civ = CIVIC.filter(c => c.e < Math.min(3, elv) || !c.cost).map(c => c.k); F.gov = Object.keys(GOV).filter(k => F.civ.includes(GOV[k].c)).pop(); F.pol = []; F.cu = 0; // parte 10
    if (F.obj.hold) F.obj.hold.forEach(need);
    expand(m, d.t).forEach(n => { const i = need(n); g.own[i] = d.id; g.tr[i] = d.tr || 3; });
    for (const [n, v] of Object.entries(d.trT || {})) g.tr[need(n)] = v;
    expand(m, d.t).forEach(n => g.lv[need(n)] = elv >= 3 ? 2 : 1); g.lv[F.capI] = elv >= 3 ? 4 : 3;
    if (d.t.length) g.tr[F.capI] = Math.max(g.tr[F.capI], d.ctr || (d.tr || 3) + 2);
    g.F[d.id] = F; g.order.push(d.id);
  }
  for (const [n, v, l] of sc.rebels || []) { const i = need(n); g.own[i] = 'reb'; g.tr[i] = v; g.rl[i] = l; }
  g.own.forEach((o, i) => { if (o === 'neu' && i % 3 === 0) g.cs[i] = { t: Object.keys(CS)[i % 6], inf: {}, mis: Object.keys(MIS)[i % 3] }; }); // DP-30
  g.cul = [...g.own]; g.asm = Array(N).fill(0); // S-14, S-22: cultura de cada território
  for (const [a, b] of sc.truces || []) g.truce.add(tk(a, b));
  for (const e of sc.ev) for (const [op, a] of e.fx) {
    if (op === 'rebels' || op === 'place' || op === 'troops') need(a); else if (op === 'give') a.forEach(need); else if (op === 'attrit') expand(m, [].concat(a)).forEach(need);
    else if (a !== '*' && !g.F[a]) throw Error(sc.id + ': facção desconhecida ' + a);
  }
  const G0 = G; G = g; for (const f of g.order) if (g.F[f].ab === 'espiao') g.F[f].cards.push(drawCard(), drawCard()); g.order.forEach(f => g.F[f].t0 = g.own.filter(o => o === f).length); G = G0;
  return g;
}
const tk = (a, b) => a < b ? a + '|' + b : b + '|' + a;
const Fa = id => G.F[id];
const owned = f => { const o = []; for (let i = 0; i < G.N; i++) if (G.own[i] === f) o.push(i); return o; };
const allied = (a, b) => a === b || (!!Fa(a).team && Fa(a).team === Fa(b).team) || (!!G.ally && G.ally.has(tk(a, b)));
const peace = (a, b) => allied(a, b) || G.truce.has(tk(a, b));
const isSea = (i, j) => G.seaK.has(i * 1e4 + j);
const power = f => owned(f).reduce((s, i) => s + G.tr[i], 0);
const hostile = (f, i) => { const o = G.own[i]; return o !== f && o !== 'off' && !peace(f, o); };
const seaOk = (f, i, j) => !isSea(i, j) || G.seaUsed.has(tk(i, j)) || Fa(f).navLeft > 0;
function useSea(f, i, j) { if (!isSea(i, j) || G.seaUsed.has(tk(i, j))) return; Fa(f).navLeft--; G.seaUsed.add(tk(i, j)); }
// probe: a IA avalia ataques antes de declarar campanha
// freio de ritmo: cada facção conquista no máximo cqMax territórios por turno (+1 com a doutrina militar)
const cqMax = f => ECON.cq + (has(f, 'dou') ? 1 : 0);
const canAtk = (f, i, j, probe) => (probe || Fa(f).camp) && (!real(f) || Fa(f).cq < cqMax(f)) && G.own[i] === f && G.tr[i] > 1 && G.A[i].includes(j) && hostile(f, j) && seaOk(f, i, j);
const has = (f, k) => (Fa(f).tech || []).includes(k);
// nb: construção ativa (desativada por falta de ouro não conta); built: existe no território
const built = (i, k) => G.bld[i].includes(k);
const nb = (i, k) => built(i, k) && !G.dis.has(i + ':' + k);
const countB = (f, k) => owned(f).filter(i => nb(i, k)).length;
const coastal = i => G.A[i].some(j => isSea(i, j));
// zonas de recurso são economia, não legado
const legacy = f => 2 * (Fa(f).tech.length - (Fa(f).tech0 || 0)) + owned(f).reduce((s, i) => s + G.bld[i].reduce((t, k) => t + (STRUCT[k].lg || 0), 0), 0);
const minWin = () => Math.ceil(G.rounds / 3); // D-04: objetivo e legado só contam a partir daqui
const evRound = e => 1 + Math.round((e.t - 1) * G.rounds * .5 / G.sc.turns); // eventos espalhados pela 1ª metade da partida
const occupied = i => G.occ[i] > 0;
const settled = f => owned(f).filter(i => !occupied(i)); // territórios que produzem (D-05)
const sName = k => { const n = STRUCT[k].n; return typeof n === 'string' ? n : n[NG[G.era.cards]]; };
// parte 4: efeitos somados das construções ativas
const hasW = (f, k) => real(f) && owned(f).some(i => nb(i, k)); // maravilha do mundo em posse de f
const sumB = (f, p) => owned(f).reduce((s, i) => s + G.bld[i].reduce((t, k) => t + (nb(i, k) && STRUCT[k][p] || 0), 0), 0);
const tName = k => { const n = TK[k].n; return typeof n === 'string' ? n : n[NG[G.era.cards]]; };
const capOwner = i => G.order.find(f => Fa(f).capI === i && Fa(f).entered);
const capsHeld = f => G.order.filter(o => Fa(o).entered && G.own[Fa(o).capI] === f).length;
const tname = i => G.m.terr[i].n;
const fname = f => Fa(f).n;
const real = f => !!(Fa(f) && Fa(f).real);

function reinfOf(f) {
  const F = Fa(f), T = settled(f), oc = owned(f).length - T.length, parts = [];
  const pop = T.reduce((s, i) => s + G.lv[i], 0); // S-03: cada nível de povoamento conta
  let r = Math.max(3, Math.floor(pop / 3)); parts.push([`povoamento ${pop} ÷ 3 (mín. 3)${oc ? `, ${oc} ocupado(s) não contam` : ''}`, r]);
  const g = goods(f), sg = ['fer', 'cav'].filter(d => g.has(d)); if (sg.length) { r += sg.length; parts.push([sg.map(d => DEP[d].n).join(' e '), sg.length]); } // R-32, R-62
  const rf = sumB(f, 'rf'); if (rf) { r += rf; parts.push(['haras, academias e polvorinhos', rf]); }
  const q = countB(f, 'qua'); if (q) { r += q; parts.push([sName('qua'), q]); }
  if (has(f, 'log')) { r += 2; parts.push([tName('log'), 2]); }
  G.regT.forEach((ts, k) => { if (ts.length && ts.every(i => G.own[i] === f)) { const b = Math.max(1, Math.round(ts.length * .5)); r += b; parts.push([G.m.regions[k], b]); } });
  const c = capsHeld(f); if (c) { r += c; parts.push(['capitais', c]); }
  if (F.ab === 'recrutador') { r += 2; parts.push(['Recrutador', 2]); }
  if (gov(f) === 'tri') { r += 1; parts.push([GOV.tri.n, 1]); }
  if (gov(f) === 'rme') { const m = -Math.floor(r / 4); r += m; parts.push([GOV.rme.n, m]); }
  const cm = csBonus(f, 'mil'); if (cm) { r += cm; parts.push(['cidades-estado militares', cm]); } // DP-30
  if (f !== G.player && !G.auto) { const b = G.diff === 2 ? 2 : G.diff === 0 ? -1 : 0; if (b) { r = Math.max(2, r + b); parts.push(['dificuldade', b]); } }
  if (F.stab < 15) { r = Math.ceil(r / 2); parts.push(['instabilidade: metade', 0]); }
  return { r, parts };
}
const planesOf = f => (G.air ? (G.air.per ?? 1) * capsHeld(f) + countB(f, 'aer') : 0) + Fa(f).airX;
const navOf = f => { const F = Fa(f); return F.nav + (F.ab === 'almirante' ? 1 : 0) + countB(f, 'por') + (has(f, 'nav') ? 1 : 0) + (real(f) && has(f, 'oce') ? 1 : 0) + sumB(f, 'nav'); };
function objDone(f) {
  const F = Fa(f), o = F.obj;
  if (G.own[F.capI] !== f) return false;
  if (o.hold && !o.hold.every(n => G.own[G.ix[n]] === f)) return false;
  if (o.n && owned(f).length < o.n) return false;
  if (o.any && o.any.filter(i => G.own[i] === f).length < o.k) return false;
  return legacy(f) >= objLeg(); // D-02: a 2ª etapa do objetivo é desenvolver o império
}
const legWin = () => Math.round(G.len.leg * Math.min(2, Math.max(1, G.N / 30))); // mapas maiores pedem mais legado
const objLeg = () => Math.ceil(legWin() / 2);
function objText(F) {
  const o = F.obj, p = [];
  if (o.txt) return o.txt;
  if (o.hold) p.push('Controle ' + o.hold.join(', '));
  if (o.n) p.push((p.length ? 'e ' : 'Controle ') + o.n + ' territórios');
  if (o.any) p.push('Reúna ' + o.k + ' das ' + o.any.length + ' Runas Antigas (ᚱ)');
  return p.join(' ') + ', mantendo sua capital, por turnos seguidos.';
}
function objLines(f) {
  const F = Fa(f), o = F.obj, L = [[`Capital: ${F.cap}`, G.own[F.capI] === f]];
  (o.hold || []).forEach(n => L.push([n, G.own[G.ix[n]] === f]));
  if (o.n) { const c = owned(f).length; L.push([`${c}/${o.n} territórios`, c >= o.n]); }
  if (o.any) { const c = o.any.filter(i => G.own[i] === f).length; L.push([`${c}/${o.k} runas`, c >= o.k]); }
  L.push([`Desenvolvimento: ${legacy(f)}/${objLeg()} de legado`, legacy(f) >= objLeg()]);
  L.push([`Segurar por ${G.len.hold} turnos seguidos (${F.hold}/${G.len.hold})`, F.hold >= G.len.hold]);
  L.push([`Vitória liberada a partir da rodada ${minWin()}`, G.round >= minWin()]);
  return L;
}
// pontos ao fim das rodadas: quem mais cresceu, não quem começou maior
const score = f => { const F = Fa(f); return owned(f).length - (F.t0 || 0) + 2 * capsHeld(f) + 2 * (F.obj.hold || []).filter(n => G.own[G.ix[n]] === f).length + legacy(f); };
function log(f, msg) { G.log.unshift([f, msg, G.round]); if (G.log.length > 80) G.log.pop(); }

// ---------- governo: recursos e ações ----------
// ---------- parte 3: terreno, zonas, jazidas e povoamento (M-01 a M-10, M-20, M-21, Z-01 a Z-11, R-20 a R-62, S-02 a S-05) ----------
const zonesAt = i => G.bld[i].filter(k => STRUCT[k].z);
const zoneFree = i => G.lv[i] - zonesAt(i).length - G.q[i].filter(x => STRUCT[x.k].z).length;
function zoneOk(k, i) {
  const S = STRUCT[k];
  if (S.lv && G.lv[i] < S.lv) return false;
  if (S.coast) return coastal(i);
  if (!S.ter) return true;
  return S.ter.includes(G.ter[i]) || (S.rio && G.riv[i]) || (S.dz && G.dep[i].some(d => DEP[d].z === S.z));
}
// jazidas exploradas: a zona da jazida está ativa no território e ele não está ocupado
const known = (i, d) => !REVEAL[d] || !real(G.own[i]) || has(G.own[i], REVEAL[d]); // K-02, K-04, K-15
const worked = i => G.dep[i].filter(d => known(i, d) && G.bld[i].some(k => STRUCT[k].z === DEP[d].z && nb(i, k)));
// ---------- parte 5: rede de bens (L-01 a L-03, L-05, C-120 a C-122, C-126) ----------
// rede = capital + territórios seus ligados por estrada (os dois lados com estrada) ou entre portos;
// a trilha (C-120) liga também os vizinhos por terra de quem está na rede.
const road = i => nb(i, 'pav') ? 2 : nb(i, 'est') ? 1 : 0;
function netOf(f) {
  const F = Fa(f), core = new Set(); if (!real(f) || G.own[F.capI] !== f) return { core, linked: core };
  const q = [F.capI]; core.add(F.capI);
  const ports = () => owned(f).filter(i => nb(i, 'por'));
  for (let h = 0; h < q.length; h++) {
    const i = q[h], nx = G.A[i].filter(j => G.own[j] === f && !isSea(i, j) && road(j) && (road(i) || i === F.capI));
    if (nb(i, 'por')) nx.push(...ports());
    for (const j of nx) if (!core.has(j)) { core.add(j); q.push(j); }
  }
  const linked = new Set(core); core.forEach(i => G.A[i].forEach(j => { if (G.own[j] === f && !isSea(i, j)) linked.add(j); }));
  return { core, linked };
}
const goodsAt = T => { const s = new Set(); for (const i of T) if (!occupied(i)) worked(i).forEach(d => s.add(d)); return s; };
const goods = f => { const s = goodsAt(netOf(f).linked); if (real(f)) routeGoods(f).forEach(d => s.add(d)); return s; };
const goodsAll = f => goodsAt(owned(f));
const luxOf = f => [...goods(f)].filter(d => DEP[d].lux).length;
function yieldOf(i) {
  const f = G.own[i], T = TERR[G.ter[i]], lv = G.lv[i], cap = real(f) && Fa(f).capI === i;
  const y = { pre: 0, stab: 0, food: T.food + (G.riv[i] ? 1 : 0) + (coastal(i) ? 1 : 0) + (hasW(f, 'jar') ? 1 : 0), prod: T.prod + (cap ? 2 : 0), gold: T.gold + (G.riv[i] ? 1 : 0) + (cap ? 1 : 0) + (lv >= 2 ? 1 : 0) + (lv >= 4 ? 1 : 0), sci: (lv >= 3 ? 1 : 0) + (lv >= 4 ? 1 : 0) };
  for (const k of G.bld[i]) {
    const S = STRUCT[k]; if (!S.y || !nb(i, k)) continue;
    for (const [r, v] of Object.entries(S.y)) y[r] += v;
    if (k === 'mer' && real(f) && has(f, 'com')) y.gold++;
    if (k === 'ofi' && real(f) && has(f, 'gui')) y.prod++; // K-39
    if (k === 'ofi' && pol(f, 'pro')) y.prod++; // G-24
    if (k === 'aca' && pol(f, 'esc')) y.sci++; // G-26
    if (k === 'tem' && gov(f) === 'teo') y.sci++; // G-04
    if (k === 'uni' && real(f) && has(f, 'imp')) y.sci++; // K-50
    if (k === 'agr' && G.riv[i]) y.food++;
    if (S.z) { const r = Object.keys(S.y)[0]; y[r] += Math.min(3, G.A[i].filter(j => G.own[j] === f && nb(j, k)).length); } // polo
  }
  for (const d of worked(i)) for (const [r, v] of Object.entries(DEP[d].y)) y[r] += v;
  const pn = real(f) && Fa(f).pan; if (pn === 'col' && G.riv[i]) y.food++; if (pn === 'frj' && G.bld[i].includes('min')) y.prod++; if (pn === 'mar' && coastal(i)) y.gold++; // G-50
  y.prod += G.routes.filter(r => r.k === 'int' && r.b === i && rLive(r)).length; // T-01
  if (occupied(i)) for (const r in y) y[r] = Math.floor(y[r] / 2);
  return y;
}
const foodUse = i => 2 * G.lv[i] - 1;
const growNeed = i => LEVEL[G.lv[i]].need * G.len.k;
const growOk = i => !LEVEL[G.lv[i]].req || LEVEL[G.lv[i]].req.some(k => nb(i, k));
function grow(f) {
  for (const i of settled(f)) {
    G.food[i] += yieldOf(i).food - foodUse(i);
    if (G.food[i] < 0) { G.food[i] = 0; if (G.lv[i] > 1 && !nb(i, 'cel')) { G.lv[i]--; log(f, `Fome em ${tname(i)}: volta a ser ${LEVEL[G.lv[i]].n.toLowerCase()}.`); } }
    else if (G.lv[i] < 4 && G.food[i] >= growNeed(i)) {
      if (growOk(i)) { G.food[i] -= growNeed(i); G.lv[i]++; log(f, `${tname(i)} cresce e vira ${LEVEL[G.lv[i]].n.toLowerCase()}.`); }
      else G.food[i] = growNeed(i);
    }
  }
}
function income(f) {
  const F = Fa(f), T = settled(f);
  const diff = f !== G.player && !G.auto ? (G.diff === 2 ? 2 : G.diff === 0 ? -1 : 0) : 0;
  const cd = capDist(f), hm = hap(f) < 0 ? .9 : 1; // S-11: infelicidade tira 10%
  const y = T.reduce((s, i) => {
    const v = yieldOf(i), c = 1 - corrupt(i, cd[i]), lo = tStab(i, cd[i]) < 30 ? .5 : 1; // S-20, S-13
    s.gold += v.gold * c * lo; s.sci += v.sci * c * lo; s.pre += v.pre; s.stab += v.stab; return s;
  }, { gold: 0, sci: 0, pre: 0, stab: 0 });
  const gv = gov(f), gm = (gv === 'dem' ? 1.25 : 1) * (pol(f, 'amb') ? .9 : 1), sm = (gv === 'dem' ? 1.25 : 1) * (gv === 'teo' ? .9 : 1); // parte 10
  y.gold = Math.round(y.gold * hm * gm * (Fa(f).finT >= G.round ? .5 : 1)) // E-32 + (gv === 'rep' ? countB(f, 'mer') : 0) - (pol(f, 'pao') ? owned(f).filter(i => G.lv[i] >= 3).length : 0); y.sci = Math.round(y.sci * hm * sm);
  return {
    gold: Math.max(1, y.gold + diff + routeGold(f)),
    sci: Math.round((1 + y.sci + routeSci(f)) * (hasW(f, 'obi') ? 1.25 : 1) * (has(f, 'cie') ? 1.1 : 1)), stab: y.stab,
    pre: y.pre + capsHeld(f) + countB(f, 'tem') + 2 * countB(f, 'mar') + (has(f, 'ret') ? 1 : 0) + (F.stab >= 70 ? 1 : 0),
  };
}
// ---------- parte 8: população e sociedade (S-10 a S-14, S-20 a S-22, S-24, S-26) ----------
// S-20: distância por terra até a capital (passos pelo mapa), usada na corrupção e na estabilidade local
function capDist(f) {
  const d = Array(G.N).fill(9), c = Fa(f).capI; if (c == null || G.own[c] !== f) return d;
  d[c] = 0; const q = [c];
  for (let h = 0; h < q.length; h++) for (const j of G.A[q[h]]) if (d[j] > d[q[h]] + 1) { d[j] = d[q[h]] + 1; q.push(j); }
  return d;
}
const corrupt = (i, d) => Math.min(.4, .05 * d * (gov(G.own[i]) === 'feu' ? 1.5 : 1)) * (nb(i, 'tri') || road(i) ? .5 : 1); // S-20
// S-11: felicidade do império. Luxos, templos, arenas e festas sobem; cidades, cansaço de guerra e impostos descem
function hap(f) {
  const F = Fa(f); if (!F.real) return 0;
  return 2 * luxOf(f) + countB(f, 'tem') + countB(f, 'anf') + countB(f, 'tea') + 2 * countB(f, 'col') + (F.festT >= G.round ? 4 : 0) + (has(f, 'mis') ? 1 : 0)
    - owned(f).filter(i => G.lv[i] >= 3).length - Math.floor(F.ww / (pol(f, 'ppg') ? 8 : 4)) - (F.taxT >= G.round ? 3 : 0) - (gov(f) === 'abs' ? 2 : 0) - (pol(f, 'csc') ? 1 : 0) + (pol(f, 'pao') ? 2 : 0) - (F.refT >= G.round ? 2 : 0);
}
// S-12: saúde do território. Abaixo de 0, chance de epidemia
const health = i => 2 + (G.riv[i] ? 1 : 0) + (coastal(i) ? 1 : 0) + 2 * ['aqu', 'san', 'hos'].filter(k => nb(i, k)).length - G.lv[i] - (G.bld[i].includes('min') ? 1 : 0) + (pol(G.own[i], 'amb') ? 1 : 0) + (prin(i, 'hos') ? 2 : 0);
// S-13: estabilidade local = do império, menos cultura estrangeira e distância; mais tribunal e guarnição
const tStab = (i, d) => { const f = G.own[i], F = Fa(f); return F.real ? F.stab - (G.cul[i] !== f ? 15 : 0) - 3 * Math.max(0, d - 3) + (nb(i, 'tri') ? 15 : 0) + (G.tr[i] >= 3 ? 5 : 0) + (prin(i, 'dev') ? 5 : 0) + (govrAt(i) === 'pre' ? 15 : 0) + (F.age === 'ouro' || F.age === 'heroica' ? 5 : 0) : 50; };
function society(f) {
  const F = Fa(f), d = capDist(f), h = hap(f);
  if (h < -10) F.stab = Math.max(0, F.stab - 3); // S-11
  for (const i of owned(f)) {
    // S-22: assimilação em 8 turnos; templo, monumento e escola aceleram
    if (G.cul[i] !== f) { G.asm[i] = (G.asm[i] || 0) + 1 + ['tem', 'mon', 'aca'].filter(k => nb(i, k)).length; if (G.asm[i] >= 8) { G.cul[i] = f; G.asm[i] = 0; log(f, `${tname(i)} adota a cultura de ${fname(f)}.`); } }
    // S-12: epidemia
    if (health(i) < 0 && rnd() < .1) { if (G.lv[i] > 1) G.lv[i]--; G.tr[i] = Math.max(1, G.tr[i] - 1); G.routes.forEach(r => { if (r.a === i || r.b === i) r.cutU = G.round + 3; }); log(f, `Epidemia em ${tname(i)}: perde população e tropas; quarentena corta as rotas dele por 3 turnos.`); } // E-20
  }
  // S-13: território com estabilidade local abaixo de 10 pode trocar de lado
  const bad = owned(f).filter(i => i !== F.capI && !nb(i, 'tri') && tStab(i, d[i]) < 10);
  if (bad.length && rnd() < .15) { const i = bad[Math.floor(rnd() * bad.length)]; G.own[i] = 'reb'; G.tr[i] = Math.max(2, G.tr[i]); G.rl[i] = 'Separatistas'; log(f, `${tname(i)} se separa de ${fname(f)}: estabilidade local baixa demais.`); }
  // S-21: migração. Império feliz atrai gente de vizinho infeliz
  if (h >= 6) for (const i of owned(f)) {
    if (G.lv[i] >= 4) continue;
    const j = G.A[i].find(j => real(G.own[j]) && G.own[j] !== f && G.lv[j] >= 2 && hap(G.own[j]) < 0);
    if (j != null && rnd() < .1) { G.lv[j]--; G.lv[i]++; log(f, `Migrantes de ${tname(j)} se mudam para ${tname(i)}.`); break; }
  }
}
// ---------- parte 10: governo, cultura e fé ----------
const gov = f => (Fa(f) && Fa(f).gov) || 'tri';
const pol = (f, k) => !!(Fa(f) && Fa(f).pol && Fa(f).pol.includes(k));
const civ = (f, k) => !!(Fa(f) && Fa(f).civ && Fa(f).civ.includes(k));
const anar = f => (Fa(f).anar || 0) >= G.round;
const wwCount = f => owned(f).reduce((s, i) => s + G.bld[i].filter(k => STRUCT[k].ww && nb(i, k)).length, 0);
// R-05 e G-40: cultura por turno
const cultureInc = f => anar(f) ? 0 : Math.round((1 + ['tem', 'mon', 'tea', 'anf', 'cat', 'mos'].reduce((s, k) => s + countB(f, k), 0) + 2 * countB(f, 'mar') + 2 * wwCount(f) + csBonus(f, 'cul')) * (pol(f, 'mec') ? 1.25 : 1));
const civCost = c => Math.round(c.cost * G.len.k);
const civOk = (f, c) => !civ(f, c.k) && c.req.every(r => civ(f, r));
const slots = f => GOV[gov(f)].s;
const facFaith = f => { const c = Fa(f).capI; return c != null && G.own[c] === f ? G.fai[c] : null; };
const faithOf = i => G.fai[i] && G.faiths[G.fai[i]];
const prin = (i, p) => { const F = faithOf(i); return !!F && (F.a === p || F.b === p); };
function polFit(f) { // descarta políticas que não cabem nas vagas do governo
  const F = Fa(f), s = { ...slots(f) }; F.pol = (F.pol || []).filter(k => POL[k] && civ(f, POL[k].c) && s[POL[k].t] > 0 && s[POL[k].t]--);
}
const freeSlot = (f, t) => (slots(f)[t] || 0) - (Fa(f).pol || []).filter(k => POL[k].t === t).length;
function govAct(f, a, x, y) {
  const F = Fa(f);
  if (a === 'civ') {
    const c = CK[x]; if (!c || !civOk(f, c)) return 'Cívica indisponível.';
    if (F.cu < civCost(c)) return 'Cultura insuficiente.';
    F.cu -= civCost(c); F.civ.push(x); F.pfree = G.round; log(f, `${fname(f)} adota ${c.n}.`); return '';
  }
  if (a === 'gov') {
    const g = GOV[x]; if (!g || !civ(f, g.c) || gov(f) === x) return 'Governo indisponível.';
    if (!spend(f)) return 'Sem pontos de ação.';
    F.gov = x; F.anar = G.round + 2; F.pfree = G.round; polFit(f); log(f, `${fname(f)} adota ${g.n}: 2 turnos de anarquia, sem saber nem cultura.`); return '';
  }
  if (a === 'pol') {
    const p = POL[x]; if (!p || !civ(f, p.c)) return 'Política indisponível.';
    if (pol(f, x)) { F.pol = F.pol.filter(k => k !== x); return ''; }
    if (freeSlot(f, p.t) < 1) return `Sem vaga ${SLOTN[p.t]} livre no governo atual.`;
    if (F.pfree !== G.round && !spend(f)) return 'Trocar política fora do turno de uma cívica nova custa 1 ação.';
    F.pol.push(x); return '';
  }
  if (a === 'pan') {
    if (F.pan) return 'O panteão já foi escolhido.';
    if (!has(f, 'mis') || F.cu < 10 || !PANT[x]) return 'Precisa de Misticismo e 10 de cultura.';
    F.cu -= 10; F.pan = x; log(f, `${fname(f)} adota o panteão: ${PANT[x].n}.`); return '';
  }
  if (a === 'fe') {
    if (G.faiths[f]) return 'Você já fundou uma fé.';
    if (!F.pan || F.cu < 30 || !countB(f, 'tem') || !countB(f, 'mos')) return 'Precisa de panteão, templo, mosteiro e 30 de cultura.';
    if (!PRIN[x] || PRIN[x].t !== 'f' || !PRIN[y] || PRIN[y].t !== 's') return 'Escolha um princípio de fundador e um de seguidor.';
    const used = Object.values(G.faiths).map(v => v.n), n = FAITH_N.find(n => !used.includes(n)); if (!n) return 'Não há mais fés a fundar.';
    F.cu -= 30; G.faiths[f] = { n, a: x, b: y, h: F.capI }; G.fai[F.capI] = f; era(f, 2, 'fundou uma fé'); log(f, `${fname(f)} funda a fé ${n}.`); return '';
  }
  return 'Ação desconhecida.';
}
function govTurn(f) {
  const F = Fa(f);
  F.cu += cultureInc(f);
  if (gov(f) === 'mon') F.stab = Math.min(100, F.stab + 2);
  if (gov(f) === 'tri') F.gold = Math.max(0, F.gold - 1);
  if (F.pan === 'lar') F.stab = Math.min(100, F.stab + Math.floor(owned(f).length / 4));
  if (gov(f) === 'dem' && G.round % 20 === 0 && hap(f) < 0 && F.pol.length) { F.pol = []; log(f, `${fname(f)} perde a eleição: as políticas caem.`); } // G-08
  if (pol(f, 'per')) F.pre += countB(f, 'tem');
  F.gold += 2 * owned(f).filter(i => govrAt(i) === 'tes').length; // F-03
  const fl = G.faiths[f];
  if (fl) { // G-53: difusão pela vizinhança e pelas rotas
    const fol = G.fai.filter(x => x === f).length;
    if (fl.a === 'diz') F.gold += Math.floor(fol / 3);
    if (fl.a === 'se') F.pre += 2;
    const ch = .08 * (fl.a === 'mis' ? 2 : 1);
    G.fai.forEach((x, i) => { if (x !== f) return; for (const j of G.A[i]) if (G.own[j] !== 'off' && G.fai[j] !== f && rnd() < ch * (nb(j, 'tem') ? .5 : 1)) G.fai[j] = f; });
    for (const r of G.routes) if (rLive(r) && G.fai[r.a] === f && G.fai[r.b] !== f && rnd() < ch) G.fai[r.b] = f;
  }
  // G-41: cultura muito maior puxa a lealdade de territórios vizinhos de outras facções
  const ci = cultureInc(f);
  for (const i of owned(f)) for (const j of G.A[i]) {
    const o = G.own[j]; if (!real(o) || o === f || allied(f, o) || Fa(o).capI === j || ci < 2 * cultureInc(o) + 2 || rnd() > .03) continue;
    if (G.cul[j] !== f) { G.cul[j] = f; G.asm[j] = 0; log(f, `A cultura de ${fname(f)} conquista o povo de ${tname(j)}.`); }
    else if (tStab(j, capDist(o)[j]) < 25 && G.lv[j] <= 2) { G.own[j] = f; G.tr[j] = Math.max(1, Math.ceil(G.tr[j] / 2)); remember(o, f, 'tomou nossa terra com cultura', -20); log(f, `${tname(j)} troca ${fname(o)} por ${fname(f)} sem guerra.`); checkRoutes(); }
    return;
  }
}
const POL_AI = { mil: ['csc', 'dis', 'pol'], eco: ['liv', 'est', 'pro'], civ: ['esc', 'pao', 'mec', 'ppg', 'amb'], rel: ['per'] };
function aiGov(f) {
  const F = Fa(f);
  const wantFe = F.pan && !G.faiths[f] && countB(f, 'tem') && countB(f, 'mos'); // junta cultura para fundar a fé
  const c = !wantFe && CIVIC.filter(c => civOk(f, c) && F.cu >= civCost(c)).sort((a, b) => a.cost - b.cost)[0]; if (c) govAct(f, 'civ', c.k);
  const best = Object.keys(GOV).filter(k => civ(f, GOV[k].c) && !(k === 'dem' && hap(f) < 0)).pop();
  if (best && best !== gov(f) && !anar(f) && F.pa > 1 && Object.keys(GOV).indexOf(best) > Object.keys(GOV).indexOf(gov(f)) + 1) govAct(f, 'gov', best);
  if (F.pfree === G.round || !F.pol.length) for (const t in slots(f)) for (const k of POL_AI[t]) if (!pol(f, k) && civ(f, POL[k].c) && freeSlot(f, t) > 0) { if (F.pfree !== G.round) F.pfree = G.round; govAct(f, 'pol', k); }
  if (!F.pan && has(f, 'mis') && F.cu >= 10) govAct(f, 'pan', owned(f).some(i => G.riv[i]) ? 'col' : 'lar');
  if (F.pan && !G.faiths[f] && F.cu >= 30) govAct(f, 'fe', 'diz', 'dev');
}
function govModal() {
  const me = G.player, F = Fa(me), my = G.turnF === me;
  const cv = CIVIC.map(c => { const own = civ(me, c.k), ok = civOk(me, c), lib = [...Object.values(GOV).filter(g => g.c === c.k).map(g => g.n), ...Object.values(POL).filter(p => p.c === c.k).map(p => p.n)];
    return `<div class="tech ${own ? 'own' : ok ? '' : 'lock'}"><div><b>${esc(c.n)}</b> <span class="hint">${civCost(c)} 🎭${c.req.length ? ' · exige ' + esc(c.req.map(r => CK[r].n).join(' e ')) : ''}</span><p class="hint">libera: ${esc(lib.join(', ') || '—')}</p></div>${own ? '<span class="ok">✓</span>' : `<button class="mini ${ok && F.cu >= civCost(c) ? 'pri' : ''}" data-a="gv" data-o="civ" data-k="${c.k}" ${my && ok && F.cu >= civCost(c) ? '' : 'disabled'}>Adotar</button>`}</div>`; }).join('');
  const gv = Object.entries(GOV).map(([k, g]) => `<div class="tech ${gov(me) === k ? 'own' : civ(me, g.c) ? '' : 'lock'}"><div><b>${esc(g.n)}</b> <span class="hint">vagas: ${Object.entries(g.s).map(([t, n]) => n + ' ' + SLOTN[t]).join(', ')}</span><p>${esc(g.fx)}</p></div>${gov(me) === k ? '<span class="ok">atual</span>' : `<button class="mini" data-a="gv" data-o="gov" data-k="${k}" ${my && civ(me, g.c) && F.pa > 0 ? '' : 'disabled'}>Adotar (1 ação)</button>`}</div>`).join('');
  const pl = Object.entries(POL).filter(([, p]) => civ(me, p.c)).map(([k, p]) => `<div class="tech ${pol(me, k) ? 'own' : ''}"><div><b>${esc(p.n)}</b> <span class="hint">${SLOTN[p.t]}</span><p>${esc(p.fx)}</p></div><button class="mini" data-a="gv" data-o="pol" data-k="${k}" ${my ? '' : 'disabled'}>${pol(me, k) ? 'Retirar' : 'Usar'}</button></div>`).join('');
  const fe = G.faiths[me], pan = F.pan ? `<p>Panteão: <b>${esc(PANT[F.pan].n)}</b> (${esc(PANT[F.pan].fx)})</p>` : `<p class="hint">Panteão (exige Misticismo e 10 🎭):</p><p>${Object.entries(PANT).map(([k, p]) => `<button class="mini" data-a="gv" data-o="pan" data-k="${k}" title="${esc(p.fx)}" ${my && has(me, 'mis') && F.cu >= 10 ? '' : 'disabled'}>${esc(p.n)}</button>`).join(' ')}</p>`;
  const fs = fe ? `<p>Sua fé: <b>${esc(fe.n)}</b> · ${esc(PRIN[fe.a].n)} e ${esc(PRIN[fe.b].n)} · ${G.fai.filter(x => x === me).length} territórios seguem</p>` : F.pan ? `<p class="hint">Fundar uma fé (templo, mosteiro e 30 🎭): escolha um princípio de fundador e um de seguidor.</p><p>${Object.entries(PRIN).filter(([, p]) => p.t === 'f').map(([a, p]) => Object.entries(PRIN).filter(([, q]) => q.t === 's').map(([b, q]) => `<button class="mini" data-a="gv" data-o="fe" data-k="${a}" data-y="${b}" title="${esc(p.fx + ' ' + q.fx)}" ${my && F.cu >= 30 ? '' : 'disabled'}>${esc(p.n)} + ${esc(q.n)}</button>`).join(' ')).join(' ')}</p>` : '';
  const others = Object.entries(G.faiths).filter(([f]) => f !== me).map(([f, v]) => `${esc(v.n)} (${esc(fname(f))}, ${G.fai.filter(x => x === f).length} terr.)`).join(' · ');
  modal(`<h2>Governo, cultura e fé</h2><p class="hint">Cultura: ${F.cu} 🎭 (+${cultureInc(me)} por turno)${anar(me) ? ' · <b>anarquia</b>: sem saber nem cultura' : ''}. Adotar cívica não gasta ação e deixa trocar políticas de graça neste turno; fora disso, cada política nova custa 1 ação.</p>
    <h3>Governo: ${esc(GOV[gov(me)].n)}</h3><div class="techs">${gv}</div><h3>Políticas</h3><div class="techs">${pl || '<p class="hint">Adote cívicas para liberar políticas.</p>'}</div><h3>Cívicas</h3><div class="techs">${cv}</div><h3>Crenças</h3>${pan}${fs}${others ? `<p class="hint">Outras fés: ${others}</p>` : ''}`, [['Fechar']]);
}
// ---------- parte 11: personagens e eventos (F-01 a F-03, F-10 a F-16, F-30 a F-38, E-10 a E-13, E-20 a E-34) ----------
const LNAME = ['Aurélia', 'Bento', 'Cássio', 'Dália', 'Estêvão', 'Flora', 'Gaspar', 'Helena', 'Inácio', 'Júlia', 'Leandro', 'Marta', 'Nuno', 'Olívia', 'Plácido', 'Rute', 'Sávio', 'Teodora', 'Valério', 'Zenóbia'];
const newLeader = f => ({ n: LNAME[Math.floor(rnd() * LNAME.length)] + ' ' + ['I', 'II', 'III', 'IV', 'V'][Math.floor(rnd() * 5)], r: G.round, d: 25 + Math.floor(rnd() * 16) });
// F-02: sucessão nas monarquias (25 a 40 turnos) e eleição nas repúblicas (20); E-28: crise com estabilidade baixa
function succession(f) {
  const F = Fa(f); if (!F.ld) F.ld = newLeader(f);
  const rep = ['rep', 'rme', 'dem'].includes(gov(f));
  if (G.round - F.ld.r < (rep ? 20 : F.ld.d)) return;
  const opts = Object.keys(ABIL).sort(() => rnd() - .5).slice(0, 3), old = F.ld.n;
  F.ld = newLeader(f); F.ab = opts[0];
  log(f, `${rep ? 'Eleição' : 'Sucessão'} em ${fname(f)}: ${old} dá lugar a ${F.ld.n} (${ABIL[F.ab][0]}).`);
  if (!rep && F.stab < 30) { // E-28
    const T = owned(f).filter(i => i !== F.capI).sort(() => rnd() - .5).slice(0, Math.floor(owned(f).length / 4));
    T.forEach(i => { G.own[i] = 'reb'; G.tr[i] = Math.max(2, G.tr[i]); G.rl[i] = 'Pretendentes'; });
    if (T.length) { log(f, `Crise de sucessão em ${fname(f)}: ${T.length} território(s) apoiam um pretendente rival.`); checkRoutes(); }
  }
}
// F-03: governadores. 1 + 1 a cada 4 cívicas; ficam num território
const GOVR = { int: ['Intendente', 'obras 25% mais rápidas'], pre: ['Prefeito', '+15 de estabilidade local'], tes: ['Tesoureiro', '+2 ouro por turno'] };
const govrMax = f => 1 + Math.floor(((Fa(f).civ || []).length) / 4);
const govrAt = i => G.gvr[i] && G.own[i] === G.gvr[i].f ? G.gvr[i].k : null;
const govrN = f => Object.values(G.gvr).filter((g, n) => g.f === f).length;
function placeGovr(f, i, k) {
  if (G.own[i] !== f || !GOVR[k]) return 'Escolha um território seu.';
  if (!govrAt(i) && govrN(f) >= govrMax(f)) return `Limite de ${govrMax(f)} governador(es); adote mais cívicas.`;
  G.gvr[i] = { f, k }; log(f, `${fname(f)} nomeia ${GOVR[k][0].toLowerCase()} em ${tname(i)}.`); return '';
}
// F-10 a F-16: grandes figuras. Pontos vêm das zonas; quem chega primeiro ao custo leva, e o custo sobe para todos
const GF = {
  sci: { n: 'Grande cientista', b: ['aca', 'uni', 'obs', 'acd'], fx: 'termina a pesquisa atual' },
  eng: { n: 'Grande engenheiro', b: ['ofi', 'fun', 'min', 'frr', 'fab'], fx: 'faz 50% da primeira obra da fila mais cara' },
  mer: { n: 'Grande mercador', b: ['mer', 'por', 'ban', 'car'], fx: '+15 ouro e +1 rota permanente' },
  art: { n: 'Grande artista', b: ['tea', 'anf', 'mon'], fx: '+15 cultura' },
  gen: { n: 'Grande general', b: ['acm', 'qua'], fx: 'fica no território: +1 no ataque saindo dali e dos vizinhos' },
  adm: { n: 'Grande almirante', b: ['stl', 'arm'], fx: '+1 travessia permanente' },
  pro: { n: 'Grande profeta', b: ['tem', 'mos', 'cat'], fx: 'funda uma fé sem precisar de templo, mosteiro nem cultura, ou espalha a sua' },
};
const gfCost = t => Math.round((G.gfc[t] || 20) * G.len.k);
function figures(f) {
  const F = Fa(f); F.gp = F.gp || {}; F.gf = F.gf || [];
  for (const t in GF) {
    const p = GF[t].b.reduce((s, k) => s + countB(f, k), 0) + (t === 'gen' ? F.cq : 0) + (t === 'art' && pol(f, 'mec') ? 1 : 0);
    if (!p) continue; F.gp[t] = (F.gp[t] || 0) + p;
    if (F.gp[t] >= gfCost(t)) { F.gp[t] -= gfCost(t); G.gfc[t] = Math.round((G.gfc[t] || 20) * 1.5); F.gf.push(t); log(f, `${GF[t].n} surge em ${fname(f)}.`); if (f !== G.player || G.auto || t === 'gen') useFig(f, F.gf.length - 1); }
  }
}
function useFig(f, n) {
  const F = Fa(f), t = F.gf[n]; if (!t) return 'Figura inexistente.';
  if (t === 'sci') { if (!F.res) return 'Escolha uma pesquisa antes.'; F.sci = Math.max(F.sci, techCost(TK[F.res], f)); }
  else if (t === 'eng') { const q = owned(f).flatMap(i => G.q[i].map((x, m) => [i, m, pCost(f, x.k, i)])).sort((a, b) => b[2] - a[2])[0]; if (!q) return 'Não há obra na fila.'; G.q[q[0]][q[1]].p += Math.ceil(q[2] / 2); }
  else if (t === 'mer') { F.gold += 15; F.rtB = (F.rtB || 0) + 1; }
  else if (t === 'art') F.cu += 15;
  else if (t === 'gen') { const i = owned(f).filter(i => G.A[i].some(j => hostile(f, j))).sort((a, b) => G.tr[b] - G.tr[a])[0] ?? F.capI; G.genA[i] = f; log(f, `O grande general de ${fname(f)} assume em ${tname(i)}.`); }
  else if (t === 'adm') F.nav++;
  else if (t === 'pro') {
    if (!G.faiths[f]) { const used = Object.values(G.faiths).map(v => v.n), nm = FAITH_N.find(n => !used.includes(n)); if (!nm) return 'Não há mais fés a fundar.'; if (!F.pan) F.pan = 'lar'; G.faiths[f] = { n: nm, a: 'diz', b: 'dev', h: F.capI }; G.fai[F.capI] = f; log(f, `O grande profeta de ${fname(f)} funda a fé ${nm}.`); era(f, 2, 'fundou uma fé'); }
    else owned(f).forEach(i => { G.fai[i] = f; G.A[i].forEach(j => { if (rnd() < .5 && G.own[j] !== 'off') G.fai[j] = f; }); });
  }
  F.gf.splice(n, 1); if (t !== 'gen') log(f, `${fname(f)} usa o ${GF[t].n.toLowerCase()}.`); return '';
}
const genBonus = (f, i) => [i, ...G.A[i]].some(j => G.genA[j] === f && G.own[j] === f) ? 1 : 0;
// F-30 a F-38: espionagem. 1 ação e 3 ouro; o dado precisa passar do risco mais a defesa do alvo
const SPY = {
  ver: { n: 'Ver obras e tropas', r: 1, fx: 'mostra a fila e as tropas do alvo' },
  tec: { n: 'Roubar tecnologia', r: 2, fx: 'ganha uma tecnologia que o alvo tem (exige biblioteca ou universidade no território)' },
  sab: { n: 'Sabotar obra', r: 2, fx: 'a primeira obra da fila perde metade do progresso' },
  rot: { n: 'Sabotar rota', r: 2, fx: 'corta por 3 turnos as rotas que passam pelo território' },
  rev: { n: 'Fomentar revolta', r: 3, fx: '−15 de estabilidade; com estabilidade abaixo de 30, o território pode virar rebelde' },
  ppg: { n: 'Propaganda', r: 2, fx: 'o povo do território passa a ter a sua cultura (exige Imprensa)' },
};
const spyDef = i => { const o = G.own[i]; return (pol(o, 'pol') ? 2 : 0) + (nb(i, 'tri') ? 1 : 0) + (G.gvr[i] && govrAt(i) === 'pre' ? 1 : 0); }; // F-37
function spy(f, i, k) {
  const F = Fa(f), o = G.own[i], S = SPY[k];
  if (!S || !real(o) || o === f) return 'Escolha um território de outra facção.';
  if (!has(f, 'esc')) return 'Espiões exigem Escrita.';
  if (k === 'ppg' && !has(f, 'imp')) return 'Propaganda exige Imprensa.';
  if (k === 'tec' && !nb(i, 'aca') && !nb(i, 'uni')) return 'Roubar tecnologia exige biblioteca ou universidade no território.';
  if (F.gold < 3) return 'Ouro insuficiente.';
  if (!spend(f)) return 'Sem pontos de ação.';
  F.gold -= 3;
  if (d6() <= S.r + spyDef(i)) { // F-38: espião pego
    remember(o, f, 'pegamos um espião seu', -20); G.cb.add(o + '>' + f);
    log(f, `Espião de ${fname(f)} é pego em ${tname(i)}: ${fname(o)} ganha motivo de guerra.`); return 'Seu espião foi pego.';
  }
  let r = 'Missão cumprida.';
  if (k === 'ver') r = `${tname(i)}: ${G.tr[i]} tropas · tropas ${armyOf(o).map(a => ARMY[a].n).join(', ') || 'milícia'} · fila ${G.q[i].map(x => sName(x.k)).join(', ') || 'vazia'}.`;
  else if (k === 'tec') { const t = Fa(o).tech.filter(t => !has(f, t)); if (!t.length) r = 'Nada de novo para roubar.'; else { const x = t[Math.floor(rnd() * t.length)]; F.tech.push(x); r = `Roubou ${tName(x)}.`; } }
  else if (k === 'sab') { const x = G.q[i][0]; if (x) { x.p = Math.floor(x.p / 2); r = `${sName(x.k)} perdeu metade do progresso.`; } else r = 'Não havia obra.'; }
  else if (k === 'rot') G.routes.forEach(x => { if (x.a === i || x.b === i) x.cutU = G.round + 3; });
  else if (k === 'rev') { Fa(o).stab = Math.max(0, Fa(o).stab - 15); if (Fa(o).stab < 30 && i !== Fa(o).capI && rnd() < .3) { G.own[i] = 'reb'; G.rl[i] = 'Revoltosos'; r = `${tname(i)} se revolta!`; checkRoutes(); } }
  else if (k === 'ppg') { G.cul[i] = f; G.asm[i] = 0; }
  log(f, `Espião de ${fname(f)} em ${tname(i)}: ${S.n.toLowerCase()}.`); return r;
}
// E-10 a E-13: pontos de era por marcos; a cada quarto da partida, era de ouro, sombria ou heroica
function era(f, n, why) { const F = Fa(f); if (!F.real) return; F.ep = (F.ep || 0) + n; if (f === G.player && !G.auto) log(f, `Marco: ${why} (+${n} de era).`); }
const ageLen = () => Math.max(10, Math.round(G.rounds / 4));
function ageCheck() {
  if (G.round % ageLen()) return;
  for (const f of G.order) {
    const F = Fa(f); if (!F.alive || !F.entered) continue;
    const ep = F.ep || 0, prev = F.age;
    F.age = ep >= 6 ? (prev === 'sombria' ? 'heroica' : 'ouro') : ep <= 1 ? 'sombria' : null; F.ep = 0;
    if (F.age === 'sombria') F.stab = Math.max(0, F.stab - 10);
    if (F.age) log(f, `${fname(f)} entra numa era ${F.age === 'ouro' ? 'de ouro' : F.age}.`);
  }
}
const agePA = f => ({ ouro: 1, heroica: 2 }[Fa(f).age] || 0);
// E-20 a E-34: eventos com chance por turno; os com escolha vão para o jogador num quadro
const nomadOk = () => eraLv() <= 2;
function events(f) {
  const F = Fa(f), T = owned(f); if (!T.length || rnd() > .12) return;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const ev = [];
  const riv = T.filter(i => G.riv[i]), mt = T.filter(i => 'mh'.includes(G.ter[i]) && G.bld[i].some(k => !STRUCT[k].wonder && !STRUCT[k].z)), gar = T.filter(i => nb(i, 'gar'));
  ev.push('seca');
  if (riv.length) ev.push('inun');
  if (mt.length) ev.push('terr');
  if (gar.length) ev.push('ouro');
  if (hap(f) < -5) ev.push('camp');
  if (T.some(i => nb(i, 'aca') || nb(i, 'uni'))) ev.push('inv');
  if (countB(f, 'tea') || countB(f, 'anf')) ev.push('mec');
  if (eraLv() >= 4 && !countB(f, 'ban')) ev.push('fin');
  if (G.order.some(o => o !== f && Fa(o).alive && Fa(o).ww >= 5 && T.some(i => G.A[i].some(j => G.own[j] === o)))) ev.push('mig');
  const st = G.own.map((o, j) => j).filter(j => G.own[j] === 'neu' && 'de'.includes(G.ter[j]) && G.A[j].some(i => G.own[i] === f));
  if (nomadOk() && st.length) ev.push('nom');
  const fl = G.faiths[f]; if (fl && G.fai.filter(x => x === f).length >= 12) ev.push('cis');
  const e = pick(ev);
  if (e === 'seca') { const i = pick(T); if (!nb(i, 'cel')) { G.food[i] = Math.max(0, G.food[i] - 10); log(f, `Seca em ${tname(i)}: o estoque de comida cai.`); } else log(f, `Seca em ${tname(i)}, mas o celeiro segura a fome.`); }
  else if (e === 'inun') { const i = pick(riv), k = ['faz', 'agr', 'arz'].find(k => G.bld[i].includes(k)); if (k) G.bld[i].splice(G.bld[i].indexOf(k), 1); G.food[i] += 10; log(f, `Enchente em ${tname(i)}${k ? ': ' + sName(k) + ' destruída' : ''}, mas o solo fica fértil (+10 comida).`); }
  else if (e === 'terr') { const i = pick(mt), ks = G.bld[i].filter(k => !STRUCT[k].wonder && !STRUCT[k].z), k = pick(ks); G.bld[i].splice(G.bld[i].indexOf(k), 1); log(f, `Terremoto em ${tname(i)} destrói ${sName(k)}.`); }
  else if (e === 'ouro') { const i = pick(gar); if (G.lv[i] < 4) G.lv[i]++; F.gold += 5; F.stab = Math.max(0, F.stab - 5); log(f, `Corrida do ouro em ${tname(i)}: gente e ouro chegam, e a ordem sofre.`); }
  else if (e === 'inv') { if (F.res) { F.sci += Math.ceil(techCost(TK[F.res], f) / 2); log(f, `Invenção inesperada em ${fname(f)} adianta a pesquisa.`); } }
  else if (e === 'mec') { F.gp = F.gp || {}; F.gp.art = (F.gp.art || 0) + 10; log(f, `Um mecenas apoia os artistas de ${fname(f)}.`); }
  else if (e === 'fin') { F.finT = G.round + 5; log(f, `Crise financeira em ${fname(f)}: −50% de ouro por 5 turnos.`); }
  else if (e === 'nom') { const j = pick(st); G.own[j] = 'reb'; G.tr[j] = 6 + Math.floor(rnd() * 5); G.rl[j] = 'Horda nômade'; log(f, `Uma horda nômade surge em ${tname(j)}, na fronteira de ${fname(f)}!`); }
  else if (e === 'cis') { const out = G.fai.map((x, i) => i).filter(i => G.fai[i] === f && G.own[i] !== f); out.forEach(i => { if (rnd() < .5) G.fai[i] = null; }); fl.b = pick(Object.keys(PRIN).filter(k => PRIN[k].t === 's')); log(f, `Cisma na fé ${fl.n}: parte dos fiéis de fora se afasta, e a reforma adota ${PRIN[fl.b].n}.`); }
  else if (e === 'camp' || e === 'mig') choice(f, e);
}
const CHOICE = {
  camp: { n: 'Revolta camponesa', d: 'O povo infeliz pega em armas.', o: [['Ceder', 'sem impostos por 5 turnos e +10 de estabilidade', f => { Fa(f).taxT = -1; Fa(f).noTax = G.round + 5; Fa(f).stab = Math.min(100, Fa(f).stab + 10); }], ['Reprimir', '−10 de estabilidade e um território pode virar rebelde', f => { const F = Fa(f); F.stab = Math.max(0, F.stab - 10); const T = owned(f).filter(i => i !== F.capI); if (T.length && rnd() < .5) { const i = T[Math.floor(rnd() * T.length)]; G.own[i] = 'reb'; G.tr[i] = Math.max(2, G.tr[i]); G.rl[i] = 'Camponeses'; checkRoutes(); } }]] },
  mig: { n: 'Migração em massa', d: 'Refugiados de uma guerra vizinha pedem abrigo.', o: [['Acolher', '+1 nível num território de fronteira e −2 de felicidade por 5 turnos', f => { const i = owned(f).filter(i => G.lv[i] < 4)[0]; if (i != null) G.lv[i]++; Fa(f).refT = G.round + 5; }], ['Fechar a fronteira', '−10 de relação com os vizinhos em guerra', f => G.order.forEach(o => { if (o !== f && Fa(o).ww >= 5) remember(o, f, 'fechou a fronteira aos nossos', -10); })]] },
};
function choice(f, k) {
  const C = CHOICE[k];
  if (f !== G.player || G.auto) { C.o[0][2](f); log(f, `${C.n} em ${fname(f)}: ${C.o[0][0].toLowerCase()}.`); return; }
  G.evq.push(k);
}
function showChoice() {
  const k = G.evq.shift(); if (!k) return; const C = CHOICE[k], me = G.player;
  modal(`<p class="kick">Evento</p><h2>${esc(C.n)}</h2><p>${esc(C.d)}</p><ul>${C.o.map(o => `<li><b>${esc(o[0])}</b>: ${esc(o[1])}</li>`).join('')}</ul>`, C.o.map(o => [o[0], () => { o[2](me); log(me, `${C.n}: você escolhe ${o[0].toLowerCase()}.`); render(); showChoice(); }]));
}
// E-21: peste continental na Idade Média com muitas rotas
function plague() {
  if (eraLv() !== 2 || G.routes.filter(rLive).length < 8 || rnd() > .02) return;
  G.own.forEach((o, i) => { if (real(o) && G.lv[i] >= 3 && !nb(i, 'san') && !nb(i, 'mos') && rnd() < .6) G.lv[i]--; });
  log(null, 'Peste continental! As cidades sem saneamento nem mosteiro perdem população.');
}
function figModal() {
  const me = G.player, F = Fa(me), my = G.turnF === me;
  const gf = (F.gf || []).map((t, n) => `<div class="tech"><div><b>${esc(GF[t].n)}</b><p>${esc(GF[t].fx)}</p></div><button class="mini pri" data-a="fig" data-n="${n}" ${my ? '' : 'disabled'}>Usar</button></div>`).join('');
  const pts = Object.keys(GF).map(t => `<li>${esc(GF[t].n)}: ${(F.gp || {})[t] || 0}/${gfCost(t)} (de ${GF[t].b.map(sName).join(', ')}${t === 'gen' ? ' e conquistas' : ''})</li>`).join('');
  const gv = Object.entries(G.gvr).filter(([i, g]) => g.f === me && G.own[i] === me).map(([i, g]) => `<li>${esc(GOVR[g.k][0])} em ${esc(tname(+i))}: ${GOVR[g.k][1]}</li>`).join('');
  modal(`<h2>Personagens</h2><p>Líder: <b>${esc(F.ld ? F.ld.n : '—')}</b> · ${esc(ABIL[F.ab][0])}: ${esc(ABIL[F.ab][1])}${F.age ? ` · era ${F.age === 'ouro' ? 'de ouro' : F.age}` : ''} · pontos de era ${F.ep || 0}</p>
    <h3>Grandes figuras</h3><div class="techs">${gf || '<p class="hint">Nenhuma figura à espera.</p>'}</div><ul class="hint">${pts}</ul>
    <h3>Governadores (${govrN(me)}/${govrMax(me)})</h3><ul>${gv || '<li class="hint">Nenhum. Selecione um território seu e nomeie no painel dele.</li>'}</ul>`, [['Fechar']]);
}
function aiChars(f) {
  const F = Fa(f);
  if (govrN(f) < govrMax(f)) { const i = owned(f).filter(i => !govrAt(i)).sort((a, b) => G.lv[b] - G.lv[a])[0]; if (i != null) placeGovr(f, i, i === F.capI ? 'int' : tStab(i, capDist(f)[i]) < 40 ? 'pre' : 'tes'); }
  if (has(f, 'esc') && F.pa > 0 && F.gold >= 8 && rnd() < .25) {
    const t = G.order.filter(o => o !== f && Fa(o).alive && !allied(f, o) && Fa(o).tech.length > F.tech.length).flatMap(owned).find(i => nb(i, 'aca') || nb(i, 'uni'));
    if (t != null) spy(f, t, 'tec');
  }
}
const coloPair = f =>{ for (const i of owned(f).filter(i => G.lv[i] >= 3).sort((a, b) => G.lv[b] - G.lv[a])) { const j = G.A[i].find(j => G.own[j] === f && G.lv[j] === 1 && !occupied(j)); if (j != null) return [i, j]; } return null; };
const paOf = f => ECON.pa + agePA(f) + (has(f, 'adm') ? 1 : 0) + ({ rep: 1, abs: 1, dem: 2 }[gov(f)] || 0) + Math.min(2, Math.floor(owned(f).filter(i => G.lv[i] >= 3).length / 3)); // S-04
const troopCost = f => Math.max(1, Math.round(((has(f, 'con') ? 1 : ECON.troop) - (gov(f) === 'feu' ? 1 : 0)) * (pol(f, 'csc') ? .75 : 1))); // G-05, G-20
// ---------- obras em turnos (parte 2: P-01 a P-04, P-08, P-11) ----------
// pedra barateia muralhas, templos e maravilhas; madeira, portos, oficinas e quartéis (R-25, R-26)
const CHEAP = { ped: ['for', 'tem', 'mar', 'cas', 'cat', 'aqu'], mad: ['por', 'ofi', 'qua', 'pal', 'ser'] };
const STONE = ['for', 'tem', 'mon', 'pdr', 'cas', 'cat']; // Grandes Pirâmides (C-200)
const pCost = (f, k, i) => {
  const g = real(f) ? goods(f) : new Set(), c = Object.entries(CHEAP).some(([d, ks]) => ks.includes(k) && g.has(d)), p = STONE.includes(k) && hasW(f, 'pir');
  const t = STRUCT[k].road && i != null ? ({ m: 2, w: 2, d: 1.5 }[G.ter[i]] || 1) : 1; // L-11
  const gv = (STRUCT[k].road && pol(f, 'est') ? .5 : 1) * (k === 'cas' && gov(f) === 'feu' ? .75 : 1) * (STRUCT[k].wonder && gov(f) === 'abs' ? .75 : 1); // G-22, G-05, G-07
  return Math.round(STRUCT[k].pc * G.len.k * (has(f, 'eng') ? .75 : 1) * (c ? .75 : 1) * (p ? .75 : 1) * t * gv);
};
const qMax = f => has(f, 'adm') ? 5 : 3;
function prodOf(i) {
  return real(G.own[i]) ? Math.max(1, Math.round(yieldOf(i).prod * (govrAt(i) === 'int' ? 1.25 : 1))) : 0; // F-03
}
const queued = (i, k) => G.q[i].some(x => x.k === k);
const hasWonder = f => owned(f).some(j => built(j, 'mar') || queued(j, 'mar'));
const eraLv = () => ERA_LV[G.sc.tech] ?? 1;
const wwTaken = k => G.bld.some(b => b.includes(k)); // maravilha do mundo já existe em algum lugar
const goodOk = (f, alts) => { const g = goods(f); return alts.some(a => a.split('+').every(d => g.has(d))); };
// parte 4: requisitos de uma obra que não dependem do território (era, tecnologia, bens, maravilhas)
function reqF(f, k) {
  const S = STRUCT[k];
  if (S.air && !G.air) return 'sem aviação nesta era';
  if (S.era != null && eraLv() < S.era) return 'era posterior';
  if (S.eraMax != null && eraLv() > S.eraMax) return 'de uma era anterior';
  if (S.tech && !has(f, S.tech)) return 'exige ' + tName(S.tech);
  if (S.wonder && !S.ww && (!has(f, S.req) || hasWonder(f))) return 'exige ' + tName(S.req) + ' (uma por facção)';
  if (S.ww && wwTaken(k)) return 'já construída no mundo';
  if (S.good && !goodOk(f, S.good)) { // UI-03: diz se o bem existe mas está fora da rede
    const all = goodsAll(f), off = S.good.some(a => a.split('+').every(d => all.has(d)));
    return 'exige ' + S.good.map(a => a.split('+').map(d => DEP[d].n).join(' e ')).join(' ou ') + (off ? ' ligado à rede: você explora, mas fora dela; ligue com estrada ou porto' : ' explorado');
  }
  if (S.needE && !countB(f, S.needE)) return 'exige ' + sName(S.needE) + ' no império';
  return '';
}
function canQueue(f, k, i) {
  const S = STRUCT[k];
  if (G.own[i] !== f || built(i, k) || queued(i, k) || G.q[i].length >= qMax(f)) return false;
  if (S.sea && !coastal(i)) return false;
  if (S.z && (zoneFree(i) < 1 || !zoneOk(k, i))) return false;
  if (!S.z && (S.coast && !coastal(i) || S.lv && G.lv[i] < S.lv)) return false;
  if (S.need && ![].concat(S.need).some(b => built(i, b))) return false;
  if (S.dep && !S.dep.some(d => G.dep[i].includes(d))) return false;
  if (S.rioReq && !G.riv[i]) return false;
  if (S.near && ![i, ...G.A[i]].some(j => S.near.includes(G.ter[j]))) return false;
  if (S.ww && owned(f).some(j => queued(j, k))) return false;
  return !reqF(f, k);
}
// turnos que faltam para cada item da fila, somando a produção atual em sequência
function qEta(i) {
  const p = prodOf(i), f = G.own[i]; let acc = 0;
  return G.q[i].map(x => { acc += pCost(f, x.k, i) - x.p; return p ? Math.ceil(acc / p) : Infinity; });
}
const rushCost = (f, i, n) => { const x = G.q[i][n]; return x ? (pCost(f, x.k, i) - x.p) * (STRUCT[x.k].wonder ? ECON.rushW : ECON.rush) * (gov(f) === 'rme' ? .75 : 1) : 0; };
const canRush = (f, i, n) => { const x = G.q[i][n]; return !!x && G.own[i] === f && Fa(f).bldOn && x.t < G.round && Fa(f).gold >= rushCost(f, i, n); };
function finishWork(i, n) {
  const f = G.own[i], x = G.q[i].splice(n, 1)[0]; G.bld[i].push(x.k); Fa(f).nB++;
  log(f, `${fname(f)} conclui ${sName(x.k)} em ${tname(i)}.`);
  if (STRUCT[x.k].wonder) era(f, G.bld.filter(b => b.some(k => STRUCT[k].wonder)).length === 1 ? 3 : 1, `concluiu ${sName(x.k)}`); // E-10
  if (STRUCT[x.k].ww) for (let j = 0; j < G.N; j++) { const n0 = G.q[j].length; G.q[j] = G.q[j].filter(y => y.k !== x.k); if (G.q[j].length < n0 && real(G.own[j])) log(G.own[j], `${fname(G.own[j])} perde a obra de ${sName(x.k)}: outra facção terminou primeiro.`); }
}
// produção do território entra no item do topo; o excesso passa ao seguinte
function produce(f) {
  for (const i of owned(f)) {
    let p = prodOf(i);
    while (p > 0 && G.q[i].length) {
      const x = G.q[i][0], use = Math.min(p, pCost(f, x.k, i) - x.p);
      x.p += use; p -= use;
      if (x.p >= pCost(f, x.k, i)) finishWork(i, 0);
    }
  }
}
// manutenção (P-11 e A-44): tropas primeiro; sem ouro, desertam. Depois as obras, a mais cara desativa primeiro.
function upkeepOf(f) {
  let b = 0, ex = 0;
  for (const i of owned(f)) { for (const k of G.bld[i]) b += STRUCT[k].up || 0; ex += Math.max(0, G.tr[i] - ECON.freeT); }
  return { b, t: Math.floor(ex / ECON.perT) };
}
function payUpkeep(f) {
  const F = Fa(f), u = upkeepOf(f), T = owned(f);
  T.forEach(i => G.bld[i].forEach(k => G.dis.delete(i + ':' + k)));
  let pay = F.gold;
  if (pay >= u.t) pay -= u.t;
  else {
    let lost = u.t - pay; pay = 0; const n = lost;
    while (lost > 0) { const i = T.slice().sort((a, b) => G.tr[b] - G.tr[a])[0]; if (i == null || G.tr[i] <= ECON.freeT) break; G.tr[i]--; lost--; }
    F.stab = Math.max(0, F.stab - 3);
    log(f, `Sem ouro para o soldo: ${n - lost} tropa(s) de ${fname(f)} desertam.`);
  }
  const list = T.flatMap(i => G.bld[i].filter(k => STRUCT[k].up).map(k => [i, k])).sort((a, b) => STRUCT[b[1]].up - STRUCT[a[1]].up);
  let off = 0;
  for (const [i, k] of list) { if (pay >= STRUCT[k].up) pay -= STRUCT[k].up; else { G.dis.add(i + ':' + k); off++; } }
  if (off) log(f, `${fname(f)} sem ouro: ${off} construção(ões) desativada(s) neste turno.`);
  F.upk = u.b + u.t; F.gold = pay;
}
const techOk = (f, t) => !has(f, t.k) && (t.req || []).every(r => has(f, r));
const inflCost = (f, j) => Math.max(1, G.tr[j] + 1 - (has(f, 'ret') ? 1 : 0));
const canRecruitAt = (f, i) => G.own[i] === f && (i === Fa(f).capI || nb(i, 'qua'));
const canInfl = (f, j) => (G.own[j] === 'neu' || G.own[j] === 'reb') && !capOwner(j) && (!csOf(j) || suz(j) === f) && G.A[j].some(i => G.own[i] === f) && Fa(f).pre >= inflCost(f, j);
const spend = f => { const F = Fa(f); if (F.pa < 1) return false; F.pa--; return true; };
// Cada ação gasta 1 ponto de ação; devolve texto de erro ou '' quando deu certo.
function act(f, a, x, y) {
  const F = Fa(f);
  if (a === 'res') { // escolher a pesquisa não gasta ação; o saber de cada turno vai para ela (P-09)
    const t = TK[x]; if (!t || !techOk(f, t)) return 'Tecnologia indisponível.';
    F.res = x; return '';
  }
  if (a === 'merc') { // A-47: mercenários chegam na hora à capital, pelo dobro do preço, sem gastar ação (1 por turno)
    if (F.merc === G.round) return 'Já contratou mercenários neste turno.';
    if (G.own[F.capI] !== f) return 'Sem capital para receber mercenários.';
    const cu = gov(f) === 'teo' && F.cu >= 2 * troopCost(f); // G-04: mercenários pagos com cultura
    if (!cu && F.gold < 2 * troopCost(f)) return 'Ouro insuficiente.';
    if (cu) F.cu -= 2 * troopCost(f); else F.gold -= 2 * troopCost(f); G.tr[F.capI]++; F.merc = G.round; log(f, `${fname(f)} contrata mercenários em ${tname(F.capI)}.`); return '';
  }
  if (a === 'bld' || a === 'unq' || a === 'rush') { // dentro das obras abertas: sem custo de ação (P-03)
    if (!F.bldOn) return 'Abra as obras primeiro (1 ação por turno).';
    if (a === 'bld') {
      if (!canQueue(f, x, y)) return 'Não dá para pôr esta obra aqui (já existe, já está na fila, fila cheia ou requisito faltando).';
      G.q[y].push({ k: x, p: 0, t: G.round });
      if (f === G.player || G.auto) log(f, `${fname(f)} inicia ${sName(x)} em ${tname(y)}.`);
    } else if (a === 'unq') {
      if (G.own[x] !== f || !G.q[x][y]) return 'Item inexistente.';
      G.q[x].splice(y, 1);
    } else {
      if (!canRush(f, x, y)) return G.q[x][y] && G.q[x][y].t >= G.round ? 'Não dá para apressar uma obra no turno em que ela começou.' : 'Ouro insuficiente.';
      F.gold -= rushCost(f, x, y); log(f, `${fname(f)} apressa ${sName(G.q[x][y].k)} com ouro.`); finishWork(x, y);
    }
    return '';
  }
  if (a !== 'camp' && F.pa < 1) return 'Sem pontos de ação neste turno.';
  if (a === 'camp') {
    if (F.camp) return 'A campanha já foi declarada.';
    if (!has(f, 'dou')) { if (!spend(f)) return 'Sem pontos de ação.'; }
    F.camp = true; F.nC = (F.nC || 0) + 1; log(f, `${fname(f)} declara campanha militar.`);
  } else if (a === 'rec') {
    if (F.recOn) return 'O recrutamento já está aberto neste turno.';
    if (F.gold < troopCost(f)) return 'Ouro insuficiente.';
    spend(f); F.recOn = true;
  } else if (a === 'obras') {
    if (F.bldOn) return 'As obras já estão abertas neste turno.'; spend(f); F.bldOn = true;
  } else if (a === 'fest') {
    if (F.gold < ECON.fest) return 'Ouro insuficiente.';
    spend(f); F.gold -= ECON.fest; F.stab = Math.min(100, F.stab + 15); F.ww = Math.max(0, F.ww - 3); F.festT = G.round + 2; if (G.food[F.capI] != null) G.food[F.capI] = Math.max(0, G.food[F.capI] - 5); // S-24
  } else if (a === 'colo') { // S-26: colonos saem de uma cidade e fazem crescer uma aldeia vizinha sua
    const p = coloPair(f); if (!p) return 'Precisa de uma cidade vizinha de uma aldeia sua.';
    if (F.gold < 3) return 'Ouro insuficiente.';
    spend(f); F.gold -= 3; G.lv[p[0]]--; G.lv[p[1]]++; log(f, `Colonos de ${tname(p[0])} fundam vila em ${tname(p[1])}.`);
  } else if (a === 'tax') {
    if (F.noTax >= G.round) return 'Você prometeu não cobrar impostos por alguns turnos.';
    spend(f); const g = Math.ceil(owned(f).length / 2); F.gold += g; F.stab = Math.max(0, F.stab - 8); F.taxT = G.round + 2;
    log(f, `${fname(f)} cobra impostos extraordinários (+${g} ouro).`);
  } else if (a === 'rota') {
    return openRoute(f, x, y);
  } else if (a === 'trade') {
    if (F.tradeOn) return 'O comércio já está aberto neste turno.'; spend(f); F.tradeOn = true;
  } else if (a === 'infl') {
    if (!canInfl(f, x)) return 'Precisa ser um território neutro ou rebelde vizinho, e prestígio suficiente.';
    spend(f); F.pre -= inflCost(f, x); G.own[x] = f; G.tr[x] = Math.max(1, Math.ceil(G.tr[x] / 2)); delete G.rl[x]; G.arr[x] = G.tr[x];
    log(f, `${tname(x)} adere a ${fname(f)} por influência política.`); checkWin();
  } else if (a === 'agit') {
    const o = G.own[x]; if (!real(o) || !hostile(f, x)) return 'Escolha um território de uma facção rival.';
    if (F.pre < ECON.agit) return 'Prestígio insuficiente.';
    spend(f); F.pre -= ECON.agit; Fa(o).stab = Math.max(0, Fa(o).stab - (pol(o, 'pol') ? 7 : 15)); // G-31
    log(f, `${fname(f)} financia agitadores contra ${fname(o)}.`);
  }
  return '';
}
function recruit(f, i) {
  const F = Fa(f); if (!F.recOn || F.gold < troopCost(f) || !canRecruitAt(f, i)) return false;
  F.gold -= troopCost(f); F.recQ[i] = (F.recQ[i] || 0) + 1; return true; // chega no próximo turno (P-10)
}
// pesquisa em turnos: conclui quando o saber acumulado cobre o custo
function research(f) {
  const F = Fa(f), t = F.res && TK[F.res];
  if (!t || !techOk(f, t)) { F.res = null; return; }
  if (F.sci < techCost(t, f)) return;
  F.sci -= techCost(t, f); F.tech.push(t.k); F.res = null;
  log(f, `${fname(f)} desenvolve ${tName(t.k)}.`);
}
// comércio aberto: 2 por 1 (3 por 2 com a tecnologia de comércio)
// ---------- parte 6: comércio e rotas (T-01 a T-03, T-10 a T-14, T-16 a T-18) ----------
// rota = { f: quem abriu, o: parceiro, a: ponta de f, b: ponta do parceiro, k: tipo, gd: bens que f recebe, s: rodada em que começa a render }
const RT = { int: { n: 'Rota interna', ic: '🛒', g: 0 }, car: { n: 'Caravana', ic: '🐪', g: 2 }, mar: { n: 'Rota marítima', ic: '⛵', g: 3 } };
const routeMax = f => countB(f, 'mer') + countB(f, 'por') + countB(f, 'ban') + csBonus(f, 'por') + (gov(f) === 'rme' ? 1 : 0) + (Fa(f).rtB || 0); // T-11
const myRoutes = f => G.routes.filter(r => r.f === f);
const rLive = r => G.round >= r.s && r.cut !== G.round && !(r.cutU >= G.round);
function landSteps(a, b, max, ok) { // passos por terra de a até b, sem passar de max; ok(i) filtra o caminho
  let fr = [a]; const seen = new Set([a]);
  for (let s = 1; s <= max; s++) { fr = fr.flatMap(i => G.A[i].filter(j => !isSea(i, j) && !seen.has(j) && (j === b || ok(j)) && seen.add(j))); if (seen.has(b)) return s; }
  return 99;
}
function routeCands(f) {
  if (myRoutes(f).length >= routeMax(f)) return [];
  const out = [], mine = owned(f), core = netOf(f).core, gf = goods(f), has2 = (a, b) => G.routes.some(r => r.a === a && r.b === b);
  const give = o => [...goods(o)].filter(d => !gf.has(d));
  for (const a of mine) {
    if (nb(a, 'mer')) for (const b of mine) if (b !== a && nb(b, 'mer') && !core.has(b) && !has2(a, b) && landSteps(a, b, 6, j => G.own[j] === f) < 99) out.push({ f, o: f, a, b, k: 'int', gd: [] });
    if (nb(a, 'car')) for (let b = 0; b < G.N; b++) { const o = G.own[b]; if (real(o) && o !== f && peace(f, o) && !G.emb.has(tk(f, o)) && nb(b, 'mer') && !has2(a, b) && landSteps(a, b, 4, () => true) < 99) out.push({ f, o, a, b, k: 'car', gd: give(o).slice(0, 1) }); }
    if (nb(a, 'por') && nb(a, 'arm')) for (let b = 0; b < G.N; b++) { const o = G.own[b]; if (real(o) && o !== f && peace(f, o) && !G.emb.has(tk(f, o)) && nb(b, 'por') && !has2(a, b)) out.push({ f, o, a, b, k: 'mar', gd: give(o).slice(0, 2) }); }
  }
  out.forEach(r => r.v = RT[r.k].g + 1.2 * r.gd.length + (r.k === 'int' ? 1.5 : 0) + (r.o !== f && Fa(r.o).tech.some(t => !has(f, t)) ? .8 : 0));
  return out.sort((x, y) => y.v - x.v);
}
function openRoute(f, a, b) {
  const r = routeCands(f).find(r => r.a === a && r.b === b); if (!r) return 'Rota indisponível.';
  if (Fa(f).gold < ECON.route) return 'Ouro insuficiente.';
  if (!spend(f)) return 'Sem pontos de ação.';
  Fa(f).gold -= ECON.route; r.s = G.round + 1; delete r.v; G.routes.push(r); if (r.k === 'mar') era(f, 1, 'abriu uma rota marítima'); // T-10: começa a render no próximo turno
  log(f, `${fname(f)} abre ${RT[r.k].n.toLowerCase()} de ${tname(a)} a ${tname(b)}${r.o !== f ? ' com ' + fname(r.o) : ''}${r.gd.length ? ', trazendo ' + r.gd.map(d => DEP[d].n.toLowerCase()).join(' e ') : ''}.`);
  return '';
}
// rotas que perderam a ponta, a construção ou a paz se desfazem
function checkRoutes() {
  G.routes = G.routes.filter(r => {
    const ok = G.own[r.a] === r.f && G.own[r.b] === r.o && (r.o === r.f || (peace(r.f, r.o) && !G.emb.has(tk(r.f, r.o)))) && (r.k === 'int' ? nb(r.a, 'mer') && nb(r.b, 'mer') : r.k === 'car' ? nb(r.a, 'car') : nb(r.a, 'por') && nb(r.a, 'arm') && nb(r.b, 'por'));
    if (!ok) log(r.f, `A ${RT[r.k].n.toLowerCase()} de ${fname(r.f)} entre ${tname(r.a)} e ${tname(r.b)} se desfaz.`);
    return ok;
  });
}
const routeGold = f => G.routes.reduce((s, r) => s + (rLive(r) && (r.f === f || r.o === f) && r.f !== r.o ? RT[r.k].g + (pact(r.f, r.o, 'com') ? 1 : 0) + (pol(f, 'liv') ? 1 : 0) : 0), 0); // DP-05
const routeSci = f => G.routes.filter(r => rLive(r) && (r.f === f || r.o === f) && r.f !== r.o && r.k === 'car' && Fa(r.f === f ? r.o : r.f).tech.some(t => !has(f, t))).length;
const routeGoods = f => G.routes.filter(r => r.f === f && rLive(r)).flatMap(r => r.k === 'int' ? worked(r.b) : r.gd); // T-13
// T-14: rota com quem já tem a tecnologia barateia 20%
const techCost = (t, f) => Math.round(t.cost * 2 * G.len.k * (f && G.routes.some(r => rLive(r) && r.f !== r.o && (r.f === f || r.o === f) && has(r.f === f ? r.o : r.f, t.k)) ? .8 : 1));
function routesModal() {
  const me = G.player, F = Fa(me), my = G.turnF === me, act = G.routes.filter(r => r.f === me || r.o === me), c = routeCands(me).slice(0, 10);
  const row = (r, btn) => `<div class="tech"><div><b>${RT[r.k].ic} ${RT[r.k].n}</b> <span class="hint">${esc(tname(r.a))} → ${esc(tname(r.b))}${r.o !== r.f ? ' · ' + esc(fname(r.f === me ? r.o : r.f)) : ''}${RT[r.k].g ? ` · +${RT[r.k].g}💰 cada lado` : ' · +1⚒ no destino e os bens dele na rede'}${r.gd.length ? ' · traz ' + r.gd.map(d => DEP[d].ic + ' ' + DEP[d].n).join(', ') : ''}${r.s > G.round ? ' · começa no próximo turno' : ''}</span></div>${btn || ''}</div>`;
  modal(`<h2>Comércio</h2><p class="hint">Rotas abertas por você: ${myRoutes(me).length}/${routeMax(me)} (1 por mercado, porto e banco). Abrir custa 1 ação e ${ECON.route} ouro. Caravana pede caravançará e um mercado alheio a até 4 territórios; rota marítima, porto com armazém alfandegário e um porto alheio; rota interna, mercado nas duas pontas. Bens recebidos contam como ligados para as obras, e rota com quem sabe mais barateia a pesquisa em 20%.</p>
    <h4>Ativas</h4><div class="techs">${act.length ? act.map(r => row(r)).join('') : '<p class="hint">Nenhuma.</p>'}</div>
    <h4>Possíveis</h4><div class="techs">${c.length ? c.map(r => row(r, `<button class="mini pri" data-a="route" data-i="${r.a}" data-j="${r.b}" ${my && F.pa > 0 && F.gold >= ECON.route ? '' : 'disabled'}>Abrir</button>`)).join('') : '<p class="hint">Nenhuma agora: construa mercado, caravançará ou porto com armazém, e faça paz com vizinhos.</p>'}</div>`, [['Fechar']]);
}
function tradeRes(f, a, b) {
  const F = Fa(f), [p, q] = has(f, 'com') ? [3, 2] : [2, 1];
  if (!F.tradeOn || a === b || F[a] < p) return false;
  F[a] -= p; F[b] += q; return true;
}

// ---------- cartas de benefício (nomes da era); usar uma carta não gasta ação ----------
const drawCard = () => ({ k: Math.floor(rnd() * 12) });
const cardName = c => CARDS[G.era.cards][c.k];
const cardFx = c => c.k === 7 && G.air ? CARDS.airFx : CARDS.efx[c.k];
// alvo exigido: own, enemy, adj (inimigo vizinho), turn (inimigo vizinho fraco), two (dois territórios seus)
const cardNeeds = k => ({ 1: 'own', 4: 'enemy', 5: 'enemyF', 6: 'two', 7: G.air ? null : 'adj', 8: 'enemyF', 10: 'enemyF', 11: 'turn' }[k] || null);
function playCard(f, h, target, t2) {
  const F = Fa(f), c = F.cards[h]; if (!c || c.k == null) return false;
  const k = c.k, o = target != null ? G.own[target] : null;
  const adjOwn = j => G.A[j].some(i => G.own[i] === f);
  if (k === 0) { if (G.phase !== 'ref') return false; F.reinf += 4; }
  else if (k === 1) { if (o !== f) return false; G.fort[target] = 2; }
  else if (k === 2) { if (G.phase === 'mov') return false; F.ofs = true; }
  else if (k === 3) F.stab = Math.min(100, F.stab + 20);
  else if (k === 4) { if (!hostile(f, target)) return false; G.tr[target] = Math.max(1, Math.ceil(G.tr[target] / 2)); }
  else if (k === 5 || k === 8 || k === 10) {
    if (!real(o) || allied(f, o) || (k !== 10 && !hostile(f, target))) return false;
    if (k === 5) Fa(o).stab = Math.max(0, Fa(o).stab - 15);
    if (k === 8) { const C = Fa(o).cards; if (!C.length) return false; F.cards.push(C.splice(Math.floor(rnd() * C.length), 1)[0]); }
    if (k === 10) { if (peace(f, o)) return false; G.truce.add(tk(f, o)); }
  }
  else if (k === 6) { if (G.own[target] !== f || G.own[t2] !== f || target === t2 || G.tr[target] < 2) return false; G.tr[t2] += G.tr[target] - 1; G.tr[target] = 1; G.mv[target] = 0; }
  else if (k === 7) {
    if (G.air) F.planes += 2;
    else { if (!hostile(f, target) || !adjOwn(target)) return false; let kill = 0; for (let n = 0; n < 3; n++) if (d6() >= 4 && G.tr[target] - kill > 1) kill++; G.tr[target] -= kill; log(f, `${cardName(c)} eliminam ${kill} tropa(s) em ${tname(target)}.`); }
  }
  else if (k === 9) F.navLeft += 2;
  else if (k === 11) { if (!hostile(f, target) || !adjOwn(target) || G.tr[target] > 3 || capOwner(target)) return false; if (real(o)) Fa(o).stab = Math.max(0, Fa(o).stab - 5); G.own[target] = f; G.fort[target] = 0; delete G.rl[target]; if (real(o) && !owned(o).length) eliminate(o, f); }
  F.cards.splice(F.cards.indexOf(c), 1);
  log(f, `${fname(f)} usa ${cardName(c)}${target != null ? ' em ' + tname(target) : ''}.`);
  checkWin();
  return true;
}

// ---------- combate ----------
// bônus no maior dado da defesa: construção fortificada +1, e mais +1 por carta, muralha da capital ou Defesa Tenaz (máx. +2)
// M-03 a M-06: floresta e selva +1 com 3+ tropas; colinas e montanhas +1
const terrDef = j => { const t = TERR[G.ter[j]].def; return t === 'h' || t === 'm' || (t === 'f' && G.tr[j] >= 3) ? 1 : 0; };
// parte 4: construções com def (muralha, castelo, paliçada…) e a Grande Muralha (só contra ataque por terra)
const bldDef = j => G.bld[j].reduce((s, k) => s + (nb(j, k) && STRUCT[k].def && G.tr[j] >= (STRUCT[k].defMin || 0) ? STRUCT[k].def : 0), 0);
// parte 7: tropas por era (A-01 a A-07). A melhor tropa disponível vale para todo o exército da facção.
const armyOf = f => real(f) ? Object.keys(ARMY).filter(k => has(f, ARMY[k].tech) && (!ARMY[k].good.length || goodOk(f, ARMY[k].good))) : [];
const armyDef = j => { const d = G.own[j], a = armyOf(d); return (a.includes('msq') || (a.includes('bes') && (nb(j, 'for') || nb(j, 'cas'))) ? 1 : 0) + (G.dug[j] ? 1 : 0); }; // A-06, A-07, A-45
function defBonus(j, i) { const d = G.own[j]; return terrDef(j) + Math.max(0, bldDef(j) - (i != null && has(G.own[i], 'mat') ? 1 : 0)) + armyDef(j) + (hasW(d, 'gmu') && !(i != null && isSea(i, j)) ? 1 : 0) + (G.fort[j] > 0 || (capOwner(j) && capOwner(j) === d) || (Fa(d).ab === 'tenaz' && G.tr[j] >= 5) ? 1 : 0); }
// D-07: distância, por território próprio, até a base de suprimento mais próxima (capital, quartel ou porto)
function supplyDist(f) {
  const dist = Array(G.N).fill(99), q = owned(f).filter(i => i === Fa(f).capI || nb(i, 'qua') || nb(i, 'por'));
  q.forEach(i => dist[i] = 0);
  for (let h = 0; h < q.length; h++) { const i = q[h]; for (const j of G.A[i]) if (G.own[j] === f && dist[j] > dist[i] + 1) { dist[j] = dist[i] + 1; q.push(j); } }
  return dist;
}
// L-04 e L-05: remanejamento. Vizinho seu sempre; pela estrada até 2 territórios (3 com pavimentada), todos com estrada;
// de um porto seu para qualquer outro porto seu.
function moveDests(f, i) {
  const out = new Set(G.A[i].filter(j => G.own[j] === f)), r = road(i);
  if (r) {
    let fr = [i]; const seen = new Set([i]);
    for (let s = 0; s < r + 1; s++) fr = fr.flatMap(a => G.A[a].filter(b => (G.own[b] === f || pact(f, G.own[b], 'pas')) && !isSea(a, b) && road(b) && !seen.has(b) && seen.add(b)));
    seen.forEach(j => { if (G.own[j] === f) out.add(j); }); // DP-04: passa pelas estradas do parceiro
  }
  if (nb(i, 'por')) owned(f).forEach(j => { if (nb(j, 'por')) out.add(j); });
  out.delete(i); return [...out];
}
// L-08: na rede de bens não falta suprimento; fora dela vale a distância até capital, quartel ou porto
const lowSupply = (i) => real(G.own[i]) && !netOf(G.own[i]).linked.has(i) && !G.A[i].some(j => pact(G.own[i], G.own[j], 'pas')) && supplyDist(G.own[i])[i] > ECON.sup + (hasW(G.own[i], 'rce') ? 2 : 0);
function diceFor(i, j) {
  const a = G.own[i], A = Fa(a);
  let ad = Math.min(3, G.tr[i] - 1); if (isSea(i, j) && A.ab !== 'almirante' && !nb(i, 'por') && !(A.real && (has(a, 'nav') || hasW(a, 'frl')))) ad = Math.min(2, ad);
  if (ad > 1 && lowSupply(i)) ad--;
  if (ad > 1 && TERR[G.ter[j]].def === 'w') ad--; // M-10: pântano
  return [ad, Math.min(3, G.tr[j])];
}
function roll(i, j) {
  const a = G.own[i], A = Fa(a), [ad, dd] = diceFor(i, j);
  const R = Array.from({ length: ad }, d6).sort((x, y) => y - x), D = Array.from({ length: dd }, d6).sort((x, y) => y - x);
  const aw = armyOf(a), dw = armyOf(G.own[j]), op = OPEN.includes(G.ter[j]), hc = op && (aw.includes('cav') || aw.includes('kni'));
  if (has(a, 'art') && goodOk(a, ['sli']) && G.tr[j] > 1 && d6() >= 5) G.tr[j]--; // K-53: canhão antes do combate
  G.dug[i] = 0; G.acted.add(i); // A-45: quem ataca perde o entrincheiramento
  const up = (aw.includes('leg') || aw.includes('msq') ? 1 : 0) + (hc ? 1 : 0) + ((G.win[i] || 0) >= (pol(a, 'dis') ? 2 : 3) ? 1 : 0) + (prin(i, 'gue') && G.fai[j] !== G.fai[i] ? 1 : 0) + genBonus(a, i) + (A.ofs ? 1 : 0) + (G.bld[i].some(k => STRUCT[k].atk && nb(i, k)) ? 1 : 0) + (A.camp && hasW(a, 'csg') ? 1 : 0);
  if (up) R[0] = Math.min(6, R[0] + up);
  D[0] = Math.min(6, D[0] + defBonus(j, i));
  const ties = !(hc && dw.includes('lan')) && ((op && aw.includes('kni')) || (TERR[G.ter[j]].def !== 'm' && !G.bld[j].some(k => STRUCT[k].tie && nb(j, k)) && (A.ab === 'tatico' || (A.real && A.camp && has(a, 'tat'))))); // A-02, A-04 // M-06: em montanha o atacante sempre perde empates
  let al = 0, dl = 0; const res = [];
  for (let k = 0; k < Math.min(ad, dd); k++) { const w = R[k] > D[k] || (R[k] === D[k] && ties); w ? dl++ : al++; res.push(w); }
  G.tr[i] -= al; G.tr[j] -= dl;
  return { R, D, al, dl, res, ad, won: G.tr[j] <= 0 };
}
function eliminate(d, a) {
  const D = Fa(d); D.alive = false; log(d, `${fname(d)} foi eliminado por ${fname(a)}.`);
  if (real(a)) { const A = Fa(a); A.cards.push(...D.cards.splice(0)); A.cards.splice(5); A.stab = Math.min(100, A.stab + 10); }
  if (d === G.player && !G.auto) endGame(null, 'elim');
}
function conquer(i, j, n) {
  const a = G.own[i], d = G.own[j];
  G.own[j] = a; G.tr[j] = n; G.tr[i] -= n; G.fort[j] = 0; delete G.rl[j];
  G.lv[j] = Math.max(1, G.lv[j] - 1); G.food[j] = 0; // saque e fuga: o território perde um nível
  G.asm[j] = 0; G.win[j] = (G.win[i] || 0) + 1; G.dug[j] = 0; // A-43: veteranos
  G.arr[j] = n; // tropas que entraram por conquista já se moveram neste turno
  // P-08: o conquistador fica com metade do progresso das obras; maravilha em andamento se perde
  G.q[j] = real(a) ? G.q[j].filter(x => !STRUCT[x.k].wonder).map(x => ({ ...x, p: Math.floor(x.p / 2) })).slice(0, qMax(a)) : [];
  if (real(a)) { Fa(a).conq = true; Fa(a).cq++; G.occ[j] = ECON.occ; } else G.occ[j] = 0;
  // T-16: pilhagem. Quem toma a ponta de uma rota alheia leva o ouro de 2 turnos dela
  if (real(a)) for (const r of G.routes) if ((r.a === j || r.b === j) && r.f !== a && r.o !== a && RT[r.k].g) { Fa(a).gold += 2 * RT[r.k].g; log(a, `${fname(a)} pilha a ${RT[r.k].n.toLowerCase()} em ${tname(j)} (+${2 * RT[r.k].g} ouro).`); }
  checkRoutes();
  if (real(d) && real(a)) { remember(d, a, 'tomou nossa terra', -30); callDefense(a, d); }
  if (real(d)) {
    const D = Fa(d); D.stab = Math.max(0, D.stab - 2); D.ww = Math.min(30, D.ww + 2);
    if (D.capI === j) era(a, 2, `tomou a capital de ${fname(d)}`);
    if (D.capI === j) { D.stab = Math.max(0, D.stab - 20); log(d, `${fname(d)} perde a capital ${tname(j)}!`); }
    if (!owned(d).length) eliminate(d, a);
  }
  checkWin();
}
// alcance aéreo: distância em territórios a partir de qualquer território seu
function airRange(f) {
  const dist = Array(G.N).fill(99), q = owned(f); q.forEach(i => dist[i] = 0);
  for (let h = 0; h < q.length; h++) { const i = q[h]; for (const j of G.A[i]) if (dist[j] > dist[i] + 1) { dist[j] = dist[i] + 1; q.push(j); } }
  return dist;
}
const airTargets = f => { if (!Fa(f).planes || !Fa(f).camp) return []; const d = airRange(f); return d.map((v, j) => j).filter(j => d[j] <= G.air.r && d[j] > 0 && hostile(f, j) && G.tr[j] >= 2); };
function airStrike(f, j) {
  const F = Fa(f); if (!F.planes || !F.camp || G.tr[j] < 2 || !hostile(f, j)) return null;
  F.planes--;
  const aa = d6(), down = aa >= G.air.aa, hit = down ? 0 : d6(), kill = !down && hit >= G.air.hit;
  if (kill) G.tr[j]--;
  log(f, `${fname(f)} bombardeia ${tname(j)}: ${down ? 'avião abatido' : kill ? '1 tropa eliminada' : 'errou o alvo'}.`);
  return { aa, down, hit, kill };
}

// ---------- turnos ----------
function beginTurn(f) {
  const F = Fa(f);
  // A-49: o cansaço de guerra come a recuperação de estabilidade
  F.stab = Math.max(0, Math.min(100, F.stab + 2 + (F.ab === 'carisma' ? 3 : 0) + 2 * countB(f, 'tem') + Math.min(4, luxOf(f)) + Math.min(6, income(f).stab) - Math.floor(F.ww / (pol(f, 'ppg') ? 10 : 5))));
  // Grande Biblioteca (C-202): tecnologias que duas outras facções já têm
  if (hasW(f, 'gbi')) TECH.forEach(t => { if (!has(f, t.k) && G.order.filter(o => o !== f && Fa(o).alive && has(o, t.k)).length >= 2) { F.tech.push(t.k); log(f, `A Grande Biblioteca dá ${tName(t.k)} a ${fname(f)}.`); } });
  owned(f).forEach(i => { if (G.fort[i] > 0) G.fort[i]--; if (G.occ[i] > 0) G.occ[i]--; });
  F.conq = false; F.cq = 0; F.ofs = false; G.phase = 'ref'; G.sel = G.tgt = null; G.card = null; G.mode = null; G.seaUsed = new Set(); G.mv = []; G.arr = []; G.acted = new Set();
  for (const [i, n] of Object.entries(F.recQ)) if (G.own[i] === f) G.tr[i] += n;
  F.recQ = {};
  checkRoutes();
  for (const r of myRoutes(f)) if (r.k === 'mar' && rLive(r) && navOf(f) < 2 && rnd() < 1 / 6) { r.cut = G.round; log(f, `Piratas atacam a rota marítima de ${fname(f)} saindo de ${tname(r.a)}: ela não rende nesta rodada.`); } // T-17
  const inc = income(f); F.gold += inc.gold; F.sci += anar(f) ? 0 : inc.sci; F.pre += inc.pre; govTurn(f); succession(f); figures(f); events(f);
  payUpkeep(f); produce(f); grow(f); society(f); diploTurn(f); research(f);
  F.navLeft = navOf(f); F.planes = planesOf(f);
  F.pa = paOf(f); F.camp = F.recOn = F.tradeOn = F.bldOn = false;
  if (F.stab < 35) {
    let p = (35 - F.stab) / 35 * .5; if (F.ab === 'carisma') p /= 2;
    const all = owned(f).filter(i => i !== F.capI && !nb(i, 'tri')), occ = all.filter(occupied), cand = occ.length ? occ : all;
    if (cand.length && rnd() < p) {
      const i = cand[Math.floor(rnd() * cand.length)];
      G.own[i] = 'reb'; G.tr[i] = Math.max(2, G.tr[i]); G.rl[i] = 'Revoltosos'; F.stab += 8;
      log(f, `Revolta em ${tname(i)}! A província se declara rebelde contra ${fname(f)}.`);
      if (f === G.player && !G.auto) toast(`Revolta em ${tname(i)}! Sua estabilidade está baixa.`);
      if (!owned(f).length) { F.alive = false; if (f === G.player && !G.auto) return endGame(null, 'elim'); }
    }
  }
  F.reinf = reinfOf(f).r;
  F.hold = objDone(f) ? F.hold + 1 : 0; // D-03
  if (G.round < minWin()) return;
  if (F.hold >= G.len.hold) endGame(f, 'obj');
  else if (legacy(f) >= legWin() && G.own[F.capI] === f) endGame(f, 'leg');
}
function finishTurn(f) {
  if (f === G.player) G.offers = [];
  for (const i of owned(f)) G.dug[i] = G.tr[i] >= 2 && !G.acted.has(i) && !G.arr[i] ? 1 : 0; // A-45: quem fica parado se entrincheira
  const F = Fa(f);
  F.ww = F.camp ? Math.min(30, F.ww + (gov(f) === 'rep' ? 2 : 1)) : Math.max(0, F.ww - 2);
  if ((F.conq || F.ab === 'espiao') && F.cards.length < 5) F.cards.push(drawCard());
  G.sel = G.tgt = null; G.card = null;
}
async function advance() {
  G.cur++;
  if (G.cur >= G.order.length) {
    G.cur = 0; await rebelsAct(); if (G.over) return;
    G.round++; ageCheck(); plague();
    if (G.round > G.rounds) return endGame(null, 'turns');
    for (const e of G.sc.ev.filter(e => evRound(e) === G.round)) { applyEvent(e); render(); if (G.over) return; const g = G; if (!G.auto) await modal(`<p class="kick">${esc(G.sc.n)} · rodada ${G.round}</p><h2>${esc(e.n)}</h2><p>${esc(e.d)}</p>`, [['Continuar']]); live(g); }
    checkWin();
  }
}
const STALE = { stale: 1 };
function live(g) { if (G !== g || g.over) throw STALE; }
async function loop() { try { await loop0(); } catch (e) { if (e !== STALE) throw e; } }
async function loop0() {
  while (!G.over) {
    const f = G.order[G.cur], F = Fa(f);
    if (F.alive && F.entered) {
      G.turnF = f; if (f === G.player && !G.auto) save(); beginTurn(f); if (G.over) return; render();
      if (f === G.player && !G.auto) { if (G.evq.length) showChoice(); return; }
      await aiTurn(f); if (G.over) return;
      finishTurn(f);
    }
    await advance();
  }
}
async function playerEnd() {
  if (G.turnF !== G.player || G.busy || G.over) return;
  if (G.pend) return toast('Ocupe o território conquistado primeiro.');
  finishTurn(G.player); hideBattle(); await advance(); render(); loop();
}

// ---------- eventos ----------
function applyEvent(e) {
  log(null, `Evento: ${e.n}. ${e.d}`);
  const killIfEmpty = o => { if (real(o) && Fa(o).alive && !owned(o).length) { Fa(o).alive = false; if (o === G.player && !G.auto) endGame(null, 'elim'); } };
  for (const [op, a, b, c, d] of e.fx) {
    const ids = a === '*' ? G.order : [a];
    if (op === 'stab') ids.forEach(f => { const F = Fa(f); if (F.alive) F.stab = Math.max(0, Math.min(100, F.stab + b)); });
    else if (op === 'addcap') { const F = Fa(a); if (!F.alive || !F.entered) continue; const T = owned(a); if (!T.length) continue; const i = G.own[F.capI] === a ? F.capI : T.sort((x, y) => G.tr[y] - G.tr[x])[0]; G.tr[i] += b; }
    else if (op === 'team') Fa(a).team = b;
    else if (op === 'truce') { if (!allied(a, b)) G.truce.add(tk(a, b)); }
    else if (op === 'endtruce') G.truce.delete(tk(a, b));
    else if (op === 'active') Fa(a).passive = false;
    else if (op === 'leader') { Fa(a).L = b; Fa(a).ab = c; }
    else if (op === 'air') Fa(a).airX += b;
    else if (op === 'troops') G.tr[G.ix[a]] += b;
    else if (op === 'rebels') { const i = G.ix[a], o = G.own[i]; G.own[i] = 'reb'; G.tr[i] = b; G.rl[i] = c; G.fort[i] = 0; killIfEmpty(o); }
    else if (op === 'place') { const i = G.ix[a], o = G.own[i], F = Fa(b); if (!F.alive) continue; G.own[i] = b; G.tr[i] = c; G.fort[i] = 0; delete G.rl[i]; killIfEmpty(o); }
    else if (op === 'give') { const F = Fa(b); F.entered = true; F.alive = true; if (d !== undefined) F.team = d; a.forEach(n => { const i = G.ix[n]; if (G.own[i] === 'neu') { G.own[i] = b; G.tr[i] = c; } }); F.t0 = owned(b).length; if (!F.t0) F.alive = false; }
    else if (op === 'attrit') { expand(G.m, [].concat(a)).forEach(n => { const i = G.ix[n]; if (G.own[i] !== b && real(G.own[i])) G.tr[i] = Math.max(1, Math.floor(G.tr[i] / 2)); }); }
  }
}
async function rebelsAct() {
  for (let i = 0; i < G.N; i++) {
    if (G.own[i] !== 'reb') continue;
    if (G.tr[i] < 8) G.tr[i]++;
    if (G.tr[i] < 5) continue;
    const t = G.A[i].filter(j => real(G.own[j]) && G.tr[j] <= G.tr[i] - 3 && !isSea(i, j)).sort((x, y) => G.tr[x] - G.tr[y])[0];
    if (t == null) continue;
    const d = G.own[t];
    let r; do { r = roll(i, t); } while (!r.won && G.tr[i] > 2);
    if (r.won) { const l = G.rl[i] || 'Rebeldes'; log(d, `${l} tomam ${tname(t)} de ${fname(d)}.`); conquer(i, t, Math.min(r.ad, G.tr[i] - 1)); G.rl[t] = l; if (G.over) return; }
  }
}

// ---------- vitória ----------
function checkWin() {
  if (G.over) return;
  const alive = G.order.filter(f => Fa(f).alive && Fa(f).entered);
  for (const f of alive) if (!alive.some(o => !allied(f, o)) && !G.order.some(o => Fa(o).late && !Fa(o).entered && !allied(f, o))) {
    if (alive.length === 1 || G.round >= minWin()) return endGame(f, 'dom');
    // cedo demais para a aliança vencer: sem inimigo comum, ela se desfaz numa trégua que pode ser rompida
    for (const a of alive) for (const b of alive) if (a < b) G.truce.add(tk(a, b));
    alive.forEach(a => { Fa(a).team = null; }); G.ally.clear();
    log(null, 'Sem inimigo comum, a aliança se desfaz. Os antigos aliados ficam em trégua, mas agora disputam o mapa entre si.');
    if (!G.auto) toast('A aliança se desfez: os antigos aliados agora são rivais em trégua.');
    return;
  }
}
function endGame(w, why) {
  if (G.over) return; G.over = true;
  try { localStorage.removeItem(SAVE); } catch (e) { }
  const rank = G.order.filter(f => Fa(f).entered).sort((a, b) => score(b) - score(a));
  if (!w && why === 'turns') w = rank[0];
  G.winner = w; G.why = why;
  const pw = w && allied(w, G.player);
  log(w, why === 'elim' ? 'Você foi eliminado.' : `${fname(w)} vence (${why === 'obj' ? 'objetivo cumprido' : why === 'leg' ? 'legado' : why === 'dom' ? 'dominação' : 'maior pontuação ao fim das rodadas'}).`);
  render();
  if (G.auto) return;
  const rows = rank.map(f => `<tr><td><i class="dot" style="background:${Fa(f).c}"></i>${esc(fname(f))}${f === G.player ? ' (você)' : ''}</td><td>${owned(f).length}</td><td>${capsHeld(f)}</td><td>${score(f)}</td></tr>`).join('');
  const t = why === 'elim' ? 'Derrota' : pw ? (w === G.player ? 'Vitória!' : 'Vitória da aliança!') : 'Derrota';
  const sub = why === 'elim' ? 'Seus últimos territórios caíram.' : why === 'obj' ? `${fname(w)} cumpriu o objetivo: ${objText(Fa(w))}` : why === 'leg' ? `${fname(w)} chegou a ${legWin()} pontos de legado: ciência, obras e cultura.` : why === 'dom' ? `${fname(w)} e aliados dominaram o mapa.` : `Fim das ${G.rounds} rodadas. Vence quem mais cresceu: territórios ganhos desde o início, +2 por capital e +2 por alvo do objetivo controlado.`;
  modal(`<p class="kick">${esc(G.sc.n)}</p><h2>${t}</h2><p>${esc(sub)}</p><table class="rank"><tr><th>Facção</th><th>Terr.</th><th>Cap.</th><th>Pontos</th></tr>${rows}</table>`, [['Jogar de novo', () => startScenario(G.sc.id, G.player, G.diff, false, G.lenK)], ['Escolher cenário', showSetup]]);
}

// ---------- salvar ----------
// Salvamento automático no início de cada turno seu; 3 espaços manuais e arquivo exportável guardam esse mesmo ponto (D-11).
const SLOT = n => SAVE + '-' + n;
function snapshot() {
  const F = {}; G.order.forEach(f => { const X = Fa(f); F[f] = { stab: X.stab, cards: X.cards, alive: X.alive, entered: X.entered, team: X.team, passive: X.passive, L: X.L, ab: X.ab, airX: X.airX, gold: X.gold, sci: X.sci, pre: X.pre, tech: X.tech, res: X.res, ww: X.ww, hold: X.hold, recQ: X.recQ, tech0: X.tech0 }; });
  return JSON.stringify({ v: 5, sc: G.sc.id, player: G.player, diff: G.diff, len: G.lenK, own: G.own, tr: G.tr, fort: G.fort, bld: G.bld, q: G.q, occ: G.occ, lv: G.lv, food: G.food, gvr: G.gvr, gfc: G.gfc, genA: G.genA, fai: G.fai, faiths: G.faiths, pacts: G.pacts, ally: [...G.ally], mem: G.mem, cb: [...G.cb], truceT: G.truceT, dem: G.dem, cs: G.cs, cul: G.cul, asm: G.asm, win: G.win, dug: G.dug, routes: G.routes, emb: [...G.emb], rl: G.rl, F, cur: G.cur, round: G.round, truce: [...G.truce], cool: G.cool, log: G.log.slice(0, 30), trades: G.trades, at: Date.now() });
}
function save() { try { G.snap = snapshot(); localStorage.setItem(SAVE, G.snap); } catch (e) { } }
function loadSave(k = SAVE) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function restore(s) {
  const sc = s && s.v === 5 && SCEN.find(x => x.id === s.sc); if (!sc) return false;
  startScenario(sc.id, s.player, s.diff, true, s.len);
  Object.assign(G, { own: s.own, tr: s.tr, fort: s.fort, bld: s.bld, q: s.q, occ: s.occ, lv: s.lv || G.lv, food: s.food || G.food, gvr: s.gvr || {}, gfc: s.gfc || {}, genA: s.genA || {}, evq: [], fai: s.fai || G.fai, faiths: s.faiths || {}, pacts: s.pacts || [], ally: new Set(s.ally || []), mem: s.mem || {}, cb: new Set(s.cb || []), truceT: s.truceT || {}, dem: s.dem || null, cs: s.cs || {}, offers: [], cul: s.cul || G.cul, asm: s.asm || G.asm, win: s.win || G.win, dug: s.dug || G.dug, routes: s.routes || [], emb: new Set(s.emb || []), rl: s.rl, cur: s.cur, round: s.round, truce: new Set(s.truce), cool: s.cool, log: s.log, trades: s.trades });
  for (const [f, v] of Object.entries(s.F)) Object.assign(G.F[f], v);
  render(); loop(); return true;
}
function resume(k) { restore(loadSave(k)); }
function saveModal() {
  const row = n => { const s = loadSave(SLOT(n)), sc = s && SCEN.find(x => x.id === s.sc); return `<div class="tech"><div><b>Espaço ${n}</b> <span class="hint">${sc ? esc(sc.n) + ' · rodada ' + s.round + ' · ' + new Date(s.at).toLocaleString('pt-BR') : 'vazio'}</span></div><button class="mini pri" data-a="slot" data-n="${n}">Salvar aqui</button></div>`; };
  modal(`<h2>Salvar partida</h2><p class="hint">Guarda o início do seu turno atual (rodada ${G.round}).</p><div class="techs">${[1, 2, 3].map(row).join('')}</div><div class="row"><button class="mini" data-a="export">Exportar arquivo</button></div>`, [['Fechar']]);
}
function exportSave() {
  const s = G.snap || snapshot(), a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([s], { type: 'application/json' }));
  a.download = `soberania-${G.sc.id}-rodada${G.round}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function importSave(file) {
  file.text().then(t => { let s; try { s = JSON.parse(t); } catch (e) { } if (!restore(s)) $('#resume').insertAdjacentHTML('beforeend', '<p class="hint">Arquivo de partida inválido ou de uma versão antiga.</p>'); });
}

// ---------- IA ----------
function tval(f, j) {
  const F = Fa(f), o = G.own[j], n = tname(j);
  let v = 1;
  if ((F.obj.hold || []).includes(n) || (F.obj.any || []).includes(j) || F.capI === j) v += 4;
  const co = capOwner(j); if (co && co !== f) v += 2;
  const reg = G.regT[G.m.terr[j].r], mine = reg.filter(k => G.own[k] === f).length;
  v += 2.5 * mine / reg.length;
  if (o === 'neu') v += .4; if (o === 'reb') v += .8;
  if (o === G.player && G.diff === 2) v += .4;
  return v;
}
const threat = (f, i) => G.A[i].reduce((s, j) => s + (real(G.own[j]) && hostile(f, j) ? G.tr[j] : 0), 0);
function bestAttack(f, minEdge, probe) {
  let best = null;
  for (const i of owned(f)) {
    if (G.tr[i] < 2) continue;
    for (const j of G.A[i]) {
      if (!canAtk(f, i, j, probe)) continue;
      const edge = G.tr[i] - G.tr[j] - defBonus(j) - (isSea(i, j) ? 1 : 0);
      if (edge < minEdge) continue;
      const s = tval(f, j) * (edge + 1) / (G.tr[j] + 1) + (G.bld[j].length ? 1 : 0);
      if (!best || s > best[2]) best = [i, j, s];
    }
  }
  return best;
}
function aiCards(f, phase) {
  const F = Fa(f), border = owned(f).filter(i => G.A[i].some(j => hostile(f, j)));
  if (phase === 'ref') {
    for (let h = F.cards.length - 1; h >= 0; h--) { const c = F.cards[h]; if (c.k === 0 || (c.k === 3 && F.stab < 55)) playCard(f, h); }
    return;
  }
  const use = (k, t, t2) => { const h = F.cards.findIndex(c => c.k === k); return h >= 0 && playCard(f, h, t, t2); };
  const enemyNear = border.flatMap(i => G.A[i]).filter(j => hostile(f, j));
  const big = enemyNear.filter(j => real(G.own[j])).sort((a, b) => G.tr[b] - G.tr[a])[0];
  if (big != null && G.tr[big] >= 6) use(4, big);
  if (big != null && F.camp) use(7, G.air ? null : big);
  const weak = enemyNear.filter(j => G.tr[j] <= 3 && !capOwner(j)).sort((a, b) => tval(f, b) - tval(f, a))[0]; if (weak != null) use(11, weak);
  const shaky = G.order.filter(o => Fa(o).alive && Fa(o).entered && !peace(f, o) && Fa(o).stab < 50).sort((a, b) => Fa(a).stab - Fa(b).stab)[0];
  if (shaky) use(5, owned(shaky)[0]);
  const rich = G.order.filter(o => o !== f && Fa(o).alive && !allied(f, o) && Fa(o).cards.length >= 3)[0]; if (rich) use(8, owned(rich)[0]);
  const hot = border.sort((a, b) => (threat(f, b) - G.tr[b]) - (threat(f, a) - G.tr[a]))[0];
  if (hot != null && threat(f, hot) > G.tr[hot] * 1.5) {
    const foe = G.A[hot].map(j => G.own[j]).filter(o => real(o) && !peace(f, o)).sort((a, b) => power(b) - power(a))[0];
    if (foe && power(foe) > power(f)) use(10, owned(foe)[0]);
    use(1, hot);
  }
  if (F.camp && owned(f).some(i => G.A[i].some(j => isSea(i, j) && hostile(f, j)))) use(9);
  if (F.camp && bestAttack(f, 1)) use(2);
}
// ---------- IA de governo: a cada ponto de ação, escolhe a opção de maior valor ----------
const TECH_W = { adm: 6, eng: 4, com: 4.5, tat: 4, nav: 2.5, con: 4, ret: 3.5, log: 4, arq: 5, dou: 4 };
function aiOptions(f) {
  const F = Fa(f), T = owned(f), o = [];
  const border = T.filter(i => G.A[i].some(j => hostile(f, j)));
  const hot = border.slice().sort((a, b) => (threat(f, b) - G.tr[b]) - (threat(f, a) - G.tr[a]))[0];
  if (!F.camp && !F.passive) {
    let n = 0; for (const i of T) for (const j of G.A[i]) if (canAtk(f, i, j, true) && G.tr[i] - G.tr[j] - defBonus(j) >= 2) n++;
    if (n) o.push([4 + Math.min(3, n * .5) + (G.round > 2 ? .5 : 0) - F.ww * .15 - (F.stab < 30 ? 1.5 : 0), 'camp']); // D-10: cansaço e instabilidade seguram a IA
  }
  if (!F.bldOn) {
    const idle = T.filter(i => !G.q[i].length && aiPick(f, i)).length, rich = F.gold > 14 && T.some(i => G.q[i].some(x => x.t < G.round));
    if (idle || rich) o.push([2.4 + Math.min(3, idle * .8) + (rich ? 1.5 : 0), 'obras']);
  }
  if (!F.recOn && F.gold >= 2 * troopCost(f)) o.push([2.4 + Math.min(3, F.gold / troopCost(f) * .2) + (hot != null && threat(f, hot) > G.tr[hot] ? 1 : 0), 'rec']);
  if ((F.stab < 35 || hap(f) < 0) && F.gold >= ECON.fest) o.push([5, 'fest']);
  const inf = T.flatMap(i => G.A[i]).filter(j => canInfl(f, j)).sort((a, b) => tval(f, b) / inflCost(f, b) - tval(f, a) / inflCost(f, a))[0];
  if (inf != null) o.push([3.4 + tval(f, inf) * .4, 'infl', inf]);
  if (F.pre >= ECON.agit + 2) { const j = border.flatMap(i => G.A[i]).find(j => real(G.own[j]) && hostile(f, j) && Fa(G.own[j]).stab < 45); if (j != null) o.push([1.8, 'agit', j]); }
  if (F.stab > 65) o.push([1.3, 'tax']);
  const next = F.res && TK[F.res];
  if (F.gold >= ECON.route + 2) { const r = routeCands(f)[0]; if (r) o.push([2.6 + r.v * .45, 'rota', r.a, r.b]); } // parte 6
  if (!F.tradeOn && next && F.gold >= 8 && (techCost(next, f) - F.sci) * 2 <= F.gold - 3) o.push([2.6, 'trade']);
  return o;
}
// IA de obras: valor de cada construção num território; manutenção só se o ouro aguentar
function aiBVal(f, k, i) {
  const F = Fa(f), S = STRUCT[k], n = owned(f).filter(j => built(j, k) || queued(j, k)).length;
  const net = income(f).gold - upkeepOf(f).b - upkeepOf(f).t - owned(f).reduce((s, j) => s + G.q[j].reduce((t, x) => t + (STRUCT[x.k].up || 0), 0), 0);
  if (S.up && net - S.up < 1) return 0;
  const th = threat(f, i), cap = i === F.capI;
  switch (k) {
    case 'ofi': return 3.6 - .25 * n + (cap ? 1.2 : 0);
    case 'mer': return 4.6 - .35 * n;
    case 'aca': return 4.2 - .7 * n + (cap ? .5 : 0);
    case 'qua': return (th ? 2.8 : .6) - .9 * n;
    case 'for': return th >= G.tr[i] * .7 ? (cap ? 3.6 : 2.2) : 0;
    case 'tem': return (F.stab < 55 ? 3.6 : 1.6) - .5 * n;
    case 'por': return G.A[i].some(j => isSea(i, j) && hostile(f, j)) ? 2.6 - 1.2 * n : 0;
    case 'aer': return 3.4 - .9 * n;
    case 'mar': return 7;
  }
  if (!S.z) { // parte 4: catálogo, avaliado pelos rendimentos e efeitos
    const W = { food: G.lv[i] < 4 ? .6 : .15, prod: .7, gold: 1, sci: .8, pre: .5, stab: F.stab < 60 ? .7 : .2 };
    let v = Object.entries(S.y || {}).reduce((s, [r, a]) => s + a * W[r], 0) + (S.lg ? .6 : 0) + (S.ww ? 4.5 : 0) + (S.nav ? .8 : 0) + (S.rf ? 2.2 : 0);
    if (S.def) v += th >= G.tr[i] * .7 ? 2 * S.def : .2;
    if (S.atk) v += th ? 1.6 : .3;
    const near = G.lv[i] < 4 && G.food[i] >= growNeed(i) * .5;
    if (k === 'aqu') v += G.lv[i] === 2 && near ? 3.5 : 0;
    if (k === 'san') v += G.lv[i] === 3 && near ? 3 : .3;
    if (k === 'tri') v += F.stab < 40 ? 2.5 : 0;
    if (k === 'cel') v += .6;
    if (k === 'est') { const nt = netOf(f); v += !nt.core.has(i) && G.A[i].some(j => nt.core.has(j) && road(j) + (j === F.capI) > 0) ? 1.4 + (worked(i).length ? 1 : 0) + G.A[i].filter(j => G.own[j] === f && worked(j).length && !nt.linked.has(j)).length : .2; }
    if (k === 'pav') v += .3;
    return v - .15 * n;
  }
  // zonas de recurso: rendimento novo + jazidas que passam a ser exploradas
  const y = { ...S.y }, g = goods(f), W = { food: G.lv[i] < 4 ? .6 : .15, prod: .7, gold: 1, sci: .8 };
  if (k === 'agr' && G.riv[i]) y.food++;
  y[Object.keys(S.y)[0]] += Math.min(3, G.A[i].filter(j => G.own[j] === f && built(j, k)).length);
  let v = 0;
  for (const d of G.dep[i]) if (DEP[d].z === S.z) { for (const [r, a] of Object.entries(DEP[d].y)) y[r] = (y[r] || 0) + a; if (!g.has(d)) v += DEP[d].lux ? 1.2 : d === 'fer' || d === 'cav' ? 1 : 0; }
  for (const [r, a] of Object.entries(y)) v += a * W[r];
  return v;
}
function aiPick(f, i) {
  if (occupied(i)) return null;
  let best = null;
  for (const k of Object.keys(STRUCT)) if (canQueue(f, k, i)) { const v = aiBVal(f, k, i); if (v > 1 && (!best || v > best[1])) best = [k, v]; }
  return best && best[0];
}
function aiWorks(f) {
  const F = Fa(f);
  for (const i of owned(f)) { if (G.q[i].length) continue; const k = aiPick(f, i); if (k) act(f, 'bld', k, i); }
  // apressa com o ouro que sobra, guardando reserva para tropas e manutenção
  for (let n = 0; n < 6; n++) {
    const keep = 6 + upkeepOf(f).b + upkeepOf(f).t;
    let best = null;
    for (const i of owned(f)) G.q[i].forEach((x, m) => { const c = rushCost(f, i, m); if (canRush(f, i, m) && F.gold - c >= keep && (!best || c < best[2])) best = [i, m, c]; });
    if (!best) break;
    act(f, 'rush', best[0], best[1]);
  }
}
function aiResearch(f) {
  const F = Fa(f); if (F.res) return;
  // valor = peso das doutrinas antigas, ou 3 + 1,2 por obra liberada, + tropa liberada; menos se for naval sem costa
  const T = owned(f), cst = T.some(coastal);
  const val = t => ((TECH_W[t.k] || 3 + 1.2 * Object.values(STRUCT).filter(S => S.tech === t.k).length) + (Object.values(ARMY).some(a => a.tech === t.k) ? 2 : 0) - (!cst && ['nav', 'cos', 'oce'].includes(t.k) ? 2 : 0)) / techCost(t, f);
  const t = TECH.filter(t => techOk(f, t)).sort((a, b) => val(b) - val(a))[0];
  if (t) act(f, 'res', t.k);
}
function aiGovern(f) {
  const F = Fa(f);
  aiResearch(f); aiGov(f); aiChars(f);
  if (G.own[F.capI] === f && threat(f, F.capI) > G.tr[F.capI]) act(f, 'merc'); // A-47
  if (has(f, 'dou') && !F.passive && bestAttack(f, 1, true)) act(f, 'camp');
  for (let n = 0; n < 8 && F.pa > 0; n++) {
    const best = aiOptions(f).sort((a, b) => b[0] - a[0])[0];
    if (!best || best[0] < 1) break;
    const [, a, x, y] = best;
    if (act(f, a, x, y)) break;
    if (a === 'rec') {
      const keep = F.pa > 0 ? 3 : 0, border = owned(f).filter(i => canRecruitAt(f, i)).sort((p, q) => (threat(f, q) - G.tr[q]) - (threat(f, p) - G.tr[p]));
      while (F.gold - troopCost(f) >= keep && border.length && recruit(f, border[0]));
    }
    if (a === 'trade') {
      const next = F.res && TK[F.res];
      while (next && F.sci < techCost(next, f) && F.gold > 6 && tradeRes(f, 'gold', 'sci'));
    }
    if (a === 'obras') aiWorks(f);
  }
}
async function aiTurn(f) {
  const F = Fa(f), g = G, wait = async ms => { if (!G.fast && !G.auto) await sleep(ms); live(g); };
  aiBreakTruces(f); aiDiplo(f);
  aiCards(f, 'ref');
  const T = owned(f), border = T.filter(i => G.A[i].some(j => hostile(f, j)));
  if (!border.length) { G.tr[T[0]] += F.reinf; F.reinf = 0; }
  else {
    let stage = null, sv = -1;
    for (const i of border) for (const j of G.A[i]) if (hostile(f, j) && seaOk(f, i, j)) { const s = tval(f, j) / (G.tr[j] + 2) + G.tr[i] * .05; if (s > sv) { sv = s; stage = i; } }
    if (stage == null) stage = border[0];
    const hot = border.slice().sort((a, b) => (threat(f, b) - G.tr[b]) - (threat(f, a) - G.tr[a]))[0];
    const k = F.passive ? 0 : Math.ceil(F.reinf * .65);
    G.tr[stage] += k; G.tr[hot] += F.reinf - k; F.reinf = 0;
  }
  render(); await wait(250);
  G.phase = 'atk';
  aiGovern(f); render();
  aiCards(f, 'atk');
  if (F.camp) {
    // aviação: castiga a maior pilha inimiga ao alcance, de preferência vizinha
    if (G.air) {
      while (F.planes > 0) {
        const ts = airTargets(f).filter(j => real(G.own[j]) || G.own[j] === 'reb'); if (!ts.length) break;
        const j = ts.sort((a, b) => (G.tr[b] + (G.A[b].some(i => G.own[i] === f) ? 4 : 0)) - (G.tr[a] + (G.A[a].some(i => G.own[i] === f) ? 4 : 0)))[0];
        const r = airStrike(f, j); if (G.own[j] === G.player && !G.fast && !G.auto) { showAir(f, j, r, true); await wait(600); }
      }
    }
    const edge = G.diff === 2 ? 1 : 2;
    for (let n = 0; n < 20 && !G.over; n++) {
      const b = bestAttack(f, n < 2 ? edge - 1 : edge); if (!b) break;
      const [i, j] = b, d = G.own[j];
      useSea(f, i, j);
      let r;
      do { r = roll(i, j); } while (!r.won && G.tr[i] > 1 && G.tr[i] >= G.tr[j]);
      if (d === G.player && !G.fast && !G.auto) { showDice(i, j, r, true); await wait(700); }
      if (r.won) {
        log(f, `${fname(f)} conquista ${tname(j)}${real(d) ? ' de ' + fname(d) : ''}${G.bld[j].length ? ' e suas construções' : ''}.`);
        conquer(i, j, Math.min(r.ad, G.tr[i] - 1));
        render(); await wait(220);
      }
    }
    hideBattle();
  }
  aiMove(f);
}
// remanejamento da IA: cada tropa sobrando anda um passo em direção à fronteira mais ameaçada
function aiMove(f) {
  G.phase = 'mov';
  const T = owned(f), dist = Array(G.N).fill(99), q = [];
  T.forEach(i => { if (G.A[i].some(j => hostile(f, j))) { dist[i] = 0; q.push(i); } });
  for (let h = 0; h < q.length; h++) { const i = q[h]; for (const j of G.A[i]) if (G.own[j] === f && !isSea(i, j) && dist[j] > dist[i] + 1) { dist[j] = dist[i] + 1; q.push(j); } }
  const plan = [], free = i => Math.min(G.tr[i] - 1, G.tr[i] - (G.arr[i] || 0));
  for (const i of T) {
    if (free(i) < 1) continue;
    if (dist[i] > 0 && dist[i] < 99) { const j = G.A[i].filter(k => G.own[k] === f && dist[k] < dist[i] && !isSea(i, k)).sort((a, b) => threat(f, b) - threat(f, a))[0]; if (j != null) plan.push([i, j, free(i)]); }
    else if (dist[i] === 0 && threat(f, i) === 0) { const j = G.A[i].filter(k => G.own[k] === f && threat(f, k) > G.tr[k] && !isSea(i, k))[0]; if (j != null) plan.push([i, j, free(i)]); }
  }
  plan.forEach(([i, j, n]) => { G.tr[i] -= n; G.tr[j] += n; });
}
function aiAcceptTruce(f) {
  const pa = power(G.player), pb = power(f);
  let p = pb < pa * .9 ? .8 : pb < pa * 1.3 ? .45 : .15;
  if (owned(G.player).some(i => (Fa(f).obj.hold || []).includes(tname(i)))) p /= 2;
  return rnd() < p;
}
function aiBreakTruces(f) {
  for (const k of [...G.truce]) {
    const [a, b] = k.split('|'); if (a !== f && b !== f) continue;
    const o = a === f ? b : a; if (!Fa(o) || !Fa(o).alive) continue;
    if (power(f) > 1.8 * power(o) && owned(f).some(i => G.A[i].some(j => G.own[j] === o)) && rnd() < .12) {
      G.truce.delete(k); Fa(f).stab = Math.max(0, Fa(f).stab - 15); betray(f, o);
      log(f, `${fname(f)} rompe a trégua com ${fname(o)}!`); if (o === G.player && !G.auto) toast(`${fname(f)} rompeu a trégua com você!`);
    }
  }
}

// ---------- parte 9: diplomacia (DP-01 a DP-08, DP-20 a DP-25, DP-30 a DP-32, IA-06, IA-07, UI-08) ----------
const PACT = {
  pas: { n: 'Passagem livre', fx: 'tropas atravessam as estradas do outro no remanejamento e ficam supridas ao lado dele', min: 10 },
  com: { n: 'Acordo comercial', fx: '+1 ouro por rota entre os dois', min: 0 },
  pes: { n: 'Pacto de pesquisa', fx: 'cada um paga 3 ouro e ganha +2 saber por turno durante 10 turnos (exige biblioteca nos dois)', min: 10 },
  def: { n: 'Defesa mútua', fx: 'quem atacar um dos dois entra em guerra com o outro', min: 40 },
  ali: { n: 'Aliança', fx: 'defesa mútua, ataques proibidos e vitória por dominação compartilhada (exige 10 turnos de trégua)', min: 60 },
};
const pact = (a, b, k) => k === 'ali' ? G.ally.has(tk(a, b)) : G.pacts.some(p => p.k === k && tk(p.a, p.b) === tk(a, b) && (!p.u || p.u >= G.round));
const pactsOf = (a, b) => Object.keys(PACT).filter(k => pact(a, b, k));
// DP-20 e IA-07: memória de motivos, que perdem força em 30 rodadas
function remember(a, b, t, v) { if (!real(a) || !real(b) || a === b) return; const m = G.mem[tk(a, b)] || (G.mem[tk(a, b)] = []); m.unshift([t, v, G.round]); m.splice(8); }
function relOf(a, b) {
  const why = [];
  for (const [t, v, r] of G.mem[tk(a, b)] || []) { const w = Math.round(v * Math.max(0, 1 - (G.round - r) / 30)); if (w) why.push([t, w]); }
  const nr = G.routes.filter(r => rLive(r) && tk(r.f, r.o) === tk(a, b)).length; if (nr) why.push(['comércio entre nós', 5 * nr]);
  if (facFaith(a) && facFaith(a) === facFaith(b)) why.push(['mesma fé', 10]);
  if (pol(b, 'pro')) why.push(['protecionismo deles', -5]);
  if (G.truce.has(tk(a, b))) why.push(['trégua em vigor', 10]);
  if (allied(a, b)) why.push(['aliados', 20]);
  if (owned(a).some(i => G.A[i].some(j => G.own[j] === b))) why.push(['fronteira disputada', -5]);
  const ag = Math.min(30, 5 * (Fa(a).agr || 0)); if (ag) why.push(['quebra acordos', -ag]); // DP-21
  if (G.dem && G.dem.f === b && G.dem.to === a) why.push(['exigência pendente', -10]);
  return { v: Math.max(-100, Math.min(100, why.reduce((s, [, v]) => s + v, 0))), why };
}
// DP-21: agravo para quem rompe trégua ou acordo; DP-22: motivo de guerra (exigência recusada) evita o agravo
function betray(f, o) {
  G.pacts = G.pacts.filter(p => tk(p.a, p.b) !== tk(f, o)); G.ally.delete(tk(f, o));
  if (G.cb.has(f + '>' + o)) { G.cb.delete(f + '>' + o); log(f, `${fname(f)} tem motivo de guerra contra ${fname(o)}.`); return; }
  Fa(f).agr = (Fa(f).agr || 0) + 1; remember(o, f, 'rompeu a trégua conosco', -40);
  G.order.forEach(x => { if (x !== f && x !== o) remember(x, f, 'traiu um tratado', -10); });
  callDefense(f, o);
}
// DP-07: os parceiros de defesa de quem foi atacado entram na guerra
function callDefense(a, d) {
  for (const x of G.order) if (x !== a && x !== d && Fa(x).alive && (pact(x, d, 'def') || pact(x, d, 'ali')) && G.truce.has(tk(x, a))) {
    G.truce.delete(tk(x, a)); G.pacts = G.pacts.filter(p => tk(p.a, p.b) !== tk(x, a)); remember(x, a, 'atacou nosso parceiro', -20);
    log(x, `${fname(x)} entra na guerra contra ${fname(a)} para defender ${fname(d)}.`);
  }
}
const bib = f => owned(f).some(i => nb(i, 'aca') || nb(i, 'uni'));
// IA-06: a IA aceita por cálculo e diz o motivo
function accept(o, f, k, rep) {
  if (!real(o) || !Fa(o).alive) return [false, 'facção fora do jogo'];
  if (allied(o, f) && k !== 'gift') return [false, 'já são aliados'];
  if (k === 'gift') return [true, ''];
  const R = relOf(o, f), worst = R.why.filter(w => w[1] < 0).sort((x, y) => x[1] - y[1])[0], bad = worst ? `não confiamos em vocês: ${worst[0]}` : '';
  if (k === 'truce') {
    if (G.truce.has(tk(o, f))) return [false, 'já há trégua'];
    const pa = power(f), pb = power(o); let p = pb < pa * .9 ? .8 : pb < pa * 1.3 ? .45 : .15; p += R.v / 200 + (rep ? .25 : 0);
    if (owned(f).some(i => (Fa(o).obj.hold || []).includes(tname(i)))) p /= 2;
    return p >= .5 ? [true, ''] : [false, bad || 'vocês têm o que queremos'];
  }
  if (!G.truce.has(tk(o, f)) && !allied(o, f)) return [false, 'estamos em guerra: proponham trégua antes'];
  if (pact(o, f, k)) return [false, 'acordo já existe'];
  if (k === 'pes' && (!bib(o) || !bib(f) || Fa(o).gold < 3 || Fa(f).gold < 3)) return [false, 'os dois precisam de biblioteca e 3 ouro'];
  if (k === 'ali' && G.round - (G.truceT[tk(o, f)] || G.round) < 10) return [false, 'pouco tempo de trégua (10 turnos)'];
  if (k === 'ali' && G.order.filter(x => x !== o && Fa(x).alive && Fa(x).entered && !allied(o, x) && x !== f).length < 1) return [false, 'não há inimigo comum'];
  return R.v >= PACT[k].min ? [true, ''] : [false, (bad || 'relação fria') + ` (relação ${R.v}, precisa de ${PACT[k].min})`];
}
function sign(f, o, k) {
  if (k === 'ali') { G.ally.add(tk(f, o)); G.truce.add(tk(f, o)); }
  else { if (k === 'pes') { Fa(f).gold -= 3; Fa(o).gold -= 3; } G.pacts.push({ k, a: f, b: o, u: k === 'pes' ? G.round + 10 : 0 }); }
  remember(f, o, `assinamos ${PACT[k].n.toLowerCase()}`, 10); remember(o, f, `assinamos ${PACT[k].n.toLowerCase()}`, 10);
  log(f, `${fname(f)} e ${fname(o)} assinam: ${PACT[k].n}.`);
}
// ação de proposta: grátis, 1 por facção a cada 3 rodadas quando recusada
function propose(f, o, k, rep) {
  const F = Fa(f);
  if (k === 'gift') { if (F.gold < 5) return 'Ouro insuficiente.'; F.gold -= 5; Fa(o).gold += 5; remember(o, f, 'nos deu presentes', 15); log(f, `${fname(f)} envia 5 ouro de presente a ${fname(o)}.`); return ''; }
  if (rep && F.gold < 5) return 'Ouro insuficiente para a reparação.';
  const [ok, why] = accept(o, f, k, rep);
  if (!ok) { G.cool[f + '>' + o] = G.round + 3; return `${fname(o)} recusa: ${why}.`; }
  if (k === 'truce') { G.truce.add(tk(f, o)); if (rep) { F.gold -= 5; Fa(o).gold += 5; } remember(o, f, 'fizemos as pazes', 10); log(f, `${fname(f)} e ${fname(o)} assinam trégua${rep ? ' com reparação de 5 ouro' : ''}.`); }
  else sign(f, o, k);
  return '';
}
// DP-30 a DP-32: cidades-estado no lugar de parte dos neutros
const CS = {
  mer: ['mercantil', '+2 ouro por turno'], sci: ['científica', '+2 saber por turno'], mil: ['militar', '+1 tropa nos reforços'],
  rel: ['religiosa', '+2 estabilidade por turno'], cul: ['cultural', '+1 prestígio por turno'], por: ['portuária', '+1 rota comercial'],
};
const MIS = { gold: 'presente de 3 ouro a mais', troop: 'ter 3 tropas num território vizinho', route: 'ter uma rota comercial ativa' };
const csOf = i => G.own[i] === 'neu' && G.cs[i];
const suz = i => { const c = csOf(i); if (!c) return null; const e = Object.entries(c.inf).sort((a, b) => b[1] - a[1])[0]; return e && e[1] >= 3 && Fa(e[0]).alive ? e[0] : null; };
const csBonus = (f, t) => Object.keys(G.cs).filter(i => G.cs[i].t === t && suz(+i) === f).length;
const misOk = (f, i) => { const m = G.cs[i].mis; return m === 'gold' ? Fa(f).gold >= 5 : m === 'troop' ? G.A[i].some(j => G.own[j] === f && G.tr[j] >= 3) : myRoutes(f).some(rLive); };
function envoy(f, i) {
  const F = Fa(f), c = csOf(i); if (!c) return 'Escolha uma cidade-estado.';
  if (F.gold < 2) return 'Ouro insuficiente.';
  if (!spend(f)) return 'Sem pontos de ação.';
  const m = misOk(f, i); F.gold -= 2 + (m && c.mis === 'gold' ? 3 : 0);
  c.inf[f] = (c.inf[f] || 0) + (m ? 3 : 1);
  log(f, `${fname(f)} envia um enviado a ${tname(i)}${m ? ' e cumpre a missão' : ''}.`);
  if (m) c.mis = Object.keys(MIS)[Math.floor(rnd() * 3)];
  return '';
}
// DP-23: exigência de tributo. A IA forte exige 5 ouro de quem está em trégua com ela
function aiDiplo(f) {
  const F = Fa(f);
  for (const o of G.order) {
    if (o === f || !Fa(o).alive || !Fa(o).entered) continue;
    if ((G.cool[f + '>' + o] || 0) > G.round || rnd() > .25) continue;
    const opts = (G.truce.has(tk(f, o)) ? ['com', 'pas', 'pes', 'def', 'ali'] : ['truce']).filter(k => accept(f, o, k)[0] && accept(o, f, k)[0]);
    const human = o === G.player && !G.auto;
    if (opts.length && !human) { propose(f, o, opts[0]); continue; }
    if (opts.length) { G.offers.push({ f, k: opts[0] }); G.cool[f + '>' + o] = G.round + 4; continue; }
    if (!human && !G.truce.has(tk(f, o)) && accept(o, f, 'truce')[0] === false && power(f) < power(o) * .5 && F.gold >= 6) { propose(f, o, 'truce', 1); continue; } // DP-25
    if (G.truce.has(tk(f, o)) && power(f) > 2 * power(o) && Fa(o).gold >= 5 && rnd() < .2 && !(G.dem && G.dem.to === o)) {
      G.cool[f + '>' + o] = G.round + 6;
      if (human) { G.dem = { f, to: o, g: 5, r: G.round }; log(f, `${fname(f)} exige 5 ouro de tributo de você.`); }
      else if (power(o) * 1.5 < power(f)) { Fa(o).gold -= 5; F.gold += 5; remember(o, f, 'nos cobrou tributo', -15); log(f, `${fname(o)} paga tributo a ${fname(f)}.`); }
      else { G.cb.add(f + '>' + o); remember(f, o, 'recusou nosso tributo', -20); log(f, `${fname(o)} recusa o tributo de ${fname(f)}.`); }
    }
  }
  if (F.gold >= 6 && F.pa > 0) { const i = Object.keys(G.cs).map(Number).filter(i => csOf(i)).sort((a, b) => (G.cs[b].inf[f] || 0) - (G.cs[a].inf[f] || 0))[0]; if (i != null && rnd() < .4) envoy(f, i); }
}
// efeitos por turno: pactos de pesquisa, cidades-estado, idade das tréguas, fim de pactos
function diploTurn(f) {
  const F = Fa(f);
  for (const k of G.truce) if (G.truceT[k] == null) G.truceT[k] = G.round;
  for (const k of Object.keys(G.truceT)) if (!G.truce.has(k)) delete G.truceT[k];
  G.pacts = G.pacts.filter(p => (!p.u || p.u >= G.round) && G.truce.has(tk(p.a, p.b)));
  F.sci += 2 * G.pacts.filter(p => p.k === 'pes' && (p.a === f || p.b === f)).length;
  F.gold += 2 * csBonus(f, 'mer'); F.sci += 2 * csBonus(f, 'sci'); F.stab = Math.min(100, F.stab + 2 * csBonus(f, 'rel')); F.pre += csBonus(f, 'cul');
  if (G.dem && G.dem.to === f && G.dem.r < G.round) { G.cb.add(G.dem.f + '>' + f); remember(G.dem.f, f, 'recusou nosso tributo', -20); log(f, `Você ignorou a exigência de ${fname(G.dem.f)}: agora ela tem motivo de guerra.`); G.dem = null; }
}
function diploModal() {
  const me = G.player, my = G.turnF === me;
  const rows = G.order.filter(o => o !== me && Fa(o).entered && Fa(o).alive).map(o => {
    const R = relOf(o, me), st = allied(me, o) ? 'aliança' : G.truce.has(tk(me, o)) ? 'trégua' : 'guerra', ps = pactsOf(me, o).filter(k => k !== 'ali').map(k => PACT[k].n);
    const cool = (G.cool[me + '>' + o] || 0) > G.round;
    const btn = (k, rep) => { const [ok, why] = accept(o, me, k, rep), lb = k === 'truce' ? (rep ? 'Trégua + 5 ouro' : 'Propor trégua') : k === 'gift' ? 'Presente 5💰' : PACT[k].n; return `<button class="mini ${ok ? 'pri' : ''}" data-a="dprop" data-f="${o}" data-k="${k}" data-r="${rep ? 1 : 0}" title="${esc(ok ? 'Deve aceitar.' : 'Deve recusar: ' + why)}" ${my && !cool ? '' : 'disabled'}>${lb}${ok ? ' ✓' : ''}</button>`; };
    const opts = st === 'guerra' ? [btn('truce'), btn('truce', 1)] : st === 'trégua' ? Object.keys(PACT).filter(k => !pact(me, o, k)).map(k => btn(k)) : [];
    return `<div class="tech"><div><b><i class="dot" style="background:${Fa(o).c}"></i>${esc(fname(o))}</b> <span class="hint">${st} · relação ${R.v}${ps.length ? ' · ' + esc(ps.join(', ')) : ''}</span>
      <p class="hint">${R.why.map(([t, v]) => `${esc(t)} (${v > 0 ? '+' : ''}${v})`).join(' · ') || 'sem histórico'}</p><p>${opts.join(' ')} ${btn('gift')}${cool ? ' <span class="hint">recusou há pouco: aguarde</span>' : ''}</p></div></div>`;
  }).join('');
  const off = G.offers.map((x, n) => `<p>${esc(fname(x.f))} propõe <b>${x.k === 'truce' ? 'trégua' : PACT[x.k].n}</b>. <button class="mini pri" data-a="doff" data-n="${n}" ${my ? '' : 'disabled'}>Aceitar</button></p>`).join('');
  const dem = G.dem && G.dem.to === me ? `<p>${esc(fname(G.dem.f))} exige <b>${G.dem.g} ouro</b> de tributo. Recusar dá a ela motivo de guerra. <button class="mini" data-a="ddem" ${my && Fa(me).gold >= G.dem.g ? '' : 'disabled'}>Pagar</button></p>` : '';
  const cs = Object.keys(G.cs).map(Number).filter(csOf).map(i => { const c = G.cs[i], s = suz(i); return `<li>${esc(tname(i))}: ${CS[c.t][0]} (${CS[c.t][1]}) · suserano ${s ? esc(fname(s)) : 'nenhum'} · sua influência ${c.inf[me] || 0} · missão: ${MIS[c.mis]}</li>`; }).join('');
  modal(`<h2>Diplomacia</h2><p class="hint">Propostas não gastam ação. Passe o mouse num botão para ver se a facção aceita; ✓ = deve aceitar. Romper trégua dá agravo com todos, salvo com motivo de guerra.</p>${dem}${off}<div class="techs">${rows || '<p>Nenhuma facção em jogo.</p>'}</div>${cs ? `<h3>Cidades-estado</h3><p class="hint">Selecione uma no mapa e use “Enviado” (1 ação, 2 ouro; cumprindo a missão vale 3 de influência). Quem tem mais influência (mín. 3) é o suserano e recebe o bônus; só ele pode anexá-la por influência.</p><ul>${cs}</ul>` : ''}`, [['Fechar']]);
}

// ---------- mapa ----------
let svg, vb, P = [], B = [];
function buildMap() {
  const m = G.m; svg = $('#map');
  vb = { x: 0, y: 0, w: m.w, h: m.h };
  let h = `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="${REB.c}"/><rect width="2" height="6" fill="#00000055"/></pattern></defs><rect x="${-m.w}" y="${-m.h}" width="${m.w * 3}" height="${m.h * 3}" class="sea"/>`;
  if (m.bg) h += `<path d="${m.bg}" class="bgl"/>`;
  h += '<g>' + m.terr.map((t, i) => `<path d="${t.d}" data-i="${i}" class="t"><title>${esc(t.n)}</title></path>`).join('') + '</g>';
  h += '<g class="sealinks">' + m.sea.map(([a, b, w]) => { const A = m.terr[a], C = m.terr[b]; if (!w) return `<line x1="${A.x}" y1="${A.y}" x2="${C.x}" y2="${C.y}"/>`; const [L, R] = A.x < C.x ? [A, C] : [C, A]; return `<line x1="${L.x}" y1="${L.y}" x2="0" y2="${L.y}"/><line x1="${R.x}" y1="${R.y}" x2="${m.w}" y2="${R.y}"/>`; }).join('') + '</g>';
  h += '<g id="roads"></g><g id="hl"></g><g id="badges">' + m.terr.map((t, i) => `<g class="b" data-i="${i}"><circle class="cap" r="14" hidden/><circle class="bc" r="10"/><text class="bn" y="4">0</text><text class="ic" x="13" y="-8"></text><text class="nm" y="23">${esc(t.n)}</text></g>`).join('') + '</g>';
  svg.innerHTML = h;
  P = [...svg.querySelectorAll('path.t')]; B = [...svg.querySelectorAll('g.b')];
  setVB();
}
function upp() { const r = svg.getBoundingClientRect(); return r.width ? Math.max(vb.w / r.width, vb.h / r.height) : 1; }
function setVB() {
  svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  const r = svg.getBoundingClientRect(), u = upp(), k = u * Math.max(.62, Math.min(1, r.width / 900));
  B.forEach((g, i) => { const t = G.m.terr[i]; g.setAttribute('transform', `translate(${t.x},${t.y}) scale(${k})`); });
  svg.classList.toggle('names', (1 / u) * Math.sqrt(G.m.w * G.m.h / G.N) > 85);
}
function clampVB() {
  const m = G.m; vb.w = Math.max(m.w / 10, Math.min(m.w, vb.w)); vb.h = vb.w * m.h / m.w;
  vb.x = Math.max(-vb.w * .15, Math.min(m.w - vb.w * .85, vb.x)); vb.y = Math.max(-vb.h * .15, Math.min(m.h - vb.h * .85, vb.y));
}
function zoomAt(cx, cy, w) {
  const r = svg.getBoundingClientRect(), u = upp(), ox = (r.width - vb.w / u) / 2, oy = (r.height - vb.h / u) / 2;
  const px = vb.x + (cx - r.left - ox) * u, py = vb.y + (cy - r.top - oy) * u, k = Math.max(G.m.w / 10, Math.min(G.m.w, w)) / vb.w;
  vb.x = px - (px - vb.x) * k; vb.y = py - (py - vb.y) * k; vb.w *= k; vb.h *= k; clampVB(); setVB();
}
function zoomBtn(f) { const r = svg.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, vb.w * f); }
function initPan() {
  svg = $('#map'); const ptr = new Map(); let dr = null;
  svg.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, vb.w * (e.deltaY < 0 ? 1 / 1.2 : 1.2)); }, { passive: false });
  svg.addEventListener('pointerdown', e => {
    ptr.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptr.size === 1) dr = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y, moved: false, el: e.target };
    else if (ptr.size === 2) { const [a, b] = [...ptr.values()]; dr = { pinch: Math.hypot(a[0] - b[0], a[1] - b[1]), w: vb.w, moved: true }; }
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId) || !dr) return; ptr.set(e.pointerId, [e.clientX, e.clientY]);
    if (dr.pinch) { if (ptr.size < 2) return; const [a, b] = [...ptr.values()]; zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, dr.w * dr.pinch / Math.max(10, Math.hypot(a[0] - b[0], a[1] - b[1]))); return; }
    const dx = e.clientX - dr.x, dy = e.clientY - dr.y;
    if (Math.abs(dx) + Math.abs(dy) > 7) dr.moved = true;
    if (dr.moved) { const u = upp(); vb.x = dr.vx - dx * u; vb.y = dr.vy - dy * u; clampVB(); setVB(); }
  });
  const up = e => {
    ptr.delete(e.pointerId);
    if (dr && !dr.moved && !dr.pinch && !ptr.size) { const el = dr.el.closest && dr.el.closest('[data-i]'); if (el) onTerr(+el.dataset.i); }
    if (!ptr.size) dr = null;
  };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  new ResizeObserver(() => G && setVB()).observe(svg);
}
function renderMap() {
  const net = G.lens === 'net' ? netOf(G.player) : null;
  for (let i = 0; i < G.N; i++) {
    const o = G.own[i], F = Fa(o);
    const L = o === 'off' ? 'own' : G.lens || 'own', z = zonesAt(i)[0];
    P[i].setAttribute('fill', L === 'net' ? (net.core.has(i) ? '#c9a227' : net.linked.has(i) ? '#7d6a2a' : o === G.player ? '#5b3a34' : '#2a323d') : L === 'ter' ? TERR[G.ter[i]].c : L === 'zon' ? (z ? ZC[STRUCT[z].z] : '#2a323d') : L === 'res' ? (G.dep[i].some(d => DEP[d].lux) ? '#6d4f86' : G.dep[i].length ? '#4f5d6e' : '#2a323d') : o === 'reb' ? 'url(#hatch)' : F.c);
    P[i].classList.toggle('off', o === 'off');
    const g = B[i]; g.toggleAttribute('hidden', o === 'off');
    g.querySelector('.bc').setAttribute('fill', F.c); g.querySelector('.bn').textContent = G.tr[i];
    g.querySelector('.cap').toggleAttribute('hidden', !capOwner(i));
    const ics = L === 'res' ? G.dep[i].map(d => DEP[d].ic) : L === 'zon' ? zonesAt(i).map(k => STRUCT[k].ic) : G.bld[i].map(k => STRUCT[k].ic);
    if (L === 'ter') ics.unshift(TERR[G.ter[i]].ic + (G.riv[i] ? '〰' : ''), LEVEL[G.lv[i]].ic);
    g.querySelector('.ic').textContent = (G.relics.includes(i) ? 'ᚱ' : '') + ics.slice(0, 3).join('') + (ics.length > 3 ? '+' + (ics.length - 3) : '') + (G.fort[i] > 0 ? '⛨' : '') + (occupied(i) ? '⚑' : '') + (o === G.player && G.q[i].length ? '⏳' : '');
    g.classList.toggle('lightbg', light(F.c));
  }
  // parte 5: estradas como linhas entre vizinhos que têm estrada (do mesmo dono)
  const T = G.m.terr, rl = [];
  for (let i = 0; i < G.N; i++) if (road(i)) for (const j of G.A[i]) if (j > i && road(j) && G.own[i] === G.own[j] && !isSea(i, j)) rl.push(`<line x1="${T[i].x}" y1="${T[i].y}" x2="${T[j].x}" y2="${T[j].y}" class="rd${Math.min(road(i), road(j))}"/>`);
  for (const r of G.routes) rl.push(`<line x1="${T[r.a].x}" y1="${T[r.a].y}" x2="${T[r.b].x}" y2="${T[r.b].y}" class="rt${r.f === G.player || r.o === G.player ? ' me' : ''}"/>`); // parte 6
  $('#roads').innerHTML = rl.join('');
  document.querySelectorAll('#lens button').forEach(b => b.classList.toggle('on', b.dataset.l === (G.lens || 'own')));
  const hl = [], me = G.player, my = G.turnF === me;
  const p = (j, c) => hl.push(`<path d="${G.m.terr[j].d}" class="${c}"/>`);
  if (G.sel != null) p(G.sel, 'hs');
  const md = my && modeTest(G.mode);
  if (md) for (let j = 0; j < G.N; j++) if (md(j)) p(j, G.mode === 'air' || G.mode === 'agit' ? 'ha' : 'hm');
  else if (my && G.sel != null && G.tgt == null) {
    if (G.phase === 'atk') G.A[G.sel].filter(j => canAtk(me, G.sel, j)).forEach(j => p(j, 'ht'));
    if (G.phase === 'mov' && (G.mv[G.sel] || 0) > 0) moveDests(me, G.sel).filter(j => seaOk(me, G.sel, j)).forEach(j => p(j, 'hm'));
  }
  if (G.tgt != null) p(G.tgt, 'hx');
  $('#hl').innerHTML = hl.join('');
}
const ZC = { agr: '#8fae3c', pec: '#b69a52', pes: '#3f8fb0', flo: '#2f7a42', min: '#857868', com: '#c9a227', por: '#2f5f8f', rel: '#9a6ac0', mil: '#a33b33', sci: '#3fa7a0' };
function light(c) { const n = parseInt(c.slice(1), 16); return ((n >> 16) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11) > 165; }

// ---------- interação ----------
function onTerr(i) {
  if (!G || G.over) return;
  const me = G.player, myTurn = G.turnF === me && !G.busy;
  if (myTurn && G.card) {
    const { h } = G.card, k = Fa(me).cards[h].k;
    if (cardNeeds(k) === 'two' && G.card.src == null) { if (G.own[i] !== me || G.tr[i] < 2) return toast('Escolha um território seu com 2+ tropas.'); G.card.src = i; G.sel = i; toast('Agora clique no destino.'); return render(); }
    const ok = cardNeeds(k) === 'two' ? playCard(me, h, G.card.src, i) : playCard(me, h, i);
    if (ok) { G.card = null; toast('Carta usada.'); } else toast('Alvo inválido para esta carta.');
    return render();
  }
  if (myTurn && G.mode === 'air') {
    if (!airTargets(me).includes(i)) return toast(`Alvo fora do alcance (${G.air.r} territórios) ou com menos de 2 tropas.`);
    const r = airStrike(me, i); showAir(me, i, r); if (!Fa(me).planes) G.mode = null; return render();
  }
  if (myTurn && G.mode === 'rec') {
    if (!recruit(me, i)) return toast(Fa(me).gold < troopCost(me) ? 'Ouro insuficiente.' : 'Recrute na capital ou num território com ' + sName('qua') + '.');
    G.sel = i; if (Fa(me).gold < troopCost(me)) G.mode = null; return render();
  }
  if (myTurn && G.mode && G.mode !== 'air') {
    const [a, k] = G.mode.split(':'), err = a === 'bld' ? act(me, 'bld', k, i) : act(me, a, i);
    if (err) return toast(err);
    if (a === 'bld') toast(`${sName(k)} entrou na fila de ${tname(i)}. Clique em outro território ou escolha outra obra.`);
    else { G.mode = null; $('#toast').hidden = true; }
    G.sel = i; return render();
  }
  if (!myTurn) { G.sel = i; return render(); }
  if (G.phase === 'ref') {
    G.sel = i;
    if (G.own[i] === me && Fa(me).reinf > 0) { G.tr[i]++; Fa(me).reinf--; }
  } else if (G.phase === 'atk') {
    if (G.tgt != null) return;
    if (G.sel != null && canAtk(me, G.sel, i)) { G.tgt = i; showBattlePanel(); }
    else if (!Fa(me).camp && G.sel != null && G.own[G.sel] === me && G.A[G.sel].includes(i) && hostile(me, i)) toast('Para atacar, declare uma Campanha (1 ação).');
    else if (Fa(me).cq >= cqMax(me) && G.sel != null && G.own[G.sel] === me && G.A[G.sel].includes(i) && hostile(me, i)) toast(`Limite de ${cqMax(me)} conquistas por turno atingido: as tropas precisam consolidar o terreno.`);
    else if (G.sel != null && G.own[G.sel] === me && G.A[G.sel].includes(i) && hostile(me, i) && !seaOk(me, G.sel, i)) toast('Sem frota disponível para atravessar o mar neste turno.');
    else G.sel = i;
  } else if (G.phase === 'mov') {
    if (G.tgt != null) return;
    if (G.sel != null && G.own[G.sel] === me && (G.mv[G.sel] || 0) > 0 && moveDests(me, G.sel).includes(i)) {
      if (!seaOk(me, G.sel, i)) return toast('Sem frota disponível para atravessar o mar.');
      G.tgt = i; showMovePanel();
    } else G.sel = i;
  }
  render();
}
function toPhase(p) {
  if (G.turnF !== G.player || G.busy) return;
  const F = Fa(G.player);
  if (p === 'atk' && F.reinf > 0) return toast('Posicione todos os reforços primeiro.');
  if (G.pend) return toast('Ocupe o território conquistado primeiro.');
  G.phase = p; G.sel = G.tgt = null; G.card = null; G.mode = null; hideBattle();
  if (p === 'mov') G.mv = G.tr.map((t, i) => G.own[i] === G.player ? Math.max(0, Math.min(t - 1, t - (G.arr[i] || 0))) : 0);
  render();
}
// territórios válidos para cada modo de clique
function modeTest(m) {
  const me = G.player;
  if (!m) return null;
  if (m === 'air') { const t = new Set(airTargets(me)); return j => t.has(j); }
  if (m === 'rec') return j => canRecruitAt(me, j);
  if (m === 'infl') return j => canInfl(me, j);
  if (m === 'agit') return j => real(G.own[j]) && hostile(me, j);
  if (m.startsWith('bld:')) { const k = m.slice(4); return j => canQueue(me, k, j); }
  return null;
}
// botões de ação do jogador
function playerAct(a, k) {
  const me = G.player, F = Fa(me);
  if (G.turnF !== me || G.busy || G.phase !== 'atk') return;
  G.card = null;
  if (G.mode && (G.mode === a || G.mode === 'bld:' + k)) { G.mode = null; return render(); }
  G.mode = null;
  const hint = { infl: 'Clique num território neutro ou rebelde vizinho (custa tropas dele + 1 de prestígio).', agit: 'Clique num território da facção rival.' };
  if (a === 'bld') {
    if (!F.bldOn) return toast('Abra as obras primeiro (1 ação).');
    if (!owned(me).some(i => canQueue(me, k, i))) return toast('Nenhum território seu aceita esta obra agora.');
    G.mode = 'bld:' + k; toast(`Clique nos territórios destacados para pôr ${sName(k)} na fila.`); return render();
  }
  if (hint[a]) { if (F.pa < 1) return toast('Sem pontos de ação.'); G.mode = a; toast(hint[a]); return render(); }
  if (a === 'rec' && F.recOn) { G.mode = 'rec'; return render(); }
  if (a === 'trade' && F.tradeOn) return tradeModal();
  if (a === 'obras' && F.bldOn) return worksModal();
  const err = act(me, a);
  if (err) return toast(err);
  if (a === 'obras') toast('Obras abertas: escolha uma construção e clique nos territórios. Apressar e retirar também ficam livres neste turno.');
  if (a === 'rec') { G.mode = 'rec'; toast(`Clique na capital ou num ${sName('qua')} para comprar tropas (${troopCost(me)} ouro cada).`); }
  if (a === 'trade') tradeModal();
  render();
}
function techModal() {
  const me = G.player, F = Fa(me);
  const si = income(me).sci;
  const row = t => {
    const own = has(me, t.k), ok = techOk(me, t), on = F.res === t.k, can = ok && !on && G.turnF === me, c = techCost(t, me);
    const req = (t.req || []).map(tName).join(' e '), left = Math.max(0, c - F.sci), eta = left ? Math.ceil(left / si) : 0;
    const lib = [...Object.keys(STRUCT).filter(k => STRUCT[k].tech === t.k).map(sName), ...Object.values(ARMY).filter(a => a.tech === t.k).map(a => a.n)];
    return `<div class="tech ${own ? 'own' : ok ? '' : 'lock'}"><div><b>${esc(tName(t.k))}</b> <span class="hint">${c} 🔬${req ? ' · exige ' + esc(req) : ''}</span><p>${esc(t.fx)}</p>${lib.length ? `<p class="hint">libera: ${esc(lib.join(', '))}</p>` : ''}${on ? `<p class="hint">${pbar(F.sci, c)} ${eta ? `pronta em ${eta} turno(s)` : 'pronta no início do próximo turno'}</p>` : ''}</div>${own ? '<span class="ok">✓</span>' : on ? '<span class="ok">em pesquisa</span>' : `<button class="mini ${can ? 'pri' : ''}" data-a="tech" data-k="${t.k}" ${can ? '' : 'disabled'}>Pesquisar</button>`}</div>`;
  };
  modal(`<h2>Tecnologias · ${esc(G.era.n)}</h2><p class="hint">Saber acumulado: ${F.sci} 🔬 (+${si} por turno). Escolher a pesquisa não gasta ação: o saber de cada turno vai para ela e ela fica pronta no início do turno em que o custo for atingido. Cada tecnologia nova vale 2 de legado. Tropas: ${esc(armyOf(me).map(k => ARMY[k].n).join(', ') || 'só milícia')}.</p>${[['Antiguidade', t => !t.doc && t.e === 0], ['Idade Média', t => !t.doc && t.e === 1], ['Idade Moderna', t => !t.doc && t.e === 2], ['Doutrinas', t => t.doc]].map(([n, fl]) => `<h3>${n}</h3><div class="techs">${TECH.filter(fl).map(row).join('')}</div>`).join('')}`, [['Fechar']]);
}
const pbar = (v, max) => `<span class="bar"><i style="width:${Math.min(100, 100 * v / max)}%;background:var(--brass)"></i></span>`;
// fila de um território (UI-02 e UI-06)
function qHtml(i) {
  const me = G.player, F = Fa(me), mine = G.own[i] === me, eta = qEta(i);
  if (!G.q[i].length) return '<p class="hint">Fila vazia.</p>';
  return '<ul class="q">' + G.q[i].map((x, n) => {
    const c = pCost(G.own[i], x.k, i), rc = rushCost(me, i, n);
    const btn = mine && G.turnF === me ? (F.bldOn ? `<button class="mini" data-a="rush" data-i="${i}" data-n="${n}" ${canRush(me, i, n) ? '' : 'disabled'} title="${x.t >= G.round ? 'Não dá para apressar no turno em que a obra começou.' : ''}">Apressar ${rc}💰</button><button class="mini" data-a="unq" data-i="${i}" data-n="${n}" title="Retirar da fila (perde o progresso)">✕</button>` : '') : '';
    return `<li>${STRUCT[x.k].ic} ${esc(sName(x.k))} ${pbar(x.p, c)} <span class="hint">${x.p}/${c} ⚒ · ${isFinite(eta[n]) ? eta[n] + ' turno(s)' : 'parada'}</span> ${btn}</li>`;
  }).join('') + '</ul>';
}
// parte 4: catálogo com todas as construções e o que falta para cada uma
function reqText(k) {
  const S = STRUCT[k], me = G.player, r = [];
  if (S.z) r.push('zona ' + ZONE[S.z].toLowerCase() + ' (ocupa vaga)');
  if (S.need) r.push('exige ' + [].concat(S.need).map(sName).join(' ou ') + ' no território');
  if (S.dep) r.push('jazida: ' + S.dep.map(d => DEP[d].n).join(', '));
  if (S.rioReq) r.push('rio');
  if (S.coast || S.sea) r.push('litoral');
  if (S.ter) r.push('terreno: ' + [...S.ter].map(t => TERR[t].n).join(', ') + (S.rio ? ' ou rio' : '') + (S.dz ? ' ou jazida da zona' : ''));
  if (S.near) r.push('colina ou montanha no território ou ao lado');
  if (S.lv) r.push(LEVEL[S.lv].n.toLowerCase() + ' ou maior');
  const m = reqF(me, k); if (m) r.push('<b>' + esc(m) + '</b>');
  return r.join(' · ');
}
function catalogModal() {
  const me = G.player, rows = Object.keys(STRUCT).filter(k => !STRUCT[k].air || G.air).map(k => { const S = STRUCT[k], ok = owned(me).some(i => canQueue(me, k, i)); return `<div class="tech${ok ? '' : ' off'}"><div><b>${S.ic} ${esc(sName(k))}</b> <span class="hint">${pCost(me, k)}⚒${S.up ? ' · ' + S.up + '💰/t' : ''}${S.lg ? ' · legado ' + S.lg : ''}</span><br><span class="hint">${esc(S.fx)}</span><br><span class="hint">${ok ? '✓ disponível' : reqText(k)}</span></div></div>`; }).join('');
  modal(`<h2>Catálogo de construções</h2><p class="hint">Cadeias: a zona abre as construções dela; algumas pedem bens explorados em qualquer território seu.</p><div class="techs">${rows}</div>`, [['Fechar']]);
}
function worksModal() {
  const me = G.player, F = Fa(me), T = owned(me), u = upkeepOf(me);
  const rows = T.map(i => `<div class="tech"><div><b>${esc(tname(i))}</b> <span class="hint">${prodOf(i)} ⚒/turno${occupied(i) ? ' · ocupado' : ''} · ${G.bld[i].length ? G.bld[i].map(k => esc(sName(k)) + (nb(i, k) ? '' : ' (desativada)')).join(', ') : 'sem construções'}</span>${qHtml(i)}</div></div>`).join('');
  modal(`<h2>Obras do império</h2><p class="hint">${F.bldOn ? 'Obras abertas neste turno: apresse ou retire à vontade.' : 'Abra as obras (1 ação) para pôr, retirar ou apressar.'} Manutenção por turno: ${u.b} 💰 das construções + ${u.t} 💰 de soldo (tropas acima de ${ECON.freeT} por território, 1 ouro a cada ${ECON.perT}). Você tem ${F.gold} 💰.</p><div class="techs">${rows}</div>`, [['Fechar']]);
}
function tradeModal() {
  const me = G.player, F = Fa(me), [p, q] = has(me, 'com') ? [3, 2] : [2, 1], ks = Object.keys(RES);
  const btns = ks.flatMap(a => ks.filter(b => b !== a).map(b => `<button class="mini" data-a="trd" data-x="${a}" data-y="${b}" ${F[a] >= p ? '' : 'disabled'}>${p}${RES[a][0]} → ${q}${RES[b][0]}</button>`)).join('');
  modal(`<h2>Comércio</h2><p class="hint">Troque à vontade neste turno. Você tem ${F.gold} 💰 · ${F.sci} 🔬 · ${F.pre} ⭐</p><div class="row">${btns}</div>`, [['Fechar']]);
}
function addAll() { const F = Fa(G.player); if (G.sel == null || G.own[G.sel] !== G.player) return toast('Selecione um território seu.'); G.tr[G.sel] += F.reinf; F.reinf = 0; render(); }
function useCard(h) {
  if (G.turnF !== G.player || G.busy) return;
  const c = Fa(G.player).cards[h];
  if (G.card && G.card.h === h) { G.card = null; return render(); }
  const need = cardNeeds(c.k);
  if (need) { G.card = { h }; G.mode = null; toast({ own: 'Clique num território seu.', two: 'Clique no território de origem.', adj: 'Clique num inimigo vizinho.', turn: 'Clique num inimigo vizinho com até 3 tropas.' }[need] || 'Clique num território da facção alvo.'); return render(); }
  if (!playCard(G.player, h)) toast(c.k === 0 ? 'Use na fase de Reforços.' : 'Não dá para usar agora.');
  render();
}
function dipl(o, act) {
  const me = G.player;
  if (G.turnF !== me || G.busy) return;
  if (act === 'pro') {
    if ((G.cool[o] || 0) > G.round) return;
    G.cool[o] = G.round + 3;
    const e = propose(me, o, 'truce'); if (!e) { log(me, `${fname(o)} aceita a trégua.`); toast(`${fname(o)} aceitou a trégua.`); }
    else { log(me, `${fname(o)} recusa a trégua.`); toast(e); }
  } else if (act === 'brk') { G.confirmBrk = o; }
  else if (act === 'ok') { G.truce.delete(tk(me, o)); Fa(me).stab = Math.max(0, Fa(me).stab - 15); betray(me, o); G.confirmBrk = null; log(me, `Você rompe a trégua com ${fname(o)} (−15 de estabilidade).`); }
  else G.confirmBrk = null;
  render();
}

// ---------- painel de batalha ----------
const bt = () => $('#battle');
function hideBattle() { bt().hidden = true; G && (G.tgt = null); }
function placeB(j) { const b = bt(); b.hidden = false; const r = B[j].getBoundingClientRect(), w = $('#mapw').getBoundingClientRect(); b.classList.toggle('top', r.top + r.height / 2 > w.top + w.height * .55); }
const dieH = (v, cls) => `<span class="die ${cls}">${v}</span>`;
const diceRows = r => `<div class="dice"><div>${r.R.map((v, k) => dieH(v, 'att' + (r.res[k] === false ? ' lost' : ''))).join('')}</div><div>${r.D.map((v, k) => dieH(v, 'def' + (r.res[k] === true ? ' lost' : ''))).join('')}</div></div>`;
function showDice(i, j, r, ai) {
  const a = G.own[i], d = G.own[j], b = bt(); placeB(j);
  b.innerHTML = `<div class="bh"><b style="color:${Fa(a).c}">${esc(tname(i))}</b> <span>${G.tr[i]}</span> ⚔ <b style="color:${Fa(d).c}">${esc(tname(j))}</b> <span>${Math.max(0, G.tr[j])}</span></div>${diceRows(r)}
  <p class="bm">${ai ? esc(fname(a)) + ' ataca você. ' : ''}Ataque perde ${r.al}, defesa perde ${r.dl}.${r.won ? ' Território conquistado!' : ''}</p>`;
}
function showAir(f, j, r, ai) {
  if (!r) return; const b = bt(); placeB(j);
  b.innerHTML = `<div class="bh">✈ ${esc(G.air.n)} de <b style="color:${Fa(f).c}">${esc(fname(f))}</b> sobre <b>${esc(tname(j))}</b> <span>${G.tr[j]}</span></div>
  <div class="dice"><div>${dieH(r.aa, 'def' + (r.down ? '' : ' lost'))}</div><div>${r.down ? '' : dieH(r.hit, 'att' + (r.kill ? '' : ' lost'))}</div></div>
  <p class="bm">Antiaéreo ${r.aa}${r.down ? ': avião abatido.' : ` (abate com ${G.air.aa}+). Bombardeio ${r.hit}: ${r.kill ? '1 tropa eliminada.' : `errou (precisa de ${G.air.hit}+).`}`}${ai ? '' : ` Restam ${Fa(f).planes} aviões.`}</p>${ai ? '' : '<div class="bb"><button data-a="bclose">Fechar</button></div>'}`;
}
function showBattlePanel(last) {
  const i = G.sel, j = G.tgt, b = bt(); placeB(j);
  const [ad, dd] = diceFor(i, j), d = G.own[j], me = Fa(G.player);
  const notes = [isSea(i, j) ? 'desembarque pelo mar' : '', TERR[G.ter[j]].n.toLowerCase(), defBonus(j) ? `defesa +${defBonus(j)} no maior dado` : '', TERR[G.ter[j]].def === 'w' ? 'pântano: 1 dado a menos' : '', TERR[G.ter[j]].def === 'm' ? 'montanha: empate é da defesa' : '', me.ofs ? 'ofensiva +1' : ''].filter(Boolean).join(' · ');
  b.innerHTML = `<div class="bh"><b style="color:${me.c}">${esc(tname(i))}</b> <span>${G.tr[i]}</span> ⚔ <b style="color:${Fa(d).c}">${esc(tname(j))}</b> <span>${G.tr[j]}</span></div>
  ${last ? diceRows(last) : `<div class="dice"><div>${'<span class="die att ghost">?</span>'.repeat(ad)}</div><div>${'<span class="die def ghost">?</span>'.repeat(dd)}</div></div>`}
  <p class="bm">${last ? `Você perde ${last.al}, defesa perde ${last.dl}. ` : ''}${ad} contra ${dd} dados${notes ? ' · ' + notes : ''}. Empate fica com a defesa${me.ab === 'tatico' ? ', exceto para você (Gênio Tático)' : ''}.</p>
  <div class="bb"><button class="pri" data-a="roll1" ${G.tr[i] < 2 ? 'disabled' : ''}>Atacar 1x</button><button data-a="blitz" ${G.tr[i] < 2 ? 'disabled' : ''}>Atacar até o fim</button><button data-a="bclose">Recuar</button></div>`;
}
async function doRoll(blitz) {
  if (G.busy || G.tgt == null) return; G.busy = true;
  const g = G, i = G.sel, j = G.tgt, d = G.own[j]; let r;
  useSea(G.player, i, j);
  do {
    if (!G.fast) { for (let k = 0; k < 3; k++) { const [a, b] = diceFor(i, j); showDice(i, j, { R: Array.from({ length: a }, d6), D: Array.from({ length: b }, d6), res: [], al: '…', dl: '…' }); await sleep(blitz ? 35 : 70); if (G !== g) return; } }
    r = roll(i, j);
  } while (blitz && !r.won && G.tr[i] > 1);
  G.busy = false;
  if (r.won) showConquer(i, j, r, d);
  else { showBattlePanel(r); if (G.tr[i] < 2) bt().querySelector('.bm').textContent += ' Sem tropas para continuar.'; }
  renderMap(); renderSide();
}
function showConquer(i, j, r, d) {
  const max = Math.min(r.ad, G.tr[i] - 1), b = bt();
  b.innerHTML = `<div class="bh">Conquistado: <b>${esc(tname(j))}</b></div>${diceRows(r)}
  <label class="mv">Mover tropas (até ${r.ad}, os dados da vitória): <input type="range" id="mvR" min="1" max="${max}" value="${max}"> <b id="mvN">${max}</b></label>
  <div class="bb"><button class="pri" data-a="occupy">Ocupar</button></div>`;
  G.pend = { i, j, d };
  if (max === 1) $('#mvR').disabled = true;
}
function occupy() {
  const { i, j, d } = G.pend, n = +$('#mvR').value; G.pend = null;
  log(G.player, `Você conquista ${tname(j)}${real(d) ? ' de ' + fname(d) : ''}.`);
  conquer(i, j, n); hideBattle(); G.sel = j; render();
}
function showMovePanel() {
  const i = G.sel, j = G.tgt, b = bt(), max = G.mv[i]; placeB(j);
  b.innerHTML = `<div class="bh">Remanejar de <b>${esc(tname(i))}</b> para <b>${esc(tname(j))}</b>${isSea(i, j) ? ' (pelo mar)' : ''}</div>
  <label class="mv">Tropas: <input type="range" id="mvR" min="1" max="${max}" value="${max}"> <b id="mvN">${max}</b></label>
  <div class="bb"><button class="pri" data-a="move">Mover</button><button data-a="bclose">Cancelar</button></div>`;
}
function doMove() {
  const n = +$('#mvR').value, i = G.sel, j = G.tgt;
  useSea(G.player, i, j); G.tr[i] -= n; G.tr[j] += n; G.mv[i] -= n;
  log(G.player, `Você move ${n} tropa(s) de ${tname(i)} para ${tname(j)}.`); hideBattle(); G.sel = G.mv[i] > 0 ? i : null; render();
}

// ---------- painel lateral ----------
function bar(v) { const c = v < 15 ? 'var(--bad)' : v < 35 ? 'var(--warn)' : 'var(--good)'; return `<span class="bar"><i style="width:${v}%;background:${c}"></i></span><b>${Math.round(v)}</b>`; }
function render() { if (!G) return; renderMap(); renderSide(); }
function renderSide() {
  const me = G.player, F = Fa(me), cur = G.turnF, CF = cur && Fa(cur), my = cur === me && !G.over;
  $('#round').textContent = `Rodada ${Math.min(G.round, G.rounds)}/${G.rounds} · ${G.len.n}`;
  $('#turn').innerHTML = CF ? `<i class="dot" style="background:${CF.c}"></i>${my ? 'Seu turno' : esc(CF.n)} · ${PHASE[G.phase]}` : '';
  $('#me').innerHTML = `<div class="fh" style="--fc:${F.c}"><div><h3>${esc(F.n)}</h3><p>${esc(F.L)} · <span title="${esc(ABIL[F.ab][1])}">${ABIL[F.ab][0]}</span></p></div></div>
    <p class="ab">${esc(ABIL[F.ab][1])}</p>
    <div class="stab">Estabilidade ${bar(F.stab)}</div>
    <p class="hint">${F.stab < 15 ? 'Crise: reforços pela metade e risco alto de revolta.' : F.stab < 35 ? 'Instável: províncias podem se rebelar no início do turno.' : 'Povo sob controle.'}${F.ww >= 3 ? ` Cansaço de guerra ${F.ww}: −${Math.floor(F.ww / 5)} de estabilidade por turno.` : ''}</p>
    <p class="hint">Governo <b>${esc(GOV[gov(me)].n)}</b>${anar(me) ? ' (anarquia)' : ''} · cultura ${F.cu} 🎭 (+${cultureInc(me)})${facFaith(me) ? ' · fé ' + esc(G.faiths[facFaith(me)].n) : ''} <button class="mini" data-a="govm">Governo e fé</button> <button class="mini" data-a="figm">Personagens${(F.gf || []).length ? ' •' : ''}</button></p>
    <p class="hint" title="Luxos, templos, arenas, teatros e festas sobem; cidades grandes, cansaço de guerra e impostos descem. Abaixo de 0: −10% de ouro e saber; abaixo de −10: perde estabilidade.">Felicidade <b>${hap(me)}</b>${hap(me) < 0 ? ' · povo infeliz: −10% de ouro e saber' : hap(me) >= 6 ? ' · atrai migrantes de vizinhos infelizes' : ''}</p>
    <div class="obj"><b>Objetivo</b> ${esc(objText(F))}<ul>${objLines(me).map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✓' : '○'} ${esc(t)}</li>`).join('')}</ul></div>`;
  const inc = income(me), u = upkeepOf(me), net = inc.gold - u.b - u.t, rt = F.res && TK[F.res];
  $('#me').innerHTML += `<div class="res"><span title="Ouro: tropas, apressar obras e manutenção. Por turno: +${inc.gold} de renda, −${u.b} de construções, −${u.t} de soldo.">💰 <b>${F.gold}</b> <i>${net >= 0 ? '+' : ''}${net}</i></span><span title="Saber: vai para a pesquisa em andamento${rt ? ' (' + esc(tName(rt.k)) + ', ' + techCost(rt) + ')' : ''}">🔬 <b>${F.sci}</b> <i>+${inc.sci}</i></span><span title="Prestígio: influência política">⭐ <b>${F.pre}</b> <i>+${inc.pre}</i></span><span title="Legado: 2 por tecnologia, 1 por construção, 5 pela Maravilha. ${legWin()} vence a partir da rodada ${minWin()}.">🏛 <b>${legacy(me)}</b>/${legWin()}</span></div>
    <p class="hint">${rt ? `Pesquisando ${esc(tName(rt.k))} ${pbar(F.sci, techCost(rt, me))} ${F.sci}/${techCost(rt, me)}` : 'Nenhuma pesquisa escolhida: abra a árvore de tecnologias.'}</p>`;
  const forces = `<p class="forces">⚓ Frota: ${my ? F.navLeft : navOf(me)} travessia(s)${G.air ? ` · ✈ ${esc(G.air.n)}: ${my ? F.planes : planesOf(me)}` : ''}</p>`;
  let ph = '';
  if (G.over) ph = `<p>Partida encerrada.</p><button class="pri" data-a="menu">Novo jogo</button>`;
  else if (!my) ph = `<p class="hint">Aguardando ${esc(CF ? CF.n : '')}…</p>${forces}`;
  else if (G.phase === 'ref') {
    const ri = reinfOf(me);
    ph = `<h4>Reforços: <b class="big">${F.reinf}</b> tropas</h4><p class="hint">Clique nos seus territórios para posicionar 1 tropa por clique.</p>
      <p class="parts">${ri.parts.map(([n, v]) => `${esc(n)}${v ? ' +' + v : ''}`).join(' · ')}</p>
      <p class="parts">Produção deste turno: +${inc.gold} 💰 · +${inc.sci} 🔬 · +${inc.pre} ⭐</p>
      <div class="row"><button data-a="all" ${F.reinf ? '' : 'disabled'}>Tudo no selecionado</button></div>
      ${forces}<button class="pri wide" data-a="toAtk" ${F.reinf ? 'disabled' : ''}>Ir para as ações →</button>`;
  } else if (G.phase === 'atk') {
    const noPA = F.pa < 1, tc = troopCost(me);
    const Bt = (a, k, label, title, dis, on) => `<button class="ab2 ${on ? 'on' : ''}" data-a="${a}" data-k="${k}" title="${esc(title)}" ${dis ? 'disabled' : ''}>${label}</button>`;
    // parte 4: só aparecem as obras que cabem em algum território seu agora; o catálogo mostra o resto
    const avail = F.bldOn ? Object.keys(STRUCT).filter(k => owned(me).some(i => canQueue(me, k, i))) : [];
    const blds = avail.map(k => { const S = STRUCT[k], c = pCost(me, k); return Bt('bld', k, `${S.ic} ${esc(sName(k))} <small>${c}⚒${S.up ? ' · ' + S.up + '💰/t' : ''}</small>`, S.fx + (S.up ? ` Manutenção: ${S.up} ouro por turno.` : ''), false, G.mode === 'bld:' + k); }).join('') + `<button class="ab2" data-a="catalog">Catálogo (${Object.keys(STRUCT).length - avail.length} bloqueadas)</button>`;
    ph = `<h4>Ações <span class="pa" title="Pontos de ação">${'●'.repeat(F.pa)}${'○'.repeat(Math.max(0, paOf(me) - F.pa))}</span></h4>
      <p class="hint">Cada ação gasta 1 ponto. Guerra, obras, ciência e política disputam o mesmo turno.</p>
      <div class="grp"><b>⚔ Militar</b><div class="row">
        ${Bt('act', 'camp', F.camp ? 'Campanha declarada' : 'Declarar campanha', 'Libera ataques e aviação neste turno.' + (has(me, 'dou') ? ' Grátis pela sua doutrina.' : ''), F.camp || (noPA && !has(me, 'dou')), F.camp)}
        ${Bt('act', 'rec', F.recOn ? `Comprar tropas <small>${tc}💰</small>` : `Recrutar <small>${tc}💰/tropa</small>`, `Abre o recrutamento: compre tropas na capital ou num ${sName('qua')}. Elas chegam no início do próximo turno.`, !F.recOn && (noPA || F.gold < tc), G.mode === 'rec')}
<button class="ab2" data-a="merc" title="1 tropa já na capital, sem gastar ação (1 vez por turno)." ${F.merc === G.round || F.gold < 2 * tc || G.turnF !== me ? 'disabled' : ''}>Mercenários <small>${2 * tc}💰</small></button>
        ${F.camp && G.air && F.planes ? Bt('air', '', `✈ ${esc(G.air.n)} (${F.planes})`, 'Bombardeie um alvo ao alcance. Não gasta ação.', false, G.mode === 'air') : ''}</div></div>
      <div class="grp"><b>🏛 Obras</b> <span class="hint">fila de até ${qMax(me)} por território; a produção ⚒ de cada território avança a obra do topo. Uma de cada tipo por território. Zonas (🌾🐄🐟🪵⛏💰🔬⚔⭐⚓) ocupam vagas: aldeia 1, vila 2, cidade 3, metrópole 4. Mudam de dono na conquista.</span><div class="row">
        ${Bt('act', 'obras', F.bldOn ? 'Obras abertas' : 'Ordenar obras', '1 ação por turno: ponha, retire e apresse obras em todas as filas.', !F.bldOn && noPA, F.bldOn)}<button class="ab2" data-a="works">Obras do império</button></div>
        ${F.bldOn ? `<div class="row">${blds}</div>` : ''}</div>
      <div class="grp"><b>🔬 Ciência</b><div class="row"><button class="ab2" data-a="techs">Árvore de tecnologias <small>${F.sci}🔬</small></button></div></div>
      <div class="grp"><b>🤝 Sociedade</b><div class="row">
        ${Bt('act', 'fest', `Festividades <small>${ECON.fest}💰</small>`, '+15 de estabilidade e +4 de felicidade por 2 turnos. Gasta 5 de comida da capital.', noPA || F.gold < ECON.fest, false)}
        ${Bt('act', 'infl', 'Influenciar <small>⭐</small>', 'Anexe um território neutro ou rebelde vizinho sem lutar. Custa as tropas dele + 1 de prestígio.', noPA, G.mode === 'infl')}
        ${Bt('act', 'agit', `Agitadores <small>${ECON.agit}⭐</small>`, 'Uma facção rival perde 15 de estabilidade.', noPA || F.pre < ECON.agit, G.mode === 'agit')}
        ${Bt('act', 'colo', 'Colonos <small>3💰</small>', 'Uma cidade sua perde 1 nível e uma aldeia sua vizinha sobe 1 nível.', noPA || F.gold < 3 || !coloPair(me), false)}</div></div>
      <div class="grp"><b>💰 Economia</b><div class="row">
        ${Bt('act', 'tax', 'Impostos', `+${Math.ceil(owned(me).length / 2)} de ouro agora, −8 de estabilidade.`, noPA, false)}
        ${Bt('act', 'trade', F.tradeOn ? 'Câmbio aberto' : 'Câmbio', 'Troque recursos 2 por 1 (3 por 2 com a tecnologia de comércio) quantas vezes quiser no turno.', !F.tradeOn && noPA, F.tradeOn)}<button class="ab2" data-a="routes">Rotas ${myRoutes(me).length}/${routeMax(me)}</button></div></div>
      ${forces}<button class="pri wide" data-a="toMov">Remanejar →</button><button class="wide ghost" data-a="end">Encerrar turno</button>`;
  } else {
    const left = G.mv.reduce((s, v) => s + (v || 0), 0);
    ph = `<h4>Remanejamento</h4><p class="hint">Cada tropa sobrando anda uma vez para um território seu vizinho. Pode dividir entre vizinhos; 1 tropa fica sempre. Restam ${left} tropa(s) para mover.</p>${forces}<button class="pri wide" data-a="end">Encerrar turno</button>`;
  }
  $('#phase').innerHTML = ph;
  let inf = '';
  if (G.sel != null) {
    const i = G.sel, o = G.own[i], O = Fa(o), t = G.m.terr[i], co = capOwner(i);
    const rel = o === 'off' ? 'Fora do mundo conhecido nesta era' : o === me ? 'Seu' : !real(o) ? (o === 'reb' ? (G.rl[i] || 'Rebeldes') : 'Neutro') : allied(me, o) ? 'Aliado' : peace(me, o) ? 'Trégua' : 'Inimigo';
    inf = `<h4>${esc(t.n)}</h4><p><i class="dot" style="background:${O.c}"></i>${esc(o === 'reb' ? (G.rl[i] || 'Rebeldes') : O.n)} · <b>${G.tr[i]}</b> tropas · ${rel}</p>
      <p class="hint">${esc(G.m.regions[t.r])}${co ? ' · capital de ' + esc(fname(co)) : ''}${G.relics.includes(i) ? ' · Runa Antiga' : ''}${G.bld[i].length ? ' · ' + G.bld[i].map(k => esc(sName(k)) + (nb(i, k) ? '' : ' (desativada: sem ouro)')).join(', ') : ''}${G.fort[i] > 0 ? ' · fortificado' : ''}${occupied(i) ? ` · ocupado por mais ${G.occ[i]} turno(s): não conta para renda e reforços, produção pela metade` : ''}${o === me && lowSupply(i) ? ' · longe do suprimento: ataca com 1 dado a menos' : ''}${G.phase === 'mov' && my && o === me ? ` · pode mover ${G.mv[i] || 0}` : ''}${o === me && F.recQ[i] ? ` · +${F.recQ[i]} recruta(s) chegando` : ''}</p>`;
    if (my && o === me) inf += `<p class="hint">Governador: ${govrAt(i) ? GOVR[govrAt(i)][0] : 'nenhum'} (${govrN(me)}/${govrMax(me)}) ${Object.entries(GOVR).map(([k, g]) => `<button class="mini" data-a="gvr" data-i="${i}" data-k="${k}" title="${esc(g[1])}" ${govrAt(i) === k ? 'disabled' : ''}>${g[0]}</button>`).join(' ')}</p>`;
    if (my && real(o) && o !== me && has(me, 'esc')) inf += `<p class="hint">Espião (1 ação, 3💰): ${Object.entries(SPY).map(([k, s]) => `<button class="mini" data-a="spy" data-i="${i}" data-k="${k}" title="${esc(s.fx)} · risco ${s.r}+${spyDef(i)} no dado" ${Fa(me).pa > 0 && Fa(me).gold >= 3 ? '' : 'disabled'}>${s.n}</button>`).join(' ')}</p>`;
    if (csOf(i)) { const c = G.cs[i], s = suz(i); inf += `<p class="hint">Cidade-estado ${CS[c.t][0]} (${CS[c.t][1]} ao suserano) · suserano ${s ? esc(fname(s)) : 'nenhum'} · sua influência ${c.inf[me] || 0} · missão: ${MIS[c.mis]}</p>${my ? `<button class="mini" data-a="env" data-i="${i}" ${Fa(me).pa > 0 && Fa(me).gold >= 2 ? '' : 'disabled'}>Enviado (1 ação, 2💰)</button>` : ''}`; }
    if (o !== 'off') {
      const T = TERR[G.ter[i]], isl = G.A[i].length && G.A[i].every(j => isSea(i, j)), wk = worked(i);
      inf += `<p class="hint">${T.ic} ${T.n}${G.riv[i] ? ' · rio' : ''}${coastal(i) ? ' · litoral' : ''}${isl ? ' · ilha' : ''} · <b>${LEVEL[G.lv[i]].n}</b>${real(o) ? ` · zonas ${zonesAt(i).length}/${G.lv[i]}` : ''}${o === me ? (n => n.core.has(i) ? ' · na rede' : n.linked.has(i) ? ' · ligado por trilha' : ' · fora da rede de bens')(netOf(me)) : ''}${road(i) ? ' · ' + sName(road(i) > 1 ? 'pav' : 'est').toLowerCase() : ''}</p>
        <p class="hint">Jazidas: ${G.dep[i].length ? G.dep[i].map(d => DEP[d].ic + ' ' + esc(DEP[d].n) + (wk.includes(d) ? ' ✓' : '')).join(', ') : 'nenhuma conhecida'}${G.dep[i].length > wk.length && real(o) ? ' (✓ = explorada; as outras pedem a zona certa)' : ''}</p>`;
      if (real(o)) { const cd = capDist(o)[i], ts = tStab(i, cd), hs = health(i); inf += `<p class="hint">Saúde ${hs}${hs < 0 ? ' (risco de epidemia)' : ''} · estabilidade local ${ts}${ts < 10 ? ' (pode se separar)' : ts < 30 ? ' (rende metade)' : ''} · corrupção ${Math.round(100 * corrupt(i, cd))}% · cultura ${G.cul[i] === o ? 'própria' : esc(fname(G.cul[i]) || 'local') + ` (assimila ${G.asm[i]}/8)`}</p>`; }
      if (real(o)) { const y = yieldOf(i); inf += `<p class="hint">Rende 🍞 ${y.food} (consome ${foodUse(i)}${G.lv[i] < 4 ? `, estoque ${G.food[i]}/${growNeed(i)}${growOk(i) ? '' : ' · para crescer: ' + LEVEL[G.lv[i]].req.map(sName).join(' ou ')}` : ''}) · ⚒ ${prodOf(i)} · 💰 ${y.gold} · 🔬 ${y.sci}</p>`; }
    }
    if (o === me) inf += qHtml(i);
  }
  $('#info').innerHTML = inf || '<p class="hint">Clique num território para ver detalhes. Arraste para mover o mapa, role ou use + e − para zoom.</p>';
  $('#cards').innerHTML = `<h4>Cartas <span class="hint">${F.cards.length}/5 · ganhe uma por turno em que conquistar · usar não gasta ação</span></h4>` + (F.cards.length ? F.cards.map((c, h) => `<button class="card ${G.card && G.card.h === h ? 'on' : ''}" data-a="card" data-h="${h}" ${my ? '' : 'disabled'}><b>${esc(cardName(c))}</b><span>${esc(cardFx(c))}</span></button>`).join('') : '<p class="hint">Nenhuma carta.</p>');
  $('#tech').innerHTML = `<h4>Tecnologia · ${esc(G.era.n)}</h4><p class="hint">Pesquisadas: ${F.tech.length ? F.tech.map(k => esc(tName(k))).join(', ') : 'nenhuma'}</p><ul>${G.era.tech.map(t => `<li>${esc(t)}</li>`).join('')}${G.sc.air ? `<li>${esc(G.sc.air.n)}: alcance ${G.sc.air.r}, acertam com ${G.sc.air.hit}+.</li>` : ''}</ul>`;
  $('#facs').innerHTML = `<h4>Facções <button class="mini" data-a="dipl">Diplomacia${G.offers.length || (G.dem && G.dem.to === me) ? ' •' : ''}</button></h4>` + G.order.filter(f => Fa(f).entered || Fa(f).late).map(f => {
    const X = Fa(f), alive = X.alive && X.entered;
    const rel = f === me ? 'você' : !X.entered ? 'ainda neutro' : !alive ? 'eliminado' : allied(me, f) ? 'aliado' : peace(me, f) ? 'trégua' : 'guerra';
    let act = '';
    if (my && alive && f !== me && !allied(me, f)) {
      if (G.truce.has(tk(me, f))) act = G.confirmBrk === f ? `<button class="mini bad" data-a="dok" data-f="${f}">Confirmar (−15)</button><button class="mini" data-a="dno">Não</button>` : `<button class="mini" data-a="dbrk" data-f="${f}">Romper</button><button class="mini" data-a="demb" data-f="${f}" title="T-18: corta e proíbe as rotas comerciais com esta facção">${G.emb.has(tk(me, f)) ? 'Suspender embargo' : 'Embargo'}</button>`;
      else act = (G.cool[f] || 0) > G.round ? '<span class="hint">aguarde</span>' : `<button class="mini" data-a="dpro" data-f="${f}">Propor trégua</button>`;
    }
    return `<div class="fr ${alive ? '' : 'dead'}"><i class="dot" style="background:${X.c}"></i><div class="fn"><b>${esc(X.n)}</b><span>${esc(X.L)} · ${owned(f).length} terr. · ${power(f)} tropas · ${X.cards.length} cartas · estab. ${Math.round(X.stab)}</span></div><span class="rel ${rel}">${rel}</span>${act}</div>`;
  }).join('');
  $('#log').innerHTML = G.log.slice(0, 40).map(([f, t, r]) => `<li><i class="dot" style="background:${f ? Fa(f).c : 'var(--brass)'}"></i><span>${esc(t)}</span><em>${r}</em></li>`).join('');
}
let toastT;
function toast(t) { const e = $('#toast'); e.textContent = t; e.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => e.hidden = true, 2600); }
function modal(html, btns) {
  return new Promise(res => {
    const m = $('#modal'); m.hidden = false;
    m.querySelector('.mbox').innerHTML = html + '<div class="row end">' + btns.map((b, k) => `<button class="${k ? '' : 'pri'}" data-m="${k}">${esc(b[0])}</button>`).join('') + '</div>';
    m.querySelectorAll('[data-m]').forEach(el => el.onclick = () => { m.hidden = true; const f = btns[+el.dataset.m][1]; res(); f && f(); });
  });
}
function rules() {
  modal(`<h2>Como jogar</h2>
  <p><b>Duração.</b> Partida curta (60 rodadas), média (120) ou longa (250). Quanto mais longa, mais caras ficam obras e tecnologias e mais turnos o objetivo precisa ser mantido. Os eventos históricos se espalham pela primeira metade da partida.</p>
  <p><b>Três caminhos para vencer.</b> Cumpra o objetivo militar da sua facção e mantenha-o por vários turnos seguidos (2, 3 ou 4, conforme a duração), chegue aos pontos de legado da duração escolhida (ciência, obras e cultura) ou elimine os rivais. Objetivo e legado só valem a partir de 1/3 da partida; a dominação vale sempre. Se as rodadas acabarem, vence quem mais cresceu: territórios ganhos, +2 por capital, +2 por alvo do objetivo e o legado.</p>
  <p><b>Recursos.</b> No início do turno você recebe 💰 ouro e 🔬 saber somados de cada território (terreno, rio, nível, zonas e jazidas) e ⭐ prestígio (capitais, templos, maravilha). Eles se acumulam de um turno para o outro. Depois paga a manutenção: soldo das tropas (acima de ${ECON.freeT} por território, 1 ouro a cada ${ECON.perT}; sem ouro, elas desertam) e das construções (sem ouro, a mais cara fica desativada no turno).</p>
  <p><b>Obras em turnos.</b> Cada território tem produção ⚒ (terreno, +2 na capital, oficina, zonas e jazidas) e uma fila de até 3 obras (5 com a tecnologia de administração). A produção avança a obra do topo a cada turno, e o excesso passa à seguinte. Não há limite de construções por território, só uma de cada tipo. Com as obras abertas dá para apressar com ouro (2 por ponto que falta, 3 na maravilha), mas não no turno em que a obra começou. Quem conquista fica com as construções e com metade do progresso das obras; maravilha em andamento se perde.</p>
  <p><b>Pesquisa em turnos.</b> Escolha uma tecnologia na árvore (não gasta ação). O saber acumulado vai para ela, e ela fica pronta no início do turno em que o custo for atingido.</p>
  <p><b>Terra e povo.</b> Cada território tem terreno (lente Terreno), talvez rio e litoral, e jazidas (lente Recursos). A comida que sobra enche o estoque e faz o território crescer: aldeia, vila (exige estoque), cidade (exige também aqueduto) e metrópole (exige saneamento). Cada nível consome mais comida; com fome, o território encolhe. Conquistado, perde um nível. O nível dá ouro, saber, reforços (+1 ação a cada 3 cidades) e vagas de zona: aldeia 1, vila 2, cidade 3, metrópole 4. Zonas de recurso (agrícola, pecuária, pesqueira, florestal, mineração) exigem o terreno certo e exploram as jazidas do território; vizinhos seus com a mesma zona formam polo (+1 cada, até +3). Cada tipo de luxo explorado dá +1 de estabilidade por turno (até +4); pedra e madeira barateiam obras.</p>
  <p><b>Catálogo de construções.</b> Cada zona abre a sua cadeia: lavouras → fazenda → celeiro; minas → mina, pedreira, fundição; mercado → banco → bolsa; biblioteca → academia → universidade; templo → mosteiro e grande templo; muralha → castelo. Algumas pedem bens explorados em qualquer território seu (sal, ferro e madeira, pedra). As maravilhas do mundo são únicas: quem termina primeiro fica com ela. O botão Catálogo, nas obras, mostra tudo e o que falta.</p>
  <p><b>Estradas e rede de bens.</b> Os bens (sal, ferro, pedra, luxos…) só valem para o império quando o território que os explora está na rede: a capital, os territórios seus ligados a ela por estrada (os dois lados com estrada) e os portos seus, que se ligam entre si. Uma trilha liga ainda os vizinhos de quem está na rede. Perder um território de passagem corta a rede. Na rede não falta suprimento. No remanejamento, pela estrada as tropas andam até 2 territórios (3 com estrada pavimentada), e de um porto seu vão a qualquer outro porto seu. Estrada em montanha e pântano custa o dobro; em deserto, 50% a mais. Veja a lente Rede.</p>
  <p><b>Comércio.</b> O botão Rotas (em Economia) abre o painel de comércio. Abrir uma rota custa 1 ação e ${ECON.route} ouro, e ela começa a render no turno seguinte; você abre 1 rota por mercado, porto e banco. Rota interna (mercado nas duas pontas) dá +1 produção no destino e põe os bens dele na rede. Caravana (caravançará até um mercado alheio a 4 territórios) dá +2 ouro a cada lado e traz 1 bem que lhe falta; rota marítima (porto com armazém até um porto alheio) dá +3 a cada lado e traz 2 bens, mas sem frota (2 travessias) os piratas a atacam às vezes. Rota com quem tem uma tecnologia que você não tem barateia essa pesquisa em 20%. Guerra, embargo ou perda da ponta desfazem a rota, e quem toma a ponta de uma rota alheia pilha o ouro de 2 turnos.</p>
  <p><b>Freios da guerra.</b> Território conquistado fica ocupado por ${ECON.occ} turnos: não conta para renda e reforços, produz metade e é o primeiro a se revoltar. Cada turno em campanha soma cansaço de guerra, que come a estabilidade; turnos de paz e festividades o reduzem. Atacar de um território a mais de ${ECON.sup} passos da capital, de um quartel ou de um porto custa 1 dado.</p>
  <p><b>1. Reforços.</b> Tropas grátis: a soma dos níveis dos territórios não ocupados ÷ 3 (mínimo 3), +1 com ferro e +1 com cavalos explorados, mais regiões completas, capitais e quartéis.</p>
  <p><b>2. Ações.</b> Você tem 3 pontos de ação por turno (4 com a primeira tecnologia de administração). Cada ação gasta 1 ponto e pode ser repetida:</p>
  <ul>
  <li><b>⚔ Campanha</b> libera os ataques e a aviação no turno. Sem campanha, não há guerra.</li>
  <li><b>⚔ Recrutar</b> abre a compra de tropas por ouro, na capital ou num quartel. Elas chegam no início do próximo turno.</li>
  <li><b>🏛 Ordenar obras</b> abre todas as filas por um turno: ponha, retire e apresse obras em quantos territórios quiser. Oficina, mercado, academia, quartel, fortificação, templo, porto, aeródromo e a sua Maravilha.</li>
  <li><b>🤝 Festividades</b> (+15 de estabilidade), <b>Influenciar</b> (anexa um vizinho neutro ou rebelde com prestígio, sem lutar) e <b>Agitadores</b> (rival perde estabilidade).</li>
  <li><b>💰 Impostos</b> (ouro agora, estabilidade cai) e <b>Comércio</b> (troque recursos 2 por 1).</li>
  </ul>
  <p><b>Combate.</b> Como nos jogos clássicos de conquista: ataque e defesa rolam até 3 dados, compara-se do maior para o menor e o empate fica com a defesa. Ao vencer, você move até o número de dados da última rolagem. Fortificações, capitais, colinas, montanhas e florestas com 3+ tropas somam +1 ao maior dado da defesa; em montanha o empate é sempre da defesa, e quem ataca um pântano usa 1 dado a menos. Cada facção conquista no máximo 1 território por turno (2 com a doutrina militar).</p>
  <p><b>Mar e ar.</b> Atravessar uma linha tracejada gasta uma travessia da frota; o desembarque usa no máximo 2 dados, ou 3 saindo de um porto. Nas eras com aviação, cada capital e aeródromo dá uma unidade aérea que bombardeia durante a campanha: o antiaéreo pode derrubá-la, e ela não conquista.</p>
  <p><b>3. Remanejamento.</b> Cada tropa sobrando anda uma vez para um território seu vizinho. Pode dividir entre vizinhos, e 1 tropa fica sempre.</p>
  <p><b>Cartas de benefício.</b> Você ganha uma por turno em que conquistar. Usar uma carta não gasta ação.</p>
  <p><b>Estabilidade.</b> Perder territórios, romper tréguas e cobrar impostos derrubam a estabilidade. Abaixo de 35, províncias podem se rebelar; abaixo de 15, os reforços caem pela metade.</p>`, [['Entendi']]);
}

// ---------- tela inicial ----------
let pickSc = null, pickF = null, pickD = 1, pickL = 'c';
function thumb(sc) {
  const m = MAPS[sc.map], own = {};
  sc.f.forEach(f => expand(m, f.t).forEach(n => own[n] = f.c));
  (sc.rebels || []).forEach(([n]) => own[n] = REB.c);
  expand(m, sc.off || []).forEach(n => own[n] = OFF.c);
  return `<svg viewBox="0 0 ${m.w} ${m.h}" class="th"><rect x="-500" y="-500" width="${m.w + 1000}" height="${m.h + 1000}" fill="var(--sea)"/>${m.bg ? `<path d="${m.bg}" fill="#2a313b"/>` : ''}${m.terr.map(t => `<path d="${t.d}" fill="${own[t.n] || NEU.c}"/>`).join('')}</svg>`;
}
const GROUPS = ['Todos', 'Antiguidade', 'Idade Média', 'Moderna', 'Fantasia'];
function showSetup() {
  if (G) G.over = true; G = null; $('#game').hidden = true; $('#setup').hidden = false; $('#modal').hidden = true;
  const tab = $('#setup').dataset.tab || 'Todos', s = loadSave(), ssc = s && SCEN.find(x => x.id === s.sc);
  const slots = [1, 2, 3].map(n => [n, loadSave(SLOT(n))]).filter(([, x]) => x && x.v === 5 && SCEN.find(c => c.id === x.sc));
  $('#resume').innerHTML = `<div class="row">${ssc && s.v === 5 ? `<button class="pri" data-a="resume">Continuar partida: ${esc(ssc.n)} · rodada ${s.round}</button>` : ''}${slots.map(([n, x]) => `<button data-a="resume" data-n="${n}">Espaço ${n}: ${esc(SCEN.find(c => c.id === x.sc).n)} · rodada ${x.round}</button>`).join('')}<label class="ab2 file">Importar partida<input type="file" id="imp" accept=".json,application/json" hidden></label></div>`;
  $('#tabs').innerHTML = GROUPS.map(t => `<button class="${t === tab ? 'on' : ''}" data-a="tab" data-t="${t}">${t}</button>`).join('');
  $('#scs').innerHTML = SCEN.slice().sort((a, b) => a.yr - b.yr).filter(s => tab === 'Todos' || ERA[s.tech].g === tab).map(s => `<button class="sc ${pickSc === s.id ? 'on' : ''}" data-a="sc" data-s="${s.id}">${thumb(s)}<div><span class="era ${s.tech === 'fan' ? 'fan' : ''}">${ERA[s.tech].n} · ${esc(s.y)}</span><h3>${esc(s.n)}</h3><p>${esc(s.d)}</p><small>${s.f.length} facções · ${MAPS[s.map].terr.length} territórios${airOf(s) ? ' · ' + airOf(s).n : ''}</small></div></button>`).join('');
  const sc = SCEN.find(s => s.id === pickSc);
  $('#pick').hidden = !sc;
  if (sc) {
    if (!sc.f.some(f => f.id === pickF && !f.late)) pickF = sc.f[0].id;
    $('#pickT').textContent = sc.n;
    $('#pickTech').innerHTML = `<b>${esc(ERA[sc.tech].n)}:</b> ${ERA[sc.tech].tech.map(esc).join(' ')}`;
    $('#facsPick').innerHTML = sc.f.filter(f => !f.late).map(f => { const F = { ...f, obj: objOf(f, MAPS[sc.map], (sc.relics || []).map(n => idxOf(MAPS[sc.map])[n])) }; return `<button class="fp ${pickF === f.id ? 'on' : ''}" data-a="fp" data-f="${f.id}" style="--fc:${f.c}"><b>${esc(f.n)}</b><span>${esc(f.L)} · ${ABIL[f.ab][0]}</span><em>${esc(ABIL[f.ab][1])}</em><small>${esc(objText(F))}</small><small>${expand(MAPS[sc.map], f.t).length} territórios · estabilidade ${f.st} · frota ${f.nav || 1}${f.team ? ' · aliança' : ''}</small></button>`; }).join('');
    $('#diff').innerHTML = ['Fácil', 'Normal', 'Difícil'].map((t, k) => `<button class="${pickD === k ? 'on' : ''}" data-a="diff" data-d="${k}">${t}</button>`).join('');
    $('#len').innerHTML = Object.entries(LEN).map(([k, L]) => `<button class="${pickL === k ? 'on' : ''}" data-a="len" data-l="${k}" title="Obras e tecnologias custam ×${L.k}; objetivo mantido por ${L.hold} turnos; ${L.leg} de legado vence.">${L.n} · ${L.r} rodadas</button>`).join('');
  }
}
function startScenario(id, fid, diff, quiet, len) {
  const sc = SCEN.find(s => s.id === id);
  G = newGame(sc, fid, diff, len);
  $('#setup').hidden = true; $('#game').hidden = false; bt().hidden = true; $('#toast').hidden = true;
  $('#scT').textContent = `${sc.n} · ${sc.y}`;
  $('#credit').textContent = MAPS[sc.map].credit;
  buildMap(); render();
  if (quiet) return;
  const F = Fa(fid);
  modal(`<p class="kick">${esc(ERA[sc.tech].n)} · ${esc(sc.y)}</p><h2>${esc(sc.n)}</h2><p>${esc(sc.d)}</p><p>Você comanda <b style="color:${F.c}">${esc(F.n)}</b>, liderado por ${esc(F.L)} (${ABIL[F.ab][0]}: ${esc(ABIL[F.ab][1])}).</p><p><b>Objetivo:</b> ${esc(objText(F))}</p><p class="hint">Partida ${G.len.n.toLowerCase()}: ${G.rounds} rodadas. Cada turno: reforços, depois ${ECON.pa} ações para dividir entre guerra, obras, sociedade e economia, e por fim o remanejamento. As obras e a pesquisa andam sozinhas de um turno para o outro. Também dá para vencer por legado: ${legWin()} pontos em tecnologias e construções. Objetivo e legado só valem a partir da rodada ${minWin()}.</p>`, [['Começar', () => loop()], ['Como jogar', () => { rules(); loop(); }]]);
}

// ---------- cliques ----------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const a = el.dataset.a;
  if (a === 'tab') { $('#setup').dataset.tab = el.dataset.t; showSetup(); }
  else if (a === 'sc') { pickSc = el.dataset.s; showSetup(); $('#pick').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else if (a === 'fp') { pickF = el.dataset.f; showSetup(); }
  else if (a === 'diff') { pickD = +el.dataset.d; showSetup(); }
  else if (a === 'len') { pickL = el.dataset.l; showSetup(); }
  else if (a === 'start') startScenario(pickSc, pickF, pickD, false, pickL);
  else if (a === 'resume') resume(el.dataset.n ? SLOT(el.dataset.n) : SAVE);
  else if (a === 'rules') rules();
  else if (a === 'menu') { if (G && !G.over) modal('<h2>Sair da partida?</h2><p>A partida fica salva do início do seu último turno.</p>', [['Sair', showSetup], ['Continuar jogando']]); else showSetup(); }
  else if (!G) return;
  else if (a === 'catalog') catalogModal();
  else if (a === 'routes') routesModal();
  else if (a === 'merc') { const e = act(G.player, 'merc'); toast(e || 'Mercenários na capital.'); render(); }
  else if (a === 'route') { const e = act(G.player, 'rota', +el.dataset.i, +el.dataset.j); toast(e || 'Rota aberta: começa a render no próximo turno.'); render(); routesModal(); }
  else if (a === 'demb') { const o = el.dataset.f, k = tk(G.player, o); if (G.emb.has(k)) G.emb.delete(k); else { G.emb.add(k); checkRoutes(); log(G.player, `Você declara embargo a ${fname(o)}.`); } render(); }
  else if (a === 'lens') { G.lens = el.dataset.l; renderMap(); }
  else if (a === 'zin') zoomBtn(1 / 1.4); else if (a === 'zout') zoomBtn(1.4); else if (a === 'zfit') { vb = { x: 0, y: 0, w: G.m.w, h: G.m.h }; setVB(); }
  else if (a === 'toAtk') toPhase('atk'); else if (a === 'toMov') toPhase('mov'); else if (a === 'end') playerEnd();
  else if (a === 'all') addAll();
  else if (a === 'act') playerAct(el.dataset.k);
  else if (a === 'bld') playerAct('bld', el.dataset.k);
  else if (a === 'techs') techModal();
  else if (a === 'works') worksModal();
  else if (a === 'rush' || a === 'unq') { const e = act(G.player, a, +el.dataset.i, +el.dataset.n); if (e) toast(e); render(); if (!$('#modal').hidden) worksModal(); }
  else if (a === 'save') saveModal();
  else if (a === 'slot') { try { localStorage.setItem(SLOT(el.dataset.n), G.snap || snapshot()); toast('Partida salva no espaço ' + el.dataset.n + '.'); } catch (e) { toast('Não foi possível salvar neste navegador.'); } saveModal(); }
  else if (a === 'export') exportSave();
  else if (a === 'tech') { const e = act(G.player, 'res', el.dataset.k); if (e) toast(e); render(); techModal(); }
  else if (a === 'trd') { tradeRes(G.player, el.dataset.x, el.dataset.y); render(); tradeModal(); }
  else if (a === 'air') { G.mode = G.mode === 'air' ? null : 'air'; G.card = null; if (G.mode) toast('Clique num alvo destacado ao alcance.'); render(); }
  else if (a === 'card') useCard(+el.dataset.h);
  else if (a === 'roll1') doRoll(false); else if (a === 'blitz') doRoll(true);
  else if (a === 'bclose') { hideBattle(); render(); }
  else if (a === 'govm') govModal();
  else if (a === 'figm') figModal();
  else if (a === 'fig') { const e = useFig(G.player, +el.dataset.n); if (e) toast(e); render(); figModal(); }
  else if (a === 'gvr') { const e = placeGovr(G.player, +el.dataset.i, el.dataset.k); toast(e || 'Governador nomeado.'); render(); }
  else if (a === 'spy') { if (G.turnF !== G.player) return; const e = spy(G.player, +el.dataset.i, el.dataset.k); toast(e); render(); }
  else if (a === 'gv') { if (G.turnF !== G.player) return; const e = govAct(G.player, el.dataset.o, el.dataset.k, el.dataset.y); if (e) toast(e); render(); govModal(); }
  else if (a === 'occupy') occupy(); else if (a === 'move') doMove();
  else if (a === 'dipl') diploModal();
  else if (a === 'dprop') { const e = propose(G.player, el.dataset.f, el.dataset.k, +el.dataset.r); toast(e || 'Proposta aceita.'); render(); diploModal(); }
  else if (a === 'doff') { const x = G.offers.splice(+el.dataset.n, 1)[0]; if (x) { if (x.k === 'truce') { G.truce.add(tk(G.player, x.f)); log(G.player, `Você aceita a trégua de ${fname(x.f)}.`); } else sign(G.player, x.f, x.k); } render(); diploModal(); }
  else if (a === 'ddem') { const d = G.dem; if (d && Fa(G.player).gold >= d.g) { Fa(G.player).gold -= d.g; Fa(d.f).gold += d.g; remember(d.f, G.player, 'pagou nosso tributo', 10); remember(G.player, d.f, 'nos cobrou tributo', -15); log(G.player, `Você paga ${d.g} ouro de tributo a ${fname(d.f)}.`); G.dem = null; } render(); diploModal(); }
  else if (a === 'env') { const e = envoy(G.player, +el.dataset.i); toast(e || 'Enviado recebido.'); render(); }
  else if (a === 'dpro') dipl(el.dataset.f, 'pro'); else if (a === 'dbrk') dipl(el.dataset.f, 'brk'); else if (a === 'dok') dipl(el.dataset.f, 'ok'); else if (a === 'dno') dipl(null, 'no');
});
document.addEventListener('input', e => { if (e.target.id === 'mvR') $('#mvN').textContent = e.target.value; });
document.addEventListener('change', e => { if (e.target.id === 'fast' && G) G.fast = e.target.checked; if (e.target.id === 'imp' && e.target.files[0]) importSave(e.target.files[0]); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && G && !G.busy && !G.pend) { hideBattle(); G.sel = null; G.card = null; G.mode = null; render(); } });

initPan(); showSetup();
window.__sob = { get G() { return G; }, startScenario, loop, SCEN, resume, render, act, STRUCT };
