import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import {
  ALL_STRINGS,
  FretMarker,
  FretPosition,
  GuitarString,
} from '../../core/models/fretboard.model';
import { MusicTheoryService } from '../../core/services/music-theory.service';

const WIDTH = 1000;
const NUT_X = 64;
const RIGHT_X = 988;
const OPEN_X = 40;
const TOP_Y = 26;
const STRING_GAP = 34;
const SINGLE_INLAYS = [3, 5, 7, 9, 15];
const DOUBLE_INLAYS = [12];
const DEFAULT_COLOR = '#38bdf8';

interface Dot {
  key: string;
  x: number;
  y: number;
  label: string;
  color: string;
  isRoot: boolean;
  ghost: boolean;
  active: boolean;
}

@Component({
  selector: 'app-fretboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-x-auto">
      <svg
        class="h-auto w-full min-w-[640px] select-none"
        role="img"
        [attr.viewBox]="'0 0 ' + width + ' ' + g().height"
        [attr.aria-label]="ariaLabel()"
      >
        <rect
          [attr.x]="nutX"
          [attr.y]="g().boardTop"
          [attr.width]="g().boardWidth"
          [attr.height]="g().boardHeight"
          rx="4"
          fill="#1c1410"
        />

        @for (inlay of g().inlays; track $index) {
          <circle [attr.cx]="inlay.x" [attr.cy]="inlay.y" r="7" fill="#475569" opacity="0.55" />
        }

        @for (fret of g().fretLines; track fret.fret) {
          <line
            [attr.x1]="fret.x"
            [attr.x2]="fret.x"
            [attr.y1]="g().boardTop"
            [attr.y2]="g().boardTop + g().boardHeight"
            stroke="#94a3b8"
            stroke-width="2"
            opacity="0.6"
          />
          <text
            [attr.x]="fret.labelX"
            [attr.y]="g().height - 6"
            text-anchor="middle"
            font-size="12"
            [attr.fill]="fret.marked ? '#cbd5e1' : '#64748b'"
            [attr.font-weight]="fret.marked ? 700 : 400"
          >
            {{ fret.fret }}
          </text>
        }

        <rect
          [attr.x]="nutX - 5"
          [attr.y]="g().boardTop"
          width="6"
          [attr.height]="g().boardHeight"
          fill="#e2e8f0"
        />

        @for (line of g().strings; track line.string) {
          <line
            [attr.x1]="nutX"
            [attr.x2]="rightX"
            [attr.y1]="line.y"
            [attr.y2]="line.y"
            stroke="#cbd5e1"
            [attr.stroke-width]="line.thickness"
          />
          <text [attr.x]="10" [attr.y]="line.y + 4" font-size="12" fill="#64748b">
            {{ line.string }}
          </text>
        }

        @if (interactive()) {
          @for (cell of g().cells; track cell.key) {
            <rect
              class="cursor-pointer fill-transparent hover:fill-white/10"
              [attr.x]="cell.x"
              [attr.y]="cell.y"
              [attr.width]="cell.width"
              [attr.height]="stringGap"
              rx="6"
              (click)="positionClick.emit(cell.position)"
            />
          }
        }

        @for (dot of dots(); track dot.key) {
          <g
            class="pointer-events-none"
            [attr.transform]="'translate(' + dot.x + ' ' + dot.y + ')'"
            [attr.opacity]="dot.ghost ? 0.3 : 1"
          >
            @if (dot.active) {
              <circle
                class="origin-center animate-ping [transform-box:fill-box]"
                r="13"
                fill="none"
                [attr.stroke]="dot.color"
                stroke-width="3"
              />
            }
            <circle
              [attr.r]="dot.isRoot || dot.active ? 14 : 12"
              [attr.fill]="dot.color"
              [attr.stroke]="dot.isRoot || dot.active ? '#ffffff' : 'none'"
              stroke-width="2.5"
            />
            <text y="4" text-anchor="middle" font-size="12" font-weight="700" fill="#0b1020">
              {{ dot.label }}
            </text>
          </g>
        }

        @if (target(); as t) {
          <g class="pointer-events-none" [attr.transform]="'translate(' + t.x + ' ' + t.y + ')'">
            <circle
              class="origin-center animate-ping [transform-box:fill-box]"
              r="13"
              fill="none"
              stroke="#fbbf24"
              stroke-width="3"
            />
            <circle r="13" fill="#0b1020" stroke="#fbbf24" stroke-width="3" />
            <text y="5" text-anchor="middle" font-size="14" font-weight="700" fill="#fbbf24">?</text>
          </g>
        }
      </svg>
    </div>
  `,
})
export class Fretboard {
  private readonly theory = inject(MusicTheoryService);

  /** Notes to highlight, each with its own colour and label. */
  readonly markers = input<readonly FretMarker[]>([]);
  readonly frets = input(15);
  /** Strings to draw; the highest-pitched one is drawn at the top, as in tablature. */
  readonly strings = input<readonly GuitarString[]>(ALL_STRINGS);
  /** Labels markers that have no label of their own with the note name. */
  readonly showNoteNames = input(false);
  readonly interactive = input(false);
  /** Position shown as a pulsing "?" (the quiz target). */
  readonly highlight = input<FretPosition | null>(null);

  readonly positionClick = output<FretPosition>();

  protected readonly width = WIDTH;
  protected readonly nutX = NUT_X;
  protected readonly rightX = RIGHT_X;
  protected readonly stringGap = STRING_GAP;

  private readonly orderedStrings = computed(() => [...this.strings()].sort((a, b) => a - b));
  private readonly fretWidth = computed(() => (RIGHT_X - NUT_X) / this.frets());

  protected readonly g = computed(() => {
    const strings = this.orderedStrings();
    const frets = this.frets();
    const fretWidth = this.fretWidth();
    const lastY = TOP_Y + (strings.length - 1) * STRING_GAP;
    const boardTop = TOP_Y - 14;
    const boardHeight = lastY - TOP_Y + 28;
    const midY = (TOP_Y + lastY) / 2;
    const doubleOffset = strings.length > 3 ? STRING_GAP : STRING_GAP / 2;

    const fretNumbers = Array.from({ length: frets }, (_, i) => i + 1);
    const inlays = [
      ...SINGLE_INLAYS.filter((f) => f <= frets).map((f) => ({ x: this.x(f), y: midY })),
      ...DOUBLE_INLAYS.filter((f) => f <= frets).flatMap((f) => [
        { x: this.x(f), y: midY - doubleOffset },
        { x: this.x(f), y: midY + doubleOffset },
      ]),
    ];

    return {
      height: lastY + 40,
      boardTop,
      boardHeight,
      boardWidth: RIGHT_X - NUT_X,
      inlays,
      fretLines: fretNumbers.map((fret) => ({
        fret,
        x: NUT_X + fret * fretWidth,
        labelX: this.x(fret),
        marked: SINGLE_INLAYS.includes(fret) || DOUBLE_INLAYS.includes(fret),
      })),
      strings: strings.map((string) => ({
        string,
        y: this.y(string),
        thickness: 1 + (string - 1) * 0.45,
      })),
      cells: strings.flatMap((string) =>
        [0, ...fretNumbers].map((fret) => ({
          key: `${string}:${fret}`,
          position: { string, fret } satisfies FretPosition,
          x: fret === 0 ? OPEN_X - 18 : NUT_X + (fret - 1) * fretWidth + 2,
          y: this.y(string) - STRING_GAP / 2,
          width: fret === 0 ? 36 : fretWidth - 4,
        })),
      ),
    };
  });

  protected readonly dots = computed<Dot[]>(() => {
    const visible = new Set(this.orderedStrings());
    return (
      this.markers()
        .filter((m) => visible.has(m.string) && m.fret >= 0 && m.fret <= this.frets())
        .map((m) => ({
          key: `${m.string}:${m.fret}`,
          x: this.x(m.fret),
          y: this.y(m.string),
          label: m.label ?? (this.showNoteNames() ? this.theory.noteAt(m.string, m.fret) : ''),
          color: m.color ?? DEFAULT_COLOR,
          isRoot: !!m.isRoot,
          ghost: !!m.ghost,
          active: !!m.active,
        }))
        // Dimmed markers first so the main shape is painted on top of them.
        .sort((a, b) => Number(b.ghost) - Number(a.ghost))
    );
  });

  protected readonly target = computed(() => {
    const position = this.highlight();
    return position ? { x: this.x(position.fret), y: this.y(position.string) } : null;
  });

  protected readonly ariaLabel = computed(
    () => `Braço da guitarra, ${this.frets()} trastes, ${this.dots().length} notas destacadas`,
  );

  private x(fret: number): number {
    return fret === 0 ? OPEN_X : NUT_X + (fret - 0.5) * this.fretWidth();
  }

  private y(string: GuitarString): number {
    return TOP_Y + this.orderedStrings().indexOf(string) * STRING_GAP;
  }
}
