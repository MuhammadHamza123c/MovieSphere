from fastapi import APIRouter, Depends
from app.services.tmdb import single_detail
from app.core.config import SUPABASE_URL, SUPABASE_KEY
from app.core.auth import get_current_user
import httpx

app_save_fav = APIRouter()

SUPABASE_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
}

@app_save_fav.post("/MovieSphere/add_fav")
async def add_fav(name: str, user=Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f'{SUPABASE_URL}/rest/v1/movies_table',
            headers=SUPABASE_HEADERS,
            json={'user_id': user.id, 'title': name},
        )
        r.raise_for_status()
        return {"favorites": r.json()}

@app_save_fav.get("/MovieSphere/favs")
async def get_favs(user=Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f'{SUPABASE_URL}/rest/v1/movies_table',
            headers=SUPABASE_HEADERS,
            params={'user_id': f'eq.{user.id}', 'select': 'title'},
        )
        r.raise_for_status()
        items = r.json()
        titles = list(set([item['title'] for item in items]))
        data_result = single_detail(titles)
        return {'favorites': data_result}

@app_save_fav.post("/MovieSphere/remove_fav")
async def remove_fav(name: str, user=Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        r = await client.delete(
            f'{SUPABASE_URL}/rest/v1/movies_table',
            headers=SUPABASE_HEADERS,
            params={'user_id': f'eq.{user.id}', 'title': f'eq.{name}'},
        )
        r.raise_for_status()
        return {'favorites': f'{name} remove from the favorites!'}
