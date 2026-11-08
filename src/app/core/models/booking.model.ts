export interface ClassBooking {
  id: string;
  userId: string;
  userName?: string;
  sessionId: string;
  sessionTitle: string;
  category: string;
  coach: string;
  schedule: string;
  duration: string;
  price: number;
  currency: string;
  icon: string;
  bookingDate: string;
  status: 'مؤكد' | 'ملغى';
  notes?: string;
}
