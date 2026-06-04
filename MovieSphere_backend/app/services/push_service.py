import requests
import logging
from datetime import datetime, timedelta, timezone
from pywebpush import webpush, WebPushException
from app.core.config import VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_CLAIM_EMAIL, TMDB_API_KEY
from app.core.database import supabase

logger = logging.getLogger(__name__)

VAPID_CLAIMS = {"sub": f"mailto:{VAPID_CLAIM_EMAIL}"}

_notified = set()

def send_push_to_all(title: str, body: str, icon: str = None, data_url: str = None):
    try:
        subs = supabase.table("push_subscriptions").select("endpoint,p256dh,auth").execute().data
    except Exception as e:
        logger.error(f"Failed to fetch subscriptions: {e}")
        return
    payload = {
        "title": title,
        "body": body,
    }
    if icon:
        payload["icon"] = icon
    if data_url:
        payload["data"] = {"url": data_url}
    import json
    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub["endpoint"],
                    "keys": {
                        "p256dh": sub["p256dh"],
                        "auth": sub["auth"],
                    }
                },
                data=json.dumps(payload),
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS,
            )
        except WebPushException as e:
            if e.response and e.response.status_code in (410, 404):
                supabase.table("push_subscriptions").delete().eq("endpoint", sub["endpoint"]).execute()
            else:
                logger.error(f"Push failed for {sub['endpoint'][:50]}: {e}")

def check_upcoming_and_notify():
    global _notified
    tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
    new_ids = []

    for media_type, url_key in [("movie", "movie/upcoming"), ("tv", "tv/on_the_air")]:
        url = f"https://api.themoviedb.org/3/{url_key}"
        try:
            r = requests.get(url, params={"api_key": TMDB_API_KEY, "language": "en-US"})
            if not r.ok:
                continue
            data = r.json()
            for item in data.get("results", []):
                release_key = "release_date" if media_type == "movie" else "first_air_date"
                release_date = item.get(release_key)
                if release_date == tomorrow:
                    item_id = f"{media_type}_{item['id']}"
                    if item_id not in _notified:
                        new_ids.append(item_id)
                        title = item.get("title") or item.get("name") or "Unknown"
                        poster = item.get("poster_path")
                        icon = f"https://image.tmdb.org/t/p/w500{poster}" if poster else None
                        send_push_to_all(
                            title=f"Releasing Tomorrow: {title}",
                            body=f"{title} releases on {tomorrow}!",
                            icon=icon,
                            data_url=f"/{media_type}/{item['id']}"
                        )
        except Exception as e:
            logger.error(f"Error checking {media_type} upcoming: {e}")

    _notified.update(new_ids)
