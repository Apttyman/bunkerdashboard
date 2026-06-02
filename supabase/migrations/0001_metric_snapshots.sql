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
