-- Vouch database update 4. Paste all of this into Supabase > SQL Editor and press Run, once.
-- Adds: website and social media links for places, a link on your own review,
-- and puts every place you've already rated onto your map.

-- Links for a place (website, Instagram, Facebook, TikTok...). Anyone signed in can add one.
create table if not exists public.place_links (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  kind text not null default 'Website' check (kind in ('Website', 'Instagram', 'Facebook', 'TikTok', 'X', 'Other')),
  url text not null check (url ~* '^https?://'),
  created_at timestamptz not null default now(),
  unique (place_id, url)
);
alter table public.place_links enable row level security;
create policy "anyone signed in reads place links" on public.place_links for select to authenticated using (true);
create policy "add place links" on public.place_links for insert to authenticated with check (user_id = auth.uid());
create policy "remove own place links" on public.place_links for delete to authenticated using (user_id = auth.uid());

-- A link on your own review, e.g. your Instagram post about it.
alter table public.reviews add column if not exists link text not null default '';
alter table public.reviews drop constraint if exists reviews_link_check;
alter table public.reviews add constraint reviews_link_check check (link = '' or link ~* '^https?://');

-- Places you've rated are on your map.
insert into public.saves (user_id, place_id)
select distinct user_id, place_id from public.reviews
on conflict do nothing;
