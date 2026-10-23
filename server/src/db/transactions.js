import { supabase, isDbReady } from './index.js';

// ── In-memory fallback ────────────────────────────────────────
const memTx = [
  { id: 'TXN001', userId: 'u1', type: 'deposit',  method: 'crypto', amount: 500,        currency: 'USDT', status: 'completed', createdAt: '2026-10-22T10:30:00Z', updatedAt: '2026-10-22T10:35:00Z', cryptoAsset: 'USDT', network: 'TRC20', walletAddress: 'TXqLKj8fJKj9dJKj8fJKj9dJKj8fJKj9d', txHash: '0x1234567890abcdef' },
  { id: 'TXN002', userId: 'u1', type: 'withdraw', method: 'bank',   amount: 5_000_000,  currency: 'VND',  status: 'pending',   createdAt: '2026-10-22T09:00:00Z', updatedAt: '2026-10-22T09:00:00Z', bankCode: 'VCB', bankName: 'Vietcombank', accountNumber: '1234567890', accountName: 'NGUYEN VAN A' },
  { id: 'TXN003', userId: 'u1', type: 'deposit',  method: 'bank',   amount: 10_000_000, currency: 'VND',  status: 'completed', createdAt: '2026-10-21T15:20:00Z', updatedAt: '2026-10-21T15:25:00Z', bankCode: 'TCB', bankName: 'Techcombank',  accountNumber: '9876543210', accountName: 'NGUYEN VAN A' },
];

// ── Row mapper ────────────────────────────────────────────────
const fromDb = (r) => ({
  id:              r.id,
  userId:          r.user_id,
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
  receiverAccount: r.receiver_account,
  receiverName:    r.receiver_name,
  createdAt:       r.created_at,
  updatedAt:       r.updated_at,
  expiresAt:       r.expires_at,
});

const toDb = (tx) => ({
  id:               tx.id,
  user_id:          tx.userId,
  type:             tx.type,
  method:           tx.method,
  amount:           tx.amount,
  currency:         tx.currency,
  status:           tx.status ?? 'pending',
  crypto_asset:     tx.cryptoAsset     ?? null,
  network:          tx.network          ?? null,
  wallet_address:   tx.walletAddress    ?? null,
  tx_hash:          tx.txHash           ?? null,
  bank_code:        tx.bankCode         ?? null,
  bank_name:        tx.bankName         ?? null,
  account_number:   tx.accountNumber    ?? null,
  account_name:     tx.accountName      ?? null,
  transfer_content: tx.transferContent  ?? null,
  receiver_account: tx.receiverAccount  ?? null,
  receiver_name:    tx.receiverName     ?? null,
  expires_at:       tx.expiresAt        ?? null,
});

// ── getByUser ──────────────────────────────────────────────────
export const getByUser = async (userId, filters = {}) => {
  if (!isDbReady()) {
    let list = memTx.filter((t) => t.userId === userId);
    if (filters.type)   list = list.filter((t) => t.type   === filters.type);
    if (filters.status) list = list.filter((t) => t.status === filters.status);
    if (filters.method) list = list.filter((t) => t.method === filters.method);
    return list;
  }

  let q = supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (filters.type)   q = q.eq('type',   filters.type);
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.method) q = q.eq('method', filters.method);
  if (filters.limit)  q = q.limit(Number(filters.limit));
  if (filters.offset) q = q.range(Number(filters.offset), Number(filters.offset) + Number(filters.limit || 50) - 1);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(fromDb);
};

// ── getById ────────────────────────────────────────────────────
export const getById = async (id) => {
  if (!isDbReady()) return memTx.find((t) => t.id === id) ?? null;

  const { data, error } = await supabase
    .from('transactions').select('*').eq('id', id).single();
  if (error) return null;
  return fromDb(data);
};

// ── addTransaction ──────────────────────────────────────────────
export const addTransaction = async (tx) => {
  if (!isDbReady()) {
    memTx.unshift(tx);
    return tx;
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert(toDb(tx))
    .select()
    .single();
  if (error) throw error;
  return fromDb(data);
};

// ── updateStatus ───────────────────────────────────────────────
export const updateStatus = async (id, status) => {
  if (!isDbReady()) {
    const tx = memTx.find((t) => t.id === id);
    if (!tx) return null;
    tx.status    = status;
    tx.updatedAt = new Date().toISOString();
    return tx;
  }

  const { data, error } = await supabase
    .from('transactions')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) return null;
  return fromDb(data);
};

// ── getPendingExpired — tìm giao dịch pending đã hết hạn ───────
export const getPendingExpired = async () => {
  const now = new Date().toISOString();
  if (!isDbReady()) {
    return memTx.filter(
      (t) => t.status === 'pending' && t.expiresAt && t.expiresAt < now
    );
  }
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('status', 'pending')
    .lt('expires_at', now);
  if (error) return [];
  return (data ?? []).map(fromDb);
};

// ── bulkUpdateStatus — cập nhật nhiều giao dịch cùng lúc ───────
export const bulkExpire = async (ids) => {
  if (!isDbReady()) {
    ids.forEach((id) => {
      const tx = memTx.find((t) => t.id === id);
      if (tx) { tx.status = 'expired'; tx.updatedAt = new Date().toISOString(); }
    });
    return;
  }
  await supabase
    .from('transactions')
    .update({ status: 'expired' })
    .in('id', ids);
};

// ── simulateConfirm — giả lập xác nhận giao dịch deposit ───────
export const getPendingDeposits = async () => {
  if (!isDbReady()) {
    return memTx.filter((t) => t.status === 'pending' && t.type === 'deposit');
  }
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('status', 'pending')
    .eq('type', 'deposit');
  return (data ?? []).map(fromDb);
};
