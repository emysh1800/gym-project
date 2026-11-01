const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'gym-super-secret-jwt-key-2026';
const JWT_EXPIRES_IN = '24h';

const DB_FILE = path.join(__dirname, 'database.json');
const INITIAL_DATA_FILE = path.join(__dirname, 'initial-data.json');

// -------------------------------------------------------------
// Middlewares
// -------------------------------------------------------------
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// -------------------------------------------------------------
// Database Persistence Helpers
// -------------------------------------------------------------
function loadDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialData = fs.readFileSync(INITIAL_DATA_FILE, 'utf-8');
      fs.writeFileSync(DB_FILE, initialData, 'utf-8');
      console.log('✅ Initialized database.json from initial data template.');
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('❌ Error loading database:', err);
    return null;
  }
}

let db = loadDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('❌ Error saving database:', err);
    return false;
  }
}

// -------------------------------------------------------------
// Zod Validation Schemas
// -------------------------------------------------------------
const loginSchema = z.object({
  username: z.string({ required_error: 'اسم المستخدم مطلوب' })
    .trim()
    .min(2, 'اسم المستخدم يجب أن يتكون من حرفين على الأقل'),
  password: z.string({ required_error: 'كلمة المرور مطلوبة' })
    .min(3, 'كلمة المرور يجب أن تتكون من 3 أحرف على الأقل'),
  targetRole: z.enum(['admin', 'member'], {
    errorMap: () => ({ message: 'يجب تحديد نوع الحساب: admin أو member' })
  })
});

const bookSessionSchema = z.object({
  memberId: z.string().optional(),
  notes: z.string().max(200, 'الملاحظات يجب ألا تتجاوز 200 حرف').optional()
}).optional();

const createMemberSchema = z.object({
  name: z.string({ required_error: 'اسم المشترك مطلوب' })
    .trim()
    .min(3, 'اسم المشترك يجب ألا يقل عن 3 أحرف'),
  email: z.string({ required_error: 'البريد الإلكتروني مطلوب' })
    .trim()
    .email('صيغة البريد الإلكتروني غير صحيحة (مثال: user@example.com)'),
  phone: z.string({ required_error: 'رقم الهاتف مطلوب' })
    .trim()
    .regex(/^01[0125][0-9]{8}$/, 'رقم الهاتف غير صالح؛ يجب أن يكون رقماً مصرياً مكوناً من 11 رقماً (مثال: 01012345678)'),
  plan: z.string({ required_error: 'يرجى اختيار باقة الاشتراك' })
    .min(2, 'اسم الباقة غير صالح'),
  status: z.enum(['Active', 'Expired']).default('Active'),
  endDate: z.string().optional(),
  avatarBg: z.string().optional()
});

// Validation Middleware Generator
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      const formattedErrors = issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'خطأ في التحقق من صحة البيانات المدخلة (Validation Error)',
        errors: formattedErrors
      });
    }
    req.body = result.data;
    next();
  };
}

// -------------------------------------------------------------
// Authentication & RBAC Middlewares
// -------------------------------------------------------------
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'غير مصرح بالدخول: يرجى إرسال التوكن (Missing or invalid Authorization header: Bearer <token>)'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'التوكن غير صالح أو منتهي الصلاحية (Invalid or expired JWT token)',
      error: err.message
    });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: `ممنوع الوصول: هذه العملية تتطلب صلاحية [${allowedRoles.join(', ')}] (Forbidden: Role '${req.user ? req.user.role : 'none'}' does not have access)`
      });
    }
    next();
  };
}

// -------------------------------------------------------------
// Interactive Web UI Dashboard (Fully Clickable & Testable with JWT)
// -------------------------------------------------------------
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gym REST API - لوحة التحكم والمطوّرين (Production Ready)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(26, 34, 52, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --primary: #38bdf8;
      --primary-hover: #0ea5e9;
      --success: #22c55e;
      --warning: #f59e0b;
      --danger: #ef4444;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Cairo', system-ui, sans-serif;
      background: radial-gradient(circle at top right, #1e1b4b, #090d16 50%);
      color: var(--text);
      min-height: 100vh;
      padding: 2rem 1rem;
      line-height: 1.6;
    }
    .container { max-width: 1050px; margin: 0 auto; }
    header {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(12px);
      padding: 1.75rem;
      border-radius: 16px;
      margin-bottom: 1.5rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .header-title h1 {
      font-size: 1.8rem;
      font-weight: 900;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .header-title p { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.3rem; }
    .status-badge {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.3);
      padding: 0.35rem 0.9rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }

    /* JWT Bar */
    .jwt-bar {
      margin-top: 1.2rem;
      padding: 1rem 1.25rem;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.8rem;
    }
    .jwt-status {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.9rem;
    }
    .jwt-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-weight: bold;
    }
    .jwt-pill.admin { background: #3b82f6; color: white; }
    .jwt-pill.member { background: #10b981; color: white; }
    .jwt-pill.none { background: #64748b; color: white; }

    .quick-actions {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
      margin-bottom: 2rem;
    }
    .btn {
      font-family: inherit;
      font-weight: 700;
      font-size: 0.9rem;
      padding: 0.55rem 1.1rem;
      border-radius: 10px;
      border: 1px solid transparent;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .btn:hover { transform: translateY(-2px); }
    .btn:active { transform: translateY(0); }
    .btn-primary { background: linear-gradient(135deg, #0284c7, #2563eb); color: #fff; }
    .btn-primary:hover { background: linear-gradient(135deg, #0369a1, #1d4ed8); }
    .btn-success { background: linear-gradient(135deg, #16a34a, #059669); color: #fff; }
    .btn-warning { background: linear-gradient(135deg, #d97706, #b45309); color: #fff; }
    .btn-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(239, 68, 68, 0.3); }
    .btn-danger:hover { background: rgba(239, 68, 68, 0.25); color: #fff; }
    .btn-outline { background: rgba(255, 255, 255, 0.05); color: #cbd5e1; border-color: var(--card-border); }
    .btn-outline:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

    .category-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 1.8rem 0 0.9rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #93c5fd;
    }

    .api-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      padding: 1.1rem 1.3rem;
      margin-bottom: 0.9rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .api-card:hover {
      border-color: rgba(56, 189, 248, 0.35);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    .card-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.8rem;
    }
    .endpoint-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .method-tag {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      letter-spacing: 0.5px;
    }
    .method-get { background: rgba(14, 165, 233, 0.2); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.4); }
    .method-post { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); }
    .method-patch { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
    .method-delete { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }

    .auth-badge {
      font-size: 0.72rem;
      font-weight: bold;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      background: rgba(168, 85, 247, 0.2);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.35);
    }

    .endpoint-link {
      font-family: 'JetBrains Mono', monospace;
      direction: ltr;
      font-size: 0.95rem;
      font-weight: 600;
      color: #fde047;
      text-decoration: none;
      transition: color 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .endpoint-link:hover { color: #fef08a; text-decoration: underline; }
    .endpoint-desc { color: var(--text-muted); font-size: 0.9rem; }
    .card-actions { display: flex; align-items: center; gap: 0.5rem; }

    /* Interactive Request & Response Panel */
    .test-panel {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      display: none;
    }
    .test-panel.active { display: block; }
    .panel-form {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      margin-bottom: 0.8rem;
    }
    .form-row {
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      flex: 1;
      min-width: 180px;
    }
    .form-label { font-size: 0.85rem; color: #cbd5e1; font-weight: 600; }
    .form-input, .form-textarea, .form-select {
      background: #0b1120;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      color: #fff;
      padding: 0.55rem 0.8rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      direction: ltr;
    }
    .form-input:focus, .form-textarea:focus, .form-select:focus {
      outline: none;
      border-color: var(--primary);
    }
    .response-box {
      background: #050811;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 0.9rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      direction: ltr;
      text-align: left;
      max-height: 280px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
      color: #7dd3fc;
      margin-top: 0.6rem;
    }
    .response-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.4rem;
    }
    .status-pill {
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
    }
    .status-2xx { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
    .status-4xx, .status-5xx { background: rgba(239, 68, 68, 0.2); color: #f87171; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-top">
        <div class="header-title">
          <h1>🏋️‍♂️ Gym Production REST API Explorer</h1>
          <p>سيرفر REST API بمواصفات الإنتاج الكاملة: JWT, RBAC, Zod Validation, Advanced Filters, PATCH/DELETE</p>
        </div>
        <div>
          <span class="status-badge">
            <span class="status-dot"></span>
            متصل ومباشر (Port ${PORT})
          </span>
        </div>
      </div>

      <!-- JWT Live Session Bar -->
      <div class="jwt-bar">
        <div class="jwt-status">
          <span>حالة المصادقة الحالية:</span>
          <span id="current-auth-badge" class="jwt-pill none">زائر (بدون Token)</span>
          <span id="current-user-name" style="color:#94a3b8; font-size:0.85rem;"></span>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn btn-primary" style="font-size:0.8rem; padding:0.35rem 0.75rem;" onclick="quickLogin('admin', '123', 'admin')">🔑 تسجيل كـ Admin</button>
          <button class="btn btn-success" style="font-size:0.8rem; padding:0.35rem 0.75rem;" onclick="quickLogin('member', '123', 'member')">👤 تسجيل كـ Member</button>
          <button class="btn btn-danger" style="font-size:0.8rem; padding:0.35rem 0.75rem;" onclick="clearToken()">🚪 مسح التوكن</button>
        </div>
      </div>
    </header>

    <div class="quick-actions">
      <a href="http://localhost:4200" target="_blank" class="btn btn-primary">
        🌐 فتح موقع الجيم (Angular Frontend)
      </a>
      <a href="/api" target="_blank" class="btn btn-outline">
        📋 عرض ملخص الـ Endpoints (JSON)
      </a>
      <a href="/api/export/backup" target="_blank" class="btn btn-outline">
        💾 تحميل نسخة من قاعدة البيانات
      </a>
      <button onclick="resetDatabase()" class="btn btn-danger">
        🔄 استعادة البيانات الافتراضية
      </button>
    </div>

    <!-- 1. Authentication -->
    <div class="category-title">🔐 المصادقة وتوثيق الدخول (JWT Authentication & Zod Validation)</div>

    <!-- POST /api/auth/login -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-post">POST</span>
          <a class="endpoint-link" href="#" onclick="togglePanel('p-login'); return false;">/api/auth/login</a>
          <span class="endpoint-desc">تسجيل الدخول، التحقق بـ Zod، وتوليد JWT Token آمن لمدة 24 ساعة</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-success" onclick="togglePanel('p-login')">⚡ جرب الآن</button>
        </div>
      </div>
      <div class="test-panel" id="p-login">
        <div class="panel-form">
          <div style="display:flex; gap:0.5rem; margin-bottom: 0.5rem;">
            <button class="btn btn-outline" style="font-size:0.8rem; padding:0.3rem 0.7rem;" onclick="fillLogin('admin', '123', 'admin')">تعبئة كـ Admin</button>
            <button class="btn btn-outline" style="font-size:0.8rem; padding:0.3rem 0.7rem;" onclick="fillLogin('member', '123', 'member')">تعبئة كـ Member</button>
            <button class="btn btn-outline" style="font-size:0.8rem; padding:0.3rem 0.7rem;" onclick="fillLogin('x', '1', 'admin')">تجربة خطأ Validation</button>
          </div>
          <div class="form-group">
            <label class="form-label">اسم المستخدم (Username):</label>
            <input type="text" id="login-user" class="form-input" value="admin">
          </div>
          <div class="form-group">
            <label class="form-label">كلمة المرور (Password):</label>
            <input type="password" id="login-pass" class="form-input" value="123">
          </div>
          <div class="form-group">
            <label class="form-label">نوع الحساب (Role):</label>
            <select id="login-role" class="form-select">
              <option value="admin">مدير النظام (Admin)</option>
              <option value="member">مشترك (Member)</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="sendLogin()">🚀 إرسال طلب تسجيل الدخول والحصول على JWT</button>
        </div>
        <div id="res-login" style="display:none;">
          <div class="response-header">
            <span>الاستجابة (Response):</span>
            <span id="badge-login" class="status-pill status-2xx"></span>
          </div>
          <div id="json-login" class="response-box"></div>
        </div>
      </div>
    </div>

    <!-- 2. Public Gym Data -->
    <div class="category-title">🌐 البيانات العامة (Public Endpoints)</div>

    <!-- GET /api/pricing-plans -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-get">GET</span>
          <a class="endpoint-link" href="/api/pricing-plans" target="_blank">/api/pricing-plans ↗</a>
          <span class="endpoint-desc">باقات وأسعار الاشتراكات</span>
        </div>
        <div class="card-actions">
          <a class="btn btn-outline" href="/api/pricing-plans" target="_blank">فتح JSON</a>
          <button class="btn btn-primary" onclick="fetchEndpoint('GET', '/api/pricing-plans', null, 'p-pricing')">⚡ جرب الآن</button>
        </div>
      </div>
      <div class="test-panel" id="p-pricing">
        <div id="res-pricing">
          <div class="response-header">
            <span>الاستجابة (Response):</span>
            <span id="badge-pricing" class="status-pill status-2xx"></span>
          </div>
          <div id="json-pricing" class="response-box"></div>
        </div>
      </div>
    </div>

    <!-- GET /api/single-classes -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-get">GET</span>
          <a class="endpoint-link" href="/api/single-classes" target="_blank">/api/single-classes ↗</a>
          <span class="endpoint-desc">الحصص الفردية والمقاعد الشاغرة</span>
        </div>
        <div class="card-actions">
          <a class="btn btn-outline" href="/api/single-classes" target="_blank">فتح JSON</a>
          <button class="btn btn-primary" onclick="fetchEndpoint('GET', '/api/single-classes', null, 'p-classes')">⚡ جرب الآن</button>
        </div>
      </div>
      <div class="test-panel" id="p-classes">
        <div id="res-classes">
          <div class="response-header">
            <span>الاستجابة (Response):</span>
            <span id="badge-classes" class="status-pill status-2xx"></span>
          </div>
          <div id="json-classes" class="response-box"></div>
        </div>
      </div>
    </div>

    <!-- GET /api/equipment -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-get">GET</span>
          <a class="endpoint-link" href="/api/equipment" target="_blank">/api/equipment ↗</a>
          <span class="endpoint-desc">أجهزة ومعدات صالة الحديد والكارديو</span>
        </div>
        <div class="card-actions">
          <a class="btn btn-outline" href="/api/equipment" target="_blank">فتح JSON</a>
          <button class="btn btn-primary" onclick="fetchEndpoint('GET', '/api/equipment', null, 'p-equipment')">⚡ جرب الآن</button>
        </div>
      </div>
      <div class="test-panel" id="p-equipment">
        <div id="res-equipment">
          <div class="response-header">
            <span>الاستجابة (Response):</span>
            <span id="badge-equipment" class="status-pill status-2xx"></span>
          </div>
          <div id="json-equipment" class="response-box"></div>
        </div>
      </div>
    </div>

    <!-- GET /api/branches -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-get">GET</span>
          <a class="endpoint-link" href="/api/branches" target="_blank">/api/branches ↗</a>
          <span class="endpoint-desc">عناوين الفروع وأوقات العمل وأرقام الهواتف</span>
        </div>
        <div class="card-actions">
          <a class="btn btn-outline" href="/api/branches" target="_blank">فتح JSON</a>
          <button class="btn btn-primary" onclick="fetchEndpoint('GET', '/api/branches', null, 'p-branches')">⚡ جرب الآن</button>
        </div>
      </div>
      <div class="test-panel" id="p-branches">
        <div id="res-branches">
          <div class="response-header">
            <span>الاستجابة (Response):</span>
            <span id="badge-branches" class="status-pill status-2xx"></span>
          </div>
          <div id="json-branches" class="response-box"></div>
        </div>
      </div>
    </div>

    <!-- 3. Member Portal (Protected by JWT) -->
    <div class="category-title">
      👤 بوابة المشترك (Member Portal)
      <span class="auth-badge">🔒 محمي بـ JWT (Member أو Admin)</span>
    </div>

    <!-- GET /api/member/current -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-get">GET</span>
          <span class="auth-badge">Bearer JWT</span>
          <a class="endpoint-link" href="#" onclick="fetchEndpoint('GET', '/api/member/current', null, 'p-member-curr'); return false;">/api/member/current</a>
          <span class="endpoint-desc">بيانات المشترك الحالي والمدرب المخصص</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-primary" onclick="fetchEndpoint('GET', '/api/member/current', null, 'p-member-curr')">⚡ جرب الآن</button>
        </div>
      </div>
      <div class="test-panel" id="p-member-curr">
        <div id="res-member-curr">
          <div class="response-header">
            <span>الاستجابة:</span>
            <span id="badge-member-curr" class="status-pill status-2xx"></span>
          </div>
          <div id="json-member-curr" class="response-box"></div>
        </div>
      </div>
    </div>

    <!-- GET /api/member/metrics -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-get">GET</span>
          <span class="auth-badge">Bearer JWT</span>
          <a class="endpoint-link" href="#" onclick="fetchEndpoint('GET', '/api/member/metrics', null, 'p-metrics'); return false;">/api/member/metrics</a>
          <span class="endpoint-desc">القياسات البدنية ومؤشر كتلة الجسم (BMI)</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-primary" onclick="fetchEndpoint('GET', '/api/member/metrics', null, 'p-metrics')">⚡ جرب الآن</button>
        </div>
      </div>
      <div class="test-panel" id="p-metrics">
        <div id="res-metrics">
          <div class="response-header">
            <span>الاستجابة:</span>
            <span id="badge-metrics" class="status-pill status-2xx"></span>
          </div>
          <div id="json-metrics" class="response-box"></div>
        </div>
      </div>
    </div>

    <!-- GET /api/member/subscription -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-get">GET</span>
          <span class="auth-badge">Bearer JWT</span>
          <a class="endpoint-link" href="#" onclick="fetchEndpoint('GET', '/api/member/subscription', null, 'p-subscription'); return false;">/api/member/subscription</a>
          <span class="endpoint-desc">تفاصيل الباقة والأيام المتبقية ونسبة الإنجاز</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-primary" onclick="fetchEndpoint('GET', '/api/member/subscription', null, 'p-subscription')">⚡ جرب الآن</button>
        </div>
      </div>
      <div class="test-panel" id="p-subscription">
        <div id="res-subscription">
          <div class="response-header">
            <span>الاستجابة:</span>
            <span id="badge-subscription" class="status-pill status-2xx"></span>
          </div>
          <div id="json-subscription" class="response-box"></div>
        </div>
      </div>
    </div>

    <!-- GET /api/member/schedule -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-get">GET</span>
          <span class="auth-badge">Bearer JWT</span>
          <a class="endpoint-link" href="#" onclick="fetchEndpoint('GET', '/api/member/schedule', null, 'p-schedule'); return false;">/api/member/schedule</a>
          <span class="endpoint-desc">جدول التمارين الأسبوعي والتمارين المكتملة</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-primary" onclick="fetchEndpoint('GET', '/api/member/schedule', null, 'p-schedule')">⚡ جرب الآن</button>
        </div>
      </div>
      <div class="test-panel" id="p-schedule">
        <div id="res-schedule">
          <div class="response-header">
            <span>الاستجابة:</span>
            <span id="badge-schedule" class="status-pill status-2xx"></span>
          </div>
          <div id="json-schedule" class="response-box"></div>
        </div>
      </div>
    </div>

    <!-- GET /api/member/nutrition -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-get">GET</span>
          <span class="auth-badge">Bearer JWT</span>
          <a class="endpoint-link" href="#" onclick="fetchEndpoint('GET', '/api/member/nutrition', null, 'p-nutrition'); return false;">/api/member/nutrition</a>
          <span class="endpoint-desc">خطة التغذية والبروتين والماء والسعرات اليومية</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-primary" onclick="fetchEndpoint('GET', '/api/member/nutrition', null, 'p-nutrition')">⚡ جرب الآن</button>
        </div>
      </div>
      <div class="test-panel" id="p-nutrition">
        <div id="res-nutrition">
          <div class="response-header">
            <span>الاستجابة:</span>
            <span id="badge-nutrition" class="status-pill status-2xx"></span>
          </div>
          <div id="json-nutrition" class="response-box"></div>
        </div>
      </div>
    </div>

    <!-- POST /api/sessions/:id/book -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-post">POST</span>
          <a class="endpoint-link" href="#" onclick="togglePanel('p-book'); return false;">/api/sessions/:id/book</a>
          <span class="endpoint-desc">حجز مقعد في حصة وتخفيض المقاعد في قاعدة البيانات مع فحص Zod</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-success" onclick="togglePanel('p-book')">⚡ جرب الحجز</button>
        </div>
      </div>
      <div class="test-panel" id="p-book">
        <div class="panel-form">
          <div class="form-group">
            <label class="form-label">اختر الحصة التدريبية:</label>
            <select id="book-session-id" class="form-select">
              <option value="cls-yoga">يوجا واسترخاء (cls-yoga)</option>
              <option value="cls-zumba">زومبا وحرق دهون (cls-zumba)</option>
              <option value="cls-crossfit">كروس فيت تحدي القوة (cls-crossfit)</option>
              <option value="cls-pilates">بيلاتس وتقوية الجذع (cls-pilates)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">ملاحظات إضافية (اختياري - مفحوص بـ Zod):</label>
            <input type="text" id="book-notes" class="form-input" placeholder="مثال: يرجى توفير منشفة">
          </div>
          <button class="btn btn-primary" onclick="bookSession()">🎟️ تأكيد الحجز (POST)</button>
        </div>
        <div id="res-book" style="display:none;">
          <div class="response-header">
            <span>الاستجابة:</span>
            <span id="badge-book" class="status-pill status-2xx"></span>
          </div>
          <div id="json-book" class="response-box"></div>
        </div>
      </div>
    </div>

    <!-- 4. Admin Management (RBAC: Admin Only) -->
    <div class="category-title">
      🛡️ لوحة إدارة الجيم (RBAC: Admin Role Only)
      <span class="auth-badge" style="background:rgba(239, 68, 68, 0.2); color:#f87171; border-color:rgba(239, 68, 68, 0.35);">🔒 مقتصر على مدير النظام (Admin)</span>
    </div>

    <!-- GET /api/admin/stats -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-get">GET</span>
          <span class="auth-badge">Admin Only</span>
          <a class="endpoint-link" href="#" onclick="fetchEndpoint('GET', '/api/admin/stats', null, 'p-admin-stats'); return false;">/api/admin/stats</a>
          <span class="endpoint-desc">إحصائيات الإدارة المحسوبة ديناميكياً</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-primary" onclick="fetchEndpoint('GET', '/api/admin/stats', null, 'p-admin-stats')">⚡ جرب الآن</button>
        </div>
      </div>
      <div class="test-panel" id="p-admin-stats">
        <div id="res-admin-stats">
          <div class="response-header">
            <span>الاستجابة:</span>
            <span id="badge-admin-stats" class="status-pill status-2xx"></span>
          </div>
          <div id="json-admin-stats" class="response-box"></div>
        </div>
      </div>
    </div>

    <!-- GET /api/admin/members (With Search, Filter, Pagination) -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-get">GET</span>
          <span class="auth-badge">Admin Only</span>
          <a class="endpoint-link" href="#" onclick="togglePanel('p-admin-members'); return false;">/api/admin/members</a>
          <span class="endpoint-desc">قائمة المشتركين مع دعم البحث والفلترة والـ Pagination بالكامل</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-primary" onclick="togglePanel('p-admin-members')">🔍 بحث وفلترة متقدمة</button>
        </div>
      </div>
      <div class="test-panel" id="p-admin-members">
        <div class="panel-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">بحث نصي (search):</label>
              <input type="text" id="query-search" class="form-input" placeholder="مثال: أحمد، ahmed، 010...">
            </div>
            <div class="form-group">
              <label class="form-label">الحالة (status):</label>
              <select id="query-status" class="form-select">
                <option value="">الكل (All Statuses)</option>
                <option value="Active">نشط (Active)</option>
                <option value="Expired">منتهي (Expired)</option>
              </select>
            </div>
            <div class="form-group" style="max-width: 120px;">
              <label class="form-label">الصفحة (page):</label>
              <input type="number" id="query-page" class="form-input" value="1" min="1">
            </div>
            <div class="form-group" style="max-width: 120px;">
              <label class="form-label">العدد (limit):</label>
              <input type="number" id="query-limit" class="form-input" value="10" min="1">
            </div>
          </div>
          <button class="btn btn-primary" onclick="fetchMembersWithFilters()">🔎 إرسال استعلام الفلترة والـ Pagination</button>
        </div>
        <div id="res-admin-members" style="display:none;">
          <div class="response-header">
            <span>الاستجابة:</span>
            <span id="badge-admin-members" class="status-pill status-2xx"></span>
          </div>
          <div id="json-admin-members" class="response-box"></div>
        </div>
      </div>
    </div>

    <!-- PATCH /api/admin/members/:id/toggle -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-patch">PATCH</span>
          <span class="auth-badge">Admin Only</span>
          <a class="endpoint-link" href="#" onclick="togglePanel('p-toggle'); return false;">/api/admin/members/:id/toggle</a>
          <span class="endpoint-desc">تعديل جزئي (PATCH): تبديل حالة المشترك بين (نشط ↔ منتهي)</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-warning" onclick="togglePanel('p-toggle')">⚡ جرب التبديل (PATCH)</button>
        </div>
      </div>
      <div class="test-panel" id="p-toggle">
        <div class="panel-form">
          <div class="form-group">
            <label class="form-label">رقم المشترك (Member ID):</label>
            <input type="number" id="toggle-id" class="form-input" value="1">
          </div>
          <button class="btn btn-warning" onclick="toggleMember()">🔄 إرسال طلب PATCH لتبديل الحالة</button>
        </div>
        <div id="res-toggle" style="display:none;">
          <div class="response-header">
            <span>الاستجابة:</span>
            <span id="badge-toggle" class="status-pill status-2xx"></span>
          </div>
          <div id="json-toggle" class="response-box"></div>
        </div>
      </div>
    </div>

    <!-- PATCH /api/admin/members/:id/renew -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-patch">PATCH</span>
          <span class="auth-badge">Admin Only</span>
          <a class="endpoint-link" href="#" onclick="togglePanel('p-renew'); return false;">/api/admin/members/:id/renew</a>
          <span class="endpoint-desc">تعديل جزئي (PATCH): تجديد اشتراك العضو لعام قادم</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-warning" onclick="togglePanel('p-renew')">⚡ جرب التجديد (PATCH)</button>
        </div>
      </div>
      <div class="test-panel" id="p-renew">
        <div class="panel-form">
          <div class="form-group">
            <label class="form-label">رقم المشترك (Member ID):</label>
            <input type="number" id="renew-id" class="form-input" value="3">
          </div>
          <button class="btn btn-warning" onclick="renewMember()">📅 تجديد الاشتراك (PATCH)</button>
        </div>
        <div id="res-renew" style="display:none;">
          <div class="response-header">
            <span>الاستجابة:</span>
            <span id="badge-renew" class="status-pill status-2xx"></span>
          </div>
          <div id="json-renew" class="response-box"></div>
        </div>
      </div>
    </div>

    <!-- POST /api/admin/members (Add Member with Zod Validation) -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-post">POST</span>
          <span class="auth-badge">Admin Only</span>
          <a class="endpoint-link" href="#" onclick="togglePanel('p-add'); return false;">/api/admin/members</a>
          <span class="endpoint-desc">إضافة عضو جديد مع التحقق الصارم بـ Zod ورقم هاتف مصري صالح (Status 201)</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-success" onclick="togglePanel('p-add')">⚡ إضافة مشترك</button>
        </div>
      </div>
      <div class="test-panel" id="p-add">
        <div class="panel-form">
          <div style="display:flex; gap:0.5rem; margin-bottom: 0.5rem;">
            <button class="btn btn-outline" style="font-size:0.8rem; padding:0.3rem 0.7rem;" onclick="fillMemberValid()">بيانات صحيحة</button>
            <button class="btn btn-outline" style="font-size:0.8rem; padding:0.3rem 0.7rem;" onclick="fillMemberInvalid()">بيانات خاطئة (لاختبار 400 Bad Request)</button>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">الاسم الكامل (min 3 chars):</label>
              <input type="text" id="add-name" class="form-input" value="محمد علي السعدي">
            </div>
            <div class="form-group">
              <label class="form-label">البريد الإلكتروني (Valid Email):</label>
              <input type="email" id="add-email" class="form-input" value="mohamed.saadi@example.com">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">رقم الهاتف (11 رقم مصري يبدأ بـ 010/011/012/015):</label>
              <input type="text" id="add-phone" class="form-input" value="01012345678">
            </div>
            <div class="form-group">
              <label class="form-label">الباقة:</label>
              <input type="text" id="add-plan" class="form-input" value="باقة اللياقة 3 أشهر (Pro)">
            </div>
          </div>
          <button class="btn btn-primary" onclick="addMember()">➕ إرسال طلب الإنشاء (POST 201 Created)</button>
        </div>
        <div id="res-add" style="display:none;">
          <div class="response-header">
            <span>الاستجابة:</span>
            <span id="badge-add" class="status-pill status-2xx"></span>
          </div>
          <div id="json-add" class="response-box"></div>
        </div>
      </div>
    </div>

    <!-- DELETE /api/admin/members/:id -->
    <div class="api-card">
      <div class="card-main">
        <div class="endpoint-info">
          <span class="method-tag method-delete">DELETE</span>
          <span class="auth-badge">Admin Only</span>
          <a class="endpoint-link" href="#" onclick="togglePanel('p-delete'); return false;">/api/admin/members/:id</a>
          <span class="endpoint-desc">حذف عضو نهائياً من قاعدة البيانات (HTTP 200/204)</span>
        </div>
        <div class="card-actions">
          <button class="btn btn-danger" onclick="togglePanel('p-delete')">🗑️ جرب الحذف (DELETE)</button>
        </div>
      </div>
      <div class="test-panel" id="p-delete">
        <div class="panel-form">
          <div class="form-group">
            <label class="form-label">رقم المشترك المراد حذفه (Member ID):</label>
            <input type="number" id="delete-id" class="form-input" value="5">
          </div>
          <button class="btn btn-danger" onclick="deleteMember()">🗑️ تأكيد حذف المشترك نهائياً</button>
        </div>
        <div id="res-delete" style="display:none;">
          <div class="response-header">
            <span>الاستجابة:</span>
            <span id="badge-delete" class="status-pill status-2xx"></span>
          </div>
          <div id="json-delete" class="response-box"></div>
        </div>
      </div>
    </div>

  </div>

  <script>
    let currentToken = localStorage.getItem('gym_api_token') || '';
    let currentUser = JSON.parse(localStorage.getItem('gym_api_user') || 'null');

    function updateAuthUi() {
      const badge = document.getElementById('current-auth-badge');
      const nameSpan = document.getElementById('current-user-name');
      if (currentToken && currentUser) {
        badge.className = 'jwt-pill ' + (currentUser.role === 'admin' ? 'admin' : 'member');
        badge.textContent = currentUser.role === 'admin' ? 'مدير النظام (Admin Token)' : 'مشترك (Member Token)';
        nameSpan.textContent = '(' + (currentUser.name || currentUser.username) + ')';
      } else {
        badge.className = 'jwt-pill none';
        badge.textContent = 'زائر (بدون Token)';
        nameSpan.textContent = '';
      }
    }

    updateAuthUi();

    function setToken(token, user) {
      currentToken = token;
      currentUser = user;
      localStorage.setItem('gym_api_token', token);
      localStorage.setItem('gym_api_user', JSON.stringify(user));
      updateAuthUi();
    }

    function clearToken() {
      currentToken = '';
      currentUser = null;
      localStorage.removeItem('gym_api_token');
      localStorage.removeItem('gym_api_user');
      updateAuthUi();
      alert('تم مسح التوكن. الآن الطلبات المحمية ستعيد 401 Unauthorized لتجربة الحماية.');
    }

    function togglePanel(panelId) {
      const panel = document.getElementById(panelId);
      panel.classList.toggle('active');
    }

    function fillLogin(user, pass, role) {
      document.getElementById('login-user').value = user;
      document.getElementById('login-pass').value = pass;
      document.getElementById('login-role').value = role;
    }

    function fillMemberValid() {
      document.getElementById('add-name').value = 'كريم حسام الدين';
      document.getElementById('add-email').value = 'kareem.hossam@example.com';
      document.getElementById('add-phone').value = '01234567890';
      document.getElementById('add-plan').value = 'باقة اللياقة 3 أشهر (Pro)';
    }

    function fillMemberInvalid() {
      document.getElementById('add-name').value = 'أ'; // too short (<3)
      document.getElementById('add-email').value = 'not-an-email'; // invalid email
      document.getElementById('add-phone').value = '12345'; // invalid phone pattern
      document.getElementById('add-plan').value = '';
    }

    async function quickLogin(user, pass, role) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user, password: pass, targetRole: role })
        });
        const data = await res.json();
        if (data.success && data.token) {
          setToken(data.token, { username: user, role: data.role, name: data.name });
          alert('تم تسجيل الدخول وتخزين الـ JWT Token بنجاح (' + data.role + ')');
        } else {
          alert('فشل الدخول: ' + data.message);
        }
      } catch (err) {
        alert('خطأ في الاتصال بالسيرفر: ' + err);
      }
    }

    async function fetchEndpoint(method, url, body, panelId) {
      const panel = document.getElementById(panelId);
      panel.classList.add('active');
      const key = panelId.replace('p-', '');
      const badge = document.getElementById('badge-' + key);
      const jsonBox = document.getElementById('json-' + key);

      jsonBox.textContent = 'جاري إرسال الطلب عبر ' + method + '...';
      const t0 = performance.now();

      const headers = { 'Content-Type': 'application/json' };
      if (currentToken) {
        headers['Authorization'] = 'Bearer ' + currentToken;
      }

      try {
        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(url, options);
        const data = await res.json();
        const duration = Math.round(performance.now() - t0);

        badge.textContent = res.status + ' ' + res.statusText + ' (' + duration + 'ms)';
        badge.className = 'status-pill ' + (res.ok ? 'status-2xx' : 'status-4xx');
        jsonBox.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        badge.textContent = 'Error';
        badge.className = 'status-pill status-4xx';
        jsonBox.textContent = String(err);
      }
    }

    async function sendLogin() {
      const username = document.getElementById('login-user').value;
      const password = document.getElementById('login-pass').value;
      const targetRole = document.getElementById('login-role').value;
      const resContainer = document.getElementById('res-login');
      const badge = document.getElementById('badge-login');
      const jsonBox = document.getElementById('json-login');

      resContainer.style.display = 'block';
      jsonBox.textContent = 'جاري التحقق...';
      const t0 = performance.now();

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, targetRole })
        });
        const data = await res.json();
        const duration = Math.round(performance.now() - t0);
        badge.textContent = res.status + ' ' + res.statusText + ' (' + duration + 'ms)';
        badge.className = 'status-pill ' + (res.ok ? 'status-2xx' : 'status-4xx');
        jsonBox.textContent = JSON.stringify(data, null, 2);

        if (data.success && data.token) {
          setToken(data.token, { username, role: data.role, name: data.name });
        }
      } catch (err) {
        badge.textContent = 'Error';
        badge.className = 'status-pill status-4xx';
        jsonBox.textContent = String(err);
      }
    }

    async function fetchMembersWithFilters() {
      const search = document.getElementById('query-search').value.trim();
      const status = document.getElementById('query-status').value;
      const page = document.getElementById('query-page').value;
      const limit = document.getElementById('query-limit').value;

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);

      const url = '/api/admin/members?' + params.toString();
      document.getElementById('res-admin-members').style.display = 'block';
      await fetchEndpoint('GET', url, null, 'p-admin-members');
    }

    async function bookSession() {
      const sessionId = document.getElementById('book-session-id').value;
      const notes = document.getElementById('book-notes').value;
      document.getElementById('res-book').style.display = 'block';
      await fetchEndpoint('POST', '/api/sessions/' + sessionId + '/book', { notes }, 'p-book');
    }

    async function toggleMember() {
      const id = document.getElementById('toggle-id').value;
      document.getElementById('res-toggle').style.display = 'block';
      await fetchEndpoint('PATCH', '/api/admin/members/' + id + '/toggle', {}, 'p-toggle');
    }

    async function renewMember() {
      const id = document.getElementById('renew-id').value;
      document.getElementById('res-renew').style.display = 'block';
      await fetchEndpoint('PATCH', '/api/admin/members/' + id + '/renew', {}, 'p-renew');
    }

    async function addMember() {
      const name = document.getElementById('add-name').value;
      const email = document.getElementById('add-email').value;
      const phone = document.getElementById('add-phone').value;
      const plan = document.getElementById('add-plan').value;

      document.getElementById('res-add').style.display = 'block';
      await fetchEndpoint('POST', '/api/admin/members', { name, email, phone, plan }, 'p-add');
    }

    async function deleteMember() {
      const id = document.getElementById('delete-id').value;
      if (!confirm('هل أنت متأكد من حذف المشترك رقم ' + id + ' نهائياً؟')) return;
      document.getElementById('res-delete').style.display = 'block';
      await fetchEndpoint('DELETE', '/api/admin/members/' + id, null, 'p-delete');
    }

    async function resetDatabase() {
      if (!confirm('هل تريد بالتأكيد استعادة بيانات قاعدة البيانات للافتراضي؟')) return;
      try {
        const res = await fetch('/api/reset', { method: 'POST' });
        const data = await res.json();
        alert(data.message || 'تمت الاستعادة بنجاح');
        location.reload();
      } catch (err) {
        alert('حدث خطأ: ' + err);
      }
    }
  </script>
</body>
</html>
  `);
});

// -------------------------------------------------------------
// Backup & Meta Endpoints
// -------------------------------------------------------------
app.get('/api/export/backup', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="gym-database-backup.json"');
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(DB_FILE);
});

app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    version: '2.0.0 (Production-Ready)',
    features: ['JWT Authentication', 'RBAC (Role Based Access Control)', 'Zod Validation', 'Advanced Query & Pagination', 'REST Standards (PATCH/DELETE)'],
    endpoints: [
      'POST /api/auth/login (Zod validated, returns JWT)',
      'GET /api/pricing-plans (Public)',
      'GET /api/single-classes (Public)',
      'GET /api/equipment (Public)',
      'GET /api/branches (Public)',
      'GET /api/member/current (JWT Protected)',
      'GET /api/member/metrics (JWT Protected)',
      'GET /api/member/subscription (JWT Protected)',
      'GET /api/member/schedule (JWT Protected)',
      'GET /api/member/nutrition (JWT Protected)',
      'POST /api/sessions/:id/book (Zod validated, updates spots)',
      'GET /api/admin/stats (RBAC: Admin Only)',
      'GET /api/admin/members (RBAC: Admin Only, Query Params: ?search=&status=&plan=&page=&limit=)',
      'PATCH /api/admin/members/:id/toggle (RBAC: Admin Only, State Partial Update)',
      'PATCH /api/admin/members/:id/renew (RBAC: Admin Only, State Partial Update)',
      'POST /api/admin/members (RBAC: Admin Only, Zod Validated, Returns 201 Created)',
      'DELETE /api/admin/members/:id (RBAC: Admin Only, Returns 200/204)'
    ]
  });
});

// -------------------------------------------------------------
// 1. Authentication Endpoint (JWT & Zod)
// -------------------------------------------------------------
app.post('/api/auth/login', validate(loginSchema), (req, res) => {
  const { username, password, targetRole } = req.body;

  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  const user = db.credentials.find(
    (c) => c.username.toLowerCase() === cleanUser && c.password === cleanPass && c.role === targetRole
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'بيانات الدخول غير صحيحة! يرجى التحقق من اسم المستخدم وكلمة المرور ونوع الحساب.'
    });
  }

  // Generate JWT Token
  const token = jwt.sign(
    {
      username: user.username,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  res.status(200).json({
    success: true,
    statusCode: 200,
    role: user.role,
    name: user.name,
    token,
    expiresIn: JWT_EXPIRES_IN,
    message: user.role === 'admin'
      ? 'مرحباً بك يا مدير النظام (Admin)! تم تسجيل الدخول وإصدار رمز التوثيق (JWT) بنجاح.'
      : 'أهلاً بك يا كابتن أحمد! تم تسجيل الدخول وإصدار رمز التوثيق (JWT) بنجاح.'
  });
});

// -------------------------------------------------------------
// 2. Public Endpoints
// -------------------------------------------------------------
app.get('/api/pricing-plans', (req, res) => {
  res.status(200).json(db.pricingPlans || []);
});

app.get('/api/single-classes', (req, res) => {
  res.status(200).json(db.sessions || []);
});

app.get('/api/equipment', (req, res) => {
  res.status(200).json(db.equipment || []);
});

app.get('/api/branches', (req, res) => {
  res.status(200).json(db.branches || []);
});

// -------------------------------------------------------------
// 3. Member Portal Endpoints (Protected by JWT)
// -------------------------------------------------------------
app.get('/api/member/current', authMiddleware, (req, res) => {
  res.status(200).json(db.currentMember || {});
});

app.get('/api/member/metrics', authMiddleware, (req, res) => {
  res.status(200).json(db.memberMetrics || {});
});

app.get('/api/member/subscription', authMiddleware, (req, res) => {
  res.status(200).json(db.memberSubscription || {});
});

app.get('/api/member/schedule', authMiddleware, (req, res) => {
  res.status(200).json(db.memberSchedule || []);
});

app.get('/api/member/nutrition', authMiddleware, (req, res) => {
  res.status(200).json(db.nutritionPlan || {});
});

// Book a session (Zod validated, updates spots in DB)
app.post('/api/sessions/:id/book', validate(bookSessionSchema), (req, res) => {
  const sessionId = req.params.id;
  const session = db.sessions.find((s) => s.id === sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message: `الحصة التدريبية برقم '${sessionId}' غير موجودة.`
    });
  }

  if (session.spotsLeft > 0) {
    session.spotsLeft -= 1;
    saveDatabase();
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: `تم حجز مقعدك بنجاح في ${session.title}!`,
      session
    });
  }

  return res.status(400).json({
    success: false,
    statusCode: 400,
    message: 'عذراً، لا توجد مقاعد شاغرة لهذه الحصة.'
  });
});

// -------------------------------------------------------------
// 4. Admin Portal Endpoints (RBAC: Admin Role Only)
// -------------------------------------------------------------
app.get('/api/admin/stats', authMiddleware, requireRole('admin'), (req, res) => {
  const total = db.adminMembers.length;
  const active = db.adminMembers.filter(m => m.status === 'Active').length;
  const expiring = db.adminMembers.filter(m => {
    if (m.status !== 'Active' || !m.endDate) return false;
    const diffDays = Math.ceil((new Date(m.endDate).getTime() - Date.now()) / (1000 * 3600 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  const stats = {
    totalMembers: total,
    activeSubscriptions: active,
    expiringSoon: expiring,
    monthlyRevenue: db.adminStats ? db.adminStats.monthlyRevenue : '148,500 ج.م'
  };

  res.status(200).json(stats);
});

// GET /api/admin/members (Search, Filtering, Pagination)
app.get('/api/admin/members', authMiddleware, requireRole('admin'), (req, res) => {
  const { search, status, plan, page, limit } = req.query;

  let members = [...(db.adminMembers || [])];

  // 1. Search Query (name, email, phone)
  if (search && typeof search === 'string' && search.trim() !== '') {
    const term = search.trim().toLowerCase();
    members = members.filter(m =>
      (m.name && m.name.toLowerCase().includes(term)) ||
      (m.email && m.email.toLowerCase().includes(term)) ||
      (m.phone && m.phone.includes(term))
    );
  }

  // 2. Status Filter (Active / Expired)
  if (status && typeof status === 'string' && status !== '') {
    members = members.filter(m => m.status.toLowerCase() === status.toLowerCase());
  }

  // 3. Plan Filter
  if (plan && typeof plan === 'string' && plan !== '') {
    const planTerm = plan.toLowerCase();
    members = members.filter(m => m.plan && m.plan.toLowerCase().includes(planTerm));
  }

  // If pagination parameters are provided, return structured pagination
  if (page || limit) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const total = members.length;
    const totalPages = Math.ceil(total / limitNum) || 1;
    const offset = (pageNum - 1) * limitNum;
    const paginated = members.slice(offset, offset + limitNum);

    return res.status(200).json({
      success: true,
      statusCode: 200,
      data: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  }

  // If no pagination requested, return array or object with data
  res.status(200).json({
    success: true,
    statusCode: 200,
    data: members,
    total: members.length
  });
});

// POST /api/admin/members (Add new member - Zod Validated, 201 Created)
app.post('/api/admin/members', authMiddleware, requireRole('admin'), validate(createMemberSchema), (req, res) => {
  const { name, email, phone, plan, endDate, avatarBg, status } = req.body;

  const nextId = db.adminMembers.reduce((max, m) => Math.max(max, m.id || 0), 0) + 1;
  const newMember = {
    id: nextId,
    name,
    email,
    phone,
    plan,
    status: status || 'Active',
    endDate: endDate || '2027-01-01',
    avatarBg: avatarBg || '#3b82f6'
  };

  db.adminMembers.push(newMember);
  saveDatabase();

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: 'تم إضافة المشترك بنجاح إلى قاعدة البيانات.',
    member: newMember
  });
});

// PATCH /api/admin/members/:id/toggle (Partial Update State)
const toggleHandler = (req, res) => {
  const memberId = Number(req.params.id);
  const member = db.adminMembers.find((m) => m.id === memberId);

  if (!member) {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message: `المشترك برقم ${memberId} غير موجود في قاعدة البيانات.`
    });
  }

  member.status = member.status === 'Active' ? 'Expired' : 'Active';
  saveDatabase();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: `تم تحديث حالة المشترك إلى ${member.status}`,
    member
  });
};

app.patch('/api/admin/members/:id/toggle', authMiddleware, requireRole('admin'), toggleHandler);
app.post('/api/admin/members/:id/toggle', authMiddleware, requireRole('admin'), toggleHandler); // Backward compatibility

// PATCH /api/admin/members/:id/renew (Partial Update State)
const renewHandler = (req, res) => {
  const memberId = Number(req.params.id);
  const member = db.adminMembers.find((m) => m.id === memberId);

  if (!member) {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message: `المشترك برقم ${memberId} غير موجود في قاعدة البيانات.`
    });
  }

  member.status = 'Active';
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  member.endDate = nextYear.toISOString().split('T')[0];

  saveDatabase();
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: `تم تجديد اشتراك المشترك بنجاح حتى ${member.endDate}`,
    member
  });
};

app.patch('/api/admin/members/:id/renew', authMiddleware, requireRole('admin'), renewHandler);
app.post('/api/admin/members/:id/renew', authMiddleware, requireRole('admin'), renewHandler); // Backward compatibility

// DELETE /api/admin/members/:id (Remove member)
app.delete('/api/admin/members/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const memberId = Number(req.params.id);
  const index = db.adminMembers.findIndex((m) => m.id === memberId);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message: `المشترك برقم ${memberId} غير موجود.`
    });
  }

  const deleted = db.adminMembers.splice(index, 1)[0];
  saveDatabase();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'تم حذف المشترك بنجاح من قاعدة البيانات.',
    deletedMember: deleted
  });
});

// Reset database to initial state
app.post('/api/reset', (req, res) => {
  try {
    const initialData = fs.readFileSync(INITIAL_DATA_FILE, 'utf-8');
    fs.writeFileSync(DB_FILE, initialData, 'utf-8');
    db = JSON.parse(initialData);
    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'تمت استعادة البيانات الافتراضية بنجاح.'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      statusCode: 500,
      error: err.message
    });
  }
});

// Global 404 handler for unmatched API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    error: 'Endpoint Not Found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Production Gym API Server is running on http://localhost:${PORT}`);
  console.log(`📖 Open http://localhost:${PORT} in your browser to view the interactive API Explorer`);
});
