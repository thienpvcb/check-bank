import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getByUser, getById, addTransaction, updateStatus } from '../db/transactions.js';
import { updateBalance } from '../db/users.js';

const router = Router();
router.use(authenticate);

// Wallet addresses per network (mock — in real system generated per user)
const DEPOSIT_WALLETS = {
  TRC20: 'TXqLKj8fJKj9dJKj8fJKj9dJKj8fJKj9d',
  ERC20: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  BEP20: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
  BTC:   'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
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
    const walletAddress = DEPOSIT_WALLETS[network];

    addTransaction({
      id: `TXN${uuid().slice(0, 8).toUpperCase()}`,
      userId: req.user.id,
      type: 'deposit',
      method: 'crypto',
      amount: 0,
      currency: symbol,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cryptoAsset: symbol,
      network,
      walletAddress,
    }).then((tx) => res.status(201).json({ success: true, data: tx }))
      .catch((err) => res.status(500).json({ success: false, message: err.message }));
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

    addTransaction({
      id: `TXN${uuid().slice(0, 8).toUpperCase()}`,
      userId: req.user.id,
      type: 'deposit',
      method: 'bank',
      amount,
      currency: 'VND',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bankCode,
      transferContent,
      receiverAccount: '1234567890',
      receiverName: 'CONG TY CHECK BANK',
    }).then((tx) => res.status(201).json({ success: true, data: { ...tx, transferContent } }))
      .catch((err) => res.status(500).json({ success: false, message: err.message }));
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
      const tx = await addTransaction({
        id: `TXN${uuid().slice(0, 8).toUpperCase()}`,
        userId: req.user.id,
        type: 'withdraw',
        method: 'crypto',
        amount,
        currency: symbol,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cryptoAsset: symbol,
        network,
        walletAddress: address,
      });
      await updateBalance(req.user.id, 0, -amount);
      res.status(201).json({ success: true, data: tx });
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
      const tx = await addTransaction({
        id: `TXN${uuid().slice(0, 8).toUpperCase()}`,
        userId: req.user.id,
        type: 'withdraw',
        method: 'bank',
        amount,
        currency: 'VND',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bankCode,
        accountNumber,
        accountName,
      });
      await updateBalance(req.user.id, -amount, 0);
      res.status(201).json({ success: true, data: tx });
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

export default router;
