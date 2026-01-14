-- Create xero_tokens table for Xero OAuth integration
CREATE TABLE IF NOT EXISTS xero_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id TEXT,
  client_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  scope TEXT,
  expires_at TIMESTAMPTZ,
  tenant_id TEXT,
  tenant_name TEXT,
  tenant_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_xero_tokens_user_id ON xero_tokens(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_xero_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER xero_tokens_updated_at
  BEFORE UPDATE ON xero_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_xero_tokens_updated_at();

-- Enable Row Level Security
ALTER TABLE xero_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tokens
CREATE POLICY "Users can view own xero tokens"
  ON xero_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xero tokens"
  ON xero_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own xero tokens"
  ON xero_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own xero tokens"
  ON xero_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can access all (for API routes)
CREATE POLICY "Service role has full access"
  ON xero_tokens FOR ALL
  USING (auth.role() = 'service_role');
