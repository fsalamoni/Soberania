# Soberania

Jogo de estratégia por turnos para o navegador, em português. Mistura conquista de territórios com dados (no estilo do gênero War/Risk) com um turno de governo inspirado em jogos de civilização e eurogames: economia de ações, construções, árvore de tecnologias e vários caminhos para vencer.

O jogo é **original**: usa mecânicas do gênero, mas nomes, regras, números, cenários de fantasia e textos são próprios. Mapas e nomes históricos reais são domínio comum.

## Como jogar

Abra `index.html` em qualquer navegador moderno. É um arquivo único, sem servidor e sem instalação. A partida fica salva no navegador (localStorage) a cada turno.

Hoje o jogo é solo contra IAs, em 16 cenários:

| Era | Cenários |
| --- | --- |
| Antiguidade | Guerras Púnicas, Crise do Terceiro Século, Queda de Roma |
| Idade Média | Vikings, Mongóis, Cruzadas, Japão Sengoku, América antes de Colombo |
| Moderna e contemporânea | Europa 1805, Primeira Guerra (1914), Guerra Civil dos EUA (1861), Regências do Brasil (1835), Segunda Guerra (1939), Guerra Fria |
| Fantasia original | Dois mundos próprios (alta fantasia e intriga de casas nobres) |

### Duração (v5)

Cada partida escolhe a duração: **Curta (60 rodadas)**, **Média (120)** ou **Longa (250)**. Quanto mais longa, mais caras ficam obras e tecnologias (×1, ×2, ×4) e mais turnos o objetivo precisa ser mantido (2, 3, 4). Objetivo e legado só valem a partir de 1/3 da partida. Os eventos históricos se espalham pela primeira metade. Em partidas IA contra IA, a curta termina entre as rodadas 20 e 61 (média por cenário de 30 a 60), a média quase sempre passa de 80 e a longa costuma ir até o fim.

### O turno (v5)

1. **Início:** renda de ouro, saber e prestígio somada território a território; manutenção (soldo das tropas e das construções); a produção ⚒ de cada território avança a fila de obras; a comida que sobra faz o território crescer; o saber avança a pesquisa escolhida; recrutas do turno anterior chegam.
2. **Reforços:** soma dos níveis dos territórios não ocupados ÷ 3 (mínimo 3), ferro e cavalos explorados, mais região completa, capitais e quartéis.
3. **3 pontos de ação:** campanha (necessária para atacar), recrutar, ordenar obras (abre todas as filas no turno), sociedade (festividades, influenciar neutros, agitadores) e economia (impostos, comércio). Escolher a pesquisa não gasta ação.
4. **Ataques** com dados: até 3 no ataque e 3 na defesa; após vencer, move no máximo o número de dados usados. No máximo 1 conquista por turno (2 com a doutrina militar).
5. **Remanejamento:** cada tropa sobrando anda uma vez para um território vizinho, sempre fica 1.

Freios contra a bola de neve: território conquistado fica ocupado por 3 turnos, cansaço de guerra, linha de suprimento, soldo das tropas e capitais com +1 na defesa. Uma aliança que fica sem inimigo antes de 1/3 da partida se desfaz em trégua.

### Terra e zonas (v6)

Cada território tem terreno, talvez rio e litoral, e jazidas (veja as lentes Terreno e Recursos no canto do mapa). A comida que sobra enche o estoque e o território cresce de aldeia para vila, cidade e metrópole; cada nível abre uma vaga de zona. Zonas de recurso (agrícola, pecuária, pesqueira, florestal, mineração) pedem o terreno certo e exploram as jazidas; mercado, academia, quartel, templo e porto são as zonas comercial, científica, militar, religiosa e portuária. Zonas iguais vizinhas formam polo. Luxos explorados dão estabilidade; ferro e cavalos, reforços; pedra e madeira, obras mais baratas. Colinas, montanhas e florestas ajudam a defesa, e pântano atrapalha o ataque.

Vitória pelo objetivo do cenário (etapa militar + legado mínimo, mantidos por turnos seguidos), por legado (tecnologias, obras e maravilha) ou por domínio do mapa. No fim das rodadas vence quem mais cresceu.

## Estrutura do repositório

```
index.html            jogo compilado (arquivo único, gerado pelo build)
build.js              junta shell + mapas + dados + jogo em index.html
test3.js              teste automático (Playwright): IA contra IA em todos os cenários + capturas de tela
tools/sim.js          simulação IA contra IA por duração (curta, média, longa), para equilíbrio
tools/check-geo.js    confere se src/geo.js cobre todos os territórios dos mapas
src/
  shell.html          HTML e CSS da interface, com marcadores __MAPS__, __DATA__, __GAME__
  rules.js            habilidades de líder, tecnologia por era, cartas, ações e construções, zonas e níveis de povoamento
  geo.js              terreno, rio e jazidas de cada território dos 11 mapas, tabelas de terreno e de jazidas
  data.js, data2.js   cenários e facções
  game.js             motor do jogo: turnos, combate, IA, interface
maps/
  maps.json           territórios projetados (SVG), regiões e vizinhanças de todos os mapas
  maps-build.mjs      gerador de maps.json a partir de Natural Earth / us-atlas / svg-maps
docs/
  escopo.md                 documento de escopo original (visão completa do jogo)
  levantamento-sistemas.md  levantamento completo de sistemas (IDs C-01, K-20, T-13…) e roteiro em 15 partes
CHANGELOG.md          histórico de versões
```

## Desenvolvimento

Requisitos: Node 18+.

```bash
npm run build          # gera index.html a partir de src/ e maps/
npm test               # roda partidas automáticas em todos os cenários (precisa do Playwright)
REP=5 ONLY=sengoku node test3.js   # 5 partidas de um cenário, para medir equilíbrio
LEN=m SC=reg,ww2 REP=4 node tools/sim.js   # partidas IA contra IA em outra duração (c, m, l), com estado final por facção
```

`tools/sim.js` mostra, por partida, a rodada final, o motivo, o vencedor e, por facção, territórios, tecnologias, obras concluídas, estabilidade, ouro, cansaço de guerra e campanhas declaradas. `LOG=1` imprime a crônica da partida mais curta.

O teste imprime, por partida: cenário, facção, rodada final, motivo da vitória, vencedor e contagens de ações (construções, pesquisas, influência, campanhas, cartas, bombardeios). Termina com `sem erros` quando nada quebrou. As capturas ficam em `shots/` (ignorado pelo git).

Para regenerar os mapas (raro), baixe os pacotes `world-atlas@2.0.2`, `us-atlas@3.0.1` e `@svg-maps/brazil` em `maps/`, instale `d3-geo` e `topojson-client` e rode `node maps-build.mjs` dentro de `maps/`. Fontes: Natural Earth e us-atlas (domínio público), @svg-maps/brazil (CC-BY-4.0).

### Convenções

- Tudo em português do Brasil: interface, textos, commits e documentação.
- Cada mudança de regra precisa passar no `npm test` e manter o equilíbrio medido em partidas IA contra IA.
- Nada de recriar jogos, mundos ou personagens protegidos: fantasia sempre original.
- Uma versão nova entra no `CHANGELOG.md`.

## Roteiro

O plano completo está em [docs/levantamento-sistemas.md](docs/levantamento-sistemas.md), seção "Roteiro de implementação por partes". Resumo:

| Parte | Tema |
| --- | --- |
| 1 | Partida mais longa: modos de 60, 120 e 250 rodadas (feita na v5) |
| 2 | Construção em turnos, fila por território, fim do limite de 2 construções (feita na v5) |
| 3 | Recursos e zonas de especialização: terreno, jazidas, povoamento e lentes do mapa (feita na v6) |
| 4 | Catálogo de construções, eras 1 a 3, e maravilhas do mundo (feita na v7) |
| 5 | Estradas, portos e rede de bens (feita na v8) |
| 6 | Comércio e rotas |
| 7 | Tecnologias e tropas por era |
| 8 | População e sociedade |
| 9 | Diplomacia |
| 10 | Governo, cultura e fé |
| 11 | Personagens e eventos |
| 12 | Eras industrial a informação |
| 13 | Vitórias completas |
| 14 | Modo Civilização (mapa aleatório, do zero até hoje) |
| 15 | Acabamento (tutorial, histórico, modos opcionais) |

Próximo passo sugerido: parte 3 (recursos e zonas) ou parte 5 (estradas, portos e rede de bens).
