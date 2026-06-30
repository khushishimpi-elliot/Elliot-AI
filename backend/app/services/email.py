"""Email service — Gmail SMTP (dev/staging) with Resend fallback (production).

Switch to Resend for production by setting RESEND_API_KEY in environment.
For Gmail SMTP set GMAIL_USER and GMAIL_APP_PASSWORD in environment.
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

HTML_TEMPLATE = """
<div style="font-family:monospace;max-width:480px;margin:40px auto;
padding:32px;background:#0D0D0D;color:#FFFFFF;border-radius:8px">
  <h2 style="color:#4FFFB0;margin:0 0 16px 0;font-size:20px">ELLIOT-AI</h2>
  <p style="color:#AAAAAA;font-size:14px;margin:0 0 24px 0">
    Click below to sign in to Elliot-AI. This link expires in 15 minutes.
  </p>
  <a href="{magic_link}"
     style="display:inline-block;background:#4FFFB0;color:#000000;
     padding:12px 32px;text-decoration:none;border-radius:6px;
     font-family:monospace;font-weight:bold;font-size:14px">
    Sign in to Elliot-AI →
  </a>
  <p style="color:#555555;font-size:11px;margin-top:32px">
    If you did not request this, ignore this email.
  </p>
</div>
"""


async def send_magic_link_email(to_email: str, magic_link: str) -> bool:
    """Send magic link email — uses Gmail SMTP if configured, else Resend."""
    settings = get_settings()
    html = HTML_TEMPLATE.format(magic_link=magic_link)

    # ── Gmail SMTP ────────────────────────────────────────────────────────────
    if settings.gmail_user and settings.gmail_app_password:
        return _send_via_gmail(
            to_email=to_email,
            subject="Sign in to Elliot-AI",
            html=html,
            gmail_user=settings.gmail_user,
            gmail_app_password=settings.gmail_app_password,
        )

    # ── Resend (production fallback) ──────────────────────────────────────────
    if settings.resend_api_key:
        return await _send_via_resend(
            to_email=to_email,
            subject="Sign in to Elliot-AI",
            html=html,
            api_key=settings.resend_api_key,
            from_address=settings.resend_from_address,
        )

    # ── No email provider configured ─────────────────────────────────────────
    logger.warning("No email provider configured (GMAIL_USER or RESEND_API_KEY missing)")
    logger.info(f"Magic link for {to_email}: {magic_link}")
    return False


def _send_via_gmail(
    to_email: str,
    subject: str,
    html: str,
    gmail_user: str,
    gmail_app_password: str,
) -> bool:
    """Send email via Gmail SMTP using an App Password."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Elliot-AI <{gmail_user}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(gmail_user, gmail_app_password)
            server.sendmail(gmail_user, to_email, msg.as_string())

        logger.info(f"Magic link sent to {to_email} via Gmail SMTP")
        return True

    except Exception as e:
        logger.error(f"Gmail SMTP failed: {type(e).__name__}: {str(e)}")
        return False


async def _send_via_resend(
    to_email: str,
    subject: str,
    html: str,
    api_key: str,
    from_address: str,
) -> bool:
    """Send email via Resend API."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                json={
                    "from": from_address,
                    "to": to_email,
                    "subject": subject,
                    "html": html,
                },
                headers={"Authorization": f"Bearer {api_key}"},
            )

        if response.status_code in (200, 201):
            logger.info(f"Magic link sent to {to_email} via Resend")
            return True

        logger.error(f"Resend returned {response.status_code}: {response.text}")
        return False

    except Exception as e:
        logger.error(f"Resend failed: {str(e)}")
        return False
