import { Finger } from './chord.model';
import { GuitarString } from './fretboard.model';

export interface PracticeTip {
  title: string;
  body: string;
  icon?: string;
}

export interface ScaleExerciseStep {
  string: GuitarString;
  /** Frets above the starting position (0 = the starting fret itself). */
  fretOffset: number;
  finger: Exclude<Finger, 0>;
}

export interface ChordProgression {
  id: string;
  label: string;
  chordIds: readonly string[];
  /** Easier fingering of the same progression, when the tip suggests one. */
  alternative?: { label: string; chordIds: readonly string[] };
  tip: PracticeTip;
}

export interface TeacherLesson {
  scalePattern: readonly ScaleExerciseStep[];
  scaleStartFrets: readonly number[];
  scaleTips: readonly PracticeTip[];
  progressions: readonly ChordProgression[];
}
