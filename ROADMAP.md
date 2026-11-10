# Vouch roadmap

Ideas agreed or under discussion, in rough order. Updated 10 November 2026.

## Next up

### Food hygiene ratings (Food Standards Agency)
- Show the official FSA food hygiene rating on places where one exists: restaurants, cafés, pubs, takeaways, bakeries, supermarkets and other food shops.
- Covers England, Wales, Northern Ireland (0 to 5 ratings) and Scotland (Pass / Improvement Required).
- Show the rating, the inspection date and a link to the FSA's own page for that business.
- Data is free with no sign-up ([FSA open data](https://ratings.food.gov.uk/open-data/), [API v2](https://www.food.gov.uk/food-hygiene-rating-scheme-api-version-2)).
- Rating badges must follow the FSA brand standard; check before using their images.
- Match each Vouch place to the nearest FSA business with a similar name; let the person who added the place correct a wrong match.
- Probably fetched through a small Supabase function and cached, rather than straight from each phone.

### Fuel prices (UK Fuel Finder)
- A separate fuel map showing every forecourt and its latest prices, all treated equally.
- Then let people narrow down, by their own choice, to forecourts their friends have vouched for.
- Data comes from the government's Fuel Finder scheme: stations must report price changes within 30 minutes ([GOV.UK: access the data](https://www.gov.uk/guidance/access-the-latest-fuel-prices-and-forecourt-data-via-api-or-email)).
- Needs a GOV.UK One Login and registration as a data user; the API only answers UK internet addresses, so a UK-hosted scheduled job would fetch prices into Vouch's database.
- Fair use rules include: on average no more than one call every 5 minutes, and do not "manipulate, filter, or selectively display data to favour certain suppliers" ([discussion of the terms](https://community.openstreetmap.org/t/uk-gov-fuel-finder-open-data/141220)). The default view must show all forecourts neutrally; check that a user-chosen "vouched for" filter is acceptable before launch.
- Show when each price was last changed, since old timestamps can mean a stable price rather than a stale one.

## Later

- **Apple Maps** for the map and place search, with OpenStreetMap as an automatic fallback if Apple ever refuses a search.
- **App Store app** alongside the web app, sharing one database. Needs real phone features (notifications, share sheet, location) to pass Apple's review.
- **CarPlay**: apply for the EV charging entitlement, with "friends' chargers and fuel stops nearby"; "Getting there" as a supporting reason.
- **Name**: staying with Vouch for now. Vetta is the preferred alternative if a change is needed (check the UK trade mark register first).

## Security and setup

- Turn on two-factor sign-in for GitHub and Supabase.
- Make the code repository private (GitHub Pro, or private repository plus Cloudflare Pages hosting), and consider a custom domain.
- Add an "All rights reserved" copyright notice.

## Parked

- **People list** (private pins for friends and family, with Getting there). Parked over security concerns. If revisited: keep it on the phone only, or encrypt it with the user's own passcode, and store rough locations rather than full addresses.
