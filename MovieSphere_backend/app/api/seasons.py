from fastapi import APIRouter
from app.services.tmdb import get_season_episodes

seasons_app = APIRouter()

@seasons_app.get('/MovieSphere/season_episodes')
def season_episodes(id: int, season: int):
    episodes = get_season_episodes(id, season)
    return {'episodes': episodes}
