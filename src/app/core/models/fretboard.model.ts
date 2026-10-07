/** String number as guitarists count it: 1 = high E, 6 = low E. */
export type GuitarString = 1 | 2 | 3 | 4 | 5 | 6;

export const ALL_STRINGS: readonly GuitarString[] = [1, 2, 3, 4, 5, 6];

export interface FretPosition {
  string: GuitarString;
  /** 0 = open string. */
  fret: number;
}

export interface FretMarker extends FretPosition {
  label?: string;
  color?: string;
  isRoot?: boolean;
  /** Dimmed marker, used for context around the main shape. */
  ghost?: boolean;
  /** Pulsing marker, used by step players. */
  active?: boolean;
}
