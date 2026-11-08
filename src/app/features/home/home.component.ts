import { Component, inject, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { GymService, BookingResponse } from '../../core/services/gym.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { PricingPlan } from '../../core/models/pricing-plan.model';
import { SingleSession } from '../../core/models/single-session.model';
import { ContactFormComponent } from '../../shared/contact-form/contact-form.component';
import { BookClassModalComponent } from '../../shared/book-class-modal/book-class-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ContactFormComponent, BookClassModalComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private gymService = inject(GymService);
  private notification = inject(NotificationService);
  public authService = inject(AuthService);
  private router = inject(Router);

  readonly pricingPlans = toSignal(this.gymService.getPricingPlans(), {
    initialValue: [] as PricingPlan[],
  });
  readonly equipmentList = toSignal(this.gymService.getEquipment(), { initialValue: [] });
  readonly branches = toSignal(this.gymService.getBranches(), { initialValue: [] });
  readonly singleClasses = signal<SingleSession[]>([]);

  // Booking Modal State
  readonly selectedSession = signal<SingleSession | null>(null);
  readonly bookedSessionIds = signal<Set<string>>(new Set());

  constructor() {
    this.gymService.getSingleClasses().subscribe((classes) => this.singleClasses.set(classes));
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn) {
      this.loadUserBookings();
    }
  }

  loadUserBookings(): void {
    this.gymService.getMemberBookings().subscribe({
      next: (bookings) => {
        const ids = new Set((bookings || []).map((b) => b.sessionId));
        this.bookedSessionIds.set(ids);
      },
      error: () => {},
    });
  }

  openBookingModal(session: SingleSession): void {
    if (this.authService.isLoggedIn) {
      this.loadUserBookings();
    }
    this.selectedSession.set(session);
  }

  closeBookingModal(): void {
    this.selectedSession.set(null);
  }

  onBookingSuccess(event: { session: SingleSession; bookingResponse: BookingResponse }): void {
    // 7. Update remaining seats immediately in UI
    if (event.session) {
      this.singleClasses.update((list) =>
        list.map((item) => (item.id === event.session.id ? event.session : item))
      );
    }
    // Track booked session id
    this.bookedSessionIds.update((set) => new Set([...set, event.session.id]));
    this.closeBookingModal();
  }

  isSessionBooked(sessionId: string): boolean {
    return this.bookedSessionIds().has(sessionId);
  }

  scrollToSection(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  navigateToMemberPortal(): void {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/member-portal']);
    } else {
      this.authService.openLoginModal('member');
    }
  }

  selectPlan(plan: PricingPlan): void {
    this.notification.show(`تم اختيار "${plan.name}"! اضغط على بوابة المشترك لتجربة لوحة المتابعة.`);
  }

  bookSession(session: SingleSession): void {
    this.openBookingModal(session);
  }
}
