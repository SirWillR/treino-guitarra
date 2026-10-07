import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FINGER_COLORS, FINGER_NAMES } from '../../core/data/lessons.data';
import { FretMarker, GuitarString } from '../../core/models/fretboard.model';
import { ScaleExerciseStep } from '../../core/models/lesson.model';
import { Fretboard } from '../fretboard/fretboard';

@Component({
  selector: 'app-scale-exercise',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Fretboard],
  template: `
    <app-fretboard [markers]="markers()" [strings]="strings()" [frets]="frets()" />

    <ul class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
      @for (finger of fingers(); track finger.number) {
        <li class="flex items-center gap-2">
          <span
            class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-slate-950"
            [style.background-color]="finger.color"
          >
            {{ finger.number }}
          </span>
          {{ finger.name }}
        </li>
      }
      @if (hasRoot()) {
        <li class="flex items-center gap-2">
          <span class="h-6 w-6 rounded-full border-[3px] border-white bg-slate-700"></span>
          Contorno branco = tônica
        </li>
      }
    </ul>
  `,
})
export class ScaleExercise {
  /** Notes of the pattern in playing order. */
  readonly pattern = input.required<readonly ScaleExerciseStep[]>();
  /** Fret added to every `fretOffset`; the index finger's fret for relative patterns. */
  readonly startFret = input(1);
  /** Index in `pattern` of the note being played, or -1 for none. */
  readonly activeIndex = input(-1);
  readonly frets = input(15);

  protected readonly fingers = computed(() => {
    const used = new Set(this.pattern().map((step) => step.finger));
    return ([0, 1, 2, 3, 4] as const)
      .filter((number) => number > 0 || used.has(0))
      .map((number) => ({ number, name: FINGER_NAMES[number], color: FINGER_COLORS[number] }));
  });

  protected readonly hasRoot = computed(() => this.pattern().some((step) => step.isRoot));

  protected readonly strings = computed<GuitarString[]>(() => [
    ...new Set(this.pattern().map((step) => step.string)),
  ]);

  /** One marker per position: a sequence may visit the same fret more than once. */
  protected readonly markers = computed<FretMarker[]>(() => {
    const byPosition = new Map<string, FretMarker>();
    this.pattern().forEach((step, index) => {
      const fret = this.startFret() + step.fretOffset;
      const key = `${step.string}:${fret}`;
      const active = index === this.activeIndex();
      const existing = byPosition.get(key);
      if (existing) {
        existing.active ||= active;
        return;
      }
      byPosition.set(key, {
        string: step.string,
        fret,
        label: String(step.finger),
        color: FINGER_COLORS[step.finger],
        isRoot: step.isRoot,
        active,
      });
    });
    return [...byPosition.values()];
  });
}
