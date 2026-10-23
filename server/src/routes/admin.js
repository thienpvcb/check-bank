import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { supabase, isDbReady } from '../db/index.js';
import { updateStatus, updateStatusWithReason, getById } from '../db/transactions.js';
import { addLog, getLogs } from '../db/auditLog.js';
import {
  safeUser, getAllUsers, findById, createUser,
  toggleUserActive, creditBalance, updateBalance,
} from '../db/users.js';

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

// ── Helper: get ALL transactions (admin sees everyone's) ──────
const getAllTransactions = async (filters = {}) => {
  if (!isDbReady()) {
    return [];
  }

  let q = supabase
    .from('transactions')
    .select(`
      *,
      users!transactions_user_id_fkey(username, full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (filters.status)  q = q.eq('status', filters.status);
  if (filters.type)    q = q.eq('type',   filters.type);
  if (filters.method)  q = q.eq('method', filters.method);
  if (filters.limit)   q = q.limit(Number(filters.limit));

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((r) => ({
    id:              r.id,
    userId:          r.user_id,
    username:        r.users?.username,
    userFullName:    r.users?.full_name,
    userEmail:       r.users?.email,
    type:            r.type,
    method:          r.method,
    amount:          Number(r.amount),
    currency:        r.currency,
    status:          r.status,
    cryptoAsset:     r.crypto_asset,
    network:         r.network,
    walletAddress:   r.wallet_address,
    txHash:          r.tx_hash,
    bankCode:        r.bank_code,
    bankName:        r.bank_name,
    accountNumber:   r.account_number,
    accountName:     r.account_name,
    transferContent: r.transfer_content,
    expiresAt:       r.expires_at,
    createdAt:       r.created_at,
    updatedAt:       r.updated_at,
  }));
};

// ── GET /api/admin/transactions ──────────────────────────────
router.get('/transactions', async (req, res) => {
  try {
    const { status, type, method, limit = 100 } = req.query;
    const list = await getAllTransactions({ status, type, method, limit });
    const stats = {
      total:     list.length,
      pending:   list.filter((t) => t.status === 'pending').length,
      completed: list.filter((t) => t.status === 'completed').length,
      failed:    list.filter((t) => t.status === 'failed').length,
    };
    res.json({ success: true, data: list, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/transactions/:id ─────────────────────────
router.get('/transactions/:id', async (req, res) => {
  try {
    const tx = await getById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    const logs = await getLogs({ txId: req.params.id });
    res.json({ success: true, data: { ...tx, auditLogs: logs } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/transactions/:id/approve ─────────────────
router.post('/transactions/:id/approve', async (req, res) => {
  try {
    const tx = await getById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Không thể duyệt giao dịch đang ở trạng thái: ${tx.status}` });
    }

    const { note } = req.body;
    const updated = await updateStatus(req.params.id, 'completed');

    // Nếu là DEPOSIT → cộng tiền vào tài khoản user sau khi duyệt
    if (tx.type === 'deposit') {
      const isVnd  = tx.method === 'bank';
      const delta  = Number(tx.amount);
      await updateBalance(
        tx.userId,
        isVnd  ? delta : 0,
        !isVnd ? delta : 0,
      );
    }
    // Nếu là WITHDRAW → tiền đã bị trừ khi tạo lệnh, không làm gì thêm

    await addLog({
      adminId:      req.user.id,
      adminName:    req.user.fullName || req.user.username,
      action:       'approve',
      txId:         req.params.id,
      reason:       note || null,
      beforeStatus: 'pending',
      afterStatus:  'completed',
    });

    res.json({ success: true, data: updated, message: 'Đã duyệt thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/transactions/:id/reject ─────────────────
router.post('/transactions/:id/reject', async (req, res) => {
  try {
    const tx = await getById(req.params.id);
    if (!tx) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    if (tx.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Không thể từ chối giao dịch đang ở trạng thái: ${tx.status}` });
    }

    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do từ chối' });
    }

    const updated = await updateStatusWithReason(req.params.id, 'failed', reason);

    // Nếu là WITHDRAW → hoàn tiền về tài khoản user
    if (tx.type === 'withdraw') {
      const isVnd = tx.method === 'bank';
      const delta = Number(tx.amount);
      await updateBalance(
        tx.userId,
        isVnd  ? delta : 0,
        !isVnd ? delta : 0,
      );
      console.log(`[ADMIN] Hoàn tiền ${tx.id}: +${delta} ${isVnd ? 'VND' : tx.currency} → user ${tx.userId}`);
    }

    await addLog({
      adminId:      req.user.id,
      adminName:    req.user.fullName || req.user.username,
      action:       'reject',
      txId:         req.params.id,
      reason,
      beforeStatus: 'pending',
      afterStatus:  'failed',
    });

    res.json({ success: true, data: updated, message: 'Đã từ chối giao dịch' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/audit-logs ────────────────────────────────
router.get('/audit-logs', async (req, res) => {
  try {
    const { txId, limit = 200 } = req.query;
    const logs = await getLogs({ txId, limit: Number(limit) });
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/stats ─────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.json({ success: true, data: { pending: 0, completed: 0, failed: 0, expired: 0 } });
    }

    const { data } = await supabase
      .from('transactions')
      .select('status', { count: 'exact', head: false });

    const counts = (data ?? []).reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        pending:   counts.pending   || 0,
        completed: counts.completed || 0,
        failed:    counts.failed    || 0,
        expired:   counts.expired   || 0,
        total:     (data ?? []).length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// USER MANAGEMENT ROUTES
// ══════════════════════════════════════════════════════════════

// ── GET /api/admin/users ─────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/users ─────────────────────────────────────
router.post('/users', async (req, res) => {
  try {
    const { username, password, fullName, email, role } = req.body;
    if (!username?.trim() || !password?.trim() || !fullName?.trim() || !email?.trim()) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }
    const user = await createUser({ username, password, fullName, email, role });
    res.status(201).json({ success: true, data: user, message: 'Đã tạo tài khoản thành công' });
  } catch (err) {
    const isUnique = err.code === '23505' || err.message?.includes('duplicate');
    res.status(isUnique ? 409 : 500).json({
      success: false,
      message: isUnique ? 'Username hoặc email đã tồn tại' : err.message,
    });
  }
});

// ── GET /api/admin/users/:id ──────────────────────────────────
router.get('/users/:id', async (req, res) => {
  try {
    const user = await findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });

    // Recent transactions for this user
    let recentTx = [];
    if (isDbReady()) {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', req.params.id)
        .order('created_at', { ascending: false })
        .limit(10);
      recentTx = data ?? [];
    }

    res.json({ success: true, data: { ...safeUser(user), recentTransactions: recentTx } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/users/:id/toggle ────────────────────────
router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const { isActive, reason } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive phải là boolean' });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Không thể tự vô hiệu hóa tài khoản của mình' });
    }

    const updated = await toggleUserActive(req.params.id, req.user.id, isActive);
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });

    // Log the action
    await addLog({
      adminId:   req.user.id,
      adminName: req.user.fullName || req.user.username,
      action:    isActive ? 'approve' : 'reject',
      txId:      `user-${req.params.id}`,
      reason:    reason || (isActive ? 'Kích hoạt tài khoản' : 'Vô hiệu hóa tài khoản'),
    }).catch(() => {}); // audit log failure should not block the response

    res.json({
      success: true,
      data: updated,
      message: isActive ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/users/:id/credit ─────────────────────────
router.post('/users/:id/credit', async (req, res) => {
  try {
    const { vndAmount = 0, usdtAmount = 0, note } = req.body;
    if (!note?.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập ghi chú' });
    }
    if (vndAmount === 0 && usdtAmount === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập số tiền cần điều chỉnh' });
    }

    const updated = await creditBalance(req.params.id, Number(vndAmount), Number(usdtAmount));
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });

    res.json({ success: true, data: updated, message: 'Đã cập nhật số dư thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
