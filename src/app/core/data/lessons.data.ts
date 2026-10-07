import { Finger } from '../models/chord.model';
import { PracticeTip, ScaleExerciseStep, TeacherLesson } from '../models/lesson.model';

export const FINGER_NAMES: Record<Finger, string> = {
  0: 'Corda solta',
  1: 'Indicador',
  2: 'Médio',
  3: 'Anelar',
  4: 'Mínimo',
};

export const FINGER_COLORS: Record<Finger, string> = {
  0: '#94a3b8',
  1: '#38bdf8',
  2: '#34d399',
  3: '#fbbf24',
  4: '#f472b6',
};

/** Chromatic warm-up: one finger per fret on every string, from string 6 up to string 1. */
export const WARMUP_PATTERN: readonly ScaleExerciseStep[] = ([6, 5, 4, 3, 2, 1] as const).flatMap(
  (string) => ([1, 2, 3, 4] as const).map((finger) => ({ string, fretOffset: finger - 1, finger })),
);

/** General technique advice (not from the teacher's notes). */
export const WARMUP_TIPS: readonly PracticeTip[] = [
  {
    icon: '🐢',
    title: 'Devagar primeiro',
    body: 'Comece em 60 BPM, uma nota por tempo. Só aumente a velocidade quando todas as notas saírem limpas e iguais.',
  },
  {
    icon: '📌',
    title: 'Dedos ficam na corda',
    body: 'Ao subir (1-2-3-4), não levante o dedo anterior quando o próximo descer: no dedo 4, os quatro dedos estão apoiados. Isso treina abertura e economia de movimento.',
  },
  {
    icon: '🧘',
    title: 'Mão e ombros relaxados',
    body: 'Aperte só o suficiente para a nota soar. Se sentir tensão ou dor, pare, solte as mãos e recomece mais devagar — aquecimento não é teste de força.',
  },
  {
    icon: '↓↑',
    title: 'Palhetada alternada',
    body: 'Baixo, cima, baixo, cima — sem repetir o sentido, inclusive na troca de corda.',
  },
];

export const TEACHER_LESSON: TeacherLesson = {
  // Ascending order: from the lowest note (string 3) to the highest (string 1).
  scalePattern: [
    { string: 3, fretOffset: 0, finger: 1 },
    { string: 3, fretOffset: 2, finger: 3 },
    { string: 3, fretOffset: 3, finger: 4 },
    { string: 2, fretOffset: 0, finger: 1 },
    { string: 2, fretOffset: 1, finger: 2 },
    { string: 2, fretOffset: 3, finger: 4 },
    { string: 1, fretOffset: 1, finger: 2 },
    { string: 1, fretOffset: 3, finger: 4 },
  ],
  scaleStartFrets: [1, 3, 5, 7, 9],
  scaleTips: [
    {
      icon: '↓↑',
      title: 'Palhetada Alternada',
      body: 'Sempre alterne baixo e cima (↓ ↑ ↓ ↑), sem repetir o sentido — inclusive ao trocar de corda.',
    },
    {
      icon: '✋',
      title: 'Economia de Movimento',
      body: 'Mantenha os dedos flutuando perto da escala, sem abrir a mão em demasia. Dedo que não está tocando fica a poucos milímetros da corda.',
    },
    {
      icon: '🎯',
      title: 'Posicionamento dos Dedos',
      body: 'Toque próximo ao traste (ferrinho) para obter um som limpo com o mínimo de esforço.',
    },
  ],
  progressions: [
    {
      id: 'em-am-dm',
      label: 'Em - Am - Dm',
      chordIds: ['Em', 'Am', 'Dm'],
      tip: {
        title: 'Acordes menores abertos',
        body: 'Foco nos acordes menores abertos. No Dm, posicione dedo 1 na 1ª corda, dedo 2 na 3ª corda e dedo 3 na 2ª corda; palhete a partir da 4ª corda solta.',
      },
    },
    {
      id: 'am-f-c-g',
      label: 'Am - F - C - G',
      chordIds: ['Am', 'F', 'C', 'G'],
      tip: {
        title: 'A pestana do F',
        body: 'Pestana no F: use a lateral óssea do indicador e o peso do braço, não a pinça do polegar. Na transição C -> Am, os dedos 1 e 2 ficam ancorados.',
      },
    },
    {
      id: 'bm-g-a',
      label: 'Bm - G - A',
      chordIds: ['Bm', 'G', 'A'],
      tip: {
        title: 'Bm e o baixo do G',
        body: 'O Bm usa a forma de Am avançada 2 casas. Ao transicionar para o G, posicione primeiro o dedo que faz o baixo na 6ª corda para não perder o compasso.',
      },
    },
    {
      id: 'bb-eb-cm-f',
      label: 'A# - D# - Cm - F',
      chordIds: ['Bb', 'Eb', 'Cm', 'F'],
      tip: {
        title: 'Resistência em pestanas',
        body: 'Treino de resistência em pestanas. Mantenha os ombros relaxados e alivie a pressão das mãos entre as repetições para evitar fadiga muscular.',
      },
    },
    {
      id: 'g-c-em-d',
      label: 'G - C - Em - D',
      chordIds: ['G', 'C', 'Em', 'D'],
      alternative: { label: 'Versão ancorada (G - Cadd9 - Em7 - D)', chordIds: ['G-anchored', 'Cadd9', 'Em7', 'D'] },
      tip: {
        title: 'Dedo âncora',
        body: 'Dica de ancoragem: fixe o dedo 3 na casa 3 da 2ª corda ao longo de toda a transição (usando Cadd9 e Em7) para dar estabilidade imediata.',
      },
    },
  ],
};
