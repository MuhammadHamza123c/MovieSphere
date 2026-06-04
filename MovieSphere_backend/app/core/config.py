from dotenv import load_dotenv
import os

load_dotenv()

TMDB_API_KEY = os.getenv('tmdb_api_key')
GROQ_API_KEY = os.getenv('groq_api_key')
SUPABASE_URL = os.getenv('project_url')
SUPABASE_KEY = os.getenv('api_key')
SUPABASE_ANON_KEY = os.getenv('anon_key')
