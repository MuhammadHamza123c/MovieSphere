import requests
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from app.core.database import supabase
from app.api.auth import get_current_user
from app.core.config import TMDB_API_KEY, SUPABASE_URL, SUPABASE_KEY
from app.services.tmdb import watch_later_details
import httpx

watch_later_app = APIRouter()

SUPABASE_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
}

@watch_later_app.get("/MovieSphere/watch_later")
async def get_watch_later(user = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f'{SUPABASE_URL}/rest/v1/user_watch_later',
                headers=SUPABASE_HEADERS,
                params={'user_id': f'eq.{user.id}', 'order': 'added_at.desc'},
            )
            r.raise_for_status()
            data = r.json()
        enriched = watch_later_details(data) if data else []
        return {'MovieSphere': enriched}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@watch_later_app.post("/MovieSphere/add_watch_later")
async def add_watch_later(media_id: int = Query(...), media_type: str = Query(...), user = Depends(get_current_user)):
    if media_type not in ['movie', 'tv']:
        raise HTTPException(status_code=400, detail="Invalid media type")
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f'{SUPABASE_URL}/rest/v1/user_watch_later',
                headers=SUPABASE_HEADERS,
                params={'user_id': f'eq.{user.id}', 'media_id': f'eq.{media_id}', 'media_type': f'eq.{media_type}'},
            )
            r.raise_for_status()
            existing = r.json()
            if existing:
                return {'MovieSphere': {'message': 'Already in watch later'}}
            r2 = await client.post(
                f'{SUPABASE_URL}/rest/v1/user_watch_later',
                headers=SUPABASE_HEADERS,
                json={'user_id': user.id, 'media_id': media_id, 'media_type': media_type},
            )
            r2.raise_for_status()
            inserted = r2.json()
            return {'MovieSphere': inserted[0] if inserted else {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@watch_later_app.delete("/MovieSphere/remove_watch_later")
async def remove_watch_later(media_id: int = Query(...), media_type: str = Query(...), user = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.delete(
                f'{SUPABASE_URL}/rest/v1/user_watch_later',
                headers=SUPABASE_HEADERS,
                params={'user_id': f'eq.{user.id}', 'media_id': f'eq.{media_id}', 'media_type': f'eq.{media_type}'},
            )
            r.raise_for_status()
            return {'MovieSphere': r.json()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@watch_later_app.get("/MovieSphere/check_watch_later")
async def check_watch_later(media_id: int = Query(...), media_type: str = Query(...), user = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f'{SUPABASE_URL}/rest/v1/user_watch_later',
                headers=SUPABASE_HEADERS,
                params={'user_id': f'eq.{user.id}', 'media_id': f'eq.{media_id}', 'media_type': f'eq.{media_type}', 'select': 'id'},
            )
            r.raise_for_status()
            data = r.json()
            return {'MovieSphere': {'in_watch_later': len(data) > 0}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@watch_later_app.get("/MovieSphere/watch_later/releases")
async def check_releases(user = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f'{SUPABASE_URL}/rest/v1/user_watch_later',
                headers=SUPABASE_HEADERS,
                params={'user_id': f'eq.{user.id}'},
            )
            r.raise_for_status()
            items = r.json()
        if not items:
            return {'MovieSphere': []}
        released = []
        for item in items:
            media_id = item['media_id']
            media_type = item['media_type']
            r = requests.get(f"https://api.themoviedb.org/3/{media_type}/{media_id}", params={'api_key': TMDB_API_KEY})
            if r.ok:
                data = r.json()
                if data.get('status') == 'Released':
                    title = data.get('title') or data.get('name') or data.get('original_title') or data.get('original_name')
                    released.append({
                        'Id': data.get('id'),
                        'Title': title,
                        'media_type': media_type,
                        'Poster_path': f"https://image.tmdb.org/t/p/w500{data.get('poster_path')}" if data.get('poster_path') else None
                    })
        return {'MovieSphere': released}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@watch_later_app.get("/MovieSphere/watch_later/{item_id}")
async def get_watch_later_item(item_id: str, user = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f'{SUPABASE_URL}/rest/v1/user_watch_later',
                headers=SUPABASE_HEADERS,
                params={'id': f'eq.{item_id}', 'user_id': f'eq.{user.id}'},
            )
            r.raise_for_status()
            data = r.json()
        if not data:
            raise HTTPException(status_code=404, detail="Item not found")
        enriched = watch_later_details(data)
        return {'MovieSphere': enriched[0] if enriched else data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@watch_later_app.put("/MovieSphere/watch_later/{item_id}")
async def update_watch_later(item_id: str, data: dict = Body(...), user = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f'{SUPABASE_URL}/rest/v1/user_watch_later',
                headers=SUPABASE_HEADERS,
                params={'id': f'eq.{item_id}', 'user_id': f'eq.{user.id}', 'select': 'id'},
            )
            r.raise_for_status()
            existing = r.json()
            if not existing:
                raise HTTPException(status_code=404, detail="Item not found")
            r2 = await client.patch(
                f'{SUPABASE_URL}/rest/v1/user_watch_later',
                headers=SUPABASE_HEADERS,
                params={'id': f'eq.{item_id}'},
                json=data,
            )
            r2.raise_for_status()
            return {'MovieSphere': {'message': 'Updated'}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@watch_later_app.delete("/MovieSphere/watch_later/{item_id}")
async def delete_watch_later_item(item_id: str, user = Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f'{SUPABASE_URL}/rest/v1/user_watch_later',
                headers=SUPABASE_HEADERS,
                params={'id': f'eq.{item_id}', 'user_id': f'eq.{user.id}', 'select': 'id'},
            )
            r.raise_for_status()
            existing = r.json()
            if not existing:
                raise HTTPException(status_code=404, detail="Item not found")
            r2 = await client.delete(
                f'{SUPABASE_URL}/rest/v1/user_watch_later',
                headers=SUPABASE_HEADERS,
                params={'id': f'eq.{item_id}'},
            )
            r2.raise_for_status()
            return {'MovieSphere': {'message': 'Deleted'}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
