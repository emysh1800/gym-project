export interface MemberSubscription {
  planName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  daysRemaining: number;
  progressPercent: number;
  status: 'Active' | 'Expiring' | 'Expired';
}
