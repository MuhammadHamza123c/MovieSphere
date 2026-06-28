from fastapi import APIRouter, Query
from datetime import datetime
import calendar as cal
import requests
from app.core.config import TMDB_API_KEY
from app.utils.genres import tmdb_movie_genres, tmdb_tv_genres

calendar_app = APIRouter()

MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

def _fetch_all_pages(url, params, max_pages=5):
    results = []
    for page in range(1, max_pages + 1):
        r = requests.get(url, params={**params, 'page': page}, timeout=8)
        if not r.ok:
            break
        data = r.json()
        results.extend(data.get('results') or [])
        if page >= (data.get('total_pages', 1) or 1):
            break
    return results

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

    _, last_day = cal.monthrange(target_year, target_month)
    date_from = f'{target_year}-{target_month:02d}-01'
    date_to = f'{target_year}-{target_month:02d}-{last_day:02d}'

    items = []
    base_params = {'api_key': TMDB_API_KEY, 'language': 'en-US', 'sort_by': 'popularity.desc'}

    # Movies releasing in this month
    for m in _fetch_all_pages(
        'https://api.themoviedb.org/3/discover/movie',
        {**base_params, 'primary_release_date.gte': date_from, 'primary_release_date.lte': date_to},
    ):
        d = (m.get('release_date') or '')[:10]
        if d:
            try:
                dt = datetime.strptime(d, '%Y-%m-%d')
                if dt.month == target_month and dt.year == target_year:
                    items.append(_format_item(m, 'movie', 'title', 'release_date', tmdb_movie_genres))
            except:
                pass

    # TV shows premiering this month
    for t in _fetch_all_pages(
        'https://api.themoviedb.org/3/discover/tv',
        {**base_params, 'first_air_date.gte': date_from, 'first_air_date.lte': date_to},
    ):
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
