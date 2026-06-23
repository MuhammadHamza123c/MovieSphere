import requests
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_USER

TOKEN_URL = 'https://oauth2.googleapis.com/token'
GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'

def _get_access_token() -> str | None:
    if not all([GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN]):
        return None
    try:
        r = requests.post(TOKEN_URL, data={
            'client_id': GMAIL_CLIENT_ID,
            'client_secret': GMAIL_CLIENT_SECRET,
            'refresh_token': GMAIL_REFRESH_TOKEN,
            'grant_type': 'refresh_token',
        }, timeout=10)
        return r.json().get('access_token')
    except Exception as e:
        print(f'[GmailAPI] Token refresh failed: {e}', flush=True)
        return None

def send_email(to_email: str, subject: str, html_body: str) -> bool:
    access_token = _get_access_token()
    if not access_token:
        print('[GmailAPI] No access token, skipping', flush=True)
        return False
    try:
        msg = MIMEMultipart('alternative')
        msg['To'] = to_email
        msg['From'] = GMAIL_USER or 'hamza574656@gmail.com'
        msg['Subject'] = subject
        msg.attach(MIMEText(html_body, 'html'))
        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        r = requests.post(GMAIL_SEND_URL, headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }, json={'raw': raw}, timeout=10)
        if r.ok:
            print(f'[GmailAPI] Sent to {to_email}', flush=True)
            return True
        print(f'[GmailAPI] Failed to send to {to_email}: {r.status_code} {r.text[:200]}', flush=True)
        return False
    except Exception as e:
        print(f'[GmailAPI] Error sending to {to_email}: {e}', flush=True)
        return False


def send_bulk_emails(users: list[dict], credits: int = 100, site_url: str = 'https://movie-sphere-sigma.vercel.app', site_name: str = 'MovieSphere') -> dict:
    sent = 0
    failed = 0
    for user in users:
        email = user.get('email', '')
        username = (user.get('user_metadata') or {}).get('username') or email.split('@')[0] or 'User'
        if not email:
            failed += 1
            continue
        html = _build_html(username, credits, site_url, site_name)
        subject = f'⚡ You got {credits} free credits today — {site_name}'
        ok = send_email(email, subject, html)
        if ok:
            sent += 1
        else:
            failed += 1
    return {'sent': sent, 'failed': failed}


def _build_html(username: str, credits: int, site_url: str, site_name: str) -> str:
    return f'''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body {{ margin: 0; padding: 0; background-color: #0f0f1a; font-family: 'Segoe UI', Arial, sans-serif; }}
  .container {{ max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; }}
  .header {{ background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px 24px; text-align: center; }}
  .header h1 {{ color: #fff; font-size: 28px; margin: 0; font-weight: 800; }}
  .header p {{ color: #c4b5fd; font-size: 14px; margin: 8px 0 0; }}
  .body {{ padding: 32px 24px; }}
  .credit-badge {{ display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; font-size: 48px; font-weight: 800; padding: 24px 48px; border-radius: 16px; margin: 16px 0; }}
  .body h2 {{ color: #e2e8f0; font-size: 22px; margin: 0 0 8px; }}
  .body p {{ color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }}
  .btn {{ display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px; margin: 8px 0; }}
  .features {{ display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0; }}
  .feature {{ background: #16213e; border-radius: 10px; padding: 14px; flex: 1; min-width: 140px; }}
  .feature .icon {{ font-size: 24px; }}
  .feature .label {{ color: #94a3b8; font-size: 12px; margin-top: 4px; }}
  .footer {{ padding: 24px; text-align: center; border-top: 1px solid #1e293b; }}
  .footer p {{ color: #64748b; font-size: 12px; margin: 4px 0; }}
  .footer a {{ color: #818cf8; text-decoration: none; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🎬 {site_name}</h1>
    <p>Daily Credits Reset</p>
  </div>
  <div class="body">
    <h2>Hey {username}! 👋</h2>
    <p>Your daily <strong>{credits} free credits</strong> have been added to your account. Time to stream!</p>
    <div style="text-align: center;">
      <div class="credit-badge">⚡ {credits}</div>
    </div>
    <div style="text-align: center; margin: 20px 0;">
      <a href="{site_url}" class="btn">🎥 Start Watching Now</a>
    </div>
    <div class="features">
      <div class="feature">
        <div class="icon">🎬</div>
        <div class="label">Movies &amp; TV</div>
      </div>
      <div class="feature">
        <div class="icon">🤖</div>
        <div class="label">AI Recommendations</div>
      </div>
      <div class="feature">
        <div class="icon">👥</div>
        <div class="label">Watch Parties</div>
      </div>
    </div>
    <p style="font-size: 13px; color: #64748b;">
      Credits reset daily at midnight. Unused credits don't roll over.<br>
      1 credit = 1 browse request, movie streams cost 2 credits.
    </p>
  </div>
  <div class="footer">
    <p>© 2026 {site_name}. All rights reserved.</p>
    <p><a href="{site_url}">{site_url}</a></p>
    <p style="font-size: 11px;">You're receiving this because you have a {site_name} account.</p>
  </div>
</div>
</body>
</html>'''
