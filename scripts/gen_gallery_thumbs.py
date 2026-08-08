import json
import os
import sys
import urllib.request
from playwright.sync_api import sync_playwright

API = os.environ.get("THUMB_API", "http://localhost:8001")
OUT = "/app/frontend/public/gallery-thumbs"
os.makedirs(OUT, exist_ok=True)

builds = json.load(urllib.request.urlopen(f"{API}/api/builder/gallery"))
print(f"{len(builds)} builds")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1200, "height": 680})
    ok = 0
    for b in builds:
        slug = b["slug"]
        try:
            page.goto(f"{API}/api/p/{slug}", wait_until="load", timeout=20000)
            page.wait_for_timeout(2500)
            page.screenshot(path=f"{OUT}/{slug}.jpg", type="jpeg", quality=68)
            ok += 1
            print("ok", slug)
        except Exception as e:
            print("fail", slug, str(e)[:80], file=sys.stderr)
    browser.close()
print(f"done: {ok}/{len(builds)}")
