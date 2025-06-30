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

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { userId, userEmail, paymentConfirmation, requestedAt } = body;

    if (!userId || !userEmail || !paymentConfirmation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a simple access request record
    const { error: insertError } = await supabase
      .from('access_requests')
      .insert({
        user_id: userId,
        user_email: userEmail,
        payment_confirmation: paymentConfirmation,
        status: 'pending',
        requested_at: requestedAt,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating access request:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit access request' },
        { status: 500 }
      );
    }

    // Send email notification to Walt (you can use a service like Resend, SendGrid, or just log it)
    console.log(`
      🔔 NEW ACCESS REQUEST
      User: ${userEmail}
      User ID: ${userId}
      Payment Info: ${paymentConfirmation}
      Time: ${new Date().toLocaleString()}
      
      To approve: Update the user's is_premium status in Supabase
    `);

    // You could also use a service to send an actual email here
    // await sendEmailNotification(userEmail, paymentConfirmation);

    return NextResponse.json({
      success: true,
      message: 'Access request submitted successfully'
    });

  } catch (error: any) {
    console.error('Error in request-access API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check pending requests (for admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const adminCheck = searchParams.get('admin');

    if (adminCheck) {
      // Return pending access requests for admin review
      const { data: requests, error } = await supabase
        .from('access_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ requests: [] });
      }

      return NextResponse.json({ requests: requests || [] });
    }

    return NextResponse.json({ message: 'Access request API' });

  } catch (error) {
    return NextResponse.json({ requests: [] });
  }
}