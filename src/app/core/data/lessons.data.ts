import { Finger } from '../models/chord.model';
import { GuitarString } from '../models/fretboard.model';
import {
  PracticeTip,
  ScaleExerciseStep,
  TeacherLesson,
  WarmupVariation,
} from '../models/lesson.model';

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

type FrettingFinger = Exclude<Finger, 0>;

const LOW_TO_HIGH: readonly GuitarString[] = [6, 5, 4, 3, 2, 1];

/** Warm-ups keep one finger per fret: finger 1 on the starting fret, finger 4 three frets above. */
function warmupStep(string: GuitarString, finger: FrettingFinger): ScaleExerciseStep {
  return { string, fretOffset: finger - 1, finger };
}

/** The same finger order repeated on each of the given strings. */
function fingerOrderOn(
  strings: readonly GuitarString[],
  order: readonly FrettingFinger[],
): ScaleExerciseStep[] {
  return strings.flatMap((string) => order.map((finger) => warmupStep(string, finger)));
}

/** One finger per string, stepping towards the high strings; restarted from strings 6, 5 and 4. */
function diagonalSteps(): ScaleExerciseStep[] {
  return ([6, 5, 4] as const).flatMap((start) =>
    ([1, 2, 3, 4] as const).map((finger) =>
      warmupStep((start - finger + 1) as GuitarString, finger),
    ),
  );
}

/** "Spider": fingers 1 and 3 on one string, 2 and 4 on the next, for every pair of strings. */
function spiderSteps(): ScaleExerciseStep[] {
  return ([6, 5, 4, 3, 2] as const).flatMap((low) => {
    const high = (low - 1) as GuitarString;
    return [warmupStep(low, 1), warmupStep(high, 2), warmupStep(low, 3), warmupStep(high, 4)];
  });
}

/** Warm-up exercises, ordered from the basic one to the more demanding ones. */
export const WARMUP_VARIATIONS: readonly WarmupVariation[] = [
  {
    id: '1234',
    name: '1-2-3-4',
    description: 'Os quatro dedos em sequência, uma corda de cada vez, da 6ª até a 1ª.',
    focus: 'A base de tudo: abertura da mão e um dedo por casa.',
    steps: fingerOrderOn(LOW_TO_HIGH, [1, 2, 3, 4]),
  },
  {
    id: '4321',
    name: '4-3-2-1',
    description: 'O mesmo desenho de trás para frente: começa pelo mínimo em cada corda.',
    focus: 'Força e precisão do mínimo; soltar os dedos em ordem.',
    steps: fingerOrderOn(LOW_TO_HIGH, [4, 3, 2, 1]),
  },
  {
    id: '1324',
    name: '1-3-2-4',
    description: 'Dedos alternados na mesma corda: indicador, anelar, médio, mínimo.',
    focus: 'Independência entre o médio e o anelar, que gostam de andar juntos.',
    steps: fingerOrderOn(LOW_TO_HIGH, [1, 3, 2, 4]),
  },
  {
    id: '1423',
    name: '1-4-2-3',
    description: 'Primeiro os dedos das pontas (1 e 4), depois os do meio (2 e 3).',
    focus: 'Abertura da mão e controle do mínimo logo depois do indicador.',
    steps: fingerOrderOn(LOW_TO_HIGH, [1, 4, 2, 3]),
  },
  {
    id: 'diagonal',
    name: 'Diagonal',
    description:
      'Um dedo por corda, em escadinha: 1 na 6ª, 2 na 5ª, 3 na 4ª, 4 na 3ª. Depois recomece a partir da 5ª corda e da 4ª.',
    focus: 'Trocar de corda a cada nota, com a palheta acompanhando a mão esquerda.',
    steps: diagonalSteps(),
  },
  {
    id: 'spider',
    name: 'Aranha',
    description:
      'Dedos 1 e 3 numa corda, 2 e 4 na corda de baixo, alternando: 1 (6ª), 2 (5ª), 3 (6ª), 4 (5ª). Depois repita no par 5ª/4ª e siga até as cordas 2 e 1.',
    focus: 'Independência dos pares de dedos — o exercício clássico da "aranha".',
    steps: spiderSteps(),
  },
  {
    id: 'skip',
    name: 'Salto de corda',
    description: '1-2-3-4 pulando uma corda e voltando: 6ª, 4ª, 5ª, 3ª, 4ª, 2ª, 3ª, 1ª.',
    focus: 'Precisão da palhetada quando a próxima nota não está na corda vizinha.',
    steps: fingerOrderOn([6, 4, 5, 3, 4, 2, 3, 1], [1, 2, 3, 4]),
  },
];

/** General technique advice (not from the teacher's notes). */
export const WARMUP_TIPS: readonly PracticeTip[] = [
  {
    icon: '🐢',
    title: 'Devagar primeiro',
    body: 'Comece em 60 BPM, uma nota por tempo. Só aumente a velocidade quando todas as notas saírem limpas e iguais.',
  },
  {
    icon: '🪜',
    title: 'Uma variação de cada vez',
    body: 'As variações estão em ordem de dificuldade. Comece pelo 1-2-3-4 e só passe para a seguinte quando a anterior sair limpa, sem olhar para a mão.',
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
  // One octave of the major scale on strings 5, 4 and 3, starting with finger 2 on the tonic.
  // Ascending order; offsets are relative to the index finger's fret.
  scalePattern: [
    { string: 5, fretOffset: 1, finger: 2, isRoot: true },
    { string: 5, fretOffset: 3, finger: 4 },
    { string: 4, fretOffset: 0, finger: 1 },
    { string: 4, fretOffset: 1, finger: 2 },
    { string: 4, fretOffset: 3, finger: 4 },
    { string: 3, fretOffset: 0, finger: 1 },
    { string: 3, fretOffset: 2, finger: 3 },
    { string: 3, fretOffset: 3, finger: 4, isRoot: true },
  ],
  scaleStartFrets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
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
