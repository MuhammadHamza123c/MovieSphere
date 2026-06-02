from fastapi import APIRouter, File, UploadFile
from typing import Optional
from uuid import uuid4
from app.services.tmdb import get_movie, get_tv
from app.services.ai import ai_detail, ask_ai_pic
from app.core.database import supabase

ai_movie_app = APIRouter()

@ai_movie_app.post('/MovieSphere/streamit/ask_it')
async def check_now(id: Optional[int] = None, season: Optional[int] = None, epi: Optional[int] = None, f1: Optional[UploadFile] = File(None)):
    if f1 is not None and id is None and season is None and epi is None:
        file_extension = f1.content_type.split('/')[-1]
        file_name = f"{uuid4()}.{file_extension}"
        content = await f1.read()
        supabase.storage.from_('user_files').upload(f"images/{file_name}", content)
        public_url = supabase.storage.from_('user_files').get_public_url(f"images/{file_name}")
        result = ask_ai_pic(public_url)
    elif f1 is None and id is not None and season is None and epi is None:
        data_store = get_movie(id)
        result = ai_detail(data_store)
    elif f1 is None:
        data_store = get_tv(id, season, epi)
        result = ai_detail(data_store)
    else:
        result = "Invalid Input"
    return {
        'MovieSphere': result
    }
