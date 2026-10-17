import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { WakeLockService } from './core/services/wake-lock.service';
import { LESSONS } from './features/lessons/lessons.registry';

interface NavItem {
  path: string;
  label: string;
  /** Label for the narrow bottom tab bar. */
  shortLabel: string;
  icon: string;
}

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  host: { '(document:keydown.escape)': 'sheetOpen.set(false)' },
})
export class App {
  protected readonly navItems: readonly NavItem[] = [
    { path: '/braco', label: 'Braço & Quiz', shortLabel: 'Braço', icon: '🎸' },
    { path: '/acordes', label: 'Troca de Acordes', shortLabel: 'Acordes', icon: '🔁' },
    { path: '/caged', label: 'Sistema CAGED', shortLabel: 'CAGED', icon: '🧩' },
    { path: '/triades', label: 'Tríades', shortLabel: 'Tríades', icon: '🔺' },
  ];
  protected readonly lessons = LESSONS;

  /** Whether the "Lições da Aula" submenu is expanded (desktop sidebar). */
  protected readonly lessonsOpen = signal(false);
  /** Whether the lessons bottom sheet is open (phones and tablets). */
  protected readonly sheetOpen = signal(false);
  /** Whether the current page is one of the lessons. */
  protected readonly lessonsActive = signal(false);

  constructor() {
    inject(WakeLockService).start();

    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        const inLessons = event.urlAfterRedirects.startsWith('/licoes');
        this.lessonsActive.set(inLessons);
        this.sheetOpen.set(false);
        // Landing on a lesson reveals the submenu so the current lesson is always visible.
        if (inLessons) {
          this.lessonsOpen.set(true);
        }
      });
  }
}
