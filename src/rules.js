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
  pol: { n: 'Era da Pólvora', g: 'Moderna', cards: 'xix', wall: 0, tech: ['Artilharia de campanha ataca à distância por carta.', 'Marinha: atravessar o mar exige frota, com no máximo 2 dados no desembarque.', 'Fortalezas antigas não resistem a canhões: capitais sem bônus.'] },
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
const ECON = { pa: 3, troop: 2, fest: 2, agit: 3, legWin: 30, maxB: 2 };
// Construções: custo em ouro, efeito, nome por época. Ficam no território e mudam de dono na conquista.
const STRUCT = {
  mer: { cost: 3, ic: '💰', fx: '+2 ouro por turno.', n: { ant: 'Fórum', med: 'Feira', pol: 'Banco', mod: 'Indústria', fan: 'Guilda' } },
  aca: { cost: 4, ic: '🔬', fx: '+2 saber por turno.', n: { ant: 'Biblioteca', med: 'Mosteiro', pol: 'Universidade', mod: 'Laboratório', fan: 'Torre Arcana' } },
  qua: { cost: 3, ic: '⚔', fx: '+1 tropa grátis por turno aqui. Permite recrutar aqui, além da capital.', n: { ant: 'Acampamento', med: 'Quartel', pol: 'Quartel', mod: 'Base Militar', fan: 'Caserna' } },
  for: { cost: 4, ic: '⛨', fx: '+1 no maior dado de defesa deste território.', n: { ant: 'Muralha', med: 'Castelo', pol: 'Fortaleza', mod: 'Bunker', fan: 'Bastião' } },
  tem: { cost: 3, ic: '⭐', fx: '+1 prestígio e +2 estabilidade por turno.', n: { ant: 'Templo', med: 'Catedral', pol: 'Teatro', mod: 'Rádio', fan: 'Santuário' } },
  por: { cost: 3, ic: '⚓', fx: '+1 travessia marítima por turno, e ataques pelo mar daqui usam 3 dados. Só no litoral.', sea: 1, n: { ant: 'Porto', med: 'Porto', pol: 'Estaleiro', mod: 'Base Naval', fan: 'Cais' } },
  aer: { cost: 4, ic: '✈', fx: '+1 unidade aérea por turno. Só em eras com aviação ou criaturas voadoras.', air: 1, n: { ant: 'Aeródromo', med: 'Aeródromo', pol: 'Aeródromo', mod: 'Aeródromo', fan: 'Ninho' } },
  mar: { cost: 12, ic: '🏛', fx: '+5 de legado e +2 prestígio por turno. Uma por facção; exige a tecnologia das grandes obras.', wonder: 1, req: 'arq', n: { ant: 'Coliseu', med: 'Grande Catedral', pol: 'Exposição Universal', mod: 'Programa Espacial', fan: 'Torre do Mundo' } },
};
// Árvore de tecnologias: nível 1 (4 saber), 2 (7, exige uma do nível 1), 3 (11, exige duas do nível 2).
const TECH = [
  { k: 'adm', t: 1, cost: 4, fx: '+1 ponto de ação por turno.', n: { ant: 'Burocracia', med: 'Chancelaria', pol: 'Serviço Público', mod: 'Estado-Maior', fan: 'Conselho dos Sábios' } },
  { k: 'eng', t: 1, cost: 4, fx: 'Construções custam 1 ouro a menos.', n: { ant: 'Engenharia', med: 'Alvenaria', pol: 'Engenharia Civil', mod: 'Concreto Armado', fan: 'Runas de Pedra' } },
  { k: 'com', t: 1, cost: 4, fx: 'Cada mercado rende +1 ouro, e o comércio troca 3 por 2 em vez de 2 por 1.', n: { ant: 'Moeda', med: 'Letras de Câmbio', pol: 'Bolsa de Valores', mod: 'Bancos Centrais', fan: 'Ouro Alquímico' } },
  { k: 'tat', t: 1, cost: 4, fx: 'Em campanha, você vence os empates ao atacar.', n: { ant: 'Falange', med: 'Cavalaria Pesada', pol: 'Artilharia', mod: 'Blindados', fan: 'Táticas Rúnicas' } },
  { k: 'nav', t: 2, cost: 7, req: ['com'], fx: '+1 travessia por turno, e todo ataque pelo mar usa 3 dados.', n: { ant: 'Trirremes', med: 'Bússola', pol: 'Navios a Vapor', mod: 'Porta-aviões', fan: 'Navios Encantados' } },
  { k: 'con', t: 2, cost: 7, req: ['tat'], fx: 'Recrutar custa 1 ouro por tropa em vez de 2.', n: { ant: 'Legiões', med: 'Milícias', pol: 'Conscrição', mod: 'Mobilização Total', fan: 'Levas Encantadas' } },
  { k: 'ret', t: 2, cost: 7, req: ['adm'], fx: '+1 prestígio por turno, e influenciar custa 1 a menos.', n: { ant: 'Retórica', med: 'Imprensa', pol: 'Jornais', mod: 'Propaganda de Massa', fan: 'Bardos Reais' } },
  { k: 'log', t: 2, cost: 7, req: ['eng'], fx: '+2 tropas grátis por turno.', n: { ant: 'Estradas', med: 'Rotas de Suprimento', pol: 'Ferrovias', mod: 'Motorização', fan: 'Portais' } },
  { k: 'arq', t: 3, cost: 11, req: ['eng', 'ret'], fx: 'Permite construir a sua Maravilha (+5 de legado).', n: { ant: 'Arquitetura', med: 'Arte Gótica', pol: 'Iluminismo', mod: 'Ciência de Ponta', fan: 'Alta Magia' } },
  { k: 'dou', t: 3, cost: 11, req: ['con', 'log'], fx: 'Declarar campanha não gasta ponto de ação.', n: { ant: 'Doutrina Imperial', med: 'Ordens Militares', pol: 'Guerra Napoleônica', mod: 'Guerra Relâmpago', fan: 'Pacto de Guerra' } },
];
const TK = Object.fromEntries(TECH.map(t => [t.k, t]));
