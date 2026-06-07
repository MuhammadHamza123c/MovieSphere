from fastapi import APIRouter
from app.services.tmdb import info_now

detail_provider_app = APIRouter()

@detail_provider_app.get('/MovieSphere/detail')
def info_click(name: str, id: int, type: str = ''):
    result = info_now(name=name, id=id, media_type=type)
    return {'MovieSphere': result}
