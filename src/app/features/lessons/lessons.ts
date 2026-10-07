import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ProgressionPractice } from './progression-practice';
import { ScalePractice } from './scale-practice';

type LessonTab = 'scale' | 'progressions';

@Component({
  selector: 'app-lessons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScalePractice, ProgressionPractice],
  template: `
    <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Lições da Aula</h1>
        <p class="mt-1 text-sm text-slate-400">Os exercícios e as sequências da aula, com as dicas do professor.</p>
      </div>
      <div class="flex gap-2" role="tablist">
        <button type="button" class="chip" [class.chip-active]="tab() === 'scale'" (click)="tab.set('scale')">
          Escala & Digitação
        </button>
        <button type="button" class="chip" [class.chip-active]="tab() === 'progressions'" (click)="tab.set('progressions')">
          Progressões Harmônicas
        </button>
      </div>
    </header>

    @if (tab() === 'scale') {
      <app-scale-practice />
    } @else {
      <app-progression-practice />
    }
  `,
})
export class Lessons {
  protected readonly tab = signal<LessonTab>('scale');
}
