import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes        from './routes/auth.js';
import referenceRoutes   from './routes/reference.js';
import transactionRoutes from './routes/transactions.js';
import gamePortalRoutes  from './routes/gamePortal.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      process.env.FRONTEND_URL,          // từ env (production)
      'http://localhost:5173',            // dev local
      'http://localhost:4173',            // vite preview
      /\.pages\.dev$/,                   // bất kỳ subdomain pages.dev
    ];
    if (!origin) return cb(null, true);  // server-to-server / curl
    const ok = allowed.some((a) =>
      typeof a === 'string' ? a === origin : a.test(origin)
    );
    cb(ok ? null : new Error('CORS blocked'), ok);
  },
  credentials: true,
}));
app.use(express.json());

// Request logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString().slice(11, 23)}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api',              referenceRoutes);   // /banks, /crypto, /gateways, /exchange-rate
app.use('/api/transactions', transactionRoutes);
app.use('/api/game-portal',  gamePortalRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), env: process.env.NODE_ENV });
});

// Keep-alive ping endpoint (ngăn Render free tier sleep)
app.get('/ping', (_req, res) => {
  res.json({ pong: true, time: new Date().toISOString() });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint không tồn tại' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ✅  CheckBank API đang chạy');
  console.log(`  🌐  http://localhost:${PORT}`);
  console.log(`  🩺  http://localhost:${PORT}/health`);
  console.log('');
  console.log('  Endpoints:');
  console.log('  POST /api/auth/login');
  console.log('  GET  /api/auth/me');
  console.log('  GET  /api/banks');
  console.log('  GET  /api/crypto');
  console.log('  GET  /api/gateways');
  console.log('  GET  /api/exchange-rate');
  console.log('  GET  /api/transactions');
  console.log('  POST /api/transactions/deposit/crypto');
  console.log('  POST /api/transactions/deposit/bank');
  console.log('  POST /api/transactions/withdraw/crypto');
  console.log('  POST /api/transactions/withdraw/bank');
  console.log('  GET  /api/game-portal/platforms');
  console.log('  GET  /api/game-portal/links');
  console.log('  POST /api/game-portal/links');
  console.log('  POST /api/game-portal/transactions/init');
  console.log('  POST /api/game-portal/transactions/confirm');
  console.log('');
});
