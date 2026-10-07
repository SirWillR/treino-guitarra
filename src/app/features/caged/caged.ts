import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CAGED_SHAPE_NAMES, CagedShapeName } from '../../core/models/caged.model';
import { FretMarker } from '../../core/models/fretboard.model';
import {
  INTERVAL_COLORS,
  INTERVAL_NAMES,
  NoteName,
  TriadQuality,
} from '../../core/models/note.model';
import { MusicTheoryService } from '../../core/services/music-theory.service';
import { Fretboard } from '../../shared/fretboard/fretboard';
import { HelpDialog } from '../../shared/help-dialog/help-dialog';
import { NotePicker } from '../../shared/note-picker/note-picker';
import { CagedHelp } from './caged-help';

@Component({
  selector: 'app-caged',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Fretboard, NotePicker, HelpDialog, CagedHelp],
  template: `
    <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Sistema CAGED</h1>
        <p class="mt-1 text-sm text-slate-400">
          Um mesmo acorde em cinco desenhos ao longo do braço. Ache a tônica e o shape vem junto.
        </p>
      </div>
      <button type="button" class="btn-ghost" (click)="help.open()">❓ O que é isso?</button>
    </header>

    <app-help-dialog #help title="O que é o Sistema CAGED?" firstVisitKey="fht.help.caged">
      <app-caged-help />
    </app-help-dialog>

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
        <div class="flex flex-wrap items-center gap-2">
          @for (name of shapeNames; track name) {
            <button type="button" class="chip min-w-28" [class.chip-active]="shape() === name" (click)="shape.set(name)">
              Shape de {{ name }}
            </button>
          }
          <label class="ml-auto flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" class="accent-amber-400" [checked]="showAll()" (change)="showAll.set(!showAll())" />
            Mostrar os outros shapes
          </label>
          <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" class="accent-amber-400" [checked]="showNotes()" (change)="showNotes.set(!showNotes())" />
            Nomes das notas
          </label>
        </div>
      </div>
    </section>

    <section class="panel mb-5">
      <div class="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 class="text-xl font-bold text-white">
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

    <section class="panel text-sm leading-relaxed text-slate-300">
      <h2 class="panel-title">Como ancorar</h2>
      <p>{{ anchorHint() }}</p>
    </section>
  `,
})
export class Caged {
  private readonly theory = inject(MusicTheoryService);

  protected readonly shapeNames = CAGED_SHAPE_NAMES;
  protected readonly root = signal<NoteName>('C');
  protected readonly quality = signal<TriadQuality>('major');
  protected readonly shape = signal<CagedShapeName>('C');
  protected readonly showAll = signal(false);
  protected readonly showNotes = signal(false);

  protected readonly chordName = computed(
    () => `${this.root()}${this.quality() === 'minor' ? 'm' : ''}`,
  );

  protected readonly anchor = computed(() =>
    this.theory.cagedAnchor(this.root(), this.quality(), this.shape()),
  );

  protected readonly markers = computed<FretMarker[]>(() => {
    const root = this.root();
    const quality = this.quality();
    const main = this.theory.cagedVoicing(root, quality, this.shape());
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
}

function key(marker: FretMarker): string {
  return `${marker.string}:${marker.fret}`;
}
