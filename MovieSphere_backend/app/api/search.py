from fastapi import APIRouter
from typing import Optional
from app.services.tmdb import search_it
from app.services.ai import ask_ai_movie

search_any_app = APIRouter()

@search_any_app.get('/MovieSphere/Search')
def search_movie(q: Optional[str] = None, text: Optional[str] = None):
    if text is not None and q is None:
        q = ask_ai_movie(text)
    result = search_it(q)
    return {
        'MovieSphere': result
    }
