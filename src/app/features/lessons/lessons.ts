import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LESSONS } from './lessons.registry';

@Component({
  selector: 'app-lessons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <header class="mb-5">
      <h1 class="text-2xl font-bold text-white">Lições da Aula</h1>
      <p class="mt-1 text-sm text-slate-400">Os exercícios e as sequências da aula, uma lição por vez.</p>
    </header>

    <nav class="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Lições">
      @for (lesson of lessons; track lesson.slug; let i = $index) {
        <a
          class="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 transition hover:border-slate-600"
          routerLinkActive="border-amber-400! bg-amber-400/10!"
          #link="routerLinkActive"
          [routerLink]="lesson.slug"
        >
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            [class]="link.isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'"
          >
            {{ i + 1 }}
          </span>
          <span class="min-w-0">
            <span class="block font-semibold" [class]="link.isActive ? 'text-amber-300' : 'text-slate-100'">
              {{ lesson.title }}
            </span>
            <span class="block truncate text-xs text-slate-400">{{ lesson.summary }}</span>
          </span>
        </a>
      }
    </nav>

    <router-outlet />
  `,
})
export class Lessons {
  protected readonly lessons = LESSONS;
}
