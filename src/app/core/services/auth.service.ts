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
  private _loginModalRole$ = new BehaviorSubject<'admin' | 'member' | null>(null);

  readonly isLoggedIn$ = this._isLoggedIn$.asObservable();
  readonly userRole$ = this._userRole$.asObservable();
  readonly loginModalRole$ = this._loginModalRole$.asObservable();

  get isLoggedIn(): boolean {
    return this._isLoggedIn$.getValue();
  }

  get userRole(): UserRole {
    return this._userRole$.getValue();
  }

  constructor(private http: HttpClient) {}

  login(
    username: string,
    password: string,
    targetRole: 'admin' | 'member'
  ): Observable<LoginResult> {
    return this.http
      .post<LoginResult>('/api/auth/login', {
        username: username.trim().toLowerCase(),
        password: password.trim(),
        targetRole,
      })
      .pipe(
        tap((result) => {
          if (result.success) {
            if (result.token) {
              localStorage.setItem(LS_TOKEN, result.token);
            }
            this.setSession(targetRole);
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

  openLoginModal(role: 'admin' | 'member'): void {
    this._loginModalRole$.next(role);
  }

  closeLoginModal(): void {
    this._loginModalRole$.next(null);
  }

  getDemoCredentials(role: 'admin' | 'member'): { username: string; password: string } {
    return { username: role, password: '123' };
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
