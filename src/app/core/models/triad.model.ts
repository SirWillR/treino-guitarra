import { FretMarker, GuitarString } from './fretboard.model';
import { Interval } from './note.model';

export const STRING_SETS = ['1-2-3', '2-3-4', '3-4-5'] as const;

export type StringSet = (typeof STRING_SETS)[number];

/** Strings of each set, from the lowest-pitched to the highest. */
export const STRING_SET_STRINGS: Record<StringSet, readonly [GuitarString, GuitarString, GuitarString]> = {
  '1-2-3': [3, 2, 1],
  '2-3-4': [4, 3, 2],
  '3-4-5': [5, 4, 3],
};

export type TriadInversion = 'root' | 'first' | 'second';

export interface TriadVoicing {
  inversion: TriadInversion;
  /** Chord tones from the lowest string to the highest, e.g. ['3', '5', 'R']. */
  formula: readonly Interval[];
  markers: FretMarker[];
  lowestFret: number;
}

export const INVERSION_NAMES: Record<TriadInversion, string> = {
  root: 'Posição Fundamental',
  first: '1ª Inversão',
  second: '2ª Inversão',
};
