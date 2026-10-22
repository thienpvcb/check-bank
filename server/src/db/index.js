import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

// ── 1. postgres.js — dùng cho raw SQL queries (transaction, complex joins) ──
//    Dùng Transaction pooler URL (port 6543) từ Supabase Connect panel
let sql;

if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[YOUR-PASSWORD]')) {
  sql = postgres(process.env.DATABASE_URL, {
    max: 5,               // Direct connection: giữ pool nhỏ (Supabase free = 20 connections)
    idle_timeout: 20,     // đóng idle sau 20s
    connect_timeout: 10,
    ssl: 'require',       // Supabase yêu cầu SSL
  });
  console.log('  🗄️  PostgreSQL connected → Supabase Direct (port 5432)');
} else {
  console.warn('  ⚠️  DATABASE_URL chưa được cấu hình → dùng in-memory fallback');
  sql = null;
}

// ── 2. Supabase client — dùng service_role để bypass RLS ──
let supabase;

if (
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  !process.env.SUPABASE_URL.includes('[YOUR-PROJECT-REF]')
) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  console.log('  🔌  Supabase client ready');
} else {
  console.warn('  ⚠️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình');
  supabase = null;
}

export { sql, supabase };

// Helper: check DB availability
export const isDbReady = () => sql !== null && supabase !== null;
