import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (notification.toast$ | async; as msg) {
      <div class="toast-notification" role="alert">
        <span class="toast-icon">🔔</span>
        <span class="toast-text">{{ msg }}</span>
        <button class="toast-close" (click)="notification.dismiss()" aria-label="إغلاق">✕</button>
      </div>
    }
  `,
})
export class ToastComponent {
  constructor(public notification: NotificationService) {}
}
