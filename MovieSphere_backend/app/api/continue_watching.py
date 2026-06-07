from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.core.database import supabase
from app.api.auth import get_current_user
from app.core.config import SUPABASE_URL, SUPABASE_KEY
import httpx

continue_watching_app = APIRouter()

SUPABASE_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
}

class ProgressPayload(BaseModel):
    media_id: str
    media_type: str
    season: Optional[int] = None
    episode: Optional[int] = None
    title: Optional[str] = None
    poster_url: Optional[str] = None
    progress_seconds: int = 0
    total_seconds: int = 0

@continue_watching_app.get('/MovieSphere/continue-watching')
async def get_continue_watching(user = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f'{SUPABASE_URL}/rest/v1/continue_watching',
                headers=SUPABASE_HEADERS,
                params={'user_id': f'eq.{user.id}', 'order': 'updated_at.desc'},
            )
            r.raise_for_status()
            data = r.json()
        return {'MovieSphere': data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@continue_watching_app.put('/MovieSphere/continue-watching/progress')
async def save_progress(body: ProgressPayload, user = Depends(get_current_user)):
    try:
        payload = body.model_dump()
        payload['user_id'] = user.id
        season_val = payload.get('season')
        episode_val = payload.get('episode')
        async with httpx.AsyncClient() as client:
            existing = await client.get(
                f'{SUPABASE_URL}/rest/v1/continue_watching',
                headers=SUPABASE_HEADERS,
                params={
                    'user_id': f'eq.{user.id}',
                    'media_id': f'eq.{payload["media_id"]}',
                    'media_type': f'eq.{payload["media_type"]}',
                    'season_int': f'eq.{season_val if season_val is not None else 0}',
                    'episode_int': f'eq.{episode_val if episode_val is not None else 0}',
                    'select': 'id',
                },
            )
            existing.raise_for_status()
            rows = existing.json()
            if rows:
                r = await client.patch(
                    f'{SUPABASE_URL}/rest/v1/continue_watching',
                    headers=SUPABASE_HEADERS,
                    params={'id': f'eq.{rows[0]["id"]}'},
                    json={'progress_seconds': payload['progress_seconds'], 'total_seconds': payload['total_seconds'], 'title': payload.get('title'), 'poster_url': payload.get('poster_url'), 'updated_at': datetime.now(timezone.utc).isoformat()},
                )
                r.raise_for_status()
            else:
                r = await client.post(
                    f'{SUPABASE_URL}/rest/v1/continue_watching',
                    headers=SUPABASE_HEADERS,
                    json=payload,
                )
                r.raise_for_status()
            return {'MovieSphere': {'message': 'Saved'}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@continue_watching_app.delete('/MovieSphere/continue-watching/{media_id}')
async def remove_continue_watching(media_id: str, media_type: str = 'movie', user = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.delete(
                f'{SUPABASE_URL}/rest/v1/continue_watching',
                headers=SUPABASE_HEADERS,
                params={'user_id': f'eq.{user.id}', 'media_id': f'eq.{media_id}', 'media_type': f'eq.{media_type}'},
            )
            r.raise_for_status()
            return {'MovieSphere': {'message': 'Removed'}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
