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

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { requestId, action } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Missing requestId or action' },
        { status: 400 }
      );
    }
    // Get the access request details
    const { data: accessRequest, error: fetchError } = await supabase
      .from('access_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !accessRequest) {
      return NextResponse.json(
        { error: 'Access request not found or already processed' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      // Update the access request status
      const { error: updateRequestError } = await supabase
        .from('access_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .eq('id', requestId);

      if (updateRequestError) {
        console.error('Error updating access request:', updateRequestError);
        return NextResponse.json(
          { error: 'Failed to update access request' },
          { status: 500 }
        );
      }

      // Grant the user premium access
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', accessRequest.user_id);

      if (updateProfileError) {
        console.error('Error updating user profile:', updateProfileError);
        return NextResponse.json(
          { error: 'Failed to grant user access' },
          { status: 500 }
        );
      }

      // Log the approval
      console.log(`✅ PAYMENT APPROVED
        User: ${accessRequest.user_email}
        Payment Info: ${accessRequest.payment_confirmation}
        Approved at: ${new Date().toLocaleString()}
      `);

      return NextResponse.json({
        success: true,
        message: 'Payment approved and access granted'
      });

    } else if (action === 'reject') {
      // Update the access request status to rejected
      const { error: updateError } = await supabase
        .from('access_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error rejecting access request:', updateError);
        return NextResponse.json(
          { error: 'Failed to reject access request' },
          { status: 500 }
        );
      }

      // Log the rejection
      console.log(`❌ PAYMENT REJECTED
        User: ${accessRequest.user_email}
        Payment Info: ${accessRequest.payment_confirmation}
        Rejected at: ${new Date().toLocaleString()}
      `);

      return NextResponse.json({
        success: true,
        message: 'Payment request rejected'
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Error in approve-payment API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}