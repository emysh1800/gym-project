export interface PricingPlan {
  id: string;
  name: string;
  nameEn: string;
  period: string;
  price: number;
  currency: string;
  isPopular?: boolean;
  badge?: string;
  features: string[];
}
