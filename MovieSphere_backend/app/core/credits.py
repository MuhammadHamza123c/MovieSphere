import httpx
from datetime import date, timedelta
from app.core.config import SUPABASE_URL, SUPABASE_KEY

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
        now_date = date.today()

        if not records:
            now = now_date.isoformat()
            await client.post(
                f'{SUPABASE_URL}/rest/v1/user_credits',
                headers=SUPABASE_HEADERS,
                json={'user_id': user_id, 'credits_remaining': DEFAULT_CREDITS, 'reset_at': now},
            )
            return {'credits_remaining': DEFAULT_CREDITS, 'reset_at': now}

        record = records[0]

        # Parse only the date part of reset_at to avoid timezone issues
        reset_str = record.get('reset_at', '') or ''
        reset_date_str = reset_str[:10]  # "2026-06-19"
        try:
            reset_date = date.fromisoformat(reset_date_str) if reset_date_str else now_date
        except:
            reset_date = now_date

        # Reset if 7+ days have passed
        if (now_date - reset_date).days >= 7:
            now_str = now_date.isoformat()
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
            headers=SUPABASE_HEADERS,
            params={'user_id': f'eq.{user_id}', 'credits_remaining': f'eq.{remaining}'},
            json={'credits_remaining': new_remaining},
        )

    if r.status_code != 200:
        return {'success': False, 'credits_remaining': remaining, 'reset_at': reset_at}

    # Check if any row was actually updated
    updated = r.json()
    if not updated or len(updated) == 0:
        # Race condition — credits changed between read and write
        # Re-fetch and try once more
        info2 = await get_credits(user_id)
        remaining2 = info2.get('credits_remaining', 0)
        if remaining2 < cost:
            return {'success': False, 'credits_remaining': remaining2, 'reset_at': info2.get('reset_at')}
        new_remaining2 = remaining2 - cost
        async with httpx.AsyncClient(timeout=10) as client:
            await client.patch(
                f'{SUPABASE_URL}/rest/v1/user_credits',
                headers=SUPABASE_HEADERS,
                params={'user_id': f'eq.{user_id}', 'credits_remaining': f'eq.{remaining2}'},
                json={'credits_remaining': new_remaining2},
            )

    return {'success': True, 'credits_remaining': new_remaining, 'reset_at': reset_at}
