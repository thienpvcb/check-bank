import { supabase, isDbReady } from './index.js';

// In-memory fallback
const memLogs = [];

const fromDb = (r) => ({
  id:           r.id,
  adminId:      r.admin_id,
  adminName:    r.admin_name,
  action:       r.action,
  txId:         r.tx_id,
  reason:       r.reason,
  beforeStatus: r.before_status,
  afterStatus:  r.after_status,
  createdAt:    r.created_at,
});

export const addLog = async ({ adminId, adminName, action, txId, reason, beforeStatus, afterStatus }) => {
  const log = { adminId, adminName, action, txId, reason, beforeStatus, afterStatus, createdAt: new Date().toISOString() };

  if (!isDbReady()) {
    memLogs.unshift({ id: `LOG_${Date.now()}`, ...log });
    return log;
  }

  const { data, error } = await supabase
    .from('audit_logs')
    .insert({
      admin_id:      adminId,
      admin_name:    adminName,
      action,
      tx_id:         txId,
      reason:        reason ?? null,
      before_status: beforeStatus ?? null,
      after_status:  afterStatus ?? null,
    })
    .select()
    .single();

  if (error) { console.error('[AUDIT]', error.message); return log; }
  return fromDb(data);
};

export const getLogs = async ({ txId, limit = 100 } = {}) => {
  if (!isDbReady()) {
    let list = [...memLogs];
    if (txId) list = list.filter((l) => l.txId === txId);
    return list.slice(0, limit);
  }

  let q = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (txId) q = q.eq('tx_id', txId);

  const { data, error } = await q;
  if (error) return [];
  return (data ?? []).map(fromDb);
};
