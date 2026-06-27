"""Email service using Resend."""
import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


async def send_magic_link_email(
    to_email: str,
    magic_link: str,
) -> bool:
    """Send magic link via Resend"""
    settings = get_settings()

    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        logger.info(f"Magic link for {to_email}: {magic_link}")
        return False

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

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                json={
                    "from": "onboarding@resend.dev",
                    "to": to_email,
                    "subject": "Sign in to Elliot-AI",
                    "html": html,
                },
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            )

            if response.status_code in (200, 201):
                logger.info(f"Magic link sent to {to_email}")
                return True
            else:
                logger.error(
                    f"Resend returned {response.status_code}: {response.text}"
                )
                return False

    except Exception as e:
        logger.error(f"Failed to send magic link email: {str(e)}")
        return False
