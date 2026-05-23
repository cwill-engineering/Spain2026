# BUILD NOTES - Spain 2026 Travel Site

> Last updated: 2026-05-22

## Purpose
Static, password-gated family travel site for the Spain 2026 trip. It gives the group one mobile-friendly place to check itinerary, lodging, trains, activities, and pre-trip tasks.

## How It Works
- `index.html` is the full static app shell, styling, password screen, tab renderer, and client-side markdown loader.
- `Trip_Planning_Document.md` is the visible trip content rendered into tabs by top-level `#` headings.
- `trip-events.json` is the structured itinerary source for the **Plan** tab (vis-timeline + Leaflet map).
- `spain-2026.ics` is the static subscribable calendar file served from the Netlify site root.
- `spain-2026.kml` is a Google Earth / My Maps export of locked pins and ideas.
- `Madrid_Accommodation_Recommendations.md` is a supporting planning/reference note, not rendered by the site.
- `README.md` is minimal repository context.

## Environment & Dependencies
- Runtime: static HTML in a browser.
- External browser dependencies: Google Fonts, `marked` (jsDelivr), `vis-timeline` 8.5.1 (unpkg), Leaflet 1.9.4 (unpkg).
- Calendar: static iCalendar (`.ics`) file. Timed Spain events use `TZID=Europe/Madrid`; US outbound flights May 26 use `TZID=America/New_York`.
- Plan tab: loads `trip-events.json`; timeline groups by city; map markers sync on click.
- Environment variable: `SPAIN_2026_SITE_PASSWORD` stores the site password in the workspace `.env` for operator reference. The current static site still hardcodes the same password in `index.html`.
- Deploy target: Netlify static site at `https://neon-daffodil-236a0f.netlify.app/`.

## Usage
Open the deployed Netlify URL or serve the directory locally:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/` and enter the site password.

Calendar subscription URL after deploy:

```text
webcal://neon-daffodil-236a0f.netlify.app/spain-2026.ics
```

## Key Design Decisions
1. The site remains static so it can deploy on Netlify without a build step.
2. Trip content lives in markdown so family-facing updates are simple and readable.
3. Top-level `#` headings map to content tabs (Overview content + Valencia/Barcelona/Madrid/Return/Checklist); the **Plan** tab is injected separately and does not consume a markdown section.
4. `trip-events.json` drives the Plan tab timeline/map; keep it aligned with `spain-2026.ics` when bookings change.
5. The password gate is privacy-by-obscurity only; do not put truly sensitive secrets in rendered trip content.
6. Spain itinerary times should be encoded as `Europe/Madrid` so events stay pinned to local Spain time for subscribed users.
7. US outbound flight legs on May 26 use `America/New_York` in the calendar.

## Research & Discovery Log
- **Question / Goal**: Update the live trip site with May 2026 train and Madrid lodging changes.
- **Approach Tried**: Reviewed `index.html`, `Trip_Planning_Document.md`, and the supporting Madrid accommodation note.
- **Result**: Confirmed the visible site is driven by `Trip_Planning_Document.md`; train and lodging content was stale for Valencia to Barcelona, Barcelona to Madrid, and Madrid lodging.
- **Final Answer / Approach**: Update the markdown source, keep the static app unchanged, and document the password in workspace `.env`.
- **Source**: User-provided Renfe/Airbnb details and local site files.
- **Question / Goal**: Determine whether a subscribable calendar existed and whether the updated May 30 Barcelona tour time was represented.
- **Approach Tried**: Searched for `.ics`, calendar generation code, and Sagrada/La Pedrera time references.
- **Result**: No existing calendar file or generator was present. The rendered trip document still showed the old 9:45 AM tour start and Sagrada arrival around 12:15 PM.
- **Final Answer / Approach**: Added `spain-2026.ics` with `Europe/Madrid` timed events and updated the Barcelona tour schedule to 9:15 AM start, ~11:45 AM Sagrada arrival, and 12:15 PM ticketed entry.
- **Source**: User-provided updated tour email and Sagrada Família confirmation.

## What Worked (Optimal Path)
1. Edit `Trip_Planning_Document.md` first because it is the rendered source of truth.
2. Keep each trip phase under the existing top-level headings so tab mapping stays stable.
3. Replace booking instructions with booked train summaries, covered passengers, seats, ticket numbers, and prices.
4. Update supporting notes after the visible site content is correct.
5. For calendar changes, update `spain-2026.ics` and keep event times in `Europe/Madrid` unless the event is explicitly in another local timezone.
6. Preview locally and check tab rendering before pushing or deploying.

## What Failed & Why
| Approach | Why It Failed | Better Alternative |
|----|-----|----|
| Treating the Madrid recommendation note as the live source | The site only fetches `Trip_Planning_Document.md` | Update the trip document first, then supporting notes |
| Adding a build system just to use an env var | The site is static and already works without a build step | Store `SPAIN_2026_SITE_PASSWORD` in `.env` for reference and leave the deployed app simple |
| Assuming the site already had a calendar | No `.ics` file or generator existed in the project | Add a static `spain-2026.ics` at the site root and link it from the trip document |

## Known Issues & Fixes
- **Date**: 2026-05-17
- **Symptom**: The site still showed train booking instructions for booked train legs and the old Madrid VRBO/Cibeles stay.
- **Root Cause**: Travel bookings changed after the original markdown was written.
- **Fix**: Replaced stale sections with booked Renfe details and new Airbnb confirmation/address/check-in details.
- **DO NOT REVERT**: Reverting to Cibeles Luxe III or generic train booking instructions will make the family-facing itinerary inaccurate.

## Gotchas & Warnings
- Do not add or remove top-level `#` markdown sections without checking `TAB_DEFS` mdIndex mapping in `index.html`. The Plan tab is separate (`mdIndex: null`).
- When updating bookings, edit `trip-events.json`, `spain-2026.ics`, and relevant markdown sections together.
- May 29 Valencia: Vrbo checkout is 11:00 but train is 09:06 — plan assumes leave ~07:45 and host bag hold.
- May 29 Barcelona: train arrives ~12:20, check-in 14:00 — document lunch / Stasher gap.
- Jun 1 Madrid: Airbnb earliest check-in 15:00 but group arrives ~19:00 after AVE — calendar uses arrival event, not 15:00.
- Markdown tables are wrapped for mobile by the app; keep wide tables concise.
- `SPAIN_2026_SITE_PASSWORD` is not a real secret. Do not rely on the static password gate for confidential data.
- The provided Renfe tickets cover Chandler, Angela, Carson, Valerie, Harrison, and Elise only. Thomas family train tickets should stay clearly marked as separate / to confirm unless new ticket data is provided.
- `spain-2026.ics` includes a few placeholder durations/times where the plan has no exact end time (for example wedding events). Mark those descriptions as placeholders.
- If editing the calendar manually, keep `DTSTART;TZID=Europe/Madrid` / `DTEND;TZID=Europe/Madrid` for Spain-local timed events.

## Replication Guide
To duplicate this for another trip:
- Copy `index.html`.
- Replace `Trip_Planning_Document.md` with the new itinerary using the same top-level section count/order or update `TAB_DEFS`.
- Update the password in `index.html` and store a matching operator reference in workspace `.env`.
- Deploy the folder as a static Netlify site.

## Change Log
| Date | Change | Why |
|---|-----|-----|
| 2026-05-22 | Plan tab (vis-timeline + Leaflet), trip-events.json, KML, calendar/content sync | Paella booking, cribs, check-in/out, luggage gaps, timezone fixes |
| 2026-05-17 | Added static subscribable calendar and updated May 30 tour time | Keep the site and calendar aligned with the new Group A 9:15 AM start and Sagrada entry |
| 2026-05-17 | Added build notes | Required project documentation for future site updates |
| 2026-05-17 | Updated train and Madrid lodging documentation | Reflect booked Renfe tickets and new Airbnb stay |
