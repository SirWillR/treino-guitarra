import { computed, effect, Injectable, signal } from '@angular/core';
import { readStored, writeStored } from '../utils/storage';

export const MIN_BPM = 40;
export const MAX_BPM = 160;

const BPM_STORAGE_KEY = 'fht.bpm';
const SCHEDULER_INTERVAL_MS = 25;
const SCHEDULE_AHEAD_S = 0.1;
const TAP_RESET_MS = 2000;
const MAX_TAPS = 5;

/**
 * Metronome on the Web Audio clock. Clicks are scheduled slightly ahead of time so their timing
 * does not depend on timer jitter; `tick` is advanced when each click is actually heard.
 */
@Injectable({ providedIn: 'root' })
export class MetronomeService {
  private readonly _bpm = signal(clampBpm(readStored(BPM_STORAGE_KEY, 80)));
  private readonly _isPlaying = signal(false);
  private readonly _tick = signal(-1);

  readonly bpm = this._bpm.asReadonly();
  readonly isPlaying = this._isPlaying.asReadonly();
  readonly beatsPerBar = signal(4);

  /** Beats elapsed since play was pressed (0-based); -1 while stopped. */
  readonly tick = this._tick.asReadonly();
  /** Beat inside the current bar, 1-based; 0 while stopped. */
  readonly currentBeat = computed(() =>
    this._tick() < 0 ? 0 : (this._tick() % this.beatsPerBar()) + 1,
  );
  /** Bars elapsed since play was pressed (0-based); -1 while stopped. */
  readonly currentBar = computed(() =>
    this._tick() < 0 ? -1 : Math.floor(this._tick() / this.beatsPerBar()),
  );

  private audio: AudioContext | null = null;
  private schedulerId: ReturnType<typeof setInterval> | null = null;
  private visualTimers: ReturnType<typeof setTimeout>[] = [];
  private nextBeatTime = 0;
  private nextBeat = 0;
  private tapTimes: number[] = [];

  constructor() {
    effect(() => writeStored(BPM_STORAGE_KEY, this._bpm()));
  }

  setBpm(bpm: number): void {
    this._bpm.set(clampBpm(bpm));
  }

  toggle(): void {
    if (this._isPlaying()) {
      this.stop();
    } else {
      this.start();
    }
  }

  start(): void {
    if (this._isPlaying()) {
      return;
    }
    // Created on a user gesture, as browsers block audio before one.
    this.audio ??= new AudioContext();
    void this.audio.resume();

    this.nextBeat = 0;
    this.nextBeatTime = this.audio.currentTime + 0.06;
    this._isPlaying.set(true);
    this.schedule();
    this.schedulerId = setInterval(() => this.schedule(), SCHEDULER_INTERVAL_MS);
  }

  stop(): void {
    if (this.schedulerId !== null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    this.visualTimers.forEach(clearTimeout);
    this.visualTimers = [];
    this._isPlaying.set(false);
    this._tick.set(-1);
  }

  /** Sets the tempo from the average interval between recent taps. */
  tap(): void {
    const now = performance.now();
    const last = this.tapTimes.at(-1);
    if (last !== undefined && now - last > TAP_RESET_MS) {
      this.tapTimes = [];
    }
    this.tapTimes = [...this.tapTimes, now].slice(-MAX_TAPS);

    if (this.tapTimes.length >= 2) {
      const span = this.tapTimes[this.tapTimes.length - 1] - this.tapTimes[0];
      this.setBpm(Math.round(60000 / (span / (this.tapTimes.length - 1))));
    }
  }

  private schedule(): void {
    const audio = this.audio;
    if (!audio) {
      return;
    }
    while (this.nextBeatTime < audio.currentTime + SCHEDULE_AHEAD_S) {
      const beat = this.nextBeat;
      const time = this.nextBeatTime;
      this.playClick(audio, time, beat % this.beatsPerBar() === 0);

      const delayMs = Math.max(0, (time - audio.currentTime) * 1000);
      this.visualTimers.push(setTimeout(() => this._tick.set(beat), delayMs));

      this.nextBeat++;
      this.nextBeatTime += 60 / this._bpm();
    }
    // Timers that already fired are the oldest ones; keep the list from growing forever.
    if (this.visualTimers.length > 32) {
      this.visualTimers = this.visualTimers.slice(-16);
    }
  }

  private playClick(audio: AudioContext, time: number, accent: boolean): void {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = accent ? 1500 : 1000;

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.35 : 0.2, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.06);
  }
}

function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) {
    return 80;
  }
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}
