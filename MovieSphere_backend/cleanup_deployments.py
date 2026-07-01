import os
import sys
import requests

OWNER = "MuhammadHamza123c"
REPO = "MovieSphere"
KEEP = 3

TOKEN = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN") or (sys.argv[1] if len(sys.argv) > 1 else None)
if not TOKEN:
    print("Usage: python cleanup_deployments.py <GITHUB_TOKEN>")
    print("Or set GITHUB_TOKEN or GH_TOKEN environment variable.")
    print("\nCreate a token at: https://github.com/settings/tokens (repo scope)")
    sys.exit(1)

headers = {"Authorization": f"Bearer {TOKEN}", "Accept": "application/vnd.github+json"}
base = f"https://api.github.com/repos/{OWNER}/{REPO}/deployments"

all_deployments = []
page = 1
while True:
    r = requests.get(base, headers=headers, params={"per_page": 100, "page": page})
    if not r.ok:
        print(f"Failed to fetch page {page}: {r.status_code} {r.text[:100]}")
        break
    data = r.json()
    if not data:
        break
    all_deployments.extend(data)
    page += 1

print(f"Total deployments: {len(all_deployments)}")
all_deployments.sort(key=lambda d: d["created_at"], reverse=True)

to_keep = all_deployments[:KEEP]
to_delete = all_deployments[KEEP:]

for d in to_keep:
    env = d.get("environment", "?")
    sha = d["sha"][:7]
    print(f"  KEPT   #{d['id']} ({env}) {sha}")

deleted = 0
failed = 0
for d in to_delete:
    did = d["id"]
    r = requests.delete(f"{base}/{did}", headers=headers)
    if r.status_code == 204:
        deleted += 1
    else:
        failed += 1
        print(f"  FAILED #{did}: {r.status_code}")

print(f"\nKept {KEEP}, deleted {deleted}, failed {failed}")
