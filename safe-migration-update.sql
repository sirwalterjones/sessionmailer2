-- Safe migration - only adds missing parts
-- Run this after checking what already exists

-- Add missing RLS policy (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'access_requests' 
        AND policyname = 'Users can insert own requests'
    ) THEN
        CREATE POLICY "Users can insert own requests" ON public.access_requests
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Add payment status to profiles (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'pending_review'));
    END IF;
END $$;

-- Create indexes (IF NOT EXISTS handles duplicates)
CREATE INDEX IF NOT EXISTS idx_access_requests_user_id ON public.access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON public.profiles(payment_status);

-- Create or replace functions (these will overwrite if they exist)
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