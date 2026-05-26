# BUILD NOTES - Spain 2026 Travel Site

> Last updated: 2026-05-26 (Rideshare consistency sweep: Barcelona = taxis/FreeNow, Madrid = Uber)

## Purpose
Static, password-gated family travel site for the Spain 2026 trip. It gives the group one mobile-friendly place to check itinerary, lodging, trains, activities, city deep-dives, pre-trip tasks, and an AI trip assistant.

## How It Works
- `index.html` is the full static app shell, styling, password screen, tab renderer, client-side markdown loader, and trip assistant UI.
- `Trip_Planning_Document.md` is the visible trip content rendered into tabs by top-level `#` headings.
- `briefings/Valencia.md`, `briefings/Barcelona.md`, `briefings/Madrid.md` lazy-load into **Valencia Decoded**, **Barcelona Unpacked**, and **Madrid in Context** tabs.
- `briefings/family-fun.md` lazy-loads into the **Family Fun** tab (sports tie-ins per kid, scavenger hunts per city, hikes, beaches with ratings, train-ride games, seasonal activities).
- `briefings/day-by-day.md` lazy-loads into the **Day by Day** tab — every preset event from May 26 → Jun 4 in one scroll (the primary in-trip reference).
- `briefings/travel-playbook.md` lazy-loads into the **Travel Playbook** tab — airport navigation (Barajas T4S, BCN T1, Boston, JFK, BNA), Renfe AVE/Euromed boarding rules + station differences, Cercanías C1, metro guidance per city, taxi/Uber/Cabify/FreeNow by city.
- `trip-events.json` is the structured itinerary source for the **Plan** tab (vis-timeline + Leaflet map).
- `spain-2026.ics` is the static subscribable calendar file served from the Netlify site root.
- `spain-2026.kml` is a Google Earth / My Maps export of locked pins and ideas.
- `Madrid_Accommodation_Recommendations.md` is a supporting planning/reference note, not rendered by the site.
- `generate-agent-context.py` bundles trip markdown/JSON into `agent-context.json` for the chat function.
- `netlify/functions/chat.mjs` proxies OpenAI chat completions (API key server-side only).
- `README.md` is minimal repository context.

## Environment & Dependencies
- Runtime: static HTML in a browser; **trip assistant** requires Netlify Functions (`netlify/functions/chat.mjs`).
- External browser dependencies: Google Fonts, `marked` (jsDelivr), `vis-timeline` 8.5.1 (unpkg), Leaflet 1.9.4 + markercluster 1.5.3 + polylinedecorator 1.6.0 (unpkg).
- Favicon: `favicon.ico`, `favicon-32.png`, `favicon.svg`, `apple-touch-icon.png` — terracotta square with **WTF** (Williamson Thomas Family). Prefer `.ico`/PNG for browser compatibility.
- Overview widgets: calendar subscribe (Apple + **Google Calendar** + download + copy), `eat-drink.json` top eats/drinks grid, `trip-quick-ref.json` countdown + emergency/metro/phrases/weather/expenses + print-to-PDF.
- Calendar: `generate-ics.py` builds `spain-2026.ics` from `trip-events.json` plus three all-day lodging spans. **Re-run after booking changes:** `python generate-ics.py`. Timed Spain events use `TZID=Europe/Madrid`; US outbound flights use `America/New_York` / `America/Chicago`; cross-timezone legs use UTC `Z`.
- Agent context: `generate-agent-context.py` builds `agent-context.json` (~140KB). **Re-run after trip content changes:** `python generate-agent-context.py`.
- Plan tab: loads `trip-events.json`; timeline groups by city; map markers sync on click.
- **Netlify env vars** (Dashboard → Site → Environment variables; also workspace `Scripts/.env` for local `netlify dev`):
  - `OPENAI_API_KEY` — OpenAI API key; consumed by `netlify/functions/chat.mjs`.
  - `SPAIN_2026_SITE_PASSWORD` — must match the password in `index.html`; chat endpoint rejects requests without it.
  - `OPENAI_MODEL` (optional) — defaults to `gpt-4o-mini`.
- Deploy target: Netlify static site at `https://neon-daffodil-236a0f.netlify.app/`.

## Usage
Open the deployed Netlify URL or serve locally:

**Trip site only (no assistant):**
```powershell
python -m http.server 8000
```

**Trip site + assistant (requires env vars in `Scripts/.env`):**
```powershell
cd "Personal/Travel Planning/Spain May 2026"
netlify dev
```
Open `http://localhost:8888/` and enter the site password. Tap **Ask** (FAB, bottom-right).

After trip booking or content changes:
```powershell
python generate-agent-context.py
python generate-ics.py
```

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
8. Trip assistant: FAB opens full-screen overlay on mobile (<900px) or 380px right panel on desktop. OpenAI key never in browser — `POST /api/chat` → `netlify/functions/chat.mjs`. Hybrid grounding: trip data first, general Spain tips OK when labeled as such.

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
- **Date**: 2026-05-26
- **Symptom**: User booked an earlier Madrid→Valencia train (ZUBYYB, 14:30 from Chamartín) on top of the original (4XYBG8, 19:40 from Atocha) as a try-for-earlier + fallback combo. Site needs to show both clearly with an explicit cancellation rule.
- **Root Cause**: Travel strategy change — flight lands 11:30, original plan had 8 hours of dead time in Madrid; user now wants to push straight to Valencia.
- **Fix**: Added `train-madrid-valencia-fallback` event + route in `trip-events.json`; rewrote train sections in trip doc with primary/fallback subsections; updated luggage strategy to assume primary plan + separate fallback storage plan for Atocha consigna.
- **⚠️ DO NOT REVERT**: Both tickets must remain in the calendar/timeline until the user confirms cancellation. The new ticket departs **Chamartín**, not Atocha — Cercanías C1 still serves both. Don't conflate the two stations in any future text.

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
- Trip assistant chat does not work with `python -m http.server` alone — use `netlify dev` locally. Production requires `OPENAI_API_KEY` and `SPAIN_2026_SITE_PASSWORD` in Netlify env.
- After editing trip markdown/JSON, run `generate-agent-context.py` before deploy or assistant answers will be stale.

## Replication Guide
To duplicate this for another trip:
- Copy `index.html`.
- Replace `Trip_Planning_Document.md` with the new itinerary using the same top-level section count/order or update `TAB_DEFS`.
- Update the password in `index.html` and store a matching operator reference in workspace `.env`.
- Deploy the folder as a static Netlify site.

## Change Log
| Date | Change | Why |
|---|-----|-----|
| 2026-05-26 | **Rideshare consistency sweep across all docs.** The expanded Travel Playbook section established that Uber XL is effectively nonexistent in Barcelona (Catalonia VTC rules) but works fine in Madrid. The earlier docs had 8 stale "2 Ubers XL" references in Barcelona contexts that contradicted this. Fixed in: `briefings/travel-playbook.md` line 201 (cheat sheet), `briefings/day-by-day.md` lines 61 + 112 (May 29 arrival + Jun 1 departure), `trip-events.json` lines 1260 + 1266 (luggageGaps for May 29 + Jun 1), `Trip_Planning_Document.md` lines 207 + 210 + 828 + 884 (luggage table + day-by-day schedules). All BCN references now say "2 taxis from Sants parada / Passeig de Gràcia / Plaça Universitat parada — FreeNow app books the same taxis." Madrid references (Atocha → Airbnb, Airbnb → Barajas, Corpus Christi → Barajas) intentionally KEPT as "Uber XL" since Uber works in Madrid. Regenerated `agent-context.json` (246.9 KB). | User: "Verify this issue exists and fix it" pointing at line 201, then "yes" to sweep across files. |
| 2026-05-26 | **Rideshare reality section in Travel Playbook.** Replaced the thin Uber/Cabify table in `briefings/travel-playbook.md` with city-specific rideshare guidance: Madrid = use Uber XL or Cabify Grupo; Barcelona = use FreeNow (not Uber — Catalonia regulates VTC hard, Uber XL is nonexistent); Valencia = Cabify or just walk to a parada. Documents fixed airport fares (€33 Madrid, €39+€4.20 Barcelona), 4 apps to install before flying (FreeNow mandatory for BCN), card acceptance rules, and that all rideshare must be pre-booked (no street hails). Regenerated `agent-context.json` so the assistant has the new guidance. | User: "Does uber work well in each city?" then "yes" to add it to the playbook. |
| 2026-05-26 | **Taxi rank pins (13).** Added `taxiIcon` (22px yellow square w/ 🚕 + dark border) to `index.html`. Extended `classifyTransit()` and `iconForTransit()` to handle 🚕 prefix. Added matching `.plan-legend-dot.taxi` CSS + legend item. zIndex 500 (above metro/tram, below airport/train). 13 paradas added to `trip-events.json` as `category: "transit"`: Valencia (Joaquín Sorolla, Estació del Nord, Malvarrosa, Plaza del Ayuntamiento), Barcelona (Sants, Plaça Catalunya, Passeig de Gràcia, Plaça Universitat, Plaça d'Espanya), Madrid (Sol, Tirso de Molina, Plaza Mayor, Atocha). Descriptions note car-counts needed for 9 pax + 8 bags, expected fares, and walking distance from nearest lodging. | User: "Show taxi spots too." Critical info for the 9-person + 8-bag transitions where Uber/Cabify can't always handle the volume. |
| 2026-05-26 | **Timeline declutter.** With 68 suggestion pins in `trip-events.json`, the timeline became unusable: every suggestion's `day` field bucketed it at noon, stacking 10+ pills per city per day. Fix: (1) Filter suggestions added to the vis-timeline DataSet — only `food` and `activity` categories get rendered. `transit`, `essentials`, and `lodging` are spatial-only and live on the map exclusively. (2) Added an "💡 Show day ideas" pill-button toggle in the plan-legend bar; default OFF so the timeline shows only the ~25 scheduled events. Clicking adds/removes the 43 food+activity day-bucket pills via DataSet `add`/`remove`. (3) Raised `zoomMin` from 2h to 6h so the timeline can't pinch-zoom into the cramped 12h slice shown in the user screenshot. Variable renamed `items` → DataSet referenced as `timelineItemsDS` for the toggle logic. | User: "The timeline view looks crazy — what do you suggest?" Suggestion pins were temporal noise; they're inherently spatial. |
| 2026-05-26 | **Distinct transit icons.** Added 4 new icon types to `index.html`: `airportIcon` (28px navy rounded-square with ✈️), `trainIcon` (28px terracotta circle with dark border + 🚄), `metroIcon` (22px Fountain-Blue square with "M"), `tramIcon` (22px Cactus square with "T"). Classification is data-driven via title emoji prefix (`classifyTransit()` reads ✈️/🚄/🚇/🚋) on entries with `category: "transit"`. Transit pins moved to dedicated non-clustering `planTransitLayer` with zIndex 600 (airport/train) or 400 (metro/tram) so they're always visible but layered below 🏠 lodgings (zIndex 1000). Added 3 matching legend items. `focusPlanMap` updated to skip cluster-spider for transit pins. No JSON change needed — existing emoji titles drive classification. | User: "Can we have different icons for train stations and airports too?" Standardized green dot made all transit hubs look identical. |
| 2026-05-26 | **Lodging stand-out + 20 neighborhood-essentials pins.** Added `stay: true` flag on the 4 lodging anchors in `trip-events.json`. Added dedicated `lodgingIcon` (34px Viking-blue 🏠 marker, 3px white border, 1000 zIndex) in `index.html` rendered into a non-clustering `planLodgingLayer` so the 4 stays are always visible regardless of zoom. Updated map legend with "🏠 Where we sleep" item + matching CSS dot. Added 20 new `essentials` / `food` / `activity` suggestion pins around each base: Valencia (Mercadona, pharmacy, bakery, heladería, playground), Williams BCN apt (Caprabo, 24h pharmacy on Passeig de Gràcia, Baluard bakery, Granja Viader, Plaça Tetuán playground), Thomas BCN apt (Mercat de Sant Antoni, pharmacy, Hofmann, Universitat playground), Madrid Airbnb (Mercadona, 24h pharmacy at Sol, La Mallorquina, Café La Bicicleta, Tirso playground, BBVA ATM). `focusPlanMap` updated so clicking a stay-flagged marker zooms direct (no cluster spider). Total suggestions now 68 (was 48). | User: "Add more near our stay locations and make it clear where we are staying. There are so many pins and it isn't clear." Stays were drowning in the locked-event cluster. |
| 2026-05-26 | **NEW tab: Day by Day** (`briefings/day-by-day.md`) — full May 26 → Jun 4 master schedule in tabular form. Pulled every locked event from trip-events.json into one scrollable view with explicit timezone labels (CT/ET/CEST). | User: "Is there a day-by-day schedule? That will likely be the most useful." Made it the primary in-trip reference. |
| 2026-05-26 | **NEW tab: Travel Playbook** (`briefings/travel-playbook.md`) — Madrid Barajas T4S + Barcelona El Prat T1 + Boston Logan + JFK + Nashville BNA airport navigation; Renfe AVE/Euromed boarding rules (security, 2-min cutoff, Premium Club Lounge, Coach 1 positioning); Cercanías C1; per-city metro stops near each lodging + cards (T-Casual, Hola BCN, T-usual); taxi/Uber/Cabify/FreeNow by city; "I just landed" cheat sheet. | User: "Include airport navigation and guidance/any specific rules. Same with train." |
| 2026-05-26 | **Map densified to 48 suggestion pins** (was 8) in `trip-events.json`: train stations (Chamartín, Atocha, Sants, BCN El Prat, Barajas T4S, Valencia Joaquín Sorolla, Valencia Estació del Nord), 6 metro stops at lodgings (Tirso de Molina, La Latina, Sol, Passeig de Gràcia, Diagonal, Universitat, Catalunya, Marina Reial tram), Thomas apartment lodging pin, top restaurants near each base (San Ginés, Sobrino de Botín, La Venencia, Casa Alberto, Juana la Loca, Casa Lucas, Tapas 24, Cervecería Catalana, Can Paixano, El Xampanyet, La Pepica), attractions (Plaza Mayor, San Miguel, Royal Palace, Casa Batlló, Boqueria, Plaça Reial, Barceloneta, Bunkers del Carmel, Palau Blaugrana, Camp Nou, Turia, Albufera, Mestalla). Also tightened Valencia beach house lat/lng (was off by ~500m) and Madrid Airbnb lat/lng (~150m off). | User: "Is the map up to date with detail down to airbnb location and train stations… nearby metro options and taxi options posted too. Plus any awesome spots we should visit." |
| 2026-05-26 | Wired both new briefings into `TAB_DEFS` in `index.html` (📅 Day by Day after Overview, 🧳 Travel Playbook after Plan) and added both to `generate-agent-context.py` so the AI assistant can answer day/airport/train questions from grounded data. | New tabs need both UI wiring and chat-context inclusion. |
| 2026-05-26 | Barcelona phase restructured: replaced "Wedding Events / One Week Out / Weekend Venue Maps / Tour Day Schedule" patchwork with **Daily Timelines (Fri/Sat/Sun/Mon)** + **Wedding Cheat Sheet** + **Free-Time Picks**. Removed duplicate Sagrada recommendation (was both #1 in Recommendations and in Tour Day table) | User feedback: "frankensteined from so many updates," repeat info, "see schedule below" with unclear "below." Consolidated 9:15 → 12:15 → 17:00 into one Saturday timeline. |
| 2026-05-26 | Removed Casa Gay suit rental everywhere: Trip_Planning_Document.md (Suit Rental section, Wedding Attire bullet, Luggage Strategy combo plan, Packing table, What NOT to over-pack, Bookings to Make NOW callout), trip-events.json (`sug-casa-gay` event + luggageGap Combo Plan + checkout description), trip-quick-ref.json (contacts + expenses), briefings/Barcelona.md | Chandler is bringing his own tux — local rental no longer needed. |
| 2026-05-26 | Added per-day **Daily Timelines** sections to Valencia (Wed/Thu/Fri) and Madrid (Mon/Tue/Wed/Thu); removed duplicate Casa Carmela "Recommendation #1" (kept in Restaurants section + timeline 13:00 entry); renumbered Valencia free-time picks | User: "Each day should have a clear timeline for events that are preset." |
| 2026-05-26 | Trimmed duplicate "Recommended Schedule" tables from Valencia→Barcelona and Barcelona→Madrid "Getting There" sections; replaced with cross-references to Daily Timelines | Cut fat — same info was living in two places. |
| 2026-05-26 | Madrid→Valencia primary/fallback split (ZUBYYB 14:30 from Chamartín / 4XYBG8 19:40 from Atocha); new `train-madrid-valencia-fallback` event + route in trip-events.json; rewrote Step 1/Step 2/Recommended Schedule sections | Renfe ticket bought May 26 morning for an earlier train. Cancel fallback once seated on primary. |
| 2026-05-26 | New **Family Fun** tab (`briefings/family-fun.md` + TAB_DEFS wiring) — sports tie-ins for Elise (soccer/Bernabéu), Carson (wrestling/Tarragona Roman amphitheater), Harrison (FC Barcelona roller hockey), scavenger hunts per city, hikes, beaches with ratings, train-ride bingo, seasonal activities | User requested kid-focused activities, scavenger hunts, beach ratings, sports hooks. |
| 2026-05-26 | Added "Local Climate & Events (live)" + "Things to Watch For Along Routes" sections to Trip_Planning_Document.md; updated all 3 briefings with a "Refreshed during your trip" subsection | User asked for current political/strike scan + route sightseeing callouts. |
| 2026-05-26 | Rewrote luggage section as 8-bag detailed per-transition strategy (primary + backup for each gap) | User flagged formal-event wardrobe = ~8 bags; needed optimal storage points throughout. |
| 2026-05-26 | Expanded `trip-events.json` with `currentEvents` array (strikes, festivals, sports notes with `impact` field) and full luggage backup plans | Source-of-truth for both Plan tab and chat assistant grounding. |
| 2026-05-26 | Added `briefing-family-fun` section to `generate-agent-context.py` | Chat assistant should answer kid-activity questions. |
| 2026-05-25 | Full passport APIS fields for Williams party (6) in trip doc + Quick Reference cards | JetBlue check-in needs DOB, gender, expiry, etc. — extracted from passport photo zip |
| 2026-05-24 | Trip assistant: FAB, mobile overlay, desktop panel, `netlify/functions/chat.mjs`, `generate-agent-context.py` | AI Q&A grounded in trip data via OpenAI proxy |
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
