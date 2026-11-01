export interface AdminMember {
  id: number;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: 'Active' | 'Expired';
  endDate: string;
  avatarBg: string;
}

export interface AdminStats {
  totalMembers: number;
  activeSubscriptions: number;
  expiringSoon: number;
  monthlyRevenue: string;
}
