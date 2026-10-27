-- Vouch database update 3. Paste all of this into Supabase > SQL Editor and press Run, once.
-- Adds: sub-categories (and Drink, Parking, Explore), first / last / nickname, and general tips.
-- Supabase will warn about "destructive operations" and an UPDATE without WHERE: both are expected.
-- Existing places, reviews and names are kept and moved into the new layout.

-- ---------- Categories and sub-categories ----------
alter table public.places add column if not exists subcategory text not null default '';
alter table public.places drop constraint if exists places_category_check;
update public.places set category = 'drink', subcategory = 'coffee' where category = 'coffee';
update public.places set category = 'explore' where category = 'do';
update public.places set subcategory = 'restaurant' where category = 'eat' and subcategory = '';
alter table public.places add constraint places_category_check
  check (category in ('eat', 'drink', 'stay', 'shop', 'fuel', 'ev', 'parking', 'work', 'explore'));

-- "Best ever" is now per sub-category where there is one (best coffee shop, best pub, ...).
update public.best b set category = coalesce(nullif(p.subcategory, ''), p.category)
from public.places p where p.id = b.place_id;

-- ---------- Tips: add general tips ----------
alter table public.tips drop constraint if exists tips_kind_check;
alter table public.tips alter column kind set default 'General tip';
alter table public.tips add constraint tips_kind_check
  check (kind in ('General tip', 'Hidden value', 'Loyalty', 'Where to look'));

-- ---------- Names: first, last and nickname ----------
alter table public.profiles add column if not exists first_name text not null default '';
alter table public.profiles add column if not exists last_name text not null default '';
alter table public.profiles add column if not exists nickname text not null default '';
update public.profiles set
  first_name = split_part(trim(name), ' ', 1),
  last_name = trim(substr(trim(name), length(split_part(trim(name), ' ', 1)) + 1))
where first_name = '' and name <> '';

alter table public.profiles drop constraint if exists profiles_show_as_2_check;
alter table public.profiles add constraint profiles_show_as_2_check check (show_as_2 in ('full', 'first', 'nick', 'anon'));
alter table public.profiles drop constraint if exists profiles_show_as_3_check;
alter table public.profiles add constraint profiles_show_as_3_check check (show_as_3 in ('first', 'nick', 'anon'));

-- Names as each viewer may see them. Friends see the full name and nickname;
-- everyone else sees what that person chose in their privacy settings.
drop function if exists public.people(uuid[]);
create function public.people(ids uuid[])
returns table (id uuid, display_name text, nickname text, style text, home text, degree int, is_public boolean, follows_me boolean, i_follow boolean)
language sql stable security definer set search_path = public as $$
  select p.id,
    case m.mode
      when 'full' then coalesce(nullif(trim(p.first_name || ' ' || p.last_name), ''), p.name)
      when 'first' then coalesce(nullif(p.first_name, ''), split_part(p.name, ' ', 1))
      when 'nick' then coalesce(nullif(p.nickname, ''), nullif(p.first_name, ''), split_part(p.name, ' ', 1))
      else ''
    end,
    case when m.mode = 'full' then p.nickname else '' end,
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
  cross join lateral (select case
      when d.deg <= 1 or fm.v then 'full'
      when fi.v and p.share_degree < 4 then 'first'
      when d.deg = 2 then p.show_as_2
      else p.show_as_3
    end as mode) m
  where p.id = any(ids) and (d.deg is not null or p.share_degree = 4 or fm.v or fi.v)
$$;
revoke execute on function public.people(uuid[]) from public, anon;
grant execute on function public.people(uuid[]) to authenticated;
