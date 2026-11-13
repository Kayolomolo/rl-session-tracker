-- Tracker-profiel (Epic/Steam-naam) bij het profiel. Eén keer uitvoeren in de Supabase SQL Editor.
alter table public.profiles add column if not exists tracker jsonb null;
