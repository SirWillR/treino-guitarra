import { PracticeTip, StrumStroke, StrummingPattern } from '../models/lesson.model';

/** Compact notation for a bar: "D" down, "U" up, "-" hand passing without hitting. */
function strokes(notation: string): StrumStroke[] {
  const map: Record<string, StrumStroke> = { D: 'down', U: 'up', '-': 'ghost' };
  return notation.split(' ').map((symbol) => map[symbol]);
}

/** Strumming patterns, ordered from the simplest to the more demanding ones. */
export const STRUMMING_PATTERNS: readonly StrummingPattern[] = [
  {
    id: 'quarters',
    name: 'Só para baixo',
    strokes: strokes('D - D - D - D -'),
    description: 'Uma batida para baixo em cada tempo, contando "1, 2, 3, 4".',
    focus: 'Ficar no tempo e trocar de acorde sem parar a mão.',
  },
  {
    id: 'eighths',
    name: 'Colcheias',
    strokes: strokes('D U D U D U D U'),
    description: 'Baixo no número, cima no "e": a mão nunca para.',
    focus: 'O movimento de pêndulo, base de todas as outras batidas.',
  },
  {
    id: 'ballad',
    name: 'Balada',
    strokes: strokes('D - D - D U D U'),
    description: 'Dois tempos só para baixo e a segunda metade em colcheias.',
    focus: 'Passar de semínimas para colcheias dentro do mesmo compasso.',
  },
  {
    id: 'pop-folk',
    name: 'Pop / folk',
    strokes: strokes('D - D U - U D U'),
    description:
      '"Baixo, baixo-cima, cima-baixo-cima". No 3 a mão desce no ar, sem tocar, e volta tocando para cima.',
    focus: 'A batida mais usada no pop e no violão: manter o pêndulo mesmo sem tocar.',
  },
  {
    id: 'pop-2',
    name: 'Pop 2',
    strokes: strokes('D - D U D - D U'),
    description: 'A mesma ideia repetida a cada metade do compasso: "baixo, baixo-cima".',
    focus: 'Ritmo de rock e pop nacional; bom para acentuar o 2 e o 4.',
  },
  {
    id: 'offbeat',
    name: 'Contratempo',
    strokes: strokes('- U - U - U - U'),
    description: 'Só os "e" soam: a mão desce no ar no número e toca na subida.',
    focus: 'Sentir o tempo sem tocar nele — a levada do reggae e do ska.',
  },
];

/** Chords to strum along with, changing every bar. */
export const RHYTHM_CHORD_SEQUENCES: readonly { label: string; chordIds: readonly string[] }[] = [
  { label: 'Em', chordIds: ['Em'] },
  { label: 'G ↔ C', chordIds: ['G', 'C'] },
  { label: 'Am ↔ E', chordIds: ['Am', 'E'] },
  { label: 'G → D → Em → C', chordIds: ['G', 'D', 'Em', 'C'] },
];

/** General strumming advice (not from the teacher's notes). */
export const RHYTHM_TIPS: readonly PracticeTip[] = [
  {
    icon: '↕',
    title: 'Mão como pêndulo',
    body: 'A mão desce em todo número e sobe em todo "e", tocando ou não. O padrão só decide quando ela encosta nas cordas.',
  },
  {
    icon: '🗣️',
    title: 'Conte em voz alta',
    body: 'Fale "1 e 2 e 3 e 4 e" enquanto toca. Parece bobo, mas é o jeito mais rápido de a batida entrar no corpo.',
  },
  {
    icon: '🐢',
    title: 'Comece devagar',
    body: 'Comece em 60 BPM. Só suba quando conseguir tocar 4 compassos seguidos sem parar e sem errar a direção.',
  },
  {
    icon: '🤲',
    title: 'Pulso solto',
    body: 'O movimento vem do pulso, não do braço inteiro. Segure a palheta firme o bastante para não cair, mas sem apertar.',
  },
  {
    icon: '🎯',
    title: 'Depois: acento',
    body: 'Quando a batida estiver automática, toque mais forte no 2 e no 4. É isso que dá o "balanço".',
  },
];
