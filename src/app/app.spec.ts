import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';
import { AuthService } from './core/services/auth.service';
import { GymService } from './core/services/gym.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([mockApiInterceptor])),
      ],
    }).compileComponents();
  });

  it('should create the app shell with router outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance).toBeTruthy();
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
    expect(compiled.querySelector('app-navbar')).toBeTruthy();
  });
});

describe('AuthService', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([mockApiInterceptor]))],
    });
    auth = TestBed.inject(AuthService);
  });

  it('should reject invalid credentials', async () => {
    const result = await firstValueFrom(auth.login('wrong', 'pass', 'admin'));
    expect(result.success).toBe(false);
    expect(auth.isLoggedIn).toBe(false);
  });

  it('should login as admin with admin / 123 or manager / gym@2026', async () => {
    const resultOld = await firstValueFrom(auth.login('admin', '123', 'admin'));
    expect(resultOld.success).toBe(true);
    expect(auth.userRole).toBe('admin');

    const resultNew = await firstValueFrom(auth.login('manager', 'gym@2026', 'admin'));
    expect(resultNew.success).toBe(true);
    expect(auth.userRole).toBe('admin');
  });

  it('should login as member with member / 123 or captain.ahmed / gym@2026', async () => {
    const resultOld = await firstValueFrom(auth.login('member', '123', 'member'));
    expect(resultOld.success).toBe(true);
    expect(auth.userRole).toBe('member');

    const resultNew = await firstValueFrom(auth.login('captain.ahmed', 'gym@2026', 'member'));
    expect(resultNew.success).toBe(true);
    expect(auth.userRole).toBe('member');
  });

  it('should logout and clear session', async () => {
    await firstValueFrom(auth.login('admin', '123', 'admin'));
    auth.logout();
    expect(auth.isLoggedIn).toBe(false);
    expect(auth.userRole).toBeNull();
  });
});

describe('GymService Bookings & Classes', () => {
  let auth: AuthService;
  let gymService: GymService;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([mockApiInterceptor]))],
    });
    auth = TestBed.inject(AuthService);
    gymService = TestBed.inject(GymService);
    await firstValueFrom(auth.login('member', '123', 'member'));
  });

  it('should retrieve single classes list', async () => {
    const classes = await firstValueFrom(gymService.getSingleClasses());
    expect(Array.isArray(classes)).toBe(true);
    expect(classes.length).toBeGreaterThan(0);
    expect(classes[0].id).toBeTruthy();
  });

  it('should book a class session and retrieve it in member bookings', async () => {
    const classes = await firstValueFrom(gymService.getSingleClasses());
    const targetSession = classes.find((c) => c.spotsLeft > 0) || classes[0];

    const bookRes = await firstValueFrom(
      gymService.bookSession(targetSession.id, 'ملاحظة تجريبية للاختبار')
    );
    expect(bookRes.success).toBe(true);
    expect(bookRes.booking).toBeDefined();

    const myBookings = await firstValueFrom(gymService.getMemberBookings());
    expect(Array.isArray(myBookings)).toBe(true);
    expect(myBookings.some((b) => b.sessionId === targetSession.id)).toBe(true);
  });

  it('should cancel an existing booking and update spots', async () => {
    const myBookings = await firstValueFrom(gymService.getMemberBookings());
    if (myBookings.length > 0) {
      const toCancel = myBookings[0];
      const cancelRes = await firstValueFrom(gymService.cancelBooking(toCancel.id));
      expect(cancelRes.success).toBe(true);

      const afterCancel = await firstValueFrom(gymService.getMemberBookings());
      expect(afterCancel.some((b) => b.id === toCancel.id)).toBe(false);
    }
  });
});
