-- Migration 004: Add Subscription and Billing Tables
-- This migration creates tables for Stripe integration and subscription management

-- Stripe customers table (1:1 with workspaces)
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage quotas table (per billing cycle)
CREATE TABLE IF NOT EXISTS usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),

  -- Query quotas
  queries_limit INTEGER NOT NULL,
  queries_used INTEGER DEFAULT 0,

  -- Document quotas
  documents_limit INTEGER NOT NULL,
  documents_used INTEGER DEFAULT 0,

  -- API call quotas (for programmatic access)
  api_calls_limit INTEGER NOT NULL,
  api_calls_used INTEGER DEFAULT 0,

  -- Billing period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table (mirror Stripe invoices locally)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  amount_due INTEGER NOT NULL, -- in cents
  amount_paid INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  invoice_pdf TEXT, -- Stripe-hosted PDF URL
  hosted_invoice_url TEXT, -- Stripe-hosted invoice page
  billing_reason TEXT, -- 'subscription_create', 'subscription_cycle', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- Payment methods table (for display purposes)
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('card', 'bank_account', 'sepa_debit')),
  card_brand TEXT, -- 'visa', 'mastercard', 'amex', etc.
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription events table (audit log for subscription changes)
CREATE TABLE IF NOT EXISTS subscription_events (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'subscription.created', 'subscription.updated', etc.
  stripe_event_id TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stripe_customers_workspace_id ON stripe_customers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_customer_id ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe_subscription_id ON stripe_customers(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_status ON stripe_customers(status);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_workspace_id ON usage_quotas(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_period_end ON usage_quotas(period_end);
CREATE INDEX IF NOT EXISTS idx_invoices_workspace_id ON invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payment_methods_workspace_id ON payment_methods(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_workspace_id ON subscription_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type ON subscription_events(event_type);

-- Enable Row Level Security
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for stripe_customers
CREATE POLICY "Workspace members can view subscription" ON stripe_customers
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid())
  );

-- RLS policies for usage_quotas
CREATE POLICY "Workspace members can view quotas" ON usage_quotas
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid())
  );

-- RLS policies for invoices
CREATE POLICY "Workspace members can view invoices" ON invoices
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid())
  );

-- RLS policies for payment_methods
CREATE POLICY "Workspace members can view payment methods" ON payment_methods
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid())
  );

-- RLS policies for subscription_events
CREATE POLICY "Workspace admins can view subscription events" ON subscription_events
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'enterprise')
    )
  );

-- Function to initialize free tier quota on workspace creation
CREATE OR REPLACE FUNCTION initialize_free_quota()
RETURNS TRIGGER AS $$
BEGIN
  -- Create initial free tier quota
  INSERT INTO usage_quotas (
    workspace_id,
    plan,
    queries_limit,
    queries_used,
    documents_limit,
    documents_used,
    api_calls_limit,
    api_calls_used,
    period_start,
    period_end
  ) VALUES (
    NEW.id,
    'free',
    10, -- 10 queries/month for free tier
    0,
    1, -- 1 document for free tier
    0,
    100, -- 100 API calls/month for free tier
    0,
    NOW(),
    NOW() + INTERVAL '1 month'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize quota on workspace creation
CREATE TRIGGER on_workspace_created_quota
  AFTER INSERT ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION initialize_free_quota();

-- Function to update stripe_customers timestamp
CREATE OR REPLACE FUNCTION update_stripe_customers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp
CREATE TRIGGER stripe_customers_updated
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_customers_timestamp();

-- Function to update usage_quotas timestamp
CREATE OR REPLACE FUNCTION update_usage_quotas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp
CREATE TRIGGER usage_quotas_updated
  BEFORE UPDATE ON usage_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_quotas_timestamp();

-- Function to check and enforce quota limits
CREATE OR REPLACE FUNCTION check_quota(
  p_workspace_id UUID,
  p_quota_type TEXT, -- 'query', 'document', 'api_call'
  p_increment INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  v_quota RECORD;
  v_limit INTEGER;
  v_used INTEGER;
BEGIN
  -- Get current quota
  SELECT * INTO v_quota FROM usage_quotas WHERE workspace_id = p_workspace_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No quota found for workspace %', p_workspace_id;
  END IF;

  -- Check specific quota type
  CASE p_quota_type
    WHEN 'query' THEN
      v_limit := v_quota.queries_limit;
      v_used := v_quota.queries_used;
    WHEN 'document' THEN
      v_limit := v_quota.documents_limit;
      v_used := v_quota.documents_used;
    WHEN 'api_call' THEN
      v_limit := v_quota.api_calls_limit;
      v_used := v_quota.api_calls_used;
    ELSE
      RAISE EXCEPTION 'Invalid quota type: %', p_quota_type;
  END CASE;

  -- Check if quota would be exceeded
  IF v_used + p_increment > v_limit THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment quota usage
CREATE OR REPLACE FUNCTION increment_quota(
  p_workspace_id UUID,
  p_quota_type TEXT,
  p_increment INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
  -- Increment specific quota
  CASE p_quota_type
    WHEN 'query' THEN
      UPDATE usage_quotas
      SET queries_used = queries_used + p_increment
      WHERE workspace_id = p_workspace_id;
    WHEN 'document' THEN
      UPDATE usage_quotas
      SET documents_used = documents_used + p_increment
      WHERE workspace_id = p_workspace_id;
    WHEN 'api_call' THEN
      UPDATE usage_quotas
      SET api_calls_used = api_calls_used + p_increment
      WHERE workspace_id = p_workspace_id;
    ELSE
      RAISE EXCEPTION 'Invalid quota type: %', p_quota_type;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset quota on new billing period
CREATE OR REPLACE FUNCTION reset_quota_if_expired()
RETURNS VOID AS $$
BEGIN
  -- Reset quotas where period has ended
  UPDATE usage_quotas
  SET
    queries_used = 0,
    documents_used = 0,
    api_calls_used = 0,
    period_start = NOW(),
    period_end = NOW() + INTERVAL '1 month'
  WHERE period_end < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON stripe_customers TO authenticated;
GRANT ALL ON usage_quotas TO authenticated;
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON payment_methods TO authenticated;
GRANT ALL ON subscription_events TO authenticated;
