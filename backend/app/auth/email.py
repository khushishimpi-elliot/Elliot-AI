import asyncio
import logging

from app.services.email import send_magic_link_email

log = logging.getLogger(__name__)


def send_magic_link(email: str, link_url: str) -> None:
    """Send magic link email via SendGrid"""
    asyncio.run(send_magic_link_email(email, link_url))
