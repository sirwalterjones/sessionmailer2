import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

async function ensureTableExists(supabase: any) {
  try {
    // Try to create the table if it doesn't exist
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_shared_templates_user_id ON shared_templates(user_id);
        CREATE INDEX IF NOT EXISTS idx_shared_templates_created_at ON shared_templates(created_at);
        CREATE INDEX IF NOT EXISTS idx_shared_templates_expires_at ON shared_templates(expires_at);
        
        ALTER TABLE shared_templates ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Public shared templates are viewable by everyone" ON shared_templates;
        CREATE POLICY "Public shared templates are viewable by everyone" ON shared_templates
            FOR SELECT USING (is_public = true AND (expires_at IS NULL OR expires_at > NOW()));
        
        DROP POLICY IF EXISTS "Users can create shared templates" ON shared_templates;
        CREATE POLICY "Users can create shared templates" ON shared_templates
            FOR INSERT WITH CHECK (true);
        
        DROP POLICY IF EXISTS "Users can view their own shared templates" ON shared_templates;
        CREATE POLICY "Users can view their own shared templates" ON shared_templates
            FOR SELECT USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can update their own shared templates" ON shared_templates;
        CREATE POLICY "Users can update their own shared templates" ON shared_templates
            FOR UPDATE USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Users can delete their own shared templates" ON shared_templates;
        CREATE POLICY "Users can delete their own shared templates" ON shared_templates
            FOR DELETE USING (auth.uid() = user_id);
      `
    });
    
    if (error) {
      console.log('Note: Could not create table via RPC (this is normal):', error.message);
    }
  } catch (err) {
    console.log('Note: Could not create table via RPC (this is normal):', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessions, emailHtml, metadata } = body;

    console.log('Share API called with:', { 
      sessionsCount: sessions?.length, 
      emailHtmlLength: emailHtml?.length,
      hasMetadata: !!metadata 
    });

    if (!sessions || !emailHtml) {
      return NextResponse.json(
        { error: 'Sessions and emailHtml are required' },
        { status: 400 }
      );
    }

    // Generate a unique share ID
    const shareId = nanoid(12);

    const supabase = getSupabaseClient();

    console.log('Attempting to insert shared template with ID:', shareId);

    // Store the shared content in the database
    const { data, error } = await supabase
      .from('shared_templates')
      .insert({
        id: shareId,
        sessions,
        email_html: emailHtml,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shared template:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json(
        { error: 'Failed to create shared template', details: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully created shared template:', shareId);

    return NextResponse.json({
      success: true,
      shareId,
      shareUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${shareId}`,
      data
    });
  } catch (error) {
    console.error('Error in share API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Get user's shared templates
    const { data, error } = await supabase
      .from('shared_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shared templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch shared templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, templates: data });
  } catch (error) {
    console.error('Error in share GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 