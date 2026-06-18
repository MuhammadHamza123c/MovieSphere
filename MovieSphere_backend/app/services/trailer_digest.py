import asyncio
import httpx
import json
import random
from datetime import date
from app.core.config import TMDB_API_KEY, SUPABASE_URL, SUPABASE_KEY, GROQ_API_KEY

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

DAILY_LIMIT = 3

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

    async def fetch_trailer(item):
        try:
            videos_path = f"/{'movie' if item['media_type'] == 'movie' else 'tv'}/{item['media_id']}/videos"
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.get(
                    f'https://api.themoviedb.org/3{videos_path}',
                    params={'api_key': TMDB_API_KEY, 'language': 'en-US'}
                )
                if r.status_code != 200:
                    return None
                results = r.json().get('results', [])
                if not results:
                    return None
                official = [v for v in results if v.get('site') == 'YouTube' and v.get('type') == 'Trailer' and v.get('official')]
                if not official:
                    official = [v for v in results if v.get('site') == 'YouTube' and v.get('type') == 'Trailer']
                if not official:
                    return None
                return {
                    'media_id': item['media_id'],
                    'media_type': item['media_type'],
                    'title': item['title'],
                    'poster_url': item['poster_url'],
                    'trailer_url': official[0]['key'],
                    'trailer_title': official[0].get('name', ''),
                    'source': item['source'],
                    'created_at': today,
                }
        except:
            return None

    tasks = [fetch_trailer(item) for item in collected.values()]
    results = await asyncio.gather(*tasks)
    trailers = [r for r in results if r is not None]

    async with httpx.AsyncClient(timeout=30) as client:
        for t in trailers:
            try:
                await client.post(
                    f'{SUPABASE_URL}/rest/v1/daily_trailers',
                    headers=SUPABASE_HEADERS,
                    json=t,
                    params={'on_conflict': 'media_id,media_type,created_at'}
                )
            except:
                pass

    return trailers

async def _get_daily_sent_count():
    today = date.today().isoformat()
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f'{SUPABASE_URL}/rest/v1/daily_trailers',
            headers={**SUPABASE_HEADERS, 'Prefer': 'count=exact'},
            params={
                'select': 'id',
                'created_at': f'eq.{today}',
                'sent': 'eq.true',
            },
        )
        if r.status_code != 200:
            return 0
        cr = r.headers.get('content-range', '')
        try:
            return int(cr.split('/')[-1])
        except:
            return len(r.json())

async def _get_random_unsent():
    today = date.today().isoformat()
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f'{SUPABASE_URL}/rest/v1/daily_trailers',
            headers=SUPABASE_HEADERS,
            params={
                'select': 'id,media_id,media_type,title,poster_url,trailer_url,trailer_title',
                'created_at': f'eq.{today}',
                'sent': 'eq.false',
            },
        )
        if r.status_code != 200 or not r.json():
            return None
        return random.choice(r.json())

async def _mark_sent(id):
    async with httpx.AsyncClient(timeout=10) as client:
        await client.patch(
            f'{SUPABASE_URL}/rest/v1/daily_trailers?id=eq.{id}',
            headers=SUPABASE_HEADERS,
            json={'sent': True},
        )

async def _generate_ai_notification(title, media_type):
    if not GROQ_API_KEY:
        label = 'Trailer' if media_type == 'movie' else 'Episode'
        return f"New {label}", f"Check out the trailer for {title}"

    prompt = (
        f"Generate a push notification for a {media_type} trailer. "
        f"Title: {title}. "
        f"Return ONLY a JSON object with two keys: 'title' (max 40 chars, catchy, with emoji) "
        f"and 'body' (max 80 chars, engaging, mentions the title). "
        f"Use varied phrasing — don't repeat the same style. "
        f"Examples: {{\"title\":\"🎬 New Trailer Dropped\",\"body\":\"{title} looks incredible! Watch now\"}}, "
        f"{{\"title\":\"🔥 Must Watch\",\"body\":\"The official {title} trailer is here\"}}, "
        f"{{\"title\":\"⭐ Trending Now\",\"body\":\"{title} trailer just landed — don't miss it\"}}"
    )

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                'https://api.groq.com/openai/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {GROQ_API_KEY}',
                    'Content-Type': 'application/json',
                },
                json={
                    'model': 'llama-3.3-70b-versatile',
                    'messages': [{'role': 'user', 'content': prompt}],
                    'temperature': 0.9,
                    'max_tokens': 100,
                },
            )
            if r.status_code != 200:
                raise Exception(r.text)
            text = r.json()['choices'][0]['message']['content'].strip()
            text = text.replace('```json', '').replace('```', '').strip()
            parsed = json.loads(text)
            return parsed.get('title', 'New Trailer'), parsed.get('body', f'Check out {title}')
    except Exception as e:
        print(f'[Groq] AI text failed: {e}', flush=True)
        label = 'Trailer' if media_type == 'movie' else 'Episode'
        return f"🎬 New {label}", f"{title} — watch the trailer now"

def _send_push(endpoint, p256dh, auth, payload):
    from pywebpush import webpush
    from app.core.config import VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY
    webpush(
        subscription_info={
            'endpoint': endpoint,
            'keys': {'p256dh': p256dh, 'auth': auth},
        },
        data=json.dumps(payload),
        vapid_private_key=VAPID_PRIVATE_KEY,
        vapid_claims={'sub': 'mailto:hamza574656@gmail.com'},
    )

async def send_next_push():
    sent_count = await _get_daily_sent_count()
    if sent_count >= DAILY_LIMIT:
        print(f'[Push] Daily limit {DAILY_LIMIT} reached, skipping', flush=True)
        return {'sent': False, 'reason': 'limit_reached', 'sent_today': sent_count}

    record = await _get_random_unsent()
    if not record:
        print('[Push] No unsent trailers for today', flush=True)
        return {'sent': False, 'reason': 'no_unsent', 'sent_today': sent_count}

    title, body = await _generate_ai_notification(record['title'], record['media_type'])

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f'{SUPABASE_URL}/rest/v1/push_subscriptions',
            headers=SUPABASE_HEADERS,
            params={'select': 'endpoint,p256dh_key,auth_key'},
        )
        if r.status_code != 200:
            return {'sent': False, 'reason': 'no_subscribers', 'sent_today': sent_count}
        subs = r.json()

    payload = {
        'title': title,
        'body': body,
        'icon': record['poster_url'] or '/logo.png',
        'data': {
            'media_id': record['media_id'],
            'media_type': record['media_type'],
            'url': f"/{record['media_type']}/{record['media_id']}",
        },
    }

    success = 0
    fail = 0
    for sub in subs:
        try:
            _send_push(sub['endpoint'], sub['p256dh_key'], sub['auth_key'], payload)
            success += 1
        except Exception as e:
            print(f'[Push] Failed ({sub["endpoint"][:30]}): {e}', flush=True)
            fail += 1

    await _mark_sent(record['id'])

    print(f'[Push] Sent "{title}: {body}" to {success} users ({fail} failed)', flush=True)
    return {
        'sent': True,
        'trailer': record['title'],
        'media_type': record['media_type'],
        'notification_title': title,
        'notification_body': body,
        'delivered_to': success,
        'failed_to': fail,
        'sent_today': sent_count + 1,
    }
