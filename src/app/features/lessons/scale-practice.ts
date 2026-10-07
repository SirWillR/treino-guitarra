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
      <button type="button" class="chip" [class.chip-active]="mode() === 'major'" (click)="mode.set('major')">
        Escala maior (6 cordas)
      </button>
      <button type="button" class="chip" [class.chip-active]="mode() === 'teacher'" (click)="mode.set('teacher')">
        Padrão da aula (3 cordas)
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
            <h2 class="text-lg font-semibold text-white">Padrão de abertura e independência de dedos</h2>
            <p class="mt-1 text-sm text-slate-400">
              O desenho passado na aula, nas cordas 1, 2 e 3. O número dentro de cada ponto é o dedo.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="mr-1 text-sm text-slate-400">Posição (casa do dedo 1):</span>
            @for (fret of startFrets; track fret) {
              <button type="button" class="chip" [class.chip-active]="startFret() === fret" (click)="startFret.set(fret)">
                {{ fret }}
              </button>
            }
          </div>
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
          idleHint="Sobe da 3ª para a 1ª corda e volta."
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
  protected readonly startFrets = TEACHER_LESSON.scaleStartFrets;
  protected readonly tips = TEACHER_LESSON.scaleTips;

  protected readonly mode = signal<ScaleMode>('major');
  protected readonly activeIndex = signal(-1);

  // Major scale
  protected readonly root = signal<NoteName>('C');
  protected readonly positionIndex = signal(0);
  protected readonly climb = signal(false);

  protected readonly positions = computed(() => this.theory.majorScalePositions(this.root()));
  protected readonly position = computed(() => this.positions()[this.positionIndex()]);
  protected readonly scaleNotes = computed(() => this.theory.majorScale(this.root()).join(' '));

  // Teacher's pattern
  protected readonly startFret = signal(1);
  protected readonly rows = computed(() =>
    ([1, 2, 3] as const).map((string) => {
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
