import { Injectable } from '@angular/core';
import { CAGED_SHAPES } from '../data/caged-shapes.data';
import { CagedAnchor, CagedShape, CagedShapeName } from '../models/caged.model';
import { Chord } from '../models/chord.model';
import { ALL_STRINGS, FretMarker, FretPosition, GuitarString } from '../models/fretboard.model';
import {
  ChordQuality,
  Interval,
  INTERVAL_COLORS,
  NOTE_NAMES,
  NoteName,
  TriadQuality,
} from '../models/note.model';
import {
  STRING_SET_STRINGS,
  StringSet,
  TriadInversion,
  TriadVoicing,
} from '../models/triad.model';

/** MIDI numbers of the open strings in standard tuning (E A D G B E). */
const OPEN_STRING_MIDI: Record<GuitarString, number> = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };

const INTERVAL_SEMITONES: Record<Interval, number> = { R: 0, '9': 2, b3: 3, '3': 4, '5': 7, b7: 10 };

const CHORD_FORMULAS: Record<ChordQuality, readonly Interval[]> = {
  major: ['R', '3', '5'],
  minor: ['R', 'b3', '5'],
  dominant7: ['R', '3', '5', 'b7'],
  minor7: ['R', 'b3', '5', 'b7'],
  add9: ['R', '3', '5', '9'],
};

const INVERSIONS: readonly TriadInversion[] = ['root', 'first', 'second'];

export const MAX_FRET = 15;

@Injectable({ providedIn: 'root' })
export class MusicTheoryService {
  pitchClass(note: NoteName): number {
    return NOTE_NAMES.indexOf(note);
  }

  transpose(note: NoteName, semitones: number): NoteName {
    return NOTE_NAMES[mod12(this.pitchClass(note) + semitones)];
  }

  noteAt(string: GuitarString, fret: number): NoteName {
    return NOTE_NAMES[mod12(OPEN_STRING_MIDI[string] + fret)];
  }

  /** Lowest fret (0-11) where the note is found on the given string. */
  fretOf(note: NoteName, string: GuitarString): number {
    return mod12(this.pitchClass(note) - OPEN_STRING_MIDI[string]);
  }

  positionsOf(
    note: NoteName,
    maxFret = MAX_FRET,
    strings: readonly GuitarString[] = ALL_STRINGS,
  ): FretPosition[] {
    const positions: FretPosition[] = [];
    for (const string of strings) {
      for (let fret = this.fretOf(note, string); fret <= maxFret; fret += 12) {
        positions.push({ string, fret });
      }
    }
    return positions;
  }

  /** Function of `note` relative to `root`, or null when it is not a chord tone we label. */
  intervalOf(root: NoteName, note: NoteName): Interval | null {
    const semitones = mod12(this.pitchClass(note) - this.pitchClass(root));
    const match = (Object.keys(INTERVAL_SEMITONES) as Interval[]).find(
      (interval) => INTERVAL_SEMITONES[interval] === semitones,
    );
    return match ?? null;
  }

  chordFormula(quality: ChordQuality): readonly Interval[] {
    return CHORD_FORMULAS[quality];
  }

  chordTones(root: NoteName, quality: ChordQuality): NoteName[] {
    return CHORD_FORMULAS[quality].map((interval) =>
      this.transpose(root, INTERVAL_SEMITONES[interval]),
    );
  }

  /** Notes that actually sound in a chord diagram, from string 6 to string 1. */
  chordNotes(chord: Chord): NoteName[] {
    const notes: NoteName[] = [];
    chord.frets.forEach((fret, index) => {
      if (fret !== 'x') {
        notes.push(this.noteAt((6 - index) as GuitarString, fret));
      }
    });
    return notes;
  }

  cagedShape(name: CagedShapeName, quality: TriadQuality): CagedShape {
    const shape = CAGED_SHAPES.find((s) => s.name === name && s.quality === quality);
    if (!shape) {
      throw new Error(`Unknown CAGED shape: ${name} ${quality}`);
    }
    return shape;
  }

  /** Where the shape is anchored for a given root: the root on its lowest string. */
  cagedAnchor(root: NoteName, quality: TriadQuality, shapeName: CagedShapeName): CagedAnchor {
    const shape = this.cagedShape(shapeName, quality);
    let baseFret = this.fretOf(root, shape.rootString) - shape.rootOffset;
    if (baseFret < 0) {
      baseFret += 12;
    }
    return { string: shape.rootString, fret: baseFret + shape.rootOffset, baseFret };
  }

  cagedVoicing(root: NoteName, quality: TriadQuality, shapeName: CagedShapeName): FretMarker[] {
    const shape = this.cagedShape(shapeName, quality);
    const { baseFret } = this.cagedAnchor(root, quality, shapeName);
    const markers: FretMarker[] = [];

    shape.offsets.forEach((offset, index) => {
      if (offset === null) {
        return;
      }
      const string = (6 - index) as GuitarString;
      const fret = baseFret + offset;
      const interval = this.intervalOf(root, this.noteAt(string, fret));
      if (interval) {
        markers.push(this.intervalMarker(string, fret, interval));
      }
    });
    return markers;
  }

  /**
   * Close-position triads on three adjacent strings, every inversion that fits on the neck,
   * ordered from the nut upwards so stepping through the list walks up the fretboard.
   */
  triadVoicings(root: NoteName, quality: TriadQuality, stringSet: StringSet): TriadVoicing[] {
    const strings = STRING_SET_STRINGS[stringSet];
    const tones = CHORD_FORMULAS[quality];
    const voicings: TriadVoicing[] = [];

    INVERSIONS.forEach((inversion, rotation) => {
      const formula = [...tones.slice(rotation), ...tones.slice(0, rotation)];
      let frets = this.closeVoicingFrets(root, formula, strings);
      if (Math.min(...frets) < 0) {
        frets = frets.map((fret) => fret + 12);
      }
      for (; Math.max(...frets) <= MAX_FRET; frets = frets.map((fret) => fret + 12)) {
        voicings.push({
          inversion,
          formula,
          markers: frets.map((fret, i) => this.intervalMarker(strings[i], fret, formula[i])),
          lowestFret: Math.min(...frets),
        });
      }
    });

    return voicings.sort((a, b) => a.lowestFret - b.lowestFret);
  }

  /** Frets for chord tones stacked upwards from the lowest string; may be negative. */
  private closeVoicingFrets(
    root: NoteName,
    formula: readonly Interval[],
    strings: readonly GuitarString[],
  ): number[] {
    const rootPitchClass = this.pitchClass(root);
    const frets: number[] = [];
    let previousPitch = 0;

    formula.forEach((interval, i) => {
      const pitchClass = mod12(rootPitchClass + INTERVAL_SEMITONES[interval]);
      const open = OPEN_STRING_MIDI[strings[i]];
      // Bass note: lowest fret on its string. Others: nearest pitch above the previous tone.
      const pitch =
        i === 0
          ? open + mod12(pitchClass - open)
          : previousPitch + (mod12(pitchClass - previousPitch) || 12);
      frets.push(pitch - open);
      previousPitch = pitch;
    });
    return frets;
  }

  private intervalMarker(string: GuitarString, fret: number, interval: Interval): FretMarker {
    return {
      string,
      fret,
      label: interval,
      color: INTERVAL_COLORS[interval],
      isRoot: interval === 'R',
    };
  }
}

function mod12(value: number): number {
  return ((value % 12) + 12) % 12;
}
