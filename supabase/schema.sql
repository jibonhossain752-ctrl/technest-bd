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
