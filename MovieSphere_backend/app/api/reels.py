from fastapi import APIRouter, Query
from app.services.youtube import get_reels

reels_app = APIRouter()

@reels_app.get('/MovieSphere/reels')
async def reels_endpoint(page: int = Query(1, ge=1)):
    results = await get_reels(page=page)
    return {"MovieSphere": results}
