import { PerString } from '../models/chord.model';

export interface ScalePositionTemplate {
  /** Offset where the index finger normally sits. */
  baseOffset: number;
  /** Fret offsets from the root's fret on string 6, listed from string 6 to string 1. */
  offsets: PerString<readonly number[]>;
}

/**
 * The five standard major-scale fingerings (one per CAGED shape, in the order E, D, C, A, G).
 * Together they cover twelve frets, so chaining them walks the whole neck.
 */
export const MAJOR_SCALE_POSITIONS: readonly ScalePositionTemplate[] = [
  { baseOffset: -1, offsets: [[-1, 0, 2], [-1, 0, 2], [-1, 1, 2], [-1, 1, 2], [0, 2], [-1, 0, 2]] },
  { baseOffset: 2, offsets: [[2, 4, 5], [2, 4], [1, 2, 4], [1, 2, 4], [2, 4, 5], [2, 4, 5]] },
  { baseOffset: 4, offsets: [[4, 5, 7], [4, 6, 7], [4, 6, 7], [4, 6], [4, 5, 7], [4, 5, 7]] },
  { baseOffset: 6, offsets: [[7, 9], [6, 7, 9], [6, 7, 9], [6, 8, 9], [7, 9, 10], [7, 9]] },
  { baseOffset: 9, offsets: [[9, 11, 12], [9, 11, 12], [9, 11], [8, 9, 11], [9, 10, 12], [9, 11, 12]] },
];
