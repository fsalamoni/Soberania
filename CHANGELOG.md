# Histórico de versões

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
