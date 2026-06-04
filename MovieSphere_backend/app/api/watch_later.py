import requests
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from app.core.database import supabase
from app.api.auth import get_current_user
from app.core.config import TMDB_API_KEY
from app.services.tmdb import watch_later_details

watch_later_app = APIRouter()

@watch_later_app.get("/MovieSphere/watch_later")
async def get_watch_later(user = Depends(get_current_user)):
    try:
        response = supabase.table('user_watch_later').select('*').eq('user_id', user.id).order('added_at', desc=True).execute()
        enriched = watch_later_details(response.data) if response.data else []
        return {'MovieSphere': enriched}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@watch_later_app.post("/MovieSphere/add_watch_later")
async def add_watch_later(media_id: int = Query(...), media_type: str = Query(...), user = Depends(get_current_user)):
    if media_type not in ['movie', 'tv']:
        raise HTTPException(status_code=400, detail="Invalid media type")
    try:
        existing = supabase.table('user_watch_later').select('*').eq('user_id', user.id).eq('media_id', media_id).eq('media_type', media_type).execute()
        if existing.data:
            return {'MovieSphere': {'message': 'Already in watch later'}}
        response = supabase.table('user_watch_later').insert({
            'user_id': user.id,
            'media_id': media_id,
            'media_type': media_type
        }).execute()
        return {'MovieSphere': response.data[0] if response.data else {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@watch_later_app.delete("/MovieSphere/remove_watch_later")
async def remove_watch_later(media_id: int = Query(...), media_type: str = Query(...), user = Depends(get_current_user)):
    try:
        response = supabase.table('user_watch_later').delete().eq('user_id', user.id).eq('media_id', media_id).eq('media_type', media_type).execute()
        return {'MovieSphere': response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@watch_later_app.get("/MovieSphere/check_watch_later")
async def check_watch_later(media_id: int = Query(...), media_type: str = Query(...), user = Depends(get_current_user)):
    try:
        response = supabase.table('user_watch_later').select('id').eq('user_id', user.id).eq('media_id', media_id).eq('media_type', media_type).execute()
        return {'MovieSphere': {'in_watch_later': len(response.data) > 0}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@watch_later_app.get("/MovieSphere/watch_later/releases")
async def check_releases(user = Depends(get_current_user)):
    try:
        response = supabase.table('user_watch_later').select('*').eq('user_id', user.id).execute()
        if not response.data:
            return {'MovieSphere': []}
        released = []
        for item in response.data:
            media_id = item['media_id']
            media_type = item['media_type']
            r = requests.get(f"https://api.themoviedb.org/3/{media_type}/{media_id}", params={'api_key': TMDB_API_KEY})
            if r.ok:
                data = r.json()
                if data.get('status') == 'Released':
                    title = data.get('title') or data.get('name') or data.get('original_title') or data.get('original_name')
                    released.append({
                        'Id': data.get('id'),
                        'Title': title,
                        'media_type': media_type,
                        'Poster_path': f"https://image.tmdb.org/t/p/w500{data.get('poster_path')}" if data.get('poster_path') else None
                    })
        return {'MovieSphere': released}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@watch_later_app.get("/MovieSphere/watch_later/{item_id}")
async def get_watch_later_item(item_id: str, user = Depends(get_current_user)):
    try:
        response = supabase.table('user_watch_later').select('*').eq('id', item_id).eq('user_id', user.id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
        enriched = watch_later_details([response.data])
        return {'MovieSphere': enriched[0] if enriched else response.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@watch_later_app.put("/MovieSphere/watch_later/{item_id}")
async def update_watch_later(item_id: str, data: dict = Body(...), user = Depends(get_current_user)):
    try:
        existing = supabase.table('user_watch_later').select('id').eq('id', item_id).eq('user_id', user.id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Item not found")
        supabase.table('user_watch_later').update(data).eq('id', item_id).execute()
        return {'MovieSphere': {'message': 'Updated'}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@watch_later_app.delete("/MovieSphere/watch_later/{item_id}")
async def delete_watch_later_item(item_id: str, user = Depends(get_current_user)):
    try:
        existing = supabase.table('user_watch_later').select('id').eq('id', item_id).eq('user_id', user.id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Item not found")
        supabase.table('user_watch_later').delete().eq('id', item_id).execute()
        return {'MovieSphere': {'message': 'Deleted'}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
