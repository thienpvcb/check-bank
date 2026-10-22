import bcrypt from 'bcryptjs';
import { supabase, isDbReady } from './index.js';

// ── In-memory fallback ────────────────────────────────────────
const hash = (p) => bcrypt.hashSync(p, 10);
const memUsers = [
  { id: 'u1', username: 'demo',  passwordHash: hash('demo123'),  fullName: 'Nguyễn Văn Demo',  email: 'demo@checkbank.vn',  balance: 12_500_000, balanceUsdt: 487.25,  avatar: 'ND', role: 'user',  createdAt: '2026-01-01T00:00:00Z' },
  { id: 'u2', username: 'admin', passwordHash: hash('admin123'), fullName: 'Admin CheckBank',  email: 'admin@checkbank.vn', balance: 99_000_000, balanceUsdt: 3_850,   avatar: 'AD', role: 'admin', createdAt: '2026-01-01T00:00:00Z' },
];

// ── Row mapper: snake_case DB → camelCase JS ──────────────────
const fromDb = (row) => row ? ({
  id:           row.id,
  username:     row.username,
  passwordHash: row.password_hash,
  fullName:     row.full_name,
  email:        row.email,
  balance:      Number(row.balance),
  balanceUsdt:  Number(row.balance_usdt),
  avatar:       row.avatar,
  role:         row.role,
  createdAt:    row.created_at,
}) : null;

export const safeUser = (u) => {
  if (!u) return null;
  const { passwordHash, password_hash, ...safe } = u;
  void passwordHash; void password_hash;
  return safe;
};

// ── findByUsername ─────────────────────────────────────────────
export const findByUsername = async (username) => {
  if (!isDbReady()) {
    return memUsers.find((u) => u.username === username) ?? null;
  }
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();
  if (error) return null;
  return fromDb(data);
};

// ── findById ───────────────────────────────────────────────────
export const findById = async (id) => {
  if (!isDbReady()) {
    return memUsers.find((u) => u.id === id) ?? null;
  }
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return fromDb(data);
};

// ── updateBalance ──────────────────────────────────────────────
export const updateBalance = async (userId, vndDelta = 0, usdtDelta = 0) => {
  if (!isDbReady()) {
    const u = memUsers.find((x) => x.id === userId);
    if (!u) return null;
    if (vndDelta)  u.balance     = Math.max(0, u.balance     + vndDelta);
    if (usdtDelta) u.balanceUsdt = Math.max(0, u.balanceUsdt + usdtDelta);
    return safeUser(u);
  }

  // Fetch current, then update (no RPC needed for simple delta)
  const { data: current } = await supabase
    .from('users').select('balance,balance_usdt').eq('id', userId).single();
  if (!current) return null;

  const newBalance     = Math.max(0, Number(current.balance)      + vndDelta);
  const newBalanceUsdt = Math.max(0, Number(current.balance_usdt) + usdtDelta);

  const { data, error } = await supabase
    .from('users')
    .update({ balance: newBalance, balance_usdt: newBalanceUsdt })
    .eq('id', userId)
    .select()
    .single();
  if (error) return null;
  return safeUser(fromDb(data));
};
