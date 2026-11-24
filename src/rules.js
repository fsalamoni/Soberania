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
const ECON = { pa: 3, troop: 2, fest: 2, agit: 3, rush: 2, rushW: 3, freeT: 3, perT: 3, occ: 3, sup: 3, cq: 1 };
// v5, parte 1 (D-01, D-03, D-04): duração da partida. r = rodadas, k = fator de custo de obras e tecnologias,
// hold = turnos seguidos com o objetivo cumprido, leg = legado para vencer. Nenhuma vitória, exceto dominação, antes de 1/3 das rodadas.
const LEN = {
  c: { n: 'Curta', r: 60, k: 1, hold: 2, leg: 90 },
  m: { n: 'Média', r: 120, k: 2, hold: 3, leg: 130 },
  l: { n: 'Longa', r: 250, k: 4, hold: 4, leg: 180 },
};
// Construções (v5, parte 2): pc = custo em produção (× k da duração), up = manutenção em ouro por turno (P-11).
// Ficam no território e mudam de dono na conquista. Sem limite por território: uma de cada tipo.
const STRUCT = {
  ofi: { pc: 6, up: 0, ic: '⚒', fx: '+2 de produção neste território: as obras daqui andam mais rápido.', n: { ant: 'Oficina de Artesãos', med: 'Ferraria', pol: 'Manufatura', mod: 'Fábrica', fan: 'Forja Rúnica' } },
  mer: { pc: 8, up: 0, ic: '💰', fx: '+2 ouro por turno.', n: { ant: 'Fórum', med: 'Feira', pol: 'Banco', mod: 'Centro Financeiro', fan: 'Guilda' } },
  aca: { pc: 10, up: 1, ic: '🔬', fx: '+2 saber por turno.', n: { ant: 'Biblioteca', med: 'Mosteiro', pol: 'Universidade', mod: 'Laboratório', fan: 'Torre Arcana' } },
  qua: { pc: 8, up: 1, ic: '⚔', fx: '+1 tropa grátis por turno. Permite recrutar aqui, além da capital, e serve de base de suprimento.', n: { ant: 'Acampamento', med: 'Quartel', pol: 'Quartel', mod: 'Base Militar', fan: 'Caserna' } },
  for: { pc: 10, up: 1, ic: '⛨', fx: '+1 no maior dado de defesa deste território.', n: { ant: 'Muralha', med: 'Castelo', pol: 'Fortaleza', mod: 'Bunker', fan: 'Bastião' } },
  tem: { pc: 8, up: 1, ic: '⭐', fx: '+1 prestígio e +2 estabilidade por turno.', n: { ant: 'Templo', med: 'Catedral', pol: 'Teatro', mod: 'Rádio', fan: 'Santuário' } },
  por: { pc: 8, up: 1, ic: '⚓', fx: '+1 travessia marítima por turno, ataques pelo mar daqui usam 3 dados, e serve de base de suprimento. Só no litoral.', sea: 1, n: { ant: 'Porto', med: 'Porto', pol: 'Estaleiro', mod: 'Base Naval', fan: 'Cais' } },
  aer: { pc: 10, up: 2, ic: '✈', fx: '+1 unidade aérea por turno. Só em eras com aviação ou criaturas voadoras.', air: 1, n: { ant: 'Aeródromo', med: 'Aeródromo', pol: 'Aeródromo', mod: 'Aeródromo', fan: 'Ninho' } },
  mar: { pc: 40, up: 0, ic: '🏛', fx: '+5 de legado e +2 prestígio por turno. Uma por facção; exige a tecnologia das grandes obras.', wonder: 1, req: 'arq', n: { ant: 'Coliseu', med: 'Grande Catedral', pol: 'Exposição Universal', mod: 'Programa Espacial', fan: 'Torre do Mundo' } },
};
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
  { k: 'dou', t: 3, cost: 11, req: ['con', 'log'], fx: 'Declarar campanha não gasta ponto de ação, e você pode conquistar 2 territórios por turno em vez de 1.', n: { ant: 'Doutrina Imperial', med: 'Ordens Militares', pol: 'Guerra Napoleônica', mod: 'Guerra Relâmpago', fan: 'Pacto de Guerra' } },
];
const TK = Object.fromEntries(TECH.map(t => [t.k, t]));
