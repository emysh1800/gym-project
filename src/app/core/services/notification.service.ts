import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _toast$ = new BehaviorSubject<string | null>(null);
  readonly toast$ = this._toast$.asObservable();

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  show(message: string, durationMs = 4000): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this._toast$.next(message);
    this.toastTimer = setTimeout(() => this.dismiss(), durationMs);
  }

  dismiss(): void {
    this._toast$.next(null);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
  }
}
