import { DOCUMENT, Injectable, inject } from '@angular/core';

/**
 * Keeps the screen on while the app is in front: practising with both hands on the guitar leaves
 * no hand free to tap the phone before it dims. The browser drops the lock whenever the page is
 * hidden, so it is requested again each time the page comes back.
 */
@Injectable({ providedIn: 'root' })
export class WakeLockService {
  private readonly document = inject(DOCUMENT);
  private sentinel: WakeLockSentinel | null = null;

  start(): void {
    const view = this.document.defaultView;
    if (!view?.navigator.wakeLock) {
      return;
    }
    const acquire = () => void this.acquire();
    this.document.addEventListener('visibilitychange', acquire);
    // Some browsers (Safari) only grant the lock after the user has interacted with the page.
    this.document.addEventListener('pointerdown', acquire);
    acquire();
  }

  private async acquire(): Promise<void> {
    if (this.document.visibilityState !== 'visible' || (this.sentinel && !this.sentinel.released)) {
      return;
    }
    try {
      this.sentinel = await this.document.defaultView!.navigator.wakeLock.request('screen');
    } catch {
      // Refused (battery saver, not allowed yet): the next interaction or visibility change retries.
    }
  }
}
