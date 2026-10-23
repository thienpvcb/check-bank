/**
 * Cron Jobs — chạy background tasks định kỳ
 * 1. Expire: scan pending → expired nếu quá hạn
 * 2. Simulate confirm: random confirm deposit pending (demo only)
 */
import {
  getPendingExpired, bulkExpire,
  getPendingDeposits, updateStatus,
} from '../db/transactions.js';

// ── Timeout config theo network/method ────────────────────────
const TIMEOUT_MINUTES = {
  // Crypto
  TRC20: 30,
  BEP20: 30,
  ERC20: 60,
  BTC:   90,
  // Bank
  bank:  60,
};

export const getTimeoutMs = (method, network) => {
  if (method === 'bank') return TIMEOUT_MINUTES.bank * 60 * 1000;
  const mins = TIMEOUT_MINUTES[network] ?? 60;
  return mins * 60 * 1000;
};

export const getTimeoutMinutes = (method, network) => {
  if (method === 'bank') return TIMEOUT_MINUTES.bank;
  return TIMEOUT_MINUTES[network] ?? 60;
};

// ── Job 1: Auto-expire pending giao dịch quá hạn ─────────────
const runExpireJob = async () => {
  try {
    const expired = await getPendingExpired();
    if (expired.length === 0) return;

    const ids = expired.map((t) => t.id);
    await bulkExpire(ids);
    console.log(`[CRON] Expired ${ids.length} transaction(s): ${ids.join(', ')}`);
  } catch (err) {
    console.error('[CRON] Expire job error:', err.message);
  }
};

// ── Job 2: Simulate confirm deposit (DEMO ONLY) ───────────────
// Sau 1–3 phút, random confirm 1 deposit pending
const runSimulateConfirmJob = async () => {
  try {
    const pending = await getPendingDeposits();
    if (pending.length === 0) return;

    // Chỉ confirm giao dịch đã pending > 1 phút và chưa hết hạn
    const now = Date.now();
    const candidates = pending.filter((t) => {
      const age = now - new Date(t.createdAt).getTime();
      const notExpired = !t.expiresAt || new Date(t.expiresAt).getTime() > now;
      return age > 60_000 && notExpired; // đã pending > 1 phút
    });

    if (candidates.length === 0) return;

    // Random confirm 1 giao dịch
    const tx = candidates[Math.floor(Math.random() * candidates.length)];
    await updateStatus(tx.id, 'completed');
    console.log(`[CRON] Simulated confirm: ${tx.id} (${tx.currency} ${tx.amount})`);
  } catch (err) {
    console.error('[CRON] Simulate confirm error:', err.message);
  }
};

// ── Start all cron jobs ───────────────────────────────────────
export const startCronJobs = () => {
  console.log('  ⏱️  Cron jobs started');
  console.log('     - Expire job:   every 2 minutes');
  console.log('     - Confirm job:  every 90 seconds (demo)');

  // Job 1: Expire — chạy mỗi 2 phút
  setInterval(runExpireJob, 2 * 60 * 1000);

  // Job 2: Simulate confirm — chạy mỗi 90 giây
  setInterval(runSimulateConfirmJob, 90 * 1000);

  // Chạy ngay lần đầu sau 5 giây
  setTimeout(runExpireJob, 5_000);
  setTimeout(runSimulateConfirmJob, 10_000);
};
