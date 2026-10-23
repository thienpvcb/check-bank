import bcrypt from 'bcryptjs';
import { supabase, isDbReady } from './index.js';

// ── In-memory fallback ────────────────────────────────────────
const hash = (p) => bcrypt.hashSync(p, 10);
const memUsers = [
  { id: 'u1', username: 'demo',  passwordHash: hash('demo123'),  fullName: 'Nguyễn Văn Demo',  email: 'demo@checkbank.vn',  balance: 12_500_000, balanceUsdt: 487.25,  avatar: 'ND', role: 'user',  isActive: true, disabledAt: null, disabledBy: null, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'u2', username: 'admin', passwordHash: hash('admin123'), fullName: 'Admin CheckBank',  email: 'admin@checkbank.vn', balance: 99_000_000, balanceUsdt: 3_850,   avatar: 'AD', role: 'admin', isActive: true, disabledAt: null, disabledBy: null, createdAt: '2026-01-01T00:00:00Z' },
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
  isActive:     row.is_active  !== undefined ? row.is_active  : true,
  disabledAt:   row.disabled_at ?? null,
  disabledBy:   row.disabled_by ?? null,
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

// ── getAllUsers ────────────────────────────────────────────────
export const getAllUsers = async () => {
  if (!isDbReady()) {
    return memUsers.map(safeUser);
  }
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => safeUser(fromDb(row)));
};

// ── createUser ─────────────────────────────────────────────────
export const createUser = async ({ username, password, fullName, email, role = 'user' }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const avatar = (fullName ?? username)
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('');

  if (!isDbReady()) {
    const newUser = {
      id:           `u${Date.now()}`,
      username,
      passwordHash,
      fullName,
      email,
      balance:      0,
      balanceUsdt:  0,
      avatar,
      role,
      isActive:     true,
      disabledAt:   null,
      disabledBy:   null,
      createdAt:    new Date().toISOString(),
    };
    memUsers.push(newUser);
    return safeUser(newUser);
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      username,
      password_hash: passwordHash,
      full_name:     fullName,
      email,
      avatar,
      role,
      balance:       0,
      balance_usdt:  0,
      is_active:     true,
    })
    .select()
    .single();
  if (error) throw error;
  return safeUser(fromDb(data));
};

// ── toggleUserActive ───────────────────────────────────────────
export const toggleUserActive = async (userId, adminId, isActive) => {
  if (!isDbReady()) {
    const u = memUsers.find((x) => x.id === userId);
    if (!u) return null;
    u.isActive   = isActive;
    u.disabledAt = isActive ? null : new Date().toISOString();
    u.disabledBy = isActive ? null : adminId;
    return safeUser(u);
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      is_active:   isActive,
      disabled_at: isActive ? null : new Date().toISOString(),
      disabled_by: isActive ? null : adminId,
    })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return safeUser(fromDb(data));
};

// ── creditBalance ─────────────────────────────────────────────
export const creditBalance = async (userId, vndDelta = 0, usdtDelta = 0) => {
  if (!isDbReady()) {
    const u = memUsers.find((x) => x.id === userId);
    if (!u) return null;
    if (vndDelta)  u.balance     = Math.max(0, u.balance     + vndDelta);
    if (usdtDelta) u.balanceUsdt = Math.max(0, u.balanceUsdt + usdtDelta);
    return safeUser(u);
  }

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
  if (error) throw error;
  return safeUser(fromDb(data));
};

// ── updateBalance (kept for existing routes) ──────────────────
export const updateBalance = async (userId, vndDelta = 0, usdtDelta = 0) => {
  return creditBalance(userId, vndDelta, usdtDelta);
};
