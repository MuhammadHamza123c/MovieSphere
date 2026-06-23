from fastapi import APIRouter, HTTPException
import os
from datetime import datetime, timezone
import requests as httpx
from app.core.config import CRON_SECRET_KEY, SUPABASE_URL, SUPABASE_KEY
from app.core.database import supabase
from app.core.credits import DEFAULT_CREDITS


daily_credits_app = APIRouter()

SUPABASE_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
}

@daily_credits_app.get('/MovieSphere/daily-credits')
def run_daily_credits(key: str = ''):
    if key != CRON_SECRET_KEY:
        raise HTTPException(status_code=403, detail='Invalid key')

    r = httpx.get(
        f'{SUPABASE_URL}/auth/v1/admin/users',
        headers=SUPABASE_HEADERS,
        timeout=15,
    )
    if r.status_code != 200:
        return {'error': 'Failed to fetch users', 'status': r.status_code}

    users = r.json().get('users', [])
    now = datetime.now(timezone.utc).isoformat()

    reset_count = 0

    for u in users:
        uid = u.get('id')
        if not uid:
            continue
        supabase.table('user_credits').upsert({
            'user_id': uid,
            'free_credits': DEFAULT_CREDITS,
            'updated_at': now,
            'created_at': now,
        }, on_conflict='user_id').execute()
        reset_count += 1

    return {'reset_count': reset_count}
