import httpx
from fastapi import APIRouter, Depends
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
    async with httpx.AsyncClient() as client:
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
        return {
            'status_code': r.status_code,
            'response': r.text[:500],
            'user_id': user.id,
        }

@notifications_app.delete('/MovieSphere/notifications/subscribe')
async def unsubscribe(endpoint: str, user=Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        r = await client.delete(
            f'{SUPABASE_URL}/rest/v1/push_subscriptions',
            headers=SUPABASE_HEADERS,
            params={
                'user_id': f'eq.{user.id}',
                'endpoint': f'eq.{endpoint}',
            }
        )
        return {'status': 'unsubscribed'}

@notifications_app.get('/MovieSphere/notifications/subscriptions')
async def list_subscriptions():
    async with httpx.AsyncClient() as client:
        r1 = await client.get(
            f'{SUPABASE_URL}/rest/v1/push_subscriptions',
            headers=SUPABASE_HEADERS,
            params={'select': 'user_id,endpoint', 'limit': 50},
        )
        r2 = await client.get(
            f'{SUPABASE_URL}/rest/v1/movies_table',
            headers=SUPABASE_HEADERS,
            params={'select': 'user_id', 'limit': 5},
        )
        return {
            'push_status': r1.status_code,
            'push_response': r1.text[:300],
            'movie_status': r2.status_code,
            'movie_response': r2.text[:300],
        }
