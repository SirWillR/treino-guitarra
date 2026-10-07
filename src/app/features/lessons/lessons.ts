import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { LESSONS } from './lessons.registry';

/** Frame around the lesson pages; the lessons themselves are listed in the sidebar submenu. */
@Component({
  selector: 'app-lessons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <header class="mb-6">
      <p class="text-xs font-semibold tracking-widest text-slate-500 uppercase">
        Lições da Aula
        @if (lesson(); as current) {
          · {{ current.number }} de {{ total }}
        }
      </p>
      <h1 class="mt-1 text-2xl font-bold text-white">{{ lesson()?.title ?? 'Lições da Aula' }}</h1>
      @if (lesson(); as current) {
        <p class="mt-1 text-sm text-slate-400">{{ current.summary }}</p>
      }
    </header>

    <router-outlet />
  `,
})
export class Lessons {
  private readonly router = inject(Router);

  protected readonly total = LESSONS.length;
  private readonly url = signal(this.router.url);

  protected readonly lesson = computed(() => {
    const slug = this.url().split(/[?#]/)[0].split('/')[2];
    const index = LESSONS.findIndex((entry) => entry.slug === slug);
    return index < 0 ? null : { ...LESSONS[index], number: index + 1 };
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.url.set(event.urlAfterRedirects));
  }
}
