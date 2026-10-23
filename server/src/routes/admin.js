import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { supabase, isDbReady } from '../db/index.js';
import { updateStatus, getById } from '../db/transactions.js';
import { addLog, getLogs } from '../db/auditLog.js';
import { safeUser } from '../db/users.js';

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

// ── Helper: get ALL transactions (admin sees everyone's) ──────
const getAllTransactions = async (filters = {}) => {
  if (!isDbReady()) {
    // fallback: import in-memory from transactions db
    const { getByUser } = await import('../db/transactions.js');
    // In mem mode just return demo transactions
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

    // Lấy audit log của tx này
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

    const updated = await updateStatus(req.params.id, 'failed');

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

export default router;
