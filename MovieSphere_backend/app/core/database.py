from supabase import create_client
from app.core.config import SUPABASE_URL, SUPABASE_KEY, SUPABASE_ANON_KEY

if not SUPABASE_URL or not SUPABASE_KEY:
    supabase = None
    supabase_anon = None
else:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    supabase_anon = create_client(SUPABASE_URL, SUPABASE_ANON_KEY) if SUPABASE_ANON_KEY else supabase
