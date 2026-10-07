import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy } from '@angular/core';
import { MAX_BPM, MetronomeService, MIN_BPM } from '../../core/services/metronome.service';

@Component({
  selector: 'app-metronome',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-x-6 gap-y-4">
      <button
        type="button"
        class="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full text-xl font-bold text-slate-950 transition"
        [class]="metronome.isPlaying() ? 'bg-rose-400 hover:bg-rose-300' : 'bg-amber-400 hover:bg-amber-300'"
        [attr.aria-label]="metronome.isPlaying() ? 'Parar metrônomo' : 'Iniciar metrônomo'"
        (click)="metronome.toggle()"
      >
        {{ metronome.isPlaying() ? '■' : '▶' }}
      </button>

      <div class="min-w-24">
        <div class="text-4xl leading-none font-bold text-white tabular-nums">{{ metronome.bpm() }}</div>
        <div class="mt-1 text-xs tracking-widest text-slate-400 uppercase">BPM</div>
      </div>

      <div class="flex min-w-56 flex-1 items-center gap-2">
        <button type="button" class="chip" aria-label="Diminuir BPM" (click)="nudge(-1)">−</button>
        <input
          type="range"
          class="h-2 flex-1 cursor-pointer accent-amber-400"
          aria-label="BPM"
          [min]="minBpm"
          [max]="maxBpm"
          [value]="metronome.bpm()"
          (input)="onSlider($event)"
        />
        <button type="button" class="chip" aria-label="Aumentar BPM" (click)="nudge(1)">+</button>
      </div>

      <button type="button" class="btn-ghost" (click)="metronome.tap()">Tap tempo</button>

      <div class="flex items-center gap-2" aria-hidden="true">
        @for (beat of beats(); track beat) {
          <span
            class="h-3.5 w-3.5 rounded-full transition-colors duration-75"
            [class]="
              metronome.currentBeat() === beat
                ? beat === 1
                  ? 'bg-amber-400 shadow-[0_0_12px] shadow-amber-400'
                  : 'bg-sky-400 shadow-[0_0_12px] shadow-sky-400'
                : 'bg-slate-700'
            "
          ></span>
        }
      </div>
    </div>
  `,
})
export class Metronome implements OnDestroy {
  protected readonly metronome = inject(MetronomeService);
  protected readonly minBpm = MIN_BPM;
  protected readonly maxBpm = MAX_BPM;

  protected readonly beats = computed(() =>
    Array.from({ length: this.metronome.beatsPerBar() }, (_, i) => i + 1),
  );

  protected onSlider(event: Event): void {
    this.metronome.setBpm((event.target as HTMLInputElement).valueAsNumber);
  }

  protected nudge(delta: number): void {
    this.metronome.setBpm(this.metronome.bpm() + delta);
  }

  // The service is shared, so leaving the screen must not leave it clicking.
  ngOnDestroy(): void {
    this.metronome.stop();
  }
}
