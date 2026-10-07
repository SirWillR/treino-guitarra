import { GuitarString } from './fretboard.model';
import { ChordQuality, NoteName } from './note.model';

export type ChordFret = number | 'x';

export type Finger = 0 | 1 | 2 | 3 | 4;

/** Six values ordered from string 6 (low E) to string 1 (high E). */
export type PerString<T> = readonly [T, T, T, T, T, T];

export interface Barre {
  fret: number;
  /** Lowest-pitched string covered by the barre (e.g. 6). */
  lowString: GuitarString;
  /** Highest-pitched string covered by the barre (e.g. 1). */
  highString: GuitarString;
}

export type ChordGroup = 'major' | 'minor' | 'dominant' | 'extra';

export interface Chord {
  id: string;
  name: string;
  root: NoteName;
  quality: ChordQuality;
  group: ChordGroup;
  /** Absolute frets; 0 = open, 'x' = muted. */
  frets: PerString<ChordFret>;
  /** 0 = no finger (open or muted string). */
  fingers: PerString<Finger>;
  barre?: Barre;
  /** First fret shown in the diagram (1 = at the nut). */
  baseFret: number;
}
