import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase';
import { getAuthenticatedUser, checkAdminPermission } from '@/lib/auth-server';

function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}

// GET - Fetch analytics data
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from cookies
    const user = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await checkAdminPermission(user.id, user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const supabase = getSupabaseServiceClient();

    // Get current date for time-based queries
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch total users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Fetch profiles for premium/admin counts
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, is_admin, created_at');

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    // Fetch all projects for analytics
    const { data: projects, error: projectError } = await supabase
      .from('saved_projects')
      .select('user_id, created_at, name, url');

    if (projectError) {
      console.error('Error fetching projects:', projectError);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Fetch shared templates data
    const { data: sharedTemplates, error: sharedError } = await supabase
      .from('shared_templates')
      .select('user_id, created_at, views_count');

    // Calculate analytics
    const totalUsers = authUsers.users.length;
    const premiumUsers = profiles?.filter(p => p.is_premium).length || 0;
    const adminUsers = profiles?.filter(p => p.is_admin).length || 0;
    const totalProjects = projects?.length || 0;
    const totalShares = sharedTemplates?.length || 0;
    
    // Users registered in last 30 days
    const newUsers30Days = authUsers.users.filter(u => 
      new Date(u.created_at) >= thirtyDaysAgo
    ).length;
    
    // Users registered in last 7 days
    const newUsers7Days = authUsers.users.filter(u => 
      new Date(u.created_at) >= sevenDaysAgo
    ).length;

    // Projects created in last 30 days
    const newProjects30Days = projects?.filter(p => 
      new Date(p.created_at) >= thirtyDaysAgo
    ).length || 0;

    // Projects created in last 7 days
    const newProjects7Days = projects?.filter(p => 
      new Date(p.created_at) >= sevenDaysAgo
    ).length || 0;

    // Active users (users with projects)
    const activeUsers = new Set(projects?.map(p => p.user_id)).size;

    // User registration trend (last 30 days, grouped by day)
    const userRegistrationTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = authUsers.users.filter(u => 
        u.created_at.startsWith(dateStr)
      ).length;
      
      userRegistrationTrend.push({
        date: dateStr,
        count
      });
    }

    // Project creation trend (last 30 days, grouped by day)
    const projectCreationTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = projects?.filter(p => 
        p.created_at.startsWith(dateStr)
      ).length || 0;
      
      projectCreationTrend.push({
        date: dateStr,
        count
      });
    }

    // Top domains used in projects
    const domainCounts: Record<string, number> = {};
    projects?.forEach(project => {
      try {
        const url = new URL(project.url);
        const domain = url.hostname;
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      } catch (e) {
        // Invalid URL, skip
      }
    });

    const topDomains = Object.entries(domainCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    // User activity distribution
    const userProjectCounts: Record<string, number> = {};
    projects?.forEach(project => {
      userProjectCounts[project.user_id] = (userProjectCounts[project.user_id] || 0) + 1;
    });

    const activityDistribution = {
      no_projects: totalUsers - Object.keys(userProjectCounts).length,
      one_project: Object.values(userProjectCounts).filter(count => count === 1).length,
      two_to_five: Object.values(userProjectCounts).filter(count => count >= 2 && count <= 5).length,
      six_to_ten: Object.values(userProjectCounts).filter(count => count >= 6 && count <= 10).length,
      more_than_ten: Object.values(userProjectCounts).filter(count => count > 10).length,
    };

    // Total views from shared templates
    const totalViews = sharedTemplates?.reduce((sum, template) => sum + (template.views_count || 0), 0) || 0;

    return NextResponse.json({
      overview: {
        totalUsers,
        premiumUsers,
        adminUsers,
        activeUsers,
        totalProjects,
        totalShares,
        totalViews,
        newUsers30Days,
        newUsers7Days,
        newProjects30Days,
        newProjects7Days,
      },
      trends: {
        userRegistrationTrend,
        projectCreationTrend,
      },
      insights: {
        topDomains,
        activityDistribution,
        premiumConversionRate: totalUsers > 0 ? (premiumUsers / totalUsers * 100).toFixed(1) : '0',
        averageProjectsPerUser: activeUsers > 0 ? (totalProjects / activeUsers).toFixed(1) : '0',
      }
    });
  } catch (error) {
    console.error('Error in GET /api/admin/analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 