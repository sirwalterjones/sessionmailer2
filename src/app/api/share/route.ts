import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessions, emailHtml, metadata } = body;

    if (!sessions || !emailHtml) {
      return NextResponse.json(
        { error: 'Sessions and emailHtml are required' },
        { status: 400 }
      );
    }

    // Generate a unique share ID
    const shareId = nanoid(12);

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
      return NextResponse.json(
        { error: 'Failed to create shared template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      shareId,
      shareUrl: `${process.env.NEXTAUTH_URL}/share/${shareId}`,
      data
    });
  } catch (error) {
    console.error('Error in share API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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