import { HttpInterceptorFn, HttpResponse, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { of, throwError, timer } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { mockGymDb, LoginPayload } from '../data/mock-gym.db';

function toApiPath(url: string): string {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return new URL(url).pathname;
    }
  } catch {
    // fall through
  }
  const apiIndex = url.indexOf('/api/');
  return apiIndex >= 0 ? url.slice(apiIndex) : url;
}

function handleMockFallback(req: HttpRequest<unknown>) {
  const url = toApiPath(req.url);
  const { method } = req;

  if (method === 'POST' && url === '/api/auth/login') {
    return of(new HttpResponse({ status: 200, body: mockGymDb.login(req.body as LoginPayload) }));
  }
  if (method === 'GET' && url === '/api/pricing-plans') {
    return of(new HttpResponse({ status: 200, body: mockGymDb.getPricingPlans() }));
  }
  if (method === 'GET' && url === '/api/single-classes') {
    return of(new HttpResponse({ status: 200, body: mockGymDb.getSingleClasses() }));
  }
  if (method === 'GET' && url === '/api/equipment') {
    return of(new HttpResponse({ status: 200, body: mockGymDb.getEquipment() }));
  }
  if (method === 'GET' && url === '/api/branches') {
    return of(new HttpResponse({ status: 200, body: mockGymDb.getBranches() }));
  }
  if (method === 'GET' && url === '/api/member/current') {
    return of(new HttpResponse({ status: 200, body: mockGymDb.getCurrentMember() }));
  }
  if (method === 'GET' && url === '/api/member/metrics') {
    return of(new HttpResponse({ status: 200, body: mockGymDb.getMemberMetrics() }));
  }
  if (method === 'GET' && url === '/api/member/subscription') {
    return of(new HttpResponse({ status: 200, body: mockGymDb.getMemberSubscription() }));
  }
  if (method === 'GET' && url === '/api/member/schedule') {
    return of(new HttpResponse({ status: 200, body: mockGymDb.getMemberSchedule() }));
  }
  if (method === 'GET' && url === '/api/member/nutrition') {
    return of(new HttpResponse({ status: 200, body: mockGymDb.getNutritionPlan() }));
  }
  if (method === 'GET' && url === '/api/admin/stats') {
    return of(new HttpResponse({ status: 200, body: mockGymDb.getAdminStats() }));
  }
  if (method === 'GET' && url === '/api/admin/members') {
    return of(new HttpResponse({ status: 200, body: mockGymDb.getAdminMembers() }));
  }

  const toggleMatch = url.match(/^\/api\/admin\/members\/(\d+)\/toggle$/);
  if ((method === 'PATCH' || method === 'POST') && toggleMatch) {
    const updated = mockGymDb.toggleMemberStatus(Number(toggleMatch[1]));
    return updated
      ? of(new HttpResponse({ status: 200, body: updated }))
      : throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));
  }

  const renewMatch = url.match(/^\/api\/admin\/members\/(\d+)\/renew$/);
  if ((method === 'PATCH' || method === 'POST') && renewMatch) {
    const updated = mockGymDb.renewMember(Number(renewMatch[1]));
    return updated
      ? of(new HttpResponse({ status: 200, body: updated }))
      : throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));
  }

  if (method === 'GET' && url === '/api/member/bookings') {
    return of(new HttpResponse({ status: 200, body: mockGymDb.getMemberBookings() }));
  }

  const cancelMatch = url.match(/^\/api\/member\/bookings\/([^/]+)$/);
  if (method === 'DELETE' && cancelMatch) {
    const res = mockGymDb.cancelBooking(cancelMatch[1]);
    return res
      ? of(new HttpResponse({ status: 200, body: res }))
      : throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' }));
  }

  const bookMatch = url.match(/^\/api\/sessions\/([^/]+)\/book$/);
  if (method === 'POST' && bookMatch) {
    const result = mockGymDb.bookSession(bookMatch[1]);
    if (!result) {
      return throwError(() => new HttpErrorResponse({ status: 400, statusText: 'Bad Request', error: { message: 'عذراً، لا تتوفر مقاعد شاغرة في هذه الحصة.' } }));
    }
    if (result.alreadyBooked) {
      return throwError(() => new HttpErrorResponse({ status: 409, statusText: 'Conflict', error: { message: 'لقد قمت بحجز هذه الحصة مسبقاً! يمكنك متابعة تفاصيلها في صفحة "حجوزاتي".' } }));
    }
    return of(new HttpResponse({ status: 200, body: { success: true, statusCode: 200, message: `تم حجز مقعدك بنجاح في "${result.session.title}"!`, session: result.session, booking: result.booking } }));
  }

  return throwError(
    () => new HttpErrorResponse({ status: 404, statusText: 'Not Found', error: { message: `No handler for ${method} ${url}` } })
  );
}

/**
 * Smart API Interceptor:
 * Injects Authorization: Bearer <JWT> token from localStorage when available.
 * Sends requests to the real backend server first.
 * If the real backend server is running, the real API response is used.
 * If the backend server is offline (status 0 / 504), it seamlessly falls back
 * so buttons and clicks always work without breaking the user experience.
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  const url = toApiPath(req.url);
  if (!url.startsWith('/api/')) {
    return next(req);
  }

  const token = localStorage.getItem('gym_token');
  let authReq = req;
  if (token && !req.headers.has('Authorization')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // If server is not running or unreachable (status 0, 502, 503, 504), use fallback
      if (err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504) {
        console.warn('⚡ Real API server is offline on port 3000, falling back to local DB so UI stays interactive:', req.url);
        return handleMockFallback(req);
      }
      return throwError(() => err);
    })
  );
};
