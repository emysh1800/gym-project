import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { GymService } from '../../core/services/gym.service';
import { NotificationService } from '../../core/services/notification.service';
import { AdminMember } from '../../core/models/admin-member.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent {
  private gymService = inject(GymService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  readonly adminStats = signal<{
    totalMembers: number;
    activeSubscriptions: number;
    expiringSoon: number;
    monthlyRevenue: string;
  } | null>(null);
  readonly adminMembers = signal<AdminMember[]>([]);
  readonly adminSearchTerm = signal('');

  readonly filteredAdminMembers = computed(() => {
    const term = this.adminSearchTerm().trim().toLowerCase();
    const members = this.adminMembers();
    if (!term) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.plan.toLowerCase().includes(term) ||
        m.phone.includes(term)
    );
  });

  constructor() {
    this.loadData();
  }

  toggleMemberStatus(member: AdminMember): void {
    this.gymService.toggleMemberStatus(member.id).subscribe((updated) => {
      this.adminMembers.update((list) =>
        list.map((m) => (m.id === updated.id ? updated : m))
      );
      const statusLabel = updated.status === 'Active' ? 'نشط' : 'منتهي';
      this.notification.show(`تم تحديث حالة العضو "${updated.name}" إلى: ${statusLabel}`);
      this.gymService.getAdminStats().subscribe((stats) => this.adminStats.set(stats));
    });
  }

  renewMember(member: AdminMember): void {
    this.gymService.renewMember(member.id).subscribe((updated) => {
      this.adminMembers.update((list) =>
        list.map((m) => (m.id === updated.id ? updated : m))
      );
      this.notification.show(
        `تم تجديد اشتراك العضو "${updated.name}" بنجاح حتى ${updated.endDate}!`
      );
    });
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  private loadData(): void {
    this.gymService.getAdminStats().subscribe((stats) => this.adminStats.set(stats));
    this.gymService.getAdminMembers().subscribe((members) => this.adminMembers.set(members));
  }
}
