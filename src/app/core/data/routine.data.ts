import { RoutineBlock } from '../models/routine.model';

/** The 30-minute daily routine for a beginner, in playing order. */
export const ROUTINE_BLOCKS: readonly RoutineBlock[] = [
  {
    id: 'warmup',
    title: 'Aquecimento',
    minutes: 5,
    icon: '🔥',
    description:
      'Cromático 1-2-3-4, um dedo por casa, nas 6 cordas. Devagar (60 BPM) e limpo, com a mão relaxada.',
    link: { label: 'Ver exercícios', path: '/licoes/aquecimento' },
  },
  {
    id: 'chords',
    title: 'Acordes e trocas',
    minutes: 10,
    icon: '🔁',
    description:
      'Trocas em pares (ex.: G ↔ C) por 1 minuto, contando as trocas limpas. Confira cada acorde corda por corda.',
    link: { label: 'Abrir troca de acordes', path: '/acordes' },
  },
  {
    id: 'rhythm',
    title: 'Ritmo e batida',
    minutes: 5,
    icon: '🥁',
    description:
      'Só para baixo, uma batida por clique; depois "baixo, baixo-cima, cima-baixo-cima". A mão direita nunca para.',
    link: { label: 'Abrir ritmo e batida', path: '/licoes/ritmo' },
  },
  {
    id: 'fretboard',
    title: 'Notas do braço',
    minutes: 5,
    icon: '🎸',
    description: 'Decore as notas das cordas 6 (Mi) e 5 (Lá) no quiz, só essas duas cordas.',
    link: { label: 'Abrir quiz do braço', path: '/braco' },
  },
  {
    id: 'songs',
    title: 'Músicas',
    minutes: 5,
    icon: '🎵',
    description: 'Toque as músicas que o professor passou.',
  },
];

export const ROUTINE_TOTAL_MINUTES = ROUTINE_BLOCKS.reduce((sum, block) => sum + block.minutes, 0);
