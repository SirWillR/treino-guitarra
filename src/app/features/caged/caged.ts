import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HelpDialog } from '../../shared/help-dialog/help-dialog';
import { CagedExplorer } from './caged-explorer';
import { CagedHelp } from './caged-help';
import { CagedQuiz } from './caged-quiz';

type Mode = 'explore' | 'quiz';

@Component({
  selector: 'app-caged',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HelpDialog, CagedHelp, CagedExplorer, CagedQuiz],
  template: `
    <header class="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6 sm:gap-4">
      <div class="flex w-full items-start justify-between gap-3 sm:w-auto">
        <div>
          <h1 class="text-2xl font-bold text-white">Sistema CAGED</h1>
          <p class="mt-1 text-sm text-slate-400">
            Um mesmo acorde em cinco desenhos ao longo do braço. Ache a tônica e o shape vem junto.
          </p>
        </div>
        <button type="button" class="btn-ghost shrink-0 px-3 sm:hidden" aria-label="O que é isso?" (click)="help.open()">❓</button>
      </div>
      <div class="flex w-full gap-2 sm:w-auto">
        <div class="grid flex-1 grid-cols-2 gap-2 sm:flex" role="tablist">
          <button type="button" class="chip" [class.chip-active]="mode() === 'explore'" (click)="mode.set('explore')">
            Explorar
          </button>
          <button type="button" class="chip" [class.chip-active]="mode() === 'quiz'" (click)="mode.set('quiz')">
            Quiz da Tônica
          </button>
        </div>
        <button type="button" class="btn-ghost hidden shrink-0 sm:inline-flex" (click)="help.open()">❓ O que é isso?</button>
      </div>
    </header>

    <app-help-dialog #help title="O que é o Sistema CAGED?" firstVisitKey="fht.help.caged">
      <app-caged-help />
    </app-help-dialog>

    @if (mode() === 'explore') {
      <app-caged-explorer />
    } @else {
      <app-caged-quiz />
    }
  `,
})
export class Caged {
  protected readonly mode = signal<Mode>('explore');
}
