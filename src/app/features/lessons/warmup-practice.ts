import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { WARMUP_PATTERN, WARMUP_TIPS } from '../../core/data/lessons.data';
import { PracticeTips } from '../../shared/practice-tips/practice-tips';
import { ScaleExercise } from '../../shared/scale-exercise/scale-exercise';
import { ExercisePlayer } from './exercise-player';

/** Highest starting fret that still keeps finger 4 on the 15-fret diagram. */
const LAST_START_FRET = 12;

@Component({
  selector: 'app-warmup-practice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScaleExercise, ExercisePlayer, PracticeTips],
  template: `
    <section class="panel mb-5">
      <div class="mb-4">
        <h2 class="text-lg font-semibold text-white">Cromático 1-2-3-4</h2>
        <p class="mt-1 text-sm text-slate-400">
          Um dedo por casa: indicador, médio, anelar e mínimo em quatro casas seguidas. Comece na 6ª corda,
          suba corda por corda até a 1ª e volte. Serve de aquecimento antes de qualquer estudo.
        </p>
      </div>

      <div class="mb-4 flex flex-wrap items-center gap-2">
        <span class="mr-1 text-sm text-slate-400">Casa do dedo 1:</span>
        @for (fret of startFrets; track fret) {
          <button type="button" class="chip min-w-10" [class.chip-active]="startFret() === fret" (click)="startFret.set(fret)">
            {{ fret }}
          </button>
        }
      </div>

      <app-scale-exercise [pattern]="pattern" [startFret]="startFret()" [activeIndex]="activeIndex()" />
    </section>

    <section class="panel mb-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 class="panel-title mb-0">Player passo a passo</h2>
        <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" class="accent-amber-400" [checked]="climb()" (change)="climb.set(!climb())" />
          Subir uma casa a cada volta (percorre o braço todo)
        </label>
      </div>
      <app-exercise-player
        [pattern]="pattern"
        [startFret]="startFret()"
        idleHint="Sobe da 6ª para a 1ª corda e volta."
        (activeIndexChange)="activeIndex.set($event)"
        (lap)="onLap()"
      />
    </section>

    <app-practice-tips title="Dicas gerais de aquecimento" [tips]="tips" />
  `,
})
export class WarmupPractice {
  protected readonly pattern = WARMUP_PATTERN;
  protected readonly tips = WARMUP_TIPS;
  protected readonly startFrets = Array.from({ length: LAST_START_FRET }, (_, i) => i + 1);

  protected readonly startFret = signal(1);
  protected readonly climb = signal(false);
  protected readonly activeIndex = signal(-1);

  protected onLap(): void {
    if (this.climb()) {
      this.startFret.update((fret) => (fret >= LAST_START_FRET ? 1 : fret + 1));
    }
  }
}
