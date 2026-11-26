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
  cinzas: {
    va: [
      { n: 'Lorde Edrik Valkor', y: 'ano 299', ab: 'tenaz', d: 'Senhor da fortaleza do norte, acostumado a invernos longos e cercos mais longos ainda.', fx: [['CB', 'def', 'casa', 1], ['ES', 'ww', 50]] },
      { n: 'Sor Bram Valkor', y: 'ano 299', ab: 'tatico', d: 'Irmão mais novo de Edrik, cavaleiro que prefere atacar antes que a neve feche as estradas.', fx: [['CB', 'atk', '', 1]] },
    ],
    au: [
      { n: 'Rainha Severa Aurelian', y: 'ano 299', ab: 'espiao', d: 'Rainha da capital dourada, que governa com uma rede de informantes em cada corte.', fx: [['CT', 1, 5], ['DP', 10]] },
      { n: 'Mestre Corvin Aurelian', y: 'ano 299', ab: 'carisma', d: 'Tesoureiro da casa, que mede o poder em moedas e rotas.', fx: [['RT', 1], ['OU', 'reg', 1]] },
    ],
    so: [
      { n: 'Príncipe Taren Solvar', y: 'ano 299', ab: 'carisma', d: 'Herdeiro querido das planícies do sul, celeiro do reino.', fx: [['ES', 'stab', 2], ['CR', 25]] },
      { n: 'Princesa Lira Solvar', y: 'ano 299', ab: 'carisma', d: 'Irmã de Taren, que cuida das colheitas e das feiras das planícies.', fx: [['TR', 'pc', 'food', 1], ['RT', 1]] },
    ],
    mo: [
      { n: 'Lady Isolde Morvane', y: 'ano 299', ab: 'recrutador', d: 'Senhora dos pântanos, capaz de juntar uma hoste de camponeses em uma semana.', fx: [['RF', 2]] },
      { n: 'Velho Hadric Morvane', y: 'ano 299', ab: 'tenaz', d: 'Tio de Isolde, que conhece cada trilha das colinas da casa.', fx: [['CB', 'def', 'hm', 1]] },
    ],
    kr: [
      { n: 'Rei-Corsário Drogan Krag', y: 'ano 299', ab: 'almirante', d: 'Senhor das ilhas, que vive dos saques nas costas do continente.', fx: [['NV', 1], ['OU', 'conq', 2]] },
      { n: 'Sigrun Krag, Mãe-das-Marés', y: 'ano 299', ab: 'carisma', d: 'Matriarca que faz das ilhas um porto de comércio em vez de pirataria.', fx: [['ED', 'por', 'gold', 1], ['RT', 1]] },
    ],
  },
  runas: {
    el: [
      { n: 'Rainha Elanthil', y: 'Era das Runas', ab: 'carisma', d: 'Rainha antiga de Sylvaren, guardiã dos saberes das florestas.', fx: [['SB', 'all', 15], ['ES', 'stab', 2]] },
      { n: 'Guardião Faelor', y: 'Era das Runas', ab: 'tenaz', d: 'Arqueiro que vigia as fronteiras da floresta.', fx: [['CB', 'def', 'casa', 1], ['TR', 'f', 'prod', 1]] },
    ],
    an: [
      { n: 'Rei Thorgar Barba-de-Ferro', y: 'Era das Runas', ab: 'tenaz', d: 'Rei de Pedrafunda, cujas portas de pedra nunca caíram.', fx: [['CB', 'def', 'hm', 1], ['TR', 'hm', 'prod', 1]] },
      { n: 'Mestra-Forja Brunna', y: 'Era das Runas', ab: 'recrutador', d: 'A maior construtora dos anões, que ergue salões em meses.', fx: [['OB', 1], ['MV', 25]] },
    ],
    or: [
      { n: 'Grão-Chefe Urzag', y: 'Era das Runas', ab: 'recrutador', d: 'Chefe que uniu os clãs da Garra Rubra pela força.', fx: [['RF', 2]] },
      { n: 'Mog-Thar, o Saqueador', y: 'Era das Runas', ab: 'tatico', d: 'Chefe de guerra que vive do que toma das terras vizinhas.', fx: [['OU', 'conq', 2], ['PR', 'conq', 1]] },
    ],
    hu: [
      { n: 'Rei Aldric', y: 'Era das Runas', ab: 'tatico', d: 'Rei de Altamar, cavaleiro e mercador, senhor dos portos do oeste.', fx: [['RF', 1], ['RT', 1]] },
      { n: 'Rainha-Regente Maelis', y: 'Era das Runas', ab: 'carisma', d: 'Regente que mantém Altamar em paz com elfos e anões.', fx: [['DP', 10], ['ES', 'stab', 2]] },
    ],
    ar: [
      { n: 'Arquimaga Velyra', y: 'Era das Runas', ab: 'espiao', d: 'Mestra da Ordem Arcana, que lê segredos nas runas.', fx: [['SB', 'all', 15], ['CT', 0, 5]] },
      { n: 'Sábio Orren', y: 'Era das Runas', ab: 'carisma', d: 'Velho arquiteto das torres da Ordem.', fx: [['MV', 25], ['SB', 'all', 15]] },
    ],
  },
  viking: {
    no: [
      { n: 'Haroldo Cabelo Belo', y: 'c. 850–c. 932', ab: 'almirante', d: 'Venceu em Hafrsfjord e reuniu a Noruega num só reino; quem não aceitou partiu pelo mar.', fx: [['NV', 1], ['PR', 'conq', 1]] },
      { n: 'Érico Machado Sangrento', y: 'c. 885–954', ab: 'tatico', d: 'Filho de Haroldo, rei na Noruega e depois em York, famoso pela violência das campanhas.', fx: [['CB', 'atk', '', 1]] },
    ],
    da: [
      { n: 'Ragnar Lothbrok', y: 'séc. IX', ab: 'tatico', d: 'Chefe das sagas que subiu o Sena e cobrou de Paris um resgate em prata.', fx: [['OU', 'conq', 2], ['NV', 1]] },
      { n: 'Ivar, o Sem-Ossos', y: '?–c. 873', ab: 'tatico', d: 'Comandou o Grande Exército Pagão que tomou York e a Ânglia Oriental.', fx: [['PR', 'conq', 2], ['RF', 1]] },
      { n: 'Gutrum', y: '?–890', ab: 'carisma', d: 'Depois de perder para Alfredo, aceitou o batismo e assentou os dinamarqueses no Danelaw.', fx: [['CR', 25], ['DP', 10]] },
    ],
    sv: [
      { n: 'Rurik', y: '?–879', ab: 'recrutador', d: 'Varegue chamado a governar Novgorod, origem da dinastia da Rus.', fx: [['RT', 1], ['RF', 1]] },
      { n: 'Olegue de Novgorod', y: '?–c. 912', ab: 'tatico', d: 'Tomou Kiev, uniu a rota dos varegues aos gregos e levou a frota até Constantinopla.', fx: [['PR', 'conq', 1], ['OU', 'conq', 1]] },
    ],
    we: [
      { n: 'Alfredo, o Grande', y: '849–899', ab: 'carisma', d: 'Resistiu aos vikings com burhs fortificados e uma frota, e fez traduzir livros para o inglês.', fx: [['CB', 'def', 'casa', 1], ['SB', 'all', 15]] },
      { n: 'Eduardo, o Velho', y: 'c. 874–924', ab: 'recrutador', d: 'Filho de Alfredo, multiplicou os burhs e retomou o Danelaw ao sul do Humber.', fx: [['RF', 1], ['OB', 1]] },
    ],
    fo: [
      { n: 'Carlos, o Calvo', y: '823–877', ab: 'tenaz', d: 'Mandou fortificar pontes nos rios para barrar os barcos vikings.', fx: [['CB', 'def', 'casa', 1], ['OB', 1]] },
      { n: 'Roberto, o Forte', y: 'c. 830–866', ab: 'tatico', d: 'Marquês que defendeu o vale do Loire contra bretões e vikings.', fx: [['RF', 1], ['PR', 'conq', 1]] },
      { n: 'Odo de Paris', y: 'c. 857–898', ab: 'tenaz', d: 'Conde que defendeu Paris no grande cerco de 885 e acabou eleito rei.', fx: [['CP', 'pre', 2], ['ES', 'ww', 50]] },
    ],
    fe: [
      { n: 'Luís, o Germânico', y: 'c. 806–876', ab: 'recrutador', d: 'Neto de Carlos Magno, primeiro rei da Francia Oriental, o núcleo da futura Alemanha.', fx: [['RF', 2]] },
      { n: 'Arnulfo da Caríntia', y: 'c. 850–899', ab: 'tatico', d: 'Derrotou os vikings na batalha do Dyle e foi coroado imperador em Roma.', fx: [['CB', 'atk', '', 1]] },
    ],
  },
  mongol: {
    mo: [
      { n: 'Gêngis Khan', y: 'c. 1162–1227', ab: 'tatico', d: 'Uniu as tribos da estepe e criou o maior império contíguo da história.', fx: [['PR', 'conq', 2], ['RF', 1]] },
      { n: 'Subutai', y: '1175–1248', ab: 'tatico', d: 'General de campanhas a milhares de quilômetros, do norte da China à Hungria.', fx: [['CB', 'atk', '', 1], ['AB', 1]] },
      { n: 'Yelü Chucai', y: '1190–1244', ab: 'carisma', d: 'Conselheiro que convenceu os khans a cobrar impostos em vez de arrasar as cidades.', fx: [['OU', 'reg', 1], ['SB', 'all', 15]] },
    ],
    jin: [
      { n: 'Wanyan Yongji', y: '?–1213', ab: 'tenaz', d: 'Imperador Jin que enfrentou a primeira grande invasão mongol.', fx: [['CB', 'def', 'casa', 1]] },
      { n: 'Imperador Xuanzong', y: '1163–1224', ab: 'tenaz', d: 'Levou a corte para Kaifeng, atrás do rio Amarelo, e manteve a dinastia de pé.', fx: [['ES', 'ww', 50], ['CP', 'prod', 2]] },
    ],
    song: [
      { n: 'Imperador Ningzong', y: '1168–1224', ab: 'recrutador', d: 'Reinou sobre o sul rico da China, com suas cidades, canais e exércitos pagos.', fx: [['RF', 2]] },
      { n: 'Han Tuozhou', y: '1152–1207', ab: 'tatico', d: 'Chanceler que lançou a expedição para retomar o norte dos Jin.', fx: [['SB', 'mil', 20], ['RF', 1]] },
      { n: 'Shi Miyuan', y: '1164–1233', ab: 'carisma', d: 'Chanceler por 26 anos, que fez a paz e cuidou do comércio e das finanças.', fx: [['RT', 1], ['OU', 'reg', 1]] },
    ],
    kh: [
      { n: 'Maomé II', y: '?–1220', ab: 'recrutador', d: 'Xá que ergueu um império da Ásia Central à Pérsia e provocou Gêngis Khan.', fx: [['RF', 2]] },
      { n: 'Jalal al-Din', y: '?–1231', ab: 'tatico', d: 'Filho de Maomé II, lutou contra os mongóis do Indo ao Cáucaso.', fx: [['CB', 'atk', '', 1], ['PR', 'conq', 1]] },
    ],
    ab: [
      { n: 'Al-Nasir', y: '1158–1225', ab: 'carisma', d: 'Califa que devolveu poder ao califado com alianças e as irmandades da futuwwa.', fx: [['ES', 'stab', 2], ['DP', 10]] },
      { n: 'Al-Mustansir', y: '1192–1242', ab: 'carisma', d: 'Fundou em Bagdá a Mustansiriya, uma das grandes escolas do mundo islâmico.', fx: [['SB', 'all', 15], ['MV', 25]] },
    ],
    ay: [
      { n: 'Al-Adil', y: '1145–1218', ab: 'carisma', d: 'Irmão de Saladino que reuniu o Egito e a Síria sob uma só mão.', fx: [['DP', 10], ['ES', 'stab', 2]] },
      { n: 'Al-Kamil', y: 'c. 1177–1238', ab: 'carisma', d: 'Sultão do Egito que negociou Jerusalém com Frederico II e cuidou das terras do Nilo.', fx: [['RT', 1], ['TR', 'pc', 'food', 1]] },
    ],
    rus: [
      { n: 'Vsevolod Grande Ninho', y: '1154–1212', ab: 'recrutador', d: 'Grão-príncipe de Vladimir, pai de muitos filhos e senhor do nordeste da Rus.', fx: [['RF', 2]] },
      { n: 'Mstislav, o Ousado', y: '?–1228', ab: 'tatico', d: 'Príncipe guerreiro de Novgorod e da Galícia, que lutou no rio Kalka.', fx: [['CB', 'atk', '', 1]] },
    ],
    de: [
      { n: 'Iltutmish', y: '?–1236', ab: 'recrutador', d: 'Consolidou o Sultanato de Délhi e terminou o Qutb Minar.', fx: [['RF', 1], ['OB', 1]] },
      { n: 'Qutb al-Din Aibak', y: '?–1210', ab: 'tatico', d: 'General-escravo que fundou o sultanato e começou o Qutb Minar.', fx: [['PR', 'conq', 2]] },
      { n: 'Razia Sultana', y: '1205–1240', ab: 'carisma', d: 'Primeira mulher a reinar em Délhi, preparada pelo pai para o trono.', fx: [['ES', 'stab', 2], ['DP', 10]] },
    ],
  },
  cruz: {
    en: [
      { n: 'Ricardo Coração de Leão', y: '1157–1199', ab: 'tatico', d: 'Rei cruzado que venceu em Arsuf e Jafa, mas nunca entrou em Jerusalém.', fx: [['PR', 'conq', 2], ['NV', 1]] },
      { n: 'Leonor da Aquitânia', y: 'c. 1122–1204', ab: 'carisma', d: 'Duquesa da Aquitânia, rainha da França e da Inglaterra, que governou na ausência do filho.', fx: [['DP', 10], ['ES', 'stab', 2]] },
      { n: 'Guilherme Marshal', y: 'c. 1146–1219', ab: 'tenaz', d: 'O cavaleiro que serviu a quatro reis e salvou a coroa inglesa em 1217.', fx: [['CB', 'def', 'casa', 1], ['RF', 1]] },
    ],
    fr: [
      { n: 'Filipe II Augusto', y: '1165–1223', ab: 'recrutador', d: 'Criou os bailios, encheu o tesouro real e tirou a Normandia dos angevinos.', fx: [['RF', 1], ['OU', 'reg', 1]] },
      { n: 'Guérin de Senlis', y: 'c. 1157–1227', ab: 'tatico', d: 'Bispo e conselheiro que arrumou as linhas francesas na vitória de Bouvines.', fx: [['CB', 'atk', '', 1]] },
    ],
    hre: [
      { n: 'Frederico Barbarossa', y: 'c. 1122–1190', ab: 'tenaz', d: 'Imperador que lutou nas cidades da Itália e morreu a caminho da Terceira Cruzada.', fx: [['PR', 'turn', 1], ['RF', 1]] },
      { n: 'Henrique VI', y: '1165–1197', ab: 'recrutador', d: 'Filho de Barbarossa, cobrou o resgate de Ricardo e tomou a Sicília.', fx: [['OU', 'conq', 2], ['RF', 1]] },
      { n: 'Henrique, o Leão', y: '1129–1195', ab: 'carisma', d: 'Duque da Saxônia e da Baviera que fundou Munique e fez crescer Lübeck.', fx: [['RT', 1], ['CR', 25]] },
    ],
    ay: [
      { n: 'Saladino', y: '1137–1193', ab: 'carisma', d: 'Sultão que retomou Jerusalém em 1187, respeitado até pelos inimigos.', fx: [['ES', 'stab', 2], ['PR', 'conq', 1]] },
      { n: 'Al-Adil', y: '1145–1218', ab: 'carisma', d: 'Irmão e negociador de Saladino nas conversas com Ricardo.', fx: [['DP', 10], ['OU', 'reg', 1]] },
      { n: 'Taqi al-Din', y: '?–1191', ab: 'tatico', d: 'Sobrinho de Saladino, comandante da ala que decidia as batalhas.', fx: [['CB', 'atk', '', 1]] },
    ],
    bz: [
      { n: 'Isaac II Ângelo', y: 'c. 1156–1204', ab: 'tenaz', d: 'Imperador que manteve Constantinopla entre cruzados, búlgaros e turcos.', fx: [['CB', 'def', 'casa', 1]] },
      { n: 'Nicetas Coniates', y: 'c. 1155–1217', ab: 'carisma', d: 'Alto funcionário e historiador da corte, que conhecia o tesouro e as províncias.', fx: [['SB', 'all', 15], ['OU', 'reg', 1]] },
    ],
    rum: [
      { n: 'Kilij Arslan II', y: '1113–1192', ab: 'recrutador', d: 'Sultão que venceu os bizantinos em Miriocéfalo e firmou os turcos na Anatólia.', fx: [['RF', 2]] },
      { n: 'Kaikhusraw I', y: '?–1211', ab: 'tatico', d: 'Tomou o porto de Antália e abriu o sultanato ao comércio do Mediterrâneo.', fx: [['NV', 1], ['RT', 1]] },
    ],
    si: [
      { n: 'Tancredo de Lecce', y: '?–1194', ab: 'almirante', d: 'Último rei normando da Sicília, defendeu a ilha contra o imperador.', fx: [['NV', 1], ['CB', 'def', 'casa', 1]] },
      { n: 'Margarito de Brindisi', y: 'c. 1149–1197', ab: 'almirante', d: 'Almirante chamado de "novo Netuno", senhor das frotas normandas.', fx: [['NV', 1], ['OU', 'conq', 2]] },
    ],
    alm: [
      { n: 'Iacube Almançor', y: 'c. 1160–1199', ab: 'recrutador', d: 'Califa que venceu em Alarcos e ergueu a Giralda e a Kutubia.', fx: [['RF', 1], ['MV', 25]] },
      { n: 'Averróis', y: '1126–1198', ab: 'carisma', d: 'Cádi e médico da corte almóada, o grande comentador de Aristóteles.', fx: [['SB', 'all', 15]] },
    ],
  },
  precol: {
    az: [
      { n: 'Axayácatl', y: 'c. 1449–1481', ab: 'recrutador', d: 'Tlatoani que tomou Tlatelolco e levou a guerra aos vales vizinhos.', fx: [['RF', 1], ['PR', 'conq', 1]] },
      { n: 'Tlacaelel', y: '1397–1487', ab: 'carisma', d: 'Conselheiro de vários tlatoanis, que reformou o Estado e a religião mexica.', fx: [['ES', 'stab', 2], ['GV', 'anar', 1]] },
      { n: 'Nezahualcóyotl', y: '1402–1472', ab: 'carisma', d: 'Rei-poeta de Texcoco, construtor de aquedutos e diques no lago.', fx: [['MV', 25], ['SB', 'all', 15]] },
    ],
    pu: [
      { n: 'Tzitzipandácuare', y: '?–1479', ab: 'tenaz', d: 'Cazonci que derrotou o exército de Axayácatl e barrou os mexicas.', fx: [['CB', 'def', 'casa', 1], ['RF', 1]] },
      { n: 'Tariácuri', y: 'séc. XIV', ab: 'carisma', d: 'Fundador do reino purépecha em torno do lago de Pátzcuaro.', fx: [['ES', 'stab', 2], ['OU', 'reg', 1]] },
    ],
    mx: [
      { n: 'Cosijoeza', y: '?–1529', ab: 'tenaz', d: 'Rei zapoteca que resistiu aos mexicas na fortaleza de Guiengola.', fx: [['CB', 'def', 'hm', 1]] },
      { n: 'Oito Cervo Garra de Jaguar', y: '1063–1115', ab: 'tatico', d: 'Senhor mixteca dos códices, que uniu dezenas de cidades pela guerra e por casamentos.', fx: [['PR', 'conq', 2]] },
    ],
    my: [
      { n: 'Senhor de Maní', y: 'séc. XV', ab: 'carisma', d: 'Chefe dos Xiu, que guardavam a escrita e o calendário depois da queda de Mayapán.', fx: [['SB', 'all', 15]] },
      { n: 'Senhor de Sotuta', y: 'séc. XV', ab: 'tenaz', d: 'Chefe dos Cocom, rivais dos Xiu, que defendiam suas terras com ferocidade.', fx: [['CB', 'def', 'casa', 1]] },
    ],
    in: [
      { n: 'Pachacútec', y: 'c. 1418–1471', ab: 'recrutador', d: 'Transformou Cusco num império, com estradas e depósitos por todo o Tawantinsuyu.', fx: [['RF', 1], ['AB', 1]] },
      { n: 'Túpac Yupanqui', y: 'c. 1441–1493', ab: 'tatico', d: 'Filho de Pachacútec, levou o império do Equador ao Chile.', fx: [['PR', 'conq', 2], ['RF', 1]] },
    ],
    ch: [
      { n: 'Minchançaman', y: 'séc. XV', ab: 'tenaz', d: 'Último grande rei de Chimor, senhor dos canais que regavam o deserto da costa.', fx: [['TR', 'd', 'food', 1], ['OB', 1]] },
      { n: 'Tacaynamo', y: 'lendário', ab: 'carisma', d: 'Fundador lendário de Chan Chan, que chegou pelo mar numa jangada.', fx: [['CP', 'gold', 2]] },
    ],
    mu: [
      { n: 'Zipa Saguamanchica', y: '?–1490', ab: 'carisma', d: 'Zipa de Bacatá, senhor das minas de sal e do comércio de esmeraldas.', fx: [['RT', 1], ['ES', 'stab', 2]] },
      { n: 'Zaque Michuá', y: '?–1490', ab: 'tenaz', d: 'Zaque de Hunza, rival do zipa, que defendeu as terras altas do norte.', fx: [['CB', 'def', 'hm', 1]] },
    ],
    tu: [
      { n: 'Morubixaba Tupinambá', y: 'séc. XV', ab: 'recrutador', d: 'Chefe de guerra das aldeias do litoral, que saíam em canoas de dezenas de remadores.', fx: [['RF', 1], ['NV', 1]] },
      { n: 'Pajé Tupinambá', y: 'séc. XV', ab: 'carisma', d: 'Líder espiritual das aldeias, que guiava as festas e as migrações em busca da Terra sem Mal.', fx: [['ES', 'stab', 2], ['CR', 25]] },
    ],
  },
  sengoku: {
    oda: [
      { n: 'Oda Nobunaga', y: '1534–1582', ab: 'tatico', d: 'Daimiô que adotou arcabuzes em massa, abriu mercados livres e começou a unificação.', fx: [['SB', 'mil', 20], ['RT', 1]] },
      { n: 'Toyotomi Hideyoshi', y: '1537–1598', ab: 'recrutador', d: 'De carregador de sandálias a senhor do Japão, construtor de castelos e cadastros.', fx: [['OB', 1], ['OU', 'reg', 1]] },
      { n: 'Shibata Katsuie', y: 'c. 1522–1583', ab: 'tenaz', d: 'O general mais velho de Nobunaga, conhecido pela bravura.', fx: [['CB', 'atk', '', 1]] },
    ],
    ima: [
      { n: 'Imagawa Yoshimoto', y: '1519–1560', ab: 'recrutador', d: 'Senhor de Suruga e Tōtōmi, com leis próprias e a maior força do Tōkaidō.', fx: [['RF', 1], ['OU', 'reg', 1]] },
      { n: 'Taigen Sessai', y: '1496–1555', ab: 'carisma', d: 'Monge e estrategista dos Imagawa, que costurou a aliança com Takeda e Hōjō.', fx: [['DP', 10], ['SB', 'all', 15]] },
    ],
    tak: [
      { n: 'Takeda Shingen', y: '1521–1573', ab: 'tatico', d: 'O "Tigre de Kai", senhor da cavalaria e dos diques contra as cheias.', fx: [['CR', 25]] },
      { n: 'Yamamoto Kansuke', y: '?–1561', ab: 'espiao', d: 'Estrategista de Shingen, cheio de planos e informantes.', fx: [['CT', 1, 5]] },
    ],
    ue: [
      { n: 'Uesugi Kenshin', y: '1530–1578', ab: 'carisma', d: 'O "Dragão de Echigo", devoto de Bishamon e rival de Shingen em Kawanakajima.', fx: [['PR', 'conq', 1], ['ES', 'stab', 2]] },
      { n: 'Uesugi Kagekatsu', y: '1556–1623', ab: 'tenaz', d: 'Herdeiro de Kenshin, que manteve o clã de pé nas montanhas de Echigo.', fx: [['CB', 'def', 'hm', 1]] },
    ],
    ho: [
      { n: 'Hōjō Ujiyasu', y: '1515–1571', ab: 'tenaz', d: 'Senhor de Odawara, reformou os impostos e resistiu aos cercos de Kenshin e Shingen.', fx: [['CB', 'def', 'casa', 1], ['OU', 'reg', 1]] },
      { n: 'Hōjō Ujimasa', y: '1538–1590', ab: 'tenaz', d: 'Ampliou Odawara até virar a maior fortaleza do leste.', fx: [['CP', 'prod', 2]] },
    ],
    mi: [
      { n: 'Miyoshi Nagayoshi', y: '1522–1564', ab: 'recrutador', d: 'Dominou Quioto e o porto de Sakai antes de Nobunaga.', fx: [['RT', 1], ['RF', 1]] },
      { n: 'Matsunaga Hisahide', y: '1508–1577', ab: 'espiao', d: 'Vassalo dos Miyoshi, famoso pelas traições e pela astúcia.', fx: [['CT', 1, 5], ['OU', 'conq', 1]] },
    ],
    mor: [
      { n: 'Mōri Motonari', y: '1497–1571', ab: 'espiao', d: 'Cresceu de um pequeno clã ao domínio do oeste com alianças, intrigas e a vitória em Itsukushima.', fx: [['CT', 0, 5], ['NV', 1]] },
      { n: 'Kobayakawa Takakage', y: '1533–1597', ab: 'almirante', d: 'Filho de Motonari, comandava as frotas do mar Interior.', fx: [['NV', 1], ['DP', 10]] },
    ],
    ot: [
      { n: 'Ōtomo Sōrin', y: '1530–1587', ab: 'almirante', d: 'Daimiô cristão de Bungo, que comerciava com os portugueses e comprou canhões.', fx: [['RT', 1], ['SB', 'mil', 20]] },
      { n: 'Tachibana Dōsetsu', y: '1513–1585', ab: 'tenaz', d: 'General dos Ōtomo, invicto em dezenas de batalhas.', fx: [['CB', 'def', 'casa', 1]] },
    ],
    shi: [
      { n: 'Shimazu Yoshihisa', y: '1533–1611', ab: 'tatico', d: 'Senhor de Satsuma que quase dominou toda a ilha de Kyūshū.', fx: [['PR', 'conq', 1]] },
      { n: 'Shimazu Yoshihiro', y: '1535–1619', ab: 'tenaz', d: 'Irmão de Yoshihisa, guerreiro temido em Kyūshū e na Coreia.', fx: [['CB', 'def', 'hm', 1]] },
    ],
    cho: [
      { n: 'Chōsokabe Motochika', y: '1539–1599', ab: 'recrutador', d: 'Unificou Shikoku com camponeses-soldados prontos para pegar em armas.', fx: [['RF', 1], ['CR', 25]] },
      { n: 'Chōsokabe Kunichika', y: '1504–1560', ab: 'tenaz', d: 'Pai de Motochika, reergueu o clã a partir do castelo de Okō.', fx: [['CB', 'def', 'casa', 1]] },
    ],
  },
  sec: {
    un: [
      { n: 'Abraham Lincoln', y: '1809–1865', ab: 'recrutador', d: 'Presidente que manteve a União, chamou voluntários aos milhares e aboliu a escravidão.', fx: [['RF', 1], ['ES', 'stab', 2]] },
      { n: 'Ulysses S. Grant', y: '1822–1885', ab: 'tatico', d: 'General de Vicksburg e da campanha que encurralou Lee na Virgínia.', fx: [['RF', 1], ['CB', 'atk', '', 1]] },
      { n: 'William T. Sherman', y: '1820–1891', ab: 'tatico', d: 'Tomou Atlanta e marchou até o mar, vivendo da terra e destruindo a logística do Sul.', fx: [['OU', 'conq', 2], ['AB', 1]] },
    ],
    cs: [
      { n: 'Robert E. Lee', y: '1807–1870', ab: 'tatico', d: 'Comandante do Exército da Virgínia do Norte, vitorioso em Fredericksburg e Chancellorsville.', fx: [['CB', 'def', 'casa', 1], ['PR', 'conq', 1]] },
      { n: 'Stonewall Jackson', y: '1824–1863', ab: 'tatico', d: 'General das marchas rápidas no vale do Shenandoah.', fx: [['CB', 'atk', '', 1]] },
      { n: 'Jefferson Davis', y: '1808–1889', ab: 'recrutador', d: 'Presidente da Confederação, que impôs o primeiro alistamento obrigatório do país.', fx: [['RF', 2]] },
    ],
  },
  reg: {
    im: [
      { n: 'Regente Feijó', y: '1784–1843', ab: 'recrutador', d: 'Padre e regente que criou a Guarda Nacional para enfrentar as revoltas.', fx: [['RF', 2]] },
      { n: 'Luís Alves de Lima e Silva', y: '1803–1880', ab: 'tatico', d: 'O futuro Duque de Caxias, que venceu a Balaiada e negociou a paz com os farrapos.', fx: [['CB', 'atk', '', 1], ['DP', 10]] },
      { n: 'Araújo Lima', y: '1793–1870', ab: 'carisma', d: 'Regente do Regresso, que recentralizou o poder no Rio de Janeiro.', fx: [['ES', 'stab', 2], ['GV', 'anar', 1]] },
    ],
    fa: [
      { n: 'Bento Gonçalves', y: '1788–1847', ab: 'tatico', d: 'Estancieiro e coronel que proclamou a República Rio-Grandense.', fx: [['RF', 1], ['CB', 'atk', '', 1]] },
      { n: 'Giuseppe Garibaldi', y: '1807–1882', ab: 'almirante', d: 'Levou lanchões por terra sobre rodas até o mar e tomou Laguna.', fx: [['NV', 1], ['PR', 'conq', 1]] },
      { n: 'David Canabarro', y: '1796–1867', ab: 'tenaz', d: 'Comandante farroupilha nos últimos anos da guerra, que assinou a paz de Ponche Verde.', fx: [['CB', 'def', 'casa', 1]] },
    ],
    ca: [
      { n: 'Eduardo Angelim', y: '1814–1882', ab: 'carisma', d: 'Jovem líder cabano que governou Belém aos 21 anos.', fx: [['ES', 'stab', 2], ['RF', 1]] },
      { n: 'Francisco Vinagre', y: 'séc. XIX', ab: 'recrutador', d: 'Lavrador que liderou os cabanos e chegou a presidente da província.', fx: [['RF', 2]] },
    ],
    ba: [
      { n: 'Negro Cosme', y: '?–1842', ab: 'recrutador', d: 'Líder de um quilombo de milhares de pessoas, que juntou os escravizados à revolta.', fx: [['RF', 2]] },
      { n: 'Raimundo Gomes', y: 'séc. XIX', ab: 'tatico', d: 'Vaqueiro que começou a Balaiada ao libertar o irmão da cadeia de Manga.', fx: [['CB', 'atk', '', 1]] },
      { n: 'Manuel Balaio', y: '?–1839', ab: 'tenaz', d: 'Fazedor de balaios que deu nome à revolta e lutou pela honra das filhas.', fx: [['CB', 'def', 'casa', 1]] },
    ],
    sa: [
      { n: 'Francisco Sabino', y: '1796–1846', ab: 'tenaz', d: 'Médico e jornalista que proclamou a República Bahiense em Salvador.', fx: [['CB', 'def', 'casa', 1]] },
      { n: 'Daniel Gomes de Freitas', y: 'séc. XIX', ab: 'recrutador', d: 'Oficial que comandou as forças da Sabinada na defesa de Salvador.', fx: [['RF', 1]] },
    ],
  },
  gg: {
    de: [
      { n: 'Guilherme II', y: '1859–1941', ab: 'recrutador', d: 'Imperador que quis uma frota para rivalizar com a britânica e levou a Alemanha à guerra.', fx: [['RF', 1], ['NV', 1]] },
      { n: 'Paul von Hindenburg', y: '1847–1934', ab: 'tenaz', d: 'Marechal de Tannenberg, que barrou a invasão russa da Prússia Oriental.', fx: [['CB', 'def', 'casa', 1], ['PR', 'conq', 1]] },
      { n: 'Erich Ludendorff', y: '1865–1937', ab: 'tatico', d: 'Estrategista das táticas de infiltração e da ofensiva de primavera de 1918.', fx: [['SB', 'mil', 20], ['RF', 1]] },
    ],
    ah: [
      { n: 'Francisco José', y: '1830–1916', ab: 'tenaz', d: 'Imperador por 68 anos, símbolo que mantinha unido um império de muitos povos.', fx: [['ES', 'stab', 2], ['CB', 'def', 'hm', 1]] },
      { n: 'Conrad von Hötzendorf', y: '1852–1925', ab: 'tatico', d: 'Chefe do estado-maior, defensor da guerra contra a Sérvia.', fx: [['RF', 1]] },
      { n: 'Carlos I', y: '1887–1922', ab: 'carisma', d: 'Último imperador, que tentou uma paz em separado.', fx: [['DP', 10], ['ES', 'ww', 50]] },
    ],
    ot: [
      { n: 'Enver Paxá', y: '1881–1922', ab: 'recrutador', d: 'Ministro da Guerra que pôs o império na guerra ao lado da Alemanha.', fx: [['RF', 2]] },
      { n: 'Mustafa Kemal', y: '1881–1938', ab: 'tenaz', d: 'Comandante que segurou Galípoli contra o desembarque aliado.', fx: [['CB', 'def', 'casa', 1], ['ES', 'stab', 2]] },
    ],
    fr: [
      { n: 'Joseph Joffre', y: '1852–1931', ab: 'tenaz', d: 'Comandante do Marne, que levou reforços à frente até de táxi.', fx: [['CB', 'def', 'casa', 1], ['AB', 1]] },
      { n: 'Georges Clemenceau', y: '1841–1929', ab: 'carisma', d: 'O "Tigre", primeiro-ministro que sustentou a França até a vitória.', fx: [['ES', 'ww', 50], ['ES', 'stab', 2]] },
      { n: 'Ferdinand Foch', y: '1851–1929', ab: 'tatico', d: 'Comandante supremo aliado na contraofensiva final de 1918.', fx: [['CB', 'atk', '', 1]] },
    ],
    uk: [
      { n: 'Winston Churchill', y: '1874–1965', ab: 'almirante', d: 'Primeiro Lorde do Almirantado, que apoiou os primeiros tanques.', fx: [['NV', 1], ['SB', 'mil', 20]] },
      { n: 'David Lloyd George', y: '1863–1945', ab: 'carisma', d: 'Ministro das Munições e depois primeiro-ministro da economia de guerra.', fx: [['OB', 1], ['ES', 'stab', 2]] },
      { n: 'Douglas Haig', y: '1861–1928', ab: 'recrutador', d: 'Comandante britânico na França, do Somme aos Cem Dias de 1918.', fx: [['RF', 2]] },
    ],
    ru: [
      { n: 'Nicolau II', y: '1868–1918', ab: 'recrutador', d: 'Último czar, que mobilizou o maior exército da guerra.', fx: [['RF', 2]] },
      { n: 'Alexei Brusilov', y: '1853–1926', ab: 'tatico', d: 'General da ofensiva de 1916, a maior vitória russa da guerra.', fx: [['CB', 'atk', '', 1]] },
      { n: 'Grão-duque Nicolau', y: '1856–1929', ab: 'tenaz', d: 'Primeiro comandante supremo russo, respeitado pelas tropas.', fx: [['CB', 'def', 'casa', 1], ['RF', 1]] },
    ],
    rs: [
      { n: 'Pedro I', y: '1844–1921', ab: 'tenaz', d: 'Rei idoso que acompanhou o exército na retirada pelas montanhas da Albânia.', fx: [['CB', 'def', 'hm', 1]] },
      { n: 'Radomir Putnik', y: '1847–1917', ab: 'tatico', d: 'Venceu os austríacos em Cer e Kolubara em 1914.', fx: [['CB', 'def', 'casa', 1], ['PR', 'conq', 1]] },
    ],
    it: [
      { n: 'Vítor Emanuel III', y: '1869–1947', ab: 'carisma', d: 'Rei que levou a Itália à guerra em 1915 ao lado da Entente.', fx: [['ES', 'stab', 2]] },
      { n: 'Luigi Cadorna', y: '1850–1928', ab: 'recrutador', d: 'Comandante das onze batalhas do Isonzo.', fx: [['RF', 2]] },
      { n: 'Armando Diaz', y: '1861–1928', ab: 'tenaz', d: 'Segurou a linha do Piave e venceu em Vittorio Veneto.', fx: [['CB', 'def', 'casa', 1], ['PR', 'conq', 1]] },
    ],
    bg: [
      { n: 'Fernando I', y: '1861–1948', ab: 'tenaz', d: 'Czar búlgaro que negociou com os dois lados antes de entrar na guerra.', fx: [['DP', 10], ['CB', 'def', 'hm', 1]] },
      { n: 'Nikola Zhekov', y: '1864–1949', ab: 'tatico', d: 'Comandante búlgaro na campanha da Sérvia e da Romênia.', fx: [['CB', 'atk', '', 1]] },
    ],
    ro: [
      { n: 'Fernando da Romênia', y: '1865–1927', ab: 'recrutador', d: 'Rei que entrou na guerra contra a própria casa alemã de origem.', fx: [['RF', 2]] },
      { n: 'Rainha Maria', y: '1875–1938', ab: 'carisma', d: 'Rainha enfermeira e diplomata, que defendeu a Romênia na paz de Paris.', fx: [['ES', 'stab', 2], ['DP', 10]] },
    ],
  },
  ww2: {
    de: [
      { n: 'Alto Comando Alemão', y: '1939–1945', ab: 'tatico', d: 'O comando das forças armadas alemãs, com suas divisões blindadas e aviação de apoio.', fx: [['RF', 1]] },
      { n: 'Erwin Rommel', y: '1891–1944', ab: 'tatico', d: 'General das divisões blindadas na França e no norte da África.', fx: [['CB', 'atk', '', 1]] },
      { n: 'Heinz Guderian', y: '1888–1954', ab: 'tatico', d: 'Teórico e organizador das forças blindadas alemãs.', fx: [['SB', 'mil', 20], ['RF', 1]] },
    ],
    it: [
      { n: 'Comando Supremo', y: '1939–1943', ab: 'recrutador', d: 'O alto comando das forças armadas italianas.', fx: [['RF', 1]] },
      { n: 'Pietro Badoglio', y: '1871–1956', ab: 'tenaz', d: 'Marechal que chefiou o estado-maior e assinou o armistício de 1943.', fx: [['CB', 'def', 'casa', 1]] },
    ],
    jp: [
      { n: 'Isoroku Yamamoto', y: '1884–1943', ab: 'almirante', d: 'Almirante que planejou o ataque a Pearl Harbor.', fx: [['NV', 1], ['PR', 'conq', 1]] },
      { n: 'Tomoyuki Yamashita', y: '1885–1946', ab: 'tatico', d: 'General que tomou a Malásia e Singapura em 1942.', fx: [['CB', 'atk', '', 1]] },
    ],
    uk: [
      { n: 'Winston Churchill', y: '1874–1965', ab: 'carisma', d: 'Primeiro-ministro que manteve a Grã-Bretanha na guerra em 1940.', fx: [['ES', 'ww', 50], ['ES', 'stab', 2]] },
      { n: 'Bernard Montgomery', y: '1887–1976', ab: 'tatico', d: 'General de El Alamein, meticuloso com a logística.', fx: [['AB', 1], ['CB', 'atk', '', 1]] },
    ],
    fr: [
      { n: 'Charles de Gaulle', y: '1890–1970', ab: 'tenaz', d: 'General que liderou a França Livre a partir de Londres.', fx: [['ES', 'stab', 2], ['DP', 10]] },
      { n: 'Philippe Leclerc', y: '1902–1947', ab: 'tatico', d: 'Atravessou o Saara com a França Livre e libertou Paris em 1944.', fx: [['CB', 'atk', '', 1]] },
    ],
    su: [
      { n: 'Josef Stalin', y: '1878–1953', ab: 'recrutador', d: 'Ditador que mudou a indústria soviética para o leste e mobilizou o país inteiro.', fx: [['RF', 2], ['OB', 1]] },
      { n: 'Gueorgui Jukov', y: '1896–1974', ab: 'tatico', d: 'Marechal de Moscou, Stalingrado e Berlim.', fx: [['CB', 'def', 'casa', 1], ['PR', 'conq', 1]] },
    ],
    us: [
      { n: 'Franklin D. Roosevelt', y: '1882–1945', ab: 'recrutador', d: 'Presidente que fez dos Estados Unidos o "arsenal da democracia".', fx: [['OB', 1], ['ES', 'stab', 2]] },
      { n: 'Dwight Eisenhower', y: '1890–1969', ab: 'tatico', d: 'Comandante dos desembarques no norte da África e na Normandia.', fx: [['AB', 1], ['NV', 1]] },
      { n: 'Chester Nimitz', y: '1885–1966', ab: 'almirante', d: 'Almirante de Midway e da campanha de ilha em ilha no Pacífico.', fx: [['NV', 1], ['PR', 'conq', 1]] },
    ],
    cn: [
      { n: 'Chiang Kai-shek', y: '1887–1975', ab: 'tenaz', d: 'Líder nacionalista que trocou espaço por tempo na longa guerra contra o Japão.', fx: [['CB', 'def', 'casa', 1], ['ES', 'ww', 50]] },
      { n: 'Xue Yue', y: '1896–1998', ab: 'tenaz', d: 'General que defendeu Changsha em quatro batalhas.', fx: [['CB', 'def', 'hm', 1]] },
    ],
    pl: [
      { n: 'Edward Rydz-Śmigły', y: '1886–1941', ab: 'tenaz', d: 'Marechal que comandou a defesa da Polônia em 1939.', fx: [['CB', 'def', 'casa', 1]] },
      { n: 'Władysław Sikorski', y: '1881–1943', ab: 'carisma', d: 'Chefe do governo polonês no exílio e de suas forças no Ocidente.', fx: [['ES', 'stab', 2], ['DP', 10]] },
    ],
  },
  gf: {
    us: [
      { n: 'John F. Kennedy', y: '1917–1963', ab: 'carisma', d: 'Presidente da crise dos mísseis e da promessa de chegar à Lua.', fx: [['SB', 'all', 15], ['DP', 10]] },
      { n: 'Lyndon Johnson', y: '1908–1973', ab: 'recrutador', d: 'Presidente da Grande Sociedade e da escalada no Vietnã.', fx: [['RF', 1], ['CR', 25]] },
      { n: 'Robert McNamara', y: '1916–2009', ab: 'tatico', d: 'Secretário de Defesa que reorganizou o Pentágono com números e sistemas.', fx: [['SB', 'mil', 20]] },
    ],
    eu: [
      { n: 'Charles de Gaulle', y: '1890–1970', ab: 'tenaz', d: 'Presidente que deu à França a própria bomba e independência da OTAN.', fx: [['ES', 'stab', 2], ['SB', 'mil', 20]] },
      { n: 'Konrad Adenauer', y: '1876–1967', ab: 'carisma', d: 'Chanceler da reconstrução e do milagre econômico alemão.', fx: [['OU', 'reg', 1], ['DP', 10]] },
      { n: 'Harold Macmillan', y: '1894–1986', ab: 'carisma', d: 'Primeiro-ministro britânico do comércio e da descolonização.', fx: [['RT', 1]] },
    ],
    su: [
      { n: 'Nikita Kruschev', y: '1894–1971', ab: 'recrutador', d: 'Líder do Sputnik, do degelo e dos mísseis em Cuba.', fx: [['SB', 'all', 15], ['RF', 1]] },
      { n: 'Leonid Brejnev', y: '1906–1982', ab: 'tenaz', d: 'Sucessor de Kruschev, da paridade nuclear e da estagnação.', fx: [['RF', 2]] },
    ],
    cu: [
      { n: 'Fidel Castro', y: '1926–2016', ab: 'carisma', d: 'Líder da revolução cubana, que resistiu à invasão da baía dos Porcos.', fx: [['ES', 'stab', 2], ['CB', 'def', 'casa', 1]] },
      { n: 'Che Guevara', y: '1928–1967', ab: 'tatico', d: 'Guerrilheiro argentino da Sierra Maestra, que quis levar a revolução a outros países.', fx: [['PR', 'conq', 1], ['RF', 1]] },
    ],
    cn: [
      { n: 'Mao Tsé-tung', y: '1893–1976', ab: 'recrutador', d: 'Líder da China comunista, da guerra popular e do Grande Salto.', fx: [['RF', 2]] },
      { n: 'Zhou Enlai', y: '1898–1976', ab: 'carisma', d: 'Primeiro-ministro e diplomata, rosto da China no mundo.', fx: [['DP', 10], ['ES', 'stab', 2]] },
      { n: 'Deng Xiaoping', y: '1904–1997', ab: 'carisma', d: 'Secretário-geral do partido, depois o reformador da economia chinesa.', fx: [['OU', 'reg', 1], ['CR', 25]] },
    ],
  },
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
// mundo gerado (L5): três líderes por facção, tirados do nome da facção (a mesma facção dá sempre os mesmos líderes)
const CIVFX = [[['RF', 2]], [['SB', 'all', 15]], [['OU', 'reg', 1], ['RT', 1]], [['CB', 'def', 'casa', 1], ['ES', 'stab', 2]], [['PR', 'conq', 2]], [['CR', 25], ['TR', 'pc', 'food', 1]], [['MV', 25], ['OB', 1]], [['NV', 1], ['RT', 1]], [['DP', 10], ['ES', 'stab', 2]]];
const CIVD = { RF: 'Chefe de guerra que pôs o povo em armas.', SB: 'Sábio que juntou escribas e astrônomos na capital.', OU: 'Mercador que fez fortuna nas estradas do reino.', CB: 'Guardião das fronteiras, firme nos tempos difíceis.', PR: 'Conquistador cantado nas histórias do povo.', CR: 'Lavrador que abriu campos e celeiros.', MV: 'Construtor de templos e monumentos.', NV: 'Navegador que abriu rotas além do mar.', DP: 'Pacificador que fez alianças com os vizinhos.' };
const CIVN = ['Arvena', 'Tomir', 'Seluna', 'Kadros', 'Imra', 'Vorlan', 'Ezra', 'Belik', 'Nayra', 'Orvo', 'Talis', 'Murren'];
const CIVE = ['das Pontes', 'do Arado', 'das Estrelas', 'do Mar', 'Mão-de-Ferro', 'das Moedas', 'Coração-Valente', 'dos Templos'];
function civLeaders(d) {
  const h = [...d.n].reduce((s, c) => s + c.charCodeAt(0), 0), AB = Object.keys(ABIL);
  return [0, 1, 2].map(k => { const fx = CIVFX[(h + 4 * k) % CIVFX.length]; return { n: k ? CIVN[(h + 5 * k) % CIVN.length] + ' ' + CIVE[(h + 3 * k) % CIVE.length] : d.L, y: 'lendário', ab: k ? AB[(h + k) % AB.length] : d.ab, d: CIVD[fx[0][0]], fx }; });
}
