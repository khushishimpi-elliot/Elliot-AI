"""Email service — SMTP provider with environment configuration.

Uses SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM from environment.
Supports Gmail, SendGrid, and other SMTP providers.
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

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
    """Send magic link email via configured SMTP provider."""
    settings = get_settings()
    html = HTML_TEMPLATE.format(magic_link=magic_link)

    # ── SMTP (configured via SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) ──────
    if settings.smtp_host and settings.smtp_user and settings.smtp_pass:
        return _send_via_smtp(
            to_email=to_email,
            subject="Sign in to Elliot-AI",
            html=html,
            smtp_host=settings.smtp_host,
            smtp_port=settings.smtp_port,
            smtp_user=settings.smtp_user,
            smtp_pass=settings.smtp_pass,
            email_from=settings.email_from,
        )

    # ── No email provider configured ───────────────────────────────────────────
    logger.warning("No email provider configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing)")
    logger.info(f"Magic link for {to_email}: {magic_link}")
    return False


def _send_via_smtp(
    to_email: str,
    subject: str,
    html: str,
    smtp_host: str,
    smtp_port: int,
    smtp_user: str,
    smtp_pass: str,
    email_from: str,
) -> bool:
    """Send email via SMTP provider using STARTTLS."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Elliot-AI <{email_from}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        # Connect with STARTTLS (port 587 standard)
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(email_from, to_email, msg.as_string())

        logger.info(f"Magic link sent to {to_email} via {smtp_host}")
        return True

    except Exception as e:
        logger.error(f"SMTP failed: {type(e).__name__}: {str(e)}")
        return False
