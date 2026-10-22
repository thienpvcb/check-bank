import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getLinkedByUser, getLink, addLink, removeLink,
  getPlatformTxByUser, addPlatformTx,
  storeOTP, verifyOTP,
} from '../db/platformLinks.js';

const router = Router();
router.use(authenticate);

const PLATFORMS = [
  { id: 'gp-sun', name: 'SunWin',   domain: 'sunwin.com', currency: ['VND','USDT'], isActive: true,  description: 'Cổng game bài & slot phổ biến', minDeposit: 50_000,  minWithdraw: 100_000, minDepositUsdt: 1_000, minWithdrawUsdt: 1_000 },
  { id: 'gp-hit', name: 'Hit Club', domain: 'hit.club',   currency: ['VND','USDT'], isActive: true,  description: 'Game bài đổi thưởng uy tín',   minDeposit: 50_000,  minWithdraw: 100_000, minDepositUsdt: 1_000, minWithdrawUsdt: 1_000 },
  { id: 'gp-rio', name: 'Rio66',    domain: 'rio66.com',  currency: ['VND','USDT'], isActive: true,  description: 'Casino online & thể thao',     minDeposit: 100_000, minWithdraw: 200_000, minDepositUsdt: 1_000, minWithdrawUsdt: 1_000 },
  { id: 'gp-sv',  name: 'SV388',   domain: 'sv388.com',  currency: ['VND'],        isActive: true,  description: 'Đá gà & cá cược thể thao',    minDeposit: 100_000, minWithdraw: 200_000, minDepositUsdt: 1_000, minWithdrawUsdt: 1_000 },
  { id: 'gp-j88', name: 'J88',     domain: 'j88.io',     currency: ['VND','USDT'], isActive: false, description: 'Slot game & nổ hũ',           minDeposit: 50_000,  minWithdraw: 100_000, minDepositUsdt: 1_000, minWithdrawUsdt: 1_000 },
];

const generateOTP = () => String(Math.floor(100_000 + Math.random() * 900_000));

// ── GET /api/game-portal/platforms ──
router.get('/platforms', (_req, res) => {
  res.json({ success: true, data: PLATFORMS });
});

// ── GET /api/game-portal/links ──
router.get('/links', async (req, res) => {
  try {
    const links = (await getLinkedByUser(req.user.id)).map(({ apiKeyHash, ...rest }) => ({
      ...rest,
      apiKey: `***${rest.platformId?.slice(-4) ?? '****'}`,
    }));
    res.json({ success: true, data: links });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/game-portal/links ──
router.post(
  '/links',
  validate({ platformId: { required: true }, domain: { required: true }, apiKey: { required: true } }),
  async (req, res) => {
    const { platformId, domain, apiKey } = req.body;
    const platform = PLATFORMS.find((p) => p.id === platformId);

    if (!platform) return res.status(404).json({ success: false, message: 'Nhà cái không tồn tại' });
    if (await getLink(req.user.id, platformId)) {
      return res.status(409).json({ success: false, message: 'Đã liên kết nhà cái này rồi' });
    }

    try {
      const link = await addLink({
        id: `link-${uuid().slice(0, 8)}`,
        userId: req.user.id,
        platformId,
        platformName: platform.name,
        domain,
        apiKey,
      });
      res.status(201).json({
        success: true,
        data: { ...link, apiKey: `***${apiKey.slice(-4)}` },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// ── DELETE /api/game-portal/links/:platformId ──
router.delete('/links/:platformId', async (req, res) => {
  const removed = await removeLink(req.user.id, req.params.platformId);
  if (!removed) return res.status(404).json({ success: false, message: 'Liên kết không tồn tại' });
  res.json({ success: true, message: 'Đã hủy liên kết thành công' });
});

// ── POST /api/game-portal/transactions/init ──
router.post(
  '/transactions/init',
  validate({
    platformId: { required: true },
    type:       { required: true, enum: ['deposit', 'withdraw'] },
    currency:   { required: true, enum: ['VND', 'USDT'] },
    userId:     { required: true },
    username:   { required: true },
    amount:     { required: true, type: 'number', min: 1 },
  }),
  async (req, res) => {
    const { platformId, type, currency, userId, username, amount } = req.body;

    const link = await getLink(req.user.id, platformId);
    if (!link) return res.status(400).json({ success: false, message: 'Chưa liên kết nhà cái này' });

    const platform = PLATFORMS.find((p) => p.id === platformId);
    if (!platform?.isActive) return res.status(400).json({ success: false, message: 'Nhà cái đang bảo trì' });

    const txId = `PTX${uuid().slice(0, 8).toUpperCase()}`;
    const otp  = generateOTP();
    storeOTP(txId, otp, 120);

    // Production: send OTP via SMS/email instead of returning it
    res.status(201).json({
      success: true,
      data: {
        txId, platformId,
        platformName: platform.name,
        type, currency, amount, userId, username,
        status: 'awaiting_otp',
        otp,          // demo only — remove in production
        otpExpiresIn: 120,
        createdAt: new Date().toISOString(),
      },
    });
  },
);

// ── POST /api/game-portal/transactions/confirm ──
router.post(
  '/transactions/confirm',
  validate({
    txId:       { required: true },
    platformId: { required: true },
    type:       { required: true, enum: ['deposit', 'withdraw'] },
    currency:   { required: true, enum: ['VND', 'USDT'] },
    userId:     { required: true },
    username:   { required: true },
    amount:     { required: true, type: 'number', min: 1 },
    otp:        { required: true },
  }),
  async (req, res) => {
    const { txId, platformId, type, currency, userId, username, amount, otp } = req.body;

    const otpResult = verifyOTP(txId, otp);
    if (!otpResult.valid) return res.status(400).json({ success: false, message: otpResult.reason });

    const platform = PLATFORMS.find((p) => p.id === platformId);

    try {
      const tx = await addPlatformTx({
        id: txId,
        userId: req.user.id,
        platformId,
        platformName: platform?.name || platformId,
        type, currency, amount,
        userId2: userId,
        username,
        otp,
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      res.json({ success: true, data: tx });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// ── GET /api/game-portal/transactions ──
router.get('/transactions', async (req, res) => {
  try {
    const list = await getPlatformTxByUser(req.user.id);
    res.json({ success: true, data: list, total: list.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
