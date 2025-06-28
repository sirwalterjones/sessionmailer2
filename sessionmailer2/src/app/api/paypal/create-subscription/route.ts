import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase';
import { createOrGetPlan, createSubscription, SESSIONMAILER_PLAN_CONFIG } from '@/lib/paypal';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseKey);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { userEmail, userId, returnUrl, cancelUrl } = body;

    // Validate required fields
    if (!userEmail || !userId) {
      return NextResponse.json(
        { error: 'User email and ID are required' },
        { status: 400 }
      );
    }

    // Validate URLs
    const defaultReturnUrl = `${request.headers.get('origin')}/auth/subscription-success`;
    const defaultCancelUrl = `${request.headers.get('origin')}/auth/subscription-cancelled`;
    
    const finalReturnUrl = returnUrl || defaultReturnUrl;
    const finalCancelUrl = cancelUrl || defaultCancelUrl;

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    try {
      // Ensure the plan exists or create it
      const planId = await createOrGetPlan();

      // Create the subscription
      const { subscriptionId, approvalUrl } = await createSubscription(
        planId,
        userEmail,
        finalReturnUrl,
        finalCancelUrl
      );

      // Store the pending subscription in our database
      const { error: dbError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          paypal_subscription_id: subscriptionId,
          paypal_plan_id: planId,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (dbError) {
        console.error('Error storing subscription in database:', dbError);
        return NextResponse.json(
          { error: 'Failed to store subscription data' },
          { status: 500 }
        );
      }

      // Update user profile to reflect pending subscription
      await supabase
        .from('profiles')
        .update({ 
          subscription_status: 'trial', // Temporary status until payment is confirmed
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      return NextResponse.json({
        success: true,
        subscriptionId,
        approvalUrl,
        planDetails: {
          name: SESSIONMAILER_PLAN_CONFIG.name,
          description: SESSIONMAILER_PLAN_CONFIG.description,
          amount: SESSIONMAILER_PLAN_CONFIG.amount,
          currency: SESSIONMAILER_PLAN_CONFIG.currency,
          interval: SESSIONMAILER_PLAN_CONFIG.interval,
        },
      });

    } catch (paypalError: any) {
      console.error('PayPal API error:', paypalError);
      return NextResponse.json(
        { 
          error: 'Failed to create PayPal subscription',
          details: paypalError.message 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Error in create-subscription API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check subscription status
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's current subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching subscription:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscription data' },
        { status: 500 }
      );
    }

    // Get user profile for subscription status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_expires_at')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      subscription: subscription || null,
      profile: {
        subscription_status: profile?.subscription_status || 'inactive',
        subscription_expires_at: profile?.subscription_expires_at || null,
      },
      hasActiveSubscription: subscription?.status === 'active',
      canAccessDashboard: ['active', 'trial'].includes(profile?.subscription_status || 'inactive'),
    });

  } catch (error: any) {
    console.error('Error in GET subscription status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}