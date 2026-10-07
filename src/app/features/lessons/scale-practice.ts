import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TEACHER_LESSON } from '../../core/data/lessons.data';
import { NoteName } from '../../core/models/note.model';
import { MusicTheoryService } from '../../core/services/music-theory.service';
import { NotePicker } from '../../shared/note-picker/note-picker';
import { PracticeTips } from '../../shared/practice-tips/practice-tips';
import { ScaleExercise } from '../../shared/scale-exercise/scale-exercise';
import { ExercisePlayer } from './exercise-player';

type ScaleMode = 'major' | 'teacher';

@Component({
  selector: 'app-scale-practice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScaleExercise, ExercisePlayer, NotePicker, PracticeTips],
  template: `
    <div class="mb-5 flex flex-wrap gap-2">
      <button type="button" class="chip" [class.chip-active]="mode() === 'teacher'" (click)="mode.set('teacher')">
        Padrão da aula (3 cordas)
      </button>
      <button type="button" class="chip" [class.chip-active]="mode() === 'major'" (click)="mode.set('major')">
        Escala maior (6 cordas)
      </button>
    </div>

    @if (mode() === 'major') {
      <section class="panel mb-5">
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-white">Escala de {{ root() }} maior</h2>
          <p class="mt-1 text-sm text-slate-400">
            As mesmas 7 notas ({{ scaleNotes() }}) nas 6 cordas. A escala cabe em 5 posições que se encaixam uma
            na outra: tocando as cinco, você percorre o braço todo.
          </p>
        </div>

        <h3 class="panel-title">Tom</h3>
        <app-note-picker [value]="root()" (valueChange)="setRoot($event)" />

        <h3 class="panel-title mt-5">Posição</h3>
        <div class="mb-4 flex flex-wrap items-center gap-2">
          @for (position of positions(); track $index) {
            <button type="button" class="chip" [class.chip-active]="positionIndex() === $index" (click)="positionIndex.set($index)">
              {{ $index + 1 }}ª <span class="text-xs opacity-70">· casas {{ position.lowestFret }}–{{ position.highestFret }}</span>
            </button>
          }
          <button type="button" class="btn-primary ml-auto" (click)="nextPosition()">Próxima posição →</button>
        </div>

        <app-scale-exercise [pattern]="position().steps" [startFret]="0" [activeIndex]="activeIndex()" />
      </section>

      <section class="panel mb-5">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 class="panel-title mb-0">Player passo a passo</h2>
          <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" class="accent-amber-400" [checked]="climb()" (change)="climb.set(!climb())" />
            Avançar de posição a cada volta (percorre o braço todo)
          </label>
        </div>
        <app-exercise-player
          [pattern]="position().steps"
          idleHint="Sobe da 6ª para a 1ª corda e volta."
          (activeIndexChange)="activeIndex.set($event)"
          (lap)="onLap()"
        />
      </section>
    } @else {
      <section class="panel mb-5">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-white">Escala de {{ teacherRoot() }} maior em uma oitava</h2>
            <p class="mt-1 text-sm text-slate-400">
              O desenho passado na aula, nas cordas 5, 4 e 3. Começa com o <strong class="text-slate-200">dedo 2</strong>
              na tônica (5ª corda) e termina na tônica uma oitava acima (3ª corda). O número em cada ponto é o dedo.
            </p>
          </div>
        </div>

        <h3 class="panel-title">Tom (casa do dedo 2 na 5ª corda)</h3>
        <div class="mb-4 flex flex-wrap items-center gap-2">
          @for (option of teacherPositions; track option.startFret) {
            <button type="button" class="chip" [class.chip-active]="startFret() === option.startFret" (click)="startFret.set(option.startFret)">
              {{ option.root }} <span class="text-xs opacity-70">· casa {{ option.rootFret }}</span>
            </button>
          }
        </div>

        <app-scale-exercise [pattern]="teacherPattern" [startFret]="startFret()" [activeIndex]="activeIndex()" />

        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          @for (row of rows(); track row.string) {
            <div class="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm">
              <div class="font-semibold text-slate-100">Corda {{ row.string }}</div>
              <div class="text-slate-300">casas {{ row.frets }}</div>
              <div class="text-xs text-slate-500">dedos {{ row.fingers }}</div>
            </div>
          }
        </div>
      </section>

      <section class="panel mb-5">
        <h2 class="panel-title">Player passo a passo</h2>
        <app-exercise-player
          [pattern]="teacherPattern"
          [startFret]="startFret()"
          idleHint="Sobe da 5ª para a 3ª corda e volta."
          (activeIndexChange)="activeIndex.set($event)"
        />
      </section>
    }

    <app-practice-tips title="Dicas práticas de digitação" [tips]="tips" />
  `,
})
export class ScalePractice {
  private readonly theory = inject(MusicTheoryService);

  protected readonly teacherPattern = TEACHER_LESSON.scalePattern;
  /** The pattern starts with finger 2 on the tonic, one fret above the index finger. */
  protected readonly teacherPositions = TEACHER_LESSON.scaleStartFrets.map((startFret) => ({
    startFret,
    rootFret: startFret + 1,
    root: this.theory.noteAt(5, startFret + 1),
  }));
  protected readonly tips = TEACHER_LESSON.scaleTips;

  protected readonly mode = signal<ScaleMode>('teacher');
  protected readonly activeIndex = signal(-1);

  // Major scale
  protected readonly root = signal<NoteName>('C');
  protected readonly positionIndex = signal(0);
  protected readonly climb = signal(false);

  protected readonly positions = computed(() => this.theory.majorScalePositions(this.root()));
  protected readonly position = computed(() => this.positions()[this.positionIndex()]);
  protected readonly scaleNotes = computed(() => this.theory.majorScale(this.root()).join(' '));

  // Teacher's pattern
  protected readonly startFret = signal(2);
  protected readonly teacherRoot = computed(() => this.theory.noteAt(5, this.startFret() + 1));
  protected readonly rows = computed(() =>
    ([5, 4, 3] as const).map((string) => {
      const notes = this.teacherPattern.filter((note) => note.string === string);
      return {
        string,
        frets: notes.map((note) => this.startFret() + note.fretOffset).join(', '),
        fingers: notes.map((note) => note.finger).join(', '),
      };
    }),
  );

  protected setRoot(root: NoteName): void {
    this.root.set(root);
    this.positionIndex.set(0);
  }

  protected nextPosition(): void {
    this.positionIndex.update((index) => (index + 1) % this.positions().length);
  }

  protected onLap(): void {
    if (this.climb()) {
      this.nextPosition();
    }
  }
}
