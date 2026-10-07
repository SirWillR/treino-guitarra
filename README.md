# Fretboard & Harmony Trainer

App de treino diário de guitarra: memorização das notas do braço, troca de acordes com metrônomo,
sistema CAGED, tríades fechadas e as lições da aula (digitação e progressões com dicas).

Angular 22 (standalone components, Signals, zoneless) + Tailwind CSS 4. O braço e os diagramas são
SVG puro e o metrônomo usa a Web Audio API — não há outras dependências.

## Como rodar

Requer Node 24 (ou 22.22+). Com nvm:

```bash
nvm use 24
npm install
npm start        # http://localhost:4200
```

Outros comandos: `npm test` (testes unitários, Vitest) e `npm run build` (build de produção em `dist/`).

## Publicação

O app está publicado em <https://sirwillr.github.io/treino-guitarra/>. Cada `git push` na `main` roda os
testes e republica o site pelo workflow `.github/workflows/deploy.yml` (GitHub Pages).

## Módulos

| Aba | Rota | O que faz |
| --- | --- | --- |
| Braço & Quiz | `/braco` | Mapa livre de uma nota em todo o braço e quiz de identificação com pontuação e sequência |
| Troca de Acordes | `/acordes` | Os 7 acordes maiores e 7 menores e o treinador de troca (2 a 4 acordes, troca a cada 1, 2 ou 4 compassos) |
| Sistema CAGED | `/caged` | Os 5 shapes de qualquer acorde maior ou menor, com intervalos e tônica de ancoragem |
| Tríades | `/triades` | Inversões de tríades maiores e menores nos grupos de cordas 1-2-3, 2-3-4 e 3-4-5 |
| Lições da Aula | `/licoes` | Uma lição por submenu: aquecimento cromático, escala maior e digitação, progressões com dicas |

## Estrutura

```
src/app/
  core/
    models/     tipos: notas, braço, acordes, CAGED, tríades, lições
    data/       acordes, shapes do CAGED e conteúdo das lições
    services/   music-theory.service (teoria, sem estado) e metronome.service (Web Audio)
  shared/       app-fretboard, app-chord-diagram, app-metronome, app-scale-exercise,
                app-practice-tips, app-note-picker
  features/     uma pasta por aba, carregada sob demanda pelo router
```

### Adicionar uma lição

1. Crie o componente em `src/app/features/lessons/` (use `warmup-practice.ts` como modelo; o
   `app-exercise-player` cuida do metrônomo e do passo a passo).
2. Acrescente uma entrada em `src/app/features/lessons/lessons.registry.ts` com `slug`, `title`,
   `summary` e `loadComponent`.

O submenu e a rota `/licoes/<slug>` são gerados a partir desse registro.

### Adicionar acordes e progressões

Para adicionar um acorde, inclua-o em `core/data/chords.data.ts` (casas e dedos da 6ª para a 1ª corda);
os testes conferem se o diagrama só soa notas do acorde. A tela de Troca de Acordes mostra só os
grupos `major` e `minor`; os demais ficam disponíveis para as lições. Novas progressões e dicas ficam em
`core/data/lessons.data.ts`.
