import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * AdminGuard — protects /admin-dashboard.
 * Redirects to '/' if the user's role is not 'admin'.
 */
export const adminGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.userRole$.pipe(
    take(1),
    map((role) => {
      if (role === 'admin') {
        return true;
      }
      return router.createUrlTree(['/home']);
    })
  );
};
