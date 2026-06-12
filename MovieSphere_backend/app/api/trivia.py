from fastapi import APIRouter
from app.services.tmdb import get_movie_trivia

trivia_app = APIRouter()


@trivia_app.get('/MovieSphere/did-you-know')
def did_you_know():
    facts = get_movie_trivia()
    return {'MovieSphere': facts}
