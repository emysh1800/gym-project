# 🏋️‍♂️ نادي اللياقة البدنية | Gym Management & Booking Platform

<p align="center">
  <img src="https://img.shields.io/badge/Angular-22.1-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular 22" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/RTL-Arabic_First-0ea5e9?style=for-the-badge" alt="RTL Arabic First" />
  <img src="https://img.shields.io/badge/Tests-Passing_9%2F9-10b981?style=for-the-badge" alt="Tests" />
  <img src="https://img.shields.io/badge/Architecture-Offline--First_Mock_Fallback-8b5cf6?style=for-the-badge" alt="Offline-First" />
</p>

<p align="center">
  <b>منصة ويب متكاملة وحديثة لإدارة الصالات الرياضية والنوادي الصحية، وحجز الحصص التدريبية، ومتابعة اشتراكات وبيانات المشتركين.</b><br />
  A modern, production-ready Full-Stack Gym Management and Class Booking web application with smart role auto-detection, interactive member portal, and administrative dashboard.
</p>

---

## 🌟 أبرز مميزات المشروع (Key Highlights)

### 1. 🚀 واجهة هبوط تسويقية متكاملة (Public Landing Page)
* **عرض الباقات والاشتراكات (Pricing Plans)**: باقات شهرية، ربع سنوية، وسنوية مع مزايا واضحة وشارات الأكثر طلباً.
* **الحصص المنفردة (Drop-in Single Classes)**: تصفح الحصص (Yoga, CrossFit, HIIT, Spinning, BodyBuilding) مع بيان المدرب، الموعد، والتكلفة، والعدد المتبقي من المقاعد بدقة ولحظياً.
* **استعراض التجهيزات والمعدات (Equipment Showcase)**: أجهزة عالمية مصنفة حسب مجموعات العضلات.
* **شبكة الفروع ومواعيد العمل (Branches & Schedule)**: معلومات الاتصال والمواقع وساعات العمل لكل فرع.
* **نموذج التواصل السريع (Contact Form)** مع تأكيدات إرسال فورية.

### 2. 🎯 تجربة حجز حصص ذكية وسلسة (Smart Session Booking UX)
* **حجز فوري وتحديث لحظي للمقاعد**: احتساب فوري للمقاعد المتبقية لكل حصة وتحديث الواجهة مباشرة.
* **الربط التلقائي بعد تسجيل الدخول (Seamless Post-Login Confirmation)**: إذا نقر زائر غير مسجل على "احجز الحصة"، يتم حفظ الحصة المعلقة، وفور تسجيل دخوله تفتح له مباشرة نافذة تأكيد الحجز المخصصة لتثبيت مقعده دون أي تشتيت.
* **إدارة الحجوزات (My Bookings)**: صفحة مخصصة للمشترك لاستعراض حجوزاته القادمة، مع إمكانية إلغاء الحجز واسترجاع المقعد فورياً للآخرين.

### 3. 🔐 تسجيل دخول موحد وتوجيه ذكي (Unified Auth & Auto Role Routing)
* زر دخول واحد في شريط التنقل (`🔐 تسجيل الدخول`) دون الحاجة لاختيار نوع الحساب مسبقاً.
* يقوم النظام تلقائياً بالتعرف على الصلاحية من خلال بيانات الاعتماد:
  - حساب المشترك ⬅️ يوجه إلى حسابه وحجوزاته (`/member-portal`).
  - حساب الأدمن ⬅️ يوجه إلى لوحة الإدارة الشاملة (`/admin-dashboard`).
* شريط تنقل ديناميكي ونظيف يظهر فقط الأزرار والروابط التي يحتاجها المستخدم المسجل مع زر خروج سريع.

### 4. 👤 بوابة المشترك (Interactive Member Portal)
* استعراض المقاييس البدنية الحيوية (BMI، الوزن، نسبة الدهون، السعرات اليومية).
* متابعة حالة الاشتراك الحالي، تاريخ الانتهاء، وعدد الأيام المتبقية مع شريط تقدم تفاعلي.
* جدول التمارين الأسبوعي وجدول الأنظمة الغذائية والسعرات والماكروز.

### 5. ⚙️ لوحة الإدارة المتكاملة (Admin Dashboard)
* إحصائيات عامة لحظية: عدد المشتركين النشطين، الاشتراكات المجمدة، الحضور اليومي، والإيرادات.
* إدارة المشتركين: بحث، تصفية حسب الباقة والحالة، تجميد أو تفعيل الاشتراك بضغطة زر، وتجديد الاشتراكات.

### 6. ⚡ هندسة معمارية هجينة بدون انقطاع (Offline-First & Hybrid API)
* مزودة بمحرك **Mock Database Interceptor** مدمج في الواجهة؛ في حالة تشغيل السيرفر محلياً يتم الربط بالـ REST API، وفي حالة الرفع كـ Static Web App أو انقطاع السيرفر، يتحول التطبيق تلقائياً وبسلاسة إلى قاعدة البيانات المحلية المتزامنة في المتصفح لضمان عدم توقف أي ميزة أو عرض.

---

## 🔑 بيانات الدخول التجريبية (Demo Credentials)

يمكنك تجربة النظام بكافة صلاحياته عبر الحسابات التالية:

| الدور (Role) | اسم المستخدم (Username) | كلمة المرور (Password) | الصلاحيات والواجهة |
| :--- | :--- | :--- | :--- |
| **👑 مدير النظام (Admin)** | `manager` أو `admin` | `gym@2026` أو `123` | الوصول للوحة الإدارة، إحصائيات الأعضاء، تجميد وتفعيل وتجديد الاشتراكات |
| **🏋️ المشترك (Member)** | `captain.ahmed` أو `member` | `gym@2026` أو `123` | حجز وإلغاء الحصص، متابعة القياسات والاشتراك، وجدول التغذية والتمارين |

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

### الواجهة الأمامية (Frontend)
- **Framework**: Angular 22 (Standalone Components, Modern Signals, Control Flow `@if` / `@for`)
- **Language**: TypeScript 5.x
- **Styling**: Pure Modern CSS3 / Flexbox & CSS Grid / RTL-Ready Native Design (No bulky UI frameworks)
- **State & Reactivity**: RxJS, Signals, BehaviorSubjects
- **Testing**: Vitest & Angular Unit Testing Runner (9/9 automated test suites passing)

### الواجهة الخلفية وقواعد البيانات (Backend & Storage)
- **Runtime**: Node.js & Express.js
- **Validation**: Zod Schemas for bullet-proof request validation
- **Data Persistence**: JSON Database Store & In-Memory Fallback Client DB

---

## 🚀 التشغيل المحلي (Getting Started)

### المتطلبات المسبقة:
- [Node.js](https://nodejs.org/) (الإصدار 18 أو أحدث)
- npm (الإصدار 9 أو أحدث)

### خطوات التثبيت:

1. **استنساخ المستودع (Clone Repository):**
   ```bash
   git clone https://github.com/emysh1800/gym-project.git
   cd gym-project
   ```

2. **تثبيت الحزم والاعتماديات (Install Dependencies):**
   ```bash
   npm install
   ```

3. **تشغيل المشروع:**
   * **تشغيل الواجهة الأمامية فقط (Frontend Dev Server):**
     ```bash
     npm start
     # يعمل التطبيق على: http://localhost:4200/
     ```
   * **تشغيل السيرفر الخلفي (Backend Server - Optional):**
     ```bash
     npm run server
     # يعمل السيرفر على: http://localhost:3000/
     ```

4. **تشغيل الاختبارات الآلية (Run Tests):**
   ```bash
   npm test -- --watch=false
   ```

5. **بناء نسخة الإنتاج (Production Build):**
   ```bash
   npm run build
   # يتم تخزين ملفات الإنتاج المحسنة في مجلد dist/GymClient
   ```

---

## 📁 هيكلية المشروع (Project Architecture)

```
GymClient/
├── src/
│   ├── app/
│   │   ├── core/                  # النواة: الخدمات، النماذج، ومحرك البيانات
│   │   │   ├── data/              # Mock Database & Initial Seeding
│   │   │   ├── interceptors/      # Mock API Interceptor & Network Fallback
│   │   │   ├── models/            # TypeScript Interfaces (Member, Plans, Bookings...)
│   │   │   └── services/          # AuthService, GymService, NotificationService
│   │   ├── features/              # الصفحات الرئيسية
│   │   │   ├── home/              # Landing Page, Plans, Equipment, Branches
│   │   │   ├── member-portal/     # Member Dashboard, Metrics, Nutrition, Workout
│   │   │   ├── admin-dashboard/   # Admin Stats, Member Management, Renewals
│   │   │   └── my-bookings/       # Booked Classes & Cancel Management
│   │   ├── shared/                # المكونات المشتركة
│   │   │   ├── navbar/            # Responsive RTL Navbar with unified auth
│   │   │   ├── login-modal/       # Unified Login Modal
│   │   │   ├── book-class-modal/  # Smart Class Booking & Confirmation Dialog
│   │   │   ├── contact-form/      # Contact Us Section Form
│   │   │   └── toast/             # Global Toast Notifications
│   │   ├── app.component.ts       # Main App Shell
│   │   └── app.routes.ts          # Angular Router Definition
│   └── styles/
│       └── gym-ui.css             # Comprehensive Modern Dark/Emerald Theme Design
├── server/                        # Express.js REST API Server
│   ├── server.js                  # API Endpoints & Auth Handlers
│   └── database.json              # Persistent JSON Data Store
└── angular.json                   # Angular Workspace Build Configuration
```

---

## 👩‍💻 المطورة (Developer)

تم تطوير وتصميم هذا المشروع بكل حب واحترافية بواسطة:
* **GitHub**: [@emysh1800](https://github.com/emysh1800)
* **Repository**: [gym-project](https://github.com/emysh1800/gym-project)

> 💡 **ملاحظة للمهتمين وأصحاب الأعمال**: المشروع قابل للتخصيص بالكامل (White-Label) ليلائم هوية أي صالة رياضية أو نادي رياضي مع إمكانية ربط بوابات الدفع الإلكتروني (Paymob / Stripe / Fawry) وتصدير التقارير.
