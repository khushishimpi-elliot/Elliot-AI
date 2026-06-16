import re

WORDS_PER_CHUNK = 500
OVERLAP_WORDS = 50
HEADING_PATTERN = re.compile(r'^(#{1,3}\s+.+)$', re.MULTILINE)
DOC_FORMATS = {"markdown", "confluence", "notion", "google_doc"}


class DocChunker:
    """Document chunker for prose content (Markdown, Confluence, Notion, Google Docs).

    Splits documents by headings first, then by word count for large sections.
    Target: 500 words per chunk, 50-word overlap.
    """

    def chunk_markdown(self, text: str, source: str) -> list[dict]:
        """Split text by H1/H2/H3 headings. Large sections are further split."""
        sections = self._split_by_headings(text)
        if not sections:
            return self.chunk_text(text, source)

        chunks = []
        for heading, content in sections:
            words = content.split()
            if len(words) <= WORDS_PER_CHUNK:
                if content.strip():
                    chunks.append(self._make_chunk(content, source, heading, "heading_section"))
            else:
                chunks.extend(self._split_words(content, source, heading, "heading_section"))

        return chunks if chunks else self.chunk_text(text, source)

    def chunk_text(self, text: str, source: str) -> list[dict]:
        """Split plain text into fixed-size word chunks with overlap."""
        words = text.split()
        if not words:
            return []
        return self._split_words(text, source, "block", "text_block")

    def chunk_document(self, text: str, source: str, format: str) -> list[dict]:
        """Route document to the appropriate chunker based on format."""
        if format in DOC_FORMATS:
            return self.chunk_markdown(text, source)
        return self.chunk_text(text, source)

    def _split_by_headings(self, text: str) -> list[tuple[str, str]]:
        """Split text into (heading_name, section_content) tuples.

        Returns an empty list if no headings are found, so callers fall back
        to plain text chunking.
        """
        parts = HEADING_PATTERN.split(text)

        # No headings found — parts has only one element (the full text)
        if len(parts) == 1:
            return []

        sections = []

        # parts[0] is content before first heading
        if parts[0].strip():
            sections.append(("introduction", parts[0].strip()))

        # Remaining parts alternate: heading_line, content
        for i in range(1, len(parts), 2):
            heading_line = parts[i]
            content_after = parts[i + 1].strip() if i + 1 < len(parts) else ""
            heading_name = heading_line.lstrip("#").strip()
            full_content = f"{heading_line}\n{content_after}".strip()
            if full_content:
                sections.append((heading_name, full_content))

        return sections

    def _split_words(
        self, text: str, source: str, base_name: str, chunk_type: str
    ) -> list[dict]:
        """Split text into WORDS_PER_CHUNK-sized chunks with OVERLAP_WORDS overlap."""
        words = text.split()
        chunks = []
        start = 0
        part_num = 1

        while start < len(words):
            end = min(start + WORDS_PER_CHUNK, len(words))
            content = " ".join(words[start:end])
            name = base_name if part_num == 1 else f"{base_name}_part_{part_num}"
            chunks.append(self._make_chunk(content, source, name, chunk_type))
            part_num += 1
            if end >= len(words):
                break
            start = end - OVERLAP_WORDS

        return chunks

    def _make_chunk(
        self, content: str, source: str, chunk_name: str, chunk_type: str
    ) -> dict:
        word_count = len(content.split())
        return {
            "content": content,
            "source": source,
            "chunk_type": chunk_type,
            "chunk_name": chunk_name,
            "word_count": word_count,
            "token_estimate": int(word_count * 1.3),
        }
