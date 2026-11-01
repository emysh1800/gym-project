# 🏋️‍♂️ Gym Backend REST API (Production-Ready)

سيرفر الـ REST API الاحترافي الخاص بنظام الجيم (`GymClient`) متوافق مع أعلى معايير أمان وهندسة البرمجيات.

---

## 🌟 الميزات والمواصفات المطبقة (Key Features)

### 1. معايير أفعال الـ HTTP وتنسيق REST (REST Verbs & Standards)
- **`PATCH` للتحديث الجزئي للحالة**:
  - `PATCH /api/admin/members/:id/toggle` (تبديل الحالة بين `Active` و `Expired`).
  - `PATCH /api/admin/members/:id/renew` (تجديد الاشتراك لعام قادم).
- **`DELETE` للحذف النهائي**:
  - `DELETE /api/admin/members/:id` (حذف العضو نهائياً واسترجاع كائن العضو المحذوف).
- **أكواد الحالة القياسية (Standard HTTP Status Codes)**:
  - `200 OK`: للطلبات الناجحة والاسترجاع والتعديل الجزئي (`PATCH`).
  - `201 Created`: عند إضافة عضو جديد بنجاح (`POST /api/admin/members`).
  - `400 Bad Request`: عند فشل التحقق من صحة المدخلات بـ Zod مع تفاصيل الحقول الخاطئة.
  - `401 Unauthorized`: عند محاولة الدخول لمسارات محمية دون توكن JWT صالح.
  - `403 Forbidden`: عند محاولة مستخدم برتبة `member` الوصول لمسارات `admin`.
  - `404 Not Found`: عند طلب مورد أو معرف غير موجود في قاعدة البيانات.

---

### 2. المصادقة والتحكم بالصلاحيات (JWT & RBAC Middleware)
- **توليد JWT Token**:
  - يتم إنشاء توكن موقع ومحمي بمدة صلاحية 24 ساعة عند تسجيل الدخول الناجح في `/api/auth/login`.
- **`authMiddleware`**:
  - يتحقق من وجود وصحة التوكن في رأس الطلب `Authorization: Bearer <token>`.
- **`requireRole('admin')` (RBAC)**:
  - يقيد مسارات لوحة الإدارة `/api/admin/*` حصرياً للمديرين، ويرفض وصول المشتركين برمز `403 Forbidden`.

---

### 3. التحقق الصارم من المدخلات (Zod Input Validation)
- فحص الحقول المدخلة قبل الوصول إلى قاعدة البيانات `database.json`:
  - `POST /api/auth/login`: اسم المستخدم (حرفين على الأقل)، كلمة المرور (3 أحرف على الأقل)، نوع الحساب (`admin` أو `member`).
  - `POST /api/admin/members`: الاسم الكامل (3 أحرف على الأقل)، البريد الإلكتروني (صيغة Email صالحة)، رقم الهاتف (رقم مصري صحيح 11 رقم يبدأ بـ 010/011/012/015)، الباقة.
  - `POST /api/sessions/:id/book`: الملاحظات والمقاعد الشاغرة.

---

### 4. الفلترة المتقدمة والترقيم والبحث (Query Parameters & Pagination)
- مسار `GET /api/admin/members` يدعم:
  - `?search=ahmed`: بحث نصي فوري في الاسم، الإيميل، ورقم الهاتف.
  - `?status=Active` أو `?status=Expired`: تصفية حسب حالة الاشتراك.
  - `?plan=VIP`: تصفية حسب اسم الباقة.
  - `?page=1&limit=10`: ترقيم الصفحات مع بيانات وصفية كاملة:
    ```json
    {
      "data": [...],
      "pagination": {
        "total": 5,
        "page": 1,
        "limit": 10,
        "totalPages": 1
      }
    }
    ```

---

## 🚀 كيفية التشغيل والاختبار

```bash
# تشغيل السيرفر
npm run server

# أو تشغيل السيرفر في وضع المراقبة (Hot-reload)
npm run server:dev

# تشغيل حزمة الاختبارات الآلية (10 اختبارات تغطي كافة المتطلبات)
node server/test-api.js
```

افتح المتصفح للاستمتاع بـ **API Explorer التفاعلي الكامل**:
👉 **[http://localhost:3000](http://localhost:3000)**
