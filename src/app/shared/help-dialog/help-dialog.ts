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
      class="m-auto max-h-[88vh] w-[calc(100%-2rem)] max-w-3xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-0 text-slate-200 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      [attr.aria-label]="title()"
      (click)="onDialogClick($event)"
    >
      <div class="flex max-h-[88vh] flex-col">
        <header class="flex items-center justify-between gap-4 border-b border-slate-800 px-6 py-4">
          <h2 class="text-xl font-bold text-white">{{ title() }}</h2>
          <button
            type="button"
            class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Fechar"
            (click)="close()"
          >
            ✕
          </button>
        </header>
        <div class="help-content overflow-y-auto px-6 py-5">
          <ng-content />
        </div>
        <footer class="flex justify-end border-t border-slate-800 px-6 py-4">
          <button type="button" class="btn-primary" (click)="close()">Entendi</button>
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
