import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NoteName, NOTES } from '../../core/models/note.model';

@Component({
  selector: 'app-note-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-6 gap-1.5 sm:flex sm:flex-wrap sm:gap-2" role="group" aria-label="Nota">
      @for (note of notes; track note.name) {
        <button
          type="button"
          class="chip px-1 text-center sm:min-w-12 sm:px-3"
          [class.chip-active]="!colored() && value() === note.name"
          [style.border-color]="colored() && value() === note.name ? note.color : null"
          [style.background-color]="colored() && value() === note.name ? note.color : null"
          [style.color]="colored() && value() === note.name ? '#0b1020' : null"
          [attr.aria-pressed]="value() === note.name"
          (click)="valueChange.emit(note.name)"
        >
          {{ note.name }}
          @if (note.flatName) {
            <span class="block text-[10px] leading-none opacity-60 sm:inline">/{{ note.flatName }}</span>
          }
        </button>
      }
    </div>
  `,
})
export class NotePicker {
  readonly value = input<NoteName | null>(null);
  /** Paints the selected note with its own colour instead of the accent colour. */
  readonly colored = input(false);
  readonly valueChange = output<NoteName>();

  protected readonly notes = NOTES;
}
