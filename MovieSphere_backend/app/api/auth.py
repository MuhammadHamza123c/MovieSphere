from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.database import supabase
from app.core.auth import get_current_user
import os

auth_app = APIRouter(prefix="/auth", tags=["auth"])

class SignUpRequest(BaseModel):
    email: str
    password: str
    username: str
    display_name: str = ""

class SignInRequest(BaseModel):
    email: str
    password: str

@auth_app.post("/signup")
async def signup(body: SignUpRequest):
    try:
        result = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
            "options": {
                "data": {
                    "display_name": body.username,
                    "username": body.username
                }
            }
        })
        return {
            "user": result.user,
            "session": result.session
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@auth_app.post("/login")
async def login(body: SignInRequest):
    try:
        result = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password
        })
        return {
            "user": result.user,
            "session": result.session
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@auth_app.post("/logout")
async def logout(user=Depends(get_current_user)):
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@auth_app.get("/me")
async def get_me(user=Depends(get_current_user)):
    metadata = user.user_metadata or {}
    name = metadata.get("username") or metadata.get("display_name") or metadata.get("full_name") or metadata.get("name") or ""
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "username": name,
            "display_name": name
        }
    }

@auth_app.get("/google/config")
async def google_config():
    return {
        "url": os.getenv("project_url"),
        "anon_key": os.getenv("anon_key")
    }

@auth_app.delete("/account")
async def delete_account(user=Depends(get_current_user)):
    import httpx
    uid = user.id
    headers = {
        "apikey": os.getenv("api_key"),
        "Authorization": f"Bearer {os.getenv('api_key')}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    async with httpx.AsyncClient() as c:
        for table in ["movies_table", "user_watch_later", "comments", "continue_watching", "user_exp", "user_notifications"]:
            await c.delete(f"{os.getenv('project_url')}/rest/v1/{table}", headers=headers, params={"user_id": f"eq.{uid}"})
        await c.delete(f"{os.getenv('project_url')}/auth/v1/admin/users/{uid}", headers=headers)
    return {"message": "Account deleted"}
