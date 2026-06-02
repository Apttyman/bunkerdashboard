-- Bunker Desk — provenance audit trail
-- Run this once in your Supabase project's SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run).
--
-- Stores every provenance-stamped metric the platform fetches: an immutable,
-- timestamped record of what was shown and where it came from. Doubles as a
-- persisted history store so sparklines survive a live-source outage.

create table if not exists public.metric_snapshots (
  id           bigint generated always as identity primary key,
  symbol       text        not null,
  value        double precision,
  unit         text,
  source       text        not null,
  source_tier  smallint    not null,
  as_of        timestamptz,
  fetched_at   timestamptz not null default now(),
  freshness    text        not null,
  available    boolean     not null default true,
  derived      boolean     not null default false,
  inserted_at  timestamptz not null default now()
);

create index if not exists metric_snapshots_symbol_time_idx
  on public.metric_snapshots (symbol, fetched_at desc);

-- Row Level Security ----------------------------------------------------------
alter table public.metric_snapshots enable row level security;

-- This is non-sensitive market telemetry written by the app's server routes
-- using the PUBLISHABLE (anon) key, so we allow anon read + insert on THIS
-- table only. The append-only audit trail is never updated or deleted by the app.
--
-- PRODUCTION HARDENING (recommended): instead of anon insert, write from the
-- server with the SERVICE ROLE key and drop the anon insert policy below.

drop policy if exists "anon read snapshots"   on public.metric_snapshots;
drop policy if exists "anon insert snapshots" on public.metric_snapshots;

create policy "anon read snapshots"
  on public.metric_snapshots for select
  to anon, authenticated
  using (true);

create policy "anon insert snapshots"
  on public.metric_snapshots for insert
  to anon, authenticated
  with check (true);

-- Watchlist -------------------------------------------------------------------
-- A trader's saved symbols + morning-brief notes. With no auth wired yet, rows
-- are scoped by a client-generated device id (localStorage). For production,
-- replace device scoping with Supabase Auth and `auth.uid()` RLS predicates.

create table if not exists public.watchlist (
  id          bigint generated always as identity primary key,
  device      text        not null,
  symbol      text        not null,
  note        text        not null default '',
  created_at  timestamptz not null default now(),
  unique (device, symbol)
);

create index if not exists watchlist_device_idx on public.watchlist (device);

alter table public.watchlist enable row level security;

drop policy if exists "anon read watchlist"   on public.watchlist;
drop policy if exists "anon write watchlist"  on public.watchlist;
drop policy if exists "anon update watchlist" on public.watchlist;
drop policy if exists "anon delete watchlist" on public.watchlist;

create policy "anon read watchlist"   on public.watchlist for select using (true);
create policy "anon write watchlist"  on public.watchlist for insert with check (true);
create policy "anon update watchlist" on public.watchlist for update using (true) with check (true);
create policy "anon delete watchlist" on public.watchlist for delete using (true);
