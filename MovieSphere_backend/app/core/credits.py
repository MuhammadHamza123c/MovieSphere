from datetime import date, datetime, timezone
from app.core.database import supabase

DEFAULT_CREDITS = 100

EXEMPT_PATHS = {
    '/MovieSphere/credits',
    '/MovieSphere/notifications/subscribe',
    '/MovieSphere/trailer-digest/run',
    '/MovieSphere/continue-watching/progress',
    '/MovieSphere/continue-watching',
    '/MovieSphere/comments',
    '/MovieSphere/og/movie/',
    '/MovieSphere/og/tv/',
    '/MovieSphere/trivia/',
}

def get_credit_cost(path: str, query_params: dict) -> int:
    if path == '/MovieSphere/streamit':
        season = query_params.get('season')
        return 2 if season is None else 1
    return 1

def get_credits(user_id: str) -> dict:
    try:
        records = supabase.table('user_credits').select('*').eq('user_id', user_id).execute()
        now_date = date.today()

        if not records.data:
            supabase.table('user_credits').insert({
                'user_id': user_id,
                'free_credits': DEFAULT_CREDITS,
            }).execute()
            print(f'[Credits] No record for {user_id}, created at {DEFAULT_CREDITS}', flush=True)
            return {'credits_remaining': DEFAULT_CREDITS}

        record = records.data[0]
        created_str = record.get('created_at', '') or ''
        created_date_str = created_str[:10]
        try:
            created_date = date.fromisoformat(created_date_str) if created_date_str else now_date
        except:
            created_date = now_date

        free = record.get('free_credits', 0)
        days_diff = (now_date - created_date).days
        print(f'[Credits] get_credits {user_id}: free={free}, created_date={created_date}, now={now_date}, days_diff={days_diff}', flush=True)

        if days_diff >= 1:
            supabase.table('user_credits').update({
                'free_credits': DEFAULT_CREDITS,
                'created_at': datetime.now(timezone.utc).isoformat(),
            }).eq('user_id', user_id).execute()
            print(f'[Credits] Reset {user_id} to {DEFAULT_CREDITS} (was {free}, days_diff={days_diff})', flush=True)
            return {'credits_remaining': DEFAULT_CREDITS}

        return {'credits_remaining': free}
    except Exception as e:
        print(f'[Credits] get_credits failed: {e}', flush=True)
        return {'credits_remaining': DEFAULT_CREDITS}

def deduct_credits(user_id: str, cost: int) -> dict:
    info = get_credits(user_id)
    remaining = info.get('credits_remaining', 0)

    if remaining < cost:
        print(f'[Credits] Not enough for {user_id}: {remaining} < {cost}', flush=True)
        return {'success': False, 'credits_remaining': remaining}

    new_remaining = remaining - cost
    try:
        result = supabase.table('user_credits').update({
            'free_credits': new_remaining,
        }).eq('user_id', user_id).execute()

        print(f'[Credits] Deducted {cost} from {user_id}: {remaining} -> {new_remaining}', flush=True)
        return {'success': True, 'credits_remaining': new_remaining}

    except Exception as e:
        print(f'[Credits] deduct_credits failed: {e}', flush=True)
        return {'success': False, 'credits_remaining': remaining}

def add_credits(user_id: str, amount: int) -> dict:
    try:
        records = supabase.table('user_credits').select('*').eq('user_id', user_id).execute()
        current = records.data[0].get('free_credits', 0) if records.data else 0
        new_total = current + amount
        supabase.table('user_credits').update({
            'free_credits': new_total,
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }).eq('user_id', user_id).execute()
        print(f'[Credits] Added {amount} to {user_id}: {current} -> {new_total}', flush=True)
        return {'success': True, 'credits_remaining': new_total}
    except Exception as e:
        print(f'[Credits] add_credits failed: {e}', flush=True)
        return {'success': False, 'credits_remaining': None}
