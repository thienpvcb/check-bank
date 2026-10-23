import { supabase, isDbReady } from './index.js';

// ── In-memory fallback ────────────────────────────────────────
const memBankAccounts = [
  {
    id: 'ba1',
    userId: 'u1',
    bankCode: 'VCB',
    bankName: 'Vietcombank',
    accountNumber: '1234567890',
    accountName: 'NGUYEN VAN DEMO',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];
const memProfiles = {};

// ── Row mapper: snake_case DB → camelCase JS ──────────────────
const fromDbAccount = (r) => ({
  id:            r.id,
  userId:        r.user_id,
  bankCode:      r.bank_code,
  bankName:      r.bank_name,
  accountNumber: r.account_number,
  accountName:   r.account_name,
  isDefault:     r.is_default,
  createdAt:     r.created_at,
});

// ── getBankAccounts ───────────────────────────────────────────
export const getBankAccounts = async (userId) => {
  if (!isDbReady()) {
    return memBankAccounts.filter((a) => a.userId === userId);
  }
  const { data, error } = await supabase
    .from('user_bank_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });
  if (error) return [];
  return (data ?? []).map(fromDbAccount);
};

// ── addBankAccount ────────────────────────────────────────────
export const addBankAccount = async ({
  userId, bankCode, bankName, accountNumber, accountName, isDefault = false,
}) => {
  if (!isDbReady()) {
    if (isDefault) {
      memBankAccounts
        .filter((a) => a.userId === userId)
        .forEach((a) => { a.isDefault = false; });
    }
    const acc = {
      id: `ba${Date.now()}`,
      userId,
      bankCode,
      bankName,
      accountNumber,
      accountName,
      isDefault,
      createdAt: new Date().toISOString(),
    };
    memBankAccounts.push(acc);
    return acc;
  }

  if (isDefault) {
    await supabase
      .from('user_bank_accounts')
      .update({ is_default: false })
      .eq('user_id', userId);
  }

  const { data, error } = await supabase
    .from('user_bank_accounts')
    .insert({
      user_id:        userId,
      bank_code:      bankCode,
      bank_name:      bankName,
      account_number: accountNumber,
      account_name:   accountName,
      is_default:     isDefault,
    })
    .select()
    .single();

  if (error) throw error;
  return fromDbAccount(data);
};

// ── deleteBankAccount ─────────────────────────────────────────
export const deleteBankAccount = async (id, userId) => {
  if (!isDbReady()) {
    const idx = memBankAccounts.findIndex((a) => a.id === id && a.userId === userId);
    if (idx === -1) return false;
    memBankAccounts.splice(idx, 1);
    return true;
  }
  const { error } = await supabase
    .from('user_bank_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  return !error;
};

// ── setDefaultBankAccount ─────────────────────────────────────
export const setDefaultBankAccount = async (id, userId) => {
  if (!isDbReady()) {
    memBankAccounts
      .filter((a) => a.userId === userId)
      .forEach((a) => { a.isDefault = a.id === id; });
    return true;
  }
  await supabase
    .from('user_bank_accounts')
    .update({ is_default: false })
    .eq('user_id', userId);
  await supabase
    .from('user_bank_accounts')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', userId);
  return true;
};

// ── updateProfile ─────────────────────────────────────────────
export const updateProfile = async (userId, { phone, fullNameEn, dob } = {}) => {
  if (!isDbReady()) {
    if (!memProfiles[userId]) memProfiles[userId] = {};
    if (phone      !== undefined) memProfiles[userId].phone      = phone;
    if (fullNameEn !== undefined) memProfiles[userId].fullNameEn = fullNameEn;
    if (dob        !== undefined) memProfiles[userId].dob        = dob;
    return memProfiles[userId];
  }

  const updates = {};
  if (phone      !== undefined) updates.phone        = phone;
  if (fullNameEn !== undefined) updates.full_name_en = fullNameEn;
  if (dob        !== undefined) updates.dob          = dob;
  if (Object.keys(updates).length === 0) return null;

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('id,phone,full_name_en,dob')
    .single();

  if (error) throw error;
  return { phone: data.phone, fullNameEn: data.full_name_en, dob: data.dob };
};
