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

### O turno (v4)

1. **Produção:** ouro, saber e prestígio, conforme territórios e construções.
2. **Reforços:** metade dos territórios (mínimo 3), mais bônus de região completa e de capitais.
3. **3 pontos de ação:** campanha (necessária para atacar), recrutar, construir, pesquisar, sociedade (festividades, influenciar neutros, agitadores) e economia (impostos, comércio).
4. **Ataques** com dados: até 3 no ataque e 3 na defesa; após vencer, move no máximo o número de dados usados.
5. **Remanejamento:** cada tropa sobrando anda uma vez para um território vizinho, sempre fica 1.

Vitória pelo objetivo militar do cenário, por 30 pontos de legado (tecnologias, obras e maravilhas) ou por domínio do mapa.

## Estrutura do repositório

```
index.html            jogo compilado (arquivo único, gerado pelo build)
build.js              junta shell + mapas + dados + jogo em index.html
test3.js              teste automático (Playwright): IA contra IA em todos os cenários + capturas de tela
src/
  shell.html          HTML e CSS da interface, com marcadores __MAPS__, __DATA__, __GAME__
  rules.js            habilidades de líder, tecnologia por era, cartas, ações e construções
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
```

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
| 1 | Partida mais longa (30 a 40 rodadas) |
| 2 | Construção em turnos, fila por território, fim do limite de 2 construções |
| 3 | Recursos e zonas de especialização |
| 4 | Catálogo de construções, eras 1 a 3 |
| 5 | Estradas, portos e rede de bens |
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

Próximo passo sugerido: partes 1 e 2.
