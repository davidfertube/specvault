-- Migration: Add Document Filtering to Hybrid Search
-- Purpose: Enable filtering search to specific documents based on spec codes
--
-- This solves the A789/A790 confusion problem:
-- - A789 (tubing): S32205 yield = 70 ksi
-- - A790 (pipe): S32205 yield = 65 ksi
-- When user asks "per A790", we now filter to only A790 documents.

-- ============================================================================
-- Step 1: Drop existing functions (required to change signature)
-- ============================================================================

DROP FUNCTION IF EXISTS hybrid_search_chunks(text, vector(1024), int, float, float);
DROP FUNCTION IF EXISTS bm25_search_chunks(text, int);

-- ============================================================================
-- Step 2: Recreate hybrid_search_chunks with document filter parameter
-- ============================================================================

CREATE OR REPLACE FUNCTION hybrid_search_chunks(
  query_text text,
  query_embedding vector(1024),
  match_count int DEFAULT 10,
  bm25_weight float DEFAULT 0.3,
  vector_weight float DEFAULT 0.7,
  filter_document_ids bigint[] DEFAULT NULL  -- NEW: Optional document filter
)
RETURNS TABLE (
  id bigint,
  document_id bigint,
  content text,
  page_number int,
  char_offset_start int,
  char_offset_end int,
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
  -- ts_rank_cd uses cover density ranking which works well for technical content
  -- ADDED: filter_document_ids filter in WHERE clause
  bm25_results AS (
    SELECT
      c.id,
      c.document_id,
      c.content,
      c.page_number,
      c.char_offset_start,
      c.char_offset_end,
      ts_rank_cd(c.search_vector, plainto_tsquery('english', query_text), 32) AS score
    FROM chunks c
    WHERE c.search_vector @@ plainto_tsquery('english', query_text)
      AND (filter_document_ids IS NULL OR c.document_id = ANY(filter_document_ids))
  ),
  -- Vector similarity search using cosine distance
  -- Lower threshold (0.3) to capture more candidates for fusion
  -- ADDED: filter_document_ids filter in WHERE clause
  vector_results AS (
    SELECT
      c.id,
      c.document_id,
      c.content,
      c.page_number,
      c.char_offset_start,
      c.char_offset_end,
      (1 - (c.embedding <=> query_embedding)) AS score
    FROM chunks c
    WHERE (1 - (c.embedding <=> query_embedding)) > 0.3
      AND (filter_document_ids IS NULL OR c.document_id = ANY(filter_document_ids))
  ),
  -- Combine all unique chunk IDs from both result sets
  all_chunk_ids AS (
    SELECT b.id FROM bm25_results b
    UNION
    SELECT v.id FROM vector_results v
  ),
  -- Score each chunk using weighted combination
  scored_results AS (
    SELECT
      a.id,
      c.document_id,
      c.content,
      c.page_number,
      c.char_offset_start,
      c.char_offset_end,
      COALESCE(b.score, 0)::float AS bm25_score,
      COALESCE(v.score, 0)::float AS vector_score,
      (
        (bm25_weight * COALESCE(b.score, 0)) +
        (vector_weight * COALESCE(v.score, 0))
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
-- Step 3: Recreate bm25_search_chunks with document filter parameter
-- ============================================================================

CREATE OR REPLACE FUNCTION bm25_search_chunks(
  query_text text,
  match_count int DEFAULT 10,
  filter_document_ids bigint[] DEFAULT NULL  -- NEW: Optional document filter
)
RETURNS TABLE (
  id bigint,
  document_id bigint,
  content text,
  page_number int,
  score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    c.content,
    c.page_number,
    ts_rank_cd(c.search_vector, plainto_tsquery('english', query_text), 32)::float AS score
  FROM chunks c
  WHERE c.search_vector @@ plainto_tsquery('english', query_text)
    AND (filter_document_ids IS NULL OR c.document_id = ANY(filter_document_ids))
  ORDER BY score DESC
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- Step 4: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION hybrid_search_chunks TO anon, authenticated;
GRANT EXECUTE ON FUNCTION bm25_search_chunks TO anon, authenticated;

-- ============================================================================
-- Migration complete
-- ============================================================================
-- Usage:
--   -- No filter (search all documents):
--   SELECT * FROM hybrid_search_chunks('yield strength S32205', embedding, 10, 0.3, 0.7, NULL);
--
--   -- Filter to specific document(s):
--   SELECT * FROM hybrid_search_chunks('yield strength S32205', embedding, 10, 0.3, 0.7, ARRAY[5]);
--   SELECT * FROM hybrid_search_chunks('compare A789 vs A790', embedding, 10, 0.3, 0.7, ARRAY[4, 5]);
