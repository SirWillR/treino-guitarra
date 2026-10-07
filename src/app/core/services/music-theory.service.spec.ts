import { CHORDS } from '../data/chords.data';
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
