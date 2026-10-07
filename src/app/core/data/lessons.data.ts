import { TeacherLesson } from '../models/lesson.model';

export const FINGER_NAMES: Record<1 | 2 | 3 | 4, string> = {
  1: 'Indicador',
  2: 'Médio',
  3: 'Anelar',
  4: 'Mínimo',
};

export const FINGER_COLORS: Record<1 | 2 | 3 | 4, string> = {
  1: '#38bdf8',
  2: '#34d399',
  3: '#fbbf24',
  4: '#f472b6',
};

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
