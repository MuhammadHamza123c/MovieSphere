from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import requests
from app.core.config import TMDB_API_KEY
from app.utils.genres import tmdb_movie_genres, tmdb_tv_genres

calendar_app = APIRouter()

MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

def _fetch_page(url, params, page):
    p = {**params, 'page': page}
    r = requests.get(url, params=p, timeout=8)
    if not r.ok:
        return []
    return (r.json().get('results') or [])

def _format_item(item, media_type, title_key, date_key, genre_map):
    gids = item.get('genre_ids') or []
    return {
        'id': item.get('id'),
        'title': item.get(title_key),
        'release_date': item.get(date_key, '')[:10] if item.get(date_key) else '',
        'poster': f"https://image.tmdb.org/t/p/w500{item.get('poster_path')}" if item.get('poster_path') else None,
        'backdrop': f"https://image.tmdb.org/t/p/w1280{item.get('backdrop_path')}" if item.get('backdrop_path') else None,
        'vote_average': item.get('vote_average', 0),
        'media_type': media_type,
        'genre': '|'.join([genre_map.get(gid, 'Unknown') for gid in gids]) or 'Unknown',
    }

@calendar_app.get('/MovieSphere/calendar')
def calendar_data(month: int = Query(default=0, ge=0, le=12), year: int = Query(default=0)):
    now = datetime.utcnow()
    target_month = month if 1 <= month <= 12 else now.month
    target_year = year if year > 0 else now.year

    items = []

    for page in (1, 2):
        for m in _fetch_page('https://api.themoviedb.org/3/movie/upcoming', {'api_key': TMDB_API_KEY, 'language': 'en-US'}, page):
            d = (m.get('release_date') or '')[:10]
            if d:
                try:
                    dt = datetime.strptime(d, '%Y-%m-%d')
                    if dt.month == target_month and dt.year == target_year:
                        items.append(_format_item(m, 'movie', 'title', 'release_date', tmdb_movie_genres))
                except:
                    pass

        for t in _fetch_page('https://api.themoviedb.org/3/tv/on_the_air', {'api_key': TMDB_API_KEY, 'language': 'en-US'}, page):
            d = (t.get('first_air_date') or '')[:10]
            if d:
                try:
                    dt = datetime.strptime(d, '%Y-%m-%d')
                    if dt.month == target_month and dt.year == target_year:
                        items.append(_format_item(t, 'tv', 'name', 'first_air_date', tmdb_tv_genres))
                except:
                    pass

    items.sort(key=lambda x: x['release_date'])

    grouped = {}
    for it in items:
        day = it['release_date']
        if day not in grouped:
            grouped[day] = []
        grouped[day].append(it)

    return {
        'MovieSphere': {
            'month': target_month,
            'year': target_year,
            'month_name': MONTHS[target_month - 1],
            'days': [{'date': d, 'items': grouped[d]} for d in sorted(grouped.keys())],
            'total': len(items),
        }
    }
