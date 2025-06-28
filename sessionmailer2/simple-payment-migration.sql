-- Simple Payment System Migration
-- Run this in your Supabase SQL Editor instead of the complex PayPal migration

-- Create access requests table for manual approval
CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  payment_confirmation TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own requests" ON public.access_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests" ON public.access_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests" ON public.access_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Add payment status to profiles (if not exists)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'pending_review'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_access_requests_user_id ON public.access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON public.profiles(payment_status);

-- Function to approve access requests
CREATE OR REPLACE FUNCTION approve_access_request(request_id UUID, admin_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  request_user_id UUID;
BEGIN
  -- Get the user_id from the request
  SELECT user_id INTO request_user_id 
  FROM public.access_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF request_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update the access request
  UPDATE public.access_requests 
  SET 
    status = 'approved',
    reviewed_at = NOW(),
    reviewed_by = admin_user_id
  WHERE id = request_id;
  
  -- Update the user's profile to grant access
  UPDATE public.profiles 
  SET 
    is_premium = TRUE,
    payment_status = 'paid',
    updated_at = NOW()
  WHERE id = request_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject access requests
CREATE OR REPLACE FUNCTION reject_access_request(request_id UUID, admin_user_id UUID, notes TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.access_requests 
  SET 
    status = 'rejected',
    reviewed_at = NOW(),
    reviewed_by = admin_user_id,
    admin_notes = notes
  WHERE id = request_id AND status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.access_requests IS 'Manual access requests for payment verification';
COMMENT ON FUNCTION approve_access_request IS 'Approve access request and grant user premium access';
COMMENT ON FUNCTION reject_access_request IS 'Reject access request with optional notes';