-- Vouch database update 7. Paste all of this into Supabase > SQL Editor and press Run, once.
-- Adds beta suggestions (testers send ideas, only the app owner can see and approve them) and your own theme colours.
--
-- BEFORE YOU RUN IT: on the very last line, replace YOUR-LOGIN-EMAIL with the email you log in to Vouch with.
-- That makes you the owner who sees the Suggestions inbox.

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.app_admins enable row level security;
-- No policies: nobody can read or change this list from the app. Only this SQL editor can.

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_admins where user_id = auth.uid());
$$;

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  area text not null default 'Other',
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'new' check (status in ('new', 'approved', 'declined', 'done')),
  reply text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.suggestions enable row level security;
drop policy if exists "send a suggestion" on public.suggestions;
drop policy if exists "see my own suggestions" on public.suggestions;
drop policy if exists "owner updates suggestions" on public.suggestions;
drop policy if exists "owner deletes suggestions" on public.suggestions;
create policy "send a suggestion" on public.suggestions for insert to authenticated with check (user_id = auth.uid() and status = 'new' and reply = '');
create policy "see my own suggestions" on public.suggestions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "owner updates suggestions" on public.suggestions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "owner deletes suggestions" on public.suggestions for delete to authenticated using (public.is_admin());
grant select, insert, update, delete on public.suggestions to authenticated;

-- The owner's inbox: every suggestion with the sender's name and email.
create or replace function public.admin_suggestions()
returns table (id uuid, user_id uuid, name text, email text, area text, body text, status text, reply text, created_at timestamptz, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select s.id, s.user_id, coalesce(nullif(p.name, ''), 'No name'), u.email::text, s.area, s.body, s.status, s.reply, s.created_at, s.updated_at
  from suggestions s
  join profiles p on p.id = s.user_id
  left join auth.users u on u.id = s.user_id
  where public.is_admin()
  order by s.created_at desc;
$$;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.admin_suggestions() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_suggestions() to authenticated;

-- Your own theme colours (Me > Theme > Your own).
alter table public.profiles add column if not exists theme_custom jsonb;

-- Make yourself the owner. Replace YOUR-LOGIN-EMAIL below (keep the quote marks).
insert into public.app_admins (user_id) select id from auth.users where lower(email) = lower('YOUR-LOGIN-EMAIL') on conflict do nothing;
