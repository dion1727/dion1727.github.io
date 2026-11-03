#!/usr/bin/env python3
"""Cache the public GitHub contribution calendar; never generate fake activity."""
import json
from pathlib import Path
from urllib.request import Request, urlopen

URL = "https://github-contributions-api.jogruber.de/v4/dion1727?y=last"
DEST = Path("data/contributions.json")
req = Request(URL, headers={"User-Agent": "dion1727-profile-arcade/1.0", "Accept": "application/json"})
with urlopen(req, timeout=25) as resp:
    data = json.load(resp)
rows = data.get("contributions", [])
assert isinstance(rows, list) and rows, "No contribution days returned; preserving previous cache"
clean = []
for row in rows:
    date, count = row.get("date"), row.get("count")
    if not isinstance(date, str) or len(date) != 10:
        continue
    if not isinstance(count, int) or count < 0:
        continue
    clean.append({"date": date, "count": count, "level": min(4, max(0, int(row.get("level") or 0)))})
assert clean, "No valid contribution days; preserving previous cache"
payload = {"username": "dion1727", "source": "public-contribution-calendar", "days": clean}
# Avoid unnecessary new commits when the calendar has not changed.
try:
    previous = json.loads(DEST.read_text(encoding="utf-8"))
except (FileNotFoundError, ValueError):
    previous = {}
if previous.get("days") != clean:
    DEST.parent.mkdir(parents=True, exist_ok=True)
    DEST.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Cached {len(clean)} calendar days")
else:
    print("Calendar unchanged")
