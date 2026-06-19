import httpx
from app.core.config import SUPABASE_URL, SUPABASE_KEY

SUPABASE_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
}

DEFAULT_CREDITS = 20

EXEMPT_PATHS = {
    '/MovieSphere/credits',
    '/MovieSphere/notifications/subscribe',
    '/MovieSphere/trailer-digest/run',
}

def get_credit_cost(path: str, query_params: dict) -> int:
    if path == '/MovieSphere/streamit':
        # TV episode = 1 credit, Movie = 2 credits
        season = query_params.get('season')
        return 2 if season is None else 1
    return 1

async def deduct_credits(user_id: str, cost: int) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            f'{SUPABASE_URL}/rest/v1/rpc/deduct_credits',
            headers=SUPABASE_HEADERS,
            json={'p_user_id': user_id, 'p_cost': cost},
        )
        if r.status_code != 200:
            return {'success': False, 'credits_remaining': 0, 'reset_at': None}
        return r.json()

async def get_credits(user_id: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            f'{SUPABASE_URL}/rest/v1/rpc/get_credits',
            headers=SUPABASE_HEADERS,
            json={'p_user_id': user_id},
        )
        if r.status_code != 200:
            return {'credits_remaining': 0, 'reset_at': None}
        return r.json()
