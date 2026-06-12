from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

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
