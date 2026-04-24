-- Auth-backed babies + members + invites
-- Existing feeds/events rows (user_id = 'default' placeholder) will be wiped
-- because the baby_id/uploaded_by columns become required.

truncate table feeds;
truncate table events;

drop index if exists feeds_user_start_at_idx;
drop index if exists events_user_at_idx;

alter table feeds drop column user_id;
alter table feeds drop column baby_id;
alter table feeds add column baby_id uuid not null;
alter table feeds add column uploaded_by uuid references auth.users(id) on delete set null;

alter table events drop column user_id;
alter table events drop column baby_id;
alter table events add column baby_id uuid not null;
alter table events add column uploaded_by uuid references auth.users(id) on delete set null;

create table babies (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  birth_date       date not null,
  birth_weight_g   integer,
  birth_height_cm  numeric(4,1),
  created_by       uuid not null references auth.users(id) on delete cascade,
  created_at       timestamptz not null default now()
);

create table baby_members (
  baby_id    uuid not null references babies(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'member' check (role in ('owner','member')),
  joined_at  timestamptz not null default now(),
  primary key (baby_id, user_id)
);
create index baby_members_user_idx on baby_members (user_id);

create table baby_invites (
  code        text primary key,
  baby_id     uuid not null references babies(id) on delete cascade,
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz,
  revoked_at  timestamptz
);
create index baby_invites_baby_idx on baby_invites (baby_id);

alter table feeds
  add constraint feeds_baby_fk foreign key (baby_id) references babies(id) on delete cascade;
alter table events
  add constraint events_baby_fk foreign key (baby_id) references babies(id) on delete cascade;

create index feeds_baby_start_at_idx on feeds (baby_id, start_at desc);
create index events_baby_at_idx on events (baby_id, at desc);

-- RLS
alter table babies         enable row level security;
alter table baby_members   enable row level security;
alter table baby_invites   enable row level security;
alter table feeds          enable row level security;
alter table events         enable row level security;

-- babies
create policy "members read babies" on babies for select
  using (exists (
    select 1 from baby_members
    where baby_members.baby_id = babies.id and baby_members.user_id = auth.uid()
  ));
create policy "self creates baby" on babies for insert
  with check (created_by = auth.uid());
create policy "owner updates baby" on babies for update
  using (exists (
    select 1 from baby_members
    where baby_members.baby_id = babies.id
      and baby_members.user_id = auth.uid()
      and baby_members.role = 'owner'
  ));

-- baby_members (keep policy non-recursive — only see own rows)
create policy "read own membership" on baby_members for select
  using (user_id = auth.uid());
create policy "self joins baby" on baby_members for insert
  with check (user_id = auth.uid());
create policy "self leaves baby" on baby_members for delete
  using (user_id = auth.uid());

-- baby_invites
create policy "members read invites" on baby_invites for select
  using (exists (
    select 1 from baby_members
    where baby_members.baby_id = baby_invites.baby_id and baby_members.user_id = auth.uid()
  ));
create policy "members create invite" on baby_invites for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from baby_members
      where baby_members.baby_id = baby_invites.baby_id and baby_members.user_id = auth.uid()
    )
  );
create policy "members revoke invite" on baby_invites for update
  using (exists (
    select 1 from baby_members
    where baby_members.baby_id = baby_invites.baby_id and baby_members.user_id = auth.uid()
  ));

-- feeds
create policy "members read feeds" on feeds for select
  using (exists (
    select 1 from baby_members
    where baby_members.baby_id = feeds.baby_id and baby_members.user_id = auth.uid()
  ));
create policy "members write feeds" on feeds for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from baby_members
      where baby_members.baby_id = feeds.baby_id and baby_members.user_id = auth.uid()
    )
  );
create policy "members delete feeds" on feeds for delete
  using (exists (
    select 1 from baby_members
    where baby_members.baby_id = feeds.baby_id and baby_members.user_id = auth.uid()
  ));

-- events
create policy "members read events" on events for select
  using (exists (
    select 1 from baby_members
    where baby_members.baby_id = events.baby_id and baby_members.user_id = auth.uid()
  ));
create policy "members write events" on events for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from baby_members
      where baby_members.baby_id = events.baby_id and baby_members.user_id = auth.uid()
    )
  );
create policy "members delete events" on events for delete
  using (exists (
    select 1 from baby_members
    where baby_members.baby_id = events.baby_id and baby_members.user_id = auth.uid()
  ));
