import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch the shared template from the database
    const { data, error } = await supabase
      .from('shared_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching shared template:', error);
      return NextResponse.json(
        { error: 'Shared template not found' },
        { status: 404 }
      );
    }

    // Return the template data
    return NextResponse.json({
      success: true,
      id: data.id,
      sessions: data.sessions,
      emailHtml: data.email_html,
      metadata: data.metadata,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error('Error in share/[id] API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Delete the shared template
    const { error } = await supabase
      .from('shared_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting shared template:', error);
      return NextResponse.json(
        { error: 'Failed to delete shared template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in share/[id] DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 