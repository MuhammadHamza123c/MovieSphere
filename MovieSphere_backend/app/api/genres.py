from fastapi import APIRouter
from app.utils.genres import tmdb_movie_genres, tmdb_tv_genres

genres_app = APIRouter()

@genres_app.get('/MovieSphere/genres')
def get_genres():
    movie = [{"id": k, "name": v} for k, v in tmdb_movie_genres.items()]
    tv = [{"id": k, "name": v} for k, v in tmdb_tv_genres.items()]
    return {"MovieSphere": {"movie": movie, "tv": tv}}
