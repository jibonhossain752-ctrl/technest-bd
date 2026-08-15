-- Search Console cache for the Admin Analytics dashboard.
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- The app reads this table only (never calls the Google API on page load);
-- the daily cron + manual "Refresh" button populate it.
-- Access: server-side service-role key only (same as the other analytics tables).

create table if not exists public.search_console_cache (
  id          text primary key,
  site_url    text not null default 'sc-domain:gadgeterea.com',
  fetched_at  timestamptz,
  totals      jsonb,
  trend       jsonb,
  queries     jsonb,
  pages       jsonb,
  sitemaps    jsonb,
  inspections jsonb,
  last_error  jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.search_console_cache enable row level security;

create policy "service_role_all_search_console_cache"
  on public.search_console_cache
  for all
  to service_role
  using (true)
  with check (true);
