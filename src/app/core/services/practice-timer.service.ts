import { computed, Injectable, signal } from '@angular/core';
import { ROUTINE_BLOCKS, ROUTINE_TOTAL_MINUTES } from '../data/routine.data';
import { readStored, writeStored } from '../utils/storage';

const DAYS_STORAGE_KEY = 'fht.routine.days';
const TICK_MS = 250;
const MINUTE_MS = 60_000;

/**
 * Countdown for the daily routine. It lives at the root, so it keeps running while the student
 * opens the page of the current exercise. Time is measured against an end timestamp rather than
 * by counting ticks, so a throttled background tab does not make it fall behind.
 */
@Injectable({ providedIn: 'root' })
export class PracticeTimerService {
  readonly blocks = ROUTINE_BLOCKS;

  private readonly _blockIndex = signal(0);
  private readonly _remainingMs = signal(blockMs(0));
  private readonly _isRunning = signal(false);
  private readonly _finished = signal(false);
  private readonly _days = signal<readonly string[]>(readStored<string[]>(DAYS_STORAGE_KEY, []));

  readonly blockIndex = this._blockIndex.asReadonly();
  readonly remainingMs = this._remainingMs.asReadonly();
  readonly isRunning = this._isRunning.asReadonly();
  readonly finished = this._finished.asReadonly();

  readonly block = computed(() => this.blocks[this._blockIndex()]);
  /** Whether the routine was started and not reset (running or paused mid-way). */
  readonly inProgress = computed(
    () => !this._finished() && (this._isRunning() || this.elapsedMs() > 0),
  );
  readonly elapsedMs = computed(() => {
    if (this._finished()) {
      return ROUTINE_TOTAL_MINUTES * MINUTE_MS;
    }
    const before = this.blocks
      .slice(0, this._blockIndex())
      .reduce((sum, block) => sum + block.minutes * MINUTE_MS, 0);
    return before + blockMs(this._blockIndex()) - this._remainingMs();
  });
  /** Share of the whole routine already done, 0 to 1. */
  readonly progress = computed(() => this.elapsedMs() / (ROUTINE_TOTAL_MINUTES * MINUTE_MS));
  readonly doneToday = computed(() => this._days().includes(dayKey(new Date())));
  readonly streak = computed(() => streakOf(this._days(), new Date()));

  private endsAt = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private audio: AudioContext | null = null;

  start(): void {
    if (this._isRunning()) {
      return;
    }
    if (this._finished()) {
      this.reset();
    }
    // Created on the user's tap, as browsers block audio before one.
    if (typeof AudioContext !== 'undefined') {
      this.audio ??= new AudioContext();
      void this.audio.resume();
    }
    this.endsAt = Date.now() + this._remainingMs();
    this._isRunning.set(true);
    this.timerId = setInterval(() => this.tick(), TICK_MS);
  }

  pause(): void {
    if (!this._isRunning()) {
      return;
    }
    this._remainingMs.set(Math.max(0, this.endsAt - Date.now()));
    this.stopTicking();
  }

  toggle(): void {
    if (this._isRunning()) {
      this.pause();
    } else {
      this.start();
    }
  }

  /** Moves on to the next block, keeping the timer running or paused as it was. */
  skip(): void {
    this.goTo(this._blockIndex() + 1);
  }

  /** Jumps to a block, starting its full time; past the last block, the routine is finished. */
  goTo(index: number): void {
    if (index >= this.blocks.length) {
      this.finish();
      return;
    }
    this._finished.set(false);
    this._blockIndex.set(Math.max(0, index));
    this._remainingMs.set(blockMs(this._blockIndex()));
    this.endsAt = Date.now() + this._remainingMs();
  }

  reset(): void {
    this.stopTicking();
    this._finished.set(false);
    this._blockIndex.set(0);
    this._remainingMs.set(blockMs(0));
  }

  private tick(): void {
    let remaining = this.endsAt - Date.now();
    if (remaining > 0) {
      this._remainingMs.set(remaining);
      return;
    }
    this.signalBlockEnd();
    // After a long sleep several blocks may have ended; the overshoot carries into the next one.
    let index = this._blockIndex();
    while (remaining <= 0) {
      index++;
      if (index >= this.blocks.length) {
        this.finish();
        return;
      }
      remaining += blockMs(index);
    }
    this._blockIndex.set(index);
    this._remainingMs.set(remaining);
    this.endsAt = Date.now() + remaining;
  }

  private finish(): void {
    this.stopTicking();
    this._finished.set(true);
    this._blockIndex.set(this.blocks.length - 1);
    this._remainingMs.set(0);

    const today = dayKey(new Date());
    if (!this._days().includes(today)) {
      // Only the recent past matters for the streak.
      this._days.update((days) => [...days, today].slice(-400));
      writeStored(DAYS_STORAGE_KEY, this._days());
    }
  }

  private stopTicking(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this._isRunning.set(false);
  }

  /** Two short beeps and a vibration, so the change is noticed with both hands on the guitar. */
  private signalBlockEnd(): void {
    navigator.vibrate?.([200, 100, 200]);
    const audio = this.audio;
    if (!audio) {
      return;
    }
    for (const offset of [0, 0.25]) {
      const time = audio.currentTime + offset;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.4, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(time);
      oscillator.stop(time + 0.2);
    }
  }
}

function blockMs(index: number): number {
  return ROUTINE_BLOCKS[index].minutes * MINUTE_MS;
}

/** "m:ss", rounding up so the clock reads 0:00 only when the time is really over. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${Math.floor(totalSeconds / 60)}:${seconds}`;
}

/** Local calendar day, e.g. "2026-11-03". */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Consecutive days with a finished routine, ending today. A streak that ended yesterday still
 * counts, since today's practice may not have happened yet.
 */
export function streakOf(days: readonly string[], today: Date): number {
  const done = new Set(days);
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!done.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (done.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
