import asyncio
from datetime import datetime, timedelta

import httpx

from app.services.oauth import decrypt_token

SLACK_API_BASE = "https://slack.com/api"
RATE_LIMIT_DELAY = 1  # seconds between paginated requests


class SlackConnector:
    """Slack API connector using OAuth tokens"""

    def __init__(self, encrypted_token: str):
        """Initialize with encrypted access token"""
        self.access_token = decrypt_token(encrypted_token)
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    async def get_channels(self) -> list[dict]:
        """Get all public channels"""
        channels = []
        cursor = None

        async with httpx.AsyncClient() as client:
            while True:
                params = {
                    "exclude_archived": True,
                    "types": "public_channel",
                    "limit": 100,
                }
                if cursor:
                    params["cursor"] = cursor

                response = await client.get(
                    f"{SLACK_API_BASE}/conversations.list",
                    headers=self.headers,
                    params=params,
                )
                response.raise_for_status()
                data = response.json()

                if not data.get("ok"):
                    raise Exception(f"Slack API error: {data.get('error')}")

                for channel in data.get("channels", []):
                    channels.append(
                        {
                            "id": channel.get("id"),
                            "name": channel.get("name"),
                            "topic": channel.get("topic", {}).get("value", ""),
                            "num_members": channel.get("num_members", 0),
                        }
                    )

                cursor = data.get("response_metadata", {}).get("next_cursor")
                if not cursor:
                    break

                await asyncio.sleep(RATE_LIMIT_DELAY)

        return channels

    async def get_channel_messages(
        self, channel_id: str, limit: int = 100
    ) -> list[dict]:
        """Get messages from a channel"""
        messages = []

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SLACK_API_BASE}/conversations.history",
                headers=self.headers,
                params={
                    "channel": channel_id,
                    "limit": limit,
                    "inclusive": True,
                },
            )
            response.raise_for_status()
            data = response.json()

            if not data.get("ok"):
                raise Exception(f"Slack API error: {data.get('error')}")

            for msg in data.get("messages", []):
                # Skip bot messages and empty messages
                if msg.get("type") != "message" or msg.get("subtype") in [
                    "bot_message",
                    "system_message",
                ]:
                    continue

                text = msg.get("text", "").strip()
                if not text or text.startswith(":"):  # Skip emoji-only messages
                    continue

                messages.append(
                    {
                        "text": text,
                        "user": msg.get("user", ""),
                        "timestamp": msg.get("ts", ""),
                        "channel": channel_id,
                        "thread_ts": msg.get("thread_ts"),
                    }
                )

        return messages

    async def get_thread_replies(
        self, channel_id: str, thread_ts: str
    ) -> list[dict]:
        """Get all replies in a thread"""
        replies = []

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SLACK_API_BASE}/conversations.replies",
                headers=self.headers,
                params={
                    "channel": channel_id,
                    "ts": thread_ts,
                },
            )
            response.raise_for_status()
            data = response.json()

            if not data.get("ok"):
                raise Exception(f"Slack API error: {data.get('error')}")

            for msg in data.get("messages", []):
                if msg.get("type") != "message":
                    continue

                text = msg.get("text", "").strip()
                if not text:
                    continue

                replies.append(
                    {
                        "text": text,
                        "user": msg.get("user", ""),
                        "timestamp": msg.get("ts", ""),
                    }
                )

        return replies

    async def search_messages(self, query: str) -> list[dict]:
        """Search messages across all channels"""
        results = []

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SLACK_API_BASE}/search.messages",
                headers=self.headers,
                params={
                    "query": query,
                    "count": 20,
                },
            )
            response.raise_for_status()
            data = response.json()

            if not data.get("ok"):
                raise Exception(f"Slack API error: {data.get('error')}")

            for match in data.get("messages", {}).get("matches", []):
                text = match.get("text", "").strip()
                if not text:
                    continue

                results.append(
                    {
                        "text": text,
                        "channel": match.get("channel", {}).get("name", ""),
                        "user": match.get("user", ""),
                        "timestamp": match.get("ts", ""),
                        "permalink": match.get("permalink", ""),
                    }
                )

        return results

    async def get_user_info(self, user_id: str) -> dict:
        """Get user information"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SLACK_API_BASE}/users.info",
                headers=self.headers,
                params={"user": user_id},
            )
            response.raise_for_status()
            data = response.json()

            if not data.get("ok"):
                raise Exception(f"Slack API error: {data.get('error')}")

            user = data.get("user", {})
            return {
                "name": user.get("name"),
                "real_name": user.get("real_name", ""),
                "email": user.get("profile", {}).get("email", ""),
            }

    async def get_all_messages_for_indexing(
        self, days_back: int = 30
    ) -> list[dict]:
        """Get all messages from last N days for RAG indexing"""
        all_messages = []
        oldest_time = (datetime.now() - timedelta(days=days_back)).timestamp()

        # Get all channels
        channels = await self.get_channels()

        # Fetch messages from each channel
        async with httpx.AsyncClient() as client:
            for channel in channels:
                channel_id = channel["id"]
                cursor = None

                while True:
                    params = {
                        "channel": channel_id,
                        "oldest": str(oldest_time),
                        "limit": 100,
                    }
                    if cursor:
                        params["cursor"] = cursor

                    response = await client.get(
                        f"{SLACK_API_BASE}/conversations.history",
                        headers=self.headers,
                        params=params,
                    )
                    response.raise_for_status()
                    data = response.json()

                    if not data.get("ok"):
                        continue

                    for msg in data.get("messages", []):
                        if msg.get("type") != "message" or msg.get("subtype") in [
                            "bot_message",
                            "system_message",
                        ]:
                            continue

                        text = msg.get("text", "").strip()
                        if not text or text.startswith(":"):
                            continue

                        all_messages.append(
                            {
                                "channel": channel["name"],
                                "text": text,
                                "user": msg.get("user", ""),
                                "timestamp": msg.get("ts", ""),
                            }
                        )

                    cursor = data.get("response_metadata", {}).get("next_cursor")
                    if not cursor:
                        break

                    await asyncio.sleep(RATE_LIMIT_DELAY)

        return all_messages
