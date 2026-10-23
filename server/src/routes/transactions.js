import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getByUser, getById, addTransaction, updateStatus } from '../db/transactions.js';
import { updateBalance } from '../db/users.js';
import { getTimeoutMs, getTimeoutMinutes } from '../services/cronJobs.js';

const router = Router();
router.use(authenticate);

// ── Sinh địa chỉ ví ngẫu nhiên theo network ──────────────────
const HEX = '0123456789abcdef';
const randomHex = (len) => Array.from({ length: len }, () => HEX[Math.floor(Math.random() * 16)]).join('');
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const randomBase58 = (len) => Array.from({ length: len }, () => BASE58[Math.floor(Math.random() * 58)]).join('');

const generateWallet = (network, userId) => {
  // Seed deterministik per user+network agar konsisten per sesi
  const seed = (userId + network).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (max) => { const x = Math.sin(seed * 9301 + 49297) * 233280; return Math.floor((x - Math.floor(x)) * max); };
  const seededHex  = (len) => Array.from({ length: len }, (_, i) => HEX[(rng(16) + i) % 16]).join('');
  const seededB58  = (len) => Array.from({ length: len }, (_, i) => BASE58[(rng(58) + i * 7) % 58]).join('');

  switch (network) {
    case 'TRC20': return `T${seededB58(33)}`;
    case 'ERC20':
    case 'BEP20': return `0x${seededHex(40)}`;
    case 'BTC':   return `bc1q${seededB58(38)}`;
    default:      return `0x${seededHex(40)}`;
  }
};

// ── GET /api/transactions  (own transactions) ──
router.get('/', async (req, res) => {
  try {
    const { type, status, method, limit = 50, offset = 0 } = req.query;
    const list = await getByUser(req.user.id, { type, status, method, limit, offset });
    res.json({ success: true, data: list, total: list.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/transactions/:id ──
router.get('/:id', async (req, res) => {
  const tx = await getById(req.params.id);
  if (!tx || tx.userId !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Giao dịch không tồn tại' });
  }
  res.json({ success: true, data: tx });
});

// ── POST /api/transactions/deposit/crypto ──
router.post(
  '/deposit/crypto',
  validate({
    symbol:  { required: true },
    network: { required: true, enum: ['TRC20', 'ERC20', 'BEP20', 'BTC'] },
  }),
  (req, res) => {
    const { symbol, network } = req.body;
    const walletAddress = generateWallet(network, req.user.id);
    const expiresAt = new Date(Date.now() + getTimeoutMs('crypto', network)).toISOString();

    addTransaction({
      id: `TXN${uuid().slice(0, 8).toUpperCase()}`,
      userId: req.user.id,
      type: 'deposit', method: 'crypto',
      amount: 0, currency: symbol, status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cryptoAsset: symbol, network, walletAddress, expiresAt,
    }).then((tx) => res.status(201).json({
      success: true,
      data: { ...tx, expiresAt, timeoutMinutes: getTimeoutMinutes('crypto', network) },
    })).catch((err) => res.status(500).json({ success: false, message: err.message }));
  },
);

// ── POST /api/transactions/deposit/bank ──
router.post(
  '/deposit/bank',
  validate({
    bankCode: { required: true },
    amount:   { required: true, type: 'number', min: 1 },
  }),
  (req, res) => {
    const { bankCode, amount } = req.body;
    const transferContent = `NAP${uuid().slice(0, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + getTimeoutMs('bank', null)).toISOString();

    addTransaction({
      id: `TXN${uuid().slice(0, 8).toUpperCase()}`,
      userId: req.user.id,
      type: 'deposit', method: 'bank',
      amount, currency: 'VND', status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bankCode, transferContent,
      receiverAccount: '1234567890', receiverName: 'CONG TY CHECK BANK',
      expiresAt,
    }).then((tx) => res.status(201).json({
      success: true,
      data: { ...tx, transferContent, expiresAt, timeoutMinutes: getTimeoutMinutes('bank', null) },
    })).catch((err) => res.status(500).json({ success: false, message: err.message }));
  },
);

// ── POST /api/transactions/withdraw/crypto ──
router.post(
  '/withdraw/crypto',
  validate({
    symbol:  { required: true },
    network: { required: true },
    address: { required: true },
    amount:  { required: true, type: 'number', min: 1 },
  }),
  async (req, res) => {
    const { symbol, network, address, amount } = req.body;
    try {
      const expiresAt = new Date(Date.now() + getTimeoutMs('crypto', network)).toISOString();
      const tx = await addTransaction({
        id: `TXN${uuid().slice(0, 8).toUpperCase()}`,
        userId: req.user.id,
        type: 'withdraw', method: 'crypto',
        amount, currency: symbol, status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cryptoAsset: symbol, network, walletAddress: address, expiresAt,
      });
      await updateBalance(req.user.id, 0, -amount);
      res.status(201).json({ success: true, data: { ...tx, timeoutMinutes: getTimeoutMinutes('crypto', network) } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// ── POST /api/transactions/withdraw/bank ──
router.post(
  '/withdraw/bank',
  validate({
    bankCode:      { required: true },
    accountNumber: { required: true },
    accountName:   { required: true },
    amount:        { required: true, type: 'number', min: 1 },
  }),
  async (req, res) => {
    const { bankCode, accountNumber, accountName, amount } = req.body;
    try {
      const expiresAt = new Date(Date.now() + getTimeoutMs('bank', null)).toISOString();
      const tx = await addTransaction({
        id: `TXN${uuid().slice(0, 8).toUpperCase()}`,
        userId: req.user.id,
        type: 'withdraw', method: 'bank',
        amount, currency: 'VND', status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bankCode, accountNumber, accountName, expiresAt,
      });
      await updateBalance(req.user.id, -amount, 0);
      res.status(201).json({ success: true, data: { ...tx, timeoutMinutes: getTimeoutMinutes('bank', null) } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// ── PATCH /api/transactions/:id/status ──
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const VALID = ['pending', 'completed', 'failed', 'cancelled'];
  if (!VALID.includes(status)) {
    return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
  }
  const tx = await getById(req.params.id);
  if (!tx || tx.userId !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });
  }
  const updated = await updateStatus(req.params.id, status);
  res.json({ success: true, data: updated });
});

// ── GET /api/transactions/:id/poll — FE poll trạng thái ──
router.get('/:id/poll', async (req, res) => {
  const tx = await getById(req.params.id);
  if (!tx || tx.userId !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Giao dịch không tồn tại' });
  }
  const now = Date.now();
  const expiresAt = tx.expiresAt ? new Date(tx.expiresAt).getTime() : null;
  const remainingMs = expiresAt ? Math.max(0, expiresAt - now) : null;

  res.json({
    success: true,
    data: {
      id:          tx.id,
      status:      tx.status,
      expiresAt:   tx.expiresAt,
      remainingMs,
      remainingSec: remainingMs !== null ? Math.floor(remainingMs / 1000) : null,
      isExpired:   tx.status === 'expired' || (expiresAt !== null && now > expiresAt),
    },
  });
});

export default router;
