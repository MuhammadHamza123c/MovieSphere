from fastapi import APIRouter, Query
from app.services.tmdb import get_trending

trending_app = APIRouter()


@trending_app.get('/MovieSphere/trending')
def trending(time_window: str = Query('day', description='day or week'), page: int = Query(1, ge=1, lt=101)):
    result = get_trending(time_window, page)
    return {'MovieSphere': result}
