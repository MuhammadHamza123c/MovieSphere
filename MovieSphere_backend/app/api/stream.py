from fastapi import APIRouter, Depends, Request
from typing import Optional
from app.services.tmdb import watch_movie, watch_tv
from app.core.database import supabase
from app.core.auth import get_current_user

watch_stream_app = APIRouter()

@watch_stream_app.get('/MovieSphere/streamit')
def stream_now(request: Request, id: Optional[int] = None, season: Optional[int] = None, epi: Optional[int] = None, user=Depends(get_current_user)):
    try:
        supabase.table('user_exp').insert(
            {
                'user_id': user.id,
                'movie_id': id
            }
        ).execute()
    except:
        pass
    if id is not None and season is None and epi is None:
        result = watch_movie(id)
    elif season is not None and epi is not None:
        result = watch_tv(id, season, epi)
    else:
        result = "Error: For TV shows, both 'season' and 'epi' are required!"
    return {
        'MovieSphere': result
    }
