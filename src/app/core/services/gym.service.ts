import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { mockGymDb } from '../data/mock-gym.db';

import { PricingPlan } from '../models/pricing-plan.model';
import { SingleSession } from '../models/single-session.model';
import { EquipmentItem } from '../models/equipment-item.model';
import { GymBranch } from '../models/gym-branch.model';
import { CurrentMember } from '../models/current-member.model';
import { MemberMetrics } from '../models/member-metrics.model';
import { MemberSubscription } from '../models/member-subscription.model';
import { WorkoutDay } from '../models/workout-day.model';
import { NutritionOverview } from '../models/nutrition-overview.model';
import { AdminMember, AdminStats } from '../models/admin-member.model';
import { ClassBooking } from '../models/booking.model';

export interface BookingResponse {
  success: boolean;
  statusCode?: number;
  message: string;
  booking?: ClassBooking;
  session: SingleSession;
}

export interface AdminMemberQueryParams {
  search?: string;
  status?: string;
  plan?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class GymService {
  private readonly api = '/api';

  constructor(private http: HttpClient) {}

  getPricingPlans(): Observable<PricingPlan[]> {
    return this.http.get<PricingPlan[]>(`${this.api}/pricing-plans`).pipe(
      catchError(() => of(mockGymDb.getPricingPlans()))
    );
  }

  getSingleClasses(): Observable<SingleSession[]> {
    return this.http.get<SingleSession[]>(`${this.api}/single-classes`).pipe(
      catchError(() => of(mockGymDb.getSingleClasses()))
    );
  }

  getEquipment(): Observable<EquipmentItem[]> {
    return this.http.get<EquipmentItem[]>(`${this.api}/equipment`).pipe(
      catchError(() => of(mockGymDb.getEquipment()))
    );
  }

  getBranches(): Observable<GymBranch[]> {
    return this.http.get<GymBranch[]>(`${this.api}/branches`).pipe(
      catchError(() => of(mockGymDb.getBranches()))
    );
  }

  getCurrentMember(): Observable<CurrentMember> {
    return this.http.get<CurrentMember>(`${this.api}/member/current`).pipe(
      catchError(() => of(mockGymDb.getCurrentMember()))
    );
  }

  getMemberMetrics(): Observable<MemberMetrics> {
    return this.http.get<MemberMetrics>(`${this.api}/member/metrics`).pipe(
      catchError(() => of(mockGymDb.getMemberMetrics()))
    );
  }

  getMemberSubscription(): Observable<MemberSubscription> {
    return this.http.get<MemberSubscription>(`${this.api}/member/subscription`).pipe(
      catchError(() => of(mockGymDb.getMemberSubscription()))
    );
  }

  getMemberSchedule(): Observable<WorkoutDay[]> {
    return this.http.get<WorkoutDay[]>(`${this.api}/member/schedule`).pipe(
      catchError(() => of(mockGymDb.getMemberSchedule()))
    );
  }

  getNutritionPlan(): Observable<NutritionOverview> {
    return this.http.get<NutritionOverview>(`${this.api}/member/nutrition`).pipe(
      catchError(() => of(mockGymDb.getNutritionPlan()))
    );
  }

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.api}/admin/stats`).pipe(
      catchError(() => of(mockGymDb.getAdminStats()))
    );
  }

  getAdminMembers(params?: AdminMemberQueryParams): Observable<AdminMember[]> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.plan) httpParams = httpParams.set('plan', params.plan);
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);

    return this.http.get<any>(`${this.api}/admin/members`, { params: httpParams }).pipe(
      map((res) => (Array.isArray(res) ? res : res.data || [])),
      catchError(() => of(mockGymDb.getAdminMembers()))
    );
  }

  toggleMemberStatus(memberId: number): Observable<AdminMember> {
    return this.http.patch<any>(`${this.api}/admin/members/${memberId}/toggle`, {}).pipe(
      map((res) => (res && res.member ? res.member : res))
    );
  }

  renewMember(memberId: number): Observable<AdminMember> {
    return this.http.patch<any>(`${this.api}/admin/members/${memberId}/renew`, {}).pipe(
      map((res) => (res && res.member ? res.member : res))
    );
  }

  deleteMember(memberId: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/admin/members/${memberId}`);
  }

  bookSession(sessionId: string, notes?: string): Observable<BookingResponse> {
    return this.http.post<any>(`${this.api}/sessions/${sessionId}/book`, { notes }).pipe(
      map((res) => {
        // Handle both nested session and flat session format for backward compatibility
        const session = res.session || res;
        return {
          success: res.success !== false,
          statusCode: res.statusCode || 200,
          message: res.message || 'تم حجز الحصة بنجاح',
          booking: res.booking,
          session,
        };
      })
    );
  }

  getMemberBookings(): Observable<ClassBooking[]> {
    return this.http.get<ClassBooking[]>(`${this.api}/member/bookings`).pipe(
      catchError(() => of(mockGymDb.getMemberBookings()))
    );
  }

  cancelBooking(bookingId: string): Observable<{ success: boolean; message: string; session?: SingleSession }> {
    return this.http.delete<{ success: boolean; message: string; session?: SingleSession }>(
      `${this.api}/member/bookings/${bookingId}`
    );
  }
}
