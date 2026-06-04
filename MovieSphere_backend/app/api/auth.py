from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.database import supabase, supabase_anon
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
        result = supabase_anon.auth.sign_up({
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
        error_str = str(e)
        if "confirmation email" in error_str.lower():
            admin_result = supabase.auth.admin.create_user({
                "email": body.email,
                "password": body.password,
                "email_confirm": True,
                "user_metadata": {
                    "display_name": body.username,
                    "username": body.username
                }
            })
            session = supabase_anon.auth.sign_in_with_password({
                "email": body.email,
                "password": body.password
            })
            return {
                "user": admin_result.user,
                "session": session.session
            }
        raise HTTPException(status_code=400, detail=error_str)

@auth_app.post("/login")
async def login(body: SignInRequest):
    try:
        result = supabase_anon.auth.sign_in_with_password({
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
        supabase_anon.auth.sign_out()
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
