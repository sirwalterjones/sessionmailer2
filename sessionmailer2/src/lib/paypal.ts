import {
  PayPalApi,
  Environment,
  LogLevel,
  SubscriptionsCreateRequest,
  SubscriptionsGetRequest,
  PlansCreateRequest,
  PlansGetRequest,
  WebhooksVerifySignatureRequest,
} from '@paypal/paypal-server-sdk';

// PayPal Configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID!;
const PAYPAL_MODE = (process.env.PAYPAL_MODE || 'sandbox') as 'sandbox' | 'live';

// Validate required environment variables
if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  throw new Error('PayPal environment variables are required: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET');
}

// Initialize PayPal client
const paypalEnvironment = PAYPAL_MODE === 'live' ? Environment.Live : Environment.Sandbox;

const paypalClient = new PayPalApi({
  clientCredentialsAuthCredentials: {
    oAuthClientId: PAYPAL_CLIENT_ID,
    oAuthClientSecret: PAYPAL_CLIENT_SECRET,
  },
  environment: paypalEnvironment,
  logLevel: LogLevel.Info,
});

// PayPal Plan Configuration for SessionMailer
export const SESSIONMAILER_PLAN_CONFIG = {
  productId: 'PROD-SESSIONMAILER',
  planId: 'P-SESSION-MONTHLY-10USD',
  name: 'SessionMailer Monthly Subscription',
  description: 'Monthly subscription to SessionMailer for $10/month',
  amount: '10.00',
  currency: 'USD',
  interval: 'MONTH',
  intervalCount: 1,
};

// Types
export interface PayPalSubscriptionResponse {
  id: string;
  status: string;
  status_update_time: string;
  plan_id: string;
  start_time: string;
  subscriber: {
    email_address: string;
    payer_id: string;
  };
  billing_info: {
    outstanding_balance: {
      currency_code: string;
      value: string;
    };
    cycle_executions: Array<{
      tenure_type: string;
      sequence: number;
      cycles_completed: number;
      cycles_remaining: number;
      current_pricing_scheme: {
        fixed_price: {
          currency_code: string;
          value: string;
        };
      };
    }>;
    last_payment: {
      amount: {
        currency_code: string;
        value: string;
      };
      time: string;
    };
    next_billing_time: string;
    final_payment_time: string;
    failed_payments_count: number;
  };
  create_time: string;
  update_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  create_time: string;
  resource_type: string;
  resource_version: string;
  event_version: string;
  summary: string;
  resource: any;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

// Create a subscription plan if it doesn't exist
export async function createOrGetPlan(): Promise<string> {
  try {
    // First, try to get existing plan
    const getRequest = new PlansGetRequest(SESSIONMAILER_PLAN_CONFIG.planId);
    await paypalClient.execute(getRequest);
    
    // Plan exists, return the ID
    return SESSIONMAILER_PLAN_CONFIG.planId;
  } catch (error: any) {
    if (error.statusCode === 404) {
      // Plan doesn't exist, create it
      const createRequest = new PlansCreateRequest();
      createRequest.requestBody = {
        product_id: SESSIONMAILER_PLAN_CONFIG.productId,
        name: SESSIONMAILER_PLAN_CONFIG.name,
        description: SESSIONMAILER_PLAN_CONFIG.description,
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: {
              interval_unit: SESSIONMAILER_PLAN_CONFIG.interval as any,
              interval_count: SESSIONMAILER_PLAN_CONFIG.intervalCount,
            },
            tenure_type: 'REGULAR',
            sequence: 1,
            total_cycles: 0, // Infinite cycles
            pricing_scheme: {
              fixed_price: {
                value: SESSIONMAILER_PLAN_CONFIG.amount,
                currency_code: SESSIONMAILER_PLAN_CONFIG.currency,
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: '0',
            currency_code: SESSIONMAILER_PLAN_CONFIG.currency,
          },
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
        taxes: {
          percentage: '0',
          inclusive: false,
        },
      };

      const response = await paypalClient.execute(createRequest);
      return response.result.id!;
    }
    throw error;
  }
}

// Create a subscription
export async function createSubscription(
  planId: string,
  subscriberEmail: string,
  returnUrl: string,
  cancelUrl: string
): Promise<{ subscriptionId: string; approvalUrl: string }> {
  const request = new SubscriptionsCreateRequest();
  request.requestBody = {
    plan_id: planId,
    start_time: new Date(Date.now() + 60000).toISOString(), // Start in 1 minute
    subscriber: {
      email_address: subscriberEmail,
    },
    application_context: {
      brand_name: 'SessionMailer',
      locale: 'en-US',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      payment_method: {
        payer_selected: 'PAYPAL',
        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
      },
      return_url: returnUrl,
      cancel_url: cancelUrl,
    },
  };

  const response = await paypalClient.execute(request);
  const subscription = response.result;

  // Find the approval URL
  const approvalUrl = subscription.links?.find(link => link.rel === 'approve')?.href;
  
  if (!approvalUrl) {
    throw new Error('No approval URL returned from PayPal');
  }

  return {
    subscriptionId: subscription.id!,
    approvalUrl,
  };
}

// Get subscription details
export async function getSubscription(subscriptionId: string): Promise<PayPalSubscriptionResponse> {
  const request = new SubscriptionsGetRequest(subscriptionId);
  const response = await paypalClient.execute(request);
  return response.result as PayPalSubscriptionResponse;
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string, reason: string = 'User requested cancellation') {
  try {
    const response = await fetch(`https://api.paypal.com/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getAccessToken()}`,
        'PayPal-Request-Id': `cancel-${subscriptionId}-${Date.now()}`,
      },
      body: JSON.stringify({
        reason: reason,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel subscription: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

// Verify webhook signature
export async function verifyWebhookSignature(
  webhookEvent: any,
  headers: Record<string, string>
): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) {
    console.warn('PAYPAL_WEBHOOK_ID not configured, skipping webhook verification');
    return true; // In development, you might want to skip verification
  }

  try {
    const request = new WebhooksVerifySignatureRequest();
    request.requestBody = {
      transmission_id: headers['paypal-transmission-id'],
      cert_id: headers['paypal-cert-id'],
      auth_algo: headers['paypal-auth-algo'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: webhookEvent,
    };

    const response = await paypalClient.execute(request);
    return response.result.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Helper function to get access token
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`https://api.${PAYPAL_MODE === 'live' ? 'paypal' : 'sandbox.paypal'}.com/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

// Utility function to format money for display
export function formatMoney(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(cents / 100);
}

// Utility function to parse PayPal amount to cents
export function parsePayPalAmountToCents(amount: string): number {
  return Math.round(parseFloat(amount) * 100);
}

export { paypalClient };