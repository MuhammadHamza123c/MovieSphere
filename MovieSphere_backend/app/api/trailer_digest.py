from fastapi import APIRouter, HTTPException, Query
from app.core.config import CRON_SECRET_KEY
from app.services.trailer_digest import fetch_daily_digest, send_next_push

trailer_digest_app = APIRouter()

@trailer_digest_app.get('/MovieSphere/trailer-digest/run')
@trailer_digest_app.post('/MovieSphere/trailer-digest/run')
async def run_digest(key: str = Query(...)):
    if key != CRON_SECRET_KEY:
        raise HTTPException(status_code=403, detail='Invalid key')
    trailers = await fetch_daily_digest()
    result = await send_next_push()
    return {
        'trailers_fetched': len(trailers),
        'push': result,
    }
