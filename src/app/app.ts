import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

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
    { path: '/licoes', label: 'Lições da Aula', icon: '📒' },
  ];
}
