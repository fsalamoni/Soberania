# Soberania — notas para quem desenvolve

- Idioma: português do Brasil em tudo (interface, docs, commits).
- Jogo original: mecânicas do gênero sim; nomes, mundos e personagens protegidos de outros jogos/obras, nunca.
- Fonte da verdade do design: `docs/escopo.md` (visão) e `docs/levantamento-sistemas.md` (sistemas com IDs e roteiro em 15 partes). Ao implementar, cite as partes/IDs no commit e no CHANGELOG.
- O jogador (Flavio) prefere levantamento antes de código e implementação por partes.
- Fluxo: editar `src/` ou `maps/maps.json` → `npm run build` → `npm test` (deve terminar em `sem erros`) → registrar no `CHANGELOG.md`. Nunca edite `index.html` à mão.
- Equilíbrio: `REP=n ONLY=<cenário> node test3.js`. Com `SEED=n` as partidas simuladas se repetem iguais (compare antes e depois com a mesma semente). Pontos conhecidos: Shimazu (Sengoku) e Sassânidas (Crise do séc. III) vencem com frequência.
