from fastapi import APIRouter, Query
import requests
from app.core.config import TMDB_API_KEY
from app.services.youtube import get_behind_scenes
from app.services.giphy import search_gifs
from app.services.itunes import search_soundtrack, get_track_previews

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

    gifs = search_gifs(title) if title else []

    music = []
    if title:
        albums = search_soundtrack(title)
        for album in albums:
            tracks = get_track_previews(album['collection_id'])
            album['tracks'] = tracks
            music.append(album)

    return {
        'MovieSphere': {
            'trailers': trailers,
            'behind_scenes': behind_scenes,
            'other_videos': other_videos,
            'images': images,
            'gifs': gifs,
            'music': music
        }
    }
