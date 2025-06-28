import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase';
import { verifyWebhookSignature, getSubscription, parsePayPalAmountToCents } from '@/lib/paypal';

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
    
    // Get the webhook event data
    const webhookEvent = await request.json();
    
    // Get headers for signature verification
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // Verify webhook signature (comment out during development if needed)
    try {
      const isValidSignature = await verifyWebhookSignature(webhookEvent, headers);
      if (!isValidSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } catch (verificationError) {
      console.error('Webhook verification error:', verificationError);
      // In development, you might want to continue without verification
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Webhook verification failed' }, { status: 401 });
      }
    }

    const eventType = webhookEvent.event_type;
    const resource = webhookEvent.resource;
    
    console.log(`Processing PayPal webhook: ${eventType}`);

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(supabase, resource);
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(supabase, resource);
        break;
        
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(supabase, resource);
        break;
        
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handlePaymentFailed(supabase, resource);
        break;
        
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(supabase, resource, webhookEvent);
        break;
        
      case 'PAYMENT.SALE.DENIED':
      case 'PAYMENT.SALE.REFUNDED':
        await handlePaymentDeniedOrRefunded(supabase, resource, eventType);
        break;
        
      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    return NextResponse.json({ success: true, eventType });

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}

async function handleSubscriptionActivated(supabase: any, resource: any) {
  const subscriptionId = resource.id;
  
  try {
    // Get full subscription details from PayPal
    const subscriptionDetails = await getSubscription(subscriptionId);
    
    // Update subscription in database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: subscriptionDetails.billing_info?.last_payment?.time || new Date().toISOString(),
        current_period_end: subscriptionDetails.billing_info?.next_billing_time,
        updated_at: new Date().toISOString(),
      })
      .eq('paypal_subscription_id', subscriptionId);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return;
    }

    // Update user profile
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('paypal_subscription_id', subscriptionId)
      .single();

    if (subscription) {
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_expires_at: subscriptionDetails.billing_info?.next_billing_time,
          is_premium: true,
          paypal_customer_id: subscriptionDetails.subscriber?.payer_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.user_id);
    }

    console.log(`Subscription activated: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling subscription activation:', error);
  }
}

async function handleSubscriptionCancelled(supabase: any, resource: any) {
  const subscriptionId = resource.id;
  
  try {
    // Update subscription status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('paypal_subscription_id', subscriptionId);

    if (updateError) {
      console.error('Error updating cancelled subscription:', updateError);
      return;
    }

    // Update user profile
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('user_id, current_period_end')
      .eq('paypal_subscription_id', subscriptionId)
      .single();

    if (subscription) {
      // Keep access until current period ends
      const currentPeriodEnd = subscription.current_period_end;
      const now = new Date();
      const periodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : now;
      
      await supabase
        .from('profiles')
        .update({
          subscription_status: periodEnd > now ? 'cancelled' : 'inactive',
          is_premium: periodEnd > now, // Keep premium until period ends
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.user_id);
    }

    console.log(`Subscription cancelled: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handleSubscriptionSuspended(supabase: any, resource: any) {
  const subscriptionId = resource.id;
  
  try {
    // Update subscription status
    await supabase
      .from('subscriptions')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString(),
      })
      .eq('paypal_subscription_id', subscriptionId);

    // Update user profile
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('paypal_subscription_id', subscriptionId)
      .single();

    if (subscription) {
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'suspended',
          is_premium: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.user_id);
    }

    console.log(`Subscription suspended: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling subscription suspension:', error);
  }
}

async function handlePaymentFailed(supabase: any, resource: any) {
  const subscriptionId = resource.billing_agreement_id || resource.id;
  
  try {
    // Log the failed payment
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('paypal_subscription_id', subscriptionId)
      .single();

    if (subscription) {
      // Create a failed payment record
      await supabase
        .from('payment_transactions')
        .insert({
          user_id: subscription.user_id,
          subscription_id: subscription.id,
          paypal_transaction_id: resource.id || `failed-${Date.now()}`,
          amount_cents: parsePayPalAmountToCents(resource.amount?.total || '10.00'),
          currency: resource.amount?.currency || 'USD',
          status: 'failed',
          transaction_type: 'subscription_payment',
          created_at: new Date().toISOString(),
        });

      // Note: Don't immediately suspend - PayPal will retry payments
      console.log(`Payment failed for subscription: ${subscriptionId}`);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCompleted(supabase: any, resource: any, webhookEvent: any) {
  const paymentId = resource.id;
  const subscriptionId = resource.billing_agreement_id;
  
  try {
    // Find the subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paypal_subscription_id', subscriptionId)
      .single();

    if (!subscription) {
      console.error(`Subscription not found for payment: ${paymentId}`);
      return;
    }

    // Record the successful payment
    const amount = resource.amount?.total || '10.00';
    const currency = resource.amount?.currency || 'USD';
    
    await supabase
      .from('payment_transactions')
      .insert({
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        paypal_transaction_id: paymentId,
        paypal_payment_id: paymentId,
        amount_cents: parsePayPalAmountToCents(amount),
        currency: currency,
        status: 'completed',
        transaction_type: 'subscription_payment',
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

    // Update subscription with new billing period
    const nextBillingTime = new Date();
    nextBillingTime.setMonth(nextBillingTime.getMonth() + 1);

    await supabase
      .from('subscriptions')
      .update({
        current_period_start: new Date().toISOString(),
        current_period_end: nextBillingTime.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    // Ensure user profile is updated
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_expires_at: nextBillingTime.toISOString(),
        is_premium: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.user_id);

    console.log(`Payment completed: ${paymentId} for subscription: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling payment completion:', error);
  }
}

async function handlePaymentDeniedOrRefunded(supabase: any, resource: any, eventType: string) {
  const paymentId = resource.id;
  const subscriptionId = resource.billing_agreement_id;
  
  try {
    // Update the payment transaction status
    await supabase
      .from('payment_transactions')
      .update({
        status: eventType.includes('DENIED') ? 'failed' : 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('paypal_payment_id', paymentId);

    // If it's a refund, you might want to handle subscription status
    if (eventType.includes('REFUNDED')) {
      // Could suspend subscription or handle refund logic here
      console.log(`Payment refunded: ${paymentId}`);
    }

    console.log(`Payment ${eventType.toLowerCase()}: ${paymentId}`);
  } catch (error) {
    console.error(`Error handling payment ${eventType.toLowerCase()}:`, error);
  }
}

// Allow webhook endpoint to accept any HTTP method PayPal might use
export const GET = POST;
export const PUT = POST;
export const PATCH = POST;