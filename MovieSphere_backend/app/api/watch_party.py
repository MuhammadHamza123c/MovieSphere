from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Any
from app.core.config import SUPABASE_URL, SUPABASE_KEY
import httpx

watch_party_app = APIRouter()

SUPABASE_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
}

class SignalPayload(BaseModel):
    room: str
    sender: str
    type: str
    data: Optional[Any] = {}

@watch_party_app.post('/MovieSphere/watch-party/signal')
async def send_signal(body: SignalPayload):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f'{SUPABASE_URL}/rest/v1/watch_party_signals',
                headers=SUPABASE_HEADERS,
                json={'room': body.room, 'sender': body.sender, 'type': body.type, 'data': body.data},
            )
            r.raise_for_status()
            return {'message': 'ok'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@watch_party_app.get('/MovieSphere/watch-party/signals/{room}')
async def get_signals(room: str, since: int = Query(0, ge=0)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f'{SUPABASE_URL}/rest/v1/watch_party_signals',
                headers=SUPABASE_HEADERS,
                params={'room': f'eq.{room}', 'id': f'gt.{since}', 'order': 'id.asc'},
            )
            r.raise_for_status()
            data = r.json()
        return {'signals': data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
