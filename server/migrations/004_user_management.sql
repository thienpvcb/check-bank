-- ============================================================
-- Migration 004: User management — active/disable columns
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active   boolean    NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS disabled_at timestamptz,
  ADD COLUMN IF NOT EXISTS disabled_by uuid REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
