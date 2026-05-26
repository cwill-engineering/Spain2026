#!/usr/bin/env python3
"""Bundle trip markdown/JSON into agent-context.json for the Netlify chat function."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "agent-context.json"

SECTIONS: list[tuple[str, str, Path]] = [
    ("trip-plan", "Trip Planning Document", ROOT / "Trip_Planning_Document.md"),
    ("day-by-day", "Day by Day master schedule (every preset event May 26 \u2192 Jun 4)", ROOT / "briefings" / "day-by-day.md"),
    ("travel-playbook", "Travel Playbook (airports, Renfe trains, metro, taxis)", ROOT / "briefings" / "travel-playbook.md"),
    ("trip-events", "Structured Itinerary (trip-events.json)", ROOT / "trip-events.json"),
    ("quick-ref", "Quick Reference (trains, lodging, emergency)", ROOT / "trip-quick-ref.json"),
    ("eat-drink", "Top Eats and Drinks", ROOT / "eat-drink.json"),
    ("briefing-valencia", "Valencia Decoded", ROOT / "briefings" / "Valencia.md"),
    ("briefing-barcelona", "Barcelona Unpacked", ROOT / "briefings" / "Barcelona.md"),
    ("briefing-madrid", "Madrid in Context", ROOT / "briefings" / "Madrid.md"),
    ("briefing-family-fun", "Family Fun (scavenger hunts, sports, hikes, beaches, kids' games)", ROOT / "briefings" / "family-fun.md"),
]


def load_content(path: Path) -> str:
    if not path.exists():
        print(f"Missing: {path}", file=sys.stderr)
        sys.exit(1)
    if path.suffix == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        return json.dumps(data, indent=2, ensure_ascii=False)
    return path.read_text(encoding="utf-8")


def main() -> None:
    sections = []
    for sid, title, path in SECTIONS:
        sections.append({"id": sid, "title": title, "content": load_content(path)})

    payload = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "trip": "Spain 2026 — Williamson Thomas Family",
        "sections": sections,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    total_kb = OUT.stat().st_size / 1024
    print(f"Wrote {OUT.name} ({total_kb:.1f} KB, {len(sections)} sections)", file=sys.stderr)


if __name__ == "__main__":
    main()
