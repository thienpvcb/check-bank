import bcrypt from 'bcryptjs';
import { supabase, isDbReady } from './index.js';

// ── In-memory fallback ────────────────────────────────────────
const memLinks = [
  { id: 'link-001', userId: 'u1', platformId: 'gp-sun', platformName: 'SunWin', domain: 'sunwin.com', apiKeyHash: 'hashed', linkedAt: '2026-10-01T10:00:00Z', status: 'active' },
];
const memPlatformTx = [
  { id: 'PTX001', userId: 'u1', platformId: 'gp-sun', platformName: 'SunWin', type: 'deposit', currency: 'VND', amount: 500_000, gameUserId: 'sv_user_88991', gameUsername: 'player_demo01', otp: '482910', status: 'completed', createdAt: '2026-10-22T09:00:00Z', updatedAt: '2026-10-22T09:02:00Z' },
];

// OTP store: Map<txId, { otp, expiresAt }>
export const otpStore = new Map();

// ── Row mappers ───────────────────────────────────────────────
const linkFromDb = (r) => ({
  id:           r.id,
  userId:       r.user_id,
  platformId:   r.platform_id,
  platformName: r.platform_name,
  domain:       r.domain,
  apiKeyHash:   r.api_key_hash,
  linkedAt:     r.linked_at,
  status:       r.status,
});

const ptxFromDb = (r) => ({
  id:           r.id,
  userId:       r.user_id,
  platformId:   r.platform_id,
  platformName: r.platform_name,
  type:         r.type,
  currency:     r.currency,
  amount:       Number(r.amount),
  userId2:      r.game_user_id,
  username:     r.game_username,
  otp:          r.otp,
  status:       r.status,
  createdAt:    r.created_at,
  updatedAt:    r.updated_at,
});

// ── getLinkedByUser ────────────────────────────────────────────
export const getLinkedByUser = async (userId) => {
  if (!isDbReady()) return memLinks.filter((l) => l.userId === userId);

  const { data, error } = await supabase
    .from('linked_platforms').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map(linkFromDb);
};

// ── getLink ────────────────────────────────────────────────────
export const getLink = async (userId, platformId) => {
  if (!isDbReady())
    return memLinks.find((l) => l.userId === userId && l.platformId === platformId) ?? null;

  const { data } = await supabase
    .from('linked_platforms').select('*')
    .eq('user_id', userId).eq('platform_id', platformId).single();
  return data ? linkFromDb(data) : null;
};

// ── addLink ────────────────────────────────────────────────────
export const addLink = async (link) => {
  // Hash the API key before storing
  const apiKeyHash = bcrypt.hashSync(link.apiKey, 8);

  if (!isDbReady()) {
    const record = { ...link, apiKeyHash };
    memLinks.push(record);
    return record;
  }

  const { data, error } = await supabase
    .from('linked_platforms')
    .insert({
      id:            link.id,
      user_id:       link.userId,
      platform_id:   link.platformId,
      platform_name: link.platformName,
      domain:        link.domain,
      api_key_hash:  apiKeyHash,
      status:        'active',
    })
    .select().single();
  if (error) throw error;
  return linkFromDb(data);
};

// ── removeLink ─────────────────────────────────────────────────
export const removeLink = async (userId, platformId) => {
  if (!isDbReady()) {
    const idx = memLinks.findIndex((l) => l.userId === userId && l.platformId === platformId);
    if (idx === -1) return false;
    memLinks.splice(idx, 1);
    return true;
  }

  const { error } = await supabase
    .from('linked_platforms')
    .delete()
    .eq('user_id', userId)
    .eq('platform_id', platformId);
  return !error;
};

// ── getPlatformTxByUser ────────────────────────────────────────
export const getPlatformTxByUser = async (userId) => {
  if (!isDbReady()) return memPlatformTx.filter((t) => t.userId === userId);

  const { data, error } = await supabase
    .from('platform_transactions').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(ptxFromDb);
};

// ── addPlatformTx ──────────────────────────────────────────────
export const addPlatformTx = async (tx) => {
  if (!isDbReady()) {
    memPlatformTx.unshift(tx);
    return tx;
  }

  const { data, error } = await supabase
    .from('platform_transactions')
    .insert({
      id:            tx.id,
      user_id:       tx.userId,
      platform_id:   tx.platformId,
      platform_name: tx.platformName,
      type:          tx.type,
      currency:      tx.currency,
      amount:        tx.amount,
      game_user_id:  tx.userId2,
      game_username: tx.username,
      otp:           tx.otp,
      status:        tx.status ?? 'completed',
    })
    .select().single();
  if (error) throw error;
  return ptxFromDb(data);
};

// ── OTP helpers (always in-memory — short-lived) ───────────────
export const storeOTP = (txId, otp, ttlSeconds = 120) => {
  otpStore.set(txId, { otp, expiresAt: Date.now() + ttlSeconds * 1000 });
};

export const verifyOTP = (txId, otp) => {
  const entry = otpStore.get(txId);
  if (!entry) return { valid: false, reason: 'OTP không tồn tại' };
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(txId);
    return { valid: false, reason: 'OTP đã hết hạn' };
  }
  if (entry.otp !== otp) return { valid: false, reason: 'OTP không đúng' };
  otpStore.delete(txId);
  return { valid: true };
};
