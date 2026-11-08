import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { GymService } from '../../core/services/gym.service';

@Component({
  selector: 'app-member-portal',
  standalone: true,
  templateUrl: './member-portal.component.html',
})
export class MemberPortalComponent {
  private gymService = inject(GymService);
  private router = inject(Router);

  readonly currentMember = toSignal(this.gymService.getCurrentMember());
  readonly memberMetrics = toSignal(this.gymService.getMemberMetrics());
  readonly memberSubscription = toSignal(this.gymService.getMemberSubscription());
  readonly memberSchedule = toSignal(this.gymService.getMemberSchedule(), { initialValue: [] });
  readonly nutritionPlan = toSignal(this.gymService.getNutritionPlan());
  readonly myBookings = toSignal(this.gymService.getMemberBookings(), { initialValue: [] });

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goToBookings(): void {
    this.router.navigate(['/my-bookings']);
  }
}
