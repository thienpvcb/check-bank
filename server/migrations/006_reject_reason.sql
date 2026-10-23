-- ============================================================
-- Migration 006: thêm reject_reason vào transactions
-- ============================================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS reject_reason text;
