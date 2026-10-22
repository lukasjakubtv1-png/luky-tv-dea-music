#!/usr/bin/env python3
"""Refresh publicly shared Suno songs for @luky_tv_dea.
This uses Suno's unofficial public web endpoint, which may change.
On any unexpected response, preserve the previous catalog and fail loudly.
"""
import datetime as dt
import json
import os
from pathlib import Path
import re
import sys
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "songs.json"
FEED = "https://studio-api.prod.suno.com/api/unified/feed"
PROFILE = "https://suno.com/@luky_tv_dea"
USER_ID = "3d739697-12ff-4e4b-8997-a17dc3044639"
UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)

def genre(tags):
    t = str(tags or "").lower()
    for name, keywords in [
        ("Flamenco / Latin", ("flamenco", "latin", "reggaeton", "bachata", "salsa")),
        ("Rap / Hip-hop", ("hip-hop", "hip hop", "rap", "trap")),
        ("Pop-rock", ("pop-rock", "pop rock")),
        ("Rock", ("rock", "metal", "punk")),
        ("Orchestrálna", ("orchestral", "cinematic", "symphonic", "strings", "brass")),
        ("Šansón", ("chanson", "cabaret", "šansón")),
        ("Country / Folk", ("country", "folk", "bluegrass")),
        ("Elektronická", ("electronic", "house", "techno", "edm")),
        ("Jazz / Blues", ("jazz", "blues", "swing", "soul")),
        ("Klavírna", ("piano",)),
        ("Pop", ("pop", "synth", "synthesizer")),
        ("Akustická", ("acoustic", "fingerpicked", "guitar")),
    ]:
        if any(keyword in t for keyword in keywords):
            return name
    return "Autorská hudba"

def duration(seconds):
    try:
        val = int(float(seconds))
        return f"{val//60}:{val%60:02d}" if val > 0 else ""
    except (ValueError, TypeError, OverflowError):
        return ""

def get_page(cursor):
    payload = json.dumps({
        "feed_id": "user_songs", "cursor": cursor, "page_size": 20,
        "request_metadata": {"sort_by": "created_at"},
        "target_user_id": USER_ID,
    }).encode()
    req = urllib.request.Request(FEED, data=payload, method="POST",
        headers={"Accept": "application/json", "Content-Type": "application/json",
                 "Origin": "https://suno.com", "Referer": PROFILE,
                 "User-Agent": "Mozilla/5.0"})
    for retry in range(3):
        try:
            with urllib.request.urlopen(req, timeout=20) as response:
                return json.load(response)
        except (urllib.error.URLError, TimeoutError, ValueError):
            if retry == 2:
                raise
            time.sleep(retry + 1)
    raise RuntimeError("Suno unavailable")

def main():
    tracks = []
    seen = set()
    cursor = None
    for page in range(15):
        body = get_page(cursor)
        feed = body.get("feed")
        if not isinstance(feed, dict) or not isinstance(feed.get("items"), list):
            raise RuntimeError("Unexpected Suno feed response")
        for entry in feed["items"]:
            clip = entry.get("content_item") if isinstance(entry, dict) else None
            if not isinstance(clip, dict):
                continue
            clip_id = str(clip.get("id") or "").lower()
            title = str(clip.get("title") or "").strip()
            if not UUID.fullmatch(clip_id) or not title or clip_id in seen:
                continue
            if clip.get("handle") != "luky_tv_dea":
                continue
            # Suno may not include status in public profile payloads;
            # only reject clips explicitly known as unfinished.
            if clip.get("status") in ("pending", "submitted", "processing", "failed"):
                continue
            seen.add(clip_id)
            meta = clip.get("metadata")
            meta = meta if isinstance(meta, dict) else {}
            tags = " ".join(str(meta.get("tags") or "").split())[:300]
            cover = str(clip.get("image_url") or "")
            if not cover.startswith(("https://cdn1.suno.ai/", "https://cdn2.suno.ai/", "https://d2lwuy8qc234o3.cloudfront.net/")):
                cover = ""
            def count(v):
                try: return max(0, int(v or 0))
                except (ValueError, TypeError): return 0
            tracks.append({
                "id": clip_id,
                "title": title[:180],
                "url": "https://suno.com/song/" + clip_id,
                "audio": "https://cdn1.suno.ai/" + clip_id + ".mp4",
                "cover": cover,
                "duration": duration(meta.get("duration")),
                "views": count(clip.get("play_count")),
                "likes": count(clip.get("upvote_count")),
                "genre": genre(tags),
                "style": tags,
                "version": str(clip.get("major_model_version") or "")[:40],
                "createdAt": str(clip.get("created_at") or "")[:40],
            })
        nxt = feed.get("next_cursor")
        print(f"Page {page+1}: {len(tracks)} songs")
        if not nxt:
            break
        if str(nxt) == str(cursor):
            raise RuntimeError("Suno pagination cursor did not advance")
        cursor = str(nxt)
    else:
        raise RuntimeError("Suno pagination was truncated; old catalog preserved")
    if not tracks:
        raise RuntimeError("No public Suno tracks; old catalog preserved")
    try:
        old = json.loads(CATALOG.read_text(encoding="utf-8")).get("songs", [])
    except (FileNotFoundError, json.JSONDecodeError):
        old = []
    if isinstance(old, list) and len(old) >= 10 and len(tracks) < len(old)*0.6:
        raise RuntimeError("Unexpectedly few tracks; old catalog preserved")
    payload = {
        "artist": "Luky TV DEA",
        "source": PROFILE,
        "updatedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "total": len(tracks),
        "songs": tracks,
    }
    # Avoid needless commits when only the sync timestamp changes.
    if isinstance(old, list) and old == tracks:
        print("No content change; keeping timestamp")
        return
    temp = CATALOG.with_suffix(".tmp")
    temp.write_text(json.dumps(payload, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    os.replace(temp, CATALOG)
    old_ids = {x.get("id") for x in old} if isinstance(old, list) else set()
    print(f"Imported {len(tracks)} public songs, new: {len(seen-old_ids)}")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("Suno synchronization failed:", exc, file=sys.stderr)
        sys.exit(1)
