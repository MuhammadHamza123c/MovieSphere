from fastapi import APIRouter
from app.services.tmdb import get_info

info_app = APIRouter()

@info_app.get('/MovieSphere/cast')
def cast_it(name: str, id: int, type: str = ''):
    result = get_info(name=name, id=id, type=type)
    return {
        'MovieSphere': result
    }
