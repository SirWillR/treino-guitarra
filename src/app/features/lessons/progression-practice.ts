import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { chordById } from '../../core/data/chords.data';
import { TEACHER_LESSON } from '../../core/data/lessons.data';
import { MetronomeService } from '../../core/services/metronome.service';
import { ChordDiagram } from '../../shared/chord-diagram/chord-diagram';
import { Metronome } from '../../shared/metronome/metronome';
import { PracticeTips } from '../../shared/practice-tips/practice-tips';

@Component({
  selector: 'app-progression-practice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChordDiagram, Metronome, PracticeTips],
  template: `
    <section class="panel mb-5">
      <h2 class="panel-title">Biblioteca de sequências</h2>
      <div class="flex flex-wrap gap-2">
        @for (item of progressions; track item.id; let i = $index) {
          <button type="button" class="chip" [class.chip-active]="progression().id === item.id" (click)="select(item.id)">
            <span class="mr-1 text-slate-500">{{ i + 1 }}.</span> {{ item.label }}
          </button>
        }
      </div>
    </section>

    <section class="panel mb-5">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-white">{{ progression().label }}</h2>
        <div class="flex flex-wrap items-center gap-2">
          <span class="mr-1 text-sm text-slate-400">Batidas por acorde:</span>
          @for (beats of beatOptions; track beats) {
            <button type="button" class="chip" [class.chip-active]="beatsPerChord() === beats" (click)="beatsPerChord.set(beats)">
              {{ beats }}
            </button>
          }
        </div>
      </div>

      @if (progression().alternative; as alternative) {
        <label class="mb-5 flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" class="accent-amber-400" [checked]="useAlternative()" (change)="useAlternative.set(!useAlternative())" />
          {{ alternative.label }}
        </label>
      }

      <div class="mb-6 flex flex-wrap items-center justify-center gap-3">
        @for (chord of chords(); track $index; let chordIndex = $index) {
          <div class="flex flex-col items-center gap-2">
            <app-chord-diagram [chord]="chord" size="lg" [active]="metronome.isPlaying() && chordIndex === activeIndex()" />
            <div class="flex gap-1.5" aria-hidden="true">
              @for (beat of beatDots(); track beat) {
                <span
                  class="h-2 w-2 rounded-full"
                  [class]="
                    metronome.isPlaying() && chordIndex === activeIndex() && beat <= beatInChord()
                      ? 'bg-amber-400'
                      : 'bg-slate-700'
                  "
                ></span>
              }
            </div>
          </div>
          @if (!$last) {
            <span class="mb-6 text-2xl text-slate-600">→</span>
          }
        }
      </div>

      <app-metronome />
    </section>

    <app-practice-tips [title]="'Dica para ' + progression().label" [tips]="[progression().tip]" />
  `,
})
export class ProgressionPractice {
  protected readonly metronome = inject(MetronomeService);

  protected readonly progressions = TEACHER_LESSON.progressions;
  protected readonly beatOptions = [2, 4, 8] as const;

  private readonly progressionId = signal(this.progressions[0].id);
  protected readonly beatsPerChord = signal<2 | 4 | 8>(4);
  protected readonly useAlternative = signal(false);

  protected readonly progression = computed(
    () => this.progressions.find((p) => p.id === this.progressionId()) ?? this.progressions[0],
  );

  protected readonly chords = computed(() => {
    const { chordIds, alternative } = this.progression();
    return (this.useAlternative() && alternative ? alternative.chordIds : chordIds).map(chordById);
  });

  protected readonly activeIndex = computed(() => {
    const tick = this.metronome.tick();
    return tick < 0 ? 0 : Math.floor(tick / this.beatsPerChord()) % this.chords().length;
  });

  /** Beat inside the current chord, 1-based. */
  protected readonly beatInChord = computed(
    () => (Math.max(0, this.metronome.tick()) % this.beatsPerChord()) + 1,
  );

  protected readonly beatDots = computed(() =>
    Array.from({ length: this.beatsPerChord() }, (_, i) => i + 1),
  );

  protected select(id: string): void {
    this.progressionId.set(id);
    this.useAlternative.set(false);
    // Restart the count so the new sequence begins on its first chord.
    this.metronome.stop();
  }
}
