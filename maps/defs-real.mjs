// Definições de territórios (nome, região, partes) copiadas do maps-build.mjs para o real.mjs.
const B = (a, b, c, d) => [a, b, c, d];
export const MED = (() => {
  const I = 'Italy', F = 'France', E = 'Spain', T = 'Turkey', G = 'Greece', D = 'Germany', U = 'United Kingdom';
  const M = [
    ['Lusitânia', 'Hispânia', 'Portugal'], ['Gallaecia', 'Hispânia', { c: [E], b: [B(-10, -4, 39.5, 44.5)] }],
    ['Tarraconense', 'Hispânia', { c: [E, 'Andorra'], b: [B(-4, 5, 39.5, 44.5)] }], ['Bética', 'Hispânia', { c: [E], b: [B(-10, 5, 35, 39.5)] }],
    ['Aquitânia', 'Gália', { c: [F], b: [B(-5, 2.5, 41, 47)] }], ['Lugdunense', 'Gália', { c: [F], b: [B(-5, 2.5, 47, 52)] }],
    ['Narbonense', 'Gália', { c: [F, 'Monaco'], b: [B(2.5, 8.3, 41, 46)] }], ['Bélgica', 'Gália', { c: [F], b: [B(2.5, 8.3, 46, 52)] }, { c: ['Belgium', 'Luxembourg', 'Netherlands'] }],
    ['Britânia', 'Britânia', { c: [U], b: [B(-5.3, 2, 49.8, 55.5)] }], ['Caledônia', 'Britânia', { c: [U], b: [B(-8, 0, 55.5, 61)] }],
    ['Hibérnia', 'Britânia', 'Ireland', { c: [U], b: [B(-8.5, -5.3, 53.9, 55.5)] }],
    ['Germânia Ocidental', 'Germânia', { c: [D], b: [B(5, 10.5, 47, 55.5)] }], ['Germânia Norte', 'Germânia', { c: [D], b: [B(10.5, 15.5, 51, 55.5)] }, 'Denmark'],
    ['Récia e Nórica', 'Germânia', { c: ['Switzerland', 'Austria', 'Slovenia', 'Liechtenstein'] }, { c: [D], b: [B(10.5, 15.5, 47, 49)] }],
    ['Marcomânia', 'Germânia', { c: ['Czechia', 'Slovakia'] }, { c: [D], b: [B(10.5, 15.5, 49, 51)] }], ['Vístula', 'Germânia', { c: ['Poland', 'Lithuania'] }],
    ['Gália Cisalpina', 'Itália', { c: [I, 'San Marino'], b: [B(6, 14, 43.6, 47.5)] }], ['Itália Central', 'Itália', { c: [I, 'Vatican'], b: [B(10.5, 20, 41, 43.6)] }],
    ['Magna Grécia', 'Itália', { c: [I], b: [B(15.65, 19, 37.8, 41), B(13.7, 15.65, 38.4, 41)] }], ['Sicília', 'Itália', { c: [I], b: [B(12, 15.65, 36, 38.4)] }, 'Malta'],
    ['Sardenha e Córsega', 'Itália', { c: [I], b: [B(8, 10, 38.8, 41.3)] }, { c: [F], b: [B(8.4, 9.7, 41.3, 43.1)] }],
    ['Dalmácia', 'Bálcãs', { c: ['Croatia', 'Bosnia and Herz.', 'Montenegro', 'Albania'] }], ['Panônia', 'Bálcãs', 'Hungary'], ['Dácia', 'Bálcãs', { c: ['Romania', 'Moldova'] }],
    ['Mésia', 'Bálcãs', { c: ['Serbia', 'Kosovo', 'Bulgaria', 'Macedonia'] }], ['Trácia', 'Bálcãs', { c: [T], b: [B(25.5, 29.1, 40.6, 42.2)] }, { c: [G], b: [B(24.5, 27, 40.6, 42)] }],
    ['Macedônia', 'Bálcãs', { c: [G], b: [B(19, 24.5, 39.8, 42)] }], ['Acaia', 'Bálcãs', { c: [G], b: [B(19, 29, 34, 39.8), B(24.5, 29, 39.8, 40.6)] }],
    ['Ásia', 'Anatólia', { c: [T], b: [B(25, 32, 35.8, 40.6), B(29.1, 32, 40.6, 42.2)] }], ['Galácia e Capadócia', 'Anatólia', { c: [T], b: [B(32, 38, 36, 42.2)] }],
    ['Armênia', 'Anatólia', { c: [T], b: [B(38, 45, 36, 42.2)] }, 'Armenia'],
    ['Síria', 'Oriente', { c: ['Syria', 'Lebanon', 'Cyprus', 'N. Cyprus'] }], ['Judeia', 'Oriente', { c: ['Israel', 'Palestine', 'Jordan'] }], ['Mesopotâmia', 'Oriente', { c: ['Iraq', 'Kuwait'] }],
    ['Arábia', 'Oriente', { c: ['Saudi Arabia'], b: [B(34, 50, 24, 33)] }], ['Pérsia', 'Oriente', { c: ['Iran'], b: [B(44, 52, 24, 40)] }], ['Pártia', 'Oriente', { c: ['Iran'], b: [B(52, 64, 24, 40)] }, 'Turkmenistan'],
    ['Cítia', 'Estepes', { c: ['Ukraine'], b: [B(28, 41, 44, 48.5)] }], ['Sarmácia', 'Estepes', { c: ['Ukraine'], b: [B(22, 41, 48.5, 54)] }, { c: ['Russia'], b: [B(36, 50, 46, 54)] }, 'Belarus'],
    ['Cáucaso', 'Estepes', { c: ['Georgia', 'Azerbaijan'] }, { c: ['Russia'], b: [B(36, 50, 41, 46)] }],
    ['Mauritânia', 'África', { c: ['Morocco'], b: [B(-10, 0, 27, 36)] }], ['Numídia', 'África', { c: ['Algeria'], b: [B(-9, 7, 32, 37.5)] }], ['África', 'África', 'Tunisia', { c: ['Algeria'], b: [B(7, 10, 32, 37.5)] }],
    ['Tripolitânia', 'África', { c: ['Libya'], b: [B(9, 20, 26, 34)] }], ['Cirenaica', 'África', { c: ['Libya'], b: [B(20, 26, 26, 34)] }], ['Egito', 'África', { c: ['Egypt'], b: [B(24, 37, 22, 32)] }],
  ];
  return M;
})();
export const NOR = (() => {
  const U = 'United Kingdom', F = 'France', D = 'Germany', R = 'Russia', N = 'Norway', S = 'Sweden';
  const V = [
    ['Islândia', 'Atlântico Norte', 'Iceland'], ['Órcadas e Shetland', 'Atlântico Norte', { c: [U], b: [B(-4, 0, 58.65, 61)] }, 'Faeroe Is.'],
    ['Vestlandet', 'Escandinávia', { c: [N], b: [B(4, 8.5, 57, 63.5)] }], ['Viken', 'Escandinávia', { c: [N], b: [B(8.5, 13, 57, 63.5)] }], ['Hålogaland', 'Escandinávia', { c: [N], b: [B(4, 32, 63.5, 72)] }],
    ['Götaland', 'Escandinávia', { c: [S], b: [B(10, 20, 55, 58.5)] }], ['Svealand', 'Escandinávia', { c: [S], b: [B(10, 20, 58.5, 61.5)] }], ['Norrland', 'Escandinávia', { c: [S], b: [B(10, 25, 61.5, 70)] }],
    ['Dinamarca', 'Escandinávia', 'Denmark'],
    ['Wessex', 'Britânia', { c: [U], b: [B(-5.8, 0, 49.8, 51.35), B(-3, 0, 51.35, 51.8)] }], ['Gales', 'Britânia', { c: [U], b: [B(-5.5, -3, 51.35, 53.5)] }],
    ['Mércia', 'Britânia', { c: [U], b: [B(-3, 0, 51.8, 53.6)] }], ['Ânglia Oriental', 'Britânia', { c: [U], b: [B(0, 2, 51.3, 53.6)] }],
    ['Nortúmbria', 'Britânia', { c: [U], b: [B(-3.6, 0.2, 53.6, 55.8)] }], ['Escócia', 'Britânia', { c: [U], b: [B(-8, 0, 55.8, 58.65), B(-5.2, -3.6, 54.6, 55.8)] }],
    ['Ulster', 'Irlanda', { c: ['Ireland'], b: [B(-11, -5, 53.5, 56)] }, { c: [U], b: [B(-8.5, -5.3, 53.9, 55.5)] }], ['Dublin e Munster', 'Irlanda', { c: ['Ireland'], b: [B(-11, -5, 51, 53.5)] }],
    ['Frísia', 'Francia', 'Netherlands'], ['Nêustria', 'Francia', { c: [F], b: [B(-5, 3.5, 46.5, 51.2)] }], ['Aquitânia', 'Francia', { c: [F], b: [B(-2, 3.5, 42, 46.5)] }],
    ['Francia Média', 'Francia', { c: [F], b: [B(3.5, 8.3, 42, 51.2)] }, { c: ['Belgium', 'Luxembourg', 'Switzerland'] }],
    ['Saxônia', 'Francia', { c: [D], b: [B(5.5, 11, 51, 55.5)] }], ['Francia Oriental', 'Francia', { c: [D], b: [B(5.5, 15.5, 47, 51)] }, 'Austria', 'Czechia'],
    ['Wendland', 'Leste', { c: [D], b: [B(11, 15.5, 51, 55)] }, { c: ['Poland'], b: [B(14, 24, 53, 55)] }], ['Polânia', 'Leste', { c: ['Poland'], b: [B(14, 24.5, 49, 53)] }],
    ['Curlândia', 'Leste', { c: ['Estonia', 'Latvia', 'Lithuania'] }], ['Finlândia', 'Leste', 'Finland'],
    ['Novgorod', 'Rus', { c: [R], b: [B(28, 45, 56.5, 62)] }], ['Biarmia', 'Rus', { c: [R], b: [B(28, 45, 62, 71)] }], ['Rostov', 'Rus', { c: [R], b: [B(30, 45, 52, 56.5)] }],
    ['Kiev', 'Rus', { c: ['Ukraine'], b: [B(22, 41, 49, 53)] }, 'Belarus'], ['Estepe Cazar', 'Rus', { c: ['Ukraine'], b: [B(22, 41, 44, 49)] }, 'Moldova', { c: [R], b: [B(36, 45, 44, 52)] }],
  ];
  return V;
})();
export const AME = (() => {
  const X = 'Mexico', P = 'Peru', BR = 'Brazil', AR = 'Argentina', CL = 'Chile';
  const A = [
    ['Aridoamérica', 'Mesoamérica', { c: [X], b: [B(-118, -96, 22, 33)] }], ['Michoacán', 'Mesoamérica', { c: [X], b: [B(-106, -100.5, 14, 22)] }],
    ['Vale do México', 'Mesoamérica', { c: [X], b: [B(-100.5, -98.2, 18, 22)] }], ['Golfo', 'Mesoamérica', { c: [X], b: [B(-98.2, -94.5, 18, 22)] }], ['Oaxaca', 'Mesoamérica', { c: [X], b: [B(-100.5, -94.5, 14, 18)] }],
    ['Chiapas', 'Mundo Maia', { c: [X], b: [B(-94.5, -86, 14, 17.8), B(-94.5, -91.5, 17.8, 22)] }], ['Yucatán', 'Mundo Maia', { c: [X], b: [B(-91.5, -86, 17.8, 22)] }],
    ['Petén', 'Mundo Maia', { c: ['Guatemala', 'Belize', 'El Salvador'] }], ['Istmo', 'Mundo Maia', { c: ['Honduras', 'Nicaragua', 'Costa Rica', 'Panama'] }],
    ['Cuba', 'Caribe', { c: ['Cuba', 'Jamaica', 'Bahamas'] }], ['Hispaniola', 'Caribe', { c: ['Haiti', 'Dominican Rep.', 'Puerto Rico'] }],
    ['Muiscas', 'Norte Andino', 'Colombia'], ['Caribes', 'Norte Andino', { c: ['Venezuela', 'Trinidad and Tobago'] }], ['Guianas', 'Norte Andino', { c: ['Guyana', 'Suriname'] }, { c: ['France'], b: [B(-55, -51, 2, 6.5)] }],
    ['Quito', 'Norte Andino', 'Ecuador'],
    ['Chimor', 'Andes', { c: [P], b: [B(-82, -76, -9.5, -3)] }], ['Chincha', 'Andes', { c: [P], b: [B(-80, -76, -15.5, -9.5)] }], ['Cuzco', 'Andes', { c: [P], b: [B(-76, -68, -15, -9.5)] }],
    ['Collasuyo', 'Andes', 'Bolivia', { c: [P], b: [B(-76, -68, -19, -15)] }], ['Atacama', 'Andes', { c: [CL], b: [B(-76, -66, -30, -17)] }],
    ['Mapuche', 'Cone Sul', { c: [CL], b: [B(-76, -66, -44, -30)] }], ['Diaguitas', 'Cone Sul', { c: [AR], b: [B(-69, -62, -30, -21)] }],
    ['Pampas', 'Cone Sul', { c: [AR], b: [B(-75, -56, -44, -30)] }, 'Uruguay'], ['Guaranis', 'Cone Sul', 'Paraguay', { c: [AR], b: [B(-62, -53, -30, -21)] }, { c: [BR], b: [B(-58, -46, -34, -24)] }],
    ['Amazônia', 'Terras Baixas', { c: [BR], b: [B(-74, -45, -10, 6)] }, { c: [P], b: [B(-76, -68, -9.5, 0)] }], ['Jês do Cerrado', 'Terras Baixas', { c: [BR], b: [B(-62, -45, -24, -10)] }],
    ['Tupinambás', 'Terras Baixas', { c: [BR], b: [B(-45, -34, -24, 6)] }],
  ];
  return A;
})();
export const WORLD = (() => {
const WORLD = [
  ['Alasca', 'América do Norte', { c: ['United States of America'], b: [B(-168.5, -129, 50, 75)] }],
  ['Canadá Oeste', 'América do Norte', { c: ['Canada'], b: [B(-142, -100, 40, 85)] }],
  ['Canadá Leste', 'América do Norte', { c: ['Canada'], b: [B(-100, -50, 40, 85)] }],
  ['Groenlândia', 'América do Norte', 'Greenland'],
  ['EUA Oeste', 'América do Norte', { c: ['United States of America'], b: [B(-125, -100, 24, 50)] }],
  ['EUA Leste', 'América do Norte', { c: ['United States of America'], b: [B(-100, -66, 24, 50)] }],
  ['México', 'América do Norte', 'Mexico'],
  ['América Central', 'América do Norte', { c: ['Guatemala', 'Belize', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama'] }],
  ['Cuba', 'América do Norte', 'Cuba'],
  ['Antilhas', 'América do Norte', { c: ['Jamaica', 'Haiti', 'Dominican Rep.', 'Puerto Rico', 'Bahamas', 'Trinidad and Tobago'] }],
  ['Norte Andino', 'América do Sul', { c: ['Colombia', 'Venezuela', 'Ecuador', 'Guyana', 'Suriname'] }],
  ['Peru e Bolívia', 'América do Sul', { c: ['Peru', 'Bolivia'] }],
  ['Brasil Norte', 'América do Sul', { c: ['Brazil'], b: [B(-75, -30, -10, 6)] }],
  ['Brasil Sul', 'América do Sul', { c: ['Brazil'], b: [B(-75, -30, -35, -10)] }],
  ['Prata', 'América do Sul', { c: ['Argentina', 'Uruguay', 'Paraguay', 'Falkland Is.'] }],
  ['Chile', 'América do Sul', 'Chile'],
  ['Ilhas Britânicas', 'Europa Ocidental', { c: ['United Kingdom', 'Ireland'] }],
  ['França', 'Europa Ocidental', { c: ['France'], b: [B(-6, 10, 41, 52)] }],
  ['Ibéria', 'Europa Ocidental', { c: ['Spain', 'Portugal'] }],
  ['Benelux', 'Europa Ocidental', { c: ['Belgium', 'Netherlands', 'Luxembourg'] }],
  ['Alemanha', 'Europa Ocidental', 'Germany'],
  ['Itália', 'Europa Ocidental', 'Italy'],
  ['Escandinávia', 'Europa Ocidental', { c: ['Norway', 'Sweden', 'Denmark', 'Iceland'] }],
  ['Europa Central', 'Europa Ocidental', { c: ['Austria', 'Switzerland', 'Czechia', 'Slovakia', 'Hungary'] }],
  ['Polônia', 'Europa Oriental', 'Poland'],
  ['Finlândia', 'Europa Oriental', 'Finland'],
  ['Bálticos', 'Europa Oriental', { c: ['Estonia', 'Latvia', 'Lithuania'] }, { c: ['Russia'], b: [B(19, 23, 54, 56)] }],
  ['Bálcãs', 'Europa Oriental', { c: ['Slovenia', 'Croatia', 'Bosnia and Herz.', 'Serbia', 'Montenegro', 'Kosovo', 'Macedonia', 'Albania'] }],
  ['Grécia', 'Europa Oriental', 'Greece'],
  ['Romênia e Bulgária', 'Europa Oriental', { c: ['Romania', 'Bulgaria', 'Moldova'] }],
  ['Ucrânia', 'Europa Oriental', { c: ['Ukraine', 'Belarus'] }],
  ['Rússia', 'Europa Oriental', { c: ['Russia'], b: [B(27, 45, 40, 90)] }],
  ['Urais', 'Ásia do Norte', { c: ['Russia'], b: [B(45, 65, 40, 90)] }],
  ['Cáucaso', 'Oriente Médio', { c: ['Georgia', 'Armenia', 'Azerbaijan'] }],
  ['Sibéria', 'Ásia do Norte', { c: ['Russia'], b: [B(65, 105, 40, 90)] }],
  ['Extremo Oriente', 'Ásia do Norte', { c: ['Russia'], b: [B(105, 168.5, 40, 90)] }],
  ['Ásia Central', 'Ásia do Norte', { c: ['Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan'] }],
  ['Mongólia', 'Ásia do Norte', 'Mongolia'],
  ['Turquia', 'Oriente Médio', 'Turkey'],
  ['Levante', 'Oriente Médio', { c: ['Syria', 'Lebanon', 'Israel', 'Palestine', 'Jordan', 'Cyprus', 'N. Cyprus'] }],
  ['Iraque', 'Oriente Médio', { c: ['Iraq', 'Kuwait'] }],
  ['Irã', 'Oriente Médio', 'Iran'],
  ['Arábia', 'Oriente Médio', { c: ['Saudi Arabia', 'Yemen', 'Oman', 'United Arab Emirates', 'Qatar'] }],
  ['Afeganistão', 'Oriente Médio', 'Afghanistan'],
  ['Egito', 'África', 'Egypt'],
  ['Líbia', 'África', 'Libya'],
  ['Magrebe', 'África', { c: ['Morocco', 'Algeria', 'Tunisia', 'W. Sahara'] }],
  ['Sahel', 'África', { c: ['Mauritania', 'Mali', 'Niger', 'Chad', 'Burkina Faso'] }],
  ['África Ocidental', 'África', { c: ['Senegal', 'Gambia', 'Guinea', 'Guinea-Bissau', 'Sierra Leone', 'Liberia', "Côte d'Ivoire", 'Ghana', 'Togo', 'Benin', 'Nigeria'] }],
  ['Sudão', 'África', { c: ['Sudan', 'S. Sudan'] }],
  ['Chifre da África', 'África', { c: ['Ethiopia', 'Eritrea', 'Djibouti', 'Somalia', 'Somaliland'] }],
  ['Congo', 'África', { c: ['Dem. Rep. Congo', 'Congo', 'Gabon', 'Eq. Guinea', 'Central African Rep.', 'Cameroon'] }],
  ['África Oriental', 'África', { c: ['Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi'] }],
  ['Angola', 'África', 'Angola'],
  ['Moçambique', 'África', { c: ['Mozambique', 'Malawi'] }],
  ['África Austral', 'África', { c: ['South Africa', 'Namibia', 'Botswana', 'Zimbabwe', 'Zambia', 'Lesotho', 'eSwatini'] }],
  ['Madagascar', 'África', 'Madagascar'],
  ['Índia', 'Ásia', { c: ['India', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan'] }],
  ['Paquistão', 'Ásia', 'Pakistan'],
  ['China Norte', 'Ásia', { c: ['China'], b: [B(73, 118, 32, 54), B(118, 135, 32, 40)] }],
  ['Manchúria', 'Ásia', { c: ['China'], b: [B(118, 135, 40, 54)] }],
  ['China Sul', 'Ásia', { c: ['China'], b: [B(73, 135, 15, 32)] }],
  ['Taiwan', 'Ásia', 'Taiwan'],
  ['Coreia do Norte', 'Ásia', 'North Korea'],
  ['Coreia do Sul', 'Ásia', 'South Korea'],
  ['Japão', 'Ásia', 'Japan'],
  ['Indochina', 'Ásia', { c: ['Vietnam', 'Laos', 'Cambodia'] }],
  ['Sião e Birmânia', 'Ásia', { c: ['Thailand', 'Myanmar'] }],
  ['Malásia', 'Oceania', { c: ['Malaysia', 'Brunei'] }],
  ['Filipinas', 'Oceania', 'Philippines'],
  ['Índias Orientais', 'Oceania', { c: ['Indonesia', 'Timor-Leste'] }],
  ['Nova Guiné', 'Oceania', { c: ['Papua New Guinea', 'Solomon Is.'] }],
  ['Austrália Oeste', 'Oceania', { c: ['Australia'], b: [B(110, 135, -45, -10)] }],
  ['Austrália Leste', 'Oceania', { c: ['Australia'], b: [B(135, 155, -45, -10)] }],
  ['Nova Zelândia', 'Oceania', 'New Zealand'],
];
  return WORLD;
})();
// estados: a terceira posição é a lista de nomes (EUA) ou siglas (Brasil) das divisões
export const USD = (() => {
  const D = [
    ['Nova Inglaterra', 'Nordeste', ['Maine', 'New Hampshire', 'Vermont', 'Massachusetts', 'Rhode Island', 'Connecticut']], ['Nova York', 'Nordeste', ['New York']], ['Pensilvânia', 'Nordeste', ['Pennsylvania', 'New Jersey']],
    ['Maryland', 'Estados de Fronteira', ['Maryland', 'Delaware', 'District of Columbia']], ['Virgínia Ocidental', 'Estados de Fronteira', ['West Virginia']], ['Kentucky', 'Estados de Fronteira', ['Kentucky']], ['Missouri', 'Estados de Fronteira', ['Missouri']],
    ['Ohio', 'Meio-Oeste', ['Ohio']], ['Indiana', 'Meio-Oeste', ['Indiana']], ['Illinois', 'Meio-Oeste', ['Illinois']], ['Michigan', 'Meio-Oeste', ['Michigan']], ['Wisconsin', 'Meio-Oeste', ['Wisconsin']], ['Minnesota', 'Meio-Oeste', ['Minnesota']], ['Iowa', 'Meio-Oeste', ['Iowa']],
    ['Virgínia', 'Sul Atlântico', ['Virginia']], ['Carolina do Norte', 'Sul Atlântico', ['North Carolina']], ['Carolina do Sul', 'Sul Atlântico', ['South Carolina']], ['Geórgia', 'Sul Atlântico', ['Georgia']], ['Flórida', 'Sul Atlântico', ['Florida']],
    ['Tennessee', 'Sul Profundo', ['Tennessee']], ['Alabama', 'Sul Profundo', ['Alabama']], ['Mississippi', 'Sul Profundo', ['Mississippi']],
    ['Luisiana', 'Trans-Mississippi', ['Louisiana']], ['Arkansas', 'Trans-Mississippi', ['Arkansas']], ['Texas', 'Trans-Mississippi', ['Texas']],
    ['Kansas', 'Oeste', ['Kansas']], ['Território Indígena', 'Oeste', ['Oklahoma']], ['Nebraska', 'Oeste', ['Nebraska']], ['Dakota', 'Oeste', ['North Dakota', 'South Dakota']], ['Colorado', 'Oeste', ['Colorado']], ['Novo México', 'Oeste', ['New Mexico', 'Arizona']],
    ['Território de Washington', 'Costa do Pacífico', ['Washington', 'Idaho', 'Montana', 'Wyoming']], ['Oregon', 'Costa do Pacífico', ['Oregon']], ['Califórnia', 'Costa do Pacífico', ['California']], ['Nevada e Utah', 'Costa do Pacífico', ['Nevada', 'Utah']],
  ];
  return D;
})();
export const BRD = (() => {
  const D = [
    ['Alto Amazonas', 'Norte', ['am', 'rr']], ['Grão-Pará', 'Norte', ['pa', 'ap']], ['Maranhão', 'Norte', ['ma']],
    ['Piauí', 'Nordeste', ['pi']], ['Ceará', 'Nordeste', ['ce']], ['Rio Grande do Norte', 'Nordeste', ['rn']], ['Paraíba', 'Nordeste', ['pb']], ['Pernambuco', 'Nordeste', ['pe']], ['Alagoas', 'Nordeste', ['al']], ['Sergipe', 'Nordeste', ['se']], ['Bahia', 'Nordeste', ['ba']],
    ['Goiás', 'Centro', ['go', 'to', 'df']], ['Mato Grosso', 'Centro', ['mt', 'ms', 'ro']],
    ['Minas Gerais', 'Sudeste', ['mg']], ['Espírito Santo', 'Sudeste', ['es']], ['Corte (Rio de Janeiro)', 'Sudeste', ['rj']], ['São Paulo', 'Sudeste', ['sp']],
    ['Curitiba', 'Sul', ['pr']], ['Santa Catarina', 'Sul', ['sc']], ['Rio Grande do Sul', 'Sul', ['rs']],
  ];
  return D;
})();
