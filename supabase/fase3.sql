-- RL Session Tracker fase 3 — doelen. Uitvoeren in Supabase: SQL Editor → New query → plakken → Run.

create table if not exists public.goals (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  kind text not null check (kind in ('training','winrate','rank','mmr')),
  config jsonb not null,
  created_at bigint not null,
  achieved_at bigint,
  archived_at bigint
);

create index if not exists goals_user_idx on public.goals (user_id);
alter table public.goals enable row level security;

drop policy if exists "eigen doelen" on public.goals;
create policy "eigen doelen" on public.goals for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'goals') then
    alter publication supabase_realtime add table public.goals;
  end if;
end $$;
