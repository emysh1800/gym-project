import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AppComponent } from './app.component';
import { routes } from './app.routes';
import { mockApiInterceptor } from './core/interceptors/mock-api.interceptor';
import { AuthService } from './core/services/auth.service';

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

  it('should login as admin with admin / 123', async () => {
    const result = await firstValueFrom(auth.login('admin', '123', 'admin'));
    expect(result.success).toBe(true);
    expect(auth.isLoggedIn).toBe(true);
    expect(auth.userRole).toBe('admin');
  });

  it('should login as member with member / 123', async () => {
    const result = await firstValueFrom(auth.login('member', '123', 'member'));
    expect(result.success).toBe(true);
    expect(auth.userRole).toBe('member');
  });

  it('should logout and clear session', async () => {
    await firstValueFrom(auth.login('admin', '123', 'admin'));
    auth.logout();
    expect(auth.isLoggedIn).toBe(false);
    expect(auth.userRole).toBeNull();
  });
});
