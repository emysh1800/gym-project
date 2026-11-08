import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SingleSession } from '../../core/models/single-session.model';
import { AuthService } from '../../core/services/auth.service';
import { GymService, BookingResponse } from '../../core/services/gym.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-book-class-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-class-modal.component.html',
  styleUrls: ['./book-class-modal.component.css'],
})
export class BookClassModalComponent {
  @Input({ required: true }) session!: SingleSession;
  @Input() alreadyBooked = false;

  @Output() closed = new EventEmitter<void>();
  @Output() bookingSuccess = new EventEmitter<{ session: SingleSession; bookingResponse: BookingResponse }>();

  auth = inject(AuthService);
  private gymService = inject(GymService);
  private notification = inject(NotificationService);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  notes = '';

  close(): void {
    if (this.isLoading()) return;
    this.closed.emit();
  }

  requestLogin(): void {
    this.close();
    this.auth.openLoginModal('member');
  }

  confirmBooking(): void {
    if (this.isLoading()) return;

    if (!this.auth.isLoggedIn) {
      this.errorMessage.set('يجب عليك تسجيل الدخول أولاً لتتمكن من حجز الحصة.');
      this.auth.openLoginModal('member');
      return;
    }

    if (this.alreadyBooked) {
      this.errorMessage.set('لقد قمت بحجز هذه الحصة مسبقاً! يمكنك متابعة تفاصيلها في صفحة حجوزاتي.');
      return;
    }

    if (this.session.spotsLeft <= 0) {
      this.errorMessage.set('عذراً، لقد اكتمل عدد المقاعد لهذه الحصة ولم تعد هناك مقاعد شاغرة.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.gymService.bookSession(this.session.id, this.notes).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.notification.show(res.message || `تم حجز مقعدك بنجاح في "${this.session.title}"!`);
        this.bookingSuccess.emit({
          session: res.session,
          bookingResponse: res,
        });
        this.close();
      },
      error: (err) => {
        this.isLoading.set(false);
        const serverMsg =
          err?.error?.message ||
          (err.status === 409
            ? 'لقد قمت بحجز هذه الحصة مسبقاً! يمكنك متابعة تفاصيلها في صفحة حجوزاتي.'
            : err.status === 400
            ? 'عذراً، اكتملت المقاعد لهذه الحصة.'
            : err.status === 401
            ? 'يرجى تسجيل الدخول أولاً لإتمام الحجز.'
            : 'حدث خطأ غير متوقع أثناء إتمام الحجز. يرجى المحاولة مرة أخرى.');
        this.errorMessage.set(serverMsg);

        // If the server reported spots are 0, update local session spots
        if (err.status === 400 && this.session.spotsLeft > 0) {
          this.session = { ...this.session, spotsLeft: 0 };
        }
      },
    });
  }
}
