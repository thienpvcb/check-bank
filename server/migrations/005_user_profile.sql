-- Add profile columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS full_name_en text,  -- tên tiếng anh (optional)
  ADD COLUMN IF NOT EXISTS dob date;           -- date of birth

-- Saved bank accounts table
CREATE TABLE IF NOT EXISTS user_bank_accounts (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references users(id) on delete cascade,
  bank_code      text not null,
  bank_name      text not null,
  account_number text not null,
  account_name   text not null,
  is_default     boolean not null default false,
  created_at     timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON user_bank_accounts(user_id);
