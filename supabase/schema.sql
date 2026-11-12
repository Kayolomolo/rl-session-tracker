-- RL Session Tracker — databaseschema. Uitvoeren in Supabase: SQL Editor → New query → plakken → Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 40),
  ranks jsonb not null default '{}',
  ask_mmr boolean not null default false,
  idle_minutes int not null default 45 check (idle_minutes between 5 and 240),
  last_mode text not null default '2v2' check (last_mode in ('1v1','2v2','3v3')),
  custom_activities jsonb not null default '{"warmup":[],"training":[]}',
  created_at bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create table if not exists public.sessions (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  started_at bigint not null,
  ended_at bigint,
  last_activity_at bigint not null
);

create table if not exists public.matches (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  session_id uuid not null references public.sessions on delete cascade,
  mode text not null check (mode in ('1v1','2v2','3v3')),
  result text not null check (result in ('win','loss')),
  rank text,
  mmr int,
  played_at bigint not null
);

create table if not exists public.activities (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  session_id uuid not null references public.sessions on delete cascade,
  kind text not null check (kind in ('warmup','training')),
  type text not null check (char_length(type) between 1 and 60),
  started_at bigint not null,
  ended_at bigint,
  note text check (char_length(note) <= 500)
);

create index if not exists sessions_user_idx on public.sessions (user_id);
create index if not exists matches_session_idx on public.matches (session_id);
create index if not exists matches_user_idx on public.matches (user_id);
create index if not exists activities_session_idx on public.activities (session_id);
create index if not exists activities_user_idx on public.activities (user_id);

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.matches enable row level security;
alter table public.activities enable row level security;

drop policy if exists "eigen profiel" on public.profiles;
create policy "eigen profiel" on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
drop policy if exists "eigen sessies" on public.sessions;
create policy "eigen sessies" on public.sessions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "eigen wedstrijden" on public.matches;
create policy "eigen wedstrijden" on public.matches for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (select 1 from public.sessions s where s.id = session_id and s.user_id = (select auth.uid())));
drop policy if exists "eigen activiteiten" on public.activities;
create policy "eigen activiteiten" on public.activities for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (select 1 from public.sessions s where s.id = session_id and s.user_id = (select auth.uid())));

-- Realtime: andere apparaten krijgen een seintje bij wijzigingen.
do $$
declare t text;
begin
  foreach t in array array['profiles','sessions','matches','activities'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
