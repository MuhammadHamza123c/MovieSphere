import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.config import SUPABASE_URL, SUPABASE_KEY
from app.core.auth import get_current_user

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
async def subscribe(sub: PushSubscription, user=Depends(get_current_user)):
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f'{SUPABASE_URL}/rest/v1/push_subscriptions',
            headers=SUPABASE_HEADERS,
            json={
                'user_id': user.id,
                'endpoint': sub.endpoint,
                'p256dh_key': sub.p256dh_key,
                'auth_key': sub.auth_key,
            },
        )
        if r.status_code == 409:
            return {'status': 'already_subscribed', 'user_id': user.id}
        if r.status_code not in (200, 201):
            return {'status': 'error', 'detail': f'Supabase {r.status_code}: {r.text[:200]}'}
        return {'status': 'subscribed', 'user_id': user.id}

@notifications_app.get('/MovieSphere/notifications/subscriptions')
async def list_subscriptions(user=Depends(get_current_user)):
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f'{SUPABASE_URL}/rest/v1/push_subscriptions',
            headers=SUPABASE_HEADERS,
            params={'select': 'user_id,endpoint', 'limit': 50},
        )
        if r.status_code == 200:
            return {'subscriptions': r.json(), 'count': len(r.json())}
        return {'error': r.text[:200]}

@notifications_app.delete('/MovieSphere/notifications/subscribe')
async def unsubscribe(endpoint: str, user=Depends(get_current_user)):
    async with httpx.AsyncClient(timeout=10) as client:
        await client.delete(
            f'{SUPABASE_URL}/rest/v1/push_subscriptions',
            headers=SUPABASE_HEADERS,
            params={
                'user_id': f'eq.{user.id}',
                'endpoint': f'eq.{endpoint}',
            }
        )
        return {'status': 'unsubscribed'}
