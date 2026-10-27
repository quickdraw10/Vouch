-- Vouch test database. Paste all of this into Supabase > SQL Editor and press Run.
-- Safe to run once on a new project.

-- ---------- Tables ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  home text not null default '',
  bio text not null default '',
  style text not null default '',
  theme text not null default 'navy-gold',
  invite_code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  see_degree int not null default 1 check (see_degree between 1 and 3),
  share_degree int not null default 2 check (share_degree between 1 and 3),
  show_as_2 text not null default 'first' check (show_as_2 in ('full', 'first', 'anon')),
  show_as_3 text not null default 'anon' check (show_as_3 in ('first', 'anon')),
  created_at timestamptz not null default now()
);

create table public.friends (
  user_id uuid not null references public.profiles on delete cascade,
  friend_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('eat', 'coffee', 'stay', 'shop', 'fuel', 'ev', 'work', 'do')),
  lat double precision not null,
  lng double precision not null,
  address text not null default '',
  independent boolean not null default false,
  osm_id text unique,
  created_by uuid default auth.uid() references public.profiles on delete set null,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  quality int not null check (quality between 1 and 10),
  value int not null check (value between 1 and 10),
  location int not null check (location between 1 and 10),
  trip text not null default 'Leisure' check (trip in ('Work', 'Leisure')),
  body text not null default '',
  visibility text not null default 'circle' check (visibility in ('circle', 'me')),
  visited_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (place_id, user_id)
);

create table public.notes (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  place_id uuid not null references public.places on delete cascade,
  body text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create table public.tips (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  kind text not null default 'Hidden value' check (kind in ('Hidden value', 'Loyalty', 'Where to look')),
  body text not null,
  url text not null default '',
  created_at timestamptz not null default now()
);

create table public.best (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  category text not null,
  place_id uuid not null references public.places on delete cascade,
  quote text not null default '',
  primary key (user_id, category)
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  path text not null,
  caption text not null default '',
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references public.profiles on delete cascade,
  name text not null
);

create table public.group_members (
  group_id uuid not null references public.groups on delete cascade,
  member uuid not null references public.profiles on delete cascade,
  primary key (group_id, member)
);

-- ---------- New sign-ups get a profile ----------
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- Degrees of separation ----------
-- 0 = yourself, 1 = friend, 2 = friend of a friend, 3 = one step further, null = not connected.
create function public.degree_between(a uuid, b uuid) returns int
language sql stable security definer set search_path = public as $$
  select case
    when a = b then 0
    when exists (select 1 from friends where user_id = a and friend_id = b) then 1
    when exists (select 1 from friends f1 join friends f2 on f2.user_id = f1.friend_id
                 where f1.user_id = a and f2.friend_id = b) then 2
    when exists (select 1 from friends f1 join friends f2 on f2.user_id = f1.friend_id
                 join friends f3 on f3.user_id = f2.friend_id
                 where f1.user_id = a and f3.friend_id = b) then 3
  end
$$;

-- Can the signed-in person see what this author shares? Uses the author's "who can see my reviews" setting.
create function public.can_see(author uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    public.degree_between(auth.uid(), author)
      <= (select share_degree from profiles where id = author),
    false)
$$;

-- Names as the viewer is allowed to see them, following each person's privacy settings.
create function public.people(ids uuid[])
returns table (id uuid, display_name text, style text, home text, degree int)
language sql stable security definer set search_path = public as $$
  select p.id,
    case
      when d.deg <= 1 then p.name
      when d.deg = 2 and p.show_as_2 = 'full' then p.name
      when d.deg = 2 and p.show_as_2 = 'first' then split_part(p.name, ' ', 1)
      when d.deg = 3 and p.show_as_3 = 'first' then split_part(p.name, ' ', 1)
      else ''
    end,
    p.style,
    case when d.deg <= 1 then p.home else '' end,
    d.deg
  from profiles p
  cross join lateral (select public.degree_between(auth.uid(), p.id) as deg) d
  where p.id = any(ids) and d.deg is not null
$$;

-- Add a friend with their invite code. Friendship goes both ways.
create function public.add_friend(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare other uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select id into other from profiles where invite_code = upper(trim(code));
  if other is null then raise exception 'No one has that invite code'; end if;
  if other = auth.uid() then raise exception 'That is your own invite code'; end if;
  insert into friends (user_id, friend_id)
  values (auth.uid(), other), (other, auth.uid())
  on conflict do nothing;
  return other;
end $$;

create function public.remove_friend(other uuid) returns void
language sql security definer set search_path = public as $$
  delete from friends
  where (user_id = auth.uid() and friend_id = other)
     or (user_id = other and friend_id = auth.uid());
$$;

revoke execute on function public.degree_between(uuid, uuid) from public, anon;
revoke execute on function public.can_see(uuid) from public, anon;
revoke execute on function public.people(uuid[]) from public, anon;
revoke execute on function public.add_friend(text) from public, anon;
revoke execute on function public.remove_friend(uuid) from public, anon;
grant execute on function public.degree_between(uuid, uuid) to authenticated;
grant execute on function public.can_see(uuid) to authenticated;
grant execute on function public.people(uuid[]) to authenticated;
grant execute on function public.add_friend(text) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;

-- ---------- Privacy rules ----------
alter table public.profiles enable row level security;
alter table public.friends enable row level security;
alter table public.places enable row level security;
alter table public.reviews enable row level security;
alter table public.notes enable row level security;
alter table public.tips enable row level security;
alter table public.best enable row level security;
alter table public.photos enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Your own profile row only. Other people are read through people(), which hides names per their settings.
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "read own friendships" on public.friends for select to authenticated using (user_id = auth.uid());

create policy "anyone signed in reads places" on public.places for select to authenticated using (true);
create policy "add places" on public.places for insert to authenticated with check (created_by = auth.uid());

create policy "read visible reviews" on public.reviews for select to authenticated
  using (user_id = auth.uid() or (visibility = 'circle' and public.can_see(user_id)));
create policy "write own reviews" on public.reviews for insert to authenticated with check (user_id = auth.uid());
create policy "edit own reviews" on public.reviews for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own reviews" on public.reviews for delete to authenticated using (user_id = auth.uid());

-- Private notes: only ever the owner.
create policy "own notes only" on public.notes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "read visible tips" on public.tips for select to authenticated using (user_id = auth.uid() or public.can_see(user_id));
create policy "write own tips" on public.tips for insert to authenticated with check (user_id = auth.uid());
create policy "delete own tips" on public.tips for delete to authenticated using (user_id = auth.uid());

create policy "read visible favourites" on public.best for select to authenticated using (user_id = auth.uid() or public.can_see(user_id));
create policy "own favourites" on public.best for insert to authenticated with check (user_id = auth.uid());
create policy "edit own favourites" on public.best for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own favourites" on public.best for delete to authenticated using (user_id = auth.uid());

create policy "read visible photos" on public.photos for select to authenticated using (user_id = auth.uid() or public.can_see(user_id));
create policy "add own photos" on public.photos for insert to authenticated with check (user_id = auth.uid());
create policy "delete own photos" on public.photos for delete to authenticated using (user_id = auth.uid());

-- Groups are private to whoever made them.
create policy "own groups" on public.groups for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
create policy "own group members" on public.group_members for all to authenticated
  using (exists (select 1 from public.groups g where g.id = group_id and g.owner = auth.uid()))
  with check (exists (select 1 from public.groups g where g.id = group_id and g.owner = auth.uid()));

-- ---------- Photo storage ----------
-- Photos are stored in a folder named after each person. Anyone with a photo's exact link can view it.
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict (id) do nothing;
create policy "upload own photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own photo files" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
