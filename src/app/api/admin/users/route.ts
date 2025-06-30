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

async function checkAdminPermission(supabase: any, userId: string, userEmail?: string) {
  // Special bypass for walterjonesjr@gmail.com
  if (userEmail === 'walterjonesjr@gmail.com') {
    return true;
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
    
  if (error || !profile?.is_admin) {
    return false;
  }
  
  return true;
}

// GET - Fetch all users with their profiles and project counts
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Get the current user from cookies (middleware handles auth)
    // Since middleware already verified admin access, we can trust this request
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (double-check for security)
    const isAdmin = await checkAdminPermission(supabase, user.id, user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all users from auth.users with their profiles
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Fetch all profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*');

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    // Fetch project counts for each user
    const { data: projectCounts, error: projectError } = await supabase
      .from('saved_projects')
      .select('user_id')
      .then(({ data, error }) => {
        if (error) return { data: null, error };
        
        const counts = data?.reduce((acc: Record<string, number>, project) => {
          acc[project.user_id] = (acc[project.user_id] || 0) + 1;
          return acc;
        }, {}) || {};
        
        return { data: counts, error: null };
      });

    if (projectError) {
      console.error('Error fetching project counts:', projectError);
      return NextResponse.json({ error: 'Failed to fetch project counts' }, { status: 500 });
    }

    // Combine auth users with their profiles and project counts
    const usersWithProfiles = authUsers.users.map(authUser => {
      const profile = profiles?.find(p => p.id === authUser.id);
      const projectCount = projectCounts?.[authUser.id] || 0;
      
      return {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at,
        email_confirmed_at: authUser.email_confirmed_at,
        profile: profile || null,
        project_count: projectCount,
        is_premium: profile?.is_premium || false,
        is_admin: profile?.is_admin || false,
      };
    });

    return NextResponse.json({ 
      users: usersWithProfiles,
      total: usersWithProfiles.length
    });
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user (reset password, toggle premium, etc.)
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { userId, action, ...updateData } = body;

    if (!userId || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, action' 
      }, { status: 400 });
    }

    // Get the current user from cookies (middleware handles auth)
    // Since middleware already verified admin access, we can trust this request
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await checkAdminPermission(supabase, user.id, user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    let result;

    switch (action) {
      case 'reset_password':
        const { email } = updateData;
        if (!email) {
          return NextResponse.json({ error: 'Email required for password reset' }, { status: 400 });
        }
        
        result = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: email,
        });
        
        if (result.error) {
          return NextResponse.json({ error: 'Failed to generate reset link' }, { status: 500 });
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Password reset link generated',
          reset_link: result.data.properties?.action_link
        });

      case 'toggle_premium':
        result = await supabase
          .from('profiles')
          .update({ is_premium: updateData.is_premium })
          .eq('id', userId);
          
        if (result.error) {
          return NextResponse.json({ error: 'Failed to update premium status' }, { status: 500 });
        }
        
        return NextResponse.json({ 
          success: true, 
          message: `Premium status ${updateData.is_premium ? 'enabled' : 'disabled'}` 
        });

      case 'toggle_admin':
        // Prevent removing admin from self
        if (userId === user.id) {
          return NextResponse.json({ error: 'Cannot modify your own admin status' }, { status: 400 });
        }
        
        result = await supabase
          .from('profiles')
          .update({ is_admin: updateData.is_admin })
          .eq('id', userId);
          
        if (result.error) {
          return NextResponse.json({ error: 'Failed to update admin status' }, { status: 500 });
        }
        
        return NextResponse.json({ 
          success: true, 
          message: `Admin status ${updateData.is_admin ? 'enabled' : 'disabled'}` 
        });

      case 'delete_user':
        // Delete user's profile first (cascade will handle projects)
        await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);
          
        // Delete from auth
        result = await supabase.auth.admin.deleteUser(userId);
        
        if (result.error) {
          return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'User deleted successfully' 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in PUT /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 