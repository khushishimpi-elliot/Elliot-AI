"""Email service using SendGrid."""
import logging

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from app.config import get_settings

logger = logging.getLogger(__name__)


async def send_magic_link_email(
    to_email: str,
    magic_link: str,
) -> bool:
    """Send magic link via SendGrid"""
    settings = get_settings()
    logger.info(f"send_magic_link_email called for {to_email}")

    if not settings.sendgrid_api_key:
        logger.warning("SENDGRID_API_KEY not configured, skipping email")
        logger.info(f"Magic link for {to_email}: {magic_link}")
        return False

    logger.info(f"SENDGRID_API_KEY is set, from_email={settings.sendgrid_from_email}")

    try:
        html = (
            "<div style='font-family:monospace;max-width:480px;"
            "margin:40px auto;padding:32px;background:#0D0D0D;"
            "color:#FFFFFF;border-radius:8px'>"
            "<h2 style='color:#4FFFB0;margin:0 0 16px 0;font-size:20px'>"
            "ELLIOT-AI</h2>"
            "<p style='color:#AAAAAA;font-size:14px;margin:0 0 24px 0'>"
            "Click below to sign in to Elliot-AI. "
            "This link expires in 15 minutes.</p>"
            f"<a href='{magic_link}' "
            "style='display:inline-block;background:#4FFFB0;"
            "color:#000000;padding:12px 32px;text-decoration:none;"
            "border-radius:6px;font-family:monospace;font-weight:bold;"
            "font-size:14px'>Sign in to Elliot-AI →</a>"
            "<p style='color:#555555;font-size:11px;margin-top:32px'>"
            "If you did not request this, ignore this email.</p>"
            "</div>"
        )

        message = Mail(
            from_email=settings.sendgrid_from_email,
            to_emails=to_email,
            subject="Sign in to Elliot-AI",
            html_content=html,
        )

        sg = SendGridAPIClient(settings.sendgrid_api_key)
        response = sg.send(message)

        if response.status_code in (200, 201, 202):
            logger.info(f"Magic link sent to {to_email}")
            return True
        else:
            logger.error(
                f"SendGrid returned {response.status_code}: {response.body}"
            )
            return False

    except Exception as e:
        logger.error(f"Failed to send magic link email: {str(e)}")
        return False
