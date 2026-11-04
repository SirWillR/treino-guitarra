import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { formatClock, PracticeTimerService } from './core/services/practice-timer.service';
import { UpdateService } from './core/services/update.service';
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
  host: { '(document:keydown.escape)': 'menuOpen.set(false)' },
})
export class App {
  protected readonly navItems: readonly NavItem[] = [
    { path: '/treino', label: 'Treino Diário', shortLabel: 'Treino', icon: '⏱️' },
    { path: '/braco', label: 'Braço & Quiz', shortLabel: 'Braço', icon: '🎸' },
    { path: '/acordes', label: 'Troca de Acordes', shortLabel: 'Acordes', icon: '🔁' },
    { path: '/caged', label: 'Sistema CAGED', shortLabel: 'CAGED', icon: '🧩' },
  ];
  protected readonly lessons = LESSONS;

  /** Whether the "Lições da Aula" submenu is expanded (desktop sidebar). */
  protected readonly lessonsOpen = signal(false);
  /**
   * Whether the menu drawer is open (phones and tablets). The tab bar only holds the quick links;
   * every page, quick or not, is listed in the drawer.
   */
  protected readonly menuOpen = signal(false);
  /** Whether the current page is one of the lessons. */
  protected readonly lessonsActive = signal(false);
  /** Whether the current page has no tab in the bottom bar, so the Menu tab lights up instead. */
  protected readonly offBar = signal(false);

  protected readonly update = inject(UpdateService);
  protected readonly timer = inject(PracticeTimerService);
  protected readonly timerClock = computed(() => formatClock(this.timer.remainingMs()));
  /** Whether the daily routine page is open (the floating timer is hidden there). */
  protected readonly onRoutine = signal(false);

  constructor() {
    inject(WakeLockService).start();
    this.update.start();

    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        const inLessons = event.urlAfterRedirects.startsWith('/licoes');
        this.onRoutine.set(event.urlAfterRedirects.startsWith('/treino'));
        this.lessonsActive.set(inLessons);
        const url = event.urlAfterRedirects;
        this.offBar.set(!this.navItems.some((item) => url.startsWith(item.path)));
        this.menuOpen.set(false);
        // Landing on a lesson reveals the submenu so the current lesson is always visible.
        if (inLessons) {
          this.lessonsOpen.set(true);
        }
      });
  }
}
