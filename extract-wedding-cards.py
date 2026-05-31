#!/usr/bin/env python3
"""Extract HEIC itinerary photos from Photos-3-001.zip → source/wedding-itinerary/*.jpg."""

from __future__ import annotations

import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ZIP_PATH = ROOT / "Photos-3-001.zip"
OUT_DIR = ROOT / "source" / "wedding-itinerary"
PARSED = OUT_DIR / "parsed-cards.json"


def main() -> None:
    try:
        from pillow_heif import register_heif_opener

        register_heif_opener()
        from PIL import Image
    except ImportError as exc:
        raise SystemExit("Install pillow-heif and Pillow: pip install pillow-heif pillow") from exc

    if not ZIP_PATH.exists():
        raise SystemExit(f"Missing {ZIP_PATH.name}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    converted: list[str] = []

    with zipfile.ZipFile(ZIP_PATH) as zf:
        for name in zf.namelist():
            if not name.lower().endswith(".heic"):
                continue
            zf.extract(name, OUT_DIR)
            heic = OUT_DIR / name
            jpg = OUT_DIR / f"{Path(name).stem}.jpg"
            Image.open(heic).save(jpg, "JPEG", quality=90)
            converted.append(jpg.name)
            heic.unlink(missing_ok=True)

    print(f"Converted {len(converted)} images → {OUT_DIR}")
    if PARSED.exists():
        data = json.loads(PARSED.read_text(encoding="utf-8"))
        print(f"Card metadata: {PARSED.name} ({len(data.get('cards', []))} cards)")


if __name__ == "__main__":
    main()
