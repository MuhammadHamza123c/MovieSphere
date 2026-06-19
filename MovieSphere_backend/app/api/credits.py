from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.core.credits import get_credits

credits_app = APIRouter()

@credits_app.get('/MovieSphere/credits')
async def credits_info(user=Depends(get_current_user)):
    result = await get_credits(user.id)
    return {'MovieSphere': result}
