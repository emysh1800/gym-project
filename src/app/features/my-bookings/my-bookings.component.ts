import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { GymService } from '../../core/services/gym.service';
import { NotificationService } from '../../core/services/notification.service';
import { ClassBooking } from '../../core/models/booking.model';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css'],
})
export class MyBookingsComponent implements OnInit {
  private gymService = inject(GymService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  readonly bookings = signal<ClassBooking[]>([]);
  readonly isLoading = signal(true);
  readonly cancellingId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading.set(true);
    this.gymService.getMemberBookings().subscribe({
      next: (list) => {
        this.bookings.set(list || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goToClasses(): void {
    this.router.navigate(['/home']).then(() => {
      setTimeout(() => {
        const el = document.getElementById('single-classes');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
  }

  goToMemberPortal(): void {
    this.router.navigate(['/member-portal']);
  }

  cancelBooking(booking: ClassBooking): void {
    if (!confirm(`هل أنت متأكد من رغبتك في إلغاء حجز حصة: "${booking.sessionTitle}"؟`)) {
      return;
    }

    this.cancellingId.set(booking.id);
    this.gymService.cancelBooking(booking.id).subscribe({
      next: (res) => {
        this.cancellingId.set(null);
        this.bookings.update((prev) => prev.filter((b) => b.id !== booking.id));
        this.notification.show(res.message || `تم إلغاء حجز "${booking.sessionTitle}" واسترجاع المقعد بنجاح.`);
      },
      error: (err) => {
        this.cancellingId.set(null);
        this.notification.show(err?.error?.message || 'تعذر إلغاء الحجز، يرجى المحاولة لاحقاً.');
      },
    });
  }
}
