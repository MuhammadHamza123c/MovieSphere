from fastapi import APIRouter
from app.services.tmdb import actor_it

actor_detail_app = APIRouter()

@actor_detail_app.get('/MovieSphere/cast/actor')
def check_actor_det(id: int):
    result = actor_it(id)
    return {
        'MovieSphere': result
    }
