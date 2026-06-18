import json
import traceback

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.config import SUPABASE_URL, SUPABASE_KEY

notifications_app = APIRouter()

SUPABASE_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
}

class PushSubscription(BaseModel):
    endpoint: str
    p256dh_key: str
    auth_key: str

@notifications_app.post('/MovieSphere/notifications/subscribe')
async def subscribe(sub: PushSubscription):
    try:
        user_id = '00000000-0000-0000-0000-000000000000'
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f'{SUPABASE_URL}/rest/v1/push_subscriptions',
                headers=SUPABASE_HEADERS,
                json={
                    'user_id': user_id,
                    'endpoint': sub.endpoint,
                    'p256dh_key': sub.p256dh_key,
                    'auth_key': sub.auth_key,
                },
            )
            if r.status_code == 409:
                return {'status': 'already_subscribed'}
            if r.status_code not in (200, 201):
                raise HTTPException(status_code=502, detail=f'Supabase {r.status_code}: {r.text[:300]}')
            return {'status': 'subscribed'}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'{type(e).__name__}: {str(e)[:300]}')

@notifications_app.delete('/MovieSphere/notifications/subscribe')
async def unsubscribe(endpoint: str):
    try:
        user_id = '00000000-0000-0000-0000-000000000000'
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.delete(
                f'{SUPABASE_URL}/rest/v1/push_subscriptions',
                headers=SUPABASE_HEADERS,
                params={
                    'user_id': f'eq.{user_id}',
                    'endpoint': f'eq.{endpoint}',
                }
            )
            return {'status': 'unsubscribed'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'{type(e).__name__}: {str(e)[:300]}')
