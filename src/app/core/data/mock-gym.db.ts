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

export interface LoginPayload {
  username: string;
  password: string;
  targetRole: 'admin' | 'member';
}

export interface LoginApiResult {
  success: boolean;
  message: string;
  role?: 'admin' | 'member';
}

const CREDENTIALS = [
  { username: 'admin', password: '123', role: 'admin' as const },
  { username: 'member', password: '123', role: 'member' as const },
];

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'monthly-basic',
    name: 'الباقة الشهرية الأساسية',
    nameEn: 'Monthly Basic',
    period: 'شهرياً',
    price: 650,
    currency: 'ج.م',
    features: [
      'الدخول لصالة الأجهزة والحديد طوال الشهر',
      'خزانة شخصية وغرف تغيير ملابس مجهزة',
      'جلسة تقييم بدني وقياس InBody أولى مجاناً',
      'متاح طوال أوقات العمل الرسمية',
    ],
  },
  {
    id: 'quarterly-pro',
    name: 'باقة اللياقة 3 أشهر',
    nameEn: '3-Month Pro Fitness',
    period: 'لكل 3 أشهر',
    price: 1650,
    currency: 'ج.م',
    isPopular: true,
    badge: 'الأكثر طلباً ⭐',
    features: [
      'جميع مزايا الباقة الأساسية',
      'دخول مجاني إلى 6 حصص جماعية (زومبا / يوجا)',
      'متابعة شهرية لقياسات InBody مع المدرب',
      'خطة تغذية استرشادية مخصصة',
      'إمكانية تجميد الاشتراك لمدة 10 أيام',
    ],
  },
  {
    id: 'annual-vip',
    name: 'باقة VIP السنوية الشاملة',
    nameEn: 'Annual VIP All-Access',
    period: 'سنوياً',
    price: 4900,
    currency: 'ج.م',
    badge: 'توفير 40% 💎',
    features: [
      'دخول غير محدود لجميع الفروع على مدار 24/7',
      'دخول مجاني لكافة الحصص الجماعية والكروس فيت',
      '12 جلسة تدريب شخصي (Private Coach PT)',
      'استخدام منطقة السبا، الساونا، والجاكوزي',
      'إمكانية تجميد الاشتراك حتى 45 يوماً',
      'دعوات مجانية للأصدقاء شهرياً',
    ],
  },
];

const EQUIPMENT: EquipmentItem[] = [
  {
    id: 'eq-cardio',
    name: 'منطقة الكارديو المتطورة (Matrix & Life Fitness)',
    category: 'كارديو وتنشيف',
    description:
      'أجهزة سير كهربائية، دراجات تفاعلية، وأجهزة إيلبتيكال بشاشات رقمية وتتبع معدل ضربات القلب.',
    icon: '🏃‍♂️',
    count: 28,
  },
  {
    id: 'eq-heavy',
    name: 'منطقة الأوزان الحرة والحديد (Hammer Strength)',
    category: 'كمال أجسام وتضخيم',
    description:
      'دمبلز من 2.5 كجم إلى 60 كجم، بارات أولمبية، كوابل متعددة الزوايا، ومقاعد رفع قابلة للتعديل.',
    icon: '🏋️‍♂️',
    count: 45,
  },
  {
    id: 'eq-functional',
    name: 'منصة التدريب الوظيفي والمقاومة (Functional Rig)',
    category: 'لياقة وتحمل',
    description:
      'حبال تسلق، أكياس رملية (Kettlebells)، صناديق قفز (Plyo Boxes)، وحبال قوة (Battle Ropes).',
    icon: '🧗‍♂️',
    count: 20,
  },
  {
    id: 'eq-recovery',
    name: 'منطقة الاستشفاء والساونا والجاكوزي (Recovery Spa)',
    category: 'استشفاء عضلي',
    description:
      'غرف ساونا خشبية فنلندية، حمام بخار تركي، وجاكوزي ساخن وبارد لتسريع التعافي العضلي.',
    icon: '🧖‍♂️',
    count: 4,
  },
];

const BRANCHES: GymBranch[] = [
  {
    id: 'br-main',
    name: 'الفرع الرئيسي - التجمع الخامس',
    location: 'شارع التسعين الشمالي، مول النخبة، الدور الثاني',
    phone: '+20 100 123 4567',
    hours: 'مفتوح 24 ساعة / طوال أيام الأسبوع',
    is24Hours: true,
  },
  {
    id: 'br-sheikh-zayed',
    name: 'فرع الشيخ زايد - بيفرلي هيلز',
    location: 'المحور المركزي، سنترال بارك بلازا',
    phone: '+20 102 987 6543',
    hours: '6:00 صباحاً - 1:00 بعد منتصف الليل',
    is24Hours: false,
  },
  {
    id: 'br-maadi',
    name: 'فرع المعادي - دجلة',
    location: 'شارع 206، متفرع من النصر، المعادي الجديدة',
    phone: '+20 114 555 8899',
    hours: '6:00 صباحاً - 12:00 منتصف الليل',
    is24Hours: false,
  },
];

const CURRENT_MEMBER: CurrentMember = {
  id: 'MEM-2026-089',
  name: 'أحمد محمود التميمي',
  trainerName: 'ك. كريم عثمان (Certified Master Coach)',
  avatarBg: '#2563eb',
  email: 'ahmed.tamimi@example.com',
  joinDate: '2026-01-10',
};

const MEMBER_METRICS: MemberMetrics = {
  currentWeight: 78.5,
  height: 178,
  targetWeight: 73.0,
  bmi: 24.8,
  bmiCategory: 'وزن مثالي (Healthy BMI)',
};

const MEMBER_SUBSCRIPTION: MemberSubscription = {
  planName: 'باقة اللياقة 3 أشهر (3-Month Pro Fitness)',
  startDate: '2026-07-01',
  endDate: '2026-10-01',
  totalDays: 92,
  daysRemaining: 24,
  progressPercent: 74,
  status: 'Active',
};

const MEMBER_SCHEDULE: WorkoutDay[] = [
  {
    day: 'السبت (Day 1)',
    targetMuscle: 'تمارين الصدر والترايسبس (Chest & Triceps)',
    exercisesCount: 6,
    duration: '60 دقيقة',
    completed: true,
  },
  {
    day: 'الاثنين (Day 2)',
    targetMuscle: 'تمارين الظهر والبايسبس (Back & Biceps)',
    exercisesCount: 6,
    duration: '65 دقيقة',
    completed: true,
  },
  {
    day: 'الأربعاء (Day 3)',
    targetMuscle: 'تمارين الأرجل والسمانة (Legs & Calves)',
    exercisesCount: 7,
    duration: '70 دقيقة',
    completed: false,
  },
  {
    day: 'الخميس (Day 4)',
    targetMuscle: 'الأكتاف والبطن والكارديو (Shoulders & HIIT)',
    exercisesCount: 5,
    duration: '50 دقيقة',
    completed: false,
  },
];

const NUTRITION_PLAN: NutritionOverview = {
  dailyCalories: 2350,
  proteinGrams: 165,
  carbsGrams: 230,
  fatsGrams: 65,
  waterLiters: 3.5,
};

const INITIAL_SESSIONS: SingleSession[] = [
  {
    id: 'cls-yoga',
    title: 'يوجا واسترخاء (Hatha Yoga)',
    category: 'استرخاء ومرونة',
    price: 150,
    currency: 'ج.م',
    duration: '60 دقيقة',
    schedule: 'يومياً 9:00 ص - 10:00 ص',
    coach: 'ك. سلمى نور',
    icon: '🧘‍♀️',
    spotsLeft: 4,
  },
  {
    id: 'cls-zumba',
    title: 'زومبا وحرق دهون (Zumba Dance)',
    category: 'كارديو ورشاقة',
    price: 180,
    currency: 'ج.م',
    duration: '50 دقيقة',
    schedule: 'السبت، الاثنين، الأربعاء 6:00 م',
    coach: 'ك. ياسمين عادل',
    icon: '💃',
    spotsLeft: 6,
  },
  {
    id: 'cls-crossfit',
    title: 'كروس فيت تحدي القوة (CrossFit WOD)',
    category: 'قوة وتحمل عالي',
    price: 220,
    currency: 'ج.م',
    duration: '75 دقيقة',
    schedule: 'الأحد، الثلاثاء، الخميس 7:30 م',
    coach: 'ك. طارق الجارحي',
    icon: '⚡',
    spotsLeft: 3,
  },
  {
    id: 'cls-pilates',
    title: 'بيلاتس وتقوية عضلات الجذع (Core Pilates)',
    category: 'توازن وقوة داخلية',
    price: 170,
    currency: 'ج.م',
    duration: '55 دقيقة',
    schedule: 'يومياً 5:00 م - 6:00 م',
    coach: 'ك. ندى إبراهيم',
    icon: '🤸‍♀️',
    spotsLeft: 5,
  },
];

const INITIAL_ADMIN_MEMBERS: AdminMember[] = [
  { id: 1, name: 'أحمد محمود التميمي', email: 'ahmed.tamimi@example.com', phone: '01001234567', plan: 'باقة اللياقة 3 أشهر (Pro)', status: 'Active', endDate: '2026-10-01', avatarBg: '#2563eb' },
  { id: 2, name: 'سارة خالد المنصوري', email: 'sara.mansoori@example.com', phone: '01123456789', plan: 'باقة VIP السنوية الشاملة', status: 'Active', endDate: '2026-12-31', avatarBg: '#10b981' },
  { id: 3, name: 'طارق عبد الله الزهراني', email: 'tariq.zahrani@example.com', phone: '01234567890', plan: 'الباقة الشهرية الأساسية', status: 'Expired', endDate: '2026-09-01', avatarBg: '#ef4444' },
  { id: 4, name: 'منى حسين فهمي', email: 'mona.fahmy@example.com', phone: '01099887766', plan: 'باقة اللياقة 3 أشهر (Pro)', status: 'Active', endDate: '2026-09-26', avatarBg: '#f59e0b' },
  { id: 5, name: 'خالد يوسف الألفي', email: 'khaled.alfi@example.com', phone: '01155443322', plan: 'الباقة الشهرية الأساسية', status: 'Active', endDate: '2026-10-10', avatarBg: '#6366f1' },
];

const INITIAL_ADMIN_STATS: AdminStats = {
  totalMembers: 120,
  activeSubscriptions: 95,
  expiringSoon: 10,
  monthlyRevenue: '148,500 ج.م',
};

/**
 * In-memory gym database used by the mock HTTP interceptor.
 * Replace this layer with a real backend without changing GymService / AuthService.
 */
export class MockGymDatabase {
  private sessions = structuredClone(INITIAL_SESSIONS);
  private members = structuredClone(INITIAL_ADMIN_MEMBERS);
  private adminStats: AdminStats = { ...INITIAL_ADMIN_STATS };

  login(payload: LoginPayload): LoginApiResult {
    const username = payload.username.trim().toLowerCase();
    const password = payload.password.trim();

    if (!username || !password) {
      return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور.' };
    }

    const match = CREDENTIALS.find(
      (c) => c.username === username && c.password === password && c.role === payload.targetRole
    );

    if (!match) {
      return {
        success: false,
        message: 'بيانات الدخول غير صحيحة! يرجى التحقق من اسم المستخدم وكلمة المرور.',
      };
    }

    return {
      success: true,
      role: match.role,
      message:
        match.role === 'admin'
          ? 'مرحباً بك يا مدير النظام (Admin)! تم تسجيل الدخول بنجاح.'
          : 'أهلاً بك يا كابتن أحمد! تم الدخول إلى بوابة المشترك بنجاح.',
    };
  }

  getPricingPlans(): PricingPlan[] {
    return PRICING_PLANS;
  }

  getSingleClasses(): SingleSession[] {
    return this.sessions.map((s) => ({ ...s }));
  }

  getEquipment(): EquipmentItem[] {
    return EQUIPMENT;
  }

  getBranches(): GymBranch[] {
    return BRANCHES;
  }

  getCurrentMember(): CurrentMember {
    return CURRENT_MEMBER;
  }

  getMemberMetrics(): MemberMetrics {
    return MEMBER_METRICS;
  }

  getMemberSubscription(): MemberSubscription {
    return MEMBER_SUBSCRIPTION;
  }

  getMemberSchedule(): WorkoutDay[] {
    return MEMBER_SCHEDULE;
  }

  getNutritionPlan(): NutritionOverview {
    return NUTRITION_PLAN;
  }

  getAdminStats(): AdminStats {
    return { ...this.adminStats };
  }

  getAdminMembers(): AdminMember[] {
    return this.members.map((m) => ({ ...m }));
  }

  toggleMemberStatus(memberId: number): AdminMember | null {
    const member = this.members.find((m) => m.id === memberId);
    if (!member) return null;

    member.status = member.status === 'Active' ? 'Expired' : 'Active';
    if (member.status === 'Active') {
      this.adminStats.activeSubscriptions++;
    } else {
      this.adminStats.activeSubscriptions = Math.max(0, this.adminStats.activeSubscriptions - 1);
    }
    return { ...member };
  }

  renewMember(memberId: number): AdminMember | null {
    const member = this.members.find((m) => m.id === memberId);
    if (!member) return null;

    member.status = 'Active';
    member.endDate = '2027-03-31';
    return { ...member };
  }

  bookSession(sessionId: string): SingleSession | null {
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return null;

    if (session.spotsLeft > 0) {
      session.spotsLeft--;
    }
    return { ...session };
  }
}

export const mockGymDb = new MockGymDatabase();
