-- Add share_url column to saved_projects table
ALTER TABLE public.saved_projects ADD COLUMN IF NOT EXISTS share_url TEXT;
 
-- Add index for better performance when searching by share_url
CREATE INDEX IF NOT EXISTS idx_saved_projects_share_url ON public.saved_projects(share_url); 