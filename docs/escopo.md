# Escopo do jogo de estratégia geopolítica

Nov 20, 2026 · @Flavio

## Referências do gênero

A proposta é um jogo original que pega a simplicidade do mapa de territórios, a profundidade econômica dos jogos de grande estratégia e a negociação dos jogos de diplomacia. Nenhum nome, mapa, arte ou regra específica desses jogos é copiado; aproveitamos só mecânicas de gênero.

| Referência | O que funciona | O que aproveitar | O que evitar |
| --- | --- | --- | --- |
| War (Grow) / Risk | Mapa de territórios, dados, objetivos secretos, partidas de 1 a 2 horas | Clareza do mapa, reforços por região controlada, objetivo oculto por jogador | Sorte excessiva nos dados, partidas que terminam em impasse |
| Civilization | Exploração com névoa de guerra, várias vias de vitória, árvore de tecnologia | Exploração, vitória não militar, desenvolvimento de longo prazo | Partidas de 10 horas, excesso de micro gestão |
| Victoria / Hearts of Iron (grande estratégia) | Economia com bens, população e estabilidade política | Recursos interligados, aprovação interna como freio à guerra | Interfaces densas e curva de aprendizado alta |
| Diplomacy | Negociação real entre jogadores, ordens simultâneas | Turnos simultâneos, acordos que podem ser traídos | Ausência total de economia |
| Jogos de navegador persistentes (estilo Supremacy 1914) | Partidas assíncronas de dias, jogadas pelo celular | Modo assíncrono com turnos em tempo real longo | Monetização agressiva que quebra o equilíbrio |

Leituras úteis: [modelagem da economia em Victoria 3](https://www.gamedeveloper.com/design/deep-dive-modeling-the-global-economy-in-victoria-3) e [assincronia em game design](https://www.gamedeveloper.com/game-platforms/analysis-asynchronicity-in-game-design).

## Conceito e pilares

Nome provisório: **Soberania**. Cada jogador governa uma nação fictícia num continente gerado ou desenhado, e vence quem cumprir primeiro seu objetivo secreto ou acumular mais Influência ao fim de um número fixo de turnos. A guerra é um caminho, não o único: ela custa PIB, derruba a moeda e gasta aprovação popular.

Frase de venda: “um jogo de territórios em que o povo, o caixa e a despensa decidem até onde você pode ir”.

**Pilares de design**

1. **Tudo tem preço interno.** Cada ação externa (atacar, embargar, expandir) mexe em PIB, moeda ou aprovação. O limite do jogador é o próprio país, não só o exército.
2. **Interdependência.** Nenhuma nação tem todos os recursos. Quem tem petróleo não tem água; quem tem grãos não tem aço. Isso obriga a negociar.
3. **Simples de ler, fundo para dominar.** O mapa é tão claro quanto um tabuleiro de territórios; a profundidade vem dos painéis de economia, que podem ficar no modo automático.
4. **Partidas com fim.** Uma partida rápida dura de 60 a 90 minutos; uma assíncrona, de 3 a 7 dias. Nunca termina em impasse eterno.
5. **Palavra dada vale algo.** Acordos são registrados pelo sistema; quebrá-los é possível, mas gera perda de reputação visível a todos.

### Como tudo se conecta

&#91;embedded content: como os sistemas se conectam · 6 sistemas, 5 indicadores, 3 efeitos\]

Nenhum sistema age direto no resultado: portos, energia, fé ou líder mexem primeiro nos indicadores, e são eles que tornam acordos mais baratos, tropas mais fortes e o placar maior. Os efeitos realimentam os sistemas no turno seguinte (uma guerra vencida traz territórios e recursos; um embargo corta energia).

## Visão estruturada e versão simplificada

Sim, há muita coisa, e a resposta não é cortar ideias, é organizá-las em **módulos**. O jogo tem um núcleo sempre ligado e módulos que o anfitrião liga ao criar a partida, agrupados em três níveis de complexidade. Assim um iniciante joga em 45 minutos e um veterano tem toda a profundidade, com o mesmo jogo.

**As camadas do jogo**

1. **Núcleo (sempre ligado):** mapa e territórios, turnos simultâneos, indicadores do país, recursos básicos, comércio e acordos, combate.
2. **País por dentro:** infraestrutura, energia e clima, sociedade (cultura e religião).
3. **País por fora:** agentes e missões, organismo internacional, reputação.
4. **Identidade:** líderes prontos e criador de líder.
5. **Militar avançado:** níveis militares 4 e 5, marinha, força aérea, programa nuclear (armas desligadas por padrão).

**Os três níveis**

| Sistema | Essencial (45 a 60 min) | Padrão (90 min ou assíncrono) | Completo (partidas longas) |
| --- | --- | --- | --- |
| Indicadores | PIB, moeda, aprovação e rejeição | + reputação | + prestígio cultural |
| Recursos | 5: água, comida, energia, minério, bélico | + especiarias e luxo | Agricultura e pecuária separadas, urânio |
| Infraestrutura | Não tem; território tem produção fixa | 4 obras: estrada, porto, saneamento, usina | 8 obras e níveis de desenvolvimento 1 a 5 |
| Energia | Um único tipo | Limpa ou suja, com poluição | 6 fontes, índice climático global |
| Sociedade | Não tem | Cultura como um número só | Cultura e religiões fictícias completas |
| Agentes | 1 espião e 1 caravana, 2 missões cada | Espiões, diplomatas e caravanas, contraespionagem simples | Todas as missões, agentes duplos |
| Líderes | 4 prontos | 8 prontos | 8 prontos e criador de líder |
| Militar | Infantaria e blindados, níveis 1 a 3 | + marinha | 5 níveis, força aérea, nuclear opcional |
| Diplomacia | Comércio e não agressão | Todos os acordos | + organismo internacional |

**Por que dividir assim**

- **Aprender aos poucos:** o tutorial começa no Essencial; cada módulo novo é apresentado com uma partida curta.
- **Construir aos poucos:** o MVP é o nível Essencial. Cada módulo vira uma entrega separada, testada antes da próxima.
- **Balancear aos poucos:** cada módulo só mexe nos indicadores, como mostra o diagrama acima. Por isso um módulo novo não quebra os outros.
- **Tabuleiro:** o Essencial é do tamanho certo para virar tabuleiro, e os módulos viram expansões.

## Recursos e economia

A economia gira em torno de três indicadores nacionais (PIB, moeda e aprovação) alimentados por recursos físicos que cada território produz. Cada turno, o jogador recebe produção, paga consumo e manutenção, e o saldo move os indicadores.

**Indicadores nacionais**

| Indicador | O que mede | Sobe com | Cai com | Efeito no jogo |
| --- | --- | --- | --- | --- |
| PIB (bilhões) | Tamanho da economia | Indústria, comércio, energia barata, paz | Guerra no próprio solo, falta de energia ou água, embargos | Define a receita de impostos e o teto de gastos |
| Valor da moeda (índice 0 a 200, base 100) | Confiança na economia | Superávit, reservas, exportações | Déficit, emissão de dinheiro, derrotas, calotes | Encarece ou barateia importações e dívida |
| Aprovação (0 a 100%) | Apoio popular ao governo | Comida farta, água, emprego, vitórias, paz | Fome, racionamento, baixas, impostos altos, inflação | Abaixo de 40% gera protestos; abaixo de 20%, crise de governo |
| Rejeição (0 a 100%) | Oposição ativa, separada da aprovação | Guerra impopular, quebra de acordos, repressão | Concessões, eleições, reformas | Alta rejeição em uma região pode virar revolta e perda do território |
| Reputação internacional (0 a 100) | Confiabilidade nos acordos | Cumprir tratados, ajuda humanitária | Trair, invadir sem pretexto | Muda o preço e a disposição de outros em negociar |

Aprovação e rejeição são separadas de propósito: um país pode ter 50% de aprovação e 10% de rejeição (povo morno) ou 50% e 45% (país polarizado, instável).

**Recursos físicos**

| Recurso | Produzido em | Usado para | Se faltar |
| --- | --- | --- | --- |
| Água potável | Rios, aquíferos, dessalinizadoras | População, agricultura, pecuária | Aprovação despenca rápido; população encolhe |
| Agricultura (grãos) | Planícies férteis | Comida, ração animal, biocombustível | Fome, perda de aprovação, importação cara |
| Pecuária | Pastagens | Comida de alto valor, couro, exportação | Menos aprovação e menos exportação |
| Especiarias e bens de luxo | Regiões tropicais ou raras | Exportação de alto valor, bônus de aprovação | Nada grave, mas perde-se uma fonte de divisas |
| Energia | Petróleo, carvão, hidrelétrica, solar, nuclear | Indústria, cidades, exército | PIB cai e unidades mecanizadas param |
| Minérios (ferro, metais raros) | Montanhas, minas | Indústria e armamento | Não se produzem armas nem fábricas |
| Recursos bélicos (armas, munição, veículos) | Fábricas que usam minério e energia | Criar e manter unidades militares | Exército perde força e não se recompõe |

**Regras de economia**

- Cada recurso tem preço num mercado comum que varia com oferta e procura entre todos os jogadores. Uma seca ou guerra numa região produtora faz o preço subir para todos.
- O jogador escolhe a cada turno três alavancas: alíquota de imposto, gasto militar e investimento (fábricas, irrigação, usinas). Quem não quer micro gestão deixa um conselheiro automático decidir.
- Imprimir moeda resolve um déficit agora e gera inflação depois: a moeda cai e a aprovação sofre dois turnos mais tarde.
- Eventos aleatórios (seca, praga, descoberta de jazida, crise financeira) dão variação entre partidas, com frequência ajustável.

## Sociedade: cultura e religião

Cultura e religião formam o “poder brando”: não tomam território, mas mudam a disposição de outros povos e governos em aceitar você. São também o principal amortecedor da aprovação em tempos difíceis.

**Produção cultural**

- Gerada por universidades, centros culturais, estúdios de mídia e patrimônio histórico. Depende de PIB, energia e estabilidade: guerra e censura derrubam a produção.
- Acumula **Prestígio cultural**, que se espalha pelas rotas de comércio, portos e aeroportos (turismo). Quem recebe muita cultura sua fica mais aberto a acordos com você.
- Território conquistado com cultura diferente da sua tem rejeição maior por vários turnos. Investir em integração cultural reduz isso; repressão reduz rápido, mas aumenta a rejeição nacional e a perda de reputação.
- Exportação cultural vira receita (bens de mídia e turismo), uma alternativa para países pobres em recursos naturais.

**Religião**

As religiões do jogo são fictícias, cada uma com um conjunto de valores (por exemplo: comunitária, ascética, mercantil, guerreira, naturalista). Nenhuma representa uma religião real.

| Elemento | Como funciona |
| --- | --- |
| Composição religiosa | Cada território tem percentuais de cada fé, que mudam devagar com migração, missionários e cultura dominante |
| Postura do Estado | Laico, Estado com religião oficial ou Estado religioso. Laico dá estabilidade em países diversos; religião oficial dá bônus forte de aprovação entre os fiéis e rejeição entre os demais |
| Valores da fé | Cada fé aprova ou reprova políticas: uma fé naturalista rejeita energia suja, uma guerreira aceita melhor baixas, uma mercantil apoia acordos comerciais |
| Afinidade entre países | Mesma fé majoritária facilita acordos (custo menor, reputação maior); fés em conflito aumentam a rejeição a alianças |
| Tensão interna | Minoria grande e insatisfeita pode gerar protestos ou separatismo regional |

**Por que isso importa no jogo:** dá ao jogador pacífico uma forma de crescer e de se proteger (é caro politicamente atacar um país admirado pelo seu próprio povo) e torna a conquista mais complexa do que simplesmente mover tropas. No placar de Influência, o Prestígio cultural passa a contar.

## Infraestrutura

Infraestrutura é o que transforma recurso em riqueza: um território cheio de minério sem ferrovia nem porto produz pouco para o país. Cada obra tem custo de construção, prazo em turnos, manutenção por turno e pode ser danificada em guerra.

| Obra | Efeito econômico | Efeito social | Efeito diplomático e militar |
| --- | --- | --- | --- |
| Estradas | +10% de escoamento de produção do território | Pequeno bônus de aprovação regional | Tropas se movem mais rápido no próprio país |
| Ferrovias | +25% de escoamento de minério e grãos, consome energia | Integra regiões: menos separatismo | Suprimento militar chega mais longe |
| Portos | Permitem comércio marítimo e importação de recursos | Empregos, turismo, entrada de cultura estrangeira | Base para marinha; alvo de bloqueio |
| Aeroportos | Turismo e comércio de bens de alto valor (especiarias, cultura) | Difusão cultural maior | Base para força aérea; alvo prioritário |
| Saneamento e água tratada | Multiplica a água potável disponível e reduz desperdício | Grande bônus de aprovação, menos doenças, população cresce | Países sem saneamento sofrem mais com epidemias e cercos |
| Irrigação e barragens | +30% de agricultura, pode gerar hidroeletricidade | Aprovação rural | Represar um rio reduz a água do vizinho rio abaixo: fonte de conflito |
| Rede elétrica | Leva energia das usinas às fábricas e cidades | Sem rede, apagões derrubam a aprovação | Sabotável por espionagem |
| Telecomunicações | Bônus de PIB em serviços | Aumenta produção cultural | Necessária para espionagem e satélites |

**Regras de apoio**

- Cada território tem um nível de desenvolvimento de 1 a 5, calculado pelas obras que possui. Nível alto gera mais PIB e aprovação, mas também custa mais manutenção.
- Obras podem ser objeto de acordo: “construo um porto no seu litoral em troca de 10 turnos de petróleo”, ou concessão de uma ferrovia a outro país.
- Infraestrutura deteriora sem manutenção: cortar gastos para financiar guerra é possível, mas a conta chega alguns turnos depois em aprovação e PIB.

## Energia limpa e suja

A matriz energética é uma escolha de longo prazo: energia suja é barata e rápida, energia limpa é cara no começo e paga com o tempo. A poluição acumulada vira um problema de todos.

| Fonte | Custo de construção | Custo por turno | Poluição | Particularidade |
| --- | --- | --- | --- | --- |
| Carvão | Baixo | Baixo (exige carvão) | Muito alta | Empregos locais; rejeição de fés naturalistas |
| Petróleo e gás | Baixo | Médio (exige petróleo) | Alta | Preço volátil no mercado; também abastece o exército |
| Hidrelétrica | Alto | Muito baixo | Baixa | Exige rio; pode reduzir a água do vizinho |
| Solar e eólica | Médio, cai com doutrina energética | Muito baixo | Quase nula | Produção varia por turno; exige rede elétrica |
| Biocombustível | Médio | Médio (consome grãos) | Média | Compete com comida |
| Nuclear | Muito alto, 5 turnos | Baixo (exige urânio) | Nula no ar | Risco de acidente; abre a porta para o programa de armas |

**Poluição e clima**

- Cada país acumula poluição local, que reduz aprovação e saúde e, acima de um limite, a agricultura.
- A soma mundial forma um **índice climático global**. Ao passar de certos patamares, aumentam secas, enchentes e quebras de safra em todo o mapa, inclusive para quem poluiu pouco.
- Isso cria acordos naturais: tratados climáticos com metas, créditos de carbono negociáveis e sanções a quem polui demais pelo organismo internacional.
- Populações mais ricas e com mais cultura cobram energia limpa: quanto maior o desenvolvimento, maior a rejeição à energia suja.

## Diplomacia e acordos

A diplomacia é feita com propostas estruturadas que o sistema registra e executa sozinho, mais um chat livre para negociar. Assim o acordo não depende de memória, e a traição é uma ação explícita com custo.

| Tipo de acordo | O que faz | Duração | Quebra antecipada |
| --- | --- | --- | --- |
| Comércio | Troca recorrente de recursos por recursos ou dinheiro, a cada turno | 5 a 20 turnos | Perda de reputação moderada |
| Não agressão | Proíbe ataque entre as partes | Fixa | Perda alta de reputação e de aprovação interna |
| Passagem militar | Permite mover tropas pelo território do outro | Fixa | Baixa |
| Aliança defensiva | Atacar um é atacar os dois | Indeterminada | Muito alta |
| Empréstimo | Dinheiro agora, juros por turno | Fixa | Calote derruba moeda e reputação |
| Cessão de território | Transfere um território, por venda ou tratado de paz | Imediata | Não se aplica |
| Embargo coletivo | Vários países cortam comércio com um alvo | Enquanto durar | Cada parte sai quando quiser |

**Mecânicas de apoio**

- **Reputação pública:** todos veem o histórico de acordos cumpridos e quebrados de cada jogador.
- **Espionagem leve:** feita por agentes com missões, descrita na seção Agentes e missões logo abaixo.
- **Organismo internacional:** a cada 10 turnos há uma votação (sanção, ajuda humanitária, proibição de um tipo de arma). O voto vale conforme PIB e reputação.
- **IA diplomática:** nações controladas pelo computador têm personalidade (mercantil, expansionista, isolacionista) e respondem a propostas com base no interesse e na reputação de quem propõe.

## Agentes e missões

Agentes são peças que você envia ao mapa com uma missão, que leva alguns turnos e pode dar certo ou errado. São três tipos: espiões, diplomatas e caravanas comerciais. Todos seguem a mesma regra de sucesso, o que deixa o sistema fácil de aprender.

**Regras comuns a todos os agentes**

- **Recrutamento:** cada agente custa dinheiro e manutenção por turno. O número máximo depende do país: telecomunicações aumentam as vagas de espião, reputação aumenta as de diplomata, portos e estradas as de caravana.
- **Experiência:** agente tem nível 1 (novato), 2 (veterano) ou 3 (elite). Cada missão bem-sucedida aproxima o próximo nível.
- **Chance de sucesso:** 50% + 10% por nível do agente + modificadores da missão − 10% por nível de contraespionagem do alvo, sempre entre 5% e 95%. Como no combate, a chance aparece antes de confirmar.
- **Quatro resultados possíveis:** sucesso pleno (efeito completo), sucesso parcial (metade do efeito), fracasso discreto (nada acontece, agente volta) e fracasso exposto (agente capturado ou perdido, com incidente diplomático).

**Espiões**

| Missão | Duração | Efeito no sucesso | Modificadores |
| --- | --- | --- | --- |
| Reconhecimento | 1 turno | Revela tropas e estoques do alvo | +20%, missão fácil |
| Descobrir objetivo secreto | 3 turnos | Revela uma pista do objetivo do rival | −10% |
| Roubar doutrina | 3 turnos | Reduz o custo da sua próxima doutrina | −10% se o alvo tiver telecomunicações |
| Sabotagem | 2 turnos | Danifica usina, ferrovia ou porto | −15%; exposto gera pretexto de guerra |
| Agitar oposição | 4 turnos | Aumenta a rejeição no país alvo | +10% se o alvo já tiver rejeição alta |
| Vigiar programa nuclear | 2 turnos | Detecta enriquecimento secreto | Só com nucleares ligados |

**Diplomatas**

| Missão | Duração | Efeito no sucesso | Modificadores |
| --- | --- | --- | --- |
| Melhorar relações | 2 turnos | Acordos com o alvo ficam mais baratos | +10% com mesma fé ou cultura admirada |
| Negociar acordo | 1 a 3 turnos | Aumenta a chance de uma IA aceitar sua proposta | Depende de reputação |
| Mediar paz | 3 turnos | Força uma trégua entre dois países em guerra | −20%; dá muita reputação |
| Atrair voto | 2 turnos | Garante o voto do alvo no organismo internacional | Custa dinheiro ou concessão |
| Proteção consular | permanente | Libera agentes seus capturados no país | Ocupa a vaga do diplomata |

Diplomatas não são capturados: o fracasso exposto vira expulsão, com pequena perda de reputação.

**Caravanas comerciais**

Uma caravana leva uma carga (grãos, especiarias, bens culturais) por uma rota até um país ou mercado neutro. Ela rende mais do que vender no mercado comum, mas corre riscos no caminho.

| Risco na rota | Efeito | Como reduzir |
| --- | --- | --- |
| Zona de guerra | Chance de perder a carga | Escolher rota mais longa ou escoltar com tropas |
| Bloqueio naval | Rota marítima fechada | Marinha própria ou acordo de passagem |
| Sabotagem de espião rival | Carga perdida ou atrasada | Contraespionagem e escolta |
| Bandidos em território sem dono | Perda parcial | Estradas e ocupação dos territórios |

Além do lucro, caravanas espalham sua cultura e religião no destino e abrem caminho para acordos comerciais permanentes. Uma rota usada com sucesso 3 vezes vira **rota estabelecida**, mais barata e segura.

**Contraespionagem**

- Cada país tem um nível de contraespionagem de 0 a 3, comprado com investimento e telecomunicações. Ele reduz a chance de todas as missões inimigas no seu território.
- Espiões podem ser colocados **na defesa**: cada espião em casa aumenta a chance de detectar agentes inimigos.
- **Agente capturado:** o dono da prisão escolhe entre expor publicamente (o rival perde reputação), trocar por um agente seu ou por dinheiro, ou **virar agente duplo**, que passa informações falsas ao dono original.
- A IA também usa agentes, com frequência ligada à personalidade: uma IA expansionista espiona mais, uma mercantil manda mais caravanas.

Para não virar micro gestão, cada jogador tem no início 1 espião, 1 diplomata e 1 caravana, e o teto total fica em torno de 6 a 8 agentes.

## Guerra e combate

O combate mantém a leitura rápida dos jogos de território, mas o resultado depende mais de preparação e logística do que de sorte. Os dados continuam existindo, com peso menor.

**Unidades (MVP com quatro tipos)**

| Unidade | Custo por turno | Força | Papel |
| --- | --- | --- | --- |
| Infantaria | Comida e pouco recurso bélico | Baixa | Ocupar e defender territórios |
| Blindados | Energia e muito recurso bélico | Alta em planície, baixa em montanha | Ataque rápido |
| Marinha | Energia e minério | Média | Controlar rotas marítimas e bloquear comércio |
| Força aérea | Muita energia | Alta, mas não ocupa | Bombardear infraestrutura e apoiar ataques |

**Regras de combate**

- Força do ataque = unidades × tipo × terreno × suprimento × moral, mais um fator aleatório de ±15%. O jogador vê a chance estimada de vitória antes de confirmar.
- **Suprimento:** tropas longe de território próprio ou aliado perdem força a cada turno. Isso impõe frentes de batalha realistas.
- **Moral** vem da aprovação interna: um país com povo insatisfeito luta pior.
- **Custo político:** declarar guerra sem pretexto (fronteira disputada, quebra de acordo do outro) gera rejeição. Baixas aumentam a rejeição turno a turno; vitórias dão um bônus temporário de aprovação.
- **Dano econômico:** território em combate produz metade; bombardeio destrói usinas e fábricas, que levam turnos para reconstruir.
- **Paz:** a guerra termina por tratado (cessão de território, indenização, desmilitarização) ou por rendição quando a capital cai ou a aprovação chega a zero.
- **Formas não militares de conflito:** embargo, bloqueio naval, sabotagem e guerra de preços no mercado de recursos.

### Níveis militares

O exército evolui em cinco níveis. Cada nível libera unidades melhores, mas exige infraestrutura, energia e doutrina, e aumenta o custo de manutenção. Um país pode ter um exército nível 4 com economia nível 2, mas não por muito tempo.

| Nível | Nome | Libera | Exige |
| --- | --- | --- | --- |
| 1 | Milícia | Infantaria básica | Comida |
| 2 | Exército regular | Artilharia, marinha costeira | Fábrica de recurso bélico, estradas |
| 3 | Forças mecanizadas | Blindados, marinha oceânica | Petróleo, ferrovias, portos |
| 4 | Forças integradas | Força aérea, defesa antiaérea | Aeroportos, rede elétrica, telecomunicações |
| 5 | Alta tecnologia | Mísseis, satélites, guerra cibernética | Doutrina militar, nível de desenvolvimento alto |

Além do nível, existe a **postura**: desmilitarizado, defensivo, mobilizado ou guerra total. Postura mais agressiva dá força, mas tira trabalhadores da economia e eleva a rejeição fora de tempos de guerra.

### Programa nuclear: energia ou arma

O urânio e o reator nuclear servem aos dois caminhos, e essa ambiguidade é o centro da mecânica.

1. **Reator civil:** gera energia limpa e é bem visto. Fica sob inspeção do organismo internacional se o país aceitar o tratado de não proliferação (que dá bônus de reputação e comércio).
2. **Enriquecimento secreto:** o jogador pode desviar parte do programa para armas. Leva de 6 a 10 turnos e tem chance de ser descoberto por espionagem a cada turno.
3. **Se descoberto:** queda forte de reputação, votação automática de sanções e pretexto legítimo de guerra para os rivais.
4. **Arsenal pronto:** dá **dissuasão**. Quem tem arma nuclear sofre muito menos ataques de IA e recebe bônus em negociações, mas paga manutenção alta e rejeição de parte da população.
5. **Uso da arma:** possibilidade extrema, com custo enorme: destrói o território alvo, afeta o clima global, derruba a reputação de quem usou a zero e une todos os outros contra ele. Na prática, a arma vale pelo medo que gera, não pelo uso. Armas nucleares vêm desligadas por padrão; o anfitrião pode ligá-las ao criar a partida. Desligadas, o reator continua existindo só como fonte de energia.

Acidentes em reatores são eventos raros, mais prováveis quando o país corta manutenção.

## Exploração e mapa

O mapa começa parcialmente escondido: cada jogador conhece seu território e os vizinhos, e o resto está sob névoa. Explorar revela terras livres, recursos e outras nações.

- **Mapa:** de 40 a 60 territórios agrupados em 6 a 8 regiões. Cada território tem terreno (planície, floresta, montanha, deserto, costa) e de 1 a 3 recursos.
- **Territórios neutros:** no início, cerca de 30% do mapa não tem dono. Ocupá-los custa colonos e investimento, sem combate, o que dá uma fase inicial de expansão pacífica.
- **Jazidas ocultas:** alguns recursos só aparecem depois de uma pesquisa geológica, o que muda o valor de um território no meio do jogo.
- **Batedores e satélites:** batedores revelam territórios vizinhos; mais tarde, um satélite revela uma região inteira.
- **Mapas gerados:** cada partida pode usar um mapa procedural com distribuição de recursos balanceada, para que não haja abertura decorada.
- **Tecnologia enxuta:** em vez de uma árvore grande, cada nação escolhe três doutrinas ao longo da partida (agrícola, industrial, militar, financeira, energética), cada uma com bônus claro.

## Líderes

O líder define a identidade de cada partida: ele empurra o país para um caminho e cobra preço nos outros. Todos os líderes, prontos ou criados pelo jogador, são montados com o mesmo orçamento de pontos, e é isso que garante o equilíbrio.

**Como um líder é montado**

- **Ideologia** (escolha 1): define a postura base em economia e liberdades, por exemplo liberal, desenvolvimentista, conservador, socialista, tecnocrata.
- **Traços** (de 2 a 4): bônus e defeitos específicos, cada um com custo em pontos.
- **Agenda pessoal** (escolha 1): um objetivo secundário que, cumprido, dá aprovação extra, por exemplo “nenhum território sem saneamento” ou “ter a maior marinha”.
- **Habilidade de mandato** (escolha 1): uma ação forte que pode ser usada poucas vezes por partida, como “pacote de obras” ou “mobilização nacional”.

**Líderes prontos (arquétipos fictícios)**

| Arquétipo | Favorece | Prejudica | Habilidade de mandato |
| --- | --- | --- | --- |
| O Industrialista | +20% de produção industrial, obras 25% mais rápidas | +30% de poluição, rejeição de fés naturalistas | Plano de industrialização: dobra a construção por 3 turnos |
| A Diplomata | Acordos custam menos, reputação se recupera em dobro | Moral militar −15%, guerra gera rejeição maior | Cúpula de paz: força uma trégua de 3 turnos numa guerra |
| O General | +20% de força militar, nível militar sobe mais barato | Produção cultural −20%, reputação começa mais baixa | Mobilização geral: exército dobra por 2 turnos |
| A Ambientalista | Energia limpa 30% mais barata, aprovação em países desenvolvidos | Energia suja gera o dobro de rejeição, indústria −10% | Tratado climático: convoca votação com bônus de votos |
| O Banqueiro | Moeda mais estável, juros menores, bônus de comércio | Aprovação popular cresce mais devagar | Socorro financeiro: zera o déficit de um turno sem inflação |
| O Líder Espiritual | Grande bônus de aprovação entre fiéis, difusão religiosa | Minorias religiosas com rejeição maior, menos ciência | Grande peregrinação: +15 de aprovação por 3 turnos |
| O Populista | Aprovação sobe rápido com gastos sociais | Moeda cai mais rápido, reputação instável | Pacote popular: +20 de aprovação, custa inflação depois |
| A Tecnocrata | Pesquisa de doutrinas mais rápida, telecomunicações e serviços | Pouco carisma: aprovação base menor | Salto tecnológico: completa uma doutrina na hora |

**Criador de líder e equilíbrio**

O jogador monta seu líder escolhendo nome, aparência, ideologia, traços, agenda e habilidade. Para que o líder criado não fique mais forte que os prontos:

1. **Orçamento fixo:** todo líder tem exatamente 10 pontos. Os arquétipos prontos usam os mesmos 10, então o criador nunca permite algo que os prontos não poderiam ter.
2. **Defeitos devolvem pontos, com teto:** escolher um defeito devolve pontos, mas no máximo 4. Isso evita líderes com cinco bônus e cinco defeitos.
3. **Defeitos que sempre doem:** defeitos ligados a algo que todo país usa (aprovação, PIB, reputação) valem mais pontos que defeitos fáceis de evitar. Um líder pacífico que pega “moral militar baixa” ganha só 1 ponto, porque quase não paga por ele.
4. **Teto por categoria:** a soma de bônus militares, econômicos ou culturais tem limite, para impedir um líder especialista extremo.
5. **Combinações proibidas:** alguns pares de traços não podem coexistir, como “pacifista” e “belicista”.
6. **Calibragem por simulação:** antes de cada versão, o servidor roda milhares de partidas entre IAs com líderes aleatórios. Traços que ganham demais ficam mais caros; os que perdem demais, mais baratos.
7. **Modo ranqueado:** em partidas ranqueadas online, os líderes criados seguem as mesmas regras e o servidor valida o líder antes do jogo, para impedir edição fora do jogo.

O líder pode mudar durante a partida: se o governo cair por aprovação baixa, o jogador escolhe um sucessor com outra combinação, o que dá uma segunda chance com custo.

## Turno e condições de vitória

Todos os jogadores planejam ao mesmo tempo e as ordens são resolvidas juntas no fim do turno. Isso elimina a espera de “vez do outro” e funciona tanto ao vivo quanto de forma assíncrona.

**Fases de cada turno**

1. **Relatório:** produção, consumo, eventos e variação de PIB, moeda e aprovação.
2. **Política interna:** impostos, gastos e investimentos.
3. **Diplomacia:** enviar e aceitar propostas, chat.
4. **Ordens militares:** mover, atacar, defender, explorar.
5. **Resolução simultânea:** comércio, depois combates, depois ocupações, depois atualização do mercado.

Um turno ao vivo dura de 2 a 4 minutos; no modo assíncrono, de 12 a 24 horas, e fecha antes se todos confirmarem.

**Condições de vitória (o anfitrião escolhe quais valem)**

- **Objetivo secreto:** sorteado no início, por exemplo “controlar duas regiões inteiras”, “ter o maior PIB por 5 turnos seguidos” ou “ser o maior exportador de comida”.
- **Influência:** placar que soma PIB, aprovação, reputação e territórios; vence quem tiver mais ao fim de 30 turnos.
- **Dominação:** controlar 60% do mapa.
- **Hegemonia econômica:** a moeda do jogador vira reserva, quando detém a maior parte das dívidas e contratos comerciais ativos.

Um jogador cujo governo cai por aprovação zero não é eliminado: perde o turno, troca de governo e volta com penalidade. Isso evita que alguém fique de fora pelo resto da partida.

## Modos single e multiplayer

O mesmo motor de turnos simultâneos serve aos três modos; a diferença está em quem controla as outras nações e no relógio do turno.

| Modo | Jogadores | Duração | Destaques |
| --- | --- | --- | --- |
| Campanha solo contra IA | 1 humano e 3 a 7 IAs | 1 a 3 horas, com salvamento | Três níveis de dificuldade, personalidades de IA, tutorial guiado nos primeiros 5 turnos |
| Multiplayer ao vivo | 2 a 6 | 60 a 90 minutos | Sala com código de convite, turnos de 2 a 4 minutos, IA assume quem cair |
| Multiplayer assíncrono | 4 a 10 | 3 a 7 dias | Um turno por dia, notificação no celular, chat diplomático permanente |
| Cenários (fase futura) | 1 ou mais | Variável | Situações prontas, como “crise hídrica” ou “corrida pelo petróleo” |

Para multiplayer competitivo, o servidor é a autoridade: ele recebe as ordens, resolve o turno e devolve o resultado, o que impede trapaça e permite reconectar a qualquer momento.

## Plataforma e tecnologia

Recomendação: começar como jogo web responsivo (navegador no computador e no celular). É o caminho mais barato para testar com amigos, não exige loja de aplicativos e combina com turnos assíncronos. O jogo original que você citou já roda na web, o que confirma o formato.

| Opção | Prós | Contras | Quando faz sentido |
| --- | --- | --- | --- |
| Web (TypeScript, React, mapa em SVG ou Canvas, servidor Node com WebSocket) | Rápido de publicar, roda em tudo, link de convite direto | Gráficos mais simples | MVP e testes com jogadores |
| Web empacotado como app (PWA ou Capacitor) | Mesmo código nas lojas, notificações no celular | Ajustes de interface para tela pequena | Depois do MVP, para o modo assíncrono |
| Motor de jogo (Godot ou Unity) | Mapa e animações mais ricos, exportação para PC, celular e console | Mais lento para iterar regras, multiplayer dá mais trabalho | Se o jogo virar produto comercial com arte forte |
| Desktop (Steam) | Público de estratégia está lá | Exige polimento e preço | Fase de lançamento comercial |

**Arquitetura sugerida para a web**

- Regras do jogo numa biblioteca pura e determinística, sem interface: a mesma roda no navegador (modo solo) e no servidor (multiplayer). Isso também facilita testes e balanceamento automatizado.
- Servidor leve com salas, WebSocket para o modo ao vivo e banco de dados (por exemplo PostgreSQL ou Firebase) para partidas assíncronas.
- IA começa com regras e pesos simples por personalidade; só depois vale algo mais sofisticado.

## Versão de tabuleiro

O jogo nasce online, mas uma versão física é viável se a versão online tiver um “modo simplificado” desde cedo. O computador faz contas que à mesa seriam pesadas demais, então o tabuleiro precisa de menos números, não das mesmas regras.

| Sistema online | Como vira tabuleiro |
| --- | --- |
| Mercado com preços variáveis | Trilha de preços com marcadores que sobem quando alguém compra |
| PIB, moeda, aprovação e rejeição | Quatro trilhas por jogador num painel individual, com cubos |
| Recursos físicos | Fichas de cores, cerca de 6 tipos (especiarias e pecuária agrupados) |
| Infraestrutura | Peças colocadas no território, cada uma com efeito impresso |
| Líderes | Cartas de líder com os arquétipos prontos; o criador vira um kit de cartas de traço com custo impresso |
| Eventos, cultura, religião | Baralho de eventos e marcadores de influência por região |
| Turnos simultâneos | Ordens escritas em segredo e reveladas juntas, ou turnos alternados |
| Névoa de guerra e espionagem | Fichas viradas para baixo sobre territórios inexplorados |

Um caminho intermediário barato é um **tabuleiro híbrido**: o mapa e as peças são físicos e um aplicativo no celular faz a economia e o mercado. Essa decisão pode esperar o online estar testado.

## MVP sugerido e próximos passos

O MVP prova uma pergunta só: “a tensão entre guerra, economia e aprovação é divertida?”. Para isso, basta uma partida online no navegador, com 2 a 4 pessoas e IAs completando as vagas, num mapa fixo, de cerca de 60 minutos.

**Entra no MVP**

- Um mapa fixo de 30 territórios em 5 regiões, com névoa de guerra simples.
- Indicadores: PIB, moeda, aprovação e rejeição.
- Cinco recursos: água, comida (agricultura e pecuária juntas), energia, minério e recurso bélico. Especiarias entram como bônus de exportação.
- Infantaria e blindados, com terreno e suprimento.
- Acordos de comércio e não agressão, com reputação.
- Turnos simultâneos, 25 turnos, vitória por objetivo secreto ou Influência.
- Salas online com código de convite e IAs com personalidades diferentes para completar a mesa.

Esse conjunto é o nível Essencial da Visão estruturada, com 4 líderes prontos e 1 espião e 1 caravana por jogador. Os módulos do nível Padrão entram na fase seguinte, um de cada vez.

**Fica para depois:** religião, programa nuclear, criador de líder, marinha e força aérea, espionagem, organismo internacional, mapa procedural, modo assíncrono e app de celular.

**Fases**

1. **Protótipo de papel ou planilha (1 a 2 semanas):** testar as fórmulas de economia e combate antes de qualquer interface.
2. **MVP online na web (8 a 12 semanas):** o escopo acima, para jogar e balancear.
3. **Profundidade (6 a 8 semanas):** módulos do nível Padrão (infraestrutura, energia limpa e suja, cultura, diplomatas e contraespionagem, marinha), depois os do Completo, e campanha solo.
4. **Assíncrono e celular (4 a 6 semanas):** turnos diários e notificações.
5. **Conteúdo:** novas unidades, cenários, mapas gerados.

Prazos supondo uma pessoa dedicando meio período, com ajuda de IA no código; são estimativas, não compromissos.

**Perguntas em aberto para você**

- [ ] Ambientação: mundo fictício, mapa real estilizado ou época histórica específica?
- [ ] Tom: mais sério e simulado ou mais leve e de tabuleiro?
- [ ] Decidido: online primeiro e armas nucleares desligadas por padrão.
- [ ] Objetivo: projeto pessoal, jogo gratuito ou produto comercial?
- [ ] O nome provisório Soberania serve, ou prefere outro?
