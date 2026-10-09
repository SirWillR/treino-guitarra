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
import { readStored, writeStored } from '../../core/utils/storage';
import { Fretboard } from '../../shared/fretboard/fretboard';
import { NotePicker } from '../../shared/note-picker/note-picker';

type Mode = 'map' | 'quiz';

interface QuizAnswer {
  given: NoteName;
  expected: NoteName;
  correct: boolean;
}

type QuizScope = 'all' | 'string' | 'inlays' | 'first' | 'bass';

interface ScopeOption {
  id: QuizScope;
  label: string;
  description: string;
}

const BEST_STREAK_KEY = 'fht.quiz.bestStreak';
const QUIZ_MAX_FRET = 12;
/** Frets with an inlay dot within the quiz range. */
const INLAY_FRETS = [3, 5, 7, 9, 12];
const FIRST_POSITION_MAX_FRET = 5;
/** Order in which "one string at a time" moves on: from the lowest string to the highest. */
const STRING_ORDER: readonly GuitarString[] = [6, 5, 4, 3, 2, 1];

const SCOPES: readonly ScopeOption[] = [
  { id: 'all', label: 'Braço todo', description: 'Qualquer casa, em qualquer corda, até a casa 12.' },
  {
    id: 'string',
    label: 'Uma corda por vez',
    description: 'Só a corda escolhida. Ao completar a corda, o quiz passa sozinho para a próxima.',
  },
  {
    id: 'inlays',
    label: 'Casas marcadas',
    description: 'Só as casas com bolinha (3, 5, 7, 9 e 12): os pontos de referência do braço.',
  },
  {
    id: 'first',
    label: 'Primeiras casas',
    description: 'Da corda solta até a casa 5: a região dos acordes abertos.',
  },
  {
    id: 'bass',
    label: 'Cordas 6 e 5',
    description: 'As cordas onde ficam as tônicas das pestanas e dos shapes do CAGED.',
  },
];
const NEXT_QUESTION_DELAY_MS = 1100;

@Component({
  selector: 'app-fretboard-quiz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Fretboard, NotePicker],
  template: `
    <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Braço & Quiz</h1>
        <p class="mt-1 text-sm text-slate-400">Memorize onde cada nota mora no braço.</p>
      </div>
      <div class="flex gap-2" role="tablist">
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
      <section class="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div class="panel">
          <div class="panel-title">Acertos</div>
          <div class="text-3xl font-bold text-white tabular-nums">{{ correct() }}<span class="text-lg text-slate-500">/{{ total() }}</span></div>
        </div>
        <div class="panel">
          <div class="panel-title">Precisão</div>
          <div class="text-3xl font-bold text-white tabular-nums">{{ accuracy() }}%</div>
        </div>
        <div class="panel">
          <div class="panel-title">Sequência</div>
          <div class="text-3xl font-bold text-amber-300 tabular-nums">🔥 {{ streak() }}</div>
        </div>
        <div class="panel">
          <div class="panel-title">Recorde</div>
          <div class="text-3xl font-bold text-white tabular-nums">{{ bestStreak() }}</div>
        </div>
      </section>

      <section class="panel mb-5">
        <h2 class="panel-title">Modo do quiz</h2>
        <div class="flex flex-wrap gap-2">
          @for (option of scopes; track option.id) {
            <button type="button" class="chip" [class.chip-active]="scope() === option.id" (click)="setScope(option.id)">
              {{ option.label }}
            </button>
          }
        </div>
        <p class="mt-3 text-sm text-slate-400">{{ scopeOption().description }}</p>

        @if (scope() === 'string') {
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <span class="mr-1 text-sm text-slate-400">Corda:</span>
            @for (string of stringOrder; track string) {
              <button type="button" class="chip" [class.chip-active]="quizString() === string" (click)="setQuizString(string)">
                {{ string }}ª <span class="text-xs opacity-70">({{ openNote(string) }})</span>
              </button>
            }
          </div>
        }
      </section>

      <section class="panel mb-5">
        <app-fretboard [frets]="quizMaxFret" [markers]="quizMarkers()" [highlight]="answer() ? null : target()" />
        <p class="mt-3 text-sm text-slate-400">
          <strong class="text-slate-100 tabular-nums">{{ foundInScope() }}</strong> de {{ totalPositions() }} casas
          descobertas neste modo. As notas que você acerta ficam marcadas no braço.
          @if (completedRounds() > 0) {
            <span class="text-emerald-400">🎉 Modo completo {{ completedRounds() }}× — começando de novo.</span>
          }
        </p>
      </section>

      <section class="panel">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-white" aria-live="polite">
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
          <div class="flex items-center gap-4">
            <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" class="accent-amber-400" [checked]="naturalsOnly()" (change)="toggleNaturals()" />
              Só notas naturais
            </label>
            <button type="button" class="btn-ghost" (click)="reset()">Zerar</button>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
          @for (note of options(); track note.name) {
            <button
              type="button"
              class="chip py-3 text-base font-bold"
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
  protected readonly scopes = SCOPES;
  protected readonly stringOrder = STRING_ORDER;
  /** Which part of the neck the questions are drawn from. */
  protected readonly scope = signal<QuizScope>('all');
  /** String in play when the scope is "one string at a time". */
  protected readonly quizString = signal<GuitarString>(6);
  protected readonly scopeOption = computed(
    () => SCOPES.find((option) => option.id === this.scope()) ?? SCOPES[0],
  );
  protected readonly naturalsOnly = signal(false);
  protected readonly answer = signal<QuizAnswer | null>(null);
  protected readonly correct = signal(0);
  protected readonly total = signal(0);
  protected readonly streak = signal(0);
  protected readonly bestStreak = signal(readStored(BEST_STREAK_KEY, 0));

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
  protected readonly target = signal<FretPosition>(this.randomPosition());

  /** Found notes plus, right after answering, the target revealed with its note name. */
  protected readonly quizMarkers = computed<FretMarker[]>(() => {
    const answer = this.answer();
    if (!answer) {
      return [...this.found()];
    }
    const target = this.target();
    return [
      ...this.found().filter((m) => !samePosition(m, target)),
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

  protected toggleNaturals(): void {
    this.naturalsOnly.update((value) => !value);
    this.nextQuestion();
  }

  protected setScope(scope: QuizScope): void {
    this.scope.set(scope);
    this.completedRounds.set(0);
    this.nextQuestion();
  }

  protected setQuizString(string: GuitarString): void {
    this.quizString.set(string);
    this.nextQuestion();
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

  private nextQuestion(): void {
    this.clearTimer();
    this.answer.set(null);
    this.target.set(this.randomPosition(this.target()));
  }

  /** Picks a position of the current mode not answered yet. */
  private randomPosition(previous?: FretPosition): FretPosition {
    let pending = this.pending();
    if (pending.length === 0 && this.scope() === 'string') {
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
      // Mode complete: clear its marks (all of them once every string is done) and start over.
      const allowed = this.scope() === 'string' ? this.candidates('all') : this.candidates();
      this.found.update((found) => found.filter((m) => !allowed.some((p) => samePosition(p, m))));
      this.completedRounds.update((n) => n + 1);
      pending = this.pending();
    }
    const fresh = pending.filter((p) => !previous || !samePosition(p, previous));
    const pool = fresh.length > 0 ? fresh : pending;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private pending(string = this.quizString()): FretPosition[] {
    return this.candidates(this.scope(), string).filter((p) => !this.isFound(p));
  }

  private isFound(position: FretPosition): boolean {
    return this.found().some((m) => samePosition(m, position));
  }

  /** Every position a mode can ask about, honouring the "naturals only" option. */
  private candidates(scope = this.scope(), string = this.quizString()): FretPosition[] {
    const naturalsOnly = this.naturalsOnly();
    return ALL_STRINGS.flatMap((s) =>
      Array.from({ length: QUIZ_MAX_FRET + 1 }, (_, fret): FretPosition => ({ string: s, fret })),
    ).filter((p) => {
      if (naturalsOnly && this.theory.noteAt(p.string, p.fret).includes('#')) {
        return false;
      }
      switch (scope) {
        case 'string':
          return p.string === string;
        case 'inlays':
          return INLAY_FRETS.includes(p.fret);
        case 'first':
          return p.fret <= FIRST_POSITION_MAX_FRET;
        case 'bass':
          return p.string >= 5;
        default:
          return true;
      }
    });
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
