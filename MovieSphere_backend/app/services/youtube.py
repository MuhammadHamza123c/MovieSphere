import random
import re
import requests
import httpx
from datetime import datetime, timezone, timedelta
from app.core.config import YOUTUBE_API_KEY, SUPABASE_URL, SUPABASE_KEY

CATEGORIES = {
    "trailers": ["new movie trailer", "upcoming movie trailer", "tv series trailer 2025", "movie teaser trailer", "final trailer"],
    "fan_edits": ["fan edit movie", "movie edit aesthetic", "cinematic edit movie", "movie amv", "fan made movie trailer", "movie character edit", "movie tribute"],
    "behind_scenes": ["behind the scenes movie", "making of movie scene", "movie visual effects behind the scenes", "behind the scenes tv show", "movie stunt behind the scenes", "movie bts"],
    "actor_content": ["actor best scenes", "actor interview", "actor funny moments", "actor movie moments", "celebrity interview", "actor career"],
    "bloopers": ["movie bloopers", "funny movie moments", "movie outtakes", "tv show bloopers"],
    "clips": ["best movie scenes", "most iconic movie scenes", "movie clip", "tv show clip", "best cinematic moments"],
    "explainer": ["movie explained", "movie breakdown", "movie ending explained", "movie details you missed"],
}

ALL_QUERIES = [q for cat in CATEGORIES.values() for q in cat]

SUPABASE_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
}

CACHE_TTL = timedelta(hours=6)

async def _ensure_cache_table():
    sql = """CREATE TABLE IF NOT EXISTS reels_cache (
        id BIGSERIAL PRIMARY KEY,
        query TEXT NOT NULL,
        page INT NOT NULL DEFAULT 1,
        response JSONB NOT NULL,
        cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(query, page)
    )"""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/",
                headers={**SUPABASE_HEADERS, 'Content-Type': 'application/json'},
                json={"query": sql}
            )
            if r.status_code == 200:
                return True
            r = await client.post(
                f"{SUPABASE_URL}/pg/v1/sql",
                headers={'Authorization': f'Bearer {SUPABASE_KEY}', 'Content-Type': 'application/json'},
                json={"query": sql}
            )
            return r.status_code == 200
    except:
        return False

_TABLE_CHECKED = False

async def _get_cached(query: str, page: int):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"{SUPABASE_URL}/rest/v1/reels_cache",
                headers=SUPABASE_HEADERS,
                params={
                    "query": f"eq.{query}",
                    "page": f"eq.{page}",
                    "select": "response,cached_at",
                    "limit": 1,
                }
            )
            if r.status_code != 200 or not r.json():
                return None
            row = r.json()[0]
            cached_at = datetime.fromisoformat(row['cached_at'].replace('Z', '+00:00'))
            if datetime.now(timezone.utc) - cached_at > CACHE_TTL:
                return None
            return row['response']
    except:
        return None

async def _set_cache(query: str, page: int, data: list):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"{SUPABASE_URL}/rest/v1/reels_cache",
                headers=SUPABASE_HEADERS,
                json={
                    "query": query,
                    "page": page,
                    "response": data,
                    "cached_at": datetime.now(timezone.utc).isoformat(),
                }
            )
    except:
        pass

def _parse_duration(iso_duration: str) -> int:
    match = re.match(r'PT(?:(\d+)M)?(?:(\d+)S)?', iso_duration)
    if not match:
        return 999
    minutes = int(match.group(1) or 0)
    seconds = int(match.group(2) or 0)
    return minutes * 60 + seconds

def _parse_video(item):
    return {
        "videoId": item["id"]["videoId"],
        "title": item["snippet"]["title"],
        "description": item["snippet"]["description"],
        "channelTitle": item["snippet"]["channelTitle"],
        "thumbnail": item["snippet"]["thumbnails"]["high"]["url"]
        if "high" in item["snippet"]["thumbnails"]
        else item["snippet"]["thumbnails"]["default"]["url"],
        "publishedAt": item["snippet"]["publishedAt"],
    }

async def _fetch_query(query: str, max_results: int = 8):
    cached = await _get_cached(query, 1)
    if cached:
        return cached[:max_results]

    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "type": "video",
        "videoEmbeddable": "true",
        "videoDuration": "short",
        "maxResults": max_results + 5,
        "q": query,
        "key": YOUTUBE_API_KEY,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            return []
        data = r.json()

    items = [
        item for item in data.get("items", [])
        if item["id"]["kind"] == "youtube#video"
    ]
    if not items:
        return []

    video_ids = [item["id"]["videoId"] for item in items]
    dur_url = "https://www.googleapis.com/youtube/v3/videos"
    dur_params = {
        "part": "contentDetails",
        "id": ",".join(video_ids),
        "key": YOUTUBE_API_KEY,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        dr = await client.get(dur_url, params=dur_params)
        if dr.status_code == 200:
            dur_map = {}
            for v in dr.json().get("items", []):
                dur = _parse_duration(v["contentDetails"]["duration"])
                dur_map[v["id"]] = dur
            results = [
                _parse_video(item) for item in items
                if dur_map.get(item["id"]["videoId"], 999) < 60
            ]
        else:
            results = [_parse_video(item) for item in items]

    await _set_cache(query, 1, results)
    return results[:max_results]

async def get_reels(page: int = 1):
    global _TABLE_CHECKED
    if not _TABLE_CHECKED:
        await _ensure_cache_table()
        _TABLE_CHECKED = True

    chosen = random.sample(list(CATEGORIES.keys()), min(3, len(CATEGORIES)))
    queries = [random.choice(CATEGORIES[c]) for c in chosen]

    all_results = []
    for q in queries:
        results = await _fetch_query(q, 8)
        all_results.extend(results)
        if len(all_results) >= 15:
            break

    random.shuffle(all_results)
    return all_results[:15]


def get_behind_scenes(title: str, media_type: str, max_results: int = 4):
    query = f"{title} behind the scenes"
    if media_type == 'tv':
        query = f"{title} behind the scenes tv show"

    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "type": "video",
        "videoEmbeddable": "true",
        "maxResults": max_results + 2,
        "q": query,
        "key": YOUTUBE_API_KEY,
    }

    r = requests.get(url, params=params, timeout=10)
    if r.status_code != 200:
        return []

    items = r.json().get("items", [])
    results = []
    for item in items:
        if item["id"]["kind"] != "youtube#video":
            continue
        vid = item["id"]["videoId"]
        dur_params = {"part": "contentDetails", "id": vid, "key": YOUTUBE_API_KEY}
        dr = requests.get("https://www.googleapis.com/youtube/v3/videos", params=dur_params, timeout=10)
        if dr.status_code == 200:
            dur_items = dr.json().get("items", [])
            if dur_items:
                secs = _parse_duration(dur_items[0]["contentDetails"]["duration"])
                if secs > 600:
                    continue
        results.append({
            "key": vid,
            "name": item["snippet"]["title"],
            "type": "Behind the Scenes",
        })
        if len(results) >= max_results:
            break

    return results
