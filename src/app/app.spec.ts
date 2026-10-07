import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  const labels = (elements: NodeListOf<Element>) =>
    Array.from(elements, (el) => el.textContent?.replace(/\s+/g, ' ').trim());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the module links and the collapsed lessons item', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const nav = (fixture.nativeElement as HTMLElement).querySelector('nav')!;

    expect(labels(nav.querySelectorAll(':scope > a'))).toEqual([
      '🎸 Braço & Quiz',
      '🔁 Troca de Acordes',
      '🧩 Sistema CAGED',
      '🔺 Tríades',
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
      '2. Escala & Digitação',
      '3. Progressões Harmônicas',
    ]);
  });
});
