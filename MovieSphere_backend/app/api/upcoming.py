from fastapi import APIRouter, Query
from app.services.tmdb import get_upcoming

upcoming_app = APIRouter()

@upcoming_app.get('/MovieSphere/upcoming')
def upcoming(type: str = Query('movie', description='movie or tv'), page: int = Query(1, ge=1, lt=101)):
    result = get_upcoming(type, page)
    return {'MovieSphere': result}