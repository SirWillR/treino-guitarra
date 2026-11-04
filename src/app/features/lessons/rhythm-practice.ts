import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { chordById } from '../../core/data/chords.data';
import {
  RHYTHM_CHORD_SEQUENCES,
  RHYTHM_TIPS,
  STRUMMING_PATTERNS,
} from '../../core/data/rhythm.data';
import { MetronomeService } from '../../core/services/metronome.service';
import { ChordDiagram } from '../../shared/chord-diagram/chord-diagram';
import { Metronome } from '../../shared/metronome/metronome';
import { PracticeTips } from '../../shared/practice-tips/practice-tips';

const COUNT_LABELS = ['1', 'e', '2', 'e', '3', 'e', '4', 'e'] as const;

@Component({
  selector: 'app-rhythm-practice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChordDiagram, Metronome, PracticeTips],
  template: `
    <section class="panel mb-5">
      <h2 class="panel-title">Padrão de batida</h2>
      <div class="mb-4 flex flex-wrap gap-2">
        @for (item of patterns; track item.id) {
          <button type="button" class="chip" [class.chip-active]="pattern().id === item.id" (click)="select(item.id)">
            {{ item.name }}
          </button>
        }
      </div>

      <div class="mb-5">
        <h3 class="text-lg font-semibold text-white">{{ pattern().name }}</h3>
        <p class="mt-1 text-sm text-slate-300">{{ pattern().description }}</p>
        <p class="mt-1 text-sm text-slate-400">
          <span class="font-semibold text-amber-300">Treina:</span> {{ pattern().focus }}
        </p>
      </div>

      <!-- One bar in eighth notes; the cell being played lights up with the metronome. -->
      <ol class="grid grid-cols-8 gap-1 sm:gap-2" aria-label="Batida do compasso">
        @for (stroke of pattern().strokes; track $index; let i = $index) {
          <li
            class="flex flex-col items-center rounded-xl border py-2 transition-colors duration-75 sm:py-3"
            [class]="
              i === activeStep()
                ? 'border-amber-400 bg-amber-400/15'
                : i % 2 === 0
                  ? 'border-slate-700 bg-slate-800/60'
                  : 'border-slate-800 bg-slate-900/40'
            "
            [attr.aria-label]="countLabels[i] + ': ' + strokeNames[stroke]"
          >
            <span
              class="text-3xl leading-none font-bold sm:text-5xl"
              [class]="stroke === 'ghost' ? 'text-slate-700' : i === activeStep() ? 'text-amber-300' : 'text-white'"
              aria-hidden="true"
            >
              {{ stroke === 'up' ? '↑' : '↓' }}
            </span>
            <span
              class="mt-1 text-sm tabular-nums sm:text-base"
              [class]="i % 2 === 0 ? 'font-bold text-slate-200' : 'text-slate-500'"
              aria-hidden="true"
            >
              {{ countLabels[i] }}
            </span>
          </li>
        }
      </ol>
      <p class="mt-3 text-sm text-slate-400">
        Seta branca: toca. Seta apagada: a mão faz o movimento no ar, sem encostar nas cordas.
      </p>
    </section>

    <section class="panel mb-5">
      <h2 class="panel-title">Acordes</h2>
      <div class="mb-4 flex flex-wrap items-center gap-2">
        @for (sequence of sequences; track sequence.label; let i = $index) {
          <button type="button" class="chip" [class.chip-active]="sequenceIndex() === i" (click)="selectSequence(i)">
            {{ sequence.label }}
          </button>
        }
      </div>

      <div class="mb-5 flex items-center justify-center gap-4 sm:gap-8">
        <div class="w-36 sm:w-44">
          <app-chord-diagram [chord]="chord()" size="fluid" [active]="metronome.isPlaying()" />
        </div>
        @if (nextChord(); as next) {
          <div class="flex flex-col items-center text-slate-500">
            <span class="text-xs tracking-widest uppercase">Próximo</span>
            <span class="text-2xl font-bold text-slate-300">{{ next.name }}</span>
            <span class="text-xs">no próximo compasso</span>
          </div>
        }
      </div>

      <app-metronome />
      <label class="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          class="accent-amber-400"
          [checked]="metronome.clickEighths()"
          (change)="metronome.clickEighths.set(!metronome.clickEighths())"
        />
        Clicar também no "e" (entre os tempos)
      </label>
    </section>

    <app-practice-tips title="Dicas de ritmo" [tips]="tips" />
  `,
})
export class RhythmPractice implements OnDestroy {
  protected readonly metronome = inject(MetronomeService);

  protected readonly patterns = STRUMMING_PATTERNS;
  protected readonly sequences = RHYTHM_CHORD_SEQUENCES;
  protected readonly tips = RHYTHM_TIPS;
  protected readonly countLabels = COUNT_LABELS;
  protected readonly strokeNames = { down: 'para baixo', up: 'para cima', ghost: 'no ar' } as const;

  private readonly patternId = signal(STRUMMING_PATTERNS[0].id);
  protected readonly pattern = computed(
    () => STRUMMING_PATTERNS.find((p) => p.id === this.patternId()) ?? STRUMMING_PATTERNS[0],
  );
  protected readonly sequenceIndex = signal(1);

  /** Eighth note of the bar being played; -1 while stopped. */
  protected readonly activeStep = computed(() => {
    const eighth = this.metronome.eighth();
    return eighth < 0 ? -1 : eighth % this.pattern().strokes.length;
  });

  private readonly chordIds = computed(() => this.sequences[this.sequenceIndex()].chordIds);
  private readonly barIndex = computed(() => Math.max(0, this.metronome.currentBar()));

  protected readonly chord = computed(() =>
    chordById(this.chordIds()[this.barIndex() % this.chordIds().length]),
  );
  protected readonly nextChord = computed(() => {
    const ids = this.chordIds();
    return ids.length > 1 ? chordById(ids[(this.barIndex() + 1) % ids.length]) : null;
  });

  protected select(id: string): void {
    this.patternId.set(id);
    // A new pattern starts from the first beat of the bar.
    this.metronome.stop();
  }

  protected selectSequence(index: number): void {
    this.sequenceIndex.set(index);
    this.metronome.stop();
  }

  // The metronome is shared: the off-beat click belongs to this page only.
  ngOnDestroy(): void {
    this.metronome.clickEighths.set(false);
  }
}
