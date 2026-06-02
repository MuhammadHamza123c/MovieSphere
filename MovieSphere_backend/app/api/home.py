from fastapi import APIRouter, Path, Query
from app.services.tmdb import get_movies_series

home_app = APIRouter()

@home_app.get('/MovieSphere/home/{page_number}')
def home_page(page_number: int = Path(..., ge=1, lt=101), genre: str = Query('', description='Genre ID to filter by')):
    result = get_movies_series(page_number, genre_id=genre)
    return {
        'MovieSphere': result
    }
