from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.auth import get_current_user
from app.core.config import SUPABASE_URL, SUPABASE_KEY
import httpx

comment_app = APIRouter()

SUPABASE_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
}

class CommentCreate(BaseModel):
    movie_id: int
    media_type: str
    rating: Optional[int] = None
    comment: Optional[str] = None

@comment_app.post('/MovieSphere/comment')
async def create_comment(body: CommentCreate, user=Depends(get_current_user)):
    if body.rating is not None and (body.rating < 1 or body.rating > 10):
        raise HTTPException(status_code=400, detail='Rating must be between 1 and 10')
    username = user.user_metadata.get('username', user.email or 'Anonymous')
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f'{SUPABASE_URL}/rest/v1/comments',
            headers=SUPABASE_HEADERS,
            json={
                'user_id': user.id,
                'username': username,
                'movie_id': body.movie_id,
                'media_type': body.media_type,
                'rating': body.rating,
                'comment': body.comment,
            },
        )
        r.raise_for_status()
        data = r.json()
    return {'comment': data[0] if data else None}

@comment_app.get('/MovieSphere/comments')
async def list_comments(movie_id: int = Query(...), media_type: str = Query('movie')):
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f'{SUPABASE_URL}/rest/v1/comments',
            headers=SUPABASE_HEADERS,
            params={'movie_id': f'eq.{movie_id}', 'media_type': f'eq.{media_type}', 'order': 'created_at.desc'},
        )
        r.raise_for_status()
        data = r.json()
    return {'comments': data}

@comment_app.delete('/MovieSphere/comment')
async def delete_comment(id: int = Query(...), user=Depends(get_current_user)):
    async with httpx.AsyncClient() as client:
        r = await client.delete(
            f'{SUPABASE_URL}/rest/v1/comments',
            headers=SUPABASE_HEADERS,
            params={'id': f'eq.{id}', 'user_id': f'eq.{user.id}'},
        )
        r.raise_for_status()
    return {'comment': 'deleted'}
