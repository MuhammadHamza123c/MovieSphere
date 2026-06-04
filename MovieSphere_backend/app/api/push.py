from fastapi import APIRouter, Depends, HTTPException, Body
from app.core.database import supabase
from app.api.auth import get_current_user

push_app = APIRouter()

@push_app.post("/MovieSphere/push/subscribe")
async def subscribe(data: dict = Body(...), user = Depends(get_current_user)):
    try:
        endpoint = data.get("endpoint")
        keys = data.get("keys", {})
        if not endpoint or not keys.get("p256dh") or not keys.get("auth"):
            raise HTTPException(status_code=400, detail="Missing subscription fields")
        existing = supabase.table("push_subscriptions").select("id").eq("user_id", user.id).eq("endpoint", endpoint).execute()
        if existing.data:
            return {"MovieSphere": {"message": "Already subscribed"}}
        supabase.table("push_subscriptions").insert({
            "user_id": user.id,
            "endpoint": endpoint,
            "p256dh": keys["p256dh"],
            "auth": keys["auth"]
        }).execute()
        return {"MovieSphere": {"message": "Subscribed"}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@push_app.post("/MovieSphere/push/unsubscribe")
async def unsubscribe(data: dict = Body(...), user = Depends(get_current_user)):
    try:
        endpoint = data.get("endpoint")
        if not endpoint:
            raise HTTPException(status_code=400, detail="Missing endpoint")
        supabase.table("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint).execute()
        return {"MovieSphere": {"message": "Unsubscribed"}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
