-- Migration: Enhanced Table Boosting for Property Queries
-- Purpose: Boost table chunks aggressively when query contains property keywords
--
-- This fixes CARBON-S32750 and similar table data retrieval failures by:
-- 1. Restoring chunk_type and metadata to hybrid_search_chunks
-- 2. Implementing 1.25x multiplicative boost for table chunks on property queries
-- 3. Preserving document filtering capability

-- ============================================================================
-- Step 1: Drop existing function to change return type
-- ============================================================================

DROP FUNCTION IF EXISTS hybrid_search_chunks(text, vector(1024), int, float, float, bigint[]);

-- ============================================================================
-- Step 2: Recreate with metadata fields AND property-aware table boosting
-- ============================================================================

CREATE OR REPLACE FUNCTION hybrid_search_chunks(
  query_text text,
  query_embedding vector(1024),
  match_count int DEFAULT 10,
  bm25_weight float DEFAULT 0.3,
  vector_weight float DEFAULT 0.7,
  filter_document_ids bigint[] DEFAULT NULL
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
DECLARE
  -- Detect if query contains property keywords that benefit from table data
  has_property_keyword boolean;
BEGIN
  -- Check for chemical/mechanical property keywords in query
  has_property_keyword := (
    query_text ~* '\y(yield|tensile|hardness|carbon|chromium|molybdenum|nitrogen|nickel|composition|chemical|mechanical|elongation|charpy|pren|ferrite|heat treatment|annealing|solution)\y'
  );

  RETURN QUERY
  WITH
  -- BM25-style full-text search
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
      AND (filter_document_ids IS NULL OR c.document_id = ANY(filter_document_ids))
  ),
  -- Vector similarity search
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
      AND (filter_document_ids IS NULL OR c.document_id = ANY(filter_document_ids))
  ),
  -- Combine unique chunk IDs
  all_chunk_ids AS (
    SELECT b.id FROM bm25_results b
    UNION
    SELECT v.id FROM vector_results v
  ),
  -- Score with metadata boosting and property-aware table boost
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
        -- Base hybrid score
        ((bm25_weight * COALESCE(b.score, 0)) + (vector_weight * COALESCE(v.score, 0)))
        *
        -- Multiplicative boost for tables on property queries
        (CASE
          WHEN c.chunk_type = 'table' AND has_property_keyword THEN 1.25
          ELSE 1.0
        END)
        +
        -- Additional metadata boosts (additive)
        (CASE WHEN c.has_codes THEN 0.1 ELSE 0 END) +
        (CASE WHEN c.chunk_type = 'table' AND NOT has_property_keyword THEN 0.05 ELSE 0 END)
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
-- Step 3: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION hybrid_search_chunks TO anon, authenticated;

-- ============================================================================
-- Step 4: Comments
-- ============================================================================

COMMENT ON FUNCTION hybrid_search_chunks IS 'Hybrid search with property-aware table boosting. When query contains property keywords (carbon, yield, hardness, etc.), table chunks are boosted by 1.25x to prioritize spec table data.';

-- ============================================================================
-- Migration complete
-- ============================================================================
-- This migration fixes CARBON-S32750 by ensuring chemical composition tables
-- are prioritized when users ask about element content (carbon, chromium, etc.)
--
-- Example queries that benefit:
--   "What is the maximum carbon content for S32750 per A790?"
--   "What is the yield strength of S32205 duplex pipe?"
--   "Chromium content in grade 2205"
--
-- The 1.25x boost makes table chunks rank higher than text chunks
-- when the query is clearly asking for tabular specification data.
