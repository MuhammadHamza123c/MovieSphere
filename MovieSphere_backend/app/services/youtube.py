import random
import httpx
from datetime import datetime, timezone, timedelta
from app.core.config import YOUTUBE_API_KEY, SUPABASE_URL, SUPABASE_KEY

REELS_QUERIES = [
    "movie trailer", "tv show trailer", "movie edit", "fan edit movie",
    "behind the scenes movie", "making of movie", "movie clip",
    "movie bloopers", "cinematic edit", "series trailer",
    "movie interview", "behind the scenes tv", "upcoming movie trailer",
    "best movie scenes", "tv show clip", "movie behind the scenes documentary",
    "fan made movie trailer", "movie tribute", "movie moment",
    "tv show behind the scenes"
]

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

async def get_reels(page: int = 1):
    global _TABLE_CHECKED
    if not _TABLE_CHECKED:
        await _ensure_cache_table()
        _TABLE_CHECKED = True

    query = random.choice(REELS_QUERIES)

    cached = await _get_cached(query, page)
    if cached:
        return cached

    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "type": "video",
        "videoEmbeddable": "true",
        "maxResults": 10,
        "q": query,
        "key": YOUTUBE_API_KEY,
        "pageToken": "",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            return []
        data = r.json()

    items = data.get("items", [])
    results = [
        {
            "videoId": item["id"]["videoId"],
            "title": item["snippet"]["title"],
            "description": item["snippet"]["description"],
            "channelTitle": item["snippet"]["channelTitle"],
            "thumbnail": item["snippet"]["thumbnails"]["high"]["url"]
            if "high" in item["snippet"]["thumbnails"]
            else item["snippet"]["thumbnails"]["default"]["url"],
            "publishedAt": item["snippet"]["publishedAt"],
        }
        for item in items
        if item["id"]["kind"] == "youtube#video"
    ]

    await _set_cache(query, page, results)
    return results
