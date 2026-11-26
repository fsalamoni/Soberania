// Soberania v6: motor do jogo (guerra de conquista + governo com ações, terreno, zonas e povoamento), IA e interface.
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// UI (WCAG AA): clareia a cor da facção até ter contraste 4,5:1 sobre o painel escuro
const lc = c => { const n = parseInt(String(c).replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3').slice(0, 6), 16); if (isNaN(n)) return c; let rgb = [n >> 16, (n >> 8) & 255, n & 255]; const L = a => a.map(v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0); for (let k = 0; k < 10 && (L(rgb) + .05) / .065 < 4.5; k++) rgb = rgb.map(v => Math.round(v + (255 - v) * .2)); return `rgb(${rgb.join(',')})`; };
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
  const g = { sc, m, ix, N, player, diff, lenK: LEN[len] ? len : 'c', len: L, rounds: L.r, era: eraOf(sc), air: airOf(sc), own: Array(N).fill('neu'), tr: Array(N).fill(sc.neu ?? 2), fort: Array(N).fill(0), bld: Array.from({ length: N }, () => []), q: Array.from({ length: N }, () => []), occ: Array(N).fill(0), dis: new Set(), rl: [], mv: [], arr: [], win: Array(N).fill(0), dug: Array(N).fill(0), acted: new Set(), F: { neu: NEU, reb: REB, off: OFF }, order: [], cur: 0, round: 1, phase: 'ref', truce: new Set(), cool: {}, log: [], trades: 0, seaUsed: new Set(), sel: null, tgt: null, over: false, fast: false, auto: false };
  g.A = Array.from({ length: N }, () => []);
  for (const [a, b] of m.adj) { g.A[a].push(b); g.A[b].push(a); }
  g.seaK = new Set(m.sea.map(([a, b]) => a * 1e4 + b).concat(m.sea.map(([a, b]) => b * 1e4 + a)));
  g.regT = m.regions.map((_, r) => m.terr.map((t, i) => t.r === r ? i : -1).filter(i => i >= 0));
  for (const [n, v] of Object.entries(sc.neuT || {})) g.tr[need(n)] = v;
  expand(m, sc.off || []).forEach(n => { const i = need(n); g.own[i] = 'off'; g.tr[i] = 0; });
  g.relics = (sc.relics || []).map(need);
  g.ruin = new Set((sc.ruins || []).map(need)); g.nat = new Set((sc.nat || []).map(need)); // MC-07, MC-15
  // parte 3: terreno, rio e jazidas (src/geo.js); jazidas de eras futuras ficam escondidas
  const geo = GEO[sc.map] || {}, elv = ERA_LV[sc.tech] ?? 1;
  g.ter = []; g.riv = []; g.dep = [];
  m.terr.forEach((t, i) => { const [a, b] = (geo[t.n] || 'p').split(' '); g.ter[i] = a[0]; g.riv[i] = a.includes('r'); g.dep[i] = (b || '').split(',').filter(d => d && (DEP[d].era || 0) <= elv); });
  g.lv = Array(N).fill(1); g.food = Array(N).fill(0);
  g.routes = []; g.emb = new Set(); // parte 6
  g.fai = Array(N).fill(null); g.faiths = {}; // parte 10
  g.gvr = {}; g.gfc = {}; g.genA = {}; g.evq = []; // parte 11
  g.corp = []; g.cong = { on: false, res: [], pv: {} }; g.banMis = 0; g.polLim = 0; // parte 12
  g.pacts = []; g.ally = new Set(); g.mem = {}; g.cb = new Set(); g.truceT = {}; g.offers = []; g.dem = null; g.cs = {}; // parte 9
  for (const d of sc.f) {
    const F = { ...d, real: true, stab: d.st, cards: [], alive: true, entered: !d.late, capI: need(d.cap), passive: !!d.passive, reinf: 0, conq: false, ofs: false, airX: 0, planes: 0, navLeft: 0, nav: d.nav || 1, gold: 3, sci: 0, pre: 2, tech: [], pa: 0, camp: false, recOn: false, tradeOn: false, bldOn: false, res: null, ww: 0, hold: 0, recQ: {}, upk: 0, nB: 0, cq: 0 };
    F.obj = objOf(d, m, g.relics);
    // parte 7: começa sabendo as tecnologias das eras anteriores (sem doutrinas) e as básicas da Antiguidade
    F.tech = TECH.filter(t => !t.doc && (t.e < (KNOW[sc.tech] ?? Math.min(3, elv)) || (t.e === 0 && !t.req.length))).map(t => t.k); F.tech0 = F.tech.length;
    F.civ = CIVIC.filter(c => c.e < Math.min(3, elv) || !c.cost).map(c => c.k); F.gov = Object.keys(GOV).filter(k => F.civ.includes(GOV[k].c)).pop(); F.pol = []; F.cu = 0; // parte 10
    if (F.obj.hold) F.obj.hold.forEach(need);
    expand(m, d.t).forEach(n => { const i = need(n); g.own[i] = d.id; g.tr[i] = d.tr || 3; });
    for (const [n, v] of Object.entries(d.trT || {})) g.tr[need(n)] = v;
    expand(m, d.t).forEach(n => g.lv[need(n)] = elv >= 3 ? 2 : 1); g.lv[F.capI] = elv >= 3 ? 4 : 3;
    if (d.t.length) g.tr[F.capI] = Math.max(g.tr[F.capI], d.ctr || (d.tr || 3) + 2);
    g.F[d.id] = F; g.order.push(d.id);
  }
  for (const [n, v, l] of sc.rebels || []) { const i = need(n); g.own[i] = 'reb'; g.tr[i] = v; g.rl[i] = l; }
  g.own.forEach((o, i) => { if (!sc.civ && o === 'neu' && i % 3 === 0) g.cs[i] = { t: Object.keys(CS)[i % 6], inf: {}, mis: Object.keys(MIS)[i % 3] }; }); // DP-30
  g.cul = [...g.own]; g.asm = Array(N).fill(0); // S-14, S-22: cultura de cada território
  for (const [a, b] of sc.truces || []) g.truce.add(tk(a, b));
  for (const e of sc.ev) for (const [op, a] of e.fx) {
    if (op === 'rebels' || op === 'place' || op === 'troops') need(a); else if (op === 'give') a.forEach(need); else if (op === 'attrit') expand(m, [].concat(a)).forEach(need);
    else if (a !== '*' && !g.F[a]) throw Error(sc.id + ': facção desconhecida ' + a);
  }
  const G0 = G; G = g; g.order.forEach(f => g.F[f].t0 = g.own.filter(o => o === f).length); if (sc.civ) civInit(); recolor(g.order.map(f => g.F[f])); G = G0;
  return g;
}
const tk = (a, b) => a < b ? a + '|' + b : b + '|' + a;
// paleta com todas as cores bem distantes entre si (testada); a facção fica com a mais próxima da cor original ainda livre
const PAL = ['#d64541', '#3d6fd6', '#e3c13b', '#3aa65a', '#9156c8', '#e67e22', '#2bb3b1', '#e8e2cf', '#6b7380', '#e06fb8', '#8b5a2b', '#76c7f0'];
const rgbOf = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
function colDist(a, b) { const [r1, g1, b1] = rgbOf(a), [r2, g2, b2] = rgbOf(b), rm = (r1 + r2) / 2; return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2); }
function recolor(L) {
  if (L.length > PAL.length) return; const free = [...PAL];
  for (const x of L) { if (!x.c0) x.c0 = x.c; const k = free.reduce((b, c, n) => colDist(c, x.c0) < colDist(free[b], x.c0) ? n : b, 0); x.c = free.splice(k, 1)[0]; }
}
SCEN.forEach(s => s.f && recolor(s.f));
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
const cqMax = f => Infinity; // v24: ataques ilimitados enquanto houver tropas (escolha do Flavio)
const canAtk = (f, i, j, probe) => (probe || Fa(f).camp) && (!real(f) || Fa(f).cq < cqMax(f)) && G.own[i] === f && G.tr[i] > 1 && G.A[i].includes(j) && hostile(f, j) && seaOk(f, i, j) && !(G.round === 1 && real(G.own[j]) && Fa(G.own[j]).capI === j); // capitais protegidas na 1ª rodada
// conjunto refeito quando a lista de tecnologias muda (push ou troca); a lista fica longa nos cenários modernos
const has = (f, k) => { const F = Fa(f), t = F && F.tech; if (!t) return false; if (F.tS !== t || F.tN !== t.length) { F.tS = t; F.tN = t.length; F.tSet = new Set(t); } return F.tSet.has(k); };
// nb: construção ativa (desativada por falta de ouro não conta); built: existe no território
const built = (i, k) => G.bld[i].includes(k);
const nb = (i, k) => built(i, k) && (!G.dis.size || !G.dis.has(i + ':' + k));
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
  const lr = ldv(f, 'RF'); if (lr) { r += lr; parts.push([F.L, lr]); } // v40: LD-RF
  if (gov(f) === 'tri') { r += 1; parts.push([GOV.tri.n, 1]); }
  if (gov(f) === 'rme') { const m = -Math.floor(r / 4); r += m; parts.push([GOV.rme.n, m]); }
  const cm = csBonus(f, 'mil'); if (cm) { r += cm; parts.push(['cidades-estado militares', cm]); } // DP-30
  if (f !== G.player && !G.auto) { const b = G.diff === 2 ? 2 : G.diff === 0 ? -1 : 0; if (b) { r = Math.max(2, r + b); parts.push(['dificuldade', b]); } }
  if (F.stab < 15) { r = Math.ceil(r / 2); parts.push(['instabilidade: metade', 0]); }
  return { r, parts };
}
const planesOf = f => (G.air ? (G.air.per ?? 1) * capsHeld(f) + countB(f, 'aer') + countB(f, 'bae') + (armyOf(f).includes('pta') ? 1 : 0) : 0) + Fa(f).airX; // C-107, A-28
const navOf = f => { const F = Fa(f); return F.nav + (F.ab === 'almirante' ? 1 : 0) + countB(f, 'por') + (has(f, 'nav') ? 1 : 0) + (real(f) && has(f, 'oce') ? 1 : 0) + (real(f) && has(f, 'vap') ? 1 : 0) + sumB(f, 'nav') + ldv(f, 'NV'); }; // K-60
function objDone(f) {
  const F = Fa(f), o = F.obj;
  if (G.own[F.capI] !== f) return false;
  if (o.hold && !o.hold.every(n => G.own[G.ix[n]] === f)) return false;
  if (o.n && owned(f).length < o.n) return false;
  if (o.any && o.any.filter(i => G.own[i] === f).length < o.k) return false;
  return legacy(f) >= objLeg(); // D-02: a 2ª etapa do objetivo é desenvolver o império
}
const legWin = () => Math.round(G.len.leg * Math.min(2, Math.max(1, G.N / 30))); // mapas maiores pedem mais legado
const objLeg = () => Math.ceil(legWin() * .6); // v47: 60% do legado (era 50%)
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
const road = i => nb(i, 'tav') ? 5 : nb(i, 'frv') ? 3 : nb(i, 'pav') || nb(i, 'rdv') ? 2 : nb(i, 'est') ? 1 : 0;
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
const goodsAt = T => { const s = new Set(); for (const i of T) if (!occupied(i)) { worked(i).forEach(d => s.add(d)); G.bld[i].forEach(k => { if (STRUCT[k].mk && nb(i, k)) s.add(STRUCT[k].mk); }); } return s; };
const goods = f => { const s = goodsAt(netOf(f).linked); if (real(f)) { routeGoods(f).forEach(d => s.add(d)); bought(f).forEach(d => s.add(d)); } return s; }; // T-21
const goodsAll = f => goodsAt(owned(f));
const luxOf = f => [...goods(f)].filter(d => DEP[d].lux).length;
function yieldOf(i, L) {
  const f = G.own[i], T = TERR[G.ter[i]], lv = G.lv[i], cap = real(f) && Fa(f).capI === i, LN = 'Porte: ' + (PORTE[2 * lv - 1] || '').toLowerCase();
  const y = { pre: 0, stab: 0, food: 0, prod: 0, gold: 0, sci: 0 }, A = (r, v, w) => { if (!v) return; y[r] += v; if (L) L.push([r, v, w]); };
  A('food', T.food, T.n); A('prod', T.prod, T.n); A('gold', T.gold, T.n);
  if (G.riv[i]) { A('food', 1, 'Rio'); A('gold', 1, 'Rio'); }
  if (coastal(i)) A('food', 1, 'Litoral');
  if (hasW(f, 'jar')) A('food', 1, 'Maravilha: ' + sName('jar'));
  if (cap) { A('prod', 2, 'Capital'); A('gold', 1, 'Capital'); }
  A('gold', (lv >= 2 ? 1 : 0) + (lv >= 4 ? 1 : 0), LN); A('sci', (lv >= 3 ? 1 : 0) + (lv >= 4 ? 1 : 0), LN);
  if (subOf(i)) { const n = 'Porte: ' + pName(i).toLowerCase(); A('prod', 1, n); A('gold', 1, n); if (lv >= 4) A('sci', 1, n); }
  if (real(f)) A('gold', -jobless(i), 'Desemprego');
  for (const k of G.bld[i]) {
    const S = STRUCT[k], n = sName(k); if (!nb(i, k)) continue; if (S.sciLv) A('sci', lv, n + ' (pelo porte)'); if (real(f)) for (const t of TBY[k] || []) if (has(f, t.k)) A(t.by[1], t.by[2], n + ' · ' + tName(t.k)); /* v38: KN-01 a KN-20 */ if (!S.y) continue;
    if ((k === 'ztc' || k === 'zae') && real(f) && has(f, 'sat')) A('sci', 1, n + ' · ' + tName('sat')); // K-113
    for (const [r, v] of Object.entries(S.y)) A(r, v, n);
    if (k === 'mer' && real(f) && has(f, 'com')) A('gold', 1, n + ' · ' + tName('com'));
    if (k === 'ofi' && real(f) && has(f, 'gui')) A('prod', 1, n + ' · ' + tName('gui')); // K-39
    if (k === 'ofi' && pol(f, 'pro')) A('prod', 1, n + ' · ' + POL.pro.n); // G-24
    if (k === 'aca' && pol(f, 'esc')) A('sci', 1, n + ' · ' + POL.esc.n); // G-26
    if (k === 'tem' && gov(f) === 'teo') A('sci', 1, n + ' · ' + GOV.teo.n); // G-04
    if (k === 'uni' && real(f) && has(f, 'imp')) A('sci', 1, n + ' · ' + tName('imp')); // K-50
    if (k === 'agr' && G.riv[i]) A('food', 1, n + ' · rio');
    if (S.z) A(Object.keys(S.y)[0], Math.min(3, G.A[i].filter(j => G.own[j] === f && nb(j, k)).length), n + ' · vizinhas com o mesmo polo'); // polo
  }
  for (const d of worked(i)) for (const [r, v] of Object.entries(DEP[d].y)) A(r, v, 'Jazida: ' + DEP[d].n);
  const pn = real(f) && Fa(f).pan, pt = pn && 'Crença: ' + PANT[pn].n;
  if (pn === 'col' && G.riv[i]) A('food', 1, pt); if (pn === 'frj' && G.bld[i].includes('min')) A('prod', 1, pt); if (pn === 'mar' && coastal(i)) A('gold', 1, pt); // G-50
  A('prod', G.routes.filter(r => r.k === 'int' && r.b === i && rLive(r)).length, 'Rotas internas'); // T-01
  if (G.nat && G.nat.has(i)) { A('gold', 2, 'Maravilha natural'); A('pre', 1, 'Maravilha natural'); } // MC-07
  if (real(f)) for (const x of Fa(f).fx || []) { const w = '⚜ ' + Fa(f).L; if (x[0] === 'ED') A(x[2], x[3] * G.bld[i].filter(k => k === x[1] && nb(i, k)).length, w); else if (x[0] === 'TR' && x[1].includes(G.ter[i])) A(x[2], x[3], w); else if (x[0] === 'CP' && cap) A(x[1], x[2], w); } // v40: LD-ED, LD-TR, LD-CP
  if (occupied(i)) for (const r of Object.keys(y)) A(r, Math.floor(y[r] / 2) - y[r], 'Ocupação (metade)');
  return y;
}
// ---------- v25: 8 portes, moradia e empregos ----------
const PORTE = [null, 'Aldeia', 'Povoado', 'Vila', 'Vila grande', 'Cidade', 'Cidade grande', 'Metrópole', 'Megalópole'];
const subOf = i => (G.sub && G.sub[i]) || 0;
const setSub = (i, v) => { if (!G.sub) G.sub = Array(G.N).fill(0); G.sub[i] = v; };
const porte = i => G.lv[i] ? 2 * G.lv[i] - 1 + subOf(i) : 0;
const pName = i => PORTE[porte(i)] || 'Ermo';
// moradia: quantos portes o território comporta (crescer exige moradia acima do porte atual)
function housing(i, L) {
  let h = 0; const A = (v, w) => { if (v) { h += v; if (L) L.push([v, w]); } };
  A(3, 'Base'); A({ p: 1, m: -1, d: -1, t: -1, w: -1 }[G.ter[i]] || 0, TERR[G.ter[i]].n); A(G.riv[i] ? 1 : 0, 'Rio'); A(coastal(i) ? 1 : 0, 'Litoral'); A(real(G.own[i]) && Fa(G.own[i]).capI === i ? 1 : 0, 'Capital');
  for (const [k, v] of [['aqu', 2], ['san', 2], ['hos', 1], ['cel', 1]]) if (nb(i, k)) A(v, sName(k));
  return h;
}
// empregos: serviços do nível, cada zona dá 2 e cada obra que rende dá 1
function jobs(i, L) {
  let j = 0; const A = (v, w) => { if (v) { j += v; if (L) L.push([v, w]); } };
  A(G.lv[i] + 1, 'Serviços do porte'); A(2 * zonesAt(i).length, 'Zonas'); A(G.bld[i].filter(k => !STRUCT[k].z && STRUCT[k].y && nb(i, k)).length, 'Obras que rendem');
  return j;
}
const jobless = i => Math.max(0, porte(i) - jobs(i));
const foodUse = i => 2 * G.lv[i] - 1 + subOf(i);
// livro-razão da região: cada ganho e perda com a causa; o líquido é o que chega ao império
let ledOpen = false; document.addEventListener('toggle', e => { if (e.target.classList && e.target.classList.contains('ledger')) ledOpen = e.target.open; if (e.target.classList && e.target.classList.contains('supd')) supOpen = e.target.open; }, true);
const RES_IC = { food: ['🍞', 'Comida'], prod: ['⚒', 'Produção'], gold: ['💰', 'Ouro'], sci: ['🔬', 'Saber'], pre: ['⭐', 'Prestígio'] };
function regionNet(i) {
  const L = [], y = yieldOf(i, L), f = G.own[i], cd = capDist(f)[i], c = corrupt(i, cd), lo = tStab(i, cd) < 30, net = { ...y };
  L.push(['food', -foodUse(i), 'Consumo da população']); net.food = y.food - foodUse(i);
  const p = prodOf(i); if (p !== y.prod) L.push(['prod', p - y.prod, 'Governador, obras e governo']); net.prod = p;
  for (const r of G.routes) if (r.k === 'sup' && (r.a === i || r.b === i)) { const v = supAmt(r); if (v) { const s = r.b === i ? v : -v; L.push([r.c, s, r.b === i ? 'Abastecimento de ' + tname(r.a) : 'Abastecimento para ' + tname(r.b)]); net[r.c] += s; } } // v35
  for (const r of ['gold', 'sci']) { const v = y[r] * (1 - c) * (lo ? .5 : 1); if (c && y[r]) L.push([r, -Math.round(y[r] * c * 10) / 10, `Corrupção (${Math.round(c * 100)}%, distância da capital)`]); if (lo && y[r]) L.push([r, -Math.round(y[r] * (1 - c) * 5) / 10, 'Estabilidade baixa (metade)']); net[r] = Math.round(v * 10) / 10; }
  return { L, net };
}
function ledgerHtml(i) {
  const { L, net } = regionNet(i), sg = v => (v > 0 ? '+' : '') + v;
  const rows = Object.keys(RES_IC).map(r => { const it = L.filter(x => x[0] === r); if (!it.length && !net[r]) return ''; return `<tr><td>${RES_IC[r][0]} ${RES_IC[r][1]}</td><td class="n"><b>${sg(net[r])}</b></td><td>${it.map(x => `<span class="${x[1] < 0 ? 'neg' : ''}">${sg(x[1])} ${esc(x[2])}</span>`).join(' · ') || '—'}</td></tr>`; }).join('');
  const HL = [], JL = [], hv = housing(i, HL), jv = jobs(i, JL), pp = porte(i);
  const gr = `<b>${pName(i)}</b> (porte ${pp} de 8). ` + (growMax(i) ? 'Porte máximo.' : `Comida ${G.food[i]}/${growNeed(i)} para virar ${PORTE[pp + 1].toLowerCase()}${growOk(i) ? '' : ' · falta ' + growWhy(i).join(' e ')}${net.food < 0 ? ' · passando fome' : ''}.`) +
    `<br>🏠 Moradia ${hv}: ${HL.map(x => (x[0] > 0 ? '+' : '') + x[0] + ' ' + esc(x[1])).join(' · ')}<br>🛠 Empregos ${jv} para ${pp}: ${JL.map(x => '+' + x[0] + ' ' + esc(x[1])).join(' · ')}${jobless(i) ? ` · <span class="neg">${jobless(i)} sem trabalho (−${jobless(i)} ouro)</span>` : ''}`;
  return `<details class="ledger" ${ledOpen ? 'open' : ''}><summary>Rendimento da região: 🍞 ${sg(net.food)} · ⚒ ${net.prod} · 💰 ${net.gold} · 🔬 ${net.sci}${net.pre ? ' · ⭐ ' + net.pre : ''}</summary><table>${rows}</table><p class="hint">${gr} <button class="mini" data-a="empire">Resumo do império</button></p></details>`;
}
// resumo do império: soma das regiões e os ajustes que valem para o império todo
function empireModal() {
  const f = G.player, T = settled(f), inc = income(f), sum = { food: 0, prod: 0, gold: 0, sci: 0, pre: 0 };
  const rows = T.map(i => { const { net } = regionNet(i); for (const r in sum) sum[r] += net[r] || 0; return [i, net]; }).sort((a, b) => b[1].gold + b[1].prod - a[1].gold - a[1].prod);
  const r1 = v => Math.round(v * 10) / 10, adj = (k, v) => `${r1(v - sum[k]) >= 0 ? '+' : ''}${r1(v - sum[k])}`;
  modal(`<h2>Resumo do império</h2><p class="hint">O império é a soma das regiões. Abaixo, o líquido de cada uma (já com consumo, corrupção e estabilidade) e, no fim, os ajustes que valem para o império todo: governo, felicidade, rotas, maravilhas e dificuldade.</p>
    <div class="techs"><table class="emp"><tr><th>Região</th><th>Porte</th><th>🍞</th><th>⚒</th><th>💰</th><th>🔬</th><th>⭐</th></tr>${rows.map(([i, n]) => `<tr><td><a href="#" data-a="goto" data-i="${i}">${esc(tname(i))}</a></td><td>${pName(i)}</td><td class="${n.food < 0 ? 'neg' : ''}">${n.food}</td><td>${n.prod}</td><td>${r1(n.gold)}</td><td>${r1(n.sci)}</td><td>${n.pre || ''}</td></tr>`).join('')}
    <tr class="tot"><td>Soma das regiões</td><td>${T.length} reg.</td><td>${sum.food}</td><td>${sum.prod}</td><td>${r1(sum.gold)}</td><td>${r1(sum.sci)}</td><td>${sum.pre}</td></tr>
    <tr><td>Ajustes do império</td><td></td><td></td><td></td><td>${adj('gold', inc.gold)}</td><td>${adj('sci', inc.sci)}</td><td>${adj('pre', inc.pre)}</td></tr>
    <tr class="tot"><td>Por turno</td><td></td><td></td><td></td><td>${inc.gold}</td><td>${inc.sci}</td><td>${inc.pre}</td></tr></table></div>`, [['Fechar']]);
}
const growNeed = i => Math.round((LEVEL[G.lv[i]].need || 160) * G.len.k / 2 * (1 - ldv(G.own[i], 'CR') / 100)); // v40: LD-CR
const growWhy = i => [housing(i) <= porte(i) && 'moradia (' + housing(i) + ' para porte ' + porte(i) + ')', jobless(i) > 0 && 'empregos (' + jobless(i) + ' sem trabalho)'].filter(Boolean);
const growOk = i => !growWhy(i).length;
const growMax = i => porte(i) >= 8;
function grow(f) {
  for (const i of settled(f)) {
    G.food[i] += yieldOf(i).food - foodUse(i) + supNet(i, 'food');
    if (G.food[i] < 0) { G.food[i] = 0; if (porte(i) > 1 && !nb(i, 'cel')) { if (subOf(i)) setSub(i, 0); else { G.lv[i]--; setSub(i, 1); } log(f, `Fome em ${tname(i)}: volta a ser ${pName(i).toLowerCase()}.`); } }
    else if (!growMax(i) && G.food[i] >= growNeed(i)) {
      if (growOk(i)) { G.food[i] -= growNeed(i); if (subOf(i)) { G.lv[i]++; setSub(i, 0); } else setSub(i, 1); log(f, `${tname(i)} cresce e vira ${pName(i).toLowerCase()}.`); }
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
  y.gold = Math.round(y.gold * hm * gm * (Fa(f).finT >= G.round ? .5 : 1) * (hasW(f, 'rmd') ? 1.1 : 1) * (G.crise && G.crise.k === 'pet' && G.crise.u >= G.round && !goods(f).has('pet') && !goods(f).has('cmb') ? .85 : 1) * (G.polLim >= G.round && polOf(f) * G.order.filter(o => Fa(o).alive).length > worldPol() ? .9 : 1)) + (gv === 'rep' ? countB(f, 'mer') : 0) - (pol(f, 'pao') ? owned(f).filter(i => G.lv[i] >= 3).length : 0); y.sci = Math.round(y.sci * hm * sm * (hasW(f, 'rmd') ? 1.1 : 1) * (has(f, 'ia') ? 1.2 : 1) * (gv === 'ppu' ? .85 : 1)); // E-32, C-215, G-09
  return {
    gold: Math.max(1, y.gold + diff + routeGold(f) + ldv(f, 'RT') * myRoutes(f).filter(r => rLive(r) && r.f !== r.o).length + ldv(f, 'OU', 'reg') * Math.floor(T.length / 2)), // v40: LD-RT, LD-OU
    sci: Math.round((1 + y.sci + routeSci(f)) * (hasW(f, 'obi') ? 1.25 : 1) * (has(f, 'cie') ? 1.1 : 1) * (1 + ldv(f, 'SB', 'all') / 100)), stab: y.stab,
    pre: y.pre + capsHeld(f) + countB(f, 'tem') + 2 * countB(f, 'mar') + (has(f, 'ret') ? 1 : 0) + (F.stab >= 70 ? 1 : 0) + (has(f, 'rad') ? countB(f, 'mid') : 0) - (gv === 'ppu' ? Math.floor(y.pre / 2) : 0) + ldv(f, 'PR', 'turn'),
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
    - owned(f).filter(i => G.lv[i] >= 3).length - Math.floor(F.ww * (1 - ldv(f, 'ES', 'ww') / 100) / (pol(f, 'ppg') ? 8 : 4)) - (F.taxT >= G.round ? 3 : 0) - (gov(f) === 'abs' ? 2 : 0) - (pol(f, 'csc') ? 1 : 0) + (pol(f, 'pao') ? 2 : 0) - (F.refT >= G.round ? 2 : 0)
    + sumB(f, 'hp') + 2 * monoOf(f).length + (F.gamesT >= G.round ? 3 : 0) - (gov(f) === 'tcn' && !goods(f).has('bcs') ? 3 : 0) + classHap(f); // parte 12, S-23
}
// S-12: saúde do território. Abaixo de 0, chance de epidemia
const health = i => 2 + (G.riv[i] ? 1 : 0) + (coastal(i) ? 1 : 0) + 2 * ['aqu', 'san', 'hos'].filter(k => nb(i, k)).length - G.lv[i] - (G.bld[i].includes('min') ? 1 : 0) + (pol(G.own[i], 'amb') ? 1 : 0) + (prin(i, 'hos') ? 2 : 0) + hX(i);
// S-13: estabilidade local = do império, menos cultura estrangeira e distância; mais tribunal e guarnição
const tStab = (i, d) => { const f = G.own[i], F = Fa(f); return F.real ? F.stab - (G.cul[i] !== f ? 15 : 0) - 3 * Math.max(0, d - 3) + (nb(i, 'tri') ? 15 : 0) + (G.tr[i] >= 3 ? 5 : 0) + (prin(i, 'dev') ? 5 : 0) + (govrAt(i) === 'pre' ? 15 : 0) + (nb(i, 'plc') ? 5 : 0) + (F.age === 'ouro' || F.age === 'heroica' ? 5 : 0) : 50; };
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
const cultureInc = f => anar(f) ? 0 : Math.round((1 + ['tem', 'mon', 'tea', 'anf', 'cat', 'mos'].reduce((s, k) => s + countB(f, k), 0) + 2 * countB(f, 'mar') + 2 * wwCount(f) + csBonus(f, 'cul') + sumB(f, 'cu') + (has(f, 'tv') ? countB(f, 'mid') : 0)) * (pol(f, 'mec') ? 1.25 : 1));
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
    const na = ldv(f, 'GV', 'anar'); F.gov = x; F.anar = na ? 0 : G.round + 2; F.pfree = G.round; polFit(f); log(f, `${fname(f)} adota ${g.n}: ${na ? 'sem anarquia, pelas reformas de ' + F.L : '2 turnos de anarquia, sem saber nem cultura'}.`); return '';
  }
  if (a === 'pol') {
    const p = POL[x]; if (!p || !civ(f, p.c)) return 'Política indisponível.';
    if (pol(f, x)) { F.pol = F.pol.filter(k => k !== x); return ''; }
    if (freeSlot(f, p.t) < 1) return `Sem vaga ${SLOTN[p.t]} livre no governo atual.`;
    if (F.pfree !== G.round && !spend(f)) return 'Trocar política fora do turno de uma cívica nova não é possível agora.';
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
  F.cu += cultureInc(f); F.cuT = (F.cuT || 0) + cultureInc(f); // V-04
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
// v51 (UI-21): governo, políticas, cívicas e crenças em quatro abas. Cada opção diz o que faz, o que pede e por que está bloqueada
let gsub = 'gov';
function govModal() {
  const me = G.player, F = Fa(me), my = G.turnF === me, ci = cultureInc(me);
  const tabs = [['gov', '🏛 Governo'], ['pol', '📜 Políticas'], ['civ', '🎭 Cívicas'], ['fe', '🙏 Crenças']];
  const head = `<div class="stabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${k === gsub}" class="${k === gsub ? 'on' : ''}" data-a="gtab" data-k="${k}">${l}</button>`).join('')}</div>`;
  const eta = c => F.cu >= c ? 'cultura suficiente' : ci ? `faltam ${c - F.cu} 🎭, cerca de ${Math.ceil((c - F.cu) / ci)} turno(s)` : `faltam ${c - F.cu} 🎭; sem cultura por turno, construa templos ou teatros`;
  const slotTxt = s => Object.entries(s).map(([t, n]) => n + ' ' + SLOTN[t]).join(', ');
  const sec = (t, rows, empty) => `<h3>${t}</h3><div class="techs">${rows.join('') || `<p class="hint">${empty}</p>`}</div>`;
  let body = '';
  if (gsub === 'gov') {
    const cur = GOV[gov(me)], row = ([k, g]) => { const ok = civ(me, g.c), dis = !my ? 'Espere o seu turno.' : !ok ? `Exige a cívica ${CK[g.c].n}.` : F.pa < 1 ? 'Sem ações neste turno.' : '';
      const d = Object.keys({ ...cur.s, ...g.s }).map(t => [(g.s[t] || 0) - (cur.s[t] || 0), SLOTN[t]]).filter(x => x[0]).map(([n, t]) => (n > 0 ? '+' : '') + n + ' vaga ' + t).join(', ');
      return `<div class="tech ${ok ? '' : 'lock'}"><div><b>${esc(g.n)}</b> <span class="hint">vagas: ${slotTxt(g.s)}</span><p>${esc(g.fx)}</p><p class="hint">Em relação ao atual: ${d || 'mesmas vagas'}.${ok ? '' : ` 🔒 Exige a cívica ${esc(CK[g.c].n)} (${civCost(CK[g.c])} 🎭).`}</p></div><button class="mini ${dis ? '' : 'pri'}" data-a="gv" data-o="gov" data-k="${k}" title="${esc(dis || 'Trocar de governo traz 2 turnos de anarquia, sem saber nem cultura.')}" ${dis ? 'disabled' : ''}>Adotar</button></div>`; };
    const all = Object.entries(GOV).filter(([k]) => k !== gov(me));
    body = `<div class="fic"><div class="fh2"><b>Governo atual: ${esc(cur.n)}</b><span class="hint">vagas de política: ${slotTxt(cur.s)}</span></div><p>${esc(cur.fx)}</p></div>
      <p class="hint">O governo define quantas políticas de cada tipo você pode usar e dá um bônus fixo. Trocar traz 2 turnos de anarquia (sem saber nem cultura), e as políticas que não couberem nas novas vagas saem.</p>` + sec('Você pode adotar', all.filter(([, g]) => civ(me, g.c)).map(row), 'Nenhum outro governo liberado ainda. Adote cívicas para liberar.') + sec('Ainda bloqueados', all.filter(([, g]) => !civ(me, g.c)).map(row), 'Todos os governos estão liberados.');
  } else if (gsub === 'pol') {
    const free = F.pfree === G.round;
    body = `<p class="hint">Políticas ocupam as vagas do governo (${esc(GOV[gov(me)].n)}: ${slotTxt(slots(me))}). ${free ? '<b class="ok">Trocas grátis neste turno</b>, porque você adotou uma cívica.' : 'Cada política nova custa 1 ação; no turno em que adota uma cívica, as trocas são grátis.'} Retirar é sempre grátis.</p>` + Object.keys(SLOTN).map(t => {
      const L = Object.entries(POL).filter(([, p]) => p.t === t), tot = slots(me)[t] || 0, fr = freeSlot(me, t);
      const rows = L.map(([k, p]) => { const on = pol(me, k), ok = civ(me, p.c), dis = !my ? 'Espere o seu turno.' : on ? '' : !ok ? `Exige a cívica ${CK[p.c].n}.` : fr < 1 ? `Sem vaga ${SLOTN[t]} livre: retire outra ou troque de governo.` : !free && F.pa < 1 ? 'Sem ações neste turno.' : '';
        return `<div class="tech ${on ? 'own' : ok ? '' : 'lock'}"><div><b>${esc(p.n)}</b><p>${esc(p.fx)}</p>${ok ? '' : `<p class="hint">🔒 Exige a cívica ${esc(CK[p.c].n)}.</p>`}</div><button class="mini ${on || dis ? '' : 'pri'}" data-a="gv" data-o="pol" data-k="${k}" title="${esc(dis)}" ${dis ? 'disabled' : ''}>${on ? 'Retirar' : 'Usar'}</button></div>`; });
      return `<h3>Vagas ${SLOTN[t]}s <span class="hint">${tot - fr} de ${tot} em uso</span></h3><div class="techs">${rows.join('')}</div>`;
    }).join('');
  } else if (gsub === 'civ') {
    const row = c => { const own = civ(me, c.k), ok = civOk(me, c), cost = civCost(c), lib = [...Object.values(GOV).filter(g => g.c === c.k).map(g => 'governo ' + g.n), ...Object.values(POL).filter(p => p.c === c.k).map(p => 'política ' + p.n)], nx = CIVIC.filter(x => x.req.includes(c.k)).map(x => x.n);
      const dis = !my ? 'Espere o seu turno.' : !ok ? 'Exige ' + c.req.filter(r => !civ(me, r)).map(r => CK[r].n).join(' e ') + '.' : F.cu < cost ? 'Cultura insuficiente.' : '';
      return `<div class="tech ${own ? 'own' : ok ? '' : 'lock'}"><div><b>${esc(c.n)}</b> <span class="hint">${cost} 🎭${own ? '' : ok ? ' · ' + eta(cost) : ''}</span><p class="hint">Libera: ${esc(lib.join(', ') || 'nada direto')}.${nx.length ? ' Leva a: ' + esc(nx.join(', ')) + '.' : ''}${own || ok ? '' : ' 🔒 ' + esc(dis)}</p>${!own && ok ? `<p class="hint">${pbar(F.cu, cost)}</p>` : ''}</div>${own ? '<span class="ok">✓</span>' : `<button class="mini ${dis ? '' : 'pri'}" data-a="gv" data-o="civ" data-k="${c.k}" title="${esc(dis)}" ${dis ? 'disabled' : ''}>Adotar</button>`}</div>`; };
    const n = (F.civ || []).length;
    body = `<p class="hint">Cívicas se compram com cultura 🎭 e não gastam ação. Cada uma libera governos e políticas e abre o caminho para as seguintes. A cada 4 cívicas você ganha mais 1 governador (tem ${n}; próximo governador com ${4 * (Math.floor(n / 4) + 1)}).</p>` + sec('Prontas para adotar', CIVIC.filter(c => civOk(me, c)).map(row), 'Nenhuma disponível agora.') + sec('Mais adiante', CIVIC.filter(c => !civ(me, c.k) && !civOk(me, c)).map(row), 'Você já vê todas.') + sec('Já adotadas', CIVIC.filter(c => civ(me, c.k)).map(row), 'Nenhuma ainda.');
  } else {
    const fe = G.faiths[me], canP = my && has(me, 'mis') && F.cu >= 10, canF = my && F.cu >= 30 && countB(me, 'tem') && countB(me, 'mos');
    const pan = F.pan ? `<div class="fic"><div class="fh2"><b>Panteão: ${esc(PANT[F.pan].n)}</b></div><p>${esc(PANT[F.pan].fx)}</p></div>` : `<p class="hint">Primeiro passo da fé: escolha um panteão. Exige a tecnologia ${esc(tName('mis'))} ${has(me, 'mis') ? '✓' : '✗'} e 10 🎭 (${F.cu >= 10 ? '✓' : eta(10)}). A escolha é definitiva.</p><div class="techs">${Object.entries(PANT).map(([k, p]) => `<div class="tech"><div><b>${esc(p.n)}</b><p>${esc(p.fx)}</p></div><button class="mini ${canP ? 'pri' : ''}" data-a="gv" data-o="pan" data-k="${k}" ${canP ? '' : 'disabled'}>Escolher</button></div>`).join('')}</div>`;
    const pr = t => Object.entries(PRIN).filter(([, p]) => p.t === t);
    const fs = fe ? `<div class="fic"><div class="fh2"><b>Sua fé: ${esc(fe.n)}</b><span class="hint">${G.fai.filter(x => x === me).length} territórios seguem</span></div><p>${esc(PRIN[fe.a].n)}: ${esc(PRIN[fe.a].fx)}</p><p>${esc(PRIN[fe.b].n)}: ${esc(PRIN[fe.b].fx)}</p></div>`
      : F.pan ? `<h3>Fundar uma fé</h3><p class="hint">Exige ${esc(sName('tem'))} ${countB(me, 'tem') ? '✓' : '✗'}, ${esc(sName('mos'))} ${countB(me, 'mos') ? '✓' : '✗'} e 30 🎭 (${F.cu >= 30 ? '✓' : eta(30)}). Escolha um princípio de fundador (vale para você) e um de seguidor (vale em todo território que seguir a fé).</p>
        <p class="hint"><b>Fundador:</b> ${pr('f').map(([, p]) => `${esc(p.n)} (${esc(p.fx)})`).join(' · ')}</p><p class="hint"><b>Seguidor:</b> ${pr('s').map(([, p]) => `${esc(p.n)} (${esc(p.fx)})`).join(' · ')}</p>
        <div class="row">${pr('f').map(([a, p]) => pr('s').map(([b, q]) => `<button class="mini" data-a="gv" data-o="fe" data-k="${a}" data-y="${b}" title="${esc(p.fx + ' ' + q.fx)}" ${canF ? '' : 'disabled'}>${esc(p.n)} + ${esc(q.n)}</button>`).join('')).join('')}</div>` : '';
    const others = Object.entries(G.faiths).filter(([f]) => f !== me).map(([f, v]) => `${esc(v.n)} (${esc(fname(f))}, ${G.fai.filter(x => x === f).length} terr.)`).join(' · ');
    body = pan + fs + (others ? `<p class="hint">Outras fés no mundo: ${others}</p>` : '');
  }
  modal(`<h2>Governo, cultura e fé</h2><p class="hint">Cultura: <b>${F.cu} 🎭</b> (+${ci} por turno)${anar(me) ? ' · <b class="warn">anarquia</b>: sem saber nem cultura neste turno' : ''} · governo ${esc(GOV[gov(me)].n)} · ${(F.civ || []).length} cívicas · ${(F.pol || []).length} políticas em uso</p>${head}${body}`, [['Fechar']]);
}
// ---------- parte 11: personagens e eventos (F-01 a F-03, F-10 a F-16, F-30 a F-38, E-10 a E-13, E-20 a E-34) ----------
// F-02: sucessão nas monarquias (25 a 40 turnos) e eleição nas repúblicas (20); E-28: crise com estabilidade baixa
function succession(f) {
  const F = Fa(f); if (!F.ld) F.ld = { n: F.L, r: G.round, d: 25 + Math.floor(rnd() * 16) };
  const rep = ['rep', 'rme', 'dem'].includes(gov(f));
  if (G.round - F.ld.r < (rep ? 20 : F.ld.d)) return;
  F.ld.r = G.round; // v40: o líder escolhido na criação vale a partida toda
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
  exp: { n: 'Grande explorador', b: [], fx: 'revela o mapa e dá +2 ouro por maravilha natural do mundo (modo Civilização)' },
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
  else if (t === 'exp') { if (f === G.player && G.seen) for (let i = 0; i < G.N; i++) G.seen.add(i); F.gold += 2 * (G.nat ? G.nat.size : 0); }
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
const spyDef = i => { const o = G.own[i]; return (pol(o, 'pol') ? 2 : 0) + (nb(i, 'tri') ? 1 : 0) + (G.gvr[i] && govrAt(i) === 'pre' ? 1 : 0) + (nb(i, 'plc') ? 2 : 0); }; // F-37
function spy(f, i, k) {
  const F = Fa(f), o = G.own[i], S = SPY[k];
  if (!S || !real(o) || o === f) return 'Escolha um território de outra facção.';
  if (!has(f, 'esc')) return 'Espiões exigem Escrita.';
  if (k === 'ppg' && !has(f, 'imp')) return 'Propaganda exige Imprensa.';
  if (k === 'tec' && !nb(i, 'aca') && !nb(i, 'uni')) return 'Roubar tecnologia exige biblioteca ou universidade no território.';
  if (F.gold < 3) return 'Ouro insuficiente.';
  if (!spend(f, 'spy' + i)) return 'Já há uma missão de espionagem aqui neste turno.';
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
// v51 (UI-22): personagens em três abas. Líder, grandes figuras (com progresso e de onde vêm os pontos) e governadores (nomeados aqui mesmo)
let fsub = 'lid';
function figModal() {
  const me = G.player, F = Fa(me), my = G.turnF === me;
  const tabs = [['lid', '👑 Líder'], ['fig', `🌟 Grandes figuras${(F.gf || []).length ? ' •' : ''}`], ['gvr', `🧑‍💼 Governadores ${govrN(me)}/${govrMax(me)}`]];
  const head = `<div class="stabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${k === fsub}" class="${k === fsub ? 'on' : ''}" data-a="ftab" data-k="${k}">${l}</button>`).join('')}</div>`;
  let body = '';
  if (fsub === 'lid') {
    body = `<div class="fic"><div class="fh2"><b>${esc(F.L)}</b><span class="hint">${F.Ly ? esc(F.Ly) + ' · ' : ''}${esc(fname(me))}</span></div>
      <p><b>${esc(ABIL[F.ab][0])}.</b> ${esc(ABIL[F.ab][1])}</p>${F.fx && F.fx.length ? `<p><b>Poder histórico.</b> ${esc(ldText(F.fx))}.</p>` : ''}
      <p class="hint">O líder vale a partida inteira; foi escolhido na criação do jogo.${F.age ? ` Era ${F.age === 'ouro' ? 'de ouro' : esc(F.age)}.` : ''} Pontos de era: ${F.ep || 0}.</p></div>`;
  } else if (fsub === 'fig') {
    const wait = (F.gf || []).map((t, n) => `<div class="tech own"><div><b>${esc(GF[t].n)}</b><p>Ao usar: ${esc(GF[t].fx)}.</p></div><button class="mini pri" data-a="fig" data-n="${n}" ${my ? '' : 'disabled'}>Usar</button></div>`).join('');
    const rows = Object.keys(GF).map(t => { const v = (F.gp || {})[t] || 0, c = gfCost(t), src = GF[t].b.map(sName).join(', ') + (t === 'gen' ? (GF[t].b.length ? ' e ' : '') + 'conquistas' : ''), n = GF[t].b.reduce((s, k) => s + countB(me, k), 0);
      return `<div class="tech"><div><b>${esc(GF[t].n)}</b> <span class="hint">${v}/${c}</span><p>Ao usar: ${esc(GF[t].fx)}.</p><p class="hint">${pbar(v, c)} Pontos vêm de: ${esc(src || 'descobertas do modo Civilização')}.${GF[t].b.length ? ` Você tem ${n} dessas construções.` : ''}</p></div></div>`; }).join('');
    body = `<p class="hint">Cada construção da lista soma 1 ponto por turno para a figura dela. Quem chega primeiro ao custo leva a figura, e o custo sobe para todos. Usar não gasta ação.</p>${wait ? `<h3>À sua espera</h3><div class="techs">${wait}</div>` : ''}<h3>Progresso</h3><div class="techs">${rows}</div>`;
  } else {
    const left = govrMax(me) - govrN(me), n = (F.civ || []).length;
    const T = owned(me).sort((a, b) => (govrAt(b) ? 1 : 0) - (govrAt(a) ? 1 : 0) || G.lv[b] - G.lv[a]);
    const rows = T.map(i => { const g = govrAt(i), cd = capDist(me)[i]; return `<div class="tech ${g ? 'own' : ''}"><div><b>${esc(tname(i))}</b> <span class="hint">${esc(pName(i))} · ${prodOf(i)} ⚒ · estabilidade local ${tStab(i, cd)}${G.q[i].length ? ' · ' + G.q[i].length + ' obra(s) na fila' : ''}</span><p class="hint">${g ? `Governador: <b>${GOVR[g][0]}</b> (${GOVR[g][1]}).` : 'Sem governador.'}</p></div><span class="row">${Object.entries(GOVR).map(([k, x]) => `<button class="mini" data-a="gvr" data-i="${i}" data-k="${k}" title="${esc(x[1])}" ${!my || g === k || (!g && left < 1) ? 'disabled' : ''}>${x[0]}</button>`).join('')}</span></div>`; }).join('');
    body = `<p class="hint">Você tem ${govrN(me)} de ${govrMax(me)} governador(es): 1 de início e mais 1 a cada 4 cívicas (tem ${n}). Nomear não gasta ação e pode ser trocado de tipo depois.</p>
      <ul class="bl">${Object.values(GOVR).map(x => `<li><b>${x[0]}</b> <span class="hint">${x[1]}. ${x[0] === 'Intendente' ? 'Melhor onde a fila de obras é longa.' : x[0] === 'Prefeito' ? 'Melhor em território conquistado ou longe da capital.' : 'Melhor quando falta ouro para soldo e manutenção.'}</span></li>`).join('')}</ul>
      <h3>Seus territórios</h3><div class="techs">${rows}</div>`;
  }
  modal(`<h2>Personagens</h2>${head}${body}`, [['Fechar']]);
}
function aiChars(f) {
  const F = Fa(f);
  if (govrN(f) < govrMax(f)) { const i = owned(f).filter(i => !govrAt(i)).sort((a, b) => G.lv[b] - G.lv[a])[0]; if (i != null) placeGovr(f, i, i === F.capI ? 'int' : tStab(i, capDist(f)[i]) < 40 ? 'pre' : 'tes'); }
  if (has(f, 'esc') && F.pa > 0 && F.gold >= 8 && rnd() < .25) {
    const t = G.order.filter(o => o !== f && Fa(o).alive && !allied(f, o) && Fa(o).tech.length > F.tech.length).flatMap(owned).find(i => nb(i, 'aca') || nb(i, 'uni'));
    if (t != null) spy(f, t, 'tec');
  }
}
// ---------- parte 12: eras industrial a informação ----------
// S-15: poluição por território e do mundo; política ambiental corta pela metade
const pluAt = i => Math.max(0, G.bld[i].reduce((s, k) => s + (nb(i, k) && STRUCT[k].plu || 0), 0));
const polOf = f => Math.max(0, Math.round(owned(f).reduce((s, i) => s + G.bld[i].reduce((t, k) => t + (nb(i, k) && STRUCT[k].plu || 0), 0), 0) * (pol(f, 'amb') ? .5 : 1)));
const worldPol = () => turnMemo('wp', '_', () => G.order.reduce((s, f) => s + (Fa(f).alive ? polOf(f) : 0), 0));
// saúde extra da parte 12: hospitais da medicina, antibióticos, farmacêutica, reservas, saneamento moderno; menos poluição local
const hX = i => { const f = G.own[i]; if (!real(f)) return 0; return (has(f, 'mdc') ? 1 : 0) + (has(f, 'atb') ? 2 : 0) + 2 * Math.min(1, countB(f, 'frm')) + G.bld[i].reduce((s, k) => s + (nb(i, k) && STRUCT[k].hl || 0), 0) + (has(f, 'snt') && nb(i, 'san') ? 1 : 0) - pluAt(i); };
// T-20: monopólio. Quem explora 60% de um luxo do mundo (mín. 2) ganha +2 felicidade por luxo e +1 ouro por rota com outra facção
const monoOf = f => turnMemo('mono', f, () => monoOf0(f));
function monoOf0(f) {
  const n = {}, mine = {};
  G.own.forEach((o, i) => { if (!real(o) || occupied(i)) return; for (const d of worked(i)) if (DEP[d].lux) { n[d] = (n[d] || 0) + 1; if (o === f) mine[d] = (mine[d] || 0) + 1; } });
  return Object.keys(mine).filter(d => n[d] >= 3 && mine[d] / n[d] >= .6);
}
// T-22: filiais de corporações (bolsa de valores) em mercados de outras facções em paz
const corpMax = f => 2 * countB(f, 'bol');
const corpsOf = f => G.corp.filter(c => c.f === f);
function openCorp(f, i) {
  const F = Fa(f), o = G.own[i];
  if (!real(o) || o === f || !peace(f, o) || !nb(i, 'mer')) return 'Escolha um mercado de outra facção em paz com você.';
  if (corpsOf(f).length >= corpMax(f)) return 'Cada bolsa de valores permite 2 filiais.';
  if (G.corp.some(c => c.f === f && c.i === i)) return 'Já há uma filial sua aqui.';
  if (F.gold < 5) return 'Ouro insuficiente.';
  if (!spend(f)) return 'Sem pontos de ação.';
  F.gold -= 5; G.corp.push({ f, i }); remember(o, f, 'suas empresas investem aqui', 5); log(f, `${fname(f)} abre uma filial em ${tname(i)}.`); return '';
}
// A-29: mísseis de um silo, até 3 territórios por terra; o Congresso pode proibir
function missile(f, j) {
  const F = Fa(f);
  if (G.banMis >= G.round) return 'O Congresso Mundial proibiu os mísseis.';
  if (F.mslT === G.round) return 'Só um lançamento por turno.';
  if (!hostile(f, j) || !real(G.own[j])) return 'Escolha um alvo inimigo.';
  if (F.gold < 5) return 'Ouro insuficiente.';
  const s = owned(f).find(i => nb(i, 'sil') && landSteps(i, j, 3, () => true) < 99); if (s == null) return 'Nenhum silo a até 3 territórios.';
  F.gold -= 5; F.mslT = G.round; const k = Math.min(2, G.tr[j] - 1); G.tr[j] -= k; remember(G.own[j], f, 'nos atacou com mísseis', -15);
  log(f, `${fname(f)} lança mísseis de ${tname(s)} contra ${tname(j)}: −${k} tropa(s).`); return '';
}
// DP-40 a DP-42: Congresso Mundial
const votes = f => 1 + Object.keys(G.cs).filter(i => suz(+i) === f).length + (hasW(f, 'sdn') ? 2 : 0);
const CRES = {
  emb: ['Embargo', x => `embargo a ${fname(x)} por 10 turnos`], ban: ['Proibir mísseis', () => 'ninguém lança mísseis por 15 turnos'],
  jog: ['Jogos mundiais', x => `${fname(x)} sedia os jogos: +5 prestígio e +3 felicidade por 5 turnos`], aju: ['Ajuda ao mais fraco', x => `${fname(x)} recebe 10 ouro`],
  plu: ['Limite de poluição', () => 'quem polui acima da média perde 10% do ouro por 15 turnos'],
};
function aiVote(f, r) {
  if (r.k === 'emb') return r.x !== f && !allied(f, r.x) && relOf(f, r.x).v < 30;
  if (r.k === 'ban') return !countB(f, 'sil');
  if (r.k === 'jog' || r.k === 'aju') return r.x === f || relOf(f, r.x).v >= 0;
  return polOf(f) <= worldPol() / Math.max(1, G.order.filter(o => Fa(o).alive).length);
}
function congress() {
  const C = G.cong, alive = G.order.filter(f => Fa(f).alive && Fa(f).entered);
  if (!C.on) { if (alive.filter(f => has(f, 'dipm')).length * 2 >= alive.length && alive.length > 1) { C.on = true; C.next = G.round + 1; log(null, 'Metade do mundo conhece a diplomacia moderna: nasce o Congresso Mundial.'); } return; }
  if (C.res.length && G.round >= C.due) { // apuração
    for (const r of C.res) {
      let yes = 0, no = 0; const vs = {}; for (const f of alive) { const v = f === G.player && !G.auto ? C.pv[r.k] : aiVote(f, r); vs[f] = v; if (v === true) yes += votes(f); else if (v === false) no += votes(f); }
      const ok = yes > no; log(null, `Congresso Mundial: ${CRES[r.k][0]} ${ok ? 'aprovado' : 'rejeitado'} (${yes} a ${no}).`);
      alive.forEach(f => { if (vs[f] === ok) Fa(f).fav = (Fa(f).fav || 0) + 1; }); // V-05: favor de quem votou com a maioria
      if (!ok) continue;
      if (r.k === 'emb') { alive.forEach(f => { if (f !== r.x) G.emb.add(tk(f, r.x)); }); C.embX = r.x; C.embU = G.round + 10; checkRoutes(); }
      if (r.k === 'ban') G.banMis = G.round + 15;
      if (r.k === 'jog') { Fa(r.x).fav = (Fa(r.x).fav || 0) + 2; Fa(r.x).pre += 5; Fa(r.x).gamesT = G.round + 5; }
      if (r.k === 'aju') Fa(r.x).gold += 10;
      if (r.k === 'plu') G.polLim = G.round + 15;
    }
    C.res = []; C.pv = {};
  }
  if (C.embX && G.round >= C.embU) { alive.forEach(f => G.emb.delete(tk(f, C.embX))); C.embX = null; }
  if (G.round >= C.next) { // nova sessão: 2 resoluções, votadas na rodada seguinte
    const rk = alive.slice().sort((a, b) => score(b) - score(a)), host = alive.slice().sort((a, b) => cultureInc(b) - cultureInc(a))[0];
    const all = [{ k: 'emb', x: rk[0] }, { k: 'ban' }, { k: 'jog', x: host }, { k: 'aju', x: rk[rk.length - 1] }, { k: 'plu' }].sort(() => rnd() - .5);
    C.res = all.slice(0, 2); Object.keys(G.cs).forEach(i => { const s = suz(+i); if (s) Fa(s).fav = (Fa(s).fav || 0) + 1; }); // V-05 C.due = G.round + 1; C.next = G.round + 15; C.pv = {};
    log(null, `Congresso Mundial em sessão: ${C.res.map(r => CRES[r.k][1](r.x)).join('; ')}. Votação na próxima rodada.`);
  }
}
function era12Turn(f) {
  const F = Fa(f);
  // L-09: exército grande em território ocupado come da capital; sem comida, perde tropa
  for (const i of owned(f)) if (occupied(i) && G.tr[i] >= 6) { if (G.food[F.capI] > 0) G.food[F.capI]--; else { G.tr[i]--; log(f, `Sem comida, o exército de ${fname(f)} em ${tname(i)} perde 1 tropa.`); } }
  // L-10 e A-26: bloqueio naval e submarinos cortam rotas marítimas
  for (const r of myRoutes(f)) if ((r.k === 'mar' || r.k === 'oce') && rLive(r)) {
    const enemy = G.order.filter(o => o !== f && Fa(o).alive && !peace(f, o));
    if (enemy.some(o => navOf(o) > navOf(f) && [r.a, r.b].some(e => G.A[e].some(j => G.own[j] === o && nb(j, 'por'))))) { r.cut = G.round; log(f, `Bloqueio naval corta a rota de ${tname(r.a)}.`); }
    else if (enemy.some(o => armyOf(o).includes('sub')) && rnd() < 1 / 3) { r.cut = G.round; log(f, `Submarinos inimigos afundam a carga da rota de ${tname(r.a)}.`); }
  }
  // usina nuclear: pequeno risco de acidente
  for (const i of owned(f)) if (nb(i, 'nuc') && rnd() < .005) { G.occ[i] = 20; if (G.lv[i] > 1) G.lv[i]--; F.stab = Math.max(0, F.stab - 10); log(f, `Acidente na usina nuclear de ${tname(i)}: o território fica inutilizável por 20 turnos (E-35).`); }
  // filiais (T-22): +2 ouro cada; a filial fecha sem paz ou sem mercado
  G.corp = G.corp.filter(c => real(G.own[c.i]) && G.own[c.i] !== c.f && peace(c.f, G.own[c.i]) && nb(c.i, 'mer'));
  F.gold += corpsOf(f).length * (2 + (gov(f) === 'tcn' ? 1 : 0));
}
// E-25: mudança climática com muita poluição no mundo
function climate() {
  const w = worldPol(); if (w < 12 || rnd() > Math.min(.5, w / 60)) return;
  const c = G.own.map((o, i) => i).filter(i => real(G.own[i]) && coastal(i) && G.lv[i] > 1), d = G.own.map((o, i) => i).filter(i => real(G.own[i]));
  if (c.length) { const i = c[Math.floor(rnd() * c.length)]; G.lv[i]--; log(G.own[i], `O mar sobe em ${tname(i)}: perde população.`); }
  if (d.length) { const i = d[Math.floor(rnd() * d.length)]; G.food[i] = 0; log(G.own[i], `Seca forte em ${tname(i)} com o clima mudado.`); }
}
function aiEra12(f) {
  const F = Fa(f);
  if (corpsOf(f).length < corpMax(f) && F.gold >= 10 && F.pa > 0) { const i = G.own.map((o, i) => i).find(i => real(G.own[i]) && G.own[i] !== f && peace(f, G.own[i]) && nb(i, 'mer') && !G.corp.some(c => c.f === f && c.i === i)); if (i != null) openCorp(f, i); }
  if (countB(f, 'sil') && F.gold >= 8) { const j = owned(f).flatMap(i => G.A[i]).filter(j => hostile(f, j) && real(G.own[j]) && G.tr[j] >= 3).sort((a, b) => G.tr[b] - G.tr[a])[0]; if (j != null) missile(f, j); }
}
// ---------- parte 13: vitórias completas (V-01 a V-08, V-10, aviso de ameaça) ----------
// cada vitória dá o progresso de 0 a 1; o cenário pode limitar as vitórias com sc.vic
const vicMin = () => Math.ceil(G.rounds / 2); // vitórias novas só da metade da partida em diante
const vicOn = k => !G.sc.vic || G.sc.vic.includes(k);
const rivals = f => G.order.filter(o => o !== f && Fa(o).alive && Fa(o).entered && !allied(f, o));
// V-04: turismo acumulado contra a cultura acumulada de cada rival
const tourInc = f => anar(f) ? 0 : Math.round(cultureInc(f) / 4 + 2 * wwCount(f) + countB(f, 'mus') + countB(f, 'ztu') + countB(f, 'pqn') + (Fa(f).gamesT >= G.round ? 3 : 0));
// V-06: parte do ouro do mundo (reservas e filiais valendo 5 cada)
const wealth = f => Fa(f).gold + 5 * corpsOf(f).length;
const VIC = {
  sci: { n: 'Ciência', fx: 'Programa Espacial, depois satélite, pouso tripulado e colônia espacial no mesmo território', p: f => ['pep', 'sp1', 'sp2', 'sp3'].filter(k => countB(f, k)).length / 4 },
  cul: { n: 'Cultura', fx: 'seu turismo acumulado passa do dobro da cultura acumulada de cada rival (mín. 250)', p: f => { const t = Fa(f).tour || 0, r = rivals(f); return r.length ? Math.min(1, t / (250 * G.len.k), ...r.map(o => t / Math.max(1, 2 * (Fa(o).cuT || 0)))) : 0; } },
  dip: { n: 'Diplomacia', fx: '20 pontos de favor no Congresso Mundial (votar com a maioria, sediar jogos, proteger cidades-estado)', p: f => Math.min(1, (Fa(f).fav || 0) / 20) },
  eco: { n: 'Economia', fx: 'metade do ouro do mundo (reservas e filiais, mín. 120) por 10 turnos, ou 4 monopólios', p: f => Math.max(monoOf(f).length / 4, Math.min(1, (Fa(f).ecoT || 0) / 10)) },
  rel: { n: 'Fé', fx: 'sua fé é a maioria em todas as facções vivas e segue 70% dos territórios do mundo', p: f => { if (!G.faiths[f]) return 0; const fs = G.order.filter(o => Fa(o).alive && Fa(o).entered && owned(o).length); return fs.filter(o => { const T = owned(o); return G.fai.filter((x, i) => x === f && G.own[i] === o).length * 2 > T.length; }).length / Math.max(1, fs.length) * Math.min(1, G.fai.filter((x, i) => x === f && real(G.own[i])).length / Math.max(1, .7 * G.own.filter(real).length)); } },
  eco2: { n: 'Ecológica', fx: 'mundo com pouca poluição por 20 turnos e você liderando as energias limpas (mín. 2)', p: f => (G.green || 0) >= 1 && greenLead() === f ? Math.min(1, G.green / 20) : 0 },
};
const clean = f => countB(f, 'sol') + countB(f, 'hid') + countB(f, 'rsv');
const greenLead = () => { const a = G.order.filter(f => Fa(f).alive && real(f)).sort((x, y) => clean(y) - clean(x)); return a[0] && clean(a[0]) >= 2 && (!a[1] || clean(a[0]) > clean(a[1])) ? a[0] : null; };
// fim de cada turno da facção: acumula turismo, cultura total, economia; confere vitórias e ameaças
function vicTurn(f) {
  const F = Fa(f); if (!real(f)) return;
  F.tour = (F.tour || 0) + tourInc(f);
  const tot = G.order.reduce((s, o) => s + (Fa(o).alive ? wealth(o) : 0), 0);
  F.ecoT = wealth(f) >= 120 * G.len.k && wealth(f) * 2 >= tot ? (F.ecoT || 0) + 1 : 0;
  F.thr = F.thr || {};
  for (const [k, V] of Object.entries(VIC)) {
    if (!vicOn(k)) continue;
    const p = V.p(f);
    if (p >= .75 && !F.thr[k]) { F.thr[k] = 1; log(f, `Alerta: ${fname(f)} está perto da vitória de ${V.n.toLowerCase()}.`); if (f !== G.player && !G.auto) toast(`${fname(f)} está perto da vitória de ${V.n.toLowerCase()}!`); }
    if (p >= 1 && G.round >= vicMin()) return endGame(f, k);
  }
}
// rodada: favor do Congresso e o relógio ecológico
function vicRound() {
  const w = worldPol(); G.green = w <= 6 && greenLead() ? (G.green || 0) + 1 : 0;
}
const threatOf = f => Fa(f).hold > 0 || Object.keys(Fa(f).thr || {}).length > 0;
function vicModal() {
  const me = G.player, fs = G.order.filter(f => Fa(f).alive && Fa(f).entered);
  const rows = Object.entries(VIC).filter(([k]) => vicOn(k)).map(([k, V]) => {
    const lead = fs.slice().sort((a, b) => V.p(b) - V.p(a))[0], pm = V.p(me), pl = lead ? V.p(lead) : 0;
    return `<div class="tech"><div><b>${esc(V.n)}</b> <span class="hint">${esc(V.fx)}</span><p>Você ${pbar(pm, 1)} ${Math.round(100 * pm)}%${lead && lead !== me ? ` · líder ${esc(fname(lead))} ${Math.round(100 * pl)}%` : ''}</p></div></div>`;
  }).join('');
  modal(`<h2>Vitórias</h2><p class="hint">Além de dominação, objetivo e legado, há estas vitórias. Nenhuma delas vale antes da rodada ${vicMin()}. Quem passa de 75% de alguma vira alvo: todos recebem um alerta e as outras facções gostam menos dela.</p><div class="techs">${rows}</div>`, [['Fechar']]);
}
// ---------- parte 14: modo Civilização, gerador de mundo (MC-01 a MC-08, MC-14 a MC-16) ----------
// tudo sai de uma semente: o mesmo código gera o mesmo mundo
const CIV_SIZE = { p: { n: 'Pequeno', t: 40, f: 4 }, m: { n: 'Médio', t: 70, f: 6 }, g: { n: 'Grande', t: 110, f: 8 }, e: { n: 'Enorme', t: 160, f: 10 } };
const CIV_TYPE = { cont: 'Continentes', pan: 'Pangeia', arq: 'Arquipélago', mar: 'Mar interior' };
const CIV_START = { ant: 'Antiguidade', med: 'Idade Média', pol: 'Idade Moderna' };
const CIV_CUL = { agr: ['Agrícola', 'recrutador'], mar: ['Marítima', 'almirante'], nom: ['Nômade', 'tatico'], mon: ['Montanhesa', 'tenaz'] };
function seeded(s) { let a = s >>> 0; return () => { a = a + 0x6D2B79F5 >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const SYL = ['ar', 'ba', 'ca', 'do', 'el', 'fa', 'gor', 'ha', 'ir', 'ja', 'ka', 'lu', 'ma', 'no', 'or', 'pa', 'que', 'ra', 'sa', 'ta', 'ur', 'va', 'xi', 'za', 'ben', 'cor', 'dal', 'mir', 'nar', 'tor', 'vel', 'sol', 'mon', 'rin', 'tal', 'ves'];
function civName(R, used) {
  for (;;) { const n = 2 + Math.floor(R() * 2); let s = ''; for (let k = 0; k < n; k++) s += SYL[Math.floor(R() * SYL.length)]; s = s[0].toUpperCase() + s.slice(1); if (!used.has(s) && s.length <= 10) { used.add(s); return s; } }
}
// MC-03: células de Voronoi por recorte de semiplanos; cada aresta lembra o vizinho que a criou
function voronoi(pts, w, h, r2) {
  return pts.map((p, i) => {
    let poly = [[0, 0, -1], [w, 0, -1], [w, h, -1], [0, h, -1]]; // [x, y, vizinho da aresta que começa aqui]
    for (let j = 0; j < pts.length; j++) {
      if (j === i) continue; const q = pts[j], dx = q[0] - p[0], dy = q[1] - p[1]; if (dx * dx + dy * dy > r2) continue;
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, side = v => (v[0] - mx) * dx + (v[1] - my) * dy; // > 0: lado de j
      const out = [];
      for (let k = 0; k < poly.length; k++) {
        const a = poly[k], b = poly[(k + 1) % poly.length], sa = side(a), sb = side(b);
        if (sa <= 0) out.push(a);
        if ((sa <= 0) !== (sb <= 0)) { const t = sa / (sa - sb); out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), sa <= 0 ? j : a[2]]); }
      }
      poly = out; if (!poly.length) break;
    }
    return poly;
  });
}
function civMap(o) {
  const R = seeded(o.seed), S = CIV_SIZE[o.size], w = 1000, h = 620, frac = { cont: .45, pan: .55, arq: .3, mar: .55 }[o.type];
  const tot = Math.round(S.t / frac), sp = Math.sqrt(w * h / tot), cols = Math.round(w / sp), rows = Math.round(h / sp), pts = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) pts.push([(c + .5 + (R() - .5) * .8) * w / cols, (r + .5 + (R() - .5) * .8) * h / rows]);
  const cells = voronoi(pts, w, h, (3 * sp) ** 2);
  const nbr = cells.map((poly, i) => [...new Set(poly.map(v => v[2]).filter(j => j >= 0))]);
  // MC-02: forma das terras por manchas em volta de centros sorteados
  const nc = { cont: 3, pan: 1, arq: 8, mar: 1 }[o.type], C = o.type === 'mar' ? [[w / 2, h / 2, .75 * w]] : Array.from({ length: nc }, () => [w * (.15 + .7 * R()), h * (.2 + .6 * R()), (o.type === 'arq' ? .12 : o.type === 'cont' ? .3 : .55) * w]);
  const noise = pts.map(() => R());
  const sc = pts.map((p, i) => { let v = Math.max(...C.map(([x, y, rr]) => 1 - Math.hypot(p[0] - x, (p[1] - y) * 1.4) / rr)); if (o.type === 'mar') v -= Math.max(0, .6 - Math.hypot(p[0] - w / 2, (p[1] - h / 2) * 1.4) / (.18 * w)); const e = p[0] < sp || p[0] > w - sp || p[1] < sp || p[1] > h - sp ? -1 : 0; return v + .35 * noise[i] + e; });
  const land = new Set(sc.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, S.t).map(x => x[1]));
  const L = [...land].sort((a, b) => pts[a][1] - pts[b][1] || pts[a][0] - pts[b][0]), ix = new Map(L.map((c, k) => [c, k]));
  const adj = [], sea = [], seen = new Set();
  L.forEach((c, a) => nbr[c].forEach(d => { if (ix.has(d) && a < ix.get(d)) adj.push([a, ix.get(d)]); }));
  // travessias: duas terras que tocam a mesma célula de mar e estão perto
  L.forEach((c, a) => nbr[c].filter(d => !land.has(d)).forEach(s => nbr[s].forEach(d => {
    const b = ix.get(d); if (b == null || b === a || nbr[c].includes(d)) return; const k = Math.min(a, b) + ':' + Math.max(a, b);
    if (!seen.has(k)) { seen.add(k); sea.push([Math.min(a, b), Math.max(a, b), 0]); }
  })));
  // ilhas soltas: liga ao território mais próximo pelo mar
  const comp = Array(L.length).fill(-1); let nComp = 0;
  const nb2 = L.map(() => []); adj.concat(sea).forEach(([a, b]) => { nb2[a].push(b); nb2[b].push(a); });
  for (let s = 0; s < L.length; s++) if (comp[s] < 0) { const q = [s]; comp[s] = nComp; for (let k = 0; k < q.length; k++) for (const j of nb2[q[k]]) if (comp[j] < 0) { comp[j] = nComp; q.push(j); } nComp++; }
  for (let c = 1; c < nComp; c++) { let best = null; L.forEach((x, a) => { if (comp[a] !== c) return; L.forEach((y, b) => { if (comp[b] === c) return; const d = Math.hypot(pts[x][0] - pts[y][0], pts[x][1] - pts[y][1]); if (!best || d < best[2]) best = [a, b, d]; }); }); if (best) { sea.push([Math.min(best[0], best[1]), Math.max(best[0], best[1]), 0]); const old = comp[best[0]]; comp.forEach((v, k) => { if (v === old) comp[k] = comp[best[1]]; }); } }
  // MC-03: regiões de 4 a 8 territórios vizinhos por terra
  const nbL = L.map(() => []); adj.forEach(([a, b]) => { nbL[a].push(b); nbL[b].push(a); });
  // travessia só onde por terra o caminho é longo (evita atalhos sobre baías pequenas)
  const near3 = (a, b) => { let fr = [a]; const sn = new Set([a]); for (let s = 0; s < 3; s++) { fr = fr.flatMap(x => nbL[x].filter(y => !sn.has(y) && sn.add(y))); if (sn.has(b)) return true; } return false; };
  for (let k = sea.length - 1; k >= 0; k--) if (near3(sea[k][0], sea[k][1])) sea.splice(k, 1);
  const reg = Array(L.length).fill(-1); let nr = 0;
  for (let s = 0; s < L.length; s++) if (reg[s] < 0) { const want = 4 + Math.floor(R() * 5), q = [s]; reg[s] = nr; for (let k = 0; k < q.length && q.length < want; k++) for (const j of nbL[q[k]]) if (reg[j] < 0 && q.length < want) { reg[j] = nr; q.push(j); } nr++; }
  const size = Array(nr).fill(0); reg.forEach(r => size[r]++);
  reg.forEach((r, a) => { if (size[r] < 3) { const j = nbL[a].find(j => size[reg[j]] >= 3); if (j != null) { size[r]--; reg[a] = reg[j]; size[reg[j]]++; } } });
  const used = [...new Set(reg)], rmap = new Map(used.map((r, k) => [r, k])), names = new Set();
  const regions = used.map(() => civName(R, names));
  const terr = L.map((c, a) => {
    const poly = cells[c], d = 'M' + poly.map(v => v[0].toFixed(1) + ' ' + v[1].toFixed(1)).join('L') + 'Z';
    return { n: civName(R, names), r: rmap.get(reg[a]), d, x: +pts[c][0].toFixed(1), y: +pts[c][1].toFixed(1) };
  });
  // MC-04 e MC-05: clima pela latitude, relevo por ruído suavizado, rios perto das serras
  const el = L.map((c, a) => (noise[c] + nbL[a].reduce((s, b) => s + noise[L[b]], 0)) / (1 + nbL[a].length));
  const elS = el.slice().sort((a, b) => b - a), mT = elS[Math.floor(L.length * .1)], hT = elS[Math.floor(L.length * .24)];
  const coast = L.map((c, a) => nbr[c].some(d => !land.has(d)));
  const geo = {}, POOL = { p: ['tri', 'arr', 'mil', 'alg', 'acu', 'vin'], c: ['tri', 'gad', 'cav', 'tab', 'caf'], f: ['mad', 'pel'], s: ['esp', 'caf', 'acu', 'mad'], h: ['ped', 'cob', 'fer', 'est', 'car', 'pra', 'sal'], m: ['ped', 'fer', 'our', 'gem', 'car', 'sli', 'cob'], d: ['inc', 'sal', 'pet', 'gem'], e: ['cav', 'gad', 'pet'], t: ['pel', 'pet', 'fer'], w: ['arr', 'pei'] };
  const ter = L.map((c, a) => {
    const lat = Math.abs(pts[c][1] / h - .5) * 2, r = R();
    if (el[a] >= mT) return 'm'; if (el[a] >= hT) return 'h';
    if (lat > .82) return 't'; if (lat < .25) return r < .5 ? 's' : r < .75 ? 'f' : 'p';
    if (lat > .35 && lat < .6 && !coast[a] && r < .45) return 'd';
    return r < .3 ? 'p' : r < .55 ? 'c' : r < .75 ? 'f' : r < .9 ? 'e' : 'w';
  });
  L.forEach((c, a) => {
    const t = ter[a], riv = 'mhd'.includes(t) ? false : nbL[a].some(b => 'mh'.includes(ter[b])) && R() < .55, dep = [];
    const pool = POOL[t].concat(coast[a] ? ['pei', 'per'] : []);
    if (R() < .7) dep.push(pool[Math.floor(R() * pool.length)]); if (R() < .25) { const d = pool[Math.floor(R() * pool.length)]; if (!dep.includes(d)) dep.push(d); }
    geo[terr[a].n] = t + (riv ? 'r' : '') + (dep.length ? ' ' + dep.join(',') : '');
  });
  return { m: { w, h, regions, terr, adj, sea, credit: `Mundo gerado · semente ${o.seed}` }, geo, ter, nbL, coast, R };
}
// MC-10, MC-14 a MC-16: facções geradas, tribos, ruínas e maravilhas naturais
const CIV_C = ['#c8443a', '#3f6fd1', '#d6b33a', '#3f9a6b', '#8a6bbf', '#c86f3a', '#5fae9a', '#b8892f', '#d16aa0', '#7f95a3'];
const CIV_FORM = ['Reino de', 'Império de', 'Confederação de', 'Povo de', 'República de', 'Sultanato de', 'Clãs de'];
function civScenario(o) {
  const W = civMap(o), { m, R } = W, N = m.terr.length, S = CIV_SIZE[o.size], d2 = (a, b) => Math.hypot(m.terr[a].x - m.terr[b].x, m.terr[a].y - m.terr[b].y);
  // capitais longe umas das outras, em terra boa (MC-06)
  const good = m.terr.map((t, i) => i).filter(i => 'pcfeh'.includes(W.ter[i]) && W.nbL[i].length >= 2), caps = [good[Math.floor(R() * good.length)]];
  while (caps.length < S.f) caps.push(good.filter(i => !caps.includes(i)).sort((a, b) => Math.min(...caps.map(c => d2(b, c))) - Math.min(...caps.map(c => d2(a, c))))[0]);
  // cada capital tem por perto um luxo, um estratégico antigo e terra boa
  caps.forEach(c => { const g = m.terr[c].n, s = W.geo[g].split(' '); const ds = new Set((s[1] || '').split(',').filter(Boolean)); ['tri', 'cav'].forEach(d => ds.add(d)); W.geo[g] = 'p' + (s[0].includes('r') ? 'r' : '') + ' ' + [...ds].join(','); const n = W.nbL[c][0]; const gn = m.terr[n].n, sn = W.geo[gn].split(' '); W.geo[gn] = sn[0] + ' ' + [...new Set((sn[1] || '').split(',').filter(Boolean).concat(['fer', R() < .5 ? 'vin' : 'esp']))].join(','); W.ter[c] = 'p'; });
  const used = new Set(m.terr.map(t => t.n).concat(m.regions)), cul = Object.keys(CIV_CUL);
  const f = caps.map((c, k) => {
    const nm = civName(R, used), cu = o.cul && k === 0 ? o.cul : cul[Math.floor(R() * cul.length)];
    return { id: 'c' + k, n: `${CIV_FORM[Math.floor(R() * CIV_FORM.length)]} ${nm}`, c: CIV_C[k], L: civName(R, used) + ' ' + ['I', 'o Velho', 'o Sábio', 'a Grande', 'II'][Math.floor(R() * 5)], ab: CIV_CUL[cu][1], cul: cu, cap: m.terr[c].n, tr: 3, st: 60, nav: cu === 'mar' ? 2 : 1, t: [m.terr[c].n], obj: { n: Math.ceil(N * .4) } };
  });
  const far = i => Math.min(...caps.map(c => d2(i, c)));
  const free = m.terr.map((t, i) => i).filter(i => !caps.includes(i) && !caps.some(c => W.nbL[c].includes(i)));
  const pick = n => { const out = []; for (let k = 0; k < n && free.length; k++) out.push(free.splice(Math.floor(R() * free.length), 1)[0]); return out; };
  const tribes = pick(Math.round(N * .1)), ruins = pick(Math.max(3, Math.round(N / 12))), nat = pick(Math.max(2, Math.round(N / 20)));
  return {
    id: 'civ', map: 'civ', era: 'Civilização', tech: o.era || 'ant', yr: -3000, y: 'mundo gerado', n: 'Modo Civilização', turns: 30, civ: o,
    d: `Mapa aleatório (${S.n.toLowerCase()}, ${CIV_TYPE[o.type].toLowerCase()}), semente ${o.seed}. Cada povo começa com uma aldeia; o resto é ermo a explorar e povoar. Funde aldeias, encontre ruínas, enfrente tribos e chegue ao futuro próximo.`,
    neu: 0, f, ev: [], rebels: tribes.map(i => [m.terr[i].n, 2 + Math.floor(R() * 2), 'Tribo ' + civName(R, used)]),
    ruins: ruins.map(i => m.terr[i].n), nat: nat.map(i => m.terr[i].n), _m: m, _geo: W.geo,
  };
}
// ---------- parte 14: modo Civilização em jogo (MC-07, MC-10 a MC-16, MC-21, MC-22, S-26, F-17, E-01 a E-07, IA-09) ----------
let civOpt = { seed: 2026, size: 'm', type: 'cont', era: 'ant' };
function civSetup(o) {
  civOpt = { ...civOpt, ...o }; const sc = civScenario(civOpt);
  MAPS.civ = sc._m; GEO.civ = sc._geo; delete sc._m; delete sc._geo;
  const k = SCEN.findIndex(s => s.id === 'civ'); if (k >= 0) SCEN[k] = sc; else SCEN.push(sc);
  return sc;
}
// IA-09: agenda do líder, visível no motivo da relação
const AGENDA = {
  mar: ['admira maravilhas', (a, b) => wwCount(b) ? 10 : 0], exr: ['teme exércitos grandes', (a, b) => power(b) > 1.3 * power(a) ? -10 : 0],
  paz: ['aprecia quem vive em paz', (a, b) => Fa(b).ww ? -5 : 8], cie: ['respeita a ciência', (a, b) => Fa(b).tech.length > Fa(a).tech.length ? 8 : 0],
};
const agendaRel = (a, b) => { const A = Fa(a).agenda && AGENDA[Fa(a).agenda]; if (!A) return null; const v = A[1](a, b); return v ? [`agenda: ${A[0]}`, v] : null; };
function civInit() {
  for (const f of G.order) { const F = Fa(f); G.lv[F.capI] = Math.max(2, G.lv[F.capI] - 1); F.agenda = Object.keys(AGENDA)[Math.floor(rnd() * 4)]; F.nFund = 0; }
  G.seen = new Set(); civSee();
}
// MC-11: névoa de guerra do jogador; satélites (K-113) revelam tudo
function civSee() {
  if (!G.seen) return; const me = G.player;
  if (real(me) && has(me, 'sat')) { for (let i = 0; i < G.N; i++) G.seen.add(i); return; }
  owned(me).forEach(i => { G.seen.add(i); G.A[i].forEach(j => G.seen.add(j)); });
}
// MC-12, MC-13, S-26: fundar aldeia (gasta 1 nível de uma cidade vizinha) ou posto avançado (só ouro)
const fundCost = (f, post) => (post ? 6 : 3) + 2 * (Fa(f).nFund || 0);
function civFound(f, j, post) {
  const F = Fa(f); if (!G.sc.civ) return 'Só no modo Civilização.';
  if (G.own[j] !== 'neu' || csOf(j) || G.tr[j] > 0) return 'Escolha um ermo vazio.';
  const src = G.A[j].filter(i => G.own[i] === f && (post || G.lv[i] >= 2)).sort((a, b) => G.lv[b] - G.lv[a])[0];
  if (src == null) return post ? 'O ermo precisa ser vizinho de um território seu.' : 'Precisa de uma vila ou cidade sua ao lado para mandar colonos.';
  if (F.gold < fundCost(f, post)) return 'Ouro insuficiente.';
  if (!spend(f)) return 'Sem pontos de ação.';
  F.gold -= fundCost(f, post); F.nFund = (F.nFund || 0) + 1; if (!post) G.lv[src]--;
  G.own[j] = f; G.tr[j] = 1; G.lv[j] = 1; G.food[j] = 0; G.cul[j] = f; G.occ[j] = 0;
  log(f, `${fname(f)} ${post ? 'ergue um posto avançado' : 'funda uma aldeia'} em ${tname(j)}.`); civTake(f, j, 'neu'); return '';
}
// MC-14 e MC-15: tribo destruída dá ouro; ruína dá um prêmio a quem chega primeiro
function civTake(f, j, d) {
  const F = Fa(f);
  if (d === 'reb' && /^Tribo/.test(G.rl[j] || '')) { F.gold += 6; log(f, `${fname(f)} dispersa a tribo de ${tname(j)} (+6 ouro).`); }
  if (!G.ruin.has(j)) return; G.ruin.delete(j);
  const r = Math.floor(rnd() * 4), t = TECH.filter(t => !t.doc && techOk(f, t) && !has(f, t.k)).sort((a, b) => a.cost - b.cost)[0];
  if (r === 1 && t) { F.tech.push(t.k); log(f, `Nas ruínas de ${tname(j)}, ${fname(f)} aprende ${tName(t.k)}.`); }
  else if (r === 2) { G.tr[j] += 2; log(f, `Sobreviventes das ruínas de ${tname(j)} se juntam a ${fname(f)} (+2 tropas).`); }
  else if (r === 3 && f === G.player && G.seen) { G.m.terr.forEach((t, i) => { if (t.r === G.m.terr[j].r) G.A[i].concat(i).forEach(k => G.seen.add(k)); }); F.gold += 4; log(f, `Mapas antigos nas ruínas de ${tname(j)} revelam a região.`); }
  else { F.gold += 12; log(f, `${fname(f)} acha um tesouro nas ruínas de ${tname(j)} (+12 ouro).`); }
  F.gp = F.gp || {}; F.gp.exp = (F.gp.exp || 0) + 5; // F-17
}
// E-01 a E-07: o mundo muda de era com a tecnologia mais avançada; tribos viram cidades-estado
const CIV_ERA = ['ant', 'med', 'pol', 'w1', 'w2', 'gf', 'gf', 'gf'];
function civRound() {
  const e = Math.max(0, ...G.order.filter(f => Fa(f).alive).flatMap(f => Fa(f).tech.map(k => TK[k] ? TK[k].e : 0)));
  const k = CIV_ERA[Math.max(ERA_LV[G.sc.tech] ?? 0, e)];
  if (ERA[k] && G.era !== ERA[k]) { G.era = ERA[k]; G.air = airOf({ tech: k }); log(null, `O mundo entra em: ${ERA[k].n}.`); if (G.round > 1) eraCrisis(); }
  for (let i = 0; i < G.N; i++) if (G.own[i] === 'reb' && /^Tribo/.test(G.rl[i] || '') && rnd() < .015) {
    G.own[i] = 'neu'; G.tr[i] = Math.max(4, G.tr[i]); G.cs[i] = { t: Object.keys(CS)[i % 6], inf: {}, mis: Object.keys(MIS)[i % 3] }; log(null, `A tribo de ${tname(i)} se assenta e vira cidade-estado.`);
  }
  civSee();
}
// MC-21: calendário que corre rápido na Antiguidade e devagar no fim
const civYear = () => { const p = Math.min(1, (G.round - 1) / Math.max(1, G.rounds - 1)), y0 = { ant: -3000, med: 600, pol: 1500 }[G.sc.tech] ?? -3000, y = Math.round(y0 + (2025 - y0) * Math.pow(p, .6)); return y < 0 ? `${-y} a.C.` : `${y} d.C.`; };
function aiCiv(f) {
  const F = Fa(f); if (!G.sc.civ) return;
  for (let n = 0; n < 2 && F.pa > 1; n++) {
    const c = G.own.map((o, j) => j).filter(j => G.own[j] === 'neu' && !csOf(j) && !G.tr[j] && G.A[j].some(i => G.own[i] === f));
    const best = c.sort((a, b) => (G.ruin.has(b) * 3 + G.dep[b].length + G.nat.has(b) * 2) - (G.ruin.has(a) * 3 + G.dep[a].length + G.nat.has(a) * 2))[0];
    if (best == null || (civFound(f, best, false) && civFound(f, best, true))) break;
  }
}
function civOptsHtml() {
  const b = (k, v, t) => `<button class="mini ${civOpt[k] === v ? 'pri' : ''}" data-a="civo" data-k="${k}" data-v="${v}">${t}</button>`;
  return `<p><b>Mundo:</b> ${Object.entries(CIV_SIZE).map(([k, s]) => b('size', k, `${s.n} (${s.t}, ${s.f} povos)`)).join(' ')}</p><p>${Object.entries(CIV_TYPE).map(([k, n]) => b('type', k, n)).join(' ')}</p>
    <p><b>Começo:</b> ${Object.entries(CIV_START).map(([k, n]) => b('era', k, n)).join(' ')}</p>
    <p><b>Semente:</b> <input id="civSeed" value="${civOpt.seed}" inputmode="numeric" size="8"> <button class="mini" data-a="civs">Usar</button> <button class="mini" data-a="civr">Sortear</button> <span class="hint">o mesmo código gera o mesmo mundo</span></p>`;
}
civSetup({});
// ---------- parte 15: acabamento (UI-09 a UI-14, E-35, crises de era, S-23, T-21) ----------
// UI-11: bônus de ataque (o mesmo do combate) e chance de vencer atacando até o fim
function atkBonus(i, j) {
  const a = G.own[i], A = Fa(a), aw = armyOf(a), dw = armyOf(G.own[j]), hc = OPEN.includes(G.ter[j]) && (aw.includes('cav') || aw.includes('kni')) && !dw.includes('lin');
  return armyAtk(aw, j) + (hc ? 1 : 0) + ((G.win[i] || 0) >= (pol(a, 'dis') ? 2 : 3) ? 1 : 0) + (prin(i, 'gue') && G.fai[j] !== G.fai[i] ? 1 : 0) + genBonus(a, i) + (A.ofs ? 1 : 0) + (G.bld[i].some(k => STRUCT[k].atk && nb(i, k)) ? 1 : 0) + (A.camp && hasW(a, 'csg') ? 1 : 0) + ldCB(a, j, 'atk');
}
function odds(i, j) { // ponytail: 300 simulações com Math.random, sem empates táticos nem canhão
  const [ad0] = diceFor(i, j), cap = ad0 < Math.min(3, G.tr[i] - 1) ? ad0 : 3, up = atkBonus(i, j), db = defBonus(j, i), d6r = () => 1 + Math.floor(Math.random() * 6);
  let win = 0;
  for (let n = 0; n < 300; n++) {
    let a = G.tr[i], d = G.tr[j];
    while (a > 1 && d > 0) {
      const R = Array.from({ length: Math.min(cap, a - 1) }, d6r).sort((x, y) => y - x), D = Array.from({ length: Math.min(3, d) }, d6r).sort((x, y) => y - x);
      R[0] = Math.min(6, R[0] + up); D[0] = Math.min(6, D[0] + db);
      for (let k = 0; k < Math.min(R.length, D.length); k++) R[k] > D[k] ? d-- : a--;
    }
    if (d <= 0) win++;
  }
  return win / 300;
}
// UI-14: pontos de cada facção a cada rodada, para o gráfico do fim
function histPush() { G.hist = G.hist || []; G.hist.push(G.order.reduce((o, f) => (o[f] = Fa(f).alive ? score(f) : null, o), {})); }
function histChart() {
  const H = G.hist || []; if (H.length < 2) return '';
  const vals = H.flatMap(h => Object.values(h).filter(v => v != null)), lo = Math.min(0, ...vals), hi = Math.max(1, ...vals), W = 560, Hh = 160;
  const x = k => (k / (H.length - 1) * W).toFixed(1), y = v => (Hh - (v - lo) / (hi - lo) * Hh).toFixed(1);
  const lines = G.order.filter(f => Fa(f).entered).map(f => `<polyline fill="none" stroke="${Fa(f).c}" stroke-width="2" points="${H.map((h, k) => h[f] == null ? '' : x(k) + ',' + y(h[f])).filter(Boolean).join(' ')}"/>`).join('');
  return `<h4>Pontos ao longo da partida</h4><svg class="hist" viewBox="-4 -4 ${W + 8} ${Hh + 8}" role="img" aria-label="Gráfico de pontos por facção"><line x1="0" y1="${y(0)}" x2="${W}" y2="${y(0)}" stroke="#ffffff22"/>${lines}</svg><p class="hint">Da rodada 1 à ${H.length}. As cores são as da tabela.</p>`;
}
const KEY_EV = /vence|perto da vitória|eliminad|perde a capital|Congresso Mundial:|O mundo entra|maravilha|funda a fé|surge em|Revolta|crise|Crise|Acidente|Era de ouro|era de ouro|sombria|heroica/;
const timeline = () => G.log.filter(l => KEY_EV.test(l[1])).slice(0, 12).reverse().map(l => `<li><b>${l[2]}</b> ${esc(l[1])}</li>`).join('');
// UI-09: o que aconteceu desde o seu último turno
const news = () => { const me = G.player; return G.log.filter(l => l[2] >= G.round - 1 && l[0] !== me && (l[0] == null || KEY_EV.test(l[1]) || /você|sua|seu/i.test(l[1]) || owned(me).some(i => l[1].includes(tname(i))))).slice(0, 5); };
// UI-12: dica curta na primeira vez que cada sistema abre
const TIPS = {
  routes: 'Comércio: rotas rendem ouro e trazem bens para a sua rede. Cada mercado, porto ou banco permite uma rota.',
  dipl: 'Diplomacia: propostas não gastam ação. Passe o mouse num botão para ver se a facção aceita e por quê.',
  govm: 'Governo: a cultura compra cívicas; cada cívica libera governos e políticas, e o governo define quantas políticas cabem.',
  figm: 'Personagens: grandes figuras nascem das construções certas. Use quando quiser; espiões ficam no painel do território inimigo.',
  vicm: 'Vitórias: acompanhe aqui quem está perto de vencer. Quem passa de 75% vira alvo de todos.',
  catalog: 'Catálogo: tudo o que existe para construir, com o que cada obra exige. As obras que cabem agora aparecem no painel de ações.',
  techs: 'Tecnologias: escolher a pesquisa não gasta ação. O saber de cada turno vai para ela sozinho.',
};
function tipOnce(k) {
  if (!TIPS[k] || !G || G.auto) return;
  try { const s = JSON.parse(localStorage.getItem('sob_tips') || '{}'); if (s[k]) return; s[k] = 1; localStorage.setItem('sob_tips', JSON.stringify(s)); } catch (e) { return; }
  toast(TIPS[k]);
}
// T-21: mercado mundial (modo Civilização). Bem raro custa mais; a compra vale 5 turnos
const mktPrice = d => { const n = G.order.filter(f => Fa(f).alive && real(f) && goodsAll(f).has(d)).length; return Math.round((DEP[d].mk ? 10 : 6) * (1 + 1.5 / (1 + n))); };
function buyGood(f, d) {
  const F = Fa(f), p = mktPrice(d); if (!G.sc.civ) return 'Mercado mundial só no modo Civilização.';
  if (!G.order.some(o => o !== f && Fa(o).alive && real(o) && goodsAll(o).has(d))) return 'Ninguém produz esse bem para vender.';
  if (F.gold < p) return 'Ouro insuficiente.';
  F.gold -= p; F.buy = F.buy || {}; F.buy[d] = G.round + 5; log(f, `${fname(f)} compra ${DEP[d].n.toLowerCase()} no mercado mundial por ${p} ouro.`); return '';
}
const bought = f => { const b = Fa(f).buy || {}; return Object.keys(b).filter(d => b[d] >= G.round); };
// S-23: classes sociais (modo Civilização). Cada classe grande cobra o que precisa
function classes(f) {
  const n = { cam: 0, art: 0, mer: 0, eru: 0 }, Z = { agr: 'cam', pec: 'cam', pes: 'cam', flo: 'cam', min: 'art' };
  owned(f).forEach(i => G.bld[i].forEach(k => { const S = STRUCT[k]; if (S.z && Z[S.z]) n[Z[S.z]]++; else if (['ofi', 'fab', 'fun', 'zin'].includes(k)) n.art++; else if (['mer', 'ban', 'por', 'bol'].includes(k)) n.mer++; else if (['aca', 'uni', 'lab', 'bib'].includes(k)) n.eru++; }));
  return n;
}
function classHap(f) {
  if (!G.sc.civ || !real(f)) return 0; const c = classes(f);
  return -(c.eru >= 3 && !countB(f, 'uni') ? 1 : 0) - (c.mer >= 3 && !myRoutes(f).length ? 1 : 0) - (c.art >= 3 && luxOf(f) < 2 ? 1 : 0) - (c.cam >= 6 && !countB(f, 'tem') ? 1 : 0);
}
// crises de era (modo Civilização): na virada de era, uma crise de 10 rodadas para todos
function eraCrisis() {
  const alive = G.order.filter(f => Fa(f).alive && real(f)), k = ['queda', 'inv', 'pet'][Math.floor(rnd() * (G.era === ERA.w1 || G.era === ERA.w2 || G.era === ERA.gf ? 3 : 2))];
  G.crise = { k, u: G.round + 10 };
  if (k === 'queda') { alive.sort((a, b) => owned(b).length - owned(a).length).slice(0, 2).forEach(f => { Fa(f).stab = Math.max(0, Fa(f).stab - 15); }); log(null, 'Crise de era: queda de impérios. Os maiores perdem estabilidade.'); }
  if (k === 'inv') { const e = G.own.map((o, i) => i).filter(i => G.own[i] === 'neu' && !csOf(i)).sort(() => rnd() - .5).slice(0, 3); e.forEach(i => { G.own[i] = 'reb'; G.tr[i] = 4; G.rl[i] = 'Tribo invasora'; }); log(null, `Crise de era: invasões em ondas${e.length ? ' em ' + e.map(tname).join(', ') : ''}.`); }
  if (k === 'pet') log(null, 'Crise de era: crise do petróleo. Quem não tem petróleo nem combustível perde 15% do ouro por 10 rodadas.');
  if (!G.auto) toast(G.log[0][1]);
}
// UI-12: guia em camadas. Primeiro o turno básico; depois comércio, diplomacia, governo e vitórias
const GUIDE = [
  [['ref', 'Posicione os reforços clicando nos seus territórios'], ['camp', 'Em Ações, declare campanha (não custa nada) para poder atacar'], ['atk', 'Clique num território seu e depois num vizinho inimigo'], ['obra', 'Clique num território seu e ponha uma obra na fila'], ['res', 'Escolha uma pesquisa'], ['end', 'Encerre o turno']],
  [['routes', 'Abra Comércio e veja onde cabem rotas'], ['dipl', 'Abra Diplomacia e veja o que cada facção aceita'], ['govm', 'Abra Governo e fé'], ['vicm', 'Abra Vitórias e veja quem está perto de vencer']],
  [['lens', 'Troque a lente do mapa (Relevo, Terreno, Recursos…) e leia a legenda'], ['empire', 'Numa região sua, abra o Rendimento da região e depois o Resumo do império'], ['techs', 'Abra a Árvore de tecnologias e veja o que está por descobrir'], ['sup', 'Numa região sua, abra Abastecimento e mande comida ou produção a outra']],
];
let guideLv = (() => { try { return +(localStorage.getItem('sob_guia') || 0); } catch (e) { return 9; } })();
const guideSet = v => { guideLv = v; try { localStorage.setItem('sob_guia', String(v)); } catch (e) { } };
function guideDone(k) {
  const me = G.player, F = Fa(me), g = G.guide || (G.guide = {}); if (g[k]) return true;
  const ok = k === 'ref' ? G.turnF === me && G.phase !== 'ref' : k === 'camp' ? !!F.camp : k === 'obra' ? owned(me).some(i => G.q[i].length) : k === 'res' ? !!F.res : k === 'end' ? G.round > 1 : false;
  if (ok) g[k] = 1; return ok;
}
function guideHtml() {
  if (!G || G.auto || G.over || !G.player || guideLv >= GUIDE.length) return '';
  const st = GUIDE[guideLv].map(([k, t]) => [guideDone(k), t]);
  if (st.every(s => s[0])) { guideSet(guideLv + 1); toast(guideLv < GUIDE.length ? 'Guia: próxima etapa liberada.' : 'Guia concluído. Bom jogo!'); return guideHtml(); }
  return `<div class="guide"><b>Guia · etapa ${guideLv + 1} de ${GUIDE.length}</b> <button class="mini" data-a="guidex">Ocultar guia</button><ul>${st.map(([ok, t]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✓' : '○'} ${t}</li>`).join('')}</ul></div>`;
}
const mktHtml = me => { const g = goods(me), L = Object.keys(DEP).filter(d => !g.has(d) && G.order.some(o => o !== me && Fa(o).alive && real(o) && goodsAll(o).has(d))); return `<h4>Mercado mundial</h4><p class="hint">Compre o acesso a um bem por 5 turnos. O preço sobe quando poucos produzem.</p><p>${L.map(d => `<button class="mini" data-a="buy" data-d="${d}" ${Fa(me).gold >= mktPrice(d) ? '' : 'disabled'}>${DEP[d].ic} ${esc(DEP[d].n)} ${mktPrice(d)}💰</button>`).join(' ') || 'Nada à venda agora.'}</p>${bought(me).length ? `<p class="hint">Comprado: ${bought(me).map(d => DEP[d].n).join(', ')}</p>` : ''}`; };
const coloPair = f =>{ for (const i of owned(f).filter(i => G.lv[i] >= 3).sort((a, b) => G.lv[b] - G.lv[a])) { const j = G.A[i].find(j => G.own[j] === f && G.lv[j] === 1 && !occupied(j)); if (j != null) return [i, j]; } return null; };
const paOf = f => 99 || ECON.pa + agePA(f) + (has(f, 'adm') ? 1 : 0) + ({ rep: 1, abs: 1, dem: 2 }[gov(f)] || 0) + Math.min(2, Math.floor(owned(f).filter(i => G.lv[i] >= 3).length / 3)); // S-04
const troopCost = f => Math.max(1, Math.round(((has(f, 'con') ? 1 : ECON.troop) - (gov(f) === 'feu' ? 1 : 0)) * (pol(f, 'csc') ? .75 : 1))); // G-05, G-20
// ---------- obras em turnos (parte 2: P-01 a P-04, P-08, P-11) ----------
// pedra barateia muralhas, templos e maravilhas; madeira, portos, oficinas e quartéis (R-25, R-26)
const CHEAP = { ped: ['for', 'tem', 'mar', 'cas', 'cat', 'aqu'], mad: ['por', 'ofi', 'qua', 'pal', 'ser'] };
const STONE = ['for', 'tem', 'mon', 'pdr', 'cas', 'cat']; // Grandes Pirâmides (C-200)
const pCost = (f, k, i) => {
  const g = real(f) ? goods(f) : new Set(), c = Object.entries(CHEAP).some(([d, ks]) => ks.includes(k) && g.has(d)), p = STONE.includes(k) && hasW(f, 'pir');
  const t = i == null ? 1 : STRUCT[k].road ? ({ m: 2, w: 2, d: 1.5 }[G.ter[i]] || 1) : ({ m: 1.25, w: 1.25 }[G.ter[i]] || 1); // L-11; v26: relevo encarece obras
  const gv = (STRUCT[k].road && pol(f, 'est') ? .5 : 1) * (k === 'cas' && gov(f) === 'feu' ? .75 : 1) * (STRUCT[k].wonder && gov(f) === 'abs' ? .75 : 1) * (gov(f) === 'pce' && ['zin', 'zen'].includes(STRUCT[k].need) ? .75 : 1) * (STRUCT[k].wonder ? 1 - ldv(f, 'MV') / 100 : 1); // v40: LD-MV // G-10 // G-22, G-05, G-07
  return Math.round(STRUCT[k].pc * G.len.k * (has(f, 'eng') ? .75 : 1) * (c ? .75 : 1) * (p ? .75 : 1) * t * gv);
};
const qMax = f => has(f, 'adm') ? 5 : 3;
function prodOf(i) {
  return real(G.own[i]) ? Math.max(1, Math.round(yieldOf(i).prod * (govrAt(i) === 'int' ? 1.25 : 1) * (1 + G.bld[i].reduce((s, k) => s + (nb(i, k) && STRUCT[k].pm || 0), 0)) * (gov(G.own[i]) === 'ppu' ? 1.25 : 1))) : 0; // C-47, G-09 // F-03
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
  const p = prodOf(i) + supNet(i, 'prod'), f = G.own[i]; let acc = 0;
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
    let p = prodOf(i) + supNet(i, 'prod') + (G.q[i].length ? ldv(f, 'OB') : 0);
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
// v49 (UI-16): a influência vale para todo neutro ou rebelde que faça fronteira (terra ou mar) com qualquer território seu; a recusa diz o motivo
function inflWhy(f, j) {
  const o = G.own[j];
  if (o !== 'neu' && o !== 'reb') return 'Só territórios neutros ou rebeldes aderem por influência.';
  if (!G.A[j].some(i => G.own[i] === f)) return `${tname(j)} não faz fronteira com nenhum território seu.`;
  if (capOwner(j)) return 'Capitais não aderem por influência.';
  if (csOf(j) && suz(j) !== f) return `${tname(j)} é uma cidade-estado: só o suserano pode anexá-la. Mande enviados até virar suserano.`;
  if (Fa(f).pre < inflCost(f, j)) return `Prestígio insuficiente: ${tname(j)} custa ${inflCost(f, j)} ⭐ (tropas dele + 1) e você tem ${Fa(f).pre}.`;
  return '';
}
const canInfl = (f, j) => !inflWhy(f, j);
// v49: por que não dá para atacar j a partir de i ('' = pode)
function atkWhy(f, i, j) {
  if (G.own[i] !== f || !G.A[i].includes(j)) return 'Sem fronteira com um território seu.';
  const d = G.own[j];
  if (d === f) return 'O território já é seu.';
  if (!hostile(f, j)) return real(d) && allied(f, d) ? 'Aliado.' : 'Em trégua: rompa a trégua no painel de facções para atacar.';
  if (G.phase !== 'atk') return 'Ataques acontecem na fase de ações.';
  if (!Fa(f).camp) return 'Declare campanha para atacar.';
  if (G.tr[i] < 2) return `${tname(i)} precisa de 2 ou mais tropas para atacar.`;
  if (!seaOk(f, i, j)) return 'Sem frota disponível para atravessar o mar neste turno.';
  if (G.round === 1 && real(d) && Fa(d).capI === j) return 'Capitais ficam protegidas na 1ª rodada.';
  return canAtk(f, i, j) ? '' : 'Ataque indisponível agora.';
}
// v24: sem pontos de ação. Com chave, a ação só vale 1 vez por turno (festas, impostos, agitadores, espião, enviado)
const spend = (f, k) => { if (!k) return true; const U = Fa(f).used || (Fa(f).used = {}); if (U[k] === G.round) return false; U[k] = G.round; return true; };
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
    if (!F.bldOn) return 'Abra as obras primeiro (botão Ordenar obras).';
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
  if (a === 'camp') {
    if (F.camp) return 'A campanha já foi declarada.';
    F.camp = true; F.nC = (F.nC || 0) + 1; log(f, `${fname(f)} declara campanha militar.`);
  } else if (a === 'rec') {
    if (F.recOn) return 'O recrutamento já está aberto neste turno.';
    if (F.gold < troopCost(f)) return 'Ouro insuficiente.';
    spend(f); F.recOn = true;
  } else if (a === 'obras') {
    if (F.bldOn) return 'As obras já estão abertas neste turno.'; spend(f); F.bldOn = true;
  } else if (a === 'fest') {
    if (F.gold < ECON.fest) return 'Ouro insuficiente.';
    if (!spend(f, 'fest')) return 'Festividades só uma vez por turno.'; F.gold -= ECON.fest; F.stab = Math.min(100, F.stab + 15); F.ww = Math.max(0, F.ww - 3); F.festT = G.round + 2; if (G.food[F.capI] != null) G.food[F.capI] = Math.max(0, G.food[F.capI] - 5); // S-24
  } else if (a === 'colo') { // S-26: colonos saem de uma cidade e fazem crescer uma aldeia vizinha sua
    const p = coloPair(f); if (!p) return 'Precisa de uma cidade vizinha de uma aldeia sua.';
    if (F.gold < 3) return 'Ouro insuficiente.';
    spend(f); F.gold -= 3; G.lv[p[0]]--; G.lv[p[1]]++; log(f, `Colonos de ${tname(p[0])} fundam vila em ${tname(p[1])}.`);
  } else if (a === 'tax') {
    if (F.noTax >= G.round) return 'Você prometeu não cobrar impostos por alguns turnos.';
    if (!spend(f, 'tax')) return 'Impostos extraordinários só uma vez por turno.'; const g = Math.ceil(owned(f).length / 2); F.gold += g; F.stab = Math.max(0, F.stab - 8); F.taxT = G.round + 2;
    log(f, `${fname(f)} cobra impostos extraordinários (+${g} ouro).`);
  } else if (a === 'rota') {
    return openRoute(f, x, y);
  } else if (a === 'sup') {
    return openSup(f, x, y, 'food');
  } else if (a === 'trade') {
    if (F.tradeOn) return 'O comércio já está aberto neste turno.'; spend(f); F.tradeOn = true;
  } else if (a === 'infl') {
    if (!canInfl(f, x)) return inflWhy(f, x);
    spend(f); F.pre -= inflCost(f, x); G.own[x] = f; G.tr[x] = Math.max(1, Math.ceil(G.tr[x] / 2)); delete G.rl[x]; G.arr[x] = G.tr[x];
    log(f, `${tname(x)} adere a ${fname(f)} por influência política.`); checkWin();
  } else if (a === 'agit') {
    const o = G.own[x]; if (!real(o) || !hostile(f, x)) return 'Escolha um território de uma facção rival.';
    if (F.pre < ECON.agit) return 'Prestígio insuficiente.';
    if (!spend(f, 'agit' + o)) return 'Já há agitadores contra esta facção neste turno.'; F.pre -= ECON.agit; agitHit(o, pol(o, 'pol') ? 7 : 15); // G-31
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
const RT = { int: { n: 'Rota interna', ic: '🛒', g: 0 }, car: { n: 'Caravana', ic: '🐪', g: 2 }, mar: { n: 'Rota marítima', ic: '⛵', g: 3 }, oce: { n: 'Rota oceânica', ic: '🚢', g: 5 }, ole: { n: 'Oleoduto', ic: '🛢', g: 2 }, aer: { n: 'Rota aérea de carga', ic: '✈', g: 2 }, dig: { n: 'Rede digital', ic: '🌐', g: 0 } };
const rOk = r => ({ sup: () => true, int: () => nb(r.a, 'mer') && nb(r.b, 'mer'), car: () => nb(r.a, 'car'), mar: () => nb(r.a, 'por') && nb(r.a, 'arm') && nb(r.b, 'por'), oce: () => nb(r.a, 'cia') && nb(r.b, 'por'), ole: () => nb(r.a, 'rfn') && road(r.b) >= 2, aer: () => nb(r.a, 'apt') && nb(r.b, 'apt'), dig: () => has(r.f, 'net') && has(r.o, 'net') }[r.k])();
const routeMax = f => countB(f, 'mer') + countB(f, 'por') + countB(f, 'ban') + csBonus(f, 'por') + (gov(f) === 'rme' ? 1 : 0) + (Fa(f).rtB || 0); // T-11
const myRoutes = f => G.routes.filter(r => r.f === f && r.k !== 'sup'); // abastecimento não conta no limite de comércio
// v35 (plano v27): abastecimento leva a sobra de comida ou produção de uma região sua para outra,
// por terra (até 6 passos por regiões suas não ocupadas) ou por mar (porto nas duas pontas); ocupar o caminho corta a rota.
// A quantidade vem do rendimento próprio da origem (sem o que ela recebe), então não há cadeias nem ciclos.
RT.sup = { n: 'Abastecimento', ic: '🐂', g: 0 };
const CARGO = { food: '🍞 comida', prod: '⚒ produção' };
const supMax = f => 1 + Math.floor(settled(f).length / 4) + ldv(f, 'AB');
const supOf = f => G.routes.filter(r => r.k === 'sup' && r.f === f);
const supWay = (f, a, b) => landSteps(a, b, 6, j => G.own[j] === f && !occupied(j)) < 99 ? 'terra' : nb(a, 'por') && nb(b, 'por') ? 'mar' : '';
const supCut = r => occupied(r.a) || occupied(r.b) || !supWay(r.f, r.a, r.b);
const supCap = r => 2 + (road(r.a) && road(r.b) ? 1 : 0) + ldv(G.own[r.a], 'AB');
const supAmt = r => !rLive(r) || supCut(r) ? 0 : Math.min(supCap(r), Math.max(0, r.c === 'food' ? yieldOf(r.a).food - foodUse(r.a) : prodOf(r.a)));
const supNet = (i, c) => G.routes.reduce((s, r) => s + (r.k === 'sup' && r.c === c && (r.a === i || r.b === i) ? (r.b === i ? 1 : -1) * supAmt(r) : 0), 0);
function openSup(f, a, b, c) {
  if (G.own[a] !== f || G.own[b] !== f || a === b || !G.lv[a] || !G.lv[b] || !CARGO[c]) return 'Escolha duas regiões suas povoadas.';
  if (supOf(f).length >= supMax(f)) return `Limite de ${supMax(f)} rotas de abastecimento (1, mais 1 a cada 4 regiões).`;
  if (G.routes.some(r => r.k === 'sup' && r.a === a && r.b === b && r.c === c)) return 'Essa rota já existe.';
  if (!supWay(f, a, b)) return 'Sem caminho: até 6 passos por regiões suas não ocupadas, ou porto nas duas pontas.';
  if (Fa(f).gold < ECON.route) return 'Ouro insuficiente.';
  Fa(f).gold -= ECON.route; G.routes.push({ f, o: f, a, b, k: 'sup', c, gd: [], s: G.round + 1 });
  log(f, `${fname(f)} abre abastecimento de ${CARGO[c]} de ${tname(a)} para ${tname(b)}.`); return '';
}
let supOpen = false;
function supHtml(i) {
  const f = G.player, my = G.turnF === f, rs = G.routes.filter(r => r.k === 'sup' && (r.a === i || r.b === i));
  const line = r => `${CARGO[r.c]} ${r.a === i ? '→ ' + esc(tname(r.b)) : '← ' + esc(tname(r.a))}: ${r.s > G.round ? 'começa no próximo turno' : supCut(r) ? '<span class="neg">cortada (caminho ocupado)</span>' : (supAmt(r) ? (r.a === i ? '−' : '+') + supAmt(r) + ' por turno' : 'nada agora (a origem não tem sobra)')} <button class="mini" data-a="supx" data-k="${G.routes.indexOf(r)}" ${my ? '' : 'disabled'}>Fechar</button>`;
  const ds = G.lv[i] ? settled(f).filter(j => j !== i && G.lv[j] && supWay(f, i, j)) : [];
  const can = my && ds.length && supOf(f).length < supMax(f) && Fa(f).gold >= ECON.route;
  return `<details class="supd" ${supOpen ? 'open' : ''}><summary>🐂 Abastecimento ${supOf(f).length}/${supMax(f)}${rs.length ? ' · ' + rs.length + ' nesta região' : ''}</summary><p class="hint">Manda a sobra desta região para outra sua: até 2 por turno, 3 com estrada nas duas pontas. Vai por terra, até 6 passos por regiões suas não ocupadas, ou por mar, com porto nas duas pontas. Um inimigo que ocupe o caminho corta a rota. Abrir custa ${ECON.route} ouro.</p>${rs.length ? '<p class="hint">' + rs.map(line).join('<br>') + '</p>' : ''}${can ? `<p class="hint">Para <select id="supTo">${ds.map(j => `<option value="${j}">${esc(tname(j))}</option>`).join('')}</select> <button class="mini" data-a="sup" data-i="${i}" data-c="food">Mandar comida</button> <button class="mini" data-a="sup" data-i="${i}" data-c="prod">Mandar produção</button></p>` : ''}</details>`;
}
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
    const ext = (k, okB, gd, near) => { for (let b = 0; b < G.N; b++) { const o = G.own[b]; if (real(o) && o !== f && peace(f, o) && !G.emb.has(tk(f, o)) && okB(b, o) && !has2(a, b) && (!near || landSteps(a, b, near, () => true) < 99)) out.push({ f, o, a, b, k, gd: gd(o) }); } };
    if (nb(a, 'cia') && has(f, 'oce')) ext('oce', b => nb(b, 'por') && !G.A[a].includes(b), o => give(o).slice(0, 3)); // T-04
    if (nb(a, 'rfn') && road(a) >= 2) ext('ole', b => road(b) >= 2, o => give(o).filter(d => ['cmb', 'ene', 'pet'].includes(d)).slice(0, 1), 4); // T-05
    if (nb(a, 'apt')) ext('aer', b => nb(b, 'apt'), o => give(o).slice(0, 2)); // T-06
    if (a === Fa(f).capI && has(f, 'net')) ext('dig', (b, o) => b === Fa(o).capI && has(o, 'net'), () => []); // T-07
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
    const ok = G.own[r.a] === r.f && G.own[r.b] === r.o && (r.o === r.f || (peace(r.f, r.o) && !G.emb.has(tk(r.f, r.o)))) && rOk(r);
    if (!ok) log(r.f, `A ${RT[r.k].n.toLowerCase()} de ${fname(r.f)} entre ${tname(r.a)} e ${tname(r.b)} se desfaz.`);
    return ok;
  });
}
const routeGold = f => { const m = (pol(f, 'tar') ? 1 : 0) + (gov(f) === 'tcn' ? 1 : 0) + (monoOf(f).length ? 1 : 0); return Math.round(G.routes.reduce((s, r) => s + (rLive(r) && (r.f === f || r.o === f) && r.f !== r.o ? RT[r.k].g + (pact(r.f, r.o, 'com') ? 1 : 0) + (pol(f, 'liv') ? 1 : 0) + m : 0), 0) * (gov(f) === 'pce' ? .5 : 1)); }; // DP-05, T-19, T-20, G-10, G-11
const routeSci = f => turnMemo('rs', f, () => G.routes.filter(r => rLive(r) && (r.f === f || r.o === f) && r.f !== r.o && r.k === 'car' && Fa(r.f === f ? r.o : r.f).tech.some(t => !has(f, t))).length + 2 * G.routes.filter(r => rLive(r) && r.k === 'dig' && (r.f === f || r.o === f)).length); // T-07; cache por turno: rota nova só rende no turno seguinte
const routeGoods = f => G.routes.filter(r => r.f === f && rLive(r)).flatMap(r => r.k === 'int' ? worked(r.b) : r.gd); // T-13
// T-14: rota com quem já tem a tecnologia barateia 20%
const MILT = new Set([...Object.values(ARMY).map(a => a.tech), ...TECH.filter(t => t.doc).map(t => t.k)]); // v40: ramo militar (LD-SB)
const techCost = (t, f) => Math.round(t.cost * 2 * G.len.k * (f && MILT.has(t.k) ? 1 - ldv(f, 'SB', 'mil') / 100 : 1) * (t.e === 3 && hasW(f, 'exu') ? .8 : 1) * (f && G.routes.some(r => rLive(r) && r.f !== r.o && (r.f === f || r.o === f) && has(r.f === f ? r.o : r.f, t.k)) ? .8 : 1));
// v50 (T-19): rotas ativas podem ser fechadas (libera a vaga para outra); cada tipo explica o que pede e o que rende
const RT_REQ = { int: 'mercado nas duas pontas, ambas suas', car: 'caravançará na origem e um mercado alheio a até 4 territórios', mar: 'porto com armazém alfandegário na origem e um porto alheio', oce: 'companhia de comércio na origem e um porto alheio', ole: 'refinaria e ferrovia ou rodovia', aer: 'aeroporto nas duas pontas', dig: 'Internet, entre capitais' };
const rYield = r => r.k === 'dig' ? '+2 🔬 para cada lado' : RT[r.k].g ? `+${RT[r.k].g} 💰 para cada lado` : '+1 ⚒ no destino e os bens dele entram na sua rede';
function routesModal() {
  const me = G.player, F = Fa(me), my = G.turnF === me, act = G.routes.filter(r => (r.f === me || r.o === me) && r.k !== 'sup'), c = routeCands(me).slice(0, 30), full = myRoutes(me).length >= routeMax(me);
  const st = r => r.s > G.round ? 'começa no próximo turno' : !rLive(r) ? '<span class="neg">cortada neste turno</span>' : 'rendendo';
  const row = (r, btn, extra) => `<div class="tech"><div><b>${RT[r.k].ic} ${RT[r.k].n}</b> <span class="hint">${esc(tname(r.a))} → ${esc(tname(r.b))}${r.o !== r.f ? ' · com ' + esc(fname(r.f === me ? r.o : r.f)) : ''}</span><br><span class="hint">${rYield(r)}${r.gd.length ? ' · traz ' + r.gd.map(d => DEP[d].ic + ' ' + DEP[d].n).join(', ') : ''}${extra ? ' · ' + extra : ''}</span></div>${btn || ''}</div>`;
  const open = c.length ? c.map(r => row(r, `<button class="mini pri" data-a="route" data-i="${r.a}" data-j="${r.b}" ${my && !full && F.gold >= ECON.route ? '' : 'disabled'} title="${full ? 'Sem vaga: feche uma rota ou construa mercado, porto ou banco.' : F.gold < ECON.route ? 'Ouro insuficiente.' : 'Começa a render no próximo turno.'}">Abrir · ${ECON.route}💰</button>`)).join('') : '<p class="hint">Nenhuma rota possível agora. Veja abaixo o que cada tipo pede.</p>';
  modal(`<h2>Comércio e rotas</h2>
    <p class="hint"><b>Vagas: ${myRoutes(me).length} de ${routeMax(me)}</b> (1 por mercado, porto e banco seus). Abrir custa ${ECON.route} ouro e a rota começa a render no turno seguinte. Fechar é grátis e libera a vaga na hora: é assim que você troca uma rota fraca por outra melhor. Guerra, embargo ou a perda de uma ponta cortam a rota.</p>
    <h4>Suas rotas ativas</h4><div class="techs">${act.length ? act.map(r => row(r, r.f === me && my ? `<button class="mini" data-a="routex" data-k="${G.routes.indexOf(r)}" title="Fecha esta rota e libera a vaga.">Fechar</button>` : '', (r.f === me ? 'aberta por você' : 'aberta por ' + esc(fname(r.f)) + ', não ocupa vaga sua') + ' · ' + st(r))).join('') : '<p class="hint">Nenhuma ainda.</p>'}</div>
    <h4>Rotas que você pode abrir ${full ? '<span class="hint">(sem vaga livre)</span>' : ''}</h4><div class="techs">${open}</div>
    <details class="rdet"><summary>O que cada tipo de rota pede e rende</summary><ul>${Object.keys(RT_REQ).filter(k => RT[k]).map(k => `<li><b>${RT[k].ic} ${RT[k].n}:</b> ${RT_REQ[k]}. Rende ${rYield({ k })}.</li>`).join('')}</ul><p class="hint">Bens recebidos por rota contam como ligados para as obras que os exigem, e rota com quem sabe mais barateia a pesquisa em 20%. O abastecimento (comida e produção entre regiões suas) fica na aba Região de cada território.</p></details>${G.sc.civ ? mktHtml(me) : ''}`, [['Fechar']]);
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
    if (k === 5) agitHit(o, 15);
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
// ponytail: cache por turno; um bem ganho no meio do turno só libera a tropa no turno seguinte
const turnMemo = (n, f, fn) => { const k = G.round + ':' + G.cur; if (!G.memo || G.memo.k !== k) G.memo = { k }; const m = G.memo[n] || (G.memo[n] = {}); return f in m ? m[f] : (m[f] = fn()); };
const armyOf = f => turnMemo('army', f, () => armyOf0(f));
const armyOf0 = f => real(f) ? Object.keys(ARMY).filter(k => has(f, ARMY[k].tech) && (!ARMY[k].good.length || goodOk(f, ARMY[k].good))) : [];
const armyDef = j => { const d = G.own[j], a = armyOf(d); return (a.includes('mec') ? 2 : a.includes('msq') || a.includes('lin') || (a.includes('bes') && (nb(j, 'for') || nb(j, 'cas'))) ? 1 : 0) + (G.dug[j] ? (has(d, 'mtr') ? 2 : 1) : 0); }; // A-06 a A-11, A-45, K-89
const armyAtk = (a, j) => Math.max(a.includes('leg') || a.includes('msq') || a.includes('lin') ? 1 : 0, a.includes('mec') || (a.includes('bld') && !'mfsw'.includes(G.ter[j])) ? 2 : 0); // A-08 a A-11
function defBonus(j, i) { const d = G.own[j]; return terrDef(j) + Math.max(0, (i != null && armyOf(G.own[i]).includes('fes') ? 0 : bldDef(j)) - (i != null && has(G.own[i], 'mat') ? 1 : 0)) + armyDef(j) + (hasW(d, 'gmu') && !(i != null && isSea(i, j)) ? 1 : 0) + (G.fort[j] > 0 || (capOwner(j) && capOwner(j) === d) || (Fa(d).ab === 'tenaz' && G.tr[j] >= 5) ? 1 : 0) + lastStand(j) + ldCB(d, j, 'def') + (i != null && isSea(i, j) && seaSup(i, j) < 0 ? 1 : 0); }
// v45 (D-14): última resistência. A capital de quem tem até 2 territórios defende com +1 (guerrilha e milícias)
const lastStand = j => { const d = G.own[j]; return real(d) && Fa(d).capI === j && owned(d).length <= 2 ? 1 : 0; };
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
  if (nb(i, 'apt')) owned(f).forEach(j => { if (nb(j, 'apt')) out.add(j); }); // L-06. ponytail: sem limite de 3 tropas
  if (armyOf(f).includes('mot')) [...out].forEach(j => { if (!isSea(i, j)) G.A[j].forEach(k => { if (G.own[k] === f && !isSea(j, k)) out.add(k); }); }); // A-09
  out.delete(i); return [...out];
}
// L-08: na rede de bens não falta suprimento; fora dela vale a distância até capital, quartel ou porto
const lowSupply = (i) => real(G.own[i]) && !netOf(G.own[i]).linked.has(i) && !G.A[i].some(j => pact(G.own[i], G.own[j], 'pas')) && supplyDist(G.own[i])[i] > ECON.sup + (hasW(G.own[i], 'rce') ? 2 : 0);
// v50 (M-12): supremacia naval. Diferença entre a frota (travessias por turno) de quem ataca e de quem defende
const fleet = f => real(f) ? navOf(f) : 0;
const seaSup = (i, j) => fleet(G.own[i]) - fleet(G.own[j]);
// desembarque limitado a 2 dados: sem porto na origem, sem navegação e sem frota 2 acima da do defensor
const landCap = (i, j) => { const a = G.own[i], A = Fa(a); return isSea(i, j) && A.ab !== 'almirante' && !nb(i, 'por') && !(A.real && (has(a, 'nav') || hasW(a, 'frl'))) && seaSup(i, j) < 2; };
function diceFor(i, j) {
  const a = G.own[i], A = Fa(a);
  let ad = Math.min(3, G.tr[i] - 1); if (landCap(i, j)) ad = Math.min(2, ad);
  if (ad > 1 && lowSupply(i)) ad--;
  if (ad > 1 && TERR[G.ter[j]].def === 'w') ad--; // M-10: pântano
  return [ad, Math.min(3, G.tr[j])];
}
// v50 (UI-11): por que o ataque rola menos de 3 dados, e o que resolve
function diceWhy(i, j) {
  const a = G.own[i], A = Fa(a), w = [];
  if (G.tr[i] - 1 < 3) w.push(`${tname(i)} tem ${G.tr[i]} tropa(s): 1 fica de guarnição e cada dado pede 1 tropa. Traga mais tropas para rolar 3 dados.`);
  if (landCap(i, j)) w.push(`Desembarque pelo mar: no máximo 2 dados. Liberam o 3º dado: um ${sName('por')} em ${tname(i)}, a tecnologia ${tName('nav')} ou uma frota pelo menos 2 travessias maior que a do defensor (a sua tem ${fleet(a)}, a dele ${fleet(G.own[j])}).`);
  if (G.tr[i] - 1 > 1 && lowSupply(i)) w.push(`Longe do suprimento: −1 dado. ${tname(i)} está a mais de ${ECON.sup} territórios da capital, de um ${sName('qua')} ou de um ${sName('por')} seus. Construa um deles mais perto da frente.`);
  if (TERR[G.ter[j]].def === 'w') w.push('Pântano no alvo: −1 dado para quem ataca.');
  return w;
}
function roll(i, j) {
  const a = G.own[i], A = Fa(a), [ad, dd] = diceFor(i, j);
  if (a === G.player) (G.guide = G.guide || {}).atk = 1;
  const R = Array.from({ length: ad }, d6).sort((x, y) => y - x), D = Array.from({ length: dd }, d6).sort((x, y) => y - x);
  const aw = armyOf(a), dw = armyOf(G.own[j]), op = OPEN.includes(G.ter[j]), hc = op && (aw.includes('cav') || aw.includes('kni')) && !dw.includes('lin');
  if (has(a, 'art') && goodOk(a, ['sli']) && G.tr[j] > 1 && d6() >= 5) G.tr[j]--; // K-53: canhão antes do combate
  if (isSea(i, j) && aw.includes('enc') && G.tr[j] > 1 && d6() >= 5) G.tr[j]--; // A-25
  G.dug[i] = 0; G.acted.add(i); // A-45: quem ataca perde o entrincheiramento
  const up = atkBonus(i, j);
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
// v43: desgaste da blitz. A 4ª conquista do turno em diante custa estabilidade crescente e 1 tropa (guarnição e deserção)
// v46 (D-16): agitação saturada. Na mesma rodada, só a primeira agitação contra uma facção pega inteira; as seguintes valem 1/3
const agitHit = (o, n) => { const O = Fa(o); O.stab = Math.max(0, O.stab - (O.agR === G.round ? Math.ceil(n / 3) : n)); O.agR = G.round; };
const blitzCost = f => Math.max(0, Fa(f).cq + 1 - ECON.blitz) * ECON.blitzS;
function conquer(i, j, n) {
  const a = G.own[i], d = G.own[j];
  const bc = real(a) ? blitzCost(a) : 0;
  if (bc) { Fa(a).stab = Math.max(0, Fa(a).stab - bc); log(a, `${fname(a)} avança rápido demais: −${bc} de estabilidade e 1 tropa deixada para trás em ${tname(j)}.`); }
  G.own[j] = a; G.tr[j] = bc && n > 1 ? n - 1 : n; G.tr[i] -= n; G.fort[j] = 0; delete G.rl[j];
  G.lv[j] = Math.max(1, G.lv[j] - 1); G.food[j] = 0; // saque e fuga: o território perde um nível
  G.asm[j] = 0; G.win[j] = (G.win[i] || 0) + 1; G.dug[j] = 0; // A-43: veteranos
  G.arr[j] = n; // tropas que entraram por conquista já se moveram neste turno
  // P-08: o conquistador fica com metade do progresso das obras; maravilha em andamento se perde
  G.q[j] = real(a) ? G.q[j].filter(x => !STRUCT[x.k].wonder).map(x => ({ ...x, p: Math.floor(x.p / 2) })).slice(0, qMax(a)) : [];
  if (real(a)) { Fa(a).conq = true; Fa(a).cq++; G.occ[j] = ECON.occ; Fa(a).pre += ldv(a, 'PR', 'conq'); Fa(a).gold += ldv(a, 'OU', 'conq'); } else G.occ[j] = 0;
  // T-16: pilhagem. Quem toma a ponta de uma rota alheia leva o ouro de 2 turnos dela
  if (real(a)) for (const r of G.routes) if ((r.a === j || r.b === j) && r.f !== a && r.o !== a && RT[r.k].g) { Fa(a).gold += 2 * RT[r.k].g; log(a, `${fname(a)} pilha a ${RT[r.k].n.toLowerCase()} em ${tname(j)} (+${2 * RT[r.k].g} ouro).`); }
  checkRoutes();
  if (real(a) && G.sc.civ) civTake(a, j, d);
  if (real(d) && real(a)) { remember(d, a, 'tomou nossa terra', -30); callDefense(a, d); }
  if (real(d)) {
    const D = Fa(d); D.stab = Math.max(0, D.stab - 2); if (D.hit !== G.round) D.ww = Math.min(30, D.ww + 2); D.hit = G.round; // v43: guerra defensiva; v46 (D-15): o cansaço por perda conta uma vez por rodada
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
// ---------- v40 (L1): líderes da partida inteira, com poderes da biblioteca LD (src/leaders.js) ----------
const leadersOf = (sid, d) => (sid === 'civ' && civLeaders(d)) || (LEAD[sid] && LEAD[sid][d.id]) || [{ n: d.L, ab: d.ab, y: '', d: '', fx: [] }];
const lfx = (f, c) => { const F = Fa(f); return F && F.fx ? F.fx.filter(x => x[0] === c) : []; };
const ldv = (f, c, m) => lfx(f, c).reduce((s, x) => s + (m == null || x[1] === m ? x[x.length - 1] : 0), 0);
const ldCB = (f, j, m) => lfx(f, 'CB').reduce((s, x) => s + (x[1] === m && (!x[2] || (x[2] === 'hm' ? ['h', 'm'].includes(TERR[G.ter[j]].def) : G.cul[j] === f)) ? x[3] : 0), 0);
const RN = { food: 'comida', prod: 'produção', gold: 'ouro', sci: 'saber', pre: 'prestígio', stab: 'estabilidade' };
const bnOf = k => BN[k] || (typeof STRUCT[k].n === 'string' ? STRUCT[k].n : Object.values(STRUCT[k].n)[0]).toLowerCase();
const LDX = {
  ED: x => `+${x[3]} ${RN[x[2]]} em cada ${bnOf(x[1])}`,
  TR: x => `+${x[3]} ${RN[x[2]]} em ${[...x[1]].map(t => TERR[t].n.toLowerCase()).join(' e ')}`,
  CP: x => `+${x[2]} ${RN[x[1]]} na capital`,
  RT: x => `+${x[1]} ouro por rota comercial ativa`,
  AB: x => `+${x[1]} rota de abastecimento e +${x[1]} de carga em cada uma`,
  CR: x => `regiões crescem com ${x[1]}% menos comida`,
  SB: x => x[1] === 'mil' ? `tecnologias militares custam ${x[2]}% menos` : `+${x[2]}% de saber`,
  RF: x => `+${x[1]} ${x[1] > 1 ? 'tropas' : 'tropa'} de reforço por turno`,
  CB: x => `+${x[3]} no maior dado ${x[1] === 'atk' ? 'ao atacar' : 'ao defender'}${x[2] === 'hm' ? ' em colinas e montanhas' : x[2] === 'casa' ? ' nas regiões da própria cultura' : ''}`,
  NV: x => `+${x[1]} travessia marítima por turno`,
  ES: x => x[1] === 'ww' ? `cansaço de guerra pesa ${x[2]}% menos` : `+${x[2]} estabilidade por turno`,
  PR: x => x[1] === 'conq' ? `+${x[2]} prestígio por região conquistada` : `+${x[2]} prestígio por turno`,
  MV: x => `maravilhas custam ${x[1]}% menos`,
  OB: x => `+${x[1]} produção em cada região com obra na fila`,
  GV: () => 'troca de governo sem anarquia',
  DP: x => `começa com +${x[1]} de relação com todas as facções`,
  OU: x => x[1] === 'conq' ? `+${x[2]} ouro por região conquistada` : `+${x[2]} ouro a cada 2 regiões povoadas`,
  CT: x => (x[1] ? `+${x[1]} ${x[1] > 1 ? 'cartas' : 'carta'} no início e ` : '') + `uma carta a cada ${x[2]} turnos`,
};
const ldText = fx => (fx || []).map(x => LDX[x[0]](x)).join('; ');
// escolhe o líder de cada facção (jogador: ld; rivais: o primeiro, ou sorteado) e aplica o que vale no início
function ldSetup(ld, rl) {
  for (const f of G.order) {
    const F = Fa(f), d = G.sc.f.find(x => x.id === f), Ls = d ? leadersOf(G.sc.id, d) : [{ n: F.L, ab: F.ab, y: '', d: '', fx: [] }];
    const k = f === G.player ? Math.max(0, Math.min(ld || 0, Ls.length - 1)) : rl ? Math.floor(rnd() * Ls.length) : 0, x = Ls[k];
    Object.assign(F, { lead: k, L: x.n, ab: x.ab, Ly: x.y, Ld: x.d, fx: x.fx });
  }
  for (const f of G.order) {
    const F = Fa(f);
    if (F.ab === 'espiao') F.cards.push(drawCard(), drawCard());
    for (const x of lfx(f, 'CT')) for (let n = 0; n < x[1]; n++) F.cards.push(drawCard());
    const dp = ldv(f, 'DP'); if (dp) G.order.forEach(o => remember(o, f, 'diplomacia de ' + F.L, dp));
  }
}
function ldPickHtml(sc) {
  const d = sc.f.find(f => f.id === pickF), Ls = leadersOf(sc.id, d); if (pickLd >= Ls.length) pickLd = 0;
  if (Ls.length < 2) return `<p class="hint">Esta facção tem um só líder${Ls[0] ? ': ' + esc(Ls[0].n) : ''}.</p>`;
  return `<div class="ldg">${Ls.map((x, k) => `<button class="ldc ${pickLd === k ? 'on' : ''}" data-a="ldp" data-k="${k}"><b>${esc(x.n)}</b>${x.y ? ` <em>${esc(x.y)}</em>` : ''}<span>${esc(x.d)}</span><small>${ABIL[x.ab][0]}: ${esc(ABIL[x.ab][1])}</small>${x.fx.length ? `<small class="pw">⚜ ${esc(ldText(x.fx))}</small>` : ''}</button>`).join('')}</div>`;
}
function beginTurn(f) {
  const F = Fa(f);
  // A-49: o cansaço de guerra come a recuperação de estabilidade
  F.stab = Math.max(0, Math.min(100, F.stab + 2 + (F.ab === 'carisma' ? 3 : 0) + ldv(f, 'ES', 'stab') + 2 * countB(f, 'tem') + Math.min(4, luxOf(f)) + Math.min(6, income(f).stab) - Math.floor(F.ww * (1 - ldv(f, 'ES', 'ww') / 100) / (pol(f, 'ppg') ? 10 : 5))));
  // Grande Biblioteca (C-202): tecnologias que duas outras facções já têm
  if (hasW(f, 'gbi')) TECH.forEach(t => { if (!has(f, t.k) && G.order.filter(o => o !== f && Fa(o).alive && has(o, t.k)).length >= 2) { F.tech.push(t.k); log(f, `A Grande Biblioteca dá ${tName(t.k)} a ${fname(f)}.`); } });
  owned(f).forEach(i => { if (G.fort[i] > 0) G.fort[i]--; if (G.occ[i] > 0) G.occ[i]--; });
  F.conq = false; F.cq = 0; F.ofs = false; G.phase = 'ref'; G.sel = G.tgt = null; G.card = null; G.mode = null; G.seaUsed = new Set(); G.mv = []; G.arr = []; G.acted = new Set();
  for (const [i, n] of Object.entries(F.recQ)) if (G.own[i] === f) G.tr[i] += n;
  F.recQ = {};
  // v43: levante nacional. Capital sob ameaça recebe milícia; quem está encurralado (≤ 1/4 do tamanho inicial) recebe mais
  checkRoutes();
  for (const r of myRoutes(f)) if (r.k === 'mar' && rLive(r) && navOf(f) < 2 && rnd() < 1 / 6) { r.cut = G.round; log(f, `Piratas atacam a rota marítima de ${fname(f)} saindo de ${tname(r.a)}: ela não rende nesta rodada.`); } // T-17
  const inc = income(f); F.gold += inc.gold; F.sci += anar(f) ? 0 : inc.sci; F.pre += inc.pre; for (const x of lfx(f, 'CT')) if (G.round % x[2] === 0 && F.cards.length < 5) F.cards.push(drawCard()); govTurn(f); succession(f); figures(f); events(f);
  payUpkeep(f); produce(f); grow(f); society(f); diploTurn(f); if (real(f)) era12Turn(f); research(f);
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
  // D-03; v47 (V-11): a contagem só começa quando a vitória libera, e todos são avisados para reagir
  F.hold = objDone(f) && G.round >= minWin() ? F.hold + 1 : 0;
  if (F.hold === 1 && G.len.hold > 1) { log(f, `Alerta: ${fname(f)} cumpriu o objetivo e vence se segurá-lo por mais ${G.len.hold - 1} turno(s).`); if (f !== G.player && !G.auto) toast(`${fname(f)} cumpriu o objetivo! Tome um alvo dela em ${G.len.hold - 1} turno(s) ou ela vence.`); }
  vicTurn(f); if (G.over) return; // parte 13
  if (G.round < minWin()) return;
  if (F.hold >= G.len.hold) endGame(f, 'obj');
  else if (legacy(f) >= legWin() && G.own[F.capI] === f) endGame(f, 'leg');
}
function finishTurn(f) {
  if (f === G.player) G.offers = [];
  for (const i of owned(f)) G.dug[i] = G.tr[i] >= 2 && !G.acted.has(i) && !G.arr[i] ? 1 : 0; // A-45: quem fica parado se entrincheira
  const F = Fa(f);
  F.ww = F.camp && gov(f) !== 'ppu' ? Math.min(30, F.ww + (gov(f) === 'rep' ? 2 : 1)) : Math.max(0, F.ww - 2);
  if ((F.conq || F.ab === 'espiao') && F.cards.length < 5) F.cards.push(drawCard());
  G.sel = G.tgt = null; G.card = null;
}
async function advance() {
  checkWin(); if (G.over) return; // v50: confere eliminação e dominação ao fim de cada turno, não só da rodada
  G.cur++;
  if (G.cur >= G.order.length) {
    G.cur = 0; await rebelsAct(); if (G.over) return;
    G.round++; ageCheck(); plague(); congress(); climate(); vicRound(); if (G.sc.civ) civRound(); histPush();
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
  // v50: quem ficou sem território por qualquer via (revolta, golpe, carta, evento, secessão) está eliminado
  for (const f of G.order) { const F = Fa(f); if (F.alive && F.entered && !owned(f).length) { F.alive = false; log(f, `${fname(f)} foi eliminado: perdeu o último território.`); if (f === G.player && !G.auto) return endGame(null, 'elim'); } }
  const alive =G.order.filter(f => Fa(f).alive && Fa(f).entered);
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
  log(w, why === 'elim' ? 'Você foi eliminado.' : `${fname(w)} vence (${why === 'obj' ? 'objetivo cumprido' : why === 'leg' ? 'legado' : why === 'dom' ? 'dominação' : VIC[why] ? 'vitória de ' + VIC[why].n.toLowerCase() : 'maior pontuação ao fim das rodadas'}).`);
  render();
  if (G.auto) return;
  const rows = rank.map(f => `<tr><td><i class="dot" style="background:${Fa(f).c}"></i>${esc(fname(f))}${f === G.player ? ' (você)' : ''}</td><td>${owned(f).length}</td><td>${capsHeld(f)}</td><td>${score(f)}</td></tr>`).join('');
  const t = why === 'elim' ? 'Derrota' : pw ? (w === G.player ? 'Vitória!' : 'Vitória da aliança!') : 'Derrota';
  const sub = why === 'elim' ? 'Seus últimos territórios caíram.' : why === 'obj' ? `${fname(w)} cumpriu o objetivo: ${objText(Fa(w))}` : why === 'leg' ? `${fname(w)} chegou a ${legWin()} pontos de legado: ciência, obras e cultura.` : why === 'dom' ? `${fname(w)} e aliados dominaram o mapa.` : VIC[why] ? `${fname(w)} vence por ${VIC[why].n.toLowerCase()}: ${VIC[why].fx}.` : `Fim das ${G.rounds} rodadas. Vence quem mais cresceu: territórios ganhos desde o início, +2 por capital e +2 por alvo do objetivo controlado.`;
  modal(`<p class="kick">${esc(G.sc.n)}</p><h2>${t}</h2><p>${esc(sub)}</p><table class="rank"><tr><th>Facção</th><th>Terr.</th><th>Cap.</th><th>Pontos</th></tr>${rows}</table>${histChart()}${timeline() ? '<h4>Linha do tempo</h4><ul class="tl">' + timeline() + '</ul>' : ''}`, [['Jogar de novo', () => startScenario(G.sc.id, G.player, G.diff, false, G.lenK)], ['Escolher cenário', showSetup]]);
}

// ---------- salvar ----------
// Salvamento automático no início de cada turno seu; 3 espaços manuais e arquivo exportável guardam esse mesmo ponto (D-11).
const SLOT = n => SAVE + '-' + n;
function snapshot() {
  const F = {}; G.order.forEach(f => { const X = Fa(f); F[f] = Object.fromEntries(Object.entries(X).filter(([k]) => !['tS', 'tN', 'tSet'].includes(k))); });
  return JSON.stringify({ v: 5, sc: G.sc.id, player: G.player, diff: G.diff, len: G.lenK, own: G.own, tr: G.tr, fort: G.fort, bld: G.bld, q: G.q, occ: G.occ, lv: G.lv, food: G.food, gvr: G.gvr, gfc: G.gfc, genA: G.genA, fai: G.fai, faiths: G.faiths, pacts: G.pacts, ally: [...G.ally], mem: G.mem, cb: [...G.cb], truceT: G.truceT, dem: G.dem, cs: G.cs, cul: G.cul, asm: G.asm, win: G.win, dug: G.dug, corp: G.corp, cong: G.cong, banMis: G.banMis, polLim: G.polLim, green: G.green || 0, civ: G.sc.civ || null, hist: G.hist || [], crise: G.crise || null, ruin: [...(G.ruin || [])], seen: G.seen ? [...G.seen] : null, routes: G.routes, sub: G.sub || null, emb: [...G.emb], rl: G.rl, F, cur: G.cur, round: G.round, truce: [...G.truce], cool: G.cool, log: G.log.slice(0, 30), trades: G.trades, at: Date.now() });
}
function save() { try { G.snap = snapshot(); localStorage.setItem(SAVE, G.snap); } catch (e) { } }
function loadSave(k = SAVE) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function restore(s) {
  if (s && s.civ) civSetup(s.civ); // MC-08: o mundo volta pela semente
  const sc = s && s.v === 5 && SCEN.find(x => x.id === s.sc); if (!sc) return false;
  startScenario(sc.id, s.player, s.diff, true, s.len);
  Object.assign(G, { own: s.own, tr: s.tr, fort: s.fort, bld: s.bld, q: s.q, occ: s.occ, lv: s.lv || G.lv, food: s.food || G.food, gvr: s.gvr || {}, gfc: s.gfc || {}, genA: s.genA || {}, evq: [], fai: s.fai || G.fai, faiths: s.faiths || {}, pacts: s.pacts || [], ally: new Set(s.ally || []), mem: s.mem || {}, cb: new Set(s.cb || []), truceT: s.truceT || {}, dem: s.dem || null, cs: s.cs || {}, offers: [], cul: s.cul || G.cul, asm: s.asm || G.asm, win: s.win || G.win, dug: s.dug || G.dug, corp: s.corp || [], cong: s.cong || { on: false, res: [], pv: {} }, banMis: s.banMis || 0, polLim: s.polLim || 0, green: s.green || 0, ruin: new Set(s.ruin || []), hist: s.hist || [], crise: s.crise || null, seen: s.seen ? new Set(s.seen) : G.seen, routes: s.routes || [], emb: new Set(s.emb || []), rl: s.rl, cur: s.cur, round: s.round, truce: new Set(s.truce), cool: s.cool, log: s.log, trades: s.trades });
  for (const [f, v] of Object.entries(s.F)) Object.assign(G.F[f], v);
  G.sub = s.sub || G.sub;
  render(); loop(); return true;
}
function resume(k) { restore(loadSave(k)); }
function saveModal() {
  const row = n => { const s = loadSave(SLOT(n)), sc = s && SCEN.find(x => x.id === s.sc); return `<div class="tech"><div><b>Espaço ${n}</b> <span class="hint">${sc ? esc(sc.n) + ' · rodada ' + s.round + ' · ' + new Date(s.at).toLocaleString('pt-BR') : 'vazio'}</span></div><button class="mini pri" data-a="slot" data-n="${n}">Salvar aqui</button></div>`; };
  modal(`<h2>Salvar partida</h2><p class="hint">Guarda o início do seu turno atual (rodada ${G.round}).</p><div class="techs">${[1, 2, 3].map(row).join('')}</div><div class="row"><button class="mini" data-a="export">Exportar arquivo</button></div>`, [['Fechar']]);
}
let DL = null; // capacidade de downloads do visualizador (null fora dele)
try { window.claude?.use?.('downloads')?.then(d => { DL = d; }, () => {}); } catch (e) { }
function exportSave() {
  const s = G.snap || snapshot(), name = `soberania-${G.sc.id}-rodada${G.round}.json`;
  if (DL) { DL.save({ filename: name, data: s }).then(() => toast('Arquivo da partida salvo.'), e => toast(e && e.code === 'declined' ? 'Exportação cancelada.' : 'Este aparelho não deixou salvar o arquivo. Use os espaços de salvamento.')); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([s], { type: 'application/json' }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
      const d = G.own[j], th = real(d) && Fa(d).hold > 0; // v47: quem está segurando o objetivo vira alvo, sobretudo a capital e os alvos dele
      const s = tval(f, j) * (edge + 1) / (G.tr[j] + 1) + (G.bld[j].length ? 1 : 0) + (th ? 3 + (j === Fa(d).capI || (Fa(d).obj.hold || []).some(n => G.ix[n] === j) ? 4 : 0) : 0);
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
    const dfs = (F.hit || -9) >= G.round - 1 || G.order.some(o => o !== f && real(o) && Fa(o).alive && Fa(o).hold > 0 && !allied(f, o)); // v47: alguém segurando o objetivo também mobiliza; v43: invadida, a IA contra-ataca em vez de se encolher pelo cansaço
    if (n) o.push([4 + Math.min(3, n * .5) + (G.round > 2 ? .5 : 0) + (dfs ? 1.5 : -F.ww * .15) - (F.stab < 30 ? 1.5 : 0), 'camp']); // D-10: cansaço e instabilidade seguram a IA
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
  if (F.gold >= ECON.route + 2 && supOf(f).length < supMax(f)) { const st = settled(f).filter(i => G.lv[i]), sur = i => yieldOf(i).food - foodUse(i), hun = st.find(i => sur(i) + supNet(i, 'food') < 0), src = hun == null ? null : st.filter(i => i !== hun && sur(i) >= 2 && supWay(f, i, hun)).sort((a, b) => sur(b) - sur(a))[0]; if (src != null) o.push([3.2, 'sup', src, hun]); } // v35: socorre região com fome
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
    let v = Object.entries(S.y || {}).reduce((s, [r, a]) => s + a * W[r], 0) + (S.lg ? .6 : 0) + (S.ww ? 4.5 : 0) + (S.nav ? .8 : 0) + (S.rf ? 2.2 : 0)
      + (S.vic ? 8 : 0) + (S.mk && !goods(f).has(S.mk) ? 2.5 : 0) + .5 * (S.hp || 0) + .4 * (S.cu || 0) + .5 * (S.hl || 0) + (S.sciLv ? .8 * G.lv[i] : 0) + (S.pm ? 1.5 : 0) + (S.sd ? .3 : 0) - .3 * Math.max(0, S.plu || 0); // parte 12
    if (S.def) v += th >= G.tr[i] * .7 ? 2 * S.def : .2;
    if (S.atk) v += th ? 1.6 : .3;
    const near = !growMax(i) && G.food[i] >= growNeed(i) * .5;
    if (k === 'aqu') v += G.lv[i] === 2 && near ? 3.5 : 0;
    if (k === 'san') v += G.lv[i] === 3 && near ? 3 : .3;
    if (k === 'tri') v += F.stab < 40 ? 2.5 : 0;
    if (k === 'cel') v += .6;
    if (k === 'est') { const nt = netOf(f); v += !nt.core.has(i) && G.A[i].some(j => nt.core.has(j) && road(j) + (j === F.capI) > 0) ? 1.4 + (worked(i).length ? 1 : 0) + G.A[i].filter(j => G.own[j] === f && worked(j).length && !nt.linked.has(j)).length : .2; }
    if (k === 'pav') v += .3;
    return v - .15 * n;
  }
  // zonas de recurso: rendimento novo + jazidas que passam a ser exploradas
  const y = { ...S.y }, g = goods(f), W = { food: G.lv[i] < 4 ? .6 : .15, prod: .7, gold: 1, sci: .8, pre: .5, stab: .3 };
  if (k === 'agr' && G.riv[i]) y.food++;
  y[Object.keys(S.y)[0]] += Math.min(3, G.A[i].filter(j => G.own[j] === f && built(j, k)).length);
  let v = { zin: 1.5, zen: 1.5, zcu: .4 * S.cu, ztu: .5 * S.hp }[k] || 0; // parte 12: zonas de base
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
  aiResearch(f); aiGov(f); aiChars(f); aiEra12(f); aiCiv(f);
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
      if (blitzCost(f) && F.stab - blitzCost(f) < 45 && !(real(d) && Fa(d).capI === j && Fa(d).alive)) break; // v43: a IA pesa o desgaste da blitz
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
  if (threatOf(b)) why.push(['perto de vencer', -20]); // aviso de ameaça
  const agd = G.sc.civ && agendaRel(a, b); if (agd) why.push(agd); // IA-09
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
  if (!spend(f, 'env' + i)) return 'Já mandou um enviado a esta cidade-estado neste turno.';
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
  const C = G.cong, cg = C.on ? `<h3>Congresso Mundial</h3><p class="hint">Seus votos: ${votes(me)} (1, mais cidades-estado que você protege e a Sede das Nações). ${C.res.length ? 'Votação na rodada ' + C.due + ':' : 'Próxima sessão na rodada ' + C.next + '.'}</p>${C.res.map(r => `<p>${esc(CRES[r.k][1](r.x))} <button class="mini ${C.pv[r.k] === true ? 'pri' : ''}" data-a="vote" data-k="${r.k}" data-v="1">Sim</button> <button class="mini ${C.pv[r.k] === false ? 'pri' : ''}" data-a="vote" data-k="${r.k}" data-v="0">Não</button></p>`).join('')}` : '';
  modal(`<h2>Diplomacia</h2><p class="hint">Propostas não gastam ação. Passe o mouse num botão para ver se a facção aceita; ✓ = deve aceitar. Romper trégua dá agravo com todos, salvo com motivo de guerra.</p>${dem}${off}<div class="techs">${rows || '<p>Nenhuma facção em jogo.</p>'}</div>${cg}${cs ? `<h3>Cidades-estado</h3><p class="hint">Selecione uma no mapa e use “Enviado” (1 ação, 2 ouro; cumprindo a missão vale 3 de influência). Quem tem mais influência (mín. 3) é o suserano e recebe o bônus; só ele pode anexá-la por influência.</p><ul>${cs}</ul>` : ''}`, [['Fechar']]);
}

// ---------- mapa ----------
let svg, vb, P = [], B = [];
function buildMap() {
  const m = G.m; svg = $('#map');
  vb = { x: 0, y: 0, w: m.w, h: m.h };
  // UI (celular): começa aproximado na capital do jogador, que o mapa inteiro fica miúdo em 360 px
  const cap = innerWidth <= 820 && G.player && G.F[G.player] && m.terr[G.F[G.player].capI];
  if (cap) { vb.w = m.w * .5; vb.h = m.h * .5; vb.x = Math.max(0, Math.min(m.w - vb.w, cap.x - vb.w / 2)); vb.y = Math.max(0, Math.min(m.h - vb.h, cap.y - vb.h / 2)); }
  let h = `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="${REB.c}"/><rect width="2" height="6" fill="#00000055"/></pattern><pattern id="fora" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="7" height="7" fill="#2a313b"/><rect width="1.4" height="7" fill="#ffffff12"/></pattern>${terrDefs()}${svDefs()}</defs><rect x="${-m.w}" y="${-m.h}" width="${m.w * 3}" height="${m.h * 3}" class="sea"/>`;
  if (m.bg) h += `<path d="${m.bg}" class="bgl"><title>Terra fora do jogo</title></path>`;
  const RL = typeof RELIEF !== 'undefined' && RELIEF[G.sc.map]; // relevo real (maps/relevo.js)
  if (RL) h += `<image id="relc" href="${RL.c}" x="0" y="0" width="${m.w}" height="${m.h}" preserveAspectRatio="none"/>`;
  h += '<g>' + m.terr.map((t, i) => `<path d="${t.d}" data-i="${i}" class="t"><title>${esc(t.n)}</title></path>`).join('') + '</g>' + (RL ? `<image id="relS" href="${RL.s}" x="0" y="0" width="${m.w}" height="${m.h}" preserveAspectRatio="none"/>` : '') + '<g id="rib"></g><g id="brd"></g>';
  const sl = seaEnds(m);
  h += '<g class="sealinks">' + m.sea.map(([a, b, w], k) => { const A = m.terr[a], C = m.terr[b], tt = `<title>Travessia por mar: ${esc(A.n)} e ${esc(C.n)}</title>`; if (!w) { const [x1, y1, x2, y2] = sl[k]; return `<g data-k="${k}">${tt}<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><circle cx="${x1}" cy="${y1}" r="2.2"/><circle cx="${x2}" cy="${y2}" r="2.2"/></g>`; } const [L, R] = A.x < C.x ? [A, C] : [C, A]; return `<g data-k="${k}">${tt}<line x1="${L.x}" y1="${L.y}" x2="0" y2="${L.y}"/><line x1="${R.x}" y1="${R.y}" x2="${m.w}" y2="${R.y}"/></g>`; }).join('') + '</g>';
  h += '<g id="roads"></g><g id="hl"></g><g id="badges">' + m.terr.map((t, i) => `<g class="b" data-i="${i}"><g class="sv"></g><circle class="cap" r="14" hidden/><circle class="bc" r="10"/><text class="bn" y="4">0</text><g class="lvp">${[0, 1, 2, 3].map(n => `<circle cx="${-7.5 + 5 * n}" cy="-17" r="2.1"/>`).join('')}</g><text class="ic" x="13" y="-8"></text><text class="nm" y="23">${esc(t.n)}</text></g>`).join('') + '</g>';
  svg.innerHTML = h; brdKey = ''; ribOn = false;
  P = [...svg.querySelectorAll('path.t')]; B = [...svg.querySelectorAll('g.b')]; NM = null;
  seaVia();
  setVB();
}
function upp() { const r = svg.getBoundingClientRect(); return r.width ? Math.max(vb.w / r.width, vb.h / r.height) : 1; }
function setVB() {
  svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  const r = svg.getBoundingClientRect(), u = upp(), k = u * Math.max(.62, Math.min(1, r.width / 900));
  const zs = Math.min(2.4, Math.sqrt(G.m.w / vb.w)); // v29: as construções crescem com o zoom
  B.forEach((g, i) => { const t = G.m.terr[i]; g.setAttribute('transform', `translate(${t.x},${t.y}) scale(${k})`); g.firstChild.setAttribute('transform', `scale(${zs.toFixed(2)})`); });
  svg.classList.toggle('names', (1 / u) * Math.sqrt(G.m.w * G.m.h / G.N) > 85);
  if (svg.classList.contains('names')) declutter(k);
}
let NM = null, brdKey = '', ribOn = false;
const TMARK = {
  p: '<path d="M2 9h4M8 4h3" stroke="#0002" stroke-width=".8"/>',
  c: '<path d="M2 8l1-2 1 2M8 3l1-2 1 2" fill="none" stroke="#0003" stroke-width=".7"/>',
  f: '<circle cx="3" cy="3" r="1.7" fill="#0004"/><circle cx="9" cy="9" r="1.7" fill="#0004"/><circle cx="9" cy="3" r="1" fill="#0003"/>',
  s: '<circle cx="2.5" cy="2.5" r="1.6" fill="#0005"/><circle cx="8.5" cy="4" r="1.6" fill="#0005"/><circle cx="5" cy="9" r="1.6" fill="#0005"/><circle cx="11" cy="10" r="1.2" fill="#0004"/>',
  h: '<path d="M1 8q3-4 6 0M6 3q3-3 6 0" fill="none" stroke="#0005" stroke-width=".9"/>',
  m: '<path d="M1 10l3-6 3 6zM6.5 6l2.8-5 2.7 5z" fill="#fff4" stroke="#0006" stroke-width=".5"/>',
  d: '<circle cx="2" cy="3" r=".7" fill="#0004"/><circle cx="8" cy="7" r=".7" fill="#0004"/><circle cx="4" cy="10" r=".7" fill="#0004"/><path d="M6 2q2-1.5 4 0" fill="none" stroke="#0003" stroke-width=".6"/>',
  e: '<path d="M1 4h3M7 9h3M3 11h2" stroke="#0004" stroke-width=".8"/>',
  t: '<path d="M3 2v3M1.5 3.5h3M9 7v3M7.5 8.5h3" stroke="#fff6" stroke-width=".7"/>',
  w: '<path d="M0 4q1.5-1.5 3 0t3 0 3 0 3 0M0 10q1.5-1.5 3 0t3 0 3 0 3 0" fill="none" stroke="#0005" stroke-width=".7"/>',
};
// v29: construções desenhadas em volta do centro do território. Cada construção cai numa classe visual
// (fazenda, mina, porto…); mesma classe repetida vira um ícone só com o número.
const SV = {
  cid1: '<path d="M-3 4V0L0 -2.6L3 0V4Z" fill="#c9a26a"/><path d="M-3.8 .4L0 -3.2L3.8 .4" fill="none" stroke="#7a4a22" stroke-width="1.1"/>',
  cid2: '<path d="M-5 4V0L-2.6 -2L-.2 0V4Z M.6 4V-1.2L3 -3.4L5.2 -1.2V4Z" fill="#d6b07a"/><path d="M-5.6 .4L-2.6 -2.6L.4 .4M0 -.8L3 -4L5.8 -.8" fill="none" stroke="#8a3a22" stroke-width="1"/>',
  cid3: '<path d="M-5.4 4V.5L-3.4 -1.2L-1.4 .5V4ZM3 4V0L4.6 -1.4L5.8 0V4Z" fill="#d6b07a"/><path d="M-1.4 4V-4.4H.4V-5.6H1.4V-4.4H3V4Z" fill="#e8dcc0"/><path d="M-5.8 .7L-3.4 -1.6L-1 .7" fill="none" stroke="#8a3a22" stroke-width=".9"/>',
  cid4: '<path d="M-5.4 4V-1H-3V4ZM-2.6 4V-5H.6V4ZM1 4V-2.6H3V4ZM3.4 4V-.4H5.6V4Z" fill="#cfd6de"/><path d="M-1.8 -3.6H-.2M-1.8 -2H-.2M-1.8 -.4H-.2M-4.8 .4H-3.6M1.5 -1.2H2.5" stroke="#4a5a6a" stroke-width=".7"/>',
  farm: '<path d="M-4.8 3.8L-2.2 -3.4H2.2L4.8 3.8Z" fill="#d4b84a"/><path d="M-.9 -3.4L-2.3 3.8M.9 -3.4L2.3 3.8M0 -3.4V3.8" stroke="#7d6a1e" stroke-width=".6"/>',
  past: '<path d="M-4.6 -.6H4.6M-4.6 2.2H4.6M-3.6 -2.8V3.6M0 -2.8V3.6M3.6 -2.8V3.6" stroke="#c8965a" stroke-width="1.1"/>',
  fish: '<path d="M-4.8 1H4.8L3.2 3.6H-3.2Z" fill="#a8743e"/><path d="M0 1V-4.6L3.8 .2Z" fill="#f2f2f2"/><path d="M0 1V-4.6" stroke="#5a3a1a" stroke-width=".6"/>',
  wood: '<path d="M-2 -4.8L-5 1.2H1Z M2.4 -3.2L-.4 2.2H5.2Z" fill="#4fa05a"/><path d="M-2 1.2V4M2.4 2.2V4" stroke="#6b4a2a" stroke-width="1"/>',
  mine: '<path d="M-5.2 4L-1 -3.6L1.6 -.2L3 -1.8L5.4 4Z" fill="#9a9088"/><path d="M-2.2 4V1.8A1.5 1.5 0 0 1 .8 1.8V4Z" fill="#1a1410"/>',
  ind: '<path d="M-5 4V-.6L-2 1.4V-.6L1 1.4V-4.6H3.2V4Z" fill="#a89c92"/><path d="M1.6 -4.8q1-1.6 2.8-1.1" stroke="#ddd" fill="none" stroke-width=".7"/>',
  mkt: '<path d="M-4.8 -1L-3.8 -4.2H3.8L4.8 -1Z" fill="#e0bc4c"/><path d="M-2.2 -4.2L-2.7 -1M0 -4.2V-1M2.2 -4.2L2.7 -1" stroke="#a83a2a" stroke-width="1.1"/><rect x="-4" y="-1" width="8" height="5" fill="#c9a26a"/><rect x="-1.4" y="1.2" width="2.8" height="2.8" fill="#4a3220"/>',
  port: '<path d="M0 -3.6V3.6M-2 -1.8H2M-4 .8q.4 3.2 4 3.2t4-3.2" fill="none" stroke="#9fd0ee" stroke-width="1.2" stroke-linecap="round"/><circle cy="-4.6" r="1" fill="none" stroke="#9fd0ee" stroke-width=".9"/>',
  tmpl: '<path d="M-3.6 4V-.4L0 -3.2L3.6 -.4V4Z" fill="#dccbf2"/><circle cy="-4.6" r="1.2" fill="#f0c94a"/><rect x="-1" y="1" width="2" height="3" fill="#5a3f7a"/>',
  civ: '<path d="M-5 -2.2H5V4H3.4V1.2A1.6 1.6 0 0 0 .8 1.2V4H-.8V1.2A1.6 1.6 0 0 0 -3.4 1.2V4H-5Z" fill="#ddd0b4"/><path d="M-5 -2.2H5" stroke="#9a8a6a" stroke-width=".8"/>',
  sci: '<path d="M-4.6 4V.2H4.6V4Z" fill="#cddce4"/><path d="M-3.6 .2A3.6 3.6 0 0 1 3.6 .2Z" fill="#6fc0c8"/><path d="M.4 -1.4L4 -4.6" stroke="#2f4f5a" stroke-width="1.1"/>',
  mil: '<path d="M-5 4L0 -2.6L5 4Z" fill="#c8584a"/><path d="M0 -2.6V-5.6" stroke="#ddd" stroke-width=".6"/><path d="M0 -5.6H2.8L2.1 -4.8L2.8 -4H0" fill="#f0d060"/><path d="M0 4L-1.3 1.4H1.3Z" fill="#3a1a14"/>',
  fort: '<path d="M-4 4V-3.2H-2.6V-2H-1.4V-3.2H1.4V-2H2.6V-3.2H4V4Z" fill="#b4aea6"/><path d="M-1.1 4V1.3A1.1 1.1 0 0 1 1.1 1.3V4Z" fill="#2a2420"/>',
  cult: '<ellipse rx="4.8" ry="3.2" cy=".5" fill="#d0a870"/><ellipse rx="3" ry="1.8" cy=".7" fill="#8a6a3a"/><ellipse rx="1.6" ry=".9" cy=".9" fill="#e0c8a0"/>',
  air: '<path d="M-.6 -5H.6V-1.6L5 .5V1.7L.6 .6V3L2 4V4.9L0 4.3L-2 4.9V4L-.6 3V.6L-5 1.7V.5L-.6 -1.6Z" fill="#e4e8f0"/>',
  won: '<path d="M0 -5L1.2 -1.6H4.8L1.9 .6L3 4.2L0 2L-3 4.2L-1.9 .6L-4.8 -1.6H-1.2Z" fill="#f2c94c" stroke="#7a5a10" stroke-width=".4"/>',
};
const SVN = { farm: 'Agricultura', past: 'Pecuária', fish: 'Pesca', wood: 'Floresta', mine: 'Mineração', ind: 'Indústria e ofícios', mkt: 'Comércio', port: 'Porto', tmpl: 'Fé e cultura', civ: 'Obras públicas', sci: 'Saber', mil: 'Exército', fort: 'Defesa', cult: 'Espetáculos', air: 'Aviação', won: 'Maravilha' };
const SVK = { farm: 'agr faz cel irr moi arz pla jar', past: 'pec etc har chq', fish: 'pes psq slg', wood: 'flo ser cvo', mine: 'min pdr mna gar fun', ind: 'ofi frr egh rfn txt', mkt: 'mer car ban bol arm', port: 'por stl cia frl', tmpl: 'tem mos cat mon', civ: 'aqu san hos tri frm', sci: 'aca acd obs uni epb', mil: 'qua ars pov acm sil', fort: 'for pal cas fab bkr', cult: 'anf tea etd', air: 'aer apt' };
const SVZ = { agr: 'farm', pec: 'past', pes: 'fish', flo: 'wood', min: 'mine', com: 'mkt', por: 'port', rel: 'tmpl', mil: 'mil', sci: 'sci' };
const SVY = { food: 'farm', prod: 'ind', gold: 'mkt', sci: 'sci', pre: 'tmpl', stab: 'civ' };
const svOf = k => { const S = STRUCT[k]; if (!S || S.road) return null; if (S.wonder) return 'won'; for (const c in SVK) if (SVK[c].split(' ').includes(k)) return c; return S.def ? 'fort' : S.air ? 'air' : S.rf || S.atk ? 'mil' : S.nav ? 'port' : SVZ[S.z] || SVY[Object.keys(S.y || {})[0]] || 'ind'; };
// v50 (UI-17): cada desenho ganha uma silhueta escura (sv-x-d) que serve de contorno e de volume: desenhada deslocada
// sob o desenho colorido, dá o relevo; uma elipse no chão faz a sombra. Sem filtros, para o mapa continuar leve.
const svDark = d => d.replace(/<(\w+)([^>]*?)\/>/g, (m, tag, at) => { const w = +(/stroke-width="([\d.]+)"/.exec(at) || [0, 0])[1], line = !/fill="#/.test(at); return `<${tag}${at.replace(/ (fill|stroke|stroke-width)="[^"]*"/g, '')} fill="${line ? 'none' : '#0c1118'}" stroke="#0c1118" stroke-width="${w + 1.5}" stroke-linejoin="round"/>`; });
const svDefs = () => Object.entries(SV).map(([k, d]) => `<symbol id="sv-${k}" viewBox="-6 -6 12 12" overflow="visible">${d}</symbol><symbol id="sv-${k}-d" viewBox="-6 -6 12 12" overflow="visible">${svDark(d)}</symbol>`).join('');
// vagas em volta do emblema (fora dos pontinhos e do nome). A primeira é da cidade, que cresce com o porte.
const SVP = [[-24, -4], [21, -4], [-13, -19], [15, -19], [36, -5], [-40, -6], [30, -20], [-29, -21], [0, -30], [-14, -33]];
function svHtml(i) {
  const c = new Map(), lv = G.lv[i] || 0; if (lv && (G.tr[i] || real(G.own[i]))) c.set('cid' + Math.min(4, lv), 1);
  for (const k of G.bld[i]) { const v = svOf(k); if (v) c.set(v, (c.get(v) || 0) + 1); }
  const hasC = lv && c.has('cid' + Math.min(4, lv));
  return [...c].slice(0, SVP.length).map(([v, n], s) => {
    const cid = v.startsWith('cid'), [x, y] = SVP[hasC ? s : s + 1] || SVP[0], z = cid ? 1.25 + .2 * Math.min(4, lv) : v === 'won' ? 1.45 : 1.2, u = `href="#sv-${v}`, box = 'x="-5" y="-5" width="10" height="10"';
    return `<g transform="translate(${x},${y - (cid ? (z - 1.2) * 4 : 0)}) scale(${z})"><title>${cid ? pName(i) : SVN[v] + (n > 1 ? ' ×' + n : '')}</title><ellipse class="svs" cx=".8" cy="4.4" rx="5.6" ry="1.7"/><use ${u}-d" ${box} transform="translate(.9,.9)"/><use ${u}-d" ${box}/><use ${u}" ${box}/>${n > 1 ? `<text x="5" y="6.5" class="svn">${n}</text>` : ''}</g>`;
  }).join('');
}
const terrDefs = () => Object.entries(TERR).map(([k, T]) => `<pattern id="tr-${k}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${T.c}"/>${TMARK[k] || ''}</pattern>`).join('');
// faixa da cor do dono por dentro do contorno (recorte do próprio território); feita só quando a visão de relevo abre
function ribbons() {
  const R = $('#rib'); if (!R) return;
  const on = G.lens === 'rel'; R.style.display = on ? '' : 'none'; if (!on) return;
  if (!ribOn) { R.innerHTML = G.m.terr.map((t, i) => `<clipPath id="ck${i}"><path d="${t.d}"/></clipPath><path class="rb" d="${t.d}" clip-path="url(#ck${i})"/>`).join(''); ribOn = true; }
  const ps = R.querySelectorAll('path.rb');
  for (let i = 0; i < G.N; i++) { const o = G.own[i], show = (real(o) || o === 'reb') && !(G.seen && !G.seen.has(i)); ps[i].style.display = show ? '' : 'none'; if (show) ps[i].setAttribute('stroke', Fa(o).c); }
}
// contorno de cada território dividido em segmentos, cada um com o vizinho do outro lado (-1 = costa).
// Segmento colado a outra parte do mesmo território é linha interna e some. Tolerância de 2,5 porque
// alguns mapas desenham os vizinhos com frestas pequenas.
function outlines(m) {
  if (m._ol) return m._ol;
  const segs = [], cell = 10, grid = new Map(), TOL = 2.5;
  m.terr.forEach((t, i) => t.d.split(/(?=M)/).forEach((s, k) => { const a = (s.match(/-?\d+(?:\.\d+)?/g) || []).map(Number); if (a.length < 6) return; for (let p = 0; p < a.length; p += 2) { const q = (p + 2) % a.length; segs.push([a[p], a[p + 1], a[q], a[q + 1], i, k]); } }));
  segs.forEach((s, n) => { for (let x = Math.floor(Math.min(s[0], s[2]) / cell); x <= Math.floor(Math.max(s[0], s[2]) / cell); x++) for (let y = Math.floor(Math.min(s[1], s[3]) / cell); y <= Math.floor(Math.max(s[1], s[3]) / cell); y++) { const c = x + ',' + y; if (!grid.has(c)) grid.set(c, []); grid.get(c).push(n); } });
  const dps = (px, py, s) => { const dx = s[2] - s[0], dy = s[3] - s[1], L = dx * dx + dy * dy, t = L ? Math.max(0, Math.min(1, ((px - s[0]) * dx + (py - s[1]) * dy) / L)) : 0; return Math.hypot(px - s[0] - t * dx, py - s[1] - t * dy); };
  const out = [];
  for (const s of segs) {
    const mx = (s[0] + s[2]) / 2, my = (s[1] + s[3]) / 2, cx = Math.floor(mx / cell), cy = Math.floor(my / cell); let best = TOL, who = -1;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (const n of grid.get((cx + dx) + ',' + (cy + dy)) || []) { const o = segs[n]; if (o[4] === s[4] && o[5] === s[5]) continue; const d = dps(mx, my, o); if (d < best) { best = d; who = o[4]; } }
    if (who !== s[4]) out.push([s[0], s[1], s[2], s[3], s[4], who]);
  }
  return m._ol = out;
}
// v28: traçado da estrada entre vizinhos. Com relevo real, vem pronto do maps/relevo.js (contorna serras);
// sem ele, curva suave que cruza a divisa no ponto mais perto da reta entre os centros.
function roadD(i, j) {
  const m = G.m, c = m._rd || (m._rd = {}), k = i + '-' + j; if (c[k]) return c[k];
  const R = typeof RELIEF !== 'undefined' && RELIEF[G.sc.map] && RELIEF[G.sc.map].r; if (R && (R[k] || R[j + '-' + i])) return c[k] = R[k] || R[j + '-' + i];
  const A = m.terr[i], B = m.terr[j], mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2; let p = [mx, my], bd = Infinity;
  for (const s of outlines(m)) if ((s[4] === i && s[5] === j) || (s[4] === j && s[5] === i)) { const x = (s[0] + s[2]) / 2, y = (s[1] + s[3]) / 2, d = (x - mx) ** 2 + (y - my) ** 2; if (d < bd) { bd = d; p = [x, y]; } }
  const f = v => +v.toFixed(1), t = .5; // Catmull-Rom por A, p, B
  return c[k] = `M${A.x} ${A.y}C${f(A.x + (p[0] - A.x) * t / 1.5)} ${f(A.y + (p[1] - A.y) * t / 1.5)} ${f(p[0] - (B.x - A.x) / 6)} ${f(p[1] - (B.y - A.y) / 6)} ${f(p[0])} ${f(p[1])}C${f(p[0] + (B.x - A.x) / 6)} ${f(p[1] + (B.y - A.y) / 6)} ${f(B.x - (B.x - p[0]) * t / 1.5)} ${f(B.y - (B.y - p[1]) * t / 1.5)} ${B.x} ${B.y}`;
}
// costa, divisa entre territórios do mesmo dono e divisa entre impérios (destacada); refaz só quando os donos mudam
function drawBorders() {
  const key = G.own.join() + (G.seen ? G.seen.size : ''); if (key === brdKey) return; brdKey = key;
  const O = outlines(G.m), d = { c: '', p: '', e: '' }, last = { c: null, p: null, e: null };
  for (const s of O) {
    const j = s[5], k = j < 0 ? 'c' : G.own[s[4]] === G.own[j] ? (s[4] < j ? 'p' : null) : 'e'; if (!k) continue;
    if (last[k] && last[k][0] === s[0] && last[k][1] === s[1]) d[k] += `L${s[2]} ${s[3]}`; else d[k] += `M${s[0]} ${s[1]}L${s[2]} ${s[3]}`;
    last[k] = [s[2], s[3]];
  }
  $('#brd').innerHTML = `<path class="bc0" d="${d.c}"/><path class="bp" d="${d.p}"/><path class="beh" d="${d.e}"/><path class="be" d="${d.e}"/>`;
}
// ligação marítima: pontos de costa mais próximos entre os dois territórios (guardados no mapa)
function seaEnds(m) {
  if (m._sl) return m._sl;
  const pts = d => (d.match(/-?\d+(?:\.\d+)?/g) || []).map(Number), V = m.terr.map(t => pts(t.d)), cell = 6, grid = new Map(), key = (x, y) => Math.floor(x / cell) + ',' + Math.floor(y / cell);
  V.forEach((A, i) => { for (let p = 0; p < A.length; p += 2) { const k = key(A[p], A[p + 1]); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i, A[p], A[p + 1]); } });
  // costa: vértice sem vértice de outro território por perto (a fronteira terrestre fica de fora)
  const coast = i => {
    const A = V[i], out = [];
    for (let p = 0; p < A.length; p += 2) {
      const x = A[p], y = A[p + 1], cx = Math.floor(x / cell), cy = Math.floor(y / cell); let near = false;
      for (let dx = -1; dx <= 1 && !near; dx++) for (let dy = -1; dy <= 1 && !near; dy++) { const c = grid.get((cx + dx) + ',' + (cy + dy)) || []; for (let q = 0; q < c.length; q += 3) if (c[q] !== i && Math.abs(c[q + 1] - x) < 2.5 && Math.abs(c[q + 2] - y) < 2.5) { near = true; break; } }
      if (!near) out.push(x, y);
    }
    return out.length ? out : A;
  };
  return m._sl = m.sea.map(([a, b, w]) => {
    let best = [Infinity, m.terr[a].x, m.terr[a].y, m.terr[b].x, m.terr[b].y]; if (w) return best.slice(1);
    const A = coast(a), C = coast(b);
    for (let p = 0; p < A.length; p += 2) for (let q = 0; q < C.length; q += 2) { const d = (A[p] - C[q]) ** 2 + (A[p + 1] - C[q + 1]) ** 2; if (d < best[0]) best = [d, A[p], A[p + 1], C[q], C[q + 1]]; }
    return best.slice(1).map(v => +v.toFixed(1));
  });
}
// ligação que ainda cruzaria terra vira só os dois portos (a linha some)
function seaVia() {
  const bg = svg.querySelector('.bgl'), tests = bg ? [bg, ...P] : P; if (!tests[0] || !tests[0].isPointInFill) return;
  svg.querySelectorAll('.sealinks > g').forEach(gr => {
    const l = gr.querySelector('line'), s = G.m.sea[+gr.dataset.k]; if (!l || s[2]) return;
    const [x1, y1, x2, y2] = ['x1', 'y1', 'x2', 'y2'].map(a => +l.getAttribute(a)), pt = svg.createSVGPoint();
    const land = [.2, .3, .4, .5, .6, .7, .8].some(t => { pt.x = x1 + (x2 - x1) * t; pt.y = y1 + (y2 - y1) * t; return tests.some(e => e.isPointInFill(pt)); });
    gr.classList.toggle('via', land);
  });
}
function declutter(k) { // ponytail: caixas aproximadas pelo número de letras, O(n²) com n até 160
  if (!NM || NM.length !== B.length || !NM[0].isConnected) NM = B.map(g => g.querySelector('.nm'));
  const me = G.player, pr = i => G.own[i] === me ? 0 : real(G.own[i]) && Fa(G.own[i]).capI === i ? 1 : 2, box = [];
  G.m.terr.map((t, i) => i).sort((a, b) => pr(a) - pr(b)).forEach(i => {
    const t = G.m.terr[i], w = t.n.length * 3.1 * k, x = t.x, y = t.y + 23 * k;
    const hit = box.some(b => Math.abs(b[0] - x) < b[2] + w && Math.abs(b[1] - y) < 13 * k) || G.m.terr.some((o, j) => j !== i && !B[j].hasAttribute('hidden') && Math.abs(o.x - x) < w + 11 * k && Math.abs(o.y - y + 4 * k) < 16 * k);
    NM[i].style.visibility = hit ? 'hidden' : ''; if (!hit) box.push([x, y, w]);
  });
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
    if (dr && !dr.moved && !dr.pinch && !ptr.size && svg.contains(e.target)) { const el = dr.el.closest && dr.el.closest('[data-i]'); if (el) onTerr(+el.dataset.i); }
    if (!ptr.size) dr = null;
  };
  window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up); // soltar fora do mapa também encerra o toque
  new ResizeObserver(() => G && setVB()).observe(svg);
}
function renderMap() {
  civSee(); if (G.seen) svg.querySelectorAll('.sealinks > g').forEach(l => { const s = G.m.sea[+l.dataset.k]; l.style.display = s && G.seen.has(s[0]) && G.seen.has(s[1]) ? '' : 'none'; });
  const net = G.lens === 'net' ? netOf(G.player) : null;
  drawBorders(); ribbons();
  const hasRL = !!$('#relc'); if (hasRL) { $('#relc').style.display = G.lens === 'rel' ? '' : 'none'; $('#relS').style.display = G.lens === 'rel' ? 'none' : ''; }
  for (let i = 0; i < G.N; i++) {
    const o = G.own[i], F = Fa(o);
    const L = o === 'off' ? 'own' : G.lens || 'own', z = zonesAt(i)[0];
    P[i].setAttribute('fill', L === 'net' ? (net.core.has(i) ? '#c9a227' : net.linked.has(i) ? '#7d6a2a' : o === G.player ? '#5b3a34' : '#2a323d') : L === 'ter' ? TERR[G.ter[i]].c : L === 'rel' ? (hasRL ? '#0000' : `url(#tr-${G.ter[i]})`) : L === 'zon' ? (z ? ZC[STRUCT[z].z] : '#2a323d') : L === 'res' ? (G.dep[i].some(d => DEP[d].lux) ? '#6d4f86' : G.dep[i].length ? '#4f5d6e' : '#2a323d') : o === 'reb' ? 'url(#hatch)' : o === 'neu' && $('#relS') ? '#8b8a7a' : F.c);
    const fog = !!G.seen && !G.seen.has(i); if (fog) P[i].setAttribute('fill', '#161b22'); // MC-11
    P[i].setAttribute('stroke', L === 'rel' && !fog ? (hasRL ? '#0000' : TERR[G.ter[i]].c) : P[i].getAttribute('fill')); // fecha as frestas entre partes do mesmo território
    P[i].classList.toggle('off', o === 'off');
    const g = B[i]; g.toggleAttribute('hidden', o === 'off' || fog);
    g.querySelector('.bc').setAttribute('fill', F.c); g.querySelector('.bn').textContent = G.tr[i];
    g.querySelector('.cap').toggleAttribute('hidden', !capOwner(i));
    const lv = G.tr[i] || real(o) ? G.lv[i] || 0 : 0; g.querySelectorAll('.lvp circle').forEach((c, n) => { c.classList.toggle('on', n < lv); c.classList.toggle('half', !!lv && n === lv && !!subOf(i)); }); g.querySelector('.lvp').toggleAttribute('hidden', !lv);
    P[i].firstChild.textContent = `${G.m.terr[i].n} · ${lv ? pName(i) : 'ermo'} · ${G.tr[i]} tropas`;
    const drawn = !['res', 'zon', 'ter'].includes(L), sv = drawn ? svHtml(i) : '', sg = g.querySelector('.sv'); if (sg.dataset.k !== sv) { sg.innerHTML = sv; sg.dataset.k = sv; } // v29
    const ics = L === 'res' ? G.dep[i].map(d => DEP[d].ic) : L === 'zon' ? zonesAt(i).map(k => STRUCT[k].ic) : drawn ? [] : G.bld[i].map(k => STRUCT[k].ic);
    if (L === 'ter') ics.unshift(TERR[G.ter[i]].ic + (G.riv[i] ? '〰' : ''), LEVEL[G.lv[i]].ic);
    g.querySelector('.ic').textContent = (G.relics.includes(i) ? 'ᚱ' : '') + ics.slice(0, 3).join('') + (ics.length > 3 ? '+' + (ics.length - 3) : '') + (G.fort[i] > 0 ? '⛨' : '') + (occupied(i) ? '⚑' : '') + (o === G.player && G.q[i].length ? '⏳' : '');
    g.classList.toggle('lightbg', light(F.c));
  }
  // parte 5: estradas entre vizinhos que têm estrada (do mesmo dono), com traçado de verdade (roadD); v28
  const T = G.m.terr, rc = [], rl = [];
  for (let i = 0; i < G.N; i++) if (road(i)) for (const j of G.A[i]) if (j > i && road(j) && G.own[i] === G.own[j] && !isSea(i, j)) { const d = roadD(i, j), k = Math.min(road(i), road(j)); rc.push(`<path d="${d}" class="rk rk${k}"/>`); rl.push(`<path d="${d}" class="rd rd${k}"/>`); }
  for (const r of G.routes) { const a = T[r.a], b = T[r.b], dx = b.x - a.x, dy = b.y - a.y; rl.push(`<path d="M${a.x} ${a.y}Q${(a.x + b.x) / 2 - dy * .18} ${(a.y + b.y) / 2 + dx * .18} ${b.x} ${b.y}" class="rt${r.f === G.player || r.o === G.player ? ' me' : ''}${r.k === 'sup' ? ' sup ' + r.c + (supCut(r) ? ' cut' : '') : ''}"/>`); } // parte 6: rota em arco; v35 abastecimento
  $('#roads').innerHTML = rc.join('') + rl.join('');
  legend(net);
  document.querySelectorAll('#lens button').forEach(b => b.classList.toggle('on', b.dataset.l === (G.lens || 'own')));
  const hl = [], me = G.player, my = G.turnF === me;
  const p = (j, c) => hl.push(`<path d="${G.m.terr[j].d}" class="${c}"/>`);
  if (G.sel != null) { G.A[G.sel].filter(j => G.own[j] !== 'off').forEach(j => p(j, 'hn')); p(G.sel, 'hs'); } // v49: as fronteiras da região selecionada ficam marcadas
  const md = my && modeTest(G.mode);
  if (md) for (let j = 0; j < G.N; j++) if (md(j)) p(j, G.mode === 'air' || G.mode === 'agit' ? 'ha' : 'hm');
  else if (my && G.sel != null && G.tgt == null) {
    if (G.phase === 'atk') G.A[G.sel].filter(j => canAtk(me, G.sel, j)).forEach(j => p(j, 'ht'));
    if (G.phase === 'mov' && (G.mv[G.sel] || 0) > 0) moveDests(me, G.sel).filter(j => seaOk(me, G.sel, j)).forEach(j => p(j, 'hm'));
  }
  if (G.tgt != null) p(G.tgt, 'hx');
  $('#hl').innerHTML = hl.join('');
}
// legenda da lente atual (v34): só as cores que aparecem no mapa
function legend(net) {
  const L = G.lens || 'own', el = $('#lgd'); if (!el) return;
  const vis = [...Array(G.N).keys()].filter(i => G.own[i] !== 'off' && (!G.seen || G.seen.has(i)));
  const it = (c, t) => `<span><i style="background:${c}"></i>${t}</span>`;
  let h = '';
  if (L === 'ter') h = [...new Set(vis.map(i => G.ter[i]))].map(k => it(TERR[k].c, TERR[k].ic + ' ' + TERR[k].n)).join('');
  else if (L === 'zon') { const zs = [...new Set(vis.flatMap(i => zonesAt(i).map(k => STRUCT[k].z)))]; h = zs.length ? zs.map(z => it(ZC[z], ZONE[z])).join('') : '<span>Nenhuma zona construída ainda: obras como fazendas, minas e mercados criam zonas.</span>'; }
  else if (L === 'res') h = it('#6d4f86', 'Tem luxo') + it('#4f5d6e', 'Só jazidas comuns') + it('#2a323d', 'Sem jazidas') + '<span>Ícones: jazidas do território</span>';
  else if (L === 'net') h = it('#c9a227', 'Núcleo da sua rede') + it('#7d6a2a', 'Ligado à rede') + it('#5b3a34', 'Seu, fora da rede') + it('#2a323d', 'Outros');
  el.hidden = !h; el.innerHTML = h ? '<b>' + $('#lens button.on').textContent + '</b>' + h : '';
}
const ZC = { agr: '#8fae3c', pec: '#b69a52', pes: '#3f8fb0', flo: '#2f7a42', min: '#857868', com: '#c9a227', por: '#2f5f8f', rel: '#9a6ac0', mil: '#a33b33', sci: '#3fa7a0' };
function light(c) { const n = parseInt(c.slice(1), 16); return ((n >> 16) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11) > 165; }

// ---------- interação ----------
function onTerr(i) {
  if (!G || G.over) return;
  if (!G.mode && !G.card) G.tab = 'reg'; // v49: clicar no mapa abre a aba da região (com modo ou carta ativos o clique é mira)
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
    else if (!Fa(me).camp && G.sel != null && G.own[G.sel] === me && G.A[G.sel].includes(i) && hostile(me, i)) toast('Para atacar, declare uma Campanha (botão em Militar, não custa nada; acumula cansaço de guerra).');
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
  G.phase = p; G.tgt = null; G.card = null; G.mode = null; hideBattle(); // v49: a seleção fica, para continuar na mesma região
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
// v49 (UI-15): ações disparadas de dentro da região. Recrutamento e obras abrem sozinhos (não custam nada desde a v24)
function regionAct(a, i, k, j) {
  const me = G.player, F = Fa(me);
  if (G.turnF !== me || G.busy || G.over || G.tgt != null) return;
  G.card = null; G.mode = null;
  if (a === 'mvFrom') {
    if (G.phase !== 'mov' || !(G.mv[i] > 0) || !moveDests(me, i).includes(j)) return toast('Sem tropas livres para mover por aqui.');
    if (!seaOk(me, i, j)) return toast('Sem frota disponível para atravessar o mar.');
    G.sel = i; G.tgt = j; render(); return showMovePanel();
  }
  if (G.phase !== 'atk') return toast('Isso acontece na fase de ações.');
  if (a === 'atkFrom') { const w = atkWhy(me, i, j); if (w) return toast(w); G.sel = i; G.tgt = j; render(); return showBattlePanel(); }
  let err = '';
  if (a === 'recAt') { if (!F.recOn) err = act(me, 'rec'); if (!err && !recruit(me, i)) err = F.gold < troopCost(me) ? 'Ouro insuficiente.' : 'Recrute na capital ou num território com ' + sName('qua') + '.'; if (!err) toast(`Recruta a caminho de ${tname(i)}: chega no seu próximo turno.`); }
  else if (a === 'bldAt') { if (!F.bldOn) err = act(me, 'obras'); if (!err) err = act(me, 'bld', k, i); if (!err) toast(`${sName(k)} entrou na fila de ${tname(i)}.`); }
  else if (a === 'inflAt') { err = act(me, 'infl', i); if (!err) { G.sel = i; toast(`${tname(i)} aderiu ao seu império.`); } }
  if (err) toast(err);
  render();
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
    if (!F.bldOn) return toast('Abra as obras primeiro (botão Ordenar obras).');
    if (!owned(me).some(i => canQueue(me, k, i))) return toast('Nenhum território seu aceita esta obra agora.');
    G.mode = 'bld:' + k; toast(`Clique nos territórios destacados para pôr ${sName(k)} na fila.`); return render();
  }
  if (hint[a]) { G.mode = a; toast(hint[a]); return render(); }
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
  // revelação: o que você sabe e o que pode pesquisar aparece inteiro; o passo seguinte aparece como silhueta; o resto fica oculto
  const near = t => techOk(me, t) || has(me, t.k), vis = t => near(t) ? 2 : (t.req || []).every(r => near(TK[r])) ? 1 : 0;
  const ghost = t => `<div class="tech lock ghost"><div><b>❔ Por descobrir</b> <span class="hint">${techCost(t, me)} 🔬 · depois de ${esc((t.req || []).filter(r => !has(me, r)).map(tName).join(' e '))}</span></div></div>`;
  const sec = ts => { const v = ts.filter(vis), n = ts.length - v.length; return v.map(t => vis(t) === 2 ? row(t) : ghost(t)).join('') + (n ? `<p class="hint">+${n} tecnologia(s) ainda ocultas: aparecem quando você chegar perto delas.</p>` : '') || '<p class="hint">Nada aqui.</p>'; };
  const row = t => {
    const own = has(me, t.k), ok = techOk(me, t), on = F.res === t.k, can = ok && !on && G.turnF === me, c = techCost(t, me);
    const req = (t.req || []).map(tName).join(' e '), left = Math.max(0, c - F.sci), eta = left ? Math.ceil(left / si) : 0;
    const lib = [...Object.keys(STRUCT).filter(k => STRUCT[k].tech === t.k).map(sName), ...Object.values(ARMY).filter(a => a.tech === t.k).map(a => a.n)];
    return `<div class="tech ${own ? 'own' : ok ? '' : 'lock'}"><div><b>${esc(tName(t.k))}</b> <span class="hint">${c} 🔬${req ? ' · exige ' + esc(req) : ''}</span><p>${esc(t.fx)}</p>${lib.length ? `<p class="hint">libera: ${esc(lib.join(', '))}</p>` : ''}${on ? `<p class="hint">${pbar(F.sci, c)} ${eta ? `pronta em ${eta} turno(s)` : 'pronta no início do próximo turno'}</p>` : ok ? `<p class="hint">${pbar(F.sci, c)} o saber acumulado cobre ${Math.min(100, Math.round(100 * F.sci / c))}%${si ? ` · cerca de ${Math.max(1, Math.ceil(Math.max(0, c - F.sci) / si))} turno(s)` : ''}</p>` : ''}</div>${own ? '<span class="ok">✓</span>' : on ? '<span class="ok">em pesquisa</span>' : `<button class="mini ${can ? 'pri' : ''}" data-a="tech" data-k="${t.k}" ${can ? '' : 'disabled'}>Pesquisar</button>`}</div>`;
  };
  modal(`<h2>Tecnologias · ${esc(G.era.n)}</h2><p class="hint">Saber acumulado: ${F.sci} 🔬 (+${si} por turno). Escolher a pesquisa não gasta ação: o saber de cada turno vai para ela e ela fica pronta no início do turno em que o custo for atingido. Trocar de pesquisa não perde nada: o saber fica guardado e vai para a próxima escolha. A árvore só mostra o que você já sabe, o que pode pesquisar agora e, como silhueta, o passo seguinte. Cada tecnologia nova vale 2 de legado. Tropas: ${esc(armyOf(me).map(k => ARMY[k].n).join(', ') || 'só milícia')}.</p>${[['Antiguidade', t => !t.doc && t.e === 0], ['Idade Média', t => !t.doc && t.e === 1], ['Idade Moderna', t => !t.doc && t.e === 2], ['Revolução Industrial', t => t.e === 3], ['Era Moderna', t => t.e === 4], ['Era Atômica', t => t.e === 5], ['Era da Informação', t => t.e === 6], ['Futuro próximo', t => t.e === 7], ['Doutrinas', t => t.doc]].map(([n, fl]) => `<h3>${n}</h3><div class="techs">${sec(TECH.filter(fl))}</div>`).join('')}`, [['Fechar']]);
}
const pbar = (v, max) => `<span class="bar"><i style="width:${Math.min(100, 100 * v / max)}%;background:var(--brass)"></i></span>`;
// fila de um território (UI-02 e UI-06)
function qHtml(i) {
  const me = G.player, F = Fa(me), mine = G.own[i] === me, eta = qEta(i);
  if (!G.q[i].length) return '<p class="hint">Fila vazia.</p>';
  return '<ul class="q">' + G.q[i].map((x, n) => {
    const c = pCost(G.own[i], x.k, i), rc = rushCost(me, i, n);
    const btn = mine && G.turnF === me && G.phase === 'atk' ? (true ? `<button class="mini" data-a="rush" data-i="${i}" data-n="${n}" ${canRush(me, i, n) ? '' : 'disabled'} title="${x.t >= G.round ? 'Não dá para apressar no turno em que a obra começou.' : ''}">Apressar ${rc}💰</button><button class="mini" data-a="unq" data-i="${i}" data-n="${n}" title="Retirar da fila (perde o progresso)">✕</button>` : '') : '';
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
// v50 (C-300): catálogo por finalidade. Cada grupo abre com o conselho de quando vale a pena; cada ficha diz o que faz, o que abre e o que falta
function catalogModal() {
  const me = G.player, by = {};
  Object.keys(STRUCT).filter(k => !STRUCT[k].air || G.air).forEach(k => (by[sCat(k)] = by[sCat(k)] || []).push(k));
  const row = k => { const S = STRUCT[k], ok = owned(me).some(i => canQueue(me, k, i)), op = sOpens(k); return `<div class="tech${ok ? '' : ' off'}"><div><b>${S.ic || '🏛'} ${esc(sName(k))}</b> <span class="hint">${pCost(me, k)}⚒${S.up ? ' · manutenção ' + S.up + '💰 por turno' : ''}${S.lg ? ' · legado ' + S.lg : ''}</span><br><span class="hint">${esc(S.fx)}</span>${op.length ? `<br><span class="hint">Abre caminho para: ${op.map(x => esc(sName(x))).join(', ')}.</span>` : ''}<br><span class="hint">${ok ? '✓ disponível em algum território seu' : reqText(k)}</span></div></div>`; };
  const secs = Object.keys(SCAT).filter(c => by[c]).map((c, n) => `<details class="rdet"${n ? '' : ' open'}><summary>${SCAT[c][0]} <span class="hint">${by[c].filter(k => owned(me).some(i => canQueue(me, k, i))).length} de ${by[c].length} disponíveis</span></summary><p class="hint adv">${esc(SCAT[c][1])}</p><div class="techs">${by[c].map(row).join('')}</div></details>`).join('');
  modal(`<h2>Catálogo de construções</h2><p class="hint">Agrupado pelo que cada obra faz. A zona abre as construções da cadeia dela; algumas pedem bens explorados em qualquer território seu. Para construir, clique num território seu e abra a sub-aba Obras.</p>${secs}`, [['Fechar']]);
}
// v51 (UI-23): aba Obras. Tudo de construção do império num lugar só: filas, o que construir e as cadeias
const kp = (ic, lab, v, d, tip, cls = '') => `<div class="kp ${cls}" title="${esc(tip)}"><small>${ic} ${lab}</small><b>${v}</b>${d != null ? `<i class="${String(d).startsWith('−') || String(d).startsWith('-') ? 'neg' : ''}">${d}</i>` : ''}</div>`;
function chainHtml(k, seen, d) {
  const me = G.player, S = STRUCT[k], n = countB(me, k), ok = owned(me).some(i => canQueue(me, k, i)), kids = d < 4 ? sOpens(k).filter(x => !seen.has(x)) : [];
  kids.forEach(x => seen.add(x));
  return `<li><span class="cn ${n ? 'has' : ok ? 'can' : 'no'}"><b>${S.ic || '🏛'} ${esc(sName(k))}</b> <span class="hint">${pCost(me, k)}⚒ · ${esc(S.fx || '')}</span><br><span class="hint">${n ? `✓ você tem ${n}` : ok ? '● pode construir agora' : '🔒 ' + reqText(k)}${S.tech ? ` · tecnologia ${esc(tName(S.tech))}${has(me, S.tech) ? ' ✓' : ''}` : ''}</span></span>${kids.length ? `<ul>${kids.map(x => chainHtml(x, seen, d + 1)).join('')}</ul>` : ''}</li>`;
}
function worksTab() {
  const me = G.player, F = Fa(me), T = owned(me), u = upkeepOf(me), my = G.turnF === me && !G.over && !G.busy, can = my && G.phase === 'atk';
  const os = ['fil', 'con', 'cad'].includes(G.osub) ? G.osub : 'fil';
  const idle = T.filter(i => !G.q[i].length), busy = T.length - idle.length;
  const tabs = [['fil', `📋 Filas${idle.length ? ' • ' + idle.length : ''}`], ['con', '🔨 Construir'], ['cad', '🌳 Cadeias']];
  let h = `<h4>Obras do império</h4><div class="kpis">${kp('🏗', 'Em obra', busy, `de ${T.length} território(s)`, 'Territórios com alguma obra na fila.')}${kp('💤', 'Ociosos', idle.length, idle.length ? 'produção parada' : 'nenhum', 'Território sem obra na fila não aproveita a produção ⚒ dele.', idle.length ? 'warn' : '')}${kp('💰', 'Manutenção', u.b, 'por turno', 'Ouro que as construções prontas custam por turno. Sem ouro, elas são desativadas.')}</div>
    <div class="stabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${k === os}" class="${k === os ? 'on' : ''}" data-a="stab" data-g="osub" data-k="${k}">${l}</button>`).join('')}</div>`;
  if (!can) h += `<p class="hint adv">${my ? 'Novas obras entram na fila na fase de ações.' : 'Você pode consultar tudo; para mexer nas filas, espere o seu turno.'}</p>`;
  if (os === 'fil') {
    h += `<p class="hint">A produção ⚒ de cada território avança a obra do topo da fila dele (até ${qMax(me)} na fila). Apressar custa ouro; retirar perde o progresso.</p>`;
    h += [...idle, ...T.filter(i => G.q[i].length).sort((a, b) => prodOf(b) - prodOf(a))].map(i => `<div class="rbox${G.q[i].length ? '' : ' idle'}"><h5><button class="lnk" data-a="selObr" data-i="${i}" title="Abrir as obras de ${esc(tname(i))}">${esc(tname(i))}</button> <span class="hint">${esc(pName(i))} · ${prodOf(i)} ⚒ por turno · zonas ${zonesAt(i).length}/${G.lv[i]} · ${G.bld[i].length} construção(ões)${occupied(i) ? ' · ocupado' : ''}</span></h5>${G.q[i].length ? qHtml(i) : '<p class="hint">💤 Sem obra: a produção deste território está parada.</p>'}<button class="mini${G.q[i].length ? '' : ' pri'}" data-a="selObr" data-i="${i}">➕ Escolher obra aqui</button></div>`).join('');
  } else if (os === 'con') {
    const by = {}, all = Object.keys(STRUCT).filter(k => !STRUCT[k].air || G.air);
    all.forEach(k => (by[sCat(k)] = by[sCat(k)] || []).push(k));
    const cats = Object.keys(SCAT).filter(c => by[c]); if (!cats.includes(bcat)) bcat = cats[0];
    const where = k => T.filter(i => canQueue(me, k, i)).map(i => { const pr = prodOf(i) + supNet(i, 'prod'), w = G.q[i].reduce((t, x) => t + pCost(me, x.k, i) - x.p, 0) + pCost(me, k, i); return [i, pr ? Math.ceil(w / pr) : Infinity]; }).sort((a, b) => a[1] - b[1]);
    const okN = c => by[c].filter(k => where(k).length).length;
    h += `<p class="hint">Escolha o que construir pela finalidade; cada ficha mostra onde cabe e em quantos turnos fica pronta em cada território.</p><div class="cats">${cats.map(c => `<button class="mini ${c === bcat ? 'on' : ''}" data-a="bcat" data-k="${c}">${SCAT[c][0]} <small>${okN(c)}/${by[c].length}</small></button>`).join('')}</div><p class="hint adv">${esc(SCAT[bcat][1])}</p>`;
    const L = by[bcat].map(k => [k, where(k)]).sort((a, b) => (b[1].length ? 1 : 0) - (a[1].length ? 1 : 0));
    h += L.map(([k, W]) => { const S = STRUCT[k], op = sOpens(k), nd = [].concat(S.need || []);
      return `<div class="fic${W.length ? '' : ' off'}"><div class="fh2"><b>${S.ic || '🏛'} ${esc(sName(k))}</b><span class="hint">${pCost(me, k)} ⚒${S.up ? ` · manutenção ${S.up} 💰 por turno` : ' · sem manutenção'}${S.lg ? ' · legado ' + S.lg : ''} · você tem ${countB(me, k)}</span></div><p>${esc(S.fx || '')}</p>
        <p class="hint">${nd.length ? 'Vem depois de: ' + nd.map(x => esc(sName(x))).join(' ou ') + '. ' : ''}${op.length ? 'Abre caminho para: ' + op.map(x => esc(sName(x))).join(', ') + '.' : ''}</p>
        ${W.length ? `<div class="row">${W.slice(0, 8).map(([i, t]) => `<button class="mini${can ? ' pri' : ''}" data-a="bldAt" data-i="${i}" data-k="${k}" ${can ? '' : 'disabled'} title="Pôr na fila de ${esc(tname(i))}">${esc(tname(i))} · ${isFinite(t) ? t + ' turno(s)' : 'sem produção'}</button>`).join('')}${W.length > 8 ? `<span class="hint">+${W.length - 8} território(s)</span>` : ''}</div>` : `<p class="hint">🔒 ${reqText(k) || 'Não cabe em nenhum território seu agora.'}</p>`}</div>`; }).join('');
  } else {
    const roots = Object.keys(STRUCT).filter(k => !STRUCT[k].need && (!STRUCT[k].air || G.air) && sOpens(k).length), by = {};
    roots.forEach(k => (by[sCat(k)] = by[sCat(k)] || []).push(k));
    h += `<p class="hint">Cada cadeia começa numa obra base e segue para as que dependem dela no mesmo território. <span class="cn has">✓ você tem</span> <span class="cn can">● pode construir</span> <span class="cn no">🔒 falta algo</span></p>`;
    h += Object.keys(SCAT).filter(c => by[c]).map((c, n) => `<details class="rdet"${n ? '' : ' open'}><summary>${SCAT[c][0]} <span class="hint">${by[c].length} cadeia(s)</span></summary><ul class="chain">${by[c].map(k => chainHtml(k, new Set([k]), 0)).join('')}</ul></details>`).join('');
    h += `<p class="hint"><button class="mini" data-a="catalog">Catálogo completo</button> lista também as obras sem cadeia.</p>`;
  }
  return h;
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
  b.innerHTML = `<div class="bh"><b style="color:${lc(Fa(a).c)}">${esc(tname(i))}</b> <span>${G.tr[i]}</span> ⚔ <b style="color:${lc(Fa(d).c)}">${esc(tname(j))}</b> <span>${Math.max(0, G.tr[j])}</span></div>${diceRows(r)}
  <p class="bm">${ai ? esc(fname(a)) + ' ataca você. ' : ''}Ataque perde ${r.al}, defesa perde ${r.dl}.${r.won ? ' Território conquistado!' : ''}</p>`;
}
function showAir(f, j, r, ai) {
  if (!r) return; const b = bt(); placeB(j);
  b.innerHTML = `<div class="bh">✈ ${esc(G.air.n)} de <b style="color:${lc(Fa(f).c)}">${esc(fname(f))}</b> sobre <b>${esc(tname(j))}</b> <span>${G.tr[j]}</span></div>
  <div class="dice"><div>${dieH(r.aa, 'def' + (r.down ? '' : ' lost'))}</div><div>${r.down ? '' : dieH(r.hit, 'att' + (r.kill ? '' : ' lost'))}</div></div>
  <p class="bm">Antiaéreo ${r.aa}${r.down ? ': avião abatido.' : ` (abate com ${G.air.aa}+). Bombardeio ${r.hit}: ${r.kill ? '1 tropa eliminada.' : `errou (precisa de ${G.air.hit}+).`}`}${ai ? '' : ` Restam ${Fa(f).planes} aviões.`}</p>${ai ? '' : '<div class="bb"><button data-a="bclose">Fechar</button></div>'}`;
}
function showBattlePanel(last) {
  const i = G.sel, j = G.tgt, b = bt(); placeB(j);
  const [ad, dd] = diceFor(i, j), d = G.own[j], me = Fa(G.player);
  const notes = [isSea(i, j) ? 'desembarque pelo mar' + (seaSup(i, j) < 0 ? ': a frota do defensor é maior (+1 na defesa)' : seaSup(i, j) >= 2 ? ': sua frota domina o mar' : '') : '', TERR[G.ter[j]].n.toLowerCase(), defBonus(j) ? `defesa +${defBonus(j)} no maior dado` : '', TERR[G.ter[j]].def === 'w' ? 'pântano: 1 dado a menos' : '', TERR[G.ter[j]].def === 'm' ? 'montanha: empate é da defesa' : '', me.ofs ? 'ofensiva +1' : ''].filter(Boolean).join(' · ');
  b.innerHTML = `<div class="bh"><b style="color:${lc(me.c)}">${esc(tname(i))}</b> <span>${G.tr[i]}</span> ⚔ <b style="color:${lc(Fa(d).c)}">${esc(tname(j))}</b> <span>${G.tr[j]}</span></div>
  ${last ? diceRows(last) : `<div class="dice"><div>${'<span class="die att ghost">?</span>'.repeat(ad)}</div><div>${'<span class="die def ghost">?</span>'.repeat(dd)}</div></div>`}
  <p class="bm">${last ? `Você perde ${last.al}, defesa perde ${last.dl}. ` : ''}${ad} contra ${dd} dados${notes ? ' · ' + notes : ''}. <b>Chance de vencer atacando até o fim: ${Math.round(100 * odds(i, j))}%</b>. Empate fica com a defesa${me.ab === 'tatico' ? ', exceto para você (Gênio Tático)' : ''}.${blitzCost(G.player) ? ` <b class="warn">Se vencer: −${blitzCost(G.player)} de estabilidade e 1 tropa (desgaste da blitz).</b>` : ''}</p>
  ${ad < 3 && G.tr[i] > 1 ? `<div class="dwhy"><b>Você rola ${ad} de 3 dados.</b><ul>${diceWhy(i, j).map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
  <div class="bb"><button class="pri" data-a="roll1" ${G.tr[i] < 2 ? 'disabled' : ''}>Atacar 1x</button><button data-a="blitz" ${G.tr[i] < 2 ? 'disabled' : ''}>Atacar até o fim</button><button data-a="bclose">Recuar</button></div>`;
}
async function doRoll(blitz) {
  if (G.busy || G.tgt == null) return; G.busy = true;
  const g = G, i = G.sel, j = G.tgt, d = G.own[j]; let r;
  useSea(G.player, i, j);
  const ad0 = diceFor(i, j)[0]; // v50: o ataque até o fim para quando os dados caem, para você decidir se segue
  do {
    if (r && diceFor(i, j)[0] < ad0) break;
    if (!G.fast) { for (let k = 0; k < 3; k++) { const [a, b] = diceFor(i, j); showDice(i, j, { R: Array.from({ length: a }, d6), D: Array.from({ length: b }, d6), res: [], al: '…', dl: '…' }); await sleep(blitz ? 35 : 70); if (G !== g) return; } }
    r = roll(i, j);
  } while (blitz && !r.won && G.tr[i] > 1);
  G.busy = false;
  if (r.won) showConquer(i, j, r, d);
  else { showBattlePanel(r); if (G.tr[i] < 2) bt().querySelector('.bm').textContent += ' Sem tropas para continuar.'; else if (blitz) bt().querySelector('.bm').insertAdjacentHTML('beforeend', ' <b class="warn">O ataque parou porque seus dados caíram. Veja o motivo abaixo e decida se continua ou recua.</b>'); }
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
// v50 (C-300): para que serve cada construção. Finalidade, conselho de quando vale a pena e o que ela abre
const SCAT = {
  zona: ['🗺 Zonas de recurso', 'Comece por aqui. A zona ocupa uma vaga do território (aldeia 1, vila 2, cidade 3, metrópole 4), explora as jazidas dele e abre a cadeia de construções dela. Escolha a que casa com o terreno e as jazidas.'],
  food: ['🌾 Comida e crescimento', 'Sobra de comida faz o território crescer de porte, e cada porte abre mais uma vaga de zona e rende mais. Sem comida, ele encolhe.'],
  prod: ['⚒ Produção', 'A produção do território avança a obra do topo da fila. Vale mais onde você ainda vai construir muito: ponha cedo.'],
  gold: ['💰 Ouro e comércio', 'Ouro paga soldo, manutenção, recrutas e obras apressadas. Mercado, porto e banco também dão 1 vaga de rota comercial cada.'],
  sci: ['🔬 Saber', 'O saber de todos os territórios vai para a pesquisa em andamento. Mais saber, tecnologias mais cedo.'],
  stab: ['⚖ Estabilidade e prestígio', 'Estabilidade segura revoltas e o cansaço de guerra. Prestígio paga influência, agitadores e diplomacia.'],
  war: ['⚔ Guerra e defesa', 'Defesas valem na fronteira, onde o inimigo chega. Quartel e porto perto da frente mantêm o suprimento: sem eles, seus ataques perdem 1 dado.'],
  log: ['🛣 Estradas e mar', 'Estrada liga o território à rede de bens (os bens ligados liberam obras em todo o império) e deixa as tropas andarem mais longe no remanejamento. Porto e estaleiro dão travessias marítimas.'],
  city: ['🏘 Cidade', 'Obras que deixam o território passar de porte ou evitam perdas.'],
  won: ['🏛 Maravilhas', 'Só existe uma de cada no mundo: quem termina primeiro fica com ela. São caras; comece cedo, num território de produção alta.'],
};
function sCat(k) {
  const S = STRUCT[k], y = S.y || {};
  if (S.ww || S.wonder) return 'won';
  if (S.road || S.nav || S.z === 'por' || k === 'est' || k === 'pav' || k === 'stl') return 'log';
  if (S.def || S.defMin || S.tie || S.atk || S.rf || S.air || S.z === 'mil' || ['for', 'pal', 'cas', 'fab', 'bkr', 'ars', 'pov', 'har', 'acm'].includes(k)) return 'war';
  if (['agr', 'pec', 'pes', 'flo', 'min'].includes(S.z)) return 'zona';
  if (y.sci) return 'sci';
  if (y.gold > 0) return 'gold';
  if (y.food) return 'food';
  if (y.prod) return 'prod';
  if (y.stab || y.pre || S.z === 'rel') return 'stab';
  return 'city';
}
const sOpens = k => Object.keys(STRUCT).filter(x => [].concat(STRUCT[x].need || []).includes(k));
// ficha de uma construção para o território i (ou geral, sem i)
function sFicha(k, i) {
  const me = G.player, S = STRUCT[k], c = pCost(me, k, i), pr = i != null ? prodOf(i) + supNet(i, 'prod') : 0, wait = i != null ? G.q[i].reduce((t, x) => t + pCost(me, x.k, i) - x.p, 0) : 0;
  const eta = i != null ? (pr ? Math.ceil((wait + c) / pr) + ' turno(s)' : 'parada: sem produção') : '', op = sOpens(k);
  return `<div class="fic"><div class="fh2"><b>${S.ic || '🏛'} ${esc(sName(k))}</b><span class="hint">${c} ⚒${eta ? ' · ' + eta : ''}${S.up ? ` · manutenção ${S.up} 💰 por turno` : ' · sem manutenção'}${S.lg ? ' · legado ' + S.lg : ''}</span></div>
    <p>${esc(S.fx || '')}</p>${op.length ? `<p class="hint">Abre caminho para: ${op.map(x => esc(sName(x))).join(', ')}.</p>` : ''}
    ${i != null ? `<button class="mini pri" data-a="bldAt" data-i="${i}" data-k="${k}">Construir</button>` : ''}</div>`;
}
// construções que já existem no território (qualquer dono)
function bldList(i) {
  const B = G.bld[i];
  return `<div class="rbox"><h5>Construções <span class="hint">${B.length}</span></h5>${B.length ? `<ul class="bl">${B.map(k => `<li class="${nb(i, k) ? '' : 'off'}"><b>${STRUCT[k].ic || '🏛'} ${esc(sName(k))}</b> <span class="hint">${esc(STRUCT[k].fx || '')}${nb(i, k) ? '' : ' Desativada: sem ouro para a manutenção.'}</span></li>`).join('')}</ul>` : '<p class="hint">Nenhuma construção aqui ainda.</p>'}</div>`;
}
// v50 (UI-15): ações rápidas de tropas, sempre à vista no topo da aba Região
function quickActs(i) {
  const me = G.player, F = Fa(me);
  if (G.own[i] !== me || G.over || G.turnF !== me || G.busy) return '';
  if (G.phase === 'ref') return F.reinf ? `<div class="row qa"><button class="mini pri" data-a="put1" data-i="${i}">+1 tropa aqui</button><button class="mini" data-a="all">Todas aqui (${F.reinf})</button></div>` : '';
  if (G.phase === 'atk') { const tc = troopCost(me); return `<div class="row qa">${canRecruitAt(me, i) ? `<button class="mini" data-a="recAt" data-i="${i}" ${F.gold < tc ? 'disabled' : ''} title="A tropa chega aqui no início do seu próximo turno.">🪖 Recrutar 1 tropa · ${tc}💰</button>` : `<span class="hint" title="Construa um ${sName('qua')} aqui para recrutar na frente.">Recruta-se na capital ou onde houver ${sName('qua')}.</span>`}</div>`; }
  return `<p class="hint qa">Pode mover ${G.mv[i] || 0} tropa(s): use Mover na lista de fronteiras.</p>`;
}
// v50 (UI-15, C-300): sub-aba Obras. Fila, o que já existe e o que dá para construir, agrupado por finalidade
let bcat = null;
function regionActs(i) {
  const me = G.player;
  if (G.own[i] !== me) return '';
  const can = !G.over && G.turnF === me && !G.busy && G.phase === 'atk';
  let h = `<div class="rbox"><h5>Fila de obras <span class="hint">${G.q[i].length}/${qMax(me)} · ${prodOf(i)} ⚒ por turno</span></h5>${qHtml(i)}</div>` + bldList(i);
  if (!can) return h + (G.turnF === me && !G.over ? '<p class="hint">Novas obras entram na fila na fase de ações.</p>' : '');
  const ks = Object.keys(STRUCT).filter(k => canQueue(me, k, i)), full = G.q[i].length >= qMax(me), by = {};
  ks.forEach(k => (by[sCat(k)] = by[sCat(k)] || []).push(k));
  const cats = Object.keys(SCAT).filter(c => by[c]); if (!cats.includes(bcat)) bcat = cats[0];
  h += `<div class="rbox"><h5>Construir aqui <span class="hint">${full ? 'fila cheia' : ks.length + ' opção(ões)'}</span></h5>${ks.length ? `<div class="cats">${cats.map(c => `<button class="mini ${c === bcat ? 'on' : ''}" data-a="bcat" data-k="${c}">${SCAT[c][0]} <small>${by[c].length}</small></button>`).join('')}</div>
    <p class="hint adv">${esc(SCAT[bcat][1])}</p>${by[bcat].map(k => sFicha(k, i)).join('')}` : `<p class="hint">${full ? 'A fila desta região está cheia: espere uma obra terminar ou retire uma.' : 'Nenhuma obra cabe aqui agora.'}</p>`}
    <p class="hint"><button class="mini" data-a="catalog">Catálogo completo</button> mostra também as bloqueadas e o que falta para cada uma.</p></div>`;
  return h;
}
// v49 (UI-16): fronteiras da região selecionada, com o que dá para fazer em cada uma
function bordersHtml(i) {
  const me = G.player, o = G.own[i], my = G.turnF === me && !G.busy && !G.over;
  const nbs = G.A[i].filter(j => G.own[j] !== 'off');
  if (o === 'off' || !nbs.length) return '';
  const A = (src, dst, lab) => { const w = atkWhy(me, src, dst); return `<button class="mini ${w ? '' : 'bad'}" data-a="atkFrom" data-i="${src}" data-j="${dst}" ${w ? 'disabled' : ''} title="${esc(w || `Atacar ${tname(dst)} com as tropas de ${tname(src)}.`)}">⚔ ${lab}</button>`; };
  const I = j => { const w = G.phase !== 'atk' ? 'A influência acontece na fase de ações.' : inflWhy(me, j); return `<button class="mini" data-a="inflAt" data-i="${j}" ${w ? 'disabled' : ''} title="${esc(w || 'Anexa sem lutar; fica com metade das tropas.')}">⭐ Influenciar · ${inflCost(me, j)}</button>`; };
  const rows = nbs.map(j => {
    const d = G.own[j], D = Fa(d), rel = d === me ? 'seu' : !real(d) ? (d === 'reb' ? 'rebelde' : 'neutro') : allied(me, d) ? 'aliado' : peace(me, d) ? 'trégua' : 'inimigo';
    let b = '';
    if (my) {
      if (o === me && d !== me && (rel === 'inimigo' || rel === 'neutro' || rel === 'rebelde')) b += A(i, j, 'Atacar');
      if (o === me && (d === 'neu' || d === 'reb')) b += I(j);
      if (o === me && d === me && G.phase === 'mov') { const ok = (G.mv[i] || 0) > 0 && moveDests(me, i).includes(j) && seaOk(me, i, j); b += `<button class="mini" data-a="mvFrom" data-i="${i}" data-j="${j}" ${ok ? '' : 'disabled'} title="${ok ? 'Mover tropas para lá.' : 'Sem tropas livres ou sem caminho.'}">➜ Mover</button>`; }
      if (o !== me && d === me && hostile(me, i)) b += A(j, i, 'Atacar daqui');
    }
    return `<li><button class="lnk" data-a="sel" data-i="${j}" title="Selecionar ${esc(tname(j))}"><i class="dot" style="background:${D.c}"></i>${esc(tname(j))}</button><span class="hint">${isSea(i, j) ? `<span title="Travessia pelo mar: gasta 1 travessia da frota por turno (restam ${Fa(me).navLeft}). Desembarque rola no máximo 2 dados sem porto na origem, navegação ou frota dominante. Frota maior que a sua dá +1 à defesa.">⚓ por mar</span> · ` : ''}🪖 ${G.tr[j]} · ${rel}${csOf(j) ? ' · cidade-estado' : ''}</span><span class="bt">${b}</span></li>`;
  }).join('');
  let top = '';
  if (my && o !== me && (o === 'neu' || o === 'reb')) top = `<div class="row">${I(i)}${G.phase === 'atk' && inflWhy(me, i) ? `<span class="hint">${esc(inflWhy(me, i))}</span>` : ''}</div>`;
  const camp = my && G.phase === 'atk' && !Fa(me).camp && (o === me ? nbs.some(j => hostile(me, j)) : hostile(me, i) && nbs.some(j => G.own[j] === me));
  return `<div class="rbox"><h5>Fronteiras <span class="hint">${nbs.length} vizinho(s)${o === me ? '' : ' · ' + nbs.filter(j => G.own[j] === me).length + ' seu(s)'}</span></h5>${top}${camp ? `<p class="hint">Para atacar, <button class="mini pri" data-a="act" data-k="camp" title="Libera os ataques deste turno. Cada turno em campanha soma cansaço de guerra.">Declarar campanha</button></p>` : ''}<ul class="nbl">${rows}</ul></div>`;
}
function renderSide() {
  const me = G.player, F = Fa(me), cur = G.turnF, CF = cur && Fa(cur), my = cur === me && !G.over;
  $('#round').title = `A partida acaba na rodada ${G.rounds}. Objetivo e legado valem a partir da rodada ${minWin()}.`;
  $('#round').textContent = `Rodada ${Math.min(G.round, G.rounds)}/${G.rounds} · ${G.len.n}${G.sc.civ ? ' · ' + civYear() : ''}`;
  $('#turn').innerHTML = CF ? `<i class="dot" style="background:${CF.c}"></i>${my ? 'Seu turno' : esc(CF.n)} · ${PHASE[G.phase]}` : '';
  // v44: quadro do império. Identidade, seis indicadores com variação, atalhos para os painéis, pesquisa, objetivo e alertas.
  const inc = income(me), u = upkeepOf(me), net = inc.gold - u.b - u.t, rt = F.res && TK[F.res], hp = hap(me), sg = v => (v >= 0 ? '+' : '') + v;
  const al = [F.stab < 15 ? 'Crise: reforços pela metade e risco alto de revolta.' : F.stab < 35 ? 'Instável: províncias podem se rebelar no início do turno.' : '', F.ww >= 3 ? `Cansaço de guerra ${F.ww}: −${Math.floor(F.ww / 5)} de estabilidade por turno.` : '', hp < 0 ? 'Povo infeliz: −10% de ouro e saber.' : '', net < 0 && F.gold + net < 0 ? 'O ouro não cobre a manutenção: construções serão desativadas.' : ''].filter(Boolean);
  // v50 (UI-15): sub-abas. Cada função do painel tem o seu lugar, uma de cada vez
  const isub = ['acoes', 'obj', 'facs', 'cron'].includes(G.isub) ? G.isub : 'acoes';
  const stabs = (grp, cur, items) => `<div class="stabs" role="tablist">${items.map(([k, lab]) => `<button role="tab" aria-selected="${k === cur}" class="${k === cur ? 'on' : ''}" data-a="stab" data-g="${grp}" data-k="${k}">${lab}</button>`).join('')}</div>`;
  const nv = (a, ic, lab, k, dot) => `<button class="mini" data-a="${a}" title="${lab} (atalho ${k})">${ic} ${lab}${dot ? ' •' : ''}</button>`;
  $('#me').innerHTML = `<div class="fh" style="--fc:${F.c}"><div><h3>${esc(F.n)}</h3><p>${esc(F.L)} · <span title="${esc(ABIL[F.ab][1])}">${ABIL[F.ab][0]}</span> · ${esc(GOV[gov(me)].n)}${anar(me) ? ' (anarquia)' : ''}</p></div></div>
    <details class="pw"><summary>Poderes do líder</summary><p class="ab">${esc(ABIL[F.ab][1])}</p>${F.fx && F.fx.length ? `<p class="ab pw">⚜ ${esc(ldText(F.fx))}.</p>` : ''}</details>
    <div class="kpis">
      ${kp('💰', 'Ouro', F.gold, sg(net), `Ouro: tropas, apressar obras e manutenção. Por turno: +${inc.gold} de renda (rotas +${routeGold(me)}), −${u.b} de construções, −${u.t} de soldo.`, net < 0 ? 'warn' : '')}
      ${kp('🔬', 'Saber', F.sci, '+' + inc.sci, `Saber: vai para a pesquisa em andamento${rt ? ' (' + tName(rt.k) + ', custa ' + techCost(rt, me) + ')' : ''}.`)}
      ${kp('⭐', 'Prestígio', F.pre, '+' + inc.pre, 'Prestígio: paga influência, agitadores e diplomacia.')}
      ${kp('⚖', 'Estabilidade', Math.round(F.stab), F.ww >= 3 ? 'cansaço ' + F.ww : null, 'Estabilidade 0–100. Abaixo de 35 províncias podem se rebelar; abaixo de 15 os reforços caem pela metade. Sobe com festas, templos e paz; desce com impostos, cansaço de guerra, agitadores e conquistas em excesso.', F.stab < 15 ? 'bad' : F.stab < 35 ? 'warn' : '')}
      ${kp('🙂', 'Felicidade', hp, `🎭 ${F.cu} (+${cultureInc(me)})`, 'Felicidade: luxos, templos, arenas, teatros e festas sobem; cidades grandes, cansaço de guerra e impostos descem. Abaixo de 0: −10% de ouro e saber; abaixo de −10: perde estabilidade. Abaixo: cultura acumulada e por turno.' + (G.sc.civ ? (c => ` Classes: ${c.cam} camponeses, ${c.art} artesãos, ${c.mer} mercadores, ${c.eru} eruditos.`)(classes(me)) : ''), hp < 0 ? 'warn' : '')}
      ${kp('🏛', 'Legado', legacy(me), 'meta ' + legWin(), `Legado: 2 por tecnologia, 1 por construção, 5 pela Maravilha. ${legWin()} vence a partir da rodada ${minWin()}.`)}
    </div>
    ${al.length ? `<div class="alert">${al.map(esc).join('<br>')}</div>` : ''}
    <p class="hint rs">${rt ? `🔬 ${esc(tName(rt.k))} ${pbar(F.sci, techCost(rt, me))} ${F.sci}/${techCost(rt, me)}` : '<b class="warn">Nenhuma pesquisa escolhida.</b> <button class="mini pri" data-a="techs">Escolher pesquisa</button>'}</p>
    <div class="nav">${nv('techs', '🔬', 'Tecnologias', 'T')}${nv('govm', '🏛', 'Governo e fé', 'G')}${nv('dipl', '🤝', 'Diplomacia', 'D', G.offers.length || (G.dem && G.dem.to === me))}${nv('vicm', '🏆', 'Vitórias', 'V')}${nv('figm', '👤', 'Personagens', 'P', (F.gf || []).length)}${nv('routes', '🚢', 'Comércio', 'C')}</div>
    ${stabs('isub', isub, [['acoes', '⚙ Ações'], ['obj', '🎯 Objetivo'], ['facs', '👥 Facções'], ['cron', '📜 Crônica']])}
    <div class="is-obj"><div class="obj"><b>Objetivo</b> ${esc(objText(F))}${facFaith(me) ? ` <span class="hint">· fé ${esc(G.faiths[facFaith(me)].n)}</span>` : ''}<ul>${objLines(me).map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✓' : '○'} ${esc(t)}</li>`).join('')}</ul></div>${news().length ? '<div class="news"><b>Notícias</b><ul>' + news().map(l => '<li>' + esc(l[1]) + '</li>').join('') + '</ul></div>' : ''}</div><div class="is-acoes">${guideHtml()}</div>`;
  const forces = `<p class="forces" title="Cada travessia leva um ataque ou um remanejamento pelo mar neste turno. Ganha-se 1 por ${sName('por')}, mais as de navegação e estaleiros. Frota 2 acima da do defensor: desembarque com 3 dados. Frota menor que a dele: ele defende com +1.">⚓ Frota: ${my ? F.navLeft : navOf(me)} travessia(s)${G.air ? ` · ✈ ${esc(G.air.n)}: ${my ? F.planes : planesOf(me)}` : ''}</p>`;
  let ph = '', abar = '', st = ''; // UI: a ação da fase fica na barra fixa (#actbar), sempre visível
  const K = ' title="Atalho: Enter"';
  if (G.over) { ph = `<p>Partida encerrada.</p>`; st = 'Partida encerrada'; abar = `<button class="pri" data-a="menu"${K}>Novo jogo</button>`; }
  else if (!my) { ph = `<p class="hint">Aguardando ${esc(CF ? CF.n : '')}…</p>${forces}`; st = `<i class="dot" style="background:${CF ? CF.c : '#888'}"></i>Vez de ${esc(CF ? CF.n : '')}…`; }
  else if (G.phase === 'ref') {
    const ri = reinfOf(me);
    ph = `<h4>Reforços: <b class="big">${F.reinf}</b> tropas</h4><p class="hint">Clique nos seus territórios para posicionar 1 tropa por clique.</p>
      <p class="parts">${ri.parts.map(([n, v]) => `${esc(n)}${v ? (v > 0 ? ' +' : ' ') + v : ''}`).join(' · ')}</p>
      <p class="parts">Produção deste turno: +${inc.gold} 💰 · +${inc.sci} 🔬 · +${inc.pre} ⭐</p>
      <div class="row"><button data-a="all" ${F.reinf ? '' : 'disabled'}>Tudo no selecionado</button></div>
      ${forces}`;
    st = F.reinf ? `<b>1 · Reforços</b> · toque nos seus territórios (faltam ${F.reinf})` : '<b>1 · Reforços</b> · tudo posicionado';
    abar = `<button class="pri" data-a="toAtk" ${F.reinf ? 'disabled' : ''}${K}>${F.reinf ? `Posicione ${F.reinf} tropa${F.reinf > 1 ? 's' : ''}` : 'Ir para as ações →'}</button>`;
  } else if (G.phase === 'atk') {
    const noPA = F.pa < 1, tc = troopCost(me);
    const Bt = (a, k, label, title, dis, on) => `<button class="ab2 ${on ? 'on' : ''}" data-a="${a}" data-k="${k}" title="${esc(title)}" ${dis ? 'disabled' : ''}>${label}</button>`;
    // parte 4: só aparecem as obras que cabem em algum território seu agora; o catálogo mostra o resto
    ph = `<h4>Ações do império</h4>
      <p class="hint">Valem para o império inteiro. Construções ficam na aba Obras. Para recrutar, atacar ou influenciar num lugar específico, clique no território: a aba Região mostra as ações e as fronteiras dele. Sem limite de ações; festas, impostos, agitadores, espiões e enviados valem 1 vez por turno.</p>
      <div class="grp"><b>⚔ Militar</b><div class="row">
        ${Bt('act', 'camp', F.camp ? 'Campanha declarada' : 'Declarar campanha', 'Libera ataques e aviação neste turno, quantos quiser enquanto houver tropas. Cada turno em campanha soma cansaço de guerra.', F.camp, F.camp)}
        ${Bt('act', 'rec', F.recOn ? `Comprar tropas <small>${tc}💰</small>` : `Recrutar <small>${tc}💰/tropa</small>`, `Abre o recrutamento: compre tropas na capital ou num ${sName('qua')}. Elas chegam no início do próximo turno.`, !F.recOn && (noPA || F.gold < tc), G.mode === 'rec')}
<button class="ab2" data-a="merc" title="1 tropa já na capital, sem gastar ação (1 vez por turno)." ${F.merc === G.round || F.gold < 2 * tc || G.turnF !== me ? 'disabled' : ''}>Mercenários <small>${2 * tc}💰</small></button>
        ${F.camp && G.air && F.planes ? Bt('air', '', `✈ ${esc(G.air.n)} (${F.planes})`, 'Bombardeie um alvo ao alcance. Não gasta ação.', false, G.mode === 'air') : ''}</div></div>
      <div class="grp"><b>🤝 Sociedade</b><div class="row">
        ${Bt('act', 'fest', `Festividades <small>${ECON.fest}💰</small>`, '+15 de estabilidade e +4 de felicidade por 2 turnos. Gasta 5 de comida da capital.', noPA || F.gold < ECON.fest, false)}
        ${Bt('act', 'infl', 'Influenciar <small>⭐</small>', 'Anexe um território neutro ou rebelde vizinho sem lutar. Custa as tropas dele + 1 de prestígio.', noPA, G.mode === 'infl')}
        ${Bt('act', 'agit', `Agitadores <small>${ECON.agit}⭐</small>`, 'Uma facção rival perde 15 de estabilidade.', noPA || F.pre < ECON.agit, G.mode === 'agit')}
        ${Bt('act', 'colo', 'Colonos <small>3💰</small>', 'Uma cidade sua perde 1 nível e uma aldeia sua vizinha sobe 1 nível.', noPA || F.gold < 3 || !coloPair(me), false)}</div></div>
      <div class="grp"><b>💰 Economia</b><div class="row">
        ${Bt('act', 'tax', 'Impostos', `+${Math.ceil(owned(me).length / 2)} de ouro agora, −8 de estabilidade.`, noPA, false)}
        ${Bt('act', 'trade', F.tradeOn ? 'Câmbio aberto' : 'Câmbio', 'Troque recursos 2 por 1 (3 por 2 com a tecnologia de comércio) quantas vezes quiser no turno.', !F.tradeOn && noPA, F.tradeOn)}<button class="ab2" data-a="routes">Rotas ${myRoutes(me).length}/${routeMax(me)}</button></div></div>
      ${forces}`;
    st = `<b>2 · Ações</b> · ${F.camp ? `campanha: ${F.cq} conquista(s) no turno${blitzCost(me) ? ` · <span title="Desgaste da blitz: a partir da ${ECON.blitz + 1}ª conquista no turno, cada uma custa estabilidade crescente e 1 tropa">a próxima custa −${blitzCost(me)} de estabilidade e 1 tropa</span>` : ` · as ${ECON.blitz} primeiras não têm desgaste`}` : 'obras, pesquisa e sociedade; declare campanha para atacar'}`;
    abar = `<button class="ghost" data-a="end" title="Pula o remanejamento">Encerrar turno</button><button class="pri" data-a="toMov"${K}>Remanejar →</button>`;
  } else {
    const left = G.mv.reduce((s, v) => s + (v || 0), 0);
    ph = `<h4>Remanejamento</h4><p class="hint">Cada tropa sobrando anda uma vez para um território seu vizinho. Pode dividir entre vizinhos; 1 tropa fica sempre. Restam ${left} tropa(s) para mover.</p>${forces}`;
    st = `<b>3 · Remanejamento</b> · ${left} tropa(s) podem andar`;
    abar = `<button class="pri" data-a="end"${K}>Encerrar turno</button>`;
  }
  $('#phase').innerHTML = ph;
  $('#actbar').innerHTML = `<span class="st">${st}</span><span class="bt">${abar}</span>`;
  let inf = '';
  if (G.sel != null) {
    const i = G.sel, o = G.own[i], O = Fa(o), t = G.m.terr[i], co = capOwner(i);
    const rel = o === 'off' ? 'Fora do mundo conhecido nesta era' : o === me ? 'Seu' : !real(o) ? (o === 'reb' ? (G.rl[i] || 'Rebeldes') : 'Neutro') : allied(me, o) ? 'Aliado' : peace(me, o) ? 'Trégua' : 'Inimigo';
    // v44: cartão do território. Cabeçalho com dono e relação, indicadores, etiquetas de estado e construções como fichas.
    const relC = rel === 'Seu' ? 'ok' : rel === 'Inimigo' ? 'bad' : '', Y = o !== 'off' && real(o) ? yieldOf(i) : null;
    const tags = [co ? ['👑 capital de ' + fname(co), ''] : null, G.relics.includes(i) ? ['Runa Antiga', ''] : null, G.fort[i] > 0 ? ['🛡 fortificado', 'ok'] : null, occupied(i) ? [`ocupado por ${G.occ[i]} turno(s)`, 'bad', 'Não conta para renda e reforços; produção pela metade.'] : null, o === me && lowSupply(i) ? ['longe do suprimento', 'bad', 'Ataca com 1 dado a menos.'] : null, G.phase === 'mov' && my && o === me ? [`pode mover ${G.mv[i] || 0}`, 'ok'] : null, o === me && F.recQ[i] ? [`+${F.recQ[i]} recruta(s) chegando`, 'ok'] : null].filter(Boolean);
    inf = `<div class="th4" style="--fc:${O.c}"><h4>${esc(t.n)}</h4><span class="chip ${relC}">${esc(rel)}</span></div>
      <p class="hint"><i class="dot" style="background:${O.c}"></i>${esc(o === 'reb' ? (G.rl[i] || 'Rebeldes') : O.n)} · ${esc(G.m.regions[t.r])}</p>
      <div class="kpis">${kp('🪖', 'Tropas', G.tr[i], null, 'Tropas no território. Defende com até 3 dados.')}${o !== 'off' ? kp('🏘', 'Porte', esc(pName(i)), real(o) ? `zonas ${zonesAt(i).length}/${G.lv[i]}` : null, 'Porte do território: aldeia, vila, cidade, metrópole. Cada nível abre uma vaga de zona.') : ''}${Y ? kp('🌾', 'Comida', sg(Y.food - foodUse(i)), `${Y.food} − ${foodUse(i)} consumo`, 'Sobra de comida por turno (produção menos consumo): enche o celeiro e faz o território crescer de porte. Detalhes em Rendimento.', Y.food < foodUse(i) ? 'warn' : '') + kp('⚒', 'Produção', '+' + Y.prod, null, 'Produção por turno: avança a obra do topo da fila.') + kp('💰', 'Ouro', '+' + Y.gold, null, 'Ouro que o território rende por turno.') + kp('🔬', 'Saber', '+' + Y.sci, null, 'Saber que o território rende por turno.') : ''}</div>
      ${tags.length ? `<div class="chips">${tags.map(([n, c, tip]) => `<span class="chip ${c}"${tip ? ` title="${esc(tip)}"` : ''}>${esc(n)}</span>`).join('')}</div>` : ''}`;
    // v50 (UI-15): o território se divide em três sub-abas: Fronteiras, Obras e Detalhes
    let fro = bordersHtml(i), obr = regionActs(i), det = '';
    if (my && o === me) obr += `<p class="hint">Governador: ${govrAt(i) ? GOVR[govrAt(i)][0] : 'nenhum'} (${govrN(me)}/${govrMax(me)}) ${Object.entries(GOVR).map(([k, g]) => `<button class="mini" data-a="gvr" data-i="${i}" data-k="${k}" title="${esc(g[1])}" ${govrAt(i) === k ? 'disabled' : ''}>${g[0]}</button>`).join(' ')}</p>`;
    if (my && real(o) && o !== me && has(me, 'esc')) fro += `<p class="hint">Espião (3💰, 1 por território a cada turno): ${Object.entries(SPY).map(([k, s]) => `<button class="mini" data-a="spy" data-i="${i}" data-k="${k}" title="${esc(s.fx)} · risco ${s.r}+${spyDef(i)} no dado" ${Fa(me).pa > 0 && Fa(me).gold >= 3 ? '' : 'disabled'}>${s.n}</button>`).join(' ')}</p>`;
    if (my && real(o) && o !== me && corpMax(me)) fro += `<p class="hint">Filiais ${corpsOf(me).length}/${corpMax(me)} <button class="mini" data-a="corp" data-i="${i}" ${Fa(me).pa > 0 && Fa(me).gold >= 5 ? '' : 'disabled'}>Abrir filial (5💰)</button></p>`;
    if (my && countB(me, 'sil') && hostile(me, i) && real(o)) fro += `<p class="hint"><button class="mini" data-a="msl" data-i="${i}" ${Fa(me).gold >= 5 ? '' : 'disabled'}>Lançar mísseis (5💰)</button> mata até 2 tropas, alvo a até 3 territórios de um silo</p>`;
    if (G.sc.civ && (G.ruin.has(i) || G.nat.has(i))) fro += `<p class="hint">${G.ruin.has(i) ? '🏚 Ruínas: quem chegar primeiro ganha um prêmio. ' : ''}${G.nat.has(i) ? '🌋 Maravilha natural: +2 ouro e +1 prestígio a quem a tiver.' : ''}</p>`;
    if (my && G.sc.civ && o === 'neu' && !csOf(i) && !G.tr[i] && G.A[i].some(j => G.own[j] === me)) fro += `<p class="hint">Ermo vazio. <button class="mini pri" data-a="fund" data-i="${i}" ${Fa(me).pa > 0 && Fa(me).gold >= fundCost(me) ? '' : 'disabled'}>Fundar aldeia (${fundCost(me)}💰, 1 nível de uma vila vizinha)</button> <button class="mini" data-a="post" data-i="${i}" ${Fa(me).pa > 0 && Fa(me).gold >= fundCost(me, 1) ? '' : 'disabled'}>Posto avançado (${fundCost(me, 1)}💰)</button></p>`;
    if (csOf(i)) { const c = G.cs[i], s = suz(i); fro += `<p class="hint">Cidade-estado ${CS[c.t][0]} (${CS[c.t][1]} ao suserano) · suserano ${s ? esc(fname(s)) : 'nenhum'} · sua influência ${c.inf[me] || 0} · missão: ${MIS[c.mis]}</p>${my ? `<button class="mini" data-a="env" data-i="${i}" ${Fa(me).pa > 0 && Fa(me).gold >= 2 ? '' : 'disabled'}>Enviado (2💰)</button>` : ''}`; }
    if (o !== 'off') {
      const T = TERR[G.ter[i]], isl = G.A[i].length && G.A[i].every(j => isSea(i, j)), wk = worked(i);
      det += `<p class="hint">${T.ic} ${T.n}${G.riv[i] ? ' · rio' : ''}${coastal(i) ? ' · litoral' : ''}${isl ? ' · ilha' : ''} · <b>${pName(i)}</b>${real(o) ? ` · zonas ${zonesAt(i).length}/${G.lv[i]}` : ''}${o === me ? (n => n.core.has(i) ? ' · na rede' : n.linked.has(i) ? ' · ligado por trilha' : ' · fora da rede de bens')(netOf(me)) : ''}${road(i) ? ' · ' + sName(road(i) > 1 ? 'pav' : 'est').toLowerCase() : ''}</p>
        <p class="hint">Jazidas: ${G.dep[i].length ? G.dep[i].map(d => DEP[d].ic + ' ' + esc(DEP[d].n) + (wk.includes(d) ? ' ✓' : '')).join(', ') : 'nenhuma conhecida'}${G.dep[i].length > wk.length && real(o) ? ' (✓ = explorada; as outras pedem a zona certa)' : ''}</p>`;
      if (real(o)) { const cd = capDist(o)[i], ts = tStab(i, cd), hs = health(i); det += `<p class="hint">Saúde ${hs}${hs < 0 ? ' (risco de epidemia)' : ''} · estabilidade local ${ts}${ts < 10 ? ' (pode se separar)' : ts < 30 ? ' (rende metade)' : ''} · corrupção ${Math.round(100 * corrupt(i, cd))}% · cultura ${G.cul[i] === o ? 'própria' : esc(fname(G.cul[i]) || 'local') + ` (assimila ${G.asm[i]}/8)`}</p>`; }
      
      if (real(o)) det += ledgerHtml(i);
      if (o === me) obr += supHtml(i);
    }
    const mine = o === me, rs = ['fro', 'obr', 'det'].includes(G.rsub) ? G.rsub : 'fro';
    inf += quickActs(i) + stabs('rsub', rs, [['fro', '🧭 Fronteiras'], ['obr', mine ? '🏗 Obras' : '🏗 Construções'], ['det', '🔎 Detalhes']]) + `<div class="rs">${rs === 'fro' ? fro : rs === 'obr' ? (obr || bldList(i)) : det}</div>`;
  }
  // v49 (UI-15): duas abas. Império = tudo que é geral; Região = o território selecionado, suas ações e fronteiras
  const tab = ['reg', 'obr'].includes(G.tab) ? G.tab : 'imp', side = $('#side');
  side.classList.toggle('t-reg', tab === 'reg'); side.classList.toggle('t-imp', tab === 'imp'); side.classList.toggle('t-obr', tab === 'obr'); $('#works').innerHTML = tab === 'obr' ? worksTab() : ''; side.dataset.is = isub;
  $('#ptabs').innerHTML = `<button role="tab" aria-selected="${tab === 'imp'}" class="${tab === 'imp' ? 'on' : ''}" data-a="ptab" data-k="imp" title="Tudo que vale para o império inteiro (atalho I)">🏛 Império</button><button role="tab" aria-selected="${tab === 'obr'}" class="${tab === 'obr' ? 'on' : ''}" data-a="ptab" data-k="obr" title="Filas, construções e cadeias de todo o império (atalho O)">🏗 Obras${owned(me).some(i => !G.q[i].length) && my ? ' •' : ''}</button><button role="tab" aria-selected="${tab === 'reg'}" class="${tab === 'reg' ? 'on' : ''}" data-a="ptab" data-k="reg" title="A região selecionada: obras, tropas e fronteiras. Clique num território no mapa.">📍 ${G.sel != null ? esc(tname(G.sel)) : 'Região'}</button>`;
  $('#info').innerHTML = inf || '<p class="hint">Clique num território no mapa. Aqui aparecem as obras, as tropas e as fronteiras dele, com os botões de atacar, influenciar e mover. Arraste para mover o mapa, role ou use + e − para zoom.</p>';
  $('#cards').innerHTML = `<h4>Cartas <span class="hint">${F.cards.length}/5 · ganhe uma por turno em que conquistar · usar não gasta ação</span></h4>` + (F.cards.length ? F.cards.map((c, h) => `<button class="card ${G.card && G.card.h === h ? 'on' : ''}" data-a="card" data-h="${h}" ${my ? '' : 'disabled'}><b>${esc(cardName(c))}</b><span>${esc(cardFx(c))}</span></button>`).join('') : '<p class="hint">Nenhuma carta.</p>');
  $('#tech').innerHTML = `<h4>Tecnologia · ${esc(G.era.n)}</h4><p class="hint" title="${esc(F.tech.map(k => tName(k)).join(', '))}">${F.tech.length} tecnologias pesquisadas · <button class="mini" data-a="techs">Abrir a árvore</button></p><p class="hint">Regras da era:</p><ul>${G.era.tech.map(t => `<li>${esc(t)}</li>`).join('')}${G.sc.air ? `<li>${esc(G.sc.air.n)}: alcance ${G.sc.air.r}, acertam com ${G.sc.air.hit}+.</li>` : ''}</ul>`;
  const tot = Math.max(1, G.own.filter(o => real(o)).length);
  $('#facs').innerHTML = `<h4>Facções <button class="mini" data-a="dipl">Diplomacia${G.offers.length || (G.dem && G.dem.to === me) ? ' •' : ''}</button></h4>` + G.order.filter(f => Fa(f).entered || Fa(f).late).map(f => {
    const X = Fa(f), alive = X.alive && X.entered;
    const rel = f === me ? 'você' : !X.entered ? 'ainda neutro' : !alive ? 'eliminado' : allied(me, f) ? 'aliado' : peace(me, f) ? 'trégua' : 'guerra';
    let act = '';
    if (my && alive && f !== me && !allied(me, f)) {
      if (G.truce.has(tk(me, f))) act = G.confirmBrk === f ? `<button class="mini bad" data-a="dok" data-f="${f}">Confirmar (−15)</button><button class="mini" data-a="dno">Não</button>` : `<button class="mini" data-a="dbrk" data-f="${f}">Romper</button><button class="mini" data-a="demb" data-f="${f}" title="T-18: corta e proíbe as rotas comerciais com esta facção">${G.emb.has(tk(me, f)) ? 'Suspender embargo' : 'Embargo'}</button>`;
      else act = (G.cool[f] || 0) > G.round ? '<span class="hint">aguarde</span>' : `<button class="mini" data-a="dpro" data-f="${f}">Propor trégua</button>`;
    }
    // v48 (UI-13): barra de poder (fatia dos territórios), ameaça de vitória e opinião sobre você
    const nT = owned(f).length, sh = Math.round(100 * nT / tot), th = alive && threatOf(f), op = alive && f !== me ? relOf(f, me) : null;
    const opT = op ? esc(op.why.map(([t, v]) => `${v > 0 ? '+' : ''}${v} ${t}`).join('; ') || 'sem motivos') : '';
    return `<div class="fr ${alive ? '' : 'dead'}"><i class="dot" style="background:${X.c}"></i><div class="fn"><b>${esc(X.n)}${th ? ` <span class="thr" title="${X.hold ? `Cumpriu o objetivo: vence se segurar por mais ${G.len.hold - X.hold} turno(s)` : 'Passou de 75% de uma vitória'}">⚠ ${X.hold ? 'segurando o objetivo' : 'perto de vencer'}</span>` : ''}</b><span title="Líder · territórios · tropas no mapa · estabilidade (0–100) · cartas na mão">${esc(X.L)} · ${nT} terr. · ⚔ ${power(f)} · ⚖ ${Math.round(X.stab)} · ${X.cards.length} cartas</span>${alive ? `<i class="pbar" title="${sh}% dos territórios das facções"><i style="width:${sh}%;background:${X.c}"></i></i>` : ''}</div><div class="fa"><span class="rel ${rel}">${rel}</span>${op ? `<span class="op ${op.v > 10 ? 'ok' : op.v < -10 ? 'bad' : ''}" title="Opinião sobre você: ${opT}">opinião ${op.v > 0 ? '+' : ''}${op.v}</span>` : ''}${act}</div></div>`;
  }).join('');
  $('#log').innerHTML = G.log.slice(0, 40).map(([f, t, r]) => `<li><i class="dot" style="background:${f ? Fa(f).c : 'var(--brass)'}"></i><span>${esc(t)}</span><em>${r}</em></li>`).join('');
  foldInit();
}
// UI (painéis recolhíveis): cartas, tecnologia, facções e crônica abrem e fecham pelo título; no celular começam fechados
const FOLD = ['cards', 'tech', 'facs', 'log'];
function foldInit() {
  let st = {}; try { st = JSON.parse(localStorage.getItem('sob_fold') || '{}'); } catch (e) { }
  for (const s of document.querySelectorAll('#side>section')) {
    const id = s.id || (s.querySelector('#log') ? 'log' : ''), h = s.querySelector(':scope>h4');
    if (!FOLD.includes(id) || !h) continue;
    if (!s.dataset.fk) { s.dataset.fk = id; s.classList.toggle('fold', id in st ? !!st[id] : innerWidth <= 820 && id !== 'facs'); }
    h.classList.add('fh4'); h.tabIndex = 0; h.setAttribute('role', 'button'); h.setAttribute('aria-expanded', String(!s.classList.contains('fold')));
  }
}
function foldToggle(h) {
  const s = h.parentElement, on = s.classList.toggle('fold'); h.setAttribute('aria-expanded', String(!on));
  try { const st = JSON.parse(localStorage.getItem('sob_fold') || '{}'); st[s.dataset.fk] = on ? 1 : 0; localStorage.setItem('sob_fold', JSON.stringify(st)); } catch (e) { }
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
  <p><b>Três caminhos para vencer.</b> Cumpra o objetivo militar da sua facção e mantenha-o por vários turnos seguidos (3, 3 ou 4, conforme a duração), chegue aos pontos de legado da duração escolhida (ciência, obras e cultura) ou elimine os rivais. Objetivo e legado só valem a partir de 1/3 da partida, e os turnos seguidos do objetivo só começam a contar aí; quem cumpre o objetivo é anunciado a todos e vira alvo. A dominação vale sempre. Se as rodadas acabarem, vence quem mais cresceu: territórios ganhos, +2 por capital, +2 por alvo do objetivo e o legado.</p>
  <p><b>Recursos.</b> No início do turno você recebe 💰 ouro e 🔬 saber somados de cada território (terreno, rio, nível, zonas e jazidas) e ⭐ prestígio (capitais, templos, maravilha). Eles se acumulam de um turno para o outro. Depois paga a manutenção: soldo das tropas (acima de ${ECON.freeT} por território, 1 ouro a cada ${ECON.perT}; sem ouro, elas desertam) e das construções (sem ouro, a mais cara fica desativada no turno).</p>
  <p><b>Obras em turnos.</b> Cada território tem produção ⚒ (terreno, +2 na capital, oficina, zonas e jazidas) e uma fila de até 3 obras (5 com a tecnologia de administração). A produção avança a obra do topo a cada turno, e o excesso passa à seguinte. Não há limite de construções por território, só uma de cada tipo. Com as obras abertas dá para apressar com ouro (2 por ponto que falta, 3 na maravilha), mas não no turno em que a obra começou. Quem conquista fica com as construções e com metade do progresso das obras; maravilha em andamento se perde.</p>
  <p><b>Pesquisa em turnos.</b> Escolha uma tecnologia na árvore (não gasta ação). O saber acumulado vai para ela, e ela fica pronta no início do turno em que o custo for atingido. Trocar de pesquisa não perde nada. A árvore mostra o que você sabe, o que pode pesquisar e, como silhueta, o passo seguinte; o resto aparece quando você chegar perto.</p>
  <p><b>Regiões.</b> Cada região rende sozinha (relevo, rio, porte, construções e jazidas) e o império é a soma delas. Clique numa região sua e abra o Rendimento da região: cada ganho e cada perda aparece com a causa. Há 8 portes, de aldeia a megalópole; crescer pede sobra de comida, moradia e empregos. Em Abastecimento, uma região manda a sobra de comida ou produção para outra sua (até 2 por turno, 3 com estrada nas duas pontas); ocupar o caminho corta a rota.</p>
  <p><b>Líderes.</b> Na criação da partida você escolhe o líder da sua facção entre dois ou três nomes reais da época. Ele vale a partida toda e traz um traço (Gênio Tático, Defesa Tenaz e outros) e um poder próprio, ligado a construções, rotas, tropas, estabilidade, prestígio ou pesquisa. Os bônus aparecem no Rendimento da região com ⚜ e o nome do líder. Os rivais usam os líderes históricos ou, se você escolher, líderes sorteados.</p>
  <p><b>No mapa.</b> O número é a tropa do território; os quatro pontos acima dele mostram o porte: cada ponto cheio vale dois portes e o ponto pela metade, um (de aldeia, porte 1, a megalópole, porte 8). Em volta da capital aparecem as construções desenhadas. Linhas tracejadas e pontos azuis na costa são travessias por mar. Terra hachurada fica fora do jogo.</p>
  <p><b>Terra e povo.</b> Cada território tem terreno (lente Terreno, ou a visão Relevo, que desenha o terreno e mostra os impérios só pela faixa colorida da fronteira), talvez rio e litoral, e jazidas (lente Recursos). O relevo pesa: planície fértil dá +1 de moradia; montanha, deserto, tundra e pântano, −1; obras em montanha e pântano custam 25% a mais; colina, montanha, floresta e pântano ajudam a defesa. A comida que sobra enche o estoque e faz o território crescer um porte por vez, em 8 portes: aldeia, povoado, vila, vila grande, cidade, cidade grande, metrópole e megalópole. Para crescer, além da comida, é preciso <b>moradia</b> acima do porte atual (base 3, +1 com rio, litoral ou capital, +2 com aqueduto, +2 com saneamento, +1 com hospital ou celeiro) e ninguém sem <b>emprego</b> (o porte dá alguns empregos, cada zona dá 2 e cada obra que rende dá 1). Cada desempregado custa 1 ouro por turno. Cada porte consome mais comida; com fome, o território perde um porte. Conquistado, perde um nível. Os portes "grandes" dão +1 produção e +1 ouro. O nível (aldeia, vila, cidade, metrópole) dá ouro, saber e vagas de zona: 1, 2, 3 e 4. Zonas de recurso (agrícola, pecuária, pesqueira, florestal, mineração) exigem o terreno certo e exploram as jazidas do território; vizinhos seus com a mesma zona formam polo (+1 cada, até +3). Cada tipo de luxo explorado dá +1 de estabilidade por turno (até +4); pedra e madeira barateiam obras.</p>
  <p><b>Catálogo de construções.</b> Cada zona abre a sua cadeia: lavouras → fazenda → celeiro; minas → mina, pedreira, fundição; mercado → banco → bolsa; biblioteca → academia → universidade; templo → mosteiro e grande templo; muralha → castelo. Algumas pedem bens explorados em qualquer território seu (sal, ferro e madeira, pedra). As maravilhas do mundo são únicas: quem termina primeiro fica com ela. O botão Catálogo, nas obras, mostra tudo e o que falta.</p>
  <p><b>Estradas e rede de bens.</b> Os bens (sal, ferro, pedra, luxos…) só valem para o império quando o território que os explora está na rede: a capital, os territórios seus ligados a ela por estrada (os dois lados com estrada) e os portos seus, que se ligam entre si. Uma trilha liga ainda os vizinhos de quem está na rede. Perder um território de passagem corta a rede. Na rede não falta suprimento. No remanejamento, pela estrada as tropas andam até 2 territórios (3 com estrada pavimentada), e de um porto seu vão a qualquer outro porto seu. Estrada em montanha e pântano custa o dobro; em deserto, 50% a mais. Veja a lente Rede.</p>
  <p><b>Comércio.</b> O botão Rotas (em Economia) abre o painel de comércio. Abrir uma rota custa 1 ação e ${ECON.route} ouro, e ela começa a render no turno seguinte; você abre 1 rota por mercado, porto e banco. Rota interna (mercado nas duas pontas) dá +1 produção no destino e põe os bens dele na rede. Caravana (caravançará até um mercado alheio a 4 territórios) dá +2 ouro a cada lado e traz 1 bem que lhe falta; rota marítima (porto com armazém até um porto alheio) dá +3 a cada lado e traz 2 bens, mas sem frota (2 travessias) os piratas a atacam às vezes. Rota com quem tem uma tecnologia que você não tem barateia essa pesquisa em 20%. Guerra, embargo ou perda da ponta desfazem a rota, e quem toma a ponta de uma rota alheia pilha o ouro de 2 turnos.</p>
  <p><b>Freios da guerra.</b> Desgaste da blitz: as ${ECON.blitz} primeiras conquistas de cada turno são livres; a partir da ${ECON.blitz + 1}ª, cada uma custa ${ECON.blitzS}, depois ${2 * ECON.blitzS}, ${3 * ECON.blitzS}… de estabilidade e deixa 1 tropa para trás. Última resistência: a capital de quem tem até 2 territórios defende com +1. Perder territórios soma cansaço uma vez por rodada, e só a primeira agitação da rodada contra uma facção pega inteira (as outras valem 1/3).Território conquistado fica ocupado por ${ECON.occ} turnos: não conta para renda e reforços, produz metade e é o primeiro a se revoltar. Cada turno em campanha soma cansaço de guerra, que come a estabilidade; turnos de paz e festividades o reduzem. Atacar de um território a mais de ${ECON.sup} passos da capital, de um quartel ou de um porto custa 1 dado.</p>
  <p><b>1. Reforços.</b> Tropas grátis: a soma dos níveis dos territórios não ocupados ÷ 3 (mínimo 3), +1 com ferro e +1 com cavalos explorados, mais regiões completas, capitais e quartéis.</p>
  <p><b>2. Ações.</b> Não há limite de ações por turno: o que segura você é o ouro, as tropas e o prestígio. Festividades, impostos e agitadores valem 1 vez por turno.</p>
  <ul>
  <li><b>⚔ Campanha</b> libera os ataques e a aviação no turno, quantos você quiser enquanto houver tropas. Não custa nada, mas cada turno em campanha soma cansaço de guerra.</li>
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
let pickSc = null, pickF = null, pickD = 1, pickL = 'c', pickR = false, pickLd = 0;
function thumb(sc) {
  const m = MAPS[sc.map], own = {};
  sc.f.forEach(f => expand(m, f.t).forEach(n => own[n] = f.c));
  (sc.rebels || []).forEach(([n]) => own[n] = REB.c);
  expand(m, sc.off || []).forEach(n => own[n] = OFF.c);
  return `<svg viewBox="0 0 ${m.w} ${m.h}" class="th"><rect x="-500" y="-500" width="${m.w + 1000}" height="${m.h + 1000}" fill="var(--sea)"/>${m.bg ? `<path d="${m.bg}" fill="#2a313b"/>` : ''}${m.terr.map(t => `<path d="${t.d}" fill="${own[t.n] || NEU.c}"/>`).join('')}</svg>`;
}
const GROUPS = ['Todos', 'Civilização', 'Antiguidade', 'Idade Média', 'Moderna', 'Fantasia'];
function showSetup() {
  if (G) G.over = true; G = null; $('#game').hidden = true; $('#setup').hidden = false; $('#modal').hidden = true;
  const tab = $('#setup').dataset.tab || 'Todos', s = loadSave(), ssc = s && SCEN.find(x => x.id === s.sc);
  const slots = [1, 2, 3].map(n => [n, loadSave(SLOT(n))]).filter(([, x]) => x && x.v === 5 && SCEN.find(c => c.id === x.sc));
  $('#resume').innerHTML = `<div class="row">${ssc && s.v === 5 ? `<button class="pri" data-a="resume">Continuar partida: ${esc(ssc.n)} · rodada ${s.round}</button>` : ''}${slots.map(([n, x]) => `<button data-a="resume" data-n="${n}">Espaço ${n}: ${esc(SCEN.find(c => c.id === x.sc).n)} · rodada ${x.round}</button>`).join('')}<label class="ab2 file">Importar partida<input type="file" id="imp" accept=".json,application/json" hidden></label></div>`;
  $('#tabs').innerHTML = GROUPS.map(t => `<button class="${t === tab ? 'on' : ''}" data-a="tab" data-t="${t}">${t}</button>`).join('');
  $('#scs').innerHTML = SCEN.slice().sort((a, b) => a.yr - b.yr).filter(s => tab === 'Todos' || (tab === 'Civilização' ? s.civ : !s.civ && ERA[s.tech].g === tab)).map(s => `<button class="sc ${pickSc === s.id ? 'on' : ''}" data-a="sc" data-s="${s.id}">${thumb(s)}<div><span class="era ${s.tech === 'fan' ? 'fan' : ''}">${ERA[s.tech].n} · ${esc(s.y)}</span><h3>${esc(s.n)}</h3><p>${esc(s.d)}</p><small>${s.f.length} facções · ${MAPS[s.map].terr.length} territórios${airOf(s) ? ' · ' + airOf(s).n : ''}</small></div></button>`).join('');
  const sc = SCEN.find(s => s.id === pickSc);
  $('#pick').hidden = !sc;
  if (sc) {
    if (!sc.f.some(f => f.id === pickF && !f.late)) pickF = sc.f[0].id;
    $('#pickT').textContent = sc.n;
    $('#pickTech').innerHTML = `<b>${esc(ERA[sc.tech].n)}:</b> ${ERA[sc.tech].tech.map(esc).join(' ')}` + (sc.civ ? civOptsHtml() : '');
    $('#facsPick').innerHTML = sc.f.filter(f => !f.late).map(f => { const F = { ...f, obj: objOf(f, MAPS[sc.map], (sc.relics || []).map(n => idxOf(MAPS[sc.map])[n])) }; return `<button class="fp ${pickF === f.id ? 'on' : ''}" data-a="fp" data-f="${f.id}" style="--fc:${f.c}"><b>${esc(f.n)}</b><span>${esc(f.L)} · ${ABIL[f.ab][0]}</span><em>${esc(ABIL[f.ab][1])}</em><small>${esc(objText(F))}</small><small>${expand(MAPS[sc.map], f.t).length} territórios · estabilidade ${f.st} · frota ${f.nav || 1}${f.team ? ' · aliança' : ''}</small></button>`; }).join('');
    $('#diff').innerHTML = ['Fácil', 'Normal', 'Difícil'].map((t, k) => `<button class="${pickD === k ? 'on' : ''}" data-a="diff" data-d="${k}">${t}</button>`).join('');
    $('#lds').innerHTML = ldPickHtml(sc);
    $('#cons').innerHTML = ['Históricos', 'Sorteados'].map((t, k) => `<button class="${+pickR === k ? 'on' : ''}" data-a="cons" data-c="${k}" title="Históricos: cada rival usa o primeiro líder da lista. Sorteados: cada rival sorteia entre os seus.">${t}</button>`).join('');
    { const f = sc.f.find(x => x.id === pickF), Ls = leadersOf(sc.id, f), L = LEN[pickL] || Object.values(LEN)[0], ld = Ls[pickLd] || Ls[0];
      $('#setSum').innerHTML = `<b>Resumo.</b> Você comanda ${esc(f.n)}${ld ? ' com ' + esc(ld.n) : ''}. <b>${['Fácil', 'Normal', 'Difícil'][pickD]}:</b> ${['os rivais recebem 1 reforço a menos por turno', 'sem ajustes para os rivais', 'os rivais recebem 2 reforços a mais por turno e atacam com menos vantagem'][pickD]}. <b>${L.n}:</b> ${L.r} rodadas, obras e tecnologias custam ×${L.k}, o objetivo precisa ser mantido por ${L.hold} turnos e ${L.leg} de legado vence. <b>Rivais:</b> ${+pickR ? 'cada um sorteia um líder entre os seus' : 'cada um usa o líder histórico principal'}.`; }
    $('#len').innerHTML = Object.entries(LEN).map(([k, L]) => `<button class="${pickL === k ? 'on' : ''}" data-a="len" data-l="${k}" title="Obras e tecnologias custam ×${L.k}; objetivo mantido por ${L.hold} turnos; ${L.leg} de legado vence.">${L.n} · ${L.r} rodadas</button>`).join('');
  }
}
function startScenario(id, fid, diff, quiet, len, ld = 0, rl = false) {
  const sc = SCEN.find(s => s.id === id);
  G = newGame(sc, fid, diff, len); ldSetup(ld, rl); // v40: líderes da partida
  $('#setup').hidden = true; $('#game').hidden = false; bt().hidden = true; $('#toast').hidden = true;
  $('#scT').textContent = `${sc.n} · ${sc.y}`;
  $('#credit').textContent = MAPS[sc.map].credit;
  buildMap(); render();
  if (quiet) return;
  const F = Fa(fid);
  modal(`<p class="kick">${esc(ERA[sc.tech].n)} · ${esc(sc.y)}</p><h2>${esc(sc.n)}</h2><p>${esc(sc.d)}</p><p>Você comanda <b style="color:${lc(F.c)}">${esc(F.n)}</b>, liderado por ${esc(F.L)}${F.Ly ? ' (' + esc(F.Ly) + ')' : ''}. ${ABIL[F.ab][0]}: ${esc(ABIL[F.ab][1])}${F.fx && F.fx.length ? ' Poder do líder: ' + esc(ldText(F.fx)) + '.' : ''}</p><p><b>Objetivo:</b> ${esc(objText(F))}</p><p class="hint">Partida ${G.len.n.toLowerCase()}: ${G.rounds} rodadas. Cada turno: reforços, depois as ações que o seu ouro, tropas e prestígio permitirem (guerra, obras, sociedade e economia), e por fim o remanejamento. As obras e a pesquisa andam sozinhas de um turno para o outro. Também dá para vencer por legado: ${legWin()} pontos em tecnologias e construções. Objetivo e legado só valem a partir da rodada ${minWin()}.</p>`, [['Começar', () => loop()], ['Como jogar', () => { rules(); loop(); }]]);
}

// ---------- cliques ----------
document.addEventListener('click', e => {
  const fh = e.target.closest('h4.fh4'); if (fh && !e.target.closest('button')) return foldToggle(fh);
  const el = e.target.closest('[data-a]'); if (!el) return;
  const a = el.dataset.a;
  if (TIPS[a]) setTimeout(() => tipOnce(a), 0); // UI-12
  if (G && GUIDE.some(L => L.some(s => s[0] === a))) (G.guide = G.guide || {})[a] = 1;
  if (a === 'tab') { $('#setup').dataset.tab = el.dataset.t; showSetup(); }
  else if (a === 'sc') { pickSc = el.dataset.s; showSetup(); $('#pick').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else if (a === 'fp') { pickF = el.dataset.f; pickLd = 0; showSetup(); }
  else if (a === 'ldp') { pickLd = +el.dataset.k; showSetup(); }
  else if (a === 'diff') { pickD = +el.dataset.d; showSetup(); }
  else if (a === 'len') { pickL = el.dataset.l; showSetup(); }
  else if (a === 'cons') { pickR = !!+el.dataset.c; showSetup(); }
  else if (a === 'civo') { civSetup({ [el.dataset.k]: el.dataset.v }); showSetup(); }
  else if (a === 'civs' || a === 'civr') { const v = a === 'civr' ? Math.floor(Math.random() * 1e6) : Math.abs(parseInt($('#civSeed').value, 10)) || 1; civSetup({ seed: v }); showSetup(); }
  else if (a === 'start') startScenario(pickSc, pickF, pickD, false, pickL, pickLd, pickR);
  else if (a === 'resume') resume(el.dataset.n ? SLOT(el.dataset.n) : SAVE);
  else if (a === 'rules') rules(); else if (a === 'keys') keysModal();
  else if (a === 'menu') { if (G && !G.over) modal('<h2>Sair da partida?</h2><p>A partida fica salva do início do seu último turno.</p>', [['Sair', showSetup], ['Continuar jogando']]); else showSetup(); }
  else if (!G) return;
  else if (a === 'catalog') catalogModal();
  else if (a === 'routes') routesModal();
  else if (a === 'merc') { const e = act(G.player, 'merc'); toast(e || 'Mercenários na capital.'); render(); }
  else if (a === 'sup') { const e = openSup(G.player, +el.dataset.i, +$('#supTo').value, el.dataset.c); toast(e || 'Abastecimento aberto: começa no próximo turno.'); render(); }
  else if (a === 'routex') { const k = +el.dataset.k, r = G.routes[k]; if (r && r.k !== 'sup' && r.f === G.player && G.turnF === G.player) { G.routes.splice(k, 1); log(G.player, `Você fecha a ${RT[r.k].n.toLowerCase()} de ${tname(r.a)} a ${tname(r.b)}.`); toast('Rota fechada: a vaga está livre.'); } render(); routesModal(); }
  else if (a === 'supx') { const k = +el.dataset.k, r = G.routes[k]; if (r && r.k === 'sup' && r.f === G.player) { G.routes.splice(k, 1); log(G.player, `Abastecimento de ${tname(r.a)} para ${tname(r.b)} fechado.`); } render(); }
  else if (a === 'route') { const e = act(G.player, 'rota', +el.dataset.i, +el.dataset.j); toast(e || 'Rota aberta: começa a render no próximo turno.'); render(); routesModal(); }
  else if (a === 'demb') { const o = el.dataset.f, k = tk(G.player, o); if (G.emb.has(k)) G.emb.delete(k); else { G.emb.add(k); checkRoutes(); log(G.player, `Você declara embargo a ${fname(o)}.`); } render(); }
  else if (a === 'lens') { G.lens = el.dataset.l; renderMap(); }
  else if (a === 'zin') zoomBtn(1 / 1.4); else if (a === 'zout') zoomBtn(1.4); else if (a === 'zfit') { vb = { x: 0, y: 0, w: G.m.w, h: G.m.h }; setVB(); }
  else if (a === 'toAtk') toPhase('atk'); else if (a === 'toMov') toPhase('mov'); else if (a === 'end') playerEnd();
  else if (a === 'all') addAll();
  else if (a === 'ptab') { G.tab = el.dataset.k; render(); }
  else if (a === 'stab') { G[el.dataset.g] = el.dataset.k; render(); }
  else if (a === 'bcat') { bcat = el.dataset.k; render(); }
  else if (a === 'sel') { if (G.tgt != null) return; G.sel = +el.dataset.i; G.tab = 'reg'; render(); }
  else if (a === 'put1') { const i = +el.dataset.i, F = Fa(G.player); if (G.turnF === G.player && G.phase === 'ref' && G.own[i] === G.player && F.reinf > 0) { G.tr[i]++; F.reinf--; } render(); }
  else if (a === 'recAt' || a === 'bldAt' || a === 'inflAt' || a === 'atkFrom' || a === 'mvFrom') regionAct(a, +el.dataset.i, el.dataset.k, +el.dataset.j);
  else if (a === 'act') playerAct(el.dataset.k);
  else if (a === 'bld') playerAct('bld', el.dataset.k);
  else if (a === 'techs') techModal();
  else if (a === 'empire') empireModal();
  else if (a === 'goto') { e.preventDefault(); $('#modal').hidden = true; G.sel = +el.dataset.i; G.tab = 'reg'; renderMap(); render(); }
  else if (a === 'works') { G.tab = 'obr'; render(); }
  else if (a === 'selObr') { G.sel = +el.dataset.i; G.tab = 'reg'; G.rsub = 'obr'; render(); }
  else if (a === 'gtab') { gsub = el.dataset.k; govModal(); }
  else if (a === 'ftab') { fsub = el.dataset.k; figModal(); }
  else if (a === 'rush' || a === 'unq') { const F = Fa(G.player); let e = F.bldOn ? '' : act(G.player, 'obras'); if (!e) e = act(G.player, a, +el.dataset.i, +el.dataset.n); if (e) toast(e); render(); }
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
  else if (a === 'gvr') { const e = placeGovr(G.player, +el.dataset.i, el.dataset.k); toast(e || 'Governador nomeado.'); render(); if (el.closest('#modal')) figModal(); }
  else if (a === 'spy') { if (G.turnF !== G.player) return; const e = spy(G.player, +el.dataset.i, el.dataset.k); toast(e); render(); }
  else if (a === 'gv') { if (G.turnF !== G.player) return; const e = govAct(G.player, el.dataset.o, el.dataset.k, el.dataset.y); if (e) toast(e); render(); govModal(); }
  else if (a === 'occupy') occupy(); else if (a === 'move') doMove();
  else if (a === 'dipl') diploModal();
  else if (a === 'vicm') vicModal();
  else if (a === 'dprop') { const e = propose(G.player, el.dataset.f, el.dataset.k, +el.dataset.r); toast(e || 'Proposta aceita.'); render(); diploModal(); }
  else if (a === 'doff') { const x = G.offers.splice(+el.dataset.n, 1)[0]; if (x) { if (x.k === 'truce') { G.truce.add(tk(G.player, x.f)); log(G.player, `Você aceita a trégua de ${fname(x.f)}.`); } else sign(G.player, x.f, x.k); } render(); diploModal(); }
  else if (a === 'ddem') { const d = G.dem; if (d && Fa(G.player).gold >= d.g) { Fa(G.player).gold -= d.g; Fa(d.f).gold += d.g; remember(d.f, G.player, 'pagou nosso tributo', 10); remember(G.player, d.f, 'nos cobrou tributo', -15); log(G.player, `Você paga ${d.g} ouro de tributo a ${fname(d.f)}.`); G.dem = null; } render(); diploModal(); }
  else if (a === 'fund' || a === 'post') { if (G.turnF !== G.player) return; toast(civFound(G.player, +el.dataset.i, a === 'post') || (a === 'post' ? 'Posto avançado erguido.' : 'Aldeia fundada.')); render(); }
  else if (a === 'guidex') { guideSet(GUIDE.length); render(); }
  else if (a === 'buy') { toast(buyGood(G.player, el.dataset.d) || 'Bem comprado por 5 turnos.'); render(); routesModal(); }
  else if (a === 'corp') { if (G.turnF !== G.player) return; toast(openCorp(G.player, +el.dataset.i) || 'Filial aberta.'); render(); }
  else if (a === 'msl') { if (G.turnF !== G.player) return; toast(missile(G.player, +el.dataset.i) || 'Mísseis lançados.'); render(); }
  else if (a === 'vote') { G.cong.pv[el.dataset.k] = el.dataset.v === '1'; diploModal(); }
  else if (a === 'env') { const e = envoy(G.player, +el.dataset.i); toast(e || 'Enviado recebido.'); render(); }
  else if (a === 'dpro') dipl(el.dataset.f, 'pro'); else if (a === 'dbrk') dipl(el.dataset.f, 'brk'); else if (a === 'dok') dipl(el.dataset.f, 'ok'); else if (a === 'dno') dipl(null, 'no');
});
document.addEventListener('input', e => { if (e.target.id === 'mvR') $('#mvN').textContent = e.target.value; });
document.addEventListener('change', e => { if (e.target.id === 'fast' && G) G.fast = e.target.checked; if (e.target.id === 'imp' && e.target.files[0]) importSave(e.target.files[0]); });
// UI: atalhos de teclado. Enter = ação da fase; 1–6 lentes; + − 0 zoom; T G D V P letras dos painéis; ? lista.
const fire = a => { const b = document.createElement('button'); b.dataset.a = a; b.hidden = true; document.body.append(b); b.click(); b.remove(); };
const KEYS = { t: 'techs', g: 'govm', d: 'dipl', v: 'vicm', p: 'figm', o: 'works', c: 'routes', s: 'save', r: 'rules', '+': 'zin', '=': 'zin', '-': 'zout', '0': 'zfit' };
function keysModal() { modal(`<h2>Atalhos de teclado</h2><table class="rank"><tr><td>Enter</td><td>ação da fase (seguir, remanejar, encerrar turno)</td></tr><tr><td>Esc</td><td>fecha a janela ou cancela a seleção</td></tr><tr><td>1 a 6</td><td>lentes do mapa</td></tr><tr><td>+ − 0</td><td>aproximar, afastar, mapa inteiro</td></tr><tr><td>I</td><td>alterna as abas Império e Região</td></tr><tr><td>T</td><td>tecnologias</td></tr><tr><td>G</td><td>governo e fé</td></tr><tr><td>D</td><td>diplomacia</td></tr><tr><td>V</td><td>vitórias</td></tr><tr><td>P</td><td>personagens</td></tr><tr><td>O</td><td>obras do império</td></tr><tr><td>C</td><td>comércio e rotas</td></tr><tr><td>S</td><td>salvar</td></tr><tr><td>R</td><td>regras</td></tr></table>`, [['Fechar']]); }
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('h4.fh4')) { e.preventDefault(); return foldToggle(e.target); }
  const mo = !$('#modal').hidden;
  if (e.key === 'Escape') { if (mo) { const b = $('#modal [data-m]:last-of-type'); if (b) b.click(); return; } if (G && !G.busy && !G.pend) { hideBattle(); G.sel = null; G.card = null; G.mode = null; G.tab = 'imp'; render(); } return; }
  if (mo || !G || $('#game').hidden) return;
  if (e.key.toLowerCase() === 'i') { G.tab = G.tab === 'reg' ? 'imp' : 'reg'; return render(); } // v49: alterna Império e Região
  const k = e.key.toLowerCase();
  if (k === 'enter') { if (e.target.closest && e.target.closest('button,a,[tabindex]')) return; const b = $('#battle:not([hidden]) button.pri:not(:disabled)') || $('#actbar .pri:not(:disabled)'); if (b) { e.preventDefault(); b.click(); } return; }
  if (/^[1-9]$/.test(k)) { const b = document.querySelectorAll('#lens button')[+k - 1]; if (b) b.click(); return; }
  if (k === '?') return keysModal();
  if (KEYS[k] && (G.turnF === G.player || /^(zin|zout|zfit|rules|vicm|techs)$/.test(KEYS[k]))) fire(KEYS[k]);
});

initPan(); showSetup();
window.__sob = { get G() { return G; }, startScenario, loop, SCEN, resume, render, act, STRUCT };
