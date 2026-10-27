# Vouch

Places rated by people you trust. A test web app: open it in Safari or Chrome, or add it to your home screen.

Live at: https://quickdraw10.github.io/Vouch/

## How it is built

- `index.html`: layout, styles and themes
- `app.js`: the app
- `config.js`: the Supabase project URL and publishable key (safe to be public)
- `supabase/setup.sql`: the database tables and privacy rules. Run it once in Supabase › SQL Editor.

Hosting is GitHub Pages. The database, sign-in and photo storage are Supabase. Maps are OpenStreetMap tiles, and place search uses OpenStreetMap Nominatim.

## One-time Supabase settings

1. SQL Editor: run `supabase/setup.sql`.
2. Authentication › URL Configuration: set Site URL to `https://quickdraw10.github.io/Vouch/` and add the same address under Redirect URLs.
3. Authentication › Sign In / Providers › Email: turn off "Confirm email" for testing, so new accounts work straight away without waiting for an email.

## Never commit

The Supabase secret / service_role key. It must never appear in this repository.
