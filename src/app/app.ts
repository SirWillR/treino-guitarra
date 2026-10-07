import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { LESSONS } from './features/lessons/lessons.registry';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  protected readonly navItems: readonly NavItem[] = [
    { path: '/braco', label: 'Braço & Quiz', icon: '🎸' },
    { path: '/acordes', label: 'Troca de Acordes', icon: '🔁' },
    { path: '/caged', label: 'Sistema CAGED', icon: '🧩' },
    { path: '/triades', label: 'Tríades', icon: '🔺' },
  ];
  protected readonly lessons = LESSONS;

  /** Whether the "Lições da Aula" submenu is expanded. */
  protected readonly lessonsOpen = signal(false);
  /** Whether the current page is one of the lessons. */
  protected readonly lessonsActive = signal(false);

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        const inLessons = event.urlAfterRedirects.startsWith('/licoes');
        this.lessonsActive.set(inLessons);
        // Landing on a lesson reveals the submenu so the current lesson is always visible.
        if (inLessons) {
          this.lessonsOpen.set(true);
        }
      });
  }
}
