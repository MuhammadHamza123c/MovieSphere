from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.database import supabase
from app.core.auth import get_current_user

comment_app = APIRouter()

class CommentCreate(BaseModel):
    movie_id: int
    media_type: str
    rating: Optional[int] = None
    comment: Optional[str] = None

@comment_app.post('/MovieSphere/comment')
def create_comment(body: CommentCreate, user=Depends(get_current_user)):
    if body.rating is not None and (body.rating < 1 or body.rating > 10):
        raise HTTPException(status_code=400, detail='Rating must be between 1 and 10')
    username = user.user_metadata.get('username', user.email or 'Anonymous')
    result = supabase.table('comments').insert({
        'user_id': user.id,
        'username': username,
        'movie_id': body.movie_id,
        'media_type': body.media_type,
        'rating': body.rating,
        'comment': body.comment
    }).execute()
    return {'comment': result.data[0] if result.data else None}

@comment_app.get('/MovieSphere/comments')
def list_comments(movie_id: int = Query(...), media_type: str = Query('movie')):
    result = supabase.table('comments').select('*').eq('movie_id', movie_id).eq('media_type', media_type).order('created_at', desc=True).execute()
    return {'comments': result.data or []}

@comment_app.delete('/MovieSphere/comment')
def delete_comment(id: int = Query(...), user=Depends(get_current_user)):
    supabase.table('comments').delete().eq('id', id).eq('user_id', user.id).execute()
    return {'comment': 'deleted'}
