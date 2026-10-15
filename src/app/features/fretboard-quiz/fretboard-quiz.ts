import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  ALL_STRINGS,
  FretMarker,
  FretPosition,
  GuitarString,
} from '../../core/models/fretboard.model';
import { NoteName, NOTES } from '../../core/models/note.model';
import { MusicTheoryService } from '../../core/services/music-theory.service';
import { mediaQuery } from '../../core/utils/media';
import { readStored, writeStored } from '../../core/utils/storage';
import { Fretboard } from '../../shared/fretboard/fretboard';
import { NotePicker } from '../../shared/note-picker/note-picker';

type Mode = 'map' | 'quiz';

interface QuizAnswer {
  given: NoteName;
  expected: NoteName;
  correct: boolean;
}

/**
 * The quiz area is the intersection of independent filters. Options of the same filter exclude
 * each other (a question cannot be on "one string" and on "strings 6 and 5" at once), while
 * options of different filters always combine.
 */
type StringScope = 'all' | 'single' | 'bass';
type FretScope = 'all' | 'inlays' | 'first';

interface FilterOption<T> {
  id: T;
  label: string;
  /** How the option reads inside the summary sentence. */
  summary: string;
}

const BEST_STREAK_KEY = 'fht.quiz.bestStreak';
const SHOW_FOUND_KEY = 'fht.quiz.showFound';
const QUIZ_MAX_FRET = 12;
/** Frets with an inlay dot within the quiz range. */
const INLAY_FRETS = [3, 5, 7, 9, 12];
const FIRST_POSITION_MAX_FRET = 5;
/** Order in which "one string at a time" moves on: from the lowest string to the highest. */
const STRING_ORDER: readonly GuitarString[] = [6, 5, 4, 3, 2, 1];
const NEXT_QUESTION_DELAY_MS = 1100;

const STRING_SCOPES: readonly FilterOption<StringScope>[] = [
  { id: 'all', label: 'Todas', summary: 'todas as cordas' },
  { id: 'single', label: 'Uma corda por vez', summary: 'uma corda por vez' },
  { id: 'bass', label: 'Cordas 6 e 5', summary: 'cordas 6 e 5' },
];

const FRET_SCOPES: readonly FilterOption<FretScope>[] = [
  { id: 'all', label: 'Todas', summary: 'todas as casas até a 12' },
  { id: 'inlays', label: 'Casas marcadas', summary: 'casas com bolinha (3, 5, 7, 9 e 12)' },
  { id: 'first', label: 'Primeiras casas', summary: 'da corda solta até a casa 5' },
];

@Component({
  selector: 'app-fretboard-quiz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Fretboard, NotePicker],
  template: `
    <header class="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Braço & Quiz</h1>
        <p class="mt-1 text-sm text-slate-400">Memorize onde cada nota mora no braço.</p>
      </div>
      <div class="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto" role="tablist">
        <button type="button" class="chip" [class.chip-active]="mode() === 'map'" (click)="mode.set('map')">
          Mapa Livre
        </button>
        <button type="button" class="chip" [class.chip-active]="mode() === 'quiz'" (click)="mode.set('quiz')">
          Quiz de Identificação
        </button>
      </div>
    </header>

    @if (mode() === 'map') {
      <section class="panel mb-5">
        <h2 class="panel-title">Destacar nota</h2>
        <app-note-picker [value]="selectedNote()" [colored]="true" (valueChange)="selectNote($event)" />
        <p class="mt-3 text-sm text-slate-400">
          @if (selectedNote(); as note) {
            {{ mapMarkers().length }} casas com a nota
            <strong class="text-slate-100">{{ note }}</strong> até o traste 15. Clique na nota de novo para limpar.
          } @else {
            Escolha uma nota acima ou clique em qualquer casa do braço.
          }
        </p>
      </section>

      <section class="panel">
        <app-fretboard [markers]="mapMarkers()" [interactive]="true" (positionClick)="selectAt($event)" />
      </section>
    } @else {
      <!-- One compact row on phones so the neck and the answers stay close to the top. -->
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

      <!-- Collapsed by default on phones: the filters are set once, the quiz is played many times. -->
      <details class="panel group mb-4 sm:mb-5" [open]="wideScreen()">
        <summary class="flex cursor-pointer list-none flex-wrap items-center gap-x-2 [&::-webkit-details-marker]:hidden">
          <h2 class="panel-title mb-0">Modo do quiz</h2>
          <span class="ml-auto text-xs text-slate-500 transition-transform group-open:rotate-90" aria-hidden="true">▶</span>
          <span class="mt-1 w-full truncate text-sm text-slate-300 group-open:hidden">
            {{ summary() }} · <strong class="text-slate-100 tabular-nums">{{ totalPositions() }}</strong> casas
          </span>
        </summary>
        <p class="mt-3 mb-4 text-sm text-slate-400">
          Combine um filtro de cada linha: as perguntas saem só das casas que passam em todos.
        </p>

        <div class="grid gap-x-4 gap-y-3 sm:grid-cols-[auto_1fr] sm:items-center">
          <span class="text-sm font-semibold text-slate-300">Cordas</span>
          <div class="flex flex-wrap items-center gap-2">
            @for (option of stringScopes; track option.id) {
              <button type="button" class="chip" [class.chip-active]="stringScope() === option.id" (click)="setStringScope(option.id)">
                {{ option.label }}
              </button>
            }
            @if (stringScope() === 'single') {
              <span class="mx-1 hidden h-6 w-px bg-slate-700 sm:block"></span>
              @for (string of stringOrder; track string) {
                <button type="button" class="chip" [class.chip-active]="quizString() === string" (click)="setQuizString(string)">
                  {{ string }}ª <span class="text-xs opacity-70">({{ openNote(string) }})</span>
                </button>
              }
            }
          </div>

          <span class="text-sm font-semibold text-slate-300">Casas</span>
          <div class="flex flex-wrap gap-2">
            @for (option of fretScopes; track option.id) {
              <button type="button" class="chip" [class.chip-active]="fretScope() === option.id" (click)="setFretScope(option.id)">
                {{ option.label }}
              </button>
            }
          </div>

          <span class="text-sm font-semibold text-slate-300">Notas</span>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="chip" [class.chip-active]="!naturalsOnly()" (click)="setNaturalsOnly(false)">Todas</button>
            <button type="button" class="chip" [class.chip-active]="naturalsOnly()" (click)="setNaturalsOnly(true)">Só naturais</button>
          </div>

          <span class="text-sm font-semibold text-slate-300">Acertos</span>
          <label class="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-300 sm:min-h-0">
            <input type="checkbox" class="accent-amber-400" [checked]="showFound()" (change)="showFound.set(!showFound())" />
            Manter as notas que acertei marcadas no braço
          </label>
        </div>

        <p class="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
          <strong class="text-amber-300">Agora:</strong> {{ summary() }} —
          <strong class="text-slate-100 tabular-nums">{{ totalPositions() }}</strong> casas.
        </p>
      </details>

      <section class="panel mb-4 sm:mb-5">
        <app-fretboard [frets]="quizMaxFret" [markers]="quizMarkers()" [highlight]="answer() ? null : target()" />
        <p class="mt-3 text-sm text-slate-400">
          <strong class="text-slate-100 tabular-nums">{{ foundInScope() }}</strong> de {{ totalPositions() }} casas
          descobertas nesta combinação.
          @if (completedRounds() > 0) {
            <span class="text-emerald-400">🎉 Combinação completa {{ completedRounds() }}× — começando de novo.</span>
          }
        </p>
      </section>

      <!-- Phones: pinned above the tab bar, so the question and the answers stay on screen with the neck. -->
      <section
        class="panel sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 bg-slate-900 shadow-[0_-12px_24px_-8px] shadow-black/70 lg:static lg:bg-slate-900/60 lg:shadow-none"
      >
        <div class="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <h2 class="text-base font-semibold text-white sm:text-lg" aria-live="polite">
            @if (answer(); as a) {
              @if (a.correct) {
                <span class="text-emerald-400">✓ Isso! É {{ a.expected }}.</span>
              } @else {
                <span class="text-rose-400">✗ Era {{ a.expected }}, não {{ a.given }}.</span>
              }
            } @else {
              Que nota é a {{ target().string }}ª corda,
              {{ target().fret === 0 ? 'solta' : 'casa ' + target().fret }}?
            }
          </h2>
          <button type="button" class="btn-ghost shrink-0" (click)="reset()">Zerar</button>
        </div>

        <div class="grid grid-cols-6 gap-1.5 sm:gap-2 lg:grid-cols-12">
          @for (note of options(); track note.name) {
            <button
              type="button"
              class="chip px-1 py-2 text-base font-bold sm:py-3"
              [class]="optionClass(note.name)"
              [disabled]="!!answer()"
              (click)="guess(note.name)"
            >
              {{ note.name }}
            </button>
          }
        </div>
      </section>
    }
  `,
})
export class FretboardQuiz {
  private readonly theory = inject(MusicTheoryService);

  protected readonly quizMaxFret = QUIZ_MAX_FRET;
  /** The quiz filters start expanded only where there is room for them. */
  protected readonly wideScreen = mediaQuery('(min-width: 640px)');
  protected readonly mode = signal<Mode>('map');

  // Free map
  protected readonly selectedNote = signal<NoteName | null>('C');
  protected readonly mapMarkers = computed<FretMarker[]>(() => {
    const note = this.selectedNote();
    if (!note) {
      return [];
    }
    const color = noteColor(note);
    return this.theory.positionsOf(note).map((p) => ({ ...p, label: note, color }));
  });

  // Quiz
  protected readonly stringScopes = STRING_SCOPES;
  protected readonly fretScopes = FRET_SCOPES;
  protected readonly stringOrder = STRING_ORDER;
  protected readonly stringScope = signal<StringScope>('all');
  protected readonly fretScope = signal<FretScope>('all');
  /** String in play when the string filter is "one string at a time". */
  protected readonly quizString = signal<GuitarString>(6);
  protected readonly naturalsOnly = signal(false);
  protected readonly answer = signal<QuizAnswer | null>(null);
  protected readonly correct = signal(0);
  protected readonly total = signal(0);
  protected readonly streak = signal(0);
  protected readonly bestStreak = signal(readStored(BEST_STREAK_KEY, 0));
  /** Whether the positions already answered stay drawn on the neck; they are tracked either way. */
  protected readonly showFound = signal(readStored(SHOW_FOUND_KEY, true));

  protected readonly accuracy = computed(() =>
    this.total() === 0 ? 0 : Math.round((this.correct() / this.total()) * 100),
  );
  protected readonly options = computed(() =>
    this.naturalsOnly() ? NOTES.filter((n) => n.isNatural) : NOTES,
  );
  /** Positions already answered correctly; they stay on the neck, dimmed, as a memory aid. */
  protected readonly found = signal<readonly FretMarker[]>([]);
  protected readonly completedRounds = signal(0);
  protected readonly totalPositions = computed(() => this.candidates().length);
  protected readonly foundInScope = computed(
    () => this.candidates().filter((p) => this.isFound(p)).length,
  );
  /** The active combination in words, e.g. "cordas 6 e 5 · casas com bolinha · só notas naturais". */
  protected readonly summary = computed(() => {
    const strings =
      this.stringScope() === 'single'
        ? `${this.quizString()}ª corda`
        : labelOf(STRING_SCOPES, this.stringScope());
    const notes = this.naturalsOnly() ? 'só notas naturais' : 'todas as notas';
    return [strings, labelOf(FRET_SCOPES, this.fretScope()), notes].join(' · ');
  });
  protected readonly target = signal<FretPosition>(this.randomPosition());

  /** Found notes (when shown) plus, right after answering, the target revealed with its note name. */
  protected readonly quizMarkers = computed<FretMarker[]>(() => {
    const found = this.showFound() ? this.found() : [];
    const answer = this.answer();
    if (!answer) {
      return [...found];
    }
    const target = this.target();
    return [
      ...found.filter((m) => !samePosition(m, target)),
      {
        ...target,
        label: answer.expected,
        color: answer.correct ? '#34d399' : '#fb7185',
        isRoot: true,
      },
    ];
  });

  private nextTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => writeStored(BEST_STREAK_KEY, this.bestStreak()));
    effect(() => writeStored(SHOW_FOUND_KEY, this.showFound()));
    inject(DestroyRef).onDestroy(() => this.clearTimer());
  }

  protected selectNote(note: NoteName): void {
    this.selectedNote.update((current) => (current === note ? null : note));
  }

  protected selectAt(position: FretPosition): void {
    this.selectedNote.set(this.theory.noteAt(position.string, position.fret));
  }

  protected guess(given: NoteName): void {
    if (this.answer()) {
      return;
    }
    const { string, fret } = this.target();
    const expected = this.theory.noteAt(string, fret);
    const correct = given === expected;

    this.answer.set({ given, expected, correct });
    this.total.update((n) => n + 1);
    if (correct) {
      this.correct.update((n) => n + 1);
      this.streak.update((n) => n + 1);
      this.bestStreak.update((best) => Math.max(best, this.streak()));
      this.found.update((found) => [
        ...found,
        { string, fret, label: expected, color: noteColor(expected), ghost: true },
      ]);
    } else {
      this.streak.set(0);
    }
    this.nextTimer = setTimeout(() => this.nextQuestion(), NEXT_QUESTION_DELAY_MS);
  }

  protected setNaturalsOnly(value: boolean): void {
    this.naturalsOnly.set(value);
    this.restartMode();
  }

  protected setStringScope(scope: StringScope): void {
    this.stringScope.set(scope);
    this.restartMode();
  }

  protected setFretScope(scope: FretScope): void {
    this.fretScope.set(scope);
    this.restartMode();
  }

  protected setQuizString(string: GuitarString): void {
    this.quizString.set(string);
    this.restartMode();
  }

  protected openNote(string: GuitarString): NoteName {
    return this.theory.noteAt(string, 0);
  }

  protected reset(): void {
    this.correct.set(0);
    this.total.set(0);
    this.streak.set(0);
    this.found.set([]);
    this.completedRounds.set(0);
    this.nextQuestion();
  }

  protected optionClass(note: NoteName): string {
    const answer = this.answer();
    if (!answer) {
      return '';
    }
    if (note === answer.expected) {
      return 'border-emerald-400! bg-emerald-400/20! text-emerald-300! opacity-100!';
    }
    if (note === answer.given) {
      return 'border-rose-400! bg-rose-400/20! text-rose-300! opacity-100!';
    }
    return '';
  }

  /** A different combination is a different exercise: its completion count starts again. */
  private restartMode(): void {
    this.completedRounds.set(0);
    this.nextQuestion();
  }

  private nextQuestion(): void {
    this.clearTimer();
    this.answer.set(null);
    this.target.set(this.randomPosition(this.target()));
  }

  /** Picks a position of the current combination not answered yet. */
  private randomPosition(previous?: FretPosition): FretPosition {
    let pending = this.pending();
    if (pending.length === 0 && this.stringScope() === 'single') {
      // String finished: move on to the next one that still has notes to find.
      const start = STRING_ORDER.indexOf(this.quizString());
      const next = STRING_ORDER.map((_, i) => STRING_ORDER[(start + 1 + i) % STRING_ORDER.length]).find(
        (string) => this.pending(string).length > 0,
      );
      if (next) {
        this.quizString.set(next);
        pending = this.pending();
      }
    }
    if (pending.length === 0) {
      // Combination complete: clear its marks (on every string, in one-string mode) and restart.
      const done =
        this.stringScope() === 'single'
          ? STRING_ORDER.flatMap((string) => this.candidates(string))
          : this.candidates();
      this.found.update((found) => found.filter((m) => !done.some((p) => samePosition(p, m))));
      this.completedRounds.update((n) => n + 1);
      pending = this.pending();
    }
    const fresh = pending.filter((p) => !previous || !samePosition(p, previous));
    const pool = fresh.length > 0 ? fresh : pending;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private pending(string = this.quizString()): FretPosition[] {
    return this.candidates(string).filter((p) => !this.isFound(p));
  }

  private isFound(position: FretPosition): boolean {
    return this.found().some((m) => samePosition(m, position));
  }

  /** Every position that passes the string, fret and note filters at once. */
  private candidates(string = this.quizString()): FretPosition[] {
    const stringScope = this.stringScope();
    const fretScope = this.fretScope();
    const naturalsOnly = this.naturalsOnly();

    return ALL_STRINGS.flatMap((s) =>
      Array.from({ length: QUIZ_MAX_FRET + 1 }, (_, fret): FretPosition => ({ string: s, fret })),
    ).filter(
      (p) =>
        (stringScope === 'all' ||
          (stringScope === 'single' ? p.string === string : p.string >= 5)) &&
        (fretScope === 'all' ||
          (fretScope === 'inlays'
            ? INLAY_FRETS.includes(p.fret)
            : p.fret <= FIRST_POSITION_MAX_FRET)) &&
        (!naturalsOnly || !this.theory.noteAt(p.string, p.fret).includes('#')),
    );
  }

  private clearTimer(): void {
    if (this.nextTimer !== null) {
      clearTimeout(this.nextTimer);
      this.nextTimer = null;
    }
  }
}

function samePosition(a: FretPosition, b: FretPosition): boolean {
  return a.string === b.string && a.fret === b.fret;
}

function noteColor(note: NoteName): string | undefined {
  return NOTES.find((n) => n.name === note)?.color;
}

function labelOf<T>(options: readonly FilterOption<T>[], id: T): string {
  return options.find((option) => option.id === id)?.summary ?? '';
}
