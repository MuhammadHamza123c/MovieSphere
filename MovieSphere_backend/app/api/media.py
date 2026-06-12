from fastapi import APIRouter, Query
import requests
from app.core.config import TMDB_API_KEY
from app.services.youtube import get_behind_scenes

media_app = APIRouter()

@media_app.get('/MovieSphere/media')
def fetch_media(id: int = Query(...), type: str = Query('movie'), title: str = Query('')):
    videos = []
    images = []
    trailers = []
    behind_scenes = []
    other_videos = []

    if type == 'tv':
        video_resp = requests.get(f"https://api.themoviedb.org/3/tv/{id}/videos", params={'api_key': TMDB_API_KEY, 'language': 'en-US'})
        image_resp = requests.get(f"https://api.themoviedb.org/3/tv/{id}/images", params={'api_key': TMDB_API_KEY, 'include_image_language': 'en,null'})
    else:
        video_resp = requests.get(f"https://api.themoviedb.org/3/movie/{id}/videos", params={'api_key': TMDB_API_KEY, 'language': 'en-US'})
        image_resp = requests.get(f"https://api.themoviedb.org/3/movie/{id}/images", params={'api_key': TMDB_API_KEY, 'include_image_language': 'en,null'})

    if video_resp.ok:
        for v in video_resp.json().get('results', []):
            item = {'key': v.get('key'), 'name': v.get('name'), 'type': v.get('type')}
            t = v.get('type', '')
            if t == 'Trailer':
                trailers.append(item)
            else:
                other_videos.append(item)

    if image_resp.ok:
        images = [{'file_path': b.get('file_path')} for b in image_resp.json().get('backdrops', [])[:12]]

    if title:
        behind_scenes = get_behind_scenes(title, type)
    else:
        behind_scenes = []

    return {
        'MovieSphere': {
            'trailers': trailers,
            'behind_scenes': behind_scenes,
            'other_videos': other_videos,
            'images': images
        }
    }
