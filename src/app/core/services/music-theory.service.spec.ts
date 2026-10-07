import { CHORDS } from '../data/chords.data';
import { TEACHER_LESSON, WARMUP_VARIATIONS } from '../data/lessons.data';
import { CAGED_SHAPE_NAMES } from '../models/caged.model';
import { NOTE_NAMES } from '../models/note.model';
import { STRING_SETS } from '../models/triad.model';
import { MAX_FRET, MusicTheoryService } from './music-theory.service';

describe('MusicTheoryService', () => {
  const theory = new MusicTheoryService();

  it('names notes in standard tuning', () => {
    expect([6, 5, 4, 3, 2, 1].map((s) => theory.noteAt(s as 1, 0))).toEqual([
      'E', 'A', 'D', 'G', 'B', 'E',
    ]);
    expect(theory.noteAt(5, 3)).toBe('C');
    expect(theory.noteAt(1, 12)).toBe('E');
    expect(theory.noteAt(3, 4)).toBe('B');
  });

  it('finds every position of a note', () => {
    const positions = theory.positionsOf('C', 12);
    expect(positions).toHaveLength(6);
    expect(positions).toContainEqual({ string: 5, fret: 3 });
    expect(positions).toContainEqual({ string: 6, fret: 8 });
    expect(positions.every((p) => theory.noteAt(p.string, p.fret) === 'C')).toBe(true);
  });

  it('builds chord tones', () => {
    expect(theory.chordTones('C', 'major')).toEqual(['C', 'E', 'G']);
    expect(theory.chordTones('A', 'minor')).toEqual(['A', 'C', 'E']);
    expect(theory.chordTones('G', 'dominant7')).toEqual(['G', 'B', 'D', 'F']);
  });

  it('only sounds chord tones in every chord diagram, with the root in the bass', () => {
    for (const chord of CHORDS) {
      const tones = theory.chordTones(chord.root, chord.quality);
      const notes = theory.chordNotes(chord);
      expect(notes.every((note) => tones.includes(note)), chord.id).toBe(true);
      // The fifth may be omitted (open C7 has none); every other tone must be present.
      const fifth = theory.transpose(chord.root, 7);
      const required = tones.filter((tone) => tone !== fifth);
      expect(required.every((tone) => notes.includes(tone)), chord.id).toBe(true);
      expect(notes[0], chord.id).toBe(chord.root);
    }
  });

  it('keeps fingers and frets consistent in every chord diagram', () => {
    for (const chord of CHORDS) {
      chord.frets.forEach((fret, i) => {
        const fretted = fret !== 'x' && fret > 0;
        expect(chord.fingers[i] > 0, `${chord.id} string ${6 - i}`).toBe(fretted);
        if (fretted) {
          expect(fret).toBeGreaterThanOrEqual(chord.baseFret);
          expect(fret).toBeLessThan(chord.baseFret + 5);
        }
      });
    }
  });

  it('places the E shape of C major as a barre at fret 8', () => {
    const markers = theory.cagedVoicing('C', 'major', 'E');
    expect(theory.cagedAnchor('C', 'major', 'E')).toEqual({ string: 6, fret: 8, baseFret: 8 });
    expect(markers.map((m) => m.fret)).toEqual([8, 10, 10, 9, 8, 8]);
    expect(markers.filter((m) => m.isRoot).map((m) => m.string)).toEqual([6, 4, 1]);
  });

  it('builds every CAGED shape from chord tones only, within the neck', () => {
    for (const root of NOTE_NAMES) {
      for (const quality of ['major', 'minor'] as const) {
        const tones = theory.chordTones(root, quality);
        for (const shape of CAGED_SHAPE_NAMES) {
          const markers = theory.cagedVoicing(root, quality, shape);
          const notes = markers.map((m) => theory.noteAt(m.string, m.fret));
          const label = `${root} ${quality} shape ${shape}`;
          expect(notes.every((note) => tones.includes(note)), label).toBe(true);
          expect(tones.every((tone) => notes.includes(tone)), label).toBe(true);
          expect(markers.every((m) => m.fret >= 0 && m.fret <= MAX_FRET), label).toBe(true);
          const anchor = theory.cagedAnchor(root, quality, shape);
          expect(theory.noteAt(anchor.string, anchor.fret), label).toBe(root);
        }
      }
    }
  });

  it('lays out G major in the familiar second-position fingering', () => {
    const first = theory.majorScalePositions('G')[0];
    const onString = (string: number) =>
      first.steps.filter((s) => s.string === string).map((s) => [s.fretOffset, s.finger]);

    expect(onString(6)).toEqual([[2, 1], [3, 2], [5, 4]]);
    expect(onString(4)).toEqual([[2, 1], [4, 3], [5, 4]]);
    expect(onString(2)).toEqual([[3, 2], [5, 4]]);
    expect(first.steps.filter((s) => s.isRoot).map((s) => s.string)).toEqual([6, 4, 1]);
  });

  it('builds five gap-free, playable major scale positions in every key', () => {
    const openMidi: Record<number, number> = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };

    for (const root of NOTE_NAMES) {
      const scale = theory.majorScale(root);
      const positions = theory.majorScalePositions(root);
      expect(positions, root).toHaveLength(5);

      positions.forEach((position, p) => {
        const label = `${root} position ${p + 1}`;
        const notes = position.steps.map((s) => theory.noteAt(s.string, s.fretOffset));
        const pitches = position.steps.map((s) => openMidi[s.string] + s.fretOffset);

        expect(position.lowestFret, label).toBeGreaterThanOrEqual(0);
        expect(position.highestFret, label).toBeLessThanOrEqual(MAX_FRET);
        expect(position.highestFret - position.lowestFret, label).toBeLessThanOrEqual(4);

        // Ascending, and each note is the next degree of the scale: nothing skipped or repeated.
        notes.forEach((note, i) => {
          expect(scale, label).toContain(note);
          if (i > 0) {
            expect(pitches[i], label).toBeGreaterThan(pitches[i - 1]);
            expect(scale.indexOf(note), label).toBe((scale.indexOf(notes[i - 1]) + 1) % 7);
          }
        });

        // Fingers follow the frets: a higher fret takes a higher finger, without over-stretching.
        for (const string of [1, 2, 3, 4, 5, 6]) {
          const onString = position.steps.filter((s) => s.string === string && s.fretOffset > 0);
          onString.forEach((step, i) => {
            expect(step.finger, label).toBeGreaterThanOrEqual(1);
            expect(step.finger, label).toBeLessThanOrEqual(4);
            if (i > 0) {
              const fretGap = step.fretOffset - onString[i - 1].fretOffset;
              const fingerGap = step.finger - onString[i - 1].finger;
              expect(fingerGap, label).toBeGreaterThanOrEqual(1);
              expect(fingerGap, label).toBeLessThanOrEqual(fretGap);
            }
          });
        }
        const open = position.steps.filter((s) => s.fretOffset === 0);
        expect(open.every((s) => s.finger === 0), label).toBe(true);
      });
    }
  });

  it("plays one octave of the major scale with the teacher's pattern", () => {
    const notesFrom = (startFret: number) =>
      TEACHER_LESSON.scalePattern.map((s) => theory.noteAt(s.string, startFret + s.fretOffset));

    expect(notesFrom(2)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']);
    expect(TEACHER_LESSON.scalePattern[0]).toMatchObject({ string: 5, finger: 2, isRoot: true });
    for (const startFret of TEACHER_LESSON.scaleStartFrets) {
      const notes = notesFrom(startFret);
      expect(notes.slice(0, 7), `start ${startFret}`).toEqual(theory.majorScale(notes[0]));
    }
  });

  it('keeps one finger per fret in every warm-up variation', () => {
    const sequence = (id: string) =>
      WARMUP_VARIATIONS.find((v) => v.id === id)!.steps.map((s) => `${s.finger}@${s.string}`);

    for (const variation of WARMUP_VARIATIONS) {
      expect(new Set(variation.steps.map((s) => s.finger)), variation.id).toEqual(new Set([1, 2, 3, 4]));
      for (const step of variation.steps) {
        expect(step.fretOffset, variation.id).toBe(step.finger - 1);
        expect(step.string, variation.id).toBeGreaterThanOrEqual(1);
        expect(step.string, variation.id).toBeLessThanOrEqual(6);
      }
    }
    expect(sequence('diagonal').slice(0, 8)).toEqual([
      '1@6', '2@5', '3@4', '4@3', '1@5', '2@4', '3@3', '4@2',
    ]);
    expect(sequence('spider').slice(0, 8)).toEqual([
      '1@6', '2@5', '3@6', '4@5', '1@5', '2@4', '3@5', '4@4',
    ]);
    expect(sequence('1324').slice(0, 4)).toEqual(['1@6', '3@6', '2@6', '4@6']);
  });

  it('maps the three inversions of C major on strings 1-2-3', () => {
    const voicings = theory.triadVoicings('C', 'major', '1-2-3');
    const frets = (inversion: string) =>
      voicings.filter((v) => v.inversion === inversion).map((v) => v.markers.map((m) => m.fret));

    // Frets listed from string 3 to string 1.
    expect(frets('root')).toEqual([[5, 5, 3]]);
    expect(frets('first')).toEqual([[9, 8, 8]]);
    expect(frets('second')).toEqual([[0, 1, 0], [12, 13, 12]]);
    expect(voicings.map((v) => v.lowestFret)).toEqual([0, 3, 8, 12]);
  });

  it('builds playable close triads for every root, quality and string set', () => {
    for (const root of NOTE_NAMES) {
      for (const quality of ['major', 'minor'] as const) {
        const tones = theory.chordTones(root, quality);
        for (const stringSet of STRING_SETS) {
          const voicings = theory.triadVoicings(root, quality, stringSet);
          const label = `${root} ${quality} ${stringSet}`;
          expect(new Set(voicings.map((v) => v.inversion)).size, label).toBe(3);

          for (const voicing of voicings) {
            const notes = voicing.markers.map((m) => theory.noteAt(m.string, m.fret));
            const fretSpan = voicing.markers.map((m) => m.fret);
            expect([...notes].sort(), label).toEqual([...tones].sort());
            expect(Math.max(...fretSpan) - Math.min(...fretSpan), label).toBeLessThanOrEqual(3);
            voicing.markers.forEach((m, i) => {
              expect(theory.intervalOf(root, notes[i]), label).toBe(voicing.formula[i]);
              expect(m.label, label).toBe(voicing.formula[i]);
            });
          }
        }
      }
    }
  });
});
