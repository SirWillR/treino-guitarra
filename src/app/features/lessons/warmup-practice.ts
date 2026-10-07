import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { WARMUP_TIPS, WARMUP_VARIATIONS } from '../../core/data/lessons.data';
import { MetronomeService } from '../../core/services/metronome.service';
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
      <h2 class="panel-title">Variação</h2>
      <div class="mb-4 flex flex-wrap gap-2">
        @for (item of variations; track item.id) {
          <button type="button" class="chip" [class.chip-active]="variation().id === item.id" (click)="select(item.id)">
            {{ item.name }}
          </button>
        }
      </div>

      <div class="mb-5">
        <h3 class="text-lg font-semibold text-white">{{ variation().name }}</h3>
        <p class="mt-1 text-sm text-slate-300">{{ variation().description }}</p>
        <p class="mt-1 text-sm text-slate-400">
          <span class="font-semibold text-amber-300">Treina:</span> {{ variation().focus }}
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

      <app-scale-exercise [pattern]="variation().steps" [startFret]="startFret()" [activeIndex]="activeIndex()" />
      <p class="mt-3 text-sm text-slate-400">
        Um dedo por casa: o número em cada ponto é o dedo. A ordem de tocar é a descrita acima — aperte ▶ para
        ver nota por nota.
      </p>
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
        [pattern]="variation().steps"
        [startFret]="startFret()"
        [directionLabels]="['ida', 'volta']"
        idleHint="Toca a sequência até o fim e volta de trás para frente."
        (activeIndexChange)="activeIndex.set($event)"
        (lap)="onLap()"
      />
    </section>

    <app-practice-tips title="Dicas gerais de aquecimento" [tips]="tips" />
  `,
})
export class WarmupPractice {
  private readonly metronome = inject(MetronomeService);

  protected readonly variations = WARMUP_VARIATIONS;
  protected readonly tips = WARMUP_TIPS;
  protected readonly startFrets = Array.from({ length: LAST_START_FRET }, (_, i) => i + 1);

  private readonly variationId = signal(WARMUP_VARIATIONS[0].id);
  protected readonly variation = computed(
    () => WARMUP_VARIATIONS.find((v) => v.id === this.variationId()) ?? WARMUP_VARIATIONS[0],
  );
  protected readonly startFret = signal(1);
  protected readonly climb = signal(false);
  protected readonly activeIndex = signal(-1);

  protected select(id: string): void {
    this.variationId.set(id);
    // A different sequence starts from its first note.
    this.metronome.stop();
  }

  protected onLap(): void {
    if (this.climb()) {
      this.startFret.update((fret) => (fret >= LAST_START_FRET ? 1 : fret + 1));
    }
  }
}
