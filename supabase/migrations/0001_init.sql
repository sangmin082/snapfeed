create extension if not exists "pgcrypto";

create table feeds (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  baby_id       text,
  start_at      timestamptz not null,
  end_at        timestamptz,
  volume_ml     int,
  feed_type     text check (feed_type in ('breast_direct','breast_pumped','formula')),
  notes         text,
  source_photo  text,
  created_at    timestamptz not null default now()
);
create index feeds_user_start_at_idx on feeds (user_id, start_at desc);

create table events (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  baby_id       text,
  event_type    text not null check (event_type in ('diaper_pee','diaper_poop','sleep','note')),
  at            timestamptz not null,
  end_at        timestamptz,
  details       jsonb,
  source_photo  text,
  created_at    timestamptz not null default now()
);
create index events_user_at_idx on events (user_id, at desc);
