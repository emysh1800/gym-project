import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
    return this.http.get<PricingPlan[]>(`${this.api}/pricing-plans`);
  }

  getSingleClasses(): Observable<SingleSession[]> {
    return this.http.get<SingleSession[]>(`${this.api}/single-classes`);
  }

  getEquipment(): Observable<EquipmentItem[]> {
    return this.http.get<EquipmentItem[]>(`${this.api}/equipment`);
  }

  getBranches(): Observable<GymBranch[]> {
    return this.http.get<GymBranch[]>(`${this.api}/branches`);
  }

  getCurrentMember(): Observable<CurrentMember> {
    return this.http.get<CurrentMember>(`${this.api}/member/current`);
  }

  getMemberMetrics(): Observable<MemberMetrics> {
    return this.http.get<MemberMetrics>(`${this.api}/member/metrics`);
  }

  getMemberSubscription(): Observable<MemberSubscription> {
    return this.http.get<MemberSubscription>(`${this.api}/member/subscription`);
  }

  getMemberSchedule(): Observable<WorkoutDay[]> {
    return this.http.get<WorkoutDay[]>(`${this.api}/member/schedule`);
  }

  getNutritionPlan(): Observable<NutritionOverview> {
    return this.http.get<NutritionOverview>(`${this.api}/member/nutrition`);
  }

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.api}/admin/stats`);
  }

  getAdminMembers(params?: AdminMemberQueryParams): Observable<AdminMember[]> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.plan) httpParams = httpParams.set('plan', params.plan);
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);

    return this.http.get<any>(`${this.api}/admin/members`, { params: httpParams }).pipe(
      map((res) => (Array.isArray(res) ? res : res.data || []))
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

  bookSession(sessionId: string): Observable<SingleSession> {
    return this.http.post<SingleSession>(`${this.api}/sessions/${sessionId}/book`, {});
  }
}
