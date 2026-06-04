from dotenv import load_dotenv
import os

load_dotenv()

TMDB_API_KEY = os.getenv('tmdb_api_key')
GROQ_API_KEY = os.getenv('groq_api_key')
SUPABASE_URL = os.getenv('project_url')
SUPABASE_KEY = os.getenv('api_key')
SUPABASE_ANON_KEY = os.getenv('anon_key')
VAPID_PUBLIC_KEY = os.getenv('VAPID_PUBLIC_KEY', 'BFtESyTiSk18sATRJSISJBSlS_9np8uPbKBaZJRWaLEjEmiyx7rXY470Hj4JOwCFMwuRp5UsjnA6uifNOaew3A8')
VAPID_PRIVATE_KEY = os.getenv('VAPID_PRIVATE_KEY', 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg5TBWKGPgL9XcxgTWxypoAAP4jEJUTRgsXQp3RiWJ5VuhRANCAARbREsk4kpNfLAE0SUiEiQUpUv_Z6fLj2ygWmSUVmixIxJosse612OO9B4-CTsAhTMLkaeVLI5wOronzTmnsNwP')
VAPID_CLAIM_EMAIL = os.getenv('VAPID_CLAIM_EMAIL', 'admin@cinema.com')
