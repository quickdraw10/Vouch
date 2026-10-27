-- Vouch database update 2. Paste all of this into Supabase > SQL Editor and press Run, once.
-- Adds: public reviews, one-way follows (friends = both follow each other), invite links,
-- "add to my map", review edit times, and editing or removing a place you added.

-- ---------- Public sharing: share_degree 4 means "everyone" ----------
alter table public.profiles drop constraint if exists profiles_share_degree_check;
alter table public.profiles add constraint profiles_share_degree_check check (share_degree between 1 and 4);
alter table public.profiles drop constraint if exists profiles_see_degree_check;
alter table public.profiles add constraint profiles_see_degree_check check (see_degree between 1 and 4);

-- ---------- Friends are people who follow each other ----------
create or replace function public.degree_between(a uuid, b uuid) returns int
language sql stable security definer set search_path = public as $$
  with m as (
    select f.user_id, f.friend_id from friends f
    join friends g on g.user_id = f.friend_id and g.friend_id = f.user_id
  )
  select case
    when a = b then 0
    when exists (select 1 from m where user_id = a and friend_id = b) then 1
    when exists (select 1 from m m1 join m m2 on m2.user_id = m1.friend_id
                 where m1.user_id = a and m2.friend_id = b) then 2
    when exists (select 1 from m m1 join m m2 on m2.user_id = m1.friend_id
                 join m m3 on m3.user_id = m2.friend_id
                 where m1.user_id = a and m3.friend_id = b) then 3
  end
$$;

-- Visible if the author shares with everyone, or the viewer is close enough.
create or replace function public.can_see(author uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select p.share_degree = 4 from profiles p where p.id = author)
    or public.degree_between(auth.uid(), author) <= (select share_degree from profiles where id = author),
    false)
$$;

drop function if exists public.people(uuid[]);
create function public.people(ids uuid[])
returns table (id uuid, display_name text, style text, home text, degree int, is_public boolean, follows_me boolean, i_follow boolean)
language sql stable security definer set search_path = public as $$
  select p.id,
    case
      when d.deg <= 1 or fm.v then p.name
      -- You added them with their friend code (they aren't public, so that's the only way): show their first name.
      when fi.v and p.share_degree < 4 then split_part(p.name, ' ', 1)
      when d.deg = 2 and p.show_as_2 = 'full' then p.name
      when d.deg = 2 and p.show_as_2 = 'first' then split_part(p.name, ' ', 1)
      when (d.deg = 3 or d.deg is null) and p.show_as_3 = 'first' then split_part(p.name, ' ', 1)
      else ''
    end,
    p.style,
    case when d.deg <= 1 then p.home else '' end,
    coalesce(d.deg, 9),
    p.share_degree = 4,
    fm.v,
    fi.v
  from profiles p
  cross join lateral (select public.degree_between(auth.uid(), p.id) as deg) d
  cross join lateral (select exists (select 1 from friends where user_id = p.id and friend_id = auth.uid()) as v) fm
  cross join lateral (select exists (select 1 from friends where user_id = auth.uid() and friend_id = p.id) as v) fi
  where p.id = any(ids) and (d.deg is not null or p.share_degree = 4 or fm.v or fi.v)
$$;

-- Adding someone by their friend code follows them. You become friends when they add you back.
create or replace function public.add_friend(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare other uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select id into other from profiles where invite_code = upper(trim(code));
  if other is null then raise exception 'No one has that friend code'; end if;
  if other = auth.uid() then raise exception 'That is your own friend code'; end if;
  insert into friends (user_id, friend_id) values (auth.uid(), other) on conflict do nothing;
  return other;
end $$;

-- An invite link is the sender's permission, so it makes you friends both ways straight away.
create or replace function public.accept_invite(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare other uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select id into other from profiles where invite_code = upper(trim(code));
  if other is null then raise exception 'That invite link is not valid'; end if;
  if other = auth.uid() then return other; end if;
  insert into friends (user_id, friend_id) values (auth.uid(), other), (other, auth.uid()) on conflict do nothing;
  return other;
end $$;

revoke execute on function public.people(uuid[]) from public, anon;
revoke execute on function public.accept_invite(text) from public, anon;
grant execute on function public.people(uuid[]) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;

-- You can see who follows you, follow people yourself, and unfollow.
create policy "see who follows me" on public.friends for select to authenticated using (friend_id = auth.uid());
create policy "follow people" on public.friends for insert to authenticated with check (user_id = auth.uid() and friend_id <> auth.uid());
create policy "unfollow" on public.friends for delete to authenticated using (user_id = auth.uid());

-- ---------- Add to my map ----------
create table if not exists public.saves (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  place_id uuid not null references public.places on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);
alter table public.saves enable row level security;
create policy "own saves" on public.saves for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- When a review was last edited ----------
alter table public.reviews add column if not exists updated_at timestamptz not null default now();
update public.reviews set updated_at = created_at;
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists reviews_touch on public.reviews;
create trigger reviews_touch before update on public.reviews for each row execute function public.touch_updated_at();

-- ---------- Fix or remove a place you added ----------
create policy "edit own places" on public.places for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());

-- Removes a place you added, but only if nobody else has rated it.
create or replace function public.delete_place_if_unused(pid uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  delete from places p where p.id = pid and p.created_by = auth.uid()
    and not exists (select 1 from reviews r where r.place_id = pid and r.user_id <> auth.uid());
  return found;
end $$;
revoke execute on function public.delete_place_if_unused(uuid) from public, anon;
grant execute on function public.delete_place_if_unused(uuid) to authenticated;
