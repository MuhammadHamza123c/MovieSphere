from fastapi import APIRouter, Depends
from app.services.tmdb import select_latest_one
from app.core.auth import get_current_user

user_hist_app = APIRouter()

@user_hist_app.get('/MovieSphere/hist_rec')
def history_based(user=Depends(get_current_user)):
    result = select_latest_one(user.id)
    return {
        'MovieSphere': result
    }
