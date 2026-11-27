# Histórico de versões

## v64 — 27/11/2026 · Foco de produção da IA só no Difícil; simulações com semente (P-14, IA-22)

- **Dificuldade.** No Difícil, os impérios da IA também aproveitam a produção das regiões sem obra, sempre em comida. No Fácil e no Normal, só o jogador tem o foco. O resumo da escolha de dificuldade explica a diferença.
- **Simulações repetíveis (IA-22).** `SEED=n node test3.js` repete exatamente as mesmas partidas simuladas, o que permite comparar o equilíbrio antes e depois de uma mudança. Sem `SEED`, a semente é sorteada e impressa no começo.
- Análise completa do conteúdo (construções, tecnologias, recursos, cartas, governos, líderes, mapa) e plano em 7 partes em documento separado.

## v63 — 27/11/2026 · Foco de produção: região sem obra não fica parada (P-14)

- **Produção nunca se perde.** Território com a fila vazia passa a converter a produção ⚒ no foco escolhido: Alimentação (comida da região, sempre disponível), Riqueza (ouro, exige Comércio, rende 50% a mais na república mercantil), Ciência (saber, exige Escrita), Cultura (exige Alvenaria) ou Festividades (estabilidade, exige Construção civil, até +3 por turno no império). Antes, essa produção era desperdiçada.
- **Sem pedido de obra impossível.** Quando nada cabe na região, o painel deixa de mostrar "Construir aqui" e "Escolher obra": aparece só o foco, com o ganho por turno. A obra volta a ser oferecida quando uma tecnologia, zona ou construção a liberar.
- **Aba Obras.** O indicador "Ociosos" virou "Sem obra" e conta só os territórios em que há algo a construir. Os demais aparecem no fim da lista com o foco e o rendimento.
- **Um toque para todos.** Botão "Usar este foco em todas as regiões"; focos bloqueados mostram o cadeado e a tecnologia que falta.
- O foco vale para o império do jogador e entra no salvamento. Os impérios da IA seguem como antes: em 109 partidas simuladas, as vitórias por domínio foram 20 na v62, 33 com o foco ligado para todos e 26 com o foco só no jogador. A variação entre rodadas é grande, mas por cautela o foco ficou de fora da IA.
- Texto da doutrina de conquista atualizado (não existe mais "declarar campanha").
- Manual e teste novo (P-14).

## v62 — 27/11/2026 · Turno livre, etapas na barra e ataque sem declarar campanha (D-19, UI-37)

O turno tinha três fases fechadas: nada de obras ou governo antes de pôr os reforços, nada de gestão durante o remanejamento, e para atacar era preciso abrir um menu e declarar campanha.

- **Turno livre.** Obras, pesquisa, governo, diplomacia, comércio e recrutamento valem do começo ao fim do turno. Só a parte militar tem ordem: distribuir os reforços, atacar, remanejar. Atacar e remanejar são opcionais.
- **Única obrigação:** distribuir os reforços. Sem isso não dá para atacar, remanejar nem encerrar o turno, e o jogo diz isso por escrito.
- **Atacar sem declarar campanha.** Com os reforços distribuídos, basta clicar num território seu e num vizinho. O primeiro ataque do turno põe o império em campanha (é o que soma cansaço de guerra); turno sem ataque não soma.
- **Aviso antes de romper tratado.** Atacar quem está em trégua ou é aliado deixou de ser bloqueado: abre um aviso com as consequências daquele caso (estabilidade, acordos que acabam, opinião da facção e das outras, quem entra na guerra por defesa mútua, motivo de guerra quando houver) e a chance de vencer. Esc ou "Não atacar" não rompe nada.
- **Etapas do turno na barra inferior:** Distribuir, Atacar, Remanejar e Encerrar turno, com a etapa atual destacada, a concluída marcada e uma linha dizendo o que fazer agora. Tocar numa etapa abre os detalhes dela no painel lateral.
- **Frentes abertas.** A etapa Atacar lista no painel os melhores ataques possíveis, com tropas dos dois lados e chance de vencer; um toque abre a batalha.
- **Recusas explicadas.** Todo ataque negado diz o motivo: reforços por distribuir, remanejamento já iniciado, menos de 2 tropas, limite de conquistas do turno, frota sem travessias, capital protegida na abertura. O motivo também aparece ao lado do botão na lista de fronteiras. Antes, o limite de conquistas respondia só "Ataque indisponível agora".
- **Fronteiras revisadas.** Os 11 mapas foram comparados com o desenho, território por território. Faltava uma fronteira no mapa-múndi (Canadá Leste e EUA Oeste, que se tocam por 15 px), agora incluída. Nos demais, toda divisa desenhada é fronteira no jogo.
- **Mapa inteiro visível no computador.** O mapa agora termina acima da barra, então nenhum território fica coberto por ela. No celular a barra foi para o rodapé da tela e saiu de cima do mapa.
- **Painel lateral recolhível** (botão junto ao zoom): o mapa ocupa a largura toda e o painel reabre ao escolher algo na barra ou um território.
- **Encerrar com cuidado.** Se a pesquisa está parada ou há proposta diplomática sem resposta, encerrar o turno pede confirmação.
- Carta de reforços pode ser usada em qualquer momento antes do remanejamento. Tutorial, guia do iniciante, busca e manual reescritos para o fluxo novo.

## v61 — 27/11/2026 · Barra de comandos: estado, pendências, busca e teclado (UI-36)

A barra da v60 mostrava onde ficam os comandos. Faltava dizer como o império está, por que um tema pede atenção e ajudar quem não sabe em que tema procurar.

- **Estado em cada tema (computador):** sob o nome, o que importa agora: tropas ou "em campanha", obras na fila, avanço da pesquisa, estabilidade, prestígio ou propostas, ouro e saldo do turno, legado e meta. No celular, o estado aparece no alto do menu aberto.
- **Pendências dentro do menu:** o ponto dourado agora se explica. Ao abrir o tema, o aviso do conselheiro vem no alto, com o botão que resolve ("Há vaga de política livre", Ver políticas). Militar avisa de territórios em risco; Economia, de vaga de rota.
- **Busca (lupa, tecla B ou /):** escreva o que quer fazer com as suas palavras, como "atacar", "ouro", "paz" ou "construir", e a busca mostra os comandos que servem, com custo, explicação e motivo quando apagados. Sem acento e sem maiúscula também vale. Enter aciona o primeiro resultado. Tutorial, Regras e Salvar também são encontrados.
- **Teclado:** M abre Militar, E abre Economia, setas andam pelos itens, Esc fecha e devolve o foco ao tema. Os itens apagados agora recebem foco e são lidos por leitor de tela junto com o motivo (antes eram pulados).
- **Correção:** com muitos itens, as linhas do menu se espremiam e cortavam o texto no celular; agora o menu rola.
- Tutorial com o passo da busca (34 passos); atalhos novos na janela de atalhos.

## v60 — 27/11/2026 · Barra de comandos: tudo a um toque, com explicação (UI-35)

O painel tinha virado uma rolagem longa. Para declarar campanha era preciso estar na aba Império, na seção Ações, e rolar por baixo do conselheiro e do guia: numa tela de 1000 px de altura o botão ficava fora da vista. As janelas (tecnologias, governo, diplomacia) estavam numa fileira, as ações noutra, bem abaixo, sem dizer o que faziam a não ser passando o mouse.

- **Barra de comandos fixa sob o mapa**, sempre visível, em qualquer aba e também no celular: Militar, Obras, Pesquisa, Governo, Diplomacia, Economia e Vitórias.
- **Um toque abre o tema; cada item se explica.** Nome, custo, o que faz e, quando não dá para usar, o motivo por escrito ("Falta ouro: custa 4 e você tem 3", "Posicione os reforços primeiro"). Antes o motivo só aparecia ao passar o mouse, o que não existe no celular.
- **Ponto dourado** no tema que tem pendência: pesquisa não escolhida, território sem obra, vaga de política, governador sem posto, proposta diplomática.
- **Menos movimentos.** Declarar campanha, recrutar, festividades, impostos, rotas e as janelas de governo e diplomacia saíram de 3 a 4 movimentos com rolagem para 2 toques sem rolagem; Obras, Pesquisa e Vitórias, para 1.
- **Painel mais curto.** Saíram a fileira de janelas e o bloco "Ações do império"; a aba Império fica com indicadores, relatório, conselheiro e guia.
- Clique fora ou Esc fecha o menu; a caixa de batalha sobe para não cobrir a barra.
- Tutorial atualizado: os passos de cada tema abrem o menu correspondente e iluminam os itens (33 passos).

## v59 — 27/11/2026 · Rivais que reagem a quem domina o mapa (IA-20, IA-21)

Até aqui cada rival jogava sozinho: quem saía na frente crescia sem resposta, e isso vale também para o jogador que dispara. Agora os rivais leem o mapa.

- **Coalizão contra a potência dominante (IA-20).** Passada a abertura, quem tiver pelo menos 18% do mapa e 35% mais territórios que o segundo colocado vira a ameaça comum. Os rivais passam a mirar os territórios dela primeiro, procuram trégua entre si com mais frequência e aceitam mais fácil, e uma trégua antiga com ela (5 rodadas ou mais) pode ser rompida. Aliados dela ficam de fora.
- **O jogador é avisado.** Um aviso aparece na hora, a crônica registra e o topo das ações explica o que muda: se é você quem domina, reforce as fronteiras; se é um rival, é a hora de atacá-lo junto com os outros.
- **Capital guardada (IA-21).** O rival com a capital ameaçada põe os reforços nela antes de atacar.
- **Celular:** a fileira de lentes do mapa esmaece no fim, mostrando que rola para o lado.
- **Equilíbrio medido lado a lado (3 partidas por facção):** em Sengoku a distribuição de vencedores segue espalhada (7 clãs vencem, como antes). Em Regências os Farrapos continuam vencendo a maioria (13 de 15 antes, 11 a 13 de 15 depois): a coalizão não resolve esse cenário, cuja vantagem vem da posição inicial. Uma primeira versão, que proibia atacar a partir da capital ameaçada, travava as facções de um território só e foi descartada.

## v58 — 27/11/2026 · Jogar no celular sem perder o mapa de vista (UI-32 a UI-34)

Joguei turnos inteiros pela interface, no computador e numa tela de 390 px, anotando cada atrito. No computador o fluxo está redondo; os problemas reais estavam no celular e em duas telas comuns aos dois.

- **Celular: mapa preso no alto (UI-32).** Antes, ao tocar num território, a ficha e as fronteiras ficavam abaixo da dobra: era preciso rolar e o mapa sumia. Agora o mapa ocupa a parte de cima e fica fixo; o painel rola por baixo dele, com as abas Império, Obras e Região sempre à vista. A barra do alto ficou em duas linhas estáveis (o estado do turno encurta com reticências) e o botão de atalhos de teclado some no toque.
- **Tecnologias: o que dá para pesquisar vem primeiro (UI-33).** A tela abria com mais de vinte tecnologias já conhecidas antes da primeira pesquisável. As conhecidas agora ficam recolhidas numa linha por era ("22 já conhecidas"), que abre com um toque.
- **O turno abre onde importa (UI-34).** A partir da segunda rodada, a sua vez começa em Império, Ações, com o relatório "Desde o seu último turno" e o conselheiro; no celular a tela rola até o relatório.
- **Tutorial ajustado ao novo desenho:** no celular o foco iluminado não invade as abas nem a barra de ação, e o alvo nunca fica atrás do mapa.

## v57 — 27/11/2026 · Tutorial guiado (UI-31)

Um tutorial que ensina o jogo dentro do próprio jogo: a tela escurece e só a função explicada fica iluminada, com um cartão ao lado dizendo o que ela é e como usar.

- **31 passos, a tela inteira.** Barra da partida, mapa, marcador de território, lentes, zoom, as três etapas do turno (Reforços, Ações e guerra, Remanejar), as abas Império, Obras e Região, os seis indicadores, Tecnologias, Governo e fé, Diplomacia, Vitórias, Personagens, Comércio, Conselheiro, relatório da rodada, cartas, filas de obras, ficha e fronteiras do território e como vencer.
- **Onde abrir.** Botão "Tutorial guiado" na abertura de cada partida e botão "Tutorial" na barra do alto, a qualquer momento da sua vez.
- **Não mexe na partida.** O tutorial só troca de aba para mostrar cada coisa; ao sair, aba, seleção e zoom voltam ao que estavam.
- **Teclado e leitor de tela.** Setas ou Enter avançam, seta para a esquerda volta, Esc sai; o foco fica preso no cartão e cada passo é anunciado. Respeita a preferência por menos movimento.
- **Celular.** O cartão nunca sai da tela nem cobre o que explica: quando falta espaço, a página rola o alvo para junto do cartão.
- Os textos foram conferidos contra as regras do jogo (fila de 3 obras, 5 cartas, 8 portes, vitórias a partir de 1/3 da partida).
- O manual (Regras) ainda descrevia os quatro pontinhos de porte, retirados na v54; foi corrigido.

## v56 — 27/11/2026 · Mapa legível em qualquer zoom (UI-30)

A v54 trocou os pontinhos por placas escuras com nome e porte. De perto ficava bom; com o mapa inteiro na tela, as caixas cobriam as províncias, "ALDEIA" se repetia dezenas de vezes e as cidades miúdas viravam ruído, sobretudo no celular. Esta versão corrige isso com níveis de detalhe.

- **De longe:** só cores dos donos, tropas e nomes em texto com contorno, sem caixa. Nada cobre o formato das províncias.
- **Porte só quando informa.** "Vila", "Cidade" e "Metrópole" aparecem sob o nome; "Aldeia", que é o ponto de partida de quase todo território, não aparece mais no mapa (continua no painel e na dica do território).
- **Cidade só quando dá para ler.** O desenho da cidade e das melhorias de um território surge quando ele tem tamanho na tela para isso; antes disso não é desenhado.
- Conferido no mapa inteiro, em zoom médio e de perto, em três cenários (Sengoku, Segunda Guerra, Guerras Púnicas), no desktop e em tela de 390 px.

## v55 — 27/11/2026 · Relatório da rodada e abertura protegida (UI-29, D-18)

- **Desde o seu último turno (UI-29).** Quando a vez volta para você, o topo das ações traz um relatório do que aconteceu enquanto os rivais jogavam: territórios que você perdeu e para quem, ações contra você, territórios ganhos, o que mudou no seu império (obras, pesquisa, fome, deserção) e, no mundo, o saldo de cada rival ("Clã Takeda: 4 → 7 territórios"), quem foi eliminado e as três maiores potências. Antes, tudo isso ficava enterrado na Crônica e o jogador voltava ao turno sem saber o que tinha mudado.
- **Mapa mostra o que mudou.** Territórios seus que trocaram de mãos desde o último turno ficam com o marcador pulsando (ou com contorno fixo, para quem reduz animações).
- **Abertura protegida (D-18).** Capitais não podem ser atacadas nas primeiras rodadas: 4 na partida curta, 8 nas demais (antes, só na primeira). Jogando o Sengoku pela interface, clãs de um território só eram eliminados na rodada 3, antes de qualquer decisão fazer efeito. O aviso aparece no relatório e no motivo de recusa do ataque.
- **Placas sem sobreposição.** A placa que bateria em outra ou num marcador vizinho some até você aproximar o mapa. "Crescendo" virou uma seta ▲ ao lado do porte.

## v54 — 27/11/2026 · Cidade integrada: placa, obras urbanas e caminhos (UI-28)

- **Placa da cidade no lugar dos pontinhos (UI-28).** Os quatro pontinhos acima do número de tropas indicavam o porte da cidade (de 1 a 4), mas ninguém conseguia adivinhar isso. Saíram. Cada território tem agora uma placa com o nome e o porte por extenso (Aldeia, Vila, Cidade, Metrópole), com a borda na cor do dono; quando a cidade está a caminho do próximo porte, a placa diz "crescendo".
- **Obras urbanas dentro da cidade.** Templo, feira, oficina, quartel, aqueduto, observatório, anfiteatro e maravilha aparecem como prédios entre as casas, dentro da muralha. A cidade alarga para recebê-los.
- **Obras rurais ligadas por caminhos.** Campos, pasto, pesqueiro, mata, mina, porto e pista ficam espalhados pelo território, ligados ao portão da cidade por caminhos de terra. Um caminho desce do portão até a guarnição, onde chegam as estradas entre territórios.

## v53 — 27/11/2026 · Cidades e paisagem de verdade no mapa (UI-27)

- **Cidades no lugar dos ícones (UI-27).** Cada território povoado mostra uma cidade desenhada em volume sobre o terreno: casas, ruas de chão batido, árvores em volta e um marco no centro. A aldeia tem três casas; a metrópole, quinze, com muralha de pedra, torres e portão.
- **Estilo por época e cenário.** Antiguidade com casas de terraço e templo em degraus; Idade Média com telhados de barro e torre de menagem; Sengoku com telhados escuros e castelo de vários andares; era da pólvora com ardósia; guerras mundiais com quarteirões de alvenaria; Guerra Fria com torres de vidro.
- **Capital e muralha.** A capital hasteia bandeira. Castelo, forte ou muralha construídos no território viram a muralha da própria cidade, em vez de um ícone solto.
- **Melhorias na paisagem.** Campos lavrados, pasto cercado com gado, pesqueiro com barco, serraria na mata, mina com entrada e minério, oficina com chaminé, feira de tendas, porto com navio, templo de colunas, aqueduto, observatório, acampamento militar, anfiteatro, pista de pouso e monumento dourado para as maravilhas. Tudo original, desenhado em vetor.
- **Escala que cabe no território.** O tamanho de cada cidade segue a distância até o vizinho mais próximo, então nada invade a província ao lado em mapas apertados. Mapas com territórios pequenos (como a Europa no mapa-múndi) ganham zoom máximo maior, até 16 vezes.

## v52 — 26/11/2026 · Conselheiro de turno, chance e risco nas fronteiras (UI-25, UI-26)

- **Conselheiro de turno (UI-25).** No topo das ações do império, uma lista do que está parado ou esquecido neste turno, cada linha com o botão que resolve: pesquisa não escolhida, territórios sem obra, cívica que a cultura já paga, vaga de política livre, panteão disponível, governador sem território, grande figura à espera, vaga de rota comercial, proposta diplomática sem resposta e territórios em risco. A barra de ação mostra o número de pontos de atenção ao lado do botão de encerrar o turno, sem bloquear nada.
- **Chance antes de atacar (UI-26).** Na aba Região, cada botão Atacar traz a chance de vencer atacando até o fim, já com os bônus de dado dos dois lados, em verde, amarelo ou vermelho. Não é mais preciso abrir a batalha para saber.
- **Risco de perder.** Cada vizinho inimigo mostra o risco de ele tomar o seu território, e o cartão do território ganha a etiqueta "em risco" quando passa de 50%.
- **Perdas esperadas.** O painel de batalha diz quantas tropas sobram, em média, quando o ataque vence.
- **Diplomacia por escrito.** Cada facção tem um detalhe que diz o que cada proposta faz e, quando ela recusaria, o motivo. Antes isso só aparecia ao passar o mouse, o que não existe no celular.

## v51 — 26/11/2026 · Aba Obras, governo em abas, personagens e criação em passos (UI-21 a UI-24)

- **Aba Obras (UI-23).** O painel passa a ter três abas: Império, Obras e Região. As obras saíram do meio das ações do império e ganharam espaço próprio, com três seções:
  - **Filas:** todos os territórios, com os ociosos no topo e em destaque, a fila de cada um, apressar e retirar. Não é mais preciso "Ordenar obras" antes.
  - **Construir:** as obras por finalidade. Cada ficha mostra custo, manutenção, efeito, de onde ela vem e o que ela abre, e um botão por território onde cabe, já com o prazo em turnos. As bloqueadas dizem o que falta.
  - **Cadeias:** a árvore de cada obra base até as que dependem dela, com a tecnologia exigida e a marca do que você tem, do que pode construir e do que falta.
- **Governo, cultura e fé (UI-21).** A tela se divide em Governo, Políticas, Cívicas e Crenças. O governo atual fica no topo; cada outro governo mostra a diferença de vagas em relação ao atual e, se bloqueado, a cívica que falta com o custo. Políticas vêm agrupadas pelo tipo de vaga, com as vagas em uso, e as bloqueadas agora aparecem com o motivo. Cívicas mostram o que liberam, a que levam e em quantos turnos a cultura alcança o custo. Panteões e princípios da fé têm o efeito escrito, não só na dica.
- **Personagens (UI-22).** Três seções: Líder, Grandes figuras (barra de progresso, de onde vêm os pontos e o que cada uma faz ao ser usada) e Governadores. Os governadores são nomeados ali mesmo, território por território, com a indicação de quando cada tipo vale mais.
- **Criação da partida (UI-24).** Três passos numerados (facção, líder, ajustes) e um resumo que diz o que a dificuldade, a duração e os líderes rivais mudam.
- O botão Obras saiu dos atalhos do Império (a aba faz esse papel; a tecla O continua valendo) e as sub-abas do Império cabem numa linha só.

## v50 — 26/11/2026 · Painel por seções, fichas de construção, relevo e mar (UI-17 a UI-20, D-17, T-19)

- **Correção: facção sem território continuava viva.** No caso relatado (Sengoku, Clã Miyoshi com 0 territórios e em guerra), a eliminação só era marcada em conquista direta. Quem perdia o último território por revolta, influência ou evento ficava "vivo" e impedia a vitória. Agora a checagem é geral e roda a cada turno.
- **Motivo dos dados (UI-19).** Quando o ataque rola 2 ou 1 dado, o painel de batalha diz por quê e o que resolve: poucas tropas (1 fica de guarnição), desembarque pelo mar, longe do suprimento, pântano. A ofensiva contínua para sozinha quando os dados caem, e você decide se segue.
- **Painel por seções (UI-17).** Império ganhou quatro sub-abas: Ações, Objetivo, Facções e Era e crônica. Região ganhou três: Fronteiras, Obras e Detalhes (terreno, jazidas, saúde e rendimento). Reforçar e recrutar ficam sempre acima das sub-abas.
- **Fichas de construção (UI-20, C-300).** Na sub-aba Obras, as opções vêm agrupadas pela finalidade (zonas, comida, produção, ouro, saber, estabilidade, guerra, estradas e mar, cidade, maravilhas). Cada grupo explica quando vale a pena; cada ficha mostra custo, prazo neste território, manutenção, efeito e o que ela abre na cadeia. O que já existe no território aparece listado com o efeito. O catálogo completo segue os mesmos grupos.
- **Rotas (T-19).** A tela de comércio mostra as vagas, o rendimento de cada rota ativa e um botão Fechar: fechar é grátis e libera a vaga na hora, para trocar por outra melhor. Lista até 30 rotas possíveis e explica o que cada tipo pede e rende.
- **Guerra pelo mar (D-17).** Supremacia naval: com a frota pelo menos 2 travessias acima da do defensor, o desembarque rola 3 dados mesmo sem porto. Se a frota do defensor for maior que a sua, ele ganha +1 na defesa contra o desembarque. As fronteiras por mar e a linha da frota explicam travessias e regras na dica.
- **Mapa em relevo (UI-18).** Cidades e construções deixaram o medalhão escuro: são desenhos com contorno, volume e sombra sobre o terreno, e a cidade cresce com o porte, de aldeia a metrópole.

## v49 — 26/11/2026 · Abas Império e Região, fronteiras com ações (UI-15, UI-16)

- **Diagnóstico das fronteiras.** Conferi as divisas dos 11 mapas contra a geometria: toda divisa desenhada está na lista de vizinhos. O que falhava era a influência, que recusava com uma frase genérica. No caso relatado (Uesugi no Sengoku), Aizu e Dewa é cidade-estado e os outros vizinhos custavam mais prestígio do que havia.
- **Recusa com motivo.** A influência agora diz por que não vale: sem fronteira, capital, cidade-estado (só o suserano anexa) ou prestígio insuficiente, com o custo e o saldo. O ataque também: campanha não declarada, trégua, poucas tropas, sem frota, capital protegida na 1ª rodada.
- **Painel em duas abas (UI-15).**
  - **Império:** indicadores, alertas, pesquisa, objetivo, ações do império (campanha, festas, impostos, agitadores, câmbio, rotas, obras do império), cartas, tecnologia, facções e crônica.
  - **Região:** o território selecionado. Clicar no mapa abre esta aba; Esc ou a tecla I voltam para Império.
- **Fronteiras com ações (UI-16).** A aba Região lista todos os vizinhos, por terra e por mar, com dono, tropas e relação. Cada linha traz os botões que cabem: Atacar, Influenciar (com o custo) e Mover. Botão desligado explica o motivo na dica. Num território alheio, os vizinhos seus trazem "Atacar daqui". O nome do vizinho seleciona o território.
- **Ações dentro da região.** Reforçar (+1 ou todas), recrutar e construir direto no território, com a fila logo abaixo. Recrutamento e obras abrem sozinhos; não é mais preciso "Ordenar obras" antes.
- **Mapa.** As fronteiras do território selecionado ficam marcadas com contorno pontilhado. A seleção continua ao trocar de fase.
- O clique no mapa (território seu, depois o vizinho) continua funcionando como antes.

## v48 — 26/11/2026 · Painel de facções (UI-13)

- Cada facção mostra uma barra de poder (a fatia dela nos territórios das facções), tropas, estabilidade e cartas.
- A opinião sobre você aparece como número, com os motivos na dica: comércio, fé, fronteira, tratados e agravos.
- Quem está segurando o objetivo ou passou de 75% de uma vitória ganha o aviso "⚠" em vermelho.
- Relação, opinião e botões de diplomacia ficam numa segunda linha, e o nome não espreme mais.
- A IA já usa influência e diplomacia. O contador antigo das simulações lia só as 80 últimas linhas da crônica, por isso marcava quase zero.

## v47 — 26/11/2026 · Corrida ao objetivo (V-11)

- **Antes:** no modo Curto, o objetivo era cumprido antes da rodada 20 e a partida acabava assim que a vitória liberava.
- **Agora:** os turnos seguidos do objetivo só começam a contar quando a vitória libera. Ao cumprir o objetivo, a facção é anunciada a todos e vira alvo. A IA entra em campanha e mira a capital e os alvos dela.
- O objetivo pede 60% do legado da duração (eram 50%). No modo Curto, é preciso segurá-lo por 3 turnos (eram 2).
- **Simulações no modo Curto** (6 partidas por cenário, rodada final):

  | Cenário | v45 | v47 |
  |---|---|---|
  | Sengoku | 20 a 30, quase tudo por objetivo | 22, 25, 30, 30, 31, 46 (objetivo, dominação, econômica, legado) |
  | Vikings | 23 a 28, noruegueses 5 de 6 | 23, 28, 33, 35, 36, 37 (5 vencedores diferentes) |
  | Queda do Ocidente | Ocidente 6 de 7 | 32 a 58; Ocidente 3, Oriente 3 (na bateria do `npm test`, ainda Ocidente 6 de 7) |

## v46 — 26/11/2026 · Agitação saturada e cansaço do invadido (D-15, D-16)

- **Causa encontrada:** nas Regências, o Império perdia cerca de 40 de estabilidade por rodada. Quatro rivais pagavam agitadores e usavam a carta de agitação na mesma rodada, cada um tirando 15. Além disso, cada província perdida somava 2 de cansaço de guerra.
- **Agitação saturada (D-16):** na mesma rodada, só a primeira agitação contra uma facção (ação ou carta) vale inteira; as seguintes valem 1/3.
- **Cansaço do invadido (D-15):** perder territórios soma cansaço só uma vez por rodada.
- **Regências:** o Império volta a 3 tropas por província, porque com 4 o soldo não fechava e as tropas desertavam. Os Farrapos começam com estabilidade 60 (era 75).
- **Simulações no modo Médio** (8 partidas): a Queda teve 4 vencedores diferentes, e a Secessão passou a terminar entre as rodadas 8 e 79, com mediana perto de 30. Nas Regências, o Império voltou a vencer algumas partidas (3 de 10), mas os Farrapos ainda levam a maioria. O cenário original tem 14 rodadas, e quem derrota o rival principal cedo leva o mapa.

## v45 — 26/11/2026 · Equilíbrio de três cenários e última resistência (D-14)

- **Última resistência (D-14).** A capital de quem tem até 2 territórios defende com +1. Facções de uma só província não caem mais no primeiro ataque.
- **Queda do Ocidente.** As duas Romas não começam mais em trégua, então não formam aliança automática para vencer juntas. Roma Ocidental começa com 4 tropas na capital (era 6). Hunos, visigodos, vândalos e francos ganham 2 tropas cada.
- **Regências.** O Império começa com 4 tropas por província (era 3) e estabilidade 50 (era 40). Farrapos começam com 5 tropas (eram 7). Cabanos, balaios e sabinos com 6 (eram 8, 7 e 8).
- **Secessão.** União começa com 5 tropas por estado e Confederação com 6 (eram 3 e 4).
- **Simulações no modo Médio** (6 partidas por cenário). A rodada em que cada partida acabou e quem venceu:

  | Cenário | v43 | v45 |
  |---|---|---|
  | Queda do Ocidente | Ocidente vence 6 de 7 | 46 a 96; Ocidente 4, Oriente 2 |
  | Regências | 9 a 83; Farrapos 4 de 5 | 8, 9, 11, 27, 72, 121; Farrapos 4, Império 1, Balaios 1 |
  | Secessão | 8, 8, 10, 11, 43, 104 | 17, 21, 36, 38, 43, 121 |

- **Ainda em aberto:** os Farrapos ainda vencem a maioria nas Regências, e duas partidas de Regências terminaram antes da rodada 12.

## v44 — 26/11/2026 · Quadro de informações (UI-10, UI-13)

- **Quadro do império.** Cabeçalho com líder, traço e governo. Seis indicadores em blocos: ouro líquido, saber, prestígio, estabilidade (com cansaço), felicidade (com cultura) e legado (com a meta). Cada um tem dica com a explicação.
- **Alertas em destaque:** crise, instabilidade, cansaço de guerra, povo infeliz e ouro negativo aparecem num bloco próprio, com o que acontece.
- **Pesquisa e atalhos:** linha da pesquisa atual com botão "Escolher pesquisa"; botões de tecnologias, governo, diplomacia, vitórias, personagens, obras e rotas, com o atalho de teclado na dica. Os poderes do líder ficam num bloco recolhível.
- **Cartão do território.** Dono e relação com você em destaque; seis indicadores (tropas, porte, comida líquida com o consumo, produção, ouro, saber); fichas para capital, fortificação, ocupação, suprimento, movimento e recrutas; construções inativas marcadas.
- **Ordem do painel:** império, território, fase, cartas, tecnologia, facções e crônica. A tecnologia virou um resumo com link para a árvore e as regras da era.

## v43 — 26/11/2026 · Freios da conquista: desgaste da blitz e guerra defensiva (D-12, D-13)

Segunda entrega da revisão. Nas simulações da v41, várias partidas acabavam por dominação antes da rodada 10, mesmo no modo Médio de 120 rodadas.

- **Desgaste da blitz (D-12).** Os ataques continuam ilimitados.
  - As 3 primeiras conquistas de cada turno são livres.
  - A partir da 4ª, cada conquista custa estabilidade (4, depois 8, 12…) e deixa 1 tropa para trás.
  - A barra de ação mostra quantas conquistas você já fez e o custo da próxima. A janela de batalha avisa antes do ataque.
  - A IA para de avançar quando a estabilidade cairia abaixo de 45, salvo para tomar uma capital.
- **Guerra defensiva (D-13).** Antes, a facção invadida acumulava cansaço de guerra e parava de atacar. Agora, quem perdeu território na rodada anterior contra-ataca.
- **Regras e levantamento:** os dois freios entraram em "Freios da guerra" e no levantamento (D-12, D-13).
- **Simulações no modo Médio** (4 a 6 partidas por cenário). Antes e depois, a rodada em que cada partida acabou:

  | Cenário | v41 | v43 |
  |---|---|---|
  | Napoleônicas | 18, 41, 47, 53 | 44, 53, 54, 62 |
  | Regências | 7, 9, 10, 34 | 9, 20, 23, 58, 67, 83 |
  | Queda do Ocidente | 14, 26, 71, 105 | 84, 88, 105, 111 |
  | Sengoku | 28, 60, 74, 82 | 36, 55, 56, 68 |
  | Secessão | 6, 7, 14, 94 | 8, 8, 10, 11, 43, 104 |

- **Modo Curto, todas as facções:** a Secessão passou da média de 7,5 para 16,5 rodadas.
- **Ainda em aberto:**
  - A Secessão continua decidida cedo, porque são só duas facções.
  - O Império do Ocidente vence 6 de 7 na Queda.
  - Os Farrapos vencem 4 de 5 nas Regências.
  - No modo Curto, o objetivo costuma ser cumprido assim que a vitória é liberada, na rodada 20.

## v42 — 26/11/2026 · Revisão de usabilidade: ação do turno sempre à vista

Primeira entrega da revisão completa (UI-10 e UI-13 do levantamento, mais as regras de UX do projeto). A auditoria mediu contraste, alvos de toque, transbordo em 360 px, tempo de carga e erros de console nas telas de criação, abertura e turno.

- **Barra de ação fixa.** A fase atual, o que falta fazer e o botão principal ("Ir para as ações", "Remanejar", "Encerrar turno") ficam sempre visíveis: no rodapé do painel no computador e no rodapé da tela no celular. Antes, o botão ficava abaixo da dobra.
- **Atalhos de teclado.** Enter faz a ação da fase; Esc fecha janelas; 1 a 6 trocam a lente; + − 0 controlam o zoom; T, G, D, V, P, O, C, S e R abrem os painéis. A tecla ? e o botão ⌨ mostram a lista.
- **Painéis recolhíveis.** Cartas, Tecnologia, Facções e Crônica abrem e fecham pelo título, com teclado também. No celular, Cartas, Tecnologia e Crônica começam fechados. A escolha fica salva no navegador.
- **Celular.** O mapa ocupa 58% da tela e começa aproximado na sua capital.
- **Acessibilidade (WCAG AA).**
  - Foco do teclado visível em tudo.
  - Botões com pelo menos 28 px de altura, e 40 px em telas de toque.
  - Nenhum texto abaixo de 12 px.
  - Nomes de facção com cor escura são clareados até o contraste 4,5:1, na abertura e nas batalhas.
- **Tooltips:** na estabilidade, na rodada (quando a vitória é liberada) e nas linhas das facções.
- **Medições:** a página carrega em cerca de 0,3 s, sem erros no console. A auditoria não achou nenhum texto com contraste abaixo do AA.

## v41 — 26/11/2026 · Líderes em todos os cenários (L3, L4 e L5)

Partes L3 a L5 do levantamento dos líderes. Agora todas as 112 facções têm de 2 a 3 líderes.

- **Idade Média (L3):** 90 líderes em 40 facções.
  - Vikings: Haroldo Cabelo Belo, Ragnar, Ivar, Gutrum, Rurik, Olegue, Alfredo, o Grande, Odo de Paris.
  - Mongóis: Gêngis Khan, Subutai, Yelü Chucai, Jalal al-Din, Razia Sultana.
  - Cruzadas: Ricardo, Leonor da Aquitânia, Guilherme Marshal, Barbarossa, Saladino, Averróis.
  - América pré-colombiana: Axayácatl, Tlacaelel, Nezahualcóyotl, Pachacútec, Túpac Yupanqui, Zipa Saguamanchica.
  - Sengoku: Nobunaga, Hideyoshi, Shingen, Kenshin, Motonari, Kobayakawa.
- **Séculos XIX e XX (L4):** 78 líderes em 31 facções.
  - Secessão: Lincoln, Grant, Sherman, Lee, Jackson.
  - Regências: Feijó, o futuro Caxias, Araújo Lima, Garibaldi, Negro Cosme.
  - Grande Guerra: Hindenburg, Ludendorff, Mustafa Kemal, Clemenceau, Foch, Brusilov, Putnik.
  - Segunda Guerra: Churchill, Montgomery, de Gaulle, Jukov, Roosevelt, Eisenhower, Nimitz.
  - Guerra Fria: Kennedy, McNamara, Adenauer, Kruschev, Castro, Zhou Enlai.
- **Fantasia (L5):** 20 líderes originais nos dois mundos (O Trono de Cinzas e Crônicas das Runas).
- **Mundo gerado (L5):** cada facção recebe três líderes, tirados do nome dela. A mesma facção sempre dá os mesmos líderes.
- **Equilíbrio:**
  - Takeda Shingen ficou só com o crescimento mais rápido. Em 60 partidas simuladas do Sengoku, as vitórias dos Takeda caíram de 27 para 19.
  - Shimazu e os sassânidas ficam com poderes modestos.
## v40 — 26/11/2026 · Líderes escolhidos na criação da partida (L1 e L2)

Partes L1 e L2 do levantamento dos líderes. O Conselho de papéis da v37 sai do jogo.

- **Escolha do líder.** Na criação da partida, depois da facção, aparecem os cartões dos líderes. Cada cartão traz:
  - nome e anos;
  - retrato histórico;
  - traço (Gênio Tático, Defesa Tenaz e os outros);
  - poder próprio.

  O líder vale a partida toda. A sucessão só abre a crise de sucessão; não troca mais o líder nem o traço.
- **Biblioteca de 18 poderes (LD-ED a LD-CT):**
  - bônus por construção, terreno e capital;
  - rotas comerciais e abastecimento;
  - crescimento e saber, além do ramo militar mais barato;
  - reforços e dados de ataque ou defesa;
  - travessias, estabilidade e cansaço de guerra;
  - prestígio por turno ou por conquista;
  - maravilhas, obras na fila e governo sem anarquia;
  - diplomacia, ouro e cartas.

  Os bônus de região aparecem no Rendimento da região com ⚜ e o nome do líder.
- **Guerras Napoleônicas:** 19 líderes nas 7 facções. Por exemplo, Napoleão, Talleyrand e Carnot; Pitt, Nelson e Wellington; Kutuzov e Speransky; Selim III e Mahmud II. O primeiro líder de cada facção é o de antes.
- **Antiguidade (L2):** 42 líderes nas 18 facções.
  - Guerras Púnicas: Cipião, Fábio Máximo e Marcelo; Aníbal, Asdrúbal e Hanão.
  - Crise do século III: Galieno, Aureliano e Cláudio II; Zenóbia e Odenato.
  - Queda do Ocidente: Estilicão, Honório e Gala Placídia; Teodósio II, Antêmio e Pulquéria; Rugila e Átila; Alarico, Genserico.

  Os sassânidas, que já venciam muito, ficam com poderes modestos.
- **Outros cenários:** continuam com o líder de sempre até as partes L3 a L5.
- **Líderes rivais:** históricos (o primeiro da lista) ou sorteados, à escolha na criação.
- **Painel e Personagens:** mostram o poder do líder.
- **Regras:** novo parágrafo "Líderes".
- **Salvamento:** guarda o líder de cada facção. Salvamentos antigos carregam com o primeiro líder.
## v39 — 26/11/2026 · Revisão da interface

Parte v30 do plano de aprimoramento (revisão de interface).

- **Celular:**
  - o mapa ocupa a largura da tela, sem a faixa vazia embaixo;
  - as lentes ficam numa linha só, que rola de lado;
  - a legenda, os botões do topo e o título ficam menores.
- **Guia da primeira partida, terceira etapa:**
  - lentes e legenda;
  - Rendimento da região e Resumo do império;
  - Árvore de tecnologias;
  - Abastecimento.

  Os passos de qualquer etapa agora contam quando você clica no botão certo.
- **Regras:**
  - parágrafo novo "Regiões", sobre rendimento, os 8 portes, moradia, empregos e abastecimento;
  - a árvore explica a revelação gradual;
  - "No mapa" descreve os 8 portes e as construções desenhadas.
## v38 — 26/11/2026 · Árvore mais funda: 20 tecnologias novas

Parte v28 do plano de aprimoramento (pesquisa por passos), segunda etapa.

- **20 tecnologias novas (KN-01 a KN-20)** nas eras que tinham menos:
  - Idade Média: de 11 para 16;
  - Idade Moderna: de 9 para 14;
  - Era Atômica: de 8 para 11;
  - Era da Informação: de 8 para 11;
  - futuro próximo: de 3 para 7.
- **Cada uma melhora uma construção que já existe:**
  - Idade Média: Rotação de culturas (+1 comida por fazenda), Heráldica (+1 prestígio por castelo), Cartografia (+1 ouro por porto), Herbalismo (+1 comida por hospital), Rodas d'água (+1 produção por moinho).
  - Idade Moderna: Anatomia, Contabilidade, Nova agricultura, Urbanismo e Hidrografia.
  - Era Atômica: Logística moderna, Administração pública e Medicina preventiva.
  - Era da Informação: Robótica, Genômica e Finanças digitais.
  - Futuro próximo: Computação quântica, Nanotecnologia, Agricultura vertical e Cidades inteligentes.
- **Livro-razão:** o bônus aparece em cada região, com o nome da tecnologia.
- **Árvore:** as tecnologias novas entram na revelação gradual da v36, ligadas às existentes por pré-requisitos.
## v37 — 25/11/2026 · Conselho de papéis

Parte v29 do plano de aprimoramento. O levantamento está no documento "Soberania: levantamento do Conselho de papéis".

- **Opção ao criar a partida:** "Conselho de papéis", desligada por padrão.
- **A rodada:** com o Conselho ligado, cada rodada começa com as facções escolhendo um papel.
  - A ordem vai do maior prestígio ao menor. O desempate é pelo legado.
  - Cada papel só pode ser escolhido uma vez por rodada. Quem escolhe depois vê o que já foi tomado, mas não por quem.
- **Os 8 papéis**, que valem só naquela rodada:

  | Papel | Efeito |
  | --- | --- |
  | ⚔ General | +3 tropas de reforço |
  | 💰 Mercador | +3 ouro e +2 por rota comercial ativa |
  | 🏗 Arquiteto | +2 ⚒ em cada região com obra na fila |
  | 📜 Erudito | +50% de saber |
  | 🕊 Diplomata | +4 prestígio e +10 de relação com todos |
  | 🗝 Espião | anula o papel da facção que ele mirou e ganha uma carta |
  | 🕯 Sacerdote | +10 de estabilidade |
  | 🧺 Coletor | +1 ouro por região povoada |

- **Painel e registro:** o painel mostra o seu papel da rodada. O registro mostra o conselho inteiro e as anulações do Espião.
- **IA:** escolhe pelo que precisa.
  - Guerra ou ameaça pesam para o General.
  - Estabilidade baixa pesa para o Sacerdote.
  - Uma pesquisa quase pronta pesa para o Erudito.
  - Um rival à frente no legado pesa para o Espião.
- **Correção:** o meio-porte (v25) não era salvo. Agora é.
- Teste novo: papéis únicos por rodada e o efeito do Coletor. Simulação com o Conselho ligado em três cenários, sem erros.
## v36 — 25/11/2026 · Árvore de tecnologias revelada aos poucos

Parte v28 do plano de aprimoramento (pesquisa por passos), primeira etapa.

- **Revelação gradual:** a árvore mostra inteiro só o que você já sabe e o que pode pesquisar agora.
  - O passo seguinte aparece como silhueta tracejada: "❔ Por descobrir", com o custo e a tecnologia que falta.
  - O resto fica oculto. Cada era diz quantas tecnologias ainda estão escondidas.
- **Progresso à vista:** cada tecnologia que dá para pesquisar mostra quanto o saber acumulado já cobre e quantos turnos faltam.
- **Trocar de pesquisa não perde nada:** o saber fica guardado e vai para a próxima escolha. O painel agora diz isso.
- Teste novo: a árvore esconde o que está longe e as silhuetas não podem ser pesquisadas.
## v35 — 25/11/2026 · Rotas de abastecimento entre regiões

Parte v27 do plano de aprimoramento: rotas entre regiões.

- **Abastecimento:** uma região sua manda a sobra de 🍞 comida ou ⚒ produção para outra região sua.
  - Leva até 2 por turno, ou 3 com estrada nas duas pontas.
  - Só sai a sobra: comida acima do consumo da população, ou produção da região de origem. Quem recebe não repassa o que recebeu, então não há cadeias nem ciclos.
  - A comida entra no crescimento da região de destino. A produção entra na fila de obras dela.
- **Caminho:** por terra, até 6 passos por regiões suas não ocupadas, ou por mar, com porto nas duas pontas.
- **Corte:** se um inimigo ocupa a origem, o destino ou o caminho, a rota fica cortada até a ocupação acabar. No mapa, o arco fica vermelho.
- **Custo e limite:** abrir custa o mesmo ouro de uma rota comercial. O limite é 1 rota, mais 1 a cada 4 regiões, e não conta no limite de comércio.
- **Painel da região:** a nova seção "Abastecimento" abre e fecha as rotas. Mostra o que entra e o que sai, e o livro-razão lista cada rota com a sua causa.
- **No mapa:** arcos amarelos para comida e laranja para produção.
- **IA:** socorre com comida uma região sua que passa fome.
## v34 — 25/11/2026 · Legenda nas lentes do mapa

- As lentes **Terreno, Zonas, Recursos e Rede** ganham uma legenda no canto inferior esquerdo do mapa:
  - Terreno mostra só os tipos que aparecem no mapa, com ícone e cor.
  - Zonas mostra as zonas já construídas. Sem nenhuma, explica que fazendas, minas e mercados criam zonas.
  - Recursos separa luxo, jazidas comuns e territórios sem jazidas.
  - Rede separa núcleo, ligado, seu fora da rede e outros.
- A legenda some nas lentes Dono e Relevo.
- Teste novo cobre a legenda. O teste da lente de relevo aceita o relevo real (o Brasil agora tem relevo).
## v33 — 25/11/2026 · Mundo, EUA e Brasil com divisas reais e relevo

Com esta versão, os dez mapas históricos têm divisas reais e relevo. Agora entram o mapa-múndi (Segunda Guerra Mundial e outros cenários globais), os EUA de 1861 e o Brasil regencial.

- **Divisas reais** (Natural Earth admin-1 1:10m), tiradas das divisões atuais:
  - no mundo, a Sibéria, os Urais e o Extremo Oriente seguem os oblasts russos;
  - nos EUA, cada território segue a lista dos seus estados;
  - no Brasil, cada território segue as siglas das suas províncias.
- **Projeções reais:** Albers nos EUA, Mercator no Brasil e Natural Earth no mundo. É a mesma projeção do relevo, por isso serras e divisas se alinham.
- **Relevo real**, com estradas que contornam serras:
  - as Rochosas e os Apalaches;
  - a Serra do Mar e o Planalto Central;
  - os Andes, o Himalaia e o Tibete.
- **Desertos por caixas de longitude e latitude**, e não mais por faixa de latitude:
  - o Saara, a Arábia, o Irã e o Thar ficam cor de areia;
  - o interior da Austrália também;
  - a Índia, a China e o Mediterrâneo continuam verdes.
- `maps/real.mjs` aceita partes por lista de estados de um país e ganhou mais apelidos de países (RD Congo, Costa do Marfim, Timor-Leste e outros).
- Vizinhanças recalculadas; as travessias por mar foram mantidas.
## v32 — 25/11/2026 · Mediterrâneo, Nórdico e Américas com divisas reais e relevo

A reforma visual chega a mais três mapas: o Mediterrâneo (Guerras Púnicas, Crise do séc. III, Queda de Roma e Cruzadas), o Nórdico (Era Viking) e as Américas antes de Colombo.

- **Divisas reais** (Natural Earth admin-1 1:10m) em todos os três, com o mesmo método da Europa. Exemplos:
  - a Caledônia segue os condados da Escócia;
  - Gália e Hispânia seguem as regiões atuais;
  - os Andes, a Amazônia e o Cerrado seguem estados e departamentos.
- **Relevo real**, com estradas que contornam serras:
  - na Europa, os Alpes escandinavos, a Islândia e os Pireneus;
  - no Oriente, o Atlas, o Tauro e o Zagros;
  - na América do Sul, os Andes, com os picos nevados.
  - No Mediterrâneo, o Saara e a Arábia ficam cor de areia.
- **Correções do `maps/real.mjs`:**
  - Uma divisão entra no mapa pela posição dela no desenho, e não por um quadro lon/lat fixo. Assim a Caledônia e a Dinamarca, ao norte do quadro antigo, entram.
  - Divisões de um país que nenhuma caixa pegava (Rondônia, entre duas caixas) passam ao território do mesmo país mais próximo, até 1,5° de distância. Antes ficavam como buracos.
  - A terra de fundo usa só o que aparece na tela.
  - As definições de território desses mapas ficam em `maps/defs-real.mjs`, copiadas do `maps-build.mjs`.
- Vizinhanças recalculadas; as travessias por mar foram mantidas.
- O arquivo do jogo vai a cerca de 3 MB.
## v31 — 25/11/2026 · Europa com divisas reais e relevo de verdade

A reforma visual feita no Japão chega aos dois mapas da Europa: o de 1805 (cenário napoleônico) e o de 1914 (Grande Guerra).

- **Divisas reais.** Os territórios eram recortes retos de países por caixas de latitude e longitude. Agora são somas de divisões administrativas reais (departamentos, regiões, províncias; Natural Earth admin-1 1:10m, domínio público).
  - A divisão entra no território quando o seu centro cai no país e na caixa da definição antiga. Por isso as divisas internas (França Norte e Sul, as três Alemanhas, as Rússias, Itália, Turquia) seguem limites de verdade, em vez de linhas retas.
  - Ilhas distantes (Canárias, Açores, Svalbard) ficam de fora pelo quadro do mapa.
  - A terra fora do jogo (Rússia além dos Urais, Saara, Oriente Médio) também é desenhada com as divisões reais.
  - Novo script: `maps/real.mjs` (genérico; os próximos mapas entram por configuração).
- **Simplificação que respeita a topologia.** Os pontos são encaixados numa grade e simplificados por Douglas-Peucker, mas só entre as pontas de cada divisa. Assim os dois vizinhos simplificam a divisa do mesmo jeito e não sobram frestas. Cada mapa ficou com cerca de 160 KB.
- **Relevo real** (AWS Terrain Tiles), com estradas que contornam serras, nos dois mapas: Alpes, Pireneus, Cárpatos, Cáucaso, Atlas e os planaltos da Anatólia e do Irã.
- **Cinturão desértico.** Na visão Relevo, a terra baixa ao sul de 34°N puxa para a cor de areia (Saara e Arábia), em vez de verde. A transição é gradual e as montanhas mantêm as próprias cores.
- As vizinhanças foram recalculadas pelas divisas reais; as travessias por mar foram mantidas.
- O arquivo do jogo passa de 1,5 MB para 2,4 MB por causa dos desenhos e do relevo.
## v30 — 25/11/2026 · Japão sem faixas cinzas nem frestas

Correções que o Flavio apontou no mapa do Japão.

- **Faixas cinzas na costa:** a terra de fundo ("terra fora do jogo") ainda trazia o Japão no traçado antigo, mais grosseiro. Ela aparecia como faixas e manchas cinzas onde a costa velha passava da nova. Agora o fundo traz só os outros países.
- **Frestas entre províncias:** os dois lados das divisas cortadas (Owari/Mikawa e Tōtōmi/Suruga) recebiam linhas sinuosas sorteadas de forma diferente, e sobrava um corte entre eles. Agora os dois lados usam a mesma linha.
- **Simplificação do desenho:** agora os pontos são encaixados numa grade fina, então vizinhos que dividem uma divisa caem exatamente nos mesmos pontos.
- O relevo e o traçado das estradas foram recalculados sobre o desenho corrigido.
## v29 — 25/11/2026 · Construções desenhadas no mapa

Terceira etapa da reforma visual. O Flavio pediu que as construções deixassem de ser emojis listados lado a lado e quase sobrepostos, e que tivessem imagens condizentes.

- Cada território mostra as suas construções como pequenos desenhos em medalhões, distribuídos em volta do emblema e acima do nome.
  - São 16 desenhos: fazenda, pasto, pesca, floresta, mina, indústria, mercado, porto, templo, obras públicas, saber, exército, defesa, espetáculos, aviação e maravilha. A maravilha leva um medalhão dourado.
  - Todas as construções do jogo, de todas as eras, caem em uma dessas classes.
  - Construções da mesma classe viram um medalhão só, com o número ao lado.
  - Passar o mouse mostra a classe e a quantidade.
- A povoação também tem desenho, conforme o nível: aldeia (uma casa), vila (duas casas), cidade (casas e torre) e metrópole (prédios).
- Os medalhões crescem com o zoom (até 2,4 vezes) e somem na visão geral, quando os nomes somem, para não poluir o mapa.
- As visões Terreno, Zonas e Recursos continuam com os ícones próprios de cada uma.
- Novo teste: a capital tem o desenho da povoação, e toda construção tem desenho.
## v28 — 25/11/2026 · Estradas com traçado de verdade

Segunda etapa da reforma visual do mapa, a pedido do Flavio: estradas que não sejam retas e que contornem montanhas.

- No Japão, cada estrada entre dois vizinhos segue o caminho mais barato sobre a elevação real, por dentro dos dois territórios. Ela foge das encostas íngremes e dos picos e prefere vales, passos de montanha e a costa. O traçado é calculado uma vez pelo `maps/relevo.js` (novo arquivo `maps/relevo/japao-r.json`) e embutido pelo `build.js`.
- Nos mapas que ainda não têm relevo real, a estrada vira uma curva suave que cruza a divisa no ponto mais próximo da reta entre os centros.
- Cada tipo de estrada tem seu desenho, com contorno escuro por baixo:
  - trilha (estrada de terra) tracejada;
  - estrada pavimentada clara;
  - ferrovia com dormentes;
  - autoestrada larga e laranja.
- A largura das linhas não muda com o zoom.
- As rotas de comércio são desenhadas em arco, em vez de linha reta.
- Novo teste: as estradas saem com traçado curvo, e o Japão tem os traçados calculados.
## v27 — 25/11/2026 · Japão com divisas reais e relevo de verdade

Atende ao retorno do Flavio sobre as divisas ruins e o relevo "infantil". É a primeira etapa da reforma visual do mapa.

- Divisas reais no mapa do Japão. Antes as províncias eram recortes retos de caixas de latitude e longitude, o que gerava losangos como Bizen e Mimasaka. Agora cada território é a soma de províncias atuais do Japão (Natural Earth, 1:10 milhões, domínio público), agrupadas nas províncias do período Sengoku. Onde a divisa antiga corta uma província atual (Owari e Mikawa em Aichi; Tōtōmi e Suruga em Shizuoka), o corte segue a linha histórica aproximada, com traçado sinuoso. A costa ganhou o detalhe de 1:10 milhões. As vizinhanças foram recalculadas pelas divisas reais. Novo script: `maps/japao-real.mjs`.
- Relevo real: elevação de verdade (AWS Terrain Tiles, dados abertos), cerca de 1,2 km por pixel.
  - Em todas as visões, um sombreado de montanhas e vales fica sobre as cores dos donos.
  - Na visão Relevo, o terreno aparece colorido por altitude: planícies verdes, serras marrons e picos claros. Os impérios aparecem só pela faixa da fronteira.
  - Novo script: `maps/relevo.js`. As imagens ficam em `maps/relevo/` e o `build.js` as embute no arquivo do jogo.
- Terra neutra ficou mais clara quando há relevo, para o sombreado aparecer.
- Por enquanto só o Japão tem divisas reais e relevo real; os outros mapas vêm nas próximas versões. A v26 (visão Relevo simples) não chegou a ser publicada.
## v26 — 25/11/2026 · Visão de relevo e relevo que pesa

Quarta parte do plano de aprimoramento. A visão de relevo fica num botão, como o Flavio escolheu; o mapa político continua sendo o padrão.

- Nova visão Relevo (botão ao lado de Dono): cada território é desenhado com o seu terreno, com marcas próprias: montanhas, colinas, árvores, selva, dunas, estepe, tundra e alagado. Os impérios aparecem só por uma faixa da cor do dono por dentro da fronteira, sobre as linhas de divisa da v22.
- O relevo pesa mais:
  - Moradia: planície fértil +1; montanha, deserto, tundra e pântano −1.
  - Obras em montanha e pântano custam 25% a mais. As estradas continuam com o custo próprio de antes.
- A defesa por relevo continua como antes. Regras atualizadas e teste novo para a visão de relevo.
## v25 — 25/11/2026 · Oito portes, moradia e empregos

Terceira parte do plano de aprimoramento: mais níveis de cidade, cada um com ganhos e custos, e crescimento que depende de comida, moradia e empregos.

- 8 portes: aldeia, povoado, vila, vila grande, cidade, cidade grande, metrópole e megalópole. O território cresce um porte por vez, com metade do estoque de comida de antes por passo; o ritmo total até a metrópole é o mesmo. Os portes "grandes" dão +1 produção e +1 ouro (megalópole também +1 saber) e consomem 1 comida a mais.
- Moradia: quantos portes o território comporta. Base 3, +1 com rio, litoral ou capital, +2 com aqueduto, +2 com saneamento, +1 com hospital ou celeiro. Substitui a antiga exigência de aqueduto e saneamento para subir de nível; na prática, as mesmas obras continuam abrindo caminho para cidade e metrópole.
- Empregos: o nível dá alguns, cada zona dá 2 e cada obra que rende dá 1. Desempregados custam 1 ouro cada por turno e impedem o crescimento.
- Com fome, o território perde só um porte, não um nível inteiro.
- Painel da região: porte atual (de 8), o que falta para crescer e a conta de moradia e de empregos com as causas. O marcador do mapa mostra o meio passo com um ponto meio aceso.
- Regras atualizadas (o "+1 ação a cada 3 cidades" saiu, porque não há mais pontos de ação).
- Equilíbrio (partidas simuladas, curtas): Sengoku termina em média na rodada 24,1, e o modo Civilização na 52,4.
## v24 — 25/11/2026 · Turno sem limite de ações

Segunda parte do plano de aprimoramento. Atende ao pedido do Flavio de tirar o limite de ações por turno, no estilo dos jogos de império por turnos, com ataques ilimitados enquanto houver tropas (escolha dele no cartão de decisão).

- Acabaram os pontos de ação. Quem limita o turno agora é o ouro, as tropas e o prestígio.
- Ataques sem teto: acabou o limite de conquistas por turno. A campanha continua sendo declarada no turno, não custa nada e soma cansaço de guerra a cada turno em que fica ativa.
- Recrutar, ordenar obras e câmbio continuam com seus botões, agora sem custo.
- Algumas ações seguem valendo 1 vez por turno para não virarem repetição infinita: festividades e impostos extraordinários; agitadores contra cada facção; espião em cada território; enviado a cada cidade-estado.
- Regras, guia da primeira partida e textos dos botões atualizados.
- Equilíbrio (partidas simuladas, curtas): Sengoku termina em média na rodada 25,5 (antes 29,9). Ainda vencem com mais frequência Shimazu, Takeda e Uesugi. Napoleônico: rodada 25,9, vencedores variados. Crise do séc. III: rodada 51,6.
## v23 — 25/11/2026 · Região que mostra o que produz, resumo do império e cores distintas

Primeira parte do plano de aprimoramento (v23 a v30) pedido pelo Flavio: o império como soma das regiões.

- Painel da região com livro-razão: comida, produção, ouro, saber e prestígio, cada um com o líquido e a lista de causas: relevo, rio, litoral, capital, porte, cada obra (e as tecnologias, políticas e governo que a reforçam), jazidas exploradas, crença, rotas internas e maravilhas. As perdas aparecem em vermelho: consumo da população, corrupção pela distância da capital, estabilidade baixa e ocupação. Também diz quanto falta de comida para crescer e o que impede o crescimento.
- Resumo do império (botão no painel da região): tabela com o líquido de cada região, a soma, os ajustes que valem para o império todo (governo, felicidade, rotas, maravilhas, dificuldade) e o que entra por turno. Clicar numa região leva até ela no mapa.
- Cores das facções: nova paleta de 12 cores bem distantes entre si. Cada facção fica com a cor da paleta mais próxima da sua cor original. Antes havia 35 pares de facções com cores parecidas, como Oda e Ōtomo no Sengoku ou Aiúbidas e Almóadas nas Cruzadas; agora não há nenhum.
- Os rendimentos não mudaram: o cálculo é o mesmo, agora com o registro de cada causa (teste novo confere a soma).
## v22 — 25/11/2026 · Fronteiras desenhadas a partir das divisas reais

Atende ao retorno do Flavio sobre marcações sem nome e vizinhos que não contavam como fronteira (imagem do Sengoku).

- Marcações sem nome: eram partes de territórios desenhados em vários pedaços (Shinano, Goiás, Mato Grosso, Alto Amazonas e outros). As linhas entre os pedaços de um mesmo território sumiram; agora cada território aparece como uma peça só.
- Fronteiras calculadas: o mapa descobre de que lado de cada trecho de contorno está cada vizinho e desenha três tipos de linha. Costa em traço firme, divisa entre territórios do mesmo dono em pontilhado discreto e divisa entre impérios em traço forte com halo claro, para enxergar a extensão de cada império de longe.
- Vizinhanças que o desenho mostrava e a lista não tinha: Hyuga e Higo, Mino e Mikawa e Tōtōmi, Kai e Sagami e Musashi, Shinano e Echigo (Japão) e Germânia Ocidental e Marcomânia (Mediterrâneo). Nova varredura de todos os mapas: nenhuma divisa desenhada sem ligação.
## v21 — 25/11/2026 · Mapa mais claro: travessias, fronteiras e porte dos territórios

Atende ao retorno do Flavio sobre ligações entre vizinhos, demarcações e o tamanho dos territórios.

- Varredura de todos os mapas (16 cenários e o modo Civilização em quatro tamanhos): as vizinhanças por terra batem com o desenho. Os casos restantes são frestas de 2 a 7 unidades entre territórios que de fato fazem fronteira (Maranhão e Bahia, Mino e Echizen, entre outros), e a ligação foi mantida.
- Travessias por mar agora vão de costa a costa, do ponto de litoral mais próximo de cada lado. Antes a linha ia de centro a centro e cruzava terra (por exemplo, Grão-Pará até a Corte atravessando o Brasil), parecendo uma fronteira errada. Quando nem a linha de costa a costa escapa da terra, só os dois portos aparecem.
- Cada travessia tem dica ao passar o mouse ("Travessia por mar: A e B"). Conserto: a névoa de guerra escondia a travessia errada quando o mapa tinha ligação pela borda.
- Terra fora do jogo agora é hachurada e identificada, para não parecer um território sem demarcação.
- Porte do território no marcador: quatro pontos acima do número de tropas (1 aldeia, 2 vila, 3 cidade, 4 metrópole). A dica do território mostra nome, porte e tropas. Ermo vazio não mostra pontos.
- Nomes de territórios também não cobrem mais os marcadores vizinhos.
- Regras: novo parágrafo "No mapa" explica número, pontos, travessias e terra hachurada.

## v20 — 25/11/2026 · Guia da primeira partida e exportação no link online

Continuação das pendências da revisão (UI-12 completo).

- UI-12: guia em camadas no painel lateral. A etapa 1 acompanha o turno básico (reforços, campanha, ataque, obra, pesquisa, fim do turno); a etapa 2 apresenta comércio, diplomacia, governo e vitórias. Cada passo se marca sozinho quando você o faz, e o guia pode ser ocultado. O progresso fica guardado no navegador.
- Mapa: os nomes de territórios que se sobreporiam são escondidos, mostrando primeiro os seus e as capitais. Ao aproximar, os demais aparecem.
- Exportar arquivo agora funciona dentro do link online (pede confirmação antes de salvar). Fora dele, continua baixando direto.

## v19 — 25/11/2026 · Revisão geral de usabilidade

Revisão depois do roteiro completo, olhando o jogo no computador e no celular.

- Capitais não podem ser atacadas na primeira rodada. Antes, um povo podia ser eliminado antes de jogar a primeira vez.
- Reforços: o botão travado agora diz quantas tropas faltam posicionar ("Posicione 3 tropas para seguir").
- Reforços: bônus negativos aparecem como "-1", não mais "+-1".
- Sem pesquisa escolhida, o painel traz um botão "Escolher pesquisa" que abre a árvore.
- Celular: barra do topo mais compacta, abas da tela inicial quebram linha em vez de sair da tela, lentes do mapa não encostam no zoom.
- Fim de partida: o gráfico de pontos diz o intervalo de rodadas e que as cores são as da tabela.
- O texto do modo Civilização fala do futuro próximo (era 8), não mais da Era da Informação.

## v18 — 25/11/2026 · Acabamento (parte 15 do roteiro)

**Parte 15** (UI-09 a UI-12, UI-14, E-35, crises de era, S-23, T-21, K-120 a K-122)

- UI-11: o painel de batalha mostra a chance de vencer atacando até o fim, com os mesmos bônus de dado do combate.
- UI-09: o painel lateral traz as notícias desde o seu último turno (eventos do mundo e o que aconteceu com você).
- UI-14: no fim da partida, gráfico de pontos de cada facção ao longo das rodadas e linha do tempo dos marcos (eras, maravilhas, revoltas, capitais perdidas, vitórias à vista).
- UI-12: na primeira vez que você abre comércio, diplomacia, governo, personagens, vitórias, catálogo ou tecnologias, uma dica curta explica o sistema.
- UI-10: a dica do ouro separa a renda das rotas.
- T-21 (modo Civilização): mercado mundial na tela de comércio. Compre o acesso a um bem por 5 turnos; o preço sobe quando poucos produzem.
- S-23 (modo Civilização): classes sociais. Muitos eruditos sem universidade, mercadores sem rota, artesãos sem luxo ou camponeses sem templo custam felicidade. A dica da felicidade mostra as classes.
- Crises de era (modo Civilização): a cada virada de era, 10 rodadas de queda de impérios, invasões em ondas ou, da era industrial em diante, crise do petróleo.
- E-35: o acidente nuclear deixa o território inutilizável por 20 turnos.
- Era 8, Futuro próximo (K-120 a K-122): inteligência artificial (+20% de saber), fusão (usina de fusão) e colonização espacial, que agora é a tecnologia da colônia espacial.
- Fora desta versão: UI-12 em camadas por cenário (a dica de primeira vez cobre o essencial) e UI-13 em gaveta (o painel já se ajusta ao celular).

## v17 — 25/11/2026 · Modo Civilização (parte 14 do roteiro)

**Parte 14** (MC-01 a MC-08, MC-10 a MC-16, MC-20 a MC-24, S-26, F-17, E-01 a E-07, IA-09, IA-10)

- Nova aba **Civilização** na tela inicial. O mundo é gerado na hora:
  - MC-01: tamanho pequeno (40 territórios, 4 povos), médio (70, 6), grande (110, 8) ou enorme (160, 10).
  - MC-02: continentes, pangeia, arquipélago ou mar interior.
  - MC-03: territórios em polígonos de Voronoi, agrupados em regiões de 4 a 8.
  - MC-04 e MC-05: clima pela latitude (tundra nos polos, selva no equador, desertos nas faixas secas), serras por relevo e rios que descem delas.
  - MC-06: jazidas por terreno, e cada capital tem por perto terra boa, um estratégico e um luxo.
  - MC-07: maravilhas naturais (+2 ouro e +1 prestígio a quem as tiver).
  - MC-08: semente. O mesmo código gera o mesmo mundo, e o jogo salvo refaz o mundo pela semente.
- MC-10 a MC-13 e S-26: cada povo começa com uma vila e tropas; o resto é ermo. Funde aldeias (gasta 1 nível de uma vila vizinha) ou erga postos avançados (só ouro), com custo que sobe a cada fundação.
- MC-11: névoa de guerra. Você só vê o que é seu e o que faz fronteira com você; satélites revelam tudo.
- MC-14 e MC-15: tribos atacam os vizinhos e dão ouro quando dispersadas, e com o tempo algumas viram cidades-estado. Ruínas dão tesouro, tecnologia, tropas ou mapas a quem chega primeiro.
- MC-16: povos gerados com nome, cor, líder e uma cultura inicial (agrícola, marítima, nômade ou montanhesa) que dá uma habilidade.
- MC-21 e MC-22: calendário de 3000 a.C. até hoje, mais rápido no começo; dá para começar na Idade Média ou na Idade Moderna.
- E-01 a E-07: o mundo muda de era (nomes das cartas, aviação) quando alguém chega à tecnologia da era seguinte.
- F-17: grande explorador, que nasce das ruínas e revela o mapa.
- IA-09: cada líder tem uma agenda (admira maravilhas, teme exércitos grandes, aprecia a paz, respeita a ciência), que aparece no motivo da relação.
- A IA funda aldeias e corre atrás de ruínas, jazidas e maravilhas naturais. O modo entra no teste automático de partidas IA contra IA (IA-10).
- Fora desta versão: IA-01 a IA-05, IA-08 e IA-11 (a IA atual já cobre o básico); MC-25 (o jogo já roda todo no navegador); a era 8 fica para a parte 15.
- Consertos: soltar o dedo ou o mouse fora do mapa deixava o toque seguinte travado; o teste de interface clica no centro do território.

## v16 — 25/11/2026 · Vitórias completas (parte 13 do roteiro)

**Parte 13** (V-01 a V-08, V-10, aviso de ameaça)

- V-01, V-02 e V-08 continuam: dominação, objetivo do cenário e legado.
- V-03 **Ciência**: depois do Programa Espacial, três projetos em sequência no mesmo território: lançamento de satélite, pouso tripulado e colônia espacial. Quem toma o território leva o projeto.
- V-04 **Cultura**: o turismo (um quarto da cultura, maravilhas, museus, polos turísticos, parques e jogos mundiais) se acumula e precisa passar do dobro da cultura acumulada de cada rival, com mínimo de 250.
- V-05 **Diplomacia**: 20 pontos de favor no Congresso Mundial. Vale 1 por voto do lado vencedor, 2 por sediar os jogos e 1 por cidade-estado protegida a cada sessão.
- V-06 **Economia**: metade do ouro do mundo (reservas, e cada filial vale 5), com mínimo de 120, por 10 turnos; ou 4 monopólios de luxo.
- V-07 **Fé**: sua fé é a maioria dos territórios de todas as facções vivas e segue 70% dos territórios do mundo.
- V-10 **Ecológica**: o mundo fica 20 turnos com pouca poluição enquanto você lidera as energias limpas (parques solares, hidrelétricas e reservas, no mínimo 2).
- As vitórias novas só valem da metade da partida em diante.
- **Aviso de ameaça**: quem passa de 75% de uma vitória gera um alerta para todos, e as outras facções gostam menos dela (−20 de relação).
- Painel **Vitórias** com o seu progresso e o do líder em cada uma. O cenário pode escolher quais vitórias ficam ligadas.
- Conserto: o jogo salvo agora guarda todos os dados da facção (governo, cívicas, cultura, fé, personagens, vitórias). Antes, parte deles se perdia ao carregar.

## v15 — 25/11/2026 · Eras industrial a informação (parte 12 do roteiro)

**Parte 12** (K-60 a K-117, C-13, C-14, C-27 a C-30, C-45 a C-53, C-66, C-74 a C-76, C-86 a C-89, C-95, C-96, C-107 a C-114, C-123 a C-125, C-128, C-129, C-210 a C-215, A-08 a A-12, A-25 a A-29, L-06, L-09, L-10, T-04 a T-07, T-19 a T-22, S-15, G-09 a G-11, DP-40 a DP-42)

- K-60 a K-117: **38 tecnologias novas** em quatro eras (Revolução Industrial, Era Moderna, Era Atômica e Era da Informação), cada uma com seu grupo no painel de tecnologias. Os cenários da Grande Guerra, da Segunda Guerra e da Guerra Fria começam sabendo as eras anteriores à sua.
- **Bens manufaturados**: aço, máquinas, químicos, combustível, tecidos, energia, eletrônicos, bens de consumo e borracha saem de construções, não de jazidas, e entram na rede como qualquer bem. As cadeias são reais: a siderúrgica pede ferro e carvão, a metalúrgica pede aço e energia, a montadora pede máquinas, borracha e combustível.
- Z-12 a Z-17: zonas cultural, industrial, energética, turística, tecnológica e aeroespacial.
- **Construções novas**: aquicultura, agroindústria, seringal, reserva florestal, mina profunda, poço de petróleo, plataforma marítima e salina; tecelagem, siderúrgica, metalúrgica (+25% de produção), indústria química, refinaria, montadora, fábrica de bens de consumo, farmacêutica e fábrica de chips; shopping, escola pública, laboratório, centro de pesquisa, museu, rádio e TV, estádio, parque nacional, polícia e bairro residencial; base aérea, antiaéreo e silo de mísseis; termelétricas, hidrelétrica, usina nuclear e parque solar; ferrovia, rodovia, trem de alta velocidade, canal e aeroporto.
- C-210 a C-215: Grande Canal Marítimo, Exposição Universal (tecnologias industriais 20% mais baratas), Estátua Monumental, Sede das Nações (+2 votos), Programa Espacial e Rede Mundial de Dados (+10% de saber e ouro).
- C-123 a C-125 e L-06: pela ferrovia as tropas andam até 4 territórios, pelo trem de alta velocidade até 6; entre aeroportos seus há ponte aérea.
- A-08 a A-12 e A-25 a A-29: infantaria de linha (anula a cavalaria), motorizada (anda 1 a mais), blindados (+2 fora de terreno fechado), mecanizada (+2 no ataque e na defesa), forças especiais (ignoram as defesas construídas), encouraçados, submarinos, porta-aviões e mísseis. K-89: com trincheiras, quem fica parado ganha +2.
- L-09 e L-10: exército de 6+ em terra ocupada come da capital e, sem comida, perde tropa; frota inimiga maior ao lado corta suas rotas marítimas.
- T-04 a T-07: rota oceânica (+5 ouro), oleoduto, rota aérea de carga (não sofre bloqueio) e rede digital entre capitais (+2 saber de cada lado).
- T-19 a T-22: política de tarifas, monopólio de luxo (60% do mundo: +2 felicidade e +1 ouro por rota) e filiais de corporações pela bolsa de valores (+2 ouro cada).
- S-15 e E-25: **poluição** de indústrias e termelétricas tira saúde; reservas e renováveis limpam. Com muita poluição no mundo, o mar sobe e vêm secas.
- G-09 a G-11: regime de partido único, planejamento central e tecnocracia corporativa, com as cívicas Nacionalismo, Ideologias de massa e Globalização.
- DP-40 a DP-42: o **Congresso Mundial** nasce quando metade do mundo conhece a diplomacia moderna. A cada 15 rodadas vota duas resoluções (embargo ao líder, proibir mísseis, jogos mundiais, ajuda ao mais fraco, limite de poluição); você vota no painel de diplomacia.
- Usina nuclear tem pequeno risco de acidente. Armas nucleares ficam fora do jogo.
- A IA abre filiais e lança mísseis.
- Conserto: um comentário da parte 11 apagava sem querer o bônus de ouro da república e o ajuste de saber dos governos.
- Desempenho: tecnologias e tropas de cada facção ficam guardadas por turno, para a IA não recalcular tudo a cada obra que avalia.

## v14 — 25/11/2026 · Personagens e eventos (parte 11 do roteiro)

**Parte 11** (F-01 a F-03, F-10 a F-16, F-30 a F-38, E-10 a E-13, E-20 a E-34)

- F-01 e F-02: cada facção tem um **líder** com nome e o traço da facção. Nas monarquias, a sucessão vem a cada 25 a 40 turnos; nas repúblicas, há eleição a cada 20. O novo líder sorteia um traço. E-28: sucessão com estabilidade abaixo de 30 abre uma crise, e um quarto dos territórios apoia um pretendente rebelde.
- F-03: **governadores** (intendente: obras 25% mais rápidas; prefeito: +15 de estabilidade local; tesoureiro: +2 ouro). Você tem 1, mais 1 a cada 4 cívicas, e os nomeia no painel do território.
- F-10 a F-16: **grandes figuras**. Cientista, engenheiro, mercador, artista, general, almirante e profeta acumulam pontos com as construções certas (o general, com conquistas). Quem chega primeiro ao custo leva a figura, e o custo sobe 50% para todos. As figuras ficam no painel **Personagens** para usar quando quiser.
- F-30 a F-38: **espionagem** (exige Escrita; 1 ação e 3 ouro): ver obras e tropas, roubar tecnologia, sabotar obra, sabotar rota, fomentar revolta e propaganda (exige Imprensa). O dado precisa passar do risco mais a defesa do alvo (polícia secreta, tribunal, prefeito). O espião pego custa −20 de relação e dá motivo de guerra ao alvo.
- E-10 a E-13: **pontos de era** por marcos (maravilha, a primeira do mundo vale mais; fé fundada; capital tomada; rota marítima). A cada quarto da partida vem uma era de ouro (+1 ação e +5 de estabilidade local), sombria (−10 de estabilidade) ou heroica (de sombria direto a muitos pontos: +2 ações).
- E-20 a E-34: **eventos**. Quarentena na epidemia, peste continental na Idade Média, seca, enchente, terremoto, corrida do ouro, invenção inesperada, mecenas, crise financeira (eras industriais em diante), horda nômade na estepe e no deserto, e cisma da fé com reforma. A revolta camponesa e a migração em massa trazem escolhas para o jogador.
- A IA nomeia governadores, usa as figuras e rouba tecnologia de quem está à frente.
- Fora desta parte: E-25 (clima, parte 12). G-54 (cisma) entrou aqui.

## v13 — 25/11/2026 · Governo, cultura e fé (parte 10 do roteiro)

**Parte 10** (G-01 a G-08, G-20 a G-31, G-40, G-41, G-50 a G-53)

- R-05 e G-40: **cultura** por turno (templos, monumentos, teatros, anfiteatros, catedrais, mosteiros, maravilhas e cidades-estado culturais) e **árvore cívica** de 12 cívicas em três eras, que liberam governos e políticas. Adotar uma cívica não gasta ação.
- G-01 a G-08: **8 governos** com vagas de política e bônus próprios: Chefia tribal, Monarquia, República clássica, Teocracia, Feudalismo, República mercantil, Monarquia absoluta e Democracia liberal (com eleição a cada 20 turnos). Trocar de governo custa 1 ação e 2 turnos de anarquia, sem saber nem cultura. Cada facção começa com o melhor governo da sua era.
- G-20 a G-31: **12 políticas** em vagas militares, econômicas, civis e religiosas: conscrição, disciplina de ferro, estradas imperiais, livre comércio, protecionismo, mecenato, escola para todos, pão e circo, política ambiental, peregrinação, propaganda e polícia secreta. Trocar é grátis no turno de uma cívica nova; fora dele, cada política nova custa 1 ação.
- G-41: **influência cultural**. Facção com muito mais cultura que o vizinho conquista a lealdade de territórios dele; território leal e instável muda de lado sem guerra.
- G-50: **panteão** (Misticismo e 10 de cultura): colheitas, forja, marés ou lar.
- G-51 e G-52: **fundar uma fé** fictícia (panteão, templo, mosteiro e 30 de cultura) com um princípio de fundador (dízimo, sé luminosa, missões) e um de seguidor (hospitais da ordem, devoção, guerra santa).
- G-53: a fé se espalha pela vizinhança e pelas rotas; templos de outra fé resistem. Mesma fé dá +10 de relação.
- Painel **Governo e fé** com governo, políticas, cívicas e crenças. A IA adota cívicas, troca de governo, preenche políticas, escolhe panteão e funda fés.
- Fora desta parte: G-09 a G-11 (governos industriais, parte 12), G-42, G-43 (obras e turismo, parte 13), G-54 (cisma, parte 11).

## v12 — 25/11/2026 · Diplomacia (parte 9 do roteiro)

**Parte 9** (DP-01 a DP-08, DP-20 a DP-25, DP-30 a DP-32, IA-06, IA-07, UI-08)

- DP-01 a DP-03: guerra (padrão), trégua e paz seguem como na v4; a trégua agora é a base para os acordos.
- DP-04 a DP-08: **acordos** com quem está em trégua. **Passagem livre** (tropas atravessam as estradas do parceiro no remanejamento e ficam supridas ao lado dele), **acordo comercial** (+1 ouro por rota entre os dois), **pacto de pesquisa** (3 ouro de cada, +2 saber por turno por 10 turnos, exige biblioteca), **defesa mútua** (relação 40) e **aliança** (relação 60 e 10 turnos de trégua: ataques proibidos e dominação compartilhada).
- DP-20 e IA-07: **relação** de −100 a +100 com motivos visíveis que perdem força em 30 rodadas: território tomado, trégua rompida, presentes, acordos, comércio, fronteira, tributo.
- DP-21: romper trégua dá **agravo** com todos e desfaz os acordos com aquela facção. DP-22: exigência recusada dá **motivo de guerra**, que evita o agravo. DP-07: quem ataca um parceiro de defesa ou aliado entra em guerra com o outro.
- DP-23: a IA forte exige 5 ouro de tributo de quem está em trégua com ela; quem não paga no turno dá motivo de guerra.
- DP-24: **mesa de negociação** no painel Diplomacia: trégua, cada acordo e presente de 5 ouro. IA-06: cada botão mostra antes se a facção aceita e por quê ("não confiamos em vocês: rompeu a trégua conosco").
- DP-25: trégua com reparação de 5 ouro, mais fácil de aceitar.
- DP-30 a DP-32: um terço dos neutros vira **cidade-estado** (mercantil, científica, militar, religiosa, cultural ou portuária). A ação **Enviado** (1 ação, 2 ouro) dá influência; cumprir a missão dela vale o triplo. Quem tem mais influência (mín. 3) é o suserano, recebe o bônus e é o único que pode anexá-la por influência.
- UI-08: painel **Diplomacia** (botão no quadro de facções) com uma linha por facção: estado, relação e motivos, acordos e propostas; ofertas e exigências da IA aparecem nele.
- A IA propõe acordos e tréguas entre si e ao jogador, cobra tributo e manda enviados.

## v11 — 25/11/2026 · População e sociedade (parte 8 do roteiro)

**Parte 8** (S-10 a S-14, S-20 a S-22, S-24, S-26)

- S-10: a comida por território da v6 continua: cada nível come, a fome derruba o nível.
- S-11: **felicidade** do império. +2 por luxo ligado, +1 por templo, anfiteatro e teatro, +2 pela Grande Arena, +4 por 2 turnos depois de festividades, +1 com Misticismo; −1 por cidade ou metrópole, −1 a cada 4 de cansaço de guerra, −3 por 2 turnos depois de impostos. Abaixo de 0: −10% de ouro e saber. Abaixo de −10: −3 de estabilidade por turno.
- S-12: **saúde** do território: 2, +1 com rio, +1 no litoral, +2 por aqueduto, saneamento e hospital, −1 por nível de povoamento, −1 com mineração. Abaixo de 0, 1 chance em 10 por turno de epidemia (perde 1 nível e 1 tropa).
- S-13: **estabilidade local** = a do império, −15 com cultura estrangeira, −3 por passo além de 3 da capital, +15 com tribunal, +5 com 3 tropas ou mais. Abaixo de 30, o território rende metade do ouro e do saber; abaixo de 10, pode se separar como rebelde.
- S-14 e S-22: **cultura** de cada território. Território conquistado mantém a cultura antiga e a assimila em 8 turnos; templo, monumento e biblioteca aceleram.
- S-20: **corrupção**: cada território perde 5% de ouro e saber por passo até a capital (máximo 40%); tribunal ou estrada cortam pela metade.
- S-21: **migração**: império com felicidade 6 ou mais atrai 1 nível de população de um vizinho de facção infeliz (1 chance em 10 por turno).
- S-24: festividades dão também +4 de felicidade por 2 turnos e gastam 5 de comida da capital.
- S-26: ação **Colonos** (Sociedade, 3 ouro): uma cidade sua perde 1 nível e uma aldeia sua vizinha sobe 1.
- O painel do território mostra saúde, estabilidade local, corrupção e cultura; o painel da facção mostra a felicidade. A IA faz festividades quando o povo está infeliz.
- Correção: carta de sabotagem sem alvo não trava mais a partida da IA.

## v10 — 25/11/2026 · Tecnologias e tropas por era (parte 7 do roteiro)

**Parte 7** (K-01 a K-59, A-01 a A-07, A-43, A-45, A-47, UI-04)

- K-01 a K-59: **árvore de 49 tecnologias** em três eras (Antiguidade, Idade Média, Idade Moderna), com pré-requisitos. Cada uma libera construções, zonas ou tropas do catálogo. Moeda, Engenharia e Bússola viraram marcos da árvore (K-13, K-20, K-38); as outras 7 tecnologias da v4 viraram **doutrinas**, com novos pré-requisitos.
- No início, cada facção já conhece as tecnologias das eras anteriores à do cenário e as cinco básicas da Antiguidade. Só as tecnologias novas contam 2 de legado.
- Jazidas reveladas por tecnologia: cavalos (Domesticação), cobre e estanho (Mineração), ferro (Fundição do ferro).
- Efeitos novos: Guildas (+1 produção por oficina), Imprensa (+1 saber por universidade), Método científico (+10% de saber), Navegação oceânica (+1 travessia), Matemática (armas de cerco: construções de defesa valem 1 a menos contra você).
- A-01 a A-07: **tropas por era**. A melhor tropa da facção vale para todo o exército e exige a tecnologia e o bem na rede: lanceiros (defesa vence empates contra cavalaria), legiões (+1 no ataque), cavalaria leve e cavaleiros (+1 no ataque em terreno aberto; cavaleiros vencem empates nele), besteiros (+1 na defesa com muralha ou castelo), mosqueteiros (+1 no ataque e na defesa).
- K-53: **artilharia** (com salitre na rede): antes de cada ataque, 1 dado de canhão mata 1 defensor com 5 ou 6.
- A-43: **veteranos**. Tropas que conquistam 3 vezes seguidas ganham +1 no ataque.
- A-45: **entrincheirar**. Território com 2 ou mais tropas que não atacou nem recebeu tropas por conquista no turno ganha +1 na defesa até atacar.
- A-47: **mercenários** (Militar): 1 tropa na capital na hora, pelo dobro do preço, sem gastar ação, 1 vez por turno. A IA usa quando a capital está ameaçada.
- UI-04: a janela de tecnologias agrupa por era e mostra o que cada tecnologia libera e as tropas que você tem.
- IA pesquisa pelo valor do que a tecnologia libera. Duração curta medida: média de 44 rodadas.
- Fora desta parte: A-20 a A-24 e A-40 a A-42, A-44, A-46 (unidades de cerco separadas e generais ficam para a parte 11).

## v9 — 25/11/2026 · Comércio e rotas (parte 6 do roteiro)

**Parte 6** (T-01 a T-03, T-10 a T-14, T-16 a T-18)

- T-01 a T-03: três tipos de rota. **Rota interna** (mercado nas duas pontas, caminho por terra seu): +1 produção no destino e os bens dele contam na rede. **Caravana** (caravançará até um mercado de outra facção em paz, a até 4 territórios): +2 ouro para cada lado e 1 bem que lhe falta. **Rota marítima** (porto com armazém alfandegário até um porto de outra facção em paz): +3 ouro para cada lado e 2 bens.
- T-10: abrir custa 1 ação e 4 ouro, e a rota rende a partir do turno seguinte. T-11: 1 rota por mercado, porto e banco.
- T-12: a outra facção aceita sempre que está em paz e sem embargo (o ouro é dos dois lados).
- T-13: bens recebidos por rota contam como ligados para os requisitos das obras.
- T-14: rota com quem já tem uma tecnologia barateia essa pesquisa em 20%; caravana com facção mais adiantada dá +1 saber.
- T-16: quem conquista a ponta de uma rota alheia pilha o ouro de 2 turnos dela. Guerra, perda da ponta ou da construção desfazem a rota.
- T-17: rota marítima de quem tem menos de 2 travessias tem 1 chance em 6 por turno de ser atacada por piratas e não render.
- T-18: **embargo** no painel de facções corta e proíbe as rotas com aquela facção.
- Painel **Rotas** (em Economia) com as rotas ativas e as possíveis, e rotas no mapa como linhas animadas. A troca de recursos 2 por 1 virou **Câmbio**.
- IA abre rotas quando sobra ouro. Duração curta medida: média de 47 rodadas.
- Fora desta parte: T-15 (nós comerciais marcados no mapa).

## v8 — 24/11/2026 · Estradas, portos e rede de bens (parte 5 do roteiro)

**Parte 5** (C-120 a C-122, C-126, C-127, L-01 a L-05, L-07, L-08, L-11, UI-03)

- L-01, L-02: **rede de bens**. A capital, os territórios seus ligados a ela por **estrada** (C-121; os dois lados precisam ter) e os portos seus (C-126, ligados entre si) formam a rede. A **trilha** (C-120) liga ainda os vizinhos por terra de quem está na rede. Só os bens explorados na rede contam para requisitos de obras, reforços de ferro e cavalos, luxos e descontos de pedra e madeira.
- L-03: conquistar um território de passagem corta a rede (L-07: quem conquista fica com a estrada).
- L-04: no remanejamento, pela estrada as tropas andam até 2 territórios; com **estrada pavimentada** (C-122, exige engenharia), até 3.
- L-05: de um porto seu as tropas vão a qualquer outro porto seu no remanejamento.
- L-08: território na rede nunca fica sem suprimento; fora dela vale a distância da v5.
- L-11: estrada custa o dobro em montanha e pântano e 50% a mais em deserto.
- C-127: **estaleiro** (porto + madeira na rede): +1 travessia e +1 produção.
- UI-03: o catálogo diz quando o bem existe mas está fora da rede. O painel do território diz se ele está na rede, ligado por trilha ou fora. Estradas aparecem no mapa como linhas, e a nova lente **Rede** pinta a rede.
- IA: constrói estradas para ligar territórios com jazidas à rede.
- Fora desta parte: destruir estradas ao recuar (L-07, segunda metade), C-123 a C-125, C-128, C-129, L-06, L-09, L-10 (parte 12).

## v7 — 24/11/2026 · Catálogo de construções (parte 4 do roteiro)

**Parte 4: catálogo, eras 1 a 3** (C-01 a C-12, C-20 a C-26, C-40 a C-44, C-60 a C-65, C-70 a C-73, C-80 a C-85, C-90 a C-94, C-100 a C-106, C-200 a C-209)

- 44 construções novas em cadeia. A zona abre a sua família e não ocupa vaga a mais: lavouras → fazenda, celeiro, irrigação, moinho, arrozal, plantação, engenho; pastagens → estância, haras, charqueada; pesqueiros → pesqueiro, salga; serrarias → serraria, carvoaria; minas → pedreira, mina, garimpo, fundição; mercado → caravançará, banco, bolsa; porto → armazém, companhia de comércio; biblioteca → academia, observatório, universidade; templo → mosteiro, grande templo; quartel → arsenal, polvorinho, academia militar; muralha → castelo, fortaleza abaluartada. Fora das zonas: ferraria, monumento, anfiteatro e teatro, aqueduto, saneamento, hospital, tribunal, paliçada e linha fortificada.
- Quatro tipos de requisito: construção anterior no território, jazida no território (arroz, gado, cavalos, minério…), bem explorado no império (sal, bronze ou ferro, ferro e madeira, pedra, salitre) e era ou tecnologia. Rio, litoral, colina por perto e nível do território também contam.
- Efeitos novos: prestígio e estabilidade por construção, bônus de defesa somados, defesa que vence todos os empates (castelo), +1 no ataque saindo de arsenal ou polvorinho, reforços (haras, academia militar), travessias (companhia de comércio), território que nunca se revolta (tribunal), celeiro que segura o nível na fome.
- Povoamento: a vila só vira cidade com **aqueduto**, e a cidade só vira metrópole com **saneamento** (antes: mercado ou templo, e academia).
- C-200 a C-209: **10 maravilhas do mundo**, uma só no mapa inteiro. Quem termina primeiro fica com ela e as outras filas a perdem: Grandes Pirâmides, Jardins Suspensos, Grande Biblioteca (tecnologias que duas rivais já têm), Farol Monumental, Grande Arena, Grande Muralha, Catedral Gótica, Rede de Caminhos do Império, Castelo do Senhor da Guerra e Observatório Imperial. Cada uma tem a sua janela de eras.
- Interface: nas obras abertas só aparecem as que cabem em algum território seu; o botão **Catálogo** mostra todas, com custo, legado e o que falta.
- Legado: cada construção tem o seu valor (as de economia de base valem 0). Com mais obras no jogo, o legado para vencer subiu para 150, 220 e 300; duração curta medida em 64 partidas: média de 46 rodadas (antes 43).
- Nomes repetidos entre construções antigas e novas foram trocados (Scriptorium, Biblioteca Pública, Igreja, Igreja Matriz).

## v6 — 24/11/2026 · Terra, recursos e zonas (parte 3 do roteiro)

**Parte 3: recursos e zonas** (M-01 a M-10, M-20, M-21, M-26, R-01 a R-04, R-07, R-20 a R-62 em parte, Z-01 a Z-11, S-02 a S-05, UI-01)

- M-01 a M-10: os 412 territórios dos 11 mapas ganharam **terreno** (planície, pradaria, floresta, selva, colinas, montanhas, deserto, estepe, tundra, pântano), **rio** e **jazidas**, com geografia real nos mapas históricos (`src/geo.js`; `node tools/check-geo.js` confere).
- Terreno na defesa: colinas e montanhas +1 no maior dado; floresta e selva +1 com 3 ou mais tropas; em montanha o empate é sempre da defesa; quem ataca pântano usa 1 dado a menos.
- R-01 a R-04 e M-20, M-21: **rendimento por território**. Comida, produção, ouro e saber vêm do terreno, do rio (+1 comida e +1 ouro), do litoral (+1 comida), do nível, das zonas e das jazidas exploradas. O ouro deixou de ser "1 a cada 3 territórios".
- S-02 a S-05: **povoamento** em 4 níveis: aldeia, vila, cidade e metrópole. A comida que sobra enche o estoque; vila exige estoque, cidade também mercado ou templo, metrópole também academia. Cada nível consome mais comida, a fome faz encolher e a conquista tira um nível. Vila dá +1 ouro, cidade +1 saber, metrópole +1 ouro e +1 saber; a cada 3 cidades, +1 ponto de ação (até +2). Os reforços passam a contar a soma dos níveis.
- Z-01 a Z-11: **zonas**. Vagas por território = nível. Zonas de recurso novas: agrícola, pecuária, pesqueira, florestal e mineração, cada uma com o terreno certo. Mercado, academia (vila ou maior), quartel, templo e porto viraram as zonas comercial, científica, militar, religiosa e portuária. Oficina, fortificação, aeródromo e maravilha não ocupam vaga. **Polo**: cada vizinho seu com a mesma zona dá +1 no rendimento principal, até +3.
- R-20 a R-62 (parte) e R-07: jazidas só rendem quando a zona certa existe no território. Cada tipo de **luxo** explorado dá +1 de estabilidade por turno (até +4). Ferro e cavalos dão +1 tropa de reforço cada; pedra barateia muralha, templo e maravilha em 25%; madeira, porto, oficina e quartel. Carvão e salitre só aparecem da era da pólvora em diante; petróleo, no século XX.
- UI-01: **lentes do mapa** (Dono, Terreno, Zonas, Recursos) no canto do mapa. O painel do território mostra terreno, nível, vagas, jazidas (✓ = explorada), comida, estoque e o que falta para crescer.
- IA: avalia zonas de recurso pelo rendimento e pelas jazidas novas que passam a ser exploradas.
- Zonas de recurso não contam para o legado, para o ritmo não acelerar. Duração medida em 64 partidas curtas: média 46 rodadas (antes 44); médias: média 100 de 120.
- Fora desta parte: Z-12 a Z-17 (parte 12), M-11, M-22 a M-25 (sem dados de lago, delta, passo e estreito), R-05, R-06, R-08 a R-10 e estoques de bens estratégicos (parte 5). O texto de ajuda deixou de citar outro jogo pelo nome.

## v5 — 24/11/2026 · Partidas longas e obras em turnos (partes 1 e 2 do roteiro)

Pedido: partidas bem mais longas que 30 ou 40 rodadas, com versões curta, média e longa, e a implementação do levantamento de sistemas, começando pelas partes 1 e 2.

**Parte 1: partida mais longa** (D-01 a D-07, D-10, D-11, A-44, A-49, V-09)

- D-01: duração escolhida na tela inicial: **Curta (60 rodadas)**, **Média (120)** ou **Longa (250)**. Obras e tecnologias custam ×1, ×2 ou ×4. Os eventos do cenário se espalham pela primeira metade da partida.
- D-02: o objetivo ganhou uma segunda etapa: além da meta militar, ter metade do legado da vitória por legado.
- D-03: o objetivo precisa ficar cumprido por 2, 3 ou 4 turnos seguidos, conforme a duração.
- D-04: objetivo e legado só valem a partir de 1/3 da partida. Dominação vale sempre, mas uma aliança que fica sem inimigo antes disso se desfaz em trégua e os antigos aliados passam a disputar o mapa.
- D-05: território conquistado fica **ocupado** por 3 turnos: não conta para renda e reforços, produz metade e é o primeiro a se revoltar.
- D-06 e A-49: **cansaço de guerra**. Cada turno em campanha soma 1, perder território soma 2; turnos de paz tiram 2 e festividades tiram 3. A cada 5 pontos, −1 de estabilidade por turno.
- D-07: **linha de suprimento**. Atacar de um território a mais de 3 passos da capital, de um quartel ou de um porto custa 1 dado.
- D-10: a IA evita campanhas quando está cansada da guerra ou instável.
- A-44: **soldo**. Tropas acima de 3 por território custam 1 ouro a cada 3 por turno; sem ouro, desertam.
- D-11: 3 espaços de salvamento, exportar a partida em arquivo e importar de volta.
- V-09: no fim das rodadas continua vencendo quem mais cresceu (territórios ganhos, capitais, alvos do objetivo e legado).
- Freios extras de ritmo: cada facção conquista no máximo 1 território por turno (2 com a tecnologia de doutrina militar), e toda capital soma +1 ao maior dado de defesa em qualquer era.
- Legado para vencer: 90, 130 ou 180 conforme a duração, até o dobro em mapas grandes.

**Parte 2: construção em turnos e sem limite** (P-01 a P-04, P-08 a P-11, UI-02, UI-06)

- Fim do limite de 2 construções por território: agora vale uma de cada tipo.
- P-01: cada construção custa **produção ⚒**. Cada território produz 1 (+2 na capital, +2 com a nova **Oficina**), e a produção vai para a obra do topo da fila.
- P-02: fila de até 3 obras por território (5 com a tecnologia de administração); o excesso de produção passa à obra seguinte.
- P-03: a ação **Ordenar obras** (1 ponto de ação) abre todas as filas no turno: pôr, retirar e apressar quantas vezes quiser.
- P-04: apressar com ouro: 2 por ponto de produção que falta (3 na maravilha), nunca no turno em que a obra começou.
- P-08: quem conquista fica com metade do progresso das obras locais; maravilha em andamento se perde.
- P-09: a pesquisa anda em turnos. Escolher a tecnologia não gasta ação; o saber acumulado vai para ela.
- P-10: tropas recrutadas chegam no início do turno seguinte.
- P-11: **manutenção** das construções em ouro por turno; sem ouro, a mais cara fica desativada naquele turno.
- UI-02: o painel do território mostra produção, fila com barras de progresso, turnos restantes, ocupação, suprimento e recrutas a caminho.
- UI-06: painel **Obras do império** com todas as filas, apressar e retirar.
- A IA usa filas, escolhe pesquisa, apressa com o ouro que sobra e respeita a manutenção.

Ficaram para depois: P-05 (mutirão), P-06 (ajuda entre territórios, chega com as estradas da parte 5), P-07 (obra parada por falta de bem, chega com os recursos da parte 3), P-12 e P-13.

Equilíbrio medido com `npm test` (curta, IA contra IA): partidas entre as rodadas 20 e 61, média por cenário de 31 a 61. Na média, a maioria passa de 80 rodadas; na longa, quase todas vão até o fim. Salvamentos da v4 não são compatíveis.

## v4 — 24/11/2026 · Turno de governo

Pedido: a jogabilidade da v3 tinha pouca estratégia.

- Fase de governo com **3 pontos de ação** por turno.
- Recursos: 💰 ouro, 🔬 saber e ⭐ prestígio, produzidos por territórios e construções.
- Ações: campanha (sem ela não há ataque nem bombardeio), recrutar, construir, pesquisar, festividades, influenciar neutros, agitadores, impostos e comércio.
- 8 construções (mercado, academia, quartel, fortificação, templo, porto, aeródromo, maravilha), que trocam de dono na conquista.
- Árvore de 10 tecnologias em 3 níveis, com nomes da época.
- **3 caminhos de vitória:** objetivo militar, 30 pontos de legado (2 por tecnologia, 1 por construção, 5 por maravilha) ou domínio do mapa.
- Cartas de troca por tropas removidas; cartas de benefício passam a ser grátis (não gastam ação).
- IA aprendeu a usar as ações.

## v3 — 23/11/2026 · Regras evoluídas e novas eras

- Remanejamento: toda tropa sobrando move uma vez para um vizinho, podendo dividir; sempre fica 1. Tropas que chegaram por conquista não se movem de novo.
- Após vencer, move no máximo o número de dados usados. Defesa com até 3 dados.
- Reforços: territórios/2 (mínimo 3) + região completa + capitais.
- Cartas de território em conjuntos (4, 6, 8, 10, 12, 15, depois +5), troca obrigatória com 5 cartas, e 12 cartas especiais com nomes da era.
- Frotas: travessias por turno por facção; desembarque ataca com no máximo 2 dados.
- Aviação a partir de 1914 (ou dragões e grifos na fantasia): dado antiaéreo, depois bombardeio; enfraquece mas não conquista.
- Tecnologia por era (muralhas dão +1 de defesa às capitais na Antiguidade e Idade Média).
- 8 cenários novos (Púnicas, Crise do séc. III, Queda de Roma, Vikings, Mongóis, Cruzadas, Pré-colombiano, Sengoku) e 4 mapas (Mediterrâneo, nórdico, Américas, Japão). Total: 16 cenários.
- Salvar e continuar partida; filtro por era na tela inicial; no limite de rodadas vence quem mais cresceu.

## v2 — 21/11/2026 · Mapas reais e combate com dados

- Mapas reais: mundo, Europa, EUA e Brasil.
- Combate com dados no estilo do gênero, reforços, cartas de era e revoltas internas quando a estabilidade cai.
- 8 cenários: 1805, 1914, 1861, Regências de 1835, 1939, Guerra Fria e dois mundos de fantasia originais.

## v1 — 21/11/2026 · Primeiro protótipo

- Solo contra 2 a 4 IAs, mapa fixo de 30 territórios em 5 regiões, partidas de 15 ou 25 turnos.
- Economia (PIB, caixa, aprovação, rejeição, reputação), 7 recursos com mercado, 11 obras, energia suja/limpa/nuclear, religiões fictícias, diplomacia, agentes, níveis militares, 8 líderes e criador de líder.

O código das versões 1 a 3 não foi preservado; este repositório começa na v4.

## Publicação online · 27/11/2026

- Endereço próprio do jogo: https://fsalamoni.github.io/Soberania/ (GitHub Pages).
- Workflow `.github/workflows/pages.yml`: a cada push na `main` compila o `index.html` e publica, completando o cabeçalho (doctype, charset e viewport) que o formato de artifact omite. Também pode ser disparado à mão em Actions.
- Não muda regras nem a versão do jogo.
