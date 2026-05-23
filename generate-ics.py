#!/usr/bin/env python3
"""Generate spain-2026.ics from trip-events.json (RFC 5545, no blank lines inside components)."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EVENTS_JSON = ROOT / "trip-events.json"
ICS_OUT = ROOT / "spain-2026.ics"

# All-day lodging spans — calendar-only visibility (not on Plan timeline).
STAY_EVENTS = [
    {
        "uid": "spain-2026-valencia-house@spain-trip",
        "summary": "Valencia stay: Beach house",
        "start": "2026-05-27",
        "end": "2026-05-30",
        "location": "Valencia, Spain",
        "description": (
            "Grandmother's house next to the beach. Vrbo HA-7TLM9D. Host Maria Pilar. "
            "Crib confirmed for Harlan. Check-in May 27 4:00 PM; checkout May 29 11:00 AM "
            "(leave ~07:45 May 29 for train)."
        ),
    },
    {
        "uid": "spain-2026-barcelona-stay@spain-trip",
        "summary": "Barcelona stay",
        "start": "2026-05-29",
        "end": "2026-06-01",
        "location": "Barcelona, Spain",
        "description": (
            "Williams apartment on Valencia Street (726EF3C0B8); Thomas family and Grandma at Ghost apartment. "
            "Wedding weekend. Check-in May 29 2:00 PM; check-out June 1 11:00 AM."
        ),
    },
    {
        "uid": "spain-2026-madrid-stay@spain-trip",
        "summary": "Madrid Airbnb stay",
        "start": "2026-06-01",
        "end": "2026-06-04",
        "location": "Madrid, Spain",
        "description": (
            "Airbnb HMR8NYWPZF. Whole family. Earliest check-in 15:00; Williams arrive ~19:00 Jun 1. "
            "Thomas depart Jun 3; Williams Jun 4 (Corpus Christi — shops closed)."
        ),
    },
]

VTIMEZONES = """BEGIN:VTIMEZONE
TZID:Europe/Madrid
X-LIC-LOCATION:Europe/Madrid
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VTIMEZONE
TZID:America/New_York
X-LIC-LOCATION:America/New_York
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VTIMEZONE
TZID:America/Chicago
X-LIC-LOCATION:America/Chicago
BEGIN:DAYLIGHT
TZOFFSETFROM:-0600
TZOFFSETTO:-0500
TZNAME:CDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0500
TZOFFSETTO:-0600
TZNAME:CST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE"""


def escape_ics(text: str) -> str:
    return (
        text.replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\r\n", "\n")
        .replace("\r", "\n")
        .replace("\n", "\\n")
    )


def fold_line(line: str, limit: int = 75) -> list[str]:
    raw = line.encode("utf-8")
    if len(raw) <= limit:
        return [line]
    out: list[str] = []
    first = True
    while line:
        prefix = "" if first else " "
        budget = limit if first else limit - 1
        cut = min(len(line), budget)
        while cut > 0 and len((prefix + line[:cut]).encode("utf-8")) > limit:
            cut -= 1
        out.append(prefix + line[:cut])
        line = line[cut:]
        first = False
    return out


def parse_iso(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def ics_date(value: str) -> str:
    return value[:10].replace("-", "")


def default_end(start: datetime, category: str) -> datetime:
    hours = 1 if category in {"task", "lodging", "travel"} else 2
    from datetime import timedelta

    return start + timedelta(hours=hours)


def timed_props(start: str, end: str | None, tz: str, category: str) -> tuple[str, str]:
    start_dt = parse_iso(start)
    end_dt = parse_iso(end) if end else default_end(start_dt, category)

    # US outbound legs: keep local TZID for readability in Apple/Google.
    if tz in {"America/New_York", "America/Chicago", "Europe/Madrid"}:
        same_tz = (
            (start_dt.utcoffset() == end_dt.utcoffset())
            and start_dt.tzinfo is not None
            and end_dt.tzinfo is not None
        )
        if same_tz and str(start_dt.tzinfo) == str(end_dt.tzinfo):
            fmt = "%Y%m%dT%H%M%S"
            return (
                f"DTSTART;TZID={tz}:{start_dt.strftime(fmt)}",
                f"DTEND;TZID={tz}:{end_dt.strftime(fmt)}",
            )

    # Cross-timezone (e.g. Boston→Madrid): UTC avoids invalid mixed TZID pairs.
    fmt_z = "%Y%m%dT%H%M%SZ"
    return (
        f"DTSTART:{start_dt.astimezone(timezone.utc).strftime(fmt_z)}",
        f"DTEND:{end_dt.astimezone(timezone.utc).strftime(fmt_z)}",
    )


def location_for(event: dict) -> str:
    city = event.get("city") or ""
    category = event.get("category") or ""
    title = event.get("title") or ""
    if "Nashville" in title:
        return "Nashville International Airport (BNA)"
    if "Boston" in title and "Madrid" not in title:
        return "Boston Logan International Airport (BOS)"
    if "JFK" in title or "New York" in title:
        return "New York JFK"
    if "Barcelona" in title and "JFK" in title:
        return "Barcelona-El Prat Airport (BCN)"
    if category == "travel" and city == "Madrid" and "depart" in title.lower():
        return "Madrid Barajas Airport (MAD)"
    if city and city != "Travel":
        return f"{city}, Spain"
    return ""


def build_vevent(
    uid: str,
    summary: str,
    start: str,
    end: str | None,
    tz: str,
    category: str,
    description: str = "",
    location: str = "",
    all_day: bool = False,
) -> list[str]:
    lines = [
        "BEGIN:VEVENT",
        f"UID:{uid}",
        "DTSTAMP:20260523T120000Z",
        f"SUMMARY:{escape_ics(summary)}",
    ]
    if all_day:
        end_date = end or start
        # DTEND for all-day is exclusive (day after last night).
        lines.append(f"DTSTART;VALUE=DATE:{ics_date(start)}")
        lines.append(f"DTEND;VALUE=DATE:{ics_date(end_date)}")
    else:
        ds, de = timed_props(start, end, tz, category)
        lines.extend([ds, de])
    if location:
        lines.append(f"LOCATION:{escape_ics(location)}")
    if description:
        lines.append(f"DESCRIPTION:{escape_ics(description)}")
    lines.append("END:VEVENT")
    return lines


def main() -> None:
    data = json.loads(EVENTS_JSON.read_text(encoding="utf-8"))
    meta = data["meta"]
    events = data["events"]

    body: list[str] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Spain 2026 Trip//Travel Site//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{escape_ics(meta['title'])}",
        "X-WR-CALDESC:Spain 2026 family trip. Regenerate with generate-ics.py.",
        "X-WR-TIMEZONE:Europe/Madrid",
    ]
    body.extend(VTIMEZONES.strip().split("\n"))

    for ev in events:
        tz = ev.get("timezone") or meta.get("timezoneDefault", "Europe/Madrid")
        body.extend(
            build_vevent(
                uid=f"spain-2026-{ev['id']}@spain-trip",
                summary=ev["title"],
                start=ev["start"],
                end=ev.get("end"),
                tz=tz,
                category=ev.get("category", ""),
                description=ev.get("description", ""),
                location=location_for(ev),
            )
        )

    for stay in STAY_EVENTS:
        body.extend(
            build_vevent(
                uid=stay["uid"],
                summary=stay["summary"],
                start=stay["start"],
                end=stay["end"],
                tz="Europe/Madrid",
                category="lodging",
                description=stay["description"],
                location=stay.get("location", ""),
                all_day=True,
            )
        )

    body.append("END:VCALENDAR")

    folded: list[str] = []
    for line in body:
        folded.extend(fold_line(line))

    content = "\r\n".join(folded) + "\r\n"
    ICS_OUT.write_bytes(content.encode("utf-8"))

    vevent_count = content.count("BEGIN:VEVENT")
    empty_lines = sum(1 for ln in content.splitlines() if not ln.strip())
    print(f"Wrote {ICS_OUT.name}: {vevent_count} events, {empty_lines} empty lines")


if __name__ == "__main__":
    main()
