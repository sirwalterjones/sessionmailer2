-- Migration: Add admin functionality to SessionMailer
-- Run this in your Supabase SQL Editor to add admin capabilities

-- Add is_admin column to existing profiles table (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_admin column to profiles table';
  ELSE
    RAISE NOTICE 'is_admin column already exists in profiles table';
  END IF;
END $$;

-- Update existing walterjonesjr@gmail.com to be admin
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'walterjonesjr@gmail.com';

-- Create admin policies for profiles (if they don't exist)
DO $$
BEGIN
  -- Check if admin view policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles" ON public.profiles
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND is_admin = true
        )
      );
    RAISE NOTICE 'Created admin view policy for profiles';
  END IF;

  -- Check if admin update policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can update all profiles'
  ) THEN
    CREATE POLICY "Admins can update all profiles" ON public.profiles
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND is_admin = true
        )
      );
    RAISE NOTICE 'Created admin update policy for profiles';
  END IF;
END $$;

-- Create admin policies for saved_projects (if they don't exist)
DO $$
BEGIN
  -- Check if admin view policy exists for projects
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'saved_projects' 
    AND policyname = 'Admins can view all projects'
  ) THEN
    CREATE POLICY "Admins can view all projects" ON public.saved_projects
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND is_admin = true
        )
      );
    RAISE NOTICE 'Created admin view policy for saved_projects';
  END IF;

  -- Check if admin delete policy exists for projects
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'saved_projects' 
    AND policyname = 'Admins can delete any project'
  ) THEN
    CREATE POLICY "Admins can delete any project" ON public.saved_projects
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND is_admin = true
        )
      );
    RAISE NOTICE 'Created admin delete policy for saved_projects';
  END IF;
END $$;

-- Update the handle_new_user function to set admin status for walterjonesjr@gmail.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    -- Make walterjonesjr@gmail.com admin by default
    CASE WHEN NEW.email = 'walterjonesjr@gmail.com' THEN true ELSE false END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions (if needed)
-- These might already exist, but it's safe to run them again
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.saved_projects TO authenticated;

-- Final completion message
DO $$
BEGIN
  RAISE NOTICE 'Admin functionality migration completed successfully!';
  RAISE NOTICE 'walterjonesjr@gmail.com is now set as admin';
  RAISE NOTICE 'Admin dashboard available at /admin for admin users';
END $$; 