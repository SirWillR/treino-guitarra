import { DestroyRef, inject, Signal, signal } from '@angular/core';

/** Tracks a CSS media query as a signal. Must be called in an injection context. */
export function mediaQuery(query: string): Signal<boolean> {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return signal(false).asReadonly();
  }
  const list = window.matchMedia(query);
  const matches = signal(list.matches);
  const onChange = (event: MediaQueryListEvent) => matches.set(event.matches);
  list.addEventListener('change', onChange);
  inject(DestroyRef).onDestroy(() => list.removeEventListener('change', onChange));
  return matches.asReadonly();
}
