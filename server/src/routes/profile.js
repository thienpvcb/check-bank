import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getBankAccounts, addBankAccount, deleteBankAccount,
  setDefaultBankAccount, updateProfile,
} from '../db/userProfile.js';
import { findById, safeUser } from '../db/users.js';

const router = Router();
router.use(authenticate);

// ── GET /api/profile — get my profile + bank accounts ────────
router.get('/', async (req, res) => {
  try {
    const user         = await findById(req.user.id);
    const bankAccounts = await getBankAccounts(req.user.id);
    res.json({ success: true, data: { ...safeUser(user), bankAccounts } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/profile — update profile info ─────────────────
router.patch('/', async (req, res) => {
  try {
    const { phone, fullNameEn, dob } = req.body;
    const updated = await updateProfile(req.user.id, { phone, fullNameEn, dob });
    res.json({ success: true, data: updated, message: 'Đã cập nhật thông tin' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/profile/banks — get my saved bank accounts ──────
router.get('/banks', async (req, res) => {
  try {
    const accounts = await getBankAccounts(req.user.id);
    res.json({ success: true, data: accounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/profile/banks — add bank account ───────────────
router.post('/banks', async (req, res) => {
  try {
    const { bankCode, bankName, accountNumber, accountName, isDefault } = req.body;
    if (!bankCode || !accountNumber || !accountName) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin tài khoản' });
    }
    const account = await addBankAccount({
      userId: req.user.id,
      bankCode,
      bankName,
      accountNumber,
      accountName,
      isDefault,
    });
    res.status(201).json({ success: true, data: account });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/profile/banks/:id — delete bank account ──────
router.delete('/banks/:id', async (req, res) => {
  try {
    const ok = await deleteBankAccount(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, message: 'Đã xóa tài khoản ngân hàng' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/profile/banks/:id/default — set as default ────
router.patch('/banks/:id/default', async (req, res) => {
  try {
    await setDefaultBankAccount(req.params.id, req.user.id);
    res.json({ success: true, message: 'Đã đặt làm tài khoản mặc định' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
