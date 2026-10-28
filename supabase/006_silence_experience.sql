-- Vouch database update 6. Paste all of this into Supabase > SQL Editor and press Run, once.
-- Adds: an Experience score on reviews, and the ability to silence a friend.

-- Experience score (service, atmosphere, how it felt). Older reviews simply don't have one.
alter table public.reviews add column if not exists experience smallint;
alter table public.reviews drop constraint if exists reviews_experience_check;
alter table public.reviews add constraint reviews_experience_check check (experience is null or experience between 1 and 10);

-- Friends you've silenced. Private: only you can see or change your own list.
create table if not exists public.silenced (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  target uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, target)
);
alter table public.silenced enable row level security;
drop policy if exists "see my silenced list" on public.silenced;
drop policy if exists "silence someone" on public.silenced;
drop policy if exists "unsilence someone" on public.silenced;
create policy "see my silenced list" on public.silenced for select to authenticated using (user_id = auth.uid());
create policy "silence someone" on public.silenced for insert to authenticated with check (user_id = auth.uid());
create policy "unsilence someone" on public.silenced for delete to authenticated using (user_id = auth.uid());

grant select, insert, delete on public.silenced to authenticated;
