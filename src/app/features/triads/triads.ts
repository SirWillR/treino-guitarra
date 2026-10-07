import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FretMarker } from '../../core/models/fretboard.model';
import { INTERVAL_COLORS, NoteName, TriadQuality } from '../../core/models/note.model';
import {
  INVERSION_NAMES,
  STRING_SET_STRINGS,
  STRING_SETS,
  StringSet,
} from '../../core/models/triad.model';
import { MusicTheoryService } from '../../core/services/music-theory.service';
import { Fretboard } from '../../shared/fretboard/fretboard';
import { HelpDialog } from '../../shared/help-dialog/help-dialog';
import { NotePicker } from '../../shared/note-picker/note-picker';
import { TriadsHelp } from './triads-help';

@Component({
  selector: 'app-triads',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Fretboard, NotePicker, HelpDialog, TriadsHelp],
  template: `
    <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Tríades Fechadas</h1>
        <p class="mt-1 text-sm text-slate-400">
          Três notas em três cordas vizinhas. Conecte as inversões subindo pelo braço.
        </p>
      </div>
      <button type="button" class="btn-ghost" (click)="help.open()">❓ O que é isso?</button>
    </header>

    <app-help-dialog #help title="O que são tríades?" firstVisitKey="fht.help.triads">
      <app-triads-help />
    </app-help-dialog>

    <section class="panel mb-5 grid gap-5 lg:grid-cols-[1fr_auto_auto]">
      <div>
        <h2 class="panel-title">Tônica</h2>
        <app-note-picker [value]="root()" (valueChange)="setRoot($event)" />
      </div>
      <div>
        <h2 class="panel-title">Tipo</h2>
        <div class="flex gap-2">
          <button type="button" class="chip" [class.chip-active]="quality() === 'major'" (click)="setQuality('major')">Maior</button>
          <button type="button" class="chip" [class.chip-active]="quality() === 'minor'" (click)="setQuality('minor')">Menor</button>
        </div>
      </div>
      <div>
        <h2 class="panel-title">Grupo de cordas</h2>
        <div class="flex gap-2">
          @for (set of stringSets; track set) {
            <button type="button" class="chip" [class.chip-active]="stringSet() === set" (click)="setStringSet(set)">
              Cordas {{ set }}
            </button>
          }
        </div>
      </div>
    </section>

    <section class="panel mb-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-white">
            {{ chordName() }} <span class="font-normal text-slate-400">· {{ inversionName() }}</span>
          </h2>
          <p class="mt-1 text-sm text-slate-400">
            Posição {{ index() + 1 }} de {{ voicings().length }} · casas {{ fretRange() }}
          </p>
        </div>

        <div class="flex items-center gap-2" aria-label="Notas da corda mais grave para a mais aguda">
          @for (tone of tones(); track tone.string) {
            <div class="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-center">
              <div class="text-[10px] tracking-widest text-slate-500 uppercase">{{ tone.string }}ª corda</div>
              <div class="text-lg font-bold" [style.color]="tone.color">{{ tone.interval }}</div>
              <div class="text-xs text-slate-300">{{ tone.note }}</div>
            </div>
          }
        </div>

        <div class="flex gap-2">
          <button type="button" class="btn-ghost" (click)="step(-1)">← Anterior</button>
          <button type="button" class="btn-primary" (click)="step(1)">Próxima Inversão →</button>
        </div>
      </div>

      <app-fretboard [markers]="markers()" />
    </section>

    <section class="panel">
      <h2 class="panel-title">As três inversões</h2>
      <div class="grid gap-3 md:grid-cols-3">
        @for (card of inversionCards(); track card.inversion) {
          <div
            class="rounded-xl border p-4 transition"
            [class]="card.current ? 'border-amber-400 bg-amber-400/10' : 'border-slate-800 bg-slate-900/70'"
          >
            <div class="font-semibold text-slate-100">{{ card.name }}</div>
            <div class="mt-1 font-mono text-lg text-amber-300">{{ card.formula }}</div>
            <div class="mt-1 text-xs text-slate-400">{{ card.description }}</div>
          </div>
        }
      </div>
    </section>
  `,
})
export class Triads {
  private readonly theory = inject(MusicTheoryService);

  protected readonly stringSets = STRING_SETS;
  protected readonly root = signal<NoteName>('C');
  protected readonly quality = signal<TriadQuality>('major');
  protected readonly stringSet = signal<StringSet>('1-2-3');
  protected readonly index = signal(0);

  protected readonly voicings = computed(() =>
    this.theory.triadVoicings(this.root(), this.quality(), this.stringSet()),
  );
  private readonly current = computed(() => this.voicings()[this.index()]);

  protected readonly chordName = computed(
    () => `${this.root()}${this.quality() === 'minor' ? 'm' : ''}`,
  );
  protected readonly inversionName = computed(() => INVERSION_NAMES[this.current().inversion]);

  protected readonly fretRange = computed(() => {
    const frets = this.current().markers.map((m) => m.fret);
    const min = Math.min(...frets);
    const max = Math.max(...frets);
    return min === max ? `${min}` : `${min}–${max}`;
  });

  /** Current voicing in full colour, the other positions dimmed to show where to go next. */
  protected readonly markers = computed<FretMarker[]>(() => {
    const current = this.current();
    return this.voicings().flatMap((voicing) =>
      voicing === current ? voicing.markers : voicing.markers.map((m) => ({ ...m, ghost: true })),
    );
  });

  protected readonly tones = computed(() =>
    this.current().markers.map((m, i) => {
      const interval = this.current().formula[i];
      return {
        string: m.string,
        interval,
        note: this.theory.noteAt(m.string, m.fret),
        color: INTERVAL_COLORS[interval],
      };
    }),
  );

  protected readonly inversionCards = computed(() => {
    const third = this.quality() === 'minor' ? 'b3' : '3';
    const lowest = STRING_SET_STRINGS[this.stringSet()][0];
    const cards = [
      { inversion: 'root', formula: `R - ${third} - 5`, bass: 'tônica' },
      { inversion: 'first', formula: `${third} - 5 - R`, bass: 'terça' },
      { inversion: 'second', formula: `5 - R - ${third}`, bass: 'quinta' },
    ] as const;
    return cards.map((card) => ({
      ...card,
      name: INVERSION_NAMES[card.inversion],
      description: `A ${card.bass} fica na ${lowest}ª corda, a mais grave do grupo.`,
      current: card.inversion === this.current().inversion,
    }));
  });

  constructor() {
    this.goToRootPosition();
  }

  protected step(delta: number): void {
    const length = this.voicings().length;
    this.index.update((i) => (i + delta + length) % length);
  }

  // Changing what is displayed restarts the walk from the root position.
  protected setRoot(root: NoteName): void {
    this.root.set(root);
    this.goToRootPosition();
  }

  protected setQuality(quality: TriadQuality): void {
    this.quality.set(quality);
    this.goToRootPosition();
  }

  protected setStringSet(stringSet: StringSet): void {
    this.stringSet.set(stringSet);
    this.goToRootPosition();
  }

  private goToRootPosition(): void {
    this.index.set(Math.max(0, this.voicings().findIndex((v) => v.inversion === 'root')));
  }
}
