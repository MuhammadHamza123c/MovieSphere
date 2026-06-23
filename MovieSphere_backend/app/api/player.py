from fastapi import APIRouter
from fastapi.responses import RedirectResponse, HTMLResponse
import requests

player_app = APIRouter()

SUPEREMBED_API = "https://getsuperembed.link/"

@player_app.get('/MovieSphere/player/movie/{movie_id}')
def player_movie(movie_id: int):
    params = {
        'video_id': movie_id,
        'tmdb': 1,
        'season': 0,
        'episode': 0,
        'player_font': 'Poppins',
        'player_bg_color': '000000',
        'player_font_color': 'ffffff',
        'player_primary_color': '34cfeb',
        'player_secondary_color': '6900e0',
        'player_loader': 1,
        'preferred_server': 0,
        'player_sources_toggle_type': 2,
    }
    try:
        r = requests.get(SUPEREMBED_API, params=params, timeout=10)
        player_url = r.text.strip()
        if player_url.startswith('https://') or player_url.startswith('http://'):
            return RedirectResponse(url=player_url)
    except:
        pass
    return RedirectResponse(url=f"https://multiembed.mov/?video_id={movie_id}&tmdb=1")

@player_app.get('/MovieSphere/player/tv/{tv_id}/{season}/{episode}')
def player_tv(tv_id: int, season: int, episode: int):
    params = {
        'video_id': tv_id,
        'tmdb': 1,
        'season': season,
        'episode': episode,
        'player_font': 'Poppins',
        'player_bg_color': '000000',
        'player_font_color': 'ffffff',
        'player_primary_color': '34cfeb',
        'player_secondary_color': '6900e0',
        'player_loader': 1,
        'preferred_server': 0,
        'player_sources_toggle_type': 2,
    }
    try:
        r = requests.get(SUPEREMBED_API, params=params, timeout=10)
        player_url = r.text.strip()
        if player_url.startswith('https://') or player_url.startswith('http://'):
            return RedirectResponse(url=player_url)
    except:
        pass
    return RedirectResponse(url=f"https://multiembed.mov/?video_id={tv_id}&tmdb=1&s={season}&e={episode}")
