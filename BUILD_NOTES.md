# BUILD NOTES - Spain 2026 Travel Site

> Last updated: 2026-05-23

## Purpose
Static, password-gated family travel site for the Spain 2026 trip. It gives the group one mobile-friendly place to check itinerary, lodging, trains, activities, city deep-dives, and pre-trip tasks.

## How It Works
- `index.html` is the full static app shell, styling, password screen, tab renderer, and client-side markdown loader.
- `Trip_Planning_Document.md` is the visible trip content rendered into tabs by top-level `#` headings.
- `briefings/Valencia.md`, `briefings/Barcelona.md`, `briefings/Madrid.md` lazy-load into **Valencia Decoded**, **Barcelona Unpacked**, and **Madrid in Context** tabs.
- `trip-events.json` is the structured itinerary source for the **Plan** tab (vis-timeline + Leaflet map).
- `spain-2026.ics` is the static subscribable calendar file served from the Netlify site root.
- `spain-2026.kml` is a Google Earth / My Maps export of locked pins and ideas.
- `Madrid_Accommodation_Recommendations.md` is a supporting planning/reference note, not rendered by the site.
- `README.md` is minimal repository context.

## Environment & Dependencies
- Runtime: static HTML in a browser.
- External browser dependencies: Google Fonts, `marked` (jsDelivr), `vis-timeline` 8.5.1 (unpkg), Leaflet 1.9.4 + markercluster 1.5.3 + polylinedecorator 1.6.0 (unpkg).
- Favicon: `favicon.ico`, `favicon-32.png`, `favicon.svg`, `apple-touch-icon.png` — terracotta square with **WTF** (Williamson Thomas Family). Prefer `.ico`/PNG for browser compatibility.
- Overview widgets: calendar subscribe (Apple + **Google Calendar** + download + copy), `eat-drink.json` top eats/drinks grid, `trip-quick-ref.json` countdown + emergency/metro/phrases/weather/expenses + print-to-PDF.
- Calendar: `generate-ics.py` builds `spain-2026.ics` from `trip-events.json` plus three all-day lodging spans. **Re-run after booking changes:** `python generate-ics.py`. Timed Spain events use `TZID=Europe/Madrid`; US outbound flights use `America/New_York` / `America/Chicago`; cross-timezone legs use UTC `Z`.
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
3. Top-level `#` headings map to content tabs (Overview + Valencia/Barcelona/Madrid/Return/Checklist). **Plan** and three **city briefing** tabs use `mdIndex: null` and load separate files.
4. City briefings use H2 sections in markdown → collapsible cards; lazy-loaded on first tab open.
5. `trip-events.json` drives the Plan tab timeline/map; run `python generate-ics.py` to sync `spain-2026.ics` when bookings change.
6. The password gate is privacy-by-obscurity only; do not put truly sensitive secrets in rendered trip content.
7. Spain itinerary times use `Europe/Madrid`; US outbound flights May 26 use `America/New_York` in the calendar.

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
- **Date**: 2026-05-23
- **Symptom**: Subscribed calendar showed many missing events; Google/Apple import incomplete.
- **Root Cause**: `spain-2026.ics` had a blank line between every property (~261 empty lines). Invalid RFC 5545 — most parsers stop or skip events. Thomas family outbound flights (DL4662, DL0128) were also absent from `trip-events.json`.
- **Fix**: Added `generate-ics.py` to rebuild ICS from JSON with proper CRLF and no interior blank lines. Added Thomas flights to `trip-events.json`. Added Netlify `_headers` for `text/calendar` MIME type.
- **⚠️ DO NOT REVERT**: Do not reintroduce double-spaced ICS or edit `.ics` without running the generator.

- **Date**: 2026-05-17
- **Symptom**: The site still showed train booking instructions for booked train legs and the old Madrid VRBO/Cibeles stay.
- **Root Cause**: Travel bookings changed after the original markdown was written.
- **Fix**: Replaced stale sections with booked Renfe details and new Airbnb confirmation/address/check-in details.
- **DO NOT REVERT**: Reverting to Cibeles Luxe III or generic train booking instructions will make the family-facing itinerary inaccurate.

## Gotchas & Warnings
- Do not add or remove top-level `#` markdown sections without checking `TAB_DEFS` mdIndex mapping in `index.html`. Plan and briefing tabs use `briefFile` / `mdIndex: null`.
- Briefing tabs: `valencia-decoded`, `barcelona-unpacked`, `madrid-context` — edit files under `briefings/`, not the trip doc.
- May 29 Valencia: Vrbo checkout is 11:00 but train is 09:06 — plan assumes leave ~07:45 and host bag hold.
- May 29 Barcelona: train arrives ~12:20, check-in 14:00 — document lunch / Stasher gap.
- Jun 1 Madrid: Airbnb earliest check-in 15:00 but group arrives ~19:00 after AVE — calendar uses arrival event, not 15:00.
- Markdown tables are wrapped for mobile by the app; keep wide tables concise.
- `SPAIN_2026_SITE_PASSWORD` is not a real secret. Do not rely on the static password gate for confidential data.
- The provided Renfe tickets cover Chandler, Angela, Carson, Valerie, Harrison, and Elise only. Thomas family train tickets should stay clearly marked as separate / to confirm unless new ticket data is provided.
- `spain-2026.ics` includes a few placeholder durations/times where the plan has no exact end time (for example wedding events). Mark those descriptions as placeholders.
- If editing the calendar, prefer editing `trip-events.json` and running `generate-ics.py`. Do not hand-edit with blank lines between properties — RFC 5545 forbids empty lines inside `VCALENDAR`/`VEVENT`; Google/Apple may drop events.

## Replication Guide
To duplicate this for another trip:
- Copy `index.html`.
- Replace `Trip_Planning_Document.md` with the new itinerary using the same top-level section count/order or update `TAB_DEFS`.
- Update the password in `index.html` and store a matching operator reference in workspace `.env`.
- Deploy the folder as a static Netlify site.

## Change Log
| Date | Change | Why |
|---|-----|-----|
| 2026-05-24 | Mobile-first visual refresh: calmer Spain palette, sticky header, card/readability spacing | Reduce color clash and improve phone reading |
| 2026-05-24 | Joe weekend venue maps (tmg.link): Alaire Rooftop, La Pedrera, Catedral, shuttle pickup | Wedding map links in plan doc, quick-ref, calendar, KML |
| 2026-05-24 | Bookings at a glance + quick-ref trains/lodging; gitignore planning screenshots | Consolidate 3 train locators + 4 stays; ignore unused PNGs |
| 2026-05-24 | Joe one-week-out wedding update: welcome party 7 PM, shuttles 4:30 PM Sun, weather/packing/BCN transport | Sync trip-events.json, ICS, plan doc, briefings, quick-ref |
| 2026-05-23 | Fix calendar ICS + `generate-ics.py` + Thomas Delta flights | Blank-line ICS broke subscribe import |
| 2026-05-23 | Live weather widget (Open-Meteo) on Overview for trip dates | Real forecast vs AEMET links only |
| 2026-05-23 | Wedding attire/logistics (Joe email) + expanded packing section | Family guidance for wedding dress code, baby travel, walking shoes |
| 2026-05-23 | City deep briefing tabs + briefings/*.md | History, politics, architecture, demographics, while-you-are-here for MBA/military lens |
| 2026-05-22 | Plan tab (vis-timeline + Leaflet), trip-events.json, KML, calendar/content sync | Paella booking, cribs, check-in/out, luggage gaps, timezone fixes |
| 2026-05-17 | Added static subscribable calendar and updated May 30 tour time | Keep the site and calendar aligned with the new Group A 9:15 AM start and Sagrada entry |
| 2026-05-17 | Added build notes | Required project documentation for future site updates |
| 2026-05-17 | Updated train and Madrid lodging documentation | Reflect booked Renfe tickets and new Airbnb stay |
