from fastapi import APIRouter
from fastapi.responses import HTMLResponse
from app.core.config import TMDB_API_KEY
import requests
from html import escape

og_app = APIRouter()

def _build_og_html(title, overview, poster_url, backdrop_url, og_url, redirect_url, og_type):
    desc = (overview or '')[:300]
    image = poster_url or backdrop_url or ''
    html = f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{escape(title)}</title>
<meta property="og:title" content="{escape(title)}" />
<meta property="og:description" content="{escape(desc)}" />
<meta property="og:image" content="{escape(image)}" />
<meta property="og:url" content="{escape(og_url)}" />
<meta property="og:type" content="{og_type}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{escape(title)}" />
<meta name="twitter:description" content="{escape(desc)}" />
<meta name="twitter:image" content="{escape(image)}" />
<link rel="icon" href="https://movie-sphere-sigma.vercel.app/logo.png" />
</head>
<body>
<script>location.href="{escape(redirect_url)}"</script>
</body>
</html>'''
    return HTMLResponse(content=html)

@og_app.get('/MovieSphere/og/movie/{movie_id}')
def og_movie(movie_id: int):
    r = requests.get(f'https://api.themoviedb.org/3/movie/{movie_id}', params={'api_key': TMDB_API_KEY, 'language': 'en-US'})
    if not r.ok:
        return _build_og_html('MovieSphere', 'Watch movies and TV shows', '', '', f'https://movie-sphere-sigma.vercel.app/movie/{movie_id}', f'https://movie-sphere-sigma.vercel.app/watch/movie/{movie_id}', 'website')
    d = r.json()
    poster = f"https://image.tmdb.org/t/p/w500{d.get('poster_path')}" if d.get('poster_path') else ''
    backdrop = f"https://image.tmdb.org/t/p/w1280{d.get('backdrop_path')}" if d.get('backdrop_path') else ''
    title = d.get('title') or d.get('original_title') or 'Movie'
    overview = d.get('overview') or ''
    og_url = f'https://movie-sphere-sigma.vercel.app/movie/{movie_id}'
    redirect_url = f'https://movie-sphere-sigma.vercel.app/watch/movie/{movie_id}'
    return _build_og_html(title, overview, poster, backdrop, og_url, redirect_url, 'video.movie')

@og_app.get('/MovieSphere/og/tv/{tv_id}')
def og_tv(tv_id: int):
    r = requests.get(f'https://api.themoviedb.org/3/tv/{tv_id}', params={'api_key': TMDB_API_KEY, 'language': 'en-US'})
    if not r.ok:
        return _build_og_html('MovieSphere', 'Watch movies and TV shows', '', '', f'https://movie-sphere-sigma.vercel.app/tv/{tv_id}', f'https://movie-sphere-sigma.vercel.app/watch/tv/{tv_id}', 'website')
    d = r.json()
    poster = f"https://image.tmdb.org/t/p/w500{d.get('poster_path')}" if d.get('poster_path') else ''
    backdrop = f"https://image.tmdb.org/t/p/w1280{d.get('backdrop_path')}" if d.get('backdrop_path') else ''
    title = d.get('name') or d.get('original_name') or 'TV Show'
    overview = d.get('overview') or ''
    og_url = f'https://movie-sphere-sigma.vercel.app/tv/{tv_id}'
    redirect_url = f'https://movie-sphere-sigma.vercel.app/watch/tv/{tv_id}'
    return _build_og_html(title, overview, poster, backdrop, og_url, redirect_url, 'video.tv_show')
