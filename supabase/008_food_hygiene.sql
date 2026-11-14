-- Vouch database update 8. Paste all of this into Supabase > SQL Editor and press Run, once.
-- Adds official Food Standards Agency (FSA) food hygiene ratings to places that serve or sell food.
-- Your database looks each place up with the FSA's free public service and remembers the answer,
-- so every Vouch user sees it and each place is only looked up about once a month.

create extension if not exists http with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create table if not exists public.place_hygiene (
  place_id uuid primary key references public.places on delete cascade,
  matched boolean not null default false,       -- false = looked, found nothing suitable nearby
  manual boolean not null default false,        -- true = a person picked the match (or "none of these")
  fhrs_id bigint,
  business_name text,
  address text,
  postcode text,
  rating text,                                  -- '0'..'5', 'Pass', 'Improvement Required', 'AwaitingInspection', 'Exempt'...
  rating_date date,
  scheme text,                                  -- FHRS (England, Wales, NI) or FHIS (Scotland)
  distance real,                                -- miles from the Vouch pin
  checked_at timestamptz not null default now()
);
alter table public.place_hygiene enable row level security;
drop policy if exists "anyone signed in reads hygiene" on public.place_hygiene;
create policy "anyone signed in reads hygiene" on public.place_hygiene for select to authenticated using (true);
grant select on public.place_hygiene to authenticated;
-- No insert/update policies: rows are only written by the functions below.

-- Ask the FSA for food businesses within 0.3 miles of a point, nearest first.
create or replace function public._fsa_fetch(lat double precision, lng double precision)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare r record;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '8000');
  select status, content into r from extensions.http((
    'GET',
    'https://api.ratings.food.gov.uk/Establishments?latitude=' || lat || '&longitude=' || lng ||
      '&maxDistanceLimit=0.3&sortOptionKey=Distance&pageSize=100&pageNumber=1',
    array[extensions.http_header('x-api-version', '2'), extensions.http_header('Accept', 'application/json')],
    null, null)::extensions.http_request);
  if r.status <> 200 then raise exception 'FSA service replied %', r.status; end if;
  return coalesce(r.content::jsonb -> 'establishments', '[]'::jsonb);
end $$;

-- Simplify a business name so "The Rose & Crown Ltd" and "Rose and Crown" compare well.
create or replace function public._norm_name(t text) returns text language sql immutable as $$
  select trim(regexp_replace(regexp_replace(
    regexp_replace(lower(coalesce(t, '')), '&', ' and ', 'g'),
    '[^a-z0-9 ]', ' ', 'g'),
    '\m(the|ltd|limited|plc|co|and|uk|llp)\M', ' ', 'g'));
$$;

-- Score each nearby FSA business against the place's name; nearer and closer-named scores higher.
create or replace function public._fsa_scored(est jsonb, pname text)
returns table (fhrs_id bigint, business_name text, address text, postcode text, rating text, rating_date date, scheme text, distance real, score real)
language sql stable set search_path = public, extensions as $$
  select (e->>'FHRSID')::bigint,
         e->>'BusinessName',
         nullif(concat_ws(', ', nullif(e->>'AddressLine1', ''), nullif(e->>'AddressLine2', ''), nullif(e->>'AddressLine3', ''), nullif(e->>'AddressLine4', '')), ''),
         e->>'PostCode',
         e->>'RatingValue',
         nullif(left(e->>'RatingDate', 10), '')::date,
         e->>'SchemeType',
         coalesce((e->>'Distance')::real, 0),
         (greatest(extensions.similarity(_norm_name(pname), _norm_name(e->>'BusinessName')),
                   extensions.word_similarity(_norm_name(pname), _norm_name(e->>'BusinessName')),
                   extensions.word_similarity(_norm_name(e->>'BusinessName'), _norm_name(pname)))
           - least(coalesce((e->>'Distance')::real, 0), 0.3) * 0.5)::real
  from jsonb_array_elements(est) e
  where (e->>'FHRSID') is not null;
$$;

-- Find (or refresh) the hygiene rating for one place. Safe to call often: it only asks the FSA
-- when there is no answer yet, or the answer is over 30 days old, unless force is true.
create or replace function public.fsa_lookup(pid uuid, force boolean default false)
returns public.place_hygiene language plpgsql security definer set search_path = public, extensions as $$
declare p record; h public.place_hygiene; had boolean; best record;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into h from place_hygiene where place_id = pid;
  had := found;
  if had and not force then
    if h.checked_at > now() - interval '30 days' then return h; end if;
    -- Someone said "none of these": respect that.
    if h.manual and not h.matched then
      update place_hygiene set checked_at = now() where place_id = pid returning * into h;
      return h;
    end if;
  end if;
  select id, name, lat, lng into p from places where id = pid;
  if not found then raise exception 'No such place'; end if;
  if had and h.manual and h.matched then
    -- Matched by hand: keep that business and refresh its rating.
    select * into best from _fsa_scored(_fsa_fetch(p.lat, p.lng), p.name) s where s.fhrs_id = h.fhrs_id;
    if best.fhrs_id is null then
      update place_hygiene set checked_at = now() where place_id = pid returning * into h;
      return h;
    end if;
  else
    select * into best from _fsa_scored(_fsa_fetch(p.lat, p.lng), p.name) s
      where s.score >= 0.45 or (s.score >= 0.3 and s.distance <= 0.05)
      order by s.score desc limit 1;
  end if;
  insert into place_hygiene as t (place_id, matched, manual, fhrs_id, business_name, address, postcode, rating, rating_date, scheme, distance, checked_at)
  values (pid, best.fhrs_id is not null, coalesce(had and h.manual, false), best.fhrs_id, best.business_name, best.address, best.postcode, best.rating, best.rating_date, best.scheme, best.distance, now())
  on conflict (place_id) do update set matched = excluded.matched, manual = excluded.manual, fhrs_id = excluded.fhrs_id,
    business_name = excluded.business_name, address = excluded.address, postcode = excluded.postcode, rating = excluded.rating,
    rating_date = excluded.rating_date, scheme = excluded.scheme, distance = excluded.distance, checked_at = now()
  returning * into h;
  return h;
end $$;

-- Nearby FSA businesses to choose from when the automatic match is wrong or missing.
create or replace function public.fsa_candidates(pid uuid)
returns table (fhrs_id bigint, business_name text, address text, postcode text, rating text, rating_date date, scheme text, distance real, score real)
language plpgsql security definer set search_path = public, extensions as $$
declare p record;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select id, name, lat, lng into p from places where id = pid;
  if not found then raise exception 'No such place'; end if;
  return query select * from _fsa_scored(_fsa_fetch(p.lat, p.lng), p.name) s order by s.score desc, s.distance limit 15;
end $$;

-- Pick the right business by hand (fhrs = null means "none of these"). Only the person who added
-- the place, or someone who has rated it, can do this.
create or replace function public.fsa_choose(pid uuid, fhrs bigint)
returns public.place_hygiene language plpgsql security definer set search_path = public, extensions as $$
declare p record; best record; h public.place_hygiene;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select id, name, lat, lng, created_by into p from places where id = pid;
  if not found then raise exception 'No such place'; end if;
  if p.created_by is distinct from auth.uid() and not exists (select 1 from reviews where place_id = pid and user_id = auth.uid()) then
    raise exception 'Only the person who added this place, or someone who rated it, can change its hygiene rating match';
  end if;
  if fhrs is null then
    -- "None of these": remember that nobody should be matched.
    insert into place_hygiene as t (place_id, matched, manual, checked_at) values (pid, false, true, now())
    on conflict (place_id) do update set matched = false, manual = true, fhrs_id = null, business_name = null, address = null,
      postcode = null, rating = null, rating_date = null, scheme = null, distance = null, checked_at = now()
    returning * into h;
    return h;
  end if;
  select * into best from _fsa_scored(_fsa_fetch(p.lat, p.lng), p.name) s where s.fhrs_id = fhrs;
  if best.fhrs_id is null then raise exception 'That business is not near this place'; end if;
  insert into place_hygiene as t (place_id, matched, manual, fhrs_id, business_name, address, postcode, rating, rating_date, scheme, distance, checked_at)
  values (pid, fhrs is not null, true, best.fhrs_id, best.business_name, best.address, best.postcode, best.rating, best.rating_date, best.scheme, best.distance, now())
  on conflict (place_id) do update set matched = excluded.matched, manual = true, fhrs_id = excluded.fhrs_id, business_name = excluded.business_name,
    address = excluded.address, postcode = excluded.postcode, rating = excluded.rating, rating_date = excluded.rating_date,
    scheme = excluded.scheme, distance = excluded.distance, checked_at = now()
  returning * into h;
  return h;
end $$;

revoke execute on function public._fsa_fetch(double precision, double precision) from public, anon, authenticated;
revoke execute on function public._fsa_scored(jsonb, text) from public, anon, authenticated;
revoke execute on function public.fsa_lookup(uuid, boolean) from public, anon;
revoke execute on function public.fsa_candidates(uuid) from public, anon;
revoke execute on function public.fsa_choose(uuid, bigint) from public, anon;
grant execute on function public.fsa_lookup(uuid, boolean) to authenticated;
grant execute on function public.fsa_candidates(uuid) to authenticated;
grant execute on function public.fsa_choose(uuid, bigint) to authenticated;
