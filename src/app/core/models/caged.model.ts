import { PerString } from './chord.model';
import { FretMarker, FretPosition, GuitarString } from './fretboard.model';
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

/** One place on the neck where a shape fits. */
export interface CagedInstance {
  baseFret: number;
  /** The root on the shape's lowest root string: where the hand anchors. */
  anchor: FretPosition;
  markers: FretMarker[];
}

/** A shape as a stop on the way up the neck. */
export interface CagedNeckStop {
  shape: CagedShapeName;
  baseFret: number;
  lowestFret: number;
  highestFret: number;
}

/** Ways of playing a reduced shape, as in the lesson: full, power chord, top strings, root + third. */
export type VoicingStyle = 'full' | 'rock' | 'groove' | 'worship';
