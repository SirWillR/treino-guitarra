import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { PracticeTip } from '../../core/models/lesson.model';

@Component({
  selector: 'app-practice-tips',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel border-amber-400/30 bg-amber-400/5">
      <h3 class="panel-title text-amber-300">💡 {{ title() }}</h3>
      <ul class="space-y-2">
        @for (tip of tips(); track tip.title) {
          <li class="rounded-xl border border-slate-800 bg-slate-900/70">
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left"
              [attr.aria-expanded]="isOpen(tip)"
              (click)="toggle(tip)"
            >
              @if (tip.icon) {
                <span class="w-8 shrink-0 text-center text-amber-300">{{ tip.icon }}</span>
              }
              <span class="flex-1 font-semibold text-slate-100">{{ tip.title }}</span>
              <span class="text-slate-500 transition-transform" [class.rotate-180]="isOpen(tip)">▾</span>
            </button>
            @if (isOpen(tip)) {
              <p class="px-4 pb-4 text-sm leading-relaxed text-slate-300">{{ tip.body }}</p>
            }
          </li>
        }
      </ul>
    </section>
  `,
})
export class PracticeTips {
  readonly tips = input.required<readonly PracticeTip[]>();
  readonly title = input('Dicas práticas');

  /** Tips start expanded; only the ones the student collapsed are tracked. */
  private readonly collapsed = signal<ReadonlySet<string>>(new Set());

  protected isOpen(tip: PracticeTip): boolean {
    return !this.collapsed().has(tip.title);
  }

  protected toggle(tip: PracticeTip): void {
    this.collapsed.update((current) => {
      const next = new Set(current);
      if (!next.delete(tip.title)) {
        next.add(tip.title);
      }
      return next;
    });
  }
}
