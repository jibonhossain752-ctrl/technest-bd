-- TechNest BD — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New query → Run

create extension if not exists pgcrypto;

-- Registered customers
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text not null default '',
  password_hash text not null,
  subscribed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Orders placed at checkout
create table if not exists public.orders (
  id text primary key,
  contact jsonb not null,
  items jsonb not null,
  total numeric(12, 2) not null,
  subscribed boolean not null default false,
  placed_at timestamptz not null default now(),
  status text not null default 'pending'
);

-- Marketing preference per contact
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  contact text not null,
  subscribed boolean not null,
  at timestamptz not null default now()
);

-- Contact form submissions
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null default '',
  message text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Analytics (Phase A+) — run the section below in the SQL editor
-- ============================================================

-- Raw tracking events (dashboards never read this directly)
create table if not exists public.analytics_events (
  id bigserial primary key,
  session_id text not null,
  user_id text,
  event text not null,
  page text not null default '',
  source text not null default 'direct',
  device text not null default 'unknown',
  os text,
  browser text,
  country text not null default 'unknown',
  city text not null default 'unknown',
  url text not null default '',
  ref_host text,
  utm_campaign text,
  utm_medium text,
  utm_source text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_created_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_session_idx on public.analytics_events (session_id);
create index if not exists analytics_events_event_idx on public.analytics_events (event);
create index if not exists analytics_events_page_idx on public.analytics_events (page);

-- Session processing (landing/exit, bounce, duration, realtime active window)
create table if not exists public.analytics_sessions (
  session_id text primary key,
  user_id text,
  source text not null default 'direct',
  device text not null default 'unknown',
  country text not null default 'unknown',
  city text not null default 'unknown',
  landing_page text not null default '',
  exit_page text not null default '',
  started_at timestamptz not null default now(),
  last_activity timestamptz not null default now(),
  ended_at timestamptz,
  page_views int not null default 1,
  interactions int not null default 0,
  duration_seconds int not null default 0
);
create index if not exists analytics_sessions_lastact_idx on public.analytics_sessions (last_activity desc);

-- Daily aggregation by source / device / country (dashboards read this)
create table if not exists public.analytics_daily (
  date date not null,
  source text not null default 'direct',
  device text not null default 'unknown',
  country text not null default 'unknown',
  visitors int not null default 0,
  unique_visitors int not null default 0,
  sessions int not null default 0,
  page_views int not null default 0,
  bounces int not null default 0,
  session_seconds int not null default 0,
  affiliate_clicks int not null default 0,
  add_to_cart int not null default 0,
  checkouts int not null default 0,
  newsletter_subscribes int not null default 0,
  newsletter_shown int not null default 0,
  primary key (date, source, device, country)
);

-- Daily per-page aggregation
create table if not exists public.analytics_pages_daily (
  date date not null,
  page text not null,
  views int not null default 0,
  unique_views int not null default 0,
  time_on_page_seconds int not null default 0,
  exits int not null default 0,
  referral_hits int not null default 0,
  primary key (date, page)
);

-- Scheduled daily report snapshots
create table if not exists public.analytics_reports (
  id bigserial primary key,
  date date not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
