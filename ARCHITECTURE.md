# CheckBank — Kiến trúc hệ thống

> Phiên bản: 1.0 · Cập nhật: 10/2026

---

## 1. Tổng quan

CheckBank là hệ thống cổng thanh toán (Payment Portal) hỗ trợ nạp/rút tiền qua crypto và ngân hàng Việt Nam, tích hợp cổng game (nhà cái), quản lý người dùng và phê duyệt giao dịch.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          INTERNET                                   │
└────────────┬───────────────────────────────────────┬───────────────┘
             │                                       │
      ┌──────▼──────┐                       ┌────────▼────────┐
      │  User / Admin│                       │  cron-job.org   │
      │   Browser    │                       │  (ping /10min)  │
      └──────┬──────┘                       └────────┬────────┘
             │ HTTPS                                 │ GET /ping
             │                                       │
┌────────────▼───────────────────────────────────────▼───────────────┐
│                     CLOUDFLARE PAGES                                │
│              https://check-bank-8a3.pages.dev                       │
│                                                                     │
│   React 19 · TypeScript · Vite · Ant Design 6 (dark)                │
│   ─────────────────────────────────────────────────────────────     │
│   Pages:                                                            │
│   • /login          Đăng nhập                                       │
│   • /deposit        Nạp tiền (crypto / bank)                        │
│   • /withdraw       Rút tiền (crypto / bank)                        │
│   • /history        Lịch sử giao dịch                               │
│   • /gateway-status Trạng thái cổng thanh toán                      │
│   • /game-portal    Cổng game (liên kết nhà cái, nạp/rút OTP)       │
│   • /profile        Hồ sơ & tài khoản ngân hàng đã lưu             │
│   • /admin/*        Admin CMS (duyệt, quản lý user)                 │
└────────────────────────────────┬───────────────────────────────────┘
                                 │ REST API (HTTPS + JWT Bearer)
                                 │ VITE_API_URL = https://check-bank.onrender.com/api
                                 │
┌────────────────────────────────▼───────────────────────────────────┐
│                        RENDER.COM                                   │
│              https://check-bank.onrender.com                        │
│                                                                     │
│   Node.js 24 · Express 4 · ES Modules                              │
│   Root directory: /server                                           │
│   ─────────────────────────────────────────────────────────────     │
│   Routes:                                                           │
│   POST /api/auth/login|logout                                       │
│   GET  /api/auth/me                                                 │
│   GET  /api/banks · /api/crypto · /api/gateways                     │
│   GET  /api/exchange-rate          (proxy + cache 5 phút)           │
│   GET/POST /api/transactions/*     (deposit, withdraw, cancel)      │
│   GET  /api/transactions/:id/poll  (status polling)                 │
│   GET/PATCH /api/profile/**        (profile, bank accounts)         │
│   GET/POST  /api/game-portal/**    (platforms, links, OTP tx)       │
│   GET/POST  /api/admin/**          (admin-only, requireAdmin MW)     │
│   GET /health · /ping                                               │
│   ─────────────────────────────────────────────────────────────     │
│   Background jobs (setInterval):                                    │
│   • Expire job   — mỗi 2 phút: pending → expired                   │
│   • Confirm job  — mỗi 90 giây: simulate confirm deposit (demo)     │
└────────────────────────────────┬───────────────────────────────────┘
                                 │ PostgreSQL (SSL, port 5432)
                                 │ Direct connection
                                 │
┌────────────────────────────────▼───────────────────────────────────┐
│                         SUPABASE                                    │
│      Project: dlazbwgunorkqjufwjmf.supabase.co                      │
│                                                                     │
│   Tables:                                                           │
│   • users                  id, username, password_hash, balance,    │
│                            balance_usdt, role, is_active, phone...  │
│   • transactions           id, user_id, type, method, amount,       │
│                            status, expires_at, reject_reason...     │
│   • user_bank_accounts     saved bank accounts per user             │
│   • linked_platforms       nhà cái đã liên kết per user             │
│   • platform_transactions  lịch sử giao dịch game portal            │
│   • audit_logs             lịch sử hành động admin                  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Version | Ghi chú |
|---|---|---|---|
| **Frontend** | React | 19 | |
| | TypeScript | 6 | |
| | Vite | 8 | Build tool |
| | Ant Design | 6 | UI library, dark theme |
| | React Router | 7 | Client-side routing |
| | Day.js | latest | Xử lý ngày giờ |
| **Backend** | Node.js | 24 | |
| | Express | 4 | REST API |
| | jsonwebtoken | 9 | JWT authentication |
| | bcryptjs | 2 | Password hashing |
| | uuid | 10 | ID generation |
| **Database** | PostgreSQL | 15 | Via Supabase |
| | @supabase/supabase-js | latest | DB client |
| | postgres.js | latest | Raw SQL (fallback) |
| **Hosting** | Cloudflare Pages | — | Frontend CDN toàn cầu |
| | Render.com | Free tier | Backend Node.js |
| | Supabase | Free tier | PostgreSQL database |
| **DevOps** | GitHub | — | Source control, auto-deploy |
| | cron-job.org | Free | Keep-alive ping mỗi 10 phút |

---

## 3. Luồng Authentication

```
User → POST /api/auth/login (username + password)
     ← JWT token (24h) + User object

Mỗi request tiếp theo:
User → Header: Authorization: Bearer <token>
     → authenticate middleware: verify JWT → findById → req.user
     → requireAdmin middleware (chỉ cho /api/admin/*): check role === 'admin'
```

**Token storage:** `sessionStorage` (tự xóa khi đóng tab)

---

## 4. Luồng Giao dịch

### 4.1 Nạp tiền
```
User chọn method (crypto/bank)
  → POST /api/transactions/deposit/crypto|bank
  → Tạo TX record (status: pending, expires_at: +30~60 phút)
  → Trả về: địa chỉ ví (crypto) hoặc STK + nội dung CK (bank)
  → FE poll /api/transactions/:id/poll mỗi 15 giây
  → Admin duyệt → status: completed → cộng tiền vào balance
  → Cron job: nếu hết hạn → status: expired
```

### 4.2 Rút tiền
```
User nhập thông tin rút
  → Validate: balance >= amount
  → POST /api/transactions/withdraw/crypto|bank
  → Trừ tiền ngay (lock) → TX record (status: pending)
  → Admin duyệt → status: completed (tiền đã trừ rồi, không làm gì thêm)
  → Admin từ chối → status: failed + reject_reason → HOÀN tiền
  → User tự hủy → POST /api/transactions/:id/cancel → status: cancelled → HOÀN tiền
```

### 4.3 Game Portal (Nhà cái)
```
User liên kết nhà cái (domain + API key)
  → Chọn nạp/rút + nhập User ID + số tiền
  → POST /api/game-portal/transactions/init → sinh OTP 6 số (TTL 120s)
  → User nhập OTP
  → POST /api/game-portal/transactions/confirm → xác thực OTP → tạo TX
```

---

## 5. Cấu trúc thư mục

```
check-bank/
├── src/                          Frontend (React)
│   ├── components/
│   │   ├── Icons/                SVG icons (LogoIcon, CryptoIcon...)
│   │   ├── Layout/
│   │   │   ├── MainLayout.tsx    Layout user portal (sidebar + header)
│   │   │   └── AdminLayout.tsx   Layout admin CMS
│   │   ├── AdminRoute.tsx        Route guard: role === 'admin'
│   │   ├── ProtectedRoute.tsx    Route guard: authenticated
│   │   ├── ExchangeRateBadge.tsx Hiển thị tỷ giá USD/VND
│   │   └── TransactionCountdown.tsx Đếm ngược hết hạn TX
│   ├── context/
│   │   └── AuthContext.tsx       Global auth state
│   ├── hooks/
│   │   ├── useApi.ts             USE_API flag
│   │   └── useExchangeRate.ts    Fetch tỷ giá từ open.er-api.com
│   ├── mocks/                    Dữ liệu mock (fallback khi USE_API=false)
│   │   ├── banks.ts
│   │   ├── crypto.ts
│   │   ├── gateways.ts
│   │   ├── games.ts
│   │   └── transactions.ts
│   ├── pages/
│   │   ├── Login/
│   │   ├── Deposit/
│   │   ├── Withdraw/
│   │   ├── History/
│   │   ├── GatewayStatus/
│   │   ├── GamePortal/
│   │   ├── Profile/
│   │   └── Admin/
│   │       ├── Dashboard.tsx
│   │       ├── TransactionReview.tsx  Duyệt nạp/rút
│   │       ├── AuditLogPage.tsx
│   │       └── UserManagement.tsx     Tạo/khóa/nạp tiền user
│   ├── services/
│   │   └── api.ts                Tất cả API calls (authApi, transactionApi...)
│   ├── store/
│   │   └── authStore.ts          User interface + mock login
│   └── types/
│       └── index.ts              TypeScript interfaces
│
├── server/                       Backend (Node.js/Express)
│   ├── src/
│   │   ├── index.js              Entry point, route registration
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── reference.js      banks, crypto, gateways, exchange-rate
│   │   │   ├── transactions.js
│   │   │   ├── profile.js
│   │   │   ├── gamePortal.js
│   │   │   └── admin.js
│   │   ├── middleware/
│   │   │   ├── auth.js           authenticate + requireAdmin
│   │   │   └── validate.js       Request body validation
│   │   ├── db/
│   │   │   ├── index.js          Supabase + postgres.js init
│   │   │   ├── users.js
│   │   │   ├── transactions.js
│   │   │   ├── platformLinks.js
│   │   │   ├── auditLog.js
│   │   │   └── userProfile.js
│   │   └── services/
│   │       └── cronJobs.js       Auto-expire + simulate confirm
│   └── migrations/
│       ├── 001_init.sql          Schema khởi tạo
│       ├── 002_add_expires_at.sql
│       ├── 003_audit_log.sql
│       ├── 004_user_management.sql
│       ├── 005_user_profile.sql
│       └── 006_reject_reason.sql
│
├── public/
│   ├── _redirects                SPA fallback cho Cloudflare Pages
│   └── _headers                  Security headers
├── .env.development              VITE_API_URL, VITE_USE_API
├── .env.production               Production env vars
└── ARCHITECTURE.md               File này
```

---

## 6. Biến môi trường

### Frontend (`.env.production`)
| Key | Value | Mô tả |
|---|---|---|
| `VITE_API_URL` | `https://check-bank.onrender.com/api` | Backend URL |
| `VITE_USE_API` | `true` / `false` | Dùng real API hay mock data |

### Backend (`server/.env`)
| Key | Mô tả |
|---|---|
| `PORT` | Port server (mặc định 3001) |
| `JWT_SECRET` | Secret key cho JWT |
| `JWT_EXPIRES_IN` | Thời hạn token (24h) |
| `DATABASE_URL` | PostgreSQL connection string (Supabase Direct) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypass RLS) |
| `FRONTEND_URL` | URL frontend (CORS whitelist) |
| `NODE_ENV` | `production` / `development` |

---

## 7. Tỷ giá USD/VND

```
Frontend (useExchangeRate hook):
  1. Fetch open.er-api.com/v6/latest/USD     (primary, no-key)
  2. Fallback: jsdelivr/fawazahmed0            (CDN, always free)
  3. Fallback cứng: 25,900 ₫/USD

Backend (/api/exchange-rate):
  Cache 5 phút → trả kết quả cho frontend thay vì gọi trực tiếp
```

**Quy tắc:** Tối thiểu nạp/rút = **1,000 USDT** (hoặc tương đương VND theo tỷ giá thực)

---

## 8. Bảo mật

| Điểm | Cách xử lý |
|---|---|
| Password | bcrypt (rounds=10) |
| API auth | JWT Bearer token, 24h TTL |
| Admin guard | `requireAdmin` middleware check `role === 'admin'` |
| Tài khoản bị khóa | `is_active = false` → block ngay tại login + mọi request |
| API Key nhà cái | Hash bcrypt trước khi lưu DB |
| CORS | Whitelist: pages.dev + localhost |
| Secrets | Không commit lên Git (`.env` trong `.gitignore`) |
| Row Level Security | Supabase RLS enabled, service_role bypass |

---

## 9. Tài khoản mặc định

| Username | Password | Role |
|---|---|---|
| `demo` | `demo123` | user |
| `admin` | `admin123` | admin |

> ⚠️ Đổi password trong production qua Supabase SQL Editor.
