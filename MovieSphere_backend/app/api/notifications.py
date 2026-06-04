from fastapi import APIRouter, Depends, HTTPException, Query, Body
from app.core.database import supabase
from app.api.auth import get_current_user

notification_app = APIRouter()

@notification_app.get("/MovieSphere/notifications")
async def get_notifications(user = Depends(get_current_user)):
    try:
        response = supabase.table('user_notifications').select('*').eq('user_id', user.id).order('created_at', desc=True).limit(50).execute()
        return {'MovieSphere': response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@notification_app.get("/MovieSphere/notifications/unread")
async def get_unread_count(user = Depends(get_current_user)):
    try:
        response = supabase.table('user_notifications').select('id', count='exact').eq('user_id', user.id).eq('is_read', False).execute()
        return {'MovieSphere': {'count': response.count}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@notification_app.put("/MovieSphere/notifications/read")
async def mark_read(notification_id: str = Query(None), user = Depends(get_current_user)):
    try:
        query = supabase.table('user_notifications').update({'is_read': True}).eq('user_id', user.id)
        if notification_id:
            query = query.eq('id', notification_id)
        query.execute()
        return {'MovieSphere': {'message': 'Marked as read'}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@notification_app.get("/MovieSphere/notifications/{notif_id}")
async def get_notification(notif_id: str, user = Depends(get_current_user)):
    try:
        response = supabase.table('user_notifications').select('*').eq('id', notif_id).eq('user_id', user.id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {'MovieSphere': response.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@notification_app.put("/MovieSphere/notifications/{notif_id}")
async def update_notification(notif_id: str, data: dict = Body(...), user = Depends(get_current_user)):
    try:
        existing = supabase.table('user_notifications').select('id').eq('id', notif_id).eq('user_id', user.id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Notification not found")
        supabase.table('user_notifications').update(data).eq('id', notif_id).execute()
        return {'MovieSphere': {'message': 'Updated'}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@notification_app.delete("/MovieSphere/notifications/{notif_id}")
async def delete_notification(notif_id: str, user = Depends(get_current_user)):
    try:
        existing = supabase.table('user_notifications').select('id').eq('id', notif_id).eq('user_id', user.id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Notification not found")
        supabase.table('user_notifications').delete().eq('id', notif_id).execute()
        return {'MovieSphere': {'message': 'Deleted'}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@notification_app.post("/MovieSphere/notifications")
async def create_notification(data: dict = Body(...), user = Depends(get_current_user)):
    try:
        response = supabase.table('user_notifications').insert({
            'user_id': user.id,
            'title': data.get('title'),
            'body': data.get('body'),
            'media_id': data.get('media_id'),
            'media_type': data.get('media_type'),
            'poster_url': data.get('poster_url'),
            'type': data.get('type', 'release')
        }).execute()
        return {'MovieSphere': response.data[0] if response.data else {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
