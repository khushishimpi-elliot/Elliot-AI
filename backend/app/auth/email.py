import logging
import os

import httpx

log = logging.getLogger(__name__)


def send_magic_link(email: str, link_url: str) -> None:
    api_key = os.getenv("RESEND_API_KEY", "")
    from_email = os.getenv("FROM_EMAIL") or os.getenv("EMAIL_FROM", "onboarding@resend.dev")

    if not api_key:
        log.warning("RESEND_API_KEY not set — printing link to logs only")
        log.info("MAGIC_LINK_EMAIL email=%s link=%s", email, link_url)
        print(f"[magic-link] to={email} link={link_url}")
        return

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": f"Elliot AI <{from_email}>",
                "to": [email],
                "subject": "Sign in to Elliot AI",
                "html": f"""
                <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
                    <h2 style="color:#4361ee">Sign in to Elliot AI</h2>
                    <p>Click the button below to sign in. This link expires in 15 minutes.</p>
                    <a href="{link_url}"
                       style="display:inline-block;background:#4361ee;color:#fff;
                              padding:12px 24px;border-radius:6px;text-decoration:none;
                              font-weight:600;margin:16px 0">
                        Sign in to Elliot AI
                    </a>
                    <p style="color:#888;font-size:12px">
                        If you did not request this, ignore this email.
                    </p>
                </div>
                """,
            },
            timeout=10,
        )
        response.raise_for_status()
        log.info("Magic link email sent to %s", email)
    except Exception as e:
        log.error("Failed to send magic link email: %s", str(e))
        print(f"[magic-link] to={email} link={link_url}")
