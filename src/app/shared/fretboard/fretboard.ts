import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  ALL_STRINGS,
  FretMarker,
  FretPosition,
  GuitarString,
} from '../../core/models/fretboard.model';
import { MusicTheoryService } from '../../core/services/music-theory.service';
import { mediaQuery } from '../../core/utils/media';

const SINGLE_INLAYS = [3, 5, 7, 9, 15];
const DOUBLE_INLAYS = [12];
const DEFAULT_COLOR = '#38bdf8';
/** Below Tailwind's `sm` breakpoint the neck is drawn standing up so it fits a phone held upright. */
const NARROW_SCREEN = '(max-width: 639px)';

export type FretboardOrientation = 'auto' | 'horizontal' | 'vertical';

/**
 * Geometry along the neck ("along": nut → body) and across it ("across": one string to the next).
 * Horizontal maps along → x and across → y; vertical maps along → y and across → x.
 */
interface Layout {
  /** Where the nut sits on the along axis. */
  nut: number;
  /** Centre of the open-string dots, before the nut. */
  open: number;
  /** Along position of the string numbers. */
  stringLabel: number;
  /** Across position of the first string drawn. */
  first: number;
  gap: number;
  /** Size multiplier for dots, so they stay finger-sized on the wider vertical string gap. */
  dotScale: number;
}

const HORIZONTAL: Layout = { nut: 64, open: 40, stringLabel: 10, first: 26, gap: 34, dotScale: 1 };
const VERTICAL: Layout = { nut: 76, open: 44, stringLabel: 18, first: 36, gap: 48, dotScale: 1.25 };
/** Total along length of the horizontal neck, whatever the number of frets. */
const HORIZONTAL_LENGTH = 988;
/** Length of each fret on the vertical neck, which grows downwards with the number of frets. */
const VERTICAL_FRET = 46;

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
    <div [class.overflow-x-auto]="!vertical()">
      <svg
        class="mx-auto block h-auto w-full select-none"
        role="img"
        [style.min-width.px]="vertical() ? null : minWidth()"
        [style.max-width.px]="vertical() ? g().width * 1.1 : null"
        [attr.viewBox]="'0 0 ' + g().width + ' ' + g().height"
        [attr.aria-label]="ariaLabel()"
      >
        <rect
          [attr.x]="g().board.x"
          [attr.y]="g().board.y"
          [attr.width]="g().board.width"
          [attr.height]="g().board.height"
          rx="4"
          fill="#1c1410"
        />

        @for (inlay of g().inlays; track $index) {
          <circle [attr.cx]="inlay.x" [attr.cy]="inlay.y" r="7" fill="#475569" opacity="0.55" />
        }

        @for (fret of g().fretLines; track fret.fret) {
          <line
            [attr.x1]="fret.x1"
            [attr.x2]="fret.x2"
            [attr.y1]="fret.y1"
            [attr.y2]="fret.y2"
            stroke="#94a3b8"
            stroke-width="2"
            opacity="0.6"
          />
          <text
            [attr.x]="fret.label.x"
            [attr.y]="fret.label.y"
            text-anchor="middle"
            [attr.font-size]="labelSize()"
            [attr.fill]="fret.marked ? '#cbd5e1' : '#64748b'"
            [attr.font-weight]="fret.marked ? 700 : 400"
          >
            {{ fret.fret }}
          </text>
        }

        <rect
          [attr.x]="g().nut.x"
          [attr.y]="g().nut.y"
          [attr.width]="g().nut.width"
          [attr.height]="g().nut.height"
          fill="#e2e8f0"
        />

        @for (line of g().strings; track line.string) {
          <line
            [attr.x1]="line.x1"
            [attr.x2]="line.x2"
            [attr.y1]="line.y1"
            [attr.y2]="line.y2"
            stroke="#cbd5e1"
            [attr.stroke-width]="line.thickness"
          />
          <text
            [attr.x]="line.label.x"
            [attr.y]="line.label.y"
            [attr.text-anchor]="vertical() ? 'middle' : 'start'"
            [attr.font-size]="labelSize()"
            fill="#64748b"
          >
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
              [attr.height]="cell.height"
              rx="6"
              (click)="positionClick.emit(cell.position)"
            />
          }
        }

        @for (dot of dots(); track dot.key) {
          <g
            class="pointer-events-none"
            [attr.transform]="'translate(' + dot.x + ' ' + dot.y + ') scale(' + layout().dotScale + ')'"
            [attr.opacity]="dot.ghost ? 0.5 : 1"
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
          <g
            #target
            class="pointer-events-none"
            [attr.transform]="'translate(' + t.x + ' ' + t.y + ') scale(' + layout().dotScale + ')'"
          >
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
  private readonly narrowScreen = mediaQuery(NARROW_SCREEN);

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
  /** "auto" stands the neck up on narrow screens and lays it down otherwise. */
  readonly orientation = input<FretboardOrientation>('auto');

  readonly positionClick = output<FretPosition>();

  private readonly targetRef = viewChild<ElementRef<SVGGElement>>('target');

  protected readonly vertical = computed(() =>
    this.orientation() === 'auto' ? this.narrowScreen() : this.orientation() === 'vertical',
  );
  protected readonly layout = computed(() => (this.vertical() ? VERTICAL : HORIZONTAL));
  protected readonly labelSize = computed(() => (this.vertical() ? 13 : 12));
  /** Horizontal necks scroll sideways below this width instead of shrinking the dots away. */
  protected readonly minWidth = computed(() => Math.min(640, 80 + this.frets() * 40));

  /**
   * Horizontal: highest string on top, as in tablature.
   * Vertical: low E on the left, as in a chord diagram.
   */
  private readonly orderedStrings = computed(() =>
    [...this.strings()].sort((a, b) => (this.vertical() ? b - a : a - b)),
  );
  private readonly end = computed(() =>
    this.vertical() ? VERTICAL.nut + this.frets() * VERTICAL_FRET : HORIZONTAL_LENGTH,
  );
  private readonly fretLength = computed(() => (this.end() - this.layout().nut) / this.frets());

  protected readonly g = computed(() => {
    const { nut, first, gap, stringLabel } = this.layout();
    const strings = this.orderedStrings();
    const frets = this.frets();
    const fretLength = this.fretLength();
    const end = this.end();
    const last = first + (strings.length - 1) * gap;
    const boardStart = first - 14;
    const boardSize = last - first + 28;
    const mid = (first + last) / 2;
    const doubleOffset = strings.length > 3 ? gap : gap / 2;
    // Fret numbers sit just past the last string.
    const fretLabelAcross = last + (this.vertical() ? 32 : 34);
    const acrossSize = last + 40;
    const alongSize = this.vertical() ? end + 12 : 1000;

    const fretNumbers = Array.from({ length: frets }, (_, i) => i + 1);
    const inlays = [
      ...SINGLE_INLAYS.filter((f) => f <= frets).map((f) => this.pt(this.along(f), mid)),
      ...DOUBLE_INLAYS.filter((f) => f <= frets).flatMap((f) => [
        this.pt(this.along(f), mid - doubleOffset),
        this.pt(this.along(f), mid + doubleOffset),
      ]),
    ];

    return {
      width: this.vertical() ? acrossSize : alongSize,
      height: this.vertical() ? alongSize : acrossSize,
      board: this.box(nut, end - nut, boardStart, boardSize),
      nut: this.box(nut - 5, 6, boardStart, boardSize),
      inlays,
      fretLines: fretNumbers.map((fret) => {
        const along = nut + fret * fretLength;
        const from = this.pt(along, boardStart);
        const to = this.pt(along, boardStart + boardSize);
        const label = this.pt(this.along(fret), fretLabelAcross);
        return {
          fret,
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
          // Text is anchored on its baseline; nudge it down to centre it on the fret.
          label: this.vertical() ? { x: label.x, y: label.y + 4 } : label,
          marked: SINGLE_INLAYS.includes(fret) || DOUBLE_INLAYS.includes(fret),
        };
      }),
      strings: strings.map((string) => {
        const across = this.across(string);
        const from = this.pt(nut, across);
        const to = this.pt(end, across);
        const label = this.pt(stringLabel, across);
        return {
          string,
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
          label: this.vertical() ? label : { x: label.x, y: label.y + 4 },
          thickness: 1 + (string - 1) * 0.45,
        };
      }),
      cells: strings.flatMap((string) =>
        [0, ...fretNumbers].map((fret) => ({
          key: `${string}:${fret}`,
          position: { string, fret } satisfies FretPosition,
          ...(fret === 0
            ? this.box(this.layout().open - 18, 36, this.across(string) - gap / 2, gap)
            : this.box(nut + (fret - 1) * fretLength + 2, fretLength - 4, this.across(string) - gap / 2, gap)),
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
          ...this.pt(this.along(m.fret), this.across(m.string)),
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
    return position ? this.pt(this.along(position.fret), this.across(position.string)) : null;
  });

  protected readonly ariaLabel = computed(
    () => `Braço da guitarra, ${this.frets()} trastes, ${this.dots().length} notas destacadas`,
  );

  constructor() {
    // The standing neck is taller than a phone screen and the quiz pins its answers over the bottom
    // of it: bring the "?" back into the upper part of the screen when it lands out of sight.
    afterRenderEffect(() => {
      const target = this.targetRef()?.nativeElement;
      if (!target || !this.vertical() || !this.highlight()) {
        return;
      }
      const { top, bottom } = target.getBoundingClientRect();
      if (top < 0 || bottom > window.innerHeight * 0.55) {
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
  }

  /** Centre of a fret on the along axis; fret 0 is the open string, before the nut. */
  private along(fret: number): number {
    const { nut, open } = this.layout();
    return fret === 0 ? open : nut + (fret - 0.5) * this.fretLength();
  }

  private across(string: GuitarString): number {
    const { first, gap } = this.layout();
    return first + this.orderedStrings().indexOf(string) * gap;
  }

  private pt(along: number, across: number): { x: number; y: number } {
    return this.vertical() ? { x: across, y: along } : { x: along, y: across };
  }

  private box(along: number, alongSize: number, across: number, acrossSize: number) {
    const { x, y } = this.pt(along, across);
    return this.vertical()
      ? { x, y, width: acrossSize, height: alongSize }
      : { x, y, width: alongSize, height: acrossSize };
  }
}
