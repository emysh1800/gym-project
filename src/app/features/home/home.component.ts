import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { GymService } from '../../core/services/gym.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { PricingPlan } from '../../core/models/pricing-plan.model';
import { SingleSession } from '../../core/models/single-session.model';
import { ContactFormComponent } from '../../shared/contact-form/contact-form.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ContactFormComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private gymService = inject(GymService);
  private notification = inject(NotificationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly pricingPlans = toSignal(this.gymService.getPricingPlans(), {
    initialValue: [] as PricingPlan[],
  });
  readonly equipmentList = toSignal(this.gymService.getEquipment(), { initialValue: [] });
  readonly branches = toSignal(this.gymService.getBranches(), { initialValue: [] });
  readonly singleClasses = signal<SingleSession[]>([]);

  constructor() {
    this.gymService.getSingleClasses().subscribe((classes) => this.singleClasses.set(classes));
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
    if (session.spotsLeft <= 0) {
      this.notification.show(`عذراً، لا تتوفر مقاعد شاغرة في حصة: "${session.title}".`);
      return;
    }
    this.gymService.bookSession(session.id).subscribe((updated) => {
      this.singleClasses.update((list) =>
        list.map((item) => (item.id === updated.id ? updated : item))
      );
      this.notification.show(
        `تم حجز مقعدك بنجاح في حصة: "${session.title}"! سنتواصل معك عبر الرسائل.`
      );
    });
  }
}
