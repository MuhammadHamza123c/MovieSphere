from fastapi import APIRouter
from app.services.tmdb import get_info
from app.core.config import TMDB_API_KEY
import requests

info_app = APIRouter()

@info_app.get('/MovieSphere/cast')
def cast_it(name: str, id: int, type: str = ''):
    result = get_info(name=name, id=id, type=type)
    return {'MovieSphere': result}

@info_app.get('/MovieSphere/media')
def get_media(id: int, type: str = 'movie'):
    base = f"https://api.themoviedb.org/3/{type}/{id}"
    images = []
    videos = []
    try:
        r = requests.get(f"{base}/images", params={'api_key': TMDB_API_KEY, 'language': 'en-US', 'include_image_language': 'en,null'})
        if r.ok:
            data = r.json()
            backdrops = data.get('backdrops', [])
            images = [{'file_path': b['file_path'], 'width': b.get('width'), 'height': b.get('height')} for b in backdrops[:12]]
    except: pass
    try:
        r = requests.get(f"{base}/videos", params={'api_key': TMDB_API_KEY, 'language': 'en-US'})
        if r.ok:
            data = r.json()
            results = data.get('results', [])
            videos = [{'key': v['key'], 'name': v.get('name'), 'type': v.get('type'), 'site': v.get('site')} for v in results[:6] if v.get('site') == 'YouTube']
    except: pass
    return {'MovieSphere': {'images': images, 'videos': videos}}
