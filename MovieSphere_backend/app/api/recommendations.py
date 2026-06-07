from fastapi import APIRouter
from app.services.tmdb import recomend_me, get_similar

recomend_app = APIRouter()

@recomend_app.get('/MovieSphere/Recommend')
def suggest_it(movie_name: str):
    result = recomend_me(movie_name)
    return {
        'MovieSphere': result
    }

@recomend_app.get('/MovieSphere/similar')
def similar_titles(id: int, type: str):
    result = get_similar(id, type)
    return {
        'MovieSphere': result
    }
