import { Type } from '@angular/core';

export interface LessonEntry {
  /** URL segment under /licoes. */
  slug: string;
  title: string;
  summary: string;
  loadComponent: () => Promise<Type<unknown>>;
}

/**
 * Every lesson shown in the "Lições da Aula" submenu, in order. To add one, create its component
 * in this folder and append an entry here: the submenu and the route are generated from this list.
 */
export const LESSONS: readonly LessonEntry[] = [
  {
    slug: 'aquecimento',
    title: 'Aquecimento',
    summary: 'Cromático 1-2-3-4 e variações',
    loadComponent: () => import('./warmup-practice').then((m) => m.WarmupPractice),
  },
  {
    slug: 'escala',
    title: 'Escala & Digitação',
    summary: 'O padrão da aula (cordas 5, 4 e 3) e a escala maior nas 6 cordas',
    loadComponent: () => import('./scale-practice').then((m) => m.ScalePractice),
  },
  {
    slug: 'progressoes',
    title: 'Progressões Harmônicas',
    summary: 'Sequências de acordes com dicas',
    loadComponent: () => import('./progression-practice').then((m) => m.ProgressionPractice),
  },
];
