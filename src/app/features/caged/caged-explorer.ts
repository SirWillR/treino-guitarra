import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { CAGED_SHAPE_NAMES, CagedShapeName, VoicingStyle } from '../../core/models/caged.model';
import { FretMarker } from '../../core/models/fretboard.model';
import {
  INTERVAL_COLORS,
  INTERVAL_NAMES,
  NoteName,
  TriadQuality,
} from '../../core/models/note.model';
import { MetronomeService } from '../../core/services/metronome.service';
import { MusicTheoryService } from '../../core/services/music-theory.service';
import { Fretboard } from '../../shared/fretboard/fretboard';
import { Metronome } from '../../shared/metronome/metronome';
import { NotePicker } from '../../shared/note-picker/note-picker';

interface StyleOption {
  id: VoicingStyle;
  label: string;
  hint: string;
}

const STYLES: readonly StyleOption[] = [
  { id: 'full', label: 'Completo', hint: 'O acorde inteiro, todas as cordas do shape.' },
  {
    id: 'rock',
    label: 'Rock',
    hint: 'Só as 3 cordas mais graves, sem a terça: o power chord. Peso para o rock.',
  },
  {
    id: 'groove',
    label: 'Groove',
    hint: 'Só as 4 cordas mais agudas: o acorde reduzido do funk, do pop e do gospel.',
  },
  {
    id: 'worship',
    label: 'Worship',
    hint: 'A tônica no grave e a terça no agudo ("tônica e terça"), deixando o meio vazio.',
  },
];

/** Shapes whose three lowest strings are root, fifth and root: they turn into a power chord. */
const POWER_CHORD_SHAPES: readonly CagedShapeName[] = ['E', 'A', 'D'];

@Component({
  selector: 'app-caged-explorer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Fretboard, NotePicker, Metronome],
  template: `
    <section class="panel mb-5 grid gap-5 lg:grid-cols-[1fr_auto]">
      <div>
        <h2 class="panel-title">Tonalidade</h2>
        <app-note-picker [value]="root()" (valueChange)="root.set($event)" />
      </div>
      <div>
        <h2 class="panel-title">Tipo</h2>
        <div class="flex gap-2">
          <button type="button" class="chip" [class.chip-active]="quality() === 'major'" (click)="quality.set('major')">Maior</button>
          <button type="button" class="chip" [class.chip-active]="quality() === 'minor'" (click)="quality.set('minor')">Menor</button>
        </div>
      </div>
      <div class="lg:col-span-2">
        <h2 class="panel-title">Shape</h2>
        <div class="grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
          @for (name of shapeNames; track name) {
            <button type="button" class="chip px-1 sm:min-w-28 sm:px-3" [class.chip-active]="shape() === name" (click)="shape.set(name)">
              <span class="hidden sm:inline">Shape de </span>{{ name }}
            </button>
          }
          <label class="col-span-5 mt-2 flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-300 sm:mt-0 sm:ml-auto sm:min-h-0">
            <input type="checkbox" class="accent-amber-400" [checked]="showAll()" (change)="showAll.set(!showAll())" />
            Mostrar os outros shapes
          </label>
          <label class="col-span-5 flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-300 sm:min-h-0">
            <input type="checkbox" class="accent-amber-400" [checked]="showNotes()" (change)="showNotes.set(!showNotes())" />
            Nomes das notas
          </label>
        </div>
      </div>
      <div class="lg:col-span-2">
        <h2 class="panel-title">Como tocar</h2>
        <div class="grid grid-cols-4 gap-1.5 sm:flex sm:gap-2">
          @for (option of styles; track option.id) {
            <button type="button" class="chip px-1 sm:px-3" [class.chip-active]="style() === option.id" (click)="style.set(option.id)">
              {{ option.label }}
            </button>
          }
        </div>
        <p class="mt-2 text-sm text-slate-400">
          {{ styleHint() }}
          @if (style() === 'rock' && !powerChordShape()) {
            <span class="block text-amber-300">
              O shape de {{ shape() }} não vira power chord (tem a terça no grave). Use os shapes de E, A ou D.
            </span>
          }
        </p>
      </div>
    </section>

    <section class="panel mb-5">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 class="text-lg font-bold text-white sm:text-xl">
          {{ chordName() }} <span class="font-normal text-slate-400">· shape de {{ shape() }}</span>
        </h2>
        <p class="text-sm text-slate-300">
          ⚓ Tônica <strong class="text-amber-300">{{ root() }}</strong> na
          <strong class="text-amber-300">{{ anchor().string }}ª corda</strong>,
          {{ anchor().fret === 0 ? 'solta' : 'casa ' + anchor().fret }}
        </p>
      </div>

      <app-fretboard [markers]="markers()" />

      <ul class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
        @for (item of legend(); track item.interval) {
          <li class="flex items-center gap-2">
            <span
              class="flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-bold text-slate-950"
              [class.ring-2]="item.interval === 'R'"
              [class.ring-white]="item.interval === 'R'"
              [style.background-color]="item.color"
            >
              {{ item.interval }}
            </span>
            {{ item.name }} — <strong class="text-slate-100">{{ item.note }}</strong>
          </li>
        }
      </ul>
    </section>

    <section class="panel mb-5">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 class="panel-title mb-0">Percorrer o braço</h2>
        <div class="flex gap-2">
          <button type="button" class="chip min-w-11" aria-label="Shape anterior" (click)="step(-1)">◀</button>
          <button type="button" class="chip min-w-11" aria-label="Próximo shape" (click)="step(1)">▶</button>
        </div>
      </div>
      <p class="mb-3 text-sm text-slate-400">
        Subindo o braço os shapes vêm sempre na ordem C → A → G → E → D (e recomeça). Cada um começa onde o
        anterior termina.
      </p>
      <ol class="grid grid-cols-5 gap-1.5 sm:gap-2">
        @for (stop of neckOrder(); track stop.shape) {
          <li>
            <button
              type="button"
              class="chip flex w-full flex-col items-center px-1 py-2 leading-tight"
              [class.chip-active]="shape() === stop.shape"
              (click)="shape.set(stop.shape)"
            >
              <span class="text-base font-bold">{{ stop.shape }}</span>
              <span class="text-[11px] tabular-nums opacity-70">
                {{ stop.lowestFret === stop.highestFret ? stop.lowestFret : stop.lowestFret + '–' + stop.highestFret }}
              </span>
            </button>
          </li>
        }
      </ol>

      <label class="mt-4 flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-300 sm:min-h-0">
        <input type="checkbox" class="accent-amber-400" [checked]="follow()" (change)="follow.set(!follow())" />
        Avançar sozinho com o metrônomo
      </label>
      @if (follow()) {
        <div class="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-300">
          Trocar de shape a cada
          @for (bars of barOptions; track bars) {
            <button type="button" class="chip" [class.chip-active]="barsPerShape() === bars" (click)="barsPerShape.set(bars)">
              {{ bars }} {{ bars === 1 ? 'compasso' : 'compassos' }}
            </button>
          }
        </div>
        <div class="mt-4">
          <app-metronome />
        </div>
      }
    </section>

    <section class="panel text-sm leading-relaxed text-slate-300">
      <h2 class="panel-title">Como ancorar</h2>
      <p>{{ anchorHint() }}</p>
      <p class="mt-2 text-slate-400">
        Para lembrar a corda da tônica: A na corda Lá (5ª), E na corda Mi (6ª), D na corda Ré (4ª). E pense
        <strong class="text-amber-300">"CA, GE"</strong>: o C acompanha o A (5ª corda) e o G acompanha o E (6ª corda).
      </p>
    </section>
  `,
})
export class CagedExplorer {
  private readonly theory = inject(MusicTheoryService);
  protected readonly metronome = inject(MetronomeService);

  protected readonly shapeNames = CAGED_SHAPE_NAMES;
  protected readonly styles = STYLES;
  protected readonly barOptions = [1, 2, 4] as const;

  protected readonly root = signal<NoteName>('C');
  protected readonly quality = signal<TriadQuality>('major');
  protected readonly shape = signal<CagedShapeName>('C');
  protected readonly showAll = signal(false);
  protected readonly showNotes = signal(false);
  protected readonly style = signal<VoicingStyle>('full');
  /** Whether the metronome walks through the shapes on its own. */
  protected readonly follow = signal(false);
  protected readonly barsPerShape = signal<1 | 2 | 4>(2);

  protected readonly chordName = computed(
    () => `${this.root()}${this.quality() === 'minor' ? 'm' : ''}`,
  );

  protected readonly anchor = computed(() =>
    this.theory.cagedAnchor(this.root(), this.quality(), this.shape()),
  );

  protected readonly neckOrder = computed(() =>
    this.theory.cagedNeckOrder(this.root(), this.quality()),
  );

  protected readonly styleHint = computed(
    () => STYLES.find((option) => option.id === this.style())?.hint ?? '',
  );
  protected readonly powerChordShape = computed(() => POWER_CHORD_SHAPES.includes(this.shape()));

  protected readonly markers = computed<FretMarker[]>(() => {
    const root = this.root();
    const quality = this.quality();
    const main = this.theory.reduceVoicing(
      root,
      this.theory.cagedVoicing(root, quality, this.shape()),
      this.style(),
    );
    const taken = new Set(main.map(key));

    const others = this.showAll()
      ? CAGED_SHAPE_NAMES.filter((name) => name !== this.shape()).flatMap((name) =>
          this.theory.cagedVoicing(root, quality, name),
        )
      : [];
    const ghosts: FretMarker[] = [];
    for (const marker of others) {
      // Neighbouring shapes share notes; keep one marker per position.
      if (!taken.has(key(marker))) {
        taken.add(key(marker));
        ghosts.push({ ...marker, ghost: true });
      }
    }

    const all = [...main, ...ghosts];
    return this.showNotes()
      ? all.map((m) => ({ ...m, label: this.theory.noteAt(m.string, m.fret) }))
      : all;
  });

  protected readonly legend = computed(() => {
    const tones = this.theory.chordTones(this.root(), this.quality());
    return this.theory.chordFormula(this.quality()).map((interval, i) => ({
      interval,
      name: INTERVAL_NAMES[interval],
      color: INTERVAL_COLORS[interval],
      note: tones[i],
    }));
  });

  protected readonly anchorHint = computed(() => {
    const { string, fret } = this.anchor();
    const where = fret === 0 ? 'solta' : `na casa ${fret}`;
    const start = `Para tocar ${this.chordName()} com o shape de ${this.shape()}, encontre a nota ${this.root()} na ${string}ª corda ${where} e monte o desenho ao redor dela.`;

    switch (this.shape()) {
      case 'E':
      case 'G':
        return `${start} Os shapes de E e de G nascem da tônica na 6ª corda: o de E se abre para a direita da tônica (em direção ao corpo) e o de G para a esquerda (em direção à pestana).`;
      case 'A':
      case 'C':
        return `${start} Os shapes de A e de C nascem da tônica na 5ª corda: o de A se abre para a direita da tônica e o de C para a esquerda.`;
      case 'D':
        return `${start} O shape de D nasce da tônica na 4ª corda. Para achá-la a partir da 6ª corda: localize a tônica lá e ande duas casas em direção ao corpo na 4ª corda (é a mesma nota, uma oitava acima).`;
    }
  });

  constructor() {
    // While following the metronome, move to the next shape at the start of every block of bars.
    effect(() => {
      const tick = this.metronome.tick();
      if (!this.follow() || tick <= 0) {
        return;
      }
      untracked(() => {
        if (tick % (this.metronome.beatsPerBar() * this.barsPerShape()) === 0) {
          this.step(1);
        }
      });
    });
  }

  /** Moves to the neighbouring shape up (1) or down (-1) the neck, wrapping around. */
  protected step(direction: 1 | -1): void {
    const order = this.neckOrder();
    const index = order.findIndex((stop) => stop.shape === this.shape());
    this.shape.set(order[(index + direction + order.length) % order.length].shape);
  }
}

function key(marker: FretMarker): string {
  return `${marker.string}:${marker.fret}`;
}
