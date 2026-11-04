import { TestBed } from '@angular/core/testing';
import { chordById } from '../data/chords.data';
import { RHYTHM_CHORD_SEQUENCES, STRUMMING_PATTERNS } from '../data/rhythm.data';
import { MetronomeService } from './metronome.service';

/** Minimal Web Audio stand-in: time follows the (fake) clock and every click is recorded. */
class FakeAudioContext {
  static clicks: number[] = [];
  readonly destination = {};
  private readonly startedAt = Date.now();

  get currentTime(): number {
    return (Date.now() - this.startedAt) / 1000;
  }

  resume(): Promise<void> {
    return Promise.resolve();
  }

  createOscillator() {
    return {
      type: 'square',
      frequency: { value: 0 },
      connect: (node: unknown) => node,
      start: () => undefined,
      stop: () => undefined,
    };
  }

  createGain() {
    const ramp = () => undefined;
    return {
      gain: { setValueAtTime: ramp, exponentialRampToValueAtTime: ramp },
      connect: (node: unknown) => {
        FakeAudioContext.clicks.push(Date.now());
        return node;
      },
    };
  }
}

describe('MetronomeService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('AudioContext', FakeAudioContext);
    FakeAudioContext.clicks = [];
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('counts eighth notes, with beats on the even ones', () => {
    const metronome = TestBed.inject(MetronomeService);
    metronome.setBpm(60);
    metronome.start();

    // At 60 BPM a beat lasts 1 s and an eighth note 0.5 s.
    vi.advanceTimersByTime(1600);
    expect(metronome.eighth()).toBe(3);
    expect(metronome.tick()).toBe(1);
    expect(metronome.currentBeat()).toBe(2);

    metronome.stop();
    expect(metronome.eighth()).toBe(-1);
    expect(metronome.tick()).toBe(-1);
  });

  it('clicks on the "and" only when asked', () => {
    const metronome = TestBed.inject(MetronomeService);
    metronome.setBpm(60);
    metronome.start();
    vi.advanceTimersByTime(3900);
    const beatsOnly = FakeAudioContext.clicks.length;
    metronome.stop();

    FakeAudioContext.clicks = [];
    metronome.clickEighths.set(true);
    metronome.start();
    vi.advanceTimersByTime(3900);
    expect(FakeAudioContext.clicks.length).toBe(beatsOnly * 2);
    metronome.stop();
  });
});

describe('STRUMMING_PATTERNS', () => {
  it('fill one bar of eighth notes with the hand moving like a pendulum', () => {
    for (const pattern of STRUMMING_PATTERNS) {
      expect(pattern.strokes, pattern.id).toHaveLength(8);
      pattern.strokes.forEach((stroke, i) => {
        // Down on the numbers, up on the "and": a pattern only chooses which strokes sound.
        expect(stroke, `${pattern.id} #${i}`).not.toBe(i % 2 === 0 ? 'up' : 'down');
      });
    }
  });

  it('uses chords that exist', () => {
    for (const sequence of RHYTHM_CHORD_SEQUENCES) {
      sequence.chordIds.forEach((id) => expect(chordById(id), id).toBeTruthy());
    }
  });
});
