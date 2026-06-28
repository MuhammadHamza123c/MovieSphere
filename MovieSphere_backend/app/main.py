from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from app.core.database import supabase
import os
import mimetypes

from app.api.home import home_app
from app.api.search import search_any_app
from app.api.shows import tv_show_app
from app.api.favorites import app_save_fav
from app.api.recommendations import recomend_app
from app.api.cast import info_app
from app.api.details import detail_provider_app
from app.api.stream import watch_stream_app
from app.api.actors import actor_detail_app
from app.api.ai import ai_movie_app
from app.api.genres import genres_app
from app.api.toprated import top_rated_app
from app.api.comments import comment_app
from app.api.history import user_hist_app
from app.api.auth import auth_app
from app.api.watch_party import watch_party_app
from app.api.continue_watching import continue_watching_app
from app.api.media import media_app
from app.api.upcoming import upcoming_app
from app.api.watch_later import watch_later_app
from app.api.seasons import seasons_app
from app.api.reels import reels_app
from app.api.trending import trending_app
from app.api.trailer_digest import trailer_digest_app
from app.api.notifications import notifications_app
from app.api.credits import credits_app
from app.api.og import og_app
from app.api.player import player_app
from app.api.daily_credits import daily_credits_app
from app.api.calendar import calendar_app
from app.api.daily_trivia import trivia_app
from app.core.credits import EXEMPT_PATHS, get_credit_cost, deduct_credits

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'https://movie-sphere-sigma.vercel.app',
        'http://localhost:5173',
        'http://localhost:4173',
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.middleware('http')
async def credit_middleware(request: Request, call_next):
    path = request.url.path
    method = request.method

    if not path.startswith('/MovieSphere/'):
        return await call_next(request)
    if method == 'OPTIONS':
        return await call_next(request)
    if path in EXEMPT_PATHS or path.startswith('/MovieSphere/home/') or path.startswith('/MovieSphere/og/') or path.startswith('/MovieSphere/trivia/'):
        return await call_next(request)

    cost = get_credit_cost(path, dict(request.query_params))

    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return await call_next(request)

    token = auth_header[7:]
    from app.core.auth import _verify_token_locally
    payload = _verify_token_locally(token)
    user_id = None
    if payload:
        user_id = payload.get('sub')
    else:
        try:
            user = supabase.auth.get_user(token)
            if user and user.user:
                user_id = user.user.id
        except:
            pass
    if not user_id:
        return await call_next(request)

    result = deduct_credits(user_id, cost)
    print(f'[Credits] Middleware: {path}, user={user_id}, cost={cost}, result={result}', flush=True)
    if not result.get('success'):
        remaining = result.get('credits_remaining', 0)
        return JSONResponse(
            status_code=402,
            content={
                'error': 'no_credits',
                'message': "You've used all your free streams today. Credits reset tomorrow.",
                'credits_remaining': remaining,
            }
        )

    response = await call_next(request)
    return response

app.include_router(home_app)
app.include_router(search_any_app)
app.include_router(app_save_fav)
app.include_router(tv_show_app)
app.include_router(recomend_app)
app.include_router(info_app)
app.include_router(detail_provider_app)
app.include_router(watch_stream_app)
app.include_router(actor_detail_app)
app.include_router(ai_movie_app)
app.include_router(user_hist_app)
app.include_router(genres_app)
app.include_router(top_rated_app)
app.include_router(comment_app)
app.include_router(auth_app)
app.include_router(watch_party_app)
app.include_router(continue_watching_app)
app.include_router(media_app)
app.include_router(upcoming_app)
app.include_router(watch_later_app)
app.include_router(seasons_app)
app.include_router(reels_app)
app.include_router(trending_app)
app.include_router(trailer_digest_app)
app.include_router(notifications_app)
app.include_router(credits_app)
app.include_router(og_app)
app.include_router(player_app)
app.include_router(daily_credits_app)
app.include_router(calendar_app)
app.include_router(trivia_app)

# Catch-all OPTIONS handler for Vercel CORS preflight
@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return {}

FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.isdir(FRONTEND_DIST):
    @app.get("/logo.png")
    async def serve_logo():
        logo_path = os.path.join(FRONTEND_DIST, "logo.png")
        print(f"[MovieSphere] Serving logo from: {logo_path}, exists: {os.path.isfile(logo_path)}")
        return FileResponse(logo_path, media_type="image/png")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            media_type, _ = mimetypes.guess_type(file_path)
            return FileResponse(file_path, media_type=media_type)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"), media_type="text/html")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"), media_type="text/html")
