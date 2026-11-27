# Soberania: levantamento completo de sistemas

Nov 24, 2026 · @Flavio

## Resumo e princípios

O Soberania pode crescer de "War com governo" para um jogo de civilização completo sem perder o que já funciona. O núcleo fica igual: território, dados, campanha e remanejamento. O resto entra em camadas que se acendem por cenário ou por nível de complexidade.

Este documento lista tudo o que pode ser usado. Cada sistema tem o que é, como funciona, de onde vem a ideia e como usar no jogo. A implementação vem depois, por partes (seção Roteiro).

**Princípios que valem para tudo:**

1. **A guerra continua no centro.** Todo sistema novo alimenta ou limita a guerra: produz tropas, move tropas, defende, dá motivo para atacar.
2. **Toda escolha custa outra.** Pontos de ação, produção e recursos são escassos. Construir uma ferrovia é não construir um quartel neste turno.
3. **O que se constrói mora no mapa.** Estruturas ficam no território e trocam de dono na conquista. Isso dá valor a cada pedaço de terra e motivo para atacar o vizinho desenvolvido.
4. **Cadeias curtas e legíveis.** Uma estrutura exige no máximo dois insumos. O jogador entende em um olhar por que não pode construir algo.
5. **Camadas ligáveis.** Os sistemas se agrupam em três níveis: Essencial (o jogo de hoje), Padrão e Completo. Isso segue a decisão de 20/11 no [documento de escopo](https://claude.ai/artifact/FSpAXAys2GhG83Uf54ihGR).
6. **Original.** As mecânicas são do gênero (Civilization, Catan, Through the Ages, Anno, Victoria). Nomes, números e combinações são nossos.

**Como ler:** cada catálogo traz uma tabela com identificador. Os prefixos são `D` duração, `M` mapa, `R` recurso, `Z` zona, `C` construção, `P` produção em turnos, `L` logística, `T` comércio, `K` tecnologia, `A` exército, `S` população e sociedade, `G` governo, `DP` diplomacia, `F` figuras e espionagem, `E` eras e eventos, `V` vitória, `MC` modo Civilização, `IA` inteligência artificial e `UI` interface. Os identificadores servem para pedir partes específicas depois, como "implementar R-01 a R-10 e C-01 a C-15".

## Pedidos mapeados

Cada pedido da mensagem de 24/11 vira um ou mais sistemas deste documento.

| Pedido | Onde está | Ideia central |
| --- | --- | --- |
| Partida mais longa | Duração da partida | Mais rodadas, metas mais altas, crescimento em degraus |
| Sem limite de duas construções por território | Construções; Zonas | Limite vira capacidade que cresce com população e terreno |
| Estradas, ferrovias, aeroporto, estaleiro, indústrias por tipo | Construções; Infraestrutura | Catálogo de cerca de 70 estruturas em 9 famílias |
| Zonas: industrial, comercial, agrícola, pecuária, científica, pesqueira, mineração | Zonas de especialização | 14 zonas, cada uma com requisitos de terreno e bônus |
| Tecnologia libera melhorias; melhorias liberam outras e tecnologias | Tecnologias; Construções | Requisitos cruzados e "descobertas" que barateiam tecnologias |
| Influência, recursos, ciência, comida, luxo, minérios vêm das estruturas | Recursos | Tudo é produzido no território; nada cai do céu |
| Estrutura só se constrói com o recurso certo ligado | Infraestrutura; Recursos | Rede de transporte decide o que chega aonde |
| Estradas e ferrovias ampliam a movimentação em níveis | Infraestrutura | Alcance de 1, 2 ou 3 territórios por nível de via |
| Portos e aeroportos movem tropas entre regiões | Infraestrutura | Transporte marítimo e ponte aérea entre nós |
| Rotas comerciais liberam estruturas | Comércio | Rotas dão acesso a recursos de fora e bônus |
| Obras levam turnos | Construção em turnos | Fila de produção por território |
| Mais coisas do Civilization | Todas as seções de 11 a 17 | População, governo, diplomacia, grandes figuras, eras, vitórias |
| Começar do zero em mapa aleatório e chegar aos dias atuais | Modo Civilização | Geração de mapa, exploração, fundação de cidades, 8 eras |

## Duração da partida

Hoje as partidas acabam entre a 5ª e a 10ª rodada porque o objetivo pede pouco (crescer 20% do mapa) e nada freia quem conquista rápido. Alongar é dar mais coisas para fazer e mais freios, não só mais rodadas.

| Id | Mudança | Efeito esperado | Como usar no jogo |
| --- | --- | --- | --- |
| D-01 | Velocidade de jogo: Rápida, Normal, Épica | Normal dobra a duração atual; Épica triplica | Multiplica rodadas, custos de obras e de tecnologias pelo mesmo fator (1, 2, 3) |
| D-02 | Objetivo em etapas | Vitória vira uma sequência de 3 metas | Ex.: Farrapos: 1) tomar Santa Catarina; 2) ter 3 obras industriais; 3) controlar São Paulo por 2 turnos |
| D-03 | Manter o objetivo por mais tempo | Rival tem tempo de reagir | Segurar a meta até o início do turno seguinte vira 2 ou 3 turnos completos |
| D-04 | Rodada mínima para vitória | Evita vitória-relâmpago | Objetivo só conta a partir de 1/3 da partida |
| D-05 | Custo de ocupação | Conquista rápida desestabiliza | Território conquistado fica "ocupado" por alguns turnos: produz metade e pode se revoltar (ver População) |
| D-06 | Cansaço de guerra | Guerra longa tem custo político | Cada turno em campanha soma cansaço; acima de um limite, estabilidade cai e reformas ficam caras |
| D-07 | Linhas de suprimento | Exército longe de casa enfraquece | Atacar a mais de N territórios de uma base de suprimento perde 1 dado (ver Exército) |
| D-08 | Crescimento em degraus | Economia demora a engrenar | Territórios sobem de nível (aldeia, vila, cidade, metrópole) e só então ganham mais capacidade |
| D-09 | Eras dentro do cenário | O meio do jogo muda de cara | Um cenário longo atravessa duas eras, com tecnologias que mudam as regras no meio |
| D-10 | IA mais cautelosa | Menos ataques suicidas | IA só ataca com vantagem clara e guarda reservas; ataca mais quando o jogador relaxa |
| D-11 | Salvar e continuar | Partida longa sem medo | Já existe (salvar no navegador). Acrescentar vários espaços de salvamento e exportar arquivo |
| D-12 | Desgaste da blitz (v43) | Ataques seguem ilimitados, mas avançar rápido custa | As 3 primeiras conquistas do turno são livres; a 4ª custa 4 de estabilidade e 1 tropa, a 5ª custa 8, a 6ª custa 12, e assim por diante. A IA para quando a estabilidade cairia abaixo de 45, salvo para tomar uma capital |
| D-13 | Guerra defensiva (v43) | Quem é invadido reage em vez de se encolher | Facção que perdeu território na rodada anterior ignora o cansaço de guerra ao decidir campanha e tende a contra-atacar |
| D-14 | Última resistência (v45) | Facções pequenas não somem num único ataque | A capital de quem tem até 2 territórios soma +1 à defesa |
| D-15 | Cansaço do invadido limitado (v46) | Império atacado em várias frentes não desmorona em 2 rodadas | Perder territórios soma cansaço de guerra só uma vez por rodada (antes, +2 por território) |
| D-16 | Agitação saturada (v46) | Rivais somados não zeram a estabilidade de uma vez | Na mesma rodada, só a primeira agitação (ação ou carta) contra uma facção vale inteira; as seguintes valem 1/3 |
| D-18 | Abertura protegida (v55) | `openR()` = mín(8, teto(rodadas ÷ 15)): capitais de facções não podem ser atacadas até o fim dessa rodada (4 na curta, 8 na média e na longa). Vale para jogador e IA via `canAtk`; `atkWhy` explica. Substitui a proteção só da 1ª rodada. | Feito |
| D-19 | Turno livre e campanha automática (v62) | Para o jogador, a etapa militar acompanha os reforços: `render()` mantém `G.phase` em `ref` enquanto houver reforços e em `atk` depois, até o jogador remanejar (`mov`). A gestão (obras, pesquisa, governo, diplomacia, comércio, recrutamento, influência) vale em qualquer etapa. Não existe mais a ação de declarar campanha: `warOn()` põe a facção em campanha no primeiro ataque ou bombardeio do turno, e só então o turno soma cansaço de guerra. `atkWhy()` explica toda recusa; `brk()` identifica trégua ou aliança e `warModal()` mostra as consequências antes de `betray()`. Encerrar o turno exige reforços distribuídos. A IA segue declarando campanha como antes. | Feito |
| D-17 | Supremacia naval (v50) | Frota = travessias por turno. Desembarque rola no máximo 2 dados, salvo porto na origem, navegação, almirante ou frota pelo menos 2 acima da do defensor. Se a frota do defensor for maior que a do atacante, ele ganha +1 no maior dado contra desembarques | Dá peso à marinha dos dois lados |

**Sugestão de alvo:** cenários históricos com 30 a 40 rodadas na velocidade Normal, cerca de 2 a 3 horas de jogo. O Modo Civilização fica com 200 a 300 rodadas, jogável em várias sessões.

## Mapa, terrenos e recursos naturais

Cada território passa a ter um terreno principal, até dois traços geográficos e de zero a três jazidas. Isso decide o que ele produz, o que pode construir e quanto resiste a um ataque. Hoje todos os territórios são iguais; esse é o maior salto de profundidade com o menor custo de regra.

### Terrenos

| Id | Terreno | Comida | Produção | Ouro | Defesa | Uso típico |
| --- | --- | --- | --- | --- | --- | --- |
| M-01 | Planície fértil | 3 | 1 | 0 | 0 | Zona agrícola, cidades grandes |
| M-02 | Pradaria e campos | 2 | 1 | 0 | 0 | Pecuária, cavalos |
| M-03 | Floresta | 1 | 2 | 0 | +1 dado de defesa se ≥ 3 tropas | Madeira, serrarias, defesa |
| M-04 | Selva e floresta tropical | 1 | 1 | 1 | +1 | Luxos (especiarias, borracha), doenças |
| M-05 | Colinas | 1 | 2 | 0 | +1 no maior dado | Mineração leve, fortalezas |
| M-06 | Montanhas | 0 | 2 | 0 | +1 no maior dado e atacante perde empates | Mineração pesada, observatórios |
| M-07 | Deserto | 0 | 1 | 1 | 0 | Petróleo, sal, energia solar |
| M-08 | Estepe e semiárido | 1 | 1 | 0 | 0 | Cavalos, pecuária extensiva |
| M-09 | Tundra e taiga | 1 | 1 | 0 | 0 | Peles, madeira, gás |
| M-10 | Pântano e alagado | 1 | 0 | 0 | atacante usa 1 dado a menos | Arroz depois de drenagem |
| M-11 | Gelo e alta montanha | 0 | 0 | 0 | intransponível sem tecnologia | Fora do jogo até a era moderna |

### Traços geográficos

| Id | Traço | Efeito | Libera |
| --- | --- | --- | --- |
| M-20 | Rio | +1 comida, +1 ouro; atacar atravessando rio perde 1 dado | Moinho, hidrelétrica, barcos fluviais |
| M-21 | Litoral | +1 comida | Porto, estaleiro, pesca, travessias |
| M-22 | Lago | +1 comida, água doce | Aqueduto barato, pesca de lago |
| M-23 | Delta ou várzea | +2 comida | Arroz, grandes populações |
| M-24 | Passo de montanha | Defesa dobrada no maior dado contra quem vem de fora | Fortaleza de passo |
| M-25 | Estreito ou canal | Controla uma travessia marítima | Canal (Suez, Panamá), pedágio |
| M-26 | Ilha | Só se chega pelo mar ou pelo ar | Bases navais |

### Jazidas

Cada território tem de 0 a 3 jazidas, escolhidas do catálogo de Recursos. Algumas ficam ocultas até a tecnologia certa: carvão aparece com Metalurgia, petróleo com Refino, urânio com Física Atômica. Isso cria corridas por territórios que antes não valiam nada, como o Oriente Médio no século XX.

**Nos mapas históricos,** terreno e jazidas seguem a geografia real e aproximada: ouro e ferro em Minas Gerais, açúcar no Nordeste, charque e cavalos no Rio Grande do Sul, prata no Collasuyo, sal e incenso na Arábia. **No Modo Civilização,** o gerador distribui por clima e latitude.

**Detalhe que o mapa precisa mostrar:** um ícone pequeno de terreno no território, as jazidas ao passar o mouse e um filtro de mapa ("lente") para ver só recursos.

## Catálogo de recursos

Os recursos se dividem em dois grupos com regras diferentes. **Rendimentos** são fluxos que cada território produz por turno (comida, produção, ouro, ciência). **Bens** são materiais físicos de uma jazida explorada, que só servem se estiverem ligados ao império por via de transporte ou rota comercial. Nada é de graça: todo rendimento sai de terreno, população ou estrutura.

### Rendimentos (fluxos por turno)

| Id | Rendimento | Vem de | Serve para |
| --- | --- | --- | --- |
| R-01 | Comida | Terreno, fazendas, pesca, pecuária | Crescer a população do território; sustentar tropas acima de um limite |
| R-02 | Produção | Terreno, minas, serrarias, indústrias, população | Avançar a fila de obras e de tropas do território |
| R-03 | Ouro | Comércio, mercados, rotas, impostos | Manutenção, compra imediata, diplomacia, recrutamento |
| R-04 | Ciência | População, bibliotecas, universidades, laboratórios | Tecnologias |
| R-05 | Cultura | Templos, teatros, monumentos, maravilhas | Doutrinas de governo, fronteiras, vitória cultural |
| R-06 | Influência (prestígio) | Palácio, embaixadas, cultura, vitórias | Diplomacia, anexação pacífica, alianças |
| R-07 | Felicidade | Luxos, entretenimento, religião, políticas | Estabilidade; sem ela há revoltas e greves |
| R-08 | Saúde | Água, aquedutos, saneamento, hospitais | Limite de população; proteção contra epidemias |
| R-09 | Energia (era industrial em diante) | Carvão, hidrelétrica, petróleo, nuclear, solar, eólica | Indústrias e cidades grandes só rendem tudo com energia |
| R-10 | Poluição (negativo) | Indústria suja, carvão, petróleo | Reduz saúde e felicidade; base para eventos climáticos |

### Bens (materiais de jazidas e cadeias)

| Id | Bem | Tipo | Aparece em | Onde nasce | Explorado por | Usos no jogo |
| --- | --- | --- | --- | --- | --- | --- |
| R-20 | Trigo, cevada | Alimento | Antiguidade | Planície, rio | Fazenda | +comida; pão e cerveja para felicidade |
| R-21 | Arroz | Alimento | Antiguidade | Delta, pântano drenado | Arrozal | +comida alta |
| R-22 | Milho | Alimento | Antiguidade (Américas) | Planície, colina | Fazenda | +comida |
| R-23 | Gado, ovinos | Alimento e couro | Antiguidade | Pradaria, estepe | Pasto, estância | +comida, couro para cavalaria e calçados |
| R-24 | Peixe, frutos do mar | Alimento | Antiguidade | Litoral, lago | Pesqueiro | +comida, +ouro |
| R-25 | Madeira | Material | Antiguidade | Floresta | Serraria | Construção, navios até a era industrial |
| R-26 | Pedra, mármore | Material | Antiguidade | Colina, montanha | Pedreira | Muralhas, templos, maravilhas |
| R-27 | Argila | Material | Antiguidade | Rio, várzea | Olaria | Cerâmica, tijolos (custo menor de obras) |
| R-30 | Cobre | Minério | Antiguidade | Colina | Mina | Bronze (com estanho), moedas |
| R-31 | Estanho | Minério | Antiguidade | Colina, montanha | Mina | Bronze |
| R-32 | Ferro | Minério estratégico | Antiguidade | Colina, montanha | Mina | Armas de ferro, aço, ferrovias |
| R-33 | Ouro | Minério precioso | Antiguidade | Montanha, rio | Mina, garimpo | +ouro alto, moeda, maravilhas |
| R-34 | Prata | Minério precioso | Antiguidade | Montanha | Mina | +ouro, moeda |
| R-35 | Sal | Minério e luxo | Antiguidade | Deserto, litoral | Salina | Conservar comida (+1 comida por fazenda ligada), felicidade |
| R-36 | Carvão | Energia e estratégico | Era industrial | Colina, floresta antiga | Mina | Energia, aço, navios a vapor, ferrovias |
| R-37 | Salitre | Estratégico | Era da pólvora | Deserto, caverna | Mina | Pólvora, munição, fertilizantes depois |
| R-38 | Enxofre | Estratégico | Era da pólvora | Vulcão, deserto | Mina | Pólvora, química |
| R-39 | Chumbo, zinco | Minério | Era da pólvora | Colina | Mina | Munição, baterias |
| R-40 | Petróleo | Energia e estratégico | Era moderna | Deserto, litoral, tundra | Poço, plataforma | Combustível, blindados, aviação, plástico |
| R-41 | Gás natural | Energia | Era moderna | Tundra, deserto | Poço | Energia mais limpa que carvão, fertilizante |
| R-42 | Borracha | Estratégico | Era industrial | Selva | Seringal | Pneus, blindados, aviação |
| R-43 | Bauxita (alumínio) | Estratégico | Era moderna | Selva, colina | Mina e usina com energia | Aviação, foguetes |
| R-44 | Níquel, cromo | Minério | Era moderna | Montanha | Mina | Aço especial, blindagem |
| R-45 | Urânio | Estratégico | Era atômica | Deserto, montanha | Mina | Energia nuclear; arma nuclear só se o anfitrião ligar |
| R-46 | Terras raras | Estratégico | Era da informação | Montanha | Mina | Eletrônicos, mísseis, energia limpa |
| R-47 | Lítio | Estratégico | Era da informação | Deserto salino | Salina industrial | Baterias, carros elétricos, armazenamento |
| R-50 | Especiarias | Luxo | Antiguidade | Selva, litoral tropical | Plantação | Felicidade; motor das grandes rotas |
| R-51 | Seda | Luxo | Antiguidade | Planície temperada | Sericultura | Felicidade, comércio de longa distância |
| R-52 | Vinho | Luxo | Antiguidade | Colina temperada | Vinhedo | Felicidade, cultura |
| R-53 | Incenso, mirra | Luxo | Antiguidade | Deserto | Plantação | Felicidade, cultura religiosa |
| R-54 | Açúcar | Luxo e alimento | Idade Média | Litoral tropical | Engenho | Felicidade, ouro alto |
| R-55 | Chá, café, cacau | Luxo | Idade Moderna | Colina tropical | Plantação | Felicidade, +ciência (cafés e salões) |
| R-56 | Tabaco | Luxo | Idade Moderna | Planície tropical | Plantação | Felicidade, ouro; saúde cai na era moderna |
| R-57 | Algodão | Luxo e insumo | Antiguidade | Planície quente | Plantação | Tecidos (indústria têxtil) |
| R-58 | Peles, marfim | Luxo | Antiguidade | Tundra, savana | Acampamento de caça | Felicidade; marfim sai do jogo com Conservação |
| R-59 | Pérolas, corais | Luxo | Antiguidade | Litoral quente | Pesqueiro | Felicidade, ouro |
| R-60 | Pedras preciosas | Luxo | Antiguidade | Montanha, selva | Mina | Felicidade, ouro alto |
| R-61 | Corantes | Luxo e insumo | Antiguidade | Selva, litoral | Plantação | Felicidade, tecidos finos |
| R-62 | Cavalos | Estratégico | Antiguidade | Pradaria, estepe | Haras | Cavalaria e carros de guerra; correio rápido |

### Bens manufaturados (cadeias de produção)

Uma indústria transforma bens de jazida em bens manufaturados, como em Anno ou Victoria. Cada cadeia tem no máximo dois insumos.

| Id | Produto | Insumos | Indústria | Usos |
| --- | --- | --- | --- | --- |
| R-70 | Bronze | Cobre + estanho | Fundição | Tropas da Idade do Bronze, estátuas |
| R-71 | Ferramentas | Ferro + madeira | Ferraria | +1 produção em minas e fazendas ligadas |
| R-72 | Armas | Ferro (ou bronze) | Arsenal | Exigidas para tropas de qualidade (ver Exército) |
| R-73 | Pólvora | Salitre + enxofre | Polvorinho | Mosquetes, artilharia, mineração com explosivos |
| R-74 | Tecidos | Algodão ou lã | Têxtil | Felicidade, uniformes, ouro de exportação |
| R-75 | Aço | Ferro + carvão | Siderúrgica | Ferrovias, navios de aço, arranha-céus, blindados |
| R-76 | Máquinas | Aço + energia | Metalúrgica | Multiplicam produção; tratores, fábricas |
| R-77 | Combustível | Petróleo | Refinaria | Blindados, aviação, transporte motorizado |
| R-78 | Produtos químicos | Enxofre ou petróleo + energia | Química | Fertilizantes (+comida), remédios, plásticos |
| R-79 | Bens de consumo | Tecidos + máquinas | Fábrica de bens | Felicidade forte na era moderna |
| R-80 | Eletrônicos | Terras raras + energia | Eletrônica | Computadores, mísseis, +ciência |
| R-81 | Medicamentos | Químicos | Farmacêutica | Saúde, crescimento, resistência a epidemias |

### Duas regras de uso

- **Luxos contam por acesso.** Cada tipo diferente ligado ao império dá felicidade. A segunda unidade do mesmo luxo não soma nada, então o excedente é para vender. Isso cria comércio natural.
- **Estratégicos e manufaturados contam por estoque.** A jazida produz unidades por turno, e construir ou recrutar consome. Faltou ferro, não há legião. Faltou petróleo, o tanque fica parado.

## Zonas de especialização

Uma zona é a vocação de um território: o jogador declara que ele será agrícola, industrial, científico e assim por diante. Declarar a zona custa produção e um turno de obra. A zona dá um rendimento base e libera as construções daquele tipo. É a versão do Soberania para os distritos do Civilization VI, com uma diferença: aqui o território inteiro tem vocações, não uma casa no mapa.

**Quantas zonas por território:** o limite de duas construções sai. No lugar entra a capacidade, que cresce com o nível do território (ver População): aldeia 1 zona, vila 2, cidade 3, metrópole 4, megalópole 5. Dentro de cada zona não há limite de construções, só os requisitos de cada uma.

**Polos:** zonas iguais em territórios vizinhos se reforçam. Cada vizinho com a mesma zona dá +1 no rendimento principal, até +3. Isso cria o Vale do Silício, o ABC paulista, o cinturão agrícola. O mapa passa a ter regiões com cara própria, e conquistar o centro de um polo dói no inimigo.

| Id | Zona | Exige | Rendimento base | Bônus de vizinhança | Abriga (exemplos) | A partir de |
| --- | --- | --- | --- | --- | --- | --- |
| Z-01 | Centro urbano | Todo território com cidade tem um, de graça | +1 de cada rendimento | Capital: +2 influência | Palácio, mercado central, muralha, aqueduto | Sempre |
| Z-02 | Agrícola | Planície, rio, delta ou colina suave | +3 comida | +1 por rio; +1 por zona agrícola vizinha | Fazendas, arrozal, moinho, celeiro, irrigação, agroindústria | Antiguidade |
| Z-03 | Pecuária | Pradaria, estepe ou semiárido | +2 comida, +1 produção | +1 com cavalos ou gado na jazida | Estância, haras, curtume, frigorífico, charqueada | Antiguidade |
| Z-04 | Pesqueira | Litoral ou lago | +2 comida, +1 ouro | +1 com pérolas ou peixe | Pesqueiro, salga, frota pesqueira, aquicultura | Antiguidade |
| Z-05 | Florestal | Floresta ou selva | +2 produção | +1 por floresta vizinha intacta | Serraria, carvoaria, seringal, reserva florestal | Antiguidade |
| Z-06 | Mineração | Colina ou montanha, ou jazida mineral | +3 produção | +1 por jazida extra | Mina, pedreira, fundição, garimpo, mina profunda | Antiguidade |
| Z-07 | Comercial | Rio, litoral ou cruzamento de estradas | +3 ouro | +1 por rota comercial que passa; +1 por zona portuária vizinha | Mercado, feira, banco, bolsa, shopping | Antiguidade |
| Z-08 | Portuária | Litoral | +1 ouro, +1 travessia | +1 por rota marítima | Porto, estaleiro, farol, doca seca, base naval, terminal de contêineres | Antiguidade |
| Z-09 | Religiosa | Qualquer; melhor em montanha ou deserto | +2 cultura, +1 felicidade | +1 por maravilha vizinha | Templo, mosteiro, catedral, local de peregrinação | Antiguidade |
| Z-10 | Militar | Qualquer; melhor em fronteira ou passo | +1 produção, tropas mais baratas aqui | +1 de defesa se for fronteira | Quartel, haras de guerra, arsenal, academia militar, base aérea | Antiguidade |
| Z-11 | Científica | Cidade (nível 2+) | +3 ciência | +1 por montanha vizinha; +1 por zona cultural vizinha | Biblioteca, academia, universidade, observatório, laboratório, centro de pesquisa | Antiguidade |
| Z-12 | Cultural e artística | Cidade (nível 2+) | +3 cultura | +1 por maravilha vizinha | Teatro, anfiteatro, museu, conservatório, estúdio de cinema | Antiguidade |
| Z-13 | Industrial | Cidade (nível 2+) e acesso a minério ou energia | +4 produção, −1 saúde | +1 por zona de mineração ou energética vizinha | Oficina, siderúrgica, têxtil, química, metalúrgica, montadora | Era industrial |
| Z-14 | Energética | Rio (hidro), jazida (carvão, gás, petróleo, urânio), deserto (solar), litoral ou colina (eólica) | +energia para o império | +1 por zona industrial vizinha | Termelétrica, hidrelétrica, refinaria, usina nuclear, parque solar, parque eólico | Era industrial |
| Z-15 | Turística e lazer | Litoral, montanha, maravilha ou sítio histórico | +2 ouro, +2 felicidade | +1 por maravilha ou parque nacional | Estância, parque, estádio, resort, parque temático | Era industrial |
| Z-16 | Tecnológica | Metrópole com universidade e energia | +3 ciência, +2 ouro | +1 por zona científica vizinha | Centro de dados, fábrica de chips, polo de startups, centro de robótica | Era da informação |
| Z-17 | Aeroespacial | Metrópole com indústria e tecnológica | +2 produção, +2 ciência | Nenhum | Aeroporto internacional, base de lançamento, fábrica de satélites | Era atômica |

**Trocar de vocação:** uma zona pode ser demolida e substituída, perdendo as construções dela. Isso permite a reconversão histórica (cidade pesqueira que vira portuária, região mineira que vira turística) sem ser de graça.

**Na IA:** cada facção tem um perfil (agrário, mercantil, militar, científico) que pesa a escolha de zonas. Isso faz os impérios do computador parecerem diferentes entre si.

## Catálogo de construções e melhorias

São 78 construções em 11 famílias. Cada uma tem quatro tipos de requisito, e qualquer combinação deles pode valer: **zona** (onde pode ficar), **tecnologia** (quando pode existir), **bem ligado** (recurso que precisa chegar ao território pela rede ou estar no estoque do império) e **construção anterior** (a cadeia). A coluna Libera mostra o que ela destrava: outras construções, tropas e "descobertas" que barateiam uma tecnologia.

Turnos são para velocidade Normal e um território de produção média. Produção maior termina antes; ouro pode apressar (ver Construção em turnos).

### Alimento e campo

| Id | Construção | Zona | Exige | Turnos | Efeito | Libera |
| --- | --- | --- | --- | --- | --- | --- |
| C-01 | Fazenda | Agrícola | Agricultura | 2 | +2 comida | Celeiro; descoberta de Irrigação |
| C-02 | Celeiro | Agrícola | Fazenda | 2 | +1 comida, guarda comida contra fome | Mercado de grãos |
| C-03 | Canal de irrigação | Agrícola | Irrigação; rio ou lago no território ou vizinho | 3 | +2 comida em todas as fazendas do território | Arrozal em pântano |
| C-04 | Moinho | Agrícola | Rio; Mecânica | 3 | +1 comida, +1 produção | Descoberta de Engrenagens |
| C-05 | Arrozal | Agrícola | Arroz ou delta; Irrigação | 3 | +3 comida | População grande |
| C-06 | Plantação | Agrícola | Jazida de luxo vegetal (especiaria, açúcar, café...) | 3 | Liga o luxo; +1 ouro | Engenho, torrefação |
| C-07 | Engenho | Agrícola | Plantação de açúcar; Mecânica | 4 | +3 ouro, −1 felicidade sem Abolição | Rota do açúcar |
| C-08 | Estância | Pecuária | Gado ou ovinos | 2 | +2 comida, +1 produção, couro | Charqueada, curtume |
| C-09 | Haras | Pecuária | Cavalos | 3 | +1 cavalo por turno | Cavalaria, correio montado |
| C-10 | Charqueada e frigorífico | Pecuária | Estância + sal (charque) ou energia (frigorífico) | 4 | +2 comida exportável, +2 ouro | Rota da carne |
| C-11 | Pesqueiro | Pesqueira | Litoral ou lago | 2 | +2 comida | Salga, frota pesqueira |
| C-12 | Salga e conserva | Pesqueira | Pesqueiro + sal | 3 | +2 comida que viaja (abastece tropas) | Suprimento naval |
| C-13 | Aquicultura | Pesqueira | Biologia | 4 | +3 comida | — |
| C-14 | Agroindústria | Agrícola | Fertilizantes; energia | 5 | Dobra a comida da zona | Megalópole |

### Extração

| Id | Construção | Zona | Exige | Turnos | Efeito | Libera |
| --- | --- | --- | --- | --- | --- | --- |
| C-20 | Serraria | Florestal | Floresta; Ferramentas de bronze | 2 | +2 produção, +1 madeira | Estaleiro, carpintaria |
| C-21 | Carvoaria | Florestal | Serraria | 2 | +1 carvão vegetal (substitui carvão mineral até a era industrial) | Fundição primitiva |
| C-22 | Seringal | Florestal | Borracha; Vulcanização | 3 | +1 borracha | Pneus, blindados |
| C-23 | Reserva florestal | Florestal | Ecologia | 3 | +2 felicidade, +1 saúde, reduz poluição | Turismo ecológico |
| C-24 | Pedreira | Mineração | Pedra; Alvenaria | 2 | +2 produção, +1 pedra | Muralhas, maravilhas |
| C-25 | Mina | Mineração | Jazida mineral; Mineração | 3 | +2 produção, +1 do minério | Fundição; descoberta de Metalurgia |
| C-26 | Garimpo | Mineração | Ouro, pedras ou estanho em rio | 2 | +3 ouro, −1 saúde | Corrida do ouro (evento) |
| C-27 | Mina profunda | Mineração | Mina; Máquina a vapor + carvão | 4 | Dobra a extração | Revela jazidas ocultas |
| C-28 | Poço de petróleo | Energética | Petróleo; Refino | 4 | +1 petróleo por turno | Refinaria |
| C-29 | Plataforma marítima | Portuária | Petróleo no mar; Plásticos | 6 | +2 petróleo | — |
| C-30 | Salina | Mineração ou Pesqueira | Sal ou lítio | 2 | +1 do bem, +1 ouro | Salga, baterias |

### Indústria (por tipo)

| Id | Construção | Zona | Exige | Turnos | Efeito | Libera |
| --- | --- | --- | --- | --- | --- | --- |
| C-40 | Oficina de artesãos | Centro urbano | Oficícios | 2 | +2 produção | Ferraria, olaria |
| C-41 | Fundição | Mineração ou Industrial | Mina de cobre + estanho (bronze) ou ferro | 3 | Produz bronze ou ferro trabalhado | Arsenal; descoberta de Fundição do Ferro |
| C-42 | Ferraria | Centro urbano ou Industrial | Ferro + madeira | 3 | +1 ferramentas por turno | Arsenal |
| C-43 | Arsenal | Militar | Ferraria | 4 | +1 armas por turno; tropas melhores | Infantaria pesada |
| C-44 | Polvorinho | Militar | Pólvora (tecnologia); salitre + enxofre | 4 | +1 pólvora por turno | Mosqueteiros, artilharia |
| C-45 | Manufatura têxtil | Industrial | Algodão ou lã; Tear mecânico | 4 | +1 tecidos, +2 ouro | Bens de consumo; descoberta de Máquina a vapor |
| C-46 | Siderúrgica | Industrial | Ferro + carvão; Siderurgia | 6 | +1 aço por turno, −2 saúde | Ferrovia, navios de aço, arranha-céu |
| C-47 | Metalúrgica | Industrial | Aço + energia | 6 | +1 máquinas; +25% produção no território | Montadora, tratores |
| C-48 | Indústria química | Industrial | Enxofre ou petróleo + energia; Química | 6 | +1 químicos | Fertilizantes, farmacêutica, plásticos |
| C-49 | Refinaria | Energética | Poço de petróleo ligado | 5 | +1 combustível por turno | Blindados, aviação, rodovias |
| C-50 | Montadora | Industrial | Máquinas + borracha + combustível | 7 | Tropas motorizadas mais baratas; +bens de consumo | Rodovia, aeroporto |
| C-51 | Fábrica de bens de consumo | Industrial | Tecidos + máquinas | 5 | +3 felicidade no império | Shopping |
| C-52 | Farmacêutica | Industrial ou Científica | Químicos | 5 | +2 saúde no império | Hospital moderno |
| C-53 | Eletrônica e semicondutores | Tecnológica | Terras raras + energia | 7 | +1 eletrônicos, +2 ciência | Centro de dados, mísseis |

### Comércio e finanças

| Id | Construção | Zona | Exige | Turnos | Efeito | Libera |
| --- | --- | --- | --- | --- | --- | --- |
| C-60 | Feira e mercado | Comercial | Moeda | 2 | +2 ouro, +1 por luxo ligado | Caravançará |
| C-61 | Caravançará | Comercial | Mercado; estrada | 3 | +1 rota comercial terrestre | Rota da seda (evento) |
| C-62 | Banco | Comercial | Bancos; mercado | 4 | +25% ouro no território | Bolsa; empréstimos |
| C-63 | Bolsa de valores | Comercial | Banco; Economia | 5 | +ouro por rota; investimento em outras facções | Corporações |
| C-64 | Armazém alfandegário | Portuária | Porto | 3 | +1 rota marítima; tarifas | Companhia de comércio |
| C-65 | Companhia de comércio | Comercial ou Portuária | Navegação oceânica | 5 | Rotas para outros continentes; feitorias | Colônia mercantil |
| C-66 | Shopping e centro comercial | Comercial | Bens de consumo | 4 | +2 felicidade, +2 ouro | — |

### Ciência e educação

| Id | Construção | Zona | Exige | Turnos | Efeito | Libera |
| --- | --- | --- | --- | --- | --- | --- |
| C-70 | Biblioteca | Científica | Escrita | 2 | +2 ciência | Academia |
| C-71 | Academia e escola de escribas | Científica | Biblioteca; Filosofia | 3 | +2 ciência, +1 cultura | Universidade; grandes cientistas |
| C-72 | Observatório | Científica | Astronomia; colina ou montanha vizinha | 3 | +2 ciência; descoberta de Navegação | — |
| C-73 | Universidade | Científica | Academia; Educação | 5 | +4 ciência | Laboratório |
| C-74 | Escola pública | Centro urbano | Educação pública | 3 | +1 ciência por nível do território | Mobilidade social (felicidade) |
| C-75 | Laboratório de pesquisa | Científica | Universidade + energia; Método científico | 6 | +5 ciência | Centro de pesquisa |
| C-76 | Centro de pesquisa avançada | Científica ou Tecnológica | Laboratório + eletrônicos | 7 | +7 ciência | Projetos de era (espacial, genômica) |

### Cultura, fé e lazer

| Id | Construção | Zona | Exige | Turnos | Efeito | Libera |
| --- | --- | --- | --- | --- | --- | --- |
| C-80 | Monumento | Centro urbano | — | 1 | +1 cultura, +1 influência | — |
| C-81 | Templo | Religiosa | Misticismo | 2 | +1 cultura, +1 felicidade | Mosteiro, catedral |
| C-82 | Mosteiro | Religiosa | Templo | 3 | +1 ciência, +1 cultura; copia livros (protege ciência em eras escuras) | Universidade mais barata |
| C-83 | Catedral e grande templo | Religiosa | Templo + pedra | 5 | +3 cultura, +2 felicidade | Local de peregrinação |
| C-84 | Anfiteatro e arena | Cultural | Construção civil | 3 | +2 felicidade | Estádio |
| C-85 | Teatro e ópera | Cultural | Drama | 4 | +2 cultura, +1 felicidade | Museu |
| C-86 | Museu | Cultural | Arqueologia | 4 | +3 cultura; abriga artefatos (vitória cultural) | Turismo |
| C-87 | Jornal, rádio, TV | Cultural | Imprensa → Rádio → Televisão | 3 cada | +influência; propaganda reduz cansaço de guerra | Cultura de massa |
| C-88 | Estádio | Turística | Esportes profissionais | 5 | +3 felicidade | Grandes eventos (evento) |
| C-89 | Parque nacional | Turística | Conservação; montanha ou floresta intacta | 4 | +2 felicidade, +turismo | Ecoturismo |

### Saúde, cidade e governo

| Id | Construção | Zona | Exige | Turnos | Efeito | Libera |
| --- | --- | --- | --- | --- | --- | --- |
| C-90 | Palácio | Centro urbano | Capital | — | +2 de cada rendimento, +2 influência | Sede do governo |
| C-91 | Aqueduto e cisternas | Centro urbano | Engenharia; rio, lago ou montanha a até 1 território | 3 | +2 saúde; permite passar de vila a cidade | Banhos públicos |
| C-92 | Banhos e saneamento | Centro urbano | Aqueduto → Saneamento (moderno) | 3 | +2 saúde; reduz epidemia | Metrópole |
| C-93 | Hospital | Centro urbano | Medicina; químicos na era moderna | 4 | +3 saúde; tropas feridas se recuperam | — |
| C-94 | Tribunal e governadoria | Centro urbano | Código de leis | 3 | +5 estabilidade no território; reduz corrupção pela distância | Administração regional |
| C-95 | Polícia e guarda civil | Centro urbano | Burocracia moderna | 3 | +5 estabilidade; anula agitadores | Contraespionagem |
| C-96 | Bairro residencial | Centro urbano | Urbanismo | 4 | +capacidade de população | Megalópole |

### Militar e defesa

| Id | Construção | Zona | Exige | Turnos | Efeito | Libera |
| --- | --- | --- | --- | --- | --- | --- |
| C-100 | Palamiçada | Qualquer | — | 1 | +1 no maior dado de defesa enquanto tiver 2+ tropas | Muralha |
| C-101 | Muralha | Centro urbano | Alvenaria + pedra | 4 | +1 no maior dado de defesa; anula o bônus de cavalaria | Castelo; inutilizada por Artilharia |
| C-102 | Castelo e cidadela | Militar | Castelos; muralha | 5 | +1 no maior dado e defensor ganha empates | Fortaleza abaluartada |
| C-103 | Fortaleza abaluartada | Militar | Fortificação moderna | 5 | Anula o bônus da artilharia | Bunker |
| C-104 | Bunker e linha fortificada | Militar | Concreto armado | 5 | +2 no maior dado; só em fronteira | — |
| C-105 | Quartel | Militar | Disciplina militar | 3 | +1 tropa grátis por turno; recrutamento aqui | Academia militar |
| C-106 | Academia militar | Militar | Quartel; Estratégia | 5 | Tropas recrutadas aqui ganham 1 nível de experiência | Generais (grandes figuras) |
| C-107 | Base aérea | Militar | Voo motorizado + combustível | 5 | +2 aviões; alcance +1 | Ponte aérea militar |
| C-108 | Sistema antiaéreo e radar | Militar | Radar | 4 | Abate aviões inimigos com 5 ou 6 neste território e vizinhos | Escudo antimíssil |
| C-109 | Silo de mísseis | Militar | Foguetes + eletrônicos | 6 | Ataque à distância sem avião | — |

### Energia

| Id | Construção | Zona | Exige | Turnos | Efeito | Libera |
| --- | --- | --- | --- | --- | --- | --- |
| C-110 | Termelétrica a carvão | Energética | Eletricidade + carvão | 4 | +4 energia, +2 poluição | Indústria pesada |
| C-111 | Hidrelétrica | Energética | Eletricidade; rio | 6 | +5 energia limpa | — |
| C-112 | Termelétrica a gás ou óleo | Energética | Combustível ou gás | 4 | +4 energia, +1 poluição | — |
| C-113 | Usina nuclear | Energética | Fissão + urânio | 8 | +8 energia; risco de acidente (evento) | Armas nucleares, se ligadas |
| C-114 | Parque solar e eólico | Energética | Energia renovável | 4 | +3 energia limpa | Vitória ecológica (opcional) |

### Transporte

Estradas, ferrovias, portos e aeroportos (C-120 a C-129) ficam na seção Infraestrutura, porque mudam movimento e ligação, não só rendimento.

### Maravilhas

Uma por mundo: quem termina primeiro fica com ela, e quem perde a corrida recebe parte da produção de volta em ouro. Valem legado e mudam regras. Lista inicial de 16, sempre com nomes de obras históricas reais.

| Id | Maravilha | Era | Exige | Efeito |
| --- | --- | --- | --- | --- |
| C-200 | Grandes Pirâmides | Antiguidade | Alvenaria; deserto ou rio | Construções de pedra levam 1 turno a menos |
| C-201 | Jardins Suspensos | Antiguidade | Irrigação | +1 comida em todos os territórios |
| C-202 | Grande Biblioteca | Antiguidade | Escrita + biblioteca | Recebe grátis toda tecnologia antiga que duas facções já têm |
| C-203 | Farol monumental | Antiguidade | Navegação costeira; litoral | +1 travessia; frotas ganham 1 dado |
| C-204 | Coliseu | Antiguidade | Construção civil | +2 felicidade em todos os territórios a até 3 de distância |
| C-205 | Grande Muralha | Antiguidade | Alvenaria | Fronteira terrestre inteira ganha +1 no maior dado contra nômades |
| C-206 | Catedral gótica | Idade Média | Arquitetura gótica | +3 cultura, +3 felicidade na capital |
| C-207 | Rede de caminhos do império | Idade Média | Estradas em 6+ territórios | Estradas viram nível 2 de graça |
| C-208 | Castelo do xógum | Idade Média | Castelos | Generais dão +1 dado a mais |
| C-209 | Observatório imperial | Idade Moderna | Astronomia | +25% ciência na capital |
| C-210 | Grande canal marítimo | Era industrial | Dinamite; estreito | Cria uma travessia permanente; cobra pedágio de rotas |
| C-211 | Exposição Universal | Era industrial | Indústria | +2 influência por turno; descobertas industriais mais baratas |
| C-212 | Estátua monumental | Era industrial | Metalurgia | +1 estabilidade por turno; imigração (+população) |
| C-213 | Sede das Nações | Era moderna | Diplomacia moderna | +2 votos no Congresso Mundial |
| C-214 | Programa espacial | Era atômica | Foguetes | Primeira etapa da vitória científica |
| C-215 | Rede mundial de dados | Era da informação | Computadores | +10% ciência e ouro em todo o império |

### Como as construções liberam tecnologias

Terminar uma construção pode render uma **descoberta**: um desconto de 40% numa tecnologia ligada a ela. Exemplos: terminar uma mina dá a descoberta de Metalurgia; um observatório, a de Navegação; uma manufatura têxtil, a de Máquina a vapor; um moinho, a de Engrenagens. É a ideia de "eureca" do Civilization VI: o que você faz no mapa empurra a ciência na mesma direção.

## Construção em turnos e fila de produção

Hoje uma construção fica pronta na hora. A proposta é que cada território tenha **produção** própria e uma **fila**, como as cidades do Civilization. A ação do jogador passa a ser decidir o que entra na fila, não pagar e receber no mesmo turno.

| Id | Regra | Como funciona | Ideia de uso |
| --- | --- | --- | --- |
| P-01 | Custo em produção | Cada construção tem um custo (ex.: fazenda 20, universidade 120). Todo turno, a produção do território entra no item do topo da fila | Os turnos da tabela do catálogo saem disso: custo ÷ produção média |
| P-02 | Fila por território | Até 3 itens na fila (5 com Burocracia). O excesso de produção passa ao item seguinte | Planejar a sequência vira decisão estratégica |
| P-03 | Ação "Ordenar obra" | Colocar ou trocar itens em qualquer número de filas custa 1 ação por turno, não 1 por obra | Mantém o orçamento de ações do v4 sem virar microgestão |
| P-04 | Apressar com ouro | Paga 2 ouro por ponto de produção que falta (3 nas maravilhas, não permitido no primeiro turno da obra) | Ouro vira acelerador; comércio ganha valor |
| P-05 | Mutirão e corveia | Gasta população (1 nível de crescimento) para terminar a obra; −2 felicidade | Opção de emergência para governos autoritários |
| P-06 | Ajuda entre territórios | Território ligado por estrada ou ferrovia envia até 50% da produção para a obra de outro | Recompensa quem constrói rede (ver Infraestrutura) |
| P-07 | Obra parada | Se faltar o bem exigido no meio da obra (rota cortada, mina perdida), a obra para e guarda o progresso | Cortar uma rota do inimigo tem efeito real |
| P-08 | Obra capturada | Ao conquistar, o atacante fica com 50% do progresso das obras locais; maravilhas em andamento são perdidas | Atacar antes de a maravilha terminar vira estratégia |
| P-09 | Pesquisa também em turnos | Tecnologia acumula ciência por turno até o custo; uma em andamento por vez (duas com Universidade na capital) | Substitui a compra instantânea do v4 |
| P-10 | Recrutamento em turnos | Tropas básicas ficam prontas no turno seguinte; tropas de elite levam 2 a 3 turnos | A guerra passa a ser preparada, não improvisada |
| P-11 | Manutenção | Cada construção custa 0 a 3 ouro por turno; sem ouro, a mais cara desativa | Impede construir tudo em todo lugar e dá peso à economia |
| P-12 | Demolição | Desfazer uma construção devolve 25% do custo em produção e libera a vaga da zona | Permite reconverter uma região (ex.: fim de uma mina esgotada) |
| P-13 | Esgotamento | Minas e poços têm reserva (ex.: 30 turnos); o garimpo esgota mais rápido | Gera expansão, guerra por jazidas e reconversão |
| P-14 | Foco de produção (v63) | Com a fila vazia, `produce()` chama `focoApply()`: a produção ⚒ do território vira comida (÷3), ouro (÷4, Comércio), saber (÷5, Escrita), cultura (÷4, Alvenaria) ou estabilidade (÷6, Construção civil, teto de +3 por turno). Escolha por território em `G.foc`; vale para o jogador e, no Difícil, também para a IA (v64) | Acaba com a produção desperdiçada e com o pedido de obra quando nada pode ser construído |

### Fila na tela

Ao tocar um território, o painel mostra a fila com barra de progresso e turnos restantes. Um painel "Obras do império" lista todas as filas de uma vez para ordenar tudo com a mesma ação. A IA usa a mesma fila, então o jogador vê as obras inimigas que espionou.

## Infraestrutura, ligação e logística

A infraestrutura faz três coisas: **liga** territórios numa rede (os bens circulam dentro dela), **acelera** tropas e **abastece** exércitos. Um território só conta como "tendo" um bem quando está ligado ao lugar que o produz.

### Obras de transporte

| Id | Obra | Exige | Turnos | Ligação | Movimento de tropas | Outros efeitos |
| --- | --- | --- | --- | --- | --- | --- |
| C-120 | Trilha e caminho | — | 1 | Liga dois vizinhos; só bens leves (luxos, ouro) | Normal (1 território) | Base para estrada |
| C-121 | Estrada | Roda; pedra na era antiga | 2 | Liga todos os bens | 2 territórios por turno dentro da rede própria | +1 ouro com mercado; +10% defesa contra rebelião |
| C-122 | Estrada pavimentada | Engenharia | 3 | Igual, e bens pesados (pedra, ferro) sem perda | 2 territórios, e o remanejamento passa a ir 2 adiante | Elimina perda de comida no transporte |
| C-123 | Ferrovia | Ferrovia + aço + carvão | 4 | Liga todos os bens a toda a rede ferroviária de uma vez | 4 territórios por turno; remanejamento sem limite de distância dentro da rede | +2 produção no território; +1 em minas e fábricas ligadas |
| C-124 | Rodovia | Automóvel + combustível | 3 | Igual à ferrovia | 3 territórios, e tropas motorizadas atacam depois de se mover | +1 ouro, +1 turismo |
| C-125 | Trem de alta velocidade | Ferrovia elétrica + energia | 5 | Igual | 6 territórios | +2 ciência e +2 ouro entre cidades grandes ligadas |
| C-126 | Porto | Navegação costeira; litoral | 3 | Liga aos outros portos próprios e aliados no mesmo mar | Transporte naval entre portos (ver abaixo) | +1 comida do mar, +1 ouro; base de frota |
| C-127 | Estaleiro | Porto + madeira (aço depois da era industrial) | 4 | — | Constrói navios; +1 travessia por turno | Navios de elite; reparo de frota |
| C-128 | Canal | Engenharia hidráulica; liga dois mares ou rios | 6 | Une duas redes marítimas | Navios atravessam o território | Pedágio: +1 ouro por rota alheia que passa |
| C-129 | Aeroporto | Aviação + combustível | 5 | Liga bens leves e eletrônicos a outros aeroportos | Ponte aérea: até 3 tropas entre aeroportos por turno | +2 turismo, +1 ouro; +1 alcance aéreo |
| C-130 | Poço (v65) | Mineração; território sem rio |  |  |  | +1 saúde; protege da seca |
| C-131 | Açude (v65) | Irrigação; fazenda; sem rio |  |  |  | +2 comida; protege da seca |
| C-132 | Reservatório (v65) | Engenharia; vila |  |  |  | +1 comida, +1 saúde; protege da seca |
| C-133 | Roda d'água (v65) | Rodas d'água; oficina; rio |  |  |  | +2 produção |
| C-134 | Represa (v65) | Dinamite; rio |  |  |  | +1 comida; impede enchente; exigida pela Hidrelétrica (C-111) |
| C-135 | Estação de tratamento (v65) | Ecologia; saneamento; cidade |  |  |  | +1 saúde, −2 poluição |
| C-136 | Depósito de suprimentos (v66) | Roda |  |  | base de suprimento (D-07) |
| C-137 | Bateria costeira (v66) | Artilharia; litoral |  |  | +1 defesa contra ataque pelo mar |
| C-138 | Fábrica de munições (v66) | Rifles; distrito industrial; aço |  |  | +1 ataque saindo do território |
| C-139 | Academia naval (v66) | Hidrografia; estaleiro |  |  | +1 travessia, +1 prestígio |
| C-140 | Hospital militar (v66) | Medicina; quartel |  |  | +1 saúde, +1 estabilidade |
| C-141 | Cais fluvial (v67) | Pesca e barcos; rio |  |  | +1 ouro; hidrovia: entra na rede de bens junto com os outros cais fluviais e portos |
| C-142 | Ponte (v68) | Construção civil; estrada; rio |  |  | +1 ouro; +1 território de alcance no remanejamento saindo daqui |
| C-143 | Túnel (v68) | Dinamite; estrada; colina ou montanha |  |  | +1 ouro; tira o custo extra de relevo (L-11) das obras do território |
| C-144 | Estação ferroviária (v68) | Ferrovia; ferrovia no território; nível 2 |  |  | +2 ouro; base de suprimento |
| C-145 | Porto de contêineres (v68) | Computadores; porto; nível 3 |  |  | +3 ouro, +1 produção |
| C-146 | Torre de vigia (v70) | Alvenaria |  |  | +1 defesa com 3 ou mais tropas |
| C-147 | Estação de radar (v70) | Radar; aeródromo |  |  | +1 defesa |
| C-148 | Abrigo antiaéreo (v70) | Aviação; nível 2 |  |  | +1 saúde, +1 estabilidade |
| C-149 | Memorial de guerra (v70) | Arqueologia; quartel; nível 2 |  |  | +1 prestígio, +1 estabilidade |

### Regras de rede e movimento

| Id | Regra | Como funciona |
| --- | --- | --- |
| L-01 | Rede de bens | Territórios próprios unidos por estrada, ferrovia ou porto formam uma rede. Os bens produzidos em um ponto valem para toda a rede. Sem ligação, só o território que produz pode usá-los |
| L-02 | Capital como centro | Quem está na rede da capital usa o estoque do império. Ilhas sem porto ficam de fora |
| L-03 | Corte de rede | Conquistar ou bloquear um território de passagem divide a rede. As obras que dependiam do bem param (P-07) |
| L-04 | Movimento em níveis | Sem estrada, 1 território por turno. Estrada, 2. Rodovia, 3. Ferrovia, 4. Trem rápido, 6. Vale para o remanejamento e para levar tropas à frente antes de atacar |
| L-05 | Transporte naval | Tropas embarcam num porto e desembarcam em outro porto próprio ou aliado do mesmo mar no mesmo turno. Desembarque em praia inimiga continua limitado a 2 dados (regra do v3) |
| L-06 | Ponte aérea | Entre dois aeroportos próprios, até 3 tropas por turno, sem combate. Paraquedistas (era moderna) podem atacar desembarcando a até 2 territórios de um aeroporto |
| L-07 | Estrada inimiga | O invasor também usa estradas que conquista. Destruir uma estrada ao recuar (terra arrasada) custa 1 ação e leva 2 turnos para o inimigo consertar |
| L-08 | Suprimento | Tropas fora da rede própria por 2 turnos perdem 1 dado de ataque. Salga, charque e comida enlatada ampliam para 3 ou 4 turnos |
| L-09 | Linhas de suprimento | Um exército grande (6+ tropas) num território conquistado consome 1 comida por turno da rede; sem ela, perde 1 tropa por turno |
| L-10 | Bloqueio naval | Frota inimiga num mar sem a sua corta as rotas marítimas desse mar e os portos não ligam |
| L-11 | Custo de construção por terreno | Montanha e pântano dobram o custo de estrada e ferrovia; deserto aumenta 50%. Passos de montanha (M-24) não têm acréscimo |

### Ideia de uso no jogo atual

No mapa de territórios do War, a estrada é um **marcador na fronteira entre dois territórios** (como as estradas do Catan nas arestas). A ferrovia substitui a estrada no mesmo lugar. Assim a rede fica visível no mapa como linhas, e a regra de movimento continua sendo "quantas fronteiras posso cruzar".

## Comércio e rotas comerciais

O comércio é o jeito de conseguir bens que o seu território não tem sem conquistar quem tem. Uma **rota** liga dois territórios (seus ou de outra facção), leva um bem num sentido e dá ouro aos dois lados.

### Tipos de rota

| Id | Rota | Exige | Capacidade | Efeito |
| --- | --- | --- | --- | --- |
| T-01 | Rota interna | Mercado nas duas pontas; ligação terrestre | 1 bem | Leva o bem para um território fora da rede; +1 comida ou +1 produção no destino |
| T-02 | Caravana | Caravançará (C-61); até 4 territórios de distância | 1 bem | +2 ouro para cada lado; +1 ciência se a outra facção tem tecnologia que você não tem |
| T-03 | Rota marítima | Porto + armazém alfandegário; mesmo mar | 2 bens | +3 ouro cada lado; vulnerável a piratas e bloqueio |
| T-04 | Rota oceânica | Companhia de comércio (C-65); Navegação oceânica | 3 bens | +5 ouro; liga continentes |
| T-05 | Oleoduto e gasoduto | Refinaria + ferrovia ou rodovia | Combustível | Transporte contínuo de energia; alvo de sabotagem |
| T-06 | Rota aérea de carga | Dois aeroportos | Eletrônicos, medicamentos, luxos | +2 ouro; não é cortada por bloqueio naval |
| T-07 | Rede digital | Rede mundial de dados | Ciência e cultura | +2 ciência nos dois lados |

### Regras

| Id | Regra | Como funciona | Ideia de uso |
| --- | --- | --- | --- |
| T-10 | Abrir rota | Custa 1 ação e ouro; a rota leva 1 a 2 turnos para começar a render (caravana viajando) | Cria planejamento e risco |
| T-11 | Número de rotas | 1 rota por mercado e por porto; +1 com Banco; +1 com governos mercantis | Limite claro e que cresce com investimento |
| T-12 | Acordo de troca | A outra facção precisa aceitar; a IA aceita se ganha um bem que lhe falta ou se gosta de você | Une comércio e diplomacia |
| T-13 | Rotas liberam construções | Um bem recebido por rota conta como "ligado" para requisitos. Ex.: estanho por caravana permite fundir bronze; algodão por mar permite manufatura têxtil; borracha permite montadora | É o pedido do Flavio: rota de um bem libera estruturas |
| T-14 | Rotas liberam tecnologias | Rota com facção mais avançada dá descoberta (−20% de custo) numa tecnologia que ela tem | Comércio espalha conhecimento |
| T-15 | Nós comerciais | Territórios marcados no mapa (Alexandria, Samarcanda, Veneza, Malaca...) dão +2 ouro a cada rota que passa por eles | Disputa por pontos estratégicos, como na Rota da Seda |
| T-16 | Pilhagem | Atacar um território de passagem corta a rota e rende o ouro de 2 turnos dela | Incentivo para guerra econômica |
| T-17 | Piratas e escolta | Rotas marítimas têm 1 chance em 6 por turno de serem atacadas por piratas, se não houver frota própria no mar | Frotas têm uso em paz |
| T-18 | Embargo | Ação diplomática: corta todas as rotas com uma facção; aliados podem aderir | Arma sem guerra |
| T-19 | Fechar rota (v50) | O dono fecha uma rota sua de graça, a qualquer momento do seu turno; a vaga fica livre na hora para abrir outra melhor. A tela de rotas mostra vagas, rendimento de cada rota e o que cada tipo pede | Permite trocar rotas |
| T-19 | Tarifas | Política: +ouro por rota estrangeira, mas −1 relação com os parceiros | Escolha entre caixa e amizade |
| T-20 | Monopólio | Quem controla 60% de um luxo no mundo ganha +1 ouro por rota daquele luxo e +2 felicidade | Corrida por recursos raros |
| T-21 | Mercado mundial (opcional) | Preço de cada bem sobe quando falta e cai quando sobra; compra e venda direta por ouro | Para o modo Civilização; nos cenários curtos fica desligado |
| T-22 | Corporações (era moderna) | Bolsa de valores permite abrir filiais em territórios de outras facções: +ouro para você, +influência sobre ela | Vitória econômica |

### Na tela

As rotas aparecem como linhas tracejadas animadas com o ícone do bem. Um painel "Comércio" mostra o que você tem, o que falta para cada construção desejada e quem no mapa produz esse bem.

## Árvore de tecnologias por era

São 8 eras e cerca de 80 tecnologias. Cada tecnologia exige 1 ou 2 anteriores, e cada uma libera algo concreto no mapa: uma construção, uma zona, uma tropa, uma política ou uma regra. Uma era começa para a facção quando ela tem metade das tecnologias da era anterior (ver Eras e eventos).

O custo sobe por era: 20, 45, 80, 130, 200, 290, 400 e 550 de ciência em velocidade Normal. Descobertas (construções, rotas, eventos) tiram 40% do custo de uma tecnologia específica.

### Era 1: Antiguidade

| Id | Tecnologia | Exige | Libera |
| --- | --- | --- | --- |
| K-01 | Agricultura | — | Zona agrícola, fazenda (C-01) |
| K-02 | Domesticação | — | Zona pecuária, estância (C-08); revela cavalos |
| K-03 | Pesca e barcos | — | Zona pesqueira, pesqueiro (C-11) |
| K-04 | Mineração | — | Zona de mineração, mina (C-25); revela cobre e estanho |
| K-05 | Misticismo | — | Zona religiosa, templo (C-81), primeira crença |
| K-06 | Cerâmica e oficícios | Agricultura | Oficina (C-40), celeiro (C-02) |
| K-07 | Ferramentas de bronze | Mineração | Fundição de bronze (C-41), serraria (C-20); lanceiros |
| K-08 | Escrita | Cerâmica | Zona científica, biblioteca (C-70) |
| K-09 | Alvenaria | Mineração | Pedreira (C-24), muralha (C-101), pirâmides (C-200) |
| K-10 | Roda | Domesticação | Estrada (C-121), carros de guerra |
| K-11 | Irrigação | Agricultura | Canal (C-03), arrozal (C-05), jardins (C-201) |
| K-12 | Navegação costeira | Pesca | Porto (C-126), galés, farol (C-203) |
| K-13 | Moeda | Escrita + Bronze | Zona comercial, mercado (C-60), caravanas |
| K-14 | Código de leis | Escrita | Tribunal (C-94); governos antigos |
| K-15 | Fundição do ferro | Bronze | Ferraria (C-42); revela ferro; espadachins |
| K-16 | Equitação | Roda | Haras (C-09); cavalaria leve |
| K-17 | Filosofia | Código de leis + Misticismo | Academia (C-71); primeira grande figura grátis |
| K-18 | Matemática | Moeda | Catapultas; +1 dado em cerco |
| K-19 | Construção civil | Alvenaria + Matemática | Anfiteatro (C-84), coliseu (C-204), aqueduto com Engenharia |
| K-20 | Engenharia | Construção civil + Roda | Estrada pavimentada (C-122), aqueduto (C-91) |
| K-21 | Astronomia | Matemática + Misticismo | Observatório (C-72) |
| K-22 | Disciplina militar | Ferro | Quartel (C-105); legiões e falanges |

### Era 2: Idade Média

| Id | Tecnologia | Exige | Libera |
| --- | --- | --- | --- |
| K-30 | Feudalismo | Código de leis + Disciplina | Governo feudal; levas camponesas baratas |
| K-31 | Teologia | Filosofia | Mosteiro (C-82), catedral (C-83) |
| K-32 | Castelos | Engenharia + Feudalismo | Castelo (C-102), castelo do xógum (C-208) |
| K-33 | Mecânica | Engenharia + Matemática | Moinho (C-04), engenho (C-07), bestas |
| K-34 | Estribo e cavalaria pesada | Equitação + Feudalismo | Cavaleiros; +1 dado em planície |
| K-35 | Bancos | Moeda + Teologia | Banco (C-62); empréstimos |
| K-36 | Educação | Teologia + Filosofia | Universidade (C-73) |
| K-37 | Arquitetura gótica | Castelos + Teologia | Catedral gótica (C-206) |
| K-38 | Bússola | Navegação costeira + Astronomia | +1 travessia; armazém alfandegário (C-64) |
| K-39 | Guildas | Bancos + Mecânica | +1 produção em oficinas; feiras |
| K-40 | Pólvora | Mecânica + Alquimia (Teologia na árvore curta) | Polvorinho (C-44), primeiros canhões |

### Era 3: Renascimento e Idade Moderna

| Id | Tecnologia | Exige | Libera |
| --- | --- | --- | --- |
| K-50 | Imprensa | Educação + Guildas | Jornal (C-87); +1 ciência por universidade |
| K-51 | Navegação oceânica | Bússola + Astronomia | Companhia de comércio (C-65), caravelas, rotas oceânicas |
| K-52 | Mosquete | Pólvora | Mosqueteiros |
| K-53 | Artilharia | Pólvora + Matemática | Anula muralhas antigas |
| K-54 | Fortificação moderna | Artilharia | Fortaleza abaluartada (C-103) |
| K-55 | Método científico | Imprensa + Astronomia | Laboratório (C-75) com energia; +10% ciência |
| K-56 | Economia | Bancos + Imprensa | Bolsa (C-63); tarifas |
| K-57 | Drama e artes | Imprensa | Teatro (C-85) |
| K-58 | Burocracia | Imprensa + Código de leis | Fila de 5 itens; +1 ação |
| K-59 | Estratégia | Mosquete + Educação | Academia militar (C-106); generais |

### Era 4: Revolução Industrial

| Id | Tecnologia | Exige | Libera |
| --- | --- | --- | --- |
| K-60 | Máquina a vapor | Método científico + Mecânica | Mina profunda (C-27); revela carvão; navios a vapor |
| K-61 | Tear mecânico | Máquina a vapor | Manufatura têxtil (C-45); zona industrial |
| K-62 | Siderurgia | Máquina a vapor + Ferro | Siderúrgica (C-46) |
| K-63 | Ferrovia | Siderurgia | Ferrovia (C-123) |
| K-64 | Química | Método científico | Indústria química (C-48); revela salitre e enxofre |
| K-65 | Medicina | Química | Hospital (C-93); − epidemias |
| K-66 | Dinamite | Química | Canal (C-128), grande canal (C-210) |
| K-67 | Rifles | Mosquete + Siderurgia | Infantaria de linha |
| K-68 | Arqueologia | Método científico + Drama | Museu (C-86) |
| K-69 | Educação pública | Imprensa + Economia | Escola pública (C-74) |
| K-70 | Vulcanização | Química | Seringal (C-22) |

### Era 5: Era Moderna

| Id | Tecnologia | Exige | Libera |
| --- | --- | --- | --- |
| K-80 | Eletricidade | Método científico + Siderurgia | Zona energética, termelétrica (C-110), hidrelétrica (C-111) |
| K-81 | Refino | Química + Eletricidade | Poço (C-28), refinaria (C-49); revela petróleo |
| K-82 | Motor a combustão | Refino | Montadora (C-50), blindados |
| K-83 | Automóvel | Motor a combustão + Vulcanização | Rodovia (C-124) |
| K-84 | Voo motorizado | Motor a combustão | Base aérea (C-107), aviões (regra aérea do v3) |
| K-85 | Rádio | Eletricidade | Rádio (C-87); propaganda |
| K-86 | Saneamento | Medicina + Eletricidade | Saneamento moderno (C-92), metrópole |
| K-87 | Fertilizantes | Química + Eletricidade | Agroindústria (C-14) |
| K-88 | Concreto armado | Siderurgia + Eletricidade | Bunker (C-104), arranha-céu |
| K-89 | Metralhadora e guerra de trincheiras | Rifles + Motor | +1 dado na defesa de quem não se moveu |
| K-90 | Ideologias | Educação pública + Rádio | Governos modernos (G-08 a G-10) |

### Era 6: Era Atômica

| Id | Tecnologia | Exige | Libera |
| --- | --- | --- | --- |
| K-100 | Aviação | Voo motorizado | Aeroporto (C-129), paraquedistas |
| K-101 | Radar | Rádio + Aviação | Antiaéreo (C-108) |
| K-102 | Fissão | Eletricidade + Método científico | Usina nuclear (C-113); revela urânio. Armas nucleares só se a opção estiver ligada |
| K-103 | Foguetes | Aviação + Química | Programa espacial (C-214), silo (C-109) |
| K-104 | Televisão | Rádio | TV (C-87); cultura de massa |
| K-105 | Plásticos | Refino + Química | Plataforma marítima (C-29) |
| K-106 | Antibióticos | Medicina | +2 saúde; farmacêutica (C-52) |
| K-107 | Diplomacia moderna | Ideologias | Sede das Nações (C-213); Congresso Mundial |

### Era 7: Era da Informação

| Id | Tecnologia | Exige | Libera |
| --- | --- | --- | --- |
| K-110 | Computadores | Radar + Plásticos | Zona tecnológica; centro de pesquisa (C-76) |
| K-111 | Semicondutores | Computadores | Eletrônica (C-53); revela terras raras |
| K-112 | Internet | Computadores + Televisão | Rede mundial (C-215), rede digital (T-07) |
| K-113 | Satélites | Foguetes + Computadores | Revela o mapa inteiro; zona aeroespacial |
| K-114 | Energia renovável | Semicondutores + Ecologia | Parque solar e eólico (C-114) |
| K-115 | Ecologia | Biologia + Televisão | Reserva (C-23), parque nacional (C-89) |
| K-116 | Biologia e genética | Antibióticos + Computadores | Aquicultura (C-13); projetos de saúde |
| K-117 | Mísseis guiados | Foguetes + Semicondutores | Silo (C-109) e escudo antimíssil |

### Era 8: Futuro próximo (opcional)

| Id | Tecnologia | Exige | Libera |
| --- | --- | --- | --- |
| K-120 | Inteligência artificial | Semicondutores + Internet | +20% ciência; unidades robóticas |
| K-121 | Fusão | Fissão + Semicondutores | Energia ilimitada limpa |
| K-122 | Colonização espacial | Satélites + Fusão | Etapas finais da vitória científica |

### Ideias de uso

- **Árvore curta nos cenários.** Cada cenário histórico usa só a era dele e a seguinte (cerca de 20 tecnologias), como o v4 faz hoje com 10. A árvore inteira fica para o modo Civilização.
- **Tecnologias como pré-requisito duplo.** A construção exige a tecnologia e também o bem ligado. Saber fazer aço não basta sem ferro e carvão na rede.
- **Tecnologia vaza.** Vizinhos e parceiros comerciais que têm uma tecnologia deixam ela 10% mais barata para você a cada um (máximo 40%).
- **Recursos ocultos.** Ferro, carvão, salitre, petróleo, urânio e terras raras só aparecem no mapa depois da tecnologia que os revela. Um território sem valor pode virar alvo de guerra na era seguinte.

## Exército: tipos de tropa, qualidade e suprimento

O combate continua sendo o do War: dados de ataque contra dados de defesa, perda de peças e conquista. O que muda é que nem toda peça é igual. A proposta mantém o jogo legível: no máximo **um tipo de tropa terrestre por território** é "o melhor", e ele dá um bônus de dado, em vez de cada peça ter estatísticas.

### Qualidade por era (tropa terrestre)

| Id | Tropa | Era | Exige | Bônus |
| --- | --- | --- | --- | --- |
| A-01 | Milicianos | Qualquer | — | Nenhum (a peça atual) |
| A-02 | Lanceiros e falanges | Antiguidade | Bronze (K-07) + bronze em estoque | Empates na defesa contra cavalaria são do defensor |
| A-03 | Legiões e espadachins | Antiguidade | Ferro (K-15) + ferro | +1 no maior dado de ataque |
| A-04 | Carros de guerra e cavalaria leve | Antiguidade | Roda ou Equitação + cavalos | Atacam e ainda avançam 1 território |
| A-05 | Cavaleiros | Idade Média | Estribo (K-34) + cavalos + ferro | +1 no maior dado em planície |
| A-06 | Besteiros e arqueiros | Idade Média | Mecânica (K-33) | +1 no maior dado de defesa em muralha |
| A-07 | Mosqueteiros | Idade Moderna | Mosquete + pólvora | +1 no maior dado de ataque e defesa |
| A-08 | Infantaria de linha | Industrial | Rifles + armas | +1 em ambos; anula bônus de cavalaria |
| A-09 | Infantaria motorizada | Moderna | Motor + combustível | Move 1 a mais e ataca |
| A-10 | Blindados | Moderna | Montadora + aço + combustível | +2 no maior dado de ataque; terreno difícil anula |
| A-11 | Infantaria mecanizada | Atômica | Blindados + eletrônicos | +2 em ambos |
| A-12 | Forças especiais | Informação | Academia militar + eletrônicos | Ignoram fortificações; poucos por facção |

### Suporte, mar e ar

| Id | Unidade | Exige | Papel |
| --- | --- | --- | --- |
| A-20 | Armas de cerco (aríete, catapulta, trabuco) | Matemática | Anulam 1 nível de muralha no ataque |
| A-21 | Artilharia e canhões | Artilharia (K-53) + pólvora | Rolam 1 dado antes do combate e removem 1 defensor com 5 ou 6 |
| A-22 | Galés e trirremes | Navegação costeira | Frotas costeiras; só cruzam estreitos |
| A-23 | Caravelas e naus | Navegação oceânica | Travessia oceânica; rota oceânica |
| A-24 | Navios de linha | Navegação oceânica + estaleiro | Batalha naval: +1 dado; bloqueio |
| A-25 | Encouraçados | Aço + estaleiro | Bombardeiam litoral (como artilharia) |
| A-26 | Submarinos | Motor + eletrônicos na era atômica | Cortam rotas marítimas sem ser vistos |
| A-27 | Porta-aviões | Aviação + aço | Levam aviões para longe da base |
| A-28 | Aviões de caça e bombardeiros | Voo motorizado + combustível | Regra aérea do v3 (dado antiaéreo, depois dado de acerto, não conquistam) |
| A-29 | Mísseis | Mísseis guiados | Ataque à distância sem risco; caros |

### Regras de exército

| Id | Regra | Como funciona | Ideia de uso |
| --- | --- | --- | --- |
| A-40 | Melhor tropa do território | O bônus vale se pelo menos metade das peças no território for daquele tipo | Mantém o mapa simples: um ícone ao lado do número |
| A-41 | Custo em bens | Tropa melhor gasta o bem estratégico ao ser recrutada (1 ferro, 1 cavalo, 1 pólvora) | Liga exército a minas, haras e rotas |
| A-42 | Atualização | Trocar o tipo das peças de um território custa ouro e o bem novo; leva 1 turno | Evita refazer todo o exército a cada era |
| A-43 | Experiência | Um território que vence 3 batalhas ganha a marca de veterano: +1 no maior dado até perder metade das peças | Recompensa exércitos que sobrevivem |
| A-44 | Manutenção | Cada peça acima de 2 por território custa 0,5 ouro por turno (milicianos são de graça em território próprio) | Impede pilhas infinitas e alonga a partida |
| A-45 | Fortificar | Tropas que não se movem nem atacam por 1 turno ganham +1 no maior dado de defesa | Recompensa a postura defensiva |
| A-46 | Desmobilizar | Peças dispensadas voltam como +1 produção por 2 turnos | Fim de guerra com retorno econômico |
| A-47 | Mercenários | Compra tropas com ouro na hora, sem ação, a preço dobrado; podem desertar se o ouro acabar | Ouro vira poder militar rápido |
| A-48 | Conscrição | Política: tropas mais baratas, −felicidade | Liga exército a governo |
| A-49 | Cansaço de guerra | Cada turno em guerra ofensiva dá −1 estabilidade; perder territórios, −3; propaganda e vitórias reduzem | Freia a bola de neve e alonga o jogo |
| A-50 | Pilhagem | Ao conquistar, escolher entre ocupar (mantém construções) e saquear (ouro agora, construções destruídas, −relações) | Decisão moral e econômica |
| A-51 | Guerrilha | Território recém-conquistado com estabilidade baixa pode gerar 1 a 2 tropas rebeldes por turno | Conquista não é o fim; ocupar custa |

## População, crescimento, felicidade, saúde e estabilidade

Hoje o território é só dono e número de tropas. A proposta dá a cada território uma **população** em níveis, que cresce com comida e define quantas zonas e quanto rendimento ele tem. Felicidade, saúde e estabilidade são os freios.

### Níveis de povoamento

| Id | Nível | Zonas | Para subir precisa | Rende |
| --- | --- | --- | --- | --- |
| S-01 | Ermo (sem povo) | 0 | Colono ou 10 comida trazida | Só jazidas, com posto avançado |
| S-02 | Aldeia | 1 | 20 comida acumulada | +1 de cada rendimento base |
| S-03 | Vila | 2 | 40 comida + mercado ou templo | +1 tropa nos reforços |
| S-04 | Cidade | 3 | 80 comida + aqueduto (C-91) | +1 ação a cada 3 cidades |
| S-05 | Metrópole | 4 | 160 comida + saneamento (C-92) + energia | +25% ciência e ouro |
| S-06 | Megalópole | 5 | 300 comida + bairro residencial (C-96) + agroindústria na rede | +50%; −2 saúde, +poluição |

### Medidores

| Id | Medidor | Sobe com | Cai com | Efeito quando baixo |
| --- | --- | --- | --- | --- |
| S-10 | Comida | Fazendas, pesca, pecuária, rotas | População (cada nível come 2), exércitos grandes (L-09) | Fome: o território desce um nível |
| S-11 | Felicidade (império) | Luxos diferentes ligados (+2 cada), templos, arenas, festas, bens de consumo | Número de cidades, cansaço de guerra, impostos altos | Abaixo de 0: −10% em tudo; abaixo de −10: revoltas |
| S-12 | Saúde (território) | Aqueduto, saneamento, hospital, água doce | Tamanho, indústria pesada, garimpo, cerco | Epidemia (E-20) com chance por turno |
| S-13 | Estabilidade (território) | Tribunal, polícia, guarnição, mesma cultura, tempo de posse | Conquista recente, distância da capital, cultura estrangeira, agitadores | Abaixo de 30: não produz; abaixo de 10: rebelião ou troca de lado |
| S-14 | Cultura do território | Monumentos, templos, teatros | — | Define a quem o povo é leal; demora a mudar após conquista |
| S-15 | Poluição | Indústria, termelétricas, megalópoles | Reservas, renováveis, política ambiental | Saúde cai; eventos climáticos no mundo todo (E-25) |

### Regras sociais

| Id | Regra | Como funciona | Ideia de uso |
| --- | --- | --- | --- |
| S-20 | Corrupção pela distância | Cada território perde 5% do rendimento por território de distância da capital (máximo 40%); tribunal e estrada reduzem | Impérios grandes precisam de infraestrutura |
| S-21 | Migração | Território muito feliz atrai 1 nível de população por 10 turnos de vizinho infeliz, inclusive de outra facção | Soft power concreto |
| S-22 | Assimilação | Território conquistado leva 5 a 10 turnos para adotar a sua cultura; templos e escolas aceleram | Explica por que conquistas antigas são estáveis e recentes não |
| S-23 | Classes sociais (opcional) | População dividida em camponeses, artesãos, mercadores e eruditos conforme as zonas; cada classe exige coisas diferentes | Camada profunda para o modo Civilização |
| S-24 | Festas e pão e circo | A ação festividades do v4 vira +felicidade temporária em troca de ouro e comida | Reaproveita o que já existe |
| S-25 | Escravidão e servidão | Fora do jogo, por escolha de design. Produção forçada aparece só como mutirão (P-05) com custo de felicidade | Evita tema sensível sem perder a mecânica |
| S-26 | Colonos | Unidade que gasta 1 nível de população e cria uma aldeia num território vazio | Base do modo Civilização |

## Governo, políticas, cultura e crenças

Além da árvore de tecnologias, há uma segunda árvore, a **cívica**, que avança com cultura (R-05) em vez de ciência. Ela libera governos e cartas de política. É a ideia dos civics do Civilization VI e dos governos do Through the Ages: o governo define quantas ações o jogador tem e em que ele é bom.

### Governos

| Id | Governo | Era | Exige (cívica) | Vagas de política | Bônus | Custo |
| --- | --- | --- | --- | --- | --- | --- |
| G-01 | Chefia tribal | Antiguidade | — | 1 militar | +1 tropa nos reforços | Poucos bônus econômicos |
| G-02 | Monarquia | Antiguidade | Código de leis | 1 militar, 1 econômica | +2 estabilidade na capital e vizinhos | — |
| G-03 | República clássica | Antiguidade | Filosofia | 2 econômicas, 1 civil | +1 ação; +1 ouro por mercado | Cansaço de guerra dobrado |
| G-04 | Teocracia | Idade Média | Teologia | 1 militar, 1 civil, 1 religiosa | Templos rendem ciência; compra tropas com cultura | −10% ciência |
| G-05 | Feudalismo | Idade Média | Feudalismo | 2 militares, 1 econômica | Tropas baratas; castelos mais rápidos | Corrupção +50% |
| G-06 | República mercantil | Idade Média | Bancos | 3 econômicas, 1 civil | +1 rota; apressar obras 25% mais barato | Exército −25% |
| G-07 | Monarquia absoluta | Moderna | Burocracia | 2 militares, 2 econômicas | +1 ação; maravilhas +25% | Felicidade −2 |
| G-08 | Democracia liberal | Industrial | Ideologias | 3 econômicas, 2 civis | +2 ações; +25% ciência e ouro | Eleições: a cada 20 turnos, cumprir uma meta ou perder políticas |
| G-09 | Regime de partido único | Moderna | Ideologias | 3 militares, 2 econômicas | Produção +25%; sem cansaço de guerra | Ciência −15%; influência −50% |
| G-10 | Planejamento central | Moderna | Ideologias | 2 econômicas, 2 militares, 1 civil | Construções industriais 1 turno mais rápidas | Comércio externo −50% |
| G-11 | Tecnocracia corporativa | Informação | Internet | 4 econômicas, 1 civil | +1 ouro por rota e corporação | Felicidade depende de bens de consumo |

### Cartas de política (exemplos)

| Id | Política | Tipo | Efeito |
| --- | --- | --- | --- |
| G-20 | Conscrição | Militar | Tropas −25% de custo; −1 felicidade |
| G-21 | Disciplina de ferro | Militar | Veteranos (A-43) depois de 2 vitórias |
| G-22 | Estradas imperiais | Econômica | Estradas pela metade do custo |
| G-23 | Livre comércio | Econômica | +1 ouro por rota; tarifas desligadas |
| G-24 | Protecionismo | Econômica | Indústrias +1 produção; parceiros −1 relação |
| G-25 | Mecenato | Civil | Grandes figuras artísticas 50% mais rápidas |
| G-26 | Escola para todos | Civil | +1 ciência por escola pública |
| G-27 | Pão e circo | Civil | +2 felicidade; −1 ouro por cidade |
| G-28 | Política ambiental | Civil | −50% poluição; indústria −10% |
| G-29 | Peregrinação | Religiosa | +1 influência por local sagrado |
| G-30 | Propaganda | Civil | Cansaço de guerra pela metade |
| G-31 | Polícia secreta | Militar | Espiões inimigos têm −2 no dado |

Trocar políticas é grátis quando uma nova cívica termina; fora disso custa 1 ação. Trocar de governo custa 2 turnos de anarquia (sem ciência nem cultura), 1 com a maravilha certa.

### Cultura e cívicas

| Id | Regra | Como funciona |
| --- | --- | --- |
| G-40 | Árvore cívica | Cerca de 40 cívicas em 8 eras (Código de leis, Filosofia, Feudalismo, Bancos, Humanismo, Iluminismo, Nacionalismo, Ideologias, Direitos civis, Globalização...). Cada uma libera governo, política ou ação diplomática |
| G-41 | Influência cultural | Cultura acumulada empurra a lealdade (S-14) dos territórios vizinhos de outras facções; um território pode mudar de lado sem guerra |
| G-42 | Obras e artefatos | Grandes artistas criam obras que vão para museus, teatros e catedrais; arqueólogos escavam artefatos. Contam para a vitória cultural |
| G-43 | Turismo | Maravilhas, obras, parques e estádios geram turismo; turismo contra a cultura de cada rival decide a vitória cultural |

### Crenças

As crenças são **fictícias e genéricas**: o jogador funda uma fé e escolhe os princípios, sem usar religiões reais.

| Id | Regra | Como funciona |
| --- | --- | --- |
| G-50 | Panteão | Com Misticismo e 10 de cultura, escolhe um princípio inicial (ex.: deusa das colheitas, +1 comida em fazendas de rio) |
| G-51 | Fundar uma fé | Grande profeta ou templo + mosteiro: escolhe nome, símbolo e 2 princípios (fundador e seguidor) |
| G-52 | Princípios | Cerca de 30, em 4 grupos: fundador (beneficia quem fundou), seguidor (beneficia o território que segue), templo (o que o templo faz) e reforço (bônus tardio). Ex.: dízimo (+1 ouro por 4 seguidores), guerra santa (+1 dado contra outra fé), hospitais da ordem (+2 saúde) |
| G-53 | Difusão | Rotas e vizinhança espalham a fé; missionários convertem; a maioria de cada território define sua fé |
| G-54 | Cisma e reforma | Evento: uma fé muito grande pode se dividir; o jogador escolhe um princípio de reforma |

## Diplomacia e relações

Hoje toda facção é inimiga de todas e o único gesto diplomático é influenciar neutros. A proposta dá a cada par de facções um **estado** (guerra, paz, acordo, aliança) e uma **relação** de −100 a +100 que a IA usa para decidir.

### Estados entre facções

| Id | Estado | O que permite | Como se entra | Como se sai |
| --- | --- | --- | --- | --- |
| DP-01 | Guerra | Atacar e ser atacado | Declaração (1 ação) | Tratado de paz |
| DP-02 | Trégua | Nada de ataque por 10 turnos | Fim de guerra | Expira e vira paz |
| DP-03 | Paz | Sem ataque; fronteiras fechadas | Padrão no começo (exceto cenários que começam em guerra) | Declaração de guerra |
| DP-04 | Passagem livre | Tropas atravessam o território do outro e usam suas estradas | Acordo | Cancelamento (−relação) |
| DP-05 | Acordo comercial | Rotas entre os dois rendem +1 ouro | Acordo | Embargo |
| DP-06 | Pacto de pesquisa | Os dois pagam ouro e ganham ciência extra por 10 turnos | Acordo; ambos com universidade | Termina sozinho |
| DP-07 | Defesa mútua | Se um é atacado, o outro entra na guerra | Relação +40 | Quebrar = −50 com todos |
| DP-08 | Aliança | Defesa mútua + visão compartilhada + vitória compartilhada (opcional) | Relação +60 e 10 turnos de paz | Traição |
| DP-09 | Vassalagem | O vassalo paga tributo e segue as guerras do suserano; o suserano o protege | Rendição em guerra perdida | Independência se o suserano enfraquecer |

### Relação e agravos

| Id | Regra | Como funciona |
| --- | --- | --- |
| DP-20 | Memória | A relação soma motivos visíveis: "você tem a mesma fé (+10)", "tomou nossa terra (−30)", "comercia conosco (+5 por rota)". Os motivos perdem força com o tempo |
| DP-21 | Agravos | Declarar guerra sem motivo, quebrar acordo ou saquear dá agravos com todos que sabem. Agravo alto une o mundo contra você |
| DP-22 | Motivos de guerra | Guerra com motivo (território que era seu, libertar aliado, guerra santa, defesa de neutro, disputa de colônia) custa menos agravo e menos cansaço |
| DP-23 | Exigências | Uma facção forte pode exigir ouro ou um território; recusar dá a ela um motivo de guerra |
| DP-24 | Mesa de negociação | Troca qualquer combinação: ouro, ouro por turno, bens, tecnologias, territórios, acordos, votação. A IA mostra se aceita antes de enviar |
| DP-25 | Tratado de paz | Lista de termos: devolver territórios, reparar ouro, desmilitarizar fronteira por 10 turnos |

### Neutros e cidades-estado

Os neutros do v4 (influência) viram **cidades-estado** com tipo e bônus.

| Id | Regra | Como funciona |
| --- | --- | --- |
| DP-30 | Tipos | Mercantil (+ouro), científica (+ciência), militar (+tropas), religiosa (+fé), cultural (+cultura), portuária (+rotas) |
| DP-31 | Influência | Enviados, presentes e missões dão pontos de influência; quem tem mais é o suserano e recebe o bônus principal |
| DP-32 | Missões | A cidade-estado pede coisas (limpar bárbaros, abrir rota, enviar tropa) e dá muita influência a quem cumpre |
| DP-33 | Anexação pacífica | Suserano por 30 turnos pode absorver a cidade-estado sem guerra, com custo alto em influência |

### Congresso mundial

| Id | Regra | Como funciona |
| --- | --- | --- |
| DP-40 | Fundar | Abre quando metade das facções conhece Diplomacia moderna (K-107) |
| DP-41 | Sessões | A cada 15 turnos vota 2 resoluções: embargo a uma facção, banir uma arma, sede de jogos mundiais, ajuda ao mais fraco, limite de poluição |
| DP-42 | Votos | Cada facção tem 1 voto, +1 por cidade-estado suserana, +2 com a Sede das Nações (C-213); votos são negociáveis |
| DP-43 | Vitória diplomática | Ver V-05 |

## Personagens, grandes figuras e espionagem

Personagens dão rosto ao império e são bônus que o jogador posiciona no mapa. Nos cenários históricos podem ter nomes reais da época; nos cenários de fantasia e no modo Civilização, nomes gerados.

### Líderes e governadores

| Id | Personagem | Como se obtém | Efeito |
| --- | --- | --- | --- |
| F-01 | Líder da facção | Escolhido no início | Um traço fixo (ex.: conquistador: +1 dado na primeira batalha do turno; construtor: maravilhas −15%; mercador: +1 rota) e uma agenda que a IA segue |
| F-02 | Sucessão | Evento a cada 25 a 40 turnos (monarquias) ou eleição (democracias) | Novo líder com traço sorteado entre 3; crise de sucessão se a estabilidade estiver baixa |
| F-03 | Governadores | 1 por era concluída e por cívicas específicas | Ficam num território: +produção, +estabilidade, ou um efeito especial (ex.: intendente acelera obras em 25%) |
| F-04 | Conselheiros | Cívicas | Dicas da IA sobre o que construir; sem efeito de jogo, só ajuda ao jogador |

### Grandes figuras

Cada tipo acumula pontos com as construções da zona certa. Quem chega primeiro ao custo recebe a figura, e o custo sobe para todos.

| Id | Tipo | Pontos vêm de | Uso |
| --- | --- | --- | --- |
| F-10 | Grande cientista | Zona científica | Termina na hora a pesquisa atual, ou cria uma academia especial (+3 ciência) |
| F-11 | Grande engenheiro | Zona industrial e mineração | Termina 50% de uma maravilha ou obra |
| F-12 | Grande mercador | Zona comercial e portuária | +ouro alto e +1 rota permanente, ou monopólio de um luxo |
| F-13 | Grande artista | Zona cultural | Cria uma obra (G-42); +cultura e turismo |
| F-14 | Grande general | Vitórias em batalha, academia militar | Fica num território: +1 dado no ataque partindo dali e dos vizinhos |
| F-15 | Grande almirante | Batalhas navais, estaleiro | +1 dado em batalha naval; +1 travessia |
| F-16 | Grande profeta | Zona religiosa | Funda uma fé (G-51) |
| F-17 | Grande explorador | Modo Civilização: descobrir territórios | Revela uma região e dá ouro por maravilha natural |

### Espionagem

| Id | Ação de espião | Exige | Efeito | Risco |
| --- | --- | --- | --- | --- |
| F-30 | Espião | Escrita na era antiga (batedores), Imprensa para espiões plenos | Unidade invisível posta num território alheio | Cada missão rola 1 dado contra a defesa local |
| F-31 | Ver obras e tropas | — | Mostra a fila e os tipos de tropa do território | Baixo |
| F-32 | Roubar tecnologia | Universidade inimiga no território | Ganha uma tecnologia que o alvo tem | Médio |
| F-33 | Sabotar obra | — | Faz a obra perder 50% do progresso | Médio |
| F-34 | Sabotar rota ou oleoduto | Rota passa pelo território | Corta a rota por 3 turnos | Médio |
| F-35 | Fomentar revolta | Estabilidade baixa no alvo | −15 de estabilidade; pode gerar rebeldes | Alto |
| F-36 | Propaganda | Rádio | Transfere lealdade (S-14) do território para você | Médio |
| F-37 | Contraespionagem | Polícia (C-95) | Espião seu protege um território próprio; +2 na defesa contra espiões | — |
| F-38 | Ser pego | — | Espião capturado: −20 de relação, motivo de guerra para o alvo | — |

Os agitadores do v4 viram a missão F-35, e a ação atual de influenciar neutros vira o enviado diplomático (DP-31).

## Eras, eventos e crises

### As 8 eras

| Id | Era | Datas de referência | Muda no jogo |
| --- | --- | --- | --- |
| E-01 | Antiguidade | até 500 d.C. | Muralhas fortes; só galés costeiras; estradas de terra |
| E-02 | Idade Média | 500 a 1450 | Castelos; cavalaria pesada; fés organizadas |
| E-03 | Renascimento e Idade Moderna | 1450 a 1750 | Pólvora e artilharia anulam muralhas; travessia oceânica |
| E-04 | Revolução Industrial | 1750 a 1900 | Carvão, aço, ferrovia; fábricas; poluição começa |
| E-05 | Era Moderna | 1900 a 1945 | Petróleo, eletricidade, aviões, blindados, ideologias |
| E-06 | Era Atômica | 1945 a 1990 | Radar, foguetes, Congresso Mundial; nuclear só se ligado |
| E-07 | Era da Informação | 1990 até hoje | Computadores, internet, satélites, corporações, clima |
| E-08 | Futuro próximo (opcional) | depois de hoje | IA, fusão, espaço: fecha a vitória científica |

Nos cenários, os nomes de tropas e construções mudam por era (o v4 já faz isso com os grupos de nomes). No modo Civilização, cada facção entra numa era quando tem metade das tecnologias da anterior, e o **mundo** entra quando a maioria entrou.

### Pontuação de era, eras de ouro e eras sombrias

| Id | Regra | Como funciona |
| --- | --- | --- |
| E-10 | Marcos | Fazer coisas pela primeira vez dá pontos de era: primeira maravilha, primeira travessia oceânica, primeira ferrovia, fundar uma fé, vencer uma guerra |
| E-11 | Era de ouro | Muitos pontos: +1 ação e +lealdade por toda a era seguinte |
| E-12 | Era sombria | Poucos pontos: −estabilidade, mas libera políticas fortes de recuperação |
| E-13 | Era heroica | Sair de uma era sombria com muitos pontos dá bônus dobrado |

### Eventos

Um baralho de eventos por era. A cada rodada há 1 chance em 3 de sair um evento, que aparece como carta com 2 ou 3 escolhas. É a mesma lógica das cartas de benefício do v4, só que com decisões.

| Id | Evento | Quando | Escolhas ou efeito |
| --- | --- | --- | --- |
| E-20 | Epidemia | Saúde baixa ou rotas com território doente | O território perde 1 nível; quarentena corta suas rotas por 3 turnos e salva os vizinhos |
| E-21 | Peste continental | Idade Média, rotas muito densas | Todos perdem população; quem tem banhos e mosteiros perde menos |
| E-22 | Seca e fome | Aleatório, pior sem celeiro | −comida; abrir celeiros (gasta estoque) ou importar (ouro) |
| E-23 | Inundação | Território de rio ou delta | Destrói uma fazenda, mas deixa +1 comida por 5 turnos |
| E-24 | Terremoto e erupção | Montanhas e vulcões | Destrói uma construção; reconstruir é 50% mais barato |
| E-25 | Mudança climática | Poluição mundial alta | Litorais perdem território; secas mais comuns; o Congresso vota limites |
| E-26 | Corrida do ouro | Garimpo (C-26) construído | +população e ouro; −estabilidade |
| E-27 | Revolta camponesa | Felicidade abaixo de −5 | Ceder (−impostos por 5 turnos) ou reprimir (−estabilidade, risco de rebeldes) |
| E-28 | Crise de sucessão | Morte do líder com estabilidade baixa | Guerra civil: parte dos territórios vira facção rebelde |
| E-29 | Cisma religioso | Fé muito grande | Ver G-54 |
| E-30 | Invenção inesperada | Universidade ou laboratório | Descoberta grátis numa tecnologia |
| E-31 | Mecenas | Teatro ou museu | Grande artista mais próximo |
| E-32 | Crise financeira | Era industrial ou depois, dívida alta | −50% ouro por 5 turnos; bancos protegem |
| E-33 | Migração em massa | Guerra vizinha | Aceitar refugiados (+população, −felicidade) ou fechar fronteira (−relação) |
| E-34 | Invasão nômade | Antiguidade e Idade Média, fronteira com estepe ou deserto | Aparece uma horda bárbara com 6 a 10 tropas |
| E-35 | Acidente nuclear | Usina nuclear (C-113) | Território inutilizável por 20 turnos |

### Crises de era (opcional)

No fim de uma era, o jogo pode disparar uma crise que todos enfrentam ao mesmo tempo, com regras especiais por 10 turnos: queda de impérios (facções grandes perdem estabilidade), invasões em ondas, guerra mundial (alianças obrigatórias), crise do petróleo (combustível custa o dobro). Isso dá à partida longa picos de tensão, que é o que mantém o interesse no meio do jogo.

## Condições de vitória

Várias vitórias ao mesmo tempo fazem cada facção ter um plano diferente, e obrigam o jogador a olhar o que os outros estão perseguindo. Cada cenário escolhe quais ficam ligadas.

| Id | Vitória | Como se vence | Contra-jogo | Já existe no v4? |
| --- | --- | --- | --- | --- |
| V-01 | Dominação | Controlar todas as capitais originais (no modo Civilização) ou eliminar todos os rivais (nos cenários) | Alianças defensivas, muralhas | Sim (eliminação) |
| V-02 | Objetivo do cenário | Cumprir a meta histórica (ex.: tomar 32 territórios) e manter por 2 a 3 rodadas (D-03) | Atacar durante a manutenção | Sim, sem a manutenção |
| V-03 | Ciência | Completar o programa espacial em 3 etapas: satélite, pouso tripulado, colônia (cada uma é um projeto em turnos) | Espionagem e sabotagem do projeto; conquistar o território do projeto | Não |
| V-04 | Cultura | Seu turismo supera a cultura acumulada de cada rival | Museus e cultura própria; fechar fronteiras; censura | Não |
| V-05 | Diplomática | Acumular 20 pontos de favor no Congresso Mundial com votos, missões e ajuda | Votar contra; tomar cidades-estado | Não |
| V-06 | Econômica | Ter 50% do ouro mundial em reservas e corporações por 5 turnos, ou controlar 3 monopólios | Embargos; nacionalização de corporações | Não |
| V-07 | Religiosa | Sua fé é a maioria em todas as facções vivas | Inquisição, fé própria | Não |
| V-08 | Legado | Pontos de legado (tecnologias, construções, maravilhas, eras de ouro) acima da meta | Corrida por maravilhas | Sim (30 pontos) |
| V-09 | Pontos no limite de turnos | Se ninguém vencer, ganha quem tem mais pontos: territórios, população, tecnologias, maravilhas, cultura, crescimento | — | Sim (por crescimento) |
| V-10 | Ecológica (opcional) | Mundo com poluição abaixo do limite por 20 turnos e você liderando as renováveis | Indústria suja dos rivais | Não |
| V-11 | Corrida ao objetivo (v47) | Os turnos seguidos do objetivo (3, 3 ou 4) só contam depois que a vitória libera; o objetivo pede 60% do legado da duração; quem cumpre é anunciado a todos | A IA entra em campanha e mira a capital e os alvos de quem está segurando | Sim |

**Regra contra a vitória cedo demais:** nenhuma vitória além de dominação e objetivo pode acontecer antes de uma rodada mínima (ex.: 30 nos cenários, 150 no modo Civilização). Isso resolve o "jogo curto" de hoje sem mudar o combate.

**Aviso de ameaça:** quando uma facção passa de 75% de qualquer vitória, todas recebem um alerta e a IA passa a mirar nela.

## Modo Civilização: do zero em mapa aleatório até hoje

Um modo novo, ao lado dos cenários. Cada facção começa com uma aldeia e um colono num mapa gerado na hora, e a partida atravessa as 8 eras com guerra, comércio e diplomacia. Ele usa todos os sistemas deste documento; os cenários históricos usam uma parte.

### Geração do mapa

| Id | Item | Como funciona |
| --- | --- | --- |
| MC-01 | Tamanho | Pequeno (40 territórios, 4 facções), Médio (70, 6), Grande (110, 8), Enorme (160, 10) |
| MC-02 | Tipo de mundo | Continentes, Pangeia, Arquipélago, Mar interior, Terra-espelho (formas inspiradas na Terra, sem ser cópia) |
| MC-03 | Territórios | Polígonos gerados a partir de pontos espalhados (diagrama de Voronoi) e agrupados em regiões de 4 a 8, como os continentes do War. Fronteiras seguem rios e montanhas quando possível |
| MC-04 | Clima e terreno | Latitude e distância do mar definem o clima: tundra nos polos, desertos nas faixas secas, floresta tropical no equador, planícies e colinas no meio. Cordilheiras ao longo de "placas" sorteadas |
| MC-05 | Rios e traços | Rios descem das montanhas ao mar e dão os traços M-20 a M-26 (delta, passo, estreito, ilha). Desde a v71 o traçado vem da elevação real (`maps/rios.js` grava `maps/relevo/<mapa>-v.json`): a água escoa pelos vales até o mar, com afluentes e largura crescente. Aparece nas lentes Relevo e Terreno (v69). Nos mapas sem relevo vale o traçado aproximado da v67: nasce na divisa com o vizinho mais alto, passa ao lado da cidade e deságua no litoral |
| MC-06 | Jazidas | Distribuídas por terreno com regra de equilíbrio: cada facção tem a até 3 territórios ao menos um luxo, um estratégico antigo e terra boa |
| MC-07 | Maravilhas naturais | 4 a 8 pontos especiais (grande cachoeira, vulcão sagrado, recife) com bônus |
| MC-08 | Semente | Todo mapa tem um código; digitar o mesmo código gera o mesmo mapa (para jogar de novo ou dividir com amigos) |

### Começo e expansão

| Id | Item | Como funciona |
| --- | --- | --- |
| MC-10 | Início | Cada facção recebe 1 aldeia, 1 colono, 2 milicianos e 1 batedor; tudo o mais é ermo |
| MC-11 | Névoa de guerra | Só aqui: territórios não vistos ficam escondidos; batedores, exploradores e rotas revelam. Satélites (K-113) revelam tudo |
| MC-12 | Fundar aldeias | Colono entra num ermo e funda (S-26). Custo de colono sobe a cada aldeia para frear a expansão infinita |
| MC-13 | Postos avançados | Ocupa um ermo sem população só para explorar a jazida |
| MC-14 | Tribos e bárbaros | Acampamentos aparecem nos ermos e atacam vizinhos; destruí-los dá ouro; alguns viram cidades-estado com o tempo |
| MC-15 | Ruínas e aldeias perdidas | Explorar primeiro dá um prêmio: ouro, tecnologia, tropa ou mapa |
| MC-16 | Facções geradas | Nome, cor, brasão e líder gerados; cultura inicial sorteada ou escolhida (agrícola, marítima, nômade, montanhesa) com 1 bônus pequeno |

### Duração e ritmo

| Id | Item | Como funciona |
| --- | --- | --- |
| MC-20 | Duração | Normal: 300 rodadas, cerca de 35 por era; Rápida: 150; Épica: 450 |
| MC-21 | Calendário | Cada rodada vale mais anos no começo (40 anos na Antiguidade) e menos no fim (1 ano na Era da Informação), para chegar a hoje no fim da partida |
| MC-22 | Começar mais tarde | Opção de começar na Idade Média ou na Revolução Industrial, com aldeias e tecnologias da época já distribuídas |
| MC-23 | Turnos rápidos | A IA joga em segundo plano e as animações de turno inimigo podem ser puladas |
| MC-24 | Salvamento | Salva sozinho a cada rodada; 5 espaços; exportar e importar arquivo para trocar de aparelho |
| MC-25 | Desempenho | Mapa e regras calculados em JavaScript puro no navegador; a IA de cada facção roda por etapas para não travar a tela |

### Como o combate do War continua igual

Mesmo no mapa aleatório, o turno continua sendo: reforços, ações de governo, ataques com dados, remanejamento. As novidades entram nas ações de governo (filas, pesquisa, diplomacia) e nos modificadores de dado (tropa, muralha, general). Quem só quer guerra pode jogar com "economia simplificada", que constrói e pesquisa sozinha pelo jogador.

## Inteligência artificial

A IA do v4 escolhe a ação de maior pontuação a cada momento (gulosa). Com filas, cadeias de construção e diplomacia, ela precisa planejar alguns turnos à frente.

| Id | Item | Como funciona |
| --- | --- | --- |
| IA-01 | Perfil por facção | Pesos para guerra, construção, ciência, comércio, fé e expansão. Nos cenários históricos vêm do comportamento real (mongóis: guerra e cavalos; Veneza: comércio) |
| IA-02 | Metas em camadas | A cada 10 turnos escolhe uma meta (ex.: "ter aço"), que vira submetas ("ligar ferro e carvão", "pesquisar Siderurgia", "construir siderúrgica") e enche as filas para isso |
| IA-03 | Planejador de cadeias | Usa o catálogo de requisitos como grafo: para chegar a uma construção, descobre o que falta (tecnologia, bem, construção anterior) e o caminho mais barato |
| IA-04 | Avaliação de guerra | Compara força (tropas × bônus de dado) na fronteira, calcula chance de vitória e só declara guerra acima de um limite; guarda reserva na capital (D-10) |
| IA-05 | Alvos | Prefere territórios com o bem que falta, nós comerciais, maravilhas em construção e o líder perto de vencer |
| IA-06 | Diplomacia | Aceita ou propõe acordos por cálculo: "ganho mais do que dou" + relação. Mostra o motivo ao jogador ("não confiamos em você: quebrou um acordo") |
| IA-07 | Memória | Lembra traições e favores (DP-20) |
| IA-08 | Dificuldade | 5 níveis. Os mais fáceis erram de propósito; os mais difíceis recebem bônus de produção e ciência (dito abertamente ao jogador), nunca visão escondida |
| IA-09 | Agendas do líder | Cada líder tem uma agenda visível (gosta de quem tem muitas maravilhas, odeia quem tem exército grande). Cumprir a agenda dele melhora a relação |
| IA-10 | Teste automático | Manter o teste de partidas IA contra IA (test3.js) e medir duração, tipo de vitória e equilíbrio entre facções a cada parte implementada |
| IA-11 | Tempo de resposta | Cada facção tem um limite de cálculo por turno para o jogo não travar em mapas grandes |

## Interface e leitura do jogo

Com muito mais sistemas, o risco é o jogador se perder. A interface tem que responder sempre a três perguntas: o que eu tenho, o que falta para o que eu quero, e o que os outros estão fazendo.

| Id | Elemento | O que mostra |
| --- | --- | --- |
| UI-01 | Lentes do mapa | Botões que recolorem o mapa: dono (atual), zonas, recursos e jazidas, rede de transporte, rotas comerciais, fé, lealdade, felicidade, poluição |
| UI-02 | Painel do território | Nível, população, zonas, construções, fila com barras, rendimentos e bens ligados |
| UI-03 | "O que falta" | Ao escolher uma construção bloqueada, mostra a lista: tecnologia X (faltam 3 turnos), bem Y (não ligado: produzido em tal território, ligue com estrada ou rota) |
| UI-04 | Árvore de tecnologias | Tela rolável por era com linhas de dependência; cada tecnologia mostra ícones do que libera; caminho até uma tecnologia distante é marcado com um toque |
| UI-05 | Árvore cívica | Igual, para governos e políticas |
| UI-06 | Obras do império | Todas as filas numa tabela, com ordenação e "apressar" |
| UI-07 | Barra de recursos | Ouro, ciência, cultura, fé, influência, felicidade, e os bens estratégicos com estoque e variação por turno |
| UI-08 | Painel diplomático | Uma linha por facção: estado, relação com motivos, acordos, progresso de vitória conhecido |
| UI-09 | Notificações | Fila de avisos no fim do turno: obra pronta, tecnologia descoberta, rota cortada, facção perto de vencer, evento |
| UI-10 | Dicas ao passar o dedo | Cada número explica de onde vem ("+7 ouro: mercado 2, rota 3, palácio 2") |
| UI-11 | Previsão de combate | Antes de atacar, mostra a chance de vitória considerando os bônus de dado |
| UI-12 | Tutorial por camadas | O primeiro cenário liga só combate e obras; os seguintes ligam comércio, depois diplomacia. Cada sistema novo vem com uma tela curta |
| UI-13 | Celular | Painéis em gaveta de baixo, mapa com zoom por pinça (já existe), botões grandes; o jogo atual já roda no celular e isso tem que continuar |
| UI-14 | Histórico | Linha do tempo da partida com eventos e um gráfico de pontos por facção no fim |
| UI-15 | Abas Império e Região (v49) | O painel lateral tem duas abas. Império: indicadores, alertas, pesquisa, objetivo, ações gerais (campanha, festas, impostos, agitadores, câmbio, obras do império), cartas, facções e crônica. Região: o território selecionado, com suas ações (reforçar, recrutar, construir, fila) e suas fronteiras. Clicar no mapa abre a aba Região; Esc ou a tecla I voltam |
| UI-16 | Fronteiras com ações (v49) | A aba Região lista todos os vizinhos do território (por terra e por mar), com dono, tropas e relação. Em cada linha: Atacar, Influenciar (neutros e rebeldes, com o custo) e Mover. Botão desligado explica o motivo na dica. Num território alheio, os vizinhos seus trazem "Atacar daqui". O mapa marca as fronteiras do território selecionado |
| UI-17 | Sub-abas do painel (v50) | Império se divide em Ações, Objetivo, Facções e Era e crônica; Região se divide em Fronteiras, Obras e Detalhes. Uma função por seção; as ações rápidas de tropa (reforçar, recrutar) ficam acima das sub-abas |
| UI-18 | Cidades e construções em relevo (v50) | No mapa, cada classe de construção é um desenho com contorno, volume e sombra de chão, sem medalhão. A cidade cresce com o porte (aldeia a metrópole) |
| UI-19 | Motivo dos dados (v50) | Quando o ataque rola menos de 3 dados, o painel de batalha lista cada causa (poucas tropas, desembarque, suprimento, pântano) e o que resolve. A ofensiva contínua para sozinha se os dados caírem no meio |
| UI-20 | Fichas de construção por finalidade (v50, C-300) | Sub-aba Obras e catálogo agrupam as obras em zonas, comida, produção, ouro, saber, estabilidade, guerra, estradas e mar, cidade e maravilhas. Cada grupo traz o conselho de quando vale a pena; cada ficha, custo, prazo, manutenção, efeito e o que ela abre |
| UI-21 | Governo em abas (v51) | Governo, Políticas, Cívicas e Crenças em abas. Cada opção mostra efeito, diferença para o atual, requisito e motivo do bloqueio; cívicas mostram o que liberam e o prazo pela cultura por turno |
| UI-22 | Personagens em abas (v51) | Líder, Grandes figuras (progresso, origem dos pontos, efeito) e Governadores, nomeados na própria tela por território |
| UI-23 | Aba Obras (v51) | Terceira aba do painel, separada das ações do império. Filas (ociosos em destaque, apressar e retirar), Construir (por finalidade, com botão por território e prazo) e Cadeias (árvore de dependências com tecnologia e estado) |
| UI-24 | Criação em passos (v51) | Facção, líder e ajustes numerados, com resumo do efeito de dificuldade, duração e líderes rivais |
| UI-25 | Conselheiro de turno (v52) | No topo das ações do império e na barra de ação: pesquisa parada, territórios sem obra, cívica ou política disponível, governador sem território, grande figura à espera, vaga de rota, proposta diplomática e territórios em risco. Cada item tem o botão que leva ao lugar certo |
| UI-30 | Níveis de detalhe do mapa (v56) | Longe: cores, tropas e nomes em texto com contorno (sem caixa). O porte aparece sob o nome só de Vila em diante (`.pl.big`). O grupo `.sv` (cidade e melhorias) de um território só é desenhado quando sua escala na tela chega a 0,8 (`nnD()` ÷ unidades por pixel ÷ 100). Regra de projeto: toda mudança no mapa é conferida no mapa inteiro, no zoom médio e de perto, em cenário pequeno e grande, desktop e 390 px. | Feito |
| UI-31 | Tutorial guiado (v57) | `TUT` lista os passos `[alvo, título, texto, preparo]`. `tutShow()` roda o preparo (troca de aba com `tutTab`, mapa inteiro com `tutFit`), acha o alvo e chama `tutPlace()`: o furo `.tuth` é uma caixa com sombra de 200vmax (escurece o resto) e o cartão `.tutc` vai para o primeiro lado que não cobre o alvo; em tela baixa o alvo é rolado para junto do cartão. Passo sem alvo visível (relatório na 1ª rodada) escurece tudo e avisa. `tutEnd()` devolve aba, subabas, seleção e zoom. Abre pelo botão do topo (`data-a=tut`) ou pela abertura da partida (`tutOffer()` espera a vez do jogador). Teclado: Tab preso no cartão, setas, Esc. | Feito |
| UI-32 | Celular: mapa preso (v58) | Até 820 px, `#mapw` é `position:sticky` com 44dvh e `#ptabs` gruda logo abaixo; o painel rola por baixo. `scroll-margin-top` nas seções evita alvo atrás do mapa. Cabeçalho em duas linhas (`.sp` quebra a linha, `#turn` com reticências); `[data-a=keys]` oculto. No tutorial, `stickB()` e o recorte `cut` em `tutPlace()` respeitam mapa, abas e barra de ação. | Feito |
| UI-33 | Tecnologias conhecidas recolhidas (v58) | Em `techModal()`, cada era lista primeiro o que é pesquisável e as silhuetas; as já conhecidas vão para `details.known`. | Feito |
| UI-34 | Abertura do turno (v58) | Em `loop0`, da 2ª rodada em diante a vez do jogador abre em Império > Ações; no celular rola até `.rep`. | Feito |
| UI-35 | Barra de comandos (v60) | `#cmd` sobreposta à base do mapa. `cmdGroups()` devolve os 7 temas; os que têm itens abrem o menu `.cmdm` (`cmdOpen`), os demais agem direto (`cmdObr`, `techs`, `vicm`). Cada item traz nome, custo, descrição e `why` (motivo de estar indisponível: fase, ouro, prestígio, já usado). `renderCmd(adv)` roda no fim de `renderSide` e marca com ponto os temas com pendência do conselheiro. Os itens reutilizam `data-a="act"` e as janelas existentes. Saíram do painel a fileira `.nav` e o bloco de ações da fase. | Feito |
| UI-36 | Barra de comandos: estado, pendências, busca e teclado (v61) | Cada tema de `cmdGroups()` ganha estado curto (`.cs` na barra do computador, cabeçalho do menu em qualquer tela), a lista de chaves do conselheiro que lhe pertencem e a tecla de atalho. O menu aberto mostra no alto as pendências do conselheiro daquele tema (`.cmp`, com o mesmo botão `data-a="adv"`). Busca `#cmq` (lupa, B ou /): `cmdFind()` filtra todos os comandos por nome, descrição e palavras-chave (`CMDKW`), sem acento; Enter aciona o primeiro. Teclas M e E abrem Militar e Economia; setas andam pelos itens; Esc devolve o foco. Itens indisponíveis usam `aria-disabled` para receber foco e serem lidos. | Feito |
| UI-37 | Etapas do turno na barra inferior (v62) | `#actbar` passa a ser a faixa `.cturn` dentro de `#cmd`: Distribuir, Atacar, Remanejar (`.ts`, com estado atual, feito ou bloqueado) e Encerrar turno, mais uma linha de orientação. `data-a="tstep"` abre os detalhes da etapa em Império, Ações (`#phase`), que na etapa Atacar lista as frentes abertas com `odds()`. No computador o mapa termina acima da barra; no celular `#cmd` é fixa no rodapé. `#game.noside` recolhe o painel (`data-a="side"`); `sideOpen()` reabre ao escolher algo na barra ou um território. `endAsk()` confirma o fim do turno com pesquisa parada ou proposta pendente. | Feito |
| UI-38 | Mapa incorporado ao relevo (v67 a v71) | Rios desenhados por `drawRivers()` sob o sombreado do relevo, com traçado calculado da elevação real (v71), visíveis nas lentes Relevo e Terreno. O chão da cidade usa um degradê radial (`cg_<estilo>`) que se desfaz no terreno, sem disco nem sombra de peça |
| IA-20 | Coalizão contra a potência dominante (v59) | `hegemon()`: após `openR()`, com 3+ facções vivas, quem tem ≥ 18% do mapa e ≥ 1,35× os territórios do segundo. `hegCheck()` grava `G.heg`, registra na crônica e avisa. `hegB()` soma 4 ao valor do alvo em `bestAttack` e na escolha do ponto de concentração; `aiDiplo` procura trégua entre não dominantes (60% em vez de 25%) e `accept` soma 0,25; `aiBreakTruces` rompe trégua de 5+ rodadas com a dominante (15% por turno). Aviso fixo em `reportHtml()`. | Feito |
| IA-21 | Guarda da capital (v59) | Em `aiTurn`, se a capital é fronteira e a ameaça vizinha supera a guarnição, ela recebe 60% dos reforços. | Feito |
| IA-22 | Simulações com semente (v64) | `test3.js` troca `Math.random` por um gerador com semente antes de o jogo carregar e reinicia a semente a cada partida simulada (`SEED=n`) | Permite comparar equilíbrio antes e depois de uma mudança sem o ruído entre rodadas |
| UI-29 | Relatório da rodada (v55) | `repMark()` guarda um retrato ao encerrar o turno (territórios, contagem por facção, vivos, posição na crônica `G.logN`); `repBuild()` monta `G.rep` quando a vez volta (perdidos, ganhos, linhas do jogador, linhas contra o jogador, saldo dos rivais, eliminados) e `G.chg` (territórios que mudaram de mãos, que pulsam no mapa); `reportHtml()` mostra no topo das ações. | Feito |
| UI-28 | Placa da cidade, obras urbanas e caminhos (v54) | A placa `.pl` de cada território traz nome e porte por extenso (`pName`, mais "crescendo" quando há `subOf`), substituindo os pontinhos `.lvp`. Classes em `URB` (templo, feira, oficina, quartel, cívica, saber, cultura, maravilha) são desenhadas dentro de `cityHtml`; as rurais ficam nos espaços `SVP`, ligadas ao portão por caminhos `.svr`. | Feito |
| UI-27 | Cidades e paisagem em volume (v53) | `cityHtml(i, lv, wall, cap)` gera a cidade de cada território (3, 6, 10 ou 15 prédios conforme o porte), com estilo por `G.sc.tech` (`CITY`: anc, med, jp, gun, ind, mod), marco central, muralha (porte 3+ até a era da pólvora, ou construção defensiva) e bandeira na capital. Melhorias são maquetes em `SV` (projeção oblíqua, `bx`/`hs`/`pg`). Escala por território: distância ao vizinho mais próximo (`nnD`); zoom máximo `zMax()` de 10 a 16 vezes. | Feito |
| UI-26 | Chance e risco nas fronteiras (v52) | Cada botão de ataque mostra a chance de vencer atacando até o fim; cada vizinho inimigo mostra o risco de ele tomar o território; o cartão do território ganha a etiqueta "em risco". O painel de batalha diz quantas tropas sobram em média. A diplomacia descreve por escrito cada proposta e o motivo da recusa |

## Roteiro de implementação por partes

A ordem abaixo deixa o jogo jogável ao fim de cada parte e testa o equilíbrio com partidas IA contra IA antes de seguir. Cada parte cita os identificadores que entram nela; dá para pedir "faça a parte 2" ou só alguns itens.

| Parte | Tema | Entra | Resultado para quem joga | Tamanho |
| --- | --- | --- | --- | --- |
| 1 | Partida mais longa | D-01 a D-07, D-11, A-44, A-49, V-09 | Cenários passam de 5 a 11 rodadas para 30 a 40, sem mudar o combate | Pequeno |
| 2 | Construção em turnos e sem limite | P-01 a P-04, P-07 a P-11, fim do limite de 2 construções, UI-02, UI-06 | Fila por território, pesquisa em turnos, manutenção | Médio |
| 3 | Recursos e zonas | R-01 a R-10, R-20 a R-62 (parte), Z-01 a Z-11 (Z-12 a Z-17 chegam com a parte 12), M-20 a M-26, S-01 a S-05, M-01 a M-11, UI-01 (lentes de zona e recurso) | Cada território tem terreno, jazidas e zonas; rendimentos vêm das construções | Grande |
| 4 | Catálogo de construções, eras 1 a 3 | C-01 a C-12, C-20 a C-26, C-40 a C-44, C-60 a C-65, C-70 a C-73, C-80 a C-85, C-90 a C-94, C-100 a C-106, C-200 a C-209 | Cadeias reais: mina, fundição, arsenal; mercado, banco | Grande |
| 5 | Estradas, portos e rede de bens | C-120 a C-122, C-126 a C-127, L-01 a L-05, L-07, L-08, L-11, UI-03 | Bens circulam pela rede; tropas andam mais por estrada; transporte naval | Médio |
| 6 | Comércio | T-01 a T-03, T-10 a T-18 | Rotas liberam construções; pilhagem e embargo | Médio |
| 7 | Tecnologias e tropas por era | K-01 a K-59, A-01 a A-07, A-20 a A-24, A-40 a A-47, UI-04 | Árvore das 3 primeiras eras; tropas com bônus de dado | Grande |
| 8 | População e sociedade | S-10 a S-14, S-20 a S-22, S-24, S-26 | Crescimento, felicidade, estabilidade e corrupção | Médio |
| 9 | Diplomacia | DP-01 a DP-08, DP-20 a DP-25, DP-30 a DP-32, IA-06, IA-07, UI-08 | Paz, acordos, alianças; cidades-estado no lugar dos neutros | Grande |
| 10 | Governo, cultura e fé | G-01 a G-08, G-20 a G-31, G-40, G-41, G-50 a G-53 | Árvore cívica, políticas e crenças fictícias | Grande |
| 11 | Personagens e eventos | F-01 a F-03, F-10 a F-16, F-30 a F-38, E-10 a E-13, E-20 a E-34 | Grandes figuras, espiões, eventos com escolhas | Médio |
| 12 | Eras industrial a informação | K-60 a K-117, C-13, C-14, C-27 a C-30, C-45 a C-53, C-66, C-74 a C-76, C-86 a C-89, C-95, C-96, C-107 a C-114, C-123 a C-125, C-128, C-129, C-210 a C-215, A-08 a A-12, A-25 a A-29, L-06, L-09, L-10, T-04 a T-07, T-19 a T-22, S-15, G-09 a G-11, DP-40 a DP-42 | O jogo inteiro até hoje, para os cenários modernos e o modo Civilização | Muito grande |
| 13 | Vitórias completas | V-01 a V-08, V-10, aviso de ameaça | Ciência, cultura, diplomacia, economia, fé | Médio |
| 14 | Modo Civilização | MC-01 a MC-25, S-26, F-17, E-01 a E-08, IA-01 a IA-05, IA-08 a IA-11 | Mapa aleatório, começo do zero, 8 eras | Muito grande |
| 15 | Acabamento | UI-09 a UI-14, E-35, crises de era, S-23, mercado mundial (T-21), era 8 (K-120 a K-122) | Tutorial, histórico, modos opcionais | Médio |

**Sugestão de começo:** as partes 1 e 2 juntas atacam as duas queixas mais diretas (jogo curto e limite de 2 construções) e preparam o terreno para o resto. A parte 3 é a maior mudança de cara do jogo e vale ser vista e aprovada antes das seguintes.

**Ordem flexível:** 5 e 6 podem trocar de lugar; 9, 10 e 11 são independentes entre si. A parte 12 depende de 3 a 8. A parte 14 depende de quase tudo, mas uma versão "mapa aleatório com as regras atuais" (MC-01 a MC-08 sozinhos) pode sair cedo, logo depois da parte 1, se der vontade de jogar mapas novos.

## Referências

Os jogos abaixo foram usados como referência de **mecânicas de gênero**. Nada de nome, arte, texto ou conteúdo deles entra no Soberania; nomes históricos reais (cidades, maravilhas, tecnologias) são domínio comum.

**Páginas consultadas nas pesquisas deste projeto**

- Through the Ages, ações e governos: [gamesstrategyandtactics.blogspot.com](https://gamesstrategyandtactics.blogspot.com/2011/12/through-ages-part-vi-actionsgovernments.html)
- Through the Ages, resenha: [meeplemountain.com](https://www.meeplemountain.com/reviews/through-the-ages-a-new-story-of-civilization/)
- Tensão e decisões em jogos de estratégia: [evizaer.github.io/Tension](https://evizaer.github.io/Tension/)
- A essência dos jogos estilo europeu: [pulsiphergames.com](https://pulsiphergames.com/gamedesign/TheEssenceofEurostyleGames.htm)
- Twilight Struggle (cartas com dupla função, influência): [Wikipedia](https://en.wikipedia.org/wiki/Twilight_Struggle)
- Eurogame: [Wikipedia](https://en.wikipedia.org/wiki/Eurogame)
- Documento de escopo anterior do Soberania: [artefato de escopo](https://claude.ai/artifact/FSpAXAys2GhG83Uf54ihGR)

**Referências gerais de design (conhecimento do gênero, sem página específica consultada)**

- Série Civilization: distritos e zonas, eurecas e inspirações (descobertas), árvore cívica com cartas de política, lealdade, eras de ouro e sombrias, cidades-estado, Congresso Mundial, vitórias múltiplas.
- Catan: estradas nas arestas, recursos por terreno, troca entre jogadores.
- War e War II: combate por dados, remanejamento, cartas, objetivos.
- Europa Universalis e Victoria: agravos e motivos de guerra, cansaço de guerra, cadeias de bens industriais.
- Anno e Factorio: cadeias de produção com insumos ligados.
- Through the Ages: ações limitadas por governo, corrupção e felicidade como freios.
- História econômica e militar geral: datas das eras, Rota da Seda, revolução industrial.
