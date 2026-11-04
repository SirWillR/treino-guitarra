import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CAGED_SHAPE_NAMES, CagedShapeName } from '../../core/models/caged.model';
import { FretMarker, FretPosition } from '../../core/models/fretboard.model';
import { NOTE_NAMES, NoteName, TriadQuality } from '../../core/models/note.model';
import { MusicTheoryService } from '../../core/services/music-theory.service';
import { mediaQuery } from '../../core/utils/media';
import { readStored, writeStored } from '../../core/utils/storage';
import { Fretboard } from '../../shared/fretboard/fretboard';

type QualityScope = 'major' | 'minor' | 'both';

interface Question {
  root: NoteName;
  quality: TriadQuality;
  shape: CagedShapeName;
}

type Outcome = 'correct' | 'wrong';

interface Answer {
  outcome: Outcome;
  clicked: FretPosition;
}

const BEST_STREAK_KEY = 'fht.cagedQuiz.bestStreak';
const NEXT_QUESTION_DELAY_MS = 1400;
const CORRECT_COLOR = '#34d399';
const WRONG_COLOR = '#fb7185';

const ROOT_STRING_HINT: Record<CagedShapeName, string> = {
  C: 'Shape de C → tônica na 5ª corda (lembre: "CA", o C anda junto com o A).',
  A: 'Shape de A → tônica na 5ª corda, a corda Lá.',
  G: 'Shape de G → tônica na 6ª corda (lembre: "GE", o G anda junto com o E).',
  E: 'Shape de E → tônica na 6ª corda, a corda Mi.',
  D: 'Shape de D → tônica na 4ª corda, a corda Ré.',
};

@Component({
  selector: 'app-caged-quiz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Fretboard],
  template: `
    <section class="mb-4 grid grid-cols-4 gap-2 sm:mb-5 sm:gap-3">
      <div class="panel px-2 py-3 text-center sm:p-5 sm:text-left">
        <div class="panel-title mb-1 truncate text-[10px] tracking-wide sm:mb-3 sm:text-xs sm:tracking-widest">Acertos</div>
        <div class="text-xl font-bold text-white tabular-nums sm:text-3xl">{{ correct() }}<span class="text-sm text-slate-500 sm:text-lg">/{{ total() }}</span></div>
      </div>
      <div class="panel px-2 py-3 text-center sm:p-5 sm:text-left">
        <div class="panel-title mb-1 truncate text-[10px] tracking-wide sm:mb-3 sm:text-xs sm:tracking-widest">Precisão</div>
        <div class="text-xl font-bold text-white tabular-nums sm:text-3xl">{{ accuracy() }}%</div>
      </div>
      <div class="panel px-2 py-3 text-center sm:p-5 sm:text-left">
        <div class="panel-title mb-1 truncate text-[10px] tracking-wide sm:mb-3 sm:text-xs sm:tracking-widest">Sequência</div>
        <div class="text-xl font-bold text-amber-300 tabular-nums sm:text-3xl">🔥{{ streak() }}</div>
      </div>
      <div class="panel px-2 py-3 text-center sm:p-5 sm:text-left">
        <div class="panel-title mb-1 truncate text-[10px] tracking-wide sm:mb-3 sm:text-xs sm:tracking-widest">Recorde</div>
        <div class="text-xl font-bold text-white tabular-nums sm:text-3xl">{{ bestStreak() }}</div>
      </div>
    </section>

    <details class="panel group mb-4 sm:mb-5" [open]="wideScreen()">
      <summary class="flex cursor-pointer list-none flex-wrap items-center gap-x-2 [&::-webkit-details-marker]:hidden">
        <h2 class="panel-title mb-0">Modo do quiz</h2>
        <span class="ml-auto text-xs text-slate-500 transition-transform group-open:rotate-90" aria-hidden="true">▶</span>
        <span class="mt-1 w-full truncate text-sm text-slate-300 group-open:hidden">{{ summary() }}</span>
      </summary>

      <div class="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-[auto_1fr] sm:items-center">
        <span class="text-sm font-semibold text-slate-300">Tipo</span>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="chip" [class.chip-active]="qualityScope() === 'major'" (click)="setQualityScope('major')">Maior</button>
          <button type="button" class="chip" [class.chip-active]="qualityScope() === 'minor'" (click)="setQualityScope('minor')">Menor</button>
          <button type="button" class="chip" [class.chip-active]="qualityScope() === 'both'" (click)="setQualityScope('both')">Os dois</button>
        </div>

        <span class="text-sm font-semibold text-slate-300">Shapes</span>
        <div class="grid grid-cols-5 gap-1.5 sm:flex sm:gap-2">
          @for (name of shapeNames; track name) {
            <button type="button" class="chip px-1 sm:min-w-12" [class.chip-active]="shapes().includes(name)" (click)="toggleShape(name)">
              {{ name }}
            </button>
          }
        </div>

        <span class="text-sm font-semibold text-slate-300">Tonalidades</span>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="chip" [class.chip-active]="!naturalsOnly()" (click)="setNaturalsOnly(false)">Todas</button>
          <button type="button" class="chip" [class.chip-active]="naturalsOnly()" (click)="setNaturalsOnly(true)">Só naturais</button>
        </div>
      </div>
    </details>

    <section class="panel mb-4 sm:mb-5">
      <div class="mb-3 flex items-start justify-between gap-3">
        <h2 class="text-base font-semibold text-white sm:text-lg" aria-live="polite">
          @if (answer(); as a) {
            @if (a.outcome === 'correct') {
              <span class="text-emerald-400">✓ Isso! {{ chordName() }} no shape de {{ question().shape }}.</span>
            } @else {
              <span class="text-rose-400">
                ✗ A tônica ancora na {{ anchorString() }}ª corda,
                {{ shown()?.anchor?.fret === 0 ? 'solta' : 'casa ' + shown()?.anchor?.fret }}.
              </span>
            }
          } @else {
            Toque a <strong class="text-amber-300">tônica</strong> de
            <strong class="text-amber-300">{{ chordName() }}</strong> no
            <strong class="text-amber-300">shape de {{ question().shape }}</strong>
          }
        </h2>
        <button type="button" class="btn-ghost shrink-0" (click)="reset()">Zerar</button>
      </div>

      <app-fretboard [markers]="markers()" [interactive]="!answer()" (positionClick)="pick($event)" />

      <div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
        @if (notice()) {
          <p class="text-amber-300">{{ notice() }}</p>
        } @else if (hintOpen()) {
          <p class="text-slate-300">💡 {{ hint() }}</p>
        } @else if (!answer()) {
          <button type="button" class="btn-ghost" (click)="hintOpen.set(true)">💡 Dica</button>
        }
      </div>
    </section>
  `,
})
export class CagedQuiz {
  private readonly theory = inject(MusicTheoryService);

  protected readonly shapeNames = CAGED_SHAPE_NAMES;
  protected readonly wideScreen = mediaQuery('(min-width: 640px)');

  protected readonly qualityScope = signal<QualityScope>('major');
  protected readonly shapes = signal<readonly CagedShapeName[]>(CAGED_SHAPE_NAMES);
  protected readonly naturalsOnly = signal(true);

  protected readonly correct = signal(0);
  protected readonly total = signal(0);
  protected readonly streak = signal(0);
  protected readonly bestStreak = signal(readStored(BEST_STREAK_KEY, 0));
  protected readonly accuracy = computed(() =>
    this.total() === 0 ? 0 : Math.round((this.correct() / this.total()) * 100),
  );

  protected readonly question = signal<Question>(this.randomQuestion());
  protected readonly answer = signal<Answer | null>(null);
  protected readonly hintOpen = signal(false);
  /** Feedback that does not count as an answer, such as tapping another root of the shape. */
  protected readonly notice = signal<string | null>(null);

  protected readonly chordName = computed(() => {
    const { root, quality } = this.question();
    return `${root}${quality === 'minor' ? 'm' : ''}`;
  });
  protected readonly hint = computed(() => ROOT_STRING_HINT[this.question().shape]);
  protected readonly anchorString = computed(
    () => this.theory.cagedShape(this.question().shape, this.question().quality).rootString,
  );

  protected readonly summary = computed(() => {
    const quality = { major: 'maiores', minor: 'menores', both: 'maiores e menores' }[
      this.qualityScope()
    ];
    const keys = this.naturalsOnly() ? 'tons naturais' : 'todos os tons';
    return `Acordes ${quality} · shapes ${this.shapes().join(' ')} · ${keys}`;
  });

  /** Every place the asked shape fits on the neck. */
  private readonly instances = computed(() => {
    const { root, quality, shape } = this.question();
    return this.theory.cagedVoicings(root, quality, shape);
  });

  /** The shape revealed after answering: the one clicked when right, the lowest one otherwise. */
  protected readonly shown = computed(() => {
    const answer = this.answer();
    if (!answer) {
      return null;
    }
    const instances = this.instances();
    return instances.find((i) => samePosition(i.anchor, answer.clicked)) ?? instances[0];
  });

  protected readonly markers = computed<FretMarker[]>(() => {
    const answer = this.answer();
    const shown = this.shown();
    if (!answer || !shown) {
      return [];
    }
    const markers = shown.markers.map((m) =>
      samePosition(m, shown.anchor) && answer.outcome === 'correct'
        ? { ...m, color: CORRECT_COLOR }
        : m,
    );
    if (answer.outcome === 'wrong' && !markers.some((m) => samePosition(m, answer.clicked))) {
      markers.push({ ...answer.clicked, label: '✗', color: WRONG_COLOR });
    }
    return markers;
  });

  private nextTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => writeStored(BEST_STREAK_KEY, this.bestStreak()));
    inject(DestroyRef).onDestroy(() => this.clearTimer());
  }

  protected pick(position: FretPosition): void {
    if (this.answer()) {
      return;
    }
    const instances = this.instances();
    if (instances.some((i) => samePosition(i.anchor, position))) {
      this.finish('correct', position);
      return;
    }
    const otherRoot = instances
      .flatMap((i) => i.markers)
      .some((m) => m.isRoot && samePosition(m, position));
    if (otherRoot) {
      this.notice.set(
        `Essa também é uma tônica do shape, mas ancore pela corda mais grave: a ${this.anchorString()}ª.`,
      );
      return;
    }
    this.finish('wrong', position);
  }

  protected toggleShape(name: CagedShapeName): void {
    const current = this.shapes();
    if (current.includes(name)) {
      if (current.length === 1) {
        return;
      }
      this.shapes.set(current.filter((shape) => shape !== name));
    } else {
      this.shapes.set(CAGED_SHAPE_NAMES.filter((shape) => shape === name || current.includes(shape)));
    }
    this.nextQuestion();
  }

  protected setQualityScope(scope: QualityScope): void {
    this.qualityScope.set(scope);
    this.nextQuestion();
  }

  protected setNaturalsOnly(value: boolean): void {
    this.naturalsOnly.set(value);
    this.nextQuestion();
  }

  protected reset(): void {
    this.correct.set(0);
    this.total.set(0);
    this.streak.set(0);
    this.nextQuestion();
  }

  private finish(outcome: Outcome, clicked: FretPosition): void {
    this.answer.set({ outcome, clicked });
    this.notice.set(null);
    this.total.update((n) => n + 1);
    if (outcome === 'correct') {
      this.correct.update((n) => n + 1);
      this.streak.update((n) => n + 1);
      this.bestStreak.update((best) => Math.max(best, this.streak()));
      this.nextTimer = setTimeout(() => this.nextQuestion(), NEXT_QUESTION_DELAY_MS);
    } else {
      this.streak.set(0);
      // A miss stays on screen a little longer, so the right anchor can be studied.
      this.nextTimer = setTimeout(() => this.nextQuestion(), NEXT_QUESTION_DELAY_MS * 2);
    }
  }

  private nextQuestion(): void {
    this.clearTimer();
    this.answer.set(null);
    this.notice.set(null);
    this.hintOpen.set(false);
    this.question.set(this.randomQuestion(this.question()));
  }

  private randomQuestion(previous?: Question): Question {
    const roots = NOTE_NAMES.filter((note) => !this.naturalsOnly() || !note.includes('#'));
    const qualities: TriadQuality[] =
      this.qualityScope() === 'both' ? ['major', 'minor'] : [this.qualityScope() as TriadQuality];
    const shapes = this.shapes();

    let question: Question;
    do {
      question = {
        root: pickOne(roots),
        quality: pickOne(qualities),
        shape: pickOne(shapes),
      };
    } while (
      previous &&
      question.root === previous.root &&
      question.quality === previous.quality &&
      question.shape === previous.shape
    );
    return question;
  }

  private clearTimer(): void {
    if (this.nextTimer !== null) {
      clearTimeout(this.nextTimer);
      this.nextTimer = null;
    }
  }
}

function pickOne<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function samePosition(a: FretPosition, b: FretPosition): boolean {
  return a.string === b.string && a.fret === b.fret;
}
