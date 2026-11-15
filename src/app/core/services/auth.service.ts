import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export type UserRole = 'admin' | 'member' | null;

export interface LoginResult {
  success: boolean;
  message: string;
  role?: 'admin' | 'member';
  token?: string;
}

const LS_IS_LOGGED_IN = 'gym_isLoggedIn';
const LS_USER_ROLE = 'gym_userRole';
const LS_TOKEN = 'gym_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isLoggedIn$ = new BehaviorSubject<boolean>(this.restoreLoggedIn());
  private _userRole$ = new BehaviorSubject<UserRole>(this.restoreRole());
  private _loginModalOpen$ = new BehaviorSubject<boolean>(false);

  readonly isLoggedIn$ = this._isLoggedIn$.asObservable();
  readonly userRole$ = this._userRole$.asObservable();
  readonly loginModalOpen$ = this._loginModalOpen$.asObservable();

  get isLoggedIn(): boolean {
    return this._isLoggedIn$.getValue();
  }

  get userRole(): UserRole {
    return this._userRole$.getValue();
  }

  get isLoginModalOpen(): boolean {
    return this._loginModalOpen$.getValue();
  }

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResult> {
    return this.http
      .post<LoginResult>('/api/auth/login', {
        username: username.trim().toLowerCase(),
        password: password.trim(),
      })
      .pipe(
        tap((result) => {
          if (result.success && result.role) {
            if (result.token) {
              localStorage.setItem(LS_TOKEN, result.token);
            }
            this.setSession(result.role);
          }
        })
      );
  }

  logout(): void {
    this._isLoggedIn$.next(false);
    this._userRole$.next(null);
    localStorage.removeItem(LS_IS_LOGGED_IN);
    localStorage.removeItem(LS_USER_ROLE);
    localStorage.removeItem(LS_TOKEN);
  }

  openLoginModal(_role?: 'admin' | 'member'): void {
    this._loginModalOpen$.next(true);
  }

  closeLoginModal(): void {
    this._loginModalOpen$.next(false);
  }

  private setSession(role: 'admin' | 'member'): void {
    this._isLoggedIn$.next(true);
    this._userRole$.next(role);
    localStorage.setItem(LS_IS_LOGGED_IN, 'true');
    localStorage.setItem(LS_USER_ROLE, role);
  }

  private restoreLoggedIn(): boolean {
    return localStorage.getItem(LS_IS_LOGGED_IN) === 'true';
  }

  private restoreRole(): UserRole {
    const stored = localStorage.getItem(LS_USER_ROLE);
    return stored === 'admin' || stored === 'member' ? stored : null;
  }
}
