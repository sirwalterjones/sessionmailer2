-- Create shared_templates table for storing shareable email templates
CREATE TABLE IF NOT EXISTS shared_templates (
    id TEXT PRIMARY KEY,
    sessions JSONB NOT NULL,
    email_html TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    views_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shared_templates_user_id ON shared_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_templates_created_at ON shared_templates(created_at);
CREATE INDEX IF NOT EXISTS idx_shared_templates_expires_at ON shared_templates(expires_at);

-- Enable RLS (Row Level Security)
ALTER TABLE shared_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for shared_templates
CREATE POLICY "Public shared templates are viewable by everyone" ON shared_templates
    FOR SELECT USING (is_public = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Users can create shared templates" ON shared_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own shared templates" ON shared_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared templates" ON shared_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared templates" ON shared_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically delete expired templates
CREATE OR REPLACE FUNCTION delete_expired_shared_templates()
RETURNS void AS $$
BEGIN
    DELETE FROM shared_templates 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup daily (if pg_cron is available)
-- This is optional and depends on your Supabase setup
-- SELECT cron.schedule('delete-expired-templates', '0 2 * * *', 'SELECT delete_expired_shared_templates();'); 