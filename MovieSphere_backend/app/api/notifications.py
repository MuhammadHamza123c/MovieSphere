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
        if r.status_code == 409:
            return {'status': 'already_subscribed'}
        if r.status_code not in (200, 201):
            from fastapi import HTTPException
            raise HTTPException(status_code=502, detail=f'Supabase error: {r.text[:200]}')
        return {'status': 'subscribed'}

@notifications_app.delete('/MovieSphere/notifications/subscribe')
async def unsubscribe(endpoint: str, user=Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        await client.delete(
            f'{SUPABASE_URL}/rest/v1/push_subscriptions',
            headers=SUPABASE_HEADERS,
            params={
                'user_id': f'eq.{user.id}',
                'endpoint': f'eq.{endpoint}',
            }
        )
        return {'status': 'unsubscribed'}
