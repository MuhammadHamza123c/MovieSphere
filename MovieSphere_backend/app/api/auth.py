from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.database import supabase
from app.core.auth import get_current_user

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
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "username": metadata.get("username") or metadata.get("display_name", ""),
            "display_name": metadata.get("display_name", "")
        }
    }

@auth_app.get("/google/url")
async def google_auth_url():
    try:
        result = supabase.auth.sign_in_with_oauth({
            "provider": "google",
            "options": {
                "redirect_to": "https://movie-sphere-sigma.vercel.app/auth/callback"
            }
        })
        return {"url": result.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
