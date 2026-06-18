from fastapi import APIRouter, HTTPException, Query
from app.core.config import CRON_SECRET_KEY
from app.services.trailer_digest import fetch_daily_digest, send_push_notifications

trailer_digest_app = APIRouter()

@trailer_digest_app.post('/MovieSphere/trailer-digest/run')
async def run_digest(key: str = Query(...)):
    if key != CRON_SECRET_KEY:
        raise HTTPException(status_code=403, detail='Invalid key')
    trailers = await fetch_daily_digest()
    sent = await send_push_notifications(trailers)
    return {'trailers_fetched': len(trailers), 'push_sent': len(sent)}
