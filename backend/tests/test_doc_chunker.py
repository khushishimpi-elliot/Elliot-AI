from app.services.doc_chunker import DocChunker


def test_chunk_markdown_by_headings():
    text = (
        "## Section 1\nThis is section one content.\n\n"
        "## Section 2\nThis is section two content."
    )
    chunker = DocChunker()
    chunks = chunker.chunk_markdown(text, "test-doc")
    assert len(chunks) == 2
    assert chunks[0]["chunk_name"] == "Section 1"
    assert chunks[0]["chunk_type"] == "heading_section"
    assert chunks[0]["source"] == "test-doc"
    assert "section one" in chunks[0]["content"]
    assert "word_count" in chunks[0]
    assert "token_estimate" in chunks[0]


def test_chunk_markdown_large_section():
    many_words = " ".join(["word"] * 600)
    text = f"## Big Section\n{many_words}"
    chunker = DocChunker()
    chunks = chunker.chunk_markdown(text, "test-doc")
    assert len(chunks) > 1
    assert all(c["chunk_type"] == "heading_section" for c in chunks)
    assert all(c["word_count"] <= 500 for c in chunks)


def test_chunk_markdown_no_headings():
    text = ("This is plain markdown text without any headings. " * 5).strip()
    chunker = DocChunker()
    chunks = chunker.chunk_markdown(text, "test-doc")
    assert len(chunks) >= 1
    assert all(c["chunk_type"] == "text_block" for c in chunks)


def test_chunk_text_fallback():
    text = " ".join(["word"] * 1100)
    chunker = DocChunker()
    chunks = chunker.chunk_text(text, "test-doc")
    assert len(chunks) >= 2
    assert all(c["chunk_type"] == "text_block" for c in chunks)
    assert all(c["word_count"] <= 500 for c in chunks)
    # Verify overlap: last word of chunk 0 appears in chunk 1
    last_word_of_first = chunks[0]["content"].split()[-1]
    second_chunk_words = chunks[1]["content"].split()
    assert last_word_of_first in second_chunk_words


def test_chunk_document_routes_formats():
    text = "## Header\nSome content here.\n\n## Header 2\nMore content here."
    chunker = DocChunker()
    for fmt in ["confluence", "notion", "google_doc", "markdown"]:
        chunks = chunker.chunk_document(text, "test-doc", fmt)
        assert len(chunks) > 0, f"No chunks for format {fmt}"
        assert all("content" in c for c in chunks)
        assert all("source" in c for c in chunks)
