import json
import logging
from pywebpush import webpush, WebPushException
from app.core.config import VAPID_PRIVATE_KEY, VAPID_CLAIM_EMAIL
from app.core.database import supabase

logger = logging.getLogger(__name__)

VAPID_CLAIMS = {"sub": f"mailto:{VAPID_CLAIM_EMAIL}"}

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


