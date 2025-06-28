# PayPal Subscription Setup for SessionMailer

This guide will help you configure PayPal subscription payments for SessionMailer. Users will be required to pay $10/month to access the dashboard.

## Prerequisites

1. A PayPal Business account
2. Access to PayPal Developer Dashboard
3. Your SessionMailer project deployed (for webhook URLs)

## Step 1: PayPal Developer Account Setup

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Sign in with your PayPal account
3. Navigate to **My Apps & Credentials**
4. Click **Create App**

### App Configuration:
- **App Name**: SessionMailer
- **Merchant**: Select your business account
- **Platform**: Server
- **Features**: Check "Subscriptions"

## Step 2: Get Your Credentials

After creating the app, you'll get:
- **Client ID** (public)
- **Client Secret** (private, keep secure)

## Step 3: Environment Variables

Add these variables to your `.env.local` file:

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=your_webhook_id_here

# Frontend PayPal SDK
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id_here
```

### For Production:
```env
PAYPAL_MODE=live
```

## Step 4: Create a Product and Plan

SessionMailer will automatically create these, but you can also do it manually:

### Create Product (via PayPal Dashboard):
1. Go to **Products** in PayPal Dashboard
2. Click **Create Product**
3. **Product ID**: `PROD-SESSIONMAILER`
4. **Name**: SessionMailer Monthly Subscription
5. **Type**: Service
6. **Category**: Software

### Create Plan (via PayPal Dashboard):
1. Go to **Plans** in PayPal Dashboard
2. Click **Create Plan**
3. **Plan ID**: `P-SESSION-MONTHLY-10USD`
4. **Product**: Select SessionMailer product
5. **Name**: SessionMailer Monthly Subscription
6. **Billing Cycle**: Monthly
7. **Amount**: $10.00 USD

## Step 5: Webhook Configuration

1. In PayPal Developer Dashboard, go to **Webhooks**
2. Click **Create Webhook**
3. **Webhook URL**: `https://your-domain.com/api/paypal/webhooks`
4. **Event Types** (select these):
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
   - `PAYMENT.SALE.COMPLETED`
   - `PAYMENT.SALE.DENIED`
   - `PAYMENT.SALE.REFUNDED`

5. Copy the **Webhook ID** and add it to your environment variables

## Step 6: Database Migration

Run the database migration in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of migration-add-paypal-subscriptions.sql
```

This creates:
- `subscriptions` table for PayPal subscription tracking
- `payment_transactions` table for payment history
- Analytics views for admin dashboard
- Updated `profiles` table with subscription fields

## Step 7: Test the Integration

### Sandbox Testing:
1. Use PayPal sandbox credentials
2. Create test accounts in [PayPal Sandbox](https://www.sandbox.paypal.com/)
3. Test the complete signup flow:
   - Create account
   - Subscribe via PayPal
   - Verify dashboard access
   - Check admin dashboard for analytics

### Test Scenarios:
- ✅ Successful subscription
- ✅ Cancelled subscription
- ✅ Failed payment
- ✅ Webhook processing
- ✅ Dashboard access control

## Step 8: Go Live

1. Update environment variables to production values:
   ```env
   PAYPAL_MODE=live
   PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_CLIENT_SECRET=your_live_client_secret
   ```

2. Update webhook URL to production domain
3. Test with real PayPal account (small amount first)

## Payment Flow Summary

1. **User Registration**: Creates account in Supabase
2. **Subscription**: Redirects to PayPal for $10/month subscription
3. **Payment Confirmation**: PayPal webhook updates subscription status
4. **Dashboard Access**: Middleware checks subscription status
5. **Recurring Billing**: PayPal handles automatic monthly charges

## Admin Features

The admin dashboard (accessible to `walterjonesjr@gmail.com`) shows:
- Total subscribers and revenue
- Recent transactions
- Subscription status management
- Payment analytics
- User management with subscription info

## Troubleshooting

### Common Issues:

1. **"PayPal SDK failed to load"**
   - Check `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set
   - Verify client ID is correct for sandbox/live

2. **"Subscription creation failed"**
   - Check product and plan exist in PayPal
   - Verify server-side credentials
   - Check API environment (sandbox vs live)

3. **"Webhook verification failed"**
   - Ensure webhook ID is correct
   - Check webhook URL is accessible
   - Verify event types are selected

4. **"Dashboard access denied"**
   - Check user's subscription status in database
   - Verify middleware is checking subscription_status
   - Check subscription_expires_at date

### Support Commands:

```bash
# Check PayPal connection
curl -X POST https://api.sandbox.paypal.com/v1/oauth2/token \
  -H "Authorization: Basic $(echo -n 'client_id:client_secret' | base64)" \
  -d "grant_type=client_credentials"

# Test webhook endpoint
curl -X POST https://your-domain.com/api/paypal/webhooks \
  -H "Content-Type: application/json" \
  -d '{"event_type": "BILLING.SUBSCRIPTION.ACTIVATED"}'
```

## Security Notes

- Never commit PayPal credentials to git
- Use environment variables for all sensitive data
- Webhook signature verification is implemented for security
- Database uses Row Level Security (RLS) for data protection
- All payment processing happens on PayPal's secure servers

## Revenue Information

- **Monthly Price**: $10.00 USD
- **PayPal Fees**: ~3.49% + $0.49 per transaction
- **Net Revenue**: ~$6.16 per subscriber per month
- **Your PayPal Email**: walterjonesjr@gmail.com

PayPal will send monthly revenue directly to your PayPal account automatically.