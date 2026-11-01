import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [AsyncPipe, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  isMobileMenuOpen = false;

  constructor(
    public authService: AuthService,
    private notification: NotificationService,
    private router: Router
  ) {}

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  navigateHome(): void {
    this.router.navigate(['/home']);
  }

  scrollToSection(sectionId: string): void {
    const onHome = this.router.url === '/home' || this.router.url === '/';
    if (!onHome) {
      this.router.navigate(['/home']).then(() => {
        setTimeout(() => this.executeScroll(sectionId), 150);
      });
    } else {
      this.executeScroll(sectionId);
    }
  }

  requestMemberPortal(): void {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/member-portal']);
    } else {
      this.authService.openLoginModal('member');
    }
  }

  requestAdminDashboard(): void {
    if (this.authService.userRole === 'admin') {
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.authService.openLoginModal('admin');
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
    this.notification.show('تم تسجيل الخروج بنجاح. نراك قريباً في النادي!');
  }

  private executeScroll(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
