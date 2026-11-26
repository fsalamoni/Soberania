// ---------- v40 (L1): líderes escolhidos na criação da partida ----------
// Cada facção tem 2 ou 3 líderes; o primeiro é o de sempre (mesmo nome e traço do cenário).
// n: nome · y: anos · d: retrato · ab: traço (ABIL) · fx: poderes da biblioteca LD (ver LDX em game.js)
//   ['ED', construção, recurso, v]  +v em cada construção daquele tipo
//   ['TR', terrenos, recurso, v]    +v nas regiões desses terrenos (letras de TERR)
//   ['CP', recurso, v]              +v na capital
//   ['RT', v]                       +v ouro por rota comercial ativa
//   ['AB', v]                       +v rota de abastecimento e +v de carga
//   ['CR', %]                       regiões crescem com % menos comida
//   ['SB', 'all'|'mil', %]          +% de saber, ou tecnologias militares % mais baratas
//   ['RF', v]                       +v tropas de reforço por turno
//   ['CB', 'atk'|'def', onde, v]    +v no maior dado; onde: '' sempre, 'hm' colinas e montanhas, 'casa' regiões da própria cultura
//   ['NV', v]                       +v travessia marítima por turno
//   ['ES', 'stab', v] | ['ES', 'ww', %]  +v estabilidade por turno | cansaço de guerra pesa % menos
//   ['PR', 'turn'|'conq', v]        +v prestígio por turno | por região conquistada
//   ['MV', %]                       maravilhas % mais baratas
//   ['OB', v]                       +v produção em cada região com obra na fila
//   ['GV', 'anar', 1]               troca de governo sem anarquia
//   ['DP', v]                       começa com +v de relação com todas as facções
//   ['OU', 'reg'|'conq', v]         +v ouro a cada 2 regiões povoadas | por região conquistada
//   ['CT', n, k]                    +n cartas no início e uma a cada k turnos
const LEAD = {
  pun: {
    ro: [
      { n: 'Cipião Africano', y: '236–183 a.C.', ab: 'recrutador', d: 'Levou a guerra à África e venceu Aníbal em Zama, encerrando a Segunda Guerra Púnica.', fx: [['RF', 1], ['PR', 'conq', 1]] },
      { n: 'Fábio Máximo', y: 'c. 280–203 a.C.', ab: 'tenaz', d: 'O "Contemporizador": evitou batalhas campais e desgastou Aníbal dentro da Itália.', fx: [['CB', 'def', 'casa', 1], ['ES', 'ww', 50]] },
      { n: 'Marco Cláudio Marcelo', y: 'c. 268–208 a.C.', ab: 'tatico', d: 'A "espada de Roma", cinco vezes cônsul, tomou Siracusa depois de um longo cerco.', fx: [['CB', 'atk', '', 1]] },
    ],
    ca: [
      { n: 'Aníbal Barca', y: '247–183 a.C.', ab: 'tatico', d: 'Cruzou os Alpes com elefantes e destruiu exércitos romanos em Trébia, Trasimeno e Canas.', fx: [['PR', 'conq', 2], ['RF', 1]] },
      { n: 'Asdrúbal Barca', y: '245–207 a.C.', ab: 'recrutador', d: 'Governou a Hispânia cartaginesa e suas minas de prata, que pagavam a guerra.', fx: [['RF', 1], ['OU', 'reg', 1]] },
      { n: 'Hanão, o Grande', y: 'séc. III a.C.', ab: 'carisma', d: 'Líder da aristocracia agrária de Cartago, defensor da paz e das terras da África.', fx: [['TR', 'pc', 'food', 1], ['RT', 1]] },
    ],
    ma: [
      { n: 'Filipe V', y: '238–179 a.C.', ab: 'tenaz', d: 'Rei que se aliou a Aníbal e defendeu a Macedônia nas montanhas contra Roma.', fx: [['CB', 'def', 'hm', 1], ['RF', 1]] },
      { n: 'Perseu', y: 'c. 212–166 a.C.', ab: 'tenaz', d: 'Último rei da Macedônia. Juntou um grande tesouro e reergueu o exército antes de Pidna.', fx: [['OU', 'reg', 1], ['ES', 'stab', 2]] },
    ],
    se: [
      { n: 'Antíoco III, o Grande', y: 'c. 241–187 a.C.', ab: 'recrutador', d: 'Fez a anábase até a Índia e reconquistou o Oriente para a dinastia selêucida.', fx: [['PR', 'conq', 2], ['RF', 1]] },
      { n: 'Seleuco IV', y: 'c. 218–175 a.C.', ab: 'carisma', d: 'Reinou para pagar a indenização a Roma e recompor as finanças do reino.', fx: [['OU', 'reg', 1], ['ES', 'stab', 2]] },
    ],
    pt: [
      { n: 'Ptolomeu IV', y: 'c. 244–204 a.C.', ab: 'almirante', d: 'Venceu em Ráfia e mandou construir navios e templos colossais em Alexandria.', fx: [['NV', 1], ['MV', 25]] },
      { n: 'Sosíbio', y: '?–c. 203 a.C.', ab: 'espiao', d: 'Ministro que governava a corte de Alexandria por trás do rei, entre intrigas e acordos.', fx: [['CT', 1, 5], ['DP', 10]] },
    ],
  },
  crise: {
    ro: [
      { n: 'Galieno', y: 'c. 218–268', ab: 'recrutador', d: 'Segurou o império na pior crise e criou a cavalaria móvel que corria entre as fronteiras.', fx: [['RF', 1], ['SB', 'mil', 20]] },
      { n: 'Aureliano', y: '214–275', ab: 'tatico', d: 'O "Restaurador do Mundo": derrotou Palmira e o Império Gálico e reunificou Roma.', fx: [['PR', 'conq', 2], ['RF', 1]] },
      { n: 'Cláudio II, o Gótico', y: '214–270', ab: 'tenaz', d: 'Esmagou os godos em Naísso e devolveu a fronteira do Danúbio ao império.', fx: [['CB', 'def', 'casa', 1], ['PR', 'conq', 1]] },
    ],
    ga: [
      { n: 'Póstumo', y: '?–269', ab: 'tenaz', d: 'Governador que se proclamou imperador e defendeu o Reno por dez anos.', fx: [['CB', 'def', 'casa', 1]] },
      { n: 'Tétrico', y: '?–c. 274', ab: 'carisma', d: 'Senador da Gália que governou o império separatista até negociar com Aureliano.', fx: [['DP', 10], ['OU', 'reg', 1]] },
    ],
    pa: [
      { n: 'Zenóbia', y: 'c. 240–c. 274', ab: 'carisma', d: 'Rainha que fez de Palmira, cidade das caravanas, um império do Egito à Anatólia.', fx: [['RT', 1], ['PR', 'turn', 1]] },
      { n: 'Odenato', y: 'c. 220–267', ab: 'tatico', d: 'Senhor de Palmira que perseguiu os persas até Ctesifonte em nome de Roma.', fx: [['PR', 'conq', 2], ['RF', 1]] },
    ],
    sa: [
      { n: 'Sapor I', y: 'c. 215–270', ab: 'tatico', d: 'Rei dos reis que capturou o imperador Valeriano em Edessa.', fx: [['PR', 'conq', 1]] },
      { n: 'Cartir', y: 'séc. III', ab: 'carisma', d: 'Sumo sacerdote zoroastrista que deu ao Estado persa uma igreja oficial.', fx: [['ES', 'stab', 2]] },
    ],
    go: [
      { n: 'Cniva', y: 'séc. III', ab: 'recrutador', d: 'Rei godo que matou o imperador Décio na batalha de Abrito.', fx: [['OU', 'conq', 2]] },
      { n: 'Canabaudes', y: '?–271', ab: 'tatico', d: 'Chefe godo das invasões da Grécia, derrotado por Aureliano além do Danúbio.', fx: [['RF', 1]] },
    ],
    al: [
      { n: 'Croco', y: 'séc. III', ab: 'tatico', d: 'Rei alamano que atravessou o Reno e saqueou a Gália.', fx: [['OU', 'conq', 2]] },
      { n: 'Genobaudo', y: 'séc. III', ab: 'carisma', d: 'Rei franco que fez acordo com Roma e assentou seu povo como aliado na fronteira.', fx: [['DP', 10], ['CR', 25]] },
    ],
  },
  queda: {
    oc: [
      { n: 'Estilicão', y: 'c. 359–408', ab: 'tatico', d: 'General meio vândalo que segurou o Ocidente contra godos e invasores.', fx: [['RF', 1], ['CB', 'def', 'casa', 1]] },
      { n: 'Honório', y: '384–423', ab: 'tenaz', d: 'Imperador que se fechou em Ravena, protegida por pântanos, enquanto Roma era saqueada.', fx: [['CP', 'prod', 2], ['CB', 'def', 'hm', 1]] },
      { n: 'Gala Placídia', y: 'c. 390–450', ab: 'carisma', d: 'Princesa que foi refém dos godos, casou com Ataulfo e depois governou o Ocidente.', fx: [['DP', 10], ['ES', 'stab', 2]] },
    ],
    or: [
      { n: 'Teodósio II', y: '401–450', ab: 'tenaz', d: 'Imperador do Código Teodosiano e da universidade de Constantinopla.', fx: [['MV', 25], ['SB', 'all', 15]] },
      { n: 'Antêmio', y: '?–c. 415', ab: 'tenaz', d: 'Prefeito que ergueu as grandes muralhas terrestres de Constantinopla.', fx: [['CB', 'def', 'casa', 1], ['OB', 1]] },
      { n: 'Pulquéria', y: '399–453', ab: 'carisma', d: 'Irmã de Teodósio II, regente piedosa e firme da corte oriental.', fx: [['ES', 'stab', 2], ['DP', 10]] },
    ],
    hu: [
      { n: 'Rugila', y: '?–434', ab: 'tatico', d: 'Rei huno que cobrava tributo de Constantinopla em ouro.', fx: [['OU', 'conq', 2], ['RF', 1]] },
      { n: 'Átila', y: 'c. 406–453', ab: 'tatico', d: 'O "flagelo de Deus", que levou os hunos da Gália à Itália.', fx: [['PR', 'conq', 2], ['OU', 'conq', 1]] },
      { n: 'Uldino', y: '?–c. 412', ab: 'recrutador', d: 'Chefe huno que vendia seus cavaleiros a Roma e invadia os Bálcãs.', fx: [['RF', 2]] },
    ],
    vi: [
      { n: 'Alarico I', y: 'c. 370–410', ab: 'recrutador', d: 'Rei visigodo que saqueou Roma em 410, a primeira vez em oito séculos.', fx: [['OU', 'conq', 2], ['RF', 1]] },
      { n: 'Ataulfo', y: '?–415', ab: 'carisma', d: 'Levou os visigodos à Gália e quis unir godos e romanos casando com Gala Placídia.', fx: [['DP', 10], ['CR', 25]] },
    ],
    va: [
      { n: 'Gunderico', y: 'c. 379–428', ab: 'recrutador', d: 'Rei que cruzou o Reno congelado com vândalos e alanos e chegou à Hispânia.', fx: [['RF', 1], ['OU', 'conq', 1]] },
      { n: 'Genserico', y: 'c. 389–477', ab: 'almirante', d: 'Tomou Cartago, criou uma frota pirata e saqueou Roma em 455.', fx: [['NV', 1], ['OU', 'conq', 2]] },
    ],
    fr: [
      { n: 'Faramundo', y: 'lendário', ab: 'tenaz', d: 'Rei lendário dos francos sálios, a quem a tradição atribui as primeiras leis.', fx: [['CB', 'def', 'casa', 1]] },
      { n: 'Clódio', y: '?–c. 448', ab: 'tatico', d: 'Rei franco que tomou Cambrai e avançou até o rio Somme.', fx: [['PR', 'conq', 1], ['RF', 1]] },
    ],
    sa: [
      { n: 'Isdigerdes I', y: '?–420', ab: 'carisma', d: 'Rei dos reis tolerante, em paz com Constantinopla e protetor dos cristãos.', fx: [['DP', 10]] },
      { n: 'Vararanes V', y: '?–438', ab: 'tatico', d: 'O Bahram Gur das lendas, caçador e guerreiro, que lutou contra hunos e romanos.', fx: [['PR', 'conq', 1]] },
    ],
  },
  nap: {
    fr: [
      { n: 'Napoleão Bonaparte', y: '1769–1821', ab: 'tatico', d: 'General que virou imperador. Venceu em Austerlitz com manobras rápidas e fez da glória militar a base do regime.', fx: [['PR', 'conq', 2], ['RF', 1]] },
      { n: 'Talleyrand', y: '1754–1838', ab: 'espiao', d: 'Chanceler que serviu a todos os regimes e negociava com todas as cortes da Europa ao mesmo tempo.', fx: [['DP', 10], ['CT', 0, 5]] },
      { n: 'Lazare Carnot', y: '1753–1823', ab: 'recrutador', d: 'O "organizador da vitória": criou o recrutamento em massa que pôs a nação inteira em armas.', fx: [['RF', 2]] },
    ],
    gb: [
      { n: 'William Pitt, o Jovem', y: '1759–1806', ab: 'almirante', d: 'Primeiro-ministro que financiou as coalizões contra a França com o comércio marítimo britânico.', fx: [['ED', 'por', 'gold', 1], ['RT', 1]] },
      { n: 'Horatio Nelson', y: '1758–1805', ab: 'almirante', d: 'Almirante de Trafalgar. Garantiu à Grã-Bretanha o domínio dos mares por um século.', fx: [['NV', 1], ['PR', 'conq', 1]] },
      { n: 'Duque de Wellington', y: '1769–1852', ab: 'tenaz', d: 'Defendeu Portugal atrás das linhas de Torres Vedras e venceu em Waterloo.', fx: [['CB', 'def', 'hm', 1]] },
    ],
    at: [
      { n: 'Arquiduque Carlos', y: '1771–1847', ab: 'tenaz', d: 'Reformou o exército austríaco e deu a Napoleão a primeira derrota em campo, em Aspern.', fx: [['RF', 1], ['CB', 'def', 'casa', 1]] },
      { n: 'Metternich', y: '1773–1859', ab: 'carisma', d: 'Chanceler do equilíbrio de potências. Desenhou a Europa do Congresso de Viena.', fx: [['DP', 10], ['ES', 'stab', 2]] },
      { n: 'Francisco I', y: '1768–1835', ab: 'tenaz', d: 'Último imperador do Sacro Império. Perdeu quatro guerras para a França e manteve o trono.', fx: [['CP', 'pre', 2], ['ES', 'ww', 50]] },
    ],
    pr: [
      { n: 'Frederico Guilherme III', y: '1770–1840', ab: 'recrutador', d: 'Rei hesitante que, depois de Jena, chamou o povo às armas na mobilização de 1813.', fx: [['RF', 2]] },
      { n: 'Scharnhorst', y: '1755–1813', ab: 'tatico', d: 'Criou o estado-maior moderno e a reserva treinada que reergueu o exército prussiano.', fx: [['SB', 'mil', 20], ['RF', 1]] },
      { n: 'Barão vom Stein', y: '1757–1831', ab: 'carisma', d: 'Aboliu a servidão, deu autonomia às cidades e reformou o Estado prussiano.', fx: [['GV', 'anar', 1], ['CR', 25]] },
    ],
    ru: [
      { n: 'Alexandre I', y: '1777–1825', ab: 'carisma', d: 'Czar que derrotou Napoleão e foi o grande árbitro do Congresso de Viena.', fx: [['DP', 10], ['ES', 'stab', 2]] },
      { n: 'Mikhail Kutuzov', y: '1745–1813', ab: 'tenaz', d: 'Recuou até Moscou em 1812 e deixou o inverno e a distância destruírem o invasor.', fx: [['CB', 'def', 'casa', 1], ['ES', 'ww', 50]] },
      { n: 'Mikhail Speransky', y: '1772–1839', ab: 'tatico', d: 'Conselheiro que escreveu o plano de reforma do Estado russo e organizou suas leis.', fx: [['SB', 'all', 15], ['GV', 'anar', 1]] },
    ],
    ot: [
      { n: 'Selim III', y: '1761–1808', ab: 'recrutador', d: 'Sultão do Nizam-ı Cedid, o exército de novo modelo treinado à europeia.', fx: [['SB', 'mil', 20], ['RF', 1]] },
      { n: 'Mahmud II', y: '1785–1839', ab: 'carisma', d: 'Desfez os janízaros e abriu as reformas que levariam ao Tanzimat.', fx: [['GV', 'anar', 1], ['OB', 1]] },
    ],
    es: [
      { n: 'Manuel Godoy', y: '1767–1851', ab: 'espiao', d: 'Valido do rei Carlos IV, mestre das intrigas de corte e das alianças trocadas.', fx: [['CT', 1, 5]] },
      { n: 'Francisco Castaños', y: '1758–1852', ab: 'tenaz', d: 'General das juntas que venceu em Bailén, a primeira derrota de um exército napoleônico.', fx: [['CB', 'def', 'casa', 1], ['ES', 'stab', 2]] },
    ],
  },
};
