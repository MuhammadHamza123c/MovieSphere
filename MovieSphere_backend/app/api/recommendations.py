from fastapi import APIRouter
from app.services.tmdb import recomend_me

recomend_app = APIRouter()

@recomend_app.get('/MovieSphere/Recommend')
def suggest_it(movie_name: str):
    result = recomend_me(movie_name)
    return {
        'MovieSphere': result
    }
