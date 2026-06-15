import os

import tree_sitter
from tree_sitter import Language, Parser

SUPPORTED_LANGUAGES = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".go": "go",
    ".java": "java",
}

SKIP_PATHS = {
    "node_modules",
    ".git",
    "__pycache__",
    "dist",
    "build",
    ".venv",
    "venv",
    "migrations",
    ".next",
    "coverage",
}

BINARY_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".pdf",
    ".zip",
    ".exe",
    ".bin",
    ".o",
    ".a",
    ".so",
    ".dylib",
}


class CodeChunker:
    """Language-aware code chunker using tree-sitter"""

    def __init__(self):
        """Initialize tree-sitter parsers for supported languages"""
        self.parsers = {}
        self._init_parsers()

    def _init_parsers(self) -> None:
        """Initialize tree-sitter language parsers"""
        lang_map = {
            "python": "tree_sitter_python",
            "javascript": "tree_sitter_javascript",
            "typescript": "tree_sitter_typescript",
            "go": "tree_sitter_go",
            "java": "tree_sitter_java",
        }

        for lang_name, module_name in lang_map.items():
            try:
                module = __import__(module_name)
                language = Language(module.language())
                parser = Parser()
                parser.set_language(language)
                self.parsers[lang_name] = (parser, language)
            except Exception:
                pass

    def get_language(self, filepath: str) -> str | None:
        """Get language name from file extension"""
        _, ext = os.path.splitext(filepath.lower())
        return SUPPORTED_LANGUAGES.get(ext)

    def should_skip(self, filepath: str) -> bool:
        """Check if file should be skipped"""
        _, ext = os.path.splitext(filepath.lower())
        if ext in BINARY_EXTENSIONS:
            return True

        for skip_path in SKIP_PATHS:
            if skip_path in filepath:
                return True

        return False

    def chunk_with_tree_sitter(
        self, content: str, language: str, filepath: str
    ) -> list[dict]:
        """Parse code with tree-sitter and extract logical units"""
        if language not in self.parsers:
            return self.chunk_with_fallback(content, filepath)

        parser, _ = self.parsers[language]
        tree = parser.parse(content.encode("utf-8"))
        chunks = []

        def visit_node(node, chunks_list):
            """Recursively visit AST nodes"""
            if node.type in ["function_definition", "class_definition"]:
                chunk = self._extract_chunk(
                    content, node, filepath, language
                )
                if chunk:
                    chunks_list.append(chunk)

            elif language == "java" and node.type in [
                "method_declaration",
                "class_declaration",
            ]:
                chunk = self._extract_chunk(
                    content, node, filepath, language
                )
                if chunk:
                    chunks_list.append(chunk)

            elif language in ["typescript", "javascript"] and node.type in [
                "function_declaration",
                "class_declaration",
                "method_definition",
            ]:
                chunk = self._extract_chunk(
                    content, node, filepath, language
                )
                if chunk:
                    chunks_list.append(chunk)

            for child in node.children:
                visit_node(child, chunks_list)

        visit_node(tree.root_node, chunks)

        # If no functions/classes found, fall back to line-based
        if not chunks:
            return self.chunk_with_fallback(content, filepath)

        # Handle large functions with overlapping sub-chunks
        final_chunks = []
        for chunk in chunks:
            if (
                chunk["end_line"] - chunk["start_line"] > 150
            ):
                sub_chunks = self._split_large_chunk(
                    chunk, content
                )
                final_chunks.extend(sub_chunks)
            else:
                final_chunks.append(chunk)

        return final_chunks

    def _extract_chunk(
        self,
        content: str,
        node: tree_sitter.Node,
        filepath: str,
        language: str,
    ) -> dict | None:
        """Extract a single chunk from an AST node"""
        start_line = node.start_point[0]
        end_line = node.end_point[0] + 1

        lines = content.split("\n")
        chunk_content = "\n".join(
            lines[start_line:end_line]
        ).strip()

        if not chunk_content:
            return None

        chunk_name = self._get_node_name(node)
        chunk_type = self._get_node_type(node)

        return {
            "content": chunk_content,
            "filepath": filepath,
            "chunk_type": chunk_type,
            "chunk_name": chunk_name,
            "start_line": start_line + 1,
            "end_line": end_line,
            "language": language,
        }

    def _get_node_name(self, node: tree_sitter.Node) -> str:
        """Extract function/class name from AST node"""
        for child in node.children:
            if child.type == "identifier":
                return child.text.decode("utf-8")
        return "unknown"

    def _get_node_type(self, node: tree_sitter.Node) -> str:
        """Get chunk type (function, class, method)"""
        node_type = node.type
        if "class" in node_type:
            return "class"
        if "method" in node_type:
            return "method"
        return "function"

    def _split_large_chunk(
        self, chunk: dict, content: str
    ) -> list[dict]:
        """Split large functions into overlapping sub-chunks"""
        lines = content.split("\n")
        start_line = chunk["start_line"] - 1
        end_line = chunk["end_line"]

        sub_chunks = []
        chunk_size = 100
        overlap = 10

        for i in range(
            start_line, end_line, chunk_size - overlap
        ):
            sub_start = i
            sub_end = min(i + chunk_size, end_line)

            if sub_end - sub_start < 20:
                continue

            sub_content = "\n".join(lines[sub_start:sub_end])
            if not sub_content.strip():
                continue

            sub_chunks.append(
                {
                    "content": sub_content,
                    "filepath": chunk["filepath"],
                    "chunk_type": chunk["chunk_type"],
                    "chunk_name": (
                        f"{chunk['chunk_name']}_part_{len(sub_chunks) + 1}"
                    ),
                    "start_line": sub_start + 1,
                    "end_line": sub_end,
                    "language": chunk["language"],
                }
            )

        return sub_chunks if sub_chunks else [chunk]

    def chunk_with_fallback(
        self, content: str, filepath: str
    ) -> list[dict]:
        """Fallback: simple line-based chunking"""
        lines = content.split("\n")
        chunks = []

        chunk_size = 100
        overlap = 10

        for i in range(0, len(lines), chunk_size - overlap):
            chunk_start = i
            chunk_end = min(i + chunk_size, len(lines))

            chunk_content = "\n".join(
                lines[chunk_start:chunk_end]
            )
            if not chunk_content.strip():
                continue

            chunks.append(
                {
                    "content": chunk_content,
                    "filepath": filepath,
                    "chunk_type": "lines",
                    "chunk_name": f"lines_{chunk_start + 1}-{chunk_end}",
                    "start_line": chunk_start + 1,
                    "end_line": chunk_end,
                    "language": "unknown",
                }
            )

        return chunks

    def chunk_file(
        self, content: str, filepath: str
    ) -> list[dict]:
        """Main entry point: chunk a single file"""
        if self.should_skip(filepath):
            return []

        language = self.get_language(filepath)

        if language:
            chunks = self.chunk_with_tree_sitter(
                content, language, filepath
            )
        else:
            chunks = self.chunk_with_fallback(content, filepath)

        # Add metadata to each chunk
        for chunk in chunks:
            chunk["char_count"] = len(chunk["content"])
            chunk["token_estimate"] = int(
                len(chunk["content"].split()) * 1.3
            )

        return chunks

    def chunk_repository(
        self, files: list[dict]
    ) -> list[dict]:
        """Process multiple files and return all chunks"""
        all_chunks = []

        for i, file_data in enumerate(files, 1):
            filepath = file_data["filepath"]
            content = file_data["content"]

            chunks = self.chunk_file(content, filepath)
            all_chunks.extend(chunks)

            print(f"Chunked {i}/{len(files)} files...")

        return all_chunks
