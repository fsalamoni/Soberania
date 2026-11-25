// v5, parte 3 (M-01 a M-10, M-20, R-20 a R-62): terreno, rio e jazidas de cada território.
// Formato: 'Território': 'T[r] jazida,jazida'. T = terreno (TERR), r = rio. Geografia real e aproximada.
const GEO = {
  mundo: {
    'Alasca': 't pel,our,pei', 'Canadá Oeste': 'f mad,pel', 'Canadá Leste': 'fr mad,pel,fer', 'Groenlândia': 't pei',
    'EUA Oeste': 'h our,cob,pet', 'EUA Leste': 'pr tri,car,alg', 'México': 'd pra,mil,pet', 'América Central': 's acu,caf',
    'Cuba': 'p acu,tab', 'Antilhas': 's acu,esp', 'Norte Andino': 'm our,caf,gem', 'Peru e Bolívia': 'm pra,est,cob',
    'Brasil Norte': 'sr mad,esp', 'Brasil Sul': 'p caf,gad,fer', 'Prata': 'cr gad,tri,cav', 'Chile': 'm cob,sli,pei',
    'Ilhas Britânicas': 'c car,fer,pei', 'França': 'pr tri,vin', 'Ibéria': 'h vin,pra,cob', 'Benelux': 'w pei,car',
    'Alemanha': 'pr car,fer', 'Itália': 'h vin,ped', 'Escandinávia': 'f mad,fer,pei', 'Europa Central': 'pr tri,sal',
    'Polônia': 'pr tri,sal', 'Finlândia': 'f mad', 'Bálticos': 'f mad,pei', 'Bálcãs': 'm ped,cob',
    'Grécia': 'h vin,ped', 'Romênia e Bulgária': 'pr tri,pet', 'Ucrânia': 'pr tri,car,fer', 'Rússia': 'fr mad,pel',
    'Urais': 'm fer,cob,gem', 'Sibéria': 't mad,pel,our', 'Extremo Oriente': 't mad,pel,pei', 'Ásia Central': 'e cav,alg',
    'Mongólia': 'e cav,gad', 'Cáucaso': 'm pet', 'Turquia': 'h ped,cob', 'Levante': 'd inc,vin',
    'Iraque': 'dr tri,pet', 'Irã': 'h pet,sed', 'Arábia': 'd inc,pet', 'Afeganistão': 'm gem',
    'Egito': 'dr tri,alg', 'Líbia': 'd pet', 'Magrebe': 'h tri,fer', 'Sahel': 'e gad,our',
    'África Ocidental': 's our,esp', 'Sudão': 'er alg,gad', 'Chifre da África': 'd inc,caf', 'Congo': 'sr gem,mad',
    'África Oriental': 'c gad,caf', 'Angola': 's gem,pet', 'Moçambique': 's acu,esp', 'África Austral': 'h our,gem,car',
    'Madagascar': 's esp', 'Índia': 'pr alg,esp,arr', 'Paquistão': 'dr tri,alg', 'China Norte': 'pr tri,car,fer',
    'Manchúria': 'f fer,car,tri', 'China Sul': 'pr arr,sed,caf', 'Taiwan': 'h acu,arr', 'Coreia do Norte': 'm car,fer',
    'Coreia do Sul': 'h arr,pei', 'Japão': 'h arr,pei,pra', 'Indochina': 'sr arr,mad', 'Sião e Birmânia': 'sr arr,gem,mad',
    'Malásia': 's est,esp', 'Filipinas': 's acu,per', 'Índias Orientais': 's esp,pet', 'Nova Guiné': 's our,mad',
    'Austrália Oeste': 'd our,fer', 'Austrália Leste': 'c gad,car,our', 'Nova Zelândia': 'h gad,pei',
  },
  europa1805: {
    'França': 'pr tri,vin,fer', 'Países Baixos': 'w pei,tri', 'Espanha': 'h pra,vin,cav', 'Portugal': 'h vin,pei',
    'Grã-Bretanha': 'c car,fer,pei', 'Irlanda': 'c gad', 'Suíça': 'm ped', 'Renânia': 'hr car,vin',
    'Baviera e Saxônia': 'f pra,mad', 'Prússia': 'p tri,cav', 'Áustria': 'm ped,sal', 'Boêmia': 'h car,pra',
    'Hungria': 'pr tri,cav,vin', 'Itália do Norte': 'pr tri,sed', 'Nápoles': 'h vin,sal', 'Polônia': 'pr tri,sal',
    'Prússia Oriental': 'f mad,per', 'Bálticos': 'f mad,pei', 'Bielorrússia': 'w mad', 'Ucrânia': 'pr tri,cav',
    'São Petersburgo': 'f mad,pei', 'Moscou': 'fr mad,pel', 'Rússia Meridional': 'e cav,tri', 'Dinamarca': 'p pei,gad',
    'Noruega': 'm mad,pei', 'Suécia': 'f fer,cob,mad', 'Finlândia': 'f mad,pel', 'Croácia': 'h mad,pei',
    'Bósnia e Sérvia': 'm fer,gad', 'Grécia e Albânia': 'h vin,ped', 'Bulgária': 'h tri,gad', 'Valáquia': 'pr tri,sal',
    'Constantinopla': 'h sed,pei', 'Anatólia': 'h cav,cob', 'Marrocos': 'h tri,sal', 'Argel e Túnis': 'd tri,vin',
  },
  europa1914: {
    'França Norte': 'pr tri,car,fer', 'França Sul': 'h vin,tri', 'Bélgica': 'p car,fer', 'Holanda': 'w pei,tri',
    'Reino Unido': 'c car,fer,pei', 'Irlanda': 'c gad', 'Renânia': 'hr car,fer', 'Berlim': 'p tri,sal',
    'Saxônia e Baviera': 'h car,mad', 'Prússia Oriental': 'f mad,tri', 'Polônia': 'pr tri,car', 'Bálticos': 'f mad,pei',
    'Bielorrússia': 'w mad', 'Escandinávia': 'f fer,mad,pei', 'Finlândia': 'f mad', 'Ucrânia': 'pr tri,car,fer',
    'Petrogrado': 'f mad,pei', 'Moscou': 'fr mad,tri', 'Rússia Meridional': 'e cav,tri', 'Cáucaso': 'm pet,cob',
    'Suíça': 'm ped', 'Espanha': 'h fer,pra,vin', 'Portugal': 'h vin,pei', 'Áustria': 'm sal,ped',
    'Boêmia': 'h car,fer', 'Hungria': 'pr tri,cav', 'Galícia': 'p pet,sal', 'Croácia e Bósnia': 'm fer,mad',
    'Sérvia': 'h gad,cob', 'Albânia': 'm ped', 'Grécia': 'h vin,pei', 'Bulgária': 'h tri,tab',
    'Romênia': 'pr pet,tri', 'Itália Norte': 'pr tri,sed', 'Itália Sul': 'h vin,sli', 'Constantinopla': 'h sed,pei',
    'Anatólia': 'h cav,cob', 'Síria': 'd tri,alg', 'Palestina': 'd vin,sal', 'Mesopotâmia': 'dr pet,tri',
    'Arábia': 'd inc,pet', 'Pérsia': 'h pet,sed', 'Egito': 'dr alg,tri', 'Líbia': 'd sal',
    'Argélia e Tunísia': 'h tri,fer,vin', 'Marrocos': 'h fer,sal',
  },
  eua1861: {
    'Nova Inglaterra': 'f mad,pei', 'Nova York': 'pr tri,fer', 'Pensilvânia': 'h car,fer,pet', 'Maryland': 'p tab,pei',
    'Virgínia Ocidental': 'm car,sal', 'Kentucky': 'h tab,cav,car', 'Missouri': 'pr tri,fer', 'Ohio': 'pr tri,car',
    'Indiana': 'p tri,mil', 'Illinois': 'pr mil,tri,car', 'Michigan': 'f mad,cob,fer', 'Wisconsin': 'f mad,gad',
    'Minnesota': 'f fer,mad', 'Iowa': 'p mil,gad', 'Virgínia': 'h tab,sli', 'Carolina do Norte': 'h tab,mad',
    'Carolina do Sul': 'w alg,arr', 'Geórgia': 'p alg,mad', 'Flórida': 'w acu,pei', 'Tennessee': 'hr fer,cav',
    'Alabama': 'p alg,fer', 'Mississippi': 'pr alg', 'Luisiana': 'wr acu,alg,sal', 'Arkansas': 'f alg,mad',
    'Texas': 'c gad,alg,pet', 'Kansas': 'c tri,gad', 'Território Indígena': 'c gad,cav', 'Nebraska': 'c gad,tri',
    'Dakota': 'e our,gad', 'Colorado': 'm our,pra', 'Novo México': 'd pra,cob', 'Território de Washington': 'f mad,pei',
    'Oregon': 'f mad,pei', 'Califórnia': 'h our,vin,tri', 'Nevada e Utah': 'd pra,sal',
  },
  brasil1835: {
    'Alto Amazonas': 'sr mad,esp', 'Grão-Pará': 'sr esp,mad,pei', 'Maranhão': 'w alg,arr', 'Piauí': 'e gad',
    'Ceará': 'e gad,sal', 'Rio Grande do Norte': 'e sal,alg', 'Paraíba': 'h acu,alg', 'Pernambuco': 'p acu,alg',
    'Alagoas': 'p acu', 'Sergipe': 'p acu', 'Bahia': 'h acu,tab,gem', 'Goiás': 'c our,gad',
    'Mato Grosso': 'w our,gad', 'Minas Gerais': 'm our,fer,gem', 'Espírito Santo': 'h caf,mad', 'Corte (Rio de Janeiro)': 'h caf,acu',
    'São Paulo': 'h caf,acu', 'Curitiba': 'f mad,caf', 'Santa Catarina': 'h pei,mad', 'Rio Grande do Sul': 'c gad,cav,sal',
  },
  cinzas: {
    'Vale Rubro': 'pr tri,vin', 'Lago Prata': 'p pei,pra', 'Bosque Sombrio': 'f mad,pel', 'Matagal': 'c gad,cav',
    'Garganta': 'm fer,ped', 'Moinhos': 'pr tri', 'Rochedo': 'm fer,pei', 'Ilha Tormenta': 'h pei',
    'Recife Sangrento': 'h per', 'Farol Quebrado': 'h pei', 'Baía das Velas': 'c pei,mad', 'Dunas de Âmbar': 'd gem',
    'Oásis Partido': 'd inc,tri', 'Salinas Negras': 'd sal', 'Cabo Serpente': 's esp,pei', 'Vinhedo Real': 'h vin',
    'Campos de Ouro': 'p tri,our', 'Palmeiral': 's acu,esp', 'Trono de Cinzas': 'hr ped,tri', 'Porto Régio': 'p pei,sed',
    'Colina dos Reis': 'h vin,cav', 'Sete Sinos': 'p tri', 'Ponte Velha': 'pr tri,gad', 'Muralha Real': 'h ped',
    'Passo do Falcão': 'm fer', 'Fortenorte': 't fer,mad', 'Gelo-Fundo': 't pel', 'Torre do Lobo': 'f pel,mad',
    'Bruma Alta': 'm pra', 'Vau dos Corvos': 'fr mad', 'Pedra-Alva': 'm ped,pra', 'Escarpa Branca': 't pel,pei',
  },
  runas: {
    'Sylvaren': 'f mad,vin', 'Folha-Lua': 'f mad,esp', 'Bosque Eterno': 'f mad,pel', 'Clareira Prata': 'c pra,cav',
    'Lago dos Espelhos': 'pr pei,gem', 'Vale dos Ecos': 'pr tri', 'Garra Rubra': 'e fer,cav', 'Ermo Cinzento': 'e gad',
    'Fosso dos Ossos': 'd sal', 'Planície Uivante': 'e cav,gad', 'Charneca': 'w pel', 'Fenda Escura': 'm fer,car',
    'Pedrafunda': 'm fer,ped', 'Martelo Alto': 'm cob,est', 'Forja Rubra': 'm fer,car', 'Minas Fundas': 'm our,gem',
    'Passo dos Gigantes': 'm ped', 'Pico do Dragão': 'm our,gem', 'Ilha Âmbar': 'h acu,gem', 'Coroa do Mar': 'p pei,per',
    'Recife Prateado': 'h per,pei', 'Dunas Sussurrantes': 'd inc', 'Torre Velada': 'h gem', 'Cidadela das Runas': 'h ped',
    'Ilha das Névoas': 'f mad,pei', 'Círculo de Pedra': 'c ped,gad', 'Altamar': 'p pei,tri', 'Porto Claro': 'pr pei,sed',
    'Campos de Trigo': 'p tri,gad', 'Muralha Branca': 'h ped,fer', 'Templo Solar': 'p vin,inc', 'Brejo das Almas': 'w pel',
  },
  mediterraneo: {
    'Lusitânia': 'h vin,pei', 'Gallaecia': 'm est,our', 'Tarraconense': 'h vin,pra', 'Bética': 'pr pra,cob,vin',
    'Aquitânia': 'pr vin,tri', 'Lugdunense': 'p tri,gad', 'Narbonense': 'h vin,sal', 'Bélgica': 'f mad,gad',
    'Britânia': 'c est,fer,gad', 'Caledônia': 'm gad,pel', 'Hibérnia': 'c gad', 'Germânia Ocidental': 'fr mad,fer',
    'Germânia Norte': 'f mad,per', 'Récia e Nórica': 'm fer,sal', 'Marcomânia': 'f mad,pel', 'Vístula': 'f per,pel',
    'Gália Cisalpina': 'pr tri,cav', 'Itália Central': 'h vin,ped', 'Magna Grécia': 'h tri,vin', 'Sicília': 'h tri,sli',
    'Sardenha e Córsega': 'h pra,pei', 'Dalmácia': 'h fer,pei', 'Panônia': 'pr tri,cav', 'Dácia': 'm our,sal',
    'Mésia': 'h tri,gad', 'Trácia': 'p tri,cav', 'Macedônia': 'm pra,our', 'Acaia': 'h vin,ped',
    'Ásia': 'h vin,sed', 'Galácia e Capadócia': 'e cav,cob', 'Armênia': 'm cob,fer', 'Síria': 'd sed,vin',
    'Judeia': 'd vin,sal', 'Mesopotâmia': 'pr tri,alg', 'Arábia': 'd inc,esp', 'Pérsia': 'h sed,pra',
    'Pártia': 'e cav,tri', 'Cítia': 'e cav,our', 'Sarmácia': 'e cav,gad', 'Cáucaso': 'm our,fer',
    'Mauritânia': 'h cav,tri', 'Numídia': 'h cav,tri', 'África': 'p tri,vin', 'Tripolitânia': 'd tri,sal',
    'Cirenaica': 'd tri,inc', 'Egito': 'dr tri,alg,ped',
  },
  nordico: {
    'Islândia': 't pei,pel', 'Órcadas e Shetland': 'c pei,gad', 'Vestlandet': 'm pei,mad', 'Viken': 'f mad,fer',
    'Hålogaland': 't pel,pei', 'Götaland': 'f fer,mad', 'Svealand': 'f fer,cob', 'Norrland': 't pel,mad',
    'Dinamarca': 'p pei,gad,per', 'Wessex': 'p tri,gad', 'Gales': 'm est,cob', 'Mércia': 'p tri,fer',
    'Ânglia Oriental': 'w pei,sal', 'Nortúmbria': 'c gad,car', 'Escócia': 'm gad,pel', 'Ulster': 'c gad',
    'Dublin e Munster': 'c gad,our', 'Frísia': 'w pei,gad', 'Nêustria': 'pr tri,vin', 'Aquitânia': 'h vin,sal',
    'Francia Média': 'hr vin,fer', 'Saxônia': 'f mad,pra', 'Francia Oriental': 'f mad,sal', 'Wendland': 'w pei,per',
    'Polânia': 'p tri,sal', 'Curlândia': 'f per,pel', 'Finlândia': 'f pel,mad', 'Novgorod': 'fr pel,mad',
    'Biarmia': 't pel', 'Rostov': 'f pel,tri', 'Kiev': 'pr tri,mad', 'Estepe Cazar': 'e cav,sed',
  },
  americas: {
    'Aridoamérica': 'd pra,gad', 'Michoacán': 'h cob,mil', 'Vale do México': 'h mil,pra', 'Golfo': 's caf,mil',
    'Oaxaca': 'm our,mil', 'Chiapas': 's caf,mad', 'Yucatán': 'f sal,mil', 'Petén': 's mad,caf',
    'Istmo': 's caf,our', 'Cuba': 'p tab,mil', 'Hispaniola': 'h our,mil', 'Muiscas': 'm gem,our,sal',
    'Caribes': 's mad,pei', 'Guianas': 's mad,esp', 'Quito': 'm our,mil', 'Chimor': 'dr pei,alg,mil',
    'Chincha': 'd pei,alg', 'Cuzco': 'm pra,mil', 'Collasuyo': 'm pra,est,cob', 'Atacama': 'd cob,sli,sal',
    'Mapuche': 'f mad,pei', 'Diaguitas': 'm cob,mil', 'Pampas': 'c gad', 'Guaranis': 'fr caf,mil',
    'Amazônia': 'sr mad,esp', 'Jês do Cerrado': 'e mil', 'Tupinambás': 's mad,pei,mil',
  },
  japao: {
    'Satsuma': 'h tab,our', 'Hyuga': 'm mad', 'Higo': 'pr arr,cav', 'Hizen': 'h pei,arr',
    'Chikuzen': 'p arr,car', 'Bungo': 'h cob,pei', 'Tosa': 'm mad,pei', 'Iyo e Sanuki': 'h sal,arr',
    'Nagato e Suo': 'h cob,pei', 'Aki': 'h pei,arr', 'Izumo e Iwami': 'm pra,fer', 'Bizen e Mimasaka': 'h fer,arr',
    'Harima': 'p arr,sal', 'Yamashiro e Ōmi': 'pr arr,sed', 'Settsu e Kii': 'h mad,pei', 'Owari e Ise': 'pr arr,pei',
    'Mino': 'h arr,mad', 'Mikawa e Tōtōmi': 'p arr,cav', 'Suruga': 'h caf,pei', 'Kai': 'm our,cav',
    'Shinano': 'm cav,mad', 'Echizen': 'h arr,pei', 'Kaga e Etchu': 'pr arr,our', 'Echigo': 'pr arr,pet',
    'Sagami e Musashi': 'pr arr,cav', 'Kazusa e Awa': 'p pei,arr', 'Hitachi e Shimotsuke': 'p arr,cav', 'Aizu e Dewa': 'm mad,pra',
    'Mutsu Sul': 'f cav,our', 'Oshu Norte': 'f cav,pel', 'Ezo': 't pel,pei',
  },
};
// Terrenos (M-01 a M-10): comida, produção, ouro e defesa. def: 'f' +1 com 3+ tropas, 'h' +1, 'm' +1 e atacante perde empates, 'w' atacante usa 1 dado a menos.
const TERR = {
  p: { n: 'Planície fértil', ic: '🌾', c: '#7d9a3e', food: 3, prod: 1, gold: 0 },
  c: { n: 'Pradaria e campos', ic: '🌿', c: '#93a24a', food: 2, prod: 1, gold: 0 },
  f: { n: 'Floresta', ic: '🌲', c: '#2f6b3a', food: 1, prod: 2, gold: 0, def: 'f' },
  s: { n: 'Selva', ic: '🌴', c: '#1f5a36', food: 1, prod: 1, gold: 1, def: 'f' },
  h: { n: 'Colinas', ic: '⛰', c: '#9a8452', food: 1, prod: 2, gold: 0, def: 'h' },
  m: { n: 'Montanhas', ic: '🏔', c: '#7b7268', food: 0, prod: 2, gold: 0, def: 'm' },
  d: { n: 'Deserto', ic: '🏜', c: '#c9a85e', food: 0, prod: 1, gold: 1 },
  e: { n: 'Estepe e semiárido', ic: '🐎', c: '#b0a064', food: 1, prod: 1, gold: 0 },
  t: { n: 'Tundra e taiga', ic: '❄', c: '#7f95a3', food: 1, prod: 1, gold: 0 },
  w: { n: 'Pântano e alagado', ic: '🪷', c: '#4f6f5f', food: 1, prod: 0, gold: 0, def: 'w' },
};
// Jazidas (R-20 a R-62, parte): z = zona que explora; y = rendimento extra quando explorada;
// lux = luxo (conta por tipo para a estabilidade); era = só aparece a partir desse nível de era (0 antiga, 2 pólvora, 3 séc. XX).
const DEP = {
  tri: { n: 'Trigo', ic: '🌾', z: 'agr', y: { food: 2 } }, arr: { n: 'Arroz', ic: '🍚', z: 'agr', y: { food: 2 } },
  mil: { n: 'Milho', ic: '🌽', z: 'agr', y: { food: 2 } }, gad: { n: 'Gado', ic: '🐄', z: 'pec', y: { food: 2 } },
  pei: { n: 'Peixe', ic: '🐟', z: 'pes', y: { food: 2 } }, cav: { n: 'Cavalos', ic: '🐎', z: 'pec', y: { prod: 1 } },
  mad: { n: 'Madeira', ic: '🪵', z: 'flo', y: { prod: 1 } }, ped: { n: 'Pedra', ic: '🪨', z: 'min', y: { prod: 1 } },
  cob: { n: 'Cobre', ic: '🟤', z: 'min', y: { prod: 1, gold: 1 } }, est: { n: 'Estanho', ic: '⚪', z: 'min', y: { prod: 1 } },
  fer: { n: 'Ferro', ic: '⛓', z: 'min', y: { prod: 1 } }, car: { n: 'Carvão', ic: '⚫', z: 'min', y: { prod: 2 }, era: 2 },
  sli: { n: 'Salitre', ic: '🧂', z: 'min', y: { gold: 1 }, era: 2 }, pet: { n: 'Petróleo', ic: '🛢', z: 'min', y: { gold: 2 }, era: 3 },
  our: { n: 'Ouro', ic: '🥇', z: 'min', y: { gold: 2 } }, pra: { n: 'Prata', ic: '🥈', z: 'min', y: { gold: 2 } },
  sal: { n: 'Sal', ic: '🧂', z: 'min', y: { food: 1, gold: 1 } }, gem: { n: 'Pedras preciosas', ic: '💎', z: 'min', y: { gold: 1 }, lux: 1 },
  esp: { n: 'Especiarias', ic: '🌶', z: 'agr', y: { gold: 1 }, lux: 1 }, sed: { n: 'Seda', ic: '🧵', z: 'agr', y: { gold: 1 }, lux: 1 },
  vin: { n: 'Vinho', ic: '🍷', z: 'agr', y: { gold: 1 }, lux: 1 }, inc: { n: 'Incenso', ic: '🕯', z: 'agr', y: { gold: 1 }, lux: 1 },
  acu: { n: 'Açúcar', ic: '🍬', z: 'agr', y: { gold: 1 }, lux: 1 }, caf: { n: 'Café, chá e cacau', ic: '☕', z: 'agr', y: { gold: 1 }, lux: 1 },
  tab: { n: 'Tabaco', ic: '🍂', z: 'agr', y: { gold: 1 }, lux: 1 }, alg: { n: 'Algodão', ic: '☁', z: 'agr', y: { gold: 1 }, lux: 1 },
  pel: { n: 'Peles', ic: '🦊', z: 'flo', y: { gold: 1 }, lux: 1 }, per: { n: 'Pérolas e âmbar', ic: '🦪', z: 'pes', y: { gold: 1 }, lux: 1 },
};
const ERA_LV = { ant: 0, pre: 0, med: 1, jap: 1, fan: 1, pol: 2, w1: 3, w2: 3, gf: 3 };

// ---------- parte 12: eras industrial a informação (K-60 a K-117 e o resto da lista da parte 12) ----------
// e = 3 Revolução Industrial, 4 Era Moderna, 5 Era Atômica, 6 Era da Informação
TECH.push(
  T7('vap', 3, 13, ['cie', 'mec'], 'Máquina a vapor', 'K-60: mina profunda; navios a vapor (+1 travessia).'),
  T7('tear', 3, 13, ['vap'], 'Tear mecânico', 'K-61: zona industrial e manufatura têxtil.'),
  T7('sid', 3, 14, ['vap', 'ferr'], 'Siderurgia', 'K-62: siderúrgica (aço).'),
  T7('frv', 3, 15, ['sid'], 'Ferrovia', 'K-63: ferrovia e zona turística.'),
  T7('qui', 3, 14, ['cie'], 'Química', 'K-64: indústria química.'),
  T7('mdc', 3, 15, ['qui'], 'Medicina', 'K-65: +1 saúde em todos os territórios.'),
  T7('din', 3, 15, ['qui'], 'Dinamite', 'K-66: canal e Grande Canal Marítimo.'),
  T7('rif', 3, 15, ['msq', 'sid'], 'Rifles', 'K-67: infantaria de linha.'),
  T7('arqe', 3, 14, ['cie', 'dra'], 'Arqueologia', 'K-68: museu.'),
  T7('edp', 3, 14, ['imp', 'eco'], 'Educação pública', 'K-69: escola pública e Exposição Universal.'),
  T7('vul', 3, 14, ['qui'], 'Vulcanização', 'K-70: seringal (borracha).'),
  T7('ele', 4, 17, ['cie', 'sid'], 'Eletricidade', 'K-80: zona energética, termelétricas, hidrelétrica e estádio.'),
  T7('ref', 4, 17, ['qui', 'ele'], 'Refino', 'K-81: poço de petróleo e refinaria (combustível).'),
  T7('mot', 4, 18, ['ref'], 'Motor a combustão', 'K-82: montadora; infantaria motorizada e blindados.'),
  T7('aut', 4, 18, ['mot', 'vul'], 'Automóvel', 'K-83: rodovia.'),
  T7('voo', 4, 18, ['mot'], 'Voo motorizado', 'K-84: base aérea.'),
  T7('rad', 4, 17, ['ele'], 'Rádio', 'K-85: o jornal vira rádio (+1 prestígio) e libera a propaganda dos espiões.'),
  T7('snt', 4, 17, ['mdc', 'ele'], 'Saneamento moderno', 'K-86: saneamento rende +1 saúde a mais.'),
  T7('fert', 4, 17, ['qui', 'ele'], 'Fertilizantes', 'K-87: agroindústria.'),
  T7('conc', 4, 18, ['sid', 'ele'], 'Concreto armado', 'K-88: bairro residencial e Estátua Monumental.'),
  T7('mtr', 4, 18, ['rif', 'mot'], 'Metralhadora e trincheiras', 'K-89: quem fica parado se entrincheira com +2 em vez de +1.'),
  T7('ideo', 4, 19, ['edp', 'rad'], 'Ideologias', 'K-90: polícia e guarda civil; governos modernos pela árvore cívica.'),
  T7('avi', 5, 21, ['voo'], 'Aviação', 'K-100: aeroporto e porta-aviões.'),
  T7('radr', 5, 21, ['rad', 'avi'], 'Radar', 'K-101: antiaéreo.'),
  T7('fis', 5, 22, ['ele', 'cie'], 'Fissão', 'K-102: usina nuclear. Armas nucleares ficam fora do jogo.'),
  T7('fog', 5, 22, ['avi', 'qui'], 'Foguetes', 'K-103: programa espacial e zona aeroespacial.'),
  T7('tv', 5, 20, ['rad'], 'Televisão', 'K-104: o rádio vira TV (+1 cultura).'),
  T7('pla', 5, 21, ['ref', 'qui'], 'Plásticos', 'K-105: plataforma marítima e fábrica de bens de consumo.'),
  T7('atb', 5, 20, ['mdc'], 'Antibióticos', 'K-106: +2 saúde em todos os territórios e farmacêutica.'),
  T7('dipm', 5, 21, ['ideo'], 'Diplomacia moderna', 'K-107: Sede das Nações e Congresso Mundial.'),
  T7('cmp', 6, 25, ['radr', 'pla'], 'Computadores', 'K-110: zona tecnológica, laboratório e Rede Mundial de Dados.'),
  T7('semi', 6, 25, ['cmp'], 'Semicondutores', 'K-111: eletrônica (eletrônicos).'),
  T7('net', 6, 26, ['cmp', 'tv'], 'Internet', 'K-112: centro de pesquisa avançada e rota digital.'),
  T7('sat', 6, 26, ['fog', 'cmp'], 'Satélites', 'K-113: +1 saber em cada zona científica e tecnológica.'),
  T7('bio', 6, 25, ['atb', 'cmp'], 'Biologia e genética', 'K-116: aquicultura.'),
  T7('ecol', 6, 25, ['bio', 'tv'], 'Ecologia', 'K-115: reserva florestal e parque nacional.'),
  T7('ren', 6, 26, ['semi', 'ecol'], 'Energia renovável', 'K-114: parque solar e eólico.'),
  T7('msg', 6, 27, ['fog', 'semi'], 'Mísseis guiados', 'K-117: silo de mísseis.'),
);
TECH.sort((a, b) => a.e - b.e || a.cost - b.cost);
TECH.forEach(t => { t.t = t.e + 1; TK[t.k] = t; });
// tecnologias que cada cenário já conhece no início: eras anteriores à dele
const KNOW = { ant: 0, pre: 0, med: 1, jap: 1, fan: 1, pol: 2, w1: 4, w2: 5, gf: 6 };
// bens manufaturados (R, cadeias da parte 12): produzidos por construções (mk), não por jazidas
Object.assign(DEP, {
  aco: { n: 'Aço', ic: '🔩', y: {}, mk: 1 }, maq: { n: 'Máquinas', ic: '⚙', y: {}, mk: 1 }, qmi: { n: 'Químicos', ic: '⚗', y: {}, mk: 1 },
  cmb: { n: 'Combustível', ic: '⛽', y: {}, mk: 1 }, tex: { n: 'Tecidos', ic: '🧶', y: {}, mk: 1 }, ene: { n: 'Energia', ic: '⚡', y: {}, mk: 1 },
  elt: { n: 'Eletrônicos', ic: '💾', y: {}, mk: 1 }, bcs: { n: 'Bens de consumo', ic: '🛍', y: {}, mk: 1 }, bor: { n: 'Borracha', ic: '🛞', y: {}, mk: 1 },
});
Object.assign(ZONE, { cul: 'Cultural', ind: 'Industrial', enr: 'Energética', tur: 'Turística', tcn: 'Tecnológica', aes: 'Aeroespacial' });
Object.assign(STRUCT, {
  // Z-12 a Z-17: zonas novas
  zcu: { pc: 8, z: 'cul', lv: 2, tech: 'dra', y: { pre: 1 }, cu: 3, ic: '🎭', fx: 'Zona cultural (Z-12): +3 cultura e +1 prestígio.', n: 'Distrito Cultural' },
  zin: { pc: 10, z: 'ind', lv: 2, tech: 'tear', y: { prod: 4 }, plu: 1, ic: '🏭', fx: 'Zona industrial (Z-13): +4 produção, −1 saúde. Base das fábricas.', n: 'Distrito Industrial' },
  zen: { pc: 10, z: 'enr', tech: 'ele', y: { prod: 1 }, ic: '⚡', fx: 'Zona energética (Z-14): base das usinas.', n: 'Distrito Energético' },
  ztu: { pc: 8, z: 'tur', tech: 'frv', near: 'mhf', y: { gold: 2 }, hp: 2, ic: '🏖', fx: 'Zona turística (Z-15): +2 ouro e +2 felicidade. Perto de colina, montanha ou floresta.', n: 'Polo Turístico' },
  ztc: { pc: 14, z: 'tcn', lv: 4, need: 'uni', tech: 'cmp', good: ['ene'], y: { sci: 3, gold: 2 }, ic: '💻', fx: 'Zona tecnológica (Z-16): +3 saber e +2 ouro. Metrópole com universidade e energia.', n: 'Polo Tecnológico' },
  zae: { pc: 14, z: 'aes', lv: 4, need: 'zin', tech: 'fog', y: { prod: 2, sci: 2 }, ic: '🚀', fx: 'Zona aeroespacial (Z-17): +2 produção e +2 saber. Metrópole com zona industrial.', n: 'Polo Aeroespacial' },
  // campo e extração
  aqc: { pc: 8, need: 'psq', tech: 'bio', y: { food: 3 }, ic: '🐠', fx: 'Aquicultura (C-13): +3 comida.', n: 'Aquicultura' },
  agi: { pc: 10, need: 'faz', tech: 'fert', good: ['ene'], y: { food: 4 }, ic: '🚜', fx: 'Agroindústria (C-14): +4 comida. Exige energia.', n: 'Agroindústria' },
  srg: { pc: 6, tech: 'vul', near: 's', y: { gold: 1 }, mk: 'bor', ic: '🌳', fx: 'Seringal (C-22): +1 ouro e borracha. Perto de selva.', n: 'Seringal' },
  rsv: { pc: 6, tech: 'ecol', near: 'fst', y: { stab: 1 }, hp: 2, hl: 1, plu: -2, ic: '🌲', fx: 'Reserva florestal (C-23): +2 felicidade, +1 saúde e −2 de poluição.', n: 'Reserva Florestal' },
  mpr: { pc: 10, need: 'mna', tech: 'vap', good: ['car'], y: { prod: 3 }, plu: 1, ic: '⛏', fx: 'Mina profunda (C-27): +3 produção. Exige carvão.', n: 'Mina Profunda' },
  poc: { pc: 10, tech: 'ref', dep: ['pet'], y: { gold: 1 }, mk: 'pet', ic: '🛢', fx: 'Poço de petróleo (C-28): extrai o petróleo do território e +1 ouro.', n: 'Poço de Petróleo' },
  plt: { pc: 14, tech: 'pla', coast: 1, need: 'por', y: { gold: 2 }, mk: 'pet', ic: '🛢', fx: 'Plataforma marítima (C-29): petróleo do mar e +2 ouro.', n: 'Plataforma Marítima' },
  sln: { pc: 5, dep: ['sal'], y: { gold: 1, food: 1 }, ic: '🧂', fx: 'Salina (C-30): +1 ouro e +1 comida.', n: 'Salina' },
  // indústria (exigem zona industrial no território)
  txt: { pc: 10, need: 'zin', tech: 'tear', good: ['alg', 'gad'], y: { gold: 2 }, mk: 'tex', ic: '🧵', fx: 'Manufatura têxtil (C-45): tecidos e +2 ouro.', n: 'Tecelagem' },
  sdr: { pc: 14, need: 'zin', tech: 'sid', good: ['fer+car'], y: { prod: 2 }, mk: 'aco', plu: 2, ic: '🔥', fx: 'Siderúrgica (C-46): aço, +2 produção, −2 saúde.', n: 'Siderúrgica' },
  mtl: { pc: 14, need: 'zin', tech: 'sid', good: ['aco+ene'], y: { prod: 2 }, mk: 'maq', pm: .25, plu: 1, ic: '⚙', fx: 'Metalúrgica (C-47): máquinas e +25% de produção no território.', n: 'Metalúrgica' },
  qim: { pc: 14, need: 'zin', tech: 'qui', good: ['sli', 'pet'], y: { prod: 1 }, mk: 'qmi', plu: 1, ic: '⚗', fx: 'Indústria química (C-48): químicos.', n: 'Indústria Química' },
  rfn: { pc: 12, tech: 'ref', good: ['pet'], y: { gold: 1 }, mk: 'cmb', plu: 2, ic: '🛢', fx: 'Refinaria (C-49): combustível.', n: 'Refinaria' },
  mnt: { pc: 16, need: 'zin', tech: 'mot', good: ['maq+bor+cmb'], y: { prod: 2 }, mk: 'bcs', plu: 1, ic: '🚗', fx: 'Montadora (C-50): bens de consumo; libera blindados.', n: 'Montadora' },
  fbc: { pc: 12, need: 'zin', tech: 'pla', good: ['tex+maq'], hp: 3, mk: 'bcs', ic: '🛍', fx: 'Fábrica de bens de consumo (C-51): +3 felicidade.', n: 'Fábrica de Bens de Consumo' },
  frm: { pc: 12, tech: 'atb', good: ['qmi'], ic: '💊', fx: 'Farmacêutica (C-52): +2 saúde em todo o império.', n: 'Farmacêutica' },
  elc: { pc: 16, need: 'ztc', tech: 'semi', good: ['ene'], y: { sci: 2 }, mk: 'elt', ic: '💾', fx: 'Eletrônica (C-53): eletrônicos e +2 saber.', n: 'Fábrica de Chips' },
  // comércio, ciência, cultura, cidade
  shp: { pc: 8, need: 'mer', tech: 'pla', good: ['bcs'], y: { gold: 2 }, hp: 2, ic: '🏬', fx: 'Shopping (C-66): +2 ouro e +2 felicidade.', n: 'Shopping' },
  epb: { pc: 8, tech: 'edp', lv: 2, ic: '🏫', fx: 'Escola pública (C-74): +1 saber por nível do território.', n: 'Escola Pública', sciLv: 1 },
  lab: { pc: 14, need: 'uni', tech: 'cmp', good: ['ene'], y: { sci: 5 }, ic: '🔬', fx: 'Laboratório de pesquisa (C-75): +5 saber.', n: 'Laboratório' },
  cpa: { pc: 18, need: 'lab', tech: 'net', good: ['elt'], y: { sci: 7 }, ic: '🧪', fx: 'Centro de pesquisa avançada (C-76): +7 saber.', n: 'Centro de Pesquisa' },
  mus: { pc: 10, tech: 'arqe', lv: 2, y: { pre: 1 }, cu: 3, lg: 1, ic: '🏺', fx: 'Museu (C-86): +3 cultura e +1 prestígio.', n: 'Museu' },
  mid: { pc: 6, tech: 'imp', lv: 2, y: { pre: 1 }, ic: '📰', fx: 'Jornal, rádio e TV (C-87): +1 prestígio; com Rádio +1 a mais; com Televisão +1 cultura.', n: { ant: 'Jornal', med: 'Jornal', pol: 'Jornal', mod: 'Rádio e TV', fan: 'Arauto' } },
  etd: { pc: 12, tech: 'ele', lv: 3, hp: 3, ic: '🏟', fx: 'Estádio (C-88): +3 felicidade.', n: 'Estádio' },
  pqn: { pc: 8, tech: 'ecol', near: 'mf', hp: 2, y: { gold: 1 }, ic: '🏞', fx: 'Parque nacional (C-89): +2 felicidade e +1 ouro.', n: 'Parque Nacional' },
  plc: { pc: 8, tech: 'ideo', lv: 2, y: { stab: 1 }, sd: 2, ic: '👮', fx: 'Polícia e guarda civil (C-95): +5 de estabilidade local e +2 contra espiões.', n: 'Polícia' },
  brs: { pc: 10, tech: 'conc', lv: 3, y: { food: 3 }, ic: '🏘', fx: 'Bairro residencial (C-96): +3 comida para crescer.', n: 'Bairro Residencial' },
  // militar
  bae: { pc: 12, up: 1, need: 'qua', tech: 'voo', good: ['cmb'], air: 1, rf: 1, ic: '🛩', fx: 'Base aérea (C-107): +1 tropa de reforço; +1 unidade aérea nas eras com aviação.', n: 'Base Aérea' },
  aaa: { pc: 8, tech: 'radr', def: 1, ic: '📡', fx: 'Antiaéreo e radar (C-108): +1 no maior dado de defesa.', n: 'Antiaéreo' },
  sil: { pc: 16, up: 2, need: 'qua', tech: 'msg', good: ['elt'], ic: '🎯', fx: 'Silo de mísseis (C-109): uma vez por turno, ataque à distância (até 3 territórios) mata 2 tropas inimigas. Custa 5 ouro.', n: 'Silo de Mísseis' },
  // energia (exigem zona energética no território)
  tcv: { pc: 10, need: 'zen', tech: 'ele', good: ['car'], mk: 'ene', plu: 2, ic: '🏭', fx: 'Termelétrica a carvão (C-110): energia, +2 de poluição.', n: 'Termelétrica a Carvão' },
  hid: { pc: 14, need: 'zen', tech: 'ele', rioReq: 1, mk: 'ene', y: { prod: 1 }, ic: '💧', fx: 'Hidrelétrica (C-111): energia limpa e +1 produção. Exige rio.', n: 'Hidrelétrica' },
  tgs: { pc: 10, need: 'zen', tech: 'ref', good: ['cmb'], mk: 'ene', plu: 1, ic: '🔥', fx: 'Termelétrica a gás (C-112): energia, +1 de poluição.', n: 'Termelétrica a Gás' },
  nuc: { pc: 20, need: 'zen', tech: 'fis', mk: 'ene', y: { prod: 2 }, ic: '☢', fx: 'Usina nuclear (C-113): energia e +2 produção; pequeno risco de acidente.', n: 'Usina Nuclear' },
  sol: { pc: 10, need: 'zen', tech: 'ren', mk: 'ene', y: { gold: 1 }, plu: -1, ic: '☀', fx: 'Parque solar e eólico (C-114): energia limpa, +1 ouro e −1 de poluição.', n: 'Parque Solar e Eólico' },
  // transporte
  frv: { pc: 10, road: 3, need: 'est', tech: 'frv', good: ['aco'], y: { prod: 2 }, ic: '🚂', fx: 'Ferrovia (C-123): pela linha as tropas andam até 4 territórios; +2 produção.', n: 'Ferrovia' },
  rdv: { pc: 8, road: 2, need: 'est', tech: 'aut', good: ['cmb'], y: { gold: 1 }, ic: '🛣', fx: 'Rodovia (C-124): até 3 territórios pela estrada e +1 ouro.', n: 'Rodovia' },
  tav: { pc: 16, road: 5, need: 'frv', tech: 'ele', good: ['ene'], lv: 3, y: { sci: 2, gold: 2 }, ic: '🚄', fx: 'Trem de alta velocidade (C-125): até 6 territórios; +2 saber e +2 ouro.', n: 'Trem de Alta Velocidade' },
  cnl: { pc: 14, tech: 'din', coast: 1, nav: 1, y: { gold: 1 }, ic: '⛴', fx: 'Canal (C-128): +1 travessia e +1 ouro.', n: 'Canal' },
  apt: { pc: 12, tech: 'avi', good: ['cmb'], lv: 3, y: { gold: 1 }, ic: '🛫', fx: 'Aeroporto (C-129): ponte aérea de tropas entre aeroportos seus no remanejamento e rota aérea de carga.', n: 'Aeroporto' },
  // maravilhas industriais e modernas (C-210 a C-215)
  gcn: { pc: 50, ww: 1, tech: 'din', coast: 1, nav: 1, y: { gold: 3 }, ic: '🌊', fx: 'Grande Canal Marítimo (C-210): +1 travessia e +3 ouro.', n: 'Grande Canal Marítimo' },
  exu: { pc: 45, ww: 1, tech: 'edp', y: { pre: 2 }, ic: '🎡', fx: 'Exposição Universal (C-211): +2 prestígio por turno e tecnologias industriais 20% mais baratas.', n: 'Exposição Universal' },
  etm: { pc: 45, ww: 1, tech: 'conc', y: { stab: 1, food: 2 }, ic: '🗽', fx: 'Estátua Monumental (C-212): +1 estabilidade e +2 comida (imigração).', n: 'Estátua Monumental' },
  sdn: { pc: 50, ww: 1, tech: 'dipm', y: { pre: 2 }, ic: '🕊', fx: 'Sede das Nações (C-213): +2 votos no Congresso Mundial e +2 prestígio.', n: 'Sede das Nações' },
  pep: { pc: 60, ww: 1, tech: 'fog', need: 'zae', y: { sci: 3 }, ic: '🛰', fx: 'Programa Espacial (C-214): +3 saber; primeira etapa da vitória científica.', n: 'Programa Espacial' },
  rmd: { pc: 60, ww: 1, tech: 'cmp', y: { sci: 2 }, ic: '🌐', fx: 'Rede Mundial de Dados (C-215): +10% de saber e de ouro.', n: 'Rede Mundial de Dados' },
});
['gcn', 'exu', 'etm', 'sdn', 'pep', 'rmd'].forEach(k => { STRUCT[k].lg = 5; STRUCT[k].wonder = 1; });
['zcu', 'zin', 'zen', 'ztu', 'ztc', 'zae', 'mus', 'lab', 'cpa', 'tav', 'frv'].forEach(k => { STRUCT[k].lg = STRUCT[k].lg || 1; });
// tropas industriais e modernas (A-08 a A-12) e de mar e ar (A-25 a A-29)
Object.assign(ARMY, {
  lin: { n: 'Infantaria de linha', tech: 'rif', good: ['aco'], fx: '+1 no ataque e na defesa; anula o bônus da cavalaria inimiga' },
  mot: { n: 'Infantaria motorizada', tech: 'mot', good: ['cmb'], fx: 'move 1 território a mais no remanejamento' },
  bld: { n: 'Blindados', tech: 'mot', good: ['aco+cmb'], needE: 'mnt', fx: '+2 no maior dado de ataque fora de montanha, floresta, selva e pântano' },
  mec: { n: 'Infantaria mecanizada', tech: 'cmp', good: ['elt+cmb'], fx: '+2 no maior dado de ataque e de defesa' },
  fes: { n: 'Forças especiais', tech: 'net', good: ['elt'], needE: 'acm', fx: 'ignoram as construções de defesa do alvo' },
  enc: { n: 'Encouraçados', tech: 'sid', good: ['aco'], needE: 'stl', fx: 'ataque pelo mar mata 1 defensor com 5 ou 6 antes do combate' },
  sub: { n: 'Submarinos', tech: 'semi', good: ['elt+cmb'], needE: 'stl', fx: 'cortam 1 em 3 rotas marítimas de quem está em guerra com você' },
  pta: { n: 'Porta-aviões', tech: 'avi', good: ['aco+cmb'], needE: 'stl', fx: '+1 unidade aérea nas eras com aviação' },
});
// governos modernos (G-09 a G-11), cívicas modernas e tarifas (T-19)
CIVIC.push(
  { k: 'c_nac', e: 3, cost: 58, req: ['c_ilu'], n: 'Nacionalismo' },
  { k: 'c_ide', e: 4, cost: 72, req: ['c_nac'], n: 'Ideologias de massa' },
  { k: 'c_glo', e: 6, cost: 96, req: ['c_ide'], n: 'Globalização' },
);
CIVIC.forEach(c => { CK[c.k] = c; });
Object.assign(GOV, {
  ppu: { n: 'Regime de partido único', c: 'c_ide', s: { mil: 3, eco: 2 }, fx: '+25% de produção e sem cansaço de guerra; −15% de saber e −50% de prestígio.' },
  pce: { n: 'Planejamento central', c: 'c_ide', s: { eco: 2, mil: 2, civ: 1 }, fx: 'construções industriais 25% mais baratas; −50% do ouro das rotas com outras facções.' },
  tcn: { n: 'Tecnocracia corporativa', c: 'c_glo', s: { eco: 4, civ: 1 }, fx: '+1 ouro por rota e por filial; sem bens de consumo na rede, −3 de felicidade.' },
});
POL.tar = { n: 'Tarifas', t: 'eco', c: 'c_nac', fx: '+1 ouro por rota com outra facção; −5 de relação com os parceiros.' };

// ---------- parte 13: projetos da vitória científica (V-03), em sequência no território do Programa Espacial ----------
Object.assign(STRUCT, {
  sp1: { pc: 40, need: 'pep', tech: 'sat', y: { sci: 1 }, lg: 5, vic: 1, ic: '🛰', fx: 'Satélite (V-03): 1ª etapa da vitória científica.', n: 'Lançamento de Satélite' },
  sp2: { pc: 50, need: 'sp1', tech: 'net', y: { sci: 1 }, lg: 5, vic: 1, ic: '👨‍🚀', fx: 'Pouso tripulado (V-03): 2ª etapa da vitória científica.', n: 'Pouso Tripulado' },
  sp3: { pc: 60, need: 'sp2', tech: 'ren', y: { sci: 1 }, lg: 5, vic: 1, ic: '🪐', fx: 'Colônia espacial (V-03): última etapa; vence pela ciência.', n: 'Colônia Espacial' },
});

// ---------- parte 15: era 8, futuro próximo (K-120 a K-122) ----------
TECH.push(
  T7('ia', 7, 30, ['semi', 'net'], 'Inteligência artificial', 'K-120: +20% de saber.'),
  T7('fus', 7, 30, ['fis', 'semi'], 'Fusão', 'K-121: usina de fusão, energia limpa e farta.'),
  T7('cle', 7, 32, ['sat', 'fus'], 'Colonização espacial', 'K-122: libera a colônia espacial, última etapa da vitória científica.'),
);
TECH.sort((a, b) => a.e - b.e || a.cost - b.cost);
TECH.forEach(t => { t.t = t.e + 1; TK[t.k] = t; });
STRUCT.fsn = { pc: 24, need: 'zen', tech: 'fus', mk: 'ene', y: { prod: 3, gold: 1 }, ic: '🔆', fx: 'Usina de fusão (K-121): energia limpa, +3 produção e +1 ouro.', n: 'Usina de Fusão' };
STRUCT.sp3.tech = 'cle';
