from fastapi import APIRouter, Query
from app.services.tmdb import get_top_rated

top_rated_app = APIRouter()

@top_rated_app.get('/MovieSphere/top_rated')
def top_rated(type: str = Query('movie', description='movie or tv'), page: int = Query(1, ge=1, lt=101)):
    result = get_top_rated(type, page)
    return {'MovieSphere': result}
