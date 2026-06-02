from fastapi import APIRouter, Depends
from app.services.tmdb import single_detail
from app.core.database import supabase
from app.core.auth import get_current_user

app_save_fav = APIRouter()

@app_save_fav.post("/MovieSphere/add_fav")
async def add_fav(name: str, user=Depends(get_current_user)):
    result = supabase.table('movies_table').insert(
        {
            'user_id': user.id,
            'title': name
        }
    ).execute()
    return {"favorites": result.data}

@app_save_fav.get("/MovieSphere/favs")
async def get_favs(user=Depends(get_current_user)):
    result = supabase.table('movies_table').select('title').eq('user_id', user.id).execute().data
    titles = list(set([item['title'] for item in result]))
    data_result = single_detail(titles)
    return {
        'favorites': data_result
    }

@app_save_fav.get("/MovieSphere/remove_fav")
def remove_fav(name: str, user=Depends(get_current_user)):
    supabase.table('movies_table').delete().eq('user_id', user.id).eq('title', name).execute()
    return {
        'favorites': f'{name} remove from the favorites!'
    }
