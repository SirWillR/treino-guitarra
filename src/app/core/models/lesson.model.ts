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
  /** 0 = open string. */
  finger: Finger;
  /** Tonic of the scale, drawn with emphasis. */
  isRoot?: boolean;
}

export interface WarmupVariation {
  id: string;
  name: string;
  /** How it is played. */
  description: string;
  /** What it trains. */
  focus: string;
  /** Notes in playing order; `fretOffset` is relative to the index finger's fret. */
  steps: readonly ScaleExerciseStep[];
}

export interface ScalePosition {
  /** Notes in ascending order; `fretOffset` holds absolute frets. */
  steps: ScaleExerciseStep[];
  lowestFret: number;
  highestFret: number;
}

export interface ChordProgression {
  id: string;
  label: string;
  chordIds: readonly string[];
  /** Easier fingering of the same progression, when the tip suggests one. */
  alternative?: { label: string; chordIds: readonly string[] };
  tip: PracticeTip;
}

/** A strum on one eighth note; `ghost` is the hand passing in the air without hitting the strings. */
export type StrumStroke = 'down' | 'up' | 'ghost';

export interface StrummingPattern {
  id: string;
  name: string;
  /** One bar of 4/4 in eighth notes: 1 e 2 e 3 e 4 e. */
  strokes: readonly StrumStroke[];
  description: string;
  /** What it trains. */
  focus: string;
}

export interface TeacherLesson {
  scalePattern: readonly ScaleExerciseStep[];
  scaleStartFrets: readonly number[];
  scaleTips: readonly PracticeTip[];
  progressions: readonly ChordProgression[];
}
