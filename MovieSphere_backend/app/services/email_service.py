# kept for compatibility — delegates to gmail_api
from app.services.gmail_api import send_email, send_bulk_emails

send_credits_email = send_email
send_bulk_credits_emails = send_bulk_emails
