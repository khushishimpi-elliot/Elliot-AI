"""Email sender using Resend."""
import logging

import resend

from app.config import get_settings

log = logging.getLogger(__name__)


def send_magic_link(email: str, link_url: str) -> None:
    """Send magic link via Resend"""
    settings = get_settings()

    if not settings.resend_api_key:
        log.warning("RESEND_API_KEY not configured, logging link instead")
        log.info("MAGIC_LINK_EMAIL email=%s link=%s", email, link_url)
        print(f"[magic-link] to={email} link={link_url}")
        return

    resend.api_key = settings.resend_api_key

    try:
        resend.Emails.send(
            {
                "from": settings.email_from,
                "to": email,
                "subject": "Sign in to Elliot-AI",
                "html": f"""
                    <div style="font-family:monospace;max-width:480px;
                                margin:40px auto;padding:24px">
                        <h2 style="color:#111111">ELLIOT-AI</h2>
                        <p style="color:#555555">
                            Click below to sign in to Elliot-AI:
                        </p>
                        <a href="{link_url}"
                           style="display:inline-block;
                                  background:#111111;
                                  color:#4FFFB0;
                                  padding:12px 24px;
                                  text-decoration:none;
                                  border-radius:4px;
                                  font-family:monospace;
                                  font-weight:bold">
                            Sign in to Elliot-AI →
                        </a>
                        <p style="color:#888888;font-size:12px;
                                  margin-top:24px">
                            This link expires in 15 minutes.<br>
                            If you did not request this, ignore this email.
                        </p>
                    </div>
                """,
            }
        )
        log.info("Magic link sent to %s", email)
    except Exception as e:
        log.error(f"Failed to send magic link email: {str(e)}")
