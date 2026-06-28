from fastapi import APIRouter
from fastapi.responses import HTMLResponse
from app.core.config import TMDB_API_KEY
import requests
from html import escape

og_app = APIRouter()
SITE = 'MovieSphere'
SITE_URL = 'https://movie-sphere-sigma.vercel.app'

def _build_og_html(title, overview, poster_url, backdrop_url, og_url, redirect_url, og_type, release_date='', rating='', genre_list=None):
    desc = (overview or '')[:300]
    image = poster_url or backdrop_url or f'{SITE_URL}/logo.png'
    genres = genre_list or []
    genre_str = ', '.join(genres[:3]) if genres else ''
    schema_type = 'Movie' if og_type == 'video.movie' else 'TVSeries'

    import json as _json

    media_obj = {'@type': schema_type, 'name': title, 'description': desc, 'image': image, 'url': og_url}
    if release_date:
        media_obj['datePublished' if schema_type == 'Movie' else 'startDate'] = release_date
    if rating:
        media_obj['aggregateRating'] = {'@type': 'AggregateRating', 'ratingValue': str(rating), 'bestRating': '10', 'itemReviewed': {'@type': schema_type, 'name': title}}
    if genre_str:
        media_obj['genre'] = genre_str

    article_obj = {'@type': 'Article', 'headline': title, 'description': desc, 'image': image, 'url': og_url, 'mainEntityOfPage': og_url, 'author': {'@type': 'Organization', 'name': SITE}, 'publisher': {'@type': 'Organization', 'name': SITE}}
    if release_date:
        article_obj['datePublished'] = release_date

    json_ld = {'@context': 'https://schema.org', '@graph': [media_obj, article_obj]}
    json_ld_str = _json.dumps(json_ld, ensure_ascii=False)

    html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{escape(title)} - {SITE}</title>
<meta name="description" content="{escape(desc)}" />

<!-- Open Graph / Facebook / Instagram / WhatsApp -->
<meta property="og:type" content="{escape(og_type)}" />
<meta property="og:url" content="{escape(og_url)}" />
<meta property="og:title" content="{escape(title)}" />
<meta property="og:description" content="{escape(desc)}" />
<meta property="og:image" content="{escape(image)}" />
<meta property="og:image:alt" content="{escape(title)} poster" />
<meta property="og:site_name" content="{SITE}" />
<meta property="og:locale" content="en_US" />

<!-- Twitter/X -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{escape(title)}" />
<meta name="twitter:description" content="{escape(desc)}" />
<meta name="twitter:image" content="{escape(image)}" />
<meta name="twitter:image:alt" content="{escape(title)} poster" />

<!-- Gmail / Email / Schema.org -->
<script type="application/ld+json">
{json_ld_str}
</script>

<link rel="icon" href="{SITE_URL}/logo.png" />
<link rel="canonical" href="{escape(og_url)}" />
<meta name="theme-color" content="#4f46e5" />
</head>
<body>
<script>location.href="{escape(redirect_url)}"</script>
</body>
</html>'''
    return HTMLResponse(content=html)


@og_app.get('/MovieSphere/og/movie/{movie_id}')
def og_movie(movie_id: int):
    r = requests.get(
        f'https://api.themoviedb.org/3/movie/{movie_id}',
        params={'api_key': TMDB_API_KEY, 'language': 'en-US'},
        timeout=8,
    )
    if not r.ok:
        return _build_og_html(
            'MovieSphere', 'Watch movies and TV shows',
            '', '',
            f'{SITE_URL}/movie/{movie_id}',
            f'{SITE_URL}/watch/movie/{movie_id}',
            'website',
        )
    d = r.json()
    poster = f"https://image.tmdb.org/t/p/w500{d.get('poster_path')}" if d.get('poster_path') else ''
    backdrop = f"https://image.tmdb.org/t/p/w1280{d.get('backdrop_path')}" if d.get('backdrop_path') else ''
    title = d.get('title') or d.get('original_title') or 'Movie'
    overview = d.get('overview') or ''
    release = (d.get('release_date') or '')[:10]
    rating = d.get('vote_average')
    genres = [g.get('name', '') for g in (d.get('genres') or [])]

    return _build_og_html(
        title, overview, poster, backdrop,
        f'{SITE_URL}/movie/{movie_id}',
        f'{SITE_URL}/watch/movie/{movie_id}',
        'video.movie',
        release_date=release,
        rating=str(round(rating, 1)) if rating else '',
        genre_list=genres,
    )


@og_app.get('/MovieSphere/og/tv/{tv_id}')
def og_tv(tv_id: int):
    r = requests.get(
        f'https://api.themoviedb.org/3/tv/{tv_id}',
        params={'api_key': TMDB_API_KEY, 'language': 'en-US'},
        timeout=8,
    )
    if not r.ok:
        return _build_og_html(
            'MovieSphere', 'Watch movies and TV shows',
            '', '',
            f'{SITE_URL}/tv/{tv_id}',
            f'{SITE_URL}/watch/tv/{tv_id}',
            'website',
        )
    d = r.json()
    poster = f"https://image.tmdb.org/t/p/w500{d.get('poster_path')}" if d.get('poster_path') else ''
    backdrop = f"https://image.tmdb.org/t/p/w1280{d.get('backdrop_path')}" if d.get('backdrop_path') else ''
    title = d.get('name') or d.get('original_name') or 'TV Show'
    overview = d.get('overview') or ''
    release = (d.get('first_air_date') or '')[:10]
    rating = d.get('vote_average')
    genres = [g.get('name', '') for g in (d.get('genres') or [])]

    return _build_og_html(
        title, overview, poster, backdrop,
        f'{SITE_URL}/tv/{tv_id}',
        f'{SITE_URL}/watch/tv/{tv_id}',
        'video.tv_show',
        release_date=release,
        rating=str(round(rating, 1)) if rating else '',
        genre_list=genres,
    )
