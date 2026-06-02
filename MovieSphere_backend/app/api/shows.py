from fastapi import APIRouter, Path, Query
from app.services.tmdb import tv_shows_get

tv_show_app = APIRouter()

@tv_show_app.get('/MovieSphere/Shows/{page_number}')
def show_it(page_number: int = Path(..., ge=1, lt=101), genre: str = Query('', description='Genre ID to filter by')):
    result = tv_shows_get(page_number, genre_id=genre)
    return {
        'MovieSphere': result
    }
