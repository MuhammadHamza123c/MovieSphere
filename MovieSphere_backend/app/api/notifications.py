from fastapi import APIRouter

notifications_app = APIRouter()

@notifications_app.post('/MovieSphere/notifications/subscribe')
async def subscribe():
    return {'status': 'subscribed'}

@notifications_app.delete('/MovieSphere/notifications/subscribe')
async def unsubscribe():
    return {'status': 'unsubscribed'}
