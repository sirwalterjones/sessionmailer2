import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}

// GET - Fetch user's saved projects
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data: projects, error } = await supabase
      .from('saved_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save a new project
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { userId, name, url, emailHtml, customization, shareUrl } = body;

    if (!userId || !name || !url || !emailHtml) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, name, url, emailHtml' 
      }, { status: 400 });
    }

    // Store customization settings as JSON
    const projectData = {
      user_id: userId,
      name,
      url,
      email_html: emailHtml,
      customization: customization || null,
      share_url: shareUrl || null
    };

    const { data: project, error } = await supabase
      .from('saved_projects')
      .insert([projectData])
      .select()
      .single();

    if (error) {
      console.error('Error saving project:', error);
      return NextResponse.json({ error: 'Failed to save project' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      project,
      message: 'Project saved successfully!' 
    });
  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update an existing project
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { projectId, userId, name, url, emailHtml, customization, shareUrl } = body;

    if (!projectId || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields: projectId, userId' 
      }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (url) updateData.url = url;
    if (emailHtml) updateData.email_html = emailHtml;
    if (customization) updateData.customization = customization;
    if (shareUrl !== undefined) updateData.share_url = shareUrl; // Allow setting to null

    const { data: project, error } = await supabase
      .from('saved_projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('user_id', userId) // Ensure user can only update their own projects
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      project,
      message: 'Project updated successfully!' 
    });
  } catch (error) {
    console.error('Error in PUT /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a project
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');

    if (!projectId || !userId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: projectId, userId' 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('saved_projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId); // Ensure user can only delete their own projects

    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Project deleted successfully!' 
    });
  } catch (error) {
    console.error('Error in DELETE /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 