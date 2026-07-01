import os
import sys
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

OWNER = "MuhammadHamza123c"
REPO = "MovieSphere"
KEEP = 3

TOKEN = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN") or (sys.argv[1] if len(sys.argv) > 1 else None)
if not TOKEN:
    print("Usage: python cleanup_deployments.py <GITHUB_TOKEN>")
    sys.exit(1)

headers = {"Authorization": f"Bearer {TOKEN}", "Accept": "application/vnd.github+json"}
base = f"https://api.github.com/repos/{OWNER}/{REPO}/deployments"

# Fetch all deployments
all_deployments = []
page = 1
while True:
    r = requests.get(base, headers=headers, params={"per_page": 100, "page": page}, timeout=15)
    if not r.ok:
        print(f"Fetch failed page {page}: {r.status_code}")
        break
    data = r.json()
    if not data:
        break
    all_deployments.extend(data)
    print(f"  Fetched page {page} ({len(data)} deployments)", flush=True)
    page += 1

print(f"\nTotal: {len(all_deployments)}")
all_deployments.sort(key=lambda d: d["created_at"], reverse=True)

to_keep = all_deployments[:KEEP]
to_delete = all_deployments[KEEP:]

for d in to_keep:
    print(f"  KEPT   #{d['id']} ({d.get('environment','?')}) {d['sha'][:7]}")

print(f"\nDeleting {len(to_delete)} deployments with 10 parallel workers...")

deleted = 0
failed = 0
with ThreadPoolExecutor(max_workers=10) as pool:
    futures = {pool.submit(requests.delete, f"{base}/{d['id']}", headers=headers, timeout=15): d for d in to_delete}
    for f in as_completed(futures):
        d = futures[f]
        try:
            r = f.result()
            if r.status_code == 204:
                deleted += 1
            else:
                failed += 1
                print(f"  FAILED #{d['id']}: {r.status_code}", flush=True)
        except Exception as e:
            failed += 1
            print(f"  ERROR #{d['id']}: {e}", flush=True)
        if (deleted + failed) % 50 == 0:
            print(f"  Progress: {deleted + failed}/{len(to_delete)}", flush=True)

print(f"\nDone! Kept {KEEP}, deleted {deleted}, failed {failed}")
