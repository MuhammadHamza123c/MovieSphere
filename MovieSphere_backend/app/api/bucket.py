from fastapi import APIRouter, Depends, HTTPException
from app.core.database import supabase
from app.api.auth import get_current_user  # Import the auth dependency

bucket_app = APIRouter()

@bucket_app.get("/MovieSphere/bucket")
async def get_bucket(user: dict = Depends(get_current_user)):
    response = supabase.table('user_bucket').select('*').eq('user_id', user['id']).execute()
    return {'MovieSphere': response.data}

@bucket_app.post("/MovieSphere/add_bucket")
async def add_to_bucket(media_id: int, media_type: str, user: dict = Depends(get_current_user)):
    # Validate media_type
    if media_type not in ['movie', 'tv']:
        raise HTTPException(status_code=400, detail="Invalid media type")
        
    # Check if already exists
    existing = supabase.table('user_bucket').select('*').eq('user_id', user['id']).eq('media_id', media_id).eq('media_type', media_type).execute()
    if existing.data:
        return {'MovieSphere': {'message': 'Already in bucket'}}
    
    # Insert new item
    response = supabase.table('user_bucket').insert({
        'user_id': user['id'],
        'media_id': media_id,
        'media_type': media_type
    }).execute()
    
    return {'MovieSphere': response.data[0] if response.data else {}}

@bucket_app.delete("/MovieSphere/remove_bucket")
async def remove_from_bucket(media_id: int, media_type: str, user: dict = Depends(get_current_user)):
    response = supabase.table('user_bucket').delete().eq('user_id', user['id']).eq('media_id', media_id).eq('media_type', media_type).execute()
    return {'MovieSphere': response.data}

@bucket_app.get("/MovieSphere/check_bucket")
async def check_in_bucket(media_id: int, media_type: str, user: dict = Depends(get_current_user)):
    response = supabase.table('user_bucket').select('id').eq('user_id', user['id']).eq('media_id', media_id).eq('media_type', media_type).execute()
    return {'MovieSphere': {'in_bucket': len(response.data) > 0}}