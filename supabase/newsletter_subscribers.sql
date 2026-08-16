-- Newsletter subscriber list (real emails for the admin panel)
-- Run this in Supabase Dashboard → SQL Editor → New query → Run

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  phone text not null default '',
  country text not null default '',
  city text not null default '',
  source text not null default 'section',
  created_at timestamptz not null default now()
);

create index if not exists newsletter_subscribers_created_idx
  on public.newsletter_subscribers (created_at desc);

create index if not exists newsletter_subscribers_email_idx
  on public.newsletter_subscribers (email);