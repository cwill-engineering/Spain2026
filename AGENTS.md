# AGENTS.md

## Cursor Cloud specific instructions

This is a **zero-dependency static website** (no package manager, no build system, no backend). All content is served directly from the repository root.

### Running the site

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/` and enter the password `Spain_2026_JN` (hardcoded in `index.html`).

### Key commands

| Action | Command |
|--------|---------|
| Serve site locally | `python3 -m http.server 8000` |
| Regenerate calendar | `python3 generate-ics.py` |

### Architecture notes

- `index.html` — full SPA shell (password gate, tabs, styles, JS). Loads content client-side via fetch.
- `Trip_Planning_Document.md` — rendered into content tabs by top-level `#` headings.
- `briefings/*.md` — city deep-dive tabs (Valencia, Barcelona, Madrid); lazy-loaded on tab open.
- `trip-events.json` — structured itinerary data for the Plan tab (vis-timeline + Leaflet map).
- `spain-2026.ics` — subscribable calendar; regenerate with `python3 generate-ics.py` after editing `trip-events.json`.
- External CDN dependencies (marked.js, vis-timeline, Leaflet) are loaded at runtime — internet access required in the browser.

### Gotchas

- **No linter/tests**: There is no configured linter or test framework. Validate changes by serving locally and checking browser rendering.
- **Tab mapping**: Do not add/remove top-level `#` markdown headings in `Trip_Planning_Document.md` without updating `TAB_DEFS` in `index.html`.
- **ICS format**: Never hand-edit `spain-2026.ics` with blank lines between properties (violates RFC 5545). Always regenerate via `python3 generate-ics.py`.
- **Briefing tabs**: Edit files under `briefings/`, not the main trip doc. Tab IDs: `valencia-decoded`, `barcelona-unpacked`, `madrid-context`.
