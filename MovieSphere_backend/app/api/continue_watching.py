from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.core.database import supabase
from datetime import datetime

continue_watching_app = APIRouter()

@continue_watching_app.get('/MovieSphere/continue-watching')
def get_continue_watching(user=Depends(get_current_user)):
    if not supabase:
        return {'MovieSphere': []}
    result = supabase.table('continue_watching')\
        .select('*')\
        .eq('user_id', user.id)\
        .order('updated_at', desc=True)\
        .limit(20)\
        .execute()
    return {'MovieSphere': result.data or []}

@continue_watching_app.put('/MovieSphere/continue-watching/progress')
def save_progress(data: dict, user=Depends(get_current_user)):
    if not supabase:
        return {'status': 'error', 'message': 'Database not configured'}
    payload = {
        'user_id': user.id,
        'media_id': str(data['media_id']),
        'media_type': data['media_type'],
        'season': data.get('season'),
        'episode': data.get('episode'),
        'title': data['title'],
        'poster_url': data.get('poster_url', ''),
        'progress_seconds': data.get('progress_seconds', 0),
        'total_seconds': data.get('total_seconds', 0),
        'updated_at': datetime.utcnow().isoformat()
    }
    supabase.table('continue_watching').upsert(payload, on_conflict=['user_id', 'media_id', 'media_type', 'season', 'episode']).execute()
    return {'status': 'ok'}

@continue_watching_app.delete('/MovieSphere/continue-watching/{media_id}')
def remove_item(media_id: str, user=Depends(get_current_user)):
    if not supabase:
        return {'status': 'error'}
    supabase.table('continue_watching')\
        .delete()\
        .eq('user_id', user.id)\
        .eq('media_id', media_id)\
        .execute()
    return {'status': 'ok'}
