create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  email text not null,
  project text not null,
  budget text not null,
  message text not null,
  source_page text,
  ip_address text
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_email_phone_created_at_idx on public.leads (email, phone, created_at desc);

alter table public.leads enable row level security;

-- No anon/public policies are required.
-- The website posts to a Vercel API route, and that server route inserts with
-- SUPABASE_SERVICE_ROLE_KEY. The service role key is never exposed to browsers.