import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

/**
 * Offers the new version after a deploy. The service worker keeps serving the cached app, and an
 * installed app can stay open in the background for days, so it checks again whenever the page
 * comes back to the front and lets the user reload when it suits them (not mid-exercise).
 */
@Injectable({ providedIn: 'root' })
export class UpdateService {
  private readonly document = inject(DOCUMENT);
  private readonly updates = inject(SwUpdate);

  /** Whether a new version is downloaded and waiting for a reload. */
  readonly ready = signal(false);

  start(): void {
    // Disabled in dev builds and tests.
    if (!this.updates.isEnabled) {
      return;
    }
    this.updates.versionUpdates.subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        this.ready.set(true);
      }
    });
    // The cached app can no longer load its files: only a reload recovers.
    this.updates.unrecoverable.subscribe(() => this.reload());
    this.document.addEventListener('visibilitychange', () => {
      if (this.document.visibilityState === 'visible') {
        // Offline or a failed check: the next visibility change tries again.
        this.updates.checkForUpdate().catch(() => undefined);
      }
    });
  }

  reload(): void {
    this.document.location.reload();
  }
}
