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
  const g = { sc, m, ix, N, player, diff, lenK: LEN[len] ? len : 'c', len: L, rounds: L.r, era: eraOf(sc), air: airOf(sc), own: Array(N).fill('neu'), tr: Array(N).fill(sc.neu || 2), fort: Array(N).fill(0), bld: Array.from({ length: N }, () => []), q: Array.from({ length: N }, () => []), occ: Array(N).fill(0), dis: new Set(), rl: [], mv: [], arr: [], F: { neu: NEU, reb: REB, off: OFF }, order: [], cur: 0, round: 1, phase: 'ref', truce: new Set(), cool: {}, log: [], trades: 0, seaUsed: new Set(), sel: null, tgt: null, over: false, fast: false, auto: false };
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
  for (const d of sc.f) {
    const F = { ...d, real: true, stab: d.st, cards: [], alive: true, entered: !d.late, capI: need(d.cap), passive: !!d.passive, reinf: 0, conq: false, ofs: false, airX: 0, planes: 0, navLeft: 0, nav: d.nav || 1, gold: 3, sci: 0, pre: 2, tech: [], pa: 0, camp: false, recOn: false, tradeOn: false, bldOn: false, res: null, ww: 0, hold: 0, recQ: {}, upk: 0, nB: 0, cq: 0 };
    F.obj = objOf(d, m, g.relics);
    if (F.obj.hold) F.obj.hold.forEach(need);
    expand(m, d.t).forEach(n => { const i = need(n); g.own[i] = d.id; g.tr[i] = d.tr || 3; });
    for (const [n, v] of Object.entries(d.trT || {})) g.tr[need(n)] = v;
    expand(m, d.t).forEach(n => g.lv[need(n)] = elv >= 3 ? 2 : 1); g.lv[F.capI] = elv >= 3 ? 4 : 3;
    if (d.t.length) g.tr[F.capI] = Math.max(g.tr[F.capI], d.ctr || (d.tr || 3) + 2);
    g.F[d.id] = F; g.order.push(d.id);
  }
  for (const [n, v, l] of sc.rebels || []) { const i = need(n); g.own[i] = 'reb'; g.tr[i] = v; g.rl[i] = l; }
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
const allied = (a, b) => a === b || (!!Fa(a).team && Fa(a).team === Fa(b).team);
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
const has = (f, k) => Fa(f).tech.includes(k);
// nb: construção ativa (desativada por falta de ouro não conta); built: existe no território
const built = (i, k) => G.bld[i].includes(k);
const nb = (i, k) => built(i, k) && !G.dis.has(i + ':' + k);
const countB = (f, k) => owned(f).filter(i => nb(i, k)).length;
const coastal = i => G.A[i].some(j => isSea(i, j));
// zonas de recurso são economia, não legado
const legacy = f => 2 * Fa(f).tech.length + owned(f).reduce((s, i) => s + G.bld[i].reduce((t, k) => t + (STRUCT[k].lg || 0), 0), 0);
const minWin = () => Math.ceil(G.rounds / 3); // D-04: objetivo e legado só contam a partir daqui
const evRound = e => 1 + Math.round((e.t - 1) * G.rounds * .5 / G.sc.turns); // eventos espalhados pela 1ª metade da partida
const occupied = i => G.occ[i] > 0;
const settled = f => owned(f).filter(i => !occupied(i)); // territórios que produzem (D-05)
const sName = k => { const n = STRUCT[k].n; return typeof n === 'string' ? n : n[NG[G.era.cards]]; };
// parte 4: efeitos somados das construções ativas
const hasW = (f, k) => real(f) && owned(f).some(i => nb(i, k)); // maravilha do mundo em posse de f
const sumB = (f, p) => owned(f).reduce((s, i) => s + G.bld[i].reduce((t, k) => t + (nb(i, k) && STRUCT[k][p] || 0), 0), 0);
const tName = k => TK[k].n[NG[G.era.cards]];
const capOwner = i => G.order.find(f => Fa(f).capI === i && Fa(f).entered);
const capsHeld = f => G.order.filter(o => Fa(o).entered && G.own[Fa(o).capI] === f).length;
const tname = i => G.m.terr[i].n;
const fname = f => Fa(f).n;
const real = f => Fa(f).real;

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
  if (f !== G.player && !G.auto) { const b = G.diff === 2 ? 2 : G.diff === 0 ? -1 : 0; if (b) { r = Math.max(2, r + b); parts.push(['dificuldade', b]); } }
  if (F.stab < 15) { r = Math.ceil(r / 2); parts.push(['instabilidade: metade', 0]); }
  return { r, parts };
}
const planesOf = f => (G.air ? (G.air.per ?? 1) * capsHeld(f) + countB(f, 'aer') : 0) + Fa(f).airX;
const navOf = f => { const F = Fa(f); return F.nav + (F.ab === 'almirante' ? 1 : 0) + countB(f, 'por') + (has(f, 'nav') ? 1 : 0) + sumB(f, 'nav'); };
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
const worked = i => G.dep[i].filter(d => G.bld[i].some(k => STRUCT[k].z === DEP[d].z && nb(i, k)));
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
const goods = f => goodsAt(netOf(f).linked);
const goodsAll = f => goodsAt(owned(f));
const luxOf = f => [...goods(f)].filter(d => DEP[d].lux).length;
function yieldOf(i) {
  const f = G.own[i], T = TERR[G.ter[i]], lv = G.lv[i], cap = real(f) && Fa(f).capI === i;
  const y = { pre: 0, stab: 0, food: T.food + (G.riv[i] ? 1 : 0) + (coastal(i) ? 1 : 0) + (hasW(f, 'jar') ? 1 : 0), prod: T.prod + (cap ? 2 : 0), gold: T.gold + (G.riv[i] ? 1 : 0) + (cap ? 1 : 0) + (lv >= 2 ? 1 : 0) + (lv >= 4 ? 1 : 0), sci: (lv >= 3 ? 1 : 0) + (lv >= 4 ? 1 : 0) };
  for (const k of G.bld[i]) {
    const S = STRUCT[k]; if (!S.y || !nb(i, k)) continue;
    for (const [r, v] of Object.entries(S.y)) y[r] += v;
    if (k === 'mer' && real(f) && has(f, 'com')) y.gold++;
    if (k === 'agr' && G.riv[i]) y.food++;
    if (S.z) { const r = Object.keys(S.y)[0]; y[r] += Math.min(3, G.A[i].filter(j => G.own[j] === f && nb(j, k)).length); } // polo
  }
  for (const d of worked(i)) for (const [r, v] of Object.entries(DEP[d].y)) y[r] += v;
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
  const y = T.reduce((s, i) => { const v = yieldOf(i); for (const r in s) s[r] += v[r]; return s; }, { gold: 0, sci: 0, pre: 0, stab: 0 });
  return {
    gold: Math.max(1, y.gold + diff),
    sci: Math.round((1 + y.sci) * (hasW(f, 'obi') ? 1.25 : 1)), stab: y.stab,
    pre: y.pre + capsHeld(f) + countB(f, 'tem') + 2 * countB(f, 'mar') + (has(f, 'ret') ? 1 : 0) + (F.stab >= 70 ? 1 : 0),
  };
}
const paOf = f => ECON.pa + (has(f, 'adm') ? 1 : 0) + Math.min(2, Math.floor(owned(f).filter(i => G.lv[i] >= 3).length / 3)); // S-04
const troopCost = f => has(f, 'con') ? 1 : ECON.troop;
// ---------- obras em turnos (parte 2: P-01 a P-04, P-08, P-11) ----------
// pedra barateia muralhas, templos e maravilhas; madeira, portos, oficinas e quartéis (R-25, R-26)
const CHEAP = { ped: ['for', 'tem', 'mar', 'cas', 'cat', 'aqu'], mad: ['por', 'ofi', 'qua', 'pal', 'ser'] };
const STONE = ['for', 'tem', 'mon', 'pdr', 'cas', 'cat']; // Grandes Pirâmides (C-200)
const pCost = (f, k, i) => {
  const g = real(f) ? goods(f) : new Set(), c = Object.entries(CHEAP).some(([d, ks]) => ks.includes(k) && g.has(d)), p = STONE.includes(k) && hasW(f, 'pir');
  const t = STRUCT[k].road && i != null ? ({ m: 2, w: 2, d: 1.5 }[G.ter[i]] || 1) : 1; // L-11
  return Math.round(STRUCT[k].pc * G.len.k * (has(f, 'eng') ? .75 : 1) * (c ? .75 : 1) * (p ? .75 : 1) * t);
};
const qMax = f => has(f, 'adm') ? 5 : 3;
function prodOf(i) {
  return real(G.own[i]) ? Math.max(1, yieldOf(i).prod) : 0;
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
const rushCost = (f, i, n) => { const x = G.q[i][n]; return x ? (pCost(f, x.k, i) - x.p) * (STRUCT[x.k].wonder ? ECON.rushW : ECON.rush) : 0; };
const canRush = (f, i, n) => { const x = G.q[i][n]; return !!x && G.own[i] === f && Fa(f).bldOn && x.t < G.round && Fa(f).gold >= rushCost(f, i, n); };
function finishWork(i, n) {
  const f = G.own[i], x = G.q[i].splice(n, 1)[0]; G.bld[i].push(x.k); Fa(f).nB++;
  log(f, `${fname(f)} conclui ${sName(x.k)} em ${tname(i)}.`);
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
const techCost = t => t.cost * 2 * G.len.k;
const techOk = (f, t) => !has(f, t.k) && (t.req || []).every(r => has(f, r));
const inflCost = (f, j) => Math.max(1, G.tr[j] + 1 - (has(f, 'ret') ? 1 : 0));
const canRecruitAt = (f, i) => G.own[i] === f && (i === Fa(f).capI || nb(i, 'qua'));
const canInfl = (f, j) => (G.own[j] === 'neu' || G.own[j] === 'reb') && !capOwner(j) && G.A[j].some(i => G.own[i] === f) && Fa(f).pre >= inflCost(f, j);
const spend = f => { const F = Fa(f); if (F.pa < 1) return false; F.pa--; return true; };
// Cada ação gasta 1 ponto de ação; devolve texto de erro ou '' quando deu certo.
function act(f, a, x, y) {
  const F = Fa(f);
  if (a === 'res') { // escolher a pesquisa não gasta ação; o saber de cada turno vai para ela (P-09)
    const t = TK[x]; if (!t || !techOk(f, t)) return 'Tecnologia indisponível.';
    F.res = x; return '';
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
    spend(f); F.gold -= ECON.fest; F.stab = Math.min(100, F.stab + 15); F.ww = Math.max(0, F.ww - 3);
  } else if (a === 'tax') {
    spend(f); const g = Math.ceil(owned(f).length / 2); F.gold += g; F.stab = Math.max(0, F.stab - 8);
    log(f, `${fname(f)} cobra impostos extraordinários (+${g} ouro).`);
  } else if (a === 'trade') {
    if (F.tradeOn) return 'O comércio já está aberto neste turno.'; spend(f); F.tradeOn = true;
  } else if (a === 'infl') {
    if (!canInfl(f, x)) return 'Precisa ser um território neutro ou rebelde vizinho, e prestígio suficiente.';
    spend(f); F.pre -= inflCost(f, x); G.own[x] = f; G.tr[x] = Math.max(1, Math.ceil(G.tr[x] / 2)); delete G.rl[x]; G.arr[x] = G.tr[x];
    log(f, `${tname(x)} adere a ${fname(f)} por influência política.`); checkWin();
  } else if (a === 'agit') {
    const o = G.own[x]; if (!real(o) || !hostile(f, x)) return 'Escolha um território de uma facção rival.';
    if (F.pre < ECON.agit) return 'Prestígio insuficiente.';
    spend(f); F.pre -= ECON.agit; Fa(o).stab = Math.max(0, Fa(o).stab - 15);
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
  if (F.sci < techCost(t)) return;
  F.sci -= techCost(t); F.tech.push(t.k); F.res = null;
  log(f, `${fname(f)} desenvolve ${tName(t.k)}.`);
}
// comércio aberto: 2 por 1 (3 por 2 com a tecnologia de comércio)
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
function defBonus(j, i) { const d = G.own[j]; return terrDef(j) + bldDef(j) + (hasW(d, 'gmu') && !(i != null && isSea(i, j)) ? 1 : 0) + (G.fort[j] > 0 || (capOwner(j) && capOwner(j) === d) || (Fa(d).ab === 'tenaz' && G.tr[j] >= 5) ? 1 : 0); }
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
    for (let s = 0; s < r + 1; s++) fr = fr.flatMap(a => G.A[a].filter(b => G.own[b] === f && !isSea(a, b) && road(b) && !seen.has(b) && seen.add(b)));
    seen.forEach(j => out.add(j));
  }
  if (nb(i, 'por')) owned(f).forEach(j => { if (nb(j, 'por')) out.add(j); });
  out.delete(i); return [...out];
}
// L-08: na rede de bens não falta suprimento; fora dela vale a distância até capital, quartel ou porto
const lowSupply = (i) => real(G.own[i]) && !netOf(G.own[i]).linked.has(i) && supplyDist(G.own[i])[i] > ECON.sup + (hasW(G.own[i], 'rce') ? 2 : 0);
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
  const up = (A.ofs ? 1 : 0) + (G.bld[i].some(k => STRUCT[k].atk && nb(i, k)) ? 1 : 0) + (A.camp && hasW(a, 'csg') ? 1 : 0);
  if (up) R[0] = Math.min(6, R[0] + up);
  D[0] = Math.min(6, D[0] + defBonus(j, i));
  const ties = TERR[G.ter[j]].def !== 'm' && !G.bld[j].some(k => STRUCT[k].tie && nb(j, k)) && (A.ab === 'tatico' || (A.real && A.camp && has(a, 'tat'))); // M-06: em montanha o atacante sempre perde empates
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
  G.arr[j] = n; // tropas que entraram por conquista já se moveram neste turno
  // P-08: o conquistador fica com metade do progresso das obras; maravilha em andamento se perde
  G.q[j] = real(a) ? G.q[j].filter(x => !STRUCT[x.k].wonder).map(x => ({ ...x, p: Math.floor(x.p / 2) })).slice(0, qMax(a)) : [];
  if (real(a)) { Fa(a).conq = true; Fa(a).cq++; G.occ[j] = ECON.occ; } else G.occ[j] = 0;
  if (real(d)) {
    const D = Fa(d); D.stab = Math.max(0, D.stab - 2); D.ww = Math.min(30, D.ww + 2);
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
  F.stab = Math.max(0, Math.min(100, F.stab + 2 + (F.ab === 'carisma' ? 3 : 0) + 2 * countB(f, 'tem') + Math.min(4, luxOf(f)) + Math.min(6, income(f).stab) - Math.floor(F.ww / 5)));
  // Grande Biblioteca (C-202): tecnologias que duas outras facções já têm
  if (hasW(f, 'gbi')) TECH.forEach(t => { if (!has(f, t.k) && G.order.filter(o => o !== f && Fa(o).alive && has(o, t.k)).length >= 2) { F.tech.push(t.k); log(f, `A Grande Biblioteca dá ${tName(t.k)} a ${fname(f)}.`); } });
  owned(f).forEach(i => { if (G.fort[i] > 0) G.fort[i]--; if (G.occ[i] > 0) G.occ[i]--; });
  F.conq = false; F.cq = 0; F.ofs = false; G.phase = 'ref'; G.sel = G.tgt = null; G.card = null; G.mode = null; G.seaUsed = new Set(); G.mv = []; G.arr = [];
  for (const [i, n] of Object.entries(F.recQ)) if (G.own[i] === f) G.tr[i] += n;
  F.recQ = {};
  const inc = income(f); F.gold += inc.gold; F.sci += inc.sci; F.pre += inc.pre;
  payUpkeep(f); produce(f); grow(f); research(f);
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
  const F = Fa(f);
  F.ww = F.camp ? Math.min(30, F.ww + 1) : Math.max(0, F.ww - 2);
  if ((F.conq || F.ab === 'espiao') && F.cards.length < 5) F.cards.push(drawCard());
  G.sel = G.tgt = null; G.card = null;
}
async function advance() {
  G.cur++;
  if (G.cur >= G.order.length) {
    G.cur = 0; await rebelsAct(); if (G.over) return;
    G.round++;
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
      if (f === G.player && !G.auto) return;
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
    alive.forEach(a => { Fa(a).team = null; });
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
  const F = {}; G.order.forEach(f => { const X = Fa(f); F[f] = { stab: X.stab, cards: X.cards, alive: X.alive, entered: X.entered, team: X.team, passive: X.passive, L: X.L, ab: X.ab, airX: X.airX, gold: X.gold, sci: X.sci, pre: X.pre, tech: X.tech, res: X.res, ww: X.ww, hold: X.hold, recQ: X.recQ }; });
  return JSON.stringify({ v: 5, sc: G.sc.id, player: G.player, diff: G.diff, len: G.lenK, own: G.own, tr: G.tr, fort: G.fort, bld: G.bld, q: G.q, occ: G.occ, lv: G.lv, food: G.food, rl: G.rl, F, cur: G.cur, round: G.round, truce: [...G.truce], cool: G.cool, log: G.log.slice(0, 30), trades: G.trades, at: Date.now() });
}
function save() { try { G.snap = snapshot(); localStorage.setItem(SAVE, G.snap); } catch (e) { } }
function loadSave(k = SAVE) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function restore(s) {
  const sc = s && s.v === 5 && SCEN.find(x => x.id === s.sc); if (!sc) return false;
  startScenario(sc.id, s.player, s.diff, true, s.len);
  Object.assign(G, { own: s.own, tr: s.tr, fort: s.fort, bld: s.bld, q: s.q, occ: s.occ, lv: s.lv || G.lv, food: s.food || G.food, rl: s.rl, cur: s.cur, round: s.round, truce: new Set(s.truce), cool: s.cool, log: s.log, trades: s.trades });
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
  if (F.stab < 35 && F.gold >= ECON.fest) o.push([5, 'fest']);
  const inf = T.flatMap(i => G.A[i]).filter(j => canInfl(f, j)).sort((a, b) => tval(f, b) / inflCost(f, b) - tval(f, a) / inflCost(f, a))[0];
  if (inf != null) o.push([3.4 + tval(f, inf) * .4, 'infl', inf]);
  if (F.pre >= ECON.agit + 2) { const j = border.flatMap(i => G.A[i]).find(j => real(G.own[j]) && hostile(f, j) && Fa(G.own[j]).stab < 45); if (j != null) o.push([1.8, 'agit', j]); }
  if (F.stab > 65) o.push([1.3, 'tax']);
  const next = F.res && TK[F.res];
  if (!F.tradeOn && next && F.gold >= 8 && (techCost(next) - F.sci) * 2 <= F.gold - 3) o.push([2.6, 'trade']);
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
  const T = owned(f), t = TECH.filter(t => techOk(f, t)).sort((a, b) => ((TECH_W[b.k] || 3) - (b.k === 'nav' && !T.some(coastal) ? 2 : 0)) / techCost(b) - ((TECH_W[a.k] || 3) - (a.k === 'nav' && !T.some(coastal) ? 2 : 0)) / techCost(a))[0];
  if (t) act(f, 'res', t.k);
}
function aiGovern(f) {
  const F = Fa(f);
  aiResearch(f);
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
      while (next && F.sci < techCost(next) && F.gold > 6 && tradeRes(f, 'gold', 'sci'));
    }
    if (a === 'obras') aiWorks(f);
  }
}
async function aiTurn(f) {
  const F = Fa(f), g = G, wait = async ms => { if (!G.fast && !G.auto) await sleep(ms); live(g); };
  aiBreakTruces(f);
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
      G.truce.delete(k); Fa(f).stab = Math.max(0, Fa(f).stab - 15);
      log(f, `${fname(f)} rompe a trégua com ${fname(o)}!`); if (o === G.player && !G.auto) toast(`${fname(f)} rompeu a trégua com você!`);
    }
  }
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
    const own = has(me, t.k), ok = techOk(me, t), on = F.res === t.k, can = ok && !on && G.turnF === me, c = techCost(t);
    const req = (t.req || []).map(tName).join(' e '), left = Math.max(0, c - F.sci), eta = left ? Math.ceil(left / si) : 0;
    return `<div class="tech ${own ? 'own' : ok ? '' : 'lock'}"><div><b>${esc(tName(t.k))}</b> <span class="hint">nível ${t.t} · ${c} 🔬${req ? ' · exige ' + esc(req) : ''}</span><p>${esc(t.fx)}</p>${on ? `<p class="hint">${pbar(F.sci, c)} ${eta ? `pronta em ${eta} turno(s)` : 'pronta no início do próximo turno'}</p>` : ''}</div>${own ? '<span class="ok">✓</span>' : on ? '<span class="ok">em pesquisa</span>' : `<button class="mini ${can ? 'pri' : ''}" data-a="tech" data-k="${t.k}" ${can ? '' : 'disabled'}>Pesquisar</button>`}</div>`;
  };
  modal(`<h2>Tecnologias · ${esc(G.era.n)}</h2><p class="hint">Saber acumulado: ${F.sci} 🔬 (+${si} por turno). Escolher a pesquisa não gasta ação: o saber de cada turno vai para ela e ela fica pronta no início do turno em que o custo for atingido. Cada tecnologia vale 2 de legado.</p><div class="techs">${TECH.map(row).join('')}</div>`, [['Fechar']]);
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
    if (aiAcceptTruce(o)) { G.truce.add(tk(me, o)); log(me, `${fname(o)} aceita a trégua.`); toast(`${fname(o)} aceitou a trégua.`); }
    else { log(me, `${fname(o)} recusa a trégua.`); toast(`${fname(o)} recusou.`); }
  } else if (act === 'brk') { G.confirmBrk = o; }
  else if (act === 'ok') { G.truce.delete(tk(me, o)); Fa(me).stab = Math.max(0, Fa(me).stab - 15); G.confirmBrk = null; log(me, `Você rompe a trégua com ${fname(o)} (−15 de estabilidade).`); }
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
    <div class="obj"><b>Objetivo</b> ${esc(objText(F))}<ul>${objLines(me).map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✓' : '○'} ${esc(t)}</li>`).join('')}</ul></div>`;
  const inc = income(me), u = upkeepOf(me), net = inc.gold - u.b - u.t, rt = F.res && TK[F.res];
  $('#me').innerHTML += `<div class="res"><span title="Ouro: tropas, apressar obras e manutenção. Por turno: +${inc.gold} de renda, −${u.b} de construções, −${u.t} de soldo.">💰 <b>${F.gold}</b> <i>${net >= 0 ? '+' : ''}${net}</i></span><span title="Saber: vai para a pesquisa em andamento${rt ? ' (' + esc(tName(rt.k)) + ', ' + techCost(rt) + ')' : ''}">🔬 <b>${F.sci}</b> <i>+${inc.sci}</i></span><span title="Prestígio: influência política">⭐ <b>${F.pre}</b> <i>+${inc.pre}</i></span><span title="Legado: 2 por tecnologia, 1 por construção, 5 pela Maravilha. ${legWin()} vence a partir da rodada ${minWin()}.">🏛 <b>${legacy(me)}</b>/${legWin()}</span></div>
    <p class="hint">${rt ? `Pesquisando ${esc(tName(rt.k))} ${pbar(F.sci, techCost(rt))} ${F.sci}/${techCost(rt)}` : 'Nenhuma pesquisa escolhida: abra a árvore de tecnologias.'}</p>`;
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
        ${F.camp && G.air && F.planes ? Bt('air', '', `✈ ${esc(G.air.n)} (${F.planes})`, 'Bombardeie um alvo ao alcance. Não gasta ação.', false, G.mode === 'air') : ''}</div></div>
      <div class="grp"><b>🏛 Obras</b> <span class="hint">fila de até ${qMax(me)} por território; a produção ⚒ de cada território avança a obra do topo. Uma de cada tipo por território. Zonas (🌾🐄🐟🪵⛏💰🔬⚔⭐⚓) ocupam vagas: aldeia 1, vila 2, cidade 3, metrópole 4. Mudam de dono na conquista.</span><div class="row">
        ${Bt('act', 'obras', F.bldOn ? 'Obras abertas' : 'Ordenar obras', '1 ação por turno: ponha, retire e apresse obras em todas as filas.', !F.bldOn && noPA, F.bldOn)}<button class="ab2" data-a="works">Obras do império</button></div>
        ${F.bldOn ? `<div class="row">${blds}</div>` : ''}</div>
      <div class="grp"><b>🔬 Ciência</b><div class="row"><button class="ab2" data-a="techs">Árvore de tecnologias <small>${F.sci}🔬</small></button></div></div>
      <div class="grp"><b>🤝 Sociedade</b><div class="row">
        ${Bt('act', 'fest', `Festividades <small>${ECON.fest}💰</small>`, '+15 de estabilidade.', noPA || F.gold < ECON.fest, false)}
        ${Bt('act', 'infl', 'Influenciar <small>⭐</small>', 'Anexe um território neutro ou rebelde vizinho sem lutar. Custa as tropas dele + 1 de prestígio.', noPA, G.mode === 'infl')}
        ${Bt('act', 'agit', `Agitadores <small>${ECON.agit}⭐</small>`, 'Uma facção rival perde 15 de estabilidade.', noPA || F.pre < ECON.agit, G.mode === 'agit')}</div></div>
      <div class="grp"><b>💰 Economia</b><div class="row">
        ${Bt('act', 'tax', 'Impostos', `+${Math.ceil(owned(me).length / 2)} de ouro agora, −8 de estabilidade.`, noPA, false)}
        ${Bt('act', 'trade', F.tradeOn ? 'Mercado aberto' : 'Comércio', 'Troque recursos 2 por 1 (3 por 2 com a tecnologia de comércio) quantas vezes quiser no turno.', !F.tradeOn && noPA, F.tradeOn)}</div></div>
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
    if (o !== 'off') {
      const T = TERR[G.ter[i]], isl = G.A[i].length && G.A[i].every(j => isSea(i, j)), wk = worked(i);
      inf += `<p class="hint">${T.ic} ${T.n}${G.riv[i] ? ' · rio' : ''}${coastal(i) ? ' · litoral' : ''}${isl ? ' · ilha' : ''} · <b>${LEVEL[G.lv[i]].n}</b>${real(o) ? ` · zonas ${zonesAt(i).length}/${G.lv[i]}` : ''}${o === me ? (n => n.core.has(i) ? ' · na rede' : n.linked.has(i) ? ' · ligado por trilha' : ' · fora da rede de bens')(netOf(me)) : ''}${road(i) ? ' · ' + sName(road(i) > 1 ? 'pav' : 'est').toLowerCase() : ''}</p>
        <p class="hint">Jazidas: ${G.dep[i].length ? G.dep[i].map(d => DEP[d].ic + ' ' + esc(DEP[d].n) + (wk.includes(d) ? ' ✓' : '')).join(', ') : 'nenhuma conhecida'}${G.dep[i].length > wk.length && real(o) ? ' (✓ = explorada; as outras pedem a zona certa)' : ''}</p>`;
      if (real(o)) { const y = yieldOf(i); inf += `<p class="hint">Rende 🍞 ${y.food} (consome ${foodUse(i)}${G.lv[i] < 4 ? `, estoque ${G.food[i]}/${growNeed(i)}${growOk(i) ? '' : ' · para crescer: ' + LEVEL[G.lv[i]].req.map(sName).join(' ou ')}` : ''}) · ⚒ ${prodOf(i)} · 💰 ${y.gold} · 🔬 ${y.sci}</p>`; }
    }
    if (o === me) inf += qHtml(i);
  }
  $('#info').innerHTML = inf || '<p class="hint">Clique num território para ver detalhes. Arraste para mover o mapa, role ou use + e − para zoom.</p>';
  $('#cards').innerHTML = `<h4>Cartas <span class="hint">${F.cards.length}/5 · ganhe uma por turno em que conquistar · usar não gasta ação</span></h4>` + (F.cards.length ? F.cards.map((c, h) => `<button class="card ${G.card && G.card.h === h ? 'on' : ''}" data-a="card" data-h="${h}" ${my ? '' : 'disabled'}><b>${esc(cardName(c))}</b><span>${esc(cardFx(c))}</span></button>`).join('') : '<p class="hint">Nenhuma carta.</p>');
  $('#tech').innerHTML = `<h4>Tecnologia · ${esc(G.era.n)}</h4><p class="hint">Pesquisadas: ${F.tech.length ? F.tech.map(k => esc(tName(k))).join(', ') : 'nenhuma'}</p><ul>${G.era.tech.map(t => `<li>${esc(t)}</li>`).join('')}${G.sc.air ? `<li>${esc(G.sc.air.n)}: alcance ${G.sc.air.r}, acertam com ${G.sc.air.hit}+.</li>` : ''}</ul>`;
  $('#facs').innerHTML = '<h4>Facções</h4>' + G.order.filter(f => Fa(f).entered || Fa(f).late).map(f => {
    const X = Fa(f), alive = X.alive && X.entered;
    const rel = f === me ? 'você' : !X.entered ? 'ainda neutro' : !alive ? 'eliminado' : allied(me, f) ? 'aliado' : peace(me, f) ? 'trégua' : 'guerra';
    let act = '';
    if (my && alive && f !== me && !allied(me, f)) {
      if (G.truce.has(tk(me, f))) act = G.confirmBrk === f ? `<button class="mini bad" data-a="dok" data-f="${f}">Confirmar (−15)</button><button class="mini" data-a="dno">Não</button>` : `<button class="mini" data-a="dbrk" data-f="${f}">Romper</button>`;
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
  else if (a === 'occupy') occupy(); else if (a === 'move') doMove();
  else if (a === 'dpro') dipl(el.dataset.f, 'pro'); else if (a === 'dbrk') dipl(el.dataset.f, 'brk'); else if (a === 'dok') dipl(el.dataset.f, 'ok'); else if (a === 'dno') dipl(null, 'no');
});
document.addEventListener('input', e => { if (e.target.id === 'mvR') $('#mvN').textContent = e.target.value; });
document.addEventListener('change', e => { if (e.target.id === 'fast' && G) G.fast = e.target.checked; if (e.target.id === 'imp' && e.target.files[0]) importSave(e.target.files[0]); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && G && !G.busy && !G.pend) { hideBattle(); G.sel = null; G.card = null; G.mode = null; render(); } });

initPan(); showSetup();
window.__sob = { get G() { return G; }, startScenario, loop, SCEN, resume, render, act, STRUCT };
