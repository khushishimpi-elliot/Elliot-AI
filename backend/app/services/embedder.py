import asyncio

from openai import AsyncOpenAI

from app.config import get_settings


class Embedder:
    """OpenAI embeddings service"""

    def __init__(self):
        """Initialize OpenAI client"""
        settings = get_settings()
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = "text-embedding-3-small"
        self.embedding_dim = 1536

    async def embed_text(self, text: str) -> list[float]:
        """Embed a single text string"""
        if len(text) > 8000:
            text = text[:8000]

        response = await self.client.embeddings.create(
            model=self.model, input=text
        )

        return response.data[0].embedding

    async def embed_chunks(
        self, chunks: list[dict]
    ) -> list[dict]:
        """Embed all chunks with batching and rate limiting"""
        batch_size = 100
        delay_between_batches = 0.5

        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]

            # Prepare texts for embedding
            texts = [chunk["content"] for chunk in batch]

            try:
                response = await self.client.embeddings.create(
                    model=self.model, input=texts
                )

                # Attach embeddings to chunks
                for j, embedding_data in enumerate(
                    response.data
                ):
                    batch[j]["embedding"] = embedding_data.embedding

            except Exception as e:
                print(f"Error embedding batch: {str(e)}")
                continue

            progress = min(i + batch_size, len(chunks))
            print(
                f"Embedded {progress}/{len(chunks)} chunks..."
            )

            if i + batch_size < len(chunks):
                await asyncio.sleep(delay_between_batches)

        return chunks
