-- ============================================================
-- Migration 002: thêm expires_at và expired status
-- ============================================================

-- Thêm cột expires_at vào transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  DROP CONSTRAINT IF EXISTS transactions_status_check;

-- Cập nhật lại constraint status có thêm 'expired'
ALTER TABLE transactions
  ADD CONSTRAINT transactions_status_check
  CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'expired'));

-- Index để cron job tìm nhanh giao dịch pending hết hạn
CREATE INDEX IF NOT EXISTS idx_transactions_expires
  ON transactions(expires_at)
  WHERE status = 'pending';
