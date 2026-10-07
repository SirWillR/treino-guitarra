import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Chord } from '../../core/models/chord.model';

const LEFT_X = 24;
const STRING_GAP = 16;
const TOP_Y = 40;
const FRET_GAP = 22;
const FRET_ROWS = 5;

@Component({
  selector: 'app-chord-diagram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block' },
  template: `
    <figure
      class="rounded-xl border p-2 transition duration-200"
      [class]="
        active()
          ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_28px_-4px] shadow-amber-400/70'
          : 'border-slate-800 bg-slate-900/70'
      "
      [style.width.px]="widthPx()"
    >
      @if (showName()) {
        <figcaption
          class="text-center font-bold"
          [class]="active() ? 'text-amber-300' : 'text-slate-100'"
          [style.font-size.px]="widthPx() / 7"
        >
          {{ chord().name }}
        </figcaption>
      }
      <svg viewBox="0 0 132 158" class="h-auto w-full" role="img" [attr.aria-label]="ariaLabel()">
        @for (mark of d().topMarks; track $index) {
          <text
            [attr.x]="mark.x"
            y="30"
            text-anchor="middle"
            font-size="13"
            font-weight="700"
            [attr.fill]="mark.symbol === 'X' ? '#f87171' : '#94a3b8'"
          >
            {{ mark.symbol }}
          </text>
        }

        @for (y of fretYs; track y) {
          <line [attr.x1]="leftX" [attr.x2]="rightX" [attr.y1]="y" [attr.y2]="y" stroke="#64748b" stroke-width="1.5" />
        }
        @for (x of stringXs; track x) {
          <line [attr.x1]="x" [attr.x2]="x" [attr.y1]="topY" [attr.y2]="bottomY" stroke="#94a3b8" stroke-width="1.5" />
        }

        @if (chord().baseFret === 1) {
          <rect [attr.x]="leftX - 1" [attr.y]="topY - 4" [attr.width]="rightX - leftX + 2" height="5" fill="#e2e8f0" />
        } @else {
          <text [attr.x]="rightX + 8" [attr.y]="topY + 16" font-size="11" font-weight="700" fill="#cbd5e1">
            {{ chord().baseFret }}ª
          </text>
        }

        @if (d().barre; as barre) {
          <rect
            [attr.x]="barre.x"
            [attr.y]="barre.y - 7"
            [attr.width]="barre.width"
            height="14"
            rx="7"
            fill="#fbbf24"
          />
        }

        @for (dot of d().dots; track $index) {
          <circle [attr.cx]="dot.x" [attr.cy]="dot.y" r="7" fill="#fbbf24" />
          <text [attr.x]="dot.x" [attr.y]="dot.y + 3.5" text-anchor="middle" font-size="10" font-weight="700" fill="#0b1020">
            {{ dot.finger }}
          </text>
        }
      </svg>
    </figure>
  `,
})
export class ChordDiagram {
  readonly chord = input.required<Chord>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  /** Glowing state, used by the sequence players for the chord being played. */
  readonly active = input(false);
  readonly showName = input(true);

  protected readonly leftX = LEFT_X;
  protected readonly rightX = LEFT_X + 5 * STRING_GAP;
  protected readonly topY = TOP_Y;
  protected readonly bottomY = TOP_Y + FRET_ROWS * FRET_GAP;
  protected readonly stringXs = Array.from({ length: 6 }, (_, i) => LEFT_X + i * STRING_GAP);
  protected readonly fretYs = Array.from({ length: FRET_ROWS + 1 }, (_, i) => TOP_Y + i * FRET_GAP);

  protected readonly widthPx = computed(() => ({ sm: 104, md: 136, lg: 208 })[this.size()]);

  protected readonly d = computed(() => {
    const chord = this.chord();
    const fretY = (fret: number) => TOP_Y + (fret - chord.baseFret + 0.5) * FRET_GAP;
    // Index 0 is string 6, drawn on the left.
    const stringX = (string: number) => LEFT_X + (6 - string) * STRING_GAP;

    const topMarks = chord.frets.flatMap((fret, i) =>
      fret === 'x' || fret === 0
        ? [{ x: this.stringXs[i], symbol: fret === 'x' ? 'X' : 'O' }]
        : [],
    );

    const dots = chord.frets.flatMap((fret, i) =>
      fret !== 'x' && fret > 0
        ? [{ x: this.stringXs[i], y: fretY(fret), finger: chord.fingers[i] }]
        : [],
    );

    const barre = chord.barre && {
      x: stringX(chord.barre.lowString) - 7,
      y: fretY(chord.barre.fret),
      width: stringX(chord.barre.highString) - stringX(chord.barre.lowString) + 14,
    };

    return { topMarks, dots, barre };
  });

  protected readonly ariaLabel = computed(() => {
    const chord = this.chord();
    return `Diagrama do acorde ${chord.name}: ${chord.frets.join(' ')}`;
  });
}
