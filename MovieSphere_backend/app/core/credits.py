from datetime import date, datetime, timezone
from app.core.database import supabase

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

def get_credits(user_id: str) -> dict:
    try:
        records = supabase.table('user_credits').select('*').eq('user_id', user_id).execute()
        now_date = date.today()

        if not records.data:
            supabase.table('user_credits').insert({
                'user_id': user_id,
                'free_credits': DEFAULT_CREDITS,
            }).execute()
            return {'credits_remaining': DEFAULT_CREDITS}

        record = records.data[0]
        created_str = record.get('created_at', '') or ''
        created_date_str = created_str[:10]
        try:
            created_date = date.fromisoformat(created_date_str) if created_date_str else now_date
        except:
            created_date = now_date

        if (now_date - created_date).days >= 7:
            supabase.table('user_credits').update({
                'free_credits': DEFAULT_CREDITS,
                'created_at': datetime.now(timezone.utc).isoformat(),
            }).eq('user_id', user_id).execute()
            return {'credits_remaining': DEFAULT_CREDITS}

        return {'credits_remaining': record.get('free_credits', 0)}
    except Exception as e:
        print(f'[Credits] get_credits failed: {e}', flush=True)
        return {'credits_remaining': DEFAULT_CREDITS}

def deduct_credits(user_id: str, cost: int) -> dict:
    info = get_credits(user_id)
    remaining = info.get('credits_remaining', 0)

    if remaining < cost:
        return {'success': False, 'credits_remaining': remaining}

    new_remaining = remaining - cost
    try:
        result = supabase.table('user_credits').update({
            'free_credits': new_remaining,
        }).eq('user_id', user_id).eq('free_credits', remaining).execute()

        if not result.data:
            info2 = get_credits(user_id)
            remaining2 = info2.get('credits_remaining', 0)
            if remaining2 < cost:
                return {'success': False, 'credits_remaining': remaining2}
            new_remaining2 = remaining2 - cost
            supabase.table('user_credits').update({
                'free_credits': new_remaining2,
            }).eq('user_id', user_id).eq('free_credits', remaining2).execute()

        return {'success': True, 'credits_remaining': new_remaining}
    except Exception as e:
        print(f'[Credits] deduct_credits failed: {e}', flush=True)
        return {'success': False, 'credits_remaining': remaining}
