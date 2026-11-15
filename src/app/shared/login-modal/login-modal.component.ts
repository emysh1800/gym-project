import {
  Component,
  EventEmitter,
  Output,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { GymService } from '../../core/services/gym.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login-modal.component.html',
})
export class LoginModalComponent {
  @Output() closed = new EventEmitter<void>();

  private authService = inject(AuthService);
  private gymService = inject(GymService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  loginForm = { username: '', password: '' };
  readonly loginError = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly isLoading = signal(false);

  close(): void {
    this.loginError.set(null);
    this.loginForm = { username: '', password: '' };
    this.showPassword.set(false);
    this.closed.emit();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  handleLogin(): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.loginError.set(null);

    this.authService
      .login(this.loginForm.username, this.loginForm.password)
      .subscribe({
        next: (result) => {
          this.isLoading.set(false);
          if (result.success) {
            this.notification.show(result.message);
            this.close();

            const pending = this.gymService.getPendingBooking();
            if (pending && result.role === 'member') {
              // Ensure user is on /home so the session confirmation modal shows immediately
              if (this.router.url !== '/' && !this.router.url.startsWith('/home')) {
                this.router.navigate(['/home']);
              }
            } else {
              this.gymService.clearPendingBooking();
              const route = result.role === 'admin' ? '/admin-dashboard' : '/member-portal';
              this.router.navigate([route]);
            }
          } else {
            this.loginError.set(result.message);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.loginError.set('حدث خطأ غير متوقع. يرجى المحاولة مجدداً.');
        },
      });
  }
}
