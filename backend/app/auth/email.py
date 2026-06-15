"""Email sender.

Stub: logs the link instead of sending. Wire real SMTP / SES / Mailgun later.
Khushi's TODO before merge: pick provider, add env vars to .env.example.
"""
import logging

log = logging.getLogger(__name__)


def send_magic_link(email: str, link_url: str) -> None:
    log.info("MAGIC_LINK_EMAIL email=%s link=%s", email, link_url)
    print(f"[magic-link] to={email} link={link_url}")
