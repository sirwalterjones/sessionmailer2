-- Migration: Add customization column to saved_projects table
-- Run this in your Supabase SQL Editor if you have existing data

-- Add customization column to existing saved_projects table (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saved_projects' 
    AND column_name = 'customization'
  ) THEN
    ALTER TABLE public.saved_projects ADD COLUMN customization JSONB;
    RAISE NOTICE 'Added customization column to saved_projects table';
  ELSE
    RAISE NOTICE 'Customization column already exists in saved_projects table';
  END IF;
END $$; 