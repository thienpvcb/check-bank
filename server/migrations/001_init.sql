-- ============================================================
-- CheckBank — Initial Schema
-- Chạy file này trong Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Users ────────────────────────────────────────────────────
create table if not exists users (
  id              uuid primary key default uuid_generate_v4(),
  username        text unique not null,
  password_hash   text not null,
  full_name       text not null,
  email           text unique not null,
  balance         bigint not null default 0,        -- VND (stored as integer, ×1)
  balance_usdt    numeric(18,8) not null default 0, -- USDT
  avatar          text not null default '',
  role            text not null default 'user' check (role in ('user', 'admin')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- seed demo users (passwords pre-hashed with bcrypt rounds=10)
-- demo / demo123
-- admin / admin123
insert into users (id, username, password_hash, full_name, email, balance, balance_usdt, avatar, role)
values
  ('00000000-0000-0000-0000-000000000001',
   'demo', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'Nguyễn Văn Demo', 'demo@checkbank.vn', 12500000, 487.25, 'ND', 'user'),
  ('00000000-0000-0000-0000-000000000002',
   'admin', '$2a$10$wF.vKyVPfBhsv6mF9X/c.OTQAKLIlG7O2ywuOhJJ3PL6g7Gt6.G7G',
   'Admin CheckBank', 'admin@checkbank.vn', 99000000, 3850.00, 'AD', 'admin')
on conflict (username) do nothing;

-- ── Transactions ─────────────────────────────────────────────
create table if not exists transactions (
  id              text primary key,   -- TXNxxxxxxxx
  user_id         uuid not null references users(id) on delete cascade,
  type            text not null check (type in ('deposit', 'withdraw')),
  method          text not null check (method in ('crypto', 'bank')),
  amount          numeric(18,8) not null,
  currency        text not null,
  status          text not null default 'pending'
                    check (status in ('pending', 'completed', 'failed', 'cancelled')),
  -- crypto fields
  crypto_asset    text,
  network         text,
  wallet_address  text,
  tx_hash         text,
  -- bank fields
  bank_code       text,
  bank_name       text,
  account_number  text,
  account_name    text,
  transfer_content text,
  receiver_account text,
  receiver_name    text,
  -- timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_transactions_user_id  on transactions(user_id);
create index if not exists idx_transactions_status   on transactions(status);
create index if not exists idx_transactions_created  on transactions(created_at desc);

-- ── Payment gateways ─────────────────────────────────────────
create table if not exists payment_gateways (
  id                  text primary key,
  name                text not null,
  type                text not null check (type in ('crypto', 'bank')),
  status              text not null default 'online'
                        check (status in ('online', 'offline', 'maintenance')),
  description         text,
  avg_processing_time text,
  network             text,
  bank_code           text,
  updated_at          timestamptz not null default now()
);

insert into payment_gateways values
  ('crypto-trc20','USDT TRC20',   'crypto','online',     'Nạp/Rút USDT qua mạng TRON',        '1-5 phút',  'TRC20',null),
  ('crypto-erc20','USDT/ETH ERC20','crypto','online',    'Nạp/Rút USDT, ETH qua Ethereum',     '5-30 phút', 'ERC20',null),
  ('crypto-bep20','USDT/BNB BEP20','crypto','online',    'Nạp/Rút USDT, BNB qua BSC',          '1-5 phút',  'BEP20',null),
  ('crypto-btc',  'Bitcoin',       'crypto','maintenance','Nạp/Rút Bitcoin',                    '30-60 phút','BTC',  null),
  ('bank-vcb',    'Vietcombank',   'bank',  'online',    'Nạp/Rút qua Vietcombank',            '5-15 phút', null,'VCB'),
  ('bank-tcb',    'Techcombank',   'bank',  'online',    'Nạp/Rút qua Techcombank',            '1-10 phút', null,'TCB'),
  ('bank-mb',     'MB Bank',       'bank',  'online',    'Nạp/Rút qua MB Bank',                '1-10 phút', null,'MB'),
  ('bank-acb',    'ACB',           'bank',  'offline',   'Đang bảo trì',                       'N/A',       null,'ACB'),
  ('bank-vpb',    'VPBank',        'bank',  'online',    'Nạp/Rút qua VPBank',                 '5-15 phút', null,'VPB'),
  ('bank-bidv',   'BIDV',          'bank',  'online',    'Nạp/Rút qua BIDV',                   '10-30 phút',null,'BIDV'),
  ('bank-pvcom',  'PVcomBank',     'bank',  'online',    'Nạp/Rút qua PVcomBank',              '5-20 phút', null,'PVCOM')
on conflict (id) do nothing;

-- ── Game platforms (nhà cái) ──────────────────────────────────
create table if not exists game_platforms (
  id                text primary key,
  name              text not null,
  domain            text not null,
  logo              text,
  currency          text[] not null default '{"VND","USDT"}',
  is_active         boolean not null default true,
  description       text,
  min_deposit       bigint not null default 0,
  min_withdraw      bigint not null default 0,
  min_deposit_usdt  numeric(18,2) not null default 1000,
  min_withdraw_usdt numeric(18,2) not null default 1000
);

insert into game_platforms values
  ('gp-sun','SunWin',  'sunwin.com','https://api.dicebear.com/7.x/initials/svg?seed=SW&backgroundColor=f59e0b&textColor=ffffff','{"VND","USDT"}',true,'Cổng game bài & slot phổ biến',50000,100000,1000,1000),
  ('gp-hit','Hit Club','hit.club',  'https://api.dicebear.com/7.x/initials/svg?seed=HC&backgroundColor=ef4444&textColor=ffffff','{"VND","USDT"}',true,'Game bài đổi thưởng uy tín',  50000,100000,1000,1000),
  ('gp-rio','Rio66',   'rio66.com', 'https://api.dicebear.com/7.x/initials/svg?seed=R6&backgroundColor=7c3aed&textColor=ffffff','{"VND","USDT"}',true,'Casino online & thể thao',    100000,200000,1000,1000),
  ('gp-sv', 'SV388',  'sv388.com', 'https://api.dicebear.com/7.x/initials/svg?seed=SV&backgroundColor=16a34a&textColor=ffffff','{"VND"}',       true,'Đá gà & cá cược thể thao',   100000,200000,1000,1000),
  ('gp-j88','J88',    'j88.io',    'https://api.dicebear.com/7.x/initials/svg?seed=J8&backgroundColor=0891b2&textColor=ffffff','{"VND","USDT"}',false,'Slot game & nổ hũ',         50000,100000,1000,1000)
on conflict (id) do nothing;

-- ── Linked platforms (per user) ───────────────────────────────
create table if not exists linked_platforms (
  id            text primary key,
  user_id       uuid not null references users(id) on delete cascade,
  platform_id   text not null references game_platforms(id),
  platform_name text not null,
  domain        text not null,
  api_key_hash  text not null,  -- store hashed, return masked
  linked_at     timestamptz not null default now(),
  status        text not null default 'active' check (status in ('active','inactive')),
  unique (user_id, platform_id)
);

-- ── Platform transactions ──────────────────────────────────────
create table if not exists platform_transactions (
  id              text primary key,
  user_id         uuid not null references users(id) on delete cascade,
  platform_id     text not null references game_platforms(id),
  platform_name   text not null,
  type            text not null check (type in ('deposit','withdraw')),
  currency        text not null check (currency in ('VND','USDT')),
  amount          numeric(18,8) not null,
  game_user_id    text not null,
  game_username   text not null,
  otp             text not null,
  status          text not null default 'pending'
                    check (status in ('pending','completed','failed')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_ptx_user_id   on platform_transactions(user_id);
create index if not exists idx_ptx_platform  on platform_transactions(platform_id);

-- ── Auto-update updated_at ────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_users_updated_at') then
    create trigger trg_users_updated_at before update on users
      for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_transactions_updated_at') then
    create trigger trg_transactions_updated_at before update on transactions
      for each row execute function set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_ptx_updated_at') then
    create trigger trg_ptx_updated_at before update on platform_transactions
      for each row execute function set_updated_at();
  end if;
end $$;

-- ── Row Level Security (optional — backend dùng service_role nên bypass) ──
alter table users               enable row level security;
alter table transactions        enable row level security;
alter table linked_platforms    enable row level security;
alter table platform_transactions enable row level security;

-- service_role bypasses RLS automatically
