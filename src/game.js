// Soberania v4: motor do jogo (guerra no estilo War + turno de governo com ações), IA e interface.
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rnd = Math.random, d6 = () => 1 + Math.floor(rnd() * 6);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const NEU = { id: 'neu', n: 'Neutros', c: '#4b5361', real: false }, REB = { id: 'reb', n: 'Rebeldes', c: '#7c3a34', real: false }, OFF = { id: 'off', n: 'Fora do mundo conhecido', c: '#1b222b', real: false };
const PHASE = { ref: 'Reforços', atk: 'Ações', mov: 'Remanejamento' };
const SAVE = 'soberania-v4';
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
function newGame(sc, player, diff) {
  const m = MAPS[sc.map], ix = idxOf(m), N = m.terr.length;
  const need = n => { if (!(n in ix)) throw Error(sc.id + ': território desconhecido ' + n); return ix[n]; };
  const g = { sc, m, ix, N, player, diff, era: eraOf(sc), air: airOf(sc), own: Array(N).fill('neu'), tr: Array(N).fill(sc.neu || 2), fort: Array(N).fill(0), bld: Array.from({ length: N }, () => []), rl: [], mv: [], arr: [], F: { neu: NEU, reb: REB, off: OFF }, order: [], cur: 0, round: 1, phase: 'ref', truce: new Set(), cool: {}, log: [], trades: 0, seaUsed: new Set(), sel: null, tgt: null, over: false, fast: false, auto: false };
  g.A = Array.from({ length: N }, () => []);
  for (const [a, b] of m.adj) { g.A[a].push(b); g.A[b].push(a); }
  g.seaK = new Set(m.sea.map(([a, b]) => a * 1e4 + b).concat(m.sea.map(([a, b]) => b * 1e4 + a)));
  g.regT = m.regions.map((_, r) => m.terr.map((t, i) => t.r === r ? i : -1).filter(i => i >= 0));
  for (const [n, v] of Object.entries(sc.neuT || {})) g.tr[need(n)] = v;
  expand(m, sc.off || []).forEach(n => { const i = need(n); g.own[i] = 'off'; g.tr[i] = 0; });
  g.relics = (sc.relics || []).map(need);
  for (const d of sc.f) {
    const F = { ...d, real: true, stab: d.st, cards: [], alive: true, entered: !d.late, capI: need(d.cap), passive: !!d.passive, reinf: 0, conq: false, ofs: false, airX: 0, planes: 0, navLeft: 0, nav: d.nav || 1, gold: 3, sci: 0, pre: 2, tech: [], pa: 0, camp: false, recOn: false, tradeOn: false };
    F.obj = objOf(d, m, g.relics);
    if (F.obj.hold) F.obj.hold.forEach(need);
    expand(m, d.t).forEach(n => { const i = need(n); g.own[i] = d.id; g.tr[i] = d.tr || 3; });
    for (const [n, v] of Object.entries(d.trT || {})) g.tr[need(n)] = v;
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
const canAtk = (f, i, j, probe) => (probe || Fa(f).camp) && G.own[i] === f && G.tr[i] > 1 && G.A[i].includes(j) && hostile(f, j) && seaOk(f, i, j);
const has = (f, k) => Fa(f).tech.includes(k);
const nb = (i, k) => G.bld[i].includes(k);
const countB = (f, k) => owned(f).filter(i => nb(i, k)).length;
const coastal = i => G.A[i].some(j => isSea(i, j));
const legacy = f => 2 * Fa(f).tech.length + owned(f).reduce((s, i) => s + G.bld[i].reduce((t, k) => t + (k === 'mar' ? 5 : 1), 0), 0);
const sName = k => STRUCT[k].n[NG[G.era.cards]];
const tName = k => TK[k].n[NG[G.era.cards]];
const capOwner = i => G.order.find(f => Fa(f).capI === i && Fa(f).entered);
const capsHeld = f => G.order.filter(o => Fa(o).entered && G.own[Fa(o).capI] === f).length;
const tname = i => G.m.terr[i].n;
const fname = f => Fa(f).n;
const real = f => Fa(f).real;

function reinfOf(f) {
  const F = Fa(f), T = owned(f), parts = [];
  let r = Math.max(3, Math.floor(T.length / 3)); parts.push([`${T.length} territórios ÷ 3 (mín. 3)`, r]);
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
const navOf = f => { const F = Fa(f); return F.nav + (F.ab === 'almirante' ? 1 : 0) + countB(f, 'por') + (has(f, 'nav') ? 1 : 0); };
function objDone(f) {
  const F = Fa(f), o = F.obj;
  if (G.own[F.capI] !== f) return false;
  if (o.hold && !o.hold.every(n => G.own[G.ix[n]] === f)) return false;
  if (o.n && owned(f).length < o.n) return false;
  if (o.any && o.any.filter(i => G.own[i] === f).length < o.k) return false;
  return true;
}
function objText(F) {
  const o = F.obj, p = [];
  if (o.txt) return o.txt;
  if (o.hold) p.push('Controle ' + o.hold.join(', '));
  if (o.n) p.push((p.length ? 'e ' : 'Controle ') + o.n + ' territórios');
  if (o.any) p.push('Reúna ' + o.k + ' das ' + o.any.length + ' Runas Antigas (ᚱ)');
  return p.join(' ') + ', mantendo sua capital até o início do seu turno seguinte.';
}
function objLines(f) {
  const F = Fa(f), o = F.obj, L = [[`Capital: ${F.cap}`, G.own[F.capI] === f]];
  (o.hold || []).forEach(n => L.push([n, G.own[G.ix[n]] === f]));
  if (o.n) { const c = owned(f).length; L.push([`${c}/${o.n} territórios`, c >= o.n]); }
  if (o.any) { const c = o.any.filter(i => G.own[i] === f).length; L.push([`${c}/${o.k} runas`, c >= o.k]); }
  return L;
}
// pontos ao fim das rodadas: quem mais cresceu, não quem começou maior
const score = f => { const F = Fa(f); return owned(f).length - (F.t0 || 0) + 2 * capsHeld(f) + 2 * (F.obj.hold || []).filter(n => G.own[G.ix[n]] === f).length + legacy(f); };
function log(f, msg) { G.log.unshift([f, msg, G.round]); if (G.log.length > 80) G.log.pop(); }

// ---------- governo: recursos e ações ----------
function income(f) {
  const F = Fa(f), T = owned(f).length, m = countB(f, 'mer');
  const diff = f !== G.player && !G.auto ? (G.diff === 2 ? 2 : G.diff === 0 ? -1 : 0) : 0;
  return {
    gold: Math.max(1, Math.ceil(T / 3) + m * (2 + (has(f, 'com') ? 1 : 0)) + diff),
    sci: 1 + 2 * countB(f, 'aca'),
    pre: capsHeld(f) + countB(f, 'tem') + 2 * countB(f, 'mar') + (has(f, 'ret') ? 1 : 0) + (F.stab >= 70 ? 1 : 0),
  };
}
const paOf = f => ECON.pa + (has(f, 'adm') ? 1 : 0);
const troopCost = f => has(f, 'con') ? 1 : ECON.troop;
const bCost = (f, k) => Math.max(1, STRUCT[k].cost - (has(f, 'eng') ? 1 : 0));
const techOk = (f, t) => !has(f, t.k) && (t.req || []).every(r => has(f, r));
const inflCost = (f, j) => Math.max(1, G.tr[j] + 1 - (has(f, 'ret') ? 1 : 0));
const canRecruitAt = (f, i) => G.own[i] === f && (i === Fa(f).capI || nb(i, 'qua'));
const canInfl = (f, j) => (G.own[j] === 'neu' || G.own[j] === 'reb') && !capOwner(j) && G.A[j].some(i => G.own[i] === f) && Fa(f).pre >= inflCost(f, j);
function canBuild(f, k, i) {
  const S = STRUCT[k], F = Fa(f);
  if (G.own[i] !== f || G.bld[i].length >= ECON.maxB || nb(i, k) || F.gold < bCost(f, k)) return false;
  if (S.sea && !coastal(i)) return false;
  if (S.air && !G.air) return false;
  if (S.wonder && (!has(f, S.req) || owned(f).some(j => nb(j, 'mar')))) return false;
  return true;
}
const spend = f => { const F = Fa(f); if (F.pa < 1) return false; F.pa--; return true; };
// Cada ação gasta 1 ponto de ação; devolve texto de erro ou '' quando deu certo.
function act(f, a, x, y) {
  const F = Fa(f);
  if (a !== 'camp' && F.pa < 1) return 'Sem pontos de ação neste turno.';
  if (a === 'camp') {
    if (F.camp) return 'A campanha já foi declarada.';
    if (!has(f, 'dou')) { if (!spend(f)) return 'Sem pontos de ação.'; }
    F.camp = true; log(f, `${fname(f)} declara campanha militar.`);
  } else if (a === 'rec') {
    if (F.recOn) return 'O recrutamento já está aberto neste turno.';
    if (F.gold < troopCost(f)) return 'Ouro insuficiente.';
    spend(f); F.recOn = true;
  } else if (a === 'bld') {
    if (!canBuild(f, x, y)) return 'Não dá para construir aqui.';
    spend(f); F.gold -= bCost(f, x); G.bld[y].push(x);
    log(f, `${fname(f)} constrói ${sName(x)} em ${tname(y)}.`);
  } else if (a === 'res') {
    const t = TK[x]; if (!techOk(f, t)) return 'Tecnologia indisponível.'; if (F.sci < t.cost) return 'Saber insuficiente.';
    spend(f); F.sci -= t.cost; F.tech.push(x); if (x === 'adm') F.pa++;
    log(f, `${fname(f)} desenvolve ${tName(x)}.`);
  } else if (a === 'fest') {
    if (F.gold < ECON.fest) return 'Ouro insuficiente.';
    spend(f); F.gold -= ECON.fest; F.stab = Math.min(100, F.stab + 15);
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
  F.gold -= troopCost(f); G.tr[i]++; return true;
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
function defBonus(j) { const d = G.own[j]; return (nb(j, 'for') ? 1 : 0) + (G.fort[j] > 0 || (G.era.wall && capOwner(j) && capOwner(j) === d) || (Fa(d).ab === 'tenaz' && G.tr[j] >= 5) ? 1 : 0); }
function diceFor(i, j) {
  const a = G.own[i], A = Fa(a);
  let ad = Math.min(3, G.tr[i] - 1); if (isSea(i, j) && A.ab !== 'almirante' && !nb(i, 'por') && !(A.real && has(a, 'nav'))) ad = Math.min(2, ad);
  return [ad, Math.min(3, G.tr[j])];
}
function roll(i, j) {
  const a = G.own[i], A = Fa(a), [ad, dd] = diceFor(i, j);
  const R = Array.from({ length: ad }, d6).sort((x, y) => y - x), D = Array.from({ length: dd }, d6).sort((x, y) => y - x);
  if (A.ofs) R[0] = Math.min(6, R[0] + 1);
  D[0] = Math.min(6, D[0] + defBonus(j));
  const ties = A.ab === 'tatico' || (A.real && A.camp && has(a, 'tat'));
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
  G.arr[j] = n; // tropas que entraram por conquista já se moveram neste turno
  if (real(a)) Fa(a).conq = true;
  if (real(d)) {
    const D = Fa(d); D.stab = Math.max(0, D.stab - 2);
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
  F.stab = Math.min(100, F.stab + 2 + (F.ab === 'carisma' ? 3 : 0) + 2 * countB(f, 'tem'));
  owned(f).forEach(i => { if (G.fort[i] > 0) G.fort[i]--; });
  F.conq = false; F.ofs = false; G.phase = 'ref'; G.sel = G.tgt = null; G.card = null; G.mode = null; G.seaUsed = new Set(); G.mv = []; G.arr = [];
  F.navLeft = navOf(f); F.planes = planesOf(f);
  const inc = income(f); F.gold += inc.gold; F.sci += inc.sci; F.pre += inc.pre;
  F.pa = paOf(f); F.camp = F.recOn = F.tradeOn = false;
  if (F.stab < 35) {
    let p = (35 - F.stab) / 35 * .5; if (F.ab === 'carisma') p /= 2;
    const cand = owned(f).filter(i => i !== F.capI);
    if (cand.length && rnd() < p) {
      const i = cand[Math.floor(rnd() * cand.length)];
      G.own[i] = 'reb'; G.tr[i] = Math.max(2, G.tr[i]); G.rl[i] = 'Revoltosos'; F.stab += 8;
      log(f, `Revolta em ${tname(i)}! A província se declara rebelde contra ${fname(f)}.`);
      if (f === G.player && !G.auto) toast(`Revolta em ${tname(i)}! Sua estabilidade está baixa.`);
      if (!owned(f).length) { F.alive = false; if (f === G.player && !G.auto) return endGame(null, 'elim'); }
    }
  }
  F.reinf = reinfOf(f).r;
  if (objDone(f)) endGame(f, 'obj');
  else if (legacy(f) >= ECON.legWin && G.own[F.capI] === f) endGame(f, 'leg');
}
function finishTurn(f) {
  const F = Fa(f);
  if ((F.conq || F.ab === 'espiao') && F.cards.length < 5) F.cards.push(drawCard());
  G.sel = G.tgt = null; G.card = null;
}
async function advance() {
  G.cur++;
  if (G.cur >= G.order.length) {
    G.cur = 0; await rebelsAct(); if (G.over) return;
    G.round++;
    if (G.round > G.sc.turns) return endGame(null, 'turns');
    for (const e of G.sc.ev.filter(e => e.t === G.round)) { applyEvent(e); render(); if (G.over) return; const g = G; if (!G.auto) await modal(`<p class="kick">${esc(G.sc.n)} · rodada ${G.round}</p><h2>${esc(e.n)}</h2><p>${esc(e.d)}</p>`, [['Continuar']]); live(g); }
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
  for (const f of alive) if (!alive.some(o => !allied(f, o)) && !G.order.some(o => Fa(o).late && !Fa(o).entered && !allied(f, o))) return endGame(f, 'dom');
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
  const sub = why === 'elim' ? 'Seus últimos territórios caíram.' : why === 'obj' ? `${fname(w)} cumpriu o objetivo: ${objText(Fa(w))}` : why === 'leg' ? `${fname(w)} chegou a ${ECON.legWin} pontos de legado: ciência, obras e cultura.` : why === 'dom' ? `${fname(w)} e aliados dominaram o mapa.` : `Fim das ${G.sc.turns} rodadas. Vence quem mais cresceu: territórios ganhos desde o início, +2 por capital e +2 por alvo do objetivo controlado.`;
  modal(`<p class="kick">${esc(G.sc.n)}</p><h2>${t}</h2><p>${esc(sub)}</p><table class="rank"><tr><th>Facção</th><th>Terr.</th><th>Cap.</th><th>Pontos</th></tr>${rows}</table>`, [['Jogar de novo', () => startScenario(G.sc.id, G.player, G.diff)], ['Escolher cenário', showSetup]]);
}

// ---------- salvar ----------
function save() {
  try {
    const F = {}; G.order.forEach(f => { const X = Fa(f); F[f] = { stab: X.stab, cards: X.cards, alive: X.alive, entered: X.entered, team: X.team, passive: X.passive, L: X.L, ab: X.ab, airX: X.airX, gold: X.gold, sci: X.sci, pre: X.pre, tech: X.tech }; });
    localStorage.setItem(SAVE, JSON.stringify({ sc: G.sc.id, player: G.player, diff: G.diff, own: G.own, tr: G.tr, fort: G.fort, bld: G.bld, rl: G.rl, F, cur: G.cur, round: G.round, truce: [...G.truce], cool: G.cool, log: G.log.slice(0, 30), trades: G.trades, at: Date.now() }));
  } catch (e) { }
}
function loadSave() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch (e) { return null; } }
function resume() {
  const s = loadSave(); if (!s) return;
  const sc = SCEN.find(x => x.id === s.sc); if (!sc) return;
  startScenario(sc.id, s.player, s.diff, true);
  Object.assign(G, { own: s.own, tr: s.tr, fort: s.fort, bld: s.bld, rl: s.rl, cur: s.cur, round: s.round, truce: new Set(s.truce), cool: s.cool, log: s.log, trades: s.trades });
  for (const [f, v] of Object.entries(s.F)) Object.assign(G.F[f], v);
  render(); loop();
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
    if (n) o.push([4 + Math.min(3, n * .5) + (G.round > 2 ? .5 : 0), 'camp']);
  }
  for (const t of TECH) if (techOk(f, t) && F.sci >= t.cost) o.push([(TECH_W[t.k] || 3) - (t.k === 'nav' && !T.some(coastal) ? 2 : 0), 'res', t.k]);
  const byThreat = T.slice().sort((a, b) => threat(f, a) - threat(f, b)); // interior primeiro
  const place = (k, list) => list.find(i => canBuild(f, k, i));
  const opt = (s, k, list) => { if (s <= 0) return; const i = place(k, list); if (i != null) o.push([s, 'bld', k, i]); };
  opt(4.6 - .7 * countB(f, 'mer'), 'mer', byThreat);
  opt(4.2 - 1.3 * countB(f, 'aca'), 'aca', byThreat);
  opt(countB(f, 'qua') ? 1.2 : 3, 'qua', hot != null ? [hot, ...border] : byThreat);
  if (threat(f, F.capI) >= G.tr[F.capI] * .7) opt(3.6, 'for', [F.capI]);
  else if (hot != null && threat(f, hot) > G.tr[hot]) opt(2.2, 'for', [hot]);
  opt((F.stab < 55 ? 3.6 : 1.6) - .6 * countB(f, 'tem'), 'tem', byThreat);
  if (border.some(i => G.A[i].some(j => isSea(i, j) && hostile(f, j)))) opt(countB(f, 'por') ? .8 : 2.6, 'por', border.filter(coastal));
  if (G.air) opt(3.4 - .9 * countB(f, 'aer'), 'aer', byThreat);
  opt(7, 'mar', byThreat);
  if (!F.recOn && F.gold >= 2 * troopCost(f)) o.push([2.4 + Math.min(3, F.gold / troopCost(f) * .2) + (hot != null && threat(f, hot) > G.tr[hot] ? 1 : 0), 'rec']);
  if (F.stab < 35 && F.gold >= ECON.fest) o.push([5, 'fest']);
  const inf = T.flatMap(i => G.A[i]).filter(j => canInfl(f, j)).sort((a, b) => tval(f, b) / inflCost(f, b) - tval(f, a) / inflCost(f, a))[0];
  if (inf != null) o.push([3.4 + tval(f, inf) * .4, 'infl', inf]);
  if (F.pre >= ECON.agit + 2) { const j = border.flatMap(i => G.A[i]).find(j => real(G.own[j]) && hostile(f, j) && Fa(G.own[j]).stab < 45); if (j != null) o.push([1.8, 'agit', j]); }
  if (F.stab > 65) o.push([1.3, 'tax']);
  const next = TECH.filter(t => techOk(f, t) && F.sci < t.cost).sort((a, b) => a.cost - b.cost)[0];
  if (!F.tradeOn && next && F.gold >= 8 && (next.cost - F.sci) * 2 <= F.gold - 3) o.push([2.6, 'trade']);
  return o;
}
function aiGovern(f) {
  const F = Fa(f);
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
      const next = TECH.filter(t => techOk(f, t) && F.sci < t.cost).sort((p, q) => p.cost - q.cost)[0];
      while (next && F.sci < next.cost && tradeRes(f, 'gold', 'sci'));
    }
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
  h += '<g id="hl"></g><g id="badges">' + m.terr.map((t, i) => `<g class="b" data-i="${i}"><circle class="cap" r="14" hidden/><circle class="bc" r="10"/><text class="bn" y="4">0</text><text class="ic" x="13" y="-8"></text><text class="nm" y="23">${esc(t.n)}</text></g>`).join('') + '</g>';
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
  for (let i = 0; i < G.N; i++) {
    const o = G.own[i], F = Fa(o);
    P[i].setAttribute('fill', o === 'reb' ? 'url(#hatch)' : F.c);
    P[i].classList.toggle('off', o === 'off');
    const g = B[i]; g.toggleAttribute('hidden', o === 'off');
    g.querySelector('.bc').setAttribute('fill', F.c); g.querySelector('.bn').textContent = G.tr[i];
    g.querySelector('.cap').toggleAttribute('hidden', !capOwner(i));
    g.querySelector('.ic').textContent = (G.relics.includes(i) ? 'ᚱ' : '') + G.bld[i].map(k => STRUCT[k].ic).join('') + (G.fort[i] > 0 ? '⛨' : '');
    g.classList.toggle('lightbg', light(F.c));
  }
  const hl = [], me = G.player, my = G.turnF === me;
  const p = (j, c) => hl.push(`<path d="${G.m.terr[j].d}" class="${c}"/>`);
  if (G.sel != null) p(G.sel, 'hs');
  const md = my && modeTest(G.mode);
  if (md) for (let j = 0; j < G.N; j++) if (md(j)) p(j, G.mode === 'air' || G.mode === 'agit' ? 'ha' : 'hm');
  else if (my && G.sel != null && G.tgt == null) {
    if (G.phase === 'atk') G.A[G.sel].filter(j => canAtk(me, G.sel, j)).forEach(j => p(j, 'ht'));
    if (G.phase === 'mov' && (G.mv[G.sel] || 0) > 0) G.A[G.sel].filter(j => G.own[j] === me && seaOk(me, G.sel, j)).forEach(j => p(j, 'hm'));
  }
  if (G.tgt != null) p(G.tgt, 'hx');
  $('#hl').innerHTML = hl.join('');
}
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
    G.mode = null; G.sel = i; $('#toast').hidden = true; return render();
  }
  if (!myTurn) { G.sel = i; return render(); }
  if (G.phase === 'ref') {
    G.sel = i;
    if (G.own[i] === me && Fa(me).reinf > 0) { G.tr[i]++; Fa(me).reinf--; }
  } else if (G.phase === 'atk') {
    if (G.tgt != null) return;
    if (G.sel != null && canAtk(me, G.sel, i)) { G.tgt = i; showBattlePanel(); }
    else if (!Fa(me).camp && G.sel != null && G.own[G.sel] === me && G.A[G.sel].includes(i) && hostile(me, i)) toast('Para atacar, declare uma Campanha (1 ação).');
    else if (G.sel != null && G.own[G.sel] === me && G.A[G.sel].includes(i) && hostile(me, i) && !seaOk(me, G.sel, i)) toast('Sem frota disponível para atravessar o mar neste turno.');
    else G.sel = i;
  } else if (G.phase === 'mov') {
    if (G.tgt != null) return;
    if (G.sel != null && G.own[G.sel] === me && (G.mv[G.sel] || 0) > 0 && G.own[i] === me && G.A[G.sel].includes(i)) {
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
  if (m.startsWith('bld:')) { const k = m.slice(4); return j => canBuild(me, k, j); }
  return null;
}
// botões de ação do jogador
function playerAct(a, k) {
  const me = G.player, F = Fa(me);
  if (G.turnF !== me || G.busy || G.phase !== 'atk') return;
  G.card = null;
  if (G.mode && (G.mode === a || G.mode === 'bld:' + k)) { G.mode = null; return render(); }
  const hint = { infl: 'Clique num território neutro ou rebelde vizinho (custa tropas dele + 1 de prestígio).', agit: 'Clique num território da facção rival.' };
  if (a === 'bld') {
    if (F.pa < 1) return toast('Sem pontos de ação.');
    if (F.gold < bCost(me, k)) return toast('Ouro insuficiente.');
    if (!owned(me).some(i => canBuild(me, k, i))) return toast('Nenhum território seu aceita esta construção agora.');
    G.mode = 'bld:' + k; toast(`Clique num território seu para construir ${sName(k)}.`); return render();
  }
  if (hint[a]) { if (F.pa < 1) return toast('Sem pontos de ação.'); G.mode = a; toast(hint[a]); return render(); }
  if (a === 'rec' && F.recOn) { G.mode = 'rec'; return render(); }
  if (a === 'trade' && F.tradeOn) return tradeModal();
  const err = act(me, a);
  if (err) return toast(err);
  if (a === 'rec') { G.mode = 'rec'; toast(`Clique na capital ou num ${sName('qua')} para comprar tropas (${troopCost(me)} ouro cada).`); }
  if (a === 'trade') tradeModal();
  render();
}
function techModal() {
  const me = G.player, F = Fa(me);
  const row = t => {
    const own = has(me, t.k), ok = techOk(me, t), can = ok && F.sci >= t.cost && F.pa > 0 && G.turnF === me && G.phase === 'atk';
    const req = (t.req || []).map(tName).join(' e ');
    return `<div class="tech ${own ? 'own' : ok ? '' : 'lock'}"><div><b>${esc(tName(t.k))}</b> <span class="hint">nível ${t.t} · ${t.cost} 🔬${req ? ' · exige ' + esc(req) : ''}</span><p>${esc(t.fx)}</p></div>${own ? '<span class="ok">✓</span>' : `<button class="mini ${can ? 'pri' : ''}" data-a="tech" data-k="${t.k}" ${can ? '' : 'disabled'}>Pesquisar</button>`}</div>`;
  };
  modal(`<h2>Tecnologias · ${esc(G.era.n)}</h2><p class="hint">Saber: ${F.sci} 🔬 (+${income(me).sci} por turno) · ${F.pa} ação(ões). Cada tecnologia vale 2 de legado.</p><div class="techs">${TECH.map(row).join('')}</div>`, [['Fechar']]);
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
  const notes = [isSea(i, j) ? 'desembarque pelo mar' : '', defBonus(j) ? 'defesa +1 no maior dado' : '', me.ofs ? 'ofensiva +1' : ''].filter(Boolean).join(' · ');
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
  $('#round').textContent = `Rodada ${Math.min(G.round, G.sc.turns)}/${G.sc.turns}`;
  $('#turn').innerHTML = CF ? `<i class="dot" style="background:${CF.c}"></i>${my ? 'Seu turno' : esc(CF.n)} · ${PHASE[G.phase]}` : '';
  $('#me').innerHTML = `<div class="fh" style="--fc:${F.c}"><div><h3>${esc(F.n)}</h3><p>${esc(F.L)} · <span title="${esc(ABIL[F.ab][1])}">${ABIL[F.ab][0]}</span></p></div></div>
    <p class="ab">${esc(ABIL[F.ab][1])}</p>
    <div class="stab">Estabilidade ${bar(F.stab)}</div>
    <p class="hint">${F.stab < 15 ? 'Crise: reforços pela metade e risco alto de revolta.' : F.stab < 35 ? 'Instável: províncias podem se rebelar no início do turno.' : 'Povo sob controle.'}</p>
    <div class="obj"><b>Objetivo</b> ${esc(objText(F))}<ul>${objLines(me).map(([t, ok]) => `<li class="${ok ? 'ok' : ''}">${ok ? '✓' : '○'} ${esc(t)}</li>`).join('')}</ul></div>`;
  const inc = income(me);
  $('#me').innerHTML += `<div class="res"><span title="Ouro: compra tropas e construções">💰 <b>${F.gold}</b> <i>+${inc.gold}</i></span><span title="Saber: compra tecnologias">🔬 <b>${F.sci}</b> <i>+${inc.sci}</i></span><span title="Prestígio: influência política">⭐ <b>${F.pre}</b> <i>+${inc.pre}</i></span><span title="Legado: 2 por tecnologia, 1 por construção, 5 pela Maravilha. ${ECON.legWin} vence.">🏛 <b>${legacy(me)}</b>/${ECON.legWin}</span></div>`;
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
    const blds = Object.keys(STRUCT).filter(k => !STRUCT[k].air || G.air).map(k => { const S = STRUCT[k], c = bCost(me, k); return Bt('bld', k, `${S.ic} ${esc(sName(k))} <small>${c}💰</small>`, S.fx, noPA || F.gold < c || (S.wonder && !has(me, S.req)), G.mode === 'bld:' + k); }).join('');
    ph = `<h4>Ações <span class="pa" title="Pontos de ação">${'●'.repeat(F.pa)}${'○'.repeat(Math.max(0, paOf(me) - F.pa))}</span></h4>
      <p class="hint">Cada ação gasta 1 ponto. Guerra, obras, ciência e política disputam o mesmo turno.</p>
      <div class="grp"><b>⚔ Militar</b><div class="row">
        ${Bt('act', 'camp', F.camp ? 'Campanha declarada' : 'Declarar campanha', 'Libera ataques e aviação neste turno.' + (has(me, 'dou') ? ' Grátis pela sua doutrina.' : ''), F.camp || (noPA && !has(me, 'dou')), F.camp)}
        ${Bt('act', 'rec', F.recOn ? `Comprar tropas <small>${tc}💰</small>` : `Recrutar <small>${tc}💰/tropa</small>`, `Abre o recrutamento: compre tropas na capital ou num ${sName('qua')}.`, !F.recOn && (noPA || F.gold < tc), G.mode === 'rec')}
        ${F.camp && G.air && F.planes ? Bt('air', '', `✈ ${esc(G.air.n)} (${F.planes})`, 'Bombardeie um alvo ao alcance. Não gasta ação.', false, G.mode === 'air') : ''}</div></div>
      <div class="grp"><b>🏛 Construir</b> <span class="hint">até ${ECON.maxB} por território; mudam de dono na conquista</span><div class="row">${blds}</div></div>
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
      <p class="hint">${esc(G.m.regions[t.r])}${co ? ' · capital de ' + esc(fname(co)) : ''}${G.relics.includes(i) ? ' · Runa Antiga' : ''}${G.bld[i].length ? ' · ' + G.bld[i].map(k => esc(sName(k))).join(', ') : ''}${G.fort[i] > 0 ? ' · fortificado' : ''}${G.phase === 'mov' && my && o === me ? ` · pode mover ${G.mv[i] || 0}` : ''}</p>`;
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
  <p><b>Três caminhos para vencer.</b> Cumpra o objetivo militar da sua facção, chegue a ${ECON.legWin} pontos de legado (ciência, obras e cultura) ou elimine os rivais. Nos dois primeiros casos, mantenha sua capital até o início do seu turno seguinte. Se as rodadas acabarem, vence quem mais cresceu: territórios ganhos, +2 por capital, +2 por alvo do objetivo e o legado.</p>
  <p><b>Recursos.</b> No início do turno você recebe 💰 ouro (1 a cada 3 territórios, mais mercados), 🔬 saber (1, mais academias) e ⭐ prestígio (capitais, templos, maravilha). Eles se acumulam de um turno para o outro.</p>
  <p><b>1. Reforços.</b> Tropas grátis: 1 a cada 3 territórios (mínimo 3), mais regiões completas, capitais e quartéis.</p>
  <p><b>2. Ações.</b> Você tem 3 pontos de ação por turno (4 com a primeira tecnologia de administração). Cada ação gasta 1 ponto e pode ser repetida:</p>
  <ul>
  <li><b>⚔ Campanha</b> libera os ataques e a aviação no turno. Sem campanha, não há guerra.</li>
  <li><b>⚔ Recrutar</b> abre a compra de tropas por ouro, na capital ou num quartel.</li>
  <li><b>🏛 Construir</b> ergue uma construção num território seu (até 2 por território). Mercado, academia, quartel, fortificação, templo, porto, aeródromo e a sua Maravilha. Quem conquista o território fica com elas.</li>
  <li><b>🔬 Pesquisar</b> compra uma tecnologia com saber. A árvore tem 3 níveis, e as do topo exigem as de baixo.</li>
  <li><b>🤝 Festividades</b> (+15 de estabilidade), <b>Influenciar</b> (anexa um vizinho neutro ou rebelde com prestígio, sem lutar) e <b>Agitadores</b> (rival perde estabilidade).</li>
  <li><b>💰 Impostos</b> (ouro agora, estabilidade cai) e <b>Comércio</b> (troque recursos 2 por 1).</li>
  </ul>
  <p><b>Combate.</b> Como no War: ataque e defesa rolam até 3 dados, compara-se do maior para o menor e o empate fica com a defesa. Ao vencer, você move até o número de dados da última rolagem. Fortificações e muralhas somam +1 ao maior dado da defesa.</p>
  <p><b>Mar e ar.</b> Atravessar uma linha tracejada gasta uma travessia da frota; o desembarque usa no máximo 2 dados, ou 3 saindo de um porto. Nas eras com aviação, cada capital e aeródromo dá uma unidade aérea que bombardeia durante a campanha: o antiaéreo pode derrubá-la, e ela não conquista.</p>
  <p><b>3. Remanejamento.</b> Cada tropa sobrando anda uma vez para um território seu vizinho. Pode dividir entre vizinhos, e 1 tropa fica sempre.</p>
  <p><b>Cartas de benefício.</b> Você ganha uma por turno em que conquistar. Usar uma carta não gasta ação.</p>
  <p><b>Estabilidade.</b> Perder territórios, romper tréguas e cobrar impostos derrubam a estabilidade. Abaixo de 35, províncias podem se rebelar; abaixo de 15, os reforços caem pela metade.</p>`, [['Entendi']]);
}

// ---------- tela inicial ----------
let pickSc = null, pickF = null, pickD = 1;
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
  $('#resume').innerHTML = ssc ? `<button class="pri" data-a="resume">Continuar partida: ${esc(ssc.n)} · rodada ${s.round}</button>` : '';
  $('#tabs').innerHTML = GROUPS.map(t => `<button class="${t === tab ? 'on' : ''}" data-a="tab" data-t="${t}">${t}</button>`).join('');
  $('#scs').innerHTML = SCEN.slice().sort((a, b) => a.yr - b.yr).filter(s => tab === 'Todos' || ERA[s.tech].g === tab).map(s => `<button class="sc ${pickSc === s.id ? 'on' : ''}" data-a="sc" data-s="${s.id}">${thumb(s)}<div><span class="era ${s.tech === 'fan' ? 'fan' : ''}">${ERA[s.tech].n} · ${esc(s.y)}</span><h3>${esc(s.n)}</h3><p>${esc(s.d)}</p><small>${s.f.length} facções · ${MAPS[s.map].terr.length} territórios · ${s.turns} rodadas${airOf(s) ? ' · ' + airOf(s).n : ''}</small></div></button>`).join('');
  const sc = SCEN.find(s => s.id === pickSc);
  $('#pick').hidden = !sc;
  if (sc) {
    if (!sc.f.some(f => f.id === pickF && !f.late)) pickF = sc.f[0].id;
    $('#pickT').textContent = sc.n;
    $('#pickTech').innerHTML = `<b>${esc(ERA[sc.tech].n)}:</b> ${ERA[sc.tech].tech.map(esc).join(' ')}`;
    $('#facsPick').innerHTML = sc.f.filter(f => !f.late).map(f => { const F = { ...f, obj: objOf(f, MAPS[sc.map], (sc.relics || []).map(n => idxOf(MAPS[sc.map])[n])) }; return `<button class="fp ${pickF === f.id ? 'on' : ''}" data-a="fp" data-f="${f.id}" style="--fc:${f.c}"><b>${esc(f.n)}</b><span>${esc(f.L)} · ${ABIL[f.ab][0]}</span><em>${esc(ABIL[f.ab][1])}</em><small>${esc(objText(F))}</small><small>${expand(MAPS[sc.map], f.t).length} territórios · estabilidade ${f.st} · frota ${f.nav || 1}${f.team ? ' · aliança' : ''}</small></button>`; }).join('');
    $('#diff').innerHTML = ['Fácil', 'Normal', 'Difícil'].map((t, k) => `<button class="${pickD === k ? 'on' : ''}" data-a="diff" data-d="${k}">${t}</button>`).join('');
  }
}
function startScenario(id, fid, diff, quiet) {
  const sc = SCEN.find(s => s.id === id);
  G = newGame(sc, fid, diff);
  $('#setup').hidden = true; $('#game').hidden = false; bt().hidden = true; $('#toast').hidden = true;
  $('#scT').textContent = `${sc.n} · ${sc.y}`;
  $('#credit').textContent = MAPS[sc.map].credit;
  buildMap(); render();
  if (quiet) return;
  const F = Fa(fid);
  modal(`<p class="kick">${esc(ERA[sc.tech].n)} · ${esc(sc.y)}</p><h2>${esc(sc.n)}</h2><p>${esc(sc.d)}</p><p>Você comanda <b style="color:${F.c}">${esc(F.n)}</b>, liderado por ${esc(F.L)} (${ABIL[F.ab][0]}: ${esc(ABIL[F.ab][1])}).</p><p><b>Objetivo:</b> ${esc(objText(F))}</p><p class="hint">Cada turno: reforços, depois ${ECON.pa} ações para dividir entre guerra, obras, ciência, sociedade e economia, e por fim o remanejamento. Também dá para vencer por legado: ${ECON.legWin} pontos em tecnologias e construções.</p>`, [['Começar', () => loop()], ['Como jogar', () => { rules(); loop(); }]]);
}

// ---------- cliques ----------
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const a = el.dataset.a;
  if (a === 'tab') { $('#setup').dataset.tab = el.dataset.t; showSetup(); }
  else if (a === 'sc') { pickSc = el.dataset.s; showSetup(); $('#pick').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else if (a === 'fp') { pickF = el.dataset.f; showSetup(); }
  else if (a === 'diff') { pickD = +el.dataset.d; showSetup(); }
  else if (a === 'start') startScenario(pickSc, pickF, pickD);
  else if (a === 'resume') resume();
  else if (a === 'rules') rules();
  else if (a === 'menu') { if (G && !G.over) modal('<h2>Sair da partida?</h2><p>A partida fica salva do início do seu último turno.</p>', [['Sair', showSetup], ['Continuar jogando']]); else showSetup(); }
  else if (!G) return;
  else if (a === 'zin') zoomBtn(1 / 1.4); else if (a === 'zout') zoomBtn(1.4); else if (a === 'zfit') { vb = { x: 0, y: 0, w: G.m.w, h: G.m.h }; setVB(); }
  else if (a === 'toAtk') toPhase('atk'); else if (a === 'toMov') toPhase('mov'); else if (a === 'end') playerEnd();
  else if (a === 'all') addAll();
  else if (a === 'act') playerAct(el.dataset.k);
  else if (a === 'bld') playerAct('bld', el.dataset.k);
  else if (a === 'techs') techModal();
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
document.addEventListener('change', e => { if (e.target.id === 'fast' && G) G.fast = e.target.checked; });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && G && !G.busy && !G.pend) { hideBattle(); G.sel = null; G.card = null; G.mode = null; render(); } });

initPan(); showSetup();
window.__sob = { get G() { return G; }, startScenario, loop, SCEN, resume, render };
