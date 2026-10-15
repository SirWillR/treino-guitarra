import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  viewChild,
} from '@angular/core';
import { readStored, writeStored } from '../../core/utils/storage';

@Component({
  selector: 'app-help-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      class="mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-3xl overflow-hidden rounded-t-2xl sm:m-auto sm:max-h-[88dvh] sm:w-[calc(100%-2rem)] sm:rounded-2xl border border-slate-700 bg-slate-900 p-0 text-slate-200 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      [attr.aria-label]="title()"
      (click)="onDialogClick($event)"
    >
      <div class="flex max-h-[92dvh] flex-col sm:max-h-[88dvh]">
        <header class="flex items-center justify-between gap-4 border-b border-slate-800 px-4 py-3 sm:px-6 sm:py-4">
          <h2 class="text-lg font-bold text-white sm:text-xl">{{ title() }}</h2>
          <button
            type="button"
            class="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Fechar"
            (click)="close()"
          >
            ✕
          </button>
        </header>
        <div class="help-content overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          <ng-content />
        </div>
        <footer class="flex justify-end border-t border-slate-800 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
          <button type="button" class="btn-primary w-full sm:w-auto" (click)="close()">Entendi</button>
        </footer>
      </div>
    </dialog>
  `,
})
export class HelpDialog {
  readonly title = input.required<string>();
  /** When set, the dialog opens by itself the first time this key is seen in the browser. */
  readonly firstVisitKey = input<string>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    afterNextRender(() => {
      const key = this.firstVisitKey();
      if (key && !readStored(key, false)) {
        writeStored(key, true);
        this.open();
      }
    });
  }

  open(): void {
    const dialog = this.dialog().nativeElement;
    if (!dialog.open) {
      dialog.showModal();
    }
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  /** The dialog element itself is only hit when the click lands on the backdrop. */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }
}
