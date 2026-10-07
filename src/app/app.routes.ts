import { Routes } from '@angular/router';
import { LESSONS } from './features/lessons/lessons.registry';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'braco' },
  {
    path: 'braco',
    title: 'Braço & Quiz · Fretboard & Harmony Trainer',
    loadComponent: () =>
      import('./features/fretboard-quiz/fretboard-quiz').then((m) => m.FretboardQuiz),
  },
  {
    path: 'acordes',
    title: 'Troca de Acordes · Fretboard & Harmony Trainer',
    loadComponent: () =>
      import('./features/chord-trainer/chord-trainer').then((m) => m.ChordTrainer),
  },
  {
    path: 'caged',
    title: 'Sistema CAGED · Fretboard & Harmony Trainer',
    loadComponent: () => import('./features/caged/caged').then((m) => m.Caged),
  },
  {
    path: 'triades',
    title: 'Tríades · Fretboard & Harmony Trainer',
    loadComponent: () => import('./features/triads/triads').then((m) => m.Triads),
  },
  {
    path: 'licoes',
    title: 'Lições da Aula · Fretboard & Harmony Trainer',
    loadComponent: () => import('./features/lessons/lessons').then((m) => m.Lessons),
    children: [
      { path: '', pathMatch: 'full', redirectTo: LESSONS[0].slug },
      ...LESSONS.map((lesson) => ({
        path: lesson.slug,
        title: `${lesson.title} · Fretboard & Harmony Trainer`,
        loadComponent: lesson.loadComponent,
      })),
      { path: '**', redirectTo: LESSONS[0].slug },
    ],
  },
  { path: '**', redirectTo: 'braco' },
];
