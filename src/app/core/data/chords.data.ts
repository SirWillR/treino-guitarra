import { Chord, ChordGroup } from '../models/chord.model';

/** Frets and fingers are listed from string 6 (low E) to string 1 (high E). */
export const CHORDS: readonly Chord[] = [
  // Major
  { id: 'C', name: 'C', root: 'C', quality: 'major', group: 'major', frets: ['x', 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1 },
  { id: 'D', name: 'D', root: 'D', quality: 'major', group: 'major', frets: ['x', 'x', 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], baseFret: 1 },
  { id: 'E', name: 'E', root: 'E', quality: 'major', group: 'major', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], baseFret: 1 },
  { id: 'G', name: 'G', root: 'G', quality: 'major', group: 'major', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], baseFret: 1 },
  { id: 'A', name: 'A', root: 'A', quality: 'major', group: 'major', frets: ['x', 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], baseFret: 1 },

  // Minor
  { id: 'Am', name: 'Am', root: 'A', quality: 'minor', group: 'minor', frets: ['x', 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], baseFret: 1 },
  { id: 'Dm', name: 'Dm', root: 'D', quality: 'minor', group: 'minor', frets: ['x', 'x', 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], baseFret: 1 },
  { id: 'Em', name: 'Em', root: 'E', quality: 'minor', group: 'minor', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], baseFret: 1 },

  // Dominant
  { id: 'C7', name: 'C7', root: 'C', quality: 'dominant7', group: 'dominant', frets: ['x', 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], baseFret: 1 },
  { id: 'D7', name: 'D7', root: 'D', quality: 'dominant7', group: 'dominant', frets: ['x', 'x', 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], baseFret: 1 },
  { id: 'E7', name: 'E7', root: 'E', quality: 'dominant7', group: 'dominant', frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], baseFret: 1 },
  { id: 'G7', name: 'G7', root: 'G', quality: 'dominant7', group: 'dominant', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], baseFret: 1 },
  { id: 'A7', name: 'A7', root: 'A', quality: 'dominant7', group: 'dominant', frets: ['x', 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], baseFret: 1 },

  // Barre chords and variations used by the lesson progressions
  { id: 'F', name: 'F', root: 'F', quality: 'major', group: 'extra', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 1, lowString: 6, highString: 1 }, baseFret: 1 },
  { id: 'Bm', name: 'Bm', root: 'B', quality: 'minor', group: 'extra', frets: ['x', 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 2, lowString: 5, highString: 1 }, baseFret: 2 },
  { id: 'Bb', name: 'A# (Bb)', root: 'A#', quality: 'major', group: 'extra', frets: ['x', 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], barre: { fret: 1, lowString: 5, highString: 1 }, baseFret: 1 },
  { id: 'Eb', name: 'D# (Eb)', root: 'D#', quality: 'major', group: 'extra', frets: ['x', 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1], barre: { fret: 6, lowString: 5, highString: 1 }, baseFret: 6 },
  { id: 'Cm', name: 'Cm', root: 'C', quality: 'minor', group: 'extra', frets: ['x', 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 3, lowString: 5, highString: 1 }, baseFret: 3 },
  { id: 'G-anchored', name: 'G', root: 'G', quality: 'major', group: 'extra', frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4], baseFret: 1 },
  { id: 'Cadd9', name: 'Cadd9', root: 'C', quality: 'add9', group: 'extra', frets: ['x', 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4], baseFret: 1 },
  { id: 'Em7', name: 'Em7', root: 'E', quality: 'minor7', group: 'extra', frets: [0, 2, 2, 0, 3, 3], fingers: [0, 1, 2, 0, 3, 4], baseFret: 1 },
];

export const CHORD_GROUPS: readonly { group: ChordGroup; label: string }[] = [
  { group: 'major', label: 'Maiores' },
  { group: 'minor', label: 'Menores' },
  { group: 'dominant', label: 'Dominantes' },
  { group: 'extra', label: 'Pestanas & extras' },
];

const CHORDS_BY_ID = new Map(CHORDS.map((chord) => [chord.id, chord]));

export function chordById(id: string): Chord {
  const chord = CHORDS_BY_ID.get(id);
  if (!chord) {
    throw new Error(`Unknown chord id: ${id}`);
  }
  return chord;
}
