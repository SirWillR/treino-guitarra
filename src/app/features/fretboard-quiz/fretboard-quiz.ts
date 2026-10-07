import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ALL_STRINGS, FretMarker, FretPosition } from '../../core/models/fretboard.model';
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

const BEST_STREAK_KEY = 'fht.quiz.bestStreak';
const QUIZ_MAX_FRET = 12;
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
        <app-fretboard [frets]="quizMaxFret" [markers]="quizMarkers()" [highlight]="answer() ? null : target()" />
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
    const color = NOTES.find((n) => n.name === note)?.color;
    return this.theory.positionsOf(note).map((p) => ({ ...p, label: note, color }));
  });

  // Quiz
  protected readonly naturalsOnly = signal(false);
  protected readonly target = signal<FretPosition>(this.randomPosition());
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
  /** After answering, the target is revealed with its note name. */
  protected readonly quizMarkers = computed<FretMarker[]>(() => {
    const answer = this.answer();
    if (!answer) {
      return [];
    }
    return [
      {
        ...this.target(),
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
    } else {
      this.streak.set(0);
    }
    this.nextTimer = setTimeout(() => this.nextQuestion(), NEXT_QUESTION_DELAY_MS);
  }

  protected toggleNaturals(): void {
    this.naturalsOnly.update((value) => !value);
    this.nextQuestion();
  }

  protected reset(): void {
    this.correct.set(0);
    this.total.set(0);
    this.streak.set(0);
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

  private randomPosition(previous?: FretPosition): FretPosition {
    const naturalsOnly = this.naturalsOnly();
    for (;;) {
      const string = ALL_STRINGS[Math.floor(Math.random() * ALL_STRINGS.length)];
      const fret = Math.floor(Math.random() * (QUIZ_MAX_FRET + 1));
      const isRepeat = previous?.string === string && previous.fret === fret;
      const isAllowed = !naturalsOnly || !this.theory.noteAt(string, fret).includes('#');
      if (!isRepeat && isAllowed) {
        return { string, fret };
      }
    }
  }

  private clearTimer(): void {
    if (this.nextTimer !== null) {
      clearTimeout(this.nextTimer);
      this.nextTimer = null;
    }
  }
}
