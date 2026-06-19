import httpx
from datetime import datetime, timezone, timedelta
from app.core.config import SUPABASE_URL, SUPABASE_KEY
import uuid

SUPABASE_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
}

DEFAULT_CREDITS = 20

EXEMPT_PATHS = {
    '/MovieSphere/credits',
    '/MovieSphere/notifications/subscribe',
    '/MovieSphere/trailer-digest/run',
}

def get_credit_cost(path: str, query_params: dict) -> int:
    if path == '/MovieSphere/streamit':
        season = query_params.get('season')
        return 2 if season is None else 1
    return 1

async def get_credits(user_id: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f'{SUPABASE_URL}/rest/v1/user_credits',
            headers=SUPABASE_HEADERS,
            params={'user_id': f'eq.{user_id}', 'select': '*'},
        )
        if r.status_code != 200:
            return {'credits_remaining': 0, 'reset_at': None}

        records = r.json()
        if not records:
            now = datetime.now(timezone.utc).isoformat()
            cr = await client.post(
                f'{SUPABASE_URL}/rest/v1/user_credits',
                headers=SUPABASE_HEADERS,
                json={'user_id': user_id, 'credits_remaining': DEFAULT_CREDITS, 'reset_at': now},
            )
            if cr.status_code not in (200, 201):
                return {'credits_remaining': DEFAULT_CREDITS, 'reset_at': now}
            return {'credits_remaining': DEFAULT_CREDITS, 'reset_at': now}

        record = records[0]
        reset_str = record.get('reset_at', '')
        try:
            reset_at = datetime.fromisoformat(reset_str.replace('Z', '+00:00'))
        except:
            reset_at = datetime.now(timezone.utc) - timedelta(days=8)

        now = datetime.now(timezone.utc)
        if now - reset_at >= timedelta(days=7):
            now_str = now.isoformat()
            await client.patch(
                f'{SUPABASE_URL}/rest/v1/user_credits',
                headers=SUPABASE_HEADERS,
                params={'user_id': f'eq.{user_id}'},
                json={'credits_remaining': DEFAULT_CREDITS, 'reset_at': now_str},
            )
            return {'credits_remaining': DEFAULT_CREDITS, 'reset_at': now_str}

        return {
            'credits_remaining': record.get('credits_remaining', 0),
            'reset_at': record.get('reset_at'),
        }

async def deduct_credits(user_id: str, cost: int) -> dict:
    info = await get_credits(user_id)
    remaining = info.get('credits_remaining', 0)
    reset_at = info.get('reset_at')

    if remaining < cost:
        return {'success': False, 'credits_remaining': remaining, 'reset_at': reset_at}

    new_remaining = remaining - cost

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.patch(
            f'{SUPABASE_URL}/rest/v1/user_credits',
            headers={**SUPABASE_HEADERS, 'Prefer': 'return=minimal'},
            params={'user_id': f'eq.{user_id}', 'credits_remaining': f'eq.{remaining}'},
            json={'credits_remaining': new_remaining},
        )
        cr = r.headers.get('content-range', '')
        if '*/0' in cr:
            info2 = await get_credits(user_id)
            remaining2 = info2.get('credits_remaining', 0)
            if remaining2 < cost:
                return {'success': False, 'credits_remaining': remaining2, 'reset_at': info2.get('reset_at')}
            new_remaining2 = remaining2 - cost
            await client.patch(
                f'{SUPABASE_URL}/rest/v1/user_credits',
                headers={**SUPABASE_HEADERS, 'Prefer': 'return=minimal'},
                params={'user_id': f'eq.{user_id}', 'credits_remaining': f'eq.{remaining2}'},
                json={'credits_remaining': new_remaining2},
            )

    return {'success': True, 'credits_remaining': new_remaining, 'reset_at': reset_at}
