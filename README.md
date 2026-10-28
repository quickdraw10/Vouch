# Vouch

Places rated by people you trust. A test web app: open it in Safari or Chrome, or add it to your home screen.

Live at: https://quickdraw10.github.io/Vouch/

## How it is built

- `index.html`: layout, styles and themes
- `app.js`: the app
- `config.js`: the Supabase project URL and publishable key (safe to be public)
- `supabase/setup.sql`: the database tables and privacy rules. Run it once in Supabase › SQL Editor.
- `supabase/002_public_follow_saves.sql`: update 2 (public reviews, following, invite links, saved places, edit times). Run it once, after setup.sql.
- `supabase/003_categories_names_tips.sql`: update 3 (sub-categories, first/last/nickname, general tips). Run it once, after update 2.
- `supabase/004_links_and_saves.sql`: update 4 (website and social links for places, a link on your review, and every place you've rated added to your map). Run it once, after update 3.
- `supabase/005_extra_categories.sql`: update 5 (a place can be in up to 3 categories). Run it once, after update 4.

Hosting is GitHub Pages. The database, sign-in and photo storage are Supabase. Maps are OpenStreetMap tiles, and place search uses OpenStreetMap Nominatim.

## One-time Supabase settings

1. SQL Editor: run `supabase/setup.sql`.
2. Authentication › URL Configuration: set Site URL to `https://quickdraw10.github.io/Vouch/` and add the same address under Redirect URLs.
3. Authentication › Sign In / Providers › Email: turn off "Confirm email" for testing, so new accounts work straight away without waiting for an email.

## Never commit

The Supabase secret / service_role key. It must never appear in this repository.
