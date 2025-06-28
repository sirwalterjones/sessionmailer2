-- Migration: Add PayPal subscription and payment tracking
-- Run this in your Supabase SQL Editor

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  paypal_subscription_id TEXT UNIQUE NOT NULL,
  paypal_plan_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'suspended', 'expired', 'pending')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_transactions table
CREATE TABLE public.payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  paypal_transaction_id TEXT UNIQUE NOT NULL,
  paypal_payment_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('completed', 'pending', 'failed', 'cancelled', 'refunded')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('subscription_payment', 'one_time_payment', 'refund')),
  paypal_fee_cents INTEGER DEFAULT 0,
  net_amount_cents INTEGER,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add PayPal-specific fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS paypal_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'suspended', 'trial')),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on new tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (true);

-- Admin policies for subscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all subscriptions" ON public.subscriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS policies for payment_transactions
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON public.payment_transactions
  FOR INSERT WITH CHECK (true);

-- Admin policies for payment_transactions
CREATE POLICY "Admins can view all transactions" ON public.payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes for performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_paypal_id ON public.subscriptions(paypal_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_transactions_subscription_id ON public.payment_transactions(subscription_id);
CREATE INDEX idx_transactions_paypal_id ON public.payment_transactions(paypal_transaction_id);
CREATE INDEX idx_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_profiles_subscription_status ON public.profiles(subscription_status);

-- Function to update subscription status in profiles when subscription changes
CREATE OR REPLACE FUNCTION sync_profile_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's profile subscription status based on their active subscription
  UPDATE public.profiles 
  SET 
    subscription_status = NEW.status,
    subscription_expires_at = NEW.current_period_end,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync profile status when subscription is updated
CREATE TRIGGER sync_subscription_status
  AFTER INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_subscription_status();

-- Function to calculate net amount after PayPal fees
CREATE OR REPLACE FUNCTION calculate_net_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate net amount if not provided
  IF NEW.net_amount_cents IS NULL THEN
    NEW.net_amount_cents = NEW.amount_cents - COALESCE(NEW.paypal_fee_cents, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate net amount
CREATE TRIGGER calculate_transaction_net
  BEFORE INSERT OR UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_net_amount();

-- Create a view for subscription analytics
CREATE OR REPLACE VIEW subscription_analytics AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_subscriptions,
  COUNT(*) FILTER (WHERE status = 'suspended') as suspended_subscriptions,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_subscriptions_30d,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_subscriptions_7d,
  COUNT(*) FILTER (WHERE cancelled_at >= NOW() - INTERVAL '30 days') as cancellations_30d
FROM public.subscriptions;

-- Create a view for revenue analytics
CREATE OR REPLACE VIEW revenue_analytics AS
SELECT 
  SUM(net_amount_cents) FILTER (WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days') as revenue_30d_cents,
  SUM(net_amount_cents) FILTER (WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '7 days') as revenue_7d_cents,
  SUM(net_amount_cents) FILTER (WHERE status = 'completed' AND transaction_type = 'subscription_payment') as total_subscription_revenue_cents,
  COUNT(*) FILTER (WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days') as transactions_30d,
  AVG(amount_cents) FILTER (WHERE status = 'completed' AND transaction_type = 'subscription_payment') as avg_transaction_amount_cents
FROM public.payment_transactions;

-- Grant necessary permissions
GRANT SELECT ON subscription_analytics TO authenticated;
GRANT SELECT ON revenue_analytics TO authenticated;

-- Add RLS policies for views (admins only)
CREATE POLICY "Admins can view subscription analytics" ON subscription_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can view revenue analytics" ON revenue_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Insert initial PayPal plan configuration (you can adjust this)
INSERT INTO public.subscriptions (user_id, paypal_subscription_id, paypal_plan_id, status, current_period_start, current_period_end)
VALUES 
  -- This is a placeholder - real subscriptions will be created via API
  ('00000000-0000-0000-0000-000000000000', 'PLAN-SESSIONMAILER-MONTHLY', 'P-SESSION-MONTHLY-10USD', 'active', NOW(), NOW() + INTERVAL '1 month')
ON CONFLICT (paypal_subscription_id) DO NOTHING;

-- Remove the placeholder record
DELETE FROM public.subscriptions WHERE user_id = '00000000-0000-0000-0000-000000000000';

COMMENT ON TABLE public.subscriptions IS 'Stores PayPal subscription information for users';
COMMENT ON TABLE public.payment_transactions IS 'Stores all payment transaction history from PayPal';
COMMENT ON COLUMN public.profiles.subscription_status IS 'Current subscription status synced from subscriptions table';
COMMENT ON VIEW subscription_analytics IS 'Aggregated subscription metrics for admin dashboard';
COMMENT ON VIEW revenue_analytics IS 'Aggregated revenue metrics for admin dashboard';