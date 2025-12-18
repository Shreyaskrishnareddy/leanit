"""Service for splitting transcripts into processable chunks."""

import re
import logging
from dataclasses import dataclass

import tiktoken

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class Chunk:
    """A segment of transcript text."""

    index: int
    text: str
    token_count: int
    position_label: str  # 'early', 'early-middle', 'middle', 'late-middle', 'late'
    start_char: int
    end_char: int


class ChunkingService:
    """
    Intelligent transcript chunking for LLM processing.

    Strategy:
    - Target ~2000 tokens per chunk (fits well in context with prompt overhead)
    - 200 token overlap to preserve context continuity
    - Break at sentence boundaries when possible
    """

    def __init__(self, model: str = "cl100k_base"):
        self.tokenizer = tiktoken.get_encoding(model)

    def chunk_transcript(
        self,
        text: str,
        target_tokens: int | None = None,
        overlap_tokens: int | None = None,
        min_chunk_tokens: int = 500,
    ) -> list[Chunk]:
        """
        Split transcript into overlapping chunks.

        Args:
            text: Full transcript text
            target_tokens: Target tokens per chunk (default from settings)
            overlap_tokens: Overlap between chunks (default from settings)
            min_chunk_tokens: Minimum tokens for a chunk

        Returns:
            List of Chunk objects
        """
        target_tokens = target_tokens or settings.CHUNK_TARGET_TOKENS
        overlap_tokens = overlap_tokens or settings.CHUNK_OVERLAP_TOKENS

        # Normalize whitespace
        text = re.sub(r"\s+", " ", text.strip())

        # Split into sentences
        sentences = self._split_sentences(text)

        if not sentences:
            return []

        chunks = []
        current_sentences: list[str] = []
        current_tokens = 0
        char_position = 0

        for sentence in sentences:
            sentence_tokens = len(self.tokenizer.encode(sentence))

            # If adding this sentence exceeds target, finalize chunk
            if (
                current_tokens + sentence_tokens > target_tokens
                and current_tokens >= min_chunk_tokens
            ):
                chunk_text = " ".join(current_sentences)
                chunk_start = char_position - len(chunk_text) - len(current_sentences) + 1

                chunks.append(
                    Chunk(
                        index=len(chunks),
                        text=chunk_text,
                        token_count=current_tokens,
                        position_label="",  # Set after all chunks created
                        start_char=max(0, chunk_start),
                        end_char=char_position,
                    )
                )

                # Calculate overlap: keep last N tokens worth of sentences
                overlap_buffer = self._get_overlap_sentences(current_sentences, overlap_tokens)
                current_sentences = overlap_buffer.copy()
                current_tokens = sum(
                    len(self.tokenizer.encode(s)) for s in current_sentences
                )

            current_sentences.append(sentence)
            current_tokens += sentence_tokens
            char_position += len(sentence) + 1

        # Don't forget the last chunk
        if current_sentences:
            chunk_text = " ".join(current_sentences)
            chunks.append(
                Chunk(
                    index=len(chunks),
                    text=chunk_text,
                    token_count=current_tokens,
                    position_label="",
                    start_char=max(0, char_position - len(chunk_text)),
                    end_char=char_position,
                )
            )

        # Assign position labels
        self._assign_position_labels(chunks)

        logger.info(f"Split transcript into {len(chunks)} chunks")
        return chunks

    def _split_sentences(self, text: str) -> list[str]:
        """Split text into sentences, handling various patterns."""
        # Remove timestamp markers like [00:00] or (00:00)
        text = re.sub(r"[\[\(]\d{1,2}:\d{2}(?::\d{2})?[\]\)]", "", text)

        # Split on sentence-ending punctuation followed by space or end
        # This handles: . ! ? and also handles cases like "Dr." or "U.S."
        sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z])", text)

        # Further split very long "sentences" that might not have proper punctuation
        result = []
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            # If sentence is too long (>500 chars), try to split on other boundaries
            if len(sentence) > 500:
                # Split on comma or semicolon followed by space
                sub_parts = re.split(r"(?<=[,;])\s+", sentence)
                current_part = ""
                for part in sub_parts:
                    if len(current_part) + len(part) < 400:
                        current_part = f"{current_part} {part}".strip() if current_part else part
                    else:
                        if current_part:
                            result.append(current_part)
                        current_part = part
                if current_part:
                    result.append(current_part)
            else:
                result.append(sentence)

        return result

    def _get_overlap_sentences(
        self, sentences: list[str], target_tokens: int
    ) -> list[str]:
        """Get last N sentences that fit within target tokens."""
        overlap = []
        tokens = 0

        for sentence in reversed(sentences):
            sentence_tokens = len(self.tokenizer.encode(sentence))
            if tokens + sentence_tokens > target_tokens:
                break
            overlap.insert(0, sentence)
            tokens += sentence_tokens

        return overlap

    def _assign_position_labels(self, chunks: list[Chunk]) -> None:
        """Assign human-readable position labels to chunks."""
        n = len(chunks)
        for i, chunk in enumerate(chunks):
            ratio = i / max(n - 1, 1)
            if ratio < 0.2:
                chunk.position_label = "early"
            elif ratio < 0.4:
                chunk.position_label = "early-middle"
            elif ratio < 0.6:
                chunk.position_label = "middle"
            elif ratio < 0.8:
                chunk.position_label = "late-middle"
            else:
                chunk.position_label = "late"

    def get_context_around_chunk(
        self, chunks: list[Chunk], chunk_index: int, context_chars: int = 500
    ) -> tuple[str, str]:
        """
        Get context before and after a chunk for deep dive.

        Returns:
            Tuple of (before_context, after_context)
        """
        before_context = ""
        after_context = ""

        # Get text from previous chunk
        if chunk_index > 0:
            prev_chunk = chunks[chunk_index - 1]
            before_context = prev_chunk.text[-context_chars:]

        # Get text from next chunk
        if chunk_index < len(chunks) - 1:
            next_chunk = chunks[chunk_index + 1]
            after_context = next_chunk.text[:context_chars]

        return before_context, after_context
