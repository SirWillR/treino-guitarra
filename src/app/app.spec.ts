import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { App } from './app';

describe('App', () => {
  const labels = (elements: NodeListOf<Element>) =>
    Array.from(elements, (el) => el.textContent?.replace(/\s+/g, ' ').trim());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideServiceWorker('ngsw-worker.js', { enabled: false })],
    }).compileComponents();
  });

  it('renders the module links and the collapsed lessons item', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const nav = (fixture.nativeElement as HTMLElement).querySelector('nav')!;

    expect(labels(nav.querySelectorAll(':scope > a'))).toEqual([
      '⏱️ Treino Diário',
      '🎸 Braço & Quiz',
      '🔁 Troca de Acordes',
      '🧩 Sistema CAGED',
    ]);
    const toggle = nav.querySelector('button')!;
    expect(toggle.textContent).toContain('Lições da Aula');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(nav.querySelector('#lessons-submenu')).toBeNull();
  });

  it('expands the lessons submenu when the item is clicked', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const nav = (fixture.nativeElement as HTMLElement).querySelector('nav')!;
    const toggle = nav.querySelector('button')!;

    toggle.click();
    await fixture.whenStable();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(labels(nav.querySelectorAll('#lessons-submenu a'))).toEqual([
      '1. Aquecimento',
      '2. Ritmo & Batida',
      '3. Escala & Digitação',
      '4. Progressões Harmônicas',
    ]);
  });

  it('renders the quick links in the bottom tab bar and opens the menu drawer from it', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const tabBar = root.querySelectorAll('nav')[1];

    expect(labels(tabBar.querySelectorAll('a'))).toEqual([
      '⏱️ Treino',
      '🎸 Braço',
      '🔁 Acordes',
      '🧩 CAGED',
    ]);
    const toggle = tabBar.querySelector('button')!;
    expect(toggle.textContent).toContain('Menu');
    expect(root.querySelector('#mobile-menu')).toBeNull();

    toggle.click();
    await fixture.whenStable();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const menu = root.querySelector('#mobile-menu')!;
    expect(labels(menu.querySelectorAll('nav a'))).toEqual([
      '⏱️ Treino Diário',
      '🎸 Braço & Quiz',
      '🔁 Troca de Acordes',
      '🧩 Sistema CAGED',
    ]);
    expect(menu.querySelectorAll('ul a').length).toBe(4);

    (menu.querySelector('button[aria-label="Fechar menu"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(root.querySelector('#mobile-menu')).toBeNull();
  });
});
