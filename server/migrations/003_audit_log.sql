-- ============================================================
-- Migration 003: Admin audit log
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id           uuid primary key default uuid_generate_v4(),
  admin_id     uuid not null references users(id),
  admin_name   text not null,
  action       text not null check (action in ('approve', 'reject', 'note')),
  tx_id        text not null references transactions(id),
  reason       text,
  before_status text,
  after_status  text,
  created_at   timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_audit_tx_id    ON audit_logs(tx_id);
CREATE INDEX IF NOT EXISTS idx_audit_admin    ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_created  ON audit_logs(created_at desc);
