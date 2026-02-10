-- Migration 003: Add User Authentication Tables
-- This migration creates the core user management tables for Supabase Auth integration

-- Core users table (synced with Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'enterprise')),
  workspace_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  CONSTRAINT fk_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
);

-- Workspaces table (multi-tenant isolation)
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::JSONB,
  is_active BOOLEAN DEFAULT TRUE
);

-- User API keys table (programmatic access)
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- First 8 chars for display (e.g., "sk_1234...")
  name TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Usage logs table (for tracking API usage and costs)
CREATE TABLE IF NOT EXISTS usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL, -- 'query', 'document_upload', 'api_call'
  tokens_used INTEGER DEFAULT 0,
  cost_usd NUMERIC(10, 4) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace invitations table
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user_id and workspace_id to existing documents table
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add user_id and workspace_id to existing chunks table
ALTER TABLE chunks
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add user_id and workspace_id to existing feedback table
ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_workspace_id ON user_api_keys(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON user_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_workspace_id ON usage_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chunks_user_id ON chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_chunks_workspace_id ON chunks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_workspace_id ON feedback(workspace_id);

-- Enable Row Level Security on all new tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for workspaces table
CREATE POLICY "Workspace members can view workspace" ON workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Workspace owners can update workspace" ON workspaces
  FOR UPDATE USING (owner_id = auth.uid());

-- Create RLS policies for user_api_keys table
CREATE POLICY "Users can view their own API keys" ON user_api_keys
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own API keys" ON user_api_keys
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own API keys" ON user_api_keys
  FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for usage_logs table
CREATE POLICY "Users can view their own usage logs" ON usage_logs
  FOR SELECT USING (user_id = auth.uid());

-- Create RLS policies for workspace_invitations table
CREATE POLICY "Invited users can view their invitations" ON workspace_invitations
  FOR SELECT USING (invited_email = (SELECT email FROM users WHERE id = auth.uid()));

CREATE POLICY "Workspace admins can manage invitations" ON workspace_invitations
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'enterprise')
    )
  );

-- Function to automatically create workspace on user signup
CREATE OR REPLACE FUNCTION create_user_workspace()
RETURNS TRIGGER AS $$
DECLARE
  workspace_slug TEXT;
BEGIN
  -- Generate workspace slug from email
  workspace_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9]', '-', 'g'));

  -- Ensure unique slug
  IF EXISTS (SELECT 1 FROM workspaces WHERE slug = workspace_slug) THEN
    workspace_slug := workspace_slug || '-' || SUBSTR(gen_random_uuid()::TEXT, 1, 8);
  END IF;

  -- Create workspace
  INSERT INTO workspaces (name, slug, owner_id, plan)
  VALUES (
    COALESCE(NEW.full_name, SPLIT_PART(NEW.email, '@', 1)) || '''s Workspace',
    workspace_slug,
    NEW.id,
    'free'
  );

  -- Update user with workspace_id
  UPDATE users
  SET workspace_id = (SELECT id FROM workspaces WHERE slug = workspace_slug)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create workspace on user signup
CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_workspace();

-- Function to update workspace updated_at timestamp
CREATE OR REPLACE FUNCTION update_workspace_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update workspace timestamp
CREATE TRIGGER workspace_updated
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_timestamp();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON workspaces TO authenticated;
GRANT ALL ON user_api_keys TO authenticated;
GRANT ALL ON usage_logs TO authenticated;
GRANT ALL ON workspace_invitations TO authenticated;
