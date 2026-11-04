import { Routes } from '@angular/router';
import { LESSONS } from './features/lessons/lessons.registry';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'treino' },
  {
    path: 'treino',
    title: 'Treino Diário · Treino de Guitarra',
    loadComponent: () =>
      import('./features/daily-routine/daily-routine').then((m) => m.DailyRoutine),
  },
  {
    path: 'braco',
    title: 'Braço & Quiz · Treino de Guitarra',
    loadComponent: () =>
      import('./features/fretboard-quiz/fretboard-quiz').then((m) => m.FretboardQuiz),
  },
  {
    path: 'acordes',
    title: 'Troca de Acordes · Treino de Guitarra',
    loadComponent: () =>
      import('./features/chord-trainer/chord-trainer').then((m) => m.ChordTrainer),
  },
  {
    path: 'caged',
    title: 'Sistema CAGED · Treino de Guitarra',
    loadComponent: () => import('./features/caged/caged').then((m) => m.Caged),
  },
  {
    path: 'licoes',
    title: 'Lições da Aula · Treino de Guitarra',
    loadComponent: () => import('./features/lessons/lessons').then((m) => m.Lessons),
    children: [
      { path: '', pathMatch: 'full', redirectTo: LESSONS[0].slug },
      ...LESSONS.map((lesson) => ({
        path: lesson.slug,
        title: `${lesson.title} · Treino de Guitarra`,
        loadComponent: lesson.loadComponent,
      })),
      { path: '**', redirectTo: LESSONS[0].slug },
    ],
  },
  { path: '**', redirectTo: 'treino' },
];
