import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CHORD_GROUPS, chordById, CHORDS } from '../../core/data/chords.data';
import { MetronomeService } from '../../core/services/metronome.service';
import { ChordDiagram } from '../../shared/chord-diagram/chord-diagram';
import { Metronome } from '../../shared/metronome/metronome';

const MIN_CHORDS = 2;
const MAX_CHORDS = 4;

const PRESETS: readonly { label: string; chordIds: readonly string[] }[] = [
  { label: 'C → Am → F → G', chordIds: ['C', 'Am', 'F', 'G'] },
  { label: 'G → D → Em → C', chordIds: ['G', 'D', 'Em', 'C'] },
  { label: 'A → D → E', chordIds: ['A', 'D', 'E'] },
  { label: 'Em → Am', chordIds: ['Em', 'Am'] },
];

@Component({
  selector: 'app-chord-trainer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChordDiagram, Metronome],
  template: `
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-white">Troca de Acordes</h1>
      <p class="mt-1 text-sm text-slate-400">
        Monte uma sequência de 2 a 4 acordes e troque no tempo do metrônomo.
      </p>
    </header>

    <section class="panel mb-5">
      <h2 class="panel-title">Treinador de troca</h2>

      <div class="mb-5 flex flex-wrap items-center gap-2">
        <span class="mr-1 text-sm text-slate-400">Sugestões:</span>
        @for (preset of presets; track preset.label) {
          <button type="button" class="chip" (click)="sequenceIds.set(preset.chordIds)">{{ preset.label }}</button>
        }
      </div>

      <div class="mb-6 flex flex-wrap items-center justify-center gap-3">
        @for (chord of sequence(); track $index) {
          <div class="relative">
            <app-chord-diagram [chord]="chord" size="lg" [active]="$index === activeIndex()" />
            <button
              type="button"
              class="absolute -top-2 -right-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-xs text-slate-200 hover:bg-rose-500"
              [attr.aria-label]="'Remover ' + chord.name"
              (click)="removeAt($index)"
            >
              ✕
            </button>
          </div>
          @if (!$last) {
            <span class="text-2xl text-slate-600">→</span>
          }
        } @empty {
          <p class="py-10 text-slate-500">Clique nos acordes do dicionário abaixo para montar a sequência.</p>
        }
      </div>

      @if (!canPlay()) {
        <p class="mb-4 text-center text-sm text-amber-300">Selecione pelo menos {{ minChords }} acordes para treinar.</p>
      } @else if (metronome.isPlaying()) {
        <p class="mb-4 text-center text-sm text-slate-300" aria-live="off">
          Tocando <strong class="text-amber-300">{{ sequence()[activeIndex()].name }}</strong>
          · próximo <strong class="text-slate-100">{{ nextChord().name }}</strong> em
          <strong class="tabular-nums text-slate-100">{{ beatsLeft() }}</strong>
          {{ beatsLeft() === 1 ? 'tempo' : 'tempos' }}
        </p>
      }

      <div class="mb-5 flex flex-wrap items-center gap-2">
        <span class="mr-1 text-sm text-slate-400">Trocar a cada:</span>
        @for (bars of barOptions; track bars) {
          <button type="button" class="chip" [class.chip-active]="barsPerChord() === bars" (click)="barsPerChord.set(bars)">
            {{ bars }} {{ bars === 1 ? 'compasso' : 'compassos' }}
          </button>
        }
      </div>

      <div [class.pointer-events-none]="!canPlay()" [class.opacity-40]="!canPlay()">
        <app-metronome />
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">Dicionário de acordes</h2>
      <p class="mb-4 text-sm text-slate-400">
        Os 7 acordes maiores e os 7 menores. Números = dedos (1 indicador … 4 mínimo) · O = corda solta ·
        X = corda abafada · barra = pestana com o dedo 1. Clique para adicionar ou remover da sequência
        (máx. {{ maxChords }}).
      </p>
      @for (group of groups; track group.label) {
        <h3 class="mt-5 mb-3 text-sm font-semibold text-slate-200">{{ group.label }}</h3>
        <div class="flex flex-wrap gap-3">
          @for (chord of group.chords; track chord.id) {
            <button
              type="button"
              class="cursor-pointer rounded-xl transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
              [class]="isSelected(chord.id) ? 'ring-2 ring-amber-400' : ''"
              [attr.aria-pressed]="isSelected(chord.id)"
              [disabled]="!isSelected(chord.id) && isFull()"
              (click)="toggle(chord.id)"
            >
              <app-chord-diagram [chord]="chord" />
              @if (chord.barre) {
                <span class="mt-1 block text-center text-[11px] font-semibold tracking-wide text-sky-300 uppercase">pestana</span>
              }
            </button>
          }
        </div>
      }
    </section>
  `,
})
export class ChordTrainer {
  protected readonly metronome = inject(MetronomeService);

  protected readonly presets = PRESETS;
  protected readonly barOptions = [1, 2, 4] as const;
  protected readonly minChords = MIN_CHORDS;
  protected readonly maxChords = MAX_CHORDS;
  // Beginner scope: the seven major and seven minor chords. Other groups stay in the data only.
  protected readonly groups = CHORD_GROUPS.filter(
    ({ group }) => group === 'major' || group === 'minor',
  ).map(({ group, label }) => ({
    label,
    chords: CHORDS.filter((chord) => chord.group === group),
  }));

  protected readonly sequenceIds = signal<readonly string[]>(PRESETS[0].chordIds);
  protected readonly barsPerChord = signal<1 | 2 | 4>(1);

  protected readonly sequence = computed(() => this.sequenceIds().map(chordById));
  protected readonly canPlay = computed(() => this.sequenceIds().length >= MIN_CHORDS);
  protected readonly isFull = computed(() => this.sequenceIds().length >= MAX_CHORDS);

  private readonly beatsPerChord = computed(
    () => this.metronome.beatsPerBar() * this.barsPerChord(),
  );

  /** Chord under the spotlight; follows the metronome while it plays. */
  protected readonly activeIndex = computed(() => {
    const tick = this.metronome.tick();
    const length = this.sequenceIds().length;
    if (tick < 0 || length === 0) {
      return 0;
    }
    return Math.floor(tick / this.beatsPerChord()) % length;
  });

  protected readonly nextChord = computed(() => {
    const sequence = this.sequence();
    return sequence[(this.activeIndex() + 1) % sequence.length];
  });

  protected readonly beatsLeft = computed(() => {
    const tick = Math.max(0, this.metronome.tick());
    return this.beatsPerChord() - (tick % this.beatsPerChord());
  });

  protected isSelected(id: string): boolean {
    return this.sequenceIds().includes(id);
  }

  protected toggle(id: string): void {
    this.sequenceIds.update((ids) => {
      if (ids.includes(id)) {
        return ids.filter((other) => other !== id);
      }
      return ids.length < MAX_CHORDS ? [...ids, id] : ids;
    });
  }

  protected removeAt(index: number): void {
    this.sequenceIds.update((ids) => ids.filter((_, i) => i !== index));
  }
}
