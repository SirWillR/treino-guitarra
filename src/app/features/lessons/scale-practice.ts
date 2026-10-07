import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FINGER_NAMES, TEACHER_LESSON } from '../../core/data/lessons.data';
import { MetronomeService } from '../../core/services/metronome.service';
import { MusicTheoryService } from '../../core/services/music-theory.service';
import { Metronome } from '../../shared/metronome/metronome';
import { PracticeTips } from '../../shared/practice-tips/practice-tips';
import { ScaleExercise } from '../../shared/scale-exercise/scale-exercise';

const PATTERN = TEACHER_LESSON.scalePattern;

/** Pattern indexes for one full lap: up to the top note and back, without repeating the ends. */
const LAP: readonly number[] = [
  ...PATTERN.map((_, i) => i),
  ...PATTERN.map((_, i) => i).slice(1, -1).reverse(),
];

@Component({
  selector: 'app-scale-practice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScaleExercise, Metronome, PracticeTips],
  template: `
    <section class="panel mb-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-white">Padrão de abertura e independência de dedos</h2>
          <p class="mt-1 text-sm text-slate-400">
            Um dedo por casa. O número dentro de cada ponto é o dedo que toca a nota.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="mr-1 text-sm text-slate-400">Posição (casa do dedo 1):</span>
          @for (fret of startFrets; track fret) {
            <button type="button" class="chip" [class.chip-active]="startFret() === fret" (click)="startFret.set(fret)">
              {{ fret }}
            </button>
          }
        </div>
      </div>

      <app-scale-exercise [pattern]="pattern" [startFret]="startFret()" [activeIndex]="activeIndex()" />

      <div class="mt-4 grid gap-3 sm:grid-cols-3">
        @for (row of rows(); track row.string) {
          <div class="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
            <div class="font-semibold text-slate-100">Corda {{ row.string }}</div>
            <div class="text-slate-300">casas {{ row.frets }}</div>
            <div class="text-xs text-slate-500">dedos {{ row.fingers }}</div>
          </div>
        }
      </div>
    </section>

    <section class="panel mb-5">
      <h2 class="panel-title">Player passo a passo</h2>

      <div class="mb-5 flex flex-wrap items-center gap-x-8 gap-y-4">
        <div class="flex items-center gap-4" aria-live="off">
          <div
            class="flex h-16 w-16 items-center justify-center rounded-2xl border text-3xl font-bold transition-colors duration-75"
            [class]="current() ? 'border-amber-400 bg-amber-400/15 text-amber-300' : 'border-slate-800 bg-slate-900 text-slate-600'"
          >
            {{ current()?.pick ?? '↓' }}
          </div>
          <div class="min-w-44">
            @if (current(); as now) {
              <div class="font-semibold text-white">
                Corda {{ now.string }} · casa {{ now.fret }}
                <span class="text-slate-400">({{ now.note }})</span>
              </div>
              <div class="text-sm text-slate-400">
                Dedo {{ now.finger }} — {{ now.fingerName }} · {{ now.ascending ? 'subindo' : 'descendo' }}
              </div>
            } @else {
              <div class="font-semibold text-slate-300">Aperte ▶ para começar</div>
              <div class="text-sm text-slate-500">Sobe da 3ª para a 1ª corda e volta.</div>
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
    </section>

    <app-practice-tips title="Dicas práticas de digitação" [tips]="tips" />
  `,
})
export class ScalePractice {
  private readonly metronome = inject(MetronomeService);
  private readonly theory = inject(MusicTheoryService);

  protected readonly pattern = PATTERN;
  protected readonly startFrets = TEACHER_LESSON.scaleStartFrets;
  protected readonly tips = TEACHER_LESSON.scaleTips;

  protected readonly startFret = signal(1);
  protected readonly notesPerBeat = signal<1 | 2>(1);

  /** Notes played since the metronome started; -1 while stopped. */
  private readonly step = signal(-1);
  private offbeatTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly activeIndex = computed(() =>
    this.step() < 0 ? -1 : LAP[this.step() % LAP.length],
  );

  protected readonly current = computed(() => {
    const step = this.step();
    if (step < 0) {
      return null;
    }
    const lapPosition = step % LAP.length;
    const note = PATTERN[LAP[lapPosition]];
    const fret = this.startFret() + note.fretOffset;
    return {
      string: note.string,
      fret,
      finger: note.finger,
      fingerName: FINGER_NAMES[note.finger],
      note: this.theory.noteAt(note.string, fret),
      // Strict alternate picking: the direction never repeats, whatever the string.
      pick: step % 2 === 0 ? '↓' : '↑',
      ascending: lapPosition < PATTERN.length,
    };
  });

  protected readonly rows = computed(() =>
    ([1, 2, 3] as const).map((string) => {
      const notes = PATTERN.filter((note) => note.string === string);
      return {
        string,
        frets: notes.map((note) => this.startFret() + note.fretOffset).join(', '),
        fingers: notes.map((note) => note.finger).join(', '),
      };
    }),
  );

  constructor() {
    effect(() => {
      const tick = this.metronome.tick();
      untracked(() => this.onTick(tick));
    });
    inject(DestroyRef).onDestroy(() => this.clearOffbeat());
  }

  private onTick(tick: number): void {
    this.clearOffbeat();
    if (tick < 0) {
      this.step.set(-1);
      return;
    }
    const perBeat = this.notesPerBeat();
    this.step.set(tick * perBeat);
    if (perBeat === 2) {
      // The metronome only clicks on the beat; the off-beat note is placed halfway to the next one.
      const halfBeatMs = 30000 / this.metronome.bpm();
      this.offbeatTimer = setTimeout(() => this.step.set(tick * 2 + 1), halfBeatMs);
    }
  }

  private clearOffbeat(): void {
    if (this.offbeatTimer !== null) {
      clearTimeout(this.offbeatTimer);
      this.offbeatTimer = null;
    }
  }
}
