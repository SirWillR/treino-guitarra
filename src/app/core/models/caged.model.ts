import { PerString } from './chord.model';
import { GuitarString } from './fretboard.model';
import { TriadQuality } from './note.model';

export const CAGED_SHAPE_NAMES = ['C', 'A', 'G', 'E', 'D'] as const;

export type CagedShapeName = (typeof CAGED_SHAPE_NAMES)[number];

export interface CagedShape {
  name: CagedShapeName;
  quality: TriadQuality;
  /** Fret offsets from the shape's "nut", string 6 to string 1; null = not played. */
  offsets: PerString<number | null>;
  /** Lowest string holding the root, the one used to anchor the shape. */
  rootString: GuitarString;
  rootOffset: number;
}

export interface CagedAnchor {
  string: GuitarString;
  fret: number;
  /** Fret where the shape's "nut" (barre) sits. */
  baseFret: number;
}
