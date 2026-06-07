from fastapi import APIRouter, HTTPException, Query
import jwt
import time
from app.core.config import LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL

watch_party_app = APIRouter()

@watch_party_app.post('/MovieSphere/watch-party/token')
async def get_token(room: str = Query(...), identity: str = Query(...)):
    try:
        now = int(time.time())
        payload = {
            'exp': now + 3600,
            'iss': LIVEKIT_API_KEY,
            'sub': identity,
            'name': f'User-{identity[:6]}',
            'video': {
                'room': room,
                'roomJoin': True,
            },
        }
        headers = {'kid': LIVEKIT_API_KEY, 'alg': 'HS256', 'typ': 'JWT'}
        token = jwt.encode(payload, LIVEKIT_API_SECRET, algorithm='HS256', headers=headers)
        return {'token': token, 'url': LIVEKIT_URL}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
