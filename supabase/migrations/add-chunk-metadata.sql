-- Migration: Add Chunk Metadata for Semantic Chunking
-- Purpose: Support semantic chunking with section titles, chunk types, and code detection
-- This enables better search relevance and citation quality

-- ============================================================================
-- Step 1: Add metadata columns to chunks table
-- ============================================================================

ALTER TABLE chunks ADD COLUMN IF NOT EXISTS section_title TEXT;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS chunk_type TEXT DEFAULT 'text';
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS has_codes BOOLEAN DEFAULT false;
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS parent_section TEXT;

-- Add check constraint for chunk_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chunks_chunk_type_check'
  ) THEN
    ALTER TABLE chunks
      ADD CONSTRAINT chunks_chunk_type_check
      CHECK (chunk_type IN ('text', 'table', 'list', 'heading'));
  END IF;
END$$;

-- ============================================================================
-- Step 2: Create indexes for better query performance
-- ============================================================================

-- Index for code-heavy chunks (priority in search)
CREATE INDEX IF NOT EXISTS chunks_has_codes_idx
  ON chunks (has_codes)
  WHERE has_codes = true;

-- Index for section titles (useful for filtering)
CREATE INDEX IF NOT EXISTS chunks_section_title_idx
  ON chunks USING gin (to_tsvector('english', COALESCE(section_title, '')));

-- Index for chunk type (useful for analytics)
CREATE INDEX IF NOT EXISTS chunks_chunk_type_idx
  ON chunks (chunk_type);

-- ============================================================================
-- Step 3: Update hybrid_search_chunks to return metadata
-- ============================================================================

CREATE OR REPLACE FUNCTION hybrid_search_chunks(
  query_text text,
  query_embedding vector(1024),
  match_count int DEFAULT 10,
  bm25_weight float DEFAULT 0.3,
  vector_weight float DEFAULT 0.7
)
RETURNS TABLE (
  id bigint,
  document_id bigint,
  content text,
  page_number int,
  char_offset_start int,
  char_offset_end int,
  section_title text,
  chunk_type text,
  has_codes boolean,
  bm25_score float,
  vector_score float,
  combined_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH
  -- BM25-style full-text search using PostgreSQL's ts_rank_cd
  bm25_results AS (
    SELECT
      c.id,
      c.document_id,
      c.content,
      c.page_number,
      c.char_offset_start,
      c.char_offset_end,
      c.section_title,
      c.chunk_type,
      c.has_codes,
      ts_rank_cd(c.search_vector, plainto_tsquery('english', query_text), 32) AS score
    FROM chunks c
    WHERE c.search_vector @@ plainto_tsquery('english', query_text)
  ),
  -- Vector similarity search using cosine distance
  vector_results AS (
    SELECT
      c.id,
      c.document_id,
      c.content,
      c.page_number,
      c.char_offset_start,
      c.char_offset_end,
      c.section_title,
      c.chunk_type,
      c.has_codes,
      (1 - (c.embedding <=> query_embedding)) AS score
    FROM chunks c
    WHERE c.embedding IS NOT NULL
      AND (1 - (c.embedding <=> query_embedding)) > 0.3
  ),
  -- Combine all unique chunk IDs from both result sets
  all_chunk_ids AS (
    SELECT b.id FROM bm25_results b
    UNION
    SELECT v.id FROM vector_results v
  ),
  -- Score each chunk using weighted combination + metadata boosting
  scored_results AS (
    SELECT
      a.id,
      c.document_id,
      c.content,
      c.page_number,
      c.char_offset_start,
      c.char_offset_end,
      c.section_title,
      c.chunk_type,
      c.has_codes,
      COALESCE(b.score, 0)::float AS bm25_score,
      COALESCE(v.score, 0)::float AS vector_score,
      (
        (bm25_weight * COALESCE(b.score, 0)) +
        (vector_weight * COALESCE(v.score, 0)) +
        -- Metadata boosting:
        (CASE WHEN c.has_codes THEN 0.1 ELSE 0 END) +  -- Boost chunks with technical codes
        (CASE WHEN c.chunk_type = 'table' THEN 0.05 ELSE 0 END)  -- Boost tables (often have important data)
      )::float AS combined_score
    FROM all_chunk_ids a
    JOIN chunks c ON c.id = a.id
    LEFT JOIN bm25_results b ON b.id = a.id
    LEFT JOIN vector_results v ON v.id = a.id
  )
  SELECT
    sr.id,
    sr.document_id,
    sr.content,
    sr.page_number,
    sr.char_offset_start,
    sr.char_offset_end,
    sr.section_title,
    sr.chunk_type,
    sr.has_codes,
    sr.bm25_score,
    sr.vector_score,
    sr.combined_score
  FROM scored_results sr
  WHERE sr.combined_score > 0
  ORDER BY sr.combined_score DESC
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- Step 4: Update search_chunks (vector-only fallback) to include metadata
-- ============================================================================

CREATE OR REPLACE FUNCTION search_chunks(
  query_embedding vector(1024),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  document_id bigint,
  content text,
  page_number int,
  char_offset_start int,
  char_offset_end int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    chunks.id,
    chunks.document_id,
    chunks.content,
    chunks.page_number,
    chunks.char_offset_start,
    chunks.char_offset_end,
    1 - (chunks.embedding <=> query_embedding) AS similarity
  FROM chunks
  WHERE chunks.embedding IS NOT NULL
    AND 1 - (chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- Step 5: Comments for documentation
-- ============================================================================

COMMENT ON COLUMN chunks.section_title IS 'Section heading this chunk belongs to (e.g., "3.2 Mechanical Properties")';
COMMENT ON COLUMN chunks.chunk_type IS 'Type of content: text, table, list, or heading';
COMMENT ON COLUMN chunks.has_codes IS 'Whether this chunk contains technical codes (UNS, ASTM, API, etc.)';
COMMENT ON COLUMN chunks.parent_section IS 'Parent section for nested content hierarchy';

-- ============================================================================
-- Done! Run this migration after the hybrid search migration.
-- Existing chunks will have default values (text, no codes).
-- Re-upload documents to benefit from semantic chunking.
-- ============================================================================
