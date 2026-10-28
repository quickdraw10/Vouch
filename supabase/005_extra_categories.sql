-- Vouch database update 5. Paste all of this into Supabase > SQL Editor and press Run, once.
-- Lets a place sit in up to 3 categories, e.g. a pub that does food,
-- or a supermarket with a petrol station or EV chargers.

-- Up to two extra categories, each written as 'category:subcategory', e.g. 'eat:restaurant' or 'ev:'.
alter table public.places add column if not exists extra text[] not null default '{}';
alter table public.places drop constraint if exists places_extra_check;
alter table public.places add constraint places_extra_check check (
  cardinality(extra) <= 2
  and array_to_string(extra, ',') ~ '^([a-z]+:[a-z]*(,[a-z]+:[a-z]*)*)?$'
);
