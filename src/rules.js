// Habilidades, tecnologia por era e cartas (v3).
const ABIL = {
  tatico: ['Gênio Tático', 'Vence os empates quando ataca.'],
  tenaz: ['Defesa Tenaz', 'Territórios com 5 ou mais tropas somam +1 ao maior dado de defesa.'],
  recrutador: ['Recrutador', '+2 tropas de reforço por turno.'],
  carisma: ['Carismático', '+3 de estabilidade por turno e metade da chance de revoltas.'],
  almirante: ['Senhor dos Mares', '+1 travessia marítima por turno e ataque pelo mar com 3 dados.'],
  espiao: ['Mestre Espião', 'Recebe uma carta todo turno, mesmo sem conquistar.'],
};
// Tecnologia: muralhas nas capitais, aviação (alcance em territórios, acerto e antiaéreo no d6), grupo do filtro.
const ERA = {
  ant: { n: 'Antiguidade', g: 'Antiguidade', cards: 'ant', wall: 1, tech: ['Galés: atravessar o mar exige frota, e o desembarque ataca com no máximo 2 dados.', 'Muralhas: capitais somam +1 ao maior dado de defesa.', 'Sem pólvora nem aviação. Catapultas atacam à distância por carta.'] },
  pre: { n: 'Mundo pré-colombiano', g: 'Antiguidade', cards: 'pre', wall: 1, tech: ['Canoas: atravessar o mar exige frota, com no máximo 2 dados no desembarque.', 'Cidades fortificadas: capitais +1 no maior dado de defesa.', 'Sem cavalos, ferro ou pólvora: guerra de infantaria e flechas.'] },
  med: { n: 'Idade Média', g: 'Idade Média', cards: 'med', wall: 1, tech: ['Castelos: capitais +1 no maior dado de defesa.', 'Navios: atravessar o mar exige frota, com no máximo 2 dados no desembarque.', 'Trabucos atacam à distância por carta.'] },
  jap: { n: 'Japão feudal', g: 'Idade Média', cards: 'jap', wall: 1, tech: ['Castelos de montanha: capitais +1 no maior dado de defesa.', 'Arcabuzes chegam em 1543: a carta de arcabuzes ataca à distância.', 'Navios: atravessar o mar exige frota, com no máximo 2 dados no desembarque.'] },
  pol: { n: 'Era da Pólvora', g: 'Moderna', cards: 'xix', wall: 0, tech: ['Artilharia de campanha ataca à distância por carta.', 'Marinha: atravessar o mar exige frota, com no máximo 2 dados no desembarque.', 'Sede do governo: capitais somam +1 ao maior dado de defesa.'] },
  w1: { n: 'Grande Guerra', g: 'Moderna', cards: 'xx', wall: 0, air: { n: 'Biplanos', r: 2, hit: 5, aa: 6, per: 1 }, tech: ['Aviação nascente: 1 biplano por capital, alcance 2, acerta com 5 ou 6.', 'Trincheiras: a carta de fortificação vale ouro.', 'Couraçados: atravessar o mar exige frota.'] },
  w2: { n: 'Segunda Guerra', g: 'Moderna', cards: 'xx', wall: 0, air: { n: 'Esquadrilhas', r: 3, hit: 4, aa: 6, per: 1 }, tech: ['Aviação: 1 esquadrilha por capital, alcance 3, acerta com 4 ou mais.', 'Antiaéreo derruba com 6.', 'Desembarques anfíbios exigem frota.'] },
  gf: { n: 'Guerra Fria', g: 'Moderna', cards: 'xx', wall: 0, air: { n: 'Jatos', r: 9, hit: 4, aa: 5, per: 1 }, tech: ['Jatos: alcance global, acertam com 4 ou mais.', 'Mísseis antiaéreos derrubam com 5 ou 6.', 'Armas nucleares ficam de fora: a dissuasão é o próprio jogo.'] },
  fan: { n: 'Fantasia', g: 'Fantasia', cards: 'fan', wall: 1, tech: ['Fortalezas mágicas: capitais +1 no maior dado de defesa.', 'Frotas: atravessar o mar exige navios.', 'Criaturas voadoras atacam à distância, como aviões.'] },
};
const CARDS = {
  efx: [
    '+4 tropas para posicionar (só em Reforços).',
    'Território seu soma +1 ao maior dado de defesa por 2 turnos.',
    'Neste turno, seu maior dado de ataque ganha +1.',
    '+20 de estabilidade.',
    'Território inimigo perde metade das tropas.',
    'Facção inimiga perde 15 de estabilidade.',
    'Mova tropas entre dois territórios seus quaisquer (deixa 1 na origem).',
    'Ataque à distância contra um vizinho inimigo: 3 dados, cada 4+ elimina 1 tropa.',
    'Roube uma carta aleatória da facção dona do território clicado.',
    '+2 travessias marítimas neste turno.',
    'Trégua imediata com a facção dona do território clicado.',
    'Território inimigo vizinho com até 3 tropas (não capital) passa para você.',
  ],
  airFx: '+2 aviões neste turno.',
  ant: ['Levas de Recrutas', 'Muralhas e Paliçadas', 'Carga de Elefantes', 'Pão e Circo', 'Envenenamento', 'Revolta de Escravos', 'Estradas Romanas', 'Catapultas', 'Espiões do Senado', 'Galés de Guerra', 'Embaixada', 'Traição'],
  pre: ['Guerreiros Jaguar', 'Fortaleza de Pedra', 'Guerra Florida', 'Festival aos Deuses', 'Emboscada', 'Tributários Rebeldes', 'Caminhos de Pedra', 'Chuva de Flechas', 'Mercadores Espiões', 'Canoas de Guerra', 'Aliança de Casamento', 'Traição'],
  med: ['Convocar Vassalos', 'Castelo Fortificado', 'Carga de Cavalaria', 'Bênção do Clero', 'Incendiários', 'Revolta Camponesa', 'Marcha Forçada', 'Trabucos', 'Espiões', 'Frota', 'Casamento Dinástico', 'Senhor Traidor'],
  jap: ['Ashigaru', 'Castelo Yamajiro', 'Carga Samurai', 'Festival no Templo', 'Ninjas', 'Ikkō-ikki', 'Estrada Tōkaidō', 'Arcabuzes', 'Shinobi', 'Piratas Wakō', 'Casamento Político', 'Traição'],
  xix: ['Convocação', 'Fortificações', 'Marcha Forçada', 'Te Deum e Festejos', 'Sabotadores', 'Agitadores', 'Ferrovia', 'Artilharia', 'Gabinete Negro', 'Esquadra', 'Tratado', 'Golpe de Estado'],
  xx: ['Mobilização Geral', 'Trincheiras', 'Ofensiva Relâmpago', 'Propaganda', 'Sabotagem', 'Insurgência', 'Ponte Aérea', 'Bombardeio Estratégico', 'Inteligência', 'Desembarque Anfíbio', 'Armistício', 'Golpe de Estado'],
  fan: ['Convocar Vassalos', 'Muralhas Encantadas', 'Fúria de Batalha', 'Bardos e Festins', 'Assassinos', 'Intriga na Corte', 'Portal Arcano', 'Bola de Fogo', 'Corvos Mensageiros', 'Frota Mercenária', 'Pacto de Sangue', 'Traição'],
  sym: ['▲', '■', '●', '★'],
};
// ---------- v4: economia de ações ----------
// Nomes por época: ant (Antiguidade e pré-colombiano), med (Idade Média e Japão), pol (pólvora), mod (séc. XX), fan.
const NG = { ant: 'ant', pre: 'ant', med: 'med', jap: 'med', xix: 'pol', xx: 'mod', fan: 'fan' };
const RES = { gold: ['💰', 'Ouro'], sci: ['🔬', 'Saber'], pre: ['⭐', 'Prestígio'] };
// freeT/perT: tropas acima de freeT por território custam 1 ouro a cada perT (A-44); occ: turnos de ocupação (D-05);
// sup: distância máxima de uma base de suprimento sem perder dado (D-07); cq: conquistas por turno.
const ECON = { pa: 3, troop: 2, fest: 2, agit: 3, rush: 2, rushW: 3, freeT: 3, perT: 3, occ: 3, sup: 3, cq: 1, route: 4, blitz: 3, blitzS: 4 }; // v43: a partir da 4ª conquista no turno, cada uma custa blitzS × excesso de estabilidade e 1 tropa
// v5, parte 1 (D-01, D-03, D-04): duração da partida. r = rodadas, k = fator de custo de obras e tecnologias,
// hold = turnos seguidos com o objetivo cumprido, leg = legado para vencer. Nenhuma vitória, exceto dominação, antes de 1/3 das rodadas.
const LEN = {
  c: { n: 'Curta', r: 60, k: 1, hold: 3, leg: 150 },
  m: { n: 'Média', r: 120, k: 2, hold: 3, leg: 220 },
  l: { n: 'Longa', r: 250, k: 4, hold: 4, leg: 300 },
};
// Construções (v5, parte 2): pc = custo em produção (× k da duração), up = manutenção em ouro por turno (P-11).
// Ficam no território e mudam de dono na conquista. Sem limite por território: uma de cada tipo.
const STRUCT = {
  ofi: { pc: 6, up: 0, y: { prod: 2 }, ic: '⚒', fx: '+2 de produção neste território: as obras daqui andam mais rápido.', n: { ant: 'Oficina de Artesãos', med: 'Ferraria', pol: 'Manufatura', mod: 'Fábrica', fan: 'Forja Rúnica' } },
  mer: { pc: 8, up: 0, z: 'com', y: { gold: 2 }, ic: '💰', fx: 'Zona comercial: +2 ouro por turno.', n: { ant: 'Fórum', med: 'Feira', pol: 'Banco', mod: 'Centro Financeiro', fan: 'Guilda' } },
  aca: { pc: 10, up: 1, z: 'sci', lv: 2, y: { sci: 2 }, ic: '🔬', fx: 'Zona científica: +2 saber por turno. Exige vila ou maior.', n: { ant: 'Biblioteca', med: 'Scriptorium', pol: 'Biblioteca Pública', mod: 'Laboratório', fan: 'Torre Arcana' } },
  qua: { pc: 8, up: 1, z: 'mil', y: { prod: 1 }, ic: '⚔', fx: '+1 tropa grátis por turno. Permite recrutar aqui, além da capital, e serve de base de suprimento.', n: { ant: 'Acampamento', med: 'Quartel', pol: 'Quartel', mod: 'Base Militar', fan: 'Caserna' } },
  for: { pc: 10, up: 1, ic: '⛨', fx: '+1 no maior dado de defesa deste território.', n: { ant: 'Muralha', med: 'Castelo', pol: 'Fortaleza', mod: 'Bunker', fan: 'Bastião' } },
  tem: { pc: 8, up: 1, z: 'rel', ic: '⭐', fx: '+1 prestígio e +2 estabilidade por turno.', n: { ant: 'Templo', med: 'Igreja', pol: 'Igreja Matriz', mod: 'Rádio', fan: 'Santuário' } },
  por: { pc: 8, up: 1, z: 'por', y: { gold: 1 }, ic: '⚓', fx: '+1 travessia marítima por turno, ataques pelo mar daqui usam 3 dados, e serve de base de suprimento. Só no litoral.', sea: 1, n: { ant: 'Porto', med: 'Porto', pol: 'Estaleiro', mod: 'Base Naval', fan: 'Cais' } },
  aer: { pc: 10, up: 2, ic: '✈', fx: '+1 unidade aérea por turno. Só em eras com aviação ou criaturas voadoras.', air: 1, n: { ant: 'Aeródromo', med: 'Aeródromo', pol: 'Aeródromo', mod: 'Aeródromo', fan: 'Ninho' } },
  mar: { pc: 40, up: 0, ic: '🏛', fx: '+5 de legado e +2 prestígio por turno. Uma por facção; exige a tecnologia das grandes obras.', wonder: 1, req: 'arq', n: { ant: 'Coliseu', med: 'Grande Catedral', pol: 'Exposição Universal', mod: 'Programa Espacial', fan: 'Torre do Mundo' } },
  // Zonas de recurso (parte 3: Z-02 a Z-06). ter = terrenos aceitos; dz = também aceita se houver jazida desta zona; rio = aceita com rio.
  agr: { pc: 6, up: 0, z: 'agr', ter: 'pch', rio: 1, y: { food: 3 }, ic: '🌾', fx: 'Zona agrícola: +3 comida. Explora trigo, arroz, milho e as plantações de luxo. Em planície, pradaria, colinas ou com rio.', n: { ant: 'Lavouras', med: 'Campos Feudais', pol: 'Fazendas', mod: 'Agroindústria', fan: 'Campos Férteis' } },
  pec: { pc: 6, up: 0, z: 'pec', ter: 'ce', dz: 1, y: { food: 2, prod: 1 }, ic: '🐄', fx: 'Zona pecuária: +2 comida e +1 produção. Explora gado e cavalos. Em pradaria e estepe, ou onde houver rebanho.', n: { ant: 'Pastagens', med: 'Pastagens', pol: 'Estâncias', mod: 'Frigoríficos', fan: 'Pastos' } },
  pes: { pc: 6, up: 0, z: 'pes', coast: 1, y: { food: 2, gold: 1 }, ic: '🐟', fx: 'Zona pesqueira: +2 comida e +1 ouro. Explora peixe, pérolas e âmbar. Só no litoral.', n: { ant: 'Pesqueiros', med: 'Pesqueiros', pol: 'Pescarias', mod: 'Frota Pesqueira', fan: 'Redes Encantadas' } },
  flo: { pc: 6, up: 0, z: 'flo', ter: 'fst', y: { prod: 2 }, ic: '🪵', fx: 'Zona florestal: +2 produção. Explora madeira e peles. Em floresta, selva ou taiga.', n: { ant: 'Lenhadores', med: 'Serrarias', pol: 'Serrarias', mod: 'Madeireiras', fan: 'Bosque dos Druidas' } },
  min: { pc: 8, up: 0, z: 'min', ter: 'hm', dz: 1, y: { prod: 3 }, ic: '⛏', fx: 'Zona de mineração: +3 produção. Explora pedra, metais, sal, carvão e petróleo. Em colinas e montanhas, ou onde houver jazida mineral.', n: { ant: 'Minas', med: 'Minas', pol: 'Minas', mod: 'Mineradoras', fan: 'Minas Anãs' } },
  // ---------- parte 4: catálogo de construções, eras 1 a 3 ----------
  // need = construção exigida no território (a zona-base ou o elo anterior da cadeia; não ocupa vaga);
  // dep = jazida no território; good = bens explorados no império ('a+b' = os dois); era = nível mínimo de era (ERA_LV);
  // tech = tecnologia; y = rendimentos (food, prod, gold, sci, pre = prestígio, stab = estabilidade por turno);
  // def = +n no maior dado de defesa; tie = defesa vence todos os empates; atk = +1 no maior dado de ataque saindo daqui;
  // rf = tropas de reforço; nav = travessias; lg = pontos de legado.
  faz: { pc: 4, need: 'agr', y: { food: 2 }, ic: '🌱', fx: 'Fazenda (C-01): +2 comida.', n: 'Fazenda' },
  cel: { pc: 4, need: 'faz', y: { food: 1 }, ic: '🛖', fx: 'Celeiro (C-02): +1 comida e a fome não tira nível deste território.', n: 'Celeiro' },
  irr: { pc: 6, need: 'faz', rioReq: 1, y: { food: 2 }, ic: '💧', fx: 'Canal de irrigação (C-03): +2 comida. Só com rio.', n: 'Canal de irrigação' },
  moi: { pc: 6, need: 'agr', rioReq: 1, era: 1, y: { food: 1, prod: 1 }, ic: '⚙', fx: 'Moinho (C-04): +1 comida e +1 produção. Só com rio, da Idade Média em diante.', n: 'Moinho' },
  arz: { pc: 6, need: 'agr', dep: ['arr'], y: { food: 3 }, ic: '🍚', fx: 'Arrozal (C-05): +3 comida. Exige arroz no território.', n: 'Arrozal' },
  pla: { pc: 6, need: 'agr', dep: ['esp', 'sed', 'vin', 'inc', 'acu', 'caf', 'tab', 'alg'], y: { gold: 1, stab: 1 }, ic: '🌿', fx: 'Plantação (C-06): +1 ouro e +1 estabilidade. Exige um luxo de plantação no território.', n: 'Plantação' },
  egh: { pc: 8, need: 'pla', dep: ['acu'], era: 1, y: { gold: 3 }, ic: '🏭', fx: 'Engenho (C-07): +3 ouro. Exige açúcar.', n: 'Engenho' },
  etc: { pc: 4, need: 'pec', dep: ['gad'], y: { food: 2, prod: 1 }, ic: '🐂', fx: 'Estância (C-08): +2 comida e +1 produção. Exige gado.', n: 'Estância' },
  har: { pc: 6, need: 'pec', dep: ['cav'], rf: 1, ic: '🏇', fx: 'Haras (C-09): +1 tropa de reforço por turno. Exige cavalos.', n: 'Haras' },
  chq: { pc: 8, need: 'etc', good: ['sal'], y: { food: 2, gold: 2 }, ic: '🥩', fx: 'Charqueada (C-10): +2 comida e +2 ouro. Exige estância e sal explorado no império.', n: 'Charqueada' },
  psq: { pc: 4, need: 'pes', y: { food: 2 }, ic: '🎣', fx: 'Pesqueiro (C-11): +2 comida.', n: 'Pesqueiro' },
  slg: { pc: 6, need: 'psq', good: ['sal'], y: { food: 2, gold: 1 }, ic: '🧂', fx: 'Salga e conserva (C-12): +2 comida e +1 ouro. Exige sal explorado no império.', n: 'Salga e conserva' },
  ser: { pc: 4, need: 'flo', y: { prod: 2 }, ic: '🪚', fx: 'Serraria (C-20): +2 produção.', n: 'Serraria' },
  cvo: { pc: 4, need: 'ser', y: { prod: 1, gold: 1 }, ic: '🔥', fx: 'Carvoaria (C-21): +1 produção e +1 ouro.', n: 'Carvoaria' },
  pdr: { pc: 4, need: 'min', dep: ['ped'], y: { prod: 2 }, ic: '🧱', fx: 'Pedreira (C-24): +2 produção. Exige pedra no território.', n: 'Pedreira' },
  mna: { pc: 6, need: 'min', dep: ['fer', 'cob', 'est', 'our', 'pra', 'car', 'sli', 'pet', 'gem'], y: { prod: 2, gold: 1 }, ic: '⚒', fx: 'Mina (C-25): +2 produção e +1 ouro. Exige jazida mineral.', n: 'Mina' },
  gar: { pc: 4, need: 'min', dep: ['our', 'gem', 'est'], rioReq: 1, y: { gold: 3, stab: -1 }, ic: '🪙', fx: 'Garimpo (C-26): +3 ouro e −1 estabilidade. Exige ouro, gemas ou estanho e rio.', n: 'Garimpo' },
  fun: { pc: 8, need: 'min', good: ['cob+est', 'fer'], y: { prod: 2 }, ic: '🫕', fx: 'Fundição (C-41): +2 produção. Exige bronze (cobre e estanho) ou ferro explorados.', n: { ant: 'Fundição de Bronze', med: 'Fundição', pol: 'Fundição', mod: 'Siderúrgica', fan: 'Fundição Anã' } },
  frr: { pc: 8, good: ['fer+mad'], y: { prod: 2 }, ic: '🔨', fx: 'Ferraria (C-42): +2 produção. Exige ferro e madeira explorados.', n: { ant: 'Ferraria', med: 'Ferraria', pol: 'Metalúrgica', mod: 'Metalúrgica', fan: 'Ferraria Rúnica' } },
  ars: { pc: 10, up: 1, need: 'qua', needE: 'frr', atk: 1, ic: '🗡', fx: 'Arsenal (C-43): ataques saindo daqui somam +1 ao maior dado. Exige quartel aqui e ferraria no império.', n: 'Arsenal' },
  pov: { pc: 10, up: 1, need: 'qua', era: 2, good: ['sli'], atk: 1, rf: 1, ic: '💥', fx: 'Polvorinho (C-44): +1 no maior dado de ataque saindo daqui e +1 tropa de reforço. Exige salitre explorado.', n: 'Polvorinho' },
  car: { pc: 8, need: 'mer', y: { gold: 2 }, ic: '🐪', fx: 'Caravançará (C-61): +2 ouro (mais com rotas, na parte 6).', n: { ant: 'Caravançará', med: 'Caravançará', pol: 'Entreposto', mod: 'Centro Logístico', fan: 'Posto de Caravanas' } },
  ban: { pc: 10, need: 'mer', tech: 'com', y: { gold: 3 }, lg: 1, ic: '🏦', fx: 'Banco (C-62): +3 ouro. Exige a tecnologia de moeda.', n: { ant: 'Casa de Câmbio', med: 'Banco', pol: 'Banco', mod: 'Banco', fan: 'Cofre dos Anões' } },
  bol: { pc: 14, need: 'ban', era: 2, y: { gold: 4 }, lg: 1, ic: '📈', fx: 'Bolsa de valores (C-63): +4 ouro. Da era da pólvora em diante.', n: 'Bolsa de Valores' },
  arm: { pc: 8, need: 'por', y: { gold: 2 }, ic: '📦', fx: 'Armazém alfandegário (C-64): +2 ouro.', n: 'Armazém Alfandegário' },
  cia: { pc: 12, need: ['por', 'mer'], era: 2, coast: 1, y: { gold: 3 }, nav: 1, lg: 1, ic: '⛵', fx: 'Companhia de comércio (C-65): +3 ouro e +1 travessia. Da era da pólvora em diante, no litoral.', n: 'Companhia de Comércio' },
  acd: { pc: 10, up: 1, need: 'aca', y: { sci: 2, pre: 1 }, lg: 1, ic: '🎓', fx: 'Academia (C-71): +2 saber e +1 prestígio.', n: { ant: 'Academia', med: 'Escola Catedral', pol: 'Academia de Ciências', mod: 'Instituto', fan: 'Colégio Arcano' } },
  obs: { pc: 10, need: 'aca', near: 'hm', y: { sci: 2 }, lg: 1, ic: '🔭', fx: 'Observatório (C-72): +2 saber. Exige colina ou montanha no território ou ao lado.', n: 'Observatório' },
  uni: { pc: 16, up: 1, need: 'acd', lv: 3, y: { sci: 4 }, lg: 1, ic: '🏛', fx: 'Universidade (C-73): +4 saber. Exige cidade.', n: { ant: 'Museion', med: 'Universidade', pol: 'Universidade', mod: 'Universidade', fan: 'Universidade Arcana' } },
  mon: { pc: 3, y: { pre: 1 }, lg: 1, ic: '🗿', fx: 'Monumento (C-80): +1 prestígio.', n: { ant: 'Obelisco', med: 'Monumento', pol: 'Estátua Equestre', mod: 'Memorial', fan: 'Menir' } },
  mos: { pc: 8, need: 'tem', y: { sci: 1, pre: 1 }, lg: 1, ic: '📜', fx: 'Mosteiro (C-82): +1 saber e +1 prestígio.', n: { ant: 'Escola de Escribas', med: 'Mosteiro', pol: 'Seminário', mod: 'Arquivo Nacional', fan: 'Mosteiro' } },
  cat: { pc: 14, need: 'tem', good: ['ped'], y: { pre: 3, stab: 2 }, lg: 1, ic: '⛪', fx: 'Grande templo (C-83): +3 prestígio e +2 estabilidade. Exige pedra explorada.', n: { ant: 'Grande Templo', med: 'Catedral', pol: 'Basílica', mod: 'Catedral Nacional', fan: 'Grande Santuário' } },
  anf: { pc: 8, lv: 2, y: { stab: 2 }, lg: 1, ic: '🎭', fx: 'Anfiteatro (C-84): +2 estabilidade. Exige vila.', n: { ant: 'Anfiteatro', med: 'Arena', pol: 'Praça de Touros', mod: 'Estádio', fan: 'Arena' } },
  tea: { pc: 10, need: 'anf', era: 1, y: { pre: 2, stab: 1 }, lg: 1, ic: '🎻', fx: 'Teatro (C-85): +2 prestígio e +1 estabilidade.', n: { ant: 'Teatro', med: 'Teatro', pol: 'Ópera', mod: 'Teatro Municipal', fan: 'Salão dos Bardos' } },
  aqu: { pc: 8, lv: 2, ic: '🚰', fx: 'Aqueduto (C-91): permite que a vila vire cidade.', n: { ant: 'Aqueduto', med: 'Cisternas', pol: 'Aqueduto', mod: 'Rede de Água', fan: 'Fonte Encantada' } },
  san: { pc: 12, need: 'aqu', lv: 3, y: { stab: 1 }, ic: '🛁', fx: 'Saneamento (C-92): +1 estabilidade; permite que a cidade vire metrópole.', n: { ant: 'Banhos Públicos', med: 'Banhos', pol: 'Esgotos', mod: 'Saneamento', fan: 'Termas' } },
  hos: { pc: 10, era: 1, lv: 2, y: { food: 1, stab: 1 }, ic: '⚕', fx: 'Hospital (C-93): +1 comida e +1 estabilidade.', n: { ant: 'Asclepeion', med: 'Hospital', pol: 'Hospital', mod: 'Hospital', fan: 'Casa de Cura' } },
  tri: { pc: 8, y: { stab: 1 }, norev: 1, ic: '⚖', fx: 'Tribunal (C-94): +1 estabilidade, e este território nunca se revolta.', n: { ant: 'Basílica Judiciária', med: 'Tribunal', pol: 'Governadoria', mod: 'Prefeitura', fan: 'Conselho Local' } },
  pal: { pc: 3, def: 1, defMin: 2, ic: '🪵', fx: 'Paliçada (C-100): +1 no maior dado de defesa com 2 ou mais tropas.', n: { ant: 'Paliçada', med: 'Paliçada', pol: 'Trincheira', mod: 'Arame Farpado', fan: 'Estacada' } },
  cas: { pc: 14, up: 1, need: 'for', era: 1, def: 1, tie: 1, lg: 1, ic: '🏰', fx: 'Castelo (C-102): +1 no maior dado de defesa, e a defesa vence todos os empates.', n: { ant: 'Cidadela', med: 'Castelo', pol: 'Cidadela', mod: 'Cidadela', fan: 'Castelo' } },
  fab: { pc: 14, up: 1, need: 'for', era: 2, def: 1, ic: '⭐', fx: 'Fortaleza abaluartada (C-103): +1 no maior dado de defesa.', n: 'Fortaleza Abaluartada' },
  bkr: { pc: 14, up: 1, era: 3, def: 2, ic: '🧱', fx: 'Linha fortificada (C-104): +2 no maior dado de defesa.', n: 'Linha Fortificada' },
  acm: { pc: 12, up: 1, need: 'qua', rf: 1, lg: 1, ic: '🎖', fx: 'Academia militar (C-106): +1 tropa de reforço por turno.', n: { ant: 'Escola de Gladiadores', med: 'Ordem de Cavalaria', pol: 'Academia Militar', mod: 'Escola de Guerra', fan: 'Academia de Heróis' } },
  // parte 5: estradas e estaleiro (C-121, C-122, C-127). road = nível da estrada; custo ×2 em montanha e pântano, ×1,5 em deserto (L-11)
  est: { pc: 4, road: 1, ic: '🛤', fx: 'Estrada (C-121): liga o território à rede de bens se um vizinho seu também tiver estrada, e no remanejamento as tropas andam até 2 territórios pela estrada.', n: { ant: 'Estrada', med: 'Estrada', pol: 'Estrada', mod: 'Rodovia', fan: 'Estrada' } },
  pav: { pc: 6, road: 2, need: 'est', tech: 'eng', ic: '🛣', fx: 'Estrada pavimentada (C-122): pela estrada as tropas andam até 3 territórios no remanejamento, e +1 ouro com mercado. Exige engenharia.', n: { ant: 'Via Pavimentada', med: 'Calçada Real', pol: 'Estrada de Macadame', mod: 'Autoestrada', fan: 'Via Encantada' } },
  stl: { pc: 8, up: 1, need: 'por', good: ['mad'], nav: 1, y: { prod: 1 }, ic: '🚢', fx: 'Estaleiro (C-127): +1 travessia por turno e +1 produção. Exige porto e madeira ligada à rede.', n: { ant: 'Estaleiro', med: 'Estaleiro', pol: 'Arsenal Naval', mod: 'Estaleiro Naval', fan: 'Doca Encantada' } },
  // Maravilhas do mundo (C-200 a C-209): uma só no mundo; quem termina primeiro fica com ela, as outras filas a perdem.
  pir: { pc: 36, ww: 1, era: 0, eraMax: 1, need: 'mon', ic: '🔺', fx: 'Grandes Pirâmides (C-200): suas muralhas, templos, monumentos e pedreiras custam 25% menos.', n: 'Grandes Pirâmides' },
  jar: { pc: 36, ww: 1, era: 0, eraMax: 1, need: 'faz', ic: '🌺', fx: 'Jardins Suspensos (C-201): +1 comida em todos os seus territórios.', n: 'Jardins Suspensos' },
  gbi: { pc: 40, ww: 1, era: 0, eraMax: 1, need: 'aca', ic: '📚', fx: 'Grande Biblioteca (C-202): você recebe grátis toda tecnologia que duas outras facções já têm.', n: 'Grande Biblioteca' },
  frl: { pc: 32, ww: 1, era: 0, eraMax: 1, need: 'por', nav: 1, ic: '🗼', fx: 'Farol monumental (C-203): +1 travessia, e seus desembarques usam 3 dados.', n: 'Farol Monumental' },
  col: { pc: 36, ww: 1, era: 0, eraMax: 2, need: 'anf', y: { stab: 3 }, ic: '🏟', fx: 'Grande Arena (C-204): +3 estabilidade por turno.', n: 'Grande Arena' },
  gmu: { pc: 44, ww: 1, era: 0, eraMax: 1, need: 'for', ic: '🧱', fx: 'Grande Muralha (C-205): todos os seus territórios somam +1 ao maior dado de defesa contra ataques por terra.', n: 'Grande Muralha' },
  cgo: { pc: 40, ww: 1, era: 1, eraMax: 2, need: 'tem', y: { pre: 3, stab: 3 }, ic: '⛪', fx: 'Catedral gótica (C-206): +3 prestígio e +3 estabilidade por turno.', n: 'Catedral Gótica' },
  rce: { pc: 36, ww: 1, era: 1, eraMax: 2, ic: '🛣', fx: 'Rede de caminhos do império (C-207): a linha de suprimento alcança 2 territórios a mais.', n: 'Rede de Caminhos do Império' },
  csg: { pc: 40, ww: 1, era: 1, eraMax: 2, need: 'cas', ic: '🏯', fx: 'Castelo do Senhor da Guerra (C-208): em campanha, seu maior dado de ataque ganha +1.', n: 'Castelo do Senhor da Guerra' },
  obi: { pc: 40, ww: 1, era: 2, eraMax: 3, need: 'obs', ic: '🌌', fx: 'Observatório imperial (C-209): +25% de saber.', n: 'Observatório Imperial' },
};
// legado: construções originais valem 1, maravilha da facção 5, maravilhas do mundo 5; as do catálogo, conforme lg
['ofi', 'mer', 'aca', 'qua', 'for', 'tem', 'por', 'aer'].forEach(k => STRUCT[k].lg = 1);
STRUCT.mar.lg = 5; STRUCT.for.def = 1; Object.values(STRUCT).forEach(S => { if (S.ww) { S.lg = 5; S.wonder = 1; } });
// Zonas (parte 3): cada construção com z ocupa uma vaga; vagas = nível do território (Z-01, S-02 a S-05).
// Polo: +1 no primeiro rendimento de y por vizinho seu com a mesma zona, até +3.
const ZONE = { agr: 'Agrícola', pec: 'Pecuária', pes: 'Pesqueira', flo: 'Florestal', min: 'Mineração', com: 'Comercial', por: 'Portuária', rel: 'Religiosa', mil: 'Militar', sci: 'Científica' };
// Povoamento (S-02 a S-05): consumo de comida = 2 × nível − 1; para subir, estoque = need × k da duração e a construção pedida.
const LEVEL = [null,
  { n: 'Aldeia', ic: '·', need: 20 },
  { n: 'Vila', ic: '•', need: 40, req: ['aqu'] },
  { n: 'Cidade', ic: '●', need: 80, req: ['san'] },
  { n: 'Metrópole', ic: '◉' },
];
// Árvore de tecnologias: nível 1, 2 (exige uma do nível 1) e 3 (exige duas do nível 2).
// Custo em saber = cost × 2 × k da duração; a pesquisa avança por turnos (P-09).
const TECH = [
  { k: 'adm', t: 1, cost: 4, fx: '+1 ponto de ação por turno, e filas de obra com 5 itens em vez de 3.', n: { ant: 'Burocracia', med: 'Chancelaria', pol: 'Serviço Público', mod: 'Estado-Maior', fan: 'Conselho dos Sábios' } },
  { k: 'eng', t: 1, cost: 4, fx: 'Obras custam 25% menos produção.', n: { ant: 'Engenharia', med: 'Alvenaria', pol: 'Engenharia Civil', mod: 'Concreto Armado', fan: 'Runas de Pedra' } },
  { k: 'com', t: 1, cost: 4, fx: 'Cada mercado rende +1 ouro, e o comércio troca 3 por 2 em vez de 2 por 1.', n: { ant: 'Moeda', med: 'Letras de Câmbio', pol: 'Bolsa de Valores', mod: 'Bancos Centrais', fan: 'Ouro Alquímico' } },
  { k: 'tat', t: 1, cost: 4, fx: 'Em campanha, você vence os empates ao atacar.', n: { ant: 'Falange', med: 'Cavalaria Pesada', pol: 'Artilharia', mod: 'Blindados', fan: 'Táticas Rúnicas' } },
  { k: 'nav', t: 2, cost: 7, req: ['com'], fx: '+1 travessia por turno, e todo ataque pelo mar usa 3 dados.', n: { ant: 'Trirremes', med: 'Bússola', pol: 'Navios a Vapor', mod: 'Porta-aviões', fan: 'Navios Encantados' } },
  { k: 'con', t: 2, cost: 7, req: ['tat'], fx: 'Recrutar custa 1 ouro por tropa em vez de 2.', n: { ant: 'Legiões', med: 'Milícias', pol: 'Conscrição', mod: 'Mobilização Total', fan: 'Levas Encantadas' } },
  { k: 'ret', t: 2, cost: 7, req: ['adm'], fx: '+1 prestígio por turno, e influenciar custa 1 a menos.', n: { ant: 'Retórica', med: 'Imprensa', pol: 'Jornais', mod: 'Propaganda de Massa', fan: 'Bardos Reais' } },
  { k: 'log', t: 2, cost: 7, req: ['eng'], fx: '+2 tropas grátis por turno.', n: { ant: 'Estradas', med: 'Rotas de Suprimento', pol: 'Ferrovias', mod: 'Motorização', fan: 'Portais' } },
  { k: 'arq', t: 3, cost: 11, req: ['eng', 'ret'], fx: 'Permite construir a sua Maravilha (+5 de legado).', n: { ant: 'Arquitetura', med: 'Arte Gótica', pol: 'Iluminismo', mod: 'Ciência de Ponta', fan: 'Alta Magia' } },
  { k: 'dou', t: 3, cost: 11, req: ['con', 'log'], fx: 'Você pode conquistar 2 territórios por turno em vez de 1.', n: { ant: 'Doutrina Imperial', med: 'Ordens Militares', pol: 'Guerra Napoleônica', mod: 'Guerra Relâmpago', fan: 'Pacto de Guerra' } },
];
// ---------- parte 7: árvore de tecnologias por era (K-01 a K-59) ----------
// e = era da tecnologia (0 Antiguidade, 1 Idade Média, 2 Idade Moderna). No início, cada facção já conhece as
// tecnologias das eras anteriores à do cenário (sem as doutrinas) e as cinco básicas da Antiguidade.
// As 10 tecnologias da v4 continuam como doutrinas e marcos da árvore (Moeda = K-13, Engenharia = K-20, Bússola = K-38).
const T7 = (k, e, cost, req, n, fx) => ({ k, e, t: e + 1, cost, req, n, fx });
TECH.push(
  T7('agri', 0, 3, [], 'Agricultura', 'K-01: zona agrícola e fazenda.'),
  T7('dom', 0, 3, [], 'Domesticação', 'K-02: zona pecuária e estância; revela os cavalos.'),
  T7('pesc', 0, 3, [], 'Pesca e barcos', 'K-03: zona pesqueira e pesqueiro.'),
  T7('mnr', 0, 3, [], 'Mineração', 'K-04: zona de mineração e mina; revela cobre e estanho.'),
  T7('mis', 0, 3, [], 'Misticismo', 'K-05: zona religiosa e templo.'),
  T7('cer', 0, 4, ['agri'], 'Cerâmica e ofícios', 'K-06: oficina e celeiro.'),
  T7('bro', 0, 4, ['mnr'], 'Ferramentas de bronze', 'K-07: fundição e serraria; lanceiros (com bronze ou ferro na rede).'),
  T7('esc', 0, 4, ['cer'], 'Escrita', 'K-08: zona científica (biblioteca).'),
  T7('alv', 0, 4, ['mnr'], 'Alvenaria', 'K-09: pedreira, muralha, monumento e Grandes Pirâmides.'),
  T7('rod', 0, 4, ['dom'], 'Roda', 'K-10: estrada.'),
  T7('irr', 0, 4, ['agri'], 'Irrigação', 'K-11: canal de irrigação, arrozal e Jardins Suspensos.'),
  T7('cos', 0, 4, ['pesc'], 'Navegação costeira', 'K-12: porto e Farol Monumental.'),
  T7('lei', 0, 5, ['esc'], 'Código de leis', 'K-14: tribunal.'),
  T7('ferr', 0, 5, ['bro'], 'Fundição do ferro', 'K-15: ferraria; revela o ferro; legiões (com ferro na rede).'),
  T7('equ', 0, 5, ['rod'], 'Equitação', 'K-16: haras; cavalaria leve (com cavalos na rede).'),
  T7('fil', 0, 5, ['lei', 'mis'], 'Filosofia', 'K-17: academia.'),
  T7('mat', 0, 5, ['com'], 'Matemática', 'K-18: armas de cerco: no ataque, construções de defesa valem 1 a menos.'),
  T7('civ', 0, 6, ['alv', 'mat'], 'Construção civil', 'K-19: anfiteatro, aqueduto e Grande Arena.'),
  T7('ast', 0, 6, ['mat', 'mis'], 'Astronomia', 'K-21: observatório.'),
  T7('dis', 0, 6, ['ferr'], 'Disciplina militar', 'K-22: quartel.'),
  T7('feu', 1, 7, ['lei', 'dis'], 'Feudalismo', 'K-30: base das ordens de cavalaria e das levas.'),
  T7('teo', 1, 7, ['fil'], 'Teologia', 'K-31: mosteiro e grande templo.'),
  T7('cst', 1, 8, ['eng', 'feu'], 'Castelos', 'K-32: castelo e Castelo do Senhor da Guerra.'),
  T7('mec', 1, 8, ['eng', 'mat'], 'Mecânica', 'K-33: moinho e engenho; besteiros (+1 na defesa com muralha).'),
  T7('cpe', 1, 8, ['equ', 'feu'], 'Estribo e cavalaria pesada', 'K-34: cavaleiros (com cavalos e ferro na rede).'),
  T7('bnc', 1, 8, ['com', 'teo'], 'Bancos', 'K-35: banco.'),
  T7('edu', 1, 8, ['teo', 'fil'], 'Educação', 'K-36: universidade.'),
  T7('got', 1, 9, ['cst', 'teo'], 'Arquitetura gótica', 'K-37: Catedral Gótica.'),
  T7('gui', 1, 9, ['bnc', 'mec'], 'Guildas', 'K-39: +1 produção em cada oficina.'),
  T7('pvr', 1, 9, ['mec', 'teo'], 'Pólvora', 'K-40: polvorinho.'),
  T7('imp', 2, 10, ['edu', 'gui'], 'Imprensa', 'K-50: +1 saber por universidade.'),
  T7('oce', 2, 10, ['nav', 'ast'], 'Navegação oceânica', 'K-51: companhia de comércio; caravelas (+1 travessia).'),
  T7('msq', 2, 10, ['pvr'], 'Mosquete', 'K-52: mosqueteiros (com salitre na rede): +1 no ataque e na defesa.'),
  T7('art', 2, 11, ['pvr', 'mat'], 'Artilharia', 'K-53: antes de cada ataque, 1 dado de canhão mata 1 defensor com 5 ou 6 (com salitre na rede).'),
  T7('fmo', 2, 11, ['art'], 'Fortificação moderna', 'K-54: fortaleza abaluartada.'),
  T7('cie', 2, 12, ['imp', 'ast'], 'Método científico', 'K-55: +10% de saber.'),
  T7('eco', 2, 11, ['bnc', 'imp'], 'Economia', 'K-56: bolsa de valores.'),
  T7('dra', 2, 10, ['imp'], 'Drama e artes', 'K-57: teatro.'),
  T7('estr', 2, 12, ['msq', 'edu'], 'Estratégia', 'K-59: academia militar.'),
);
// marcos antigos dentro da árvore nova, e as doutrinas com novos pré-requisitos
Object.assign(TECH.find(t => t.k === 'com'), { e: 0, cost: 5, req: ['esc', 'bro'], fx: 'K-13: zona comercial (mercado) e caravançará. Cada mercado rende +1 ouro, e o câmbio troca 3 por 2.' });
Object.assign(TECH.find(t => t.k === 'eng'), { e: 0, cost: 6, req: ['civ', 'rod'], fx: 'K-20: estrada pavimentada; obras custam 25% menos produção.' });
Object.assign(TECH.find(t => t.k === 'nav'), { e: 1, cost: 8, req: ['cos', 'ast'], fx: 'K-38: armazém alfandegário; +1 travessia, e todo ataque pelo mar usa 3 dados.' });
const DOCT = { adm: [0, ['lei']], tat: [0, ['dis']], ret: [0, ['fil']], log: [0, ['eng']], arq: [0, ['civ', 'fil']], con: [1, ['feu']], dou: [1, ['con', 'log']] };
for (const [k, [e, req]] of Object.entries(DOCT)) Object.assign(TECH.find(t => t.k === k), { e, req, doc: 1 });
TECH.forEach(t => { t.t = t.e + 1; });
// o que cada tecnologia libera no catálogo (substitui os requisitos de tecnologia da parte 4)
const UNLOCK = {
  agri: ['agr', 'faz'], dom: ['pec', 'etc'], pesc: ['pes', 'psq'], mnr: ['min', 'mna', 'gar'], mis: ['tem'],
  cer: ['ofi', 'cel', 'chq', 'slg'], bro: ['fun', 'ser'], esc: ['aca'], alv: ['pdr', 'for', 'mon', 'pir'], rod: ['est'], irr: ['irr', 'arz', 'jar'],
  cos: ['por', 'frl'], com: ['mer', 'car', 'pla'], lei: ['tri'], ferr: ['frr'], equ: ['har'], fil: ['acd', 'gbi'],
  civ: ['anf', 'aqu', 'col'], eng: ['pav', 'san'], ast: ['obs'], dis: ['qua', 'ars'], teo: ['mos', 'cat', 'hos'], cst: ['cas', 'csg'],
  mec: ['moi', 'egh', 'rce'], bnc: ['ban'], edu: ['uni'], got: ['cgo'], nav: ['arm', 'stl'], pvr: ['pov'], oce: ['cia'],
  fmo: ['fab'], eco: ['bol'], dra: ['tea'], estr: ['acm']
};
for (const [t, ks] of Object.entries(UNLOCK)) ks.forEach(k => { if (STRUCT[k]) STRUCT[k].tech = t; });
STRUCT.obi.tech = 'cie';
// jazidas que só aparecem com a tecnologia (K-02, K-04, K-15)
const REVEAL = { cav: 'dom', cob: 'mnr', est: 'mnr', fer: 'ferr' };
// tropas por era (A-01 a A-07): a melhor tropa disponível da facção dá o bônus; exige tecnologia e bem na rede
const ARMY = {
  lan: { n: 'Lanceiros', tech: 'bro', good: ['cob+est', 'fer'], fx: 'defesa vence empates contra cavalaria' },
  leg: { n: 'Legiões', tech: 'ferr', good: ['fer'], fx: '+1 no maior dado de ataque' },
  cav: { n: 'Cavalaria leve', tech: 'equ', good: ['cav'], fx: '+1 no maior dado de ataque em terreno aberto' },
  kni: { n: 'Cavaleiros', tech: 'cpe', good: ['cav+fer'], fx: '+1 no maior dado de ataque em terreno aberto e vence empates nele' },
  bes: { n: 'Besteiros', tech: 'mec', good: [], fx: '+1 no maior dado de defesa em território com muralha' },
  msq: { n: 'Mosqueteiros', tech: 'msq', good: ['sli'], fx: '+1 no maior dado de ataque e de defesa' },
};
const OPEN = 'pcde'; // terreno aberto para a cavalaria
TECH.sort((a, b) => a.e - b.e || a.cost - b.cost);
const TK = Object.fromEntries(TECH.map(t => [t.k, t]));

// ---------- parte 10: governo, cultura e fé (G-01 a G-08, G-20 a G-31, G-40, G-41, G-50 a G-53) ----------
// árvore cívica (G-40): avança com cultura; cada cívica libera governos e políticas
const CIVIC = [
  { k: 'c_tri', e: 0, cost: 0, req: [], n: 'Tradição tribal' },
  { k: 'c_lei', e: 0, cost: 8, req: ['c_tri'], n: 'Costume legal' },
  { k: 'c_rit', e: 0, cost: 8, req: ['c_tri'], n: 'Ritos e festas' },
  { k: 'c_fil', e: 0, cost: 14, req: ['c_lei'], n: 'Filosofia política' },
  { k: 'c_est', e: 0, cost: 14, req: ['c_lei'], n: 'Estradas do reino' },
  { k: 'c_teo', e: 1, cost: 22, req: ['c_rit', 'c_fil'], n: 'Ordem sagrada' },
  { k: 'c_vas', e: 1, cost: 22, req: ['c_lei'], n: 'Vassalagem' },
  { k: 'c_gui', e: 1, cost: 26, req: ['c_fil', 'c_est'], n: 'Ligas mercantes' },
  { k: 'c_hum', e: 2, cost: 34, req: ['c_teo', 'c_gui'], n: 'Humanismo' },
  { k: 'c_abs', e: 2, cost: 34, req: ['c_vas'], n: 'Absolutismo' },
  { k: 'c_mer', e: 2, cost: 34, req: ['c_gui'], n: 'Mercantilismo' },
  { k: 'c_ilu', e: 2, cost: 46, req: ['c_hum', 'c_abs'], n: 'Iluminismo' },
];
const CK = Object.fromEntries(CIVIC.map(c => [c.k, c]));
// governos (G-01 a G-08): vagas de política por tipo (mil, eco, civ, rel)
const GOV = {
  tri: { n: 'Chefia tribal', c: 'c_tri', s: { mil: 1 }, fx: '+1 tropa nos reforços; −1 ouro por turno.' },
  mon: { n: 'Monarquia', c: 'c_lei', s: { mil: 1, eco: 1 }, fx: '+2 estabilidade por turno.' },
  rep: { n: 'República clássica', c: 'c_fil', s: { eco: 2, civ: 1 }, fx: '+1 ação e +1 ouro por mercado; cansaço de guerra dobrado.' },
  teo: { n: 'Teocracia', c: 'c_teo', s: { mil: 1, civ: 1, rel: 1 }, fx: 'templos rendem +1 saber e mercenários se pagam com cultura; −10% de saber.' },
  feu: { n: 'Feudalismo', c: 'c_vas', s: { mil: 2, eco: 1 }, fx: 'tropas custam 1 a menos e castelos 25% menos; corrupção +50%.' },
  rme: { n: 'República mercantil', c: 'c_gui', s: { eco: 3, civ: 1 }, fx: '+1 rota e apressar obras 25% mais barato; reforços −25%.' },
  abs: { n: 'Monarquia absoluta', c: 'c_abs', s: { mil: 2, eco: 2 }, fx: '+1 ação e maravilhas 25% mais baratas; −2 de felicidade.' },
  dem: { n: 'Democracia liberal', c: 'c_ilu', s: { eco: 3, civ: 2 }, fx: '+2 ações e +25% de saber e ouro; eleição a cada 20 turnos: com o povo infeliz, perde as políticas.' },
};
// cartas de política (G-20 a G-31)
const POL = {
  csc: { n: 'Conscrição', t: 'mil', c: 'c_vas', fx: 'tropas 25% mais baratas; −1 felicidade.' },
  dis: { n: 'Disciplina de ferro', t: 'mil', c: 'c_lei', fx: 'veteranos depois de 2 conquistas em vez de 3.' },
  est: { n: 'Estradas imperiais', t: 'eco', c: 'c_est', fx: 'estradas pela metade do custo.' },
  liv: { n: 'Livre comércio', t: 'eco', c: 'c_gui', fx: '+1 ouro por rota com outra facção.' },
  pro: { n: 'Protecionismo', t: 'eco', c: 'c_mer', fx: '+1 produção por oficina; −5 de relação com todos.' },
  mec: { n: 'Mecenato', t: 'civ', c: 'c_hum', fx: '+25% de cultura.' },
  esc: { n: 'Escola para todos', t: 'civ', c: 'c_fil', fx: '+1 saber por biblioteca.' },
  pao: { n: 'Pão e circo', t: 'civ', c: 'c_rit', fx: '+2 felicidade; −1 ouro por cidade.' },
  amb: { n: 'Política ambiental', t: 'civ', c: 'c_ilu', fx: '+1 saúde em todos os territórios; −10% de ouro.' },
  per: { n: 'Peregrinação', t: 'rel', c: 'c_teo', fx: '+1 prestígio por templo.' },
  ppg: { n: 'Propaganda', t: 'civ', c: 'c_abs', fx: 'cansaço de guerra pesa a metade.' },
  pol: { n: 'Polícia secreta', t: 'mil', c: 'c_abs', fx: 'agitadores rivais tiram metade da estabilidade.' },
};
const SLOTN = { mil: 'militar', eco: 'econômica', civ: 'civil', rel: 'religiosa' };
// crenças fictícias (G-50 a G-52)
const PANT = {
  col: { n: 'Deusa das colheitas', fx: '+1 comida em territórios com rio.' },
  frj: { n: 'Senhor da forja', fx: '+1 produção em territórios com mineração.' },
  mar: { n: 'Espírito das marés', fx: '+1 ouro em territórios do litoral.' },
  lar: { n: 'Guardiões do lar', fx: '+1 estabilidade por turno a cada 4 territórios.' },
};
const PRIN = {
  diz: { n: 'Dízimo', t: 'f', fx: '+1 ouro a cada 3 territórios que seguem a fé.' },
  se: { n: 'Sé luminosa', t: 'f', fx: '+2 prestígio por turno.' },
  mis: { n: 'Missões', t: 'f', fx: 'a fé se espalha o dobro.' },
  hos: { n: 'Hospitais da ordem', t: 's', fx: '+2 saúde nos territórios que seguem a fé.' },
  dev: { n: 'Devoção', t: 's', fx: '+5 de estabilidade local nos territórios que seguem a fé.' },
  gue: { n: 'Guerra santa', t: 's', fx: '+1 no maior dado de ataque contra território de outra fé.' },
};
const FAITH_N = ['Caminho das Sete Luzes', 'Fé do Sol Velado', 'Ordem da Chama Serena', 'Círculo das Águas', 'Doutrina do Monte Claro', 'Culto da Estrela Fixa', 'Senda dos Ancestrais', 'Igreja do Vento Norte'];
