from dotenv import load_dotenv
import os

load_dotenv()

TMDB_API_KEY = os.getenv('tmdb_api_key')
GROQ_API_KEY = os.getenv('groq_api_key')
SUPABASE_URL = os.getenv('project_url')
SUPABASE_KEY = os.getenv('api_key')
LIVEKIT_URL = os.getenv('LIVEKIT_URL')
LIVEKIT_API_KEY = os.getenv('LIVEKIT_API_KEY')
LIVEKIT_API_SECRET = os.getenv('LIVEKIT_API_SECRET')
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
GIPHY_API_KEY = os.getenv('GIPHY_API_KEY')
CRON_SECRET_KEY = os.getenv('CRON_SECRET_KEY')
VAPID_PUBLIC_KEY = os.getenv('VAPID_PUBLIC_KEY')
VAPID_PRIVATE_KEY = os.getenv('VAPID_PRIVATE_KEY')
EMAIL_HOST = os.getenv('EMAIL_HOST')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USER = os.getenv('EMAIL_USER')
EMAIL_PASS = os.getenv('EMAIL_PASS')
