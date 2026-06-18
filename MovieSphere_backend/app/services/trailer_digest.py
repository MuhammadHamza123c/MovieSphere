import httpx
from datetime import date
from app.core.config import TMDB_API_KEY, YOUTUBE_API_KEY, SUPABASE_URL, SUPABASE_KEY

SUPABASE_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
}

TMDB_SOURCES = [
    ('trending', '/trending/movie/day', 'movie'),
    ('trending', '/trending/tv/day', 'tv'),
    ('popular', '/movie/popular', 'movie'),
    ('popular', '/tv/popular', 'tv'),
]

async def fetch_daily_digest():
    today = date.today().isoformat()
    collected = {}

    async with httpx.AsyncClient(timeout=15) as client:
        for source, tmdb_path, media_type in TMDB_SOURCES:
            try:
                r = await client.get(
                    f'https://api.themoviedb.org/3{tmdb_path}',
                    params={'api_key': TMDB_API_KEY, 'language': 'en-US', 'page': 1}
                )
                if r.status_code != 200:
                    continue
                results = r.json().get('results', [])[:10]
                for item in results:
                    mid = item['id']
                    key = (mid, media_type)
                    if key in collected:
                        continue
                    title = item.get('title') or item.get('name', '')
                    poster = item.get('poster_path')
                    poster_url = f'https://image.tmdb.org/t/p/w500{poster}' if poster else None
                    collected[key] = {
                        'media_id': mid,
                        'media_type': media_type,
                        'title': title,
                        'poster_url': poster_url,
                        'source': source,
                    }
            except:
                continue

    trailers = []
    async with httpx.AsyncClient(timeout=15) as client:
        for key, item in collected.items():
            try:
                q = f"{item['title']} official trailer"
                r = await client.get(
                    'https://www.googleapis.com/youtube/v3/search',
                    params={
                        'part': 'snippet',
                        'q': q,
                        'key': YOUTUBE_API_KEY,
                        'maxResults': 1,
                        'type': 'video',
                    }
                )
                if r.status_code != 200:
                    continue
                items = r.json().get('items', [])
                if not items:
                    continue
                vid = items[0]['id']['videoId']
                snippet = items[0]['snippet']
                trailers.append({
                    'media_id': item['media_id'],
                    'media_type': item['media_type'],
                    'title': item['title'],
                    'poster_url': item['poster_url'],
                    'trailer_url': vid,
                    'trailer_title': snippet.get('title', ''),
                    'source': item['source'],
                    'created_at': today,
                })
            except:
                continue

    inserted = []
    async with httpx.AsyncClient(timeout=30) as client:
        for t in trailers:
            try:
                r = await client.post(
                    f'{SUPABASE_URL}/rest/v1/daily_trailers',
                    headers=SUPABASE_HEADERS,
                    json=t,
                    params={'on_conflict': 'media_id,media_type,created_at'}
                )
                if r.status_code in (200, 201):
                    inserted.append(t)
            except:
                continue

    return inserted

async def send_push_notifications(trailers, max_count=5):
    if not trailers:
        return []
    selected = trailers[:max_count]

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f'{SUPABASE_URL}/rest/v1/push_subscriptions',
            headers=SUPABASE_HEADERS,
            params={'select': 'endpoint,p256dh_key,auth_key'},
        )
        if r.status_code != 200:
            return []
        subs = r.json()

    sent = []
    for sub in subs:
        for t in selected:
            try:
                payload = {
                    'title': f"New {t['media_type']} trailer",
                    'body': t['title'],
                    'icon': t['poster_url'] or '/logo.png',
                    'data': {
                        'media_id': t['media_id'],
                        'media_type': t['media_type'],
                        'url': f"/{t['media_type']}/{t['media_id']}",
                    },
                }
                _send_push(sub['endpoint'], sub['p256dh_key'], sub['auth_key'], payload)
                sent.append(t['media_id'])
            except:
                continue
    return sent

def _send_push(endpoint, p256dh, auth, payload):
    try:
        import json
        from pywebpush import webpush
        from app.core.config import VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY
        webpush(
            subscription_info={
                'endpoint': endpoint,
                'keys': {
                    'p256dh': p256dh,
                    'auth': auth,
                }
            },
            data=json.dumps(payload),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={
                'sub': 'mailto:admin@moviesphere.app',
            }
        )
    except:
        pass
