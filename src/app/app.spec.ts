import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the five module tabs', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('nav a');
    expect(Array.from(links, (a) => a.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      '🎸 Braço & Quiz',
      '🔁 Troca de Acordes',
      '🧩 Sistema CAGED',
      '🔺 Tríades',
      '📒 Lições da Aula',
    ]);
  });
});
