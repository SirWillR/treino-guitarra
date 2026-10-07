import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FINGER_NAMES } from '../../core/data/lessons.data';
import { ScaleExerciseStep } from '../../core/models/lesson.model';
import { MetronomeService } from '../../core/services/metronome.service';
import { MusicTheoryService } from '../../core/services/music-theory.service';
import { Metronome } from '../../shared/metronome/metronome';

/**
 * Walks a pattern up and back down in time with the metronome. One lap goes from the first note
 * to the last and back to the second, so looping never repeats the notes at either end.
 */
@Component({
  selector: 'app-exercise-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Metronome],
  template: `
    <div class="mb-5 flex flex-wrap items-center gap-x-8 gap-y-4">
      <div class="flex items-center gap-4" aria-live="off">
        <div
          class="flex h-16 w-16 items-center justify-center rounded-2xl border text-3xl font-bold transition-colors duration-75"
          [class]="current() ? 'border-amber-400 bg-amber-400/15 text-amber-300' : 'border-slate-800 bg-slate-900 text-slate-600'"
        >
          {{ current()?.pick ?? '↓' }}
        </div>
        <div class="min-w-48">
          @if (current(); as now) {
            <div class="font-semibold text-white">
              Corda {{ now.string }} · {{ now.fret === 0 ? 'solta' : 'casa ' + now.fret }}
              <span class="text-slate-400">({{ now.note }})</span>
            </div>
            <div class="text-sm text-slate-400">
              {{ now.finger === 0 ? now.fingerName : 'Dedo ' + now.finger + ' — ' + now.fingerName }}
              · {{ now.ascending ? directionLabels()[0] : directionLabels()[1] }}
            </div>
          } @else {
            <div class="font-semibold text-slate-300">Aperte ▶ para começar</div>
            <div class="text-sm text-slate-500">{{ idleHint() }}</div>
          }
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="mr-1 text-sm text-slate-400">Notas por tempo:</span>
        <button type="button" class="chip" [class.chip-active]="notesPerBeat() === 1" (click)="notesPerBeat.set(1)">1 (semínimas)</button>
        <button type="button" class="chip" [class.chip-active]="notesPerBeat() === 2" (click)="notesPerBeat.set(2)">2 (colcheias)</button>
      </div>
    </div>

    <app-metronome />
  `,
})
export class ExercisePlayer {
  private readonly metronome = inject(MetronomeService);
  private readonly theory = inject(MusicTheoryService);

  /** Notes in playing order; the second half of each lap plays them backwards. */
  readonly pattern = input.required<readonly ScaleExerciseStep[]>();
  /** Fret added to every `fretOffset` of the pattern. */
  readonly startFret = input(0);
  readonly idleHint = input('Sobe até a nota mais aguda e volta.');
  /** Words for the first and the second half of a lap. */
  readonly directionLabels = input<readonly [string, string]>(['subindo', 'descendo']);

  /** Index in `pattern` of the note being played; -1 when stopped. */
  readonly activeIndexChange = output<number>();
  /** Emitted when a full lap (up and down) ends, right before the next one starts. */
  readonly lap = output<void>();

  protected readonly notesPerBeat = signal<1 | 2>(1);

  /** Position inside the current lap; -1 while stopped. */
  private readonly lapStep = signal(-1);
  /** Notes played since the start, which sets the picking direction. */
  private readonly notesPlayed = signal(0);
  private offbeatTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly lapLength = computed(() => Math.max(1, this.pattern().length * 2 - 2));

  private readonly activeIndex = computed(() => {
    const step = this.lapStep();
    const length = this.pattern().length;
    if (step < 0 || length === 0) {
      return -1;
    }
    // A pattern swapped mid-lap may be shorter; clamp instead of pointing past its end.
    const bounded = Math.min(step, this.lapLength() - 1);
    return bounded < length ? bounded : 2 * length - 2 - bounded;
  });

  protected readonly current = computed(() => {
    const index = this.activeIndex();
    if (index < 0) {
      return null;
    }
    const step = this.pattern()[index];
    const fret = this.startFret() + step.fretOffset;
    return {
      string: step.string,
      fret,
      finger: step.finger,
      fingerName: FINGER_NAMES[step.finger],
      note: this.theory.noteAt(step.string, fret),
      // Strict alternate picking: the direction never repeats, whatever the string.
      pick: this.notesPlayed() % 2 === 0 ? '↓' : '↑',
      ascending: this.lapStep() < this.pattern().length,
    };
  });

  constructor() {
    effect(() => {
      const tick = this.metronome.tick();
      untracked(() => this.onTick(tick));
    });
    effect(() => this.activeIndexChange.emit(this.activeIndex()));
    inject(DestroyRef).onDestroy(() => this.clearOffbeat());
  }

  private onTick(tick: number): void {
    this.clearOffbeat();
    if (tick < 0) {
      this.lapStep.set(-1);
      return;
    }
    if (tick === 0) {
      this.lapStep.set(0);
      this.notesPlayed.set(0);
    } else {
      this.advance();
    }
    if (this.notesPerBeat() === 2) {
      // The metronome only clicks on the beat; the off-beat note is placed halfway to the next one.
      const halfBeatMs = 30000 / this.metronome.bpm();
      this.offbeatTimer = setTimeout(() => this.advance(), halfBeatMs);
    }
  }

  private advance(): void {
    this.notesPlayed.update((n) => n + 1);
    if (this.lapStep() + 1 >= this.lapLength()) {
      // Let the parent swap the pattern (next position) before the new lap begins.
      this.lap.emit();
      this.lapStep.set(0);
    } else {
      this.lapStep.update((step) => step + 1);
    }
  }

  private clearOffbeat(): void {
    if (this.offbeatTimer !== null) {
      clearTimeout(this.offbeatTimer);
      this.offbeatTimer = null;
    }
  }
}
