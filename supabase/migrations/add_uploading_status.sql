-- Migration: Add 'uploading' status to documents table
-- Date: 2026-01-29
-- Purpose: Support client-side upload flow where documents start in 'uploading' state

-- Drop existing constraint if it exists (likely doesn't exist based on schema.sql)
ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_status_check;

-- Add new constraint with all valid statuses including 'uploading'
ALTER TABLE documents
  ADD CONSTRAINT documents_status_check
  CHECK (status IN ('uploading', 'pending', 'processing', 'indexed', 'error'));

-- Add comment explaining the status flow
COMMENT ON COLUMN documents.status IS 'Document processing status: uploading (client uploading), pending (awaiting processing), processing (extracting text), indexed (ready for search), error (failed)';
