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
